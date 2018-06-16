import { flagsToNum } from './flags-to-num'
import { IOperationMap } from './ioperation-map'
import { toHex, toSigned } from './math'
import { MemoryMap } from './memory-map'

const FLAG_ZERO = 0b10000000
const FLAG_SUBTRACT = 0b01000000
const FLAG_HALF_CARRY = 0b00100000
const FLAG_CARRY = 0b00010000

export class Cpu {
  private readonly memoryMap: MemoryMap
  private readonly byteView: Uint8Array
  private readonly wordView: Uint16Array
  private readonly operations: IOperationMap
  private totalCycles: number
  private opCycles: number

  constructor(memoryMap: MemoryMap) {
    this.memoryMap = memoryMap
    const registerBuffer = new ArrayBuffer(12)
    this.byteView = new Uint8Array(registerBuffer)
    this.wordView = new Uint16Array(registerBuffer)
    this.operations = this.getOperationMap()
    this.totalCycles = 0
    this.reset()
  }

  public reset(): void {
    this.pc = 0x100
  }

  public get a(): number { return this.byteView[1] }
  public set a(val: number) { this.byteView[1] = val }
  public get f(): number { return this.byteView[0] }
  public set f(val: number) { this.byteView[0] = val }
  public get b(): number { return this.byteView[3] }
  public set b(val: number) { this.byteView[3] = val }
  public get c(): number { return this.byteView[2] }
  public set c(val: number) { this.byteView[2] = val }
  public get d(): number { return this.byteView[5] }
  public set d(val: number) { this.byteView[5] = val }
  public get e(): number { return this.byteView[4] }
  public set e(val: number) { this.byteView[4] = val }
  public get h(): number { return this.byteView[7] }
  public set h(val: number) { this.byteView[7] = val }
  public get l(): number { return this.byteView[6] }
  public set l(val: number) { this.byteView[6] = val }

  public get af(): number { return this.wordView[0] }
  public set af(val: number) { this.wordView[0] = val }
  public get bc(): number { return this.wordView[1] }
  public set bc(val: number) { this.wordView[1] = val }
  public get de(): number { return this.wordView[2] }
  public set de(val: number) { this.wordView[2] = val }
  public get hl(): number { return this.wordView[3] }
  public set hl(val: number) { this.wordView[3] = val }

  public get sp(): number { return this.wordView[4] }
  public set sp(val: number) { this.wordView[4] = val }
  public get pc(): number { return this.wordView[5] }
  public set pc(val: number) { this.wordView[5] = val }

  public tick(): void {
    const opcode = this.memoryMap.readByte(this.pc)
    const operation = this.operations[opcode]
    if (!operation) { throw new Error('Invalid opcode: ' + toHex(opcode)) }
    this.pc += 1
    this.totalCycles += operation.cycles
    operation.action()
  }

  private dec(val: number): number {
    const newVal = val - 1
    const z = newVal === 0
    const n = 1
    const h = (((val & 0xF) + (1 & 0xF)) > 0xF)
    const c = this.f & FLAG_HALF_CARRY
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return newVal
  }

  private ld_hl_sp_n(): void {
    const offset = this.loadImmediateByte()
    this.hl = this.sp + toSigned(offset)
    const z = 0
    const n = 0
    const h = (((this.sp & 0xFFF) + (offset & 0xFFF)) > 0xFFF)
    const c = this.hl > 0xFFFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private loadImmediateByte(): number {
    return this.memoryMap.readByte(this.pc++)
  }

  private loadImmediateWord(): number {
    const immediateValue = this.memoryMap.readWord(this.pc)
    this.pc += 2
    return immediateValue
  }

  private pushWord(word: number): void {
    this.memoryMap.writeWord(this.sp - 2, word)
    this.sp -= 2
  }

  private popWord(): number {
    const word = this.memoryMap.readWord(this.sp)
    this.sp += 2
    return word
  }

  private getOperationMap(): IOperationMap {
    return {
      // tslint:disable-next-line:no-empty
      0x00: { cycles: 4, action: () => {} },
      0x01: { cycles: 12, action: () => this.bc = this.loadImmediateWord() },
      0x02: { cycles: 8, action: () => this.memoryMap.writeByte(this.bc, this.a) },
      0x03: null,
      0x04: null,
      0x05: { cycles: 4, action: () => this.b = this.dec(this.b) },
      0x06: { cycles: 4, action: () => this.b = this.loadImmediateByte() },
      0x07: null,
      0x08: { cycles: 20, action: () => this.memoryMap.writeWord(this.loadImmediateWord(), this.sp) },
      0x09: null,
      0x0A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.bc) },
      0x0B: null,
      0x0C: null,
      0x0D: null,
      0x0E: { cycles: 4, action: () => this.c = this.loadImmediateByte() },
      0x0F: null,
      0x10: null,
      0x11: { cycles: 12, action: () => this.de = this.loadImmediateWord() },
      0x12: { cycles: 8, action: () => this.memoryMap.writeByte(this.de, this.a) },
      0x13: null,
      0x14: null,
      0x15: null,
      0x16: { cycles: 4, action: () => this.d = this.loadImmediateByte() },
      0x17: null,
      0x18: null,
      0x19: null,
      0x1A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.de) },
      0x1B: null,
      0x1C: null,
      0x1D: null,
      0x1E: { cycles: 4, action: () => this.e = this.loadImmediateByte() },
      0x1F: null,
      0x20: null,
      0x21: { cycles: 12, action: () => this.hl = this.loadImmediateWord() },
      0x22: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl++, this.a) },
      0x23: null,
      0x24: null,
      0x25: null,
      0x26: { cycles: 4, action: () => this.h = this.loadImmediateByte() },
      0x27: null,
      0x28: null,
      0x29: null,
      0x2A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.hl++) },
      0x2B: null,
      0x2C: null,
      0x2D: null,
      0x2E: { cycles: 4, action: () => this.l = this.loadImmediateByte() },
      0x2F: null,
      0x30: null,
      0x31: { cycles: 12, action: () => this.sp = this.loadImmediateWord() },
      0x32: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl--, this.a) },
      0x33: null,
      0x34: null,
      0x35: null,
      0x36: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.loadImmediateByte()) },
      0x37: null,
      0x38: null,
      0x39: null,
      0x3A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.hl--) },
      0x3B: null,
      0x3C: null,
      0x3D: null,
      0x3E: { cycles: 8, action: () => this.a = this.loadImmediateByte() },
      0x3F: null,
      0x40: { cycles: 4, action: () => this.b = this.b },
      0x41: { cycles: 4, action: () => this.b = this.c },
      0x42: { cycles: 4, action: () => this.b = this.d },
      0x43: { cycles: 4, action: () => this.b = this.e },
      0x44: { cycles: 4, action: () => this.b = this.h },
      0x45: { cycles: 4, action: () => this.b = this.l },
      0x46: { cycles: 8, action: () => this.b = this.memoryMap.readByte(this.hl) },
      0x47: { cycles: 4, action: () => this.b = this.a },
      0x48: { cycles: 4, action: () => this.c = this.b },
      0x49: { cycles: 4, action: () => this.c = this.c },
      0x4A: { cycles: 4, action: () => this.c = this.d },
      0x4B: { cycles: 4, action: () => this.c = this.e },
      0x4C: { cycles: 4, action: () => this.c = this.h },
      0x4D: { cycles: 4, action: () => this.c = this.l },
      0x4E: { cycles: 8, action: () => this.c = this.memoryMap.readByte(this.hl) },
      0x4F: { cycles: 4, action: () => this.c = this.a },
      0x50: { cycles: 4, action: () => this.d = this.b },
      0x51: { cycles: 4, action: () => this.d = this.c },
      0x52: { cycles: 4, action: () => this.d = this.d },
      0x53: { cycles: 4, action: () => this.d = this.e },
      0x54: { cycles: 4, action: () => this.d = this.h },
      0x55: { cycles: 4, action: () => this.d = this.l },
      0x56: { cycles: 8, action: () => this.d = this.memoryMap.readByte(this.hl) },
      0x57: { cycles: 4, action: () => this.d = this.a },
      0x58: { cycles: 4, action: () => this.e = this.b },
      0x59: { cycles: 4, action: () => this.e = this.c },
      0x5A: { cycles: 4, action: () => this.e = this.d },
      0x5B: { cycles: 4, action: () => this.e = this.e },
      0x5C: { cycles: 4, action: () => this.e = this.h },
      0x5D: { cycles: 4, action: () => this.e = this.l },
      0x5E: { cycles: 8, action: () => this.e = this.memoryMap.readByte(this.hl) },
      0x5F: { cycles: 4, action: () => this.e = this.a },
      0x60: { cycles: 4, action: () => this.h = this.b },
      0x61: { cycles: 4, action: () => this.h = this.c },
      0x62: { cycles: 4, action: () => this.h = this.d },
      0x63: { cycles: 4, action: () => this.h = this.e },
      0x64: { cycles: 4, action: () => this.h = this.h },
      0x65: { cycles: 4, action: () => this.h = this.l },
      0x66: { cycles: 8, action: () => this.h = this.memoryMap.readByte(this.hl) },
      0x67: { cycles: 4, action: () => this.h = this.a },
      0x68: { cycles: 4, action: () => this.l = this.b },
      0x69: { cycles: 4, action: () => this.l = this.c },
      0x6A: { cycles: 4, action: () => this.l = this.d },
      0x6B: { cycles: 4, action: () => this.l = this.e },
      0x6C: { cycles: 4, action: () => this.l = this.h },
      0x6D: { cycles: 4, action: () => this.l = this.l },
      0x6E: { cycles: 8, action: () => this.l = this.memoryMap.readByte(this.hl) },
      0x6F: { cycles: 4, action: () => this.l = this.a },
      0x70: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.b) },
      0x71: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.c) },
      0x72: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.d) },
      0x73: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.e) },
      0x74: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.h) },
      0x75: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.l) },
      0x76: null,
      0x77: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.a) },
      0x78: { cycles: 4, action: () => this.a = this.b },
      0x79: { cycles: 4, action: () => this.a = this.c },
      0x7A: { cycles: 4, action: () => this.a = this.d },
      0x7B: { cycles: 4, action: () => this.a = this.e },
      0x7C: { cycles: 4, action: () => this.a = this.h },
      0x7D: { cycles: 4, action: () => this.a = this.l },
      0x7E: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.hl) },
      0x7F: { cycles: 4, action: () => this.a = this.a },
      0x80: null,
      0x81: null,
      0x82: null,
      0x83: null,
      0x84: null,
      0x85: null,
      0x86: null,
      0x87: null,
      0x88: null,
      0x89: null,
      0x8A: null,
      0x8B: null,
      0x8C: null,
      0x8D: null,
      0x8E: null,
      0x8F: null,
      0x90: null,
      0x91: null,
      0x92: null,
      0x93: null,
      0x94: null,
      0x95: null,
      0x96: null,
      0x97: null,
      0x98: null,
      0x99: null,
      0x9A: null,
      0x9B: null,
      0x9C: null,
      0x9D: null,
      0x9E: null,
      0x9F: null,
      0xA0: null,
      0xA1: null,
      0xA2: null,
      0xA3: null,
      0xA4: null,
      0xA5: null,
      0xA6: null,
      0xA7: null,
      0xA8: null,
      0xA9: null,
      0xAA: null,
      0xAB: null,
      0xAC: null,
      0xAD: null,
      0xAE: null,
      0xAF: null,
      0xB0: null,
      0xB1: null,
      0xB2: null,
      0xB3: null,
      0xB4: null,
      0xB5: null,
      0xB6: null,
      0xB7: null,
      0xB8: null,
      0xB9: null,
      0xBA: null,
      0xBB: null,
      0xBC: null,
      0xBD: null,
      0xBE: null,
      0xBF: null,
      0xC0: null,
      0xC1: { cycles: 12, action: () => this.bc = this.popWord() },
      0xC2: null,
      0xC3: null,
      0xC4: null,
      0xC5: { cycles: 16, action: () => this.pushWord(this.bc) },
      0xC6: null,
      0xC7: null,
      0xC8: null,
      0xC9: null,
      0xCA: null,
      0xCB: null,
      0xCC: null,
      0xCD: null,
      0xCE: null,
      0xCF: null,
      0xD0: null,
      0xD1: { cycles: 12, action: () => this.de = this.popWord() },
      0xD2: null,
      0xD3: null,
      0xD4: null,
      0xD5: { cycles: 16, action: () => this.pushWord(this.de) },
      0xD6: null,
      0xD7: null,
      0xD8: null,
      0xD9: null,
      0xDA: null,
      0xDB: null,
      0xDC: null,
      0xDD: null,
      0xDE: null,
      0xDF: null,
      0xE0: { cycles: 12, action: () => this.memoryMap.writeByte(0xFF00 + this.loadImmediateByte(), this.a) },
      0xE1: { cycles: 12, action: () => this.hl = this.popWord() },
      0xE2: { cycles: 8, action: () => this.memoryMap.writeByte(0xFF00 + this.c, this.a) },
      0xE3: null,
      0xE4: null,
      0xE5: { cycles: 16, action: () => this.pushWord(this.hl) },
      0xE6: null,
      0xE7: null,
      0xE8: null,
      0xE9: null,
      0xEA: { cycles: 16, action: () => this.memoryMap.writeByte(this.loadImmediateWord(), this.a) },
      0xEB: null,
      0xEC: null,
      0xED: null,
      0xEE: null,
      0xEF: null,
      0xF0: { cycles: 12, action: () => this.a = this.memoryMap.readByte(0xFF00 + this.loadImmediateByte()) },
      0xF1: { cycles: 12, action: () => this.af = this.popWord() },
      0xF2: { cycles: 8, action: () => this.a = this.memoryMap.readByte(0xFF00 + this.c) },
      0xF3: null,
      0xF4: null,
      0xF5: { cycles: 16, action: () => this.pushWord(this.af) },
      0xF6: null,
      0xF7: null,
      0xF8: { cycles: 12, action: () => this.hl = this.sp + toSigned(this.loadImmediateByte()) },
      0xF9: { cycles: 8, action: () => this.sp = this.hl },
      0xFA: { cycles: 16, action: () => this.ld_hl_sp_n() },
      0xFB: null,
      0xFC: null,
      0xFD: null,
      0xFE: null,
      0xFF: null,
    }
  }
}

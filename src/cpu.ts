import { flagsToNum } from './flags-to-num'
import { IOperationMap } from './ioperation-map'
import { toHex, toSigned } from './math'
import { MemoryMap } from './memory-map'

const FLAG_ZERO =         0b10000000
const FLAG_ZERO_N =       0b01111111
const FLAG_SUBTRACT =     0b01000000
const FLAG_SUBTRACT_N =   0b10111111
const FLAG_HALF_CARRY =   0b00100000
const FLAG_HALF_CARRY_N = 0b11011111
const FLAG_CARRY =        0b00010000
const FLAG_CARRY_N =      0b11101111

export class Cpu {
  private readonly memoryMap: MemoryMap
  private readonly byteView: Uint8Array
  private readonly wordView: Uint16Array
  private readonly operations: IOperationMap
  private isHalted: boolean
  private isStopped: boolean
  private isInterruptEnabled: boolean
  private isCbOpcode: boolean
  private totalCycles: number

  constructor(memoryMap: MemoryMap) {
    this.memoryMap = memoryMap
    const registerBuffer = new ArrayBuffer(12)
    this.byteView = new Uint8Array(registerBuffer)
    this.wordView = new Uint16Array(registerBuffer)
    this.operations = this.generateOperationMap()
    this.isHalted = false
    this.isStopped = false
    this.isInterruptEnabled = false
    this.isCbOpcode = false
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

  public get fz(): number { return +!!(this.f & FLAG_ZERO) }
  public set fz(val: number) { !!val ? this.f |= FLAG_ZERO : this.f &= FLAG_ZERO_N }
  public get fn(): number { return +!!(this.f & FLAG_SUBTRACT) }
  public set fn(val: number) { !!val ? this.f |= FLAG_SUBTRACT : this.f &= FLAG_SUBTRACT_N }
  public get fh(): number { return +!!(this.f & FLAG_HALF_CARRY) }
  public set fh(val: number) { !!val ? this.f |= FLAG_HALF_CARRY : this.f &= FLAG_HALF_CARRY_N }
  public get fc(): number { return +!!(this.f & FLAG_CARRY) }
  public set fc(val: number) { !!val ? this.f |= FLAG_CARRY : this.f &= FLAG_CARRY_N }

  public tick(): void {
    const cbOffset = this.isCbOpcode ? 0x100 : 0
    const opcode = this.memoryMap.readByte(this.pc + cbOffset)
    const operation = this.operations[opcode]
    if (!operation) { throw new Error('Invalid opcode: ' + toHex(opcode, 2)) }
    this.pc += 1
    this.totalCycles += operation.cycles
    operation.action()
  }

  private add_a(val: number): number {
    const result = this.a + val
    const z = result === 0
    const n = 0
    const h = (((this.a & 0xF) + (val & 0xF)) > 0xF)
    const c = result > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private add_hl(val: number): number {
    const result = this.hl + val
    const z = result === 0
    const n = 0
    const h = (((this.a & 0xFFF) + (val & 0xFFF)) > 0xFFF)
    const c = result > 0xFFFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private add_sp(): void {
    const offset = this.loadImmediateByte()
    this.hl = this.sp + toSigned(offset)
    const z = 0
    const n = 0
    const h = this.hl > 0xFFF
    const c = this.hl > 0xFFFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private adc_a(val: number): number {
    const flagC = +!!(this.f & FLAG_CARRY)
    const result = this.a + val + flagC
    const z = result === 0
    const n = 0
    const h = (((this.a & 0xF) + (val & 0xF) + flagC) > 0xF)
    const c = result > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private sub_a(val: number): number {
    const result = this.a - val
    const z = result === 0
    const n = 1
    const h = (((this.a & 0xF) - (val & 0xF)) < 0)
    const c = result < 0
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private sbc_a(val: number): number {
    const flagC = +!!(this.f & FLAG_CARRY)
    const result = this.a - val - flagC
    const z = result === 0
    const n = 0
    const h = (((this.a & 0xF) - (val & 0xF) - flagC) < 0)
    const c = result < 0
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private and_a(val: number): number {
    const result = this.a & val
    const z = result === 0
    const n = 0
    const h = 1
    const c = 0
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private or_a(val: number): number {
    const result = this.a | val
    const z = result === 0
    const n = 0
    const h = 0
    const c = 0
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private xor_a(val: number): number {
    const result = this.a ^ val
    const z = result === 0
    const n = 0
    const h = 0
    const c = 0
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private cp_a(val: number): number {
    const result = this.a - val
    const z = result === 0
    const n = 1
    const h = (((this.a & 0xF) - (val & 0xF)) < 0)
    const c = result < 0
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private inc(val: number): number {
    const result = val + 1
    const z = result === 0
    const n = 0
    const h = val + 1 > 0xF
    const c = this.f & FLAG_CARRY
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
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

  private swap(val: number): number {
    const BYTE_HIGH = 0xF0
    const BYTE_LOW = 0x0F
    const result = ((val & BYTE_HIGH) >> 4) | ((val & BYTE_LOW) << 4)
    const z = result === 0
    const n = 0
    const h = 0
    const c = 0
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private daa(): void {
    let corr = 0
    corr |= this.f & FLAG_HALF_CARRY ? 0x06 : 0x00
    corr |= this.f & FLAG_CARRY ? 0x60 : 0x00
    if (this.f & FLAG_SUBTRACT) {
      this.a -= corr
    } else {
      corr |= (this.a & 0x0F) > 0x09 ? 0x06 : 0x00
      corr |= this.a > 0x99 ? 0x60 : 0x00
      this.a += corr
    }
    const z = this.a === 0
    const n = this.f & FLAG_SUBTRACT
    const h = 0
    const c = (corr & 0x60) !== 0
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private cpl(): void {
    this.a = ~this.a
    this.f |= FLAG_SUBTRACT & FLAG_HALF_CARRY
  }

  private ccf(): void {
    const z = this.f & FLAG_ZERO
    const n = 0
    const h = 0
    const c = !(this.f & FLAG_CARRY)
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private scf(): void {
    const z = this.f & FLAG_ZERO
    const n = 0
    const h = 0
    const c = 1
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private rlca(): void {
    this.a = (this.a << 1) + (this.a >> 7)
    const z = this.a === 0
    const n = 0
    const h = 0
    const c = this.a > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private rla(): void {
    const flagC = this.f & FLAG_CARRY
    this.a = (this.a << 1) + flagC
    const z = this.a === 0
    const n = 0
    const h = 0
    const c = this.a > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private rrca(): void {
    this.a = (this.a << 1) + ((this.a & 1) << 7) + ((this.a & 1) << 8)
    const z = this.a === 0
    const n = 0
    const h = 0
    const c = this.a > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private rra(): void {
    const flagC = this.f & FLAG_CARRY
    this.a = (this.a << 1) + (flagC << 7) + ((this.a & 1) << 8)
    const z = this.a === 0
    const n = 0
    const h = 0
    const c = this.a > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private rlc_n(val: number): number {
    const result = (val << 1) + (val >> 7)
    const z = result === 0
    const n = 0
    const h = 0
    const c = result > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private rl_n(val: number): number {
    const flagC = this.f & FLAG_CARRY
    const result = (val << 1) + flagC
    const z = result === 0
    const n = 0
    const h = 0
    const c = result > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private rrc_n(val: number): number {
    const result = (val >> 1) + ((val & 1) << 7) + ((val & 1) << 8)
    const z = result === 0
    const n = 0
    const h = 0
    const c = result > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private rr_n(val: number): number {
    const flagC = this.f & FLAG_CARRY
    const result = (val >> 1) + (flagC << 7) + ((val & 1) << 8)
    const z = result === 0
    const n = 0
    const h = 0
    const c = result > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private sla_n(val: number): number {
    const result = val << 1
    const z = result === 0
    const n = 0
    const h = 0
    const c = result > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private sra_n(val: number): number {
    const result = ((val >> 1) | (val & 0x80)) + ((val & 1) << 8)
    const z = result === 0
    const n = 0
    const h = 0
    const c = result > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private srl_n(val: number): number {
    const result = (val >> 1) + ((val & 1) << 8)
    const z = result === 0
    const n = 0
    const h = 0
    const c = result > 0xFF
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private generateOperationMap(): IOperationMap {
    return {
      // tslint:disable-next-line:no-empty
      0x00: { cycles: 4, action: () => {} },
      0x01: { cycles: 12, action: () => this.bc = this.loadImmediateWord() },
      0x02: { cycles: 8, action: () => this.memoryMap.writeByte(this.bc, this.a) },
      0x03: { cycles: 8, action: () => this.bc += 1 },
      0x04: { cycles: 4, action: () => this.b = this.inc(this.b) },
      0x05: { cycles: 4, action: () => this.b = this.dec(this.b) },
      0x06: { cycles: 4, action: () => this.b = this.loadImmediateByte() },
      0x07: { cycles: 4, action: () => this.rlca() },
      0x08: { cycles: 20, action: () => this.memoryMap.writeWord(this.loadImmediateWord(), this.sp) },
      0x09: { cycles: 8, action: () => this.hl = this.add_hl(this.bc) },
      0x0A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.bc) },
      0x0B: { cycles: 8, action: () => this.bc -= 1 },
      0x0C: { cycles: 4, action: () => this.c = this.inc(this.c) },
      0x0D: { cycles: 4, action: () => this.c = this.dec(this.c) },
      0x0E: { cycles: 4, action: () => this.c = this.loadImmediateByte() },
      0x0F: { cycles: 4, action: () => this.rrca() },
      0x10: { cycles: 4, action: () => this.isStopped = true },
      0x11: { cycles: 12, action: () => this.de = this.loadImmediateWord() },
      0x12: { cycles: 8, action: () => this.memoryMap.writeByte(this.de, this.a) },
      0x13: { cycles: 8, action: () => this.de += 1 },
      0x14: { cycles: 4, action: () => this.d = this.inc(this.d) },
      0x15: { cycles: 4, action: () => this.d = this.dec(this.d) },
      0x16: { cycles: 4, action: () => this.d = this.loadImmediateByte() },
      0x17: { cycles: 4, action: () => this.rla() },
      0x18: null,
      0x19: { cycles: 8, action: () => this.hl = this.add_hl(this.de) },
      0x1A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.de) },
      0x1B: { cycles: 8, action: () => this.de -= 1 },
      0x1C: { cycles: 4, action: () => this.e = this.inc(this.e) },
      0x1D: { cycles: 4, action: () => this.e = this.dec(this.e) },
      0x1E: { cycles: 4, action: () => this.e = this.loadImmediateByte() },
      0x1F: { cycles: 4, action: () => this.rra() },
      0x20: null,
      0x21: { cycles: 12, action: () => this.hl = this.loadImmediateWord() },
      0x22: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl++, this.a) },
      0x23: { cycles: 8, action: () => this.hl += 1 },
      0x24: { cycles: 4, action: () => this.h = this.inc(this.h) },
      0x25: { cycles: 4, action: () => this.h = this.dec(this.h) },
      0x26: { cycles: 4, action: () => this.h = this.loadImmediateByte() },
      0x27: { cycles: 4, action: () => this.daa() },
      0x28: null,
      0x29: { cycles: 8, action: () => this.hl = this.add_hl(this.hl) },
      0x2A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.hl++) },
      0x2B: { cycles: 8, action: () => this.hl -= 1 },
      0x2C: { cycles: 4, action: () => this.l = this.inc(this.l) },
      0x2D: { cycles: 4, action: () => this.l = this.dec(this.l) },
      0x2E: { cycles: 4, action: () => this.l = this.loadImmediateByte() },
      0x2F: { cycles: 4, action: () => this.cpl() },
      0x30: null,
      0x31: { cycles: 12, action: () => this.sp = this.loadImmediateWord() },
      0x32: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl--, this.a) },
      0x33: { cycles: 8, action: () => this.sp += 1 },
      0x34: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.inc(this.memoryMap.readByte(this.hl))) },
      0x35: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.dec(this.memoryMap.readByte(this.hl))) },
      0x36: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.loadImmediateByte()) },
      0x37: { cycles: 4, action: () => this.scf() },
      0x38: null,
      0x39: { cycles: 8, action: () => this.hl = this.add_hl(this.sp) },
      0x3A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.hl--) },
      0x3B: { cycles: 8, action: () => this.sp -= 1 },
      0x3C: { cycles: 4, action: () => this.a = this.inc(this.a) },
      0x3D: { cycles: 4, action: () => this.a = this.dec(this.a) },
      0x3E: { cycles: 8, action: () => this.a = this.loadImmediateByte() },
      0x3F: { cycles: 4, action: () => this.ccf() },
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
      0x76: { cycles: 4, action: () => this.isHalted = true },
      0x77: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.a) },
      0x78: { cycles: 4, action: () => this.a = this.b },
      0x79: { cycles: 4, action: () => this.a = this.c },
      0x7A: { cycles: 4, action: () => this.a = this.d },
      0x7B: { cycles: 4, action: () => this.a = this.e },
      0x7C: { cycles: 4, action: () => this.a = this.h },
      0x7D: { cycles: 4, action: () => this.a = this.l },
      0x7E: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.hl) },
      0x7F: { cycles: 4, action: () => this.a = this.a },
      0x80: { cycles: 4, action: () => this.a = this.add_a(this.b) },
      0x81: { cycles: 4, action: () => this.a = this.add_a(this.c) },
      0x82: { cycles: 4, action: () => this.a = this.add_a(this.d) },
      0x83: { cycles: 4, action: () => this.a = this.add_a(this.e) },
      0x84: { cycles: 4, action: () => this.a = this.add_a(this.h) },
      0x85: { cycles: 4, action: () => this.a = this.add_a(this.l) },
      0x86: { cycles: 8, action: () => this.a = this.add_a(this.memoryMap.readByte(this.hl)) },
      0x87: { cycles: 4, action: () => this.a = this.add_a(this.a) },
      0x88: { cycles: 4, action: () => this.a = this.adc_a(this.b) },
      0x89: { cycles: 4, action: () => this.a = this.adc_a(this.c) },
      0x8A: { cycles: 4, action: () => this.a = this.adc_a(this.d) },
      0x8B: { cycles: 4, action: () => this.a = this.adc_a(this.e) },
      0x8C: { cycles: 4, action: () => this.a = this.adc_a(this.h) },
      0x8D: { cycles: 4, action: () => this.a = this.adc_a(this.l) },
      0x8E: { cycles: 8, action: () => this.a = this.adc_a(this.memoryMap.readByte(this.hl)) },
      0x8F: { cycles: 4, action: () => this.a = this.adc_a(this.a) },
      0x90: { cycles: 4, action: () => this.a = this.sub_a(this.b) },
      0x91: { cycles: 4, action: () => this.a = this.sub_a(this.c) },
      0x92: { cycles: 4, action: () => this.a = this.sub_a(this.d) },
      0x93: { cycles: 4, action: () => this.a = this.sub_a(this.e) },
      0x94: { cycles: 4, action: () => this.a = this.sub_a(this.h) },
      0x95: { cycles: 4, action: () => this.a = this.sub_a(this.l) },
      0x96: { cycles: 8, action: () => this.a = this.sub_a(this.memoryMap.readByte(this.hl)) },
      0x97: { cycles: 4, action: () => this.a = this.sub_a(this.a) },
      0x98: { cycles: 4, action: () => this.a = this.sbc_a(this.b) },
      0x99: { cycles: 4, action: () => this.a = this.sbc_a(this.c) },
      0x9A: { cycles: 4, action: () => this.a = this.sbc_a(this.d) },
      0x9B: { cycles: 4, action: () => this.a = this.sbc_a(this.e) },
      0x9C: { cycles: 4, action: () => this.a = this.sbc_a(this.h) },
      0x9D: { cycles: 4, action: () => this.a = this.sbc_a(this.l) },
      0x9E: { cycles: 8, action: () => this.a = this.sbc_a(this.memoryMap.readByte(this.hl)) },
      0x9F: { cycles: 4, action: () => this.a = this.sbc_a(this.a) },
      0xA0: { cycles: 4, action: () => this.a = this.and_a(this.b) },
      0xA1: { cycles: 4, action: () => this.a = this.and_a(this.c) },
      0xA2: { cycles: 4, action: () => this.a = this.and_a(this.d) },
      0xA3: { cycles: 4, action: () => this.a = this.and_a(this.e) },
      0xA4: { cycles: 4, action: () => this.a = this.and_a(this.h) },
      0xA5: { cycles: 4, action: () => this.a = this.and_a(this.l) },
      0xA6: { cycles: 8, action: () => this.a = this.and_a(this.memoryMap.readByte(this.hl)) },
      0xA7: { cycles: 4, action: () => this.a = this.and_a(this.a) },
      0xA8: { cycles: 4, action: () => this.a = this.xor_a(this.b) },
      0xA9: { cycles: 4, action: () => this.a = this.xor_a(this.c) },
      0xAA: { cycles: 4, action: () => this.a = this.xor_a(this.d) },
      0xAB: { cycles: 4, action: () => this.a = this.xor_a(this.e) },
      0xAC: { cycles: 4, action: () => this.a = this.xor_a(this.h) },
      0xAD: { cycles: 4, action: () => this.a = this.xor_a(this.l) },
      0xAE: { cycles: 8, action: () => this.a = this.xor_a(this.memoryMap.readByte(this.hl)) },
      0xAF: { cycles: 4, action: () => this.a = this.xor_a(this.a) },
      0xB0: { cycles: 4, action: () => this.a = this.or_a(this.b) },
      0xB1: { cycles: 4, action: () => this.a = this.or_a(this.c) },
      0xB2: { cycles: 4, action: () => this.a = this.or_a(this.d) },
      0xB3: { cycles: 4, action: () => this.a = this.or_a(this.e) },
      0xB4: { cycles: 4, action: () => this.a = this.or_a(this.h) },
      0xB5: { cycles: 4, action: () => this.a = this.or_a(this.l) },
      0xB6: { cycles: 8, action: () => this.a = this.or_a(this.memoryMap.readByte(this.hl)) },
      0xB7: { cycles: 4, action: () => this.a = this.or_a(this.a) },
      0xB8: { cycles: 4, action: () => this.a = this.cp_a(this.b) },
      0xB9: { cycles: 4, action: () => this.a = this.cp_a(this.c) },
      0xBA: { cycles: 4, action: () => this.a = this.cp_a(this.d) },
      0xBB: { cycles: 4, action: () => this.a = this.cp_a(this.e) },
      0xBC: { cycles: 4, action: () => this.a = this.cp_a(this.h) },
      0xBD: { cycles: 4, action: () => this.a = this.cp_a(this.l) },
      0xBE: { cycles: 8, action: () => this.a = this.cp_a(this.memoryMap.readByte(this.hl)) },
      0xBF: { cycles: 4, action: () => this.a = this.cp_a(this.a) },
      0xC0: null,
      0xC1: { cycles: 12, action: () => this.bc = this.popWord() },
      0xC2: null,
      0xC3: null,
      0xC4: null,
      0xC5: { cycles: 16, action: () => this.pushWord(this.bc) },
      0xC6: { cycles: 8, action: () => this.a = this.add_a(this.loadImmediateByte()) },
      0xC7: null,
      0xC8: null,
      0xC9: null,
      0xCA: null,
      0xCB: null,
      0xCC: null,
      0xCD: null,
      0xCE: { cycles: 8, action: () => this.a = this.adc_a(this.loadImmediateByte()) },
      0xCF: null,
      0xD0: null,
      0xD1: { cycles: 12, action: () => this.de = this.popWord() },
      0xD2: null,
      0xD3: null,
      0xD4: null,
      0xD5: { cycles: 16, action: () => this.pushWord(this.de) },
      0xD6: { cycles: 8, action: () => this.a = this.sub_a(this.loadImmediateByte()) },
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
      0xE6: { cycles: 8, action: () => this.a = this.and_a(this.loadImmediateByte()) },
      0xE7: null,
      0xE8: { cycles: 16, action: () => this.add_sp() },
      0xE9: null,
      0xEA: { cycles: 16, action: () => this.memoryMap.writeByte(this.loadImmediateWord(), this.a) },
      0xEB: null,
      0xEC: null,
      0xED: null,
      0xEE: { cycles: 8, action: () => this.a = this.xor_a(this.loadImmediateByte()) },
      0xEF: null,
      0xF0: { cycles: 12, action: () => this.a = this.memoryMap.readByte(0xFF00 + this.loadImmediateByte()) },
      0xF1: { cycles: 12, action: () => this.af = this.popWord() },
      0xF2: { cycles: 8, action: () => this.a = this.memoryMap.readByte(0xFF00 + this.c) },
      0xF3: { cycles: 4, action: () => this.isInterruptEnabled = false },
      0xF4: null,
      0xF5: { cycles: 16, action: () => this.pushWord(this.af) },
      0xF6: { cycles: 8, action: () => this.a = this.or_a(this.loadImmediateByte()) },
      0xF7: null,
      0xF8: { cycles: 12, action: () => this.hl = this.sp + toSigned(this.loadImmediateByte()) },
      0xF9: { cycles: 8, action: () => this.sp = this.hl },
      0xFA: { cycles: 16, action: () => this.ld_hl_sp_n() },
      0xFB: { cycles: 4, action: () => this.isInterruptEnabled = true },
      0xFC: null,
      0xFD: null,
      0xFE: { cycles: 8, action: () => this.a = this.cp_a(this.loadImmediateByte()) },
      0xFF: null,

      // CB Ops
      0x100: { cycles: 8, action: () => this.b = this.rlc_n(this.b) },
      0x101: { cycles: 8, action: () => this.c = this.rlc_n(this.c) },
      0x102: { cycles: 8, action: () => this.d = this.rlc_n(this.d) },
      0x103: { cycles: 8, action: () => this.e = this.rlc_n(this.e) },
      0x104: { cycles: 8, action: () => this.h = this.rlc_n(this.h) },
      0x105: { cycles: 8, action: () => this.l = this.rlc_n(this.l) },
      0x106: { cycles: 16, action: () => this.memoryMap.writeByte(this.hl, this.rlc_n(this.memoryMap.readByte(this.hl))) },
      0x107: { cycles: 8, action: () => this.a = this.rlc_n(this.a) },
      0x108: { cycles: 8, action: () => this.b = this.rrc_n(this.b) },
      0x109: { cycles: 8, action: () => this.c = this.rrc_n(this.c) },
      0x10A: { cycles: 8, action: () => this.d = this.rrc_n(this.d) },
      0x10B: { cycles: 8, action: () => this.e = this.rrc_n(this.e) },
      0x10C: { cycles: 8, action: () => this.h = this.rrc_n(this.h) },
      0x10D: { cycles: 8, action: () => this.l = this.rrc_n(this.l) },
      0x10E: { cycles: 16, action: () => this.memoryMap.writeByte(this.hl, this.rrc_n(this.memoryMap.readByte(this.hl))) },
      0x10F: { cycles: 8, action: () => this.a = this.rrc_n(this.a) },
      0x110: { cycles: 8, action: () => this.b = this.rl_n(this.b) },
      0x111: { cycles: 8, action: () => this.c = this.rl_n(this.c) },
      0x112: { cycles: 8, action: () => this.d = this.rl_n(this.d) },
      0x113: { cycles: 8, action: () => this.e = this.rl_n(this.e) },
      0x114: { cycles: 8, action: () => this.h = this.rl_n(this.h) },
      0x115: { cycles: 8, action: () => this.l = this.rl_n(this.l) },
      0x116: { cycles: 16, action: () => this.memoryMap.writeByte(this.hl, this.rl_n(this.memoryMap.readByte(this.hl))) },
      0x117: { cycles: 8, action: () => this.a = this.rl_n(this.a) },
      0x118: { cycles: 8, action: () => this.b = this.rr_n(this.b) },
      0x119: { cycles: 8, action: () => this.c = this.rr_n(this.c) },
      0x11A: { cycles: 8, action: () => this.d = this.rr_n(this.d) },
      0x11B: { cycles: 8, action: () => this.e = this.rr_n(this.e) },
      0x11C: { cycles: 8, action: () => this.h = this.rr_n(this.h) },
      0x11D: { cycles: 8, action: () => this.l = this.rr_n(this.l) },
      0x11E: { cycles: 16, action: () => this.memoryMap.writeByte(this.hl, this.rr_n(this.memoryMap.readByte(this.h))) },
      0x11F: { cycles: 8, action: () => this.a = this.rr_n(this.a) },
      0x120: { cycles: 8, action: () => this.b = this.sla_n(this.b) },
      0x121: { cycles: 8, action: () => this.c = this.sla_n(this.c) },
      0x122: { cycles: 8, action: () => this.d = this.sla_n(this.d) },
      0x123: { cycles: 8, action: () => this.e = this.sla_n(this.e) },
      0x124: { cycles: 8, action: () => this.h = this.sla_n(this.h) },
      0x125: { cycles: 8, action: () => this.l = this.sla_n(this.l) },
      0x126: { cycles: 16, action: () => this.memoryMap.writeByte(this.hl, this.sla_n(this.memoryMap.readByte(this.hl))) },
      0x127: { cycles: 8, action: () => this.a = this.sla_n(this.a) },
      0x128: { cycles: 8, action: () => this.b = this.sra_n(this.b) },
      0x129: { cycles: 8, action: () => this.c = this.sra_n(this.c) },
      0x12A: { cycles: 8, action: () => this.d = this.sra_n(this.d) },
      0x12B: { cycles: 8, action: () => this.e = this.sra_n(this.e) },
      0x12C: { cycles: 8, action: () => this.h = this.sra_n(this.h) },
      0x12D: { cycles: 8, action: () => this.l = this.sra_n(this.l) },
      0x12E: { cycles: 16, action: () => this.memoryMap.writeByte(this.hl, this.sra_n(this.memoryMap.readByte(this.hl))) },
      0x12F: { cycles: 8, action: () => this.a = this.sra_n(this.a) },
      0x130: { cycles: 8, action: () => this.b = this.swap(this.b) },
      0x131: { cycles: 8, action: () => this.c = this.swap(this.c) },
      0x132: { cycles: 8, action: () => this.d = this.swap(this.d) },
      0x133: { cycles: 8, action: () => this.e = this.swap(this.e) },
      0x134: { cycles: 8, action: () => this.h = this.swap(this.h) },
      0x135: { cycles: 8, action: () => this.l = this.swap(this.l) },
      0x136: { cycles: 16, action: () => this.memoryMap.writeByte(this.hl, this.swap(this.memoryMap.readByte(this.hl))) },
      0x137: { cycles: 8, action: () => this.a = this.swap(this.a) },
      0x138: { cycles: 8, action: () => this.b = this.srl_n(this.b) },
      0x139: { cycles: 8, action: () => this.c = this.srl_n(this.c) },
      0x13A: { cycles: 8, action: () => this.d = this.srl_n(this.d) },
      0x13B: { cycles: 8, action: () => this.e = this.srl_n(this.e) },
      0x13C: { cycles: 8, action: () => this.h = this.srl_n(this.h) },
      0x13D: { cycles: 8, action: () => this.l = this.srl_n(this.l) },
      0x13E: { cycles: 16, action: () => this.memoryMap.writeByte(this.hl, this.srl_n(this.memoryMap.readByte(this.hl))) },
      0x13F: { cycles: 8, action: () => this.a = this.srl_n(this.a) },
      0x140: null,
      0x141: null,
      0x142: null,
      0x143: null,
      0x144: null,
      0x145: null,
      0x146: null,
      0x147: null,
      0x148: null,
      0x149: null,
      0x14A: null,
      0x14B: null,
      0x14C: null,
      0x14D: null,
      0x14E: null,
      0x14F: null,
      0x150: null,
      0x151: null,
      0x152: null,
      0x153: null,
      0x154: null,
      0x155: null,
      0x156: null,
      0x157: null,
      0x158: null,
      0x159: null,
      0x15A: null,
      0x15B: null,
      0x15C: null,
      0x15D: null,
      0x15E: null,
      0x15F: null,
      0x160: null,
      0x161: null,
      0x162: null,
      0x163: null,
      0x164: null,
      0x165: null,
      0x166: null,
      0x167: null,
      0x168: null,
      0x169: null,
      0x16A: null,
      0x16B: null,
      0x16C: null,
      0x16D: null,
      0x16E: null,
      0x16F: null,
      0x170: null,
      0x171: null,
      0x172: null,
      0x173: null,
      0x174: null,
      0x175: null,
      0x176: null,
      0x177: null,
      0x178: null,
      0x179: null,
      0x17A: null,
      0x17B: null,
      0x17C: null,
      0x17D: null,
      0x17E: null,
      0x17F: null,
      0x180: null,
      0x181: null,
      0x182: null,
      0x183: null,
      0x184: null,
      0x185: null,
      0x186: null,
      0x187: null,
      0x188: null,
      0x189: null,
      0x18A: null,
      0x18B: null,
      0x18C: null,
      0x18D: null,
      0x18E: null,
      0x18F: null,
      0x190: null,
      0x191: null,
      0x192: null,
      0x193: null,
      0x194: null,
      0x195: null,
      0x196: null,
      0x197: null,
      0x198: null,
      0x199: null,
      0x19A: null,
      0x19B: null,
      0x19C: null,
      0x19D: null,
      0x19E: null,
      0x19F: null,
      0x1A0: null,
      0x1A1: null,
      0x1A2: null,
      0x1A3: null,
      0x1A4: null,
      0x1A5: null,
      0x1A6: null,
      0x1A7: null,
      0x1A8: null,
      0x1A9: null,
      0x1AA: null,
      0x1AB: null,
      0x1AC: null,
      0x1AD: null,
      0x1AE: null,
      0x1AF: null,
      0x1B0: null,
      0x1B1: null,
      0x1B2: null,
      0x1B3: null,
      0x1B4: null,
      0x1B5: null,
      0x1B6: null,
      0x1B7: null,
      0x1B8: null,
      0x1B9: null,
      0x1BA: null,
      0x1BB: null,
      0x1BC: null,
      0x1BD: null,
      0x1BE: null,
      0x1BF: null,
      0x1C0: null,
      0x1C1: null,
      0x1C2: null,
      0x1C3: null,
      0x1C4: null,
      0x1C5: null,
      0x1C6: null,
      0x1C7: null,
      0x1C8: null,
      0x1C9: null,
      0x1CA: null,
      0x1CB: null,
      0x1CC: null,
      0x1CD: null,
      0x1CE: null,
      0x1CF: null,
      0x1D0: null,
      0x1D1: null,
      0x1D2: null,
      0x1D3: null,
      0x1D4: null,
      0x1D5: null,
      0x1D6: null,
      0x1D7: null,
      0x1D8: null,
      0x1D9: null,
      0x1DA: null,
      0x1DB: null,
      0x1DC: null,
      0x1DD: null,
      0x1DE: null,
      0x1DF: null,
      0x1E0: null,
      0x1E1: null,
      0x1E2: null,
      0x1E3: null,
      0x1E4: null,
      0x1E5: null,
      0x1E6: null,
      0x1E7: null,
      0x1E8: null,
      0x1E9: null,
      0x1EA: null,
      0x1EB: null,
      0x1EC: null,
      0x1ED: null,
      0x1EE: null,
      0x1EF: null,
      0x1F0: null,
      0x1F1: null,
      0x1F2: null,
      0x1F3: null,
      0x1F4: null,
      0x1F5: null,
      0x1F6: null,
      0x1F7: null,
      0x1F8: null,
      0x1F9: null,
      0x1FA: null,
      0x1FB: null,
      0x1FC: null,
      0x1FD: null,
      0x1FE: null,
      0x1FF: null,
    }
  }
}

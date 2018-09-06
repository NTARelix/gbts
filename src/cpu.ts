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
  private halted: boolean
  private stopped: boolean
  private interruptEnabled: boolean
  private totalCycles: number

  constructor(memoryMap: MemoryMap) {
    this.memoryMap = memoryMap
    const registerBuffer = new ArrayBuffer(12)
    this.byteView = new Uint8Array(registerBuffer)
    this.wordView = new Uint16Array(registerBuffer)
    this.operations = this.generateOperationMap()
    this.halted = false
    this.stopped = false
    this.interruptEnabled = false
    this.totalCycles = 0
    this.reset()
  }

  public reset(): void {
    this.af = 0
    this.bc = 0
    this.de = 0
    this.hl = 0
    this.sp = 0
    this.pc = 0
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

  public get fz(): boolean { return !!(this.f & FLAG_ZERO) }
  public set fz(set: boolean) { !!set ? this.f |= FLAG_ZERO : this.f &= FLAG_ZERO_N }
  public get fn(): boolean { return !!(this.f & FLAG_SUBTRACT) }
  public set fn(set: boolean) { !!set ? this.f |= FLAG_SUBTRACT : this.f &= FLAG_SUBTRACT_N }
  public get fh(): boolean { return !!(this.f & FLAG_HALF_CARRY) }
  public set fh(set: boolean) { !!set ? this.f |= FLAG_HALF_CARRY : this.f &= FLAG_HALF_CARRY_N }
  public get fc(): boolean { return !!(this.f & FLAG_CARRY) }
  public set fc(set: boolean) { !!set ? this.f |= FLAG_CARRY : this.f &= FLAG_CARRY_N }

  public tick(isExtension = false): void {
    if (this.isStopped()) { return }
    const opcode = this.memoryMap.readByte(this.pc)
    const extOffset = isExtension ? 0x100 : 0
    const operation = this.operations[opcode + extOffset]
    if (!operation) { throw new Error('Invalid opcode: ' + toHex(opcode, 2)) }
    this.pc += 1
    this.totalCycles += operation.cycles
    operation.action()
  }

  public isHalted(): boolean {
    return this.halted
  }

  public isStopped(): boolean {
    return this.stopped
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
    const z = this.f & FLAG_ZERO
    const n = 0
    const h = (((this.hl & 0xFFF) + (val & 0xFFF)) > 0xFFF)
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
    const result = (val + 1) & 0xFF
    const z = result === 0
    const n = 0
    const h = result > 0xF
    const c = this.f & FLAG_CARRY
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
    return result
  }

  private dec(val: number): number {
    const newVal = val - 1
    const z = newVal === 0
    const n = 1
    const h = (((newVal & 0xF) + (1 & 0xF)) > 0xF)
    const c = this.f & FLAG_CARRY
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
    corr |= this.fh ? 0x06 : 0x00
    corr |= this.fc ? 0x60 : 0x00
    if (this.fn) {
      this.a -= corr
    } else {
      corr |= (this.a & 0x0F) > 0x09 ? 0x06 : 0x00
      corr |= this.a > 0x99 ? 0x60 : 0x00
      this.a += corr
    }
    const z = this.a === 0
    const n = this.fn
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
    const rotation = (this.a << 1) + (this.a >> 7)
    const z = 0
    const n = 0
    const h = 0
    const c = rotation > 0xFF
    this.a = rotation
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private rla(): void {
    const value = (this.a << 1) + (+this.fc)
    const z = 0
    const n = 0
    const h = 0
    const c = value > 0xFF
    this.a = value
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private rrca(): void {
    const value = (this.a >> 1) + ((this.a & 1) << 7) + ((this.a & 1) << 8)
    const z = 0
    const n = 0
    const h = 0
    const c = value > 0xFF
    this.a = value
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private rra(): void {
    const value = (this.a >> 1) + (+this.fc << 7) + ((this.a & 1) << 8)
    const z = 0
    const n = 0
    const h = 0
    const c = value > 0xFF
    this.a = value
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

  private bit(val: number, bitPosition: number): void {
    const result = val & (1 << bitPosition)
    const z = result === 0
    const n = 0
    const h = 1
    const c = this.f & FLAG_CARRY
    this.f = flagsToNum(z, n, h, c, 0, 0, 0, 0)
  }

  private set(val: number, bitPosition: number): number {
    return val & (1 << bitPosition)
  }

  private res(val: number, bitPosition: number): number {
    return val & ~(1 << bitPosition)
  }

  private jp_cc(isFlagSet: boolean): void {
    const targetAddr = this.loadImmediateWord()
    if (isFlagSet) {
      this.pc = targetAddr
    }
  }

  private jr_cc(isFlagSet: boolean): void {
    const relativeTarget = toSigned(this.loadImmediateByte())
    if (isFlagSet) {
      this.pc += relativeTarget
    }
  }

  private call_nn(): void {
    const fnAddr = this.loadImmediateWord()
    this.pushWord(this.pc)
    this.pc = fnAddr
  }

  private call_cc_nn(isFlagSet: boolean): void {
    const fnAddr = this.loadImmediateWord()
    if (isFlagSet) {
      this.pushWord(this.pc)
      this.pc = fnAddr
    }
  }

  private rst(addr: number): void {
    this.pushWord(this.pc)
    this.pc = addr
  }

  private ret_cc(isFlagSet: boolean): void {
    if (isFlagSet) {
      this.pc = this.popWord()
    }
  }

  private reti(): void {
    this.pc = this.popWord()
    this.interruptEnabled = true
  }

  private stop(): void {
    this.stopped = true
    this.pc += 1
  }

  private generateOperationMap(): IOperationMap {
    return {
      // tslint:disable-next-line:no-empty
      0x000: { cycles: 4, action: () => {} },
      0x001: { cycles: 12, action: () => this.bc = this.loadImmediateWord() },
      0x002: { cycles: 8, action: () => this.memoryMap.writeByte(this.bc, this.a) },
      0x003: { cycles: 8, action: () => this.bc += 1 },
      0x004: { cycles: 4, action: () => this.b = this.inc(this.b) },
      0x005: { cycles: 4, action: () => this.b = this.dec(this.b) },
      0x006: { cycles: 4, action: () => this.b = this.loadImmediateByte() },
      0x007: { cycles: 4, action: () => this.rlca() },
      0x008: { cycles: 20, action: () => this.memoryMap.writeWord(this.loadImmediateWord(), this.sp) },
      0x009: { cycles: 8, action: () => this.hl = this.add_hl(this.bc) },
      0x00A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.bc) },
      0x00B: { cycles: 8, action: () => this.bc -= 1 },
      0x00C: { cycles: 4, action: () => this.c = this.inc(this.c) },
      0x00D: { cycles: 4, action: () => this.c = this.dec(this.c) },
      0x00E: { cycles: 4, action: () => this.c = this.loadImmediateByte() },
      0x00F: { cycles: 4, action: () => this.rrca() },
      0x010: { cycles: 4, action: () => this.stop() },
      0x011: { cycles: 12, action: () => this.de = this.loadImmediateWord() },
      0x012: { cycles: 8, action: () => this.memoryMap.writeByte(this.de, this.a) },
      0x013: { cycles: 8, action: () => this.de += 1 },
      0x014: { cycles: 4, action: () => this.d = this.inc(this.d) },
      0x015: { cycles: 4, action: () => this.d = this.dec(this.d) },
      0x016: { cycles: 4, action: () => this.d = this.loadImmediateByte() },
      0x017: { cycles: 4, action: () => this.rla() },
      0x018: { cycles: 8, action: () => this.jr_cc(true) },
      0x019: { cycles: 8, action: () => this.hl = this.add_hl(this.de) },
      0x01A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.de) },
      0x01B: { cycles: 8, action: () => this.de -= 1 },
      0x01C: { cycles: 4, action: () => this.e = this.inc(this.e) },
      0x01D: { cycles: 4, action: () => this.e = this.dec(this.e) },
      0x01E: { cycles: 4, action: () => this.e = this.loadImmediateByte() },
      0x01F: { cycles: 4, action: () => this.rra() },
      0x020: { cycles: 8, action: () => this.jr_cc(!this.fz) },
      0x021: { cycles: 12, action: () => this.hl = this.loadImmediateWord() },
      0x022: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl++, this.a) },
      0x023: { cycles: 8, action: () => this.hl += 1 },
      0x024: { cycles: 4, action: () => this.h = this.inc(this.h) },
      0x025: { cycles: 4, action: () => this.h = this.dec(this.h) },
      0x026: { cycles: 4, action: () => this.h = this.loadImmediateByte() },
      0x027: { cycles: 4, action: () => this.daa() },
      0x028: { cycles: 8, action: () => this.jr_cc(this.fz) },
      0x029: { cycles: 8, action: () => this.hl = this.add_hl(this.hl) },
      0x02A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.hl++) },
      0x02B: { cycles: 8, action: () => this.hl -= 1 },
      0x02C: { cycles: 4, action: () => this.l = this.inc(this.l) },
      0x02D: { cycles: 4, action: () => this.l = this.dec(this.l) },
      0x02E: { cycles: 4, action: () => this.l = this.loadImmediateByte() },
      0x02F: { cycles: 4, action: () => this.cpl() },
      0x030: { cycles: 8, action: () => this.jr_cc(!this.fc) },
      0x031: { cycles: 12, action: () => this.sp = this.loadImmediateWord() },
      0x032: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl--, this.a) },
      0x033: { cycles: 8, action: () => this.sp += 1 },
      0x034: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.inc(this.memoryMap.readByte(this.hl))) },
      0x035: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.dec(this.memoryMap.readByte(this.hl))) },
      0x036: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.loadImmediateByte()) },
      0x037: { cycles: 4, action: () => this.scf() },
      0x038: { cycles: 8, action: () => this.jr_cc(this.fc) },
      0x039: { cycles: 8, action: () => this.hl = this.add_hl(this.sp) },
      0x03A: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.hl--) },
      0x03B: { cycles: 8, action: () => this.sp -= 1 },
      0x03C: { cycles: 4, action: () => this.a = this.inc(this.a) },
      0x03D: { cycles: 4, action: () => this.a = this.dec(this.a) },
      0x03E: { cycles: 8, action: () => this.a = this.loadImmediateByte() },
      0x03F: { cycles: 4, action: () => this.ccf() },
      0x040: { cycles: 4, action: () => this.b = this.b },
      0x041: { cycles: 4, action: () => this.b = this.c },
      0x042: { cycles: 4, action: () => this.b = this.d },
      0x043: { cycles: 4, action: () => this.b = this.e },
      0x044: { cycles: 4, action: () => this.b = this.h },
      0x045: { cycles: 4, action: () => this.b = this.l },
      0x046: { cycles: 8, action: () => this.b = this.memoryMap.readByte(this.hl) },
      0x047: { cycles: 4, action: () => this.b = this.a },
      0x048: { cycles: 4, action: () => this.c = this.b },
      0x049: { cycles: 4, action: () => this.c = this.c },
      0x04A: { cycles: 4, action: () => this.c = this.d },
      0x04B: { cycles: 4, action: () => this.c = this.e },
      0x04C: { cycles: 4, action: () => this.c = this.h },
      0x04D: { cycles: 4, action: () => this.c = this.l },
      0x04E: { cycles: 8, action: () => this.c = this.memoryMap.readByte(this.hl) },
      0x04F: { cycles: 4, action: () => this.c = this.a },
      0x050: { cycles: 4, action: () => this.d = this.b },
      0x051: { cycles: 4, action: () => this.d = this.c },
      0x052: { cycles: 4, action: () => this.d = this.d },
      0x053: { cycles: 4, action: () => this.d = this.e },
      0x054: { cycles: 4, action: () => this.d = this.h },
      0x055: { cycles: 4, action: () => this.d = this.l },
      0x056: { cycles: 8, action: () => this.d = this.memoryMap.readByte(this.hl) },
      0x057: { cycles: 4, action: () => this.d = this.a },
      0x058: { cycles: 4, action: () => this.e = this.b },
      0x059: { cycles: 4, action: () => this.e = this.c },
      0x05A: { cycles: 4, action: () => this.e = this.d },
      0x05B: { cycles: 4, action: () => this.e = this.e },
      0x05C: { cycles: 4, action: () => this.e = this.h },
      0x05D: { cycles: 4, action: () => this.e = this.l },
      0x05E: { cycles: 8, action: () => this.e = this.memoryMap.readByte(this.hl) },
      0x05F: { cycles: 4, action: () => this.e = this.a },
      0x060: { cycles: 4, action: () => this.h = this.b },
      0x061: { cycles: 4, action: () => this.h = this.c },
      0x062: { cycles: 4, action: () => this.h = this.d },
      0x063: { cycles: 4, action: () => this.h = this.e },
      0x064: { cycles: 4, action: () => this.h = this.h },
      0x065: { cycles: 4, action: () => this.h = this.l },
      0x066: { cycles: 8, action: () => this.h = this.memoryMap.readByte(this.hl) },
      0x067: { cycles: 4, action: () => this.h = this.a },
      0x068: { cycles: 4, action: () => this.l = this.b },
      0x069: { cycles: 4, action: () => this.l = this.c },
      0x06A: { cycles: 4, action: () => this.l = this.d },
      0x06B: { cycles: 4, action: () => this.l = this.e },
      0x06C: { cycles: 4, action: () => this.l = this.h },
      0x06D: { cycles: 4, action: () => this.l = this.l },
      0x06E: { cycles: 8, action: () => this.l = this.memoryMap.readByte(this.hl) },
      0x06F: { cycles: 4, action: () => this.l = this.a },
      0x070: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.b) },
      0x071: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.c) },
      0x072: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.d) },
      0x073: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.e) },
      0x074: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.h) },
      0x075: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.l) },
      0x076: { cycles: 4, action: () => this.halted = true },
      0x077: { cycles: 8, action: () => this.memoryMap.writeByte(this.hl, this.a) },
      0x078: { cycles: 4, action: () => this.a = this.b },
      0x079: { cycles: 4, action: () => this.a = this.c },
      0x07A: { cycles: 4, action: () => this.a = this.d },
      0x07B: { cycles: 4, action: () => this.a = this.e },
      0x07C: { cycles: 4, action: () => this.a = this.h },
      0x07D: { cycles: 4, action: () => this.a = this.l },
      0x07E: { cycles: 8, action: () => this.a = this.memoryMap.readByte(this.hl) },
      0x07F: { cycles: 4, action: () => this.a = this.a },
      0x080: { cycles: 4, action: () => this.a = this.add_a(this.b) },
      0x081: { cycles: 4, action: () => this.a = this.add_a(this.c) },
      0x082: { cycles: 4, action: () => this.a = this.add_a(this.d) },
      0x083: { cycles: 4, action: () => this.a = this.add_a(this.e) },
      0x084: { cycles: 4, action: () => this.a = this.add_a(this.h) },
      0x085: { cycles: 4, action: () => this.a = this.add_a(this.l) },
      0x086: { cycles: 8, action: () => this.a = this.add_a(this.memoryMap.readByte(this.hl)) },
      0x087: { cycles: 4, action: () => this.a = this.add_a(this.a) },
      0x088: { cycles: 4, action: () => this.a = this.adc_a(this.b) },
      0x089: { cycles: 4, action: () => this.a = this.adc_a(this.c) },
      0x08A: { cycles: 4, action: () => this.a = this.adc_a(this.d) },
      0x08B: { cycles: 4, action: () => this.a = this.adc_a(this.e) },
      0x08C: { cycles: 4, action: () => this.a = this.adc_a(this.h) },
      0x08D: { cycles: 4, action: () => this.a = this.adc_a(this.l) },
      0x08E: { cycles: 8, action: () => this.a = this.adc_a(this.memoryMap.readByte(this.hl)) },
      0x08F: { cycles: 4, action: () => this.a = this.adc_a(this.a) },
      0x090: { cycles: 4, action: () => this.a = this.sub_a(this.b) },
      0x091: { cycles: 4, action: () => this.a = this.sub_a(this.c) },
      0x092: { cycles: 4, action: () => this.a = this.sub_a(this.d) },
      0x093: { cycles: 4, action: () => this.a = this.sub_a(this.e) },
      0x094: { cycles: 4, action: () => this.a = this.sub_a(this.h) },
      0x095: { cycles: 4, action: () => this.a = this.sub_a(this.l) },
      0x096: { cycles: 8, action: () => this.a = this.sub_a(this.memoryMap.readByte(this.hl)) },
      0x097: { cycles: 4, action: () => this.a = this.sub_a(this.a) },
      0x098: { cycles: 4, action: () => this.a = this.sbc_a(this.b) },
      0x099: { cycles: 4, action: () => this.a = this.sbc_a(this.c) },
      0x09A: { cycles: 4, action: () => this.a = this.sbc_a(this.d) },
      0x09B: { cycles: 4, action: () => this.a = this.sbc_a(this.e) },
      0x09C: { cycles: 4, action: () => this.a = this.sbc_a(this.h) },
      0x09D: { cycles: 4, action: () => this.a = this.sbc_a(this.l) },
      0x09E: { cycles: 8, action: () => this.a = this.sbc_a(this.memoryMap.readByte(this.hl)) },
      0x09F: { cycles: 4, action: () => this.a = this.sbc_a(this.a) },
      0x0A0: { cycles: 4, action: () => this.a = this.and_a(this.b) },
      0x0A1: { cycles: 4, action: () => this.a = this.and_a(this.c) },
      0x0A2: { cycles: 4, action: () => this.a = this.and_a(this.d) },
      0x0A3: { cycles: 4, action: () => this.a = this.and_a(this.e) },
      0x0A4: { cycles: 4, action: () => this.a = this.and_a(this.h) },
      0x0A5: { cycles: 4, action: () => this.a = this.and_a(this.l) },
      0x0A6: { cycles: 8, action: () => this.a = this.and_a(this.memoryMap.readByte(this.hl)) },
      0x0A7: { cycles: 4, action: () => this.a = this.and_a(this.a) },
      0x0A8: { cycles: 4, action: () => this.a = this.xor_a(this.b) },
      0x0A9: { cycles: 4, action: () => this.a = this.xor_a(this.c) },
      0x0AA: { cycles: 4, action: () => this.a = this.xor_a(this.d) },
      0x0AB: { cycles: 4, action: () => this.a = this.xor_a(this.e) },
      0x0AC: { cycles: 4, action: () => this.a = this.xor_a(this.h) },
      0x0AD: { cycles: 4, action: () => this.a = this.xor_a(this.l) },
      0x0AE: { cycles: 8, action: () => this.a = this.xor_a(this.memoryMap.readByte(this.hl)) },
      0x0AF: { cycles: 4, action: () => this.a = this.xor_a(this.a) },
      0x0B0: { cycles: 4, action: () => this.a = this.or_a(this.b) },
      0x0B1: { cycles: 4, action: () => this.a = this.or_a(this.c) },
      0x0B2: { cycles: 4, action: () => this.a = this.or_a(this.d) },
      0x0B3: { cycles: 4, action: () => this.a = this.or_a(this.e) },
      0x0B4: { cycles: 4, action: () => this.a = this.or_a(this.h) },
      0x0B5: { cycles: 4, action: () => this.a = this.or_a(this.l) },
      0x0B6: { cycles: 8, action: () => this.a = this.or_a(this.memoryMap.readByte(this.hl)) },
      0x0B7: { cycles: 4, action: () => this.a = this.or_a(this.a) },
      0x0B8: { cycles: 4, action: () => this.a = this.cp_a(this.b) },
      0x0B9: { cycles: 4, action: () => this.a = this.cp_a(this.c) },
      0x0BA: { cycles: 4, action: () => this.a = this.cp_a(this.d) },
      0x0BB: { cycles: 4, action: () => this.a = this.cp_a(this.e) },
      0x0BC: { cycles: 4, action: () => this.a = this.cp_a(this.h) },
      0x0BD: { cycles: 4, action: () => this.a = this.cp_a(this.l) },
      0x0BE: { cycles: 8, action: () => this.a = this.cp_a(this.memoryMap.readByte(this.hl)) },
      0x0BF: { cycles: 4, action: () => this.a = this.cp_a(this.a) },
      0x0C0: { cycles: 8, action: () => this.ret_cc(!this.fz) },
      0x0C1: { cycles: 12, action: () => this.bc = this.popWord() },
      0x0C2: { cycles: 12, action: () => this.jp_cc(!this.fz) },
      0x0C3: { cycles: 12, action: () => this.jp_cc(true) },
      0x0C4: { cycles: 12, action: () => this.call_cc_nn(!this.fz) },
      0x0C5: { cycles: 16, action: () => this.pushWord(this.bc) },
      0x0C6: { cycles: 8, action: () => this.a = this.add_a(this.loadImmediateByte()) },
      0x0C7: { cycles: 32, action: () => this.rst(0x00) },
      0x0C8: { cycles: 8, action: () => this.ret_cc(this.fz) },
      0x0C9: { cycles: 8, action: () => this.ret_cc(true) },
      0x0CA: { cycles: 12, action: () => this.jp_cc(this.fz) },
      0x0CB: { cycles: 4, action: () => this.tick(true) },
      0x0CC: { cycles: 12, action: () => this.call_cc_nn(this.fz) },
      0x0CD: { cycles: 12, action: () => this.call_nn() },
      0x0CE: { cycles: 8, action: () => this.a = this.adc_a(this.loadImmediateByte()) },
      0x0CF: { cycles: 32, action: () => this.rst(0x08) },
      0x0D0: { cycles: 8, action: () => this.ret_cc(!this.fc) },
      0x0D1: { cycles: 12, action: () => this.de = this.popWord() },
      0x0D2: { cycles: 12, action: () => this.jp_cc(!this.fc) },
      0x0D3: null,
      0x0D4: { cycles: 12, action: () => this.call_cc_nn(!this.fc) },
      0x0D5: { cycles: 16, action: () => this.pushWord(this.de) },
      0x0D6: { cycles: 8, action: () => this.a = this.sub_a(this.loadImmediateByte()) },
      0x0D7: { cycles: 32, action: () => this.rst(0x10) },
      0x0D8: { cycles: 8, action: () => this.ret_cc(this.fc) },
      0x0D9: { cycles: 8, action: () => this.reti() },
      0x0DA: { cycles: 12, action: () => this.jp_cc(this.fc) },
      0x0DB: null,
      0x0DC: { cycles: 12, action: () => this.call_cc_nn(this.fc) },
      0x0DD: null,
      0x0DE: null,
      0x0DF: { cycles: 32, action: () => this.rst(0x18) },
      0x0E0: { cycles: 12, action: () => this.memoryMap.writeByte(0xFF00 + this.loadImmediateByte(), this.a) },
      0x0E1: { cycles: 12, action: () => this.hl = this.popWord() },
      0x0E2: { cycles: 8, action: () => this.memoryMap.writeByte(0xFF00 + this.c, this.a) },
      0x0E3: null,
      0x0E4: null,
      0x0E5: { cycles: 16, action: () => this.pushWord(this.hl) },
      0x0E6: { cycles: 8, action: () => this.a = this.and_a(this.loadImmediateByte()) },
      0x0E7: { cycles: 32, action: () => this.rst(0x20) },
      0x0E8: { cycles: 16, action: () => this.add_sp() },
      0x0E9: { cycles: 4, action: () => this.pc = this.hl },
      0x0EA: { cycles: 16, action: () => this.memoryMap.writeByte(this.loadImmediateWord(), this.a) },
      0x0EB: null,
      0x0EC: null,
      0x0ED: null,
      0x0EE: { cycles: 8, action: () => this.a = this.xor_a(this.loadImmediateByte()) },
      0x0EF: { cycles: 32, action: () => this.rst(0x28) },
      0x0F0: { cycles: 12, action: () => this.a = this.memoryMap.readByte(0xFF00 + this.loadImmediateByte()) },
      0x0F1: { cycles: 12, action: () => this.af = this.popWord() },
      0x0F2: { cycles: 8, action: () => this.a = this.memoryMap.readByte(0xFF00 + this.c) },
      0x0F3: { cycles: 4, action: () => this.interruptEnabled = false },
      0x0F4: null,
      0x0F5: { cycles: 16, action: () => this.pushWord(this.af) },
      0x0F6: { cycles: 8, action: () => this.a = this.or_a(this.loadImmediateByte()) },
      0x0F7: { cycles: 32, action: () => this.rst(0x30) },
      0x0F8: { cycles: 12, action: () => this.hl = this.sp + toSigned(this.loadImmediateByte()) },
      0x0F9: { cycles: 8, action: () => this.sp = this.hl },
      0x0FA: { cycles: 16, action: () => this.ld_hl_sp_n() },
      0x0FB: { cycles: 4, action: () => this.interruptEnabled = true },
      0x0FC: null,
      0x0FD: null,
      0x0FE: { cycles: 8, action: () => this.a = this.cp_a(this.loadImmediateByte()) },
      0x0FF: { cycles: 32, action: () => this.rst(0x38) },
      0x100: { cycles: 4, action: () => this.b = this.rlc_n(this.b) },
      0x101: { cycles: 4, action: () => this.c = this.rlc_n(this.c) },
      0x102: { cycles: 4, action: () => this.d = this.rlc_n(this.d) },
      0x103: { cycles: 4, action: () => this.e = this.rlc_n(this.e) },
      0x104: { cycles: 4, action: () => this.h = this.rlc_n(this.h) },
      0x105: { cycles: 4, action: () => this.l = this.rlc_n(this.l) },
      0x106: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.rlc_n(this.memoryMap.readByte(this.hl))) },
      0x107: { cycles: 4, action: () => this.a = this.rlc_n(this.a) },
      0x108: { cycles: 4, action: () => this.b = this.rrc_n(this.b) },
      0x109: { cycles: 4, action: () => this.c = this.rrc_n(this.c) },
      0x10A: { cycles: 4, action: () => this.d = this.rrc_n(this.d) },
      0x10B: { cycles: 4, action: () => this.e = this.rrc_n(this.e) },
      0x10C: { cycles: 4, action: () => this.h = this.rrc_n(this.h) },
      0x10D: { cycles: 4, action: () => this.l = this.rrc_n(this.l) },
      0x10E: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.rrc_n(this.memoryMap.readByte(this.hl))) },
      0x10F: { cycles: 4, action: () => this.a = this.rrc_n(this.a) },
      0x110: { cycles: 4, action: () => this.b = this.rl_n(this.b) },
      0x111: { cycles: 4, action: () => this.c = this.rl_n(this.c) },
      0x112: { cycles: 4, action: () => this.d = this.rl_n(this.d) },
      0x113: { cycles: 4, action: () => this.e = this.rl_n(this.e) },
      0x114: { cycles: 4, action: () => this.h = this.rl_n(this.h) },
      0x115: { cycles: 4, action: () => this.l = this.rl_n(this.l) },
      0x116: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.rl_n(this.memoryMap.readByte(this.hl))) },
      0x117: { cycles: 4, action: () => this.a = this.rl_n(this.a) },
      0x118: { cycles: 4, action: () => this.b = this.rr_n(this.b) },
      0x119: { cycles: 4, action: () => this.c = this.rr_n(this.c) },
      0x11A: { cycles: 4, action: () => this.d = this.rr_n(this.d) },
      0x11B: { cycles: 4, action: () => this.e = this.rr_n(this.e) },
      0x11C: { cycles: 4, action: () => this.h = this.rr_n(this.h) },
      0x11D: { cycles: 4, action: () => this.l = this.rr_n(this.l) },
      0x11E: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.rr_n(this.memoryMap.readByte(this.h))) },
      0x11F: { cycles: 4, action: () => this.a = this.rr_n(this.a) },
      0x120: { cycles: 4, action: () => this.b = this.sla_n(this.b) },
      0x121: { cycles: 4, action: () => this.c = this.sla_n(this.c) },
      0x122: { cycles: 4, action: () => this.d = this.sla_n(this.d) },
      0x123: { cycles: 4, action: () => this.e = this.sla_n(this.e) },
      0x124: { cycles: 4, action: () => this.h = this.sla_n(this.h) },
      0x125: { cycles: 4, action: () => this.l = this.sla_n(this.l) },
      0x126: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.sla_n(this.memoryMap.readByte(this.hl))) },
      0x127: { cycles: 4, action: () => this.a = this.sla_n(this.a) },
      0x128: { cycles: 4, action: () => this.b = this.sra_n(this.b) },
      0x129: { cycles: 4, action: () => this.c = this.sra_n(this.c) },
      0x12A: { cycles: 4, action: () => this.d = this.sra_n(this.d) },
      0x12B: { cycles: 4, action: () => this.e = this.sra_n(this.e) },
      0x12C: { cycles: 4, action: () => this.h = this.sra_n(this.h) },
      0x12D: { cycles: 4, action: () => this.l = this.sra_n(this.l) },
      0x12E: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.sra_n(this.memoryMap.readByte(this.hl))) },
      0x12F: { cycles: 4, action: () => this.a = this.sra_n(this.a) },
      0x130: { cycles: 4, action: () => this.b = this.swap(this.b) },
      0x131: { cycles: 4, action: () => this.c = this.swap(this.c) },
      0x132: { cycles: 4, action: () => this.d = this.swap(this.d) },
      0x133: { cycles: 4, action: () => this.e = this.swap(this.e) },
      0x134: { cycles: 4, action: () => this.h = this.swap(this.h) },
      0x135: { cycles: 4, action: () => this.l = this.swap(this.l) },
      0x136: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.swap(this.memoryMap.readByte(this.hl))) },
      0x137: { cycles: 4, action: () => this.a = this.swap(this.a) },
      0x138: { cycles: 4, action: () => this.b = this.srl_n(this.b) },
      0x139: { cycles: 4, action: () => this.c = this.srl_n(this.c) },
      0x13A: { cycles: 4, action: () => this.d = this.srl_n(this.d) },
      0x13B: { cycles: 4, action: () => this.e = this.srl_n(this.e) },
      0x13C: { cycles: 4, action: () => this.h = this.srl_n(this.h) },
      0x13D: { cycles: 4, action: () => this.l = this.srl_n(this.l) },
      0x13E: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.srl_n(this.memoryMap.readByte(this.hl))) },
      0x13F: { cycles: 4, action: () => this.a = this.srl_n(this.a) },
      0x140: { cycles: 4, action: () => this.bit(this.b, 0) },
      0x141: { cycles: 4, action: () => this.bit(this.c, 0) },
      0x142: { cycles: 4, action: () => this.bit(this.d, 0) },
      0x143: { cycles: 4, action: () => this.bit(this.e, 0) },
      0x144: { cycles: 4, action: () => this.bit(this.h, 0) },
      0x145: { cycles: 4, action: () => this.bit(this.l, 0) },
      0x146: { cycles: 12, action: () => this.bit(this.memoryMap.readByte(this.hl), 0) },
      0x147: { cycles: 4, action: () => this.bit(this.a, 0) },
      0x148: { cycles: 4, action: () => this.bit(this.b, 1) },
      0x149: { cycles: 4, action: () => this.bit(this.c, 1) },
      0x14A: { cycles: 4, action: () => this.bit(this.d, 1) },
      0x14B: { cycles: 4, action: () => this.bit(this.e, 1) },
      0x14C: { cycles: 4, action: () => this.bit(this.h, 1) },
      0x14D: { cycles: 4, action: () => this.bit(this.l, 1) },
      0x14E: { cycles: 12, action: () => this.bit(this.memoryMap.readByte(this.hl), 1) },
      0x14F: { cycles: 4, action: () => this.bit(this.a, 1) },
      0x150: { cycles: 4, action: () => this.bit(this.b, 2) },
      0x151: { cycles: 4, action: () => this.bit(this.c, 2) },
      0x152: { cycles: 4, action: () => this.bit(this.d, 2) },
      0x153: { cycles: 4, action: () => this.bit(this.e, 2) },
      0x154: { cycles: 4, action: () => this.bit(this.h, 2) },
      0x155: { cycles: 4, action: () => this.bit(this.l, 2) },
      0x156: { cycles: 12, action: () => this.bit(this.memoryMap.readByte(this.hl), 2) },
      0x157: { cycles: 4, action: () => this.bit(this.a, 2) },
      0x158: { cycles: 4, action: () => this.bit(this.b, 3) },
      0x159: { cycles: 4, action: () => this.bit(this.c, 3) },
      0x15A: { cycles: 4, action: () => this.bit(this.d, 3) },
      0x15B: { cycles: 4, action: () => this.bit(this.e, 3) },
      0x15C: { cycles: 4, action: () => this.bit(this.h, 3) },
      0x15D: { cycles: 4, action: () => this.bit(this.l, 3) },
      0x15E: { cycles: 12, action: () => this.bit(this.memoryMap.readByte(this.hl), 3) },
      0x15F: { cycles: 4, action: () => this.bit(this.a, 3) },
      0x160: { cycles: 4, action: () => this.bit(this.b, 4) },
      0x161: { cycles: 4, action: () => this.bit(this.c, 4) },
      0x162: { cycles: 4, action: () => this.bit(this.d, 4) },
      0x163: { cycles: 4, action: () => this.bit(this.e, 4) },
      0x164: { cycles: 4, action: () => this.bit(this.h, 4) },
      0x165: { cycles: 4, action: () => this.bit(this.l, 4) },
      0x166: { cycles: 12, action: () => this.bit(this.memoryMap.readByte(this.hl), 4) },
      0x167: { cycles: 4, action: () => this.bit(this.a, 4) },
      0x168: { cycles: 4, action: () => this.bit(this.b, 5) },
      0x169: { cycles: 4, action: () => this.bit(this.c, 5) },
      0x16A: { cycles: 4, action: () => this.bit(this.d, 5) },
      0x16B: { cycles: 4, action: () => this.bit(this.e, 5) },
      0x16C: { cycles: 4, action: () => this.bit(this.h, 5) },
      0x16D: { cycles: 4, action: () => this.bit(this.l, 5) },
      0x16E: { cycles: 12, action: () => this.bit(this.memoryMap.readByte(this.hl), 5) },
      0x16F: { cycles: 4, action: () => this.bit(this.a, 5) },
      0x170: { cycles: 4, action: () => this.bit(this.b, 6) },
      0x171: { cycles: 4, action: () => this.bit(this.c, 6) },
      0x172: { cycles: 4, action: () => this.bit(this.d, 6) },
      0x173: { cycles: 4, action: () => this.bit(this.e, 6) },
      0x174: { cycles: 4, action: () => this.bit(this.h, 6) },
      0x175: { cycles: 4, action: () => this.bit(this.l, 6) },
      0x176: { cycles: 12, action: () => this.bit(this.memoryMap.readByte(this.hl), 6) },
      0x177: { cycles: 4, action: () => this.bit(this.a, 6) },
      0x178: { cycles: 4, action: () => this.bit(this.b, 7) },
      0x179: { cycles: 4, action: () => this.bit(this.c, 7) },
      0x17A: { cycles: 4, action: () => this.bit(this.d, 7) },
      0x17B: { cycles: 4, action: () => this.bit(this.e, 7) },
      0x17C: { cycles: 4, action: () => this.bit(this.h, 7) },
      0x17D: { cycles: 4, action: () => this.bit(this.l, 7) },
      0x17E: { cycles: 12, action: () => this.bit(this.memoryMap.readByte(this.hl), 7) },
      0x17F: { cycles: 4, action: () => this.bit(this.a, 7) },
      0x180: { cycles: 4, action: () => this.b = this.res(this.b, 0) },
      0x181: { cycles: 4, action: () => this.c = this.res(this.c, 0) },
      0x182: { cycles: 4, action: () => this.d = this.res(this.d, 0) },
      0x183: { cycles: 4, action: () => this.e = this.res(this.e, 0) },
      0x184: { cycles: 4, action: () => this.h = this.res(this.h, 0) },
      0x185: { cycles: 4, action: () => this.l = this.res(this.l, 0) },
      0x186: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.res(this.memoryMap.readByte(this.hl), 0)) },
      0x187: { cycles: 4, action: () => this.a = this.res(this.a, 0) },
      0x188: { cycles: 4, action: () => this.b = this.res(this.b, 1) },
      0x189: { cycles: 4, action: () => this.c = this.res(this.c, 1) },
      0x18A: { cycles: 4, action: () => this.d = this.res(this.d, 1) },
      0x18B: { cycles: 4, action: () => this.e = this.res(this.e, 1) },
      0x18C: { cycles: 4, action: () => this.h = this.res(this.h, 1) },
      0x18D: { cycles: 4, action: () => this.l = this.res(this.l, 1) },
      0x18E: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.res(this.memoryMap.readByte(this.hl), 1)) },
      0x18F: { cycles: 4, action: () => this.a = this.res(this.a, 1) },
      0x190: { cycles: 4, action: () => this.b = this.res(this.b, 2) },
      0x191: { cycles: 4, action: () => this.c = this.res(this.c, 2) },
      0x192: { cycles: 4, action: () => this.d = this.res(this.d, 2) },
      0x193: { cycles: 4, action: () => this.e = this.res(this.e, 2) },
      0x194: { cycles: 4, action: () => this.h = this.res(this.h, 2) },
      0x195: { cycles: 4, action: () => this.l = this.res(this.l, 2) },
      0x196: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.res(this.memoryMap.readByte(this.hl), 2)) },
      0x197: { cycles: 4, action: () => this.a = this.res(this.a, 2) },
      0x198: { cycles: 4, action: () => this.b = this.res(this.b, 3) },
      0x199: { cycles: 4, action: () => this.c = this.res(this.c, 3) },
      0x19A: { cycles: 4, action: () => this.d = this.res(this.d, 3) },
      0x19B: { cycles: 4, action: () => this.e = this.res(this.e, 3) },
      0x19C: { cycles: 4, action: () => this.h = this.res(this.h, 3) },
      0x19D: { cycles: 4, action: () => this.l = this.res(this.l, 3) },
      0x19E: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.res(this.memoryMap.readByte(this.hl), 3)) },
      0x19F: { cycles: 4, action: () => this.a = this.res(this.a, 3) },
      0x1A0: { cycles: 4, action: () => this.b = this.res(this.b, 4) },
      0x1A1: { cycles: 4, action: () => this.c = this.res(this.c, 4) },
      0x1A2: { cycles: 4, action: () => this.d = this.res(this.d, 4) },
      0x1A3: { cycles: 4, action: () => this.e = this.res(this.e, 4) },
      0x1A4: { cycles: 4, action: () => this.h = this.res(this.h, 4) },
      0x1A5: { cycles: 4, action: () => this.l = this.res(this.l, 4) },
      0x1A6: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.res(this.memoryMap.readByte(this.hl), 4)) },
      0x1A7: { cycles: 4, action: () => this.a = this.res(this.a, 4) },
      0x1A8: { cycles: 4, action: () => this.b = this.res(this.b, 5) },
      0x1A9: { cycles: 4, action: () => this.c = this.res(this.c, 5) },
      0x1AA: { cycles: 4, action: () => this.d = this.res(this.d, 5) },
      0x1AB: { cycles: 4, action: () => this.e = this.res(this.e, 5) },
      0x1AC: { cycles: 4, action: () => this.h = this.res(this.h, 5) },
      0x1AD: { cycles: 4, action: () => this.l = this.res(this.l, 5) },
      0x1AE: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.res(this.memoryMap.readByte(this.hl), 5)) },
      0x1AF: { cycles: 4, action: () => this.a = this.res(this.a, 5) },
      0x1B0: { cycles: 4, action: () => this.b = this.res(this.b, 6) },
      0x1B1: { cycles: 4, action: () => this.c = this.res(this.c, 6) },
      0x1B2: { cycles: 4, action: () => this.d = this.res(this.d, 6) },
      0x1B3: { cycles: 4, action: () => this.e = this.res(this.e, 6) },
      0x1B4: { cycles: 4, action: () => this.h = this.res(this.h, 6) },
      0x1B5: { cycles: 4, action: () => this.l = this.res(this.l, 6) },
      0x1B6: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.res(this.memoryMap.readByte(this.hl), 6)) },
      0x1B7: { cycles: 4, action: () => this.a = this.res(this.a, 6) },
      0x1B8: { cycles: 4, action: () => this.b = this.res(this.b, 7) },
      0x1B9: { cycles: 4, action: () => this.c = this.res(this.c, 7) },
      0x1BA: { cycles: 4, action: () => this.d = this.res(this.d, 7) },
      0x1BB: { cycles: 4, action: () => this.e = this.res(this.e, 7) },
      0x1BC: { cycles: 4, action: () => this.h = this.res(this.h, 7) },
      0x1BD: { cycles: 4, action: () => this.l = this.res(this.l, 7) },
      0x1BE: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.res(this.memoryMap.readByte(this.hl), 7)) },
      0x1BF: { cycles: 4, action: () => this.a = this.res(this.a, 7) },
      0x1C0: { cycles: 4, action: () => this.b = this.set(this.b, 0) },
      0x1C1: { cycles: 4, action: () => this.c = this.set(this.c, 0) },
      0x1C2: { cycles: 4, action: () => this.d = this.set(this.d, 0) },
      0x1C3: { cycles: 4, action: () => this.e = this.set(this.e, 0) },
      0x1C4: { cycles: 4, action: () => this.h = this.set(this.h, 0) },
      0x1C5: { cycles: 4, action: () => this.l = this.set(this.l, 0) },
      0x1C6: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.set(this.memoryMap.readByte(this.hl), 0)) },
      0x1C7: { cycles: 4, action: () => this.a = this.set(this.a, 0) },
      0x1C8: { cycles: 4, action: () => this.b = this.set(this.b, 1) },
      0x1C9: { cycles: 4, action: () => this.c = this.set(this.c, 1) },
      0x1CA: { cycles: 4, action: () => this.d = this.set(this.d, 1) },
      0x1CB: { cycles: 4, action: () => this.e = this.set(this.e, 1) },
      0x1CC: { cycles: 4, action: () => this.h = this.set(this.h, 1) },
      0x1CD: { cycles: 4, action: () => this.l = this.set(this.l, 1) },
      0x1CE: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.set(this.memoryMap.readByte(this.hl), 1)) },
      0x1CF: { cycles: 4, action: () => this.a = this.set(this.a, 1) },
      0x1D0: { cycles: 4, action: () => this.b = this.set(this.b, 2) },
      0x1D1: { cycles: 4, action: () => this.c = this.set(this.c, 2) },
      0x1D2: { cycles: 4, action: () => this.d = this.set(this.d, 2) },
      0x1D3: { cycles: 4, action: () => this.e = this.set(this.e, 2) },
      0x1D4: { cycles: 4, action: () => this.h = this.set(this.h, 2) },
      0x1D5: { cycles: 4, action: () => this.l = this.set(this.l, 2) },
      0x1D6: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.set(this.memoryMap.readByte(this.hl), 2)) },
      0x1D7: { cycles: 4, action: () => this.a = this.set(this.a, 2) },
      0x1D8: { cycles: 4, action: () => this.b = this.set(this.b, 3) },
      0x1D9: { cycles: 4, action: () => this.c = this.set(this.c, 3) },
      0x1DA: { cycles: 4, action: () => this.d = this.set(this.d, 3) },
      0x1DB: { cycles: 4, action: () => this.e = this.set(this.e, 3) },
      0x1DC: { cycles: 4, action: () => this.h = this.set(this.h, 3) },
      0x1DD: { cycles: 4, action: () => this.l = this.set(this.l, 3) },
      0x1DE: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.set(this.memoryMap.readByte(this.hl), 3)) },
      0x1DF: { cycles: 4, action: () => this.a = this.set(this.a, 3) },
      0x1E0: { cycles: 4, action: () => this.b = this.set(this.b, 4) },
      0x1E1: { cycles: 4, action: () => this.c = this.set(this.c, 4) },
      0x1E2: { cycles: 4, action: () => this.d = this.set(this.d, 4) },
      0x1E3: { cycles: 4, action: () => this.e = this.set(this.e, 4) },
      0x1E4: { cycles: 4, action: () => this.h = this.set(this.h, 4) },
      0x1E5: { cycles: 4, action: () => this.l = this.set(this.l, 4) },
      0x1E6: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.set(this.memoryMap.readByte(this.hl), 4)) },
      0x1E7: { cycles: 4, action: () => this.a = this.set(this.a, 4) },
      0x1E8: { cycles: 4, action: () => this.b = this.set(this.b, 5) },
      0x1E9: { cycles: 4, action: () => this.c = this.set(this.c, 5) },
      0x1EA: { cycles: 4, action: () => this.d = this.set(this.d, 5) },
      0x1EB: { cycles: 4, action: () => this.e = this.set(this.e, 5) },
      0x1EC: { cycles: 4, action: () => this.h = this.set(this.h, 5) },
      0x1ED: { cycles: 4, action: () => this.l = this.set(this.l, 5) },
      0x1EE: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.set(this.memoryMap.readByte(this.hl), 5)) },
      0x1EF: { cycles: 4, action: () => this.a = this.set(this.a, 5) },
      0x1F0: { cycles: 4, action: () => this.b = this.set(this.b, 6) },
      0x1F1: { cycles: 4, action: () => this.c = this.set(this.c, 6) },
      0x1F2: { cycles: 4, action: () => this.d = this.set(this.d, 6) },
      0x1F3: { cycles: 4, action: () => this.e = this.set(this.e, 6) },
      0x1F4: { cycles: 4, action: () => this.h = this.set(this.h, 6) },
      0x1F5: { cycles: 4, action: () => this.l = this.set(this.l, 6) },
      0x1F6: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.set(this.memoryMap.readByte(this.hl), 6)) },
      0x1F7: { cycles: 4, action: () => this.a = this.set(this.a, 6) },
      0x1F8: { cycles: 4, action: () => this.b = this.set(this.b, 7) },
      0x1F9: { cycles: 4, action: () => this.c = this.set(this.c, 7) },
      0x1FA: { cycles: 4, action: () => this.d = this.set(this.d, 7) },
      0x1FB: { cycles: 4, action: () => this.e = this.set(this.e, 7) },
      0x1FC: { cycles: 4, action: () => this.h = this.set(this.h, 7) },
      0x1FD: { cycles: 4, action: () => this.l = this.set(this.l, 7) },
      0x1FE: { cycles: 12, action: () => this.memoryMap.writeByte(this.hl, this.set(this.memoryMap.readByte(this.hl), 7)) },
      0x1FF: { cycles: 4, action: () => this.a = this.set(this.a, 7) },
    }
  }
}

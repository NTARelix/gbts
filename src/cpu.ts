import { MemoryMap } from './memory-map'
import { IOperation } from './operation'
import { toHex } from './to-hex'

const FLAG_ZERO = 0b10000000
const FLAG_SUBTRACT = 0b01000000
const FLAG_HALF_CARRY = 0b00100000
const FLAG_CARRY = 0b00010000

export class Cpu {
  private readonly memoryMap: MemoryMap
  private readonly byteView: Uint8Array
  private readonly wordView: Uint16Array
  private readonly operations: IOperation[]
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
    if (!operation.action) { throw new Error(`Unimplemented opcode ${toHex(opcode)}: ${JSON.stringify(operation)}`) }
    this.pc += 1
    operation.action()
    this.totalCycles += operation.cycles
  }

  private getOperationMap(): IOperation[] {
    return [
      // tslint:disable-next-line:no-empty
      { cycles: 4, name: '0x00_NOP', action: () => {} },
      { cycles: 0, name: '0x01', action: null },
      { cycles: 0, name: '0x02', action: null },
      { cycles: 0, name: '0x03', action: null },
      { cycles: 0, name: '0x04', action: null },
      { cycles: 0, name: '0x05', action: null },
      { cycles: 8, name: '0x06_LD_B_N', action: () => this.b = this.memoryMap.readByte(this.pc++) },
      { cycles: 0, name: '0x07', action: null },
      { cycles: 0, name: '0x08', action: null },
      { cycles: 0, name: '0x09', action: null },
      { cycles: 0, name: '0x0A', action: null },
      { cycles: 0, name: '0x0B', action: null },
      { cycles: 0, name: '0x0C', action: null },
      { cycles: 0, name: '0x0D', action: null },
      { cycles: 8, name: '0x0E_LD_C_N', action: () => this.c = this.memoryMap.readByte(this.pc++) },
      { cycles: 0, name: '0x0F', action: null },
      { cycles: 0, name: '0x10', action: null },
      { cycles: 0, name: '0x11', action: null },
      { cycles: 0, name: '0x12', action: null },
      { cycles: 0, name: '0x13', action: null },
      { cycles: 0, name: '0x14', action: null },
      { cycles: 0, name: '0x15', action: null },
      { cycles: 0, name: '0x16', action: null },
      { cycles: 0, name: '0x17', action: null },
      { cycles: 0, name: '0x18', action: null },
      { cycles: 0, name: '0x19', action: null },
      { cycles: 0, name: '0x1A', action: null },
      { cycles: 0, name: '0x1B', action: null },
      { cycles: 0, name: '0x1C', action: null },
      { cycles: 0, name: '0x1D', action: null },
      { cycles: 0, name: '0x1E', action: null },
      { cycles: 0, name: '0x1F', action: null },
      { cycles: 0, name: '0x20', action: null },
      {
        cycles: 12,
        name: '0x21_LD_HL_NN',
        action: () => {
          this.hl = this.memoryMap.readWord(this.pc)
          this.pc += 2
        },
      },
      { cycles: 0, name: '0x22', action: null },
      { cycles: 0, name: '0x23', action: null },
      { cycles: 0, name: '0x24', action: null },
      { cycles: 0, name: '0x25', action: null },
      { cycles: 0, name: '0x26', action: null },
      { cycles: 0, name: '0x27', action: null },
      { cycles: 0, name: '0x28', action: null },
      { cycles: 0, name: '0x29', action: null },
      { cycles: 0, name: '0x2A', action: null },
      { cycles: 0, name: '0x2B', action: null },
      { cycles: 0, name: '0x2C', action: null },
      { cycles: 0, name: '0x2D', action: null },
      { cycles: 0, name: '0x2E', action: null },
      { cycles: 0, name: '0x2F', action: null },
      { cycles: 0, name: '0x30', action: null },
      { cycles: 0, name: '0x31', action: null },
      { cycles: 0, name: '0x32_LD_HL_A', action: () => this.memoryMap.writeByte(this.hl, this.a) },
      { cycles: 0, name: '0x33', action: null },
      { cycles: 0, name: '0x34', action: null },
      { cycles: 0, name: '0x35', action: null },
      { cycles: 0, name: '0x36', action: null },
      { cycles: 0, name: '0x37', action: null },
      { cycles: 0, name: '0x38', action: null },
      { cycles: 0, name: '0x39', action: null },
      { cycles: 0, name: '0x3A', action: null },
      { cycles: 0, name: '0x3B', action: null },
      { cycles: 0, name: '0x3C', action: null },
      { cycles: 0, name: '0x3D', action: null },
      { cycles: 0, name: '0x3E', action: null },
      { cycles: 0, name: '0x3F', action: null },
      { cycles: 0, name: '0x40', action: null },
      { cycles: 0, name: '0x41', action: null },
      { cycles: 0, name: '0x42', action: null },
      { cycles: 0, name: '0x43', action: null },
      { cycles: 0, name: '0x44', action: null },
      { cycles: 0, name: '0x45', action: null },
      { cycles: 0, name: '0x46', action: null },
      { cycles: 0, name: '0x47', action: null },
      { cycles: 0, name: '0x48', action: null },
      { cycles: 0, name: '0x49', action: null },
      { cycles: 0, name: '0x4A', action: null },
      { cycles: 0, name: '0x4B', action: null },
      { cycles: 0, name: '0x4C', action: null },
      { cycles: 0, name: '0x4D', action: null },
      { cycles: 0, name: '0x4E', action: null },
      { cycles: 0, name: '0x4F', action: null },
      { cycles: 0, name: '0x50', action: null },
      { cycles: 0, name: '0x51', action: null },
      { cycles: 0, name: '0x52', action: null },
      { cycles: 0, name: '0x53', action: null },
      { cycles: 0, name: '0x54', action: null },
      { cycles: 0, name: '0x55', action: null },
      { cycles: 0, name: '0x56', action: null },
      { cycles: 0, name: '0x57', action: null },
      { cycles: 0, name: '0x58', action: null },
      { cycles: 0, name: '0x59', action: null },
      { cycles: 0, name: '0x5A', action: null },
      { cycles: 0, name: '0x5B', action: null },
      { cycles: 0, name: '0x5C', action: null },
      { cycles: 0, name: '0x5D', action: null },
      { cycles: 0, name: '0x5E', action: null },
      { cycles: 0, name: '0x5F', action: null },
      { cycles: 0, name: '0x60', action: null },
      { cycles: 0, name: '0x61', action: null },
      { cycles: 0, name: '0x62', action: null },
      { cycles: 0, name: '0x63', action: null },
      { cycles: 0, name: '0x64', action: null },
      { cycles: 0, name: '0x65', action: null },
      { cycles: 0, name: '0x66', action: null },
      { cycles: 0, name: '0x67', action: null },
      { cycles: 0, name: '0x68', action: null },
      { cycles: 0, name: '0x69', action: null },
      { cycles: 0, name: '0x6A', action: null },
      { cycles: 0, name: '0x6B', action: null },
      { cycles: 0, name: '0x6C', action: null },
      { cycles: 0, name: '0x6D', action: null },
      { cycles: 0, name: '0x6E', action: null },
      { cycles: 0, name: '0x6F', action: null },
      { cycles: 0, name: '0x70', action: null },
      { cycles: 0, name: '0x71', action: null },
      { cycles: 0, name: '0x72', action: null },
      { cycles: 0, name: '0x73', action: null },
      { cycles: 0, name: '0x74', action: null },
      { cycles: 0, name: '0x75', action: null },
      { cycles: 0, name: '0x76', action: null },
      { cycles: 0, name: '0x77', action: null },
      { cycles: 0, name: '0x78', action: null },
      { cycles: 0, name: '0x79', action: null },
      { cycles: 0, name: '0x7A', action: null },
      { cycles: 0, name: '0x7B', action: null },
      { cycles: 0, name: '0x7C', action: null },
      { cycles: 0, name: '0x7D', action: null },
      { cycles: 0, name: '0x7E', action: null },
      { cycles: 0, name: '0x7F', action: null },
      { cycles: 0, name: '0x80', action: null },
      { cycles: 0, name: '0x81', action: null },
      { cycles: 0, name: '0x82', action: null },
      { cycles: 0, name: '0x83', action: null },
      { cycles: 0, name: '0x84', action: null },
      { cycles: 0, name: '0x85', action: null },
      { cycles: 0, name: '0x86', action: null },
      { cycles: 0, name: '0x87', action: null },
      { cycles: 0, name: '0x88', action: null },
      { cycles: 0, name: '0x89', action: null },
      { cycles: 0, name: '0x8A', action: null },
      { cycles: 0, name: '0x8B', action: null },
      { cycles: 0, name: '0x8C', action: null },
      { cycles: 0, name: '0x8D', action: null },
      { cycles: 0, name: '0x8E', action: null },
      { cycles: 0, name: '0x8F', action: null },
      { cycles: 0, name: '0x90', action: null },
      { cycles: 0, name: '0x91', action: null },
      { cycles: 0, name: '0x92', action: null },
      { cycles: 0, name: '0x93', action: null },
      { cycles: 0, name: '0x94', action: null },
      { cycles: 0, name: '0x95', action: null },
      { cycles: 0, name: '0x96', action: null },
      { cycles: 0, name: '0x97', action: null },
      { cycles: 0, name: '0x98', action: null },
      { cycles: 0, name: '0x99', action: null },
      { cycles: 0, name: '0x9A', action: null },
      { cycles: 0, name: '0x9B', action: null },
      { cycles: 0, name: '0x9C', action: null },
      { cycles: 0, name: '0x9D', action: null },
      { cycles: 0, name: '0x9E', action: null },
      { cycles: 0, name: '0x9F', action: null },
      { cycles: 0, name: '0xA0', action: null },
      { cycles: 0, name: '0xA1', action: null },
      { cycles: 0, name: '0xA2', action: null },
      { cycles: 0, name: '0xA3', action: null },
      { cycles: 0, name: '0xA4', action: null },
      { cycles: 0, name: '0xA5', action: null },
      { cycles: 0, name: '0xA6', action: null },
      { cycles: 0, name: '0xA7', action: null },
      { cycles: 0, name: '0xA8', action: null },
      { cycles: 0, name: '0xA9', action: null },
      { cycles: 0, name: '0xAA', action: null },
      { cycles: 0, name: '0xAB', action: null },
      { cycles: 0, name: '0xAC', action: null },
      { cycles: 0, name: '0xAD', action: null },
      { cycles: 0, name: '0xAE', action: null },
      {
        cycles: 4,
        name: '0xAF_XOR_A',
        action: () => {
          this.a = this.a ^ this.a
          this.f = (+(!!this.a) & FLAG_ZERO)
        },
      },
      { cycles: 0, name: '0xB0', action: null },
      { cycles: 0, name: '0xB1', action: null },
      { cycles: 0, name: '0xB2', action: null },
      { cycles: 0, name: '0xB3', action: null },
      { cycles: 0, name: '0xB4', action: null },
      { cycles: 0, name: '0xB5', action: null },
      { cycles: 0, name: '0xB6', action: null },
      { cycles: 0, name: '0xB7', action: null },
      { cycles: 0, name: '0xB8', action: null },
      { cycles: 0, name: '0xB9', action: null },
      { cycles: 0, name: '0xBA', action: null },
      { cycles: 0, name: '0xBB', action: null },
      { cycles: 0, name: '0xBC', action: null },
      { cycles: 0, name: '0xBD', action: null },
      { cycles: 0, name: '0xBE', action: null },
      { cycles: 0, name: '0xBF', action: null },
      { cycles: 0, name: '0xC0', action: null },
      { cycles: 0, name: '0xC1', action: null },
      { cycles: 0, name: '0xC2', action: null },
      { cycles: 0, name: '0xC3_JP_NN', action: () => this.pc = this.memoryMap.readWord(this.pc) },
      { cycles: 0, name: '0xC4', action: null },
      { cycles: 0, name: '0xC5', action: null },
      { cycles: 0, name: '0xC6', action: null },
      { cycles: 0, name: '0xC7', action: null },
      { cycles: 0, name: '0xC8', action: null },
      { cycles: 0, name: '0xC9', action: null },
      { cycles: 0, name: '0xCA', action: null },
      { cycles: 0, name: '0xCB', action: null },
      { cycles: 0, name: '0xCC', action: null },
      { cycles: 0, name: '0xCD', action: null },
      { cycles: 0, name: '0xCE', action: null },
      { cycles: 0, name: '0xCF', action: null },
      { cycles: 0, name: '0xD0', action: null },
      { cycles: 0, name: '0xD1', action: null },
      { cycles: 0, name: '0xD2', action: null },
      { cycles: 0, name: '0xD3', action: null },
      { cycles: 0, name: '0xD4', action: null },
      { cycles: 0, name: '0xD5', action: null },
      { cycles: 0, name: '0xD6', action: null },
      { cycles: 0, name: '0xD7', action: null },
      { cycles: 0, name: '0xD8', action: null },
      { cycles: 0, name: '0xD9', action: null },
      { cycles: 0, name: '0xDA', action: null },
      { cycles: 0, name: '0xDB', action: null },
      { cycles: 0, name: '0xDC', action: null },
      { cycles: 0, name: '0xDD', action: null },
      { cycles: 0, name: '0xDE', action: null },
      { cycles: 0, name: '0xDF', action: null },
      { cycles: 0, name: '0xE0', action: null },
      { cycles: 0, name: '0xE1', action: null },
      { cycles: 0, name: '0xE2', action: null },
      { cycles: 0, name: '0xE3', action: null },
      { cycles: 0, name: '0xE4', action: null },
      { cycles: 0, name: '0xE5', action: null },
      { cycles: 0, name: '0xE6', action: null },
      { cycles: 0, name: '0xE7', action: null },
      { cycles: 0, name: '0xE8', action: null },
      { cycles: 0, name: '0xE9', action: null },
      { cycles: 0, name: '0xEA', action: null },
      { cycles: 0, name: '0xEB', action: null },
      { cycles: 0, name: '0xEC', action: null },
      { cycles: 0, name: '0xED', action: null },
      { cycles: 0, name: '0xEE', action: null },
      { cycles: 0, name: '0xEF', action: null },
      { cycles: 0, name: '0xF0', action: null },
      { cycles: 0, name: '0xF1', action: null },
      { cycles: 0, name: '0xF2', action: null },
      { cycles: 0, name: '0xF3', action: null },
      { cycles: 0, name: '0xF4', action: null },
      { cycles: 0, name: '0xF5', action: null },
      { cycles: 0, name: '0xF6', action: null },
      { cycles: 0, name: '0xF7', action: null },
      { cycles: 0, name: '0xF8', action: null },
      { cycles: 0, name: '0xF9', action: null },
      { cycles: 0, name: '0xFA', action: null },
      { cycles: 0, name: '0xFB', action: null },
      { cycles: 0, name: '0xFC', action: null },
      { cycles: 0, name: '0xFD', action: null },
      { cycles: 0, name: '0xFE', action: null },
      { cycles: 0, name: '0xFF', action: null },
    ]
  }
}

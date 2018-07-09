import { flagsToNum } from './flags-to-num'
import { Input } from './input'
import { toHex } from './math'

const BIT_DIRECTION_BUTTONS = 0b00010000
const BIT_STANDARD_BUTTONS = 0b00010000

export class MemoryMap {
  private readonly cartData: Uint8Array
  private readonly input: Input
  private readonly workingRam: Uint8Array
  private readonly ioRam: Uint8Array

  constructor(cart: ArrayBuffer, input: Input) {
    this.cartData = new Uint8Array(cart)
    this.input = new Input()
    this.workingRam = new Uint8Array()
    this.ioRam = new Uint8Array()
  }

  public readByte(addr: number): number {
    if (addr < 0x4000) {
      // ROM0
      return this.cartData[addr]
    } else if (addr < 0x8000) {
      // ROM Bank
      throw new Error(`R[${toHex(addr, 4)}] Banked ROM not yet implemented`)
    } else if (addr < 0xA000) {
      // VRAM
      throw new Error(`R[${toHex(addr, 4)}] VRAM not yet implemented`)
    } else if (addr < 0xC000) {
      // External RAM
      throw new Error(`R[${toHex(addr, 4)}] External RAM not yet implemented`)
    } else if (addr < 0xE000) {
      // Working RAM
      throw new Error(`R[${toHex(addr, 4)}] Working RAM not yet implemented`)
    } else if (addr < 0xFE00) {
      // Working RAM mirror
      throw new Error(`R[${toHex(addr, 4)}] Working RAM mirror not yet implemented`)
    } else if (addr < 0xFF00) {
      // Object Attribute Memory (OAM)
      throw new Error(`R[${toHex(addr, 4)}] OAM not yet implemented`)
    } else if (addr === 0xFF00) {
      // Joypad
      const joypadFlags = this.ioRam[addr - 0xFF00]
      const isCheckingDirection = joypadFlags & BIT_DIRECTION_BUTTONS
      const isCheckingStandard = joypadFlags & BIT_STANDARD_BUTTONS
      return flagsToNum(
        1,
        1,
        isCheckingDirection,
        isCheckingStandard,
        (isCheckingDirection && this.input.down) || (isCheckingStandard && this.input.start),
        (isCheckingDirection && this.input.up) || (isCheckingStandard && this.input.select),
        (isCheckingDirection && this.input.left) || (isCheckingStandard && this.input.b),
        (isCheckingDirection && this.input.right) || (isCheckingStandard && this.input.a),
      )
    } else if (addr < 0xFF80) {
      // Memory-mapped I/O
      throw new Error(`R[${toHex(addr, 4)}] Memory-mapped I/O not yet implemented`)
    } else if (addr <= 0xFFFF) {
      // Zero-page RAM
      throw new Error(`R[${toHex(addr, 4)}] Zero-page RAM not yet implemented`)
    } else {
      throw new Error(`R[${toHex(addr, 4)}] Unmapped address space`)
    }
  }

  public readWord(addr: number): number {
    const low = this.readByte(addr)
    const high = this.readByte(addr + 1)
    const combined = (high << 8) | low
    return combined
  }

  public writeByte(addr: number, value: number): void {
    if (addr < 0x4000) {
      // ROM0
      this.cartData[addr] = value
    } else if (addr < 0x8000) {
      // ROM bank
      throw new Error(`W[${toHex(addr, 4)}] Banked ROM not yet implemented`)
    } else if (addr < 0xA000) {
      // VRAM
      throw new Error(`W[${toHex(addr, 4)}] VRAM not yet implemented`)
    } else if (addr < 0xC000) {
      // External RAM
      throw new Error(`W[${toHex(addr, 4)}] External RAM not yet implemented`)
    } else if (addr < 0xE000) {
      // Working RAM
      this.workingRam[addr] = value
    } else if (addr < 0xFE00) {
      // Working RAM mirror
      this.workingRam[addr - 0x1000] = value
    } else if (addr < 0xFF00) {
      // Object Attribute Memory (OAM)
      throw new Error(`W[${toHex(addr, 4)}] OAM not yet implemented`)
    } else if (addr < 0xFF80) {
      // Memory-mapped I/O
      this.ioRam[addr - 0xFF00] = value
    } else if (addr <= 0xFFFF) {
      // Zero-page RAM
      throw new Error(`W[${toHex(addr, 4)}] Zero-page RAM not yet implemented`)
    } else {
      throw new Error(`W[${toHex(addr, 4)}] Unmapped address space`)
    }
  }

  public writeWord(addr: number, value: number): void {
    const MASK_LOW = 0x00FF
    const MASK_HIGH = 0xFF00
    const low = value & MASK_LOW
    const high = (value & MASK_HIGH) >> 8
    this.writeByte(addr, low)
    this.writeByte(addr + 1, high)
  }

  public reset(): void {
    // TODO: zero VRAM
  }
}

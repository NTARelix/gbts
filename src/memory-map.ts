import { flagsToNum } from './flags-to-num'
import { Input } from './input'
import { toHex } from './math'

const BIT_DIRECTION_BUTTONS = 0b00100000
const BIT_STANDARD_BUTTONS = 0b00010000

const ADDR_BOOTING_FLAG = 0xFF50
const FLAG_IS_NOT_BOOTING = 0b00000001

export class MemoryMap {
  private readonly bootData: Uint8Array
  private readonly cartData: Uint8Array
  private readonly input: Input
  private readonly vRam: Uint8Array
  private readonly workingRam: Uint8Array
  private readonly ioRam: Uint8Array
  private readonly zeroPageRam: Uint8Array

  constructor(boot: ArrayBuffer, cart: ArrayBuffer, input: Input) {
    this.bootData = new Uint8Array(boot)
    this.cartData = new Uint8Array(cart)
    this.input = input
    this.vRam = new Uint8Array(0xA000 - 0x8000)
    this.workingRam = new Uint8Array(0xE000 - 0xC000)
    this.ioRam = new Uint8Array(0xFF80 - 0xFF00)
    this.zeroPageRam = new Uint8Array(0x10000 - 0xFF80)
  }

  public readByte(addr: number): number {
    if (this.isBooting() && addr < 0x0100) {
      return this.bootData[addr]
    } else if (addr < 0x4000) {
      // ROM0
      return this.cartData[addr]
    } else if (addr < 0x8000) {
      // ROM Bank
      throw new Error(`R[${toHex(addr, 4)}] Banked ROM not yet implemented`)
    } else if (addr < 0xA000) {
      // VRAM
      return this.vRam[addr - 0x8000]
    } else if (addr < 0xC000) {
      // External RAM
      throw new Error(`R[${toHex(addr, 4)}] External RAM not yet implemented`)
    } else if (addr < 0xE000) {
      // Working RAM
      return this.workingRam[addr - 0xC000]
    } else if (addr < 0xFE00) {
      // Working RAM mirror
      return this.workingRam[addr - 0x2000 - 0xC000]
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
      return this.ioRam[addr - 0xFF00]
    } else if (addr <= 0xFFFF) {
      // Zero-page RAM
      return this.zeroPageRam[addr - 0xFF80]
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
      // ROM0 read-only
    } else if (addr < 0x8000) {
      // ROM bank read-only
    } else if (addr < 0xA000) {
      // VRAM
      this.vRam[addr - 0x8000] = value
    } else if (addr < 0xC000) {
      // External RAM
      throw new Error(`W[${toHex(addr, 4)}] External RAM not yet implemented`)
    } else if (addr < 0xE000) {
      // Working RAM
      this.workingRam[addr - 0xC000] = value
    } else if (addr < 0xFE00) {
      // Working RAM mirror
      this.workingRam[addr - 0x1000 - 0xC000] = value
    } else if (addr < 0xFF00) {
      // Object Attribute Memory (OAM)
      throw new Error(`W[${toHex(addr, 4)}] OAM not yet implemented`)
    } else if (addr < 0xFF80) {
      // Memory-mapped I/O
      this.ioRam[addr - 0xFF00] = value
    } else if (addr <= 0xFFFF) {
      // Zero-page RAM
      this.zeroPageRam[addr - 0xFF80] = value
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
    this.vRam.fill(0)
    this.workingRam.fill(0)
    this.ioRam.fill(0)
    this.zeroPageRam.fill(0)
  }

  private isBooting(): boolean {
    return !(this.ioRam[ADDR_BOOTING_FLAG - 0xFF00] & FLAG_IS_NOT_BOOTING)
  }
}

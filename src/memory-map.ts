import { toHex } from './math'

export class MemoryMap {
  private readonly cartData: Uint8Array
  private readonly workingRam: Uint8Array

  constructor(cart: ArrayBuffer) {
    this.cartData = new Uint8Array(cart)
    this.workingRam = new Uint8Array()
  }

  public readByte(addr: number): number {
    if (addr < 0x4000) {
      // ROM0
      return this.cartData[addr]
    } else if (addr < 0x8000) {
      // ROM1 (unbanked)
      throw new Error('ROM1 not yet implemented')
    } else if (addr < 0xA000) {
      // VRAM
      throw new Error('VRAM not yet implemented')
    } else if (addr < 0x0C000) {
      // External RAM
      throw new Error('External RAM not yet implemented')
    } else if (addr < 0xE000) {
      // Working RAM
      throw new Error('Working RAM not yet implemented')
    } else if (addr < 0xFDFF) {
      // Working RAM mirror
      throw new Error('Working RAM mirror not yet implemented')
    } else if (addr < 0xFE00) {
      // Object Attribute Memory (OAM)
      throw new Error('OAM not yet implemented')
    } else if (addr < 0xFF80) {
      // Memory-mapped I/O
      throw new Error('Memory-mapped I/O not yet implemented')
    } else if (addr <= 0xFFFF) {
      // Zero-page RAM
      throw new Error('Zero-page RAM not yet implemented')
    }
    throw new Error('Unmapped address space: ' + toHex(addr, 4))
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
      // ROM1 (unbanked)
      throw new Error('ROM1 not yet implemented')
    } else if (addr < 0xA000) {
      // VRAM
      throw new Error('VRAM not yet implemented')
    } else if (addr < 0xC000) {
      // External RAM
      throw new Error('External RAM not yet implemented')
    } else if (addr < 0xE000) {
      // Working RAM
      this.workingRam[addr] = value
    } else if (addr < 0xFDFF) {
      // Working RAM mirror
      this.workingRam[addr - 0x1000] = value
    } else if (addr < 0xFE00) {
      // Object Attribute Memory (OAM)
      throw new Error('OAM not yet implemented')
    } else if (addr < 0xFF80) {
      // Memory-mapped I/O
      throw new Error('Memory-mapped I/O not yet implemented')
    } else if (addr <= 0xFFFF) {
      // Zero-page RAM
      throw new Error('Zero-page RAM not yet implemented')
    } else {
      throw new Error('Unmapped address space: ' + toHex(addr, 4))
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

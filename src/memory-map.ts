import { toHex } from './to-hex'

export class MemoryMap {
  private readonly cartData: Uint8Array

  constructor(cart: ArrayBuffer) {
    this.cartData = new Uint8Array(cart)
  }

  public readByte(addr: number): number {
    if (addr < 0x4000) {
      return this.cartData[addr]
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
    throw new Error('Unmapped address space: ' + toHex(addr, 4))
  }

  public writeWord(addr: number, value: number): void {
    throw new Error('Method not implemented.')
  }
}

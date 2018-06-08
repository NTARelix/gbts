import { Cpu } from './cpu'
import { MemoryMap } from './memory-map'

export class Emulator {
  public readonly memoryMap: MemoryMap
  public readonly cpu: Cpu

  constructor(cartData: ArrayBuffer) {
    this.memoryMap = new MemoryMap(cartData)
    this.cpu = new Cpu(this.memoryMap)
  }

  public tick(): void {
    this.cpu.tick()
  }

  public saveState(): void {
    throw new Error('Not yet implemented')
  }

  public loadState(): void {
    throw new Error('Not yet implemented')
  }
}

import { Cpu } from './cpu'
import { Input } from './input'
import { MemoryMap } from './memory-map'

export class Emulator {
  public readonly memoryMap: MemoryMap
  public readonly cpu: Cpu

  constructor(bootData: ArrayBuffer, cartData: ArrayBuffer) {
    const input = new Input()
    this.memoryMap = new MemoryMap(bootData, cartData, input)
    this.cpu = new Cpu(this.memoryMap)
  }

  public tick(): void {
    this.cpu.tick()
  }
}

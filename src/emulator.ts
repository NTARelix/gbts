import { Cpu } from './cpu'
import { Input } from './input'
import { MemoryMap } from './memory-map'

export class Emulator {
  public readonly input: Input
  public readonly memoryMap: MemoryMap
  public readonly cpu: Cpu

  constructor(cartData: ArrayBuffer) {
    this.input = new Input()
    this.memoryMap = new MemoryMap(cartData, this.input)
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

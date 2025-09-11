import { Cpu } from './cpu'
import { Input } from './input'
import { MemoryMap } from './memory-map'

export class Emulator {
    public readonly memoryMap: MemoryMap
    public readonly cpu: Cpu

    constructor(cartData: ArrayBuffer) {
        const input = new Input()
        this.memoryMap = new MemoryMap(cartData, input)
        this.cpu = new Cpu(this.memoryMap)
        this.memoryMap.reset()
        this.cpu.reset()
    }

    public tick(): void {
        this.cpu.tick()
    }
}

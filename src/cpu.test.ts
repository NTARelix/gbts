import { Cpu } from './cpu'
import { Input } from './input'
import { MemoryMap } from './memory-map'

describe('CPU', () => {
  let cartView: Uint8Array
  let cpu: Cpu
  beforeEach(() => {
    const boot = new ArrayBuffer(0x100)
    const cart = new ArrayBuffer(0x4000)
    cartView = new Uint8Array(cart)
    const input = new Input()
    const mm = new MemoryMap(boot, cart, input)
    cpu = new Cpu(mm)
  })
  afterEach(() => {
    cartView = null
    cpu = null
  })
  describe('Registers', () => {
    const WORD = 0b1111000000001111
    const UPPER = 0b11110000
    const LOWER = 0b00001111
    test('All default to 0', () => {
      expect(cpu.af).toBe(0)
      expect(cpu.bc).toBe(0)
      expect(cpu.de).toBe(0)
      expect(cpu.hl).toBe(0)
      expect(cpu.pc).toBe(0)
      expect(cpu.sp).toBe(0)
    })
    test('AF is composed of A & F', () => {
      cpu.af = WORD
      expect(cpu.a).toBe(UPPER)
      expect(cpu.f).toBe(LOWER)
      cpu.af = 0
      expect(cpu.a).toBe(0)
      expect(cpu.f).toBe(0)
      cpu.a = UPPER
      cpu.f = LOWER
      expect(cpu.af).toBe(WORD)
    })
    test('BC is composed of B & C', () => {
      cpu.bc = WORD
      expect(cpu.b).toBe(UPPER)
      expect(cpu.c).toBe(LOWER)
      cpu.bc = 0
      expect(cpu.b).toBe(0)
      expect(cpu.c).toBe(0)
      cpu.b = UPPER
      cpu.c = LOWER
      expect(cpu.bc).toBe(WORD)
    })
    test('DE is composed of D & E', () => {
      cpu.de = WORD
      expect(cpu.d).toBe(UPPER)
      expect(cpu.e).toBe(LOWER)
      cpu.de = 0
      expect(cpu.d).toBe(0)
      expect(cpu.e).toBe(0)
      cpu.d = UPPER
      cpu.e = LOWER
      expect(cpu.de).toBe(WORD)
    })
    test('HL is composed of H & L', () => {
      cpu.hl = WORD
      expect(cpu.h).toBe(UPPER)
      expect(cpu.l).toBe(LOWER)
      cpu.hl = 0
      expect(cpu.h).toBe(0)
      expect(cpu.l).toBe(0)
      cpu.h = UPPER
      cpu.l = LOWER
      expect(cpu.hl).toBe(WORD)
    })
  })
})

import { Cpu } from './cpu'
import { Input } from './input'
import { MemoryMap } from './memory-map'

const getRegisters = (cpu: Cpu) => ({ af: cpu.af, bc: cpu.bc, de: cpu.de, hl: cpu.hl, sp: cpu.sp, pc: cpu.pc })
const DEFAULT_REGISTERS = { af: 0, bc: 0, de: 0, hl: 0, sp: 0, pc: 0 }

describe('CPU', () => {
  let bootByteView: Uint8Array
  let cpu: Cpu
  let mm: MemoryMap
  beforeEach(() => {
    const boot = new ArrayBuffer(0x100)
    bootByteView = new Uint8Array(boot)
    const cart = new ArrayBuffer(0x4000)
    const input = new Input()
    mm = new MemoryMap(boot, cart, input)
    cpu = new Cpu(mm)
  })
  afterEach(() => {
    bootByteView = null
    cpu = null
    mm = null
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
  describe('Operations', () => {
    test('0x00 NOP', () => {
      cpu.tick()
      expect(getRegisters(cpu)).toEqual({ ...DEFAULT_REGISTERS, pc: 1 })
    })
    test('0x01 LD BC,d16', () => {
      bootByteView[0] = 0x01
      bootByteView[1] = 0xFF
      bootByteView[2] = 0xEE
      cpu.tick()
      expect(getRegisters(cpu)).toEqual({ ...DEFAULT_REGISTERS, pc: 3, bc: 0xEEFF })
    })
  })
})

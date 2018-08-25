import { Cpu } from './cpu'
import { Input } from './input'
import { MemoryMap } from './memory-map'

type ReadMemoryFunc = (addr: number) => number
type WriteMemoryFunc = (addr: number, value: number) => void

describe('CPU', () => {
  let bootByteView: Uint8Array
  let cpu: Cpu
  let mm: MemoryMap
  let readByteSpy: jest.SpyInstance<ReadMemoryFunc>
  let readWordSpy: jest.SpyInstance<ReadMemoryFunc>
  let writeByteSpy: jest.SpyInstance<WriteMemoryFunc>
  let writeWordSpy: jest.SpyInstance<WriteMemoryFunc>
  beforeEach(() => {
    const boot = new ArrayBuffer(0x100)
    bootByteView = new Uint8Array(boot)
    const cart = new ArrayBuffer(0x4000)
    const input = new Input()
    mm = new MemoryMap(boot, cart, input)
    readByteSpy = jest.spyOn(mm, 'readByte')
    readWordSpy = jest.spyOn(mm, 'readWord')
    writeByteSpy = jest.spyOn(mm, 'writeByte')
    writeWordSpy = jest.spyOn(mm, 'writeWord')
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
    const getRegisters = (c: Cpu) => ({ a: c.a, f: c.f, fz: c.fz, fn: c.fn, fh: c.fh, fc: c.fc, af: c.af, b: c.b, c: c.c, bc: c.bc, d: c.d, e: c.e, de: c.de, h: c.h, l: c.l, hl: c.hl, sp: c.sp, pc: c.pc })
    const LOAD_ADDR = 0xC000
    test('0x00 - NOP', () => {
      cpu.tick()
      expect(getRegisters(cpu)).toEqual(expect.objectContaining({ pc: 0x0001 }))
    })
    test('0x01 - LD BC,d16', () => {
      bootByteView[0] = 0x01
      bootByteView[1] = 0xEF
      bootByteView[2] = 0xCD
      cpu.tick()
      expect(getRegisters(cpu)).toEqual(expect.objectContaining({ pc: 0x0003, bc: 0xCDEF }))
    })
    test('0x02 - LD (BC),A', () => {
      bootByteView[0] = 0x02
      cpu.a = 0xEF
      cpu.bc = LOAD_ADDR
      cpu.tick()
      expect(getRegisters(cpu)).toEqual(expect.objectContaining({ pc: 0x0001, a: 0xEF, bc: LOAD_ADDR }))
      expect(mm.readByte(LOAD_ADDR)).toBe(0xEF)
    })
    test('0x03 - INC BC', () => {
      bootByteView[0] = 0x03
      cpu.tick()
      expect(getRegisters(cpu)).toEqual(expect.objectContaining({ pc: 0x0001, bc: 0x0001 }))
    })
    describe('0x04 - INC B', () => {
      beforeEach(() => bootByteView[0] = 0x04)
      test('Flags: none', () => {
        cpu.tick()
        expect(getRegisters(cpu)).toEqual(expect.objectContaining({ pc: 0x0001, b: 0x01, fz: false, fn: false, fh: false, fc: false }))
      })
      test('Flags: half carry', () => {
        cpu.b = 0x0F
        cpu.tick()
        expect(getRegisters(cpu)).toEqual(expect.objectContaining({ pc: 0x0001, b: 0x10, fz: false, fn: false, fh: true, fc: false }))
      })
      test('Flags: zero', () => {
        cpu.b = 0xFF
        cpu.tick()
        expect(getRegisters(cpu)).toEqual(expect.objectContaining({ pc: 0x0001, b: 0x00, fz: true, fn: false, fh: false, fc: false }))
      })
    })
    test('0x05 - DEC B', () => {
      bootByteView[0] = 0x05
      cpu.b = 0xEF
      cpu.tick()
      expect(getRegisters(cpu)).toEqual(expect.objectContaining({ pc: 0x0001, b: 0xEE }))
    })
  })
})

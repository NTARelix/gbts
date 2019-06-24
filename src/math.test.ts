import { flagsToNum, toHex, toSigned } from './math'

describe('math', () => {
  describe('flags-to-enum', () => {
    test('Empty gives zero', () => {
      expect(flagsToNum()).toBe(0)
    })
    test('Calculates value accurately', () => {
      expect(flagsToNum(0)).toBe(0b0)
      expect(flagsToNum(1)).toBe(0b1)
      expect(flagsToNum(1, 0)).toBe(0b10)
      expect(flagsToNum(1, 0, 0)).toBe(0b100)
      expect(flagsToNum(1, 0, 0, 0)).toBe(0b1000)
      expect(flagsToNum(1, 0, 0, 1)).toBe(0b1001)
      expect(flagsToNum(1, 1, 1, 1)).toBe(0b1111)
      expect(flagsToNum(1, 1, 1, 1, 1, 1, 1, 1)).toBe(0b11111111)
      expect(flagsToNum(1, 0, 0, 0, 0, 0, 0, 0, 0)).toBe(0b100000000)
    })
  })
  describe('toHex', () => {
    test('Boundaries (with defaults)', () => {
      expect(toHex(0x0)).toBe('0x0')
      expect(toHex(0x1)).toBe('0x1')
      expect(toHex(0x9)).toBe('0x9')
      expect(toHex(0xA)).toBe('0xA')
      expect(toHex(0xF)).toBe('0xF')
      expect(toHex(0x10)).toBe('0x10')
      expect(toHex(0xFF)).toBe('0xFF')
      expect(toHex(0x100)).toBe('0x100')
      expect(toHex(0x1FFFFFFFFFFFFF)).toBe('0x1FFFFFFFFFFFFF')
    })
    test('0x prefix can be removed', () => {
      expect(toHex(255, 0, false)).toBe('FF')
    })
    test('Size works', () => {
      expect(toHex(15, 1)).toBe('0xF')
      expect(toHex(15, 2)).toBe('0x0F')
      expect(toHex(15, 20)).toBe('0x0000000000000000000F')
      expect(toHex(255, 20)).toBe('0x000000000000000000FF')
    })
  })
  describe('toSigned', () => {
    test('Positive boundaries calculated accurately', () => {
      expect(toSigned(0b00000000)).toBe(0)
      expect(toSigned(0b00000001)).toBe(1)
      expect(toSigned(0b01000000)).toBe(64)
      expect(toSigned(0b01111111)).toBe(127)
    })
    test('Negative boundaries calculated accurately', () => {
      expect(toSigned(0b10000000)).toBe(-128)
      expect(toSigned(0b10000001)).toBe(-127)
      expect(toSigned(0b11000000)).toBe(-64)
      expect(toSigned(0b11111111)).toBe(-1)
    })
  })
})

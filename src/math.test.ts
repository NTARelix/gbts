import { toHex, toSigned } from './math'

describe('math', () => {
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
})

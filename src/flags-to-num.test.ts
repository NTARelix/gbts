import { flagsToNum } from './flags-to-num'

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

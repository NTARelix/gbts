import { beforeEach, describe, expect, test } from '@jest/globals'
import { Input } from './input'
import { MemoryMap } from './memory-map'

const CART_VALUES = 2
const ADDR_JOY = 0xFF00

/* eslint-disable @stylistic/no-multi-spaces */
const JOY_BASE =       0b11000000
const JOY_TEST_DIR =   0b00100000
const JOY_TEST_STD =   0b00010000
const JOY_DOWN_START = 0b00001000
const JOY_UP_SELECT =  0b00000100
const JOY_LEFT_B =     0b00000010
const JOY_RIGHT_A =    0b00000001
/* eslint-enable @stylistic/no-multi-spaces */

type BufferMapper = (index: number) => number

function createBuffer(size: number, mapper: BufferMapper): ArrayBuffer {
    const buffer = new ArrayBuffer(size)
    const byteAccess = new Uint8Array(buffer)
    const bufferData = new Array(size).fill(0).map((_zero, index) => mapper(index))
    byteAccess.set(bufferData)
    return buffer
}

describe('MemoryMap', () => {
    let cart: ArrayBuffer
    let input: Input
    let mm: MemoryMap
    beforeEach(() => {
        cart = createBuffer(0x4000, () => CART_VALUES)
        input = new Input()
        mm = new MemoryMap(cart, input)
    })
    test('Read-only first ROM bank', () => {
        mm.writeByte(0x0100, CART_VALUES + 1)
        expect(mm.readByte(0x0100)).toBe(CART_VALUES)
        expect(mm.readByte(0x3FFF)).toBe(CART_VALUES)
    })
    test.skip('Read-only ROM banks', () => {
        throw new Error('ROM banks not yet implemented')
    })
    test('R/W VRAM', () => {
        mm.writeByte(0x8000, 0xFF)
        mm.writeByte(0x9FFF, 0xFF)
        expect(mm.readByte(0x8000)).toBe(0xFF)
        expect(mm.readByte(0x9FFF)).toBe(0xFF)
    })
    test.skip('R/W external RAM', () => {
        throw new Error('External RAM not yet implemented')
    })
    test('R/W Working RAM', () => {
        mm.writeByte(0xC000, 0xFF)
        mm.writeByte(0xDFFF, 0xFF)
        expect(mm.readByte(0xC000)).toBe(0xFF)
        expect(mm.readByte(0xDFFF)).toBe(0xFF)
    })
    test('R/W Working RAM Mirror', () => {
        mm.writeByte(0xC000, 0xFF)
        mm.writeByte(0xDDFF, 0xFF)
        expect(mm.readByte(0xE000)).toBe(0xFF)
        expect(mm.readByte(0xFDFF)).toBe(0xFF)
    })
    test.skip('R/W OAM', () => {
        throw new Error('OAM not yet implemented')
    })
    describe('R/W Joypad', () => {
        test('Defaults to no buttons pressed and no checking', () => {
            expect(mm.readByte(ADDR_JOY)).toBe(JOY_BASE)
        })
        test('Standard buttons not detected when checking for directional buttons', () => {
            input.a = true
            input.b = true
            input.start = true
            input.select = true
            mm.writeByte(ADDR_JOY, JOY_TEST_DIR)
            expect(mm.readByte(ADDR_JOY)).toBe(JOY_BASE | JOY_TEST_DIR)
        })
        test('Directional buttons not detected when checking for standard buttons', () => {
            input.up = true
            input.down = true
            input.left = true
            input.right = true
            mm.writeByte(ADDR_JOY, JOY_TEST_STD)
            expect(mm.readByte(ADDR_JOY)).toBe(JOY_BASE | JOY_TEST_STD)
        })
        test('Directional buttons detected', () => {
            input.up = true
            input.down = true
            input.left = true
            input.right = true
            mm.writeByte(ADDR_JOY, JOY_TEST_DIR)
            expect(mm.readByte(ADDR_JOY)).toBe(JOY_BASE | JOY_TEST_DIR | JOY_UP_SELECT | JOY_DOWN_START | JOY_LEFT_B | JOY_RIGHT_A)
        })
        test('Standard buttons detected', () => {
            input.a = true
            input.b = true
            input.start = true
            input.select = true
            mm.writeByte(ADDR_JOY, JOY_TEST_STD)
            expect(mm.readByte(ADDR_JOY)).toBe(JOY_BASE | JOY_TEST_STD | JOY_UP_SELECT | JOY_DOWN_START | JOY_LEFT_B | JOY_RIGHT_A)
        })
    })
    test('R/W I/O', () => {
        mm.writeByte(0xFF01, 0xFF)
        mm.writeByte(0xFF7F, 0xFF)
        expect(mm.readByte(0xFF01)).toBe(0xFF)
        expect(mm.readByte(0xFF7F)).toBe(0xFF)
    })
    test('R/W Zero page', () => {
        mm.writeByte(0xFF80, 0xFF)
        mm.writeByte(0xFFFF, 0xFF)
        expect(mm.readByte(0xFF80)).toBe(0xFF)
        expect(mm.readByte(0xFFFF)).toBe(0xFF)
    })
    test('Outside bounds throws error', () => {
        expect(() => mm.readByte(-1)).toThrow()
        expect(() => { mm.writeByte(-1, 0xFF) }).toThrow()
        expect(() => mm.readByte(0x10000)).toThrow()
        expect(() => { mm.writeByte(0x10000, 0xFF) }).toThrow()
    })
})

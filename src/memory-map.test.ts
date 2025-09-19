import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import { Input } from './input.ts'
import { MemoryMap } from './memory-map.ts'

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
    void test('Read-only first ROM bank', () => {
        mm.writeByte(0x0100, CART_VALUES + 1)
        assert.equal(mm.readByte(0x0100), CART_VALUES)
        assert.equal(mm.readByte(0x3FFF), CART_VALUES)
    })
    void test('Read-only ROM banks', { skip: true }, () => {
        throw new Error('ROM banks not yet implemented')
    })
    void test('R/W VRAM', () => {
        mm.writeByte(0x8000, 0xFF)
        mm.writeByte(0x9FFF, 0xFF)
        assert.equal(mm.readByte(0x8000), 0xFF)
        assert.equal(mm.readByte(0x9FFF), 0xFF)
    })
    void test('R/W external RAM', { skip: true }, () => {
        throw new Error('External RAM not yet implemented')
    })
    void test('R/W Working RAM', () => {
        mm.writeByte(0xC000, 0xFF)
        mm.writeByte(0xDFFF, 0xFF)
        assert.equal(mm.readByte(0xC000), 0xFF)
        assert.equal(mm.readByte(0xDFFF), 0xFF)
    })
    void test('R/W Working RAM Mirror', () => {
        mm.writeByte(0xC000, 0xFF)
        mm.writeByte(0xDDFF, 0xFF)
        assert.equal(mm.readByte(0xE000), 0xFF)
        assert.equal(mm.readByte(0xFDFF), 0xFF)
    })
    void test('R/W OAM', { skip: true }, () => {
        throw new Error('OAM not yet implemented')
    })
    describe('R/W Joypad', () => {
        void test('Defaults to no buttons pressed and no checking', () => {
            assert.equal(mm.readByte(ADDR_JOY), JOY_BASE)
        })
        void test('Standard buttons not detected when checking for directional buttons', () => {
            input.a = true
            input.b = true
            input.start = true
            input.select = true
            mm.writeByte(ADDR_JOY, JOY_TEST_DIR)
            assert.equal(mm.readByte(ADDR_JOY), JOY_BASE | JOY_TEST_DIR)
        })
        void test('Directional buttons not detected when checking for standard buttons', () => {
            input.up = true
            input.down = true
            input.left = true
            input.right = true
            mm.writeByte(ADDR_JOY, JOY_TEST_STD)
            assert.equal(mm.readByte(ADDR_JOY), JOY_BASE | JOY_TEST_STD)
        })
        void test('Directional buttons detected', () => {
            input.up = true
            input.down = true
            input.left = true
            input.right = true
            mm.writeByte(ADDR_JOY, JOY_TEST_DIR)
            assert.equal(mm.readByte(ADDR_JOY), JOY_BASE | JOY_TEST_DIR | JOY_UP_SELECT | JOY_DOWN_START | JOY_LEFT_B | JOY_RIGHT_A)
        })
        void test('Standard buttons detected', () => {
            input.a = true
            input.b = true
            input.start = true
            input.select = true
            mm.writeByte(ADDR_JOY, JOY_TEST_STD)
            assert.equal(mm.readByte(ADDR_JOY), JOY_BASE | JOY_TEST_STD | JOY_UP_SELECT | JOY_DOWN_START | JOY_LEFT_B | JOY_RIGHT_A)
        })
    })
    void test('R/W I/O', () => {
        mm.writeByte(0xFF01, 0xFF)
        mm.writeByte(0xFF7F, 0xFF)
        assert.equal(mm.readByte(0xFF01), 0xFF)
        assert.equal(mm.readByte(0xFF7F), 0xFF)
    })
    void test('R/W Zero page', () => {
        mm.writeByte(0xFF80, 0xFF)
        mm.writeByte(0xFFFF, 0xFF)
        assert.equal(mm.readByte(0xFF80), 0xFF)
        assert.equal(mm.readByte(0xFFFF), 0xFF)
    })
    void test('Outside bounds throws error', () => {
        assert.throws(() => mm.readByte(-1))
        assert.throws(() => { mm.writeByte(-1, 0xFF) })
        assert.throws(() => mm.readByte(0x10000))
        assert.throws(() => { mm.writeByte(0x10000, 0xFF) })
    })
})

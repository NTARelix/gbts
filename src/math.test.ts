import assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import { flagsToNum, toHex, toSigned } from './math.ts'

describe('math', () => {
    describe('flags-to-enum', () => {
        void test('Empty gives zero', () => {
            assert.equal(flagsToNum(), 0)
        })
        void test('Calculates value accurately', () => {
            assert.equal(flagsToNum(0), 0b0)
            assert.equal(flagsToNum(1), 0b1)
            assert.equal(flagsToNum(1, 0), 0b10)
            assert.equal(flagsToNum(1, 0, 0), 0b100)
            assert.equal(flagsToNum(1, 0, 0, 0), 0b1000)
            assert.equal(flagsToNum(1, 0, 0, 1), 0b1001)
            assert.equal(flagsToNum(1, 1, 1, 1), 0b1111)
            assert.equal(flagsToNum(1, 1, 1, 1, 1, 1, 1, 1), 0b11111111)
            assert.equal(flagsToNum(1, 0, 0, 0, 0, 0, 0, 0, 0), 0b100000000)
        })
    })
    describe('toHex', () => {
        void test('Boundaries (with defaults)', () => {
            assert.equal(toHex(0x0), '0x0')
            assert.equal(toHex(0x1), '0x1')
            assert.equal(toHex(0x9), '0x9')
            assert.equal(toHex(0xA), '0xA')
            assert.equal(toHex(0xF), '0xF')
            assert.equal(toHex(0x10), '0x10')
            assert.equal(toHex(0xFF), '0xFF')
            assert.equal(toHex(0x100), '0x100')
            assert.equal(toHex(0x1FFFFFFFFFFFFF), '0x1FFFFFFFFFFFFF')
        })
        void test('0x prefix can be removed', () => {
            assert.equal(toHex(255, 0, false), 'FF')
        })
        void test('Size works', () => {
            assert.equal(toHex(15, 1), '0xF')
            assert.equal(toHex(15, 2), '0x0F')
            assert.equal(toHex(15, 20), '0x0000000000000000000F')
            assert.equal(toHex(255, 20), '0x000000000000000000FF')
        })
    })
    describe('toSigned', () => {
        void test('Positive boundaries calculated accurately', () => {
            assert.equal(toSigned(0b00000000), 0)
            assert.equal(toSigned(0b00000001), 1)
            assert.equal(toSigned(0b01000000), 64)
            assert.equal(toSigned(0b01111111), 127)
        })
        void test('Negative boundaries calculated accurately', () => {
            assert.equal(toSigned(0b10000000), -128)
            assert.equal(toSigned(0b10000001), -127)
            assert.equal(toSigned(0b11000000), -64)
            assert.equal(toSigned(0b11111111), -1)
        })
    })
})

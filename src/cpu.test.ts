import assert from 'node:assert/strict'
import { beforeEach, describe, test } from 'node:test'
import { Cpu } from './cpu.ts'
import { Input } from './input.ts'
import { toHex } from './math.ts'
import { MemoryMap } from './memory-map.ts'

const dynamicRegisterAccessor = (cpu: Cpu, registerName: string): number => {
    switch (registerName) {
        case 'a': return cpu.a
        case 'f': return cpu.f
        case 'b': return cpu.b
        case 'c': return cpu.c
        case 'd': return cpu.d
        case 'e': return cpu.e
        case 'h': return cpu.h
        case 'l': return cpu.l
        case 'af': return cpu.af
        case 'bc': return cpu.bc
        case 'de': return cpu.de
        case 'hl': return cpu.hl
        case 'sp': return cpu.sp
        case 'pc': return cpu.pc
        default: throw new Error(`Invalid register name '${registerName}'`)
    }
}
const dynamicRegisterMutator = (cpu: Cpu, registerName: string, newValue: number): number => {
    switch (registerName) {
        case 'a': return cpu.a = newValue
        case 'f': return cpu.f = newValue
        case 'b': return cpu.b = newValue
        case 'c': return cpu.c = newValue
        case 'd': return cpu.d = newValue
        case 'e': return cpu.e = newValue
        case 'h': return cpu.h = newValue
        case 'l': return cpu.l = newValue
        case 'af': return cpu.af = newValue
        case 'bc': return cpu.bc = newValue
        case 'de': return cpu.de = newValue
        case 'hl': return cpu.hl = newValue
        case 'sp': return cpu.sp = newValue
        case 'pc': return cpu.pc = newValue
        default: throw new Error(`Invalid register name '${registerName}'`)
    }
}

describe('CPU', () => {
    let cartByteView: Uint8Array
    let cpu: Cpu
    let mm: MemoryMap
    beforeEach(() => {
        const cart = new ArrayBuffer(0x4000)
        cartByteView = new Uint8Array(cart)
        const input = new Input()
        mm = new MemoryMap(cart, input)
        cpu = new Cpu(mm)
    })
    describe('Registers', () => {
        const WORD = 0b1111000000001111
        const UPPER = 0b11110000
        const LOWER = 0b00001111
        void test('All default to 0', () => {
            assert.equal(cpu.af, 0)
            assert.equal(cpu.bc, 0)
            assert.equal(cpu.de, 0)
            assert.equal(cpu.hl, 0)
            assert.equal(cpu.pc, 0)
            assert.equal(cpu.sp, 0)
        })
        void test('AF is composed of A & F', () => {
            cpu.af = WORD
            assert.equal(cpu.a, UPPER)
            assert.equal(cpu.f, LOWER)
            cpu.af = 0
            assert.equal(cpu.a, 0)
            assert.equal(cpu.f, 0)
            cpu.a = UPPER
            cpu.f = LOWER
            assert.equal(cpu.af, WORD)
        })
        void test('BC is composed of B & C', () => {
            cpu.bc = WORD
            assert.equal(cpu.b, UPPER)
            assert.equal(cpu.c, LOWER)
            cpu.bc = 0
            assert.equal(cpu.b, 0)
            assert.equal(cpu.c, 0)
            cpu.b = UPPER
            cpu.c = LOWER
            assert.equal(cpu.bc, WORD)
        })
        void test('DE is composed of D & E', () => {
            cpu.de = WORD
            assert.equal(cpu.d, UPPER)
            assert.equal(cpu.e, LOWER)
            cpu.de = 0
            assert.equal(cpu.d, 0)
            assert.equal(cpu.e, 0)
            cpu.d = UPPER
            cpu.e = LOWER
            assert.equal(cpu.de, WORD)
        })
        void test('HL is composed of H & L', () => {
            cpu.hl = WORD
            assert.equal(cpu.h, UPPER)
            assert.equal(cpu.l, LOWER)
            cpu.hl = 0
            assert.equal(cpu.h, 0)
            assert.equal(cpu.l, 0)
            cpu.h = UPPER
            cpu.l = LOWER
            assert.equal(cpu.hl, WORD)
        })
    })
    describe('Operations', () => {
        void test('0x00 - NOP', () => {
            cpu.tick()
            assert.equal(cpu.pc, 1)
        })
        describe('LD nn,d16', () => {
            const ops = [
                { opcode: 0x01, register: 'bc' },
                { opcode: 0x11, register: 'de' },
                { opcode: 0x21, register: 'hl' },
                { opcode: 0x31, register: 'sp' },
            ]
            ops.forEach(({ opcode, register }) => {
                void test(`${toHex(opcode, 2, true)} - LD ${register.toUpperCase()},d16`, () => {
                    cartByteView[0] = opcode
                    cartByteView[1] = 0xEF
                    cartByteView[2] = 0xCD
                    cpu.tick()
                    assert.equal(cpu.pc, 3)
                    assert.equal(dynamicRegisterAccessor(cpu, register), 0xCDEF)
                })
            })
        })
        describe('LD n,d8', () => {
            const ops = [
                { opcode: 0x06, register: 'b' },
                { opcode: 0x0E, register: 'c' },
                { opcode: 0x16, register: 'd' },
                { opcode: 0x1E, register: 'e' },
                { opcode: 0x26, register: 'h' },
                { opcode: 0x2E, register: 'l' },
                { opcode: 0x3E, register: 'a' },
            ]
            ops.forEach(({ opcode, register }) => {
                void test(`${toHex(opcode, 2, true)} - LD ${register.toUpperCase()},d8`, () => {
                    cartByteView[0] = opcode
                    cartByteView[1] = 0xEF
                    cpu.tick()
                    assert.equal(cpu.pc, 2)
                    assert.equal(dynamicRegisterAccessor(cpu, register), 0xEF)
                })
            })
        })
        describe('LD (nn),n', () => {
            const ops = [
                { opcode: 0x02, target: 'bc', source: 'a' },
                { opcode: 0x12, target: 'de', source: 'a' },
                { opcode: 0x22, target: 'hl', source: 'a' },
                { opcode: 0x32, target: 'hl', source: 'a' },
                { opcode: 0x70, target: 'hl', source: 'b' },
                { opcode: 0x71, target: 'hl', source: 'c' },
                { opcode: 0x72, target: 'hl', source: 'd' },
                { opcode: 0x73, target: 'hl', source: 'e' },
                { opcode: 0x77, target: 'hl', source: 'a' },
            ]
            ops.forEach(({ opcode, target, source }) => {
                void test(`${toHex(opcode, 2, true)} - LD (${target.toUpperCase()}${opcode === 0x22 ? '+' : opcode === 0x32 ? '-' : ''}),${source.toUpperCase()}`, () => {
                    cartByteView[0] = opcode
                    dynamicRegisterMutator(cpu, target, 0xC000)
                    dynamicRegisterMutator(cpu, source, 0xEF)
                    cpu.tick()
                    assert.equal(cpu.pc, 1)
                    assert.equal(mm.readByte(0xC000), 0xEF)
                    if (opcode === 0x22) { assert.equal(cpu.hl, 0xC000 + 1) }
                    if (opcode === 0x32) { assert.equal(cpu.hl, 0xC000 - 1) }
                })
            })
            void test('0x08 - LD (a16),SP', () => {
                cartByteView[0] = 0x08
                cartByteView[1] = 0x00
                cartByteView[2] = 0xC0
                cpu.sp = 0xCDEF
                cpu.tick()
                assert.equal(cpu.pc, 3)
                assert.equal(mm.readWord(0xC000), 0xCDEF)
            })
            void test('0x74 - LD (HL),H', () => {
                cartByteView[0] = 0x74
                cpu.hl = 0xC002
                cpu.tick()
                assert.equal(cpu.pc, 1)
                assert.equal(mm.readByte(0xC002), 0xC0)
            })
            void test('0x75 - LD (HL),L', () => {
                cartByteView[0] = 0x75
                cpu.hl = 0xC002
                cpu.tick()
                assert.equal(cpu.pc, 1)
                assert.equal(mm.readByte(0xC002), 0x02)
            })
        })
        describe('INC nn', () => {
            const ops = [
                { opcode: 0x03, register: 'bc' },
                { opcode: 0x13, register: 'de' },
                { opcode: 0x23, register: 'hl' },
                { opcode: 0x33, register: 'sp' },
            ]
            ops.forEach(({ opcode, register }) => {
                void test(`${toHex(opcode, 2, true)} - INC ${register.toUpperCase()}`, () => {
                    cartByteView[0] = opcode
                    cpu.tick()
                    assert.equal(cpu.pc, 1)
                    assert.equal(dynamicRegisterAccessor(cpu, register), 1)
                })
            })
        })
        describe('INC n', () => {
            const ops = [
                { opcode: 0x04, register: 'b' },
                { opcode: 0x0C, register: 'c' },
                { opcode: 0x14, register: 'd' },
                { opcode: 0x1C, register: 'e' },
                { opcode: 0x24, register: 'h' },
                { opcode: 0x2C, register: 'l' },
                { opcode: 0x3C, register: 'a' },
            ]
            ops.forEach(({ opcode, register }) => {
                describe(`${toHex(opcode, 2, true)} - INC ${register.toUpperCase()}`, () => {
                    beforeEach(() => {
                        cartByteView[0] = opcode
                    })
                    void test('PC += 1', () => {
                        cpu.tick()
                        assert.equal(cpu.pc, 1)
                    })
                    void test(`${register.toUpperCase()} += 1`, () => {
                        cpu.tick()
                        assert.equal(dynamicRegisterAccessor(cpu, register), 1)
                    })
                    void test('Has no default flags', () => {
                        cpu.tick()
                        assert.equal(cpu.f, 0)
                    })
                    void test('Has no effect on carry flag', () => {
                        cpu.fc = true
                        cpu.tick()
                        assert.equal(cpu.fc, true)
                    })
                    void test('Overflows to 0 and sets zero flag when 0xFF', () => {
                        dynamicRegisterMutator(cpu, register, 0xFF)
                        cpu.tick()
                        assert.equal(dynamicRegisterAccessor(cpu, register), 0)
                        assert.equal(cpu.fz, true)
                    })
                    describe('Sets half-carry flag', () => {
                        const halfCarries = new Array(15)
                            .fill(0)
                            .map((_, index) => index + 1)
                            .map(index => index * 0x10 - 1)
                        halfCarries.forEach((value) => {
                            void test(`${toHex(value, 2, true)} => ${toHex((value + 1) & 0xFF, 2, true)}`, () => {
                                dynamicRegisterMutator(cpu, register, value)
                                cpu.tick()
                                assert.equal(cpu.fh, true)
                            })
                        })
                    })
                })
            })
        })
        describe('DEC n', () => {
            const ops = [
                { opcode: 0x05, register: 'b' },
                { opcode: 0x0D, register: 'c' },
                { opcode: 0x15, register: 'd' },
                { opcode: 0x1D, register: 'e' },
                { opcode: 0x25, register: 'h' },
                { opcode: 0x2D, register: 'l' },
                { opcode: 0x3D, register: 'a' },
            ]
            ops.forEach(({ opcode, register }) => {
                describe(`${toHex(opcode, 2, true)} - DEC ${register.toUpperCase()}`, () => {
                    beforeEach(() => {
                        cartByteView[0] = opcode
                    })
                    void test('PC += 1', () => {
                        cpu.tick()
                        assert.equal(cpu.pc, 1)
                    })
                    void test(`${register.toUpperCase()} -= 1`, () => {
                        dynamicRegisterMutator(cpu, register, 2)
                        cpu.tick()
                        assert.equal(dynamicRegisterAccessor(cpu, register), 1)
                    })
                    void test('Has subtraction flag by default', () => {
                        cpu.tick()
                        assert.equal(cpu.fn, true)
                    })
                    void test('Has no effect on carry flag', () => {
                        cpu.fc = true
                        cpu.tick()
                        assert.equal(cpu.fc, true)
                    })
                    void test('Overflows to 0xFF when 0', () => {
                        cpu.tick()
                        assert.equal(dynamicRegisterAccessor(cpu, register), 0xFF)
                    })
                    void test('Sets zero flag when decrementing from 1 to 0', () => {
                        dynamicRegisterMutator(cpu, register, 1)
                        cpu.tick()
                        assert.equal(cpu.fz, true)
                    })
                    describe('Sets half-carry flag', () => {
                        const halfCarries = new Array(15)
                            .fill(0)
                            .map((_, index) => index * 0x10)
                        halfCarries.forEach((value) => {
                            void test(`${toHex(value, 2, true)} => ${toHex((value - 1) & 0xFF, 2, true)}`, () => {
                                dynamicRegisterMutator(cpu, register, value)
                                cpu.tick()
                                assert.equal(cpu.fh, true)
                            })
                        })
                    })
                })
            })
        })
        describe('Rotates', () => {
            describe('0x07 - RLCA', () => {
                beforeEach(() => {
                    cartByteView[0] = 0x07
                })
                void test('PC += 1', () => {
                    cpu.tick()
                    assert.equal(cpu.pc, 1)
                })
                void test('Performs left rotation on register A', () => {
                    cpu.a = 0b01000101
                    cpu.tick()
                    assert.equal(cpu.a, 0b10001010)
                })
                void test('Has no default flags', () => {
                    cpu.tick()
                    assert.equal(cpu.f, 0)
                })
                void test('Sets carry flag', () => {
                    cpu.a = 0b10000000
                    cpu.tick()
                    assert.equal(cpu.fc, true)
                })
            })
            describe('0x0F - RRCA', () => {
                beforeEach(() => {
                    cartByteView[0] = 0x0F
                })
                void test('PC += 1', () => {
                    cpu.tick()
                    assert.equal(cpu.pc, 1)
                })
                void test('Performs right rotation on register A', () => {
                    cpu.a = 0b01000101
                    cpu.tick()
                    assert.equal(cpu.a, 0b10100010)
                })
                void test('Has no default flags', () => {
                    cpu.tick()
                    assert.equal(cpu.f, 0)
                })
                void test('Sets carry flag', () => {
                    cpu.a = 0b00000001
                    cpu.tick()
                    assert.equal(cpu.fc, true)
                })
            })
            describe('0x17 - RLA', () => {
                beforeEach(() => {
                    cartByteView[0] = 0x17
                })
                void test('PC += 1', () => {
                    cpu.tick()
                    assert.equal(cpu.pc, 1)
                })
                void test('Performs left rotation on register WITHOUT carry flag', () => {
                    cpu.a = 0b01000101
                    cpu.tick()
                    assert.equal(cpu.a, 0b10001010)
                })
                void test('Performs left rotation on register WITH carry flag', () => {
                    cpu.a = 0b01000101
                    cpu.fc = true
                    cpu.tick()
                    assert.equal(cpu.a, 0b10001011)
                })
                void test('Has no default flags', () => {
                    cpu.tick()
                    assert.equal(cpu.f, 0)
                })
                void test('Sets carry flag', () => {
                    cpu.a = 0b10000000
                    cpu.tick()
                    assert.equal(cpu.fc, true)
                })
            })
            describe('0x1F - RRA', () => {
                beforeEach(() => {
                    cartByteView[0] = 0x1F
                })
                void test('PC += 1', () => {
                    cpu.tick()
                    assert.equal(cpu.pc, 1)
                })
                void test('Performs right rotation on register WITHOUT carry flag', () => {
                    cpu.a = 0b10001010
                    cpu.tick()
                    assert.equal(cpu.a, 0b01000101)
                })
                void test('Performs right rotation on register WITH carry flag', () => {
                    cpu.a = 0b10001010
                    cpu.fc = true
                    cpu.tick()
                    assert.equal(cpu.a, 0b11000101)
                })
                void test('Has no default flags', () => {
                    cpu.tick()
                    assert.equal(cpu.f, 0)
                })
                void test('Sets carry flag', () => {
                    cpu.a = 0b00000001
                    cpu.tick()
                    assert.equal(cpu.fc, true)
                })
            })
        })
        describe('ADD HL,nn', () => {
            const ops = [
                { opcode: 0x09, register: 'bc' },
                { opcode: 0x19, register: 'de' },
                { opcode: 0x29, register: 'hl' },
                { opcode: 0x39, register: 'sp' },
            ]
            ops.forEach(({ opcode, register }) => {
                describe(`${toHex(opcode, 2, true)} - ADD HL,${register.toUpperCase()}`, () => {
                    beforeEach(() => {
                        cartByteView[0] = opcode
                    })
                    void test('PC += 1', () => {
                        cpu.tick()
                        assert.equal(cpu.pc, 1)
                    })
                    void test(`HL += ${register.toUpperCase()}`, () => {
                        cpu.hl = 2
                        if (register !== 'hl') {
                            dynamicRegisterMutator(cpu, register, 3)
                        }
                        cpu.tick()
                        assert.equal(cpu.hl, register !== 'hl' ? 5 : 4)
                    })
                    void test('Has no flags by default', () => {
                        cpu.tick()
                        assert.equal(cpu.f, 0)
                    })
                    void test('Has no effect on zero flag', () => {
                        cpu.fz = true
                        cpu.tick()
                        assert.equal(cpu.fz, true)
                    })
                    describe('Sets half-carry flag', () => {
                        if (register === 'hl') {
                            // Skip test to avoid (unnecessary?) complexity
                            return
                        }
                        const halfCarries = new Array(15)
                            .fill(0)
                            .map((_, index) => (index + 1) * 0x1000 - 1)
                        halfCarries.forEach((value) => {
                            void test(`${toHex(value, 4, true)} => ${toHex((value + 1) & 0xFFFF, 4, true)}`, () => {
                                cpu.hl = value
                                dynamicRegisterMutator(cpu, register, 1)
                                cpu.tick()
                                assert.equal(cpu.fh, true)
                            })
                        })
                    })
                })
            })
        })
        describe('LD n,(nn)', () => {
            const ops = [
                { opcode: 0x0A, target: 'a', source: 'bc' },
                { opcode: 0x1A, target: 'a', source: 'de' },
                { opcode: 0x46, target: 'b', source: 'hl' },
                { opcode: 0x4E, target: 'c', source: 'hl' },
                { opcode: 0x56, target: 'd', source: 'hl' },
                { opcode: 0x5E, target: 'e', source: 'hl' },
                { opcode: 0x66, target: 'h', source: 'hl' },
                { opcode: 0x6E, target: 'l', source: 'hl' },
                { opcode: 0x7E, target: 'a', source: 'hl' },
            ]
            ops.forEach(({ opcode, target, source }) => {
                void test(`${toHex(opcode, 2, true)} - LD ${target.toUpperCase()},(${source.toUpperCase()})`, () => {
                    cartByteView[0] = opcode
                    dynamicRegisterMutator(cpu, source, 0xC000)
                    mm.writeByte(dynamicRegisterAccessor(cpu, source), 0xEF)
                    cpu.tick()
                    assert.equal(cpu.pc, 1)
                    assert.equal(dynamicRegisterAccessor(cpu, target), 0xEF)
                })
            })
        })
        describe('DEC nn', () => {
            const ops = [
                { opcode: 0x0B, register: 'bc' },
                { opcode: 0x1B, register: 'de' },
                { opcode: 0x2B, register: 'hl' },
                { opcode: 0x3B, register: 'sp' },
            ]
            ops.forEach(({ opcode, register }) => {
                void test(`${toHex(opcode, 2, true)} - DEC ${register.toUpperCase()}`, () => {
                    cartByteView[0] = opcode
                    dynamicRegisterMutator(cpu, register, 2)
                    cpu.tick()
                    assert.equal(cpu.pc, 1)
                    assert.equal(dynamicRegisterAccessor(cpu, register), 1)
                })
            })
        })
        void test('0x10 - STOP', () => {
            cartByteView[0] = 0x10
            cpu.tick()
            assert.equal(cpu.pc, 2)
            cpu.tick()
            assert.equal(cpu.pc, 2)
        })
    })
})

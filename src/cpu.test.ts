import { beforeEach, describe, expect, test } from '@jest/globals'
import { Cpu } from './cpu'
import { Input } from './input'
import { toHex } from './math'
import { MemoryMap } from './memory-map'

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
        test('0x00 - NOP', () => {
            cpu.tick()
            expect(cpu.pc).toBe(1)
        })
        describe('LD nn,d16', () => {
            const ops = [
                { opcode: 0x01, register: 'bc' },
                { opcode: 0x11, register: 'de' },
                { opcode: 0x21, register: 'hl' },
                { opcode: 0x31, register: 'sp' },
            ]
            ops.forEach(({ opcode, register }) => {
                test(`${toHex(opcode, 2, true)} - LD ${register.toUpperCase()},d16`, () => {
                    cartByteView[0] = opcode
                    cartByteView[1] = 0xEF
                    cartByteView[2] = 0xCD
                    cpu.tick()
                    expect(cpu.pc).toBe(3)
                    expect(dynamicRegisterAccessor(cpu, register)).toBe(0xCDEF)
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
                test(`${toHex(opcode, 2, true)} - LD ${register.toUpperCase()},d8`, () => {
                    cartByteView[0] = opcode
                    cartByteView[1] = 0xEF
                    cpu.tick()
                    expect(cpu.pc).toBe(2)
                    expect(dynamicRegisterAccessor(cpu, register)).toBe(0xEF)
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
                test(`${toHex(opcode, 2, true)} - LD (${target.toUpperCase()}${opcode === 0x22 ? '+' : opcode === 0x32 ? '-' : ''}),${source.toUpperCase()}`, () => {
                    cartByteView[0] = opcode
                    dynamicRegisterMutator(cpu, target, 0xC000)
                    dynamicRegisterMutator(cpu, source, 0xEF)
                    cpu.tick()
                    expect(cpu.pc).toEqual(1)
                    expect(mm.readByte(0xC000)).toBe(0xEF)
                    if (opcode === 0x22) { expect(cpu.hl).toBe(0xC000 + 1) }
                    if (opcode === 0x32) { expect(cpu.hl).toBe(0xC000 - 1) }
                })
            })
            test('0x08 - LD (a16),SP', () => {
                cartByteView[0] = 0x08
                cartByteView[1] = 0x00
                cartByteView[2] = 0xC0
                cpu.sp = 0xCDEF
                cpu.tick()
                expect(cpu.pc).toBe(3)
                expect(mm.readWord(0xC000)).toBe(0xCDEF)
            })
            test('0x74 - LD (HL),H', () => {
                cartByteView[0] = 0x74
                cpu.hl = 0xC002
                cpu.tick()
                expect(cpu.pc).toBe(1)
                expect(mm.readByte(0xC002)).toBe(0xC0)
            })
            test('0x75 - LD (HL),L', () => {
                cartByteView[0] = 0x75
                cpu.hl = 0xC002
                cpu.tick()
                expect(cpu.pc).toBe(1)
                expect(mm.readByte(0xC002)).toBe(0x02)
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
                test(`${toHex(opcode, 2, true)} - INC ${register.toUpperCase()}`, () => {
                    cartByteView[0] = opcode
                    cpu.tick()
                    expect(cpu.pc).toBe(1)
                    expect(dynamicRegisterAccessor(cpu, register)).toBe(1)
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
                    test('PC += 1', () => {
                        cpu.tick()
                        expect(cpu.pc).toBe(1)
                    })
                    test(`${register.toUpperCase()} += 1`, () => {
                        cpu.tick()
                        expect(dynamicRegisterAccessor(cpu, register)).toBe(1)
                    })
                    test('Has no default flags', () => {
                        cpu.tick()
                        expect(cpu.f).toBe(0)
                    })
                    test('Has no effect on carry flag', () => {
                        cpu.fc = true
                        cpu.tick()
                        expect(cpu.fc).toBe(true)
                    })
                    test('Overflows to 0 and sets zero flag when 0xFF', () => {
                        dynamicRegisterMutator(cpu, register, 0xFF)
                        cpu.tick()
                        expect(dynamicRegisterAccessor(cpu, register)).toBe(0)
                        expect(cpu.fz).toBe(true)
                    })
                    describe('Sets half-carry flag', () => {
                        const halfCarries = new Array(15)
                            .fill(0)
                            .map((_, index) => index + 1)
                            .map(index => index * 0x10 - 1)
                        halfCarries.forEach((value) => {
                            test(`${toHex(value, 2, true)} => ${toHex((value + 1) & 0xFF, 2, true)}`, () => {
                                dynamicRegisterMutator(cpu, register, value)
                                cpu.tick()
                                expect(cpu.fh).toBe(true)
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
                    test('PC += 1', () => {
                        cpu.tick()
                        expect(cpu.pc).toBe(1)
                    })
                    test(`${register.toUpperCase()} -= 1`, () => {
                        dynamicRegisterMutator(cpu, register, 2)
                        cpu.tick()
                        expect(dynamicRegisterAccessor(cpu, register)).toBe(1)
                    })
                    test('Has subtraction flag by default', () => {
                        cpu.tick()
                        expect(cpu.fn).toBe(true)
                    })
                    test('Has no effect on carry flag', () => {
                        cpu.fc = true
                        cpu.tick()
                        expect(cpu.fc).toBe(true)
                    })
                    test('Overflows to 0xFF when 0', () => {
                        cpu.tick()
                        expect(dynamicRegisterAccessor(cpu, register)).toBe(0xFF)
                    })
                    test('Sets zero flag when decrementing from 1 to 0', () => {
                        dynamicRegisterMutator(cpu, register, 1)
                        cpu.tick()
                        expect(cpu.fz).toBe(true)
                    })
                    describe('Sets half-carry flag', () => {
                        const halfCarries = new Array(15)
                            .fill(0)
                            .map((_, index) => index * 0x10)
                        halfCarries.forEach((value) => {
                            test(`${toHex(value, 2, true)} => ${toHex((value - 1) & 0xFF, 2, true)}`, () => {
                                dynamicRegisterMutator(cpu, register, value)
                                cpu.tick()
                                expect(cpu.fh).toBe(true)
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
                test('PC += 1', () => {
                    cpu.tick()
                    expect(cpu.pc).toBe(1)
                })
                test('Performs left rotation on register A', () => {
                    cpu.a = 0b01000101
                    cpu.tick()
                    expect(cpu.a).toBe(0b10001010)
                })
                test('Has no default flags', () => {
                    cpu.tick()
                    expect(cpu.f).toBe(0)
                })
                test('Sets carry flag', () => {
                    cpu.a = 0b10000000
                    cpu.tick()
                    expect(cpu.fc).toBe(true)
                })
            })
            describe('0x0F - RRCA', () => {
                beforeEach(() => {
                    cartByteView[0] = 0x0F
                })
                test('PC += 1', () => {
                    cpu.tick()
                    expect(cpu.pc).toBe(1)
                })
                test('Performs right rotation on register A', () => {
                    cpu.a = 0b01000101
                    cpu.tick()
                    expect(cpu.a).toBe(0b10100010)
                })
                test('Has no default flags', () => {
                    cpu.tick()
                    expect(cpu.f).toBe(0)
                })
                test('Sets carry flag', () => {
                    cpu.a = 0b00000001
                    cpu.tick()
                    expect(cpu.fc).toBe(true)
                })
            })
            describe('0x17 - RLA', () => {
                beforeEach(() => {
                    cartByteView[0] = 0x17
                })
                test('PC += 1', () => {
                    cpu.tick()
                    expect(cpu.pc).toBe(1)
                })
                test('Performs left rotation on register WITHOUT carry flag', () => {
                    cpu.a = 0b01000101
                    cpu.tick()
                    expect(cpu.a).toBe(0b10001010)
                })
                test('Performs left rotation on register WITH carry flag', () => {
                    cpu.a = 0b01000101
                    cpu.fc = true
                    cpu.tick()
                    expect(cpu.a).toBe(0b10001011)
                })
                test('Has no default flags', () => {
                    cpu.tick()
                    expect(cpu.f).toBe(0)
                })
                test('Sets carry flag', () => {
                    cpu.a = 0b10000000
                    cpu.tick()
                    expect(cpu.fc).toBe(true)
                })
            })
            describe('0x1F - RRA', () => {
                beforeEach(() => {
                    cartByteView[0] = 0x1F
                })
                test('PC += 1', () => {
                    cpu.tick()
                    expect(cpu.pc).toBe(1)
                })
                test('Performs right rotation on register WITHOUT carry flag', () => {
                    cpu.a = 0b10001010
                    cpu.tick()
                    expect(cpu.a).toBe(0b01000101)
                })
                test('Performs right rotation on register WITH carry flag', () => {
                    cpu.a = 0b10001010
                    cpu.fc = true
                    cpu.tick()
                    expect(cpu.a).toBe(0b11000101)
                })
                test('Has no default flags', () => {
                    cpu.tick()
                    expect(cpu.f).toBe(0)
                })
                test('Sets carry flag', () => {
                    cpu.a = 0b00000001
                    cpu.tick()
                    expect(cpu.fc).toBe(true)
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
                    test('PC += 1', () => {
                        cpu.tick()
                        expect(cpu.pc).toBe(1)
                    })
                    test(`HL += ${register.toUpperCase()}`, () => {
                        cpu.hl = 2
                        if (register !== 'hl') {
                            dynamicRegisterMutator(cpu, register, 3)
                        }
                        cpu.tick()
                        expect(cpu.hl).toBe(register !== 'hl' ? 5 : 4)
                    })
                    test('Has no flags by default', () => {
                        cpu.tick()
                        expect(cpu.f).toBe(0)
                    })
                    test('Has no effect on zero flag', () => {
                        cpu.fz = true
                        cpu.tick()
                        expect(cpu.fz).toBe(true)
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
                            test(`${toHex(value, 4, true)} => ${toHex((value + 1) & 0xFFFF, 4, true)}`, () => {
                                cpu.hl = value
                                dynamicRegisterMutator(cpu, register, 1)
                                cpu.tick()
                                expect(cpu.fh).toBe(true)
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
                test(`${toHex(opcode, 2, true)} - LD ${target.toUpperCase()},(${source.toUpperCase()})`, () => {
                    cartByteView[0] = opcode
                    dynamicRegisterMutator(cpu, source, 0xC000)
                    mm.writeByte(dynamicRegisterAccessor(cpu, source), 0xEF)
                    cpu.tick()
                    expect(cpu.pc).toBe(1)
                    expect(dynamicRegisterAccessor(cpu, target)).toBe(0xEF)
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
                test(`${toHex(opcode, 2, true)} - DEC ${register.toUpperCase()}`, () => {
                    cartByteView[0] = opcode
                    dynamicRegisterMutator(cpu, register, 2)
                    cpu.tick()
                    expect(cpu.pc).toBe(1)
                    expect(dynamicRegisterAccessor(cpu, register)).toBe(1)
                })
            })
        })
        test('0x10 - STOP', () => {
            cartByteView[0] = 0x10
            cpu.tick()
            expect(cpu.pc).toBe(2)
            cpu.tick()
            expect(cpu.pc).toBe(2)
        })
    })
})

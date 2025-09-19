import { Input } from './input.ts'
import { flagsToNum, toHex } from './math.ts'

/* eslint-disable @stylistic/no-multi-spaces */
const BIT_DIRECTION_BUTTONS = 0b00100000
const BIT_STANDARD_BUTTONS =  0b00010000
/* eslint-enable @stylistic/no-multi-spaces */

export class MemoryMap {
    private readonly cartData: Uint8Array
    private readonly input: Input
    private readonly vRam: Uint8Array
    private readonly workingRam: Uint8Array
    private readonly ioRam: Uint8Array
    private readonly zeroPageRam: Uint8Array

    constructor(cart: ArrayBuffer, input: Input) {
        this.cartData = new Uint8Array(cart)
        this.input = input
        this.vRam = new Uint8Array(0xa000 - 0x8000)
        this.workingRam = new Uint8Array(0xe000 - 0xc000)
        this.ioRam = new Uint8Array(0xff80 - 0xff00)
        this.zeroPageRam = new Uint8Array(0x10000 - 0xff80)
    }

    public readByte(addr: number): number {
        if (addr < 0 || addr > 0xffff) {
            throw new Error(`R[${addr.toString()}] Address out of bounds`)
        } else if (addr >= 0 && addr < 0x4000) {
            // ROM0
            return this.cartData[addr]
        } else if (addr < 0x8000) {
            // ROM Bank
            throw new Error(`R[${toHex(addr, 4)}] Banked ROM not yet implemented`)
        } else if (addr < 0xa000) {
            // VRAM
            return this.vRam[addr - 0x8000]
        } else if (addr < 0xc000) {
            // External RAM
            throw new Error(`R[${toHex(addr, 4)}] External RAM not yet implemented`)
        } else if (addr < 0xe000) {
            // Working RAM
            return this.workingRam[addr - 0xc000]
        } else if (addr < 0xfe00) {
            // Working RAM mirror
            return this.workingRam[addr - 0x2000 - 0xc000]
        } else if (addr < 0xff00) {
            // Object Attribute Memory (OAM)
            throw new Error(`R[${toHex(addr, 4)}] OAM not yet implemented`)
        } else if (addr === 0xff00) {
            // Joypad
            const joypadFlags = this.ioRam[addr - 0xff00]
            const isCheckingDirection = joypadFlags & BIT_DIRECTION_BUTTONS
            const isCheckingStandard = joypadFlags & BIT_STANDARD_BUTTONS
            return flagsToNum(
                1,
                1,
                isCheckingDirection,
                isCheckingStandard,
                (isCheckingDirection && this.input.down)
                || (isCheckingStandard && this.input.start),
                (isCheckingDirection && this.input.up) || (isCheckingStandard && this.input.select),
                (isCheckingDirection && this.input.left) || (isCheckingStandard && this.input.b),
                (isCheckingDirection && this.input.right) || (isCheckingStandard && this.input.a),
            )
        } else if (addr < 0xff80) {
            // Memory-mapped I/O
            return this.ioRam[addr - 0xff00]
        } else if (addr <= 0xffff) {
            // Zero-page RAM
            return this.zeroPageRam[addr - 0xff80]
        } else {
            throw new Error(`Address '${toHex(addr, 4)}' outside of range [0x0000, 0xFFFF]`)
        }
    }

    public readWord(addr: number): number {
        const low = this.readByte(addr)
        const high = this.readByte(addr + 1)
        const combined = (high << 8) | low
        return combined
    }

    public writeByte(addr: number, value: number): void {
        if (addr < 0 || addr > 0xffff) {
            throw new Error(`W[${addr}] Address out of bounds`)
        } else if (addr < 0x4000) {
            // ROM0 read-only
        } else if (addr < 0x8000) {
            // ROM bank read-only
        } else if (addr < 0xa000) {
            // VRAM
            this.vRam[addr - 0x8000] = value
        } else if (addr < 0xc000) {
            // External RAM
            throw new Error(`W[${toHex(addr, 4)}] External RAM not yet implemented`)
        } else if (addr < 0xe000) {
            // Working RAM
            this.workingRam[addr - 0xc000] = value
        } else if (addr < 0xfe00) {
            // Working RAM mirror
            this.workingRam[addr - 0x1000 - 0xc000] = value
        } else if (addr < 0xff00) {
            // Object Attribute Memory (OAM)
            throw new Error(`W[${toHex(addr, 4)}] OAM not yet implemented`)
        } else if (addr < 0xff80) {
            // Memory-mapped I/O
            this.ioRam[addr - 0xff00] = value
        } else if (addr <= 0xffff) {
            // Zero-page RAM
            this.zeroPageRam[addr - 0xff80] = value
        } else {
            throw new Error(`Address '${toHex(addr, 4)}' outside of range [0x0000, 0xFFFF]`)
        }
    }

    public writeWord(addr: number, value: number): void {
        const MASK_LOW = 0x00ff
        const MASK_HIGH = 0xff00
        const low = value & MASK_LOW
        const high = (value & MASK_HIGH) >> 8
        this.writeByte(addr, low)
        this.writeByte(addr + 1, high)
    }

    public reset(): void {
        this.vRam.fill(0)
        this.workingRam.fill(0)
        this.ioRam.fill(0)
        this.zeroPageRam.fill(0)
        this.ioRam[0x05] = 0x00
        this.ioRam[0x06] = 0x00
        this.ioRam[0x07] = 0x00
        this.ioRam[0x10] = 0x80
        this.ioRam[0x11] = 0xbf
        this.ioRam[0x12] = 0xf3
        this.ioRam[0x14] = 0xbf
        this.ioRam[0x16] = 0x3f
        this.ioRam[0x17] = 0x00
        this.ioRam[0x19] = 0xbf
        this.ioRam[0x1a] = 0x7f
        this.ioRam[0x1b] = 0xff
        this.ioRam[0x1c] = 0x9f
        this.ioRam[0x1e] = 0xbf
        this.ioRam[0x20] = 0xff
        this.ioRam[0x21] = 0x00
        this.ioRam[0x22] = 0x00
        this.ioRam[0x23] = 0xbf
        this.ioRam[0x24] = 0x77
        this.ioRam[0x25] = 0xf3
        this.ioRam[0x26] = 0xf1
        this.ioRam[0x40] = 0x91
        this.ioRam[0x42] = 0x00
        this.ioRam[0x43] = 0x00
        this.ioRam[0x45] = 0x00
        this.ioRam[0x47] = 0xfc
        this.ioRam[0x48] = 0xff
        this.ioRam[0x49] = 0xff
        this.ioRam[0x4a] = 0x00
        this.ioRam[0x4b] = 0x00
        this.ioRam[0xff] = 0x00
    }
}

export function flagsToNum(...bits: (boolean|number)[]): number {
  if (bits.length === 0) {
    return 0
  }
  return bits
    // any => bool => 1 OR 0
    .map((bit) => +!!bit)
    // position
    .map((isBit, i, { length }) => isBit << length - i - 1)
    // concat
    .reduce((num, bitFlag) => num | bitFlag, 0)
}

export function toHex(num: number, size = 1, prefix = true): string {
  return (prefix ? '0x' : '') + num.toString(16).toUpperCase().padStart(size, '0')
}

export function toSigned(unsignedInt: number): number {
  return unsignedInt <= 127 ? unsignedInt : -(~unsignedInt & 0xFF) - 1
}

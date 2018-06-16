export function flagsToNum(...bits: any[]): number {
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

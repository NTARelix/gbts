export function toHex(num: number, size: number = 1, prefix: boolean = true): string {
  return (prefix ? '0x' : '') + num.toString(16).toUpperCase().padStart(size, '0')
}

export function toSigned(unsignedInt: number): number {
  return -(~unsignedInt & 0xFF) - 1
}

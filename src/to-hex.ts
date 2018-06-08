export function toHex(num: number, size: number = 1, prefix: boolean = true): string {
  return (prefix ? '0x' : '') + num.toString(16).toUpperCase().padStart(size, '0')
}

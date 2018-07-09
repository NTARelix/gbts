export class Input {
  public up: boolean
  public down: boolean
  public left: boolean
  public right: boolean
  public start: boolean
  public select: boolean
  public a: boolean
  public b: boolean

  constructor() {
    this.up = false
    this.down = false
    this.left = false
    this.right = false
    this.start = false
    this.select = false
    this.a = false
    this.b = false
  }
}

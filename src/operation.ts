export interface IOperation {
  cycles: number,
  name: string,
  action(): any,
}

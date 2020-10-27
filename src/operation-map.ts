import { Operation } from './operation'

export interface OperationMap {
  [name: number]: Operation | null;
}

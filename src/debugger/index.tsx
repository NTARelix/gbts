import * as React from 'react'
import { render } from 'react-dom'
import { Emulator } from '../emulator'
import { Debugger } from './debugger'

export function renderDebugger(emulator: Emulator, mountNode: HTMLElement): void {
  render(<Debugger emulator={emulator} />, mountNode)
}

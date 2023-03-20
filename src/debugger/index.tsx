import { createRoot } from 'react-dom/client'
import { Emulator } from '../emulator'
import { Debugger } from './debugger'

export function renderDebugger(emulator: Emulator, mountNode: HTMLElement): void {
  const root = createRoot(mountNode)
  root.render(<Debugger emulator={emulator} />)
}

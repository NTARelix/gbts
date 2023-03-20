import { createRoot } from 'react-dom/client'
import { Emulator } from '../emulator'
import { Root } from './root'

export function renderUi(emulator: Emulator, mountNode: HTMLElement): void {
  const root = createRoot(mountNode)
  root.render(<Root emulator={emulator} />)
}

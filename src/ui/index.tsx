import { createRoot } from 'react-dom/client'
import { Emulator } from '../emulator.ts'
import { Root } from './root.tsx'

export function renderUi(emulator: Emulator, mountNode: HTMLElement): void {
    const root = createRoot(mountNode)
    root.render(<Root emulator={emulator} />)
}

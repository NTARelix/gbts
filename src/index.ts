import { renderDebugger } from './debugger'
import { createBinaryFileInput } from './dom'
import { Emulator } from './emulator'

async function main(): Promise<void> {
  const renderNode = document.createElement('div')
  renderNode.id = 'mount'
  document.body.appendChild(renderNode)
  const cartData = await createBinaryFileInput('Cartridge', '.gb', renderNode)
  const emulator = new Emulator(cartData)
  renderDebugger(emulator, renderNode)
}

main()

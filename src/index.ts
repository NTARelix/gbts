import { debugEmulator } from './debug-emulator'
import { createBinaryFileInput } from './dom'
import { Emulator } from './emulator'

async function main() {
  const renderNode = document.createElement('div')
  document.body.appendChild(renderNode)
  const cartData = await createBinaryFileInput('Cartridge', '.gb', renderNode)
  const emulator = new Emulator(cartData)
  debugEmulator(emulator, renderNode)
}

main()

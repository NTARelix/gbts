import { debugEmulator } from './debug-emulator'
import { clearNode, createBinaryFileInput } from './dom'
import { Emulator } from './emulator'

async function main() {
  const renderNode = document.createElement('div')
  document.body.appendChild(renderNode)
  const bootData = await createBinaryFileInput('Bootrom', '.gb', renderNode)
  clearNode(renderNode)
  const cartData = await createBinaryFileInput('Cartridge', '.gb', renderNode)
  const emulator = new Emulator(bootData, cartData)
  debugEmulator(emulator, renderNode)
}

main()

import { debugEmulator } from './debug-emulator'
import { Emulator } from './emulator'
import { tick } from './tick'
import { toHex } from './to-hex'

function startEmulator(cartData: ArrayBuffer, debug: boolean): void {
  const emulator = new Emulator(cartData)
  if (!debug) {
    tick(() => emulator.tick())
  } else {
    debugEmulator(emulator, renderNode)
  }
}

const renderNode = document.createElement('div')
const fileInputNode = document.createElement('input')
fileInputNode.type = 'file'
fileInputNode.onchange = () => {
  const cartridgeFile = fileInputNode.files[0]
  if (!cartridgeFile) { return }
  const reader = new FileReader()
  reader.onload = () => startEmulator(reader.result as ArrayBuffer, true)
  reader.readAsArrayBuffer(cartridgeFile)
}
renderNode.appendChild(fileInputNode)
document.body.appendChild(renderNode)

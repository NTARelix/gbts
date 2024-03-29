import { renderUi } from './ui'
import { createBinaryFileInput } from './dom'
import { Emulator } from './emulator'

function main(): void {
  const renderNode = document.createElement('div')
  renderNode.id = 'mount'
  document.body.appendChild(renderNode)
  createBinaryFileInput('Cartridge', '.gb', renderNode)
    .then(cartData => {
      const emulator = new Emulator(cartData)
      renderUi(emulator, renderNode)
    })
    .catch(err => {
      console.error('Failed to create cartridge input:', err)
    })
}

main()

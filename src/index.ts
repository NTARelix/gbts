import { renderUi } from './ui/index.tsx'
import { createBinaryFileInput } from './dom.ts'
import { Emulator } from './emulator.ts'

function main(): void {
    const renderNode = document.createElement('div')
    renderNode.id = 'mount'
    document.body.appendChild(renderNode)
    createBinaryFileInput('Cartridge', '.gb', renderNode)
        .then((cartData) => {
            const emulator = new Emulator(cartData)
            renderUi(emulator, renderNode)
        })
        .catch((err: unknown) => {
            console.error('Failed to create cartridge input:', err)
        })
}

main()

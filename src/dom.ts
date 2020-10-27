const RECENTS_GAMES_LOCAL_STORAGE_KEY = 'RECENTS_GAMES_LOCAL_STORAGE_KEY'

function decode(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(byte => String.fromCharCode(byte))
    .join('')
}

function encode(data: string): ArrayBuffer {
  const ints = data.split('').map(byte => byte.charCodeAt(0))
  return new Uint8Array(ints).buffer
}

export function createBinaryFileInput(label: string, extensions: string, renderNode: HTMLElement): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const labelNode = document.createElement('label')
    const labelTextNode = document.createTextNode(`${label}: `)
    const inputNode = document.createElement('input')
    inputNode.type = 'file'
    inputNode.accept = extensions
    inputNode.onchange = (): void => {
      const file = inputNode?.files?.[0]
      if (!file) { return }
      const reader = new FileReader()
      reader.onload = (): void => {
        const rom = reader.result as ArrayBuffer
        localStorage.setItem(RECENTS_GAMES_LOCAL_STORAGE_KEY, decode(rom))
        resolve(rom)
      }
      reader.readAsArrayBuffer(file)
    } 
    labelNode.appendChild(labelTextNode)
    labelNode.appendChild(inputNode)
    renderNode.appendChild(labelNode)
    const romData = localStorage.getItem(RECENTS_GAMES_LOCAL_STORAGE_KEY)
    if (romData) {
      const playLastGameContainer = document.createElement('div')
      const playLastGame = document.createElement('button')
      playLastGame.innerHTML = 'Play Last Game'
      playLastGame.onclick = () => {
        const rom = encode(romData)
        resolve(rom)
      }
      playLastGameContainer.appendChild(playLastGame)
      renderNode.appendChild(playLastGameContainer)
    }
  })
}

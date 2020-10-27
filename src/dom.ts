export function clearNode(node: HTMLElement): void {
  if (!node) { return }
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

export function createBinaryFileInput(label: string, extensions: string, renderNode: HTMLElement): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const labelNode = document.createElement('label')
    const labelTextNode = document.createTextNode(`${label}: `)
    const inputNode = document.createElement('input')
    inputNode.type = 'file'
    inputNode.accept = extensions
    inputNode.onchange = (): void => {
      const file = inputNode.files[0]
      if (!file) { return }
      const reader = new FileReader()
      reader.onload = (): void => resolve(reader.result as ArrayBuffer)
      reader.readAsArrayBuffer(file)
    }
    labelNode.appendChild(labelTextNode)
    labelNode.appendChild(inputNode)
    renderNode.appendChild(labelNode)
  })
}

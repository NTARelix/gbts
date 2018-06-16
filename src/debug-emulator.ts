import { Emulator } from './emulator'
import { toHex } from './math'

function emptyNode(node: HTMLElement): void {
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
}

export function debugEmulator(emulator: Emulator, parentNode: HTMLElement): void {
  const memoryView = document.createElement('div')
  memoryView.innerHTML = `
    <table style="text-align:center">
      <thead>
        <tr>
          <th>Addr</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        ${
          new Array(20)
            .fill(0)
            .map((_, index, arr) => index - Math.floor(arr.length / 2))
            .map((offset) => emulator.cpu.pc + offset)
            .filter((addr) => addr >= 0)
            .map((addr) => `
              <tr style="${addr === emulator.cpu.pc ? 'background-color:#378b2e;color:#f6f6f6' : ''}">
                <td><pre style="margin:0">${toHex(addr, 4)}</pre></td>
                <td><pre style="margin:0">${toHex(emulator.memoryMap.readByte(addr), 2, false)}</pre></td>
              </tr>
            `)
            .join('')
        }
      </tbody>
    </table>
  `
  const registerView = document.createElement('div')
  registerView.style.position = 'fixed'
  registerView.style.left = '120px'
  registerView.style.top = '10px'
  registerView.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Register</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><pre style="margin:0">AF</pre></td>
          <td><pre style="margin:0">${toHex(emulator.cpu.af, 4)}</pre></td>
        </tr>
        <tr>
          <td><pre style="margin:0">BC</pre></td>
          <td><pre style="margin:0">${toHex(emulator.cpu.bc, 4)}</pre></td>
        </tr>
        <tr>
          <td><pre style="margin:0">DE</pre></td>
          <td><pre style="margin:0">${toHex(emulator.cpu.de, 4)}</pre></td>
        </tr>
        <tr>
          <td><pre style="margin:0">HL</pre></td>
          <td><pre style="margin:0">${toHex(emulator.cpu.hl, 4)}</pre></td>
        </tr>
        <tr>
          <td><pre style="margin:0">SP</pre></td>
          <td><pre style="margin:0">${toHex(emulator.cpu.sp, 4)}</pre></td>
        </tr>
        <tr>
          <td><pre style="margin:0">PC</pre></td>
          <td><pre style="margin:0">${toHex(emulator.cpu.pc, 4)}</pre></td>
        </tr>
      </tbody>
    </table>
  `
  const actionContainer = document.createElement('div')
  actionContainer.style.position = 'fixed'
  actionContainer.style.left = '250px'
  actionContainer.style.top = '15px'
  actionContainer.style.display = 'flex'
  actionContainer.style.flexDirection = 'column'
  const stepButton = document.createElement('button')
  stepButton.innerText = 'Step'
  stepButton.onclick = () => {
    emulator.tick()
    debugEmulator(emulator, parentNode)
  }
  const resumeButton = document.createElement('button')
  resumeButton.innerText = 'Resume'
  resumeButton.onclick = () => {
    try {
      while (
        emulator.cpu.pc !== parseInt(breakAddr.value, 16) &&
        emulator.memoryMap.readByte(emulator.cpu.pc) !== parseInt(breakOpcode.value, 16)
      ) {
        emulator.tick()
      }
    } finally {
      debugEmulator(emulator, parentNode)
    }
  }
  const breakAddr = document.createElement('input')
  breakAddr.placeholder = 'Break Address'
  const breakOpcode = document.createElement('input')
  breakOpcode.placeholder = 'Break Opcode'
  actionContainer.appendChild(stepButton)
  actionContainer.appendChild(resumeButton)
  actionContainer.appendChild(breakAddr)
  actionContainer.appendChild(breakOpcode)
  emptyNode(parentNode)
  parentNode.appendChild(memoryView)
  parentNode.appendChild(registerView)
  parentNode.appendChild(actionContainer)
}

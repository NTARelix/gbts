import * as React from 'react'
import { Emulator } from '../emulator'
import { Actions } from './actions'
import { Cpu } from './cpu'
import { Memory } from './memory'

function calculateMemoryOffset(pc: number, windowSize: number): number {
  return Math.max(0, pc - Math.floor(windowSize / 2))
}

function calculateMemoryWindow(emulator: Emulator, offset: number, windowSize: number): number[] {
  return new Array(windowSize)
    .fill(0)
    .map((_, index) => emulator.memoryMap.readByte(index + offset))
}

const MEMORY_WINDOW_SIZE = 20

export interface DebuggerProps {
  emulator: Emulator,
}

export const Debugger: React.FunctionComponent<DebuggerProps> = ({ emulator }) => {
  const [af, setAf] = React.useState(emulator.cpu.af)
  const [bc, setBc] = React.useState(emulator.cpu.bc)
  const [de, setDe] = React.useState(emulator.cpu.de)
  const [hl, setHl] = React.useState(emulator.cpu.hl)
  const [sp, setSp] = React.useState(emulator.cpu.sp)
  const [pc, setPc] = React.useState(emulator.cpu.pc)
  const [memoryOffset, setMemoryOffset] = React.useState(calculateMemoryOffset(emulator.cpu.pc, MEMORY_WINDOW_SIZE))
  const [memoryWindow, setMemoryWindow] = React.useState(calculateMemoryWindow(emulator, memoryOffset, MEMORY_WINDOW_SIZE))
  function updateState(): void {
    setAf(emulator.cpu.af)
    setBc(emulator.cpu.bc)
    setDe(emulator.cpu.de)
    setHl(emulator.cpu.hl)
    setSp(emulator.cpu.sp)
    setPc(emulator.cpu.pc)
    const newMemoryOffset = calculateMemoryOffset(emulator.cpu.pc, MEMORY_WINDOW_SIZE)
    setMemoryOffset(newMemoryOffset)
    setMemoryWindow(calculateMemoryWindow(emulator, newMemoryOffset, MEMORY_WINDOW_SIZE))
  }
  function resume(): void {
    // TODO: implement breakpoints
  }
  function step(): void {
    emulator.tick()
    updateState()
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div><Memory pc={pc} window={memoryWindow} offset={memoryOffset} /></div>
      <div><Cpu af={af} bc={bc} de={de} hl={hl} sp={sp} pc={pc} /></div>
      <div><Actions
        onStep={step}
        onResume={resume}
      /></div>
    </div>
  )
}

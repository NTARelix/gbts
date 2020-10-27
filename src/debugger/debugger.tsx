import * as React from 'react'
import styled from 'styled-components'
import { Emulator } from '../emulator'
import { Actions } from './actions'
import { Cpu } from './cpu'
import { Memory } from './memory'

function calculateMemoryWindow(emulator: Emulator, offset: number, windowSize: number): number[] {
  return new Array(windowSize)
    .fill(0)
    .map((_, index) => emulator.memoryMap.readByte(index + offset))
}

const MEMORY_WINDOW_SIZE = 20

const OuterContainer = styled.div`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: auto 200px 200px 100px;
  grid-template-rows: auto;
`

const CanvasContainer = styled.div`
  grid-column-start: 1;
  grid-column-end: 2;
  grid-row-start: 1;
  grid-row-end: 2;
`

const MemoryContainer = styled.div`
  overflow: hidden;
  grid-column-start: 2;
  grid-column-end: 3;
  grid-row-start: 1;
  grid-row-end: 2;
`

const CpuContainer = styled.div`
  overflow: hidden;
  grid-column-start: 3;
  grid-column-end: 4;
  grid-row-start: 1;
  grid-row-end: 2;
`

const ActionsContainer = styled.div`
  overflow: hidden;
  grid-column-start: 4;
  grid-column-end: 5;
  grid-row-start: 1;
  grid-row-end: 2;
`

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
  const [memoryOffset, setMemoryOffset] = React.useState(Math.max(0, emulator.cpu.pc - 4))
  const [memoryWindow, setMemoryWindow] = React.useState(calculateMemoryWindow(emulator, memoryOffset, MEMORY_WINDOW_SIZE))
  function updateState(): void {
    setAf(emulator.cpu.af)
    setBc(emulator.cpu.bc)
    setDe(emulator.cpu.de)
    setHl(emulator.cpu.hl)
    setSp(emulator.cpu.sp)
    setPc(emulator.cpu.pc)
  }
  function resume(): void {
    // TODO: implement breakpoints
  }
  function step(): void {
    emulator.tick()
    updateState()
  }
  function requestNewMemoryWindow(startAddr: number, endAddr: number): void {
    setMemoryOffset(startAddr)
    setMemoryWindow(calculateMemoryWindow(emulator, startAddr, endAddr - startAddr))
  }
  return (
    <OuterContainer>
      <CanvasContainer>
        <canvas />
      </CanvasContainer>
      <MemoryContainer>
        <Memory
          pc={pc}
          memoryWindow={memoryWindow}
          offset={memoryOffset}
          onRequestNewWindow={requestNewMemoryWindow}
        />
      </MemoryContainer>
      <CpuContainer>
        <Cpu af={af} bc={bc} de={de} hl={hl} sp={sp} pc={pc} />
      </CpuContainer>
      <ActionsContainer>
        <Actions onStep={step} onResume={resume} />
      </ActionsContainer>
    </OuterContainer>
  )
}
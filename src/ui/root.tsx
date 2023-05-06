import { FunctionComponent, useState } from 'react'
import styled from 'styled-components'
import { Emulator } from '../emulator'
import { Actions } from './actions'
import { Cpu } from './cpu'
import { Memory } from './memory'
import { useBreakpoints } from './use-breakpoints'
import { tick } from '../tick'

const CYCLES_PER_SECOND = 16384

function calculateMemoryWindow(emulator: Emulator, offset: number, windowSize: number): number[] {
  return new Array(windowSize)
    .fill(0)
    .map((_, index) => emulator.memoryMap.readByte(index + offset))
}

const MEMORY_WINDOW_SIZE = 20
const BREAKPOINT_STORAGE_KEY = 'BREAKPOINT_STORAGE'

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

export interface RootProps {
  emulator: Emulator,
}

export const Root: FunctionComponent<RootProps> = ({ emulator }) => {
  const [af, setAf] = useState(emulator.cpu.af)
  const [bc, setBc] = useState(emulator.cpu.bc)
  const [de, setDe] = useState(emulator.cpu.de)
  const [hl, setHl] = useState(emulator.cpu.hl)
  const [sp, setSp] = useState(emulator.cpu.sp)
  const [pc, setPc] = useState(emulator.cpu.pc)
  const [memoryOffset, setMemoryOffset] = useState(Math.max(0, emulator.cpu.pc - 4))
  const [memoryWindow, setMemoryWindow] = useState(calculateMemoryWindow(emulator, memoryOffset, MEMORY_WINDOW_SIZE))
  const [breakpoints, addBreakpoint, deleteBreakpoint] = useBreakpoints(BREAKPOINT_STORAGE_KEY)
  function updateState(): void {
    setAf(emulator.cpu.af)
    setBc(emulator.cpu.bc)
    setDe(emulator.cpu.de)
    setHl(emulator.cpu.hl)
    setSp(emulator.cpu.sp)
    setPc(emulator.cpu.pc)
  }
  function resume(): void {
    tick((totalTime, deltaTime) => {
      const initialCycleCount = emulator.cpu.getCycles()
      const frameEndCycle = initialCycleCount + CYCLES_PER_SECOND / 1000 * deltaTime
      while (emulator.cpu.getCycles() < frameEndCycle && !breakpoints.has(emulator.cpu.pc)) {
        emulator.tick()
      }
      const stopTicking = breakpoints.has(emulator.cpu.pc)
      if (stopTicking) {
        updateState()
      }
      return stopTicking
    })
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
          breakpoints={breakpoints}
          pc={pc}
          memoryWindow={memoryWindow}
          offset={memoryOffset}
          onAddBreakpoint={addBreakpoint}
          onDeleteBreakpoint={deleteBreakpoint}
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

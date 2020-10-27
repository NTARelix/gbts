import React, { FunctionComponent } from 'react'
import styled from 'styled-components'
import { toHex } from '../math'

interface RootProps {
  isActive: boolean,
  isBreakpoint: boolean,
}

const Root = styled.div<RootProps>`
  font-family: monospace;
  background-color: ${({ isActive, isBreakpoint }) =>
    isActive && isBreakpoint
      ? '#ff7700'
      : isActive
      ? '#378b2e'
      : isBreakpoint
      ? '#0077ff'
      : 'inherit'
  };
  color: ${({ isActive, isBreakpoint }) =>
    isActive || isBreakpoint
    ? '#f6f6f6f6'
    : 'inherit'
  };
  cursor: pointer;
  user-select: none;
`

export interface MemoryRowProps {
  children: number,
  addr: number,
  isActive?: boolean,
  isBreakpoint: boolean,
  onClick: () => void,
}

export const MemoryRow: FunctionComponent<MemoryRowProps> = ({ children, addr, isActive = false, isBreakpoint, onClick }) => (
  <Root isActive={isActive} isBreakpoint={isBreakpoint} onClick={onClick}>{toHex(addr, 4)} {toHex(children, 4)}</Root>
)

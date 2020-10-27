import React, { FunctionComponent } from 'react'
import styled from 'styled-components'
import { toHex } from '../math'

interface RootProps { isActive: boolean }
const Root = styled.div<RootProps>`
  font-family: monospace;
  background-color: ${props => props.isActive ? '#378b2e' : 'inherit'};
  color: ${props => props.isActive ? '#f6f6f6f6' : 'inherit'};
`

export interface MemoryRowProps {
  children: number,
  addr: number,
  isActive?: boolean,
}

export const MemoryRow: FunctionComponent<MemoryRowProps> = ({ children, addr, isActive = false }) => (
  <Root isActive={isActive}>{toHex(addr, 4)} {toHex(children, 4)}</Root>
)

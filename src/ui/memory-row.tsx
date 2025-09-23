import { FunctionComponent } from 'react'
import { styled } from 'styled-components'
import { toHex } from '../math.ts'

const Root = styled.div<{ $isActive: boolean, $isBreakpoint: boolean }>`
    font-family: monospace;
    background-color: ${props =>
            props.$isActive && props.$isBreakpoint
                ? '#ff7700'
                : props.$isActive
                    ? '#378b2e'
                    : props.$isBreakpoint
                        ? '#0077ff'
                        : 'inherit'
    };
    color: ${props =>
            props.$isActive || props.$isBreakpoint
                ? '#f6f6f6f6'
                : 'inherit'
    };
    cursor: pointer;
    user-select: none;
`

export interface MemoryRowProps {
    children: number
    addr: number
    isActive?: boolean
    isBreakpoint: boolean
    onClick: () => void
}

export const MemoryRow: FunctionComponent<MemoryRowProps> = ({ children, addr, isActive = false, isBreakpoint, onClick }) => (
    <Root $isActive={isActive} $isBreakpoint={isBreakpoint} onClick={onClick}>
        {toHex(addr, 4)}
        {' '}
        {toHex(children, 4)}
    </Root>
)

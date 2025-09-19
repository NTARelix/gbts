import { useEffect, useRef } from 'react'
import { styled } from 'styled-components'
import { MemoryRow } from './memory-row.tsx'

const ADDRESS_ROW_COUNT = 0xFFFF
const PIXELS_PER_ROW = 15
const PC_FOCUS_PADDING = 8

const ScrollableContainer = styled.div`
    overflow-y: scroll;
    height: 100%;
`

const AllAddressesFiller = styled.div`
    height: ${ADDRESS_ROW_COUNT * PIXELS_PER_ROW}px;
`

interface VirtualAddressRangeProps { offset: number }
const VirtualAddressRange = styled.div<VirtualAddressRangeProps>`
    position: relative;
    top: ${props => props.offset * PIXELS_PER_ROW}px
`

export interface MemoryProps {
    breakpoints: ReadonlySet<number>
    pc: number
    memoryWindow: number[]
    offset: number
    onAddBreakpoint: (breakpoint: number) => void
    onDeleteBreakpoint: (breakpoint: number) => void
    onRequestNewWindow: (startAddr: number, endAddr: number) => void
}

export const Memory: React.FunctionComponent<MemoryProps> = ({ breakpoints, pc, memoryWindow, offset, onAddBreakpoint, onDeleteBreakpoint, onRequestNewWindow }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    function requestNewWindow(): void {
        if (scrollContainerRef.current) {
            const topAddr = Math.floor(scrollContainerRef.current.scrollTop / PIXELS_PER_ROW)
            const bottomAddr = topAddr + Math.ceil(scrollContainerRef.current.clientHeight / PIXELS_PER_ROW)
            onRequestNewWindow(topAddr, bottomAddr)
        }
    }
    useEffect(() => {
    // Update virtual scrolling window when the client size changes is resized
        window.addEventListener('resize', requestNewWindow)
        return () => { window.removeEventListener('resize', requestNewWindow) }
    }, [])
    useEffect(() => {
    // Initial scroll to PC
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = offset * PIXELS_PER_ROW
        }
    }, [scrollContainerRef.current])
    useEffect(() => {
    // Focus on PC
        if (!scrollContainerRef.current) return
        if (pc < offset + 1) {
            scrollContainerRef.current.scrollTop = Math.max(0, pc - PC_FOCUS_PADDING) * PIXELS_PER_ROW
        } else if (pc > offset + memoryWindow.length - 1) {
            scrollContainerRef.current.scrollTop = Math.min(0xFFFF, pc - memoryWindow.length + PC_FOCUS_PADDING) * PIXELS_PER_ROW
        }
    }, [pc])
    return (
        <ScrollableContainer ref={scrollContainerRef} onScroll={requestNewWindow}>
            <AllAddressesFiller>
                <VirtualAddressRange offset={offset}>
                    {memoryWindow.map((value, index) => (
                        <MemoryRow
                            key={offset + index}
                            addr={offset + index}
                            isActive={pc === offset + index}
                            isBreakpoint={breakpoints.has(offset + index)}
                            onClick={() => {
                                if (breakpoints.has(offset + index))
                                    onDeleteBreakpoint(offset + index)
                                else
                                    onAddBreakpoint(offset + index)
                            }}
                        >
                            {value}
                        </MemoryRow>
                    ))}
                </VirtualAddressRange>
            </AllAddressesFiller>
        </ScrollableContainer>
    )
}

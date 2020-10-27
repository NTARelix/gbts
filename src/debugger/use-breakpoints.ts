import { useEffect, useState } from 'react'

export type AddBreakpointCallback = (breakpoint: number) => void
export type DeleteBreakpointCallback = (breakpoint: number) => void

function readPersistedBreakpoints(localStorageKey: string): ReadonlySet<number> {
  const persistedBreakpointData = localStorage.getItem(localStorageKey)
  if (persistedBreakpointData === null) return new Set()
  const persistedBreakpoints = JSON.parse(persistedBreakpointData)
  if (!Array.isArray(persistedBreakpoints)) return new Set()
  const validBreakpoints: number[] = persistedBreakpoints.filter(
    breakpoint =>
      Number.isInteger(breakpoint)
      && breakpoint >= 0
      && breakpoint <= 0xffff
  )
  return new Set(validBreakpoints)
}

export function useBreakpoints(localStorageKey: string): [ReadonlySet<number>, AddBreakpointCallback, DeleteBreakpointCallback] {
  const [breakpoints, setBreakpoints] = useState<ReadonlySet<number>>(new Set())
  useEffect(() => {
    setBreakpoints(readPersistedBreakpoints(localStorageKey))
  }, [localStorageKey])
  useEffect(() => {
    const persistedBreakpoints = readPersistedBreakpoints(localStorageKey)
    if (
      persistedBreakpoints.size === breakpoints.size
      && Array.from(breakpoints).every(breakpoint => persistedBreakpoints.has(breakpoint))
    ) return
    localStorage.setItem(localStorageKey, JSON.stringify(Array.from(breakpoints)))
  }, [breakpoints])
  return [
    new Set(breakpoints),
    breakpointToAdd => {
      const newBreakpoints = new Set(breakpoints)
      newBreakpoints.add(breakpointToAdd)
      setBreakpoints(newBreakpoints)
    },
    breakpointToDelete => {
      const newBreakpoints = new Set(breakpoints)
      newBreakpoints.delete(breakpointToDelete)
      setBreakpoints(newBreakpoints)
    }
  ]
}

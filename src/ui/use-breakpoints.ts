import { useEffect, useState } from 'react'

export type AddBreakpointCallback = (breakpoint: number) => void
export type DeleteBreakpointCallback = (breakpoint: number) => void

function isBreakpointArray(thing: unknown): thing is number[] {
  return Array.isArray(thing) && thing.every(
    item => typeof item === 'number'
      && Number.isInteger(item)
      && item >= 0
      && item <= 0xffff
  )
}

function readPersistedBreakpoints(localStorageKey: string): ReadonlySet<number> {
  const persistedBreakpointData = localStorage.getItem(localStorageKey)
  if (persistedBreakpointData === null)
    return new Set()
  const persistedBreakpoints = JSON.parse(persistedBreakpointData) as unknown
  if (isBreakpointArray(persistedBreakpoints))
    return new Set(persistedBreakpoints)
  else
    return new Set()
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

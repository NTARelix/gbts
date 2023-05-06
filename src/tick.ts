/**
 * @param totalTime cumulative time elapsed since ticker started
 * @param deltaTime amount of time elapsed since last tick; 0 on first tick
 * @returns true to stop the ticker; false to continue ticking
 */
type TickerCallback = (totalTime: number, deltaTime: number) => boolean

export function tick(cb: TickerCallback, lastTimestamp: number = Date.now(), startTime: number = Date.now()): void {
  const currentTimestamp = Date.now()
  const deltaTime = currentTimestamp - lastTimestamp
  const totalTime = currentTimestamp - startTime
  const stop = cb(totalTime, deltaTime)
  if (!stop) {
    requestAnimationFrame(() => {
      tick(cb, currentTimestamp, startTime)
    })
  }
}

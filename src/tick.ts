type TickerCallback = (totalTime: number, deltaTime: number) => void

export function tick(cb: TickerCallback, lastTimestamp: number = Date.now(), startTime: number = Date.now()) {
  const currentTimestamp = Date.now()
  const deltaTime = currentTimestamp - lastTimestamp
  const totalTime = currentTimestamp - startTime
  cb(totalTime, deltaTime)
  requestAnimationFrame(() => tick(cb, currentTimestamp, startTime))
}

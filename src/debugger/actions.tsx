import * as React from 'react'

export interface ActionsProps {
  onStep: () => void,
  onResume: () => void,
}

export const Actions: React.FunctionComponent<ActionsProps> = ({ onStep, onResume }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <button onClick={onStep}>Step</button>
    <button onClick={onResume} disabled>Resume (TODO: add breakpoints)</button>
  </div>
)

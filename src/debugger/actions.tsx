import React, { FunctionComponent } from 'react'

export interface ActionsProps {
  onStep: () => void,
  onResume: () => void,
}

export const Actions: FunctionComponent<ActionsProps> = ({ onStep, onResume }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <button onClick={onStep}>Step</button>
    <button onClick={onResume}>Resume</button>
  </div>
)

import * as React from 'react'
import { toHex } from '../math'

export interface MemoryProps {
  pc: number,
  window: number[],
  offset: number,
}

export const Memory: React.FunctionComponent<MemoryProps> = ({ pc, window, offset }) => (
  <table>
    <thead>
      <tr>
        <th>Addr</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      {
        window.map((value, index) => (
          <tr key={index + offset} style={pc === index + offset ? { backgroundColor: '#378b2e', color: '#f6f6f6' } : {}}>
            <td style={{ fontFamily: 'monospace' }}>{toHex(index + offset, 4)}</td>
            <td style={{ fontFamily: 'monospace' }}>{toHex(value, 4)}</td>
          </tr>
        ))
      }
    </tbody>
  </table>
)

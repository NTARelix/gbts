import React, { FunctionComponent } from 'react'
import { toHex } from '../math'

export interface CpuProps {
  af: number,
  bc: number,
  de: number,
  hl: number,
  sp: number,
  pc: number,
}

export const Cpu: FunctionComponent<CpuProps> = ({ af, bc, de, hl, sp, pc }) => (
  <table>
    <thead>
      <tr>
        <th>Register</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>AF</td>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>{toHex(af, 4)}</td>
      </tr>
      <tr>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>BC</td>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>{toHex(bc, 4)}</td>
      </tr>
      <tr>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>DE</td>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>{toHex(de, 4)}</td>
      </tr>
      <tr>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>HL</td>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>{toHex(hl, 4)}</td>
      </tr>
      <tr>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>SP</td>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>{toHex(sp, 4)}</td>
      </tr>
      <tr>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>PC</td>
        <td style={{ fontFamily: 'monospace', margin: 0 }}>{toHex(pc, 4)}</td>
      </tr>
    </tbody>
  </table>
)

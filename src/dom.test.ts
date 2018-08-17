import { clearNode } from './dom'

describe('dom', () => {
  describe('clearNode', () => {
    test('Silent on null target', () => {
      expect(() => clearNode(null)).not.toThrow()
    })
    test('Does nothing to empty node', () => {
      const node = window.document.createElement('div')
      expect(() => clearNode(node)).not.toThrow()
    })
    test('Removes all children from target node', () => {
      const node = window.document.createElement('div')
      node.appendChild(window.document.createElement('div'))
      node.appendChild(window.document.createElement('div'))
      node.appendChild(window.document.createElement('div'))
      expect(node.children.length).toBe(3)
      clearNode(node)
      expect(node.children.length).toBe(0)
    })
  })
})

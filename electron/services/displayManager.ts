import { screen } from 'electron'

export function isPointOnAnyDisplay(x: number, y: number): boolean {
  return screen.getAllDisplays().some((d) => {
    const b = d.bounds
    return x >= b.x && x < b.x + b.width && y >= b.y && y < b.y + b.height
  })
}

export function getPrimaryWorkArea() {
  return screen.getPrimaryDisplay().workArea
}

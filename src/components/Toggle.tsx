import type { ReactNode } from 'react'

interface ToggleProps {
  label: ReactNode
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({ label, checked, onChange }: ToggleProps): JSX.Element {
  return (
    <label className="toggle-row">
      <span className="toggle-label">{label}</span>
      <span
        className={`toggle-switch ${checked ? 'on' : ''}`}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onChange(!checked)
        }}
      >
        <span className="toggle-knob" />
      </span>
    </label>
  )
}

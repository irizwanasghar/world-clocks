import type { ClockDefinition } from '../types'

export const CLOCK_DEFINITIONS: ClockDefinition[] = [
  {
    id: 'eastern',
    label: 'Eastern Time',
    city: 'New York, NY',
    timezone: 'America/New_York',
    flagEmoji: '🇺🇸'
  },
  {
    id: 'central',
    label: 'Central Time',
    city: 'Chicago, IL',
    timezone: 'America/Chicago',
    flagEmoji: '🇺🇸'
  },
  {
    id: 'mountain',
    label: 'Mountain Time',
    city: 'Denver, CO',
    timezone: 'America/Denver',
    flagEmoji: '🇺🇸'
  },
  {
    id: 'pacific',
    label: 'Pacific Time',
    city: 'Los Angeles, CA',
    timezone: 'America/Los_Angeles',
    flagEmoji: '🇺🇸'
  },
  {
    id: 'pakistan',
    label: 'Pakistan Time',
    city: 'Karachi',
    timezone: 'Asia/Karachi',
    flagEmoji: '🇵🇰'
  }
]

export const CLOCK_MAP: Record<string, ClockDefinition> = Object.fromEntries(
  CLOCK_DEFINITIONS.map((c) => [c.id, c])
)

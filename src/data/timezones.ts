import type { ClockDefinition } from '../types'

export const CLOCK_DEFINITIONS: ClockDefinition[] = [
  {
    id: 'eastern',
    label: 'Eastern Time',
    city: 'New York, NY',
    timezone: 'America/New_York',
    countryCode: 'US'
  },
  {
    id: 'central',
    label: 'Central Time',
    city: 'Chicago, IL',
    timezone: 'America/Chicago',
    countryCode: 'US'
  },
  {
    id: 'mountain',
    label: 'Mountain Time',
    city: 'Denver, CO',
    timezone: 'America/Denver',
    countryCode: 'US'
  },
  {
    id: 'pacific',
    label: 'Pacific Time',
    city: 'Los Angeles, CA',
    timezone: 'America/Los_Angeles',
    countryCode: 'US'
  },
  {
    id: 'pakistan',
    label: 'Pakistan Time',
    city: 'Karachi',
    timezone: 'Asia/Karachi',
    countryCode: 'PK'
  }
]

export const CLOCK_MAP: Record<string, ClockDefinition> = Object.fromEntries(
  CLOCK_DEFINITIONS.map((c) => [c.id, c])
)

export type UsTimeZone = 'Eastern' | 'Central' | 'Mountain' | 'Pacific' | 'Other'

export interface UsState {
  name: string
  abbreviation: string
  zone: UsTimeZone
  timezone: string
}

const EASTERN = 'America/New_York'
const CENTRAL = 'America/Chicago'
const MOUNTAIN = 'America/Denver'
const PACIFIC = 'America/Los_Angeles'

/** Each state's predominant time zone. A few states span more than one zone
 *  (e.g. Texas has a small Mountain slice); this lists the zone that covers
 *  the majority of the state's population. Arizona observes Mountain time
 *  year-round (no DST). */
export const US_STATES: UsState[] = [
  { name: 'Alabama', abbreviation: 'AL', zone: 'Central', timezone: CENTRAL },
  { name: 'Alaska', abbreviation: 'AK', zone: 'Other', timezone: 'America/Anchorage' },
  { name: 'Arizona', abbreviation: 'AZ', zone: 'Mountain', timezone: 'America/Phoenix' },
  { name: 'Arkansas', abbreviation: 'AR', zone: 'Central', timezone: CENTRAL },
  { name: 'California', abbreviation: 'CA', zone: 'Pacific', timezone: PACIFIC },
  { name: 'Colorado', abbreviation: 'CO', zone: 'Mountain', timezone: MOUNTAIN },
  { name: 'Connecticut', abbreviation: 'CT', zone: 'Eastern', timezone: EASTERN },
  { name: 'Delaware', abbreviation: 'DE', zone: 'Eastern', timezone: EASTERN },
  { name: 'District of Columbia', abbreviation: 'DC', zone: 'Eastern', timezone: EASTERN },
  { name: 'Florida', abbreviation: 'FL', zone: 'Eastern', timezone: EASTERN },
  { name: 'Georgia', abbreviation: 'GA', zone: 'Eastern', timezone: EASTERN },
  { name: 'Hawaii', abbreviation: 'HI', zone: 'Other', timezone: 'Pacific/Honolulu' },
  { name: 'Idaho', abbreviation: 'ID', zone: 'Mountain', timezone: MOUNTAIN },
  { name: 'Illinois', abbreviation: 'IL', zone: 'Central', timezone: CENTRAL },
  { name: 'Indiana', abbreviation: 'IN', zone: 'Eastern', timezone: EASTERN },
  { name: 'Iowa', abbreviation: 'IA', zone: 'Central', timezone: CENTRAL },
  { name: 'Kansas', abbreviation: 'KS', zone: 'Central', timezone: CENTRAL },
  { name: 'Kentucky', abbreviation: 'KY', zone: 'Eastern', timezone: EASTERN },
  { name: 'Louisiana', abbreviation: 'LA', zone: 'Central', timezone: CENTRAL },
  { name: 'Maine', abbreviation: 'ME', zone: 'Eastern', timezone: EASTERN },
  { name: 'Maryland', abbreviation: 'MD', zone: 'Eastern', timezone: EASTERN },
  { name: 'Massachusetts', abbreviation: 'MA', zone: 'Eastern', timezone: EASTERN },
  { name: 'Michigan', abbreviation: 'MI', zone: 'Eastern', timezone: EASTERN },
  { name: 'Minnesota', abbreviation: 'MN', zone: 'Central', timezone: CENTRAL },
  { name: 'Mississippi', abbreviation: 'MS', zone: 'Central', timezone: CENTRAL },
  { name: 'Missouri', abbreviation: 'MO', zone: 'Central', timezone: CENTRAL },
  { name: 'Montana', abbreviation: 'MT', zone: 'Mountain', timezone: MOUNTAIN },
  { name: 'Nebraska', abbreviation: 'NE', zone: 'Central', timezone: CENTRAL },
  { name: 'Nevada', abbreviation: 'NV', zone: 'Pacific', timezone: PACIFIC },
  { name: 'New Hampshire', abbreviation: 'NH', zone: 'Eastern', timezone: EASTERN },
  { name: 'New Jersey', abbreviation: 'NJ', zone: 'Eastern', timezone: EASTERN },
  { name: 'New Mexico', abbreviation: 'NM', zone: 'Mountain', timezone: MOUNTAIN },
  { name: 'New York', abbreviation: 'NY', zone: 'Eastern', timezone: EASTERN },
  { name: 'North Carolina', abbreviation: 'NC', zone: 'Eastern', timezone: EASTERN },
  { name: 'North Dakota', abbreviation: 'ND', zone: 'Central', timezone: CENTRAL },
  { name: 'Ohio', abbreviation: 'OH', zone: 'Eastern', timezone: EASTERN },
  { name: 'Oklahoma', abbreviation: 'OK', zone: 'Central', timezone: CENTRAL },
  { name: 'Oregon', abbreviation: 'OR', zone: 'Pacific', timezone: PACIFIC },
  { name: 'Pennsylvania', abbreviation: 'PA', zone: 'Eastern', timezone: EASTERN },
  { name: 'Rhode Island', abbreviation: 'RI', zone: 'Eastern', timezone: EASTERN },
  { name: 'South Carolina', abbreviation: 'SC', zone: 'Eastern', timezone: EASTERN },
  { name: 'South Dakota', abbreviation: 'SD', zone: 'Central', timezone: CENTRAL },
  { name: 'Tennessee', abbreviation: 'TN', zone: 'Central', timezone: CENTRAL },
  { name: 'Texas', abbreviation: 'TX', zone: 'Central', timezone: CENTRAL },
  { name: 'Utah', abbreviation: 'UT', zone: 'Mountain', timezone: MOUNTAIN },
  { name: 'Vermont', abbreviation: 'VT', zone: 'Eastern', timezone: EASTERN },
  { name: 'Virginia', abbreviation: 'VA', zone: 'Eastern', timezone: EASTERN },
  { name: 'Washington', abbreviation: 'WA', zone: 'Pacific', timezone: PACIFIC },
  { name: 'West Virginia', abbreviation: 'WV', zone: 'Eastern', timezone: EASTERN },
  { name: 'Wisconsin', abbreviation: 'WI', zone: 'Central', timezone: CENTRAL },
  { name: 'Wyoming', abbreviation: 'WY', zone: 'Mountain', timezone: MOUNTAIN }
]

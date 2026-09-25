import { STATE_FIPS } from '../../src/data/stateFips'
import type { PopulationResult } from '../../src/types'

// ACS 5-Year Estimates, variable B01003_001E = total population. This is
// the Census Bureau's standard general-purpose population figure for
// places (cities/towns) and is the most recent "current" estimate publicly
// available — the Bureau does not publish anything closer to real-time.
const ACS_YEAR = 2022

function normalize(s: string): string {
  return s.trim().toLowerCase()
}

/** Looks up a US city's latest population estimate from the Census Bureau's
 *  public API. Runs in the main process so the renderer's CSP never needs to
 *  allow an external network request. Returns null if no match is found. */
export async function lookupCityPopulation(
  city: string,
  stateAbbr: string
): Promise<PopulationResult | null> {
  const fips = STATE_FIPS[stateAbbr.toUpperCase()]
  if (!fips) throw new Error(`Unknown state: ${stateAbbr}`)

  const url =
    `https://api.census.gov/data/${ACS_YEAR}/acs/acs5` +
    `?get=NAME,B01003_001E&for=place:*&in=state:${fips}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Census API request failed (${response.status})`)
  }

  const rows = (await response.json()) as string[][]
  // First row is the header: ["NAME", "B01003_001E", "state", "place"].
  const dataRows = rows.slice(1)
  const query = normalize(city)

  let bestMatch: string[] | null = null
  for (const row of dataRows) {
    const name = normalize(row[0])
    if (name.startsWith(query + ' ') || name === query) {
      bestMatch = row
      break
    }
    if (!bestMatch && name.includes(query)) {
      bestMatch = row
    }
  }

  if (!bestMatch) return null

  return {
    name: bestMatch[0],
    population: parseInt(bestMatch[1], 10),
    year: ACS_YEAR
  }
}

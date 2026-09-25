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

export class MissingApiKeyError extends Error {
  constructor() {
    super('missing-api-key')
  }
}

/** Fetches every place (city/town) the Census Bureau has population data for
 *  in the given state. Runs in the main process so the renderer's CSP never
 *  needs to allow an external network request. Throws MissingApiKeyError if
 *  the Bureau rejects the request for lacking a key (place-level wildcard
 *  queries require one; the redirect target is an HTML "missing key" page,
 *  not JSON — detected explicitly rather than surfacing as a raw
 *  JSON-parse error). */
async function fetchPlacesInState(stateAbbr: string, apiKey: string): Promise<string[][]> {
  const fips = STATE_FIPS[stateAbbr.toUpperCase()]
  if (!fips) throw new Error(`Unknown state: ${stateAbbr}`)

  let url =
    `https://api.census.gov/data/${ACS_YEAR}/acs/acs5` +
    `?get=NAME,B01003_001E&for=place:*&in=state:${fips}`
  if (apiKey.trim()) {
    url += `&key=${encodeURIComponent(apiKey.trim())}`
  }

  const response = await fetch(url)

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    if (response.url.includes('missing_key') || !apiKey.trim()) {
      throw new MissingApiKeyError()
    }
    throw new Error('Census Bureau returned an unexpected response (not JSON). Please try again.')
  }

  if (!response.ok) {
    throw new Error(`Census API request failed (${response.status})`)
  }

  const rows = (await response.json()) as string[][]
  // First row is the header: ["NAME", "B01003_001E", "state", "place"].
  return rows.slice(1)
}

/** Looks up a single US city's latest population estimate. Returns null if
 *  no match is found. */
export async function lookupCityPopulation(
  city: string,
  stateAbbr: string,
  apiKey: string
): Promise<PopulationResult | null> {
  const dataRows = await fetchPlacesInState(stateAbbr, apiKey)
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

/** Lists every city/town the Census Bureau has population data for in a
 *  state, sorted by population descending (largest cities first). */
export async function listCitiesInState(stateAbbr: string, apiKey: string): Promise<PopulationResult[]> {
  const dataRows = await fetchPlacesInState(stateAbbr, apiKey)
  return dataRows
    .map((row) => ({
      name: row[0],
      population: parseInt(row[1], 10) || 0,
      year: ACS_YEAR
    }))
    .sort((a, b) => b.population - a.population)
}

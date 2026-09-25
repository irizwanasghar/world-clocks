import { app } from 'electron'
import { appendFileSync } from 'fs'
import { join } from 'path'

const LOG_FILE = join(app.getPath('userData'), 'debug.log')

/** Temporary diagnostic logging, written to disk so it can be inspected
 *  directly after the fact instead of guessing at what a bug report's
 *  screenshot implies. Not wired to any UI — purely for tracking down the
 *  recurring "cards go missing" / "buttons go weird after repeated peek
 *  clicks" reports by capturing exactly what the window state was at each
 *  step. */
export function logDebug(message: string): void {
  try {
    const line = `[${new Date().toISOString()}] ${message}\n`
    appendFileSync(LOG_FILE, line, 'utf-8')
  } catch {
    // Never let logging itself break the app.
  }
}

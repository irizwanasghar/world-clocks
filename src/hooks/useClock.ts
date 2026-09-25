import { useEffect, useState } from 'react'

export interface FormattedTime {
  time: string
  date: string
}

function formatTime(timezone: string, use12Hour: boolean, showSeconds: boolean): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: use12Hour
  })
  return formatter.format(new Date())
}

function formatDate(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })
  return formatter.format(new Date())
}

export function useClock(timezone: string, use12Hour: boolean, showSeconds: boolean): FormattedTime {
  const [value, setValue] = useState<FormattedTime>(() => ({
    time: formatTime(timezone, use12Hour, showSeconds),
    date: formatDate(timezone)
  }))

  useEffect(() => {
    const update = (): void => {
      setValue({
        time: formatTime(timezone, use12Hour, showSeconds),
        date: formatDate(timezone)
      })
    }
    update()
    const intervalMs = showSeconds ? 1000 : 30000
    const timer = setInterval(update, intervalMs)
    return () => clearInterval(timer)
  }, [timezone, use12Hour, showSeconds])

  return value
}

function pad(n: number, size = 2) {
  return String(n).padStart(size, '0')
}

/** Format a local Date as `YYYY-MM-DDTHH:mm:ss.sss±HH:mm` (matches staging). */
export function toApiDateTime(date: Date): string {
  const offsetMin = -date.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `.${pad(date.getMilliseconds(), 3)}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  )
}

export function combineDateAndTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  const [hours, minutes] = timeStr.split(':').map(Number)
  if (!year || !month || !day || Number.isNaN(hours) || Number.isNaN(minutes)) return null
  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

export function addLiveUntil(base: Date, liveUntil: string): Date | null {
  if (liveUntil === 'always' || liveUntil === 'custom') return null
  const next = new Date(base.getTime())
  if (liveUntil === '1w') next.setDate(next.getDate() + 7)
  else if (liveUntil === '2w') next.setDate(next.getDate() + 14)
  else if (liveUntil === '3w') next.setDate(next.getDate() + 21)
  else if (liveUntil === '1m') next.setMonth(next.getMonth() + 1)
  else return null
  return next
}

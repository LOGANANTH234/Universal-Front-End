/**
 * Calculate the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

/**
 * Calculate the end of the week (Sunday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return end
}

/**
 * Format date as DD-MMM-YYYY
 */
export function formatDateShort(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const day = String(date.getDate()).padStart(2, "0")
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Get week range string (e.g., "16-Feb-2026 → 22-Feb-2026")
 */
export function getWeekRangeString(date: Date): string {
  const start = getWeekStart(date)
  const end = getWeekEnd(date)
  return `${formatDateShort(start)} → ${formatDateShort(end)}`
}

/**
 * Get week range formatted as ISO (e.g., "2026-02-16 to 2026-02-22")
 */
export function getWeekRangeISO(date: Date): { start: string; end: string } {
  const start = getWeekStart(date)
  const end = getWeekEnd(date)
  return {
    start: formatDateISO(start),
    end: formatDateISO(end),
  }
}

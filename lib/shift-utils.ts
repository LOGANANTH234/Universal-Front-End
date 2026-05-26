export function timeToMinutes(time: string): number {
  // Handle both 24-hour format (HH:MM) and 12-hour format (HH:MM AM/PM or HH:MM am/pm)
  const timeParts = time.trim().split(" ")
  const timeOnly = timeParts[0]
  const period = timeParts[1]?.toUpperCase() // Convert to uppercase for consistent comparison

  let [hours, minutes] = timeOnly.split(":").map(Number)

  // Convert to 24-hour format if period is present
  if (period) {
    if (period === "PM" && hours !== 12) {
      hours += 12
    } else if (period === "AM" && hours === 12) {
      hours = 0
    }
  }

  return hours * 60 + minutes
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`
}

export function to12HourFormat(time24: string): string {
  // If already in 12-hour format (contains AM or PM), return as is
  const upperTime = time24.toUpperCase()
  if (upperTime.includes("AM") || upperTime.includes("PM")) {
    return time24
  }

  // Convert from 24-hour format
  const [hours, minutes] = time24.split(":").map(Number)
  const period = hours >= 12 ? "PM" : "AM"
  const displayHours = hours % 12 || 12
  return `${displayHours.toString().padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`
}

export interface TimeRange {
  start: string
  end: string
}

export function calculateTotalHours(
  startTime: string,
  endTime: string,
  breaks: TimeRange[],
  lunch: TimeRange[],
): number {
  const startMins = timeToMinutes(startTime)
  let endMins = timeToMinutes(endTime)

  // Handle overnight shifts
  if (endMins < startMins) {
    endMins += 24 * 60
  }

  let totalMins = endMins - startMins

  // Subtract breaks
  breaks.forEach((b) => {
    const breakStart = timeToMinutes(b.start)
    const breakEnd = timeToMinutes(b.end)
    totalMins -= breakEnd - breakStart
  })

  // Subtract lunch
  lunch.forEach((l) => {
    const lunchStart = timeToMinutes(l.start)
    const lunchEnd = timeToMinutes(l.end)
    totalMins -= lunchEnd - lunchStart
  })

  return Number.parseFloat((totalMins / 60).toFixed(2))
}

export function calculateTotalMinutes(
  startTime: string,
  endTime: string,
  breaks: TimeRange[] = [],
  lunch: TimeRange[] = [],
): number {
  const startMins = timeToMinutes(startTime)
  let endMins = timeToMinutes(endTime)

  // Handle overnight shifts
  if (endMins < startMins) {
    endMins += 24 * 60
  }

  let totalMins = endMins - startMins

  // Subtract breaks
  breaks.forEach((b) => {
    const breakStart = timeToMinutes(b.start)
    const breakEnd = timeToMinutes(b.end)
    totalMins -= breakEnd - breakStart
  })

  // Subtract lunch
  lunch.forEach((l) => {
    const lunchStart = timeToMinutes(l.start)
    const lunchEnd = timeToMinutes(l.end)
    totalMins -= lunchEnd - lunchStart
  })

  return totalMins
}

export function isTimeInRange(time: string, rangeStart: string, rangeEnd: string): boolean {
  const timeMins = timeToMinutes(time)
  const startMins = timeToMinutes(rangeStart)
  const endMins = timeToMinutes(rangeEnd)

  if (endMins < startMins) {
    // Overnight range
    return timeMins >= startMins || timeMins <= endMins
  }
  return timeMins >= startMins && timeMins <= endMins
}

export function areRangesOverlapping(range1: TimeRange, range2: TimeRange): boolean {
  const r1Start = timeToMinutes(range1.start)
  const r1End = timeToMinutes(range1.end)
  const r2Start = timeToMinutes(range2.start)
  const r2End = timeToMinutes(range2.end)

  return r1Start < r2End && r2Start < r1End
}

export function formatHours(hours: number, shift?: { shiftDurationHr?: number; shiftDurationMin?: number }): string {
  // Use backend duration fields if available
  if (shift?.shiftDurationHr !== undefined || shift?.shiftDurationMin !== undefined) {
    const wholeHours = shift.shiftDurationHr || 0
    const minutes = shift.shiftDurationMin || 0
    if (minutes === 0) {
      return `${wholeHours} hr`
    }
    return `${wholeHours} hr ${minutes} min`
  }

  // Fallback to calculated hours
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  if (minutes === 0) {
    return `${wholeHours} hr`
  }
  return `${wholeHours} hr ${minutes} min`
}

export function getShiftColor(shiftType?: string): { bg: string; border: string; dot: string } {
  return {
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  }
}

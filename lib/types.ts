export interface TimeRange {
  start: string
  end: string
}

export interface GracePeriod {
  lateIn?: number // minutes
}

export interface Shift {
  id: string // Stores numeric ID as string (e.g., "2") without prefixes
  name: string
  startTime: string
  endTime: string
  breaks: TimeRange[]
  lunch: TimeRange[]
  gracePeriod: GracePeriod
  totalHours: number
  shiftDurationHr?: number
  shiftDurationMin?: number
  shiftType?: "morning" | "afternoon" | "evening" | "night" | "custom"
}

export interface ShiftVersion {
  version: number
  shift: Shift
  timestamp: string
  changedBy: string
}

export interface ShiftWithHistory extends Shift {
  history?: ShiftVersion[]
  currentVersion?: number
}

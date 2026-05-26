export interface Punch {
  id: string
  type: 'IN' | 'OUT'
  time: string // 24-hour format HH:MM
  date: string // YYYY-MM-DD
  note?: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  warning?: string
}

// Convert time string to minutes since midnight for comparison
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Convert date and time to timestamp
const dateTimeToTimestamp = (date: string, time: string): number => {
  return new Date(`${date}T${time}:00`).getTime()
}

// Check if datetime is in the future
const isFutureDateTime = (date: string, time: string): boolean => {
  const punchDateTime = dateTimeToTimestamp(date, time)
  return punchDateTime > Date.now()
}

export const validatePunch = (
  newPunch: Omit<Punch, 'id'>,
  existingPunches: Punch[],
  editingPunchId?: string,
  shiftStart?: string,
  shiftEnd?: string
): ValidationResult => {
  // Filter out the punch being edited
  const otherPunches = existingPunches.filter(p => p.id !== editingPunchId)
  
  // Get all punches for the same date, sorted by time
  const sameDatePunches = [...otherPunches.filter(p => p.date === newPunch.date)]
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time))

  // Rule: Check for duplicate punches (exact same time and type)
  for (const existingPunch of sameDatePunches) {
    if (existingPunch.type === newPunch.type && existingPunch.time === newPunch.time) {
      return {
        isValid: false,
        error: `Duplicate ${newPunch.type} punch already exists at ${newPunch.time}`,
      }
    }
  }

  // Rule: Check for time conflicts only with opposite type punches
  const newTime = timeToMinutes(newPunch.time)
  
  for (let i = 0; i < sameDatePunches.length - 1; i++) {
    const current = sameDatePunches[i]
    const next = sameDatePunches[i + 1]
    
    // Check if we have a complete IN-OUT pair
    if (current.type === 'IN' && next.type === 'OUT') {
      const existingInTime = timeToMinutes(current.time)
      const existingOutTime = timeToMinutes(next.time)
      
      // Only check overlap if new punch is not an edit of one of these punches
      if (newPunch.type === 'IN' && current.id !== editingPunchId) {
        // Check if new IN is already covered by an existing pair (IN-OUT)
        if (newTime >= existingInTime && newTime < existingOutTime) {
          const inFormatted = formatTime(existingInTime)
          const outFormatted = formatTime(existingOutTime)
          return {
            isValid: false,
            error: `Punch overlaps with an existing record. (New: ${newPunch.time}, Existing: ${inFormatted}–${outFormatted})`,
          }
        }
      }
      
      if (newPunch.type === 'OUT' && next.id !== editingPunchId) {
        // Check if new OUT is already covered by an existing pair (IN-OUT)
        if (newTime > existingInTime && newTime <= existingOutTime) {
          const inFormatted = formatTime(existingInTime)
          const outFormatted = formatTime(existingOutTime)
          return {
            isValid: false,
            error: `Punch overlaps with an existing record. (New: ${newPunch.time}, Existing: ${inFormatted}–${outFormatted})`,
          }
        }
      }
    }
  }

  return { isValid: true }
}

const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

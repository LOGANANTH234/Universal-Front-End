import type { Shift } from "@/lib/types"
import { to12HourFormat } from "@/lib/shift-utils"
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client"

export interface ApiShift {
  id: number
  name: string
  startTime: string // "09:00 AM"
  shiftDurationHr: number
  shiftDurationMin: number
  endTime: string // "06:00 PM"
  graceTime: number
  totalHours: string // "8 hr 30 min"
  breaks: Array<{ start: string; end: string }>
  lunches: Array<{ start: string; end: string }>
  validationMessages: string[]
}

function mapApiShiftToShift(apiShift: ApiShift): Shift {
  const parseHoursFromString = (timeStr: string): number => {
    const hourMatch = timeStr.match(/(\d+)\s*hr/)
    const minMatch = timeStr.match(/(\d+)\s*min/)

    const hours = hourMatch ? Number.parseInt(hourMatch[1], 10) : 0
    const minutes = minMatch ? Number.parseInt(minMatch[1], 10) : 0

    return hours + minutes / 60
  }

  return {
    id: String(apiShift.id), // Store numeric ID as string directly
    name: apiShift.name,
    startTime: apiShift.startTime,
    endTime: apiShift.endTime,
    breaks: (apiShift.breaks || []).map((b) => ({
      start: b.start,
      end: b.end,
    })),
    lunch: (apiShift.lunches || []).map((l) => ({
      start: l.start,
      end: l.end,
    })),
    gracePeriod: { lateIn: apiShift.graceTime },
    totalHours: parseHoursFromString(apiShift.totalHours),
    shiftDurationHr: apiShift.shiftDurationHr,
    shiftDurationMin: apiShift.shiftDurationMin,
    shiftType: "custom",
  }
}

export async function fetchShifts(): Promise<Shift[]> {
  try {
    const data: ApiShift[] = await apiGet("/api/shifts")
    return data.map(mapApiShiftToShift)
  } catch (error) {
    console.error("[v0] Error fetching shifts:", error)
    throw error
  }
}

export async function fetchShiftById(id: string): Promise<{ shift: Shift; validationMessages: string[] }> {
  try {
    const data: ApiShift = await apiGet(`/api/shifts/${id}`)
    return {
      shift: mapApiShiftToShift(data),
      validationMessages: data.validationMessages || [],
    }
  } catch (error) {
    console.error("[v0] Error fetching shift by ID:", error)
    throw error
  }
}

export async function updateShift(shift: Shift): Promise<{ shift: Shift; validationMessages: string[] }> {
  try {
    console.log("[v0] Incoming shift object:", shift)

    const totalHoursHr = Math.floor(shift.totalHours)
    const totalHoursMin = Math.round((shift.totalHours - totalHoursHr) * 60)

    const requestBody = {
      id: Number.parseInt(shift.id, 10),
      name: shift.name,
      startTime: to12HourFormat(shift.startTime),
      shiftDurationHr: shift.shiftDurationHr ?? 0,
      shiftDurationMin: shift.shiftDurationMin ?? 0,
      endTime: to12HourFormat(shift.endTime),
      graceTime: shift.gracePeriod.lateIn || 0,
      totalHours: `${totalHoursHr} hr ${totalHoursMin} min`,
      breaks: shift.breaks.map((b) => ({
        start: to12HourFormat(b.start),
        end: to12HourFormat(b.end),
      })),
      lunches: shift.lunch.map((l) => ({
        start: to12HourFormat(l.start),
        end: to12HourFormat(l.end),
      })),
    }

    console.log("[v0] Updating shift with body:", requestBody)

    try {
      const data: ApiShift = await apiPut(`/api/shifts/${shift.id}`, requestBody)
      console.log("[v0] Shift updated successfully:", data)

      if (data.validationMessages && data.validationMessages.length > 0) {
        console.log("[v0] Validation warnings:", data.validationMessages)
        return {
          shift: mapApiShiftToShift(data),
          validationMessages: data.validationMessages,
        }
      }

      return {
        shift: mapApiShiftToShift(data),
        validationMessages: [],
      }
    } catch (error: any) {
      if (error.status === 400 && error.validationMessages) {
        console.log("[v0] Validation failed with messages:", error.validationMessages)
        return {
          shift: shift as Shift,
          validationMessages: error.validationMessages,
        }
      }
      throw error
    }
  } catch (error) {
    console.error("[v0] Error updating shift:", error)
    throw error
  }
}

export async function deleteShift(id: string): Promise<void> {
  try {
    console.log("[v0] Deleting shift with ID:", id)

    await apiDelete(`/api/shifts/${id}`)
    console.log("[v0] Shift deleted successfully")
  } catch (error) {
    console.error("[v0] Error deleting shift:", error)
    throw error
  }
}

export async function createShift(shift: Omit<Shift, "id">): Promise<{ shift: Shift; validationMessages: string[] }> {
  try {
    console.log("[v0] Creating new shift:", shift)

    const totalHoursHr = Math.floor(shift.totalHours)
    const totalHoursMin = Math.round((shift.totalHours - totalHoursHr) * 60)

    const requestBody = {
      name: shift.name,
      startTime: to12HourFormat(shift.startTime),
      shiftDurationHr: shift.shiftDurationHr ?? 0,
      shiftDurationMin: shift.shiftDurationMin ?? 0,
      endTime: to12HourFormat(shift.endTime),
      graceTime: shift.gracePeriod.lateIn || 0,
      totalHours: `${totalHoursHr} hr ${totalHoursMin} min`,
      breaks: shift.breaks.map((b) => ({
        start: to12HourFormat(b.start),
        end: to12HourFormat(b.end),
      })),
      lunches: shift.lunch.map((l) => ({
        start: to12HourFormat(l.start),
        end: to12HourFormat(l.end),
      })),
    }

    console.log("[v0] Creating shift with body:", JSON.stringify(requestBody, null, 2))

    try {
      const data: ApiShift = await apiPost("/api/shifts", requestBody)
      console.log("[v0] Shift created successfully:", data)

      if (data.validationMessages && data.validationMessages.length > 0) {
        console.log("[v0] Validation warnings:", data.validationMessages)
        return {
          shift: mapApiShiftToShift(data),
          validationMessages: data.validationMessages,
        }
      }

      return {
        shift: mapApiShiftToShift(data),
        validationMessages: [],
      }
    } catch (error: any) {
      if (error.status === 400 && error.validationMessages) {
        console.log("[v0] Validation failed with messages:", error.validationMessages)
        return {
          shift: { ...shift, id: "temp-id" } as Shift,
          validationMessages: error.validationMessages,
        }
      }
      throw error
    }
  } catch (error) {
    console.error("[v0] Error creating shift:", error)
    throw error
  }
}

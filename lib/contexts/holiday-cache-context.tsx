"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

export interface Holiday {
  id: string
  date: string // YYYY-MM-DD format
  name: string
  description?: string
}

interface HolidayCacheContextType {
  holidaysByYear: Record<number, Holiday[]>
  hasLoadedYear: (year: number) => boolean
  getHolidaysForYear: (year: number) => Holiday[] | undefined
  setHolidaysForYear: (year: number, holidays: Holiday[]) => void
  addOrUpdateHoliday: (holiday: Holiday) => void
  deleteHoliday: (holidayDate: string) => void
  invalidateCache: (year?: number) => void
}

const HolidayCacheContext = createContext<HolidayCacheContextType | undefined>(undefined)

export function HolidayCacheProvider({ children }: { children: React.ReactNode }) {
  const [holidaysByYear, setHolidaysByYear] = useState<Record<number, Holiday[]>>({})

  const hasLoadedYear = useCallback(
    (year: number) => {
      return holidaysByYear[year] !== undefined
    },
    [holidaysByYear]
  )

  const getHolidaysForYear = useCallback(
    (year: number) => {
      return holidaysByYear[year]
    },
    [holidaysByYear]
  )

  const setHolidaysForYear = useCallback((year: number, holidays: Holiday[]) => {
    setHolidaysByYear((prev) => ({
      ...prev,
      [year]: holidays,
    }))
  }, [])

  const addOrUpdateHoliday = useCallback((holiday: Holiday) => {
    const year = parseInt(holiday.date.split("-")[0], 10)
    if (isNaN(year)) return
    setHolidaysByYear((prev) => {
      const existing = prev[year] || []
      const filtered = existing.filter((h) => h.date !== holiday.date)
      return {
        ...prev,
        [year]: [...filtered, holiday],
      }
    })
  }, [])

  const deleteHoliday = useCallback((holidayDate: string) => {
    const year = parseInt(holidayDate.split("-")[0], 10)
    if (isNaN(year)) return
    setHolidaysByYear((prev) => {
      const existing = prev[year] || []
      return {
        ...prev,
        [year]: existing.filter((h) => h.date !== holidayDate),
      }
    })
  }, [])

  const invalidateCache = useCallback((year?: number) => {
    if (year !== undefined) {
      setHolidaysByYear((prev) => {
        const copy = { ...prev }
        delete copy[year]
        return copy
      })
    } else {
      setHolidaysByYear({})
    }
  }, [])

  return (
    <HolidayCacheContext.Provider
      value={{
        holidaysByYear,
        hasLoadedYear,
        getHolidaysForYear,
        setHolidaysForYear,
        addOrUpdateHoliday,
        deleteHoliday,
        invalidateCache,
      }}
    >
      {children}
    </HolidayCacheContext.Provider>
  )
}

export function useHolidayCache() {
  const context = useContext(HolidayCacheContext)
  if (!context) {
    throw new Error("useHolidayCache must be used within HolidayCacheProvider")
  }
  return context
}

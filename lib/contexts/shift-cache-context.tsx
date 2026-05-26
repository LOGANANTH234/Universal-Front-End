"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import type { Shift } from "@/lib/types"

interface ShiftCacheContextType {
  shifts: Shift[] | null
  isLoading: boolean
  error: string | null
  setShifts: (shifts: Shift[]) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  invalidateCache: () => void
  hasData: boolean
}

const ShiftCacheContext = createContext<ShiftCacheContextType | undefined>(undefined)

export function ShiftCacheProvider({ children }: { children: React.ReactNode }) {
  const [shifts, setShifts] = useState<Shift[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invalidateCache = useCallback(() => {
    setShifts(null)
    setError(null)
  }, [])

  return (
    <ShiftCacheContext.Provider
      value={{
        shifts,
        isLoading,
        error,
        setShifts,
        setIsLoading,
        setError,
        invalidateCache,
        hasData: shifts !== null,
      }}
    >
      {children}
    </ShiftCacheContext.Provider>
  )
}

export function useShiftCache() {
  const context = useContext(ShiftCacheContext)
  if (!context) {
    throw new Error("useShiftCache must be used within ShiftCacheProvider")
  }
  return context
}

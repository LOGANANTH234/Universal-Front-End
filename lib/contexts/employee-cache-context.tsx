"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import type { Employee } from "@/lib/types"

interface EmployeeCacheContextType {
  employees: Employee[] | null
  isLoading: boolean
  error: string | null
  setEmployees: (employees: Employee[]) => void
  setIsLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  invalidateCache: () => void
  hasData: boolean
}

const EmployeeCacheContext = createContext<EmployeeCacheContextType | undefined>(undefined)

export function EmployeeCacheProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invalidateCache = useCallback(() => {
    setEmployees(null)
    setError(null)
  }, [])

  return (
    <EmployeeCacheContext.Provider
      value={{
        employees,
        isLoading,
        error,
        setEmployees,
        setIsLoading,
        setError,
        invalidateCache,
        hasData: employees !== null,
      }}
    >
      {children}
    </EmployeeCacheContext.Provider>
  )
}

export function useEmployeeCache() {
  const context = useContext(EmployeeCacheContext)
  if (!context) {
    throw new Error("useEmployeeCache must be used within EmployeeCacheProvider")
  }
  return context
}

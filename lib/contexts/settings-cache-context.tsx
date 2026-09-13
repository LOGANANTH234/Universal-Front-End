"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"

export interface AppSettings {
  penaltyDeductionEnabled: boolean
  warningsBeforePenalty: number
  themeMode: "dark" | "light"
  penaltyDeductionMinutes: number
  allowanceEligibilityPercent: number
  overtimeMinimumMinutes: number
  dailySalaryCalculationTime: string
}

interface SettingsCacheContextType {
  settings: AppSettings | null
  hasLoaded: boolean
  isLoading: boolean
  setSettings: (settings: AppSettings) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  invalidateCache: () => void
}

const SettingsCacheContext = createContext<SettingsCacheContextType | undefined>(undefined)

export function SettingsCacheProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<AppSettings | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const setSettings = useCallback((newSettings: AppSettings) => {
    setSettingsState(newSettings)
    setHasLoaded(true)
    setIsLoading(false)
  }, [])

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      if (!prev) return null
      return { ...prev, ...partial }
    })
  }, [])

  const invalidateCache = useCallback(() => {
    setSettingsState(null)
    setHasLoaded(false)
  }, [])

  return (
    <SettingsCacheContext.Provider
      value={{
        settings,
        hasLoaded,
        isLoading,
        setSettings,
        updateSettings,
        invalidateCache,
      }}
    >
      {children}
    </SettingsCacheContext.Provider>
  )
}

export function useSettingsCache() {
  const context = useContext(SettingsCacheContext)
  if (!context) {
    throw new Error("useSettingsCache must be used within SettingsCacheProvider")
  }
  return context
}

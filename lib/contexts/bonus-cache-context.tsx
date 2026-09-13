"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
import type { BonusRun, BonusEmployeeItem, WorkdayCriteria, BonusRateMode } from "@/lib/bonus-types"

export interface ActiveCalculationState {
  bonusName: string
  fromDate: string
  toDate: string
  workdayCriteria: WorkdayCriteria
  primaryCriteria: WorkdayCriteria
  secondaryCriteria: WorkdayCriteria
  rateMode: BonusRateMode
  bonusPercentage: number
  tier1Percentage: number
  tier2Percentage: number
  employees: BonusEmployeeItem[]
  activeTab: "CALCULATE" | "SAVED_HISTORY"
}

interface BonusCacheContextType {
  savedRuns: BonusRun[] | null
  hasLoadedRuns: boolean
  isLoadingRuns: boolean
  runDetailsCache: Record<string, BonusRun>
  activeCalculation: ActiveCalculationState | null
  setSavedRuns: (runs: BonusRun[]) => void
  addSavedRun: (run: BonusRun) => void
  updateSavedRun: (run: BonusRun) => void
  deleteSavedRun: (runId: string) => void
  cacheRunDetails: (runId: string, run: BonusRun) => void
  getRunDetails: (runId: string) => BonusRun | undefined
  setActiveCalculation: (calc: ActiveCalculationState | null) => void
  updateActiveCalculation: (partial: Partial<ActiveCalculationState>) => void
  invalidateRunsCache: () => void
}

const BonusCacheContext = createContext<BonusCacheContextType | undefined>(undefined)

export function BonusCacheProvider({ children }: { children: React.ReactNode }) {
  const [savedRuns, setSavedRunsState] = useState<BonusRun[] | null>(null)
  const [hasLoadedRuns, setHasLoadedRuns] = useState(false)
  const [isLoadingRuns, setIsLoadingRuns] = useState(false)
  const [runDetailsCache, setRunDetailsCache] = useState<Record<string, BonusRun>>({})
  const [activeCalculation, setActiveCalculationState] = useState<ActiveCalculationState | null>(null)

  const setSavedRuns = useCallback((runs: BonusRun[]) => {
    setSavedRunsState(runs)
    setHasLoadedRuns(true)
  }, [])

  const addSavedRun = useCallback((newRun: BonusRun) => {
    setSavedRunsState((prev) => {
      const existing = prev || []
      const filtered = existing.filter((r) => r.id !== newRun.id)
      return [newRun, ...filtered]
    })
    setHasLoadedRuns(true)
    if (newRun.items && newRun.items.length > 0) {
      setRunDetailsCache((prev) => ({
        ...prev,
        [newRun.id]: newRun,
      }))
    }
  }, [])

  const updateSavedRun = useCallback((updatedRun: BonusRun) => {
    setSavedRunsState((prev) => {
      if (!prev) return [updatedRun]
      return prev.map((r) => (r.id === updatedRun.id ? { ...r, ...updatedRun } : r))
    })
    if (updatedRun.items && updatedRun.items.length > 0) {
      setRunDetailsCache((prev) => ({
        ...prev,
        [updatedRun.id]: updatedRun,
      }))
    }
  }, [])

  const deleteSavedRun = useCallback((runId: string) => {
    setSavedRunsState((prev) => {
      if (!prev) return []
      return prev.filter((r) => r.id !== runId)
    })
    setRunDetailsCache((prev) => {
      const copy = { ...prev }
      delete copy[runId]
      return copy
    })
  }, [])

  const cacheRunDetails = useCallback((runId: string, run: BonusRun) => {
    setRunDetailsCache((prev) => ({
      ...prev,
      [runId]: run,
    }))
  }, [])

  const getRunDetails = useCallback((runId: string) => {
    return runDetailsCache[runId]
  }, [runDetailsCache])

  const setActiveCalculation = useCallback((calc: ActiveCalculationState | null) => {
    setActiveCalculationState(calc)
  }, [])

  const updateActiveCalculation = useCallback((partial: Partial<ActiveCalculationState>) => {
    setActiveCalculationState((prev) => {
      if (!prev) {
        return {
          bonusName: "",
          fromDate: "2026-01-01",
          toDate: "2026-12-31",
          workdayCriteria: "FULL_DAY_ONLY",
          primaryCriteria: "FULL_DAY_ONLY",
          secondaryCriteria: "GREATER_EQUAL_HALF_DAY",
          rateMode: "FLAT",
          bonusPercentage: 15,
          tier1Percentage: 15,
          tier2Percentage: 10,
          employees: [],
          activeTab: "CALCULATE",
          ...partial,
        }
      }
      return { ...prev, ...partial }
    })
  }, [])

  const invalidateRunsCache = useCallback(() => {
    setSavedRunsState(null)
    setHasLoadedRuns(false)
    setRunDetailsCache({})
  }, [])

  return (
    <BonusCacheContext.Provider
      value={{
        savedRuns,
        hasLoadedRuns,
        isLoadingRuns,
        runDetailsCache,
        activeCalculation,
        setSavedRuns,
        addSavedRun,
        updateSavedRun,
        deleteSavedRun,
        cacheRunDetails,
        getRunDetails,
        setActiveCalculation,
        updateActiveCalculation,
        invalidateRunsCache,
      }}
    >
      {children}
    </BonusCacheContext.Provider>
  )
}

export function useBonusCache() {
  const context = useContext(BonusCacheContext)
  if (!context) {
    throw new Error("useBonusCache must be used within BonusCacheProvider")
  }
  return context
}

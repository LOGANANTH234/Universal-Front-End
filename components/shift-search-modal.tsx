"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { Shift } from "@/lib/types"
import ShiftCard from "./shift-card"
import { fetchShifts } from "@/lib/api/shifts"

interface ShiftApiResponse {
  id: number
  name: string
  startTime: string
  endTime: string
  breaks: { start: string; end: string }[]
  lunches: { start: string; end: string }[]
  graceTime: number
  shiftDurationHr: number
  shiftDurationMin: number
  totalHours: string
  validationMessages: string | null
}

interface ShiftSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectShift: (shiftName: string, shiftId: string) => void // Updated to pass both shiftName and shiftId
  excludeShifts?: string[]
  title?: string
}

export default function ShiftSearchModal({
  isOpen,
  onClose,
  onSelectShift,
  excludeShifts = [],
  title = "Select Shift",
}: ShiftSearchModalProps) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchShiftsData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchShifts()
      setShifts(data)
    } catch (err) {
      console.error("[v0] Error fetching shifts:", err)
      setError("Failed to load shifts. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchShiftsData()
    }
  }, [isOpen])

  const availableShifts = shifts.filter((shift) => !excludeShifts.includes(shift.name))

  const handleShiftDoubleClick = (shift: Shift) => {
    onSelectShift(shift.name, shift.id) // Pass both shift name and shift ID
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col">
        <div className="bg-slate-800 dark:bg-slate-950 text-white px-6 py-3 flex items-center justify-between rounded-t-lg flex-shrink-0">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} className="hover:bg-white/10 p-1.5 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2 border-b border-border flex-shrink-0">
          <p className="text-sm text-muted-foreground">Double-click a shift to select it</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-foreground">Loading shifts...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-red-600">{error}</p>
            </div>
          ) : availableShifts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-foreground">No shifts available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableShifts.map((shift) => (
                <div key={shift.id} onDoubleClick={() => handleShiftDoubleClick(shift)}>
                  <ShiftCard
                    shift={shift}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onView={() => {}}
                    hideActions={true}
                    canEdit={false}
                    canDelete={false}
                    canView={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

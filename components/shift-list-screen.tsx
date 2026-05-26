"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ShiftCard from "./shift-card"
import ShiftFormModal from "./shift-form-modal"
import HelpModal from "./help-modal"
import type { Shift } from "@/lib/types"
import { fetchShifts, fetchShiftById, updateShift, deleteShift, createShift } from "@/lib/api/shifts"
import { Plus, Search, AlertCircle, HelpCircle, X, Loader2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { useShiftCache } from "@/lib/contexts/shift-cache-context"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"

export default function ShiftListScreen() {
  const cache = useShiftCache()
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)
  const [viewMode, setViewMode] = useState(false)
  const [validationDialog, setValidationDialog] = useState<{
    show: boolean
    messages: string[]
  }>({ show: false, messages: [] })
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [operationLoading, setOperationLoading] = useState<{
    show: boolean
    message: string
    shiftName: string
  }>({ show: false, message: "", shiftName: "" })
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string; name: string }>({
    show: false,
    id: "",
    name: "",
  })
  const [isComboOpen, setIsComboOpen] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)

  const canCreateShift = useHasAction(MODULES.SHIFT_MANAGEMENT, ACTIONS.SHIFT_CREATE)
  const canEditShift = useHasAction(MODULES.SHIFT_MANAGEMENT, ACTIONS.SHIFT_EDIT)
  const canDeleteShift = useHasAction(MODULES.SHIFT_MANAGEMENT, ACTIONS.SHIFT_DELETE)
  const canViewShift = useHasAction(MODULES.SHIFT_MANAGEMENT, ACTIONS.SHIFT_VIEW)
  const canAccessHelp = useHasAction(MODULES.SHIFT_MANAGEMENT, ACTIONS.SHIFT_HELP)

  useEffect(() => {
    const loadShifts = async () => {
      if (cache.hasData) {
        return
      }

      try {
        cache.setIsLoading(true)
        cache.setError(null)
        const data = await fetchShifts()
        cache.setShifts(data)
      } catch (err) {
        cache.setError(err instanceof Error ? err.message : "Failed to load shifts")
        console.error("[v0] Failed to load shifts:", err)
      } finally {
        cache.setIsLoading(false)
      }
    }

    loadShifts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache.hasData])

  const shifts = cache.shifts || []

  const filteredShifts = shifts.filter((shift) => {
    if (!searchTerm) return true
    return shift.name.toLowerCase().startsWith(searchTerm.toLowerCase())
  })

  const filteredShiftNames = shifts
    .map((shift) => shift.name)
    .filter((name) => {
      if (!searchTerm) return true
      return name.toLowerCase().startsWith(searchTerm.toLowerCase())
    })

  const shiftNameExists = (name: string, excludeId?: string) => {
    return shifts.some((s) => s.name.toLowerCase() === name.toLowerCase() && s.id !== excludeId)
  }

  const getExistingShiftCombinations = () => {
    return shifts.map((s) => ({
      startTime: s.startTime,
      endTime: s.endTime,
      id: s.id,
      name: s.name,
    }))
  }

  const handleSelectShiftName = (name: string) => {
    setSearchTerm(name)
    setIsComboOpen(false)
  }

  const handleClearSearch = () => {
    setSearchTerm("")
    setIsComboOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsComboOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleAddShift = async (newShift: Omit<Shift, "id">) => {
    if (shiftNameExists(newShift.name)) {
      alert("A shift with this name already exists")
      return
    }

    try {
      console.log("[v0] Creating new shift:", newShift)

      setOperationLoading({ show: true, message: "Creating", shiftName: newShift.name })

      const { shift: createdShift, validationMessages } = await createShift(newShift)

      console.log("[v0] Shift created successfully:", createdShift)
      console.log("[v0] Backend validation messages:", validationMessages)

      if (validationMessages && validationMessages.length > 0) {
        console.log("[v0] Showing validation dialog")
        setValidationDialog({ show: true, messages: validationMessages })
        setOperationLoading({ show: false, message: "", shiftName: "" })
        return
      }

      cache.setShifts([...shifts, createdShift])
      setIsModalOpen(false)
    } catch (error) {
      console.error("[v0] Error creating shift:", error)
      alert(`Failed to create shift: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setOperationLoading({ show: false, message: "", shiftName: "" })
    }
  }

  const handleSaveShift = async (updatedShift: Shift) => {
    console.log("[v0] handleSaveShift called with shift:", updatedShift)

    if (shiftNameExists(updatedShift.name, updatedShift.id)) {
      console.log("[v0] Shift name already exists, blocking update")
      alert("A shift with this name already exists")
      return
    }

    console.log("[v0] Shift name check passed, proceeding with update")

    try {
      console.log("[v0] Updating shift:", updatedShift)

      setOperationLoading({ show: true, message: "Updating", shiftName: updatedShift.name })

      const { shift: responseShift, validationMessages } = await updateShift(updatedShift)

      console.log("[v0] Shift updated successfully:", responseShift)
      console.log("[v0] Backend validation messages:", validationMessages)

      if (validationMessages && validationMessages.length > 0) {
        console.log("[v0] Showing validation dialog")
        setValidationDialog({ show: true, messages: validationMessages })
        setOperationLoading({ show: false, message: "", shiftName: "" })
        return
      }

      const oldShift = shifts.find((s) => s.id === updatedShift.id)
      if (oldShift) {
      }

      cache.setShifts(shifts.map((s) => (s.id === updatedShift.id ? responseShift : s)))
      setEditingShift(null)
      setIsModalOpen(false)
    } catch (error) {
      console.log("[v0] Error updating shift:", error)
      alert(`Failed to update shift: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setOperationLoading({ show: false, message: "", shiftName: "" })
    }
  }

  const handleDeleteShift = (id: string) => {
    const shift = shifts.find((s) => s.id === id)
    if (shift) {
      setDeleteConfirm({ show: true, id, name: shift.name })
    }
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirm.id) {
      try {
        console.log("[v0] Deleting shift:", deleteConfirm.id)

        setOperationLoading({ show: true, message: "Deleting", shiftName: deleteConfirm.name })

        await deleteShift(deleteConfirm.id)

        console.log("[v0] Shift deleted successfully")

        cache.setShifts(shifts.filter((s) => s.id !== deleteConfirm.id))
        setDeleteConfirm({ show: false, id: "", name: "" })
      } catch (err) {
        console.error("[v0] Failed to delete shift:", err)
        alert("Failed to delete shift. Please try again.")
      } finally {
        setOperationLoading({ show: false, message: "", shiftName: "" })
      }
    }
  }

  const handleEditShift = async (shift: Shift) => {
    try {
      setOperationLoading({ show: true, message: "Loading", shiftName: shift.name })
      console.log("[v0] Fetching shift details for ID:", shift.id)

      const { shift: fetchedShift } = await fetchShiftById(shift.id)

      console.log("[v0] Fetched shift data:", fetchedShift)

      setEditingShift(fetchedShift)
      setViewMode(false)
      setIsModalOpen(true)
    } catch (err) {
      console.error("[v0] Failed to fetch shift details:", err)
      alert("Failed to load shift details. Please try again.")
    } finally {
      setOperationLoading({ show: false, message: "", shiftName: "" })
    }
  }

  const handleViewShift = async (shift: Shift) => {
    try {
      setOperationLoading({ show: true, message: "Loading", shiftName: shift.name })
      console.log("[v0] Fetching shift details for viewing ID:", shift.id)

      const { shift: fetchedShift } = await fetchShiftById(shift.id)

      console.log("[v0] Fetched shift data for viewing:", fetchedShift)

      setEditingShift(fetchedShift)
      setViewMode(true)
      setIsModalOpen(true)
    } catch (err) {
      console.error("[v0] Failed to fetch shift details:", err)
      alert("Failed to load shift details. Please try again.")
    } finally {
      setOperationLoading({ show: false, message: "", shiftName: "" })
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingShift(null)
    setViewMode(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="border-b border-border bg-card z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between gap-4 mb-4 md:mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Shift Management</h1>
            {canAccessHelp && (
              <Button
                onClick={() => setIsHelpOpen(true)}
                className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all shrink-0"
              >
                <HelpCircle className="w-4 h-4" />
                Help
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative max-w-md" ref={comboboxRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                <Input
                  placeholder="Search or select shift..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsComboOpen(true)}
                  className="pl-10 pr-10 border-blue-400"
                  disabled={cache.isLoading}
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isComboOpen && !cache.isLoading && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                  {filteredShiftNames.length > 0 ? (
                    filteredShiftNames.map((name, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectShiftName(name)}
                        className="w-full px-4 py-2 text-left hover:bg-accent text-foreground transition-colors"
                      >
                        {name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-muted-foreground">No shifts available</div>
                  )}
                </div>
              )}
            </div>

            {canCreateShift && (
              <Button
                onClick={() => {
                  setEditingShift(null)
                  setIsModalOpen(true)
                }}
                className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap bg-blue-400"
                disabled={cache.isLoading}
              >
                <Plus className="w-4 h-4" />
                Create New Shift
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-auto">
        {cache.isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium text-foreground">Loading shifts...</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait while we fetch the data</p>
          </div>
        ) : cache.error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-lg font-medium text-foreground">Failed to load shifts</p>
            <p className="text-sm text-muted-foreground mt-1">{cache.error}</p>
            <Button onClick={() => cache.invalidateCache()} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        ) : filteredShifts.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground">No shifts found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? "Try adjusting your search" : "Create a new shift to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShifts.map((shift) => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onEdit={handleEditShift}
                onDelete={handleDeleteShift}
                onView={handleViewShift}
                canEdit={canEditShift}
                canDelete={canDeleteShift}
                canView={canViewShift}
              />
            ))}
          </div>
        )}
      </main>

      {operationLoading.show && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60 backdrop-blur-sm z-[70] flex items-center justify-center">
          <div className="bg-gradient-to-br from-card via-card to-card/95 rounded-2xl shadow-2xl p-10 flex flex-col items-center gap-6 border border-border/50 backdrop-blur-md min-w-[320px] animate-in fade-in zoom-in-95 duration-300">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <div className="relative">
                <svg className="w-20 h-20" viewBox="0 0 100 100">
                  <circle
                    className="text-muted/20"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-blue-500 animate-spin origin-center"
                    strokeWidth="8"
                    strokeDasharray="251.2"
                    strokeDashoffset="62.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                    style={{
                      transformOrigin: "50% 50%",
                      animation: "spin 1.5s linear infinite",
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xl font-semibold text-foreground bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {operationLoading.message} {operationLoading.shiftName}
                <span className="inline-flex gap-0.5 ml-0.5">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
                    .
                  </span>
                  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
                    .
                  </span>
                  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
                    .
                  </span>
                </span>
              </p>
              <p className="text-sm text-muted-foreground">Please wait a moment</p>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Confirm Delete</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Do you want to delete the shift "
                <span className="font-medium text-foreground">{deleteConfirm.name}</span>"?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirm({ show: false, id: "", name: "" })}
                  className="flex-1 bg-transparent"
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmDelete} className="flex-1 bg-destructive hover:bg-destructive/90">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {validationDialog.show && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-md w-full mx-4 border border-red-200 dark:border-red-800 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Validation Error</h3>
                  <div className="space-y-2">
                    {validationDialog.messages.map((msg, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                        <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                        <span>{msg}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 p-4 flex justify-end">
              <Button
                onClick={() => setValidationDialog({ show: false, messages: [] })}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      <ShiftFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={editingShift ? handleSaveShift : handleAddShift}
        initialShift={editingShift}
        existingNames={shifts.map((s) => s.name).filter((n) => n !== editingShift?.name)}
        existingShiftCombinations={getExistingShiftCombinations()}
        viewMode={viewMode}
      />
    </div>
  )
}

export { ShiftListScreen }

"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"
import { AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Shift } from "@/lib/types"
import { X, Plus, Trash2, Clock, Coffee, UtensilsCrossed, Edit } from "lucide-react"
import { isTimeInRange, areRangesOverlapping, calculateTotalMinutes, timeToMinutes } from "@/lib/shift-utils"
import { TimePickerCompact } from "./time-picker-compact"

interface ShiftFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (shift: Shift | Omit<Shift, "id">) => void
  initialShift: Shift | null
  existingNames: string[]
  existingShiftCombinations?: Array<{ startTime: string; endTime: string; id: string; name: string }>
  viewMode?: boolean
}

export default function ShiftFormModal({
  isOpen,
  onClose,
  onSave,
  initialShift,
  existingNames,
  existingShiftCombinations = [],
  viewMode = false,
}: ShiftFormModalProps) {
  const [formData, setFormData] = useState<Omit<Shift, "id">>({
    name: "",
    startTime: "09:00",
    endTime: "18:00",
    breaks: [],
    lunch: [],
    gracePeriod: { lateIn: 5 },
    totalHours: calculateTotalMinutes("09:00", "18:00", [], []) / 60,
    shiftType: "",
  })

  const [durationHours, setDurationHours] = useState(9)
  const [durationMinutes, setDurationMinutes] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [timeRangeError, setTimeRangeError] = useState<string | null>(null)

  const isEditMode = useRef(false)
  const allowDurationAutoCalc = useRef(true)

  const graceOptions = ["0 mins", "5 mins", "10 mins", "15 mins", "20 mins", "25 mins", "30 mins", "35 mins", "40 mins"]

  useEffect(() => {
    if (isOpen && initialShift) {
      isEditMode.current = true
      allowDurationAutoCalc.current = false

      const diffHours = initialShift.shiftDurationHr || 0
      const diffMinutes = initialShift.shiftDurationMin || 0

      setDurationHours(diffHours)
      setDurationMinutes(diffMinutes)

      setFormData({
        name: initialShift.name,
        startTime: initialShift.startTime,
        endTime: initialShift.endTime,
        breaks: initialShift.breaks.map((b) => ({ ...b })),
        lunch: initialShift.lunch.map((l) => ({ ...l })),
        gracePeriod: { lateIn: initialShift.gracePeriod?.lateIn ?? 5 },
        totalHours:
          calculateTotalMinutes(initialShift.startTime, initialShift.endTime, initialShift.breaks, initialShift.lunch) /
          60,
        shiftType: initialShift.shiftType || "",
      })
    } else if (isOpen && !initialShift) {
      isEditMode.current = false
      allowDurationAutoCalc.current = true

      setDurationHours(9)
      setDurationMinutes(0)
      setFormData({
        name: "",
        startTime: "09:00",
        endTime: "18:00",
        breaks: [],
        lunch: [],
        gracePeriod: { lateIn: 5 },
        totalHours: calculateTotalMinutes("09:00", "18:00", [], []) / 60,
        shiftType: "",
      })
    }

    if (!isOpen) {
      setErrors({})
    }
  }, [isOpen, initialShift])

  useEffect(() => {
    if (allowDurationAutoCalc.current) {
      // user manually changed duration
    } else if (isEditMode.current) {
      return
    }

    if (!durationHours && !durationMinutes) return
    if (!formData.startTime) return

    const startMinutes = timeToMinutes(formData.startTime)
    if (isNaN(startMinutes) || isNaN(durationHours) || isNaN(durationMinutes)) return

    let endMinutes = startMinutes + durationHours * 60 + durationMinutes
    if (endMinutes >= 24 * 60) endMinutes -= 24 * 60

    const newEndTime = minutesToTime(endMinutes)

    if (newEndTime !== formData.endTime) {
      const newTotal = calculateTotalMinutes(formData.startTime, newEndTime, formData.breaks, formData.lunch) / 60
      setFormData((prev) => ({ ...prev, endTime: newEndTime, totalHours: newTotal }))
    }
  }, [durationHours, durationMinutes, formData.startTime])

  useEffect(() => {
    const newTotal = calculateTotalMinutes(formData.startTime, formData.endTime, formData.breaks, formData.lunch) / 60
    if (Math.abs(newTotal - formData.totalHours) > 0.01) {
      setFormData((prev) => ({ ...prev, totalHours: newTotal }))
    }
  }, [formData.breaks, formData.lunch, formData.startTime, formData.endTime])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Shift name is required"
    }

    // Allow the same name only if it belongs to the shift being edited
    if (existingNames.includes(formData.name) && formData.name !== initialShift?.name) {
      newErrors.name = "This shift name already exists"
    }

    formData.breaks.forEach((b, idx) => {
      if (!isTimeInRange(b.start, formData.startTime, formData.endTime)) {
        newErrors[`break-${idx}-start`] = "Break start time should be within the shift's Start and End Time."
      }
      if (!isTimeInRange(b.end, formData.startTime, formData.endTime)) {
        newErrors[`break-${idx}-end`] = "Break end time should be within the shift's Start and End Time."
      }
      if (timeToMinutes(b.start) >= timeToMinutes(b.end)) {
        newErrors[`break-${idx}-range`] = "Break end must be after start"
      }
      for (let i = 0; i < formData.breaks.length; i++) {
        if (i !== idx && areRangesOverlapping(b, formData.breaks[i])) {
          newErrors[`break-${idx}-overlap`] = "Breaks cannot overlap"
          break
        }
      }
      for (const l of formData.lunch) {
        if (areRangesOverlapping(b, l)) {
          newErrors[`break-${idx}-lunch`] = "Break time and Lunch time should not overlap."
          break
        }
      }
    })

    formData.lunch.forEach((l, idx) => {
      if (!isTimeInRange(l.start, formData.startTime, formData.endTime)) {
        newErrors[`lunch-${idx}-start`] = "Lunch time should be within the shift's Start and End Time."
      }
      if (!isTimeInRange(l.end, formData.startTime, formData.endTime)) {
        newErrors[`lunch-${idx}-end`] = "Lunch time should be within the shift's Start and End Time."
      }
      if (timeToMinutes(l.start) >= timeToMinutes(l.end)) {
        newErrors[`lunch-${idx}-range`] = "Lunch end must be after start"
      }
      for (let i = 0; i < formData.lunch.length; i++) {
        if (i !== idx && areRangesOverlapping(l, formData.lunch[i])) {
          newErrors[`lunch-${idx}-overlap`] = "Lunch periods cannot overlap"
          break
        }
      }
      for (const b of formData.breaks) {
        if (areRangesOverlapping(l, b)) {
          newErrors[`lunch-${idx}-break`] = "Break time and Lunch time should not overlap."
          break
        }
      }
    })

    if ((formData.gracePeriod.lateIn ?? 0) < 0) {
      newErrors.gracePeriod = "Grace period cannot be negative"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatTimeTo12Hour = (time: string): string => {
    if (time.toLowerCase().includes("am") || time.toLowerCase().includes("pm")) {
      return time.toUpperCase()
    }
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!validateForm()) return

    if (initialShift) {
      const hasDataChanged =
        JSON.stringify({
          name: formData.name,
          startTime: formData.startTime,
          endTime: formData.endTime,
          breaks: formData.breaks,
          lunch: formData.lunch,
          gracePeriod: formData.gracePeriod,
        }) !==
        JSON.stringify({
          name: initialShift.name,
          startTime: initialShift.startTime,
          endTime: initialShift.endTime,
          breaks: initialShift.breaks,
          lunch: initialShift.lunch,
          gracePeriod: initialShift.gracePeriod,
        })
      console.log("[v0] hasDataChanged:", hasDataChanged)
    }

    const newShift: Shift = {
      ...formData,
      id: initialShift?.id || String(Date.now()),
      totalHours: Number.parseFloat(
        (calculateTotalMinutes(formData.startTime, formData.endTime) -
          formData.breaks.reduce((sum, b) => sum + calculateTotalMinutes(b.start, b.end), 0) -
          formData.lunch.reduce((sum, l) => sum + calculateTotalMinutes(l.start, l.end), 0)) /
          60,
      ).toFixed(2),
    }
    newShift.breaks = [...formData.breaks].sort((a, b) => a.start.localeCompare(b.start))
    newShift.lunch = [...formData.lunch].sort((a, b) => a.start.localeCompare(b.start))

    setShowConfirm(true)
  }

  const handleConfirmUpdate = async () => {
    const isDuplicateTimeRange = existingShiftCombinations.some(
      (combo) =>
        combo.startTime === formData.startTime && combo.endTime === formData.endTime && combo.id !== initialShift?.id,
    )

    if (isDuplicateTimeRange) {
      const existingShift = existingShiftCombinations.find(
        (combo) =>
          combo.startTime === formData.startTime && combo.endTime === formData.endTime && combo.id !== initialShift?.id,
      )
      setTimeRangeError(`A shift already exists with the same start and end time: ${existingShift?.name}`)
      setShowConfirm(false)
      return
    }

    const totalMinutes =
      calculateTotalMinutes(formData.startTime, formData.endTime) -
      formData.breaks.reduce((sum, b) => sum + calculateTotalMinutes(b.start, b.end), 0) -
      formData.lunch.reduce((sum, l) => sum + calculateTotalMinutes(l.start, l.end), 0)

    if (initialShift) {
      onSave({
        ...formData,
        id: initialShift.id,
        totalHours: Number.parseFloat((totalMinutes / 60).toFixed(2)),
        shiftDurationHr: durationHours,
        shiftDurationMin: durationMinutes,
        breaks: [...formData.breaks].sort((a, b) => a.start.localeCompare(b.start)),
        lunch: [...formData.lunch].sort((a, b) => a.start.localeCompare(b.start)),
      } as Shift)
    } else {
      onSave({
        ...formData,
        totalHours: Number.parseFloat((totalMinutes / 60).toFixed(2)),
        shiftDurationHr: durationHours,
        shiftDurationMin: durationMinutes,
        breaks: [...formData.breaks].sort((a, b) => a.start.localeCompare(b.start)),
        lunch: [...formData.lunch].sort((a, b) => a.start.localeCompare(b.start)),
      })
    }

    setShowConfirm(false)
  }

  const addBreak = () => {
    setFormData((prev) => ({ ...prev, breaks: [...prev.breaks, { start: "10:00", end: "10:15" }] }))
  }

  const removeBreak = (index: number) => {
    setFormData((prev) => ({ ...prev, breaks: prev.breaks.filter((_, i) => i !== index) }))
  }

  const updateBreak = (index: number, field: "start" | "end", value: string) => {
    setFormData((prev) => ({
      ...prev,
      breaks: prev.breaks.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    }))
  }

  const addLunch = () => {
    setFormData((prev) => ({ ...prev, lunch: [...prev.lunch, { start: "12:00", end: "13:00" }] }))
  }

  const removeLunch = (index: number) => {
    setFormData((prev) => ({ ...prev, lunch: prev.lunch.filter((_, i) => i !== index) }))
  }

  const updateLunch = (index: number, field: "start" | "end", value: string) => {
    setFormData((prev) => ({
      ...prev,
      lunch: prev.lunch.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }))
  }

  const handleDurationChange = (type: "hours" | "minutes", value: string) => {
    allowDurationAutoCalc.current = true
    if (type === "hours") {
      setDurationHours(Number.parseInt(value))
    } else {
      setDurationMinutes(Number.parseInt(value))
    }
  }

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
  }

  if (!isOpen) return null

  if (timeRangeError) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-red-100 text-red-900">
                <AlertCircle className="w-5 h-5" />
              </span>
              Duplicate Shift
            </h2>
            <p className="text-sm text-muted-foreground mb-6">{timeRangeError}</p>
            <div className="flex gap-3">
              <Button onClick={() => setTimeRangeError(null)} className="flex-1">
                OK
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {initialShift ? "Confirm Update" : "Confirm Create"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Do you want to {initialShift ? "update" : "create"} the shift "
              <span className="font-medium text-foreground">{formData.name}</span>"?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button onClick={handleConfirmUpdate} className="flex-1">
                {initialShift ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border bg-primary/5 dark:bg-primary/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-300">
              <Clock className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {viewMode ? "View Shift" : initialShift ? "Edit Shift" : "Create New Shift"}
            </h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 pb-20 sm:pb-6">
          {/* Shift Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-chart-1/20 text-chart-1">
                <Edit className="w-4 h-4" />
              </span>
              Shift Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Morning Shift, Evening Shift"
              className={errors.name ? "border-destructive" : ""}
              disabled={viewMode}
              readOnly={viewMode}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Start Time and Shift Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-chart-2/20 text-chart-2">
                  <Clock className="w-4 h-4" />
                </span>
                Start Time
              </label>
              <TimePickerCompact
                value={formData.startTime}
                onChange={(time) => setFormData((prev) => ({ ...prev, startTime: time }))}
                disabled={viewMode}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-chart-3/20 text-chart-3">
                  <Clock className="w-4 h-4" />
                </span>
                Shift Duration
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  key={`duration-hours-${durationHours}`}
                  value={durationHours.toString()}
                  onValueChange={(value) => handleDurationChange("hours", value)}
                  disabled={viewMode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="0 hr" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px] overflow-y-auto">
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i} hr
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  key={`duration-minutes-${durationMinutes}`}
                  value={durationMinutes.toString()}
                  onValueChange={(value) => handleDurationChange("minutes", value)}
                  disabled={viewMode}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="0 min" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45].map((i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i} min
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* End Time - Read Only */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-chart-4/20 text-chart-4">
                <Clock className="w-4 h-4" />
              </span>
              End Time
            </label>
            <div className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium cursor-not-allowed opacity-50">
              {formatTimeTo12Hour(formData.endTime)}
            </div>
            {errors.timeRange && <p className="text-xs text-destructive mt-1">{errors.timeRange}</p>}
          </div>

          {/* Breaks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                <span className="p-1.5 rounded-md text-orange-900 bg-orange-100">
                  <Coffee className="w-4 h-4" />
                </span>
                Break Times
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addBreak}
                className="gap-1 hover:bg-primary/20 text-orange-900 bg-orange-100 border-orange-400"
                disabled={viewMode}
              >
                <Plus className="w-4 h-4" />
                Add Break
              </Button>
            </div>
            {formData.breaks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No breaks configured</p>
            ) : (
              <div className="space-y-3">
                {formData.breaks.map((brk, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-foreground mb-1">Start</label>
                      <div
                        className={
                          errors[`break-${idx}-start`] || errors[`break-${idx}-lunch`] || errors[`break-${idx}-range`]
                            ? "border border-destructive rounded-lg"
                            : ""
                        }
                      >
                        <TimePickerCompact
                          value={brk.start}
                          onChange={(time) => updateBreak(idx, "start", time)}
                          disabled={viewMode}
                        />
                      </div>
                      {(errors[`break-${idx}-start`] || errors[`break-${idx}-lunch`] || errors[`break-${idx}-range`]) && (
                        <p className="text-xs text-destructive mt-1">
                          {errors[`break-${idx}-start`] || errors[`break-${idx}-lunch`] || errors[`break-${idx}-range`]}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-foreground mb-1">End</label>
                      <div className={errors[`break-${idx}-end`] ? "border border-destructive rounded-lg" : ""}>
                        <TimePickerCompact
                          value={brk.end}
                          onChange={(time) => updateBreak(idx, "end", time)}
                          disabled={viewMode}
                        />
                      </div>
                      {errors[`break-${idx}-end`] && (
                        <p className="text-xs text-destructive mt-1">{errors[`break-${idx}-end`]}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBreak(idx)}
                      className="text-destructive"
                      disabled={viewMode}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {errors[`break-${0}-overlap`] && (
              <p className="text-xs text-destructive mt-2">Check for overlapping breaks</p>
            )}
          </div>

          {/* Lunch */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-foreground flex items-center gap-2">
                <span className="p-1.5 rounded-md text-pink-900 bg-pink-100">
                  <UtensilsCrossed className="w-4 h-4" />
                </span>
                Lunch Times
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLunch}
                className="gap-1 hover:bg-primary/20 text-pink-900 bg-pink-100 border-pink-400"
                disabled={viewMode}
              >
                <Plus className="w-4 h-4" />
                Add Lunch
              </Button>
            </div>
            {formData.lunch.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lunch configured</p>
            ) : (
              <div className="space-y-3">
                {formData.lunch.map((lnch, idx) => (
                  <div key={idx} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-foreground mb-1">Start</label>
                      <div
                        className={
                          errors[`lunch-${idx}-start`] || errors[`lunch-${idx}-break`] || errors[`lunch-${idx}-range`]
                            ? "border border-destructive rounded-lg"
                            : ""
                        }
                      >
                        <TimePickerCompact
                          value={lnch.start}
                          onChange={(time) => updateLunch(idx, "start", time)}
                          disabled={viewMode}
                        />
                      </div>
                      {(errors[`lunch-${idx}-start`] || errors[`lunch-${idx}-break`] || errors[`lunch-${idx}-range`]) && (
                        <p className="text-xs text-destructive mt-1">
                          {errors[`lunch-${idx}-start`] || errors[`lunch-${idx}-break`] || errors[`lunch-${idx}-range`]}
                        </p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-foreground mb-1">End</label>
                      <div className={errors[`lunch-${idx}-end`] ? "border border-destructive rounded-lg" : ""}>
                        <TimePickerCompact
                          value={lnch.end}
                          onChange={(time) => updateLunch(idx, "end", time)}
                          disabled={viewMode}
                        />
                      </div>
                      {errors[`lunch-${idx}-end`] && (
                        <p className="text-xs text-destructive mt-1">{errors[`lunch-${idx}-end`]}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLunch(idx)}
                      className="text-destructive"
                      disabled={viewMode}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {errors[`lunch-${0}-overlap`] && (
              <p className="text-xs text-destructive mt-2">Check for overlapping lunch periods</p>
            )}
          </div>

          {/* Total Hours and Grace Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-purple-100 text-purple-900">
                  <Clock className="w-4 h-4" />
                </span>
                Total Hours
              </label>
              <div className="px-4 py-2 rounded-lg border border-border bg-background text-sm font-medium opacity-50">
                {formData.totalHours >= 0
                  ? `${Math.floor(formData.totalHours)} hr ${Math.round((formData.totalHours % 1) * 60)} min`
                  : `-${Math.floor(Math.abs(formData.totalHours))} hr ${Math.round((Math.abs(formData.totalHours) % 1) * 60)} min`}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <span className="p-1.5 rounded-md bg-red-100 text-red-900">
                  <Clock className="w-4 h-4" />
                </span>
                Grace time for late
              </label>
              <Select
                key={`grace-${formData.gracePeriod.lateIn}`}
                value={formData.gracePeriod.lateIn === 0 ? "0 mins" : `${formData.gracePeriod.lateIn} mins`}
                onValueChange={(value) => {
                  const mins = Number.parseInt(value.split(" ")[0])
                  setFormData((prev) => ({ ...prev, gracePeriod: { lateIn: mins } }))
                }}
                disabled={viewMode}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select grace time" />
                </SelectTrigger>
                <SelectContent>
                  {graceOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gracePeriod && <p className="text-xs text-destructive mt-1">{errors.gracePeriod}</p>}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            {viewMode ? (
              <Button type="button" onClick={onClose} className="flex-1">
                Close
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {initialShift ? "Update Shift" : "Create Shift"}
                </Button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
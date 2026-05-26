"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Shift } from "@/lib/types"
import { EditIcon, Trash2, Clock, Coffee, UtensilsCrossed, Eye } from "lucide-react"
import { getShiftColor, to12HourFormat } from "@/lib/shift-utils"
import ShiftHistoryModal from "./shift-history-modal"
import type { ShiftVersion } from "@/lib/types"

interface ShiftCardProps {
  shift: Shift
  onEdit: (shift: Shift) => void
  onDelete: (id: string) => void
  hideActions?: boolean
  onView: (shift: Shift) => void
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
}

export default function ShiftCard({
  shift,
  onEdit,
  onDelete,
  hideActions = false,
  onView,
  canEdit = true,
  canDelete = true,
  canView = true,
}: ShiftCardProps) {
  const colors = getShiftColor(shift.shiftType)
  const [historyOpen, setHistoryOpen] = useState(false)

  const formatTimeRange = (ranges: Array<{ start: string; end: string }>) => {
    if (ranges.length === 0) return ""
    return ranges.map((r) => `${to12HourFormat(r.start)} — ${to12HourFormat(r.end)}`).join(", ")
  }

  const formatGracePeriod = (gracePeriod: { lateIn?: number }) => {
    return gracePeriod.lateIn ? `${gracePeriod.lateIn} mins` : "—"
  }

  // For now, using empty array until history API is implemented
  const history: ShiftVersion[] = []

  const sortedBreaks = [...shift.breaks].sort((a, b) => a.start.localeCompare(b.start))
  const sortedLunch = [...shift.lunch].sort((a, b) => a.start.localeCompare(b.start))

  const handleRestoreVersion = (version: ShiftVersion) => {
    onEdit({
      ...shift,
      ...version.shift,
      id: shift.id,
    })
  }

  return (
    <>
      <div className={`${colors.border} border rounded-lg overflow-hidden ${colors.bg} transition-all hover:shadow-md`}>
        {/* Header */}
        <div className="p-4 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-foreground">{shift.name}</h3>
          </div>
          {!hideActions && (
            <div className="flex gap-2">
              {canView && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(shift)}
                  className="h-8 w-8 p-0 hover:text-foreground text-blue-600"
                >
                  <Eye className="w-4 h-4" />
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(shift)}
                  className="h-8 w-8 p-0 hover:text-foreground text-green-700"
                >
                  <EditIcon className="w-4 h-4" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(shift.id)}
                  className="h-8 w-8 p-0 hover:text-destructive text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Time Range */}
          <div className="flex items-start gap-3">
            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-700" />
            <div>
              <p className="text-sm text-foreground font-semibold">Shift timing</p>
              <p className="font-medium border border-solid px-3 py-1 text-xs rounded-full text-green-900 bg-green-200 border-green-400">
                {to12HourFormat(shift.startTime)} - {to12HourFormat(shift.endTime)}
              </p>
            </div>
          </div>

          {/* Breaks */}
          {shift.breaks.length > 0 && (
            <div className="flex items-start gap-3">
              <Coffee className="w-4 h-4 mt-0.5 flex-shrink-0 text-orange-900" />
              <div className="flex-1">
                <p className="text-sm mb-2 text-foreground font-semibold">Breaks</p>
                <div className="flex flex-wrap gap-2">
                  {sortedBreaks.map((brk, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-100 text-xs font-medium border border-solid border-orange-400"
                    >
                      {to12HourFormat(brk.start)} — {to12HourFormat(brk.end)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Lunch */}
          {shift.lunch.length > 0 && (
            <div className="flex items-start gap-3">
              <UtensilsCrossed className="w-4 h-4 mt-0.5 flex-shrink-0 text-pink-900" />
              <div className="flex-1">
                <p className="text-sm mb-2 text-foreground font-semibold">Lunch</p>
                <div className="flex flex-wrap gap-2">
                  {sortedLunch.map((lnch, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-950 text-pink-900 dark:text-pink-100 text-xs font-medium border-solid border border-pink-400"
                    >
                      {to12HourFormat(lnch.start)} — {to12HourFormat(lnch.end)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-inherit grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-foreground font-semibold">Total Hours</p>
              <p className="text-sm font-semibold text-green-700">
                {shift.totalHours >= 0
                  ? `${Math.floor(shift.totalHours)} hr ${Math.round((shift.totalHours % 1) * 60)} min`
                  : `-${Math.floor(Math.abs(shift.totalHours))} hr ${Math.round((Math.abs(shift.totalHours) % 1) * 60)} min`}
              </p>
            </div>
            <div>
              <p className="text-xs text-right text-foreground font-semibold">Grace time for late</p>
              <p className="text-sm font-semibold text-right text-red-600">{formatGracePeriod(shift.gracePeriod)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* History Modal - Will be empty until backend provides history API */}
      <ShiftHistoryModal
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        history={history}
        shiftName={shift.name}
        onRestore={handleRestoreVersion}
      />
    </>
  )
}

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { ShiftVersion } from "@/lib/types"
import ShiftCard from "./shift-card"
import { to12HourFormat } from "@/lib/shift-utils"

interface ShiftHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  history: ShiftVersion[]
  shiftName: string
  onRestore: (version: ShiftVersion) => void
}

export default function ShiftHistoryModal({
  open,
  onOpenChange,
  history,
  shiftName,
  onRestore,
}: ShiftHistoryModalProps) {
  const [selectedVersionNumber, setSelectedVersionNumber] = useState(history[0]?.version || 1)
  const selectedVersion = history.find((v) => v.version === selectedVersionNumber)

  const handleRestore = () => {
    if (selectedVersion) {
      onRestore(selectedVersion)
      onOpenChange(false)
    }
  }

  const formatDateRange = (shift: ShiftVersion["shift"], isCurrent: boolean) => {
    const date = new Date()
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    const startTimeFormatted = to12HourFormat(shift.startTime)
    const endTimeFormatted = to12HourFormat(shift.endTime)

    if (isCurrent) {
      return `${dateStr} ${startTimeFormatted} – Current`
    }
    return `${dateStr} ${startTimeFormatted} – ${dateStr} ${endTimeFormatted}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto rounded-lg">
        <DialogHeader>
          <DialogTitle>Shift History - {shiftName}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Left: Version Timeline */}
          <div className="w-32 flex flex-col gap-2 border-r pr-4">
            <p className="text-xs font-semibold text-foreground/70 mb-2">VERSIONS</p>
            {history.map((v) => (
              <button
                key={v.version}
                onClick={() => setSelectedVersionNumber(v.version)}
                className={`text-left px-3 py-2 rounded-md transition-colors ${
                  selectedVersionNumber === v.version
                    ? "bg-blue-500 text-white font-semibold"
                    : "hover:bg-foreground/10 text-foreground/70"
                }`}
              >
                <div className="text-sm font-medium">v{v.version}</div>
                <div className="text-xs opacity-75">{v.version === history[0].version && "(current)"}</div>
              </button>
            ))}
          </div>

          {/* Right: Version Details */}
          {selectedVersion && (
            <div className="flex-1">
              <div className="mb-4 text-xs text-foreground/70">
                <p className="font-medium text-sm text-foreground">
                  Changed by: <span className="font-semibold text-green-400">{selectedVersion.changedBy}</span>
                </p>
                <p className="text-foreground text-sm font-medium">
                  Effective Period:{" "}
                  <span className="font-semibold text-red-500">
                    {formatDateRange(selectedVersion.shift, selectedVersion.version === history[0].version)}
                  </span>
                </p>
              </div>

              <div className="mb-6">
                <ShiftCard shift={selectedVersion.shift} onEdit={() => {}} onDelete={() => {}} hideActions={true} />
              </div>

              {/* Action Button */}
              {selectedVersion.version !== history[0].version && (
                <Button onClick={handleRestore} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Restore this version
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

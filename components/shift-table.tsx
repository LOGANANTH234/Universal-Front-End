"use client"

import { Button } from "@/components/ui/button"
import type { Shift } from "@/lib/types"
import { Edit2, Trash2, Eye } from "lucide-react"
import { formatHours } from "@/lib/shift-utils"

interface ShiftTableProps {
  shifts: Shift[]
  onEdit: (shift: Shift) => void
  onDelete: (id: string) => void
  onView: (shift: Shift) => void
}

export default function ShiftTable({ shifts, onEdit, onDelete, onView }: ShiftTableProps) {
  const formatTimeRange = (ranges: Array<{ start: string; end: string }>) => {
    if (ranges.length === 0) return "—"
    return ranges.map((r) => `${r.start}–${r.end}`).join(", ")
  }

  const formatGracePeriod = (gracePeriod: { lateIn?: number; earlyOut?: number }) => {
    const parts = []
    if (gracePeriod.lateIn) parts.push(`Late: ${gracePeriod.lateIn}m`)
    if (gracePeriod.earlyOut) parts.push(`Early: ${gracePeriod.earlyOut}m`)
    return parts.length > 0 ? parts.join(", ") : "None"
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Shift Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Start Time</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">End Time</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Breaks</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Lunch</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Grace Period</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Total Hours</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shifts.map((shift) => (
              <tr key={shift.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-foreground">{shift.name}</td>
                <td className="px-6 py-4 text-sm text-foreground">{shift.startTime}</td>
                <td className="px-6 py-4 text-sm text-foreground">{shift.endTime}</td>
                <td className="px-6 py-4 text-sm text-foreground">{formatTimeRange(shift.breaks)}</td>
                <td className="px-6 py-4 text-sm text-foreground">{formatTimeRange(shift.lunch)}</td>
                <td className="px-6 py-4 text-sm text-foreground">{formatGracePeriod(shift.gracePeriod)}</td>
                <td className="px-6 py-4 text-sm font-medium text-foreground">{formatHours(shift.totalHours)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(shift)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(shift)}
                      className="text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(shift.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

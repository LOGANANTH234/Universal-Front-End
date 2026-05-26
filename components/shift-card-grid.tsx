"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Shift } from "@/lib/types"
import { Edit2, Trash2 } from "lucide-react"
import ShiftBadge from "./shift-badge"

interface ShiftCardGridProps {
  shifts: Shift[]
  onEdit: (shift: Shift) => void
  onDelete: (id: string) => void
}

export default function ShiftCardGrid({ shifts, onEdit, onDelete }: ShiftCardGridProps) {
  const getCardGradient = (type: Shift["type"]) => {
    switch (type) {
      case "morning":
        return "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40 border-l-4 border-blue-400"
      case "afternoon":
        return "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border-l-4 border-amber-400"
      case "night":
        return "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border-l-4 border-indigo-400"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {shifts.map((shift) => (
        <Card
          key={shift.id}
          className={`p-6 hover:shadow-xl transition-all duration-300 cursor-default ${getCardGradient(shift.type)}`}
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-foreground">{shift.employee}</h3>
                <p className="text-sm text-muted-foreground">{shift.position}</p>
              </div>
              <ShiftBadge type={shift.type} />
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
                <p className="text-sm font-medium text-foreground">{shift.date}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Start</p>
                  <p className="text-sm font-medium text-foreground">{shift.startTime}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">End</p>
                  <p className="text-sm font-medium text-foreground">{shift.endTime}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  shift.status === "confirmed"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
              >
                {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
              </span>
              <div className="flex gap-2">
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
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

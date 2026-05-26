"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import type { EmployeeVersion } from "@/lib/employee-types"
import EmployeeViewModal from "./employee-view-modal"

interface EmployeeHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  history: EmployeeVersion[]
  employeeName: string
  onRestore: (version: EmployeeVersion) => void
}

export default function EmployeeHistoryModal({
  open,
  onOpenChange,
  history = [],
  employeeName,
  onRestore,
}: EmployeeHistoryModalProps) {
  const [selectedVersionNumber, setSelectedVersionNumber] = useState(history[0]?.version || 1)
  const [viewDetailsEmployee, setViewDetailsEmployee] = useState<EmployeeVersion | null>(null)

  const selectedVersion = history.find((v) => v.version === selectedVersionNumber)

  const handleRestore = () => {
    if (selectedVersion) {
      onRestore(selectedVersion)
      onOpenChange(false)
    }
  }

  const formatDateRange = (version: EmployeeVersion, isCurrent: boolean) => {
    const startDate = new Date(version.timestamp)
    const startStr = startDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })

    if (isCurrent) {
      return `${startStr} – Current`
    }

    // If there's an end timestamp, show the full range
    if (version.endTimestamp) {
      const endDate = new Date(version.endTimestamp)
      const endStr = endDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      return `${startStr} – ${endStr}`
    }

    return startStr
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto rounded-lg">
          <DialogHeader>
            <DialogTitle>Employee History - {employeeName}</DialogTitle>
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
                    Changed by:{" "}
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {selectedVersion.changedBy}
                    </span>
                  </p>
                  <p className="text-foreground text-sm font-medium">
                    Effective Period:{" "}
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {formatDateRange(selectedVersion, selectedVersion.version === history[0].version)}
                    </span>
                  </p>
                </div>

                <div className="mb-6 relative">
                  {/* Eye Icon for View Details */}
                  <button
                    onClick={() => setViewDetailsEmployee(selectedVersion)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} className="text-blue-600 dark:text-blue-400" />
                  </button>

                  <div className="bg-sky-50 dark:bg-slate-900 border border-sky-200 dark:border-sky-700 rounded-lg shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-sky-200 dark:border-sky-700">
                      <div className="flex gap-4 items-center flex-1">
                        {/* Profile Image */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 border-2 border-sky-300 dark:border-sky-600 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {selectedVersion.employee.profileImage ? (
                            <img
                              src={selectedVersion.employee.profileImage || "/placeholder.svg"}
                              alt={selectedVersion.employee.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                              {selectedVersion.employee.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Name, Role, Phone */}
                        <div className="flex flex-col justify-start flex-1">
                          <h3 className="text-gray-900 dark:text-gray-100 font-semibold text-lg">
                            {selectedVersion.employee.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-0.5">{selectedVersion.employee.role}</p>
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1.5">
                            {selectedVersion.employee.phone}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 space-y-4">
                      {/* Regular Shifts */}
                      {selectedVersion.employee.regularShifts.length > 0 && (
                        <div className="pb-4 border-b border-sky-100 dark:border-sky-800">
                          <p className="text-sm font-semibold text-foreground mb-2.5">Shift Timing</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedVersion.employee.regularShifts.map((shift) => (
                              <div
                                key={shift.id}
                                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap text-green-900 bg-green-200 border border-green-400 dark:bg-green-900/20 dark:border-green-600 dark:text-green-300"
                              >
                                {shift.shiftName}: ₹{shift.amount} ({shift.amountType})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Overtime */}
                      {selectedVersion.employee.overtimeShifts.length > 0 && (
                        <div className="pb-4 border-b border-sky-100 dark:border-sky-800">
                          <p className="text-sm font-semibold text-foreground mb-2.5">Overtime</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedVersion.employee.overtimeShifts.map((shift) => (
                              <div
                                key={shift.id}
                                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap text-orange-900 bg-orange-100 border border-orange-400 dark:bg-orange-900/20 dark:border-orange-600 dark:text-orange-300"
                              >
                                {shift.shiftName}: ₹{shift.amount} ({shift.amountType})
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Salary Frequency */}
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-2.5">Salary Frequency</p>
                        <div className="px-3 py-1.5 rounded-full text-xs font-medium inline-block text-pink-900 bg-pink-100 border border-pink-400 dark:bg-pink-900/20 dark:border-pink-600 dark:text-pink-300">
                          {selectedVersion.employee.salaryConfig?.frequency || "Not Set"}
                        </div>
                      </div>
                    </div>
                  </div>
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

      {viewDetailsEmployee && (
        <EmployeeViewModal
          employee={viewDetailsEmployee.employee}
          open={!!viewDetailsEmployee}
          onClose={() => setViewDetailsEmployee(null)}
        />
      )}
    </>
  )
}

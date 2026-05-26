"use client"

import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Employee } from "@/lib/employee-types"
import { formatConstant } from "@/lib/utils"
import { useState, useEffect } from "react"
import { fetchShifts } from "@/lib/api/shifts"
import type { Shift } from "@/lib/types"

interface EmployeeViewModalProps {
  employee: Employee
  open: boolean
  onClose: () => void
}

export default function EmployeeViewModal({ employee, open, onClose }: EmployeeViewModalProps) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [shiftsLoading, setShiftsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const loadShifts = async () => {
        try {
          setShiftsLoading(true)
          const fetchedShifts = await fetchShifts()
          setShifts(fetchedShifts)
        } catch (error) {
          console.error("[v0] Failed to load shifts:", error)
        } finally {
          setShiftsLoading(false)
        }
      }
      loadShifts()
    }
  }, [open])

  if (!open) return null

  const getShiftTimeDisplay = (shiftName: string) => {
    const shift = shifts.find((s) => s.name === shiftName)
    if (!shift) return shiftName
    return `${shiftName} (${shift.startTime} - ${shift.endTime})`
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] overflow-hidden">
      <div className="flex h-full flex-col bg-card">
        {/* Header */}
        <div className="bg-slate-800 dark:bg-slate-950 text-white p-6 flex items-center justify-between shadow-lg flex-shrink-0">
          <h2 className="text-2xl font-semibold tracking-tight">View Employee Details</h2>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-lg transition">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 tracking-wide">
              👤 Personal Information
            </h3>

            {/* Profile Image Section + Form Fields - Exact match to form modal */}
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image Section */}
              <div className="md:w-32 md:flex-shrink-0 flex flex-col items-center md:items-start">
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center overflow-hidden border-4 border-slate-300 dark:border-slate-600 shadow-md">
                  {employee.profileImage ? (
                    <img
                      src={employee.profileImage || "/placeholder.svg"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl">👤</span>
                  )}
                </div>
              </div>

              <div className="flex-1 md:flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Row 1: Employee Name, Employee ID, Phone */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                      Employee Name <span className="text-amber-600 dark:text-amber-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={employee.name}
                      disabled
                      readOnly
                      className="h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                      Employee ID <span className="text-amber-600 dark:text-amber-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={employee.employeeId}
                      disabled
                      readOnly
                      className="h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                      Phone No <span className="text-amber-600 dark:text-amber-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      value={employee.phone}
                      disabled
                      readOnly
                      className="h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                    />
                  </div>
                </div>

                {/* Row 2: Role, Gender, Status */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                      Role <span className="text-amber-600 dark:text-amber-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={employee.role}
                      disabled
                      readOnly
                      className="h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                      Gender <span className="text-amber-600 dark:text-amber-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={employee.gender}
                      disabled
                      readOnly
                      className="h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                      Status <span className="text-amber-600 dark:text-amber-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={employee.status}
                      disabled
                      readOnly
                      className="h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                    />
                  </div>
                </div>

                {/* Row 3: Email, PAN */}
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">Email</label>
                    <Input
                      type="email"
                      value={employee.email || ""}
                      disabled
                      readOnly
                      className="h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">PAN</label>
                    <Input
                      type="text"
                      value={employee.pan || ""}
                      disabled
                      readOnly
                      className="h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                    />
                  </div>
                </div>

                {/* Row 4: Aadhaar (full width) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">Aadhaar</label>
                  <Input
                    type="text"
                    value={employee.aadhaar || ""}
                    disabled
                    readOnly
                    className="h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Salary Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 tracking-wide">
              💰 Salary Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                  Salary Frequency <span className="text-amber-600 dark:text-amber-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formatConstant(employee.salaryConfig?.frequency || "")}
                  disabled
                  readOnly
                  className="h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                  Workday Policy <span className="text-amber-600 dark:text-amber-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formatConstant(employee.salaryConfig?.workdayPolicy || "")}
                  disabled
                  readOnly
                  className="h-11 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Regular Shifts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 tracking-wide">
              🔄 Regular Shifts <span className="text-amber-600 dark:text-amber-500">*</span>
            </h3>

            <div className="space-y-3">
              {employee.regularShifts?.map((shift) => (
                <div
                  key={shift.id}
                  className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 border-l-4 border-l-slate-400 dark:border-l-slate-500 p-4 rounded-lg space-y-3"
                >
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                      Shift Name <span className="text-amber-600 dark:text-amber-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={getShiftTimeDisplay(shift.shiftName)}
                      disabled
                      readOnly
                      className="h-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                        Amount Type <span className="text-amber-600 dark:text-amber-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={formatConstant(shift.amountType)}
                        disabled
                        readOnly
                        className="h-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                        Amount <span className="text-amber-600 dark:text-amber-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={shift.amount}
                        disabled
                        readOnly
                        className="h-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                        Extra Allowance
                      </label>
                      <Input
                        type="text"
                        value={shift.extraAllowance}
                        disabled
                        readOnly
                        className="h-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-transparent mb-2 tracking-wide select-none">
                        Action
                      </label>
                      <div className="h-10"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overtime Shifts */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 tracking-wide">
              🕰️ Overtime Shifts
            </h3>

            {employee.overtimeShifts && employee.overtimeShifts.length > 0 ? (
              <div className="space-y-3">
                {employee.overtimeShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 border-l-4 border-l-slate-400 dark:border-l-slate-500 p-4 rounded-lg space-y-3"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                        Shift Name
                      </label>
                      <Input
                        type="text"
                        value={getShiftTimeDisplay(shift.shiftName)}
                        disabled
                        readOnly
                        className="h-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                          Amount Type
                        </label>
                        <Input
                          type="text"
                          value={formatConstant(shift.amountType)}
                          disabled
                          readOnly
                          className="h-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                          Amount <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          value={shift.amount}
                          disabled
                          readOnly
                          className="h-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                          Extra Allowance
                        </label>
                        <Input
                          type="text"
                          value={shift.extraAllowance}
                          disabled
                          readOnly
                          className="h-10 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed border-slate-300 dark:border-slate-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-transparent mb-2 tracking-wide select-none">
                          Action
                        </label>
                        <div className="h-10"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer with Close Button */}
        <div className="bg-white dark:bg-slate-950 p-6 border-t border-slate-200 dark:border-slate-800 flex gap-2 sm:gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

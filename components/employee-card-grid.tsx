"use client"

import { Phone, MoreVertical, Edit2, Trash2, ShuffleIcon, LucideTimerOff as LucideTimerOffIcon, IndianRupeeIcon, UserCircle2Icon, User, Eye, CheckCircle, XCircle, Key } from "lucide-react"
import type { Employee } from "@/lib/employee-types"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatConstant } from "@/lib/utils"
import EmployeeViewModal from "@/components/employee-view-modal"
import ChangePasswordModal from "@/components/change-password-modal"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import { apiPut } from "@/lib/api-client" // Declare the apiPut variable

interface EmployeeCardGridProps {
  employees: Employee[]
  onEdit: (employee: Employee) => void
  onDelete: (id: string) => void
  onStatusChange?: (id: string, status: string) => void
  onViewHistory?: (employee: Employee) => void
  canEdit?: boolean
  canDelete?: boolean
  canInactive?: boolean
  canView?: boolean
  canUpdatePassword?: boolean
  canDeactivate?: boolean
}

export default function EmployeeCardGrid({
  employees,
  onEdit,
  onDelete,
  onStatusChange,
  onViewHistory,
  canEdit = true,
  canDelete = true,
  canInactive = true,
  canView = true,
  canUpdatePassword = true,
  canDeactivate = true,
}: EmployeeCardGridProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmStatus, setConfirmStatus] = useState<{ id: string; status: string } | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [changePasswordEmployee, setChangePasswordEmployee] = useState<Employee | null>(null)

  const handleDelete = (id: string, name: string) => {
    setConfirmDelete(id)
  }

  const handleStatusChange = (employee: Employee, newStatus: string) => {
    setConfirmStatus({ id: employee.id, status: newStatus })
  }

  const handleViewEmployee = (employee: Employee) => {
    setViewingEmployee(employee)
    setViewModalOpen(true)
  }

  const handleChangePassword = (employee: Employee) => {
    setChangePasswordEmployee(employee)
    setChangePasswordOpen(true)
  }

  const handleConfirmDelete = () => {
    if (confirmDelete) {
      onDelete(confirmDelete)
      setConfirmDelete(null)
    }
  }

  const handleConfirmStatus = () => {
    if (confirmStatus) {
      if (onStatusChange) {
        onStatusChange(confirmStatus.id, confirmStatus.status)
      }
      setConfirmStatus(null)
    }
  }

  const handlePasswordUpdate = async (newPassword: string, confirmPassword: string) => {
    if (!changePasswordEmployee) {
      throw new Error("Employee data is missing")
    }

    try {
      const response = await apiClient(`http://13.206.112.19:8080/api/users/${changePasswordEmployee.id}`, {
        method: "PUT",
        body: {
          newPassword,
          confirmPassword,
        },
        isPublic: false,
      })

      // Backend returns plain text "Updated." so we just check if response is ok
      if (!response.ok) {
        throw new Error(`Failed to update password: ${response.statusText}`)
      }

      console.log("[v0] Password updated successfully for employee:", changePasswordEmployee.id)
    } catch (error: any) {
      console.error("[v0] Password update error:", error.message)
      throw error
    }
  }

  if (employees.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-muted-foreground">No employees found. Create one to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {employees.map((employee) => {
          const isActive = employee.status === "Active"

          return (
            <div
              key={employee.id}
              className="bg-sky-50 dark:bg-slate-900 border border-sky-200 dark:border-sky-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col h-full"
            >
              {/* Header with Profile, Name, Role, Phone, Menu */}
              <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-sky-200 dark:border-sky-700">
                <div className="flex gap-4 items-center flex-1 min-w-0">
                  {/* Profile Image */}
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900 dark:to-purple-900 border-2 border-sky-300 dark:border-sky-600 shadow-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {employee.profileImage ? (
                      <img
                        src={employee.profileImage || "/placeholder.svg"}
                        alt={employee.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">
                        {employee.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name, Role, Phone */}
                  <div className="flex flex-col justify-start flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-primary dark:text-blue-400 flex-shrink-0" />
                      <h3 className="text-primary dark:text-blue-400 font-semibold truncate">{employee.name}</h3>
                    </div>
                    <p className="text-sm dark:text-gray-400 mt-0.5 text-red-600 flex items-center gap-1.5 font-semibold">
                      <UserCircle2Icon size={14} className="flex-shrink-0 text-red-600" />
                      <span className="truncate">{employee.role}</span>
                    </p>
                    <p className="text-xs dark:text-gray-400 mt-1.5 flex items-center gap-1.5 text-green-600 font-medium">
                      <Phone size={14} className="flex-shrink-0" />
                      <span className="truncate">{employee.phone}</span>
                    </p>
                  </div>
                </div>

                {/* History Button and 3-dot Menu */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* 3-dot Menu */}
                  {(canView || canEdit || canDelete || canInactive || canUpdatePassword || canDeactivate) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition cursor-pointer flex-shrink-0">
                          <MoreVertical size={20} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {canView && (
                          <DropdownMenuItem
                            onClick={() => handleViewEmployee(employee)}
                            className="flex items-center gap-2 cursor-pointer text-blue-600 dark:text-blue-400 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-900/20"
                          >
                            <Eye className="size-4 text-blue-600 dark:text-blue-400" />
                            View
                          </DropdownMenuItem>
                        )}
                        {canUpdatePassword && (
                          <DropdownMenuItem
                            onClick={() => handleChangePassword(employee)}
                            className="flex items-center gap-2 cursor-pointer text-purple-600 dark:text-purple-400 focus:text-purple-600 focus:bg-purple-50 dark:focus:bg-purple-900/20"
                          >
                            <Key className="size-4 text-purple-600 dark:text-purple-400" />
                            Change Password
                          </DropdownMenuItem>
                        )}
                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => onEdit(employee)}
                            className="flex items-center gap-2 cursor-pointer text-green-600 dark:text-green-400 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-900/20"
                          >
                            <Edit2 className="size-4 text-green-600 dark:text-green-400" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(employee.id, employee.name)}
                            className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                          >
                            <Trash2 className="size-4 text-red-600 dark:text-red-400" />
                            Delete
                          </DropdownMenuItem>
                        )}
                        {canDeactivate && <DropdownMenuSeparator />}
                        {canDeactivate && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(employee, isActive ? "Inactive" : "Active")}
                            className={`flex items-center gap-2 cursor-pointer font-medium ${
                              isActive
                                ? "text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                                : "text-green-600 dark:text-green-400 focus:text-green-600 focus:bg-green-50 dark:focus:bg-green-900/20"
                            }`}
                          >
                            {isActive ? (
                              <>
                                <XCircle className="size-4 text-red-600 dark:text-red-400" />
                                <span>Mark as Inactive</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                                <span>Mark as Active</span>
                              </>
                            )}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Content sections */}
              <div className="px-6 py-4 space-y-4 flex-1">
                {/* Shift Timing */}
                {employee.regularShifts.length > 0 && (
                  <div className="pb-4 border-b border-sky-100 dark:border-sky-800">
                    <p className="dark:text-gray-400 mb-2.5 flex items-center gap-2 text-sm text-foreground font-semibold">
                      <ShuffleIcon size={14} className="dark:text-green-400 text-green-700" />
                      Shift Timing
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {employee.regularShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="px-3 py-1.5 rounded-full dark:bg-green-900/20 border dark:border-green-600 text-xs font-medium dark:text-green-300 whitespace-nowrap text-green-900 bg-green-200 border-green-400"
                        >
                          {shift.shiftName}: ₹{shift.amount} ({formatConstant(shift.amountType)})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overtime */}
                {employee.overtimeShifts.length > 0 && (
                  <div className="pb-4 border-b border-sky-100 dark:border-sky-800">
                    <p className="dark:text-gray-400 mb-2.5 flex items-center gap-2 text-sm text-foreground font-semibold">
                      <LucideTimerOffIcon size={14} className="dark:text-orange-400 text-orange-900" />
                      Overtime
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {employee.overtimeShifts.map((shift) => (
                        <div
                          key={shift.id}
                          className="px-3 py-1.5 rounded-full dark:bg-orange-900/20 border dark:border-orange-600 text-xs font-medium dark:text-orange-300 whitespace-nowrap text-orange-900 bg-orange-100 border-orange-400"
                        >
                          {shift.shiftName}: ₹{shift.amount} ({formatConstant(shift.amountType)})
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Salary Frequency */}
                <div>
                  <p className="dark:text-gray-400 mb-2.5 flex items-center gap-2 text-sm text-foreground font-semibold">
                    <IndianRupeeIcon size={14} className="text-pink-600 dark:text-pink-400" />
                    Salary Frequency
                  </p>
                  <div className="px-3 py-1.5 rounded-full dark:bg-pink-900/20 border dark:border-pink-600 text-xs font-medium dark:text-pink-300 inline-block text-pink-900 bg-pink-100 border-pink-400">
                    {formatConstant(employee.salaryConfig?.frequency || "Not Set")}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Custom confirmation dialogs */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Confirm Delete</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Do you want to delete the employee "
                <span className="font-medium text-foreground">
                  {employees.find((e) => e.id === confirmDelete)?.name}
                </span>
                "?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setConfirmDelete(null)} className="flex-1 bg-transparent">
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

      {confirmStatus && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Confirm Status Change</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Do you want to change the status to "
                <span className="font-medium text-foreground">{confirmStatus.status}</span>"?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setConfirmStatus(null)} className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button onClick={handleConfirmStatus} className="flex-1">
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingEmployee && (
        <EmployeeViewModal
          employee={viewingEmployee}
          open={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false)
            setViewingEmployee(null)
          }}
        />
      )}

      {changePasswordEmployee && (
        <ChangePasswordModal
          employeeName={changePasswordEmployee.name}
          open={changePasswordOpen}
          onClose={() => {
            setChangePasswordOpen(false)
            setChangePasswordEmployee(null)
          }}
          onSubmit={handlePasswordUpdate}
        />
      )}
    </>
  )
}

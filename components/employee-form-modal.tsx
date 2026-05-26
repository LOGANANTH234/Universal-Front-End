"use client"

import { useState, useEffect } from "react"
import { X, Search, Plus, Trash2, AlertCircle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import type { Employee, ValidationError } from "@/lib/employee-types"
import {
  validateEmployee,
  getAvailableShiftsForOvertime,
  checkShiftOverlap,
  checkGlobalShiftOverlap,
} from "@/lib/employee-utils"
import { fetchShifts } from "@/lib/api/shifts"
import { to12HourFormat } from "@/lib/shift-utils"
import type { Shift } from "@/lib/types"
import WarningDialog from "@/components/warning-dialog"
import ShiftSearchModal from "@/components/shift-search-modal"
import { Spinner } from "@/components/ui/spinner"

// Define WorkdayPolicy type explicitly
type WorkdayPolicy = "Include All Days" | "Exclude Sundays" | "Exclude Saturdays & Sundays"

interface EmployeeFormModalProps {
  isOpen: boolean
  employee?: Employee
  onClose: () => void
  onSave: (employee: Employee) => void
}

export default function EmployeeFormModal({ isOpen, employee, onClose, onSave }: EmployeeFormModalProps) {
  const [formData, setFormData] = useState<Employee>({
    id: "",
    name: "",
    employeeId: "",
    phone: "",
    email: "",
    pan: "",
    aadhaar: "",
    profileImage: "",
    role: "Operator",
    gender: "Male",
    status: "Active",
    regularShifts: [],
    overtimeShifts: [],
    salaryConfig: {
      frequency: "By Month",
      workdayPolicy: "Exclude Sundays",
    },
  })

  const [errors, setErrors] = useState<ValidationError[]>([])
  const [showWorkdayTooltip, setShowWorkdayTooltip] = useState(false)
  const [showAmountTypeTooltip, setShowAmountTypeTooltip] = useState(false)
  const [overlappingShifts, setOverlappingShifts] = useState<string[]>([])
  const [showWarningDialog, setShowWarningDialog] = useState(false)
  const [showConfirmSaveDialog, setShowConfirmSaveDialog] = useState(false) // added state for save confirmation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [validationMessages, setValidationMessages] = useState<string[]>([])
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [isRegularShiftSearchOpen, setIsRegularShiftSearchOpen] = useState(false)
  const [isOvertimeShiftSearchOpen, setIsOvertimeShiftSearchOpen] = useState(false)
  const [currentEditingShiftId, setCurrentEditingShiftId] = useState<string | null>(null)
  const [roleLabels, setRoleLabels] = useState<string[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)

  const [availableShifts, setAvailableShifts] = useState<Shift[]>([])
  const [shiftsLoading, setShiftsLoading] = useState(false)

  const convertAmountTypeFromAPI = (amountType: string): string => {
    const mapping: { [key: string]: string } = {
      PER_SHIFT: "Per Shift",
      PER_DAY: "Per Day",
      PER_HOUR: "Per Hour",
      PER_MONTH: "Per Month",
    }
    return mapping[amountType] || amountType
  }

  useEffect(() => {
    if (isOpen) {
      const loadShifts = async () => {
        try {
          setShiftsLoading(true)
          const shifts = await fetchShifts()
          setAvailableShifts(shifts)
        } catch (error) {
          console.error("[v0] Failed to load shifts:", error)
        } finally {
          setShiftsLoading(false)
        }
      }
      loadShifts()
    }
  }, [isOpen])

  useEffect(() => {
    const fetchRoleLabels = async () => {
      try {
        setIsLoadingRoles(true)
        const token = localStorage.getItem("auth") ? JSON.parse(localStorage.getItem("auth")!).token : null
        const response = await fetch("/api/roles/labels", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch role labels")
        }

        const labels = await response.json()
        setRoleLabels(labels)

        if (!employee && labels.length > 0) {
          setFormData((prev) => ({ ...prev, role: labels[0] }))
        }
      } catch (error) {
        console.error("[v0] Error fetching role labels:", error)
        // Fallback to empty array if API fails
        setRoleLabels([])
      } finally {
        setIsLoadingRoles(false)
      }
    }

    if (isOpen) {
      fetchRoleLabels()
    }
  }, [isOpen, employee])

  useEffect(() => {
    if (isOpen && employee) {
      const convertedEmployee = {
        ...employee,
        regularShifts: (employee.regularShifts || []).map((shift) => ({
          ...shift,
          amountType: convertAmountTypeFromAPI(shift.amountType),
        })),
        overtimeShifts: (employee.overtimeShifts || []).map((shift) => ({
          ...shift,
          amountType: convertAmountTypeFromAPI(shift.amountType),
        })),
      }
      setFormData(convertedEmployee)
    } else if (isOpen && !employee) {
      setFormData({
        name: "",
        employeeId: "",
        phone: "",
        email: "",
        pan: "",
        aadhaar: "",
        profileImage: "",
        role: "Operator",
        gender: "Male",
        status: "Active",
        regularShifts: [],
        overtimeShifts: [],
        salaryConfig: {
          frequency: "By Month",
          workdayPolicy: "Exclude Sundays",
        },
      })
    }
  }, [isOpen, employee])

  const handleInputChange = (field: string, value: any) => {
    setErrors((prevErrors) => prevErrors.filter((e) => e.field !== field))
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSalaryConfigChange = (field: string, value: any) => {
    const fieldMappings: { [key: string]: string } = {
      frequency: "salaryFrequency",
      workdayPolicy: "workdayPolicy",
    }
    const errorField = fieldMappings[field] || field
    setErrors((prevErrors) => prevErrors.filter((e) => e.field !== errorField))

    const newConfig = { ...formData.salaryConfig }
    if (field === "workdayPolicy") {
      // Explicitly cast to WorkdayPolicy
      newConfig.workdayPolicy = value as WorkdayPolicy
    } else {
      ;(newConfig as any)[field] = value
    }
    setFormData((prev) => ({
      ...prev,
      salaryConfig: newConfig,
    }))
  }

  const handleAddRegularShift = () => {
    // Only allow adding if there's no regular shift yet
    if ((formData.regularShifts || []).length >= 1) {
      setApiError("Maximum Regular Shifts")
      setValidationMessages(["Only 1 regular shift is allowed per employee."])
      setShowValidationDialog(true)
      return
    }

    const newShift = {
      id: `reg-${Date.now()}`,
      shiftId: "", // Added shiftId field
      shiftName: "",
      amountType: "Per Shift" as const,
      amount: 0,
      extraAllowance: 0,
    }
    const updatedRegular = [...(formData.regularShifts || []), newShift]
    setFormData((prev) => ({
      ...prev,
      regularShifts: updatedRegular,
    }))
  }

  const handleAddOvertimeShift = () => {
    setFormData((prev) => ({
      ...prev,
      overtimeShifts: [
        ...(prev.overtimeShifts || []),
        {
          id: `ot-${Date.now()}`,
          shiftName: "",
          amountType: "Per Shift" as const,
          amount: 0,
          extraAllowance: 0,
        },
      ],
    }))
  }

  const handleRemoveRegularShift = (id: string) => {
    const updatedRegular = formData.regularShifts?.filter((s) => s.id !== id) || []
    setFormData((prev) => ({
      ...prev,
      regularShifts: updatedRegular,
    }))
  }

  const handleRemoveOvertimeShift = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      overtimeShifts: prev.overtimeShifts?.filter((s) => s.id !== id),
    }))
  }

  const handleOpenRegularShiftSearch = (shiftId: string) => {
    setCurrentEditingShiftId(shiftId)
    setIsRegularShiftSearchOpen(true)
  }

  const handleOpenOvertimeShiftSearch = (shiftId: string) => {
    setCurrentEditingShiftId(shiftId)
    setIsOvertimeShiftSearchOpen(true)
  }

  const handleSelectRegularShift = (shiftName: string, shiftId: string) => {
    // Updated to accept both shiftName and shiftId
    if (currentEditingShiftId) {
      const updatedRegular =
        formData.regularShifts?.map((s) => (s.id === currentEditingShiftId ? { ...s, shiftName, shiftId } : s)) || []

      setErrors((prevErrors) => prevErrors.filter((e) => !e.field.startsWith("regularShift")))

      setFormData((prev) => ({
        ...prev,
        regularShifts: updatedRegular,
      }))

      // Check for overlaps
      const selectedShift = availableShifts.find((s) => s.name === shiftName)
      if (selectedShift) {
        const allOtherRegular = updatedRegular.filter((s) => s.id !== currentEditingShiftId)
        const overlapCheck = checkGlobalShiftOverlap(
          { startTime: selectedShift.startTime, endTime: selectedShift.endTime },
          allOtherRegular,
          formData.overtimeShifts || [],
          availableShifts, // Pass availableShifts here
        )

        if (overlapCheck.overlaps) {
          setOverlappingShifts([...new Set([...overlappingShifts, currentEditingShiftId])])
        } else {
          setOverlappingShifts(overlappingShifts.filter((s) => s !== currentEditingShiftId))
        }
      }
    }
    setCurrentEditingShiftId(null)
    setIsRegularShiftSearchOpen(false)
  }

  const handleSelectOvertimeShift = (shiftName: string, shiftId: string) => {
    if (currentEditingShiftId) {
      const updatedOvertime =
        formData.overtimeShifts?.map((s) => (s.id === currentEditingShiftId ? { ...s, shiftName, shiftId } : s)) || []

      setErrors((prevErrors) => prevErrors.filter((e) => !e.field.startsWith("overtimeShift")))

      setFormData((prev) => ({
        ...prev,
        overtimeShifts: updatedOvertime,
      }))

      // Check for overlaps
      const selectedShift = availableShifts.find((s) => s.name === shiftName)
      if (selectedShift) {
        const allOtherOvertime = updatedOvertime.filter((s) => s.id !== currentEditingShiftId)
        const overlapCheck = checkGlobalShiftOverlap(
          { startTime: selectedShift.startTime, endTime: selectedShift.endTime },
          formData.regularShifts || [],
          allOtherOvertime,
          availableShifts, // Pass availableShifts here
        )

        if (overlapCheck.overlaps) {
          setOverlappingShifts([...new Set([...overlappingShifts, currentEditingShiftId])])
        } else {
          setOverlappingShifts(overlappingShifts.filter((s) => s !== currentEditingShiftId))
        }
      }
    }
    setCurrentEditingShiftId(null)
    setIsOvertimeShiftSearchOpen(false)
  }

  const handleAmountChange = (value: string): string => {
    // Remove non-numeric characters except decimal point
    let sanitized = value.replace(/[^\d.]/g, "")

    // Remove leading zeros but keep "0" and "0."
    if (sanitized.length > 1 && sanitized[0] === "0" && sanitized[1] !== ".") {
      sanitized = sanitized.replace(/^0+/, "")
    }

    // Ensure only one decimal point
    const parts = sanitized.split(".")
    if (parts.length > 2) {
      sanitized = parts[0] + "." + parts.slice(1).join("")
    }

    return sanitized || "0"
  }

  const updateShift = (id: string, field: string, finalValue: string | number) => {
    setErrors((prevErrors) => prevErrors.filter((e) => !e.field.startsWith("regularShift")))

    let valueToUpdate = finalValue
    if (field === "amount" || field === "extraAllowance") {
      valueToUpdate = handleAmountChange(String(finalValue))
    }

    if (field === "shiftName") {
      const updatedRegular =
        formData.regularShifts?.map((s) => (s.id === id ? { ...s, shiftName: finalValue as string } : s)) || []

      setFormData((prev) => ({
        ...prev,
        regularShifts: updatedRegular,
      }))

      const selectedShift = availableShifts.find((s) => s.name === finalValue)
      if (selectedShift) {
        const allOtherRegular = updatedRegular.filter((s) => s.id !== id)
        const overlapCheck = checkGlobalShiftOverlap(
          { startTime: selectedShift.startTime, endTime: selectedShift.endTime },
          allOtherRegular,
          formData.overtimeShifts || [],
          availableShifts,
        )

        if (overlapCheck.overlaps) {
          setOverlappingShifts([...new Set([...overlappingShifts, id])])
        } else {
          setOverlappingShifts(overlappingShifts.filter((s) => s !== id))
        }
      }
    } else {
      const updatedRegular =
        formData.regularShifts?.map((s) => (s.id === id ? { ...s, [field]: valueToUpdate } : s)) || []
      setFormData((prev) => ({
        ...prev,
        regularShifts: updatedRegular,
      }))
    }
  }

  const handleUpdateRegularShift = (id: string, field: string, value: any) => {
    updateShift(id, field, value)
  }

  const updateOvertimeShift = (id: string, field: string, finalValue: string | number) => {
    setErrors((prevErrors) => prevErrors.filter((e) => !e.field.startsWith("overtimeShift")))

    let valueToUpdate = finalValue
    if (field === "amount" || field === "extraAllowance") {
      valueToUpdate = handleAmountChange(String(finalValue))
    }

    if (field === "shiftName") {
      const updatedOvertime =
        formData.overtimeShifts?.map((s) => (s.id === id ? { ...s, shiftName: finalValue as string } : s)) || []

      setFormData((prev) => ({
        ...prev,
        overtimeShifts: updatedOvertime,
      }))

      const selectedShift = availableShifts.find((s) => s.name === finalValue)
      if (selectedShift) {
        const allOtherOvertime = updatedOvertime.filter((s) => s.id !== id)
        const overlapCheck = checkGlobalShiftOverlap(
          { startTime: selectedShift.startTime, endTime: selectedShift.endTime },
          formData.regularShifts || [],
          allOtherOvertime,
          availableShifts,
        )

        if (overlapCheck.overlaps) {
          setOverlappingShifts([...new Set([...overlappingShifts, id])])
        } else {
          setOverlappingShifts(overlappingShifts.filter((s) => s !== id))
        }
      }
    } else {
      const updatedOvertime =
        formData.overtimeShifts?.map((s) => (s.id === id ? { ...s, [field]: valueToUpdate } : s)) || []
      setFormData((prev) => ({
        ...prev,
        overtimeShifts: updatedOvertime,
      }))
    }
  }

  const handleUpdateOvertimeShift = (id: string, field: string, value: any) => {
    updateOvertimeShift(id, field, value)
  }

  const handleSave = () => {
    setErrors([])
    setApiError(null)
    setValidationMessages([])

    // Check for overlapping shifts
    if (overlappingShifts.length > 0) {
      setApiError("Shift Overlap Detected")
      setValidationMessages(["This shift overlaps with another assigned shift. Please choose a non-overlapping time."])
      setShowValidationDialog(true)
      return
    }

    // Check if regular shifts array exists
    if (!formData.regularShifts || formData.regularShifts.length === 0) {
      setApiError("Regular Shift Required")
      setValidationMessages(["At least one regular shift must be assigned."])
      setShowValidationDialog(true)
      return
    }

    // Check if at least one regular shift has a shift name assigned
    const hasAssignedShift = formData.regularShifts.some((shift) => shift.shiftName && shift.shiftName.trim() !== "")
    if (!hasAssignedShift) {
      setApiError("Regular Shift Required")
      setValidationMessages(["At least one regular shift must be assigned with a shift name."])
      setShowValidationDialog(true)
      return
    }

    handleProceedWithSaveCheck()
  }

  const handleProceedWithSaveCheck = () => {
    if (formData.regularShifts.length === 0) {
      setShowWarningDialog(true)
    } else {
      setShowConfirmSaveDialog(true)
    }
  }

  const proceedWithSave = async () => {
    const validationErrors = validateEmployee(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setApiError("Validation Failed")
      setValidationMessages(validationErrors.map((err) => err.message))
      setShowValidationDialog(true)
      return
    }

    setIsSubmitting(true)
    setApiError(null)
    setValidationMessages([])

    try {
      // Map frontend format to API format
      const apiPayload = {
        employeeName: formData.name,
        employeeId: formData.employeeId,
        phone: formData.phone,
        role: formData.role,
        gender: formData.gender?.toUpperCase() || "MALE",
        status: formData.status === "Active" ? "ACTIVE" : "DEACTIVE",
        email: formData.email || "",
        pan: formData.pan || "",
        aadhaar: formData.aadhaar || "",
        salaryFrequency:
          formData.salaryConfig.frequency === "By Day"
            ? "BY_DAY"
            : formData.salaryConfig.frequency === "By Week"
              ? "BY_WEEK"
              : "BY_MONTH",
        workdayPolicy:
          formData.salaryConfig.workdayPolicy === "Include All Days"
            ? "INCLUDE_ALL_DAYS"
            : formData.salaryConfig.workdayPolicy === "Exclude Sundays"
              ? "EXCLUDE_SUNDAYS"
              : "EXCLUDE_SATURDAY_AND_SUNDAYS",
        regularShifts: formData.regularShifts.map((shift) => ({
          shiftName: shift.shiftName,
          // Ensure shiftId is a number for API
          shiftId: Number.parseInt(shift.shiftId) || 0,
          amountType:
            shift.amountType === "Per Shift"
              ? "PER_SHIFT"
              : shift.amountType === "Per Day"
                ? "PER_DAY"
                : shift.amountType === "Per Hour"
                  ? "PER_HOUR"
                  : "PER_MONTH",
          amount: Number.parseFloat(shift.amount as string) || 0, // Ensure amount is a number
          extraAllowance: Number.parseFloat(shift.extraAllowance as string) || 0, // Ensure extraAllowance is a number
        })),
        overtimeShifts: formData.overtimeShifts.map((shift) => ({
          shiftName: shift.shiftName,
          // Ensure shiftId is a number for API
          shiftId: Number.parseInt(shift.shiftId) || 0,
          amountType:
            shift.amountType === "Per Shift"
              ? "PER_SHIFT"
              : shift.amountType === "Per Day"
                ? "PER_DAY"
                : shift.amountType === "Per Hour"
                  ? "PER_HOUR"
                  : "PER_MONTH",
          amount: Number.parseFloat(shift.amount as string) || 0, // Ensure amount is a number
          extraAllowance: Number.parseFloat(shift.extraAllowance as string) || 0, // Ensure extraAllowance is a number
        })),
      }

      const isUpdate = !!employee
      const url = isUpdate
        ? `http://localhost:8080/api/employees/updateEmployee/${employee.id}`
        : "http://localhost:8080/api/employees/addEmployee"
      const method = isUpdate ? "PUT" : "POST"

      const token = localStorage.getItem("auth") ? JSON.parse(localStorage.getItem("auth")!).token : null
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(apiPayload),
      })

      if (!response.ok) {
        if (response.status === 400) {
          try {
            const errorData = await response.json()
            // Check if the response contains validation messages
            if (
              errorData.validationMessages &&
              Array.isArray(errorData.validationMessages) &&
              errorData.validationMessages.length > 0
            ) {
              setValidationMessages(errorData.validationMessages)
              setApiError("Validation failed. Please check the errors below.")
              setShowValidationDialog(true)
              return
            }
            // Otherwise use the error message from the response
            setApiError(errorData.message || `Failed to ${isUpdate ? "update" : "create"} employee`)
            setShowValidationDialog(true)
            return
          } catch (parseError) {
            setApiError(`Failed to ${isUpdate ? "update" : "create"} employee`)
            setShowValidationDialog(true)
            return
          }
        }

        const errorData = await response.json().catch(() => ({
          message: isUpdate ? "Failed to update employee" : "Failed to create employee",
        }))
        throw new Error(errorData.message || `Server error: ${response.status}`)
      }

      const result = await response.json()

      // Call onSave with the created/updated employee data
      const savedEmployee: Employee = {
        id: result.id || employee?.id || `emp-${Date.now()}`,
        name: formData.name || "",
        employeeId: formData.employeeId || "",
        phone: formData.phone || "",
        email: formData.email,
        pan: formData.pan,
        aadhaar: formData.aadhaar,
        profileImage: formData.profileImage,
        role: formData.role || "Operator",
        gender: formData.gender || "Male",
        status: formData.status || "Active",
        regularShifts: formData.regularShifts || [],
        overtimeShifts: formData.overtimeShifts || [],
        salaryConfig: formData.salaryConfig || {
          frequency: "By Month",
          workdayPolicy: "Exclude Sundays",
        },
        createdAt: result.createdAt || employee?.createdAt || new Date().toISOString(),
        updatedAt: result.updatedAt || new Date().toISOString(),
      }

      onSave(savedEmployee)
      onClose()
    } catch (error) {
      console.error(`[v0] Error ${employee ? "updating" : "creating"} employee:`, error)
      setApiError(
        error instanceof Error
          ? error.message
          : `Failed to ${employee ? "update" : "create"} employee. Please try again.`,
      )
      // Show validation dialog for catch block errors
      setShowValidationDialog(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWarningConfirm = () => {
    setShowWarningDialog(false)
    setShowConfirmSaveDialog(true) // show confirmation after warning
  }

  const handleWarningCancel = () => {
    setShowWarningDialog(false)
  }

  const getErrorMessage = (field: string): string | undefined => {
    return errors.find((e) => e.field === field)?.message
  }

  const regularShiftNames = formData.regularShifts?.map((s) => s.shiftName) || []
  const availableOvertimeShifts = getAvailableShiftsForOvertime(regularShiftNames)

  const getShiftTimeDisplay = (shiftName: string): string => {
    const shift = availableShifts.find((s) => s.name === shiftName)
    if (!shift) return shiftName
    return `${shiftName} (${to12HourFormat(shift.startTime)} – ${to12HourFormat(shift.endTime)})`
  }

  // const convertTo12Hour = (time: string): string => {
  //   const [hours, minutes] = time.split(":").map(Number)
  //   const period = hours >= 12 ? "PM" : "AM"
  //   const displayHours = hours % 12 || 12
  //   return `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`
  // }

  const isShiftAvailable = (shiftName: string, existingShifts: any[]): boolean => {
    const shift = availableShifts.find((s) => s.name === shiftName)
    if (!shift) return true

    const result = checkShiftOverlap(
      { startTime: shift.startTime, endTime: shift.endTime },
      existingShifts.map((s) => {
        const existingShift = availableShifts.find((ms) => ms.name === s.shiftName)
        return {
          shiftName: s.shiftName,
          startTime: existingShift?.startTime || "",
          endTime: existingShift?.endTime || "",
        }
      }),
      availableShifts, // Pass availableShifts here
    )
    return !result.overlaps
  }

  if (!isOpen) return null

  if (showValidationDialog) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-card rounded-lg shadow-2xl max-w-md w-full pointer-events-auto border-2 border-red-500">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="p-1.5 rounded-md bg-red-100 text-red-900 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
              </span>
              Failed to Save Employee
            </h2>
            <p className="text-sm text-muted-foreground mb-2">{apiError}</p>
            {validationMessages.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm text-foreground">
                {validationMessages.map((msg, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{msg}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => {
                  setShowValidationDialog(false)
                  setApiError(null)
                  setValidationMessages([])
                }}
                className="flex-1"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showWarningDialog) {
    return (
      <WarningDialog
        isOpen={showWarningDialog}
        title="No Regular Shift Assigned"
        message="Employee will not have daily payment data unless a shift is added. Do you want to continue?"
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
      />
    )
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 overflow-hidden">
        <div className="flex h-full flex-col bg-card">
          <div className="bg-slate-800 dark:bg-slate-950 text-white p-6 flex items-center justify-between shadow-lg flex-shrink-0">
            <h2 className="text-2xl font-semibold tracking-tight">
              {employee ? "Edit Employee" : "Create New Employee"}
            </h2>
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-lg transition">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 tracking-wide">
                👤 Employee Details
              </h3>

              <div className="flex flex-col md:flex-row md:gap-8">
                {/* Profile Image Section - Stack on mobile, side-by-side on desktop */}
                <div className="md:w-32 md:flex-shrink-0 flex flex-col items-center md:items-start">
                  <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center overflow-hidden border-4 border-slate-300 dark:border-slate-600 shadow-md">
                    {formData.profileImage ? (
                      <img
                        src={formData.profileImage || "/placeholder.svg"}
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
                        placeholder="Enter full name"
                        value={formData.name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        disabled={!!employee}
                        readOnly={!!employee}
                        className={`h-11 border-slate-300 dark:border-slate-600 ${
                          employee
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed"
                            : ""
                        } ${getErrorMessage("name") ? "border-red-500" : ""}`}
                      />
                      {employee && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                          Employee name cannot be changed once created.
                        </p>
                      )}
                      {getErrorMessage("name") && (
                        <p className="text-red-500 text-xs mt-1">{getErrorMessage("name")}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                        Employee ID <span className="text-amber-600 dark:text-amber-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Enter employee ID"
                        value={formData.employeeId || ""}
                        onChange={(e) => handleInputChange("employeeId", e.target.value)}
                        disabled={!!employee}
                        readOnly={!!employee}
                        className={`h-11 border-slate-300 dark:border-slate-600 ${
                          employee
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold cursor-not-allowed"
                            : ""
                        } ${getErrorMessage("employeeId") ? "border-red-500" : ""}`}
                      />
                      {employee && (
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                          Employee ID cannot be changed once created.
                        </p>
                      )}
                      {getErrorMessage("employeeId") && (
                        <p className="text-red-500 text-xs mt-1">{getErrorMessage("employeeId")}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                        Phone <span className="text-amber-600 dark:text-amber-500">*</span>
                      </label>
                      <Input
                        type="tel"
                        placeholder="10-digit number"
                        value={formData.phone || ""}
                        onChange={(e) => handleInputChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={`h-11 border-slate-300 dark:border-slate-600 ${getErrorMessage("phone") ? "border-red-500" : ""}`}
                      />
                      {getErrorMessage("phone") && (
                        <p className="text-red-500 text-xs mt-1">{getErrorMessage("phone")}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Role, Gender, Status - Stack on mobile, 2 cols on md, collapse to 3 cols on lg */}
                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                        Role <span className="text-amber-600 dark:text-amber-500">*</span>
                      </label>
                      <Select value={formData.role || ""} onValueChange={(value) => handleInputChange("role", value)}>
                        <SelectTrigger className="w-full h-11">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingRoles ? (
                            <SelectItem value="__loading__" disabled>
                              Loading roles...
                            </SelectItem>
                          ) : roleLabels.length === 0 ? (
                            <SelectItem value="__no_roles__" disabled>
                              No roles available
                            </SelectItem>
                          ) : (
                            roleLabels.map((roleName) => (
                              <SelectItem key={roleName} value={roleName}>
                                {roleName}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                        Gender <span className="text-amber-600 dark:text-amber-500">*</span>
                      </label>
                      <Select
                        value={formData.gender || "Male"}
                        onValueChange={(value) => handleInputChange("gender", value)}
                      >
                        <SelectTrigger className={`w-full h-11 ${getErrorMessage("gender") ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {getErrorMessage("gender") && (
                        <p className="text-red-500 text-xs mt-1">{getErrorMessage("gender")}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                        Status <span className="text-amber-600 dark:text-amber-500">*</span>
                      </label>
                      <Select
                        value={formData.status || "Active"}
                        onValueChange={(value) => handleInputChange("status", value as "Active" | "Inactive")}
                      >
                        <SelectTrigger className={`w-full h-11 ${getErrorMessage("status") ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      {getErrorMessage("status") && (
                        <p className="text-red-500 text-xs mt-1">{getErrorMessage("status")}</p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Email, PAN - Stack on mobile, 2 cols on desktop */}
                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">Email</label>
                      <Input
                        type="email"
                        placeholder="example@company.com"
                        value={formData.email || ""}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        className={`h-11 border-slate-300 dark:border-slate-600 ${getErrorMessage("email") ? "border-red-500" : ""}`}
                      />
                      {getErrorMessage("email") && (
                        <p className="text-red-500 text-xs mt-1">{getErrorMessage("email")}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">PAN</label>
                      <Input
                        type="text"
                        placeholder="10-character PAN"
                        value={formData.pan || ""}
                        onChange={(e) => handleInputChange("pan", e.target.value.toUpperCase().slice(0, 10))}
                        className={`h-11 border-slate-300 dark:border-slate-600 ${getErrorMessage("pan") ? "border-red-500" : ""}`}
                      />
                      {getErrorMessage("pan") && <p className="text-red-500 text-xs mt-1">{getErrorMessage("pan")}</p>}
                    </div>
                  </div>

                  {/* Row 4: Aadhaar (full width) */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">Aadhaar</label>
                    <Input
                      type="text"
                      placeholder="12-digit Aadhaar"
                      value={formData.aadhaar || ""}
                      onChange={(e) => handleInputChange("aadhaar", e.target.value.replace(/\D/g, "").slice(0, 12))}
                      className={`h-11 border-slate-300 dark:border-slate-600 ${getErrorMessage("aadhaar") ? "border-red-500" : ""}`}
                    />
                    {getErrorMessage("aadhaar") && (
                      <p className="text-red-500 text-xs mt-1">{getErrorMessage("aadhaar")}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 tracking-wide">
                💰 Salary Configuration
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5 tracking-wide">
                    Salary Frequency <span className="text-amber-600 dark:text-amber-500">*</span>
                  </label>
                  <Select
                    value={formData.salaryConfig?.frequency || "By Month"}
                    onValueChange={(value) => handleSalaryConfigChange("frequency", value)}
                  >
                    <SelectTrigger
                      className={`w-full h-11 ${getErrorMessage("salaryFrequency") ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="By Day">By Day</SelectItem>
                      <SelectItem value="By Week">By Week</SelectItem>
                      <SelectItem value="By Month">By Month</SelectItem>
                    </SelectContent>
                  </Select>
                  {getErrorMessage("salaryFrequency") && (
                    <p className="text-red-500 text-xs mt-1">{getErrorMessage("salaryFrequency")}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="block text-sm font-semibold text-foreground tracking-wide">
                      Workday Policy <span className="text-amber-600 dark:text-amber-500">*</span>
                    </label>
                    <div className="relative">
                      <button
                        onMouseEnter={() => setShowWorkdayTooltip(true)}
                        onMouseLeave={() => setShowWorkdayTooltip(false)}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
                      >
                        <HelpCircle size={14} />
                      </button>
                      {showWorkdayTooltip && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-800 dark:bg-slate-700 text-white text-xs p-2 rounded shadow-lg z-20">
                          Determines how many days per month are counted for salary calculation.
                        </div>
                      )}
                    </div>
                  </div>
                  <Select
                    value={formData.salaryConfig?.workdayPolicy || "Exclude Sundays"}
                    onValueChange={(value) => handleSalaryConfigChange("workdayPolicy", value)}
                  >
                    <SelectTrigger
                      className={`w-full h-11 ${getErrorMessage("workdayPolicy") ? "border-red-500" : ""}`}
                    >
                      <SelectValue placeholder="Select policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Include All Days">Include All Days</SelectItem>
                      <SelectItem value="Exclude Sundays">Exclude Sundays</SelectItem>
                      <SelectItem value="Exclude Saturdays & Sundays">Exclude Saturdays & Sundays</SelectItem>
                    </SelectContent>
                  </Select>
                  {getErrorMessage("workdayPolicy") && (
                    <p className="text-red-500 text-xs mt-1">{getErrorMessage("workdayPolicy")}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 tracking-wide">
                🔄 Regular Shifts <span className="text-amber-600 dark:text-amber-500">*</span>
              </h3>

              <div className="space-y-3">
                {formData.regularShifts?.map((shift) => {
                  const isOverlapping = overlappingShifts.includes(shift.id)
                  return (
                    <div
                      key={shift.id}
                      className={`bg-slate-50 dark:bg-slate-900/30 border p-4 rounded-lg space-y-3 transition-colors ${
                        isOverlapping
                          ? "border-red-500 dark:border-red-500 border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/30"
                          : "border-l-4 border-l-slate-400 dark:border-l-slate-500 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {isOverlapping && (
                        <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                          ⚠️ This shift overlaps with another assigned shift.
                        </p>
                      )}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                          Shift Name <span className="text-amber-600 dark:text-amber-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="Select a shift"
                            value={shift.shiftName ? getShiftTimeDisplay(shift.shiftName) : ""}
                            readOnly
                            className="flex-1 h-10 border-slate-300 dark:border-slate-600" // Removed onClick from input field
                          />
                          <Button
                            type="button"
                            onClick={() => handleOpenRegularShiftSearch(shift.id)}
                            className="h-10 px-4 bg-blue-600 hover:bg-blue-700"
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <label className="block text-sm font-semibold text-foreground tracking-wide">
                              Amount Type <span className="text-amber-600 dark:text-amber-500">*</span>
                            </label>
                            <div className="relative">
                              <button
                                onMouseEnter={() => setShowAmountTypeTooltip(true)}
                                onMouseLeave={() => setShowAmountTypeTooltip(false)}
                                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
                              >
                                <HelpCircle size={14} />
                              </button>
                              {showAmountTypeTooltip && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-800 dark:bg-slate-700 text-white text-xs p-2 rounded shadow-lg z-20">
                                  Choose how to measure this shift: Per Shift, Per Day, Per Hour, or Per Month.
                                </div>
                              )}
                            </div>
                          </div>
                          <Select
                            value={shift.amountType}
                            onValueChange={(value) => handleUpdateRegularShift(shift.id, "amountType", value)}
                          >
                            <SelectTrigger className="w-full h-10">
                              <SelectValue placeholder={!shift.amountType ? "Select Amount Type" : undefined} />
                            </SelectTrigger>
                            <SelectContent>
                            
                              <SelectItem value="Per Hour">Per Hour</SelectItem>
                              <SelectItem value="Per Month">Per Month</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                            Amount <span className="text-amber-600 dark:text-amber-500">*</span>
                          </label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Enter amount"
                            value={shift.amount}
                            onChange={(e) => handleUpdateRegularShift(shift.id, "amount", e.target.value)}
                            className={`h-10 border-slate-300 dark:border-slate-600 ${getErrorMessage("amount") ? "border-red-500" : ""}`}
                          />
                          {getErrorMessage("amount") && (
                            <p className="text-red-500 text-xs mt-1">{getErrorMessage("amount")}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                            Extra Allowance
                          </label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Enter extra allowance"
                            value={shift.extraAllowance}
                            onChange={(e) => handleUpdateRegularShift(shift.id, "extraAllowance", e.target.value)}
                            className="h-10 border-slate-300 dark:border-slate-600"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-transparent mb-2 tracking-wide select-none">
                            Action
                          </label>
                          <Button
                            onClick={() => handleRemoveRegularShift(shift.id)}
                            variant="destructive"
                            className="w-full h-10"
                          >
                            <Trash2 size={16} className="mr-2" />
                            Remove Shift
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <Button 
                  onClick={handleAddRegularShift} 
                  className="w-full"
                  disabled={(formData.regularShifts || []).length >= 1}
                  title={(formData.regularShifts || []).length >= 1 ? "Only 1 regular shift is allowed per employee" : ""}
                >
                  <Plus size={16} className="mr-2" />
                  Add Regular Shift
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 tracking-wide">
                🕰️ Overtime Shifts
              </h3>

              <div className="space-y-3">
                {formData.overtimeShifts?.map((shift) => (
                  <div key={shift.id} className="bg-slate-50 dark:bg-slate-900/30 border p-4 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                        Shift Name
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="Select a shift"
                          value={shift.shiftName ? getShiftTimeDisplay(shift.shiftName) : ""}
                          readOnly
                          className="flex-1 h-10 cursor-pointer border-slate-300 dark:border-slate-600"
                        />
                        <Button
                          type="button"
                          onClick={() => handleOpenOvertimeShiftSearch(shift.id)}
                          className="h-10 px-4 bg-blue-600 hover:bg-blue-700"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="block text-sm font-semibold text-foreground tracking-wide">
                            Amount Type
                          </label>
                          <div className="relative">
                            <button
                              onMouseEnter={() => setShowAmountTypeTooltip(true)}
                              onMouseLeave={() => setShowAmountTypeTooltip(false)}
                              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
                            >
                              <HelpCircle size={14} />
                            </button>
                            {showAmountTypeTooltip && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-slate-800 dark:bg-slate-700 text-white text-xs p-2 rounded shadow-lg z-20">
                                Choose how to measure this shift: Per Shift, Per Day, Per Hour, or Per Month.
                              </div>
                            )}
                          </div>
                        </div>
                        <Select
                          value={shift.amountType}
                          onValueChange={(value) => handleUpdateOvertimeShift(shift.id, "amountType", value)}
                        >
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder={!shift.amountType ? "Select Amount Type" : undefined} />
                          </SelectTrigger>
                          <SelectContent>
                           
                            <SelectItem value="Per Hour">Per Hour</SelectItem>
                            <SelectItem value="Per Month">Per Month</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                          Amount <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Enter amount"
                          value={shift.amount}
                          onChange={(e) => handleUpdateOvertimeShift(shift.id, "amount", e.target.value)}
                          className="h-10 border-slate-300 dark:border-slate-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2 tracking-wide">
                          Extra Allowance
                        </label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Enter extra allowance"
                          value={shift.extraAllowance}
                          onChange={(e) => handleUpdateOvertimeShift(shift.id, "extraAllowance", e.target.value)}
                          className="h-10 border-slate-300 dark:border-slate-600"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-transparent mb-2 tracking-wide select-none">
                          Action
                        </label>
                        <Button
                          onClick={() => handleRemoveOvertimeShift(shift.id)}
                          variant="destructive"
                          className="w-full h-10"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Remove Shift
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button onClick={handleAddOvertimeShift} className="w-full">
                  <Plus size={16} className="mr-2" />
                  Add Overtime Shift
                </Button>
              </div>
            </div>

            {isSubmitting && (
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
                      {employee ? "Updating" : "Creating"} Employee
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

            <DialogFooter className="flex-row gap-2 sm:gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Employee"}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </div>

      {/* Save Confirmation Dialog */}
      {showConfirmSaveDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-lg max-w-md w-full p-6 border border-blue-100">
            <h2 className="text-lg font-semibold text-foreground mb-2">Confirm Save</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to {employee ? "update" : "save"} details for "
              <span className="font-semibold text-foreground">{formData.name || "this employee"}</span>"?
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowConfirmSaveDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmSaveDialog(false)
                  proceedWithSave()
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {showWarningDialog && (
        <WarningDialog
          isOpen={showWarningDialog}
          title="No Regular Shift Assigned"
          message="Employee will not have daily payment data unless a shift is added. Do you want to continue?"
          onConfirm={handleWarningConfirm}
          onCancel={handleWarningCancel}
        />
      )}

      <ShiftSearchModal
        isOpen={isRegularShiftSearchOpen}
        onClose={() => {
          setIsRegularShiftSearchOpen(false)
          setCurrentEditingShiftId(null)
        }}
        onSelectShift={handleSelectRegularShift}
        excludeShifts={[
          ...(formData.regularShifts
            ?.filter((s) => s.shiftName && s.id !== currentEditingShiftId)
            .map((s) => s.shiftName) || []),
          ...(formData.overtimeShifts?.map((s) => s.shiftName).filter(Boolean) || []),
        ]}
        title="Select Regular Shift"
      />

      <ShiftSearchModal
        isOpen={isOvertimeShiftSearchOpen}
        onClose={() => {
          setIsOvertimeShiftSearchOpen(false)
          setCurrentEditingShiftId(null)
        }}
        onSelectShift={handleSelectOvertimeShift}
        excludeShifts={[
          ...(formData.regularShifts?.map((s) => s.shiftName).filter(Boolean) || []),
          ...(formData.overtimeShifts
            ?.filter((s) => s.shiftName && s.id !== currentEditingShiftId)
            .map((s) => s.shiftName) || []),
        ]}
        title="Select Overtime Shift"
      />
    </>
  )
}

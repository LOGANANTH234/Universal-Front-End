"use client"

import { useState, useEffect } from "react"
import { Plus, Search, X, Download, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import EmployeeFormModal from "./employee-form-modal"
import EmployeeCardGrid from "./employee-card-grid"
import EmployeeHistoryModal from "./employee-history-modal"
import type { Employee } from "@/lib/employee-types"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useEmployeeCache } from "@/lib/contexts/employee-cache-context"

const mapApiEmployeeToEmployee = (apiEmployee: any): Employee => {
  return {
    id: apiEmployee.id,
    name: apiEmployee.employeeName,
    employeeId: apiEmployee.employeeId,
    phone: apiEmployee.phone,
    email: apiEmployee.email,
    pan: apiEmployee.pan,
    aadhaar: apiEmployee.aadhaar,
    profileImage: apiEmployee.imageUrl,
    gender: apiEmployee.gender === "MALE" ? "Male" : apiEmployee.gender === "FEMALE" ? "Female" : "Other",
    role: apiEmployee.role,
    status: apiEmployee.status === "ACTIVE" ? "Active" : "Inactive",
    regularShifts: apiEmployee.regularShifts.map((shift: any) => ({
      id: `reg-${shift.shiftId}`,
      shiftId: String(shift.shiftId),
      shiftName: shift.shiftName,
      amountType: shift.amountType,
      amount: shift.amount,
      extraAllowance: shift.extraAllowance,
    })),
    overtimeShifts: apiEmployee.overtimeShifts.map((shift: any) => ({
      id: `ot-${shift.shiftId}`,
      shiftId: String(shift.shiftId),
      shiftName: shift.shiftName,
      amountType: shift.amountType,
      amount: shift.amount,
      extraAllowance: shift.extraAllowance,
    })),
    salaryConfig: {
      frequency: apiEmployee.salaryFrequency === "BY_MONTH" ? "By Month" : "By Day",
      workdayPolicy:
        apiEmployee.workdayPolicy === "INCLUDE_ALL_DAYS"
          ? "Include All Days"
          : apiEmployee.workdayPolicy === "EXCLUDE_SUNDAYS"
            ? "Exclude Sundays"
            : "Exclude Saturdays & Sundays",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export default function EmployeeListScreen() {
  const cache = useEmployeeCache()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [inactiveEmployees, setInactiveEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingInactive, setIsLoadingInactive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>()
  const [historyEmployee, setHistoryEmployee] = useState<Employee | undefined>()
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterRole, setFilterRole] = useState<string>("All")
  const [filterStatus, setFilterStatus] = useState<string>("Active")
  const [filterPhoto, setFilterPhoto] = useState<string>("All")
  const [isSyncPhotosDialogOpen, setIsSyncPhotosDialogOpen] = useState(false)
  const [isSyncPhotosLoading, setIsSyncPhotosLoading] = useState(false)
  const [syncResults, setSyncResults] = useState<{
    added: string[]
    updated: string[]
  } | null>(null)
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)
  const { toast } = useToast()
  const [operationLoading, setOperationLoading] = useState<{
    show: boolean
    message: string
    employeeName: string
  }>({ show: false, message: "", employeeName: "" })

  const [roleLabels, setRoleLabels] = useState<string[]>([])
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)

  // Fetch active employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      if (cache.hasData) {
        setEmployees(cache.employees || [])
        setIsLoading(false)
        return
      }

      try {
        cache.setIsLoading(true)
        cache.setError(null)
        setIsLoading(true)
        const token = localStorage.getItem("auth") ? JSON.parse(localStorage.getItem("auth")!).token : null
        const response = await fetch("http://localhost:8080/api/employees/getAllEmployees", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch employees")
        }

        const data = await response.json()
        const mappedEmployees = data.map(mapApiEmployeeToEmployee)
        cache.setEmployees(mappedEmployees)
        setEmployees(mappedEmployees)
        setError(null)
        cache.setError(null)
      } catch (err) {
        console.error("Error fetching employees:", err)
        const errorMessage = "Failed to load employees. Please try again."
        setError(errorMessage)
        cache.setError(errorMessage)
      } finally {
        setIsLoading(false)
        cache.setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [cache.hasData])

  // Fetch role labels on mount
  useEffect(() => {
    fetchRoleLabels()
  }, [])

  // Fetch inactive employees whenever filterStatus switches to "Inactive"
  useEffect(() => {
    if (filterStatus === "Inactive") {
      fetchInactiveEmployees()
    }
  }, [filterStatus])

  const fetchRoleLabels = async () => {
    setIsLoadingRoles(true)
    try {
      const token = localStorage.getItem("auth") ? JSON.parse(localStorage.getItem("auth")!).token : null
      const response = await fetch("/api/roles/labels", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const labels = await response.json()
        setRoleLabels(labels)
      }
    } catch (error) {
      console.error("Error fetching role labels:", error)
    } finally {
      setIsLoadingRoles(false)
    }
  }

  const fetchInactiveEmployees = async () => {
    setIsLoadingInactive(true)
    try {
      const token = localStorage.getItem("auth") ? JSON.parse(localStorage.getItem("auth")!).token : null
      const response = await fetch("http://localhost:8080/api/employees/getAllInactiveEmployees", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch inactive employees")
      }

      const data = await response.json()
      setInactiveEmployees(data.map(mapApiEmployeeToEmployee))
    } catch (err) {
      console.error("Error fetching inactive employees:", err)
      toast({
        title: "Error",
        description: "Failed to load inactive employees. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingInactive(false)
    }
  }

  // Use the appropriate source list based on the selected status filter
  const sourceEmployees = filterStatus === "Inactive" ? inactiveEmployees : employees

  const filteredEmployees = sourceEmployees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().startsWith(searchQuery.toLowerCase()) ||
      emp.phone.includes(searchQuery) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesRole = filterRole === "All" || emp.role === filterRole

    // When "All" is selected we still use the active employees list but show all statuses
    const matchesStatus = filterStatus === "All" || filterStatus === "Active" || filterStatus === "Inactive"
      ? true
      : emp.status === filterStatus

    const matchesPhoto =
      filterPhoto === "All" ||
      (filterPhoto === "With Photo" && emp.profileImage) ||
      (filterPhoto === "Without Photo" && !emp.profileImage)

    return matchesSearch && matchesRole && matchesStatus && matchesPhoto
  })

  const handleAddEmployee = () => {
    setSelectedEmployee(undefined)
    setIsFormOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsFormOpen(true)
  }

  const handleSaveEmployee = async (employee: Employee) => {
    if (employee.id && employees.find((e) => e.id === employee.id)) {
      const updatedList = employees.map((e) => (e.id === employee.id ? employee : e))
      setEmployees(updatedList)
      cache.setEmployees(updatedList)
    } else {
      const updatedList = [...employees, employee]
      setEmployees(updatedList)
      cache.setEmployees(updatedList)
    }
  }

  const handleDeleteEmployee = async (id: string) => {
    const employee = employees.find((e) => e.id === id)
    setOperationLoading({ show: true, message: "Deleting", employeeName: employee?.name || "Employee" })

    try {
      const token = localStorage.getItem("auth") ? JSON.parse(localStorage.getItem("auth")!).token : null
      const response = await fetch(`http://localhost:8080/api/employees/deleteEmployee/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete employee")
      }

      const updatedEmployees = employees.filter((emp) => emp.id !== id)
      setEmployees(updatedEmployees)
      cache.setEmployees(updatedEmployees)
    } catch (err) {
      console.error("Error deleting employee:", err)
      setError("Failed to delete employee. Please try again.")
    } finally {
      setOperationLoading({ show: false, message: "", employeeName: "" })
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    const employee = employees.find((e) => e.id === id)
    const statusMessage = newStatus === "Active" ? "Activating" : "In Activating"
    setOperationLoading({ show: true, message: statusMessage, employeeName: employee?.name || "Employee" })

    try {
      const apiStatus = newStatus === "Active" ? "ACTIVE" : "DEACTIVE"
      const token = localStorage.getItem("auth") ? JSON.parse(localStorage.getItem("auth")!).token : null
      const response = await fetch(`http://localhost:8080/api/employees/${id}/status?value=${apiStatus}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error("Failed to update employee status")
      }

      const updatedEmployees = employees.map((emp) =>
        emp.id === id ? { ...emp, status: newStatus as "Active" | "Inactive" } : emp,
      )
      setEmployees(updatedEmployees)
      cache.setEmployees(updatedEmployees)

      // Also refresh inactive list if currently viewing inactive
      if (filterStatus === "Inactive") {
        fetchInactiveEmployees()
      }
    } catch (err) {
      console.error("Error updating employee status:", err)
      setError("Failed to update employee status. Please try again.")
    } finally {
      setOperationLoading({ show: false, message: "", employeeName: "" })
    }
  }

  const handleViewHistory = async (employee: Employee) => {
    setHistoryEmployee(employee)
    setIsHistoryOpen(true)

    try {
      const token = localStorage.getItem("auth") ? JSON.parse(localStorage.getItem("auth")!).token : null
      const response = await fetch(`http://localhost:8080/api/employees/${employee.id}/history`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch employee history")
      }

      const data = await response.json()
      setHistoryEmployee({ ...employee, history: data })
    } catch (err) {
      console.error("Error fetching employee history:", err)
      toast({
        title: "Error",
        description: "Failed to fetch employee history. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRestoreEmployee = (version: any) => {
    setSelectedEmployee(version.employee)
    setIsHistoryOpen(false)
    setIsFormOpen(true)
    setHistoryEmployee(undefined)
  }

  const handleSyncPhotos = async () => {
    try {
      setIsSyncPhotosDialogOpen(false)
      setOperationLoading({ show: true, message: "Syncing photos", employeeName: "" })

      const token = localStorage.getItem("auth") ? JSON.parse(localStorage.getItem("auth")!).token : null
      const response = await fetch("http://localhost:8080/api/employees/sync-photos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      if (!response.ok) {
        throw new Error("Failed to sync photos")
      }

      const data = await response.json()

      if (data.imageAddedEmployeeMap || data.imageUpdatedEmployeeMap) {
        setEmployees((prevEmployees) =>
          prevEmployees.map((emp) => {
            const newImage = data.imageAddedEmployeeMap?.[emp.name] || data.imageUpdatedEmployeeMap?.[emp.name]
            return newImage ? { ...emp, profileImage: newImage } : emp
          }),
        )
      }

      const addedEmployees = Object.keys(data.imageAddedEmployeeMap || {})
      const updatedEmployees = Object.keys(data.imageUpdatedEmployeeMap || {})

      setSyncResults({
        added: addedEmployees,
        updated: updatedEmployees,
      })
      setIsResultsModalOpen(true)
    } catch (err) {
      console.error("Error syncing photos:", err)
      toast({
        title: "Error",
        description: "Failed to sync photos. Please try again.",
        variant: "destructive",
      })
    } finally {
      setOperationLoading({ show: false, message: "", employeeName: "" })
    }
  }

  const canAddEmployee = useHasAction(MODULES.EMPLOYEE_MANAGEMENT, ACTIONS.EMPLOYEE_ADD)
  const canEditEmployee = useHasAction(MODULES.EMPLOYEE_MANAGEMENT, ACTIONS.EMPLOYEE_EDIT)
  const canDeleteEmployee = useHasAction(MODULES.EMPLOYEE_MANAGEMENT, ACTIONS.EMPLOYEE_DELETE)
  const canInactiveEmployee = useHasAction(MODULES.EMPLOYEE_MANAGEMENT, ACTIONS.EMPLOYEE_INACTIVE)
  const canSyncPhotos = useHasAction(MODULES.EMPLOYEE_MANAGEMENT, ACTIONS.EMPLOYEE_SYNC_PHOTOS)
  const canViewEmployee = useHasAction(MODULES.EMPLOYEE_MANAGEMENT, ACTIONS.EMPLOYEE_VIEW)
  const canUpdatePassword = useHasAction(MODULES.EMPLOYEE_MANAGEMENT, ACTIONS.EMPLOYEE_UPDATE_PASSWORD)
  const canDeactivateEmployee = useHasAction(MODULES.EMPLOYEE_MANAGEMENT, ACTIONS.EMPLOYEE_DEACTIVATE)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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
                {operationLoading.message} {operationLoading.employeeName}
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
              <p className="text-sm text-muted-foreground">Please wait while we process your request</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">Employee Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage employee profiles, shifts, and payment details
          </p>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium text-foreground">Loading employees...</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait while we fetch the data</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8 items-center">
              <div className="flex-1 min-w-[200px] relative">
                <div className="flex gap-2 items-center bg-card border border-blue-400 rounded-lg shadow-sm h-10 px-2 sm:px-3">
                  <Search size={18} className="text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by name, phone, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-foreground text-xs sm:text-sm focus:outline-none placeholder-muted-foreground min-w-0"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="sm:w-[140px] h-10 text-xs sm:text-sm border-blue-400 shadow-sm">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Roles</SelectItem>
                  {isLoadingRoles ? (
                    <SelectItem value="__loading__" disabled>
                      Loading roles...
                    </SelectItem>
                  ) : roleLabels.length === 0 ? (
                    <SelectItem value="__no_roles__" disabled>
                      No roles available
                    </SelectItem>
                  ) : (
                    roleLabels.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Status filter — default: Active */}
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="sm:w-[140px] h-10 text-xs sm:text-sm border-blue-400 shadow-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPhoto} onValueChange={setFilterPhoto}>
                <SelectTrigger className="sm:w-[140px] h-10 text-xs sm:text-sm border-blue-400 shadow-sm">
                  <SelectValue placeholder="Photo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="With Photo">With Photo</SelectItem>
                  <SelectItem value="Without Photo">Without Photo</SelectItem>
                </SelectContent>
              </Select>

              {canAddEmployee && (
                <Button
                  onClick={handleAddEmployee}
                  className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all h-10 text-xs sm:text-sm whitespace-nowrap"
                >
                  <Plus size={18} />
                  <span>Add Employee</span>
                </Button>
              )}

              {canSyncPhotos && (
                <Button
                  onClick={() => setIsSyncPhotosDialogOpen(true)}
                  disabled={isSyncPhotosLoading}
                  className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md hover:shadow-lg transition-all h-10 text-xs sm:text-sm whitespace-nowrap"
                >
                  <Download size={18} />
                  <span>Sync Photos</span>
                </Button>
              )}
            </div>

            {/* Show a dedicated loader while fetching inactive employees */}
            {isLoadingInactive ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-lg font-medium text-foreground">Loading inactive employees...</p>
                <p className="text-sm text-muted-foreground mt-1">Please wait while we fetch the data</p>
              </div>
            ) : (
              <EmployeeCardGrid
                employees={filteredEmployees}
                onEdit={handleEditEmployee}
                onDelete={handleDeleteEmployee}
                onStatusChange={handleStatusChange}
                onViewHistory={handleViewHistory}
                canEdit={canEditEmployee}
                canDelete={canDeleteEmployee}
                canInactive={canInactiveEmployee}
                canView={canViewEmployee}
                canUpdatePassword={canUpdatePassword}
                canDeactivate={canDeactivateEmployee}
              />
            )}
          </>
        )}
      </div>

      <EmployeeFormModal
        isOpen={isFormOpen}
        employee={selectedEmployee}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedEmployee(undefined)
          setSearchQuery("")
        }}
        onSave={handleSaveEmployee}
      />

      {historyEmployee && (
        <EmployeeHistoryModal
          open={isHistoryOpen}
          onOpenChange={setIsHistoryOpen}
          employee={historyEmployee}
          history={historyEmployee?.history || []}
        />
      )}

      <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <DialogTitle className="text-center text-xl">
              {syncResults?.added.length === 0 && syncResults?.updated.length === 0
                ? "Photos Already Up to Date"
                : "Photos Synced Successfully"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {syncResults?.added.length === 0 && syncResults?.updated.length === 0 && (
              <p className="text-center text-muted-foreground">All employee photos are already up to date.</p>
            )}

            {syncResults?.added && syncResults.added.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-foreground">
                  Images added for the following employees:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  {syncResults.added.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ol>
              </div>
            )}

            {syncResults?.updated && syncResults.updated.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-foreground">
                  Images updated for the following employees:
                </h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground ml-2">
                  {syncResults.updated.map((name, index) => (
                    <li key={index}>{name}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button className="w-full" onClick={() => setIsResultsModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isSyncPhotosDialogOpen} onOpenChange={setIsSyncPhotosDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sync Employee Photos</AlertDialogTitle>
            <AlertDialogDescription>
              This will sync the latest photos for all employees. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSyncPhotos} disabled={isSyncPhotosLoading}>
              {isSyncPhotosLoading ? "Syncing..." : "Yes, Sync Photos"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
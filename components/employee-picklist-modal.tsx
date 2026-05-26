"use client"

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Loader2 } from "lucide-react"
import type { Employee } from "@/lib/employee-types"
import { apiGet } from "@/lib/api-client"

interface EmployeePicklistModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddEmployees: (employees: Employee[]) => void
  initialSelectedEmployees?: string[]
}

interface EmployeeApiResponse {
  employeeId: string
  employeeName: string
  gender: string
  role: string
}

export default function EmployeePicklistModal({
  open,
  onOpenChange,
  onAddEmployees,
  initialSelectedEmployees = [],
}: EmployeePicklistModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set())
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchEmployees()
      const initialIds = new Set(initialSelectedEmployees)
      // Always include SELF by default
      initialIds.add("SELF")
      setSelectedEmployeeIds(initialIds)
    }
  }, [open, initialSelectedEmployees])

  const fetchEmployees = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data: EmployeeApiResponse[] = await apiGet("/api/employees/picklist")

      const transformedEmployees: Employee[] = data
        .filter((emp) => emp.employeeId !== "SELF")
        .map((emp) => ({
          id: emp.employeeId,
          employeeId: emp.employeeId,
          name: emp.employeeName,
          gender: emp.gender === "-" ? undefined : emp.gender,
          role: emp.role === "-" ? "" : emp.role,
        }))

      setEmployees(transformedEmployees)
    } catch (err) {
      console.error("[v0] Error fetching employees:", err)
      setError(err instanceof Error ? err.message : "Failed to load employees")
      setEmployees([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) {
      return employees
    }
    const query = searchQuery.toLowerCase()
    return employees.filter((emp) => emp.name.toLowerCase().includes(query))
  }, [searchQuery, employees])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredEmployees.map((emp) => emp.id))
      allIds.add("SELF")
      setSelectedEmployeeIds(allIds)
    } else {
      setSelectedEmployeeIds(new Set())
    }
  }

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    const newSelected = new Set(selectedEmployeeIds)
    if (checked) {
      newSelected.add(employeeId)
    } else {
      newSelected.delete(employeeId)
    }
    setSelectedEmployeeIds(newSelected)
  }

  const handleAddSelected = () => {
    const selectedEmployees: Employee[] = []

    if (selectedEmployeeIds.has("SELF")) {
      selectedEmployees.push({ id: "SELF", name: "SELF", employeeId: "SELF", role: "Current User" } as Employee)
    }

    const regularEmployees = employees.filter((emp) => selectedEmployeeIds.has(emp.id))
    selectedEmployees.push(...regularEmployees)

    onAddEmployees(selectedEmployees)
    setSearchQuery("")
    onOpenChange(false)
  }

  const handleCancel = () => {
    setSearchQuery("")
    onOpenChange(false)
  }

  const allFilteredSelected =
    selectedEmployeeIds.has("SELF") &&
    filteredEmployees.length > 0 &&
    filteredEmployees.every((emp) => selectedEmployeeIds.has(emp.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl">Manage Employees</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 flex-1 min-h-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by employee name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
              disabled={isLoading}
            />
          </div>

          {isLoading ? (
            <div className="flex-1 border rounded-lg flex items-center justify-center min-h-[400px] bg-white dark:bg-slate-900">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-slate-600 dark:text-slate-400">Loading employees...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 border rounded-lg flex items-center justify-center min-h-[400px] bg-white dark:bg-slate-900">
              <div className="flex flex-col items-center gap-3 max-w-md text-center">
                <p className="text-red-600 dark:text-red-400 font-medium">Error loading employees</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
                <Button onClick={fetchEmployees} variant="outline" className="mt-2 bg-transparent">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 border rounded-lg overflow-hidden flex flex-col min-h-0 bg-white dark:bg-slate-900">
              <div className="overflow-auto flex-1">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 border-b-2 border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="text-left p-4 font-semibold text-sm w-32">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={allFilteredSelected} onCheckedChange={handleSelectAll} />
                          <span>Select All</span>
                        </div>
                      </th>
                      <th className="text-left p-4 font-semibold text-sm w-1/3">Employee Name</th>
                      <th className="text-left p-4 font-semibold text-sm w-40">Employee ID</th>
                      <th className="text-left p-4 font-semibold text-sm w-32">Gender</th>
                      <th className="text-left p-4 font-semibold text-sm">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 bg-blue-50/50 dark:bg-blue-900/20">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedEmployeeIds.has("SELF")}
                          onCheckedChange={(checked) => handleSelectEmployee("SELF", checked as boolean)}
                        />
                      </td>
                      <td className="p-4 font-semibold">SELF</td>
                      <td className="p-4 text-slate-500">-</td>
                      <td className="p-4 text-slate-500">-</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">-</td>
                    </tr>

                    {filteredEmployees.map((employee) => (
                      <tr
                        key={employee.id}
                        className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="p-4">
                          <Checkbox
                            checked={selectedEmployeeIds.has(employee.id)}
                            onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                          />
                        </td>
                        <td className="p-4 font-medium">{employee.name}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">{employee.employeeId}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">{employee.gender || "-"}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-400">{employee.role || "-"}</td>
                      </tr>
                    ))}

                    {filteredEmployees.length === 0 && !isLoading && (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-500">
                          No employees found matching "{searchQuery}"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="text-sm text-slate-600 dark:text-slate-400 font-medium px-1">
            {selectedEmployeeIds.size} employee(s) selected
          </div>
        </div>

        <DialogFooter className="pt-4 gap-3">
          <Button variant="outline" onClick={handleCancel} className="px-6 bg-transparent">
            Cancel
          </Button>
          <Button
            onClick={handleAddSelected}
            disabled={selectedEmployeeIds.size === 0 || isLoading}
            className="bg-blue-600 hover:bg-blue-700 px-6"
          >
            Add Selected ({selectedEmployeeIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

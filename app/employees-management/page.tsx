import EmployeeListScreen from "@/components/employee-list-screen"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"

export default function EmployeesManagementPage() {
  return (
    <RouteGuard requiredModule={MODULES.EMPLOYEE_MANAGEMENT}>
      <EmployeeListScreen />
    </RouteGuard>
  )
}

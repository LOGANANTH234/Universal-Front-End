import { Employee360Dashboard } from "@/components/employee-360-dashboard"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"

export default function Employee360Page() {
  return (
    <RouteGuard requiredModule={MODULES.EMPLOYEE_360}>
      <Employee360Dashboard />
    </RouteGuard>
  )
}

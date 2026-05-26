import { RoleListScreen } from "@/components/role-list-screen"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"

export default function RoleManagementPage() {
  return (
    <RouteGuard requiredModule={MODULES.ROLE_MANAGEMENT}>
      <RoleListScreen />
    </RouteGuard>
  )
}

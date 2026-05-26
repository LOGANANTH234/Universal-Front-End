import { UserListScreen } from "@/components/user-list-screen"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"

export default function UserManagementPage() {
  return (
    <RouteGuard requiredModule={MODULES.USER_MANAGEMENT}>
      <UserListScreen />
    </RouteGuard>
  )
}

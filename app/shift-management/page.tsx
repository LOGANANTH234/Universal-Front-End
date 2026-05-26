import { ShiftListScreen } from "@/components/shift-list-screen"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"

export default function ShiftManagementPage() {
  return (
    <RouteGuard requiredModule={MODULES.SHIFT_MANAGEMENT}>
      <ShiftListScreen />
    </RouteGuard>
  )
}

import { HolidayManagementScreen } from "@/components/holiday-management-screen"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"

export default function HolidayManagementPage() {
  return (
    <RouteGuard requiredModule={MODULES.HOLIDAY_MANAGEMENT}>
      <HolidayManagementScreen />
    </RouteGuard>
  )
}

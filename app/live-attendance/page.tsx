import LiveAttendanceScreen from "@/components/live-attendance-screen"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"

export default function LiveAttendancePage() {
  return (
    <RouteGuard requiredModule={MODULES.LIVE_ATTENDANCE}>
      <LiveAttendanceScreen />
    </RouteGuard>
  )
}

import { HolidayManagementScreen } from "@/components/holiday-management-screen"
import { RouteGuard } from "@/components/route-guard"
import { MODULES } from "@/lib/permission-utils"
import { ModuleTrialBanner } from "@/components/module-trial-banner"

export default function HolidayManagementPage() {
  return (
    <RouteGuard requiredModule={MODULES.HOLIDAY_MANAGEMENT}>
      <ModuleTrialBanner moduleCode="HOLIDAY_MANAGEMENT" inlineLockout={true}>
        <HolidayManagementScreen />
      </ModuleTrialBanner>
    </RouteGuard>
  )
}

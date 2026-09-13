"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FileText, Users, Calendar, Clock, UserCog, ChevronLeft, ChevronRight, ShieldCheck, Gift, ClipboardEdit, DollarSign, AlertTriangle, BarChart3, Settings, Palmtree, Coins } from "lucide-react"
import { useState, useEffect } from "react"
import { fetchAllModuleTrials, ModuleTrialInfo } from "@/lib/api/module-trials"
import { useHasModule, MODULES } from "@/lib/permission-utils"

function formatValidTill(validTill: string | null): string | null {
  if (!validTill) return null
  try {
    const clean = validTill.trim().replace(" ", "T")
    const d = new Date(clean)
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    }
  } catch {}
  return validTill
}

export function AppNavigation() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [trialModules, setTrialModules] = useState<Record<string, boolean>>({})
  const [trialDetails, setTrialDetails] = useState<Record<string, ModuleTrialInfo>>({})

  const hasShiftManagement = useHasModule(MODULES.SHIFT_MANAGEMENT)
  const hasEmployeeManagement = useHasModule(MODULES.EMPLOYEE_MANAGEMENT)
  const hasEmployee360 = useHasModule(MODULES.EMPLOYEE_360)
  const hasLiveAttendance = useHasModule(MODULES.LIVE_ATTENDANCE)
  const hasRoleManagement = useHasModule(MODULES.ROLE_MANAGEMENT)
  const hasUserManagement = useHasModule(MODULES.USER_MANAGEMENT)
  const hasPayslip = useHasModule(MODULES.PAYSLIP)
  const hasHolidayManagement = useHasModule(MODULES.HOLIDAY_MANAGEMENT)
  const hasViewEditPunches = useHasModule(MODULES.VIEW_EDIT_PUNCHES)
  const hasSalary = useHasModule(MODULES.SALARY)
  const hasWarning = useHasModule(MODULES.WARNING)
  const hasAdvance = useHasModule(MODULES.Advance_Management)
  const hasLeaveManagement = useHasModule(MODULES.LEAVE_MANAGEMENT)
  const hasBonusManagement = useHasModule(MODULES.BONUS_MANAGEMENT)
  const hasSettings = useHasModule(MODULES.SETTINGS)

  useEffect(() => {
    let isMounted = true
    fetchAllModuleTrials()
      .then((trials) => {
        if (!isMounted || !trials) return
        const activeMap: Record<string, boolean> = {}
        for (const [code, info] of Object.entries(trials)) {
          if (info && info.isTrialActive && !info.isExpired) {
            activeMap[code.toUpperCase()] = true
          }
        }
        setTrialModules(activeMap)
        setTrialDetails(trials)
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [])

  const allNavItems = [
    {
      name: "Shift Management",
      href: "/shift-management",
      icon: Calendar,
      moduleCode: MODULES.SHIFT_MANAGEMENT,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/40",
      activeBg: "bg-blue-500 dark:bg-blue-600",
      activeText: "text-white",
      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-900/30",
      hasAccess: hasShiftManagement,
    },
    {
      name: "Employee Management",
      href: "/employees-management",
      icon: Users,
      moduleCode: MODULES.EMPLOYEE_MANAGEMENT,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/40",
      activeBg: "bg-green-500 dark:bg-green-600",
      activeText: "text-white",
      hoverBg: "hover:bg-green-50 dark:hover:bg-green-900/30",
      hasAccess: hasEmployeeManagement,
    },
    {
      name: "Employee 360°",
      href: "/employee-360",
      icon: BarChart3,
      moduleCode: MODULES.EMPLOYEE_360,
      color: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-100 dark:bg-teal-900/40",
      activeBg: "bg-teal-500 dark:bg-teal-600",
      activeText: "text-white",
      hoverBg: "hover:bg-teal-50 dark:hover:bg-teal-900/30",
      hasAccess: hasEmployee360,
    },
    {
      name: "Live Attendance",
      href: "/live-attendance",
      icon: Clock,
      moduleCode: MODULES.LIVE_ATTENDANCE,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/40",
      activeBg: "bg-orange-500 dark:bg-orange-600",
      activeText: "text-white",
      hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-900/30",
      hasAccess: hasLiveAttendance,
    },
    {
      name: "Role Management",
      href: "/role-management",
      icon: UserCog,
      moduleCode: MODULES.ROLE_MANAGEMENT,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/40",
      activeBg: "bg-purple-500 dark:bg-purple-600",
      activeText: "text-white",
      hoverBg: "hover:bg-purple-50 dark:hover:bg-purple-900/30",
      hasAccess: hasRoleManagement,
    },
    {
      name: "User Management",
      href: "/user-management",
      icon: ShieldCheck,
      moduleCode: MODULES.USER_MANAGEMENT,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-100 dark:bg-pink-900/40",
      activeBg: "bg-pink-500 dark:bg-pink-600",
      activeText: "text-white",
      hoverBg: "hover:bg-pink-50 dark:hover:bg-pink-900/30",
      hasAccess: hasUserManagement,
    },
    {
      name: "Payslip",
      href: "/generate", // Updated payslip href from "/" to "/generate" to point to the payslip generation page
      icon: FileText,
      moduleCode: MODULES.PAYSLIP,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/40",
      activeBg: "bg-indigo-500 dark:bg-indigo-600",
      activeText: "text-white",
      hoverBg: "hover:bg-indigo-50 dark:hover:bg-indigo-900/30",
      hasAccess: hasPayslip,
    },
    {
      name: "Holiday Management",
      href: "/holiday-management",
      icon: Gift,
      moduleCode: MODULES.HOLIDAY_MANAGEMENT,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/40",
      activeBg: "bg-red-500 dark:bg-red-600",
      activeText: "text-white",
      hoverBg: "hover:bg-red-50 dark:hover:bg-red-900/30",
      hasAccess: hasHolidayManagement,
    },
    {
      name: "View & Edit Punches",
      href: "/view-edit-punches",
      icon: ClipboardEdit,
      moduleCode: MODULES.VIEW_EDIT_PUNCHES,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/40",
      activeBg: "bg-cyan-500 dark:bg-cyan-600",
      activeText: "text-white",
      hoverBg: "hover:bg-cyan-50 dark:hover:bg-cyan-900/30",
      hasAccess: hasViewEditPunches,
    },
    {
      name: "Salary Details",
      href: "/salary",
      icon: DollarSign,
      moduleCode: MODULES.SALARY,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/40",
      activeBg: "bg-green-500 dark:bg-green-600",
      activeText: "text-white",
      hoverBg: "hover:bg-green-50 dark:hover:bg-green-900/30",
      hasAccess: hasSalary,
    },
    {
      name: "Warnings",
      href: "/warnings",
      icon: AlertTriangle,
      moduleCode: MODULES.WARNING,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/40",
      activeBg: "bg-amber-500 dark:bg-amber-600",
      activeText: "text-white",
      hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-900/30",
      hasAccess: hasWarning,
    },

     {
      name: "Advance Management",
        href: "/advance-management",
      icon: AlertTriangle,
      moduleCode: MODULES.Advance_Management,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/40",
      activeBg: "bg-amber-500 dark:bg-amber-600",
      activeText: "text-white",
      hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-900/30",
      hasAccess: hasAdvance,
    },
    {
      name: "Leave Management",
      href: "/leave-management",
      icon: Palmtree,
      moduleCode: MODULES.LEAVE_MANAGEMENT,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
      activeBg: "bg-emerald-600 dark:bg-emerald-500",
      activeText: "text-white",
      hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-900/30",
      hasAccess: hasLeaveManagement,
    },
    {
      name: "Bonus Management",
      href: "/bonus-management",
      icon: Coins,
      moduleCode: MODULES.BONUS_MANAGEMENT,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/40",
      activeBg: "bg-amber-500 dark:bg-amber-600",
      activeText: "text-white",
      hoverBg: "hover:bg-amber-50 dark:hover:bg-amber-900/30",
      hasAccess: hasBonusManagement,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      moduleCode: MODULES.SETTINGS,
      color: "text-slate-600 dark:text-slate-400",
      bgColor: "bg-slate-100 dark:bg-slate-800",
      activeBg: "bg-slate-800 dark:bg-slate-700",
      activeText: "text-white",
      hoverBg: "hover:bg-slate-50 dark:hover:bg-slate-800/40",
      hasAccess: hasSettings,
    },
  ]

  const navItems = allNavItems.filter((item) => item.hasAccess)

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", isCollapsed ? "4rem" : "16rem")
  }, [isCollapsed])

  if (navItems.length === 0) {
    return null
  }

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700/60 transition-all duration-300 z-50",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700/60">
          {!isCollapsed && <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Navigators</h2>}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-slate-400" />
              ) : (
                <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            const Icon = item.icon
            const code = item.moduleCode ? item.moduleCode.toUpperCase() : ""
            const trialInfo = code ? trialDetails[code] : undefined
            const isTrial = Boolean(code && trialModules[code])
            const expiryText = trialInfo?.validTill ? `Expires ${formatValidTill(trialInfo.validTill)} (${trialInfo.daysRemaining} days left)` : "Free Trial"

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? `${item.activeBg} ${item.activeText} shadow-sm`
                    : `text-gray-700 dark:text-slate-300 ${item.hoverBg}`,
                )}
                title={isTrial ? `${item.name} - ${expiryText}` : isCollapsed ? item.name : undefined}
              >
                <div className="relative flex-shrink-0">
                  <Icon className="h-5 w-5" />
                  {isCollapsed && isTrial && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"
                      title={expiryText}
                    />
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate">{item.name}</span>
                    {isTrial && (
                      <span
                        className={cn(
                          "ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors shrink-0 inline-flex items-center gap-1 shadow-sm uppercase tracking-wide",
                          isActive
                            ? "bg-white/25 text-white border border-white/40"
                            : "bg-red-50 text-red-600 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-800/60"
                        )}
                        title={expiryText}
                      >
                        <Gift className="w-2.5 h-2.5 shrink-0" />
                        <span>new</span>
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile/Tablet Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-700/60 z-50 shadow-lg">
        <div className="flex items-center gap-1 px-2 py-1.5 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            const Icon = item.icon
            const code = item.moduleCode ? item.moduleCode.toUpperCase() : ""
            const trialInfo = code ? trialDetails[code] : undefined
            const isTrial = Boolean(code && trialModules[code])
            const expiryText = trialInfo?.validTill ? `Expires ${formatValidTill(trialInfo.validTill)} (${trialInfo.daysRemaining} days left)` : "Free Trial"
            const displayName = item.name.replace(" Management", "").replace("Live ", "")

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all shrink-0 min-w-[62px]",
                  isActive ? `${item.activeBg} ${item.activeText} shadow-xs` : `text-gray-500 dark:text-slate-400 ${item.hoverBg}`,
                )}
                title={isTrial ? `${item.name} - ${expiryText}` : undefined}
              >
                <div className="relative">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {isTrial && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                  )}
                </div>
                <span className="text-[10px] font-medium truncate w-full text-center flex items-center justify-center gap-0.5 whitespace-nowrap">
                  {displayName}
                  {isTrial && (
                    <span
                      className="text-[9px] text-red-600 dark:text-red-400 font-bold shrink-0 inline-flex items-center gap-0.5 uppercase"
                      title={expiryText}
                    >
                      <Gift className="w-2.5 h-2.5 shrink-0" />
                      new
                    </span>
                  )}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

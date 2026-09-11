"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FileText, Users, Calendar, Clock, UserCog, ChevronLeft, ChevronRight, ShieldCheck, Gift, ClipboardEdit, DollarSign, AlertTriangle, BarChart3, Settings, Palmtree } from "lucide-react"
import { useState, useEffect } from "react"
import { useHasModule, MODULES } from "@/lib/permission-utils"

export function AppNavigation() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

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
  const hasSettings = useHasModule(MODULES.SETTINGS)

  const allNavItems = [
    {
      name: "Shift Management",
      href: "/shift-management",
      icon: Calendar,
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
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/40",
      activeBg: "bg-cyan-500 dark:bg-cyan-600",
      activeText: "text-white",
      hoverBg: "hover:bg-cyan-50 dark:hover:bg-cyan-900/30",
      hasAccess: hasViewEditPunches,
    },
    {
      name: "Salary",
      href: "/salary",
      icon: DollarSign,
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
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/40",
      activeBg: "bg-emerald-600 dark:bg-emerald-500",
      activeText: "text-white",
      hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-900/30",
      hasAccess: hasLeaveManagement,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
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

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? `${item.activeBg} ${item.activeText} shadow-sm`
                    : `text-gray-700 dark:text-slate-300 ${item.hoverBg}`,
                )}
                title={isCollapsed ? item.name : ""}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Mobile/Tablet Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700/60 z-50 shadow-lg">
        <div className="flex items-center justify-around px-1 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            const Icon = item.icon
            const displayName = item.name.replace(" Management", "").replace("Live ", "")

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-all flex-1 min-w-0",
                  isActive ? `${item.activeBg} ${item.activeText}` : `text-gray-500 dark:text-slate-400 ${item.hoverBg}`,
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-[10px] font-medium truncate w-full text-center">{displayName}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

import { MODULES } from "./permission-utils"

// Route configuration with required modules
export const ROUTE_CONFIG = {
  // Protected routes - require specific modules
  "/shift-management": {
    requiredModule: MODULES.SHIFT_MANAGEMENT,
  },
  "/employees-management": {
    requiredModule: MODULES.EMPLOYEE_MANAGEMENT,
  },
  "/employee-360": {
    requiredModule: MODULES.EMPLOYEE_360,
  },
  "/live-attendance": {
    requiredModule: MODULES.LIVE_ATTENDANCE,
  },
  "/role-management": {
    requiredModule: MODULES.ROLE_MANAGEMENT,
  },
  "/": {
    requiredModule: MODULES.PAYSLIP,
  },
  "/editor": {
    requiredModule: MODULES.PAYSLIP,
  },
  "/generate": {
    requiredModule: MODULES.PAYSLIP,
  },
  "/preview": {
    requiredModule: MODULES.PAYSLIP,
  },
  // Public routes - no module required
  "/login": {
    requiredModule: undefined,
  },
  "/unauthorized": {
    requiredModule: undefined,
  },
  "/reports": {
    requiredModule: undefined,
  },
  "/employees": {
    requiredModule: undefined,
  },
  "/settings": {
    requiredModule: undefined,
  },
  "/holiday-management": {
    requiredModule: MODULES.HOLIDAY_MANAGEMENT,
  },
  "/view-edit-punches": {
    requiredModule: MODULES.VIEW_EDIT_PUNCHES,
  },
  "/warnings": {
    requiredModule: MODULES.WARNING,
  },
  "/salary": {
    requiredModule: MODULES.SALARY,
  },
  "/advance-management": {
  requiredModule: MODULES.Advance_Management,
},
} as const

// Helper function to get required module for a route
export function getRequiredModule(pathname: string): string | undefined {
  // Check for exact match first
  if (pathname in ROUTE_CONFIG) {
    return ROUTE_CONFIG[pathname as keyof typeof ROUTE_CONFIG].requiredModule
  }

  // Check for parent path (for nested routes)
  const segments = pathname.split("/").filter(Boolean)
  for (let i = segments.length; i > 0; i--) {
    const parentPath = "/" + segments.slice(0, i).join("/")
    if (parentPath in ROUTE_CONFIG) {
      return ROUTE_CONFIG[parentPath as keyof typeof ROUTE_CONFIG].requiredModule
    }
  }

  // Default: no module required (public route)
  return undefined
}

// Get all protected routes
export function getProtectedRoutes(): string[] {
  return Object.entries(ROUTE_CONFIG)
    .filter(([_, config]) => config.requiredModule !== undefined)
    .map(([path]) => path)
}

// Get all public routes
export function getPublicRoutes(): string[] {
  return Object.entries(ROUTE_CONFIG)
    .filter(([_, config]) => config.requiredModule === undefined)
    .map(([path]) => path)
}

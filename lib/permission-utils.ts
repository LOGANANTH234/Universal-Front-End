"use client"

import { useAuth } from "./contexts/auth-context"

// Module codes from backend
export const MODULES = {
  SHIFT_MANAGEMENT: "SHIFT_MANAGEMENT",
  EMPLOYEE_MANAGEMENT: "EMPLOYEE_MANAGEMENT",
  EMPLOYEE_360: "EMPLOYEE_360",
  LIVE_ATTENDANCE: "LIVE_ATTENDANCE",
  ROLE_MANAGEMENT: "ROLE_MANAGEMENT",
  PAYSLIP: "PAYSLIP",
  USER_MANAGEMENT: "USER_MANAGEMENT",
  HOLIDAY_MANAGEMENT: "HOLIDAY_MANAGEMENT",
  VIEW_EDIT_PUNCHES: "VIEW_EDIT_PUNCHES",
  SALARY: "SALARY",
  WARNING: "WARNING",
Advance_Management: "ADVANCE_MANAGEMENT",
} as const

// Action codes from backend
export const ACTIONS = {
  // Shift Management
  SHIFT_CREATE: "SHIFT_CREATE",
  SHIFT_EDIT: "SHIFT_EDIT",
  SHIFT_DELETE: "SHIFT_DELETE",
  SHIFT_VIEW: "SHIFT_VIEW",
  SHIFT_HELP: "SHIFT_HELP",

  // Employee Management
  EMPLOYEE_ADD: "EMPLOYEE_ADD",
  EMPLOYEE_EDIT: "EMPLOYEE_EDIT",
  EMPLOYEE_DELETE: "EMPLOYEE_DELETE",
  EMPLOYEE_INACTIVE: "EMPLOYEE_INACTIVE",
  EMPLOYEE_SYNC_PHOTOS: "EMPLOYEE_SYNC_PHOTOS",
  EMPLOYEE_VIEW: "EMPLOYEE_VIEW",
  EMPLOYEE_UPDATE_PASSWORD: "EMPLOYEE_UPDATE_PASSWORD",
  EMPLOYEE_DEACTIVATE: "EMPLOYEE_DEACTIVATE",

  // Employee 360
  EMP360_VIEW: "EMP360_VIEW",
  EMP360_EDIT_PERSONAL_INFO: "EMP360_EDIT_PERSONAL_INFO",
  EMP360_GENERATE_SALARY: "EMP360_GENERATE_SALARY",
  EMP360_EDIT_PUNCH: "EMP360_EDIT_PUNCH",

  // Live Attendance
  LIVE_VIEW_SUMMARY: "LIVE_VIEW_SUMMARY",
  LIVE_EDIT_PUNCH: "LIVE_EDIT_PUNCH",

  // Role Management
  ROLE_NEW: "ROLE_NEW",
  ROLE_CHANGE: "ROLE_CHANGE",
  ROLE_DELETE: "ROLE_DELETE",
  ROLE_VIEW: "ROLE_VIEW",
  ROLE_MANAGE_EMPLOYEE: "ROLE_MANAGE_EMPLOYEE",

  // Payslip
  PAYSLIP_VIEW: "PAYSLIP_VIEW",
  PAYSLIP_DOWNLOAD: "PAYSLIP_DOWNLOAD",

  // User Management
  USER_VIEW: "USER_VIEW",
  USER_UPDATE: "USER_UPDATE",

  // Holiday Management
  HOLIDAY_CREATE: "HOLIDAY_CREATE",
  HOLIDAY_EDIT: "HOLIDAY_EDIT",
  HOLIDAY_DELETE: "HOLIDAY_DELETE",
  HOLIDAY_VIEW: "HOLIDAY_VIEW",

  // View & Edit Punches
  PUNCHES_VIEW: "PUNCHES_VIEW",
  PUNCHES_EDIT: "PUNCHES_EDIT",

  // Salary
  SALARY_VIEW: "SALARY_VIEW",
  SALARY_GENERATE: "SALARY_GENERATE",

  // Warning
  WARNING_VIEW: "WARNING_VIEW",
} as const

export function getAllModulesWithActions() {
  return [
    {
      moduleCode: MODULES.SHIFT_MANAGEMENT,
      moduleName: "Shift Management",
      actions: [
        { actionCode: ACTIONS.SHIFT_CREATE, actionName: "Create Shift" },
        { actionCode: ACTIONS.SHIFT_EDIT, actionName: "Edit Shift" },
        { actionCode: ACTIONS.SHIFT_DELETE, actionName: "Delete Shift" },
        { actionCode: ACTIONS.SHIFT_VIEW, actionName: "View Shift" },
        { actionCode: ACTIONS.SHIFT_HELP, actionName: "Help" },
      ],
    },
    {
      moduleCode: MODULES.EMPLOYEE_MANAGEMENT,
      moduleName: "Employee Management",
      actions: [
        { actionCode: ACTIONS.EMPLOYEE_ADD, actionName: "Add Employee" },
        { actionCode: ACTIONS.EMPLOYEE_EDIT, actionName: "Edit Employee" },
        { actionCode: ACTIONS.EMPLOYEE_DELETE, actionName: "Delete Employee" },
        { actionCode: ACTIONS.EMPLOYEE_INACTIVE, actionName: "Inactive Employee" },
        { actionCode: ACTIONS.EMPLOYEE_SYNC_PHOTOS, actionName: "Sync Photos" },
        { actionCode: ACTIONS.EMPLOYEE_VIEW, actionName: "View Employee" },
        { actionCode: ACTIONS.EMPLOYEE_UPDATE_PASSWORD, actionName: "Update Password" },
        { actionCode: ACTIONS.EMPLOYEE_DEACTIVATE, actionName: "Activate / Deactivate Employee" },
      ],
    },
    {
      moduleCode: MODULES.EMPLOYEE_360,
      moduleName: "Employee 360°",
      actions: [
        { actionCode: ACTIONS.EMP360_VIEW, actionName: "View Employee 360 Profile" },
        { actionCode: ACTIONS.EMP360_EDIT_PERSONAL_INFO, actionName: "Edit Personal Info" },
        { actionCode: ACTIONS.EMP360_GENERATE_SALARY, actionName: "Generate Salary" },
        { actionCode: ACTIONS.EMP360_EDIT_PUNCH, actionName: "Edit Punch" },
      ],
    },
    {
      moduleCode: MODULES.LIVE_ATTENDANCE,
      moduleName: "Live Attendance",
      actions: [
        { actionCode: ACTIONS.LIVE_VIEW_SUMMARY, actionName: "View Summary" },
        { actionCode: ACTIONS.LIVE_EDIT_PUNCH, actionName: "Edit Punch" },
      ],
    },
    {
      moduleCode: MODULES.ROLE_MANAGEMENT,
      moduleName: "Role Management",
      actions: [
        { actionCode: ACTIONS.ROLE_VIEW, actionName: "View Role" },
        { actionCode: ACTIONS.ROLE_NEW, actionName: "New Role" },
        { actionCode: ACTIONS.ROLE_CHANGE, actionName: "Change Role" },
        { actionCode: ACTIONS.ROLE_DELETE, actionName: "Delete Role" },
        { actionCode: ACTIONS.ROLE_MANAGE_EMPLOYEE, actionName: "Manage Employee" },
      ],
    },
    {
      moduleCode: MODULES.USER_MANAGEMENT,
      moduleName: "User Management",
      actions: [
        { actionCode: ACTIONS.USER_VIEW, actionName: "View Users" },
        { actionCode: ACTIONS.USER_UPDATE, actionName: "Update User Credentials" },
      ],
    },
    {
      moduleCode: MODULES.PAYSLIP,
      moduleName: "Payslip",
      actions: [
        { actionCode: ACTIONS.PAYSLIP_VIEW, actionName: "View Payslip" },
        { actionCode: ACTIONS.PAYSLIP_DOWNLOAD, actionName: "Download Payslip" },
      ],
    },
    {
      moduleCode: MODULES.HOLIDAY_MANAGEMENT,
      moduleName: "Holiday Management",
      actions: [
        { actionCode: "HOLIDAY_CREATE", actionName: "Create Holiday" },
        { actionCode: "HOLIDAY_EDIT", actionName: "Edit Holiday" },
        { actionCode: "HOLIDAY_DELETE", actionName: "Delete Holiday" },
        { actionCode: "HOLIDAY_VIEW", actionName: "View Holidays" },
      ],
    },
    {
      moduleCode: MODULES.VIEW_EDIT_PUNCHES,
      moduleName: "View & Edit Punches",
      actions: [
        { actionCode: ACTIONS.PUNCHES_VIEW, actionName: "View Punches" },
        { actionCode: ACTIONS.PUNCHES_EDIT, actionName: "Edit Punches" },
      ],
    },
    {
      moduleCode: MODULES.SALARY,
      moduleName: "Salary",
      actions: [
        { actionCode: ACTIONS.SALARY_VIEW, actionName: "View Salary" },
        { actionCode: ACTIONS.SALARY_GENERATE, actionName: "Generate Salary" },
      ],
    },
    {
      moduleCode: MODULES.WARNING,
      moduleName: "Warning",
      actions: [
        { actionCode: ACTIONS.WARNING_VIEW, actionName: "View Warning" },
      ],
    },

     {
      moduleCode: MODULES.Advance_Management,
      moduleName: "Advance Management",
      actions: [
       
      ],
    },
  ]
}

// Hook to check if user has a specific module
export function useHasModule(moduleCode: string): boolean {
  const { auth } = useAuth()
  if (!auth || !auth.modules) return false

  return auth.modules.some((module) => module.moduleCode === moduleCode)
}

// Hook to check if user has a specific action within a module
export function useHasAction(moduleCode: string, actionCode: string): boolean {
  const { auth } = useAuth()
  if (!auth || !auth.modules) return false

  const module = auth.modules.find((m) => m.moduleCode === moduleCode)
  if (!module) return false

  // If module has no actions array, it means no actions are allowed
  if (!module.actions || module.actions.length === 0) return false

  return module.actions.some((action) => action.actionCode === actionCode)
}

// Helper to get all allowed modules
export function useAllowedModules(): string[] {
  const { auth } = useAuth()
  if (!auth || !auth.modules) return []

  return auth.modules.map((m) => m.moduleCode)
}

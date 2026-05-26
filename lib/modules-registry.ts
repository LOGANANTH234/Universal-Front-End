// This replaces the hard-coded AVAILABLE_MODULES and allows dynamic module discovery

export interface ModuleDefinition {
  id: string
  name: string
  actions: {
    id: string
    name: string
  }[]
}

// Centralized registry of all application modules
export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: "emp-mgmt",
    name: "Employee Management",
    actions: [
      { id: "emp-add", name: "Add Employee" },
      { id: "emp-edit", name: "Edit Employee" },
      { id: "emp-delete", name: "Delete Employee" },
      { id: "emp-activate", name: "Activate / Deactivate Employee" },
    ],
  },
  {
    id: "shift-mgmt",
    name: "Shift Management",
    actions: [
      { id: "shift-create", name: "Create New Shift" },
      { id: "shift-edit", name: "Edit Shift" },
      { id: "shift-delete", name: "Delete Shift" },
      { id: "shift-help", name: "Help" },
    ],
  },
  {
    id: "attendance",
    name: "Live Attendance",
    actions: [],
  },
]

// Convert MODULE_REGISTRY to PermissionNode format for the role management UI
import { PermissionNode } from "./role-types"

export function getAvailableModules(): PermissionNode[] {
  return MODULE_REGISTRY.map((module) => ({
    id: module.id,
    name: module.name,
    type: "module" as const,
    children: module.actions.map((action) => ({
      id: action.id,
      name: action.name,
      type: "action" as const,
    })),
  }))
}

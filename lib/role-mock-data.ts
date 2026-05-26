import { PermissionNode, Role } from "./role-types"
import { getAvailableModules } from "./modules-registry"

export const AVAILABLE_MODULES: PermissionNode[] = getAvailableModules()

export const MOCK_ROLES: Role[] = [
  {
    id: "role-1",
    name: "Operator",
    permissions: [
      {
        id: "emp-mgmt",
        name: "Employee Management",
        type: "module",
      },
      {
        id: "shift-mgmt",
        name: "Shift Management",
        type: "module",
        children: [
          { id: "shift-create", name: "Create New Shift", type: "action" },
          { id: "shift-edit", name: "Edit Shift", type: "action" },
        ],
      },
      {
        id: "view-edit-punches",
        name: "View & Edit Punches",
        type: "module",
        children: [
          { id: "punches-view", name: "View Punches", type: "action" },
          { id: "punches-edit", name: "Edit Punches", type: "action" },
        ],
      },
    ],
  },
  {
    id: "role-2",
    name: "Manager",
    permissions: [
      {
        id: "emp-mgmt",
        name: "Employee Management",
        type: "module",
        children: [
          { id: "emp-add", name: "Add Employee", type: "action" },
          { id: "emp-edit", name: "Edit Employee", type: "action" },
          { id: "emp-delete", name: "Delete Employee", type: "action" },
          { id: "emp-activate", name: "Activate / Deactivate Employee", type: "action" },
        ],
      },
      {
        id: "shift-mgmt",
        name: "Shift Management",
        type: "module",
        children: [
          { id: "shift-create", name: "Create New Shift", type: "action" },
          { id: "shift-edit", name: "Edit Shift", type: "action" },
          { id: "shift-delete", name: "Delete Shift", type: "action" },
        ],
      },
      {
        id: "view-edit-punches",
        name: "View & Edit Punches",
        type: "module",
        children: [
          { id: "punches-view", name: "View Punches", type: "action" },
          { id: "punches-edit", name: "Edit Punches", type: "action" },
        ],
      },
    ],
  },
  {
    id: "role-3",
    name: "Admin",
    permissions: AVAILABLE_MODULES,
  },
]

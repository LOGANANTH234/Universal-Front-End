// API client for role permissions
const API_BASE_URL = "/api"

import { apiGet, apiPost } from "@/lib/api-client"
import type { PermissionNode } from "@/lib/role-types"

export interface ModuleAction {
  actionCode: string
  actionName: string
}

export interface ModuleResponse {
  moduleCode: string
  moduleName: string
  actions: ModuleAction[]
}

export interface RoleConfig {
  roleId: number
  employeeIds: string[]
  moduleTree: ModuleResponse[]
}

// Fetch role configuration (permissions + employee scope)
export async function fetchRoleConfig(roleId: number): Promise<RoleConfig> {
  try {
    console.log("[v0] Fetching role config for role:", roleId)
    const data = await apiGet(`${API_BASE_URL}/roles/${roleId}/config`)
    console.log("[v0] Role config fetched successfully:", data)
    return data
  } catch (error) {
    console.error("[v0] Error fetching role config:", error)
    // Return empty config on error
    return {
      roleId,
      employeeIds: [],
      moduleTree: [],
    }
  }
}

// Save role configuration (permissions + employee scope)
export async function saveRoleConfig(config: RoleConfig): Promise<void> {
  try {
    console.log("[v0] Saving role config:", config)
    await apiPost(`${API_BASE_URL}/roles/${config.roleId}/save`, config)
    console.log("[v0] Role config saved successfully")
  } catch (error) {
    console.error("[v0] Error saving role config:", error)
    throw error
  }
}

// Convert permission nodes to module responses
export function convertPermissionNodesToModules(permissions: PermissionNode[]): ModuleResponse[] {
  return permissions.map((module) => ({
    moduleCode: module.id,
    moduleName: module.name,
    actions:
      module.children?.map((action) => ({
        actionCode: action.id,
        actionName: action.name,
      })) || [],
  }))
}

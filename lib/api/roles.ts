// API client for roles backend - now using Next.js API routes
const API_BASE_URL = "/api"

export interface RoleResponse {
  id: number
  code: string
  name: string
  description: string | null
}

export interface CreateRolePayload {
  code: string
  name: string
  description: null
}

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api-client"

// Fetch all roles from backend
export async function fetchRoles(): Promise<RoleResponse[]> {
  try {
    console.log("[v0] Fetching roles from API...")
    const data = await apiGet(`${API_BASE_URL}/roles`)
    console.log("[v0] Roles fetched successfully:", data)
    return data
  } catch (error) {
    console.error("[v0] Error fetching roles:", error)
    throw error
  }
}

// Create a new role
export async function createRole(roleName: string): Promise<RoleResponse> {
  try {
    console.log("[v0] Creating role:", roleName)
    const payload: CreateRolePayload = {
      code: roleName.toUpperCase(),
      name: roleName,
      description: null,
    }

    const data = await apiPost(`${API_BASE_URL}/roles`, payload)
    console.log("[v0] Role created successfully:", data)
    return data
  } catch (error) {
    console.error("[v0] Error creating role:", error)
    throw error
  }
}

// Delete a role
export async function deleteRole(roleId: number): Promise<void> {
  try {
    console.log("[v0] Deleting role:", roleId)
    await apiDelete(`${API_BASE_URL}/roles/${roleId}`)
    console.log("[v0] Role deleted successfully")
  } catch (error) {
    console.error("[v0] Error deleting role:", error)
    throw error
  }
}

// Update a role
export async function updateRole(roleId: number, roleName: string): Promise<RoleResponse> {
  try {
    console.log("[v0] Updating role:", roleId)
    const payload = {
      code: roleName.toUpperCase(),
      name: roleName,
      description: null,
    }

    const data = await apiPut(`${API_BASE_URL}/roles/${roleId}`, payload)
    console.log("[v0] Role updated successfully:", data)
    return data
  } catch (error) {
    console.error("[v0] Error updating role:", error)
    throw error
  }
}

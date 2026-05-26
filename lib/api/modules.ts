// API client for modules backend - now using Next.js API routes
const API_BASE_URL = "/api"

import { apiGet } from "@/lib/api-client"

export interface ModuleAction {
  actionCode: string
  actionName: string
}

export interface ModuleResponse {
  moduleCode: string
  moduleName: string
  actions: ModuleAction[]
}

// Fetch available modules tree from backend
export async function fetchModulesTree(): Promise<ModuleResponse[]> {
  try {
    console.log("[v0] Fetching modules tree from API...")
    const data = await apiGet(`${API_BASE_URL}/modules/tree`)
    console.log("[v0] Modules tree fetched successfully:", data)
    return data
  } catch (error) {
    console.error("[v0] Error fetching modules tree:", error)
    throw error
  }
}

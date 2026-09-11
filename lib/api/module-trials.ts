export interface ModuleTrialInfo {
  moduleCode: string
  settingKey: string
  validTill: string | null
  daysRemaining: number
  isExpired: boolean
  isTrialActive: boolean
  contactOwner: string
}

export type ModuleTrialsMap = Record<string, ModuleTrialInfo>

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://13.206.112.19:8080"

function normalizeTrial(raw: any): ModuleTrialInfo | null {
  if (!raw) return null
  return {
    moduleCode: raw.moduleCode,
    settingKey: raw.settingKey || "",
    validTill: raw.validTill ?? null,
    daysRemaining: Number(raw.daysRemaining ?? 0),
    isExpired: Boolean(raw.isExpired ?? raw.expired),
    isTrialActive: Boolean(raw.isTrialActive ?? raw.trialActive),
    contactOwner: raw.contactOwner || "Please contact the system owner.",
  }
}

export async function fetchAllModuleTrials(): Promise<ModuleTrialsMap> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/modules/trials`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!res.ok) {
      console.warn(`[ModuleTrials] HTTP ${res.status} from ${API_BASE_URL}`)
      return {}
    }

    const data = await res.json()
    const map: ModuleTrialsMap = {}
    if (data && typeof data === "object") {
      for (const [key, val] of Object.entries(data)) {
        const norm = normalizeTrial(val)
        if (norm) map[key.toUpperCase()] = norm
      }
    }
    return map
  } catch (error) {
    console.warn("[ModuleTrials] Error fetching trials:", error)
    return {}
  }
}

export async function fetchModuleTrial(moduleCode: string): Promise<ModuleTrialInfo | null> {
  if (!moduleCode) return null
  const code = moduleCode.trim().toUpperCase()

  try {
    const res = await fetch(`${API_BASE_URL}/api/modules/trials/${encodeURIComponent(code)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (res.ok) {
      const data = await res.json()
      return normalizeTrial(data)
    }
  } catch (error) {
    console.warn(`[ModuleTrials] Failed to fetch trial for ${code}:`, error)
  }

  // Fallback: fetch all trials and lookup
  try {
    const all = await fetchAllModuleTrials()
    if (all[code]) return all[code]
    // Check without prefix if any
    for (const [k, v] of Object.entries(all)) {
      if (k === code || k.endsWith(`_${code}`)) return v
    }
  } catch {
    // Ignore fallback errors
  }

  return null
}

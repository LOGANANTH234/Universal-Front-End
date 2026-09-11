import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const candidates = [
      process.env.API_BASE_URL,
      "http://13.206.112.19:8080",
      "http://13.206.112.19:8080",
    ].filter(Boolean) as string[]

    let data: any[] | null = null

    for (const base of candidates) {
      try {
        const response = await fetch(`${base}/api/modules/tree`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          cache: "no-store",
        })

        if (response.ok) {
          data = await response.json()
          if (Array.isArray(data)) {
            break
          }
        }
      } catch (err) {
        // try next candidate
      }
    }

    if (!data) {
      data = []
    }

    // Ensure HOLIDAY_MANAGEMENT is present in the tree
    const hasHoliday = data.some((m: any) => m.moduleCode === "HOLIDAY_MANAGEMENT")
    if (!hasHoliday) {
      data.push({
        moduleCode: "HOLIDAY_MANAGEMENT",
        moduleName: "Holiday Management",
        actions: [
          { actionCode: "HOLIDAY_VIEW", actionName: "View Holidays" },
          { actionCode: "HOLIDAY_EDIT", actionName: "Edit Holiday" },
          { actionCode: "HOLIDAY_CREATE", actionName: "Create Holiday" },
          { actionCode: "HOLIDAY_DELETE", actionName: "Delete Holiday" },
        ],
      })
    }

    // Ensure SETTINGS is present in the tree
    const settingsModule = data.find((m: any) => m.moduleCode === "SETTINGS")
    if (!settingsModule) {
      data.push({
        moduleCode: "SETTINGS",
        moduleName: "Settings",
        actions: [
          { actionCode: "SETTINGS_VIEW", actionName: "View Settings" },
          { actionCode: "SETTINGS_EDIT", actionName: "Edit Settings" },
        ],
      })
    } else if (Array.isArray(settingsModule.actions)) {
      if (!settingsModule.actions.some((a: any) => a.actionCode === "SETTINGS_VIEW")) {
        settingsModule.actions.push({ actionCode: "SETTINGS_VIEW", actionName: "View Settings" })
      }
      if (!settingsModule.actions.some((a: any) => a.actionCode === "SETTINGS_EDIT")) {
        settingsModule.actions.push({ actionCode: "SETTINGS_EDIT", actionName: "Edit Settings" })
      }
    }

    // Ensure LEAVE_MANAGEMENT is present in the tree
    const leaveModule = data.find((m: any) => m.moduleCode === "LEAVE_MANAGEMENT")
    if (!leaveModule) {
      data.push({
        moduleCode: "LEAVE_MANAGEMENT",
        moduleName: "Leave Management",
        actions: [
          { actionCode: "LEAVE_VIEW", actionName: "View Leaves" },
          { actionCode: "LEAVE_APPLY", actionName: "Apply Leave" },
          { actionCode: "LEAVE_APPROVE", actionName: "Approve / Reject Leave" },
          { actionCode: "LEAVE_CANCEL", actionName: "Cancel Leave" },
          { actionCode: "LEAVE_POLICY_EDIT", actionName: "Edit Policies" },
        ],
      })
    } else if (Array.isArray(leaveModule.actions)) {
      const needed = [
        { actionCode: "LEAVE_VIEW", actionName: "View Leaves" },
        { actionCode: "LEAVE_APPLY", actionName: "Apply Leave" },
        { actionCode: "LEAVE_APPROVE", actionName: "Approve / Reject Leave" },
        { actionCode: "LEAVE_CANCEL", actionName: "Cancel Leave" },
        { actionCode: "LEAVE_POLICY_EDIT", actionName: "Edit Policies" },
      ]
      for (const act of needed) {
        if (!leaveModule.actions.some((a: any) => a.actionCode === act.actionCode)) {
          leaveModule.actions.push(act)
        }
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching modules tree:", error)
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 })
  }
}

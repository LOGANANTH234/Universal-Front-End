export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const roleId = id
    const authHeader = request.headers.get("Authorization")

    console.log("[v0] API: Fetching permissions for role:", roleId)

    const response = await fetch(`http://localhost:8080/api/roles/${roleId}/permissions`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })

    if (!response.ok) {
      console.error(`[v0] Backend returned status: ${response.status}`)
      // Don't throw - just return empty array so UI shows "No permissions assigned"
      return Response.json([])
    }

    const data = await response.json()
    console.log("[v0] API: Permissions fetched successfully:", data)
    return Response.json(data)
  } catch (error) {
    console.error("[v0] API: Error fetching role permissions:", error)
    // Return empty array as fallback - allows right tree to render with "No permissions assigned"
    return Response.json([])
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const roleId = id
    const authHeader = request.headers.get("Authorization")
    const permissions = await request.json()

    console.log("[v0] API: Saving permissions for role:", roleId, permissions)

    const response = await fetch(`http://localhost:8080/api/roles/${roleId}/permissions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(permissions),
    })

    if (!response.ok) {
      console.error(`[v0] Backend returned status: ${response.status}`)
      const errorText = await response.text()
      console.error("[v0] Backend error response:", errorText)
      throw new Error(`Backend error: ${response.status}`)
    }

    console.log("[v0] API: Permissions saved successfully")
    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] API: Error saving role permissions:", error)
    // Return 400 instead of 500 for clarity
    return Response.json({ error: "Failed to save role permissions", details: String(error) }, { status: 400 })
  }
}

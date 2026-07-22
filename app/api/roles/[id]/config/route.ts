export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const roleId = id
    const authHeader = request.headers.get("Authorization")

    console.log("[v0] API: Fetching role config for role:", roleId)

    const response = await fetch(`http://13.206.112.19:8080/api/roles/${roleId}/config`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })

    if (!response.ok) {
      console.error(`[v0] Backend returned status: ${response.status}`)
      const errorText = await response.text()
      console.error("[v0] Backend error response:", errorText)
      // Return empty config so UI can render
      return Response.json({
        roleId: Number.parseInt(roleId),
        employeeIds: [],
        moduleTree: [],
      })
    }

    const data = await response.json()
    console.log("[v0] API: Role config fetched successfully:", data)
    return Response.json(data)
  } catch (error) {
    console.error("[v0] API: Error fetching role config:", error)
    // Return empty config as fallback
    return Response.json({
      roleId: Number.parseInt((await params).id),
      employeeIds: [],
      moduleTree: [],
    })
  }
}

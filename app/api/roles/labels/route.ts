export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")

    const response = await fetch("http://13.206.112.19:8080/api/roles/getAllRoleLabelList", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const roleLabels = await response.json()

    return Response.json(roleLabels)
  } catch (error) {
    console.error("[v0] Error fetching role labels:", error)
    return Response.json({ error: "Failed to fetch role labels" }, { status: 500 })
  }
}

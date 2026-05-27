export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")

    const response = await fetch("http://13.206.112.19:8080/api/modules/tree", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error fetching modules tree:", error)
    return Response.json({ error: "Failed to fetch modules" }, { status: 500 })
  }
}

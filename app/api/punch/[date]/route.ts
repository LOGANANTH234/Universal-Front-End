export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params
    const authHeader = request.headers.get("Authorization")

    if (!date) {
      return Response.json(
        { error: "Date parameter is required" },
        { status: 400 }
      )
    }

    const backendUrl = `http://localhost:8080/api/punch/${encodeURIComponent(date)}`

    console.log("[v0] Fetching punches from backend:", backendUrl)

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })

    console.log("[v0] Backend punch response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Backend error:", response.status, errorText)
      return Response.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log("[v0] Punch data retrieved:", data)
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error fetching punches:", error)
    return Response.json(
      { error: "Failed to fetch punches" },
      { status: 500 }
    )
  }
}

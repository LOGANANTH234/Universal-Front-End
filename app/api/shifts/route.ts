export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")

    const backendUrl = "http://localhost:8080/api/shifts"

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Backend error:", response.status, errorText)
      return Response.json(
        { error: `Backend error: ${response.status}`, details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error fetching shifts:", error)
    return Response.json({ error: "Failed to fetch shifts" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const body = await request.json()

    console.log("[v0] Creating shift with body:", JSON.stringify(body, null, 2))

    const response = await fetch("http://localhost:8080/api/shifts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })

    const contentType = response.headers.get("content-type")
    const isJson = contentType?.includes("application/json")

    if (!response.ok) {
      if (isJson) {
        const errorData = await response.json()
        console.error("[v0] Backend error:", response.status, errorData)
        return Response.json(errorData, { status: response.status })
      } else {
        const errorText = await response.text()
        console.error("[v0] Backend error:", response.status, errorText)
        return Response.json(
          { error: `Backend error: ${response.status}`, details: errorText },
          { status: response.status },
        )
      }
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error creating shift:", error)
    return Response.json({ error: "Failed to create shift" }, { status: 500 })
  }
}

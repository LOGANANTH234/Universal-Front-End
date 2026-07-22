export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")

    const response = await fetch("http://13.206.112.19:8080/api/roles", {
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
    console.error("[v0] Error fetching roles:", error)
    return Response.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const body = await request.json()

    const response = await fetch("http://13.206.112.19:8080/api/roles/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error creating role:", error)
    return Response.json({ error: "Failed to create role" }, { status: 500 })
  }
}

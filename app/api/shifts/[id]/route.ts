export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("Authorization")
    const { id } = await params

    const response = await fetch(`http://13.206.112.19:8080/api/shifts/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Backend error:", response.status, errorText)
      return Response.json({ error: `Backend error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error fetching shift by ID:", error)
    return Response.json({ error: "Failed to fetch shift" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("Authorization")
    const { id } = await params
    const body = await request.json()
    
    const response = await fetch(`http://13.206.112.19:8080/api/shifts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
    })

    const contentType = response.headers.get("content-type")
    let data
    if (contentType?.includes("application/json")) {
      data = await response.json()
    } else {
      const text = await response.text()
      data = { error: text }
    }

    if (!response.ok) {
      console.error("[v0] Backend error:", response.status, JSON.stringify(data))
      // Return the validation messages with the appropriate status code
      return Response.json(data, { status: response.status })
    }

    return Response.json(data)
  } catch (error) {
    console.error("[v0] Error updating shift:", error)
    return Response.json({ error: "Failed to update shift" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("Authorization")
    const { id } = await params

    const response = await fetch(`http://13.206.112.19:8080/api/shifts/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Backend error:", response.status, errorText)
      return Response.json({ error: `Backend error: ${response.status}` }, { status: response.status })
    }

    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      const data = await response.json()
      return Response.json(data)
    } else {
      const text = await response.text()
      return Response.json({ message: text || "Shift deleted successfully" })
    }
  } catch (error) {
    console.error("[v0] Error deleting shift:", error)
    return Response.json({ error: "Failed to delete shift" }, { status: 500 })
  }
}

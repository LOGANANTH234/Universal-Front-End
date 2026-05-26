export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const roleId = id
    const authHeader = request.headers.get("Authorization")
    const config = await request.json()

    console.log("[v0] API: Saving role config for role:", roleId, config)

    const response = await fetch(`http://localhost:8080/api/roles/${roleId}/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      console.error(`[v0] Backend returned status: ${response.status}`)
      const errorText = await response.text()
      console.error("[v0] Backend error response:", errorText)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] API: Role config saved successfully:", data)
    return Response.json(data)
  } catch (error) {
    console.error("[v0] API: Error saving role config:", error)
    return Response.json({ error: "Failed to save role configuration", details: String(error) }, { status: 400 })
  }
}

export interface Role {
  id: string
  name: string
  status: "active" | "inactive"
}

export const MOCK_ROLES: Role[] = [
  {
    id: "role-1",
    name: "Operator",
    status: "active",
  },
  {
    id: "role-2",
    name: "Supervisor",
    status: "active",
  },
  {
    id: "role-3",
    name: "Manager",
    status: "active",
  },
  {
    id: "role-4",
    name: "Admin",
    status: "active",
  },
  {
    id: "role-5",
    name: "Viewer",
    status: "active",
  },
]

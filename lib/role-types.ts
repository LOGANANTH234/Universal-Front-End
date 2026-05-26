export interface PermissionNode {
  id: string
  name: string
  type: "module" | "action"
  children?: PermissionNode[]
}

export interface Role {
  id: string
  name: string
  permissions: PermissionNode[]
  isModified?: boolean
}

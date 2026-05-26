"use client"

import { useState, useEffect } from "react"
import { fetchRoles, createRole, deleteRole, type RoleResponse } from "@/lib/api/roles"
import { useToast } from "@/hooks/use-toast"

export function useRoles() {
  const [roles, setRoles] = useState<RoleResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastCreatedRoleId, setLastCreatedRoleId] = useState<number | null>(null)
  const { toast } = useToast()

  // Load roles on mount
  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchRoles()
      setRoles(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load roles"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRole = async (roleName: string) => {
    try {
      const newRole = await createRole(roleName)
      setLastCreatedRoleId(newRole.id)
      toast({
        title: "Success",
        description: "Role created successfully",
      })
      // Refresh the roles list
      await loadRoles()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create role"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const handleDeleteRole = async (roleId: number) => {
    try {
      await deleteRole(roleId)
      setLastCreatedRoleId(null)
      toast({
        title: "Success",
        description: "Role deleted successfully",
      })
      // Refresh the roles list
      await loadRoles()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete role"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return {
    roles,
    loading,
    error,
    loadRoles,
    handleCreateRole,
    handleDeleteRole,
    lastCreatedRoleId,
    setLastCreatedRoleId,
  }
}

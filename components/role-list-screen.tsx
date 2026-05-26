"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useRoles } from "@/hooks/use-roles"
import { Plus, Trash2, Loader2 } from "lucide-react"
import DualTreePermissionEditor from "./dual-tree-permission-editor"
import type { PermissionNode } from "@/lib/role-types"
import { useHasAction, MODULES, ACTIONS } from "@/lib/permission-utils"

export function RoleListScreen() {
  const { roles, loading, error, handleCreateRole, handleDeleteRole, lastCreatedRoleId, setLastCreatedRoleId } =
    useRoles()

  const canViewRole = useHasAction(MODULES.ROLE_MANAGEMENT, ACTIONS.ROLE_VIEW)
  const canCreateRole = useHasAction(MODULES.ROLE_MANAGEMENT, ACTIONS.ROLE_NEW)
  const canChangeRole = useHasAction(MODULES.ROLE_MANAGEMENT, ACTIONS.ROLE_CHANGE)
  const canDeleteRole = useHasAction(MODULES.ROLE_MANAGEMENT, ACTIONS.ROLE_DELETE)
  const canManageEmployee = useHasAction(MODULES.ROLE_MANAGEMENT, ACTIONS.ROLE_MANAGE_EMPLOYEE)

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showNewRoleDialog, setShowNewRoleDialog] = useState(false)
  const [newRoleName, setNewRoleName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [rolePermissions, setRolePermissions] = useState<Record<number, PermissionNode[]>>({})

  useEffect(() => {
    if (selectedRoleId === null && roles.length > 0) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles])

  useEffect(() => {
    if (lastCreatedRoleId !== null) {
      setSelectedRoleId(lastCreatedRoleId)
      setLastCreatedRoleId(null)
    }
  }, [lastCreatedRoleId, setLastCreatedRoleId])

  const currentRole = roles.find((r) => r.id === selectedRoleId) || roles[0]

  const handleNewRole = () => {
    setNewRoleName("")
    setShowNewRoleDialog(true)
  }

  const handleCreateRoleSubmit = async () => {
    if (!newRoleName.trim()) return

    setIsCreating(true)
    const createdRoleId = await handleCreateRole(newRoleName)
    setIsCreating(false)
    setShowNewRoleDialog(false)
    setNewRoleName("")
  }

  const handleDeleteRoleSubmit = async () => {
    if (!currentRole) return

    await handleDeleteRole(currentRole.id)
    if (roles.length > 1) {
      const remainingRoles = roles.filter((r) => r.id !== currentRole.id)
      setSelectedRoleId(remainingRoles[0]?.id || null)
    } else {
      setSelectedRoleId(null)
    }
    setShowDeleteConfirm(false)
  }

  const handlePermissionsChange = (permissions: PermissionNode[]) => {
    if (currentRole) {
      setRolePermissions((prev) => ({
        ...prev,
        [currentRole.id]: permissions,
      }))
    }
  }

  if (loading && roles.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="animate-spin mr-2" />
        Loading roles...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with role selection and controls */}
      <div className="p-6 border-b border-slate-200 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-semibold">Error loading roles:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="bg-white border border-blue-100 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Role Selection */}
            <label className="text-slate-700 font-semibold text-sm whitespace-nowrap">Select Role:</label>
            {roles.length > 0 ? (
              <Select
                value={selectedRoleId?.toString() || ""}
                onValueChange={(value) => setSelectedRoleId(Number(value))}
              >
                <SelectTrigger className="w-64 bg-white text-slate-900 border border-slate-300 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-slate-700 font-semibold">No roles yet</span>
            )}

            {/* Action Buttons */}
            {canCreateRole && (
              <Button
                onClick={handleNewRole}
                size="sm"
                className="bg-blue-600 text-white hover:bg-blue-700 font-semibold h-10"
                disabled={isCreating}
              >
                <Plus size={18} className="mr-1" />
                New
              </Button>
            )}
            {canDeleteRole && (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={roles.length === 0}
                size="sm"
                className="bg-red-600 text-white hover:bg-red-700 font-semibold disabled:opacity-50 disabled:bg-slate-400 h-10"
              >
                <Trash2 size={18} className="mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Permission editor */}
      {currentRole && (
        <div className="flex-1 overflow-hidden">
          <DualTreePermissionEditor
            role={{
              ...currentRole,
              permissions: rolePermissions[currentRole.id] || currentRole.permissions || [],
            }}
            onPermissionsChange={handlePermissionsChange}
            readOnly={!canChangeRole && !canManageEmployee}
            canManageEmployee={canManageEmployee}
            canSavePermissions={canChangeRole}
          />
        </div>
      )}

      {/* Create Role Dialog */}
      <Dialog open={showNewRoleDialog} onOpenChange={setShowNewRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>Enter the name for the new role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Enter role name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreateRoleSubmit()
                }
              }}
              className="w-full"
              autoFocus
              disabled={isCreating}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewRoleDialog(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRoleSubmit}
              disabled={!newRoleName.trim() || isCreating}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{currentRole?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRoleSubmit} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

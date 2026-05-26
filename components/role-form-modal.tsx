import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import DualTreePermissionEditor from "./dual-tree-permission-editor"
import { Role, PermissionNode } from "@/lib/role-types"

interface RoleFormModalProps {
  role: Role | null
  isOpen: boolean
  onClose: () => void
  onSave: (role: Role) => void
}

export default function RoleFormModal({
  role,
  isOpen,
  onClose,
  onSave,
}: RoleFormModalProps) {
  const [formData, setFormData] = useState<Role>(
    role || {
      id: "",
      name: "",
      permissions: [],
      isModified: false,
    }
  )

  useEffect(() => {
    if (role) {
      setFormData(role)
    } else {
      setFormData({
        id: `role-${Date.now()}`,
        name: "",
        permissions: [],
        isModified: false,
      })
    }
  }, [role, isOpen])

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert("Please enter a role name")
      return
    }
    onSave({ ...formData, isModified: false })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {role ? "Edit Role" : "Create New Role"}
            {formData.isModified && <span className="text-red-500 ml-2">*</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value, isModified: true })
              }
              placeholder="Enter role name"
            />
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <DualTreePermissionEditor
              role={formData}
              onPermissionsChange={(permissions) =>
                setFormData({
                  ...formData,
                  permissions,
                  isModified: true,
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            {role ? "Update Role" : "Create Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

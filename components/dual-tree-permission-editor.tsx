"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronUp, ChevronDown, Search, X, Users, Loader2 } from "lucide-react"
import type { PermissionNode, Role, Employee } from "@/lib/role-types"
import { fetchModulesTree } from "@/lib/api/modules"
import {
  fetchRoleConfig,
  saveRoleConfig,
  convertPermissionNodesToModules,
  type RoleConfig,
} from "@/lib/api/role-permissions"
import PermissionTreeNode from "./permission-tree-node"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import EmployeePicklistModal from "./employee-picklist-modal"

interface DualTreePermissionEditorProps {
  role: Role
  onPermissionsChange: (permissions: PermissionNode[]) => void
  readOnly?: boolean // Added readOnly prop to control edit capabilities
  canManageEmployee?: boolean // ROLE_MANAGE_EMPLOYEE permission
  canSavePermissions?: boolean // ROLE_CHANGE permission for saving permissions
}

function convertModulesToPermissionNodes(modules: any[]): PermissionNode[] {
  return modules.map((module) => ({
    id: module.moduleCode,
    name: module.moduleName,
    type: "module" as const,
    children:
      module.actions?.map((action: any) => ({
        id: action.actionCode,
        name: action.actionName,
        type: "action" as const,
      })) || [],
  }))
}

export default function DualTreePermissionEditor({
  role,
  onPermissionsChange,
  readOnly = false,
  canManageEmployee = false,
  canSavePermissions = true,
}: DualTreePermissionEditorProps) {
  const [assignedPermissions, setAssignedPermissions] = useState<PermissionNode[]>([])
  const [availableModules, setAvailableModules] = useState<PermissionNode[]>([])
  const [modulesLoading, setModulesLoading] = useState(true)
  const [modulesError, setModulesError] = useState<string | null>(null)
  const [permissionsLoading, setPermissionsLoading] = useState(false)
  const [permissionsError, setPermissionsError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false)
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])

  useEffect(() => {
    const loadModules = async () => {
      try {
        setModulesLoading(true)
        setModulesError(null)
        const response = await fetchModulesTree()
        const convertedModules = convertModulesToPermissionNodes(response)
        setAvailableModules(convertedModules)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load modules"
        console.error("[v0] Error loading modules:", errorMessage)
        setModulesError(errorMessage)
        setAvailableModules([])
      } finally {
        setModulesLoading(false)
      }
    }

    loadModules()
  }, [])

  useEffect(() => {
    const loadRoleConfig = async () => {
      try {
        setPermissionsLoading(true)
        setPermissionsError(null)
        const config = await fetchRoleConfig(role.id)
        const convertedPermissions = convertModulesToPermissionNodes(config.moduleTree)
        setAssignedPermissions(convertedPermissions)
        setSelectedEmployeeIds(config.employeeIds || [])
        console.log("[v0] Loaded role config with employeeIds:", config.employeeIds)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to load role config"
        console.error("[v0] Error loading role config:", errorMessage)
        setPermissionsError(errorMessage)
        setAssignedPermissions([])
        setSelectedEmployeeIds([])
      } finally {
        setPermissionsLoading(false)
      }
    }

    loadRoleConfig()
  }, [role.id])

  const [leftExpanded, setLeftExpanded] = useState<Record<string, boolean>>({})
  const [rightExpanded, setRightExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (availableModules.length > 0) {
      setLeftExpanded(Object.fromEntries(availableModules.map((m) => [m.id, true])))
    }
  }, [availableModules])

  useEffect(() => {
    if (assignedPermissions.length > 0) {
      setRightExpanded(Object.fromEntries(assignedPermissions.map((m) => [m.id, true])))
    }
  }, [assignedPermissions])

  const [leftSearchQuery, setLeftSearchQuery] = useState("")
  const [rightSearchQuery, setRightSearchQuery] = useState("")
  const [leftSelected, setLeftSelected] = useState<string | null>(null)
  const [rightSelected, setRightSelected] = useState<string | null>(null)
  const [selectedModules, setSelectedModules] = useState<Record<string, boolean>>({})

  const toggleLeftExpand = (nodeId: string) => {
    setLeftExpanded((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }))
  }

  const toggleRightExpand = (nodeId: string) => {
    setRightExpanded((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }))
  }

  const expandAllLeft = () => {
    const allExpanded: Record<string, boolean> = {}
    const traverse = (nodes: PermissionNode[]) => {
      nodes.forEach((node) => {
        allExpanded[node.id] = true
        if (node.children) traverse(node.children)
      })
    }
    traverse(availableModules)
    setLeftExpanded(allExpanded)
  }

  const collapseAllLeft = () => {
    const allCollapsed: Record<string, boolean> = {}
    const traverse = (nodes: PermissionNode[]) => {
      nodes.forEach((node) => {
        allCollapsed[node.id] = false
        if (node.children) traverse(node.children)
      })
    }
    traverse(availableModules)
    setLeftExpanded(allCollapsed)
  }

  const expandAllRight = () => {
    const allExpanded: Record<string, boolean> = {}
    const traverse = (nodes: PermissionNode[]) => {
      nodes.forEach((node) => {
        allExpanded[node.id] = true
        if (node.children) traverse(node.children)
      })
    }
    traverse(assignedPermissions)
    setRightExpanded(allExpanded)
  }

  const collapseAllRight = () => {
    const allCollapsed: Record<string, boolean> = {}
    const traverse = (nodes: PermissionNode[]) => {
      nodes.forEach((node) => {
        allCollapsed[node.id] = false
        if (node.children) traverse(node.children)
      })
    }
    traverse(assignedPermissions)
    setRightExpanded(allCollapsed)
  }

  const findNode = (tree: PermissionNode[], nodeId: string): PermissionNode | null => {
    for (const node of tree) {
      if (node.id === nodeId) return node
      if (node.children) {
        const found = findNode(node.children, nodeId)
        if (found) return found
      }
    }
    return null
  }

  const nodeExists = (tree: PermissionNode[], nodeId: string): boolean => {
    return findNode(tree, nodeId) !== null
  }

  const getParentModule = (nodeId: string): PermissionNode | null => {
    for (const module of availableModules) {
      if (module.children?.some((child) => child.id === nodeId)) {
        return module
      }
    }
    return null
  }

  const countActions = (node: PermissionNode): number => {
    if (node.type === "action") return 1
    if (node.children) {
      return node.children.reduce((sum, child) => sum + countActions(child), 0)
    }
    return 0
  }

  const filterNodes = (nodes: PermissionNode[], query: string): PermissionNode[] => {
    if (!query.trim()) return nodes

    return nodes.reduce((filtered, node) => {
      const matchesQuery = node.name.toLowerCase().includes(query.toLowerCase())
      const hasMatchingChildren = node.children?.length ? filterNodes(node.children, query).length > 0 : false

      if (matchesQuery || hasMatchingChildren) {
        const newNode = { ...node }
        if (node.children) {
          newNode.children = filterNodes(node.children, query)
        }
        filtered.push(newNode)
      }

      return filtered
    }, [] as PermissionNode[])
  }

  const filteredLeftModules = useMemo(
    () => filterNodes(availableModules, leftSearchQuery),
    [availableModules, leftSearchQuery],
  )
  const filteredRightModules = useMemo(
    () => filterNodes(assignedPermissions, rightSearchQuery),
    [assignedPermissions, rightSearchQuery],
  )

  const handleModuleSelect = (moduleId: string, selected: boolean) => {
    setSelectedModules((prev) => ({
      ...prev,
      [moduleId]: selected,
    }))
  }

  const handleInclude = () => {
    // Get all checked modules
    const checkedModules = Object.entries(selectedModules)
      .filter(([, checked]) => checked)
      .map(([moduleId]) => moduleId)
    
    // Fall back to leftSelected if no checkboxes are used
    const nodesToInclude = checkedModules.length > 0 ? checkedModules : (leftSelected ? [leftSelected] : [])

    if (nodesToInclude.length === 0) {
      return
    }

    let newPermissions = JSON.parse(JSON.stringify(assignedPermissions))

    // Process each selected module
    for (const nodeToInclude of nodesToInclude) {
      const selectedNode = findNode(availableModules, nodeToInclude)
      if (!selectedNode) {
        continue
      }

      if (checkedModules.length > 0) {
        // When using checkboxes (multi-select from left panel)
        if (selectedNode.type === "module") {
          const existingIndex = newPermissions.findIndex((m: PermissionNode) => m.id === selectedNode.id)
          if (existingIndex >= 0) {
            newPermissions.splice(existingIndex, 1)
          }
          newPermissions.push(JSON.parse(JSON.stringify(selectedNode)))
        }
      } else {
        // When using single selection (leftSelected)
        if (!nodeExists(newPermissions, selectedNode.id)) {
          if (selectedNode.type === "module") {
            const moduleWithoutChildren = { ...selectedNode, children: [] }
            newPermissions.push(moduleWithoutChildren)
          } else {
            const parentModule = getParentModule(selectedNode.id)
            if (parentModule) {
              const existingModule = findNode(newPermissions, parentModule.id)
              if (existingModule) {
                if (!existingModule.children) {
                  existingModule.children = []
                }
                if (!existingModule.children.some((child: PermissionNode) => child.id === selectedNode.id)) {
                  existingModule.children.push(JSON.parse(JSON.stringify(selectedNode)))
                }
              } else {
                const newModule = {
                  ...parentModule,
                  children: [JSON.parse(JSON.stringify(selectedNode))],
                }
                newPermissions.push(newModule)
              }
            }
          }
        }
      }
    }

    setAssignedPermissions(newPermissions)
    onPermissionsChange(newPermissions)
    setSelectedModules({})
    setLeftSelected(null)
  }

  const handleRemove = () => {
    if (!rightSelected) return

    const selectedNode = findNode(assignedPermissions, rightSelected)
    if (!selectedNode) return

    const removeNode = (tree: PermissionNode[], nodeId: string): PermissionNode[] => {
      return tree
        .filter((node) => node.id !== nodeId)
        .map((node) => ({
          ...node,
          children: node.children ? removeNode(node.children, nodeId) : undefined,
        }))
        .filter((node) => node.type !== "module" || (node.children && node.children.length > 0))
    }

    const newPermissions = removeNode(JSON.parse(JSON.stringify(assignedPermissions)), rightSelected)

    setAssignedPermissions(newPermissions)
    onPermissionsChange(newPermissions)
    setRightSelected(null)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const modulesFormat = convertPermissionNodesToModules(assignedPermissions)
      const config: RoleConfig = {
        roleId: role.id,
        employeeIds: selectedEmployeeIds,
        moduleTree: modulesFormat,
      }
      await saveRoleConfig(config)
      console.log("[v0] Role config saved successfully with employeeIds:", selectedEmployeeIds)
    } catch (error) {
      console.error("[v0] Error saving role config:", error)
      alert("Failed to save role configuration. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddEmployees = (employees: Employee[]) => {
    const employeeIds = employees.map((emp) => emp.id)
    setSelectedEmployeeIds(employeeIds)
    console.log("[v0] Updated selected employee IDs:", employeeIds)
  }

  const canInclude = Object.values(selectedModules).some((v) => v) || leftSelected !== null
  const canRemove = rightSelected !== null

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-80px)] bg-blue-50 dark:bg-slate-800/30 p-3 rounded-lg py-12 pt-3 pb-14">
      {(canManageEmployee || canSavePermissions) && (
        <div className="flex justify-end gap-2 px-3">
          {canManageEmployee && (
            <Button
              onClick={() => setIsEmployeeModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Employee
            </Button>
          )}
          {canSavePermissions && (
            <Button
              onClick={handleSave}
              disabled={isSaving || permissionsLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold px-6"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Permissions"
              )}
            </Button>
          )}
        </div>
      )}

      <div className="flex gap-4 h-full">
        <div className="flex-1 border border-blue-200 dark:border-blue-900/40 rounded-lg overflow-hidden flex flex-col bg-white dark:bg-slate-900">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 font-semibold flex items-center justify-between">
            <span>Available Modules & Actions</span>
            <div className="flex gap-2">
              <button
                onClick={expandAllLeft}
                className="p-1 hover:bg-white/20 rounded transition text-white"
                title="Expand All"
                disabled={modulesLoading}
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={collapseAllLeft}
                className="p-1 hover:bg-white/20 rounded transition text-white"
                title="Collapse All"
                disabled={modulesLoading}
              >
                <ChevronUp size={16} />
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-blue-100 dark:border-blue-900/30">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search modules or actions"
                value={leftSearchQuery}
                onChange={(e) => setLeftSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-8 text-sm bg-white dark:bg-slate-800"
                disabled={modulesLoading}
              />
              {leftSearchQuery && (
                <button
                  onClick={() => setLeftSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 relative pb-6">
            {modulesLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span className="text-muted-foreground">Loading modules...</span>
              </div>
            ) : modulesError ? (
              <div className="text-center text-red-600 text-sm py-8 px-4">
                <p className="font-semibold">Error loading modules</p>
                <p className="text-xs mt-2">{modulesError}</p>
              </div>
            ) : filteredLeftModules.length > 0 ? (
              <>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-blue-100 dark:from-blue-900/30 to-transparent pointer-events-none z-10" />
                {filteredLeftModules.map((module) => (
                  <PermissionTreeNode
                    key={module.id}
                    node={module}
                    expanded={leftExpanded}
                    onToggleExpand={toggleLeftExpand}
                    selected={leftSelected}
                    onSelect={setLeftSelected}
                    isHighlighted={false}
                    onModuleSelect={handleModuleSelect}
                    moduleSelectStates={selectedModules}
                  />
                ))}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-blue-100 dark:from-blue-900/30 to-transparent pointer-events-none z-10" />
              </>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">No results found</div>
            )}
          </div>
        </div>

        {canSavePermissions && (
          <div className="flex flex-col items-center justify-center gap-3">
            <Button
              onClick={handleInclude}
              disabled={!canInclude || modulesLoading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-lg transition-all"
            >
              <span>Include</span>
            </Button>
            <Button
              onClick={handleRemove}
              disabled={!canRemove}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-semibold rounded-lg transition-all"
            >
              <span>Remove</span>
            </Button>
          </div>
        )}

        <div className="flex-1 border border-blue-200 dark:border-blue-900/40 rounded-lg overflow-hidden flex flex-col bg-white dark:bg-slate-900">
          <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-4 py-3 font-semibold flex items-center justify-between">
            <span>Assigned to {role.name} Role</span>
            <div className="flex gap-2">
              <button
                onClick={expandAllRight}
                className="p-1 hover:bg-white/20 rounded transition text-white"
                title="Expand All"
              >
                <ChevronDown size={16} />
              </button>
              <button
                onClick={collapseAllRight}
                className="p-1 hover:bg-white/20 rounded transition text-white"
                title="Collapse All"
              >
                <ChevronUp size={16} />
              </button>
            </div>
          </div>

          <div className="px-3 py-2 border-b border-blue-100 dark:border-blue-900/30">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search modules or actions"
                value={rightSearchQuery}
                onChange={(e) => setRightSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-8 text-sm bg-white dark:bg-slate-800"
              />
              {rightSearchQuery && (
                <button
                  onClick={() => setRightSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 relative pb-6">
            {permissionsLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span className="text-muted-foreground">Loading permissions...</span>
              </div>
            ) : permissionsError ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                <p>Unable to load assigned permissions</p>
                <p className="text-xs mt-2">Starting with no permissions assigned</p>
              </div>
            ) : assignedPermissions.length > 0 ? (
              <>
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-blue-100 dark:from-blue-900/30 to-transparent pointer-events-none z-10" />
                {filteredRightModules.map((permission) => (
                  <PermissionTreeNode
                    key={permission.id}
                    node={permission}
                    expanded={rightExpanded}
                    onToggleExpand={toggleRightExpand}
                    selected={rightSelected}
                    onSelect={setRightSelected}
                    isHighlighted={true}
                  />
                ))}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-blue-100 dark:from-blue-900/30 to-transparent pointer-events-none z-10" />
              </>
            ) : (
              <div className="text-center text-muted-foreground text-sm py-8">No permissions assigned</div>
            )}
            {assignedPermissions.length > 0 && filteredRightModules.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">No results found</div>
            )}
          </div>
        </div>
      </div>

      <EmployeePicklistModal
        open={isEmployeeModalOpen}
        onOpenChange={setIsEmployeeModalOpen}
        onAddEmployees={handleAddEmployees}
        initialSelectedEmployees={selectedEmployeeIds}
      />
    </div>
  )
}

import { ChevronDown, ChevronRight, Folder, FileText, Plus, Pencil, Trash2, HelpCircle, Check } from 'lucide-react'
import { Checkbox } from "@/components/ui/checkbox"
import { PermissionNode } from "@/lib/role-types"

interface PermissionTreeNodeProps {
  node: PermissionNode
  expanded: Record<string, boolean>
  onToggleExpand: (nodeId: string) => void
  selected: string | null
  onSelect: (nodeId: string) => void
  isHighlighted: boolean
  onModuleSelect?: (nodeId: string, selected: boolean) => void
  moduleSelectStates?: Record<string, boolean>
}

const getActionIcon = (actionName: string) => {
  const lowerName = actionName.toLowerCase()
  if (lowerName.includes('add') || lowerName.includes('create')) {
    return <Plus size={14} className="flex-shrink-0" />
  } else if (lowerName.includes('edit')) {
    return <Pencil size={14} className="flex-shrink-0" />
  } else if (lowerName.includes('delete')) {
    return <Trash2 size={14} className="flex-shrink-0" />
  } else if (lowerName.includes('help')) {
    return <HelpCircle size={14} className="flex-shrink-0" />
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

export default function PermissionTreeNode({
  node,
  expanded,
  onToggleExpand,
  selected,
  onSelect,
  isHighlighted,
  onModuleSelect,
  moduleSelectStates,
}: PermissionTreeNodeProps) {
  const isExpanded = expanded[node.id] ?? true
  const hasChildren = node.children && node.children.length > 0
  const isSelected = selected === node.id
  const actionCount = node.type === "module" ? countActions(node) : 0
  const isModuleSelected = moduleSelectStates?.[node.id] ?? false

  return (
    <div className="w-full">
      <div
        className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-all duration-200 border-b border-blue-100 dark:border-blue-900/30 group ${
          isSelected
            ? "bg-blue-50 dark:bg-blue-900/25 text-slate-900 dark:text-white border-l-4 border-l-blue-600 dark:border-l-blue-400 shadow-sm"
            : isHighlighted
              ? "bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-white border-l-4 border-l-transparent"
              : "bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800/50 text-slate-900 dark:text-white border-l-4 border-l-transparent"
        }`}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand(node.id)
            }}
            className="p-0 hover:bg-black/10 dark:hover:bg-white/10 rounded transition"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-slate-600 dark:text-slate-400" />
            ) : (
              <ChevronRight size={16} className="text-slate-600 dark:text-slate-400" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {node.type === "module" && !isHighlighted && onModuleSelect && (
          <Checkbox
            checked={isModuleSelected}
            onCheckedChange={(checked) => onModuleSelect(node.id, !!checked)}
            onClick={(e) => e.stopPropagation()}
            className="transition-all"
          />
        )}

        {node.type === "module" ? (
          <Folder size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
        ) : (
          getActionIcon(node.name) || <FileText size={14} className="text-slate-500 dark:text-slate-400 flex-shrink-0" />
        )}

        <span className="text-sm font-medium flex-1 truncate">
          {node.name}
          {node.type === "module" && actionCount > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
              ({actionCount})
            </span>
          )}
        </span>

        {isHighlighted && (
          <Check size={14} className="text-green-600 dark:text-green-400 flex-shrink-0" />
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-2 border-l border-blue-200 dark:border-blue-900/40 pl-2 max-h-max overflow-hidden transition-all duration-250 ease-out">
          {node.children!.map((child) => (
            <PermissionTreeNode
              key={child.id}
              node={child}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              selected={selected}
              onSelect={onSelect}
              isHighlighted={isHighlighted}
              onModuleSelect={onModuleSelect}
              moduleSelectStates={moduleSelectStates}
            />
          ))}
        </div>
      )}
    </div>
  )
}

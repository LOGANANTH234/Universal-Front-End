"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface SearchableComboBoxProps {
  options: { value: string; label: string }[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
}

export function SearchableComboBox({
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No options found.",
}: SearchableComboBoxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full h-9 justify-between bg-gradient-to-r from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-800 border-2 border-blue-300 dark:border-slate-700 hover:from-blue-100 hover:to-blue-200 dark:hover:from-slate-700 dark:hover:to-slate-700 hover:border-blue-400 dark:hover:border-slate-600 text-slate-900 dark:text-slate-100 font-medium shadow-sm"
        >
          <span className="truncate text-sm">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 shadow-lg border-2 border-blue-200 dark:border-slate-700 dark:bg-slate-900" align="start">
        <Command shouldFilter={false} className="dark:bg-slate-900">
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            className="border-b-2 border-blue-100 dark:border-slate-800 text-sm focus-visible:ring-blue-500 dark:text-slate-100 dark:bg-slate-900"
          />
          <CommandList className="dark:bg-slate-900">
            <CommandEmpty className="text-sm text-slate-500 dark:text-slate-400">{emptyText}</CommandEmpty>
            <CommandGroup className="dark:bg-slate-900">
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    setSearch("")
                  }}
                  className="cursor-pointer text-sm hover:bg-blue-100 dark:hover:bg-slate-800 data-[selected]:bg-blue-200 dark:data-[selected]:bg-slate-800 data-[selected]:text-blue-900 dark:data-[selected]:text-blue-200 text-slate-900 dark:text-slate-100"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-blue-600 dark:text-blue-400",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

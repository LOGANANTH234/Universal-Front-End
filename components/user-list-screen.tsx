"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent } from "@/components/ui/card"
import { MOCK_USERS, AVAILABLE_ROLES } from "@/lib/user-mock-data"
import type { User } from "@/lib/user-types"
import { Check, ChevronsUpDown, Eye, EyeOff, Search, UserIcon, Phone, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

export function UserListScreen() {
  const [users] = useState<User[]>(MOCK_USERS)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [roleSearchOpen, setRoleSearchOpen] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleCardClick = (user: User) => {
    setSelectedUser(user)
    setNewPassword("")
    setConfirmPassword("")
    setSelectedRole(user.role)
    setValidationError("")
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setSelectedUser(null)
    setNewPassword("")
    setConfirmPassword("")
    setSelectedRole("")
    setValidationError("")
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const handleSave = () => {
    // Validation
    if (!newPassword || !confirmPassword) {
      setValidationError("Both password fields are required")
      return
    }

    if (newPassword !== confirmPassword) {
      setValidationError("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setValidationError("Password must be at least 8 characters long")
      return
    }

    if (!selectedRole) {
      setValidationError("Please select a role")
      return
    }

    // Success - in a real app, this would call an API
    console.log("Updating user credentials:", {
      userId: selectedUser?.id,
      role: selectedRole,
    })

    // Show success message and close
    alert(`User credentials updated successfully for ${selectedUser?.employeeName}`)
    handleCloseDrawer()
  }

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword
  const isSaveDisabled = !passwordsMatch || !selectedRole

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.employeeName.toLowerCase().includes(query) ||
      user.phoneNumber.includes(query) ||
      user.id.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-background p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Manage user credentials and role assignments</p>
        </div>

        <div className="mb-6 sm:mb-8">
          <div className="flex-1 max-w-md relative">
            <div className="flex gap-2 items-center bg-card border border-blue-400 rounded-lg shadow-sm h-10 px-2 sm:px-3">
              <Search size={18} className="text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name, phone, ID, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-foreground text-xs sm:text-sm focus:outline-none placeholder-muted-foreground min-w-0"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {filteredUsers.map((user) => (
            <Card
              key={user.id}
              onClick={() => handleCardClick(user)}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 hover:border-l-blue-600 bg-card"
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">ID: {user.id}</span>
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-base text-foreground truncate">{user.employeeName}</h3>
                </div>

                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {user.role}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{user.phoneNumber}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No users found matching your search.</p>
          </div>
        )}
      </div>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Update User Credentials</SheetTitle>
            <SheetDescription>Update password and role for {selectedUser?.employeeName}</SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value)
                    setValidationError("")
                  }}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setValidationError("")
                  }}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && confirmPassword && !passwordsMatch && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}
              {passwordsMatch && <p className="text-sm text-green-600">Passwords match</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Popover open={roleSearchOpen} onOpenChange={setRoleSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={roleSearchOpen}
                    className="w-full justify-between bg-transparent"
                  >
                    {selectedRole || "Select role..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search roles..." />
                    <CommandList>
                      <CommandEmpty>No role found.</CommandEmpty>
                      <CommandGroup>
                        {AVAILABLE_ROLES.map((role) => (
                          <CommandItem
                            key={role}
                            value={role}
                            onSelect={(currentValue) => {
                              setSelectedRole(currentValue === selectedRole ? "" : currentValue)
                              setRoleSearchOpen(false)
                              setValidationError("")
                            }}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4", selectedRole === role ? "opacity-100" : "opacity-0")}
                            />
                            {role}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {validationError && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{validationError}</p>
              </div>
            )}
          </div>

          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDrawer}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaveDisabled} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

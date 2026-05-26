import type { User } from "./user-types"

export const MOCK_USERS: User[] = [
  {
    id: "1",
    employeeName: "John Anderson",
    role: "Admin",
    phoneNumber: "+1 (555) 123-4567",
  },
  {
    id: "2",
    employeeName: "Sarah Mitchell",
    role: "HR",
    phoneNumber: "+1 (555) 234-5678",
  },
  {
    id: "3",
    employeeName: "Michael Chen",
    role: "Manager",
    phoneNumber: "+1 (555) 345-6789",
  },
  {
    id: "4",
    employeeName: "Emily Rodriguez",
    role: "Employee",
    phoneNumber: "+1 (555) 456-7890",
  },
  {
    id: "5",
    employeeName: "David Thompson",
    role: "Manager",
    phoneNumber: "+1 (555) 567-8901",
  },
  {
    id: "6",
    employeeName: "Jessica Williams",
    role: "HR",
    phoneNumber: "+1 (555) 678-9012",
  },
  {
    id: "7",
    employeeName: "Robert Martinez",
    role: "Employee",
    phoneNumber: "+1 (555) 789-0123",
  },
  {
    id: "8",
    employeeName: "Amanda Davis",
    role: "Employee",
    phoneNumber: "+1 (555) 890-1234",
  },
]

export const AVAILABLE_ROLES = ["Admin", "HR", "Manager", "Employee"]

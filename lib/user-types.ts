export interface User {
  id: string
  employeeName: string
  role: string
  phoneNumber: string
}

export interface UserCredentials {
  userId: string
  newPassword: string
  confirmPassword: string
  role: string
}

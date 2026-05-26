import type { Employee, EmployeeVersion } from "./employee-types"

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "emp-1",
    name: "Rajesh Kumar",
    phone: "9876543210",
    email: "rajesh.kumar@company.com",
    pan: "ABCDE1234F",
    aadhaar: "123456789012",
    role: "Operator",
    status: "Active",
    registerDate: "2024-01-15",
    regularShifts: [
      {
        id: "reg-1",
        shiftName: "Morning Shift",
        amountType: "Per Day",
        amount: 500,
        extraAllowance: 50,
      },
    ],
    overtimeShifts: [
      {
        id: "ot-1",
        shiftName: "Evening Shift",
        amountType: "Per Shift",
        amount: 750,
        extraAllowance: 0,
      },
    ],
    salaryConfig: {
      frequency: "By Month",
      workdayPolicy: "Exclude Sundays",
    },
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2025-01-20T14:30:00Z",
  },
  {
    id: "emp-2",
    name: "Priya Singh",
    phone: "9876543211",
    email: "priya.singh@company.com",
    pan: "ABCDE1234G",
    aadhaar: "123456789013",
    role: "Office Staff",
    status: "Active",
    registerDate: "2024-02-01",
    regularShifts: [
      {
        id: "reg-2",
        shiftName: "Afternoon Shift",
        amountType: "Per Day",
        amount: 600,
        extraAllowance: 0,
      },
    ],
    overtimeShifts: [],
    salaryConfig: {
      frequency: "By Month",
      workdayPolicy: "Exclude Sundays",
    },
    createdAt: "2024-02-01T09:00:00Z",
    updatedAt: "2025-01-18T11:00:00Z",
  },
]

export const EMPLOYEE_HISTORY: Record<string, EmployeeVersion[]> = {
  "emp-1": [
    {
      version: 3,
      timestamp: "2025-01-20T14:30:00Z",
      // Current version has no endTimestamp
      changedBy: "Admin",
      employee: {
        id: "emp-1",
        name: "Rajesh Kumar",
        phone: "9876543210",
        email: "rajesh.kumar@company.com",
        pan: "ABCDE1234F",
        aadhaar: "123456789012",
        role: "Operator",
        status: "Active",
        registerDate: "2024-01-15",
        regularShifts: [
          {
            id: "reg-1",
            shiftName: "Morning Shift",
            amountType: "Per Day",
            amount: 500,
            extraAllowance: 50,
          },
        ],
        overtimeShifts: [
          {
            id: "ot-1",
            shiftName: "Evening Shift",
            amountType: "Per Shift",
            amount: 750,
            extraAllowance: 0,
          },
        ],
        salaryConfig: {
          frequency: "By Month",
          workdayPolicy: "Exclude Sundays",
        },
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2025-01-20T14:30:00Z",
      },
    },
    {
      version: 2,
      timestamp: "2024-11-10T16:20:00Z",
      endTimestamp: "2025-01-20T14:30:00Z", // Added end timestamp
      changedBy: "HR Manager",
      employee: {
        id: "emp-1",
        name: "Rajesh Kumar",
        phone: "9876543210",
        email: "rajesh.kumar@company.com",
        pan: "ABCDE1234F",
        aadhaar: "123456789012",
        role: "Operator",
        status: "Active",
        registerDate: "2024-01-15",
        regularShifts: [
          {
            id: "reg-1",
            shiftName: "Morning Shift",
            amountType: "Per Day",
            amount: 450,
            extraAllowance: 50,
          },
        ],
        overtimeShifts: [],
        salaryConfig: {
          frequency: "By Month",
          workdayPolicy: "Exclude Sundays",
        },
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-11-10T16:20:00Z",
      },
    },
    {
      version: 1,
      timestamp: "2024-01-15T10:00:00Z",
      endTimestamp: "2024-11-10T16:20:00Z", // Added end timestamp
      changedBy: "Admin",
      employee: {
        id: "emp-1",
        name: "Rajesh Kumar",
        phone: "9876543210",
        email: "rajesh.kumar@company.com",
        pan: "ABCDE1234F",
        aadhaar: "123456789012",
        role: "Operator",
        status: "Active",
        registerDate: "2024-01-15",
        regularShifts: [
          {
            id: "reg-1",
            shiftName: "Morning Shift",
            amountType: "Per Day",
            amount: 400,
            extraAllowance: 0,
          },
        ],
        overtimeShifts: [],
        salaryConfig: {
          frequency: "By Month",
          workdayPolicy: "Include All Days",
        },
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
      },
    },
  ],
  "emp-2": [
    {
      version: 2,
      timestamp: "2025-01-18T11:00:00Z",
      // Current version has no endTimestamp
      changedBy: "HR Manager",
      employee: {
        id: "emp-2",
        name: "Priya Singh",
        phone: "9876543211",
        email: "priya.singh@company.com",
        pan: "ABCDE1234G",
        aadhaar: "123456789013",
        role: "Office Staff",
        status: "Active",
        registerDate: "2024-02-01",
        regularShifts: [
          {
            id: "reg-2",
            shiftName: "Afternoon Shift",
            amountType: "Per Day",
            amount: 600,
            extraAllowance: 0,
          },
        ],
        overtimeShifts: [],
        salaryConfig: {
          frequency: "By Month",
          workdayPolicy: "Exclude Sundays",
        },
        createdAt: "2024-02-01T09:00:00Z",
        updatedAt: "2025-01-18T11:00:00Z",
      },
    },
    {
      version: 1,
      timestamp: "2024-02-01T09:00:00Z",
      endTimestamp: "2025-01-18T11:00:00Z", // Added end timestamp
      changedBy: "Admin",
      employee: {
        id: "emp-2",
        name: "Priya Singh",
        phone: "9876543211",
        email: "priya.singh@company.com",
        pan: "ABCDE1234G",
        aadhaar: "123456789013",
        role: "Office Staff",
        status: "Active",
        registerDate: "2024-02-01",
        regularShifts: [
          {
            id: "reg-2",
            shiftName: "Morning Shift",
            amountType: "Per Day",
            amount: 550,
            extraAllowance: 0,
          },
        ],
        overtimeShifts: [],
        salaryConfig: {
          frequency: "By Week",
          workdayPolicy: "Include All Days",
        },
        createdAt: "2024-02-01T09:00:00Z",
        updatedAt: "2024-02-01T09:00:00Z",
      },
    },
  ],
}

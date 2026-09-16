import type { Branch, Department } from "../types/organization"

export const MOCK_BRANCHES: Branch[] = [
  {
    id: "br-1",
    name: "Downtown Office",
    code: "DTO",
    location: "San Francisco",
    employeeCount: 2,
  },
  {
    id: "br-2",
    name: "Dubai Office",
    code: "DXB",
    location: "Dubai",
    employeeCount: 2,
  },
  {
    id: "br-3",
    name: "Headquarters",
    code: "HQ",
    location: "San Francisco",
    employeeCount: 10,
  },
  {
    id: "br-4",
    name: "Headquarters",
    code: "HQ",
    location: "New York",
    employeeCount: 2,
  },
  {
    id: "br-5",
    name: "London Office",
    code: "LON",
    location: "London",
    employeeCount: 1,
  },
  {
    id: "br-6",
    name: "Remote Hub",
    code: "REM",
    location: "Austin",
    employeeCount: 3,
  },
]

export const MOCK_DEPARTMENTS: Department[] = [
  { id: "dp-1", name: "Engineering", code: "ENG", employeeCount: 8 },
  { id: "dp-2", name: "Engineering", code: "ENG", employeeCount: 3 },
  { id: "dp-3", name: "Finance", code: "FIN", employeeCount: 2 },
  { id: "dp-4", name: "Finance", code: "FIN", employeeCount: 1 },
  { id: "dp-5", name: "Human Resources", code: "HR", employeeCount: 2 },
  { id: "dp-6", name: "Human Resources", code: "HR", employeeCount: 1 },
]

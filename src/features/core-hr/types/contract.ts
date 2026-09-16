import type { ContractType } from "./employee"

export type ContractStatus = "ACTIVE" | "EXPIRED" | "TERMINATED" | "PENDING"

export type Contract = {
  id: string
  employeeId: string
  employeeName: string
  employeeNumber: string
  type: ContractType
  startDate: string
  endDate: string | null
  status: ContractStatus
  daysRemaining: number | null
}

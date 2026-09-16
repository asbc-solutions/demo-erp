import type { DocumentStatus } from "./employee"

export type HrDocument = {
  id: string
  employeeId: string
  employeeName: string
  employeeNumber: string
  type: string
  documentName: string
  status: DocumentStatus
  expiry: string | null
}

export type { DocumentStatus }

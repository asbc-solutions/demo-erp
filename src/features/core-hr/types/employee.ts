export type EmployeeStatus = "active" | "inactive" | "on-leave"
export type AvatarTone = "indigo" | "amber" | "emerald" | "rose" | "violet"
export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERN"
  | "TEMPORARY"
export type ContractType = "PERMANENT" | "FIXED_TERM" | "PROBATION"
export type Gender = "MALE" | "FEMALE" | "OTHER"
export type DocumentStatus = "VERIFIED" | "PENDING" | "REJECTED"

export type EmployeePersonalInfo = {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: Gender
  nationality: string
  nationalId: string
  address: string
  city?: string
  country?: string
  postalCode?: string
}

export type EmployeeEmployment = {
  department: string
  position: string | null
  branch: string
  grade: string
  hireDate: string
  employmentType: EmploymentType
  reportsTo?: string
}

export type EmployeeSalaryRecord = {
  id: string
  date: string
  reason: string
  previous: number
  next: number
  changePercent: number
  status: "APPROVED" | "PENDING" | "REJECTED"
}

export type EmployeeSalary = {
  currentGrossAnnual: number
  netMonthlyEstimate: number
  payFrequency: "MONTHLY" | "WEEKLY" | "BIWEEKLY"
  history: EmployeeSalaryRecord[]
}

export type EmployeeDocument = {
  id: string
  name: string
  type: string
  expiresOn?: string
  status: DocumentStatus
}

export type EmergencyContact = {
  id: string
  name: string
  relationship: string
  phone: string
  email: string
  isPrimary?: boolean
  avatarTone: AvatarTone
}

export type ActivityKind = "CREATE" | "UPDATE" | "DELETE"

export type EmployeeActivity = {
  id: string
  kind: ActivityKind
  date: string
  title: string
  author: string
  description?: string
}

export type Employee = {
  id: string
  number: string
  status: EmployeeStatus
  avatarTone: AvatarTone
  joinedOn: string
  personal: EmployeePersonalInfo
  employment: EmployeeEmployment
  salary: EmployeeSalary
  documents: EmployeeDocument[]
  emergencyContacts: EmergencyContact[]
  activity: EmployeeActivity[]
}

export type NewEmployeeDraft = {
  personal: Partial<EmployeePersonalInfo> & { password?: string }
  employment: Partial<EmployeeEmployment>
  compensation: {
    grossAnnual?: number
    contractType?: ContractType
    contractStart?: string
    contractEnd?: string
    notes?: string
  }
}

export const EMPTY_NEW_EMPLOYEE: NewEmployeeDraft = {
  personal: {},
  employment: {},
  compensation: {},
}

export type DepartmentSalaryBreakdown = {
  id: string
  department: string
  headcount: number
  totalCost: number
  avgSalary: number
  percentOfTotal: number
  color: "indigo" | "emerald" | "amber" | "rose" | "violet" | "blue"
}

export type PayrollOverview = {
  totalPayroll: number
  totalPayrollDelta: number
  averageSalary: number
  averageBasedOn: number
  highestDeptAvg: number
  highestDeptName: string
  momChange: number
  byDepartment: DepartmentSalaryBreakdown[]
}

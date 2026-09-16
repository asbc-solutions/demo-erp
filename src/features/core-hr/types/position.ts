export type PositionVacancy = "FILLED" | "PARTIAL" | "OPEN"

export type Position = {
  id: string
  title: string
  code: string
  department: string
  grade: string
  headcount: number
  capacity: number
  vacancy: PositionVacancy
}

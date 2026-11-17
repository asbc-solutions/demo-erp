export const SALES_STAGES = [
  "Prospecting",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
] as const

export type SalesStage = (typeof SALES_STAGES)[number]

export const STAGE_ACCENT: Record<
  SalesStage,
  { dot: string; rail: string; text: string }
> = {
  Prospecting: {
    dot: "bg-[#64748b]",
    rail: "border-t-[#64748b]",
    text: "text-content-tertiary",
  },
  Qualified: {
    dot: "bg-brand-primary",
    rail: "border-t-brand-primary",
    text: "text-brand-primary",
  },
  Proposal: {
    dot: "bg-brand-primary",
    rail: "border-t-brand-primary",
    text: "text-brand-primary",
  },
  Negotiation: {
    dot: "bg-violet-500",
    rail: "border-t-violet-500",
    text: "text-violet-500",
  },
  Won: {
    dot: "bg-brand-success",
    rail: "border-t-brand-success",
    text: "text-brand-success",
  },
  Lost: {
    dot: "bg-brand-danger",
    rail: "border-t-brand-danger",
    text: "text-brand-danger",
  },
}

export const STAGE_BADGE: Record<SalesStage, string> = {
  Prospecting: "bg-[#f4f4f5] text-content-tertiary",
  Qualified: "bg-brand-primary/12 text-brand-primary",
  Proposal: "bg-brand-info/12 text-brand-info",
  Negotiation: "bg-violet-500/12 text-violet-500",
  Won: "bg-brand-success/12 text-brand-success",
  Lost: "bg-brand-danger/12 text-brand-danger",
}

export type SalesOwner = {
  id: string
  name: string
  initials: string
}

export const SALES_OWNERS: SalesOwner[] = [
  { id: "sc", name: "Sarah Chen", initials: "SC" },
  { id: "mj", name: "Mike Johnson", initials: "MJ" },
]

export type SalesDeal = {
  id: string
  name: string
  company: string
  companyInitials: string
  amount: number
  stage: SalesStage
  closeDate: string
  closeDateLong: string
  owner: SalesOwner
}

export const SALES_DEALS: SalesDeal[] = [
  {
    id: "D-001",
    name: "Platform Integration",
    company: "DataFlow",
    companyInitials: "Da",
    amount: 125000,
    stage: "Prospecting",
    closeDate: "May 21",
    closeDateLong: "May 21, 2026",
    owner: SALES_OWNERS[1],
  },
  {
    id: "D-002",
    name: "Pilot Program",
    company: "InnovateCo",
    companyInitials: "In",
    amount: 15000,
    stage: "Qualified",
    closeDate: "May 8",
    closeDateLong: "May 8, 2026",
    owner: SALES_OWNERS[0],
  },
  {
    id: "D-003",
    name: "Annual Subscription",
    company: "TechStart",
    companyInitials: "Te",
    amount: 42000,
    stage: "Proposal",
    closeDate: "Apr 26",
    closeDateLong: "Apr 26, 2026",
    owner: SALES_OWNERS[1],
  },
  {
    id: "D-004",
    name: "Enterprise License",
    company: "Acme Corp",
    companyInitials: "Ac",
    amount: 85000,
    stage: "Negotiation",
    closeDate: "Apr 21",
    closeDateLong: "Apr 21, 2026",
    owner: SALES_OWNERS[0],
  },
  {
    id: "D-005",
    name: "Consulting Services",
    company: "GrowthLabs",
    companyInitials: "Gr",
    amount: 28000,
    stage: "Negotiation",
    closeDate: "May 1",
    closeDateLong: "May 1, 2026",
    owner: SALES_OWNERS[1],
  },
  {
    id: "D-006",
    name: "Security Package",
    company: "SecureNet",
    companyInitials: "Se",
    amount: 67000,
    stage: "Won",
    closeDate: "Apr 3",
    closeDateLong: "Apr 3, 2026",
    owner: SALES_OWNERS[0],
  },
]

export type SalesKpiAccent = "indigo" | "emerald" | "amber" | "rose"

export type SalesKpi = {
  labelKey: "pipelineValue" | "openDeals" | "wonDeals" | "avgDealSize"
  value: string
  icon: "target" | "briefcase" | "trending-up" | "dollar"
  accent: SalesKpiAccent
}

export const SALES_KPIS: SalesKpi[] = [
  {
    labelKey: "pipelineValue",
    value: "$295,000",
    icon: "target",
    accent: "indigo",
  },
  {
    labelKey: "openDeals",
    value: "5",
    icon: "briefcase",
    accent: "emerald",
  },
  {
    labelKey: "wonDeals",
    value: "1",
    icon: "trending-up",
    accent: "amber",
  },
  {
    labelKey: "avgDealSize",
    value: "$60,333",
    icon: "dollar",
    accent: "rose",
  },
]

"use client"

import { ArrowUpDown, Download, Search } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Input } from "@/src/shared/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/components/ui/select"

import type { ProjectLifecycleStatus, ProjectType } from "../../lib/types"

export type ProjectFilterState = {
  search: string
  status: ProjectLifecycleStatus | "all"
  projectType: ProjectType | "all"
}

type ProjectsFilterBarProps = {
  value: ProjectFilterState
  onChange: (patch: Partial<ProjectFilterState>) => void
}

const STATUS_OPTIONS: { value: ProjectFilterState["status"]; label: string }[] =
  [
    { value: "all", label: "Status: All" },
    { value: "created", label: "Created" },
    { value: "released", label: "Released" },
    { value: "technically_complete", label: "Technically Complete" },
    { value: "closed", label: "Closed" },
  ]

const TYPE_OPTIONS: { value: ProjectFilterState["projectType"]; label: string }[] =
  [
    { value: "all", label: "Type: All" },
    { value: "internal", label: "Internal" },
    { value: "external", label: "External" },
    { value: "capital", label: "Capital (CAPEX)" },
    { value: "overhead", label: "Overhead" },
  ]

export function ProjectsFilterBar({ value, onChange }: ProjectsFilterBarProps) {
  return (
    <Card className="flex flex-row flex-wrap items-center gap-3 p-3">
      <div className="relative w-full sm:w-60">
        <Search
          className="text-content-quaternary pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          type="search"
          value={value.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search projects…"
          aria-label="Search projects"
          className="h-[34px] rounded-lg pl-9 text-[13px] shadow-none"
        />
      </div>

      <Select
        value={value.status}
        onValueChange={(v) =>
          onChange({ status: v as ProjectFilterState["status"] })
        }
      >
        <SelectTrigger className="h-[34px] w-auto gap-1.5 px-3 text-[13px] font-normal">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={value.projectType}
        onValueChange={(v) =>
          onChange({ projectType: v as ProjectFilterState["projectType"] })
        }
      >
        <SelectTrigger className="h-[34px] w-auto gap-1.5 px-3 text-[13px] font-normal">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          className="h-[34px] gap-1.5 px-3 text-[13px] font-normal"
        >
          <ArrowUpDown className="size-3" aria-hidden />
          Sort: Recent
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Export projects"
          className="size-8"
        >
          <Download className="size-3.5" aria-hidden />
        </Button>
      </div>
    </Card>
  )
}

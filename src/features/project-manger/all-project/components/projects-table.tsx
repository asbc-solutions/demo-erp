"use client"

import { useRouter } from "next/navigation"
import { MoreHorizontal } from "lucide-react"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"
import { Progress } from "@/src/shared/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/shared/components/ui/table"
import { cn } from "@/src/shared/lib/utils/utils"

import type { ProjectRow } from "../../lib/mappers/project-mapper"
import { initialsFromName } from "../../lib/mappers/project-mapper"
import { TYPE_STYLE } from "../data/all-projects-data"

import { ProjectStatusBadge } from "./project-status-badge"

export function ProjectsTable({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter()
  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Project</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>PM</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Budget</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="w-12" aria-label="Actions" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow
              key={project.id}
              className="cursor-pointer"
              onClick={() => router.push(`/all-project/${project.id}`)}
            >
              <TableCell className="py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-content-primary text-[13px] leading-[19.5px] font-semibold">
                    {project.name}
                  </span>
                  <span className="text-content-tertiary font-mono text-[11px] leading-[16.5px]">
                    {project.code}
                  </span>
                </div>
              </TableCell>
              <TableCell
                className={cn(
                  "text-[11px] font-medium",
                  TYPE_STYLE[project.typeLabel],
                )}
              >
                {project.typeLabel}
              </TableCell>
              <TableCell>
                <ProjectStatusBadge
                  status={project.status}
                  label={project.statusLabel}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar
                    color="neutral"
                    className="size-[22px] text-[10px] leading-[15px]"
                  >
                    {project.manager
                      ? initialsFromName(project.manager.name)
                      : "?"}
                  </Avatar>
                  <span className="text-content-secondary text-[13px] leading-[19.5px]">
                    {project.manager?.name ?? "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-content-secondary text-[13px]">
                {project.startDate}
              </TableCell>
              <TableCell className="text-content-secondary text-[13px]">
                {project.endDate}
              </TableCell>
              <TableCell className="text-content-primary text-[13px] font-semibold">
                {project.budget ?? "—"}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={project.progress ?? 0}
                    color="indigo"
                    className="bg-surface-muted h-1.5 w-20"
                  />
                  <span className="text-content-secondary text-xs font-semibold tabular-nums">
                    {typeof project.progress === "number"
                      ? `${project.progress}%`
                      : "—"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${project.name}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

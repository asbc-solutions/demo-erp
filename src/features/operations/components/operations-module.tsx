"use client"

import { useState } from "react"
import { Activity, FolderOpen, Plus, Store } from "lucide-react"

import { Button } from "@/src/shared/components/ui/button"
import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { cn } from "@/src/shared/lib/utils/utils"

import type { OperationsTab } from "../data/operations-mock"
import { OPERATIONS_RESOURCES, type OperationsResource } from "../lib/constants/permissions"

import { NewProjectDialog } from "./new-project-dialog"
import { NewTaskDialog } from "./new-task-dialog"
import { NewVendorDialog } from "./new-vendor-dialog"
import { OperationsAccessGate } from "./operations-access-gate"
import { ProjectsTab } from "./projects-tab"
import { TasksTab } from "./tasks-tab"
import { VendorsTab } from "./vendors-tab"

const TAB_CONFIG: ReadonlyArray<{
  id: OperationsTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "tasks", label: "Tasks", icon: Activity },
  { id: "vendors", label: "Vendors", icon: Store },
]

const TAB_ACTION: Record<OperationsTab, string> = {
  projects: "New Project",
  tasks: "New Task",
  vendors: "New Vendor",
}

// Projects/Tasks/Vendors are gated by three independent permission resources — see
// OperationsAccessGate.
const TAB_RESOURCE: Record<OperationsTab, OperationsResource> = {
  projects: OPERATIONS_RESOURCES.projects,
  tasks: OPERATIONS_RESOURCES.tasks,
  vendors: OPERATIONS_RESOURCES.vendors,
}

export function OperationsModule() {
  const [tab, setTab] = useState<OperationsTab>("projects")
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [newVendorOpen, setNewVendorOpen] = useState(false)
  const { can } = usePermissions()

  const handleAction = () => {
    if (tab === "projects") setNewProjectOpen(true)
    else if (tab === "tasks") setNewTaskOpen(true)
    else if (tab === "vendors") setNewVendorOpen(true)
  }

  const canCreate = can.write(TAB_RESOURCE[tab])

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-content-primary text-2xl leading-8 font-semibold tracking-tight">
          Operations
        </h1>
        <p className="text-content-tertiary text-sm leading-5">
          Manage projects, tasks, and vendor relationships in one place.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="bg-surface-white border-stroke-default flex h-9 items-center gap-0.5 rounded-xl border p-1">
          {TAB_CONFIG.map(({ id, label, icon: Icon }) => {
            const isActive = id === tab
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "inline-flex h-[26px] items-center gap-2 rounded-lg px-3 text-[12px] leading-[18px] font-medium transition-colors",
                  isActive
                    ? "bg-surface-page text-content-primary shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
                    : "text-content-tertiary hover:text-content-primary",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            )
          })}
        </div>
        {canCreate ? (
          <Button
            variant="primary"
            className="h-9 gap-2 px-3 text-[12px]"
            onClick={handleAction}
          >
            <Plus className="size-4" aria-hidden />
            {TAB_ACTION[tab]}
          </Button>
        ) : null}
      </div>

      <section>
        {tab === "projects" && (
          <OperationsAccessGate resource={OPERATIONS_RESOURCES.projects}>
            <ProjectsTab />
          </OperationsAccessGate>
        )}
        {tab === "tasks" && (
          <OperationsAccessGate resource={OPERATIONS_RESOURCES.tasks}>
            <TasksTab />
          </OperationsAccessGate>
        )}
        {tab === "vendors" && (
          <OperationsAccessGate resource={OPERATIONS_RESOURCES.vendors}>
            <VendorsTab />
          </OperationsAccessGate>
        )}
      </section>

      <NewProjectDialog
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
      />
      <NewTaskDialog open={newTaskOpen} onOpenChange={setNewTaskOpen} />
      <NewVendorDialog open={newVendorOpen} onOpenChange={setNewVendorOpen} />
    </div>
  )
}

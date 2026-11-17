"use client"

import { BookOpen, CalendarDays, Users } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/shared/components/ui/tabs"
import { Skeleton } from "@/src/shared/components/ui/skeleton"

import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { HR_ROLES } from "@/src/shared/lib/utils/rbac.util"

import { CalendarTab } from "./calendar-tab"
import { MyLeaveView } from "./my-leave-view"
import { PoliciesTab } from "./policies-tab"
import { TeamOverviewTab } from "./team-overview-tab"

function AdminLeaveView() {
  const t = useTranslations("HrLeaves")

  return (
    <Tabs defaultValue="calendar" variant="pill" className="gap-6">
      <TabsList>
        <TabsTrigger value="calendar">
          <CalendarDays className="size-4" strokeWidth={1.75} />
          {t("tabCalendar")}
        </TabsTrigger>
        <TabsTrigger value="team-overview">
          <Users className="size-4" strokeWidth={1.75} />
          {t("tabTeamOverview")}
        </TabsTrigger>
        <TabsTrigger value="policies">
          <BookOpen className="size-4" strokeWidth={1.75} />
          {t("tabPolicies")}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="calendar">
        <CalendarTab />
      </TabsContent>
      <TabsContent value="team-overview">
        <TeamOverviewTab />
      </TabsContent>
      <TabsContent value="policies">
        <PoliciesTab />
      </TabsContent>
    </Tabs>
  )
}

export function LeavesTab() {
  const { can, isLoading, role } = usePermissions()
  const hasManagerRole =
    role === HR_ROLES.hrAdmin ||
    role === HR_ROLES.hrManager ||
    role === HR_ROLES.manager
  const hasTeamLeaveAccess =
    can.read("approvals") ||
    can.write("employees.profile") ||
    can.write("roles")

  if (isLoading) {
    return <Skeleton className="h-[520px] rounded-[14px]" />
  }

  return hasManagerRole || hasTeamLeaveAccess ? (
    <AdminLeaveView />
  ) : (
    <MyLeaveView />
  )
}

"use client"

import { Gauge, MessageSquare, Target, Users } from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/shared/components/ui/tabs"
import { HR_ROLES } from "@/src/shared/lib/utils/rbac.util"

import { usePermissions } from "@/src/shared/lib/hooks/use-permissions"
import { Feedback360Tab } from "./feedback-360-tab"
import { GoalsTab } from "./goals-tab"
import { ReviewCyclesTab } from "./review-cycles-tab"
import { TeamReviewTab } from "./team-review-tab"

export function PerformanceTab() {
  const { can, isLoading, role } = usePermissions()
  const canReviewTeam =
    role === HR_ROLES.hrAdmin ||
    role === HR_ROLES.hrManager ||
    role === HR_ROLES.manager ||
    can.read("approvals") ||
    can.write("employees.profile") ||
    can.write("roles")

  return (
    <Tabs defaultValue="review-cycles" variant="pill" className="gap-6">
      <TabsList>
        <TabsTrigger value="review-cycles">
          <Target strokeWidth={1.75} />
          Review Cycles
        </TabsTrigger>
        {!isLoading && canReviewTeam ? (
          <TabsTrigger value="team-reviews">
            <Users strokeWidth={1.75} />
            Team Reviews
          </TabsTrigger>
        ) : null}
        <TabsTrigger value="goals-okrs">
          <Gauge strokeWidth={1.75} />
          Goals &amp; OKRs
        </TabsTrigger>
        <TabsTrigger value="feedback-360">
          <MessageSquare strokeWidth={1.75} />
          360 Feedback
        </TabsTrigger>
      </TabsList>

      <TabsContent value="review-cycles">
        <ReviewCyclesTab />
      </TabsContent>
      {!isLoading && canReviewTeam ? (
        <TabsContent value="team-reviews">
          <TeamReviewTab />
        </TabsContent>
      ) : null}
      <TabsContent value="goals-okrs">
        <GoalsTab />
      </TabsContent>
      <TabsContent value="feedback-360">
        <Feedback360Tab />
      </TabsContent>
    </Tabs>
  )
}

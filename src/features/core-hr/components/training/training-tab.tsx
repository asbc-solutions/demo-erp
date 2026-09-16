"use client"

import { Award, BarChart3, BookOpen, GraduationCap, Users } from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/shared/components/ui/tabs"

import { CertificationsTab } from "./certifications-tab"
import { CompletionsTab } from "./completions-tab"
import { CoursesTab } from "./courses-tab"
import { ProgramsTab } from "./programs-tab"
import { SkillMatrixTab } from "./skill-matrix-tab"

export function TrainingTab() {
  return (
    <Tabs defaultValue="programs" variant="pill" className="gap-6">
      <TabsList>
        <TabsTrigger value="programs">
          <GraduationCap strokeWidth={1.75} />
          Programs
        </TabsTrigger>
        <TabsTrigger value="courses">
          <BookOpen strokeWidth={1.75} />
          Course Catalog
        </TabsTrigger>
        <TabsTrigger value="certifications">
          <Award strokeWidth={1.75} />
          Certifications
        </TabsTrigger>
        <TabsTrigger value="skills">
          <BarChart3 strokeWidth={1.75} />
          Skills Matrix
        </TabsTrigger>
        <TabsTrigger value="completions">
          <Users strokeWidth={1.75} />
          Completions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="programs">
        <ProgramsTab />
      </TabsContent>
      <TabsContent value="courses">
        <CoursesTab />
      </TabsContent>
      <TabsContent value="certifications">
        <CertificationsTab />
      </TabsContent>
      <TabsContent value="skills">
        <SkillMatrixTab />
      </TabsContent>
      <TabsContent value="completions">
        <CompletionsTab />
      </TabsContent>
    </Tabs>
  )
}

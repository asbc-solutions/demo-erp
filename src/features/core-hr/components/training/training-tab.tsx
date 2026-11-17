"use client"

import { Award, BarChart3, BookOpen, GraduationCap, Users } from "lucide-react"
import { useTranslations } from "next-intl"

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
  const t = useTranslations("HrTraining")

  return (
    <Tabs defaultValue="programs" variant="pill" className="gap-6">
      <TabsList>
        <TabsTrigger value="programs">
          <GraduationCap strokeWidth={1.75} />
          {t("tabPrograms")}
        </TabsTrigger>
        <TabsTrigger value="courses">
          <BookOpen strokeWidth={1.75} />
          {t("tabCourses")}
        </TabsTrigger>
        <TabsTrigger value="certifications">
          <Award strokeWidth={1.75} />
          {t("tabCertifications")}
        </TabsTrigger>
        <TabsTrigger value="skills">
          <BarChart3 strokeWidth={1.75} />
          {t("tabSkills")}
        </TabsTrigger>
        <TabsTrigger value="completions">
          <Users strokeWidth={1.75} />
          {t("tabCompletions")}
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

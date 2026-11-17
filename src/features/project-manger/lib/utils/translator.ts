import type { useTranslations } from "next-intl"

/** Translator for the `ProjectsShared` namespace, passed into lib mappers that build labels. */
export type ProjectsSharedT = ReturnType<typeof useTranslations<"ProjectsShared">>

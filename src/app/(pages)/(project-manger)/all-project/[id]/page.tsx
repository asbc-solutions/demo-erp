import { ProjectDetailShell } from "@/src/features/project-manger/all-project/components/project-detail/project-detail-shell"

const ProjectDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>
}) => {
  const { id } = await params
  return <ProjectDetailShell projectId={id} />
}

export default ProjectDetailPage

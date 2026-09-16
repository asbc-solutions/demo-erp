/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export type DocumentStatus = "draft" | "pending_review" | "approved" | "rejected"

export type DocumentCategory =
  | "specification"
  | "drawing"
  | "report"
  | "contract"
  | "permit"
  | "meeting_minutes"
  | "other"

export type DocumentAccessLevel = "private" | "team" | "public"

export type NodeType = "project" | "timeline" | "phase" | "task" | "subtask"

/* ------------------------------------------------------------------ */
/* DTOs                                                                */
/* ------------------------------------------------------------------ */

export type DocumentFile = {
  file_type: string
  file_size_kb: number
} | null

export type ProjectDocument = {
  document_id: string
  linked_node_id: string
  node_type: NodeType
  node_type_label: string
  project_id: string
  title: string
  document_category: DocumentCategory
  document_category_label: string
  status: DocumentStatus
  status_label: string
  access_level: DocumentAccessLevel
  current_version: number
  is_checked_out: boolean
  checked_out_by?: string | null
  file: DocumentFile
  created_at: string
}

export type DocumentVersion = {
  version_id: string
  version_number: number
  file_type: string
  file_size_kb: number
  change_notes: string | null
  uploaded_by: number
  uploaded_at: string
}

export type DownloadUrlResponse = { download_url: string }

/* ------------------------------------------------------------------ */
/* Payloads                                                            */
/* ------------------------------------------------------------------ */

/** Fields used to build the multipart/form-data upload body. */
export type UploadDocumentInput = {
  projectId: string
  nodeType: NodeType
  title: string
  documentCategory: DocumentCategory
  accessLevel?: DocumentAccessLevel
  description?: string
  ownerId?: string
  file?: File
}

export type CheckInDocumentInput = {
  file: File
  changeNotes?: string
}

export type RejectDocumentPayload = { notes?: string }

/* ------------------------------------------------------------------ */
/* Document library (project-level / portfolio-wide)                   */
/* ------------------------------------------------------------------ */

export type DocumentPerson = { id: string; name: string } | null

/** Lighter row returned by `GET /pm/documents` (the library endpoint). */
export type DocumentLibraryItem = {
  document_id: string
  title: string
  document_category: DocumentCategory
  /** Raw status key (e.g. `draft` / `under_review` / `approved` / `rejected`). */
  status: string
  owner: DocumentPerson
  author: DocumentPerson
}

export type DocumentFacet = { key: string; label: string; count: number }

export type DocumentLibraryFacets = {
  categories: DocumentFacet[]
  statuses: DocumentFacet[]
  tags: DocumentFacet[]
}

export type DocumentLibrary = {
  project_id: string | null
  documents: DocumentLibraryItem[]
  facets: DocumentLibraryFacets
}

/** Omit `project_id` for a portfolio-wide library across every project. */
export type DocumentLibraryParams = {
  project_id?: string
  category?: DocumentCategory
  status?: string
  search?: string
}

import type { NodeType } from "./documents"
import type { PersonRef } from "./people"

/* ------------------------------------------------------------------ */
/* DTOs                                                                */
/* ------------------------------------------------------------------ */

/** A message linked to a hierarchy node (project/timeline/phase/task/subtask). */
export type Message = {
  id: string
  linked_node_id: string
  node_type: NodeType
  project_id: string
  sender_id: string
  body: string
  parent_message_id: string | null
  has_mentions: boolean
  mentioned_employees: string[]
  created_at: string
  updated_at: string
}

/** A single entry in the project-wide activity feed. */
export type ActivityEvent = {
  event_type: string
  node_id: string
  node_type: NodeType
  actor_id: string
  occurred_at: string
  data: {
    body?: string
    message_id?: string
  }
}

/** Row from portfolio `GET /pm/activity` — team feed across all projects. */
export type PortfolioActivityItem = {
  id: string
  project_id: string
  project_name: string
  author: { id: string; name: string; initials: string }
  text: string
  node_type: NodeType
  occurred_at: string
}

/** `GET /pm/collaboration/context` — everything the chat page needs on open. */
export type CollaborationContext = {
  project_id: string | null
  root_node_id: string | null
  members: PersonRef[]
  can_post: boolean
  block_reason: string | null
  recent_activity: (ActivityEvent & { project_id?: string })[]
}

/* ------------------------------------------------------------------ */
/* Params / payloads                                                   */
/* ------------------------------------------------------------------ */

export type MessageListParams = {
  page?: number
  per_page?: number
}

export type ActivityFeedParams = {
  page?: number
  per_page?: number
}

export type MessageSearchParams = {
  project_id: string
  q: string
  page?: number
  per_page?: number
}

export type SendMessagePayload = {
  project_id: string
  node_type: NodeType
  body: string
  parent_message_id?: string | null
  mentions?: string[]
}

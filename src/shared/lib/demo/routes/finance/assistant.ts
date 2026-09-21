import { collection, createRow, findRow } from "../../demo-db"
import { route, type DemoRoute } from "../../demo-router"
import {
  ASSISTANT_ANSWERS,
  ASSISTANT_DATA_GROUPS,
  TOPIC_GROUP,
  buildAgingAnswer,
  buildApproversAnswer,
  buildBriefing,
  buildWatchlistAnswer,
  limitedAnswerFor,
  topicForQuestion,
  type AssistantTopic,
} from "../../seed/finance/assistant"
import { FIN_NOW } from "../../seed/finance/calendar"
import { unreconciledTreasuries } from "./banking-model"
import { FIN_COLLECTIONS } from "./collections"
import { listResponse } from "./helpers"
import { pendingBills } from "./payables"
import { documents, summaries, totals, daysLate } from "./subledger-model"

function answerFor(topic: AssistantTopic): Record<string, unknown> {
  if (topic === "approvers") {
    return buildApproversAnswer(
      pendingBills().map((bill) => ({
        id: String(bill.id),
        number: String(bill.number),
        supplier: String(bill.contact_name),
        amount_base: Number(bill.outstanding_base),
      })),
    )
  }
  if (topic === "watchlist") {
    return buildWatchlistAnswer(unreconciledTreasuries(), collection(FIN_COLLECTIONS.treasuries).length)
  }
  if (topic !== "aging") return ASSISTANT_ANSWERS[topic]
  const receivables = totals("receivable")
  return buildAgingAnswer({
    overdue_base: receivables.overdue_base,
    overdue_count: receivables.overdue_count,
    customers: summaries("receivable"),
  })
}

/** Live figures for the briefing: overdue bills and unreconciled bank lines. */
function briefingLive() {
  const overdue = documents("payable")
    .filter((doc) => doc.type === "bill" && doc.approval !== "returned" && Number(doc.outstanding) > 0)
    .filter((doc) => daysLate(doc.due_date as string | null) > 0)
    .map((doc) => String(doc.due_date))
    .sort()
  const unreconciled = unreconciledTreasuries()
  return {
    overdueBills: overdue.length,
    oldestOverdueBill: overdue[0] ?? null,
    unmatchedLines: unreconciled.reduce((sum, row) => sum + row.count, 0),
    oldestUnmatched: unreconciled.map((row) => row.oldest).sort()[0] ?? null,
    treasuriesUnreconciled: unreconciled.length,
  }
}

type SettingsRow = Record<string, unknown> & { data_groups: Record<string, boolean> }

/** The single settings row; the collection seeds it, so it is always present. */
function settings(): SettingsRow {
  return findRow(FIN_COLLECTIONS.assistantSettings, "settings") as unknown as SettingsRow
}

/** 01.03 · Assistant — scripted, read-only answers grounded in finance screens. */
export const financeAssistantRoutes: DemoRoute[] = [
  route("get", "/finance/assistant/settings", () => ({
    data: { ...settings(), groups: ASSISTANT_DATA_GROUPS },
  })),

  route("put", "/finance/assistant/settings", (req) => {
    const current = settings()
    const groups = req.body.data_groups as Record<string, boolean> | undefined
    Object.assign(current, {
      ...(typeof req.body.name === "string" ? { name: req.body.name } : {}),
      ...(typeof req.body.retention_days === "number" ? { retention_days: req.body.retention_days } : {}),
      ...(typeof req.body.bank_balances_admin_only === "boolean"
        ? { bank_balances_admin_only: req.body.bank_balances_admin_only }
        : {}),
      ...(groups
        ? {
            data_groups: Object.fromEntries(
              ASSISTANT_DATA_GROUPS.map((group) => [
                group.id,
                group.available && Boolean(groups[group.id]),
              ]),
            ),
          }
        : {}),
    })
    return { data: { ...current, groups: ASSISTANT_DATA_GROUPS } }
  }),

  route("get", "/finance/assistant/briefing", () => ({ data: buildBriefing(briefingLive()) })),

  route("get", "/finance/assistant/drafts", (req) =>
    listResponse(collection(FIN_COLLECTIONS.assistantDrafts), { per_page: 100, ...req.params }),
  ),

  route("get", "/finance/assistant/history", (req) =>
    listResponse(collection(FIN_COLLECTIONS.assistantHistory), { per_page: 100, ...req.params }),
  ),

  route("post", "/finance/assistant/ask", (req) => {
    const question = String(req.body.question ?? "").trim()
    if (!question) return { status: 422, data: { message: "Ask a question first." } }

    const topic = topicForQuestion(question)
    const groupId = TOPIC_GROUP[topic]
    const group = ASSISTANT_DATA_GROUPS.find((entry) => entry.id === groupId)
    const enabled = !group || !group.available || settings().data_groups[group.id]
    const body = enabled ? answerFor(topic) : limitedAnswerFor(group.label)

    createRow(FIN_COLLECTIONS.assistantHistory, {
      question,
      scope_label: String(req.body.scope_label ?? ""),
      asked_at: FIN_NOW,
    })

    return {
      data: {
        id: `answer-${Date.now()}`,
        topic,
        question,
        scope_label: String(req.body.scope_label ?? ""),
        asked_at: FIN_NOW,
        answered_at: FIN_NOW,
        ...body,
      },
    }
  }),
]

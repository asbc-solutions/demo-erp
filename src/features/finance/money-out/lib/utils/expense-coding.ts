import type { ExpenseAccount } from "../types/payables"

/** The account an expense falls back to when nothing in it points anywhere. */
export const FALLBACK_EXPENSE_ACCOUNT = "640104"

/** Below this, the suggestion is shown as a guess to check. */
export const CONFIDENT_ABOVE = 50

/** Words that usually mean a given expense account, matched on whole words. */
const RULES: { code: string; words: string[] }[] = [
  { code: "640201", words: ["taxi", "uber", "careem", "fuel", "petrol", "diesel", "parking", "toll", "train", "flight", "hotel", "travel", "transport"] },
  { code: "640301", words: ["restaurant", "cafe", "coffee", "lunch", "dinner", "breakfast", "meal", "meals", "catering", "food"] },
  { code: "640401", words: ["vodafone", "orange", "etisalat", "telecom", "internet", "mobile", "phone", "sim", "broadband"] },
  { code: "640501", words: ["repair", "repairs", "maintenance", "plumber", "plumbing", "electrician", "spare", "parts"] },
  { code: "640104", words: ["stationery", "paper", "toner", "printer", "ink", "pens", "office", "supplies", "folders"] },
]

export type CodingSuggestion = {
  code: string
  name: string
  /** 0–100 */
  confidence: number
  reason: string
}

function firstMatch(text: string): { code: string; word: string } | null {
  const words = new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean))
  for (const rule of RULES) {
    const word = rule.words.find((candidate) => words.has(candidate))
    if (word) return { code: rule.code, word }
  }
  return null
}

/**
 * Propose an expense account from the merchant and description, always with
 * the reason, so a wrong guess is visible before it is accepted.
 */
export function suggestExpenseAccount(
  merchant: string,
  description: string,
  accounts: ExpenseAccount[],
): CodingSuggestion {
  const nameOf = (code: string) => accounts.find((account) => account.code === code)?.name ?? code
  const fromMerchant = firstMatch(merchant)
  const fromDescription = firstMatch(description)

  if (fromMerchant && fromDescription && fromMerchant.code === fromDescription.code) {
    const name = nameOf(fromMerchant.code)
    return {
      code: fromMerchant.code,
      name,
      confidence: 92,
      reason: `The merchant says “${fromMerchant.word}” and the description says “${fromDescription.word}”. Both usually mean ${name.toLowerCase()}.`,
    }
  }

  const match = fromDescription ?? fromMerchant
  if (match) {
    const name = nameOf(match.code)
    const where = match === fromDescription ? "The description" : "The merchant"
    const conflict = fromMerchant && fromDescription ? " The other field points elsewhere, so check it." : ""
    return {
      code: match.code,
      name,
      confidence: conflict ? 55 : 74,
      reason: `${where} says “${match.word}”, which usually means ${name.toLowerCase()}.${conflict}`,
    }
  }

  return {
    code: FALLBACK_EXPENSE_ACCOUNT,
    name: nameOf(FALLBACK_EXPENSE_ACCOUNT),
    confidence: 20,
    reason: "Nothing in the merchant or description points anywhere. This is a guess — check it.",
  }
}

/** Standing in for receipt extraction, which is not connected in this build. */
export const WORKED_EXAMPLE = {
  merchant: "Samir & Aly Stationery",
  description: "Printer paper and toner",
  amount: "2280",
} as const

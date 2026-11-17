import { FileText, Handshake, Receipt, UserPlus } from "lucide-react"
import { useTranslations } from "next-intl"

import { useIntlLocale } from "@/src/i18n/intl-locale"

import { Button } from "@/src/shared/components/ui/button"
import { Card } from "@/src/shared/components/ui/card"

/** Static quick-action shortcuts — not wired to any endpoint, out of scope. */
export function QuickActionsCard({ orgLabel }: Readonly<{ orgLabel: string }>) {
  const t = useTranslations("CommandCenterQuickActions")
  const intlLocale = useIntlLocale()
  const headlineDate = new Intl.DateTimeFormat(intlLocale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date())

  return (
    <Card
      variant="elevated"
      className="gap-5 rounded-2xl border-stroke-default px-5 py-11 shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]"
    >
      <div className="flex flex-col gap-2">
        <p className="text-sm leading-[22.4px] font-medium text-content-primary">
          {t("welcomeBack", { org: orgLabel })} <span aria-hidden>👋</span>
        </p>
        <p className="text-xs leading-[18px] text-content-tertiary">{headlineDate}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          className="h-auto rounded-2xl border-0 bg-gradient-to-br from-brand-primary to-[#4f46e5] px-4 py-2.5 text-[11px] text-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] hover:from-brand-primary-hover hover:to-[#4338ca]"
        >
          <Receipt className="size-4" />
          {t("newInvoice")}
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-auto rounded-2xl border-0 bg-gradient-to-br from-brand-success to-[#059669] px-4 py-2.5 text-[11px] text-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] hover:from-brand-success-hover hover:to-[#047857]"
        >
          <Handshake className="size-4" />
          {t("newDeal")}
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-auto rounded-2xl border-0 bg-gradient-to-br from-violet-500 to-[#7c3aed] px-4 py-2.5 text-[11px] text-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] hover:from-violet-600 hover:to-[#6d28d9]"
        >
          <UserPlus className="size-4" />
          {t("addMember")}
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-auto rounded-2xl border-0 bg-gradient-to-br from-brand-warning to-[#d97706] px-4 py-2.5 text-[11px] text-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] hover:from-brand-warning-hover hover:to-[#b45309]"
        >
          <FileText className="size-4" />
          {t("runReport")}
        </Button>
      </div>
    </Card>
  )
}

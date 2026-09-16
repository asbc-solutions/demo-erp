"use client"

import { useState } from "react"
import { Pencil, Star } from "lucide-react"

import { Avatar } from "@/src/shared/components/ui/avatar"
import { Button } from "@/src/shared/components/ui/button"
import { cn } from "@/src/shared/lib/utils/utils"

import { EditEmergencyContactDialog } from "../../emergency-contacts/edit-emergency-contact-dialog"
import { useEmployeeEmergencyContacts } from "../../../lib/queries/emergency-contacts"
import type { EmergencyContact } from "../../../lib/types"
import type { AvatarTone } from "../../../types/employee"
import { AVATAR_TONE_CLASSES } from "../../shared/avatar-tone"
import { HrSectionSpinner } from "../../shared/hr-loading"
import { SectionCard } from "../section-card"

const TONES: AvatarTone[] = ["indigo", "amber", "emerald", "rose", "violet"]

function deriveTone(str: string): AvatarTone {
  const code = str.charCodeAt(0) || 0
  return TONES[code % TONES.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0][0] ?? "?").toUpperCase()
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase()
}

type EmergencyTabProps = Readonly<{
  employeeId: string
}>

export function EmergencyTab({ employeeId }: EmergencyTabProps) {
  const { data: contacts = [], isLoading } =
    useEmployeeEmergencyContacts(employeeId)
  const [editContact, setEditContact] = useState<EmergencyContact | null>(
    null,
  )

  return (
    <SectionCard
      title="Emergency Contacts"
      description="People to contact in case of emergency"
      bodyClassName="px-6 pb-6 pt-1 flex flex-col gap-3"
    >
      {isLoading && <HrSectionSpinner />}
      {!isLoading && contacts.length === 0 && (
        <p className="text-content-tertiary py-8 text-center text-sm">
          No emergency contacts added yet.
        </p>
      )}
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="border-stroke-default bg-surface-white flex items-start gap-4 rounded-[12px] border px-4 py-4"
        >
          <Avatar
            alt={contact.full_name}
            fallback={initials(contact.full_name)}
            size="lg"
            className={cn(AVATAR_TONE_CLASSES[deriveTone(contact.full_name)])}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-content-primary text-sm leading-5 font-semibold">
                {contact.full_name}
              </span>
              {contact.is_primary && (
                <span className="bg-brand-warning/10 text-brand-warning inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium">
                  <Star className="size-3" strokeWidth={2} />
                  Primary
                </span>
              )}
            </div>
            <span className="text-content-tertiary text-xs leading-4">
              {contact.relationship} · {contact.phone_primary}
              {contact.phone_secondary && ` · ${contact.phone_secondary}`}
            </span>
            {contact.email && (
              <span className="text-content-tertiary text-xs leading-4">
                {contact.email}
              </span>
            )}
            {contact.address && (
              <span className="text-content-tertiary text-xs leading-4">
                {contact.address}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Edit ${contact.full_name}`}
            className="text-content-tertiary hover:text-content-primary shrink-0"
            onClick={() => setEditContact(contact)}
          >
            <Pencil />
          </Button>
        </div>
      ))}

      <EditEmergencyContactDialog
        contact={editContact}
        onOpenChange={(open) => {
          if (!open) setEditContact(null)
        }}
      />
    </SectionCard>
  )
}

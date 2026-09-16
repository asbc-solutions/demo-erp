import { Mail, MapPin, Phone } from "lucide-react"

import type { Employee } from "../../../lib/types"
import { DetailField, SectionCard } from "../section-card"

type PersonalInfoTabProps = Readonly<{
  employee: Employee
}>

export function PersonalInfoTab({ employee }: PersonalInfoTabProps) {
  const { personal_info, contact, address } = employee

  const addressDisplay =
    [address.city, address.country].filter(Boolean).join(", ") || null

  return (
    <SectionCard
      title="Personal Information"
      description="Basic employee details"
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
        <DetailField label="First Name" value={personal_info.first_name} />
        <DetailField label="Last Name" value={personal_info.last_name} />
        <DetailField
          label="Email"
          value={contact.email_work}
          icon={<Mail className="text-content-tertiary size-3.5" strokeWidth={1.75} />}
        />
        <DetailField
          label="Phone"
          value={contact.phone_mobile}
          icon={<Phone className="text-content-tertiary size-3.5" strokeWidth={1.75} />}
        />
        <DetailField
          label="Date of Birth"
          value={personal_info.date_of_birth}
        />
        <DetailField
          label="Gender"
          value={
            personal_info.gender
              ? personal_info.gender.charAt(0).toUpperCase() +
                personal_info.gender.slice(1)
              : null
          }
        />
        <DetailField label="Marital Status" value={personal_info.marital_status} />
        <DetailField label="Nationality" value={personal_info.nationality} />
        <DetailField label="National ID" value={personal_info.national_id} />
        <DetailField label="Blood Type" value={personal_info.blood_type} />
        <DetailField
          className="md:col-span-3"
          label="Address"
          value={addressDisplay}
          icon={
            <MapPin className="text-content-tertiary size-3.5" strokeWidth={1.75} />
          }
        />
      </div>
    </SectionCard>
  )
}

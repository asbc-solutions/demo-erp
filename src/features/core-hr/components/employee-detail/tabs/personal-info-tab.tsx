import { Mail, MapPin, Phone } from "lucide-react"
import { useTranslations } from "next-intl"

import type { Employee, Gender, MaritalStatus } from "../../../lib/types"
import { DetailField, SectionCard } from "../section-card"

type PersonalInfoTabProps = Readonly<{
  employee: Employee
}>

const GENDERS: readonly Gender[] = ["male", "female", "other"]
const MARITAL_STATUSES: readonly MaritalStatus[] = [
  "single",
  "married",
  "divorced",
  "widowed",
]

export function PersonalInfoTab({ employee }: PersonalInfoTabProps) {
  const t = useTranslations("HrEmployeeDetail")
  const tShared = useTranslations("HrShared")
  const tCommon = useTranslations("Common")
  const { personal_info, contact, address } = employee

  const addressDisplay =
    [address.city, address.country].filter(Boolean).join(", ") || null

  return (
    <SectionCard
      title={t("personalTitle")}
      description={t("personalDescription")}
    >
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
        <DetailField label={t("firstName")} value={personal_info.first_name} />
        <DetailField label={t("lastName")} value={personal_info.last_name} />
        <DetailField
          label={tCommon("email")}
          value={contact.email_work}
          icon={<Mail className="text-content-tertiary size-3.5" strokeWidth={1.75} />}
        />
        <DetailField
          label={tCommon("phone")}
          value={contact.phone_mobile}
          icon={<Phone className="text-content-tertiary size-3.5" strokeWidth={1.75} />}
        />
        <DetailField
          label={t("dateOfBirth")}
          value={personal_info.date_of_birth}
        />
        <DetailField
          label={t("gender")}
          value={
            personal_info.gender && GENDERS.includes(personal_info.gender)
              ? tShared(`gender.${personal_info.gender}`)
              : personal_info.gender
          }
        />
        <DetailField
          label={t("maritalStatus")}
          value={
            personal_info.marital_status &&
            MARITAL_STATUSES.includes(personal_info.marital_status)
              ? tShared(`maritalStatus.${personal_info.marital_status}`)
              : personal_info.marital_status
          }
        />
        <DetailField label={t("nationality")} value={personal_info.nationality} />
        <DetailField label={t("nationalId")} value={personal_info.national_id} />
        <DetailField label={t("bloodType")} value={personal_info.blood_type} />
        <DetailField
          className="md:col-span-3"
          label={t("address")}
          value={addressDisplay}
          icon={
            <MapPin className="text-content-tertiary size-3.5" strokeWidth={1.75} />
          }
        />
      </div>
    </SectionCard>
  )
}

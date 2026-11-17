import { useTranslations } from "next-intl"
import { useFormContext } from "react-hook-form"

import { Input } from "@/src/shared/components/ui/input"

import {
  TAX_NUMBER_LENGTH,
  type CustomerFormErrorKey,
  type CustomerFormValues,
} from "../../lib/schema/customer"
import { CustomerTypeToggle } from "./customer-type-toggle"

export const SELECT_CLASS_NAME =
  "border-stroke-default bg-surface-white text-content-primary focus-visible:border-brand-primary focus-visible:ring-brand-primary/15 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px] aria-invalid:border-brand-danger aria-invalid:ring-brand-danger/15"

/** Shared field set for the New/Edit Customer dialogs — matches the Figma form layout. Must render inside a react-hook-form `<FormProvider>`. */
export function CustomerFormFields({
  salespeople,
}: Readonly<{
  salespeople: { id: string; name: string }[]
}>) {
  const t = useTranslations("SalesCustomers")
  const errorText = (message?: string) => (message ? t(message as CustomerFormErrorKey) : null)
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<CustomerFormValues>()

  const customerType = watch("customer_type")

  return (
    <>
      <label className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-xs font-medium text-content-secondary">{t("customerName")}</span>
        <Input
          placeholder={t("customerNamePlaceholder")}
          aria-invalid={!!errors.name}
          autoFocus
          {...register("name")}
        />
        {errors.name && <p className="text-xs text-brand-danger">{errorText(errors.name.message)}</p>}
      </label>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-xs font-medium text-content-secondary">{t("customerType")}</span>
        <CustomerTypeToggle
          value={customerType}
          onChange={(value) => setValue("customer_type", value, { shouldValidate: true })}
        />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">{t("phone")}</span>
        <Input
          type="tel"
          placeholder="01012345678"
          aria-invalid={!!errors.phone}
          {...register("phone")}
        />
        {errors.phone && <p className="text-xs text-brand-danger">{errorText(errors.phone.message)}</p>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">{t("email")}</span>
        <Input
          type="email"
          placeholder="procurement@company.eg"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-brand-danger">{errorText(errors.email.message)}</p>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">{t("taxNumber")}</span>
        <Input
          placeholder="100456782"
          maxLength={TAX_NUMBER_LENGTH}
          aria-invalid={!!errors.tax_number}
          {...register("tax_number")}
        />
        {errors.tax_number && (
          <p className="text-xs text-brand-danger">{errorText(errors.tax_number.message)}</p>
        )}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">{t("assignedSalesperson")}</span>
        <select
          className={SELECT_CLASS_NAME}
          aria-invalid={!!errors.assigned_salesperson_id}
          {...register("assigned_salesperson_id")}
        >
          <option value="" disabled>
            {t("selectSalesperson")}
          </option>
          {salespeople.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
        {errors.assigned_salesperson_id && (
          <p className="text-xs text-brand-danger">{errorText(errors.assigned_salesperson_id.message)}</p>
        )}
      </label>
      <div className="flex flex-col gap-3 border-t border-stroke-default pt-4 sm:col-span-2">
        <span className="text-xs font-semibold tracking-wide text-content-quaternary uppercase">
          {t("billingAddress")}
        </span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-content-secondary">{t("addressLine")}</span>
            <Input placeholder={t("addressLinePlaceholder")} {...register("address_line")} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-content-secondary">{t("city")}</span>
            <Input placeholder={t("cityPlaceholder")} {...register("address_city")} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-content-secondary">{t("governorate")}</span>
            <Input placeholder={t("governoratePlaceholder")} {...register("address_governorate")} />
          </label>
        </div>
      </div>
    </>
  )
}

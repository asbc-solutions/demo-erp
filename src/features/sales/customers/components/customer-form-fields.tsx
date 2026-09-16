import { useFormContext } from "react-hook-form"

import { Input } from "@/src/shared/components/ui/input"

import { TAX_NUMBER_LENGTH, type CustomerFormValues } from "../../lib/schema/customer"
import { CustomerTypeToggle } from "./customer-type-toggle"

export const SELECT_CLASS_NAME =
  "border-stroke-default bg-surface-white text-content-primary focus-visible:border-brand-primary focus-visible:ring-brand-primary/15 h-10 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px] aria-invalid:border-brand-danger aria-invalid:ring-brand-danger/15"

/** Shared field set for the New/Edit Customer dialogs — matches the Figma form layout. Must render inside a react-hook-form `<FormProvider>`. */
export function CustomerFormFields({
  salespeople,
}: Readonly<{
  salespeople: { id: string; name: string }[]
}>) {
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
        <span className="text-xs font-medium text-content-secondary">Customer name</span>
        <Input
          placeholder="e.g. Cairo Trading Co."
          aria-invalid={!!errors.name}
          autoFocus
          {...register("name")}
        />
        {errors.name && <p className="text-xs text-brand-danger">{errors.name.message}</p>}
      </label>
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <span className="text-xs font-medium text-content-secondary">Customer Type</span>
        <CustomerTypeToggle
          value={customerType}
          onChange={(value) => setValue("customer_type", value, { shouldValidate: true })}
        />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">Phone</span>
        <Input
          type="tel"
          placeholder="01012345678"
          aria-invalid={!!errors.phone}
          {...register("phone")}
        />
        {errors.phone && <p className="text-xs text-brand-danger">{errors.phone.message}</p>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">Email</span>
        <Input
          type="email"
          placeholder="procurement@company.eg"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-brand-danger">{errors.email.message}</p>}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">Tax Number</span>
        <Input
          placeholder="100456782"
          maxLength={TAX_NUMBER_LENGTH}
          aria-invalid={!!errors.tax_number}
          {...register("tax_number")}
        />
        {errors.tax_number && (
          <p className="text-xs text-brand-danger">{errors.tax_number.message}</p>
        )}
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-content-secondary">Assigned Salesperson</span>
        <select
          className={SELECT_CLASS_NAME}
          aria-invalid={!!errors.assigned_salesperson_id}
          {...register("assigned_salesperson_id")}
        >
          <option value="" disabled>
            Select a salesperson…
          </option>
          {salespeople.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>
        {errors.assigned_salesperson_id && (
          <p className="text-xs text-brand-danger">{errors.assigned_salesperson_id.message}</p>
        )}
      </label>
      <div className="flex flex-col gap-3 border-t border-stroke-default pt-4 sm:col-span-2">
        <span className="text-xs font-semibold tracking-wide text-content-quaternary uppercase">
          Billing Address
        </span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-xs font-medium text-content-secondary">Address line</span>
            <Input placeholder="Street, building, floor…" {...register("address_line")} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-content-secondary">City</span>
            <Input placeholder="Cairo" {...register("address_city")} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-content-secondary">Governorate</span>
            <Input placeholder="Cairo Governorate" {...register("address_governorate")} />
          </label>
        </div>
      </div>
    </>
  )
}

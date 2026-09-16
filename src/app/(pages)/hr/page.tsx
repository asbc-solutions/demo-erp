import { redirect } from "next/navigation"

import { HR_DEFAULT_ROUTE } from "@/src/shared/lib/constants/hr-nav"

export default function HrPage() {
  redirect(HR_DEFAULT_ROUTE)
}

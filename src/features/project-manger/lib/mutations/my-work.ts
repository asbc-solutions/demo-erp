"use client"

import { useMutation } from "@tanstack/react-query"
import { myWorkApi } from "../api/my-work"
import type { WeeklyDigestPayload } from "../types"

export function useSendWeeklyDigest() {
  return useMutation({
    mutationFn: (payload: WeeklyDigestPayload) =>
      myWorkApi.sendWeeklyDigest(payload).then((r) => r.data.data),
  })
}

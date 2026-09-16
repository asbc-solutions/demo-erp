"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { collaborationApi } from "../api/collaboration"
import { pmKeys } from "../constants/query-keys"
import type { SendMessagePayload } from "../types"

/** Send a message on a node; refreshes that node's message list. */
export function useSendMessage(nodeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      collaborationApi.send(nodeId, payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: pmKeys.collaboration.messagesAll(nodeId),
      }),
  })
}

/** Soft-delete a message; refreshes the node's message list. */
export function useDeleteMessage(nodeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (messageId: string) =>
      collaborationApi.remove(messageId).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: pmKeys.collaboration.messagesAll(nodeId),
      }),
  })
}

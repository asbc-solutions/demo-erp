"use client"

import { useQuery } from "@tanstack/react-query"

import { closeApi } from "../api/close"
import { closeKeys } from "../constants/query-keys"

export function useCloseWorkspace() {
  return useQuery({ queryKey: closeKeys.workspace(), queryFn: () => closeApi.workspace().then((r) => r.data.data) })
}

export function useClosePeriods() {
  return useQuery({ queryKey: closeKeys.periods(), queryFn: () => closeApi.periods().then((r) => r.data.data) })
}

export function useYearEnd() {
  return useQuery({ queryKey: closeKeys.yearEnd(), queryFn: () => closeApi.yearEnd().then((r) => r.data.data) })
}

export function useAdjustments() {
  return useQuery({ queryKey: closeKeys.adjustments(), queryFn: () => closeApi.adjustments().then((r) => r.data.data) })
}

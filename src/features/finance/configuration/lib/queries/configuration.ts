"use client"

import { useQuery } from "@tanstack/react-query"

import { unwrap } from "../../../lib/utils/api"
import { configurationApi } from "../api/configuration"
import { configurationKeys } from "../constants/query-keys"

export function useSetup() {
  return useQuery({ queryKey: configurationKeys.setup(), queryFn: () => configurationApi.setup().then((r) => r.data.data) })
}

export function usePostingMap() {
  return useQuery({ queryKey: configurationKeys.postingMap(), queryFn: () => configurationApi.postingMap().then((r) => r.data.data) })
}

/** Read-only: the simulator posts its question, but nothing is written. */
export function useSimulation(ruleId: string, amount: number, inclusive: boolean) {
  return useQuery({
    queryKey: configurationKeys.simulation(ruleId, amount, inclusive),
    queryFn: () => configurationApi.simulate({ rule_id: ruleId, amount, inclusive }).then(unwrap),
    enabled: Boolean(ruleId) && amount > 0,
    placeholderData: (previous) => previous,
  })
}

export function useFiscalCalendar() {
  return useQuery({ queryKey: configurationKeys.fiscalCalendar(), queryFn: () => configurationApi.fiscalCalendar().then((r) => r.data.data) })
}

export function useNumbering() {
  return useQuery({ queryKey: configurationKeys.numbering(), queryFn: () => configurationApi.numbering().then((r) => r.data.data) })
}

export function useApprovalPolicies() {
  return useQuery({ queryKey: configurationKeys.approvals(), queryFn: () => configurationApi.approvals().then((r) => r.data.data) })
}

export function useRoles() {
  return useQuery({ queryKey: configurationKeys.roles(), queryFn: () => configurationApi.roles().then((r) => r.data.data) })
}

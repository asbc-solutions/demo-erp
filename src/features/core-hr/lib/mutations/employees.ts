"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import { employeesApi } from "../api/employees"
import { coreHrKeys } from "../constants/query-keys"
import type {
  CreateEmployeePayload,
  EmployeeExportJob,
  EmployeeExportPayload,
  UpdateEmployeePayload,
} from "../types"

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) =>
      employeesApi.create(payload).then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.employees.all }),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeePayload }) =>
      employeesApi.update(id, payload).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.employees.detail(id) })
      qc.invalidateQueries({ queryKey: coreHrKeys.employees.all })
    },
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: coreHrKeys.employees.all }),
  })
}

export function useReactivateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      employeesApi.reactivate(id).then((r) => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: coreHrKeys.employees.detail(id) })
      qc.invalidateQueries({ queryKey: coreHrKeys.employees.all })
    },
  })
}

export function useUploadPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      employeesApi.uploadPhoto(id, file).then((r) => r.data.data),
    onSuccess: (_, { id }) =>
      qc.invalidateQueries({ queryKey: coreHrKeys.employees.detail(id) }),
  })
}

export function useRemovePhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => employeesApi.removePhoto(id),
    onSuccess: (_, id) =>
      qc.invalidateQueries({ queryKey: coreHrKeys.employees.detail(id) }),
  })
}

export type EmployeeExportResult =
  | { kind: "blob"; blob: Blob; filename: string }
  /** Signed download URL from an async export job (valid 15 minutes). */
  | { kind: "url"; url: string; filename: string }

const EXPORT_POLL_INTERVAL_MS = 2_000
const EXPORT_POLL_MAX_ATTEMPTS = 90 // ~3 minutes

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function filenameFromDisposition(header: unknown): string | null {
  if (typeof header !== "string") return null
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)"?/i.exec(header)
  return match ? decodeURIComponent(match[1]) : null
}

async function pollExportJob(jobId: string): Promise<EmployeeExportJob> {
  for (let attempt = 0; attempt < EXPORT_POLL_MAX_ATTEMPTS; attempt++) {
    await delay(EXPORT_POLL_INTERVAL_MS)
    const job = await employeesApi
      .exportStatus(jobId)
      .then((r) => r.data.data)
    if (job.status === "completed") return job
    if (job.status === "failed") {
      throw new Error(job.error ?? "Export failed on the server.")
    }
  }
  throw new Error("Export timed out. Try again or narrow the scope.")
}

export function useExportEmployees() {
  return useMutation({
    mutationFn: async (
      payload: EmployeeExportPayload,
    ): Promise<EmployeeExportResult> => {
      const response = await employeesApi.export(payload)
      const fallbackName = `${payload.filename || "Employees_export"}.${payload.format}`

      // 202 = queued async job; the JSON envelope arrives as a Blob because
      // the request was made with responseType: "blob".
      if (response.status === 202) {
        const envelope = JSON.parse(
          await response.data.text(),
        ) as ApiResponse<EmployeeExportJob>
        const job = await pollExportJob(envelope.data.job_id)
        if (!job.download_url) {
          throw new Error("Export completed but no download URL was returned.")
        }
        return {
          kind: "url",
          url: job.download_url,
          filename: job.filename ?? fallbackName,
        }
      }

      return {
        kind: "blob",
        blob: response.data,
        filename:
          filenameFromDisposition(response.headers["content-disposition"]) ??
          fallbackName,
      }
    },
  })
}

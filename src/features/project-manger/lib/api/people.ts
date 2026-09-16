import { httpClient } from "@/src/shared/lib/apis/http-client"
import type { ApiResponse } from "@/src/shared/lib/types/api"
import type { PersonRef } from "../types"

export const peopleApi = {
  /** Resolve up to 100 employee ids → display objects (unknown ids omitted). */
  resolve: (ids: string[]) =>
    httpClient.post<ApiResponse<Record<string, PersonRef>>>(
      "/pm/people/resolve",
      { ids },
    ),
}

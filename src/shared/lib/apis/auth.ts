import { httpClient } from "./http-client"
import type { ApiResponse } from "../types/api"
import type {
  LoginPayload,
  RegisterPayload,
  AuthTokenResponse,
  AuthUser,
} from "@/src/features/core-hr/lib/types"
import type { MyPermissionsResponse } from "@/src/shared/lib/types/permissions"

export const authApi = {
  login: (payload: LoginPayload) =>
    httpClient.post<ApiResponse<AuthTokenResponse>>("/auth/login", payload),

  logout: () =>
    httpClient.post<ApiResponse<null>>("/auth/logout"),

  me: () =>
    httpClient.get<ApiResponse<AuthUser>>("/auth/me"),

  myPermissions: () =>
    httpClient.get<ApiResponse<MyPermissionsResponse>>("/permissions/me"),

  register: (payload: RegisterPayload) =>
    httpClient.post<ApiResponse<AuthTokenResponse>>("/auth/register", payload),
}

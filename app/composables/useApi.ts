import type { ApiResponse } from '~/types/api'
import { ApiError } from '~/types/api'

export const useApi = () => {
  const { $api } = useNuxtApp()
  async function request<T>(
    path: string,
    opts?: Parameters<typeof $api>[1]
  ): Promise<ApiResponse<T>> {
    return await $api<ApiResponse<T>>(path, opts)
  }

  return { request, ApiError }
}

import type { UseFetchOptions } from '#app'
import { defu } from 'defu'
import type { ApiResponse } from '~/types/api'

export function useCustomFetch<T>(
  url: string | (() => string),
  options: UseFetchOptions<ApiResponse<T>> = {}
) {
  const { $api } = useNuxtApp()

  const defaults: UseFetchOptions<ApiResponse<T>> = {
    $fetch: $api
  }

  const params = defu(options, defaults)

  return useFetch(url, params)
}

import type { UseFetchOptions } from '#app'
import { defu } from 'defu'
import type { ApiResponse } from '~/types/api'

export function useCustomFetch<T>(
  url: string | null | (() => string | null | undefined),
  options: UseFetchOptions<ApiResponse<T>> = {}
) {
  const { $api } = useNuxtApp()

  const defaults: UseFetchOptions<ApiResponse<T>> = {
    $fetch: $api
  }

  const params = defu(options, defaults)

  // @ts-expect-error Nuxt's useFetch supports null/undefined URLs reactively but typings can be strict
  return useFetch(url, params)
}

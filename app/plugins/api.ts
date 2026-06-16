import { ApiError, type ApiErrorResponse } from '~/types/api'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const token = useCookie('access_token')

  const clearSessionAndRedirect = async () => {
    token.value = null
    await navigateTo('/login')
  }

  const api = $fetch.create({
    baseURL: config.public.apiBase,

    onRequest({ options }) {
      const headers = (options.headers ||= new Headers())
      headers.set('Accept', 'application/json')
      headers.set('Content-Type', 'application/json')

      if (token.value) {
        headers.set('Authorization', `Bearer ${token.value}`)
      }
    },

    async onResponseError({ response }) {
      const data = response._data as ApiErrorResponse | undefined

      const error = new ApiError(
        data?.message ?? 'Terjadi kesalahan pada server.',
        response.status,
        data?.errors ?? {}
      )

      if (response.status === 401 && token.value) {
        await clearSessionAndRedirect()
      }

      throw error
    }
  })
  return {
    provide: { api }
  }
})

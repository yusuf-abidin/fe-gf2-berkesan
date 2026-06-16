import type { ApiError } from '~/types/api'
import { isApiError } from '~/types/api'

interface UseFormOptions {
  onError?: (err: ApiError) => void
}

export function useForm<T extends Record<string, unknown>>(
  initialState: T,
  options: UseFormOptions = {}
) {
  const toast = useToast()
  const form = reactive<T>({ ...initialState })
  const loading = ref(false)
  const fieldErrors = ref<Record<string, string[]>>({})
  const errorMessage = ref('')

  const clearErrors = () => {
    fieldErrors.value = {}
    errorMessage.value = ''
  }

  const handleSubmit = (fn: () => Promise<string | void>) => {
    return async () => {
      clearErrors()
      loading.value = true
      try {
        const message = await fn()
        if (message) {
          toast.add({
            title: 'Berhasil',
            description: message,
            color: 'success'
          })
        }
      } catch (err) {
        if (isApiError(err)) {
          errorMessage.value = err.message
          fieldErrors.value = err.errors

          toast.add({
            title: 'Gagal',
            description: err.message,
            color: 'error'
          })

          options.onError?.(err)
        } else {
          errorMessage.value = 'Terjadi kesalahan tak terduga.'
          toast.add({
            title: 'Kesalahan',
            description: errorMessage.value,
            color: 'error'
          })
        }
      } finally {
        loading.value = false
      }
    }
  }

  return {
    form,
    loading: readonly(loading),
    fieldErrors: readonly(fieldErrors),
    errorMessage: readonly(errorMessage),
    clearErrors,
    handleSubmit
  }
}

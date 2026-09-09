<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  middleware: 'guest',
  layout: 'minimal'
})

useSeoMeta({
  title: 'Reset Password — GF2 Berkesan',
  robots: 'noindex'
})

const route = useRoute()
const token = (route.query.token as string) || ''

const { request } = useApi()
const toast = useToast()

const verifyPending = ref(true)
const tokenError = ref('')
const userEmail = ref('')

const form = ref({
  password: '',
  password_confirmation: ''
})
const fieldErrors = ref<Record<string, string[]>>({})
const formLoading = ref(false)

const resetSchema = z.object({
  password: z.string().min(8, 'Password minimal harus 8 karakter.'),
  password_confirmation: z.string()
}).refine(data => data.password === data.password_confirmation, {
  message: 'Konfirmasi password tidak cocok.',
  path: ['password_confirmation']
})

// Verify token on mount
onMounted(async () => {
  if (!token) {
    tokenError.value = 'Tautan reset password tidak valid atau tidak lengkap.'
    verifyPending.value = false
    return
  }

  try {
    interface VerifyResponse {
      email: string
    }
    const res = await request<VerifyResponse>(`/reset-password/verify?token=${encodeURIComponent(token)}`, {
      method: 'GET'
    })
    userEmail.value = res.data.email
  } catch (e) {
    const err = e as { message?: string }
    tokenError.value = err.message || 'Tautan reset password tidak valid atau kedaluwarsa.'
  } finally {
    verifyPending.value = false
  }
})

const handleReset = async () => {
  fieldErrors.value = {}

  const validation = resetSchema.safeParse(form.value)
  if (!validation.success) {
    const formatted = validation.error.format()
    fieldErrors.value = {
      password: formatted.password?._errors || [],
      password_confirmation: formatted.password_confirmation?._errors || []
    }
    return
  }

  formLoading.value = true
  try {
    await request('/reset-password', {
      method: 'POST',
      body: {
        token,
        password: form.value.password,
        password_confirmation: form.value.password_confirmation
      }
    })
    toast.add({
      title: 'Berhasil',
      description: 'Password Anda berhasil diperbarui. Silakan masuk menggunakan password baru.',
      color: 'success'
    })
    await navigateTo('/login')
  } catch (e) {
    const err = e as { message?: string, errors?: Record<string, string[]> }
    if (err.errors) {
      fieldErrors.value = err.errors
    } else {
      toast.add({
        title: 'Error',
        description: err.message || 'Gagal meriset password.',
        color: 'error'
      })
    }
  } finally {
    formLoading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Loading Verification State -->
    <div
      v-if="verifyPending"
      class="text-center py-10 space-y-4"
    >
      <USkeleton class="size-12 rounded-full mx-auto" />
      <USkeleton class="h-4 w-1/2 mx-auto" />
      <p class="text-sm text-gray-500">
        Memverifikasi tautan reset password Anda...
      </p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="tokenError"
      class="text-center space-y-6"
    >
      <div class="size-16 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 rounded-full flex items-center justify-center mx-auto shadow-sm">
        <UIcon
          name="i-lucide-x-circle"
          class="size-10"
        />
      </div>

      <div class="space-y-2">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Tautan Tidak Valid
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {{ tokenError }}
        </p>
        <p class="text-xs text-gray-450 dark:text-neutral-500 leading-relaxed">
          Tautan reset password unik ini hanya dapat digunakan sekali dan kedaluwarsa setelah 20 menit dari waktu pembuatan. Silakan hubungi admin WhatsApp RT untuk meminta tautan reset yang baru.
        </p>
      </div>

      <div class="pt-4">
        <UButton
          to="/login"
          color="primary"
          size="md"
          block
        >
          Kembali ke Login
        </UButton>
      </div>
    </div>

    <!-- Reset Form State -->
    <div v-else>
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Reset Password
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Memperbarui password untuk akun <strong class="text-gray-800 dark:text-white">{{ userEmail }}</strong>.
        </p>
      </div>

      <UForm
        :state="form"
        class="space-y-4"
        @submit="handleReset"
      >
        <!-- New Password -->
        <UFormField
          label="Password Baru"
          name="password"
          :error="fieldErrors.password?.[0]"
          required
        >
          <UInput
            v-model="form.password"
            type="password"
            placeholder="Masukkan password baru"
            size="lg"
            class="w-full"
            :disabled="formLoading"
          />
        </UFormField>

        <!-- Password Confirmation -->
        <UFormField
          label="Konfirmasi Password Baru"
          name="password_confirmation"
          :error="fieldErrors.password_confirmation?.[0]"
          required
        >
          <UInput
            v-model="form.password_confirmation"
            type="password"
            placeholder="Ulangi password baru"
            size="lg"
            class="w-full"
            :disabled="formLoading"
          />
        </UFormField>

        <UButton
          type="submit"
          size="lg"
          block
          :loading="formLoading"
          color="primary"
        >
          Perbarui Password
        </UButton>

        <UButton
          to="/login"
          variant="ghost"
          color="neutral"
          size="sm"
          block
          class="mt-2"
          :disabled="formLoading"
        >
          Batal
        </UButton>
      </UForm>
    </div>
  </div>
</template>

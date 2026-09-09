<script setup lang="ts">
import { z } from 'zod'

definePageMeta({
  middleware: 'guest',
  layout: 'minimal'
})

useSeoMeta({
  title: 'Lupa Password — GF2 Berkesan',
  robots: 'noindex'
})

interface AppSettings {
  ketua_rt: string
  bendahara: string[]
  kontak_admin: string
}

// Fetch settings for WhatsApp admin contact
const { data: settingsResponse } = useCustomFetch<AppSettings>('/settings')

const email = ref('')
const emailError = ref('')
const isSubmitted = ref(false)

const emailSchema = z.string().email('Format email tidak valid.')

const handleForgotPassword = () => {
  emailError.value = ''

  const validation = emailSchema.safeParse(email.value)
  if (!validation.success) {
    emailError.value = validation.error.issues[0]?.message || 'Email tidak valid.'
    return
  }

  const rawPhone = settingsResponse.value?.data?.kontak_admin || '6289684586168'
  const cleanPhone = rawPhone.replace(/[^0-9]/g, '')
  const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone

  const message = `Halo Admin Keuangan RT, saya ingin mengajukan permohonan reset password untuk email: ${email.value.trim()}`
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`

  window.open(waUrl, '_blank')
  isSubmitted.value = true
}
</script>

<template>
  <div>
    <!-- Form State -->
    <div v-if="!isSubmitted">
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Lupa Password Anda?
        </h1>
        <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Masukkan email akun Anda. Sistem akan mengarahkan permohonan reset password ke WhatsApp Admin.
        </p>
      </div>

      <form
        class="space-y-4"
        @submit.prevent="handleForgotPassword"
      >
        <UFormField
          label="Email Akun"
          name="email"
          :error="emailError"
          required
        >
          <UInput
            v-model="email"
            type="email"
            placeholder="nama@email.com"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          size="lg"
          block
          color="success"
          icon="i-lucide-message-circle"
        >
          Kirim via WhatsApp
        </UButton>

        <UButton
          to="/login"
          variant="ghost"
          color="neutral"
          size="sm"
          block
          class="mt-2"
        >
          Kembali ke Login
        </UButton>
      </form>
    </div>

    <!-- Success Redirect State -->
    <div
      v-else
      class="text-center space-y-6"
    >
      <div class="size-16 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
        <UIcon
          name="i-lucide-check-circle"
          class="size-10"
        />
      </div>

      <div class="space-y-2">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">
          Permohonan Dialihkan
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Kami telah membuka chat WhatsApp ke Admin untuk email <strong class="text-gray-800 dark:text-white">{{ email }}</strong>.
        </p>
        <p class="text-xs text-gray-400 dark:text-neutral-500 leading-relaxed">
          Admin akan melakukan verifikasi data kependudukan secara manual dan mengirimkan tautan reset password baru yang berlaku selama 20 menit kepada Anda.
        </p>
      </div>

      <div class="pt-4 space-y-2">
        <UButton
          to="/login"
          color="primary"
          size="md"
          block
        >
          Kembali ke Halaman Login
        </UButton>

        <UButton
          variant="ghost"
          color="neutral"
          size="sm"
          block
          @click="isSubmitted = false"
        >
          Kirim Ulang Email Lain
        </UButton>
      </div>
    </div>
  </div>
</template>

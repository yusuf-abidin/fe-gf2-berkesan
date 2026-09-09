<script setup lang="ts">
import { type RegisterForm, registerSchema } from '~/utils/validator/auth.schema'

definePageMeta({
  middleware: 'guest',
  layout: 'minimal'
})

useSeoMeta({
  title: 'Daftar — GF2 Berkesan',
  robots: 'noindex'
})

const { form, loading, fieldErrors, errorMessage, handleSubmit } = useForm<RegisterForm>({
  name: '',
  email: '',
  password: '',
  confirm_password: '',
  registration_code: ''
})

const { register, login } = useAuth()

const onSubmit = handleSubmit(async () => {
  const registerResponse = await register(form)
  await login({
    email: form.email,
    password: form.password
  })

  setTimeout(async () => {
    await navigateTo('/')
  }, 1000)

  return registerResponse
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
        Buat akun baru
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Sudah punya akun?
        <NuxtLink
          to="/login"
          class="text-primary-500 hover:text-primary-600 font-medium"
        >
          Login
        </NuxtLink>
      </p>
    </div>

    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      :description="errorMessage"
      class="mb-4"
    />

    <UForm
      :schema="registerSchema"
      :state="form"
      class="space-y-4"
      @submit="onSubmit"
    >
      <UFormField
        label="Nama Lengkap"
        name="name"
        :error="fieldErrors.name?.[0]"
      >
        <UInput
          v-model="form.name"
          type="text"
          placeholder="Nama Lengkap"
          autocomplete="name"
          size="lg"
          class="w-full"
          :disabled="loading"
        />
      </UFormField>

      <UFormField
        label="Email"
        name="email"
        :error="fieldErrors.email?.[0]"
      >
        <UInput
          v-model="form.email"
          type="email"
          placeholder="nama@email.com"
          autocomplete="email"
          size="lg"
          class="w-full"
          :disabled="loading"
        />
      </UFormField>

      <!-- Password -->
      <UFormField
        label="Password"
        name="password"
        :error="fieldErrors.password?.[0]"
      >
        <UInput
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Masukkan password"
          autocomplete="current-password"
          size="lg"
          class="w-full"
          :disabled="loading"
          :ui="{ trailing: 'pe-1' }"
        >
          <template #trailing>
            <UButton
              type="button"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              color="neutral"
              variant="ghost"
              size="sm"
              class="pointer-events-auto cursor-pointer"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              @click.stop.prevent="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UFormField
        label="Konfirmasi Password"
        name="confirm_password"
        :error="fieldErrors.confirm_password?.[0]"
      >
        <UInput
          v-model="form.confirm_password"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="Masukkan konfirmasi password"
          autocomplete="none"
          size="lg"
          class="w-full"
          :disabled="loading"
          :ui="{ trailing: 'pe-1' }"
        >
          <template #trailing>
            <UButton
              type="button"
              :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              color="neutral"
              variant="ghost"
              size="sm"
              class="pointer-events-auto cursor-pointer"
              :aria-label="showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              @click.stop.prevent="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UFormField
        label="Kode Registrasi"
        name="registration_code"
        :error="fieldErrors.registration_code?.[0]"
      >
        <UInput
          v-model="form.registration_code"
          type="text"
          placeholder="REG-029"
          autocomplete="none"
          size="lg"
          class="w-full"
          :disabled="loading"
        />
      </UFormField>

      <UButton
        type="submit"
        size="lg"
        block
        :loading="loading"
        :disabled="loading"
      >
        Daftar
      </UButton>
    </UForm>
  </div>
</template>

<style scoped>

</style>

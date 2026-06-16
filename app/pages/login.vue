<script setup lang="ts">
import { type LoginForm, loginSchema } from '~/utils/validator/auth.schema'

definePageMeta({
  middleware: 'guest',
  layout: 'minimal'
})

useSeoMeta({
  title: 'Masuk — GF2 Berkesan',
  robots: 'noindex'
})

const { form, loading, fieldErrors, errorMessage, handleSubmit } = useForm<LoginForm>(
  { email: '', password: '' }
)
const { login } = useAuth()
const onSubmit = handleSubmit(async () => {
  const message = await login(form)
  setTimeout(async () => {
    await navigateTo('/')
  }, 1000)

  return message
})
const showPassword = ref(false)
</script>

<template>
  <div>
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">
        Masuk ke akun Anda
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Belum punya akun?
        <NuxtLink
          to="/register"
          class="text-primary-500 hover:text-primary-600 font-medium"
        >
          Daftar sekarang
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
      :schema="loginSchema"
      :state="form"
      class="space-y-4"
      @submit="onSubmit"
    >
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
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              color="neutral"
              variant="ghost"
              size="sm"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UButton
        type="submit"
        size="lg"
        block
        :loading="loading"
        :disabled="loading"
      >
        Masuk
      </UButton>
    </UForm>
  </div>
</template>

<style scoped>

</style>

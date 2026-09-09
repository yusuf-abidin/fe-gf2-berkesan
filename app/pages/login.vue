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
const { login, user } = useAuth()
const onSubmit = handleSubmit(async () => {
  const message = await login(form)

  if (user.value?.role === 'ADMIN') {
    await navigateTo('/admin')
  } else {
    await navigateTo('/user/accounts')
  }

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
      <div class="w-full">
        <div class="flex items-center justify-between text-sm font-medium mb-1.5">
          <span>Password</span>
          <NuxtLink
            to="/forgot-password"
            class="text-xs text-primary-500 hover:text-primary-600 font-medium"
          >
            Lupa password?
          </NuxtLink>
        </div>
        <UFormField
          name="password"
          :error="fieldErrors.password?.[0]"
          class="w-full"
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
      </div>

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

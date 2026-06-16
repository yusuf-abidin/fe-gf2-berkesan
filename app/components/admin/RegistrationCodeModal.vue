<script setup lang="ts">
import { registrationCodeSchema, type RegistrationCodeForm } from '~/utils/validator/registration-code.schema'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'refresh'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const { request } = useApi()
const { form, loading, fieldErrors, handleSubmit } = useForm<RegistrationCodeForm>({
  code: '',
  expires_at: 1440,
  usage_limit: null
})

const isUnlimited = ref(true)

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    form.code = ''
    form.expires_at = 1440
    form.usage_limit = null
    isUnlimited.value = true
  }
})

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.code = result
}

const expirationOptions = [
  { label: '1 Jam', value: 60 },
  { label: '6 Jam', value: 360 },
  { label: '1 Hari', value: 1440 },
  { label: '7 Hari', value: 10080 },
  { label: '30 Hari', value: 43200 }
]

const onSubmit = handleSubmit(async () => {
  const payload = { ...form }
  if (isUnlimited.value) {
    payload.usage_limit = null
  }

  const response = await request('/registration-codes', {
    method: 'POST',
    body: payload
  })

  emit('refresh')
  isOpen.value = false
  return response.message
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Tambah Kode Registrasi"
    description="Buat kode baru untuk pendaftaran warga."
  >
    <template #body>
      <UForm
        :schema="registrationCodeSchema"
        :state="form"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Kode Registrasi"
          name="code"
          :error="fieldErrors.code?.[0]"
          required
        >
          <div class="flex gap-2 w-full">
            <UInput
              v-model="form.code"
              placeholder="Contoh: WARGA-2024"
              class="flex-1"
              :disabled="loading"
            />
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="subtle"
              title="Generate Random"
              @click="generateRandomCode"
            />
          </div>
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Masa Aktif"
            name="expires_at"
            :error="fieldErrors.expires_at?.[0]"
            required
          >
            <USelect
              v-model="form.expires_at"
              :items="expirationOptions"
              value-key="value"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField
            label="Batas Penggunaan"
            name="usage_limit"
            :error="fieldErrors.usage_limit?.[0]"
          >
            <div class="space-y-2">
              <UCheckbox
                v-model="isUnlimited"
                label="Tanpa Batas"
              />
              <UInputNumber
                v-if="!isUnlimited"
                v-model="form.usage_limit"
                :min="1"
                placeholder="Jumlah"
                class="w-full"
                :disabled="loading"
              />
            </div>
          </UFormField>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <UButton
            label="Batal"
            color="neutral"
            variant="ghost"
            @click="isOpen = false"
          />
          <UButton
            type="submit"
            label="Simpan Kode"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

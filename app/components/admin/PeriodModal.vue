<script setup lang="ts">
import { periodSchema, type PeriodForm } from '~/utils/validator/period.schema'

const props = defineProps<{
  modelValue: boolean
  accountId: number
}>()

const emit = defineEmits(['update:modelValue', 'refresh'])

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const { request } = useApi()
const currentYear = new Date().getFullYear()
const { form, loading, fieldErrors, handleSubmit } = useForm<PeriodForm>({
  month: new Date().getMonth() + 1,
  year: currentYear,
  start_balance: 0
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    form.month = new Date().getMonth() + 1
    form.year = currentYear
    form.start_balance = 0
  }
})

const monthOptions = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 }
]

const yearOptions = computed(() => {
  const years = []
  for (let y = currentYear - 5; y <= currentYear + 5; y++) {
    years.push({ label: String(y), value: y })
  }
  return years
})

const onSubmit = handleSubmit(async () => {
  const response = await request(`/accounts/${props.accountId}/periods`, {
    method: 'POST',
    body: form
  })

  emit('refresh')
  isOpen.value = false
  return response.message
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Buat Periode Laporan"
    description="Tentukan bulan dan tahun untuk memulai pengerjaan pembukuan."
  >
    <template #body>
      <UForm
        :schema="periodSchema"
        :state="form"
        class="space-y-4"
        @submit="onSubmit"
      >
        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Bulan"
            name="month"
            :error="fieldErrors.month?.[0]"
            required
          >
            <USelect
              v-model="form.month"
              :items="monthOptions"
              value-key="value"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField
            label="Tahun"
            name="year"
            :error="fieldErrors.year?.[0]"
            required
          >
            <USelect
              v-model="form.year"
              :items="yearOptions"
              value-key="value"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <UFormField
          label="Saldo Awal (Rupiah)"
          name="start_balance"
          :error="fieldErrors.start_balance?.[0]"
        >
          <UInputNumber
            v-model="form.start_balance"
            placeholder="Saldo awal (contoh: 1000000)"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <div class="flex justify-end gap-3 mt-6">
          <UButton
            label="Batal"
            color="neutral"
            variant="ghost"
            @click="isOpen = false"
          />
          <UButton
            type="submit"
            label="Mulai Periode"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

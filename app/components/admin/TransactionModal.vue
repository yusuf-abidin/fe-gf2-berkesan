<script setup lang="ts">
import { transactionSchema, type TransactionForm } from '~/utils/validator/transaction.schema'
import type { Category } from '~/types/category'
import type { Transaction } from '~/types/transaction'

const props = defineProps<{
  modelValue: boolean
  periodId: number
  accountId: number
  categories: Category[]
  transaction?: Transaction | null
}>()

const emit = defineEmits(['update:modelValue', 'refresh'])

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const { request } = useApi()
const isEdit = computed(() => !!props.transaction)

const { form, loading, fieldErrors, handleSubmit } = useForm<TransactionForm>({
  period_id: props.periodId,
  category_id: null,
  contribution_period_id: null,
  type: 'IN',
  name: '',
  day: null,
  quantity: null,
  amount: 0,
  description: ''
})

const contributionPeriods = ref<{ id: number, name: string, amount_per_resident: number }[]>([])
const loadingContribution = ref(false)

const loadContributionPeriods = async () => {
  try {
    const res = await request<{ id: number, name: string, amount_per_resident: number }[]>('/contribution-periods')
    contributionPeriods.value = res.data || []
  } catch {
    // handled
  }
}

watch(() => props.modelValue, async (newVal) => {
  if (newVal) {
    await loadContributionPeriods()

    if (props.transaction) {
      form.period_id = props.transaction.period_id
      form.category_id = props.transaction.category_id
      form.contribution_period_id = props.transaction.contribution_period_id
      form.type = props.transaction.type
      form.name = props.transaction.name
      form.day = props.transaction.day
      form.quantity = props.transaction.quantity
      form.amount = Number(props.transaction.amount)
      form.description = props.transaction.description ?? ''
    } else {
      form.period_id = props.periodId
      form.category_id = null
      form.contribution_period_id = null
      form.type = 'IN'
      form.name = ''
      form.day = new Date().getDate()
      form.quantity = null
      form.amount = 0
      form.description = ''
    }
  }
})

// Auto-fill and lock properties when linking contribution periods
watch(() => form.contribution_period_id, async (newVal) => {
  if (newVal) {
    form.type = 'IN'
    loadingContribution.value = true
    try {
      const res = await request<{
        summary: {
          total_paid_amount: number
          total_paid_residents: number
          total_unpaid_residents: number
        }
      }>(`/contribution-periods/${newVal}/payments`)
      if (res.success && res.data?.summary) {
        form.amount = res.data.summary.total_paid_amount
        const found = contributionPeriods.value.find(p => p.id === newVal)
        if (found && !props.transaction) {
          form.name = `Penerimaan ${found.name}`
        }
      }
    } catch {
      // handled
    } finally {
      loadingContribution.value = false
    }
  }
})

const contributionOptions = computed(() => {
  return [
    { label: 'Tidak Ditautkan', value: 'none' },
    ...contributionPeriods.value.map(p => ({ label: p.name, value: String(p.id) }))
  ]
})

const selectedContribution = computed({
  get: () => form.contribution_period_id ? String(form.contribution_period_id) : 'none',
  set: (val) => {
    form.contribution_period_id = val === 'none' ? null : Number(val)
  }
})

const categoryOptions = computed(() => {
  return [
    { label: 'Tanpa Kategori', value: 'none' },
    ...props.categories.map(c => ({ label: c.name, value: String(c.id) }))
  ]
})

const selectedCategory = computed({
  get: () => form.category_id ? String(form.category_id) : 'none',
  set: (val) => {
    form.category_id = val === 'none' ? null : Number(val)
  }
})

const typeOptions = [
  { label: 'Pemasukan (IN)', value: 'IN' },
  { label: 'Pengeluaran (OUT)', value: 'OUT' }
]

const onSubmit = handleSubmit(async () => {
  const url = isEdit.value && props.transaction ? `/transactions/${props.transaction.id}` : '/transactions'
  const method = isEdit.value ? 'PATCH' : 'POST'

  const payload = {
    ...form,
    category_id: form.category_id || null,
    contribution_period_id: form.contribution_period_id || null,
    day: form.day || null,
    quantity: form.quantity || null,
    description: form.description || null
  }

  const response = await request(url, {
    method,
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
    :title="isEdit ? 'Ubah Transaksi' : 'Tambah Transaksi'"
    :description="isEdit ? 'Perbarui pencatatan transaksi kas.' : 'Catat pemasukan atau pengeluaran kas baru.'"
  >
    <template #body>
      <UForm
        :schema="transactionSchema"
        :state="form"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Tautkan Iuran Warga"
          name="contribution_period_id"
        >
          <USelect
            v-model="selectedContribution"
            :items="contributionOptions"
            value-key="value"
            class="w-full"
            :disabled="loading || isEdit"
          />
          <p
            v-if="form.contribution_period_id"
            class="text-[11px] text-indigo-500 mt-1"
          >
            Iuran tertaut: Tipe terkunci ke Pemasukan dan nominal tersinkron otomatis.
          </p>
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Tanggal (Hari)"
            name="day"
            :error="fieldErrors.day?.[0]"
          >
            <UInputNumber
              v-model="form.day"
              :min="1"
              :max="31"
              placeholder="Contoh: 15"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField
            label="Tipe Transaksi"
            name="type"
            :error="fieldErrors.type?.[0]"
            required
          >
            <USelect
              v-model="form.type"
              :items="typeOptions"
              value-key="value"
              class="w-full"
              :disabled="loading || !!form.contribution_period_id"
            />
          </UFormField>
        </div>

        <UFormField
          label="Nama Transaksi"
          name="name"
          :error="fieldErrors.name?.[0]"
          required
        >
          <UInput
            v-model="form.name"
            placeholder="Contoh: Pembayaran Listrik RT / Kas Masuk"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Kategori"
            name="category_id"
            :error="fieldErrors.category_id?.[0]"
          >
            <USelect
              v-model="selectedCategory"
              :items="categoryOptions"
              value-key="value"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField
            label="Nominal (Rupiah)"
            name="amount"
            :error="fieldErrors.amount?.[0]"
            required
          >
            <UInputNumber
              v-model="form.amount"
              :min="0"
              placeholder="Jumlah"
              class="w-full"
              :disabled="loading || !!form.contribution_period_id"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField
            label="Kuantitas / Jumlah (Opsional)"
            name="quantity"
            :error="fieldErrors.quantity?.[0]"
          >
            <UInputNumber
              v-model="form.quantity"
              :min="1"
              placeholder="Contoh: 2"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>
        </div>

        <UFormField
          label="Deskripsi / Keterangan"
          name="description"
          :error="fieldErrors.description?.[0]"
        >
          <UTextarea
            v-model="form.description"
            placeholder="Tambahkan catatan jika diperlukan..."
            class="w-full"
            :rows="3"
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
            :label="isEdit ? 'Simpan Perubahan' : 'Catat Transaksi'"
            :loading="loading || loadingContribution"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

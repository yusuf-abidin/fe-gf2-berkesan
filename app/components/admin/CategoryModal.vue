<script setup lang="ts">
import { categorySchema, type CategoryForm } from '~/utils/validator/category.schema'
import type { Category } from '~/types/category'

const props = defineProps<{
  modelValue: boolean
  accountId: number
  initialData?: Category | null
}>()

const emit = defineEmits(['update:modelValue', 'refresh'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.initialData)

const { request } = useApi()
const { form, loading, fieldErrors, handleSubmit } = useForm<CategoryForm>({
  account_id: props.accountId,
  name: '',
  type: 'IN'
})

const typeOptions = [
  { label: 'Pemasukan (IN)', value: 'IN' },
  { label: 'Pengeluaran (OUT)', value: 'OUT' }
]

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    if (props.initialData) {
      form.account_id = props.initialData.account_id
      form.name = props.initialData.name
      form.type = props.initialData.type
    } else {
      form.account_id = props.accountId
      form.name = ''
      form.type = 'IN'
    }
  }
})

const onSubmit = handleSubmit(async () => {
  let response
  if (isEdit.value && props.initialData) {
    response = await request(`/categories/${props.initialData.id}`, {
      method: 'PATCH',
      body: form
    })
  } else {
    response = await request('/categories', {
      method: 'POST',
      body: form
    })
  }

  emit('refresh')
  isOpen.value = false
  return response.message
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="isEdit ? 'Edit Kategori' : 'Tambah Kategori'"
    :description="isEdit ? 'Ubah informasi kategori buku kerja ini.' : 'Buat kategori baru untuk buku kerja ini.'"
  >
    <template #body>
      <UForm
        :schema="categorySchema"
        :state="form"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Nama Kategori"
          name="name"
          :error="fieldErrors.name?.[0]"
          required
        >
          <UInput
            v-model="form.name"
            placeholder="Contoh: Iuran Warga"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField
          label="Tipe Kategori"
          name="type"
          :error="fieldErrors.type?.[0]"
          required
        >
          <USelect
            v-model="form.type"
            :items="typeOptions"
            value-key="value"
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
            :label="isEdit ? 'Simpan Perubahan' : 'Tambah Kategori'"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

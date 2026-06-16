<script setup lang="ts">
import { accountSchema, type AccountForm } from '~/utils/validator/account.schema'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'refresh'])

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const { request } = useApi()
const { form, loading, fieldErrors, handleSubmit } = useForm<AccountForm>({
  name: '',
  slug: '',
  description: ''
})

const isSlugModified = ref(false)

// Auto-generate slug from name
watch(() => form.name, (newVal) => {
  if (!isSlugModified.value) {
    form.slug = newVal
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
})

// Sanitize manual slug input
watch(() => form.slug, (newVal) => {
  if (newVal) {
    form.slug = newVal
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
  }
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    form.name = ''
    form.slug = ''
    form.description = ''
    isSlugModified.value = false
  }
})

const onSlugInput = () => {
  isSlugModified.value = true
}

const onSubmit = handleSubmit(async () => {
  const response = await request('/accounts', {
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
    title="Tambah Buku Kerja"
    description="Buat buku kerja baru untuk mengelola kategori dan transaksi."
  >
    <template #body>
      <UForm
        :schema="accountSchema"
        :state="form"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Nama Buku Kerja"
          name="name"
          :error="fieldErrors.name?.[0]"
          required
        >
          <UInput
            v-model="form.name"
            placeholder="Contoh: Kas RT 2024"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField
          label="Slug (URL)"
          name="slug"
          :error="fieldErrors.slug?.[0]"
          required
          help="Slug digunakan untuk identifikasi unik di URL."
        >
          <UInput
            v-model="form.slug"
            placeholder="kas-rt-2024"
            class="w-full"
            :disabled="loading"
            @input="onSlugInput"
          />
        </UFormField>

        <UFormField
          label="Deskripsi"
          name="description"
          :error="fieldErrors.description?.[0]"
        >
          <UTextarea
            v-model="form.description"
            placeholder="Keterangan singkat tentang buku kerja ini"
            class="w-full"
            :disabled="loading"
            :rows="3"
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
            label="Simpan Buku"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Coordinator } from '~/types/coordinator'
import { coordinatorSchema, type CoordinatorForm } from '~/utils/validator/coordinator.schema'

const props = defineProps<{
  modelValue: boolean
  coordinator?: Coordinator | null
}>()

const emit = defineEmits(['update:modelValue', 'refresh'])

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const { request } = useApi()
const { form, loading, fieldErrors, handleSubmit } = useForm<CoordinatorForm>({
  name: '',
  managed_blocks: ''
})

const isEdit = computed(() => !!props.coordinator)

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    form.name = props.coordinator?.name ?? ''
    form.managed_blocks = props.coordinator?.managed_blocks ?? ''
  }
})

const onSubmit = handleSubmit(async () => {
  const url = isEdit.value ? `/coordinators/${props.coordinator!.id}` : '/coordinators'
  const method = isEdit.value ? 'PATCH' : 'POST'

  const response = await request(url, {
    method,
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
    :title="isEdit ? 'Ubah Koordinator' : 'Tambah Koordinator'"
    :description="isEdit ? 'Perbarui data koordinator.' : 'Buat koordinator baru untuk pengelompokan warga.'"
  >
    <template #body>
      <UForm
        :schema="coordinatorSchema"
        :state="form"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Nama Koordinator"
          name="name"
          :error="fieldErrors.name?.[0]"
          required
        >
          <UInput
            v-model="form.name"
            placeholder="Contoh: Budi Santoso"
            class="w-full"
            :disabled="loading"
          />
        </UFormField>

        <UFormField
          label="Blok Yang Dikelola"
          name="managed_blocks"
          :error="fieldErrors.managed_blocks?.[0]"
          required
        >
          <UInput
            v-model="form.managed_blocks"
            placeholder="Contoh: A, B, C atau A1-A10"
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
            :label="isEdit ? 'Simpan Perubahan' : 'Tambah Koordinator'"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

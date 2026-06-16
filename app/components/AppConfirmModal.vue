<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  color?: 'error' | 'success' | 'neutral'
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Konfirmasi',
  description: 'Apakah Anda yakin ingin melakukan tindakan ini?',
  confirmLabel: 'Ya, Lanjutkan',
  cancelLabel: 'Batal',
  color: 'error',
  loading: false
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const onConfirm = () => {
  emit('confirm')
}

const onCancel = () => {
  isOpen.value = false
  emit('cancel')
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description"
  >
    <template #body>
      <div class="flex justify-end gap-3">
        <UButton
          :label="cancelLabel"
          color="neutral"
          variant="ghost"
          @click="onCancel"
        />
        <UButton
          :label="confirmLabel"
          :color="color"
          :loading="loading"
          @click="onConfirm"
        />
      </div>
    </template>
  </UModal>
</template>

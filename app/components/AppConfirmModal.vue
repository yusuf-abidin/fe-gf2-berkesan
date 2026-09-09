<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  color?: 'error' | 'success' | 'neutral'
  loading?: boolean
  requireConfirmText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Konfirmasi',
  description: 'Apakah Anda yakin ingin melakukan tindakan ini?',
  confirmLabel: 'Ya, Lanjutkan',
  cancelLabel: 'Batal',
  color: 'error',
  loading: false,
  requireConfirmText: ''
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const isOpen = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const confirmTextInput = ref('')

// Reset input when opening/closing
watch(isOpen, (newVal) => {
  if (!newVal) {
    confirmTextInput.value = ''
  }
})

const isConfirmDisabled = computed(() => {
  if (!props.requireConfirmText) return false
  return confirmTextInput.value !== props.requireConfirmText
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
      <div class="space-y-4">
        <!-- Text Confirmation Input -->
        <div
          v-if="requireConfirmText"
          class="space-y-2"
        >
          <p class="text-sm text-gray-600 dark:text-neutral-400">
            Untuk melanjutkan, ketik <strong class="text-red-650 dark:text-red-400 select-all font-mono">{{ requireConfirmText }}</strong> di bawah ini:
          </p>
          <UInput
            v-model="confirmTextInput"
            :placeholder="requireConfirmText"
            class="w-full font-medium"
            :disabled="loading"
            autocomplete="off"
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
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
            :disabled="isConfirmDisabled"
            @click="onConfirm"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>

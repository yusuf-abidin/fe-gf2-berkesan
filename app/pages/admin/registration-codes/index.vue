<script setup lang="ts">
import type { RegistrationCode } from '~/types/registration-code'
import RegistrationCodeModal from '~/components/admin/RegistrationCodeModal.vue'
import AppConfirmModal from '~/components/AppConfirmModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

useSeoMeta({
  title: 'Kode Registrasi - GF2 Berkesan'
})

const { data: response, refresh, pending } = useCustomFetch<RegistrationCode[]>('/registration-codes')

const isModalOpen = ref(false)
const isConfirmOpen = ref(false)
const selectedCard = ref<RegistrationCode | null>(null)
const isDeleting = ref(false)

const openCreateModal = () => {
  selectedCard.value = null
  isModalOpen.value = true
}

const confirmDelete = (code: RegistrationCode) => {
  selectedCard.value = code
  isConfirmOpen.value = true
}

const columns = [
  { accessorKey: 'code', header: 'Kode' },
  { accessorKey: 'usage_limit', header: 'Batas' },
  { accessorKey: 'current_usage', header: 'Digunakan' },
  { accessorKey: 'expires_at', header: 'Kedaluwarsa' },
  { id: 'actions', header: '' }
]

const { request } = useApi()
const toast = useToast()

const deleteCode = async () => {
  if (!selectedCard.value) return

  isDeleting.value = true
  try {
    const res = await request(`/registration-codes/${selectedCard.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Berhasil', description: res.message, color: 'success' })
    isConfirmOpen.value = false
    await refresh()
  } catch (err) {
    // Error handled by useApi/toast
  } finally {
    isDeleting.value = false
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Kode Registrasi
        </h1>
        <p class="text-gray-500 dark:text-neutral-400 mt-1">
          Kelola kode untuk pendaftaran warga baru.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="Tambah Kode"
        color="primary"
        @click="openCreateModal"
      />
    </div>

    <UCard :ui="{ body: 'p-0' }">
      <div
        v-if="pending && !response?.data"
        class="divide-y divide-gray-200 dark:divide-neutral-800"
      >
        <div
          v-for="i in 5"
          :key="i"
          class="p-4 flex gap-4"
        >
          <USkeleton class="h-4 w-[20%]" />
          <USkeleton class="h-4 w-[20%]" />
          <USkeleton class="h-4 w-[20%]" />
          <USkeleton class="h-4 w-[30%]" />
          <USkeleton class="h-4 w-[10%]" />
        </div>
      </div>

      <UTable
        v-else
        :data="response?.data || []"
        :columns="columns"
        :loading="pending"
        class="w-full"
      >
        <template #usage_limit-cell="{ row }">
          <span v-if="row.original.usage_limit">{{ row.original.usage_limit }}x</span>
          <UBadge
            v-else
            color="neutral"
            variant="subtle"
            size="sm"
          >
            Unlimited
          </UBadge>
        </template>

        <template #current_usage-cell="{ row }">
          {{ row.original.current_usage }} kali
        </template>

        <template #expires_at-cell="{ row }">
          {{ formatDate(row.original.expires_at) }}
        </template>

        <template #actions-cell="{ row }">
          <div class="flex justify-end px-4 gap-1">
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="sm"
              @click="confirmDelete(row.original)"
            />
          </div>
        </template>

        <template #empty>
          <div class="text-center py-10">
            <UIcon
              name="i-lucide-key"
              class="size-10 text-gray-300 mx-auto mb-3"
            />
            <p class="text-gray-500">
              Belum ada data kode registrasi.
            </p>
          </div>
        </template>
      </UTable>
    </UCard>

    <RegistrationCodeModal
      v-model="isModalOpen"
      @refresh="refresh"
    />

    <AppConfirmModal
      v-model="isConfirmOpen"
      title="Hapus Kode Registrasi"
      :description="`Apakah Anda yakin ingin menghapus kode '${selectedCard?.code}'? Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Hapus Kode"
      :loading="isDeleting"
      @confirm="deleteCode"
    />
  </div>
</template>

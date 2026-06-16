<script setup lang="ts">
import type { Account } from '~/types/account'
import AccountModal from '~/components/admin/AccountModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

useSeoMeta({
  title: 'Buku Kerja - GF2 Berkesan',
})

const { data: response, refresh, pending } = useCustomFetch<Account[]>('/accounts')

const isModalOpen = ref(false)

const openCreateModal = () => {
  isModalOpen.value = true
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Buku Kerja
        </h1>
        <p class="text-gray-500 dark:text-neutral-400 mt-1">
          Kelola buku kas, tabungan, atau dana kegiatan warga.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="Buku Baru"
        color="primary"
        @click="openCreateModal"
      />
    </div>

    <!-- Loading State -->
    <div v-if="pending && !response?.data" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard v-for="i in 3" :key="i" class="h-40">
        <div class="space-y-3">
          <USkeleton class="h-6 w-3/4" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-5/6" />
          <div class="pt-4 flex justify-end">
            <USkeleton class="h-9 w-24" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-else-if="!response?.data || response.data.length === 0" class="text-center py-20 bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-gray-300 dark:border-neutral-800">
      <UIcon
        name="i-lucide-book-dashed"
        class="size-16 text-gray-300 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Belum ada Buku Kerja
      </h3>
      <p class="text-gray-500 dark:text-neutral-400 mt-1 mb-6">
        Mulai dengan membuat buku kerja pertama Anda untuk mencatat transaksi.
      </p>
      <UButton
        label="Buat Buku Kerja Sekarang"
        variant="subtle"
        icon="i-lucide-plus"
        @click="openCreateModal"
      />
    </div>

    <!-- Data Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="account in response.data"
        :key="account.id"
        class="flex flex-col h-full hover:ring-2 hover:ring-primary-500 transition-all duration-200"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="size-10 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center">
                <UIcon name="i-lucide-book" class="size-6" />
              </div>
              <h3 class="font-bold text-gray-900 dark:text-white line-clamp-1">
                {{ account.name }}
              </h3>
            </div>
          </div>
        </template>

        <p class="text-gray-500 dark:text-neutral-400 text-sm line-clamp-2 mb-4 flex-1">
          {{ account.description || 'Tidak ada deskripsi.' }}
        </p>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              :to="`/admin/accounts/${account.id}`"
              label="Buka Buku"
              color="neutral"
              variant="subtle"
              trailing-icon="i-lucide-arrow-right"
              size="sm"
            />
          </div>
        </template>
      </UCard>
    </div>

    <AccountModal
      v-model="isModalOpen"
      @refresh="() => refresh()"
    />
  </div>
</template>

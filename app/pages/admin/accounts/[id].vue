<script setup lang="ts">
import type { Account } from '~/types/account'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

const route = useRoute()
const accountId = route.params.id

const { data: response, pending } = useCustomFetch<Account>(`/accounts/${accountId}`)

const items = [
  {
    slot: 'transactions',
    label: 'Transaksi',
    icon: 'i-lucide-list-ordered'
  },
  {
    slot: 'categories',
    label: 'Kategori',
    icon: 'i-lucide-tags'
  },
  {
    slot: 'settings',
    label: 'Pengaturan',
    icon: 'i-lucide-settings'
  }
]
</script>

<template>
  <div>
    <div class="mb-6">
      <UButton
        to="/admin/accounts"
        icon="i-lucide-arrow-left"
        label="Kembali ke Daftar"
        variant="ghost"
        color="neutral"
        size="sm"
        class="-ml-2 mb-2"
      />

      <div class="flex items-center justify-between">
        <div v-if="pending && !response?.data">
          <USkeleton class="h-8 w-64 mb-2" />
          <USkeleton class="h-4 w-96" />
        </div>
        <div v-else>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ response?.data?.name }}
          </h1>
          <p class="text-gray-500 dark:text-neutral-400 mt-1">
            {{ response?.data?.description || 'Buku kerja pengelolaan keuangan.' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Tabs Content -->
    <UTabs :items="items" class="w-full">
      <template #transactions>
        <div class="py-4">
          <UCard>
            <div class="text-center py-10">
              <p class="text-gray-500">
                Fitur Transaksi akan segera hadir.
              </p>
            </div>
          </UCard>
        </div>
      </template>

      <template #categories>
        <div class="py-4">
          <UCard>
            <div class="text-center py-10">
              <p class="text-gray-500">
                Fitur Manajemen Kategori akan segera hadir.
              </p>
            </div>
          </UCard>
        </div>
      </template>

      <template #settings>
        <div class="py-4">
          <UCard>
            <div class="text-center py-10">
              <p class="text-gray-500">
                Fitur Pengaturan akan segera hadir.
              </p>
            </div>
          </UCard>
        </div>
      </template>
    </UTabs>
  </div>
</template>

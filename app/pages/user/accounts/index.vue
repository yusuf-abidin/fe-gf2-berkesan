<script setup lang="ts">
import type { Account } from '~/types/account'

definePageMeta({
  layout: 'user',
  middleware: ['auth']
})

useSeoMeta({
  title: 'Laporan Keuangan Warga - GF2 Berkesan'
})

const { data: response, pending } = useCustomFetch<Account[]>('/accounts')
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Laporan Keuangan Warga
      </h1>
      <p class="text-gray-500 dark:text-neutral-400 mt-1">
        Pilih buku kerja di bawah ini untuk memantau catatan keuangan RT secara transparan.
      </p>
    </div>

    <!-- Loading State -->
    <div
      v-if="pending && !response?.data"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <UCard
        v-for="i in 3"
        :key="i"
        class="h-40"
      >
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
    <div
      v-else-if="!response?.data || response.data.length === 0"
      class="text-center py-20 bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-gray-300 dark:border-neutral-800"
    >
      <UIcon
        name="i-lucide-book-dashed"
        class="size-16 text-gray-300 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Belum ada Laporan Keuangan
      </h3>
      <p class="text-gray-500 dark:text-neutral-400 mt-1">
        Pengurus RT belum membuat buku kerja keuangan apa pun.
      </p>
    </div>

    <!-- Data Grid -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <UCard
        v-for="account in response.data"
        :key="account.id"
        class="flex flex-col h-full hover:ring-2 hover:ring-primary-500 transition-all duration-200"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="size-10 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center">
                <UIcon
                  name="i-lucide-book-open"
                  class="size-6"
                />
              </div>
              <h3 class="font-bold text-gray-900 dark:text-white whitespace-normal break-words">
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
              :to="`/user/accounts/${account.id}`"
              label="Buka Laporan"
              color="primary"
              variant="subtle"
              trailing-icon="i-lucide-arrow-right"
              size="sm"
            />
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>

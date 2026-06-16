<script setup lang="ts">
import type { UserResponse } from '~/types/auth'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

const { data: response, refresh, pending } = useCustomFetch<UserResponse[]>('/users')

const q = ref('')

const filteredRows = computed(() => {
  if (!response.value?.data) return []

  if (!q.value) {
    return response.value.data
  }

  return response.value.data.filter((user) => {
    return Object.values(user).some((value) => {
      return String(value).toLowerCase().includes(q.value.toLowerCase())
    })
  })
})

const columns = [
  { accessorKey: 'name', header: 'Nama' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'created_at', header: 'Terdaftar Pada' }
]

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
          Manajemen Pengguna
        </h1>
        <p class="text-gray-500 dark:text-neutral-400 mt-1">
          Daftar semua pengguna yang terdaftar di sistem.
        </p>
      </div>
    </div>

    <UCard :ui="{ body: 'p-0' }">
      <template #header>
        <div class="flex items-center justify-between gap-3 px-4 py-3">
          <UInput
            v-model="q"
            icon="i-lucide-search"
            placeholder="Cari pengguna..."
            class="max-w-xs"
            size="sm"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="pending"
            @click="() => refresh()"
          />
        </div>
      </template>

      <div v-if="pending && !response?.data" class="divide-y divide-gray-200 dark:divide-neutral-800">
        <div v-for="i in 5" :key="i" class="p-4 flex gap-4">
          <USkeleton class="h-4 w-[25%]" />
          <USkeleton class="h-4 w-[35%]" />
          <USkeleton class="h-4 w-[15%]" />
          <USkeleton class="h-4 w-[25%]" />
        </div>
      </div>

      <UTable
        v-else
        :data="filteredRows"
        :columns="columns"
        :loading="pending"
        class="w-full"
      >
        <template #role-cell="{ row }">
          <UBadge
            :color="row.original.role === 'ADMIN' ? 'primary' : 'neutral'"
            variant="subtle"
            size="sm"
          >
            {{ row.original.role }}
          </UBadge>
        </template>

        <template #created_at-cell="{ row }">
          {{ formatDate(row.original.created_at) }}
        </template>

        <template #empty>
          <div class="text-center py-10">
            <UIcon
              name="i-lucide-users"
              class="size-10 text-gray-300 mx-auto mb-3"
            />
            <p class="text-gray-500">
              Tidak ada data pengguna yang ditemukan.
            </p>
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>

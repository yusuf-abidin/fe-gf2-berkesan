<script setup lang="ts">
import type { Account } from '~/types/account'
import type { Category } from '~/types/category'
import CategoryModal from '~/components/admin/CategoryModal.vue'
import AppConfirmModal from '~/components/AppConfirmModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

const route = useRoute()
const accountId = Number(route.params.id)

// Fetch Account Detail
const { data: accountResponse, pending: accountPending } = useCustomFetch<Account>(`/accounts/${accountId}`)

// Categories Management
const { data: categoryResponse, refresh: refreshCategories, pending: categoryPending } = useCustomFetch<Category[]>(`/accounts/${accountId}/categories`)

const isCategoryModalOpen = ref(false)
const selectedCategory = ref<Category | null>(null)
const isConfirmDeleteOpen = ref(false)
const isDeleting = ref(false)

const { request } = useApi()
const toast = useToast()

const openAddCategory = () => {
  selectedCategory.value = null
  isCategoryModalOpen.value = true
}

const openEditCategory = (category: Category) => {
  selectedCategory.value = category
  isCategoryModalOpen.value = true
}

const confirmDeleteCategory = (category: Category) => {
  selectedCategory.value = category
  isConfirmDeleteOpen.value = true
}

const deleteCategory = async () => {
  if (!selectedCategory.value) return
  isDeleting.value = true
  try {
    const res = await request(`/categories/${selectedCategory.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Berhasil', description: res.message, color: 'success' })
    isConfirmDeleteOpen.value = false
    refreshCategories()
  } finally {
    isDeleting.value = false
  }
}

const categoryColumns = [
  { accessorKey: 'name', header: 'Nama Kategori' },
  { accessorKey: 'type', header: 'Tipe' },
  { id: 'actions', header: '' }
]

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
    <!-- Header with Back Button & Title -->
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
        <div v-if="accountPending && !accountResponse?.data">
          <USkeleton class="h-8 w-64 mb-2" />
          <USkeleton class="h-4 w-96" />
        </div>
        <div v-else>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ accountResponse?.data?.name }}
          </h1>
          <p class="text-gray-500 dark:text-neutral-400 mt-1">
            {{ accountResponse?.data?.description || 'Buku kerja pengelolaan keuangan.' }}
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
              <p class="text-gray-500">Fitur Transaksi akan segera hadir.</p>
            </div>
          </UCard>
        </div>
      </template>

      <template #categories>
        <div class="py-4 space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Daftar Kategori</h3>
            <UButton 
              icon="i-lucide-plus" 
              label="Tambah Kategori" 
              size="sm" 
              @click="openAddCategory" 
            />
          </div>

          <UCard :ui="{ body: 'p-0' }">
            <div v-if="categoryPending && !categoryResponse?.data" class="p-4 space-y-3">
              <USkeleton v-for="i in 3" :key="i" class="h-10 w-full" />
            </div>
            <UTable
              v-else
              :data="categoryResponse?.data || []"
              :columns="categoryColumns"
              :loading="categoryPending"
              class="w-full"
            >
              <template #type-cell="{ row }">
                <UBadge
                  :color="row.original.type === 'IN' ? 'success' : 'error'"
                  variant="subtle"
                  size="sm"
                >
                  {{ row.original.type === 'IN' ? 'Pemasukan' : 'Pengeluaran' }}
                </UBadge>
              </template>

              <template #actions-cell="{ row }">
                <div class="flex justify-end px-4 gap-1">
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    @click="openEditCategory(row.original)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    @click="confirmDeleteCategory(row.original)"
                  />
                </div>
              </template>

              <template #empty>
                <div class="text-center py-10">
                  <UIcon name="i-lucide-tags" class="size-10 text-gray-300 mx-auto mb-3" />
                  <p class="text-gray-500">Belum ada kategori untuk buku kerja ini.</p>
                </div>
              </template>
            </UTable>
          </UCard>
        </div>
      </template>

      <template #settings>
        <div class="py-4">
          <UCard>
            <div class="text-center py-10">
              <p class="text-gray-500">Fitur Pengaturan akan segera hadir.</p>
            </div>
          </UCard>
        </div>
      </template>
    </UTabs>

    <!-- Modals -->
    <CategoryModal
      v-model="isCategoryModalOpen"
      :account-id="accountId"
      :initial-data="selectedCategory"
      @refresh="() => refreshCategories()"
    />

    <AppConfirmModal
      v-model="isConfirmDeleteOpen"
      title="Hapus Kategori"
      :description="`Apakah Anda yakin ingin menghapus kategori '${selectedCategory?.name}'? Transaksi yang menggunakan kategori ini mungkin akan terpengaruh.`"
      confirm-label="Hapus Kategori"
      :loading="isDeleting"
      @confirm="deleteCategory"
    />
  </div>
</template>

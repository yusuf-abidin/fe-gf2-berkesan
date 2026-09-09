<script setup lang="ts">
import { contributionTypeSchema, type ContributionTypeForm } from '~/utils/validator/contribution.schema'
import type { ContributionType } from '~/types/contribution'
import AppConfirmModal from '~/components/AppConfirmModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

useSeoMeta({
  title: 'Iuran Warga - GF2 Berkesan'
})

const { request } = useApi()
const toast = useToast()

// Fetch Contribution Types
const { data: typesResponse, pending, refresh } = useCustomFetch<ContributionType[]>('/contribution-types')

// Form Setup
const isModalOpen = ref(false)
const selectedType = ref<ContributionType | null>(null)
const isEdit = computed(() => !!selectedType.value)

const { form, loading, fieldErrors, handleSubmit } = useForm<ContributionTypeForm>({
  name: '',
  description: ''
})

watch(isModalOpen, (isOpen) => {
  if (isOpen) {
    if (selectedType.value) {
      form.name = selectedType.value.name
      form.description = selectedType.value.description || ''
    } else {
      form.name = ''
      form.description = ''
    }
  }
})

const openAddModal = () => {
  selectedType.value = null
  isModalOpen.value = true
}

const openEditModal = (type: ContributionType) => {
  selectedType.value = type
  isModalOpen.value = true
}

const onSubmit = handleSubmit(async () => {
  const url = isEdit.value ? `/contribution-types/${selectedType.value!.id}` : '/contribution-types'
  const method = isEdit.value ? 'PATCH' : 'POST'

  const res = await request(url, {
    method,
    body: form
  })

  toast.add({ title: 'Berhasil', description: res.message, color: 'success' })
  isModalOpen.value = false
  refresh()
})

// Delete Setup
const isDeleteOpen = ref(false)
const isDeleting = ref(false)

const confirmDelete = (type: ContributionType) => {
  selectedType.value = type
  isDeleteOpen.value = true
}

const handleDelete = async () => {
  if (!selectedType.value) return
  isDeleting.value = true
  try {
    const res = await request(`/contribution-types/${selectedType.value.id}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Berhasil', description: res.message, color: 'success' })
    isDeleteOpen.value = false
    refresh()
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Error', description: err.message || 'Gagal menghapus jenis iuran', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Iuran Warga
        </h1>
        <p class="text-gray-500 dark:text-neutral-400 mt-1">
          Kelola kategori/jenis iuran bulanan atau rutin warga.
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        label="Tambah Jenis Iuran"
        color="primary"
        @click="openAddModal"
      />
    </div>

    <!-- Skeleton Loading -->
    <div
      v-if="pending && !typesResponse?.data"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <UCard
        v-for="i in 3"
        :key="i"
        class="h-44 flex flex-col justify-between"
      >
        <div class="space-y-3">
          <USkeleton class="h-6 w-1/2" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-5/6" />
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <USkeleton class="h-8 w-20" />
          <USkeleton class="h-8 w-12" />
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!typesResponse?.data || typesResponse.data.length === 0"
      class="text-center py-20 bg-white dark:bg-neutral-900 border border-dashed border-gray-250 dark:border-neutral-800 rounded-xl"
    >
      <UIcon
        name="i-lucide-receipt"
        class="size-16 text-gray-300 mx-auto mb-4"
      />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Belum Ada Jenis Iuran
      </h3>
      <p class="text-gray-500 max-w-sm mx-auto mb-6 text-sm">
        Buat jenis iuran baru (seperti Iuran Warga Bulanan, Keamanan, dsb.) untuk memulai pencatatan iuran.
      </p>
      <UButton
        icon="i-lucide-plus"
        label="Buat Jenis Iuran Pertama"
        @click="openAddModal"
      />
    </div>

    <!-- Card List -->
    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <UCard
        v-for="item in typesResponse.data"
        :key="item.id"
        class="flex flex-col justify-between hover:shadow-md transition-shadow border border-gray-200 dark:border-neutral-800"
      >
        <div class="space-y-2 flex-1">
          <h3 class="font-bold text-gray-900 dark:text-white text-base">
            {{ item.name }}
          </h3>
          <p class="text-gray-500 dark:text-neutral-450 line-clamp-3 text-sm">
            {{ item.description || 'Tidak ada deskripsi.' }}
          </p>
        </div>

        <div class="flex justify-between items-center mt-6 pt-4 border-t border-gray-100 dark:border-neutral-800">
          <UButton
            :to="`/admin/contributions/${item.id}`"
            label="Kelola Periode & Warga"
            variant="solid"
            color="primary"
            size="sm"
            icon="i-lucide-settings"
          />

          <div class="flex gap-1">
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="sm"
              title="Ubah"
              @click="openEditModal(item)"
            />
            <UButton
              icon="i-lucide-trash"
              color="error"
              variant="ghost"
              size="sm"
              title="Hapus"
              @click="confirmDelete(item)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Add/Edit Modal -->
    <UModal
      v-model:open="isModalOpen"
      :title="isEdit ? 'Ubah Jenis Iuran' : 'Tambah Jenis Iuran'"
      :description="isEdit ? 'Perbarui informasi iuran warga.' : 'Buat kategori iuran rutin warga baru.'"
    >
      <template #body>
        <UForm
          :schema="contributionTypeSchema"
          :state="form"
          class="space-y-4"
          @submit="onSubmit"
        >
          <UFormField
            label="Nama Iuran"
            name="name"
            :error="fieldErrors.name?.[0]"
            required
          >
            <UInput
              v-model="form.name"
              placeholder="Contoh: Iuran Warga Bulanan"
              class="w-full"
              :disabled="loading"
            />
          </UFormField>

          <UFormField
            label="Deskripsi / Keterangan"
            name="description"
            :error="fieldErrors.description?.[0]"
          >
            <UTextarea
              v-model="form.description"
              placeholder="Jelaskan peruntukan atau ketentuan iuran ini..."
              class="w-full"
              :rows="3"
              :disabled="loading"
            />
          </UFormField>

          <div class="flex justify-end gap-3 mt-6">
            <UButton
              label="Batal"
              color="neutral"
              variant="ghost"
              @click="isModalOpen = false"
            />
            <UButton
              type="submit"
              :label="isEdit ? 'Simpan Perubahan' : 'Tambah Iuran'"
              :loading="loading"
            />
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Delete Confirm Modal -->
    <AppConfirmModal
      v-model="isDeleteOpen"
      title="Hapus Jenis Iuran"
      :description="`Apakah Anda yakin ingin menghapus iuran '${selectedType?.name}'? Menghapus ini akan menghapus seluruh data periode pembayaran dan transaksi yang terkait secara permanen.`"
      confirm-label="Hapus Iuran"
      :loading="isDeleting"
      require-confirm-text="HAPUS"
      @confirm="handleDelete"
    />
  </div>
</template>

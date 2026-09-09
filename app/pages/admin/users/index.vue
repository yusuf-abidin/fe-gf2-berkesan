<script setup lang="ts">
import type { UserResponse } from '~/types/auth'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

useSeoMeta({
  title: 'Manajemen Pengguna - GF2 Berkesan'
})

const { data: response, refresh, pending } = useCustomFetch<UserResponse[]>('/users')
const { user: currentUser } = useAuth()
const { request } = useApi()
const toast = useToast()

const q = ref('')
const updatingUserId = ref<number | null>(null)

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

const changeRole = async (userId: number, nextRole: 'ADMIN' | 'USER') => {
  updatingUserId.value = userId
  try {
    await request(`/users/${userId}/role`, {
      method: 'PATCH',
      body: { role: nextRole }
    })
    toast.add({
      title: 'Berhasil',
      description: `Peran pengguna berhasil diubah menjadi ${nextRole}.`,
      color: 'success'
    })
    await refresh()
  } catch (e) {
    const err = e as { message?: string }
    toast.add({
      title: 'Error',
      description: err.message || 'Gagal mengubah peran pengguna',
      color: 'error'
    })
  } finally {
    updatingUserId.value = null
  }
}

const generatingResetUserId = ref<number | null>(null)
const resetModalOpen = ref(false)
const selectedUserForReset = ref<UserResponse | null>(null)
const generatedResetUrl = ref('')
const generatedResetExpiry = ref('')

interface ResetTokenResponse {
  reset_url: string
  expires_at: string
  expires_in_minutes: number
}

const generateResetLink = async (user: UserResponse) => {
  generatingResetUserId.value = user.id
  selectedUserForReset.value = user
  try {
    const res = await request<ResetTokenResponse>(`/users/${user.id}/generate-reset-token`, {
      method: 'POST'
    })
    generatedResetUrl.value = res.data.reset_url
    generatedResetExpiry.value = res.data.expires_at
    resetModalOpen.value = true
  } catch (e) {
    const err = e as { message?: string }
    toast.add({
      title: 'Error',
      description: err.message || 'Gagal menghasilkan tautan reset password',
      color: 'error'
    })
  } finally {
    generatingResetUserId.value = null
  }
}

const resetMessageTemplate = computed(() => {
  if (!generatedResetUrl.value || !selectedUserForReset.value) return ''
  const expiryText = formatDate(generatedResetExpiry.value)
  return `Halo ${selectedUserForReset.value.name},\n\nBerikut adalah tautan untuk melakukan reset password akun Anda di portal warga GF2 Berkesan:\n\n${generatedResetUrl.value}\n\nTautan ini hanya dapat digunakan 1 kali dan valid sampai tanggal ${expiryText}. Jangan sebarkan tautan ini kepada orang lain.`
})

const copyOnlyLink = () => {
  if (generatedResetUrl.value) {
    navigator.clipboard.writeText(generatedResetUrl.value)
    toast.add({
      title: 'Tautan Disalin',
      description: 'Tautan reset password berhasil disalin ke clipboard.',
      color: 'success'
    })
  }
}

const copyTemplateMessage = () => {
  if (resetMessageTemplate.value) {
    navigator.clipboard.writeText(resetMessageTemplate.value)
    toast.add({
      title: 'Pesan Disalin',
      description: 'Template pesan reset password berhasil disalin ke clipboard.',
      color: 'success'
    })
  }
}

const columns = [
  { accessorKey: 'name', header: 'Nama' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'role', header: 'Role' },
  { accessorKey: 'created_at', header: 'Terdaftar Pada' },
  { id: 'actions', header: '' }
]

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
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

      <!-- Skeleton loader -->
      <div
        v-if="pending && !response?.data"
        class="divide-y divide-gray-200 dark:divide-neutral-800"
      >
        <div
          v-for="i in 5"
          :key="i"
          class="p-4 flex gap-4"
        >
          <USkeleton class="h-4 w-[25%]" />
          <USkeleton class="h-4 w-[35%]" />
          <USkeleton class="h-4 w-[15%]" />
          <USkeleton class="h-4 w-[15%]" />
          <USkeleton class="h-4 w-[10%]" />
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

        <!-- Actions cell -->
        <template #actions-cell="{ row }">
          <div class="flex justify-end px-4 gap-1">
            <!-- Show placeholder for own account -->
            <span
              v-if="row.original.id === currentUser?.id"
              class="text-xs text-gray-400 dark:text-neutral-500 italic px-3 py-1"
            >
              Akun Anda
            </span>
            <template v-else>
              <div class="flex gap-2">
                <UButton
                  v-if="row.original.role === 'USER'"
                  label="Jadikan Admin"
                  color="primary"
                  variant="subtle"
                  size="xs"
                  icon="i-lucide-shield-alert"
                  :loading="updatingUserId === row.original.id"
                  @click="changeRole(row.original.id, 'ADMIN')"
                />
                <UButton
                  v-else
                  label="Jadikan Warga"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  icon="i-lucide-user"
                  :loading="updatingUserId === row.original.id"
                  @click="changeRole(row.original.id, 'USER')"
                />
                <UButton
                  label="Reset Password"
                  color="warning"
                  variant="subtle"
                  size="xs"
                  icon="i-lucide-key-round"
                  :loading="generatingResetUserId === row.original.id"
                  @click="generateResetLink(row.original)"
                />
              </div>
            </template>
          </div>
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
    <UModal
      v-model:open="resetModalOpen"
      title="Reset Password Pengguna"
      description="Salin tautan reset password atau template pesan di bawah ini untuk dibagikan ke WhatsApp warga."
    >
      <template #body>
        <div class="space-y-4">
          <p class="text-sm text-gray-500">
            Tautan reset password unik sekali pakai telah dibuat untuk <strong>{{ selectedUserForReset?.name }}</strong> ({{ selectedUserForReset?.email }}).
          </p>

          <div class="space-y-2">
            <span class="text-xs font-semibold text-gray-500">Tautan Mentah (Raw Link):</span>
            <div class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl">
              <UInput
                v-model="generatedResetUrl"
                readonly
                class="flex-1 font-mono text-xs"
              />
              <UButton
                icon="i-lucide-copy"
                label="Salin Tautan"
                color="neutral"
                variant="subtle"
                size="sm"
                @click="copyOnlyLink"
              />
            </div>
          </div>

          <div class="space-y-2">
            <span class="text-xs font-semibold text-gray-500">Template Pesan WhatsApp:</span>
            <div class="space-y-2 p-3 bg-gray-50 dark:bg-neutral-900 border border-gray-150 dark:border-neutral-800 rounded-xl relative">
              <div class="text-xs text-gray-700 dark:text-neutral-300 whitespace-pre-wrap break-all leading-relaxed">
                {{ resetMessageTemplate }}
              </div>
              <div class="flex justify-end pt-2 border-t border-gray-200 dark:border-neutral-800">
                <UButton
                  icon="i-lucide-copy"
                  label="Salin Template Pesan"
                  color="primary"
                  size="sm"
                  @click="copyTemplateMessage"
                />
              </div>
            </div>
          </div>

          <p class="text-xs text-amber-500 font-semibold flex items-center gap-1.5">
            <UIcon
              name="i-lucide-clock"
              class="size-4"
            />
            Masa aktif tautan: 20 menit (sampai {{ formatDate(generatedResetExpiry) }}).
          </p>
        </div>
      </template>
    </UModal>
  </div>
</template>

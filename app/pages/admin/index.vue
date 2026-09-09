<script setup lang="ts">
import type { Account } from '~/types/account'
import type { Resident } from '~/types/resident'
import type { UserResponse } from '~/types/auth'
import type { RegistrationCode } from '~/types/registration-code'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

useSeoMeta({
  title: 'Dashboard Admin - GF2 Berkesan'
})

const { user: currentUser } = useAuth()

// Fetch all counts in parallel
const { data: accountsResponse, pending: pendingAccounts } = useCustomFetch<Account[]>('/accounts')
const { data: residentsResponse, pending: pendingResidents } = useCustomFetch<Resident[]>('/residents')
const { data: usersResponse, pending: pendingUsers } = useCustomFetch<UserResponse[]>('/users')
const { data: regCodesResponse, pending: pendingRegCodes } = useCustomFetch<RegistrationCode[]>('/registration-codes')

const isLoading = computed(() => {
  return pendingAccounts.value || pendingResidents.value || pendingUsers.value || pendingRegCodes.value
})

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const quickActions = [
  {
    label: 'Buku Kerja',
    description: 'Kelola buku kas, tabungan, dan dana kegiatan sosial warga.',
    icon: 'i-lucide-book-open',
    to: '/admin/accounts',
    color: 'bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400'
  },
  {
    label: 'Data Warga',
    description: 'Kelola data kependudukan, RT/RW, dan koordinator blok.',
    icon: 'i-lucide-map-pinned',
    to: '/admin/residents',
    color: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
  },
  {
    label: 'Iuran Warga',
    description: 'Pantau pembayaran bulanan, tagihan wajib, dan warga lunas.',
    icon: 'i-lucide-receipt',
    to: '/admin/contributions',
    color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
  },
  {
    label: 'Kode Registrasi',
    description: 'Buat token pendaftaran mandiri agar warga dapat register akun.',
    icon: 'i-lucide-key',
    to: '/admin/registration-codes',
    color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400'
  },
  {
    label: 'Manajemen Pengguna',
    description: 'Atur hak akses admin, kelola akun login, dan promosi peran.',
    icon: 'i-lucide-users',
    to: '/admin/users',
    color: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400'
  }
]
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-neutral-900 dark:to-neutral-900/60 p-6 sm:p-8 rounded-3xl border border-primary-500/10 dark:border-neutral-800 shadow-md text-white">
      <div class="space-y-1">
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Selamat Datang Kembali, {{ currentUser?.name || 'Admin' }}!
        </h1>
        <p class="text-primary-100 dark:text-neutral-400 text-sm font-medium">
          Kelola transparansi keuangan warga RT 01 RW 021 Perumahan Griya Family 2 secara real-time.
        </p>
      </div>
      <div class="flex items-center gap-2 bg-white/10 dark:bg-neutral-800/50 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/10 dark:border-neutral-700/30 text-xs sm:text-sm font-semibold shrink-0">
        <UIcon
          name="i-lucide-calendar"
          class="size-4"
        />
        <span>{{ formattedDate }}</span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Buku Kerja Stats -->
      <UCard
        v-if="isLoading"
        class="h-28"
      >
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-8 w-2/3" />
        </div>
      </UCard>
      <UCard
        v-else
        class="border border-gray-100 dark:border-neutral-900 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
              Buku Kerja Kas
            </p>
            <h3 class="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {{ accountsResponse?.data?.length || 0 }}
            </h3>
          </div>
          <div class="p-3.5 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 rounded-2xl">
            <UIcon
              name="i-lucide-book"
              class="size-6"
            />
          </div>
        </div>
      </UCard>

      <!-- Residents Stats -->
      <UCard
        v-if="isLoading"
        class="h-28"
      >
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-8 w-2/3" />
        </div>
      </UCard>
      <UCard
        v-else
        class="border border-gray-100 dark:border-neutral-900 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
              Total Warga
            </p>
            <h3 class="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {{ residentsResponse?.data?.length || 0 }}
            </h3>
          </div>
          <div class="p-3.5 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 rounded-2xl">
            <UIcon
              name="i-lucide-map-pin"
              class="size-6"
            />
          </div>
        </div>
      </UCard>

      <!-- Users Stats -->
      <UCard
        v-if="isLoading"
        class="h-28"
      >
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-8 w-2/3" />
        </div>
      </UCard>
      <UCard
        v-else
        class="border border-gray-100 dark:border-neutral-900 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
              Akun Terdaftar
            </p>
            <h3 class="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {{ usersResponse?.data?.length || 0 }}
            </h3>
          </div>
          <div class="p-3.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 rounded-2xl">
            <UIcon
              name="i-lucide-users-round"
              class="size-6"
            />
          </div>
        </div>
      </UCard>

      <!-- Registration Codes Stats -->
      <UCard
        v-if="isLoading"
        class="h-28"
      >
        <div class="space-y-3">
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-8 w-2/3" />
        </div>
      </UCard>
      <UCard
        v-else
        class="border border-gray-100 dark:border-neutral-900 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
              Token Pendaftaran
            </p>
            <h3 class="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {{ regCodesResponse?.data?.length || 0 }}
            </h3>
          </div>
          <div class="p-3.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl">
            <UIcon
              name="i-lucide-key-round"
              class="size-6"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Quick Action Links -->
    <div class="space-y-4">
      <h2 class="text-lg font-bold text-gray-900 dark:text-white">
        Akses Cepat Pengelolaan
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="action in quickActions"
          :key="action.label"
          class="group flex flex-col justify-between hover:ring-2 hover:ring-primary-500 transition-all duration-200"
        >
          <div class="space-y-4">
            <div
              :class="action.color"
              class="size-11 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200"
            >
              <UIcon
                :name="action.icon"
                class="size-6"
              />
            </div>
            <div class="space-y-1">
              <h3 class="font-bold text-gray-900 dark:text-white text-base">
                {{ action.label }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                {{ action.description }}
              </p>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end pt-2">
              <UButton
                :to="action.to"
                label="Kelola Menu"
                variant="subtle"
                color="neutral"
                size="sm"
                trailing-icon="i-lucide-arrow-right"
              />
            </div>
          </template>
        </UCard>
      </div>
    </div>

    <!-- Buku Kerja Summary -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">
          Daftar Buku Kerja Kas
        </h2>
        <UButton
          to="/admin/accounts"
          label="Lihat Semua"
          variant="link"
          color="primary"
          size="sm"
          trailing-icon="i-lucide-arrow-right"
        />
      </div>

      <div
        v-if="isLoading"
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <UCard
          v-for="i in 2"
          :key="i"
          class="h-32"
        >
          <div class="space-y-3">
            <USkeleton class="h-5 w-1/2" />
            <USkeleton class="h-4 w-3/4" />
          </div>
        </UCard>
      </div>

      <div
        v-else-if="!accountsResponse?.data || accountsResponse.data.length === 0"
        class="text-center py-10 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-gray-200 dark:border-neutral-800"
      >
        <UIcon
          name="i-lucide-book-dashed"
          class="size-10 text-gray-300 mx-auto mb-3"
        />
        <p class="text-gray-500 text-sm">
          Belum ada Buku Kerja Kas terdaftar.
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <UCard
          v-for="account in accountsResponse.data"
          :key="account.id"
          class="hover:ring-1 hover:ring-gray-200 dark:hover:ring-neutral-800 transition-all duration-200"
        >
          <template #header>
            <div class="flex items-center gap-3">
              <div class="size-9 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center">
                <UIcon
                  name="i-lucide-book-open"
                  class="size-5"
                />
              </div>
              <h4 class="font-bold text-gray-900 dark:text-white">
                {{ account.name }}
              </h4>
            </div>
          </template>

          <p class="text-xs text-gray-500 dark:text-neutral-400 line-clamp-2">
            {{ account.description || 'Tidak ada deskripsi.' }}
          </p>

          <template #footer>
            <div class="flex justify-end">
              <UButton
                :to="`/admin/accounts/${account.id}`"
                label="Buka Buku Kerja"
                color="primary"
                variant="subtle"
                size="sm"
                trailing-icon="i-lucide-arrow-right"
              />
            </div>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>

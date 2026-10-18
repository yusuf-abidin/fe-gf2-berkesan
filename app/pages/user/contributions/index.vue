<script setup lang="ts">
import type { ContributionType, ContributionPeriod, UnpaidResident } from '~/types/contribution'

definePageMeta({
  layout: 'user',
  middleware: ['auth']
})

useSeoMeta({
  title: 'Status Iuran Warga - GF2 Berkesan'
})

// 1. Fetch Public Contribution Types
// `await` membuat SSR menunggu data, jadi HTML server = state client saat hydration
const { data: typesResponse, pending: typesPending } = await useCustomFetch<ContributionType[]>(
  '/public-contributions/types'
)

// Pilihan eksplisit dari user (undefined = pakai default otomatis)
const userTypeId = ref<string | undefined>(undefined)

const typeList = computed(() => typesResponse.value?.data || [])

// Nilai efektif: pilihan user jika masih valid, jika tidak pakai item pertama.
// Computed (bukan watcher) => deterministik di server maupun client.
const selectedTypeId = computed<string | undefined>({
  get() {
    const types = typeList.value
    if (types.length === 0) return undefined
    if (userTypeId.value && types.some(t => String(t.id) === userTypeId.value)) {
      return userTypeId.value
    }
    return String(types[0]?.id)
  },
  set(val) {
    userTypeId.value = val
  }
})

const typeOptions = computed(() =>
  typeList.value.map(t => ({
    label: t.name,
    value: String(t.id)
  }))
)

// 2. Fetch Periods for Selected Contribution Type
const { data: periodsResponse, pending: periodsPending } = await useCustomFetch<ContributionPeriod[]>(
  () => selectedTypeId.value ? `/public-contributions/types/${selectedTypeId.value}/periods` : null,
  { watch: [selectedTypeId] }
)

const userPeriodId = ref<string | undefined>(undefined)

const periodList = computed(() => periodsResponse.value?.data || [])

const selectedPeriodId = computed<string | undefined>({
  get() {
    const periods = periodList.value
    if (periods.length === 0) return undefined
    if (userPeriodId.value && periods.some(p => String(p.id) === userPeriodId.value)) {
      return userPeriodId.value
    }
    return String(periods[0]?.id)
  },
  set(val) {
    userPeriodId.value = val
  }
})

const getMonthName = (monthNum: number) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return months[monthNum - 1] || ''
}

const periodOptions = computed(() =>
  periodList.value.map(p => ({
    label: `${getMonthName(p.month)} ${p.year}`,
    value: String(p.id)
  }))
)

// 3. Fetch Unpaid Residents for Selected Period
const { data: unpaidResponse, pending: unpaidPending } = await useCustomFetch<UnpaidResident[]>(
  () => selectedPeriodId.value ? `/public-contributions/periods/${selectedPeriodId.value}/unpaid` : null,
  { watch: [selectedPeriodId] }
)

// 4. Filters & Search State
const searchQuery = ref('')
const selectedBlock = ref<string>('ALL')

// Reset filter blok & pencarian saat jenis iuran / periode berganti
watch([selectedTypeId, selectedPeriodId], () => {
  selectedBlock.value = 'ALL'
  searchQuery.value = ''
})

// Extract available blocks from unpaid list
const blockOptions = computed(() => {
  const list = unpaidResponse.value?.data || []
  const blocks = [...new Set(list.map(r => r.block).filter(Boolean))] as string[]
  blocks.sort()
  return [
    { label: 'Semua Blok', value: 'ALL' },
    ...blocks.map(b => ({ label: `Blok ${b}`, value: b }))
  ]
})

interface DisplayUnpaidResident extends UnpaidResident {
  displayIndex: number
}

// Filtered and Alphabetically Sorted List (A-Z)
const filteredResidents = computed<DisplayUnpaidResident[]>(() => {
  const list = unpaidResponse.value?.data || []
  const q = searchQuery.value.trim().toLowerCase()
  const block = selectedBlock.value

  const filtered = list.filter((resident) => {
    if (block !== 'ALL' && resident.block !== block) {
      return false
    }

    if (q) {
      const nameMatch = resident.name?.toLowerCase().includes(q)
      const blockMatch = resident.block?.toLowerCase().includes(q)
      const houseMatch = resident.house_number?.toLowerCase().includes(q)
      const addressCombined = `${resident.block || ''} ${resident.house_number || ''}`.toLowerCase()
      const combinedMatch = addressCombined.includes(q)
      return Boolean(nameMatch || blockMatch || houseMatch || combinedMatch)
    }

    return true
  })

  // Urutkan A-Z berdasarkan nama (copy dulu agar tidak mutasi array asli)
  const sorted = [...filtered].sort((a, b) =>
    a.name.localeCompare(b.name, 'id', { sensitivity: 'base' })
  )

  return sorted.map((item, idx) => ({
    ...item,
    displayIndex: idx + 1
  }))
})

const tableColumns = [
  { accessorKey: 'displayIndex', header: 'No' },
  { accessorKey: 'name', header: 'Nama Warga' },
  { accessorKey: 'address', header: 'Alamat' },
  { accessorKey: 'status', header: 'Status' }
]

// Key agar UTable dirender ulang bersih saat konteks data berubah
const tableKey = computed(() => `${selectedTypeId.value}-${selectedPeriodId.value}`)
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Transparansi Iuran Warga
      </h1>
      <p class="text-gray-500 dark:text-neutral-400 mt-1">
        Daftar warga yang belum melakukan pembayaran iuran pada periode terpilih.
      </p>
    </div>

    <!-- Filters Section -->
    <UCard :ui="{ body: 'p-4' }">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Jenis Iuran Dropdown -->
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-gray-500 dark:text-neutral-400">
            Jenis Iuran
          </label>
          <USelect
            v-model="selectedTypeId"
            :items="typeOptions"
            value-key="value"
            placeholder="Pilih Jenis Iuran"
            class="w-full"
            size="sm"
            :disabled="typesPending || typeOptions.length === 0"
          />
        </div>

        <!-- 2. Periode Dropdown -->
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-gray-500 dark:text-neutral-400">
            Periode
          </label>
          <USelect
            v-model="selectedPeriodId"
            :items="periodOptions"
            value-key="value"
            placeholder="Pilih Periode"
            class="w-full"
            size="sm"
            :disabled="periodsPending || periodOptions.length === 0"
          />
        </div>

        <!-- 3. Filter Blok Dropdown -->
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-gray-500 dark:text-neutral-400">
            Filter Blok
          </label>
          <USelect
            v-model="selectedBlock"
            :items="blockOptions"
            value-key="value"
            class="w-full"
            size="sm"
            :disabled="unpaidPending || !selectedPeriodId"
          />
        </div>

        <!-- 4. Input Pencarian Warga / Alamat -->
        <div class="space-y-1.5">
          <label class="block text-xs font-medium text-gray-500 dark:text-neutral-400">
            Pencarian
          </label>
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Cari nama atau alamat..."
            class="w-full"
            size="sm"
            :disabled="unpaidPending || !selectedPeriodId"
          />
        </div>
      </div>
    </UCard>

    <!-- State 1: No Public Contribution Types -->
    <div
      v-if="!typesPending && typeOptions.length === 0"
      class="text-center py-20 bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-gray-300 dark:border-neutral-800"
    >
      <UIcon
        name="i-lucide-receipt"
        class="size-16 text-gray-300 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Belum ada Iuran yang Dipublikasikan
      </h3>
      <p class="text-gray-500 dark:text-neutral-400 mt-1">
        Pengurus RT belum membuka publikasi untuk jenis iuran apa pun saat ini.
      </p>
    </div>

    <!-- State 2: No Periods for this Contribution Type -->
    <div
      v-else-if="!periodsPending && periodOptions.length === 0"
      class="text-center py-20 bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-gray-300 dark:border-neutral-800"
    >
      <UIcon
        name="i-lucide-calendar-x"
        class="size-16 text-gray-300 mx-auto mb-4"
      />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        Belum ada Periode Iuran
      </h3>
      <p class="text-gray-500 dark:text-neutral-400 mt-1">
        Belum ada periode tagihan yang dibuat untuk jenis iuran ini.
      </p>
    </div>

    <!-- State 3: Data Table / Content -->
    <div
      v-else
      class="space-y-4"
    >
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Daftar Warga Belum Bayar
      </h3>

      <UCard :ui="{ body: 'p-0' }">
        <div
          v-if="unpaidPending && !unpaidResponse?.data"
          class="p-4 space-y-3"
        >
          <USkeleton
            v-for="i in 3"
            :key="i"
            class="h-10 w-full"
          />
        </div>

        <UTable
          v-else
          :key="tableKey"
          :data="filteredResidents"
          :columns="tableColumns"
          :loading="unpaidPending"
          class="w-full"
        >
          <!-- No Cell -->
          <template #displayIndex-cell="{ row }">
            <span class="font-medium text-gray-600 dark:text-neutral-300 text-sm">
              {{ row.original.displayIndex }}
            </span>
          </template>

          <!-- Nama Warga -->
          <template #name-cell="{ row }">
            <span class="font-medium text-gray-900 dark:text-white text-sm">
              {{ row.original.name }}
            </span>
          </template>

          <!-- Alamat (Blok & No Rumah) -->
          <template #address-cell="{ row }">
            <span class="text-gray-600 dark:text-neutral-300 text-sm">
              {{ row.original.block ? `Blok ${row.original.block}` : '-' }}{{ row.original.house_number ? ` No. ${row.original.house_number}` : '' }}
            </span>
          </template>

          <!-- Status -->
          <template #status-cell>
            <UBadge
              color="error"
              variant="subtle"
              size="sm"
            >
              Belum Bayar
            </UBadge>
          </template>

          <!-- Empty State -->
          <template #empty>
            <div class="text-center py-12">
              <UIcon
                name="i-lucide-receipt"
                class="size-10 text-gray-300 mx-auto mb-3"
              />
              <p class="text-gray-500 text-sm">
                {{ searchQuery || selectedBlock !== 'ALL' ? 'Tidak ada data warga yang cocok dengan pencarian.' : 'Seluruh warga telah melunasi iuran pada periode ini.' }}
              </p>
            </div>
          </template>
        </UTable>
      </UCard>
    </div>
  </div>
</template>

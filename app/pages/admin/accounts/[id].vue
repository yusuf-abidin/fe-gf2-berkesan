<script setup lang="ts">
import type { Account } from '~/types/account'
import type { Category } from '~/types/category'
import type { Period } from '~/types/period'
import CategoryModal from '~/components/admin/CategoryModal.vue'
import PeriodModal from '~/components/admin/PeriodModal.vue'
import TransactionModal from '~/components/admin/TransactionModal.vue'
import AppConfirmModal from '~/components/AppConfirmModal.vue'

interface Transaction {
  id: number
  period_id: number
  category_id: number | null
  contribution_period_id: number | null
  type: 'IN' | 'OUT'
  name: string
  day: number | null
  quantity: number | null
  amount: number
  description: string | null
  category?: Category | null
  created_at?: string
  updated_at?: string
}

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

const route = useRoute()
const accountId = Number(route.params.id)

const { request } = useApi()
const toast = useToast()

// Fetch Account Detail
const { data: accountResponse, pending: accountPending } = useCustomFetch<Account>(`/accounts/${accountId}`)

const title = computed(() => {
  const accountName = accountResponse.value?.data?.name
  return accountName ? `${accountName} - Admin Panel` : 'Detail Buku Kerja - Admin Panel'
})

useSeoMeta({
  title
})

// Categories Management
const { data: categoryResponse, refresh: refreshCategories, pending: categoryPending } = useCustomFetch<Category[]>(`/accounts/${accountId}/categories`)

// Periods Management
const { data: periodsResponse, refresh: refreshPeriods, pending: periodsPending } = useCustomFetch<Period[]>(`/accounts/${accountId}/periods`)

const selectedPeriodId = useState<number | null>(`selected-account-period-${accountId}`, () => null)

// Watch periods to auto-select the first/latest one if not selected
const selectedYear = ref<number | null>(null)
const selectedMonth = ref<number | null>(null)

// Watch periods to auto-select or sync selectedYear and selectedMonth
watch(() => periodsResponse.value?.data, (newPeriods) => {
  if (newPeriods && newPeriods.length > 0) {
    const active = newPeriods.find(p => p.id === selectedPeriodId.value)
    if (active) {
      selectedYear.value = active.year
      selectedMonth.value = active.month
    } else {
      const firstPeriod = newPeriods[0]
      if (firstPeriod) {
        selectedYear.value = firstPeriod.year
        selectedMonth.value = firstPeriod.month
        selectedPeriodId.value = firstPeriod.id
      }
    }
  } else {
    selectedYear.value = null
    selectedMonth.value = null
    selectedPeriodId.value = null
  }
}, { immediate: true })

// Watch selectedYear and selectedMonth to update selectedPeriodId
watch([selectedYear, selectedMonth], ([newYear, newMonth]) => {
  const periods = periodsResponse.value?.data || []
  if (newYear && newMonth) {
    const match = periods.find(p => p.year === newYear && p.month === newMonth)
    if (match) {
      selectedPeriodId.value = match.id
    } else {
      const availableMonths = periods.filter(p => p.year === newYear).map(p => p.month).sort((a, b) => a - b)
      if (availableMonths.length > 0) {
        selectedMonth.value = availableMonths[0] ?? null
      } else {
        selectedPeriodId.value = null
      }
    }
  } else {
    selectedPeriodId.value = null
  }
})

const activePeriod = computed(() => {
  return periodsResponse.value?.data?.find(p => p.id === selectedPeriodId.value) || null
})

// Fetch Transactions for active period
const { data: transactionsResponse, refresh: refreshTransactions, pending: transactionsPending } = useCustomFetch<Transaction[]>(
  () => selectedPeriodId.value ? `/periods/${selectedPeriodId.value}/transactions` : null,
  { watch: [selectedPeriodId] }
)

interface TransactionsApiResponse {
  success: boolean
  message: string
  data: Transaction[]
  summary: {
    start_balance: number
    total_in: number
    total_out: number
    balance: number
  }
}

const transactionSummary = computed(() => {
  const resp = transactionsResponse.value as unknown as TransactionsApiResponse | null
  return resp?.summary || { start_balance: 0, total_in: 0, total_out: 0, balance: 0 }
})

// Active Period Actions
const togglingPublish = ref(false)
const togglePublish = async () => {
  if (!activePeriod.value) return
  togglingPublish.value = true
  try {
    const nextStatus = !activePeriod.value.is_published
    await request(`/periods/${activePeriod.value.id}`, {
      method: 'PATCH',
      body: { is_published: nextStatus }
    })
    toast.add({ title: 'Berhasil', description: `Status periode berhasil diubah menjadi ${nextStatus ? 'Published' : 'Draft'}`, color: 'success' })
    await refreshPeriods()
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Error', description: err.message || 'Gagal mengubah status', color: 'error' })
  } finally {
    togglingPublish.value = false
  }
}

const isDeletePeriodOpen = ref(false)
const isDeletingPeriod = ref(false)
const deleteActivePeriod = async () => {
  if (!selectedPeriodId.value) return
  isDeletingPeriod.value = true
  try {
    await request(`/periods/${selectedPeriodId.value}`, { method: 'DELETE' })
    toast.add({ title: 'Berhasil', description: 'Periode berhasil dihapus beserta seluruh transaksi di dalamnya.', color: 'success' })
    selectedPeriodId.value = null
    await refreshPeriods()
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Error', description: err.message || 'Gagal menghapus periode', color: 'error' })
  } finally {
    isDeletingPeriod.value = false
    isDeletePeriodOpen.value = false
  }
}

// Categories Actions
const isCategoryModalOpen = ref(false)
const selectedCategory = ref<Category | null>(null)
const isConfirmDeleteOpen = ref(false)
const isDeleting = ref(false)

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

// Transactions Actions
const isTransactionModalOpen = ref(false)
const selectedTransaction = ref<Transaction | null>(null)
const isConfirmDeleteTransactionOpen = ref(false)
const isDeletingTransaction = ref(false)
const isSyncingTransaction = ref<Record<number, boolean>>({})

const openAddTransaction = () => {
  selectedTransaction.value = null
  isTransactionModalOpen.value = true
}

const openEditTransaction = (transaction: Transaction) => {
  selectedTransaction.value = transaction
  isTransactionModalOpen.value = true
}

const confirmDeleteTransaction = (transaction: Transaction) => {
  selectedTransaction.value = transaction
  isConfirmDeleteTransactionOpen.value = true
}

const deleteTransaction = async () => {
  if (!selectedTransaction.value) return
  isDeletingTransaction.value = true
  try {
    await request(`/transactions/${selectedTransaction.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Berhasil', description: 'Transaksi berhasil dihapus.', color: 'success' })
    isConfirmDeleteTransactionOpen.value = false
    refreshTransactions()
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Error', description: err.message || 'Gagal menghapus transaksi', color: 'error' })
  } finally {
    isDeletingTransaction.value = false
  }
}

const syncTransaction = async (transaction: Transaction) => {
  isSyncingTransaction.value[transaction.id] = true
  try {
    await request(`/transactions/${transaction.id}`, {
      method: 'PATCH',
      body: { contribution_period_id: transaction.contribution_period_id }
    })
    toast.add({ title: 'Berhasil', description: 'Transaksi disinkronkan dengan Iuran warga.', color: 'success' })
    refreshTransactions()
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Error', description: err.message || 'Gagal menyinkronkan transaksi', color: 'error' })
  } finally {
    isSyncingTransaction.value[transaction.id] = false
  }
}

// Period Modal Actions
const isPeriodModalOpen = ref(false)
const onPeriodCreated = async () => {
  await refreshPeriods()
}

// Period Settings Actions
const isSavingSettings = ref(false)
const settingsForm = ref({
  start_balance: 0
})

watch(() => activePeriod.value, (newPeriod) => {
  if (newPeriod) {
    settingsForm.value.start_balance = Number(newPeriod.start_balance || 0)
  }
}, { immediate: true })

const saveSettings = async () => {
  if (!activePeriod.value) return
  isSavingSettings.value = true
  try {
    await request(`/periods/${activePeriod.value.id}`, {
      method: 'PATCH',
      body: {
        start_balance: settingsForm.value.start_balance
      }
    })
    toast.add({ title: 'Berhasil', description: 'Pengaturan periode berhasil diperbarui.', color: 'success' })
    await refreshPeriods()
    await refreshTransactions()
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Error', description: err.message || 'Gagal menyimpan pengaturan', color: 'error' })
  } finally {
    isSavingSettings.value = false
  }
}

// Columns definition
const categoryColumns = [
  { accessorKey: 'name', header: 'Nama Kategori' },
  { id: 'actions', header: '' }
]

const transactionColumns = [
  { accessorKey: 'day', header: 'Tgl' },
  { accessorKey: 'name', header: 'Transaksi' },
  { accessorKey: 'category', header: 'Kategori' },
  { accessorKey: 'type', header: 'Tipe' },
  { accessorKey: 'amount', header: 'Nominal' },
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

const formatRupiah = (value: number | string) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value))
}

const getMonthName = (monthNum: number) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  return months[monthNum - 1] || ''
}

const yearOptions = computed(() => {
  const periods = periodsResponse.value?.data || []
  const years = [...new Set(periods.map(p => p.year))]
  return years.sort((a, b) => b - a).map(y => ({
    label: String(y),
    value: String(y)
  }))
})

const monthOptions = computed(() => {
  const periods = periodsResponse.value?.data || []
  if (!selectedYear.value) return []

  const months = periods
    .filter(p => p.year === selectedYear.value)
    .map(p => p.month)

  return [...new Set(months)].sort((a, b) => a - b).map(m => ({
    label: getMonthName(m),
    value: String(m)
  }))
})

const selectedYearStr = computed({
  get: () => selectedYear.value ? String(selectedYear.value) : '',
  set: (val) => {
    selectedYear.value = val ? Number(val) : null
  }
})

const selectedMonthStr = computed({
  get: () => selectedMonth.value ? String(selectedMonth.value) : '',
  set: (val) => {
    selectedMonth.value = val ? Number(val) : null
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Back Button & Title -->
    <div>
      <UButton
        to="/admin/accounts"
        icon="i-lucide-arrow-left"
        label="Kembali ke Daftar"
        variant="ghost"
        color="neutral"
        size="sm"
        class="-ml-2 mb-2"
      />

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div
          v-if="accountPending && !accountResponse?.data"
          class="flex-1"
        >
          <USkeleton class="h-8 w-64 mb-2" />
          <USkeleton class="h-4 w-96" />
        </div>
        <div
          v-else
          class="flex-1"
        >
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ accountResponse?.data?.name }}
          </h1>
          <p class="text-gray-500 dark:text-neutral-400 mt-1">
            {{ accountResponse?.data?.description || 'Buku kerja pengelolaan keuangan.' }}
          </p>
        </div>

        <!-- Period Action Bar -->
        <div class="flex items-center gap-3 bg-gray-50 dark:bg-neutral-900 p-2 rounded-lg border border-gray-100 dark:border-neutral-800">
          <template v-if="yearOptions.length > 0">
            <USelect
              v-model="selectedYearStr"
              :items="yearOptions"
              value-key="value"
              class="w-28"
              size="sm"
            />

            <USelect
              v-model="selectedMonthStr"
              :items="monthOptions"
              value-key="value"
              class="w-36"
              size="sm"
            />

            <!-- Toggle Publish Status -->
            <UButton
              v-if="activePeriod"
              :label="activePeriod.is_published ? 'Published' : 'Draft'"
              :color="activePeriod.is_published ? 'success' : 'warning'"
              variant="subtle"
              size="sm"
              :loading="togglingPublish"
              icon="i-lucide-globe"
              @click="togglePublish"
            />

            <!-- Delete Active Period -->
            <UButton
              v-if="activePeriod"
              icon="i-lucide-trash"
              color="error"
              variant="ghost"
              size="sm"
              title="Hapus Periode Ini"
              @click="isDeletePeriodOpen = true"
            />

            <!-- Cetak Laporan PDF -->
            <UButton
              v-if="activePeriod"
              icon="i-lucide-printer"
              color="neutral"
              variant="ghost"
              size="sm"
              title="Cetak Laporan"
              :to="`/print/accounts/${accountId}?periodId=${selectedPeriodId}`"
              target="_blank"
            />
          </template>

          <UButton
            icon="i-lucide-calendar-plus"
            label="Periode Baru"
            size="sm"
            color="primary"
            @click="isPeriodModalOpen = true"
          />
        </div>
      </div>
    </div>

    <!-- Tabs Content -->
    <UTabs
      :items="items"
      class="w-full"
    >
      <!-- Transaksi Tab -->
      <template #transactions>
        <div class="py-4 space-y-6">
          <!-- Loading state for periods & transactions -->
          <div
            v-if="(periodsPending && !periodsResponse?.data) || (selectedPeriodId && transactionsPending && !transactionsResponse?.data)"
            class="space-y-6"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <UCard
                v-for="i in 4"
                :key="i"
              >
                <div class="flex justify-between items-center">
                  <div class="space-y-2 flex-1">
                    <USkeleton class="h-4 w-1/3" />
                    <USkeleton class="h-8 w-2/3" />
                  </div>
                  <USkeleton class="size-12 rounded-lg" />
                </div>
              </UCard>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <USkeleton class="h-6 w-1/4" />
                <USkeleton class="h-8 w-28" />
              </div>
              <UCard class="p-6">
                <div class="space-y-4">
                  <USkeleton
                    v-for="i in 3"
                    :key="i"
                    class="h-10 w-full"
                  />
                </div>
              </UCard>
            </div>
          </div>

          <div
            v-else-if="!selectedPeriodId"
            class="text-center py-12 bg-white dark:bg-neutral-900 border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl"
          >
            <UIcon
              name="i-lucide-calendar-x"
              class="size-12 text-gray-300 mx-auto mb-4"
            />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Belum Ada Periode
            </h3>
            <p class="text-gray-500 max-w-md mx-auto mb-6 text-sm">
              Buat periode laporan keuangan (bulan & tahun) terlebih dahulu untuk dapat mengelola transaksi keuangan.
            </p>
            <UButton
              icon="i-lucide-calendar-plus"
              label="Buat Periode Laporan Pertama"
              @click="isPeriodModalOpen = true"
            />
          </div>

          <template v-else>
            <!-- Cash Flow Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Saldo Awal -->
              <UCard class="relative overflow-hidden border border-gray-100 dark:border-neutral-800">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Saldo Awal
                    </p>
                    <h3 class="text-2xl font-bold text-neutral-600 dark:text-neutral-300 mt-1">
                      {{ formatRupiah(transactionSummary.start_balance || 0) }}
                    </h3>
                  </div>
                  <div class="p-3 bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 rounded-lg">
                    <UIcon
                      name="i-lucide-arrow-right-left"
                      class="size-6"
                    />
                  </div>
                </div>
              </UCard>

              <!-- Total IN -->
              <UCard class="relative overflow-hidden border border-emerald-100 dark:border-emerald-950/30">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total Pemasukan
                    </p>
                    <h3 class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      {{ formatRupiah(transactionSummary.total_in) }}
                    </h3>
                  </div>
                  <div class="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <UIcon
                      name="i-lucide-trending-up"
                      class="size-6"
                    />
                  </div>
                </div>
              </UCard>

              <!-- Total OUT -->
              <UCard class="relative overflow-hidden border border-rose-100 dark:border-rose-950/30">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Total Pengeluaran
                    </p>
                    <h3 class="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                      {{ formatRupiah(transactionSummary.total_out) }}
                    </h3>
                  </div>
                  <div class="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg">
                    <UIcon
                      name="i-lucide-trending-down"
                      class="size-6"
                    />
                  </div>
                </div>
              </UCard>

              <!-- Net Balance -->
              <UCard class="relative overflow-hidden border border-indigo-100 dark:border-indigo-950/30">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Saldo Akhir
                    </p>
                    <h3
                      class="text-2xl font-bold mt-1"
                      :class="transactionSummary.balance >= 0 ? 'text-indigo-650 dark:text-indigo-400' : 'text-rose-650 dark:text-rose-400'"
                    >
                      {{ formatRupiah(transactionSummary.balance) }}
                    </h3>
                  </div>
                  <div
                    class="p-3 rounded-lg"
                    :class="transactionSummary.balance >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'"
                  >
                    <UIcon
                      name="i-lucide-wallet"
                      class="size-6"
                    />
                  </div>
                </div>
              </UCard>
            </div>

            <!-- Transactions List Card -->
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Daftar Transaksi
                </h3>
                <UButton
                  icon="i-lucide-plus"
                  label="Tambah Transaksi"
                  size="sm"
                  @click="openAddTransaction"
                />
              </div>

              <UCard :ui="{ body: 'p-0' }">
                <div
                  v-if="transactionsPending && !transactionsResponse?.data"
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
                  :data="transactionsResponse?.data || []"
                  :columns="transactionColumns"
                  :loading="transactionsPending"
                  class="w-full"
                >
                  <!-- Day Cell -->
                  <template #day-cell="{ row }">
                    <span class="font-medium text-gray-600 dark:text-neutral-300 text-sm">
                      {{ row.original.day ? String(row.original.day).padStart(2, '0') : '-' }}
                    </span>
                  </template>

                  <!-- Name Cell -->
                  <template #name-cell="{ row }">
                    <div class="flex flex-col gap-0.5">
                      <span class="font-medium text-gray-900 dark:text-white text-sm">
                        {{ row.original.name }}
                      </span>
                      <span
                        v-if="row.original.description"
                        class="text-xs text-gray-400 dark:text-neutral-500"
                      >
                        {{ row.original.description }}
                      </span>
                    </div>
                  </template>

                  <!-- Category Cell -->
                  <template #category-cell="{ row }">
                    <UBadge
                      v-if="row.original.category"
                      variant="subtle"
                      color="neutral"
                      size="sm"
                    >
                      {{ row.original.category.name }}
                    </UBadge>
                    <span
                      v-else
                      class="text-xs text-gray-400 dark:text-neutral-550 italic"
                    >Tanpa Kategori</span>
                  </template>

                  <!-- Type Cell -->
                  <template #type-cell="{ row }">
                    <UBadge
                      :color="row.original.type === 'IN' ? 'success' : 'error'"
                      variant="subtle"
                      size="sm"
                    >
                      {{ row.original.type === 'IN' ? 'Pemasukan' : 'Pengeluaran' }}
                    </UBadge>
                  </template>

                  <!-- Amount Cell -->
                  <template #amount-cell="{ row }">
                    <span
                      class="font-semibold text-sm"
                      :class="row.original.type === 'IN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
                    >
                      {{ row.original.type === 'IN' ? '+' : '-' }} {{ formatRupiah(row.original.amount) }}
                    </span>
                  </template>

                  <!-- Actions Cell -->
                  <template #actions-cell="{ row }">
                    <div class="flex justify-end px-4 gap-1 items-center">
                      <!-- Sync Iuran Button if linked -->
                      <UButton
                        v-if="row.original.contribution_period_id"
                        icon="i-lucide-rotate-cw"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        :loading="isSyncingTransaction[row.original.id]"
                        title="Sinkronkan dengan Iuran"
                        @click="syncTransaction(row.original)"
                      />

                      <UButton
                        icon="i-lucide-pencil"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        @click="openEditTransaction(row.original)"
                      />

                      <UButton
                        icon="i-lucide-trash-2"
                        color="error"
                        variant="ghost"
                        size="sm"
                        @click="confirmDeleteTransaction(row.original)"
                      />
                    </div>
                  </template>

                  <template #empty>
                    <div class="text-center py-12">
                      <UIcon
                        name="i-lucide-receipt"
                        class="size-10 text-gray-300 mx-auto mb-3"
                      />
                      <p class="text-gray-500 text-sm">
                        Belum ada transaksi pada periode ini.
                      </p>
                    </div>
                  </template>
                </UTable>
              </UCard>
            </div>
          </template>
        </div>
      </template>

      <!-- Kategori Tab -->
      <template #categories>
        <div class="py-4 space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Daftar Kategori
            </h3>
            <UButton
              icon="i-lucide-plus"
              label="Tambah Kategori"
              size="sm"
              @click="openAddCategory"
            />
          </div>

          <UCard :ui="{ body: 'p-0' }">
            <div
              v-if="categoryPending && !categoryResponse?.data"
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
              :data="categoryResponse?.data || []"
              :columns="categoryColumns"
              :loading="categoryPending"
              class="w-full"
            >
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
                  <UIcon
                    name="i-lucide-tags"
                    class="size-10 text-gray-300 mx-auto mb-3"
                  />
                  <p class="text-gray-500">
                    Belum ada kategori untuk buku kerja ini.
                  </p>
                </div>
              </template>
            </UTable>
          </UCard>
        </div>
      </template>

      <!-- Pengaturan Tab -->
      <template #settings>
        <div class="py-4">
          <div
            v-if="!activePeriod"
            class="text-center py-10"
          >
            <p class="text-gray-500">
              Silakan pilih atau buat periode laporan terlebih dahulu untuk melihat pengaturan.
            </p>
          </div>
          <UCard
            v-else
            class="max-w-xl"
          >
            <template #header>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Pengaturan Periode: {{ getMonthName(activePeriod.month) }} {{ activePeriod.year }}
              </h3>
              <p class="text-xs text-gray-500">
                Kelola konfigurasi khusus untuk periode pembukuan ini.
              </p>
            </template>

            <form
              class="space-y-4"
              @submit.prevent="saveSettings"
            >
              <UFormField label="Saldo Awal (Rupiah)">
                <UInputNumber
                  v-model="settingsForm.start_balance"
                  placeholder="Masukkan saldo awal periode"
                  class="w-full"
                  :disabled="isSavingSettings"
                />
              </UFormField>

              <div class="flex justify-end pt-2">
                <UButton
                  type="submit"
                  label="Simpan Pengaturan"
                  color="primary"
                  :loading="isSavingSettings"
                />
              </div>
            </form>
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

    <PeriodModal
      v-model="isPeriodModalOpen"
      :account-id="accountId"
      @refresh="onPeriodCreated"
    />

    <TransactionModal
      v-if="selectedPeriodId"
      v-model="isTransactionModalOpen"
      :period-id="selectedPeriodId"
      :account-id="accountId"
      :categories="categoryResponse?.data || []"
      :transaction="selectedTransaction"
      @refresh="refreshTransactions"
    />

    <!-- Delete Category Confirm -->
    <AppConfirmModal
      v-model="isConfirmDeleteOpen"
      title="Hapus Kategori"
      :description="`Apakah Anda yakin ingin menghapus kategori '${selectedCategory?.name}'? Transaksi yang menggunakan kategori ini mungkin akan terpengaruh.`"
      confirm-label="Hapus Kategori"
      :loading="isDeleting"
      @confirm="deleteCategory"
    />

    <!-- Delete Period Confirm -->
    <AppConfirmModal
      v-model="isDeletePeriodOpen"
      title="Hapus Periode Laporan"
      description="Apakah Anda yakin ingin menghapus periode ini? Tindakan ini akan menghapus seluruh data transaksi di dalam periode tersebut secara permanen!"
      confirm-label="Hapus Periode"
      :loading="isDeletingPeriod"
      @confirm="deleteActivePeriod"
    />

    <!-- Delete Transaction Confirm -->
    <AppConfirmModal
      v-model="isConfirmDeleteTransactionOpen"
      title="Hapus Transaksi"
      :description="`Apakah Anda yakin ingin menghapus transaksi '${selectedTransaction?.name}'? Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Hapus Transaksi"
      :loading="isDeletingTransaction"
      @confirm="deleteTransaction"
    />
  </div>
</template>

<script setup lang="ts">
import type { Account } from '~/types/account'
import type { Category } from '~/types/category'
import type { Period } from '~/types/period'

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
  layout: 'user',
  middleware: ['auth']
})

const route = useRoute()
const accountId = Number(route.params.id)

// Fetch Account Detail
const { data: accountResponse, pending: accountPending } = useCustomFetch<Account>(`/accounts/${accountId}`)

const title = computed(() => {
  const accountName = accountResponse.value?.data?.name
  return accountName ? `${accountName} - Laporan Keuangan` : 'Laporan Keuangan Warga'
})

useSeoMeta({
  title
})

// Periods Management
const { data: periodsResponse, pending: periodsPending } = useCustomFetch<Period[]>(`/accounts/${accountId}/periods`)

const selectedPeriodId = useState<number | null>(`user-selected-account-period-${accountId}`, () => null)
const selectedYear = ref<number | null>(null)
const selectedMonth = ref<number | null>(null)

// Watch periods to auto-select (current month/year as priority, fallback to first/latest)
watch(() => periodsResponse.value?.data, (newPeriods) => {
  if (newPeriods && newPeriods.length > 0) {
    const active = newPeriods.find(p => p.id === selectedPeriodId.value)
    if (active) {
      selectedYear.value = active.year
      selectedMonth.value = active.month
    } else {
      const now = new Date()
      const curYear = now.getFullYear()
      const curMonth = now.getMonth() + 1

      const match = newPeriods.find(p => p.year === curYear && p.month === curMonth)
      if (match) {
        selectedYear.value = curYear
        selectedMonth.value = curMonth
        selectedPeriodId.value = match.id
      } else {
        const firstPeriod = newPeriods[0]
        if (firstPeriod) {
          selectedYear.value = firstPeriod.year
          selectedMonth.value = firstPeriod.month
          selectedPeriodId.value = firstPeriod.id
        }
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

// Fetch Transactions for active period
const { data: transactionsResponse, pending: transactionsPending } = useCustomFetch<Transaction[]>(
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

const transactionColumns = [
  { accessorKey: 'day', header: 'Tgl' },
  { accessorKey: 'name', header: 'Transaksi' },
  { accessorKey: 'category', header: 'Kategori' },
  { accessorKey: 'type', header: 'Tipe' },
  { accessorKey: 'amount', header: 'Nominal' }
]
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Back Button & Title -->
    <div>
      <UButton
        to="/user/accounts"
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
            {{ accountResponse?.data?.description || 'Laporan resmi keuangan warga.' }}
          </p>
        </div>

        <!-- Period Selector -->
        <div class="flex items-center gap-3 bg-gray-50 dark:bg-neutral-900 p-2 rounded-lg border border-gray-100 dark:border-neutral-800 shrink-0">
          <template v-if="yearOptions.length > 0">
            <span class="text-xs text-gray-500 font-medium pl-1">Periode:</span>
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

            <!-- Cetak Laporan PDF -->
            <UButton
              icon="i-lucide-printer"
              color="neutral"
              variant="ghost"
              size="sm"
              title="Cetak Laporan"
              :to="`/print/accounts/${accountId}?periodId=${selectedPeriodId}`"
              target="_blank"
            />
          </template>
          <span
            v-else-if="!periodsPending"
            class="text-xs text-gray-400 px-3 py-1 font-medium italic"
          >
            Belum ada periode dipublikasikan
          </span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="space-y-6">
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

      <!-- No Published Periods State -->
      <div
        v-else-if="!selectedPeriodId"
        class="text-center py-16 bg-white dark:bg-neutral-900 border border-dashed border-gray-250 dark:border-neutral-800 rounded-xl"
      >
        <UIcon
          name="i-lucide-calendar-x"
          class="size-12 text-gray-300 mx-auto mb-4"
        />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Laporan Belum Tersedia
        </h3>
        <p class="text-gray-505 dark:text-neutral-400 max-w-md mx-auto text-sm">
          Belum ada laporan keuangan bulanan yang dipublikasikan oleh Admin untuk buku kerja ini. Silakan hubungi admin RT jika memerlukan informasi lebih lanjut.
        </p>
      </div>

      <!-- Active Period Details -->
      <template v-else>
        <!-- Cash Flow Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Saldo Awal -->
          <UCard class="relative overflow-hidden border border-gray-100 dark:border-neutral-800 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                  Saldo Awal
                </p>
                <h3 class="text-2xl font-bold text-neutral-600 dark:text-neutral-300 mt-1">
                  {{ formatRupiah(transactionSummary.start_balance || 0) }}
                </h3>
              </div>
              <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 text-neutral-550 dark:text-neutral-400 rounded-lg">
                <UIcon
                  name="i-lucide-arrow-right-left"
                  class="size-6"
                />
              </div>
            </div>
          </UCard>

          <!-- Total IN -->
          <UCard class="relative overflow-hidden border border-emerald-100 dark:border-emerald-950/30 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                  Total Pemasukan
                </p>
                <h3 class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {{ formatRupiah(transactionSummary.total_in) }}
                </h3>
              </div>
              <div class="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 dark:text-emerald-405 rounded-lg">
                <UIcon
                  name="i-lucide-trending-up"
                  class="size-6"
                />
              </div>
            </div>
          </UCard>

          <!-- Total OUT -->
          <UCard class="relative overflow-hidden border border-rose-100 dark:border-rose-950/30 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                  Total Pengeluaran
                </p>
                <h3 class="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                  {{ formatRupiah(transactionSummary.total_out) }}
                </h3>
              </div>
              <div class="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-650 dark:text-rose-405 rounded-lg">
                <UIcon
                  name="i-lucide-trending-down"
                  class="size-6"
                />
              </div>
            </div>
          </UCard>

          <!-- Net Balance -->
          <UCard class="relative overflow-hidden border border-indigo-100 dark:border-indigo-950/30 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
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
                :class="transactionSummary.balance >= 0 ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400' : 'bg-rose-50 dark:bg-rose-950/20 text-rose-655 dark:text-rose-400'"
              >
                <UIcon
                  name="i-lucide-wallet"
                  class="size-6"
                />
              </div>
            </div>
          </UCard>
        </div>

        <!-- Transactions List -->
        <div class="space-y-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Detail Transaksi Periode
          </h3>

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
                  class="text-xs text-gray-400 dark:text-neutral-500 italic"
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

              <template #empty>
                <div class="text-center py-12">
                  <UIcon
                    name="i-lucide-receipt"
                    class="size-10 text-gray-305 mx-auto mb-3"
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
  </div>
</template>

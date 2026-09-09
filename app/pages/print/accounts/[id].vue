<script setup lang="ts">
definePageMeta({
  layout: false,
  colorMode: 'light'
})

useSeoMeta({
  title: 'Cetak Laporan Keuangan',
  robots: 'noindex'
})

interface Account {
  id: number
  name: string
  slug: string
  description: string
}

interface Period {
  id: number
  month: number
  year: number
  is_published: boolean
  start_balance: number
}

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
  category?: {
    id: number
    name: string
  } | null
  created_at?: string
  updated_at?: string
}

interface TransactionSummary {
  start_balance: number
  total_in: number
  total_out: number
  balance: number
}

interface AppSettings {
  ketua_rt: string
  bendahara: string[]
  kontak_admin: string
}

const route = useRoute()
const accountId = Number(route.params.id)
const periodId = Number(route.query.periodId)

const { request } = useApi()

// Loading & error states
const loading = ref(true)
const errorMessage = ref('')

// Data states
const account = ref<Account | null>(null)
const period = ref<Period | null>(null)
const transactions = ref<Transaction[]>([])
const summary = ref<TransactionSummary | null>(null)
const settings = ref<AppSettings | null>(null)

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const formatMonthName = (m: number) => months[m - 1] || ''

const formatRupiah = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(val)
}

const currentDateText = computed(() => {
  const today = new Date()
  const day = today.getDate()
  const mName = formatMonthName(today.getMonth() + 1)
  const yr = today.getFullYear()
  return `${day} ${mName} ${yr}`
})

// Group transactions by category
interface GroupedCategory {
  categoryName: string
  transactions: Transaction[]
}

const groupedTransactions = computed<GroupedCategory[]>(() => {
  const groups: Record<number, GroupedCategory> = {}
  const noCategoryTxs: Transaction[] = []

  transactions.value.forEach((tx) => {
    if (tx.category) {
      const catId = tx.category.id
      if (!groups[catId]) {
        groups[catId] = {
          categoryName: tx.category.name,
          transactions: []
        }
      }
      groups[catId].transactions.push(tx)
    } else {
      noCategoryTxs.push(tx)
    }
  })

  const result = Object.values(groups)
  if (noCategoryTxs.length > 0) {
    result.push({
      categoryName: '', // empty means Tanpa Kategori
      transactions: noCategoryTxs
    })
  }

  return result
})

// Fetch all resources and validate permissions
onMounted(async () => {
  if (!accountId || !periodId) {
    errorMessage.value = 'Parameter Buku Kerja atau Periode tidak valid.'
    loading.value = false
    return
  }

  try {
    // 1. Fetch Account Info
    const accountRes = await request<Account>(`/accounts/${accountId}`)
    account.value = accountRes.data

    // 2. Fetch Periods and check if this period is valid and accessible
    const periodsRes = await request<Period[]>(`/accounts/${accountId}/periods`)
    const foundPeriod = periodsRes.data.find(p => p.id === periodId)

    if (!foundPeriod) {
      errorMessage.value = 'Akses Ditolak atau Periode tidak ditemukan.'
      loading.value = false
      return
    }
    period.value = foundPeriod

    interface TransactionsApiResponse {
      success: boolean
      message: string
      data: Transaction[]
      summary: TransactionSummary
    }

    // 3. Fetch Transactions for the Period
    const txsRes = await request<Transaction[]>(`/periods/${periodId}/transactions`)
    const rawRes = txsRes as unknown as TransactionsApiResponse
    transactions.value = rawRes.data
    summary.value = rawRes.summary

    // 4. Fetch settings for signatures
    const settingsRes = await request<AppSettings>('/settings')
    settings.value = settingsRes.data
  } catch (e) {
    const err = e as { message?: string }
    errorMessage.value = err.message || 'Gagal memuat data laporan.'
  } finally {
    loading.value = false
  }
})

const handlePrint = () => {
  window.print()
}
</script>

<template>
  <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 print:bg-white print:dark:bg-white text-gray-800 print:text-black p-4 md:p-8 flex flex-col items-center">
    <!-- Action Top Bar (No Print) -->
    <div class="w-full max-w-4xl flex justify-end items-center bg-white dark:bg-neutral-800 p-4 rounded-xl shadow-sm mb-6 print:hidden">
      <div class="flex gap-2">
        <UButton
          icon="i-lucide-printer"
          label="Cetak Laporan"
          color="primary"
          @click="handlePrint"
        />
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="errorMessage"
      class="w-full max-w-4xl bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-sm text-center space-y-4 print:bg-white"
    >
      <UIcon
        name="i-lucide-alert-triangle"
        class="size-12 text-rose-500 mx-auto"
      />
      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
        Gagal Mencetak Laporan
      </h2>
      <p class="text-gray-500 dark:text-gray-400">
        {{ errorMessage }}
      </p>
      <UButton
        label="Kembali"
        color="neutral"
        @click="$router.back()"
      />
    </div>

    <!-- Loading State -->
    <div
      v-else-if="loading"
      class="w-full max-w-4xl bg-white dark:bg-neutral-800 p-8 rounded-xl shadow-sm text-center space-y-4 print:hidden"
    >
      <USkeleton class="h-6 w-3/4 mx-auto" />
      <USkeleton class="h-4 w-1/2 mx-auto" />
      <USkeleton class="h-32 w-full mx-auto" />
      <p class="text-gray-500 dark:text-gray-400 text-sm">
        Mempersiapkan dokumen...
      </p>
    </div>

    <!-- Report Document -->
    <div
      v-else-if="account && period && summary"
      id="printable-area"
      class="w-full max-w-4xl bg-white dark:bg-neutral-900 print:bg-white print:dark:bg-white p-8 md:p-12 shadow-md print:shadow-none rounded-xl print:rounded-none flex flex-col"
    >
      <!-- Kop Surat / Header -->
      <div class="flex items-center gap-6 border-b-4 border-double border-black pb-4 mb-6">
        <!-- Logo -->
        <img
          src="/app-logo.svg"
          alt="Logo RT"
          class="h-20 w-20 object-contain print:h-20 print:w-20"
        >
        <!-- Header Text -->
        <div class="flex-1 text-center font-serif text-black">
          <h1 class="text-lg font-bold uppercase tracking-wide leading-tight">
            {{ account.name }}
          </h1>
          <h2 class="text-base font-bold uppercase tracking-wide leading-none mt-1">
            RT 01 RW 021 • Periode {{ formatMonthName(period.month) }} {{ period.year }}
          </h2>
          <h3 class="text-sm font-semibold uppercase tracking-wide leading-normal mt-1 text-black print:text-black">
            PERUMAHAN GRIYA FAMILY 2
          </h3>
          <p class="text-xs text-black print:text-black italic mt-0.5">
            Jl. Raya Kelapa Nunggal, Kp.Cibeber, Ds.Cikahuripan, Kec.Kelapa Nunggal, Kab.Bogor - 16710
          </p>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="overflow-x-auto flex-1">
        <table class="w-full text-xs text-black border-collapse border border-black">
          <thead>
            <tr class="bg-neutral-100 print:bg-neutral-100 font-bold border-b border-black">
              <th class="border border-black py-1.5 px-2 text-center w-12">
                Tgl
              </th>
              <th class="border border-black py-1.5 px-2 text-left">
                Keterangan
              </th>
              <th class="border border-black py-1.5 px-2 text-right w-36">
                Pemasukan (Debit)
              </th>
              <th class="border border-black py-1.5 px-2 text-right w-36">
                Pengeluaran (Kredit)
              </th>
            </tr>
          </thead>
          <tbody>
            <!-- Saldo Awal -->
            <tr class="font-bold border-b border-black">
              <td class="border border-black py-1 px-2 text-center">
                -
              </td>
              <td class="border border-black py-1 px-2 uppercase">
                SALDO AWAL PERIODE
              </td>
              <td class="border border-black py-1 px-2 text-right">
                {{ formatRupiah(summary.start_balance) }}
              </td>
              <td class="border border-black py-1 px-2 text-right">
                -
              </td>
            </tr>

            <!-- Grouped Transactions -->
            <template
              v-for="group in groupedTransactions"
              :key="group.categoryName"
            >
              <!-- Category Header Row -->
              <tr class="bg-neutral-50 print:bg-neutral-50 font-bold border-b border-black">
                <td class="border border-black py-1 px-2 text-center">
                  -
                </td>
                <td
                  class="border border-black py-1 px-2 text-neutral-800 font-bold"
                  colspan="3"
                >
                  {{ group.categoryName || 'Lain-lain / Tanpa Kategori' }}
                </td>
              </tr>

              <!-- Category Transactions -->
              <tr
                v-for="tx in group.transactions"
                :key="tx.id"
                class="border-b border-black hover:bg-neutral-50/50 print:hover:bg-transparent"
              >
                <td class="border border-black py-1 px-2 text-center">
                  {{ String(tx.day).padStart(2, '0') }}
                </td>
                <td class="border border-black py-1 px-2">
                  <div class="leading-tight">
                    <span>{{ tx.name }}</span>
                    <span
                      v-if="tx.quantity && tx.quantity > 0"
                      class="text-[10px] text-neutral-500 ml-1"
                    >
                      (x{{ tx.quantity }})
                    </span>
                  </div>
                  <div
                    v-if="tx.description"
                    class="text-[10px] text-neutral-500 italic mt-0.5 leading-none"
                  >
                    ({{ tx.description }})
                  </div>
                </td>
                <td class="border border-black py-1 px-2 text-right">
                  {{ tx.type === 'IN' ? formatRupiah(tx.amount) : '-' }}
                </td>
                <td class="border border-black py-1 px-2 text-right">
                  {{ tx.type === 'OUT' ? formatRupiah(tx.amount) : '-' }}
                </td>
              </tr>
            </template>

            <!-- Total Mutasi Row -->
            <tr class="font-bold border-t-2 border-black bg-neutral-50 print:bg-neutral-50">
              <td class="border border-black py-1.5 px-2 text-center">
                -
              </td>
              <td class="border border-black py-1.5 px-2 uppercase">
                TOTAL MUTASI PERIODE
              </td>
              <td class="border border-black py-1.5 px-2 text-right text-emerald-700 print:text-emerald-700">
                {{ formatRupiah(summary.total_in) }}
              </td>
              <td class="border border-black py-1.5 px-2 text-right text-rose-700 print:text-rose-700">
                {{ formatRupiah(summary.total_out) }}
              </td>
            </tr>

            <!-- Saldo Akhir Row -->
            <tr class="font-bold bg-neutral-100 print:bg-neutral-100">
              <td class="border border-black py-1.5 px-2 text-center">
                -
              </td>
              <td class="border border-black py-1.5 px-2 uppercase text-sm">
                SALDO AKHIR PERIODE
              </td>
              <td
                class="border border-black py-1.5 px-2 text-right text-sm"
                colspan="2"
              >
                {{ formatRupiah(summary.balance) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Signatures Section -->
      <div class="mt-12 text-black avoid-break">
        <div class="text-right text-xs mb-8">
          Cikahuripan, {{ currentDateText }}
        </div>
        <div class="flex justify-between items-start">
          <!-- Left Columns: Bendahara(s) -->
          <div class="flex gap-12">
            <div
              v-for="(name, index) in settings?.bendahara || []"
              :key="name"
              class="text-center w-36"
            >
              <p class="font-semibold text-xs mb-14">
                {{ (settings?.bendahara || []).length > 1 ? `Bendahara ${index + 1}` : 'Bendahara' }}
              </p>
              <p class="font-bold text-xs">
                {{ name }}
              </p>
            </div>
            <!-- Placeholder if no bendahara -->
            <div
              v-if="!settings?.bendahara || settings.bendahara.length === 0"
              class="text-center w-36"
            >
              <p class="font-semibold text-xs mb-14">
                Bendahara
              </p>
              <p class="font-bold text-xs">
                ..........................
              </p>
            </div>
          </div>

          <!-- Right Column: Ketua RT acknowledgement -->
          <div class="text-center w-48">
            <p class="text-[10px] text-neutral-500 print:text-neutral-500 mb-1">
              Mengetahui,
            </p>
            <p class="font-semibold text-xs mb-14">
              Ketua RT 01
            </p>
            <p class="font-bold text-xs">
              {{ settings?.ketua_rt || '..........................' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@media print {
  /* Override backgrounds & colors */
  body,
  .min-h-screen,
  #printable-area {
    background-color: white !important;
    background-image: none !important;
    color: black !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .print\:hidden {
    display: none !important;
  }

  @page {
    size: A4 portrait;
    margin: 1.5cm 1.2cm;
  }

  .avoid-break {
    page-break-inside: avoid;
  }
}
</style>

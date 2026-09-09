<script setup lang="ts">
definePageMeta({
  layout: false,
  colorMode: 'light'
})

useSeoMeta({
  title: 'Cetak Laporan Iuran Warga',
  robots: 'noindex'
})

interface ContributionType {
  id: number
  name: string
  description: string | null
}

interface ContributionPeriod {
  id: number
  contribution_type_id: number
  month: number
  year: number
  amount_per_resident: number
}

interface ContributionPayment {
  id: number
  resident_id: number
  name: string
  block: string
  house_number: string
  coordinator_name: string
  amount_paid: number
  payment_status: 'PAID' | 'UNPAID'
  paid_at: string | null
}

interface Coordinator {
  id: number
  name: string
  managed_blocks: string
}

interface AppSettings {
  ketua_rt: string
  bendahara: string[]
  kontak_admin: string
}

interface ResidentPivotData {
  id: number
  name: string
  block: string
  house_number: string
  coordinator_name: string
  payments: Record<number, { status: string, amount: number }>
  totalPaid: number
}

const route = useRoute()
const typeId = Number(route.params.id)
const mode = (route.query.mode as string) || 'detail'
const selectedPeriodIds = computed(() => {
  const qPeriods = route.query.periods as string
  if (!qPeriods) return []
  return qPeriods.split(',').map(Number).filter(n => !isNaN(n))
})

const { request } = useApi()

// Loading & error states
const loading = ref(true)
const errorMessage = ref('')

// Data states
const contributionType = ref<ContributionType | null>(null)
const periodsList = ref<ContributionPeriod[]>([])
const coordBlocksMap = ref<Record<string, string>>({})
const residentsMap = ref<Record<number, {
  id: number
  name: string
  block: string
  house_number: string
  coordinator_name: string
  payments: Record<number, { status: string, amount: number }>
  totalPaid: number
}>>({})
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(val)
}

const currentDateText = computed(() => {
  const today = new Date()
  const day = today.getDate()
  const mName = formatMonthName(today.getMonth() + 1)
  const yr = today.getFullYear()
  return `${day} ${mName} ${yr}`
})

// Chronologically sorted list of selected periods
const sortedSelectedPeriods = computed(() => {
  const selected = periodsList.value.filter(p => selectedPeriodIds.value.includes(p.id))
  return selected.sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    return a.month - b.month
  })
})

// Grouped data for Detail Mode (grouped by coordinator)
interface GroupedDetail {
  coordinatorName: string
  managedBlocks: string
  residents: ResidentPivotData[]
}

const groupedDetailData = computed<GroupedDetail[]>(() => {
  const groups: Record<string, GroupedDetail> = {}

  Object.values(residentsMap.value).forEach((res) => {
    const cName = res.coordinator_name || 'Tanpa Koordinator'
    if (!groups[cName]) {
      groups[cName] = {
        coordinatorName: cName,
        managedBlocks: coordBlocksMap.value[cName] || '',
        residents: []
      }
    }
    groups[cName].residents.push(res)
  })

  // Sort residents inside each group alphabetically by name
  Object.values(groups).forEach((g) => {
    g.residents.sort((a, b) => a.name.localeCompare(b.name))
  })

  // Sort groups alphabetically, keeping 'Tanpa Koordinator' at the end
  return Object.values(groups).sort((a, b) => {
    if (a.coordinatorName === 'Tanpa Koordinator') return 1
    if (b.coordinatorName === 'Tanpa Koordinator') return -1
    return a.coordinatorName.localeCompare(b.coordinatorName)
  })
})

// Column totals for Detail Mode
const periodTotalsDetail = computed<Record<number, number>>(() => {
  const totals: Record<number, number> = {}
  sortedSelectedPeriods.value.forEach((p) => {
    totals[p.id] = 0
  })

  Object.values(residentsMap.value).forEach((res) => {
    sortedSelectedPeriods.value.forEach((p) => {
      const pay = res.payments[p.id]
      if (pay && pay.status === 'PAID') {
        totals[p.id] = (totals[p.id] ?? 0) + pay.amount
      }
    })
  })
  return totals
})

const grandTotalDetail = computed(() => {
  return Object.values(periodTotalsDetail.value).reduce((sum, val) => sum + val, 0)
})

// Grouped data for Summary Mode
interface SummaryPeriodData {
  totalAmount: number
  paidKkCount: number
  hasNonDefault: boolean
  breakdownText: string
}

interface GroupedSummary {
  coordinatorName: string
  managedBlocks: string
  periodsData: Record<number, SummaryPeriodData>
  grandTotal: number
}

const groupedSummaryData = computed<GroupedSummary[]>(() => {
  const summaryMap: Record<string, GroupedSummary> = {}

  // Initialize for all active coordinators
  const coordNames = Object.keys(coordBlocksMap.value)
  if (!coordNames.includes('Tanpa Koordinator')) {
    coordNames.push('Tanpa Koordinator')
  }

  coordNames.forEach((cName) => {
    summaryMap[cName] = {
      coordinatorName: cName,
      managedBlocks: coordBlocksMap.value[cName] || '',
      periodsData: {},
      grandTotal: 0
    }
    sortedSelectedPeriods.value.forEach((p) => {
      const groupData = summaryMap[cName]!
      groupData.periodsData[p.id] = {
        totalAmount: 0,
        paidKkCount: 0,
        hasNonDefault: false,
        breakdownText: ''
      }
    })
  })

  // Aggregate paid amounts and KK count
  Object.values(residentsMap.value).forEach((res) => {
    const cName = res.coordinator_name || 'Tanpa Koordinator'
    if (!summaryMap[cName]) {
      summaryMap[cName] = {
        coordinatorName: cName,
        managedBlocks: coordBlocksMap.value[cName] || '',
        periodsData: {},
        grandTotal: 0
      }
    }

    sortedSelectedPeriods.value.forEach((p) => {
      const groupData = summaryMap[cName]!
      if (!groupData.periodsData[p.id]) {
        groupData.periodsData[p.id] = {
          totalAmount: 0,
          paidKkCount: 0,
          hasNonDefault: false,
          breakdownText: ''
        }
      }

      const payInfo = res.payments[p.id]
      if (payInfo && payInfo.status === 'PAID') {
        const pData = groupData.periodsData[p.id]!
        pData.totalAmount += payInfo.amount
        pData.paidKkCount += 1
        groupData.grandTotal += payInfo.amount
      }
    })
  })

  // Format custom non-default payment breakdowns
  sortedSelectedPeriods.value.forEach((p) => {
    const defaultAmount = Number(p.amount_per_resident)

    Object.keys(summaryMap).forEach((cName) => {
      const amountGroups: Record<number, number> = {}
      let hasNonDefault = false

      Object.values(residentsMap.value).forEach((res) => {
        if ((res.coordinator_name || 'Tanpa Koordinator') === cName) {
          const payInfo = res.payments[p.id]
          if (payInfo && payInfo.status === 'PAID') {
            const amt = payInfo.amount
            amountGroups[amt] = (amountGroups[amt] || 0) + 1
            if (amt !== defaultAmount) {
              hasNonDefault = true
            }
          }
        }
      })

      const breakdownParts = Object.entries(amountGroups)
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([amtStr, count]) => {
          return `${count} KK @ ${formatRupiah(Number(amtStr))}`
        })

      const groupData = summaryMap[cName]!
      const pData = groupData.periodsData[p.id]
      if (pData) {
        pData.hasNonDefault = hasNonDefault
        pData.breakdownText = breakdownParts.join(', ')
      }
    })
  })

  // Sort groups, placing 'Tanpa Koordinator' at the end
  return Object.values(summaryMap).sort((a, b) => {
    if (a.coordinatorName === 'Tanpa Koordinator') return 1
    if (b.coordinatorName === 'Tanpa Koordinator') return -1
    return a.coordinatorName.localeCompare(b.coordinatorName)
  })
})

// Column totals for Summary Mode
const periodTotalsSummary = computed<Record<number, number>>(() => {
  const totals: Record<number, number> = {}
  sortedSelectedPeriods.value.forEach((p) => {
    totals[p.id] = 0
  })

  groupedSummaryData.value.forEach((item) => {
    sortedSelectedPeriods.value.forEach((p) => {
      const data = item.periodsData[p.id]
      if (data) {
        totals[p.id] = (totals[p.id] ?? 0) + data.totalAmount
      }
    })
  })
  return totals
})

const grandTotalSummary = computed(() => {
  return Object.values(periodTotalsSummary.value).reduce((sum, val) => sum + val, 0)
})

// Fetch all resources
onMounted(async () => {
  if (!typeId || selectedPeriodIds.value.length === 0) {
    errorMessage.value = 'Parameter jenis iuran atau periode cetak tidak valid.'
    loading.value = false
    return
  }

  try {
    // 1. Fetch all contribution types and find active one
    const typesRes = await request<ContributionType[]>('/contribution-types')
    const foundType = typesRes.data.find(t => t.id === typeId)
    if (!foundType) {
      errorMessage.value = 'Jenis iuran tidak ditemukan.'
      loading.value = false
      return
    }
    contributionType.value = foundType

    // 2. Fetch all coordinators
    const coordsRes = await request<Coordinator[]>('/coordinators')
    coordsRes.data.forEach((c) => {
      coordBlocksMap.value[c.name] = c.managed_blocks
    })

    // 3. Fetch all periods for this type
    const periodsRes = await request<ContributionPeriod[]>(`/contribution-types/${typeId}/periods`)
    periodsList.value = periodsRes.data

    // Verify all requested periodIds actually exist in database
    const allPeriodIds = periodsList.value.map(p => p.id)
    const isValidRequest = selectedPeriodIds.value.every(id => allPeriodIds.includes(id))
    if (!isValidRequest) {
      errorMessage.value = 'Satu atau beberapa periode cetak iuran tidak ditemukan.'
      loading.value = false
      return
    }

    // 4. Fetch payments for each selected period in parallel
    const paymentsPromises = selectedPeriodIds.value.map((pid) => {
      return request<ContributionPayment[]>(`/contribution-periods/${pid}/payments`)
    })
    const paymentsResults = await Promise.all(paymentsPromises)

    // Map period payments to their corresponding period IDs
    const periodPaymentsMap: Record<number, ContributionPayment[]> = {}
    selectedPeriodIds.value.forEach((pid, index) => {
      periodPaymentsMap[pid] = paymentsResults[index]?.data || []
    })

    // Build residents payment pivot mapping
    const tempMap: Record<number, ResidentPivotData> = {}

    sortedSelectedPeriods.value.forEach((p) => {
      const payments = periodPaymentsMap[p.id] || []
      payments.forEach((pay) => {
        const rId = pay.resident_id
        if (!tempMap[rId]) {
          tempMap[rId] = {
            id: rId,
            name: pay.name,
            block: pay.block,
            house_number: pay.house_number,
            coordinator_name: pay.coordinator_name,
            payments: {},
            totalPaid: 0
          }
        }
        tempMap[rId].payments[p.id] = {
          status: pay.payment_status,
          amount: Number(pay.amount_paid)
        }
        if (pay.payment_status === 'PAID') {
          tempMap[rId].totalPaid += Number(pay.amount_paid)
        }
      })
    })
    residentsMap.value = tempMap

    // 5. Fetch Settings for signatures
    const settingsRes = await request<AppSettings>('/settings')
    settings.value = settingsRes.data
  } catch (e) {
    const err = e as { message?: string }
    errorMessage.value = err.message || 'Gagal memuat data laporan iuran.'
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
        Gagal Mencetak Laporan Iuran
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
        Mempersiapkan dokumen iuran...
      </p>
    </div>

    <!-- Report Document -->
    <div
      v-else-if="contributionType && sortedSelectedPeriods.length > 0"
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
            {{ contributionType.name }}
          </h1>
          <h2 class="text-base font-bold uppercase tracking-wide leading-none mt-1">
            RT 01 RW 021 • Perumahan Griya Family 2
          </h2>
          <h3 class="text-xs uppercase mt-1 leading-normal font-semibold text-neutral-800 print:text-black">
            Kecamatan Klapanunggal • Kabupaten Bogor
          </h3>
          <p class="text-xs text-black print:text-black italic mt-0.5">
            Jl. Raya Kelapa Nunggal, Kp.Cibeber, Ds.Cikahuripan, Kec.Kelapa Nunggal, Kab.Bogor - 16710
          </p>
        </div>
      </div>

      <!-- Detail Mode Table -->
      <div
        v-if="mode === 'detail'"
        class="overflow-x-auto flex-1"
      >
        <table class="w-full text-xs text-black border-collapse border border-black">
          <thead>
            <tr class="bg-neutral-100 print:bg-neutral-100 font-bold border-b border-black">
              <th class="border border-black py-1.5 px-2 text-center w-12">
                No
              </th>
              <th class="border border-black py-1.5 px-2 text-left">
                Nama Warga
              </th>
              <th class="border border-black py-1.5 px-2 text-center w-24">
                Blok & No
              </th>
              <th
                v-for="p in sortedSelectedPeriods"
                :key="p.id"
                class="border border-black py-1.5 px-2 text-right w-28"
              >
                {{ formatMonthName(p.month) }} {{ p.year }}
              </th>
              <th class="border border-black py-1.5 px-2 text-right w-28">
                Total Bayar
              </th>
            </tr>
          </thead>
          <tbody>
            <template
              v-for="group in groupedDetailData"
              :key="group.coordinatorName"
            >
              <!-- Coordinator Header Row -->
              <tr class="bg-neutral-50 print:bg-neutral-50 font-bold border-b border-black">
                <td
                  class="border border-black py-1.5 px-2 text-neutral-800 font-bold"
                  :colspan="4 + sortedSelectedPeriods.length"
                >
                  Koordinator: {{ group.coordinatorName }}
                  <span
                    v-if="group.managedBlocks"
                    class="font-normal text-[10px] text-neutral-600 print:text-neutral-700 ml-1.5"
                  >
                    (Wilayah: {{ group.managedBlocks }})
                  </span>
                </td>
              </tr>

              <!-- Residents list -->
              <tr
                v-for="(res, resIdx) in group.residents"
                :key="res.id"
                class="border-b border-black hover:bg-neutral-50/50 print:hover:bg-transparent"
              >
                <td class="border border-black py-1 px-2 text-center">
                  {{ resIdx + 1 }}
                </td>
                <td class="border border-black py-1 px-2 font-medium">
                  {{ res.name }}
                </td>
                <td class="border border-black py-1 px-2 text-center">
                  {{ res.block }} / {{ res.house_number }}
                </td>
                <!-- Payments for each selected period -->
                <td
                  v-for="p in sortedSelectedPeriods"
                  :key="p.id"
                  class="border border-black py-1 px-2 text-right"
                >
                  {{ res.payments[p.id]?.status === 'PAID' ? formatRupiah(res.payments[p.id]?.amount ?? 0) : '-' }}
                </td>
                <!-- Total paid across selected periods -->
                <td class="border border-black py-1 px-2 text-right font-bold">
                  {{ formatRupiah(res.totalPaid) }}
                </td>
              </tr>
            </template>

            <!-- Table Footer Totals -->
            <tr class="font-bold border-t-2 border-black bg-neutral-100 print:bg-neutral-100">
              <td
                class="border border-black py-1.5 px-2 text-left"
                colspan="3"
              >
                TOTAL PENDAPATAN IURAN
              </td>
              <td
                v-for="p in sortedSelectedPeriods"
                :key="p.id"
                class="border border-black py-1.5 px-2 text-right"
              >
                {{ formatRupiah(periodTotalsDetail[p.id] || 0) }}
              </td>
              <td class="border border-black py-1.5 px-2 text-right text-sm">
                {{ formatRupiah(grandTotalDetail) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary Mode Table -->
      <div
        v-else-if="mode === 'summary'"
        class="overflow-x-auto flex-1"
      >
        <table class="w-full text-xs text-black border-collapse border border-black">
          <thead>
            <tr class="bg-neutral-100 print:bg-neutral-100 font-bold border-b border-black">
              <th class="border border-black py-1.5 px-2 text-center w-12">
                No
              </th>
              <th class="border border-black py-1.5 px-2 text-left">
                Koordinator
              </th>
              <th class="border border-black py-1.5 px-2 text-left w-36">
                Wilayah (Blok)
              </th>
              <th
                v-for="p in sortedSelectedPeriods"
                :key="p.id"
                class="border border-black py-1.5 px-2 text-right w-44"
              >
                {{ formatMonthName(p.month) }} {{ p.year }}
              </th>
              <th class="border border-black py-1.5 px-2 text-right w-36">
                Total Setoran
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, idx) in groupedSummaryData"
              :key="item.coordinatorName"
              class="border-b border-black hover:bg-neutral-50/50 print:hover:bg-transparent"
            >
              <td class="border border-black py-1.5 px-2 text-center">
                {{ idx + 1 }}
              </td>
              <td class="border border-black py-1.5 px-2 font-bold">
                {{ item.coordinatorName }}
              </td>
              <td class="border border-black py-1.5 px-2 text-gray-700 print:text-black">
                {{ item.managedBlocks || '-' }}
              </td>
              <!-- Periods data -->
              <td
                v-for="p in sortedSelectedPeriods"
                :key="p.id"
                class="border border-black py-1.5 px-2 text-right"
              >
                <div class="font-bold">
                  {{ formatRupiah(item.periodsData[p.id]?.totalAmount || 0) }}
                </div>
                <div class="text-[9px] text-neutral-600">
                  ({{ item.periodsData[p.id]?.paidKkCount || 0 }} KK)
                </div>
                <!-- Non-default details breakdown note -->
                <div
                  v-if="item.periodsData[p.id]?.hasNonDefault"
                  class="text-[8px] text-amber-700 italic mt-0.5 leading-none"
                >
                  Detail: {{ item.periodsData[p.id]?.breakdownText }}
                </div>
              </td>
              <!-- Grand total per coordinator -->
              <td class="border border-black py-1.5 px-2 text-right font-bold text-sm">
                {{ formatRupiah(item.grandTotal) }}
              </td>
            </tr>

            <!-- Table Footer Totals -->
            <tr class="font-bold border-t-2 border-black bg-neutral-100 print:bg-neutral-100">
              <td
                class="border border-black py-1.5 px-2 text-left"
                colspan="3"
              >
                TOTAL PENDAPATAN IURAN
              </td>
              <td
                v-for="p in sortedSelectedPeriods"
                :key="p.id"
                class="border border-black py-1.5 px-2 text-right"
              >
                {{ formatRupiah(periodTotalsSummary[p.id] || 0) }}
              </td>
              <td class="border border-black py-1.5 px-2 text-right text-sm">
                {{ formatRupiah(grandTotalSummary) }}
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

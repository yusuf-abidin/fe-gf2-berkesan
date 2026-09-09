<script setup lang="ts">
import { contributionPeriodSchema, type ContributionPeriodForm } from '~/utils/validator/contribution-period.schema'
import type { ContributionType, ContributionPeriod, ContributionPayment } from '~/types/contribution'
import type { Coordinator } from '~/types/coordinator'
import AppConfirmModal from '~/components/AppConfirmModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

const route = useRoute()
const typeId = Number(route.params.id)

const { request } = useApi()
const toast = useToast()

// 1. Fetch Contribution Type Details (by finding in all types)
const { data: typesResponse } = useCustomFetch<ContributionType[]>('/contribution-types')
const currentType = computed(() => {
  return typesResponse.value?.data?.find(t => t.id === typeId) || null
})

const title = computed(() => {
  const typeName = currentType.value?.name
  return typeName ? `${typeName} - Admin Panel` : 'Detail Iuran - Admin Panel'
})

useSeoMeta({
  title
})

// 2. Fetch Periods for this Contribution Type
const { data: periodsResponse, refresh: refreshPeriods, pending: periodsPending } = useCustomFetch<ContributionPeriod[]>(
  `/contribution-types/${typeId}/periods`
)

const selectedPeriodId = useState<number | null>(`selected-contrib-period-${typeId}`, () => null)

// Watch periods to auto-select the latest one
watch(() => periodsResponse.value?.data, (newPeriods) => {
  if (newPeriods && newPeriods.length > 0) {
    if (!selectedPeriodId.value || !newPeriods.some(p => p.id === selectedPeriodId.value)) {
      selectedPeriodId.value = newPeriods[0]?.id || null
    }
  } else {
    selectedPeriodId.value = null
  }
}, { immediate: true })

const activePeriod = computed(() => {
  return periodsResponse.value?.data?.find(p => p.id === selectedPeriodId.value) || null
})

interface PaymentsApiResponse {
  success: boolean
  message: string
  data: ContributionPayment[]
  summary: {
    total_paid_amount: number
    total_paid_residents: number
    total_unpaid_residents: number
  }
}

// 3. Fetch Payments & Summary for active period
const { data: paymentsResponse, pending: paymentsPending, refresh: refreshPayments } = useCustomFetch<ContributionPayment[]>(
  () => selectedPeriodId.value ? `/contribution-periods/${selectedPeriodId.value}/payments` : null,
  { watch: [selectedPeriodId] }
)

const paymentsSummary = computed(() => {
  const resp = paymentsResponse.value as unknown as PaymentsApiResponse | null
  return resp?.summary || { total_paid_amount: 0, total_paid_residents: 0, total_unpaid_residents: 0 }
})

// 4. Fetch Coordinators for filter options
const { data: coordinatorsResponse } = useCustomFetch<Coordinator[]>('/coordinators')

// Search & Filter state
const searchName = ref('')
const filterStatus = ref<'ALL' | 'PAID' | 'UNPAID'>('ALL')
const filterCoordinator = ref<string>('ALL')

// Filtered payments list
const filteredPayments = computed<ContributionPayment[]>(() => {
  if (!paymentsResponse.value?.data) return []

  return paymentsResponse.value.data.filter((p: ContributionPayment) => {
    const matchName = p.name.toLowerCase().includes(searchName.value.toLowerCase())

    const matchStatus = filterStatus.value === 'ALL'
      || (filterStatus.value === 'PAID' && p.payment_status === 'PAID')
      || (filterStatus.value === 'UNPAID' && p.payment_status === 'UNPAID')

    const matchCoord = filterCoordinator.value === 'ALL'
      || (filterCoordinator.value === 'NONE' && p.coordinator_name === 'Tanpa Koordinator')
      || (p.coordinator_name === filterCoordinator.value)

    return matchName && matchStatus && matchCoord
  })
})

// Add Period Dialog Setup
const isPeriodModalOpen = ref(false)
const currentYear = new Date().getFullYear()
const { form: periodForm, loading: periodLoading, fieldErrors: periodErrors, handleSubmit: handlePeriodSubmit } = useForm<ContributionPeriodForm>({
  month: new Date().getMonth() + 1,
  year: currentYear,
  amount_per_resident: 50000
})

watch(isPeriodModalOpen, (isOpen) => {
  if (isOpen) {
    periodForm.month = new Date().getMonth() + 1
    periodForm.year = currentYear
    periodForm.amount_per_resident = 50000
  }
})

const onAddPeriod = handlePeriodSubmit(async () => {
  const res = await request(`/contribution-types/${typeId}/periods`, {
    method: 'POST',
    body: periodForm
  })

  toast.add({ title: 'Berhasil', description: res.message, color: 'success' })
  isPeriodModalOpen.value = false
  await refreshPeriods()
})

// Delete Period Dialog Setup
const isDeletePeriodOpen = ref(false)
const isDeletingPeriod = ref(false)

const handleDeletePeriod = async () => {
  if (!selectedPeriodId.value) return
  isDeletingPeriod.value = true
  try {
    await request(`/contribution-periods/${selectedPeriodId.value}`, {
      method: 'DELETE'
    })
    toast.add({ title: 'Berhasil', description: 'Periode iuran berhasil dihapus.', color: 'success' })
    selectedPeriodId.value = null
    isDeletePeriodOpen.value = false
    await refreshPeriods()
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Error', description: err.message || 'Gagal menghapus periode iuran', color: 'error' })
  } finally {
    isDeletingPeriod.value = false
  }
}

// Payment Actions Setup
const updatingPaymentId = ref<number | null>(null)

const togglePaymentStatus = async (payment: ContributionPayment) => {
  updatingPaymentId.value = payment.id
  try {
    const nextStatus = payment.payment_status === 'PAID' ? 'UNPAID' : 'PAID'
    const payload = { payment_status: nextStatus }

    await request(`/contribution-payments/${payment.id}`, {
      method: 'PATCH',
      body: payload
    })

    toast.add({
      title: 'Berhasil',
      description: `Pembayaran ${payment.name} berhasil diubah menjadi ${nextStatus === 'PAID' ? 'Lunas' : 'Belum Lunas'}.`,
      color: 'success'
    })
    await refreshPayments()
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Error', description: err.message || 'Gagal mengubah status bayar', color: 'error' })
  } finally {
    updatingPaymentId.value = null
  }
}

// Edit Custom Payment Amount Dialog Setup
const isAmountModalOpen = ref(false)
const editingPayment = ref<ContributionPayment | null>(null)
const customAmount = ref(0)
const savingAmount = ref(false)

const openAmountModal = (payment: ContributionPayment) => {
  editingPayment.value = payment
  customAmount.value = payment.payment_status === 'PAID' ? Number(payment.amount_paid) : (activePeriod.value?.amount_per_resident || 0)
  isAmountModalOpen.value = true
}

const saveCustomAmount = async () => {
  if (!editingPayment.value) return
  savingAmount.value = true
  try {
    await request(`/contribution-payments/${editingPayment.value.id}`, {
      method: 'PATCH',
      body: {
        payment_status: 'PAID',
        amount_paid: customAmount.value
      }
    })
    toast.add({ title: 'Berhasil', description: `Jumlah pembayaran untuk ${editingPayment.value.name} telah disesuaikan.`, color: 'success' })
    isAmountModalOpen.value = false
    await refreshPayments()
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Error', description: err.message || 'Gagal menyesuaikan nominal', color: 'error' })
  } finally {
    savingAmount.value = false
  }
}

// Formatting helpers
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

const periodOptions = computed(() => {
  return periodsResponse.value?.data?.map(p => ({
    label: `${getMonthName(p.month)} ${p.year} (${formatRupiah(p.amount_per_resident)})`,
    value: String(p.id)
  })) || []
})

const selectedPeriodStr = computed({
  get: () => selectedPeriodId.value ? String(selectedPeriodId.value) : '',
  set: (val) => {
    selectedPeriodId.value = val ? Number(val) : null
  }
})

const monthOptions = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 }
]

const yearOptions = computed(() => {
  const years = []
  for (let y = currentYear - 3; y <= currentYear + 3; y++) {
    years.push({ label: String(y), value: y })
  }
  return years
})

const coordinatorOptions = computed(() => {
  const coords = [
    { label: 'Semua Koordinator', value: 'ALL' },
    { label: 'Tanpa Koordinator', value: 'NONE' }
  ]
  if (coordinatorsResponse.value?.data) {
    coordinatorsResponse.value.data.forEach((c) => {
      coords.push({ label: c.name, value: c.name })
    })
  }
  return coords
})

const statusOptions = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Lunas', value: 'PAID' },
  { label: 'Belum Lunas', value: 'UNPAID' }
]

const isPrintModalOpen = ref(false)
const printMode = ref<'detail' | 'summary'>('detail')
const selectedPrintPeriods = ref<number[]>([])

const openPrintModal = () => {
  printMode.value = 'detail'
  if (selectedPeriodId.value) {
    selectedPrintPeriods.value = [selectedPeriodId.value]
  } else {
    selectedPrintPeriods.value = []
  }
  isPrintModalOpen.value = true
}

const togglePeriodSelection = (periodId: number) => {
  const idx = selectedPrintPeriods.value.indexOf(periodId)
  if (idx > -1) {
    selectedPrintPeriods.value.splice(idx, 1)
  } else {
    selectedPrintPeriods.value.push(periodId)
  }
}

const isPeriodSelected = (periodId: number) => {
  return selectedPrintPeriods.value.includes(periodId)
}

const toggleSelectAllPrintPeriods = () => {
  const allIds = periodsResponse.value?.data?.map(p => p.id) || []
  if (selectedPrintPeriods.value.length === allIds.length) {
    selectedPrintPeriods.value = []
  } else {
    selectedPrintPeriods.value = [...allIds]
  }
}

const triggerPrint = () => {
  if (selectedPrintPeriods.value.length === 0) {
    toast.add({ title: 'Peringatan', description: 'Silakan pilih minimal satu periode.', color: 'warning' })
    return
  }
  const url = `/print/contributions/${typeId}?periods=${selectedPrintPeriods.value.join(',')}&mode=${printMode.value}`
  window.open(url, '_blank')
  isPrintModalOpen.value = false
}

const columns = [
  { accessorKey: 'name', header: 'Nama Warga' },
  { accessorKey: 'block', header: 'Blok/No' },
  { accessorKey: 'coordinator_name', header: 'Koordinator' },
  { accessorKey: 'amount_paid', header: 'Jumlah Bayar' },
  { accessorKey: 'payment_status', header: 'Status' },
  { id: 'actions', header: '' }
]
</script>

<template>
  <div class="space-y-6">
    <!-- Header with back button & description -->
    <div>
      <UButton
        to="/admin/contributions"
        icon="i-lucide-arrow-left"
        label="Kembali ke Daftar Iuran"
        variant="ghost"
        color="neutral"
        size="sm"
        class="-ml-2 mb-2"
      />

      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ currentType?.name }}
          </h1>
          <p class="text-gray-500 dark:text-neutral-400 mt-1">
            {{ currentType?.description || 'Pembukuan pembayaran iuran periodik warga.' }}
          </p>
        </div>

        <!-- Period Selection Bar -->
        <div class="flex items-center gap-3 bg-gray-50 dark:bg-neutral-900 p-2 rounded-lg border border-gray-100 dark:border-neutral-800">
          <template v-if="periodOptions.length > 0">
            <USelect
              v-model="selectedPeriodStr"
              :items="periodOptions"
              value-key="value"
              class="w-56"
              size="sm"
            />

            <!-- Delete Active Period -->
            <UButton
              v-if="activePeriod"
              icon="i-lucide-trash"
              color="error"
              variant="ghost"
              size="sm"
              title="Hapus Periode Iuran Ini"
              @click="isDeletePeriodOpen = true"
            />

            <!-- Cetak Laporan PDF -->
            <UButton
              v-if="activePeriod"
              icon="i-lucide-printer"
              color="neutral"
              variant="ghost"
              size="sm"
              title="Cetak Laporan Iuran"
              @click="openPrintModal"
            />
          </template>

          <UButton
            icon="i-lucide-calendar-plus"
            label="Tambah Periode"
            size="sm"
            color="primary"
            @click="isPeriodModalOpen = true"
          />
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="(periodsPending && !periodsResponse?.data) || (selectedPeriodId && paymentsPending && !paymentsResponse?.data)"
      class="space-y-6"
    >
      <!-- Summary Statistics cards skeleton -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UCard
          v-for="i in 3"
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

      <!-- Filters & Resident Table skeleton -->
      <UCard>
        <div class="space-y-4">
          <!-- Filter Controls skeleton -->
          <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div class="flex flex-wrap gap-3 items-center w-full md:w-auto">
              <USkeleton class="h-9 w-full md:w-60" />
              <USkeleton class="h-9 w-full md:w-40" />
              <USkeleton class="h-9 w-full md:w-48" />
            </div>
            <USkeleton class="h-6 w-32" />
          </div>

          <!-- Payments Table skeleton -->
          <div class="space-y-3">
            <USkeleton
              v-for="i in 5"
              :key="i"
              class="h-10 w-full"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Active Period Payments Details -->
    <div
      v-else-if="!selectedPeriodId"
      class="text-center py-20 bg-white dark:bg-neutral-900 border border-dashed border-gray-250 dark:border-neutral-800 rounded-xl"
    >
      <UIcon
        name="i-lucide-calendar"
        class="size-16 text-gray-300 mx-auto mb-4"
      />
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
        Belum Ada Periode Pembayaran
      </h3>
      <p class="text-gray-500 max-w-sm mx-auto mb-6 text-sm">
        Buat periode pembayaran (bulan & tahun) untuk jenis iuran ini untuk mulai mencatatkan pembayaran warga.
      </p>
      <UButton
        icon="i-lucide-calendar-plus"
        label="Buat Periode Pembayaran Pertama"
        @click="isPeriodModalOpen = true"
      />
    </div>

    <template v-else>
      <!-- Summary Statistics cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Total Collected -->
        <UCard class="relative overflow-hidden border border-emerald-100 dark:border-emerald-950/30">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Dana Terkumpul
              </p>
              <h3 class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {{ formatRupiah(paymentsSummary.total_paid_amount) }}
              </h3>
            </div>
            <div class="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <UIcon
                name="i-lucide-hand-coins"
                class="size-6"
              />
            </div>
          </div>
        </UCard>

        <!-- Total Paid Residents -->
        <UCard class="relative overflow-hidden border border-indigo-100 dark:border-indigo-950/30">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Warga Lunas
              </p>
              <h3 class="text-2xl font-bold text-indigo-650 dark:text-indigo-400 mt-1">
                {{ paymentsSummary.total_paid_residents }} Warga
              </h3>
            </div>
            <div class="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <UIcon
                name="i-lucide-user-check"
                class="size-6"
              />
            </div>
          </div>
        </UCard>

        <!-- Total Unpaid Residents -->
        <UCard class="relative overflow-hidden border border-rose-100 dark:border-rose-950/30">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Warga Belum Lunas
              </p>
              <h3 class="text-2xl font-bold text-rose-650 dark:text-rose-400 mt-1">
                {{ paymentsSummary.total_unpaid_residents }} Warga
              </h3>
            </div>
            <div class="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg">
              <UIcon
                name="i-lucide-user-x"
                class="size-6"
              />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Filters & Resident Table -->
      <UCard>
        <div class="space-y-4">
          <!-- Filter Controls -->
          <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
            <!-- Search & Filters -->
            <div class="flex flex-wrap gap-3 items-center w-full md:w-auto">
              <UInput
                v-model="searchName"
                placeholder="Cari nama warga..."
                icon="i-lucide-search"
                class="w-full md:w-60"
              />

              <USelect
                v-model="filterStatus"
                :items="statusOptions"
                value-key="value"
                class="w-full md:w-40"
              />

              <USelect
                v-model="filterCoordinator"
                :items="coordinatorOptions"
                value-key="value"
                class="w-full md:w-48"
              />
            </div>

            <!-- Total display -->
            <span class="text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-neutral-800 border border-gray-150 dark:border-neutral-750 px-2.5 py-1.5 rounded-full">
              Menampilkan {{ filteredPayments.length }} Warga
            </span>
          </div>

          <!-- Payments Table -->
          <UTable
            :data="filteredPayments"
            :columns="columns"
            :loading="paymentsPending"
            class="w-full"
          >
            <!-- Block & No Cell -->
            <template #block-cell="{ row }">
              <span class="font-medium text-gray-900 dark:text-white">
                {{ row.original.block }}{{ row.original.house_number ? '/' + row.original.house_number : '' }}
              </span>
            </template>

            <!-- Coordinator Cell -->
            <template #coordinator_name-cell="{ row }">
              <span
                class="text-xs font-semibold px-2 py-0.5 rounded-full"
                :class="row.original.coordinator_name === 'Tanpa Koordinator' ? 'bg-gray-100 dark:bg-neutral-850 text-gray-500' : 'bg-primary-50 dark:bg-primary-950/20 text-primary-650 dark:text-primary-400'"
              >
                {{ row.original.coordinator_name }}
              </span>
            </template>

            <!-- Amount Paid Cell -->
            <template #amount_paid-cell="{ row }">
              <span
                class="font-semibold text-sm"
                :class="row.original.payment_status === 'PAID' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-neutral-550'"
              >
                {{ formatRupiah(row.original.amount_paid) }}
              </span>
            </template>

            <!-- Status Cell -->
            <template #payment_status-cell="{ row }">
              <UButton
                :label="row.original.payment_status === 'PAID' ? 'Lunas' : 'Belum Lunas'"
                :color="row.original.payment_status === 'PAID' ? 'success' : 'neutral'"
                variant="subtle"
                size="sm"
                :loading="updatingPaymentId === row.original.id"
                class="min-w-[90px] justify-center cursor-pointer hover:shadow-sm"
                @click="togglePaymentStatus(row.original)"
              />
            </template>

            <!-- Actions Cell -->
            <template #actions-cell="{ row }">
              <div class="flex justify-end gap-1 px-4">
                <!-- Custom Amount Adjust Button -->
                <UButton
                  icon="i-lucide-pencil-ruler"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  title="Sesuaikan Nominal"
                  :disabled="updatingPaymentId !== null"
                  @click="openAmountModal(row.original)"
                />
              </div>
            </template>

            <template #empty>
              <div class="text-center py-10">
                <UIcon
                  name="i-lucide-users"
                  class="size-10 text-gray-300 mx-auto mb-3"
                />
                <p class="text-gray-500 text-sm">
                  Warga tidak ditemukan untuk filter ini.
                </p>
              </div>
            </template>
          </UTable>
        </div>
      </UCard>
    </template>

    <!-- Create Period Modal -->
    <UModal
      v-model:open="isPeriodModalOpen"
      title="Buat Periode Pembayaran"
      description="Tentukan bulan, tahun, dan nominal tagihan iuran per warga."
    >
      <template #body>
        <UForm
          :schema="contributionPeriodSchema"
          :state="periodForm"
          class="space-y-4"
          @submit="onAddPeriod"
        >
          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Bulan"
              name="month"
              :error="periodErrors.month?.[0]"
              required
            >
              <USelect
                v-model="periodForm.month"
                :items="monthOptions"
                value-key="value"
                class="w-full"
                :disabled="periodLoading"
              />
            </UFormField>

            <UFormField
              label="Tahun"
              name="year"
              :error="periodErrors.year?.[0]"
              required
            >
              <USelect
                v-model="periodForm.year"
                :items="yearOptions"
                value-key="value"
                class="w-full"
                :disabled="periodLoading"
              />
            </UFormField>
          </div>

          <UFormField
            label="Nominal Tagihan Warga (Rupiah)"
            name="amount_per_resident"
            :error="periodErrors.amount_per_resident?.[0]"
            required
          >
            <UInputNumber
              v-model="periodForm.amount_per_resident"
              :min="0"
              placeholder="Jumlah (contoh: 50000)"
              class="w-full"
              :disabled="periodLoading"
            />
          </UFormField>

          <div class="flex justify-end gap-3 mt-6">
            <UButton
              label="Batal"
              color="neutral"
              variant="ghost"
              @click="isPeriodModalOpen = false"
            />
            <UButton
              type="submit"
              label="Generate Periode"
              :loading="periodLoading"
            />
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Delete Period Confirm -->
    <AppConfirmModal
      v-model="isDeletePeriodOpen"
      title="Hapus Periode Iuran"
      description="Apakah Anda yakin ingin menghapus periode iuran ini? Seluruh catatan pembayaran warga dan sinkronisasi transaksi pada periode ini akan dihapus secara permanen!"
      confirm-label="Hapus Periode"
      :loading="isDeletingPeriod"
      @confirm="handleDeletePeriod"
    />

    <!-- Adjust Payment Amount Modal -->
    <UModal
      v-model:open="isAmountModalOpen"
      title="Sesuaikan Pembayaran Warga"
      :description="`Ubah nominal pembayaran untuk warga '${editingPayment?.name}' secara manual.`"
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Jumlah Nominal Bayar (Rupiah)"
            required
          >
            <UInputNumber
              v-model="customAmount"
              :min="0"
              placeholder="Jumlah Bayar"
              class="w-full"
              :disabled="savingAmount"
            />
          </UFormField>

          <div class="flex justify-end gap-3 mt-6">
            <UButton
              label="Batal"
              color="neutral"
              variant="ghost"
              @click="isAmountModalOpen = false"
            />
            <UButton
              label="Simpan Pembayaran"
              color="primary"
              :loading="savingAmount"
              @click="saveCustomAmount"
            />
          </div>
        </div>
      </template>
    </UModal>

    <!-- Print Report Dialog Modal -->
    <UModal
      v-model:open="isPrintModalOpen"
      title="Cetak Laporan Iuran Warga"
      description="Pilih mode laporan dan periode iuran rutin warga yang ingin dicetak."
    >
      <template #body>
        <div class="space-y-6">
          <!-- 1. Mode Cetak -->
          <UFormField
            label="Mode Laporan"
            required
          >
            <USelect
              v-model="printMode"
              :items="[
                { label: 'Detail Catatan Setiap Warga', value: 'detail' },
                { label: 'Ringkasan per Koordinator', value: 'summary' }
              ]"
              value-key="value"
              class="w-full"
            />
          </UFormField>

          <!-- 2. Periode Checkboxes -->
          <UFormField
            label="Pilih Periode Iuran"
            required
          >
            <template #help>
              <div class="flex justify-between items-center mt-1">
                <span>Pilih satu atau beberapa periode untuk dicetak sekaligus.</span>
                <UButton
                  variant="link"
                  color="primary"
                  size="xs"
                  class="p-0 h-auto"
                  @click="toggleSelectAllPrintPeriods"
                >
                  {{ selectedPrintPeriods.length === (periodsResponse?.data || []).length ? 'Hapus Semua Pilihan' : 'Pilih Semua Periode' }}
                </UButton>
              </div>
            </template>
            <div class="max-h-60 overflow-y-auto border border-gray-200 dark:border-neutral-800 rounded-xl p-3 space-y-2 mt-2 custom-scrollbar">
              <div
                v-for="p in periodsResponse?.data || []"
                :key="p.id"
                class="flex items-center gap-2"
              >
                <UCheckbox
                  :model-value="isPeriodSelected(p.id)"
                  :label="`${getMonthName(p.month)} ${p.year} (${formatRupiah(p.amount_per_resident)})`"
                  @update:model-value="togglePeriodSelection(p.id)"
                />
              </div>
              <div
                v-if="!periodsResponse?.data || periodsResponse.data.length === 0"
                class="text-center text-xs text-gray-500 py-4"
              >
                Tidak ada periode iuran yang tersedia.
              </div>
            </div>
          </UFormField>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-neutral-800">
            <UButton
              label="Batal"
              color="neutral"
              variant="ghost"
              @click="isPrintModalOpen = false"
            />
            <UButton
              label="Cetak PDF"
              icon="i-lucide-printer"
              :disabled="selectedPrintPeriods.length === 0"
              @click="triggerPrint"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

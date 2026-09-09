<script setup lang="ts">
import type { Coordinator } from '~/types/coordinator'
import type { Resident } from '~/types/resident'
import CoordinatorModal from '~/components/admin/CoordinatorModal.vue'
import AppConfirmModal from '~/components/AppConfirmModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

useSeoMeta({
  title: 'Kelola Warga - GF2 Berkesan'
})

const { request } = useApi()
const toast = useToast()

// Fetch Coordinators & Residents
const { data: coordinatorsResponse, refresh: refreshCoordinators, pending: pendingCoordinators } = useCustomFetch<Coordinator[]>('/coordinators')
const { data: residentsResponse, refresh: refreshResidents, pending: pendingResidents } = useCustomFetch<Resident[]>('/residents')

const pending = computed(() => pendingCoordinators.value || pendingResidents.value)

const refreshAll = async () => {
  await Promise.all([refreshCoordinators(), refreshResidents()])
}

// -------------------------------------------------------------
// State Management for Inline Edit & Quick Add
// -------------------------------------------------------------

// Quick Add Forms state per coordinator ID ('none' for null/no coordinator)
interface QuickAddForm {
  name: string
  block: string
  house_number: string
  status: string
  phone: string
}

const createEmptyQuickAddForm = (): QuickAddForm => ({
  name: '',
  block: '',
  house_number: '',
  status: 'Tetap',
  phone: ''
})

const quickAddForms = reactive<Record<string, QuickAddForm>>({})

const getQuickAddForm = (coordId: number | null): QuickAddForm => {
  const key = coordId === null ? 'none' : String(coordId)
  if (!quickAddForms[key]) {
    quickAddForms[key] = createEmptyQuickAddForm()
  }
  return quickAddForms[key]
}

// Inline edit state
const editingResidentId = ref<number | null>(null)
const editingForm = reactive({
  coordinator_id: null as number | null,
  name: '',
  block: '',
  house_number: '',
  status: 'Tetap',
  phone: ''
})

const startEdit = (resident: Resident) => {
  editingResidentId.value = resident.id
  editingForm.coordinator_id = resident.coordinator_id
  editingForm.name = resident.name
  editingForm.block = resident.block ?? ''
  editingForm.house_number = resident.house_number ?? ''
  editingForm.status = resident.status ?? 'Tetap'
  editingForm.phone = resident.phone ?? ''
}

const cancelEdit = () => {
  editingResidentId.value = null
}

// -------------------------------------------------------------
// Drag and Drop State & Handlers
// -------------------------------------------------------------
const draggedResident = ref<Resident | null>(null)
const activeDropTarget = ref<number | string | null>(null)
let dragCounter = 0

const onDragStart = (event: DragEvent, resident: Resident) => {
  if ((resident.id as unknown) === 'quick-add') {
    event.preventDefault()
    return
  }
  draggedResident.value = resident
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', String(resident.id))
    event.dataTransfer.effectAllowed = 'move'
  }
  dragCounter = 0
}

const onDragEnd = () => {
  draggedResident.value = null
  activeDropTarget.value = null
  dragCounter = 0
}

const onDragEnter = (coordId: number | null) => {
  dragCounter++
  activeDropTarget.value = coordId === null ? 'none' : coordId
}

const onDragLeave = () => {
  dragCounter--
  if (dragCounter <= 0) {
    activeDropTarget.value = null
  }
}

const onDrop = async (coordId: number | null) => {
  activeDropTarget.value = null
  dragCounter = 0

  if (!draggedResident.value) return

  const resident = draggedResident.value
  draggedResident.value = null // clear state immediately for snappy response

  // If dropped on the same coordinator, do nothing
  if (resident.coordinator_id === coordId) return

  try {
    const payload = {
      coordinator_id: coordId,
      name: resident.name,
      block: resident.block,
      house_number: resident.house_number,
      status: resident.status,
      phone: resident.phone
    }

    await request(`/residents/${resident.id}`, {
      method: 'PATCH',
      body: payload
    })

    toast.add({
      title: 'Berhasil Pindah',
      description: `${resident.name} berhasil dipindahkan ke koordinator baru.`,
      color: 'success'
    })

    await refreshAll()
  } catch {
    // handled by useApi
  }
}

// -------------------------------------------------------------
// API Actions
// -------------------------------------------------------------

const isSavingQuickAdd = ref<Record<string, boolean>>({})
const isSavingEdit = ref(false)

// Focus Quick Add Input
const focusQuickAdd = (coordId: number | null) => {
  const key = coordId === null ? 'none' : String(coordId)
  nextTick(() => {
    const inputEl = document.querySelector(`#input-name-${key}`) as HTMLInputElement | null
    if (inputEl) {
      inputEl.focus()
    }
  })
}

// Submit new resident (Quick Add)
const submitQuickAdd = async (coordId: number | null) => {
  const key = coordId === null ? 'none' : String(coordId)
  const form = getQuickAddForm(coordId)

  if (!form.name.trim()) {
    toast.add({ title: 'Gagal', description: 'Nama warga tidak boleh kosong', color: 'error' })
    return
  }

  // Validate phone if not empty
  if (form.phone.trim()) {
    const phoneRegex = /^(08|628)[1-9][0-9]{6,13}$/
    if (!phoneRegex.test(form.phone.trim())) {
      toast.add({
        title: 'Gagal',
        description: 'Nomor telepon tidak valid (contoh: 08123456789)',
        color: 'error'
      })
      return
    }
  }

  isSavingQuickAdd.value[key] = true
  try {
    const payload = {
      coordinator_id: coordId,
      name: form.name.trim(),
      block: form.block.trim() || null,
      house_number: form.house_number.trim() || null,
      status: form.status || null,
      phone: form.phone.trim() || null
    }

    const res = await request('/residents', {
      method: 'POST',
      body: payload
    })

    toast.add({ title: 'Berhasil', description: res.message, color: 'success' })

    // Reset form
    quickAddForms[key] = createEmptyQuickAddForm()

    // Refresh list
    await refreshAll()

    // Focus again
    focusQuickAdd(coordId)
  } catch {
    // Handled by useApi
  } finally {
    isSavingQuickAdd.value[key] = false
  }
}

// Submit update resident (Inline Edit)
const submitEdit = async () => {
  if (!editingResidentId.value) return

  if (!editingForm.name.trim()) {
    toast.add({ title: 'Gagal', description: 'Nama warga tidak boleh kosong', color: 'error' })
    return
  }

  if (editingForm.phone.trim()) {
    const phoneRegex = /^(08|628)[1-9][0-9]{6,13}$/
    if (!phoneRegex.test(editingForm.phone.trim())) {
      toast.add({
        title: 'Gagal',
        description: 'Nomor telepon tidak valid (contoh: 08123456789)',
        color: 'error'
      })
      return
    }
  }

  isSavingEdit.value = true
  try {
    const payload = {
      coordinator_id: editingForm.coordinator_id,
      name: editingForm.name.trim(),
      block: editingForm.block.trim() || null,
      house_number: editingForm.house_number.trim() || null,
      status: editingForm.status || null,
      phone: editingForm.phone.trim() || null
    }

    const res = await request(`/residents/${editingResidentId.value}`, {
      method: 'PATCH',
      body: payload
    })

    toast.add({ title: 'Berhasil', description: res.message, color: 'success' })
    editingResidentId.value = null
    await refreshAll()
  } catch {
    // Handled by useApi
  } finally {
    isSavingEdit.value = false
  }
}

// Group residents by coordinator & append virtual quick-add row
const groupedResidents = computed(() => {
  const residents = residentsResponse.value?.data || []
  const coordinators = coordinatorsResponse.value?.data || []

  const groups = new Map<number | null, Resident[]>()

  // Initialize groups for all coordinators
  coordinators.forEach((c) => {
    groups.set(c.id, [])
  })
  groups.set(null, [])

  // Distribute residents
  residents.forEach((r) => {
    const cid = r.coordinator_id
    if (cid && groups.has(cid)) {
      groups.get(cid)!.push(r)
    } else {
      groups.get(null)!.push(r)
    }
  })

  // Return formatted array of groups with virtual 'quick-add' row appended to each table
  return [
    ...coordinators.map((c) => {
      const list = groups.get(c.id) || []
      const tableData = [
        ...list,
        {
          id: 'quick-add',
          coordinator_id: c.id,
          name: '',
          block: '',
          house_number: '',
          status: 'Tetap',
          phone: ''
        } as unknown as Resident
      ]
      return {
        coordinator: c,
        residents: tableData
      }
    }),
    {
      coordinator: null,
      residents: [
        ...(groups.get(null) || []),
        {
          id: 'quick-add',
          coordinator_id: null,
          name: '',
          block: '',
          house_number: '',
          status: 'Tetap',
          phone: ''
        } as unknown as Resident
      ]
    }
  ].filter((group) => {
    // Show all coordinators, and show null group only if it has existing residents (excluding the virtual quick-add)
    return group.coordinator !== null || group.residents.length > 1
  })
})

// Modals and confirmation states
const isCoordinatorModalOpen = ref(false)
const isDeleteCoordinatorOpen = ref(false)
const isDeleteResidentOpen = ref(false)

const selectedCoordinator = ref<Coordinator | null>(null)
const selectedResident = ref<Resident | null>(null)

const isDeletingCoordinator = ref(false)
const isDeletingResident = ref(false)

// Actions for Coordinator
const openCreateCoordinator = () => {
  selectedCoordinator.value = null
  isCoordinatorModalOpen.value = true
}

const openEditCoordinator = (coordinator: Coordinator) => {
  selectedCoordinator.value = coordinator
  isCoordinatorModalOpen.value = true
}

const confirmDeleteCoordinator = (coordinator: Coordinator) => {
  selectedCoordinator.value = coordinator
  isDeleteCoordinatorOpen.value = true
}

const deleteCoordinator = async () => {
  if (!selectedCoordinator.value) return
  isDeletingCoordinator.value = true
  try {
    const res = await request(`/coordinators/${selectedCoordinator.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Berhasil', description: res.message, color: 'success' })
    isDeleteCoordinatorOpen.value = false
    await refreshAll()
  } catch {
    // Handled by useApi
  } finally {
    isDeletingCoordinator.value = false
  }
}

// Action for Resident Delete
const confirmDeleteResident = (resident: Resident) => {
  selectedResident.value = resident
  isDeleteResidentOpen.value = true
}

const deleteResident = async () => {
  if (!selectedResident.value) return
  isDeletingResident.value = true
  try {
    const res = await request(`/residents/${selectedResident.value.id}`, { method: 'DELETE' })
    toast.add({ title: 'Berhasil', description: res.message, color: 'success' })
    isDeleteResidentOpen.value = false
    await refreshAll()
  } catch {
    // Handled by useApi
  } finally {
    isDeletingResident.value = false
  }
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'tetap':
      return 'success'
    case 'kontrak':
      return 'warning'
    case 'kosong':
      return 'neutral'
    default:
      return 'neutral'
  }
}

const statusOptions = [
  { label: 'Tetap', value: 'Tetap' },
  { label: 'Kontrak', value: 'Kontrak' },
  { label: 'Kosong / Tidak Dihuni', value: 'Kosong' }
]
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Kelola Data Warga
        </h1>
        <p class="text-gray-500 dark:text-neutral-400 mt-1">
          Manajemen koordinator dan warga. Seret baris warga ke kartu koordinator lain untuk memindahkan.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-user-plus"
          label="Tambah Koordinator"
          color="neutral"
          variant="subtle"
          @click="openCreateCoordinator"
        />
        <UButton
          icon="i-lucide-plus"
          label="Tambah Warga"
          color="primary"
          @click="() => focusQuickAdd(null)"
        />
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-neutral-400">
              Total Warga
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {{ residentsResponse?.data?.length ?? 0 }}
            </p>
          </div>
          <div class="p-3 rounded-full bg-primary/10 text-primary">
            <UIcon
              name="i-lucide-users"
              class="size-6"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-neutral-400">
              Total Koordinator
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {{ coordinatorsResponse?.data?.length ?? 0 }}
            </p>
          </div>
          <div class="p-3 rounded-full bg-indigo-500/10 text-indigo-500">
            <UIcon
              name="i-lucide-user-check"
              class="size-6"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-neutral-400">
              Warga Terkoordinasi
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {{ residentsResponse?.data?.filter(r => r.coordinator_id).length ?? 0 }}
            </p>
          </div>
          <div class="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
            <UIcon
              name="i-lucide-user-cog"
              class="size-6"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-neutral-400">
              Tanpa Koordinator
            </p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {{ residentsResponse?.data?.filter(r => !r.coordinator_id).length ?? 0 }}
            </p>
          </div>
          <div class="p-3 rounded-full bg-amber-500/10 text-amber-500">
            <UIcon
              name="i-lucide-user-minus"
              class="size-6"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Loading Skeleton -->
    <div
      v-if="pending && !residentsResponse?.data"
      class="space-y-4"
    >
      <UCard
        v-for="i in 3"
        :key="i"
        class="p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <div class="space-y-2 w-1/3">
            <USkeleton class="h-5 w-3/4" />
            <USkeleton class="h-4 w-1/2" />
          </div>
          <USkeleton class="h-8 w-24" />
        </div>
        <div class="space-y-2">
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-4 w-3/4" />
        </div>
      </UCard>
    </div>

    <!-- Group List -->
    <div
      v-else
      class="space-y-6"
    >
      <div
        v-if="groupedResidents.length === 0"
        class="text-center py-16 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800"
      >
        <UIcon
          name="i-lucide-users"
          class="size-12 text-gray-300 dark:text-neutral-700 mx-auto mb-4"
        />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Belum Ada Data
        </h3>
        <p class="text-gray-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto">
          Mulai dengan menambahkan koordinator terlebih dahulu.
        </p>
        <div class="flex gap-3 justify-center mt-6">
          <UButton
            label="Tambah Koordinator"
            color="primary"
            @click="openCreateCoordinator"
          />
        </div>
      </div>

      <div
        v-for="group in groupedResidents"
        :key="group.coordinator ? group.coordinator.id : 'none'"
        class="space-y-3"
      >
        <!-- Card acts as Dropzone -->
        <UCard
          :ui="{ body: 'p-0' }"
          class="overflow-hidden border transition-all duration-300 shadow-sm"
          :class="[
            activeDropTarget === (group.coordinator ? group.coordinator.id : 'none')
              ? 'border-primary ring-2 ring-primary/20 scale-[1.01] bg-primary/5 dark:bg-primary/5'
              : 'border-gray-200 dark:border-neutral-800 hover:shadow-md'
          ]"
          @dragover.prevent
          @dragenter.prevent="onDragEnter(group.coordinator ? group.coordinator.id : null)"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop(group.coordinator ? group.coordinator.id : null)"
        >
          <!-- Coordinator Header -->
          <template #header>
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1"
              :class="{ 'pointer-events-none': draggedResident !== null }"
            >
              <div class="flex items-start gap-3">
                <div class="p-2 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 mt-0.5">
                  <UIcon
                    :name="group.coordinator ? 'i-lucide-user-cog' : 'i-lucide-user-minus'"
                    class="size-5"
                  />
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {{ group.coordinator ? group.coordinator.name : 'Tanpa Koordinator' }}
                  </h3>
                  <div class="flex flex-wrap gap-2 mt-1">
                    <UBadge
                      v-if="group.coordinator"
                      color="primary"
                      variant="subtle"
                      size="sm"
                    >
                      Blok Kelolaan: {{ group.coordinator.managed_blocks }}
                    </UBadge>
                    <UBadge
                      v-else
                      color="warning"
                      variant="subtle"
                      size="sm"
                    >
                      Belum Terkelompok
                    </UBadge>
                    <span class="text-xs text-gray-500 dark:text-neutral-400 flex items-center">
                      ({{ group.residents.length - 1 }} Warga)
                    </span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2 self-end sm:self-center">
                <template v-if="group.coordinator">
                  <UButton
                    icon="i-lucide-pencil"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    title="Ubah Koordinator"
                    @click="openEditCoordinator(group.coordinator)"
                  />
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="sm"
                    title="Hapus Koordinator"
                    @click="confirmDeleteCoordinator(group.coordinator)"
                  />
                  <span class="h-4 w-px bg-gray-200 dark:bg-neutral-800 mx-1 hidden sm:inline" />
                </template>
                <UButton
                  icon="i-lucide-plus"
                  label="Tambah Warga"
                  color="primary"
                  variant="subtle"
                  size="sm"
                  @click="focusQuickAdd(group.coordinator ? group.coordinator.id : null)"
                />
              </div>
            </div>
          </template>

          <!-- Residents Table (Native HTML5 Table for Drag and Drop compatibility) -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr
                  class="border-b border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-neutral-400 font-semibold text-xs uppercase bg-gray-50/50 dark:bg-neutral-900/50"
                  :class="{ 'pointer-events-none': draggedResident !== null }"
                >
                  <th class="px-4 py-3 w-10" /> <!-- Drag grip handle -->
                  <th class="px-4 py-3 min-w-[200px]">
                    Nama Warga
                  </th>
                  <th class="px-4 py-3 w-48">
                    Alamat
                  </th>
                  <th class="px-4 py-3 w-36">
                    Status
                  </th>
                  <th class="px-4 py-3 w-44">
                    No. Telepon
                  </th>
                  <th class="px-4 py-3 w-24 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in group.residents"
                  :key="row.id"
                  :draggable="(row.id as unknown) !== 'quick-add'"
                  class="border-b border-gray-100 dark:border-neutral-900 hover:bg-gray-50/30 dark:hover:bg-neutral-900/30 transition-colors group/row"
                  :class="[
                    (row.id as unknown) === 'quick-add' ? 'bg-gray-50/10 dark:bg-neutral-900/10' : '',
                    draggedResident?.id === row.id ? 'opacity-40 bg-gray-100 dark:bg-neutral-800' : ''
                  ]"
                  @dragstart="onDragStart($event, row)"
                  @dragend="onDragEnd"
                >
                  <!-- Grip Handle Column -->
                  <td class="px-4 py-2 text-gray-400 dark:text-neutral-600 align-middle">
                    <span
                      v-if="(row.id as unknown) !== 'quick-add' && row.id !== editingResidentId"
                      class="cursor-grab active:cursor-grabbing hover:text-gray-600 dark:hover:text-neutral-400 flex items-center justify-center"
                      title="Tarik untuk memindahkan koordinator"
                    >
                      <UIcon
                        name="i-lucide-grip-vertical"
                        class="size-4"
                      />
                    </span>
                  </td>

                  <!-- NAME COLUMN -->
                  <td class="px-4 py-2 align-middle">
                    <div :class="{ 'pointer-events-none': draggedResident !== null }">
                      <!-- Quick Add Row -->
                      <template v-if="(row.id as unknown) === 'quick-add'">
                        <UInput
                          :id="`input-name-${group.coordinator ? String(group.coordinator.id) : 'none'}`"
                          v-model="getQuickAddForm(group.coordinator ? group.coordinator.id : null).name"
                          placeholder="Ketik nama untuk tambah warga..."
                          size="sm"
                          class="w-full"
                          @keydown.enter="submitQuickAdd(group.coordinator ? group.coordinator.id : null)"
                        />
                      </template>
                      <!-- Edit Mode Row -->
                      <template v-else-if="row.id === editingResidentId">
                        <UInput
                          v-model="editingForm.name"
                          size="sm"
                          class="w-full"
                          @keydown.enter="submitEdit"
                          @keydown.esc="cancelEdit"
                        />
                      </template>
                      <!-- Normal Read Mode Row -->
                      <template v-else>
                        <div class="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                          <UAvatar
                            :alt="row.name"
                            size="2xs"
                          />
                          {{ row.name }}
                        </div>
                      </template>
                    </div>
                  </td>

                  <!-- ADDRESS COLUMN -->
                  <td class="px-4 py-2 align-middle">
                    <div
                      class="flex gap-2"
                      :class="{ 'pointer-events-none': draggedResident !== null }"
                    >
                      <!-- Quick Add Row -->
                      <template v-if="(row.id as unknown) === 'quick-add'">
                        <UInput
                          v-model="getQuickAddForm(group.coordinator ? group.coordinator.id : null).block"
                          placeholder="Blok"
                          size="sm"
                          class="w-20"
                          @keydown.enter="submitQuickAdd(group.coordinator ? group.coordinator.id : null)"
                        />
                        <UInput
                          v-model="getQuickAddForm(group.coordinator ? group.coordinator.id : null).house_number"
                          placeholder="No"
                          size="sm"
                          class="w-16"
                          @keydown.enter="submitQuickAdd(group.coordinator ? group.coordinator.id : null)"
                        />
                      </template>
                      <!-- Edit Mode Row -->
                      <template v-else-if="row.id === editingResidentId">
                        <UInput
                          v-model="editingForm.block"
                          placeholder="Blok"
                          size="sm"
                          class="w-20"
                          @keydown.enter="submitEdit"
                          @keydown.esc="cancelEdit"
                        />
                        <UInput
                          v-model="editingForm.house_number"
                          placeholder="No"
                          size="sm"
                          class="w-16"
                          @keydown.enter="submitEdit"
                          @keydown.esc="cancelEdit"
                        />
                      </template>
                      <!-- Normal Read Mode Row -->
                      <template v-else>
                        <span v-if="row.block || row.house_number">
                          Blok {{ row.block ?? '-' }} / No. {{ row.house_number ?? '-' }}
                        </span>
                        <span
                          v-else
                          class="text-gray-400 dark:text-neutral-500"
                        >-</span>
                      </template>
                    </div>
                  </td>

                  <!-- STATUS COLUMN -->
                  <td class="px-4 py-2 align-middle">
                    <div :class="{ 'pointer-events-none': draggedResident !== null }">
                      <!-- Quick Add Row -->
                      <template v-if="(row.id as unknown) === 'quick-add'">
                        <USelect
                          v-model="getQuickAddForm(group.coordinator ? group.coordinator.id : null).status"
                          :items="statusOptions"
                          value-key="value"
                          size="sm"
                          class="w-32"
                        />
                      </template>
                      <!-- Edit Mode Row -->
                      <template v-else-if="row.id === editingResidentId">
                        <USelect
                          v-model="editingForm.status"
                          :items="statusOptions"
                          value-key="value"
                          size="sm"
                          class="w-32"
                        />
                      </template>
                      <!-- Normal Read Mode Row -->
                      <template v-else>
                        <UBadge
                          v-if="row.status"
                          :color="getStatusColor(row.status)"
                          variant="subtle"
                          size="sm"
                        >
                          {{ row.status }}
                        </UBadge>
                        <span
                          v-else
                          class="text-gray-400 dark:text-neutral-500"
                        >-</span>
                      </template>
                    </div>
                  </td>

                  <!-- PHONE COLUMN -->
                  <td class="px-4 py-2 align-middle">
                    <div :class="{ 'pointer-events-none': draggedResident !== null }">
                      <!-- Quick Add Row -->
                      <template v-if="(row.id as unknown) === 'quick-add'">
                        <UInput
                          v-model="getQuickAddForm(group.coordinator ? group.coordinator.id : null).phone"
                          placeholder="Ketik no telp..."
                          size="sm"
                          class="w-full"
                          @keydown.enter="submitQuickAdd(group.coordinator ? group.coordinator.id : null)"
                        />
                      </template>
                      <!-- Edit Mode Row -->
                      <template v-else-if="row.id === editingResidentId">
                        <UInput
                          v-model="editingForm.phone"
                          placeholder="08..."
                          size="sm"
                          class="w-full"
                          @keydown.enter="submitEdit"
                          @keydown.esc="cancelEdit"
                        />
                      </template>
                      <!-- Normal Read Mode Row -->
                      <template v-else>
                        <a
                          v-if="row.phone"
                          :href="`tel:${row.phone}`"
                          class="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <UIcon
                            name="i-lucide-phone"
                            class="size-3"
                          />
                          {{ row.phone }}
                        </a>
                        <span
                          v-else
                          class="text-gray-400 dark:text-neutral-500"
                        >-</span>
                      </template>
                    </div>
                  </td>

                  <!-- ACTIONS COLUMN -->
                  <td class="px-4 py-2 align-middle text-right">
                    <div
                      class="flex justify-end gap-1"
                      :class="{ 'pointer-events-none': draggedResident !== null }"
                    >
                      <!-- Quick Add Row -->
                      <template v-if="(row.id as unknown) === 'quick-add'">
                        <UButton
                          icon="i-lucide-plus"
                          color="primary"
                          variant="solid"
                          size="sm"
                          :loading="isSavingQuickAdd[group.coordinator ? String(group.coordinator.id) : 'none']"
                          title="Tambah Warga Baru"
                          @click="submitQuickAdd(group.coordinator ? group.coordinator.id : null)"
                        />
                      </template>
                      <!-- Edit Mode Row -->
                      <template v-else-if="row.id === editingResidentId">
                        <UButton
                          icon="i-lucide-check"
                          color="success"
                          variant="ghost"
                          size="sm"
                          :loading="isSavingEdit"
                          title="Simpan"
                          @click="submitEdit"
                        />
                        <UButton
                          icon="i-lucide-x"
                          color="neutral"
                          variant="ghost"
                          size="sm"
                          title="Batal"
                          @click="cancelEdit"
                        />
                      </template>
                      <!-- Normal Read Mode Row -->
                      <template v-else>
                        <UButton
                          icon="i-lucide-pencil"
                          color="neutral"
                          variant="ghost"
                          size="sm"
                          title="Ubah"
                          @click="startEdit(row)"
                        />
                        <UButton
                          icon="i-lucide-trash-2"
                          color="error"
                          variant="ghost"
                          size="sm"
                          title="Hapus"
                          @click="confirmDeleteResident(row)"
                        />
                      </template>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Modals -->
    <CoordinatorModal
      v-model="isCoordinatorModalOpen"
      :coordinator="selectedCoordinator"
      @refresh="refreshAll"
    />

    <!-- Confirm Delete Coordinator Modal -->
    <AppConfirmModal
      v-model="isDeleteCoordinatorOpen"
      title="Hapus Koordinator"
      :description="`Apakah Anda yakin ingin menghapus koordinator '${selectedCoordinator?.name}'? Warga di bawah koordinator ini akan dipindahkan ke kategori 'Tanpa Koordinator'.`"
      confirm-label="Hapus Koordinator"
      :loading="isDeletingCoordinator"
      @confirm="deleteCoordinator"
    />

    <!-- Confirm Delete Resident Modal -->
    <AppConfirmModal
      v-model="isDeleteResidentOpen"
      title="Hapus Data Warga"
      :description="`Apakah Anda yakin ingin menghapus data warga '${selectedResident?.name}'? Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Hapus Warga"
      :loading="isDeletingResident"
      @confirm="deleteResident"
    />
  </div>
</template>

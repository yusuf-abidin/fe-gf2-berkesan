<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})

useSeoMeta({
  title: 'Pengaturan Aplikasi - GF2 Berkesan'
})

const { request } = useApi()
const toast = useToast()

interface AppSettings {
  ketua_rt: string
  bendahara: string[]
  kontak_admin: string
}

const { data: response, pending, refresh } = useCustomFetch<AppSettings>('/settings')

const form = ref({
  ketua_rt: '',
  kontak_admin: ''
})

const bendaharaList = ref<string[]>([])
const newTreasurerName = ref('')

// Populate form when data is loaded
watch(() => response.value?.data, (data) => {
  if (data) {
    form.value.ketua_rt = data.ketua_rt || ''
    form.value.kontak_admin = data.kontak_admin || ''
    bendaharaList.value = Array.isArray(data.bendahara) ? [...data.bendahara] : []
  }
}, { immediate: true })

const addTreasurer = () => {
  const name = newTreasurerName.value.trim()
  if (!name) return
  if (bendaharaList.value.some(t => t.toLowerCase() === name.toLowerCase())) {
    toast.add({ title: 'Perhatian', description: 'Nama bendahara tersebut sudah ada di daftar.', color: 'warning' })
    return
  }
  bendaharaList.value.push(name)
  newTreasurerName.value = ''
}

const removeTreasurer = (index: number) => {
  bendaharaList.value.splice(index, 1)
}

// Native HTML5 Drag and Drop Sorting
const draggedIndex = ref<number | null>(null)

const handleDragStart = (index: number) => {
  draggedIndex.value = index
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
}

const handleDrop = (index: number) => {
  if (draggedIndex.value === null) return
  if (draggedIndex.value === index) return

  const itemToMove = bendaharaList.value[draggedIndex.value]
  if (itemToMove !== undefined) {
    bendaharaList.value.splice(draggedIndex.value, 1)
    bendaharaList.value.splice(index, 0, itemToMove)
  }
  draggedIndex.value = null
}

const handleDragEnd = () => {
  draggedIndex.value = null
}

const isSaving = ref(false)

const saveSettings = async () => {
  if (!form.value.ketua_rt.trim()) {
    toast.add({ title: 'Validasi Gagal', description: 'Nama Ketua RT harus diisi.', color: 'error' })
    return
  }
  if (!form.value.kontak_admin.trim()) {
    toast.add({ title: 'Validasi Gagal', description: 'Nomor Kontak Admin harus diisi.', color: 'error' })
    return
  }

  isSaving.value = true
  try {
    await request('/settings', {
      method: 'PATCH',
      body: {
        ketua_rt: form.value.ketua_rt,
        kontak_admin: form.value.kontak_admin,
        bendahara: bendaharaList.value
      }
    })
    toast.add({ title: 'Berhasil', description: 'Pengaturan aplikasi berhasil disimpan.', color: 'success' })
    await refresh()
  } catch (e) {
    const err = e as { message?: string }
    toast.add({ title: 'Error', description: err.message || 'Gagal menyimpan pengaturan.', color: 'error' })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Pengaturan Aplikasi
      </h1>
      <p class="text-gray-500 dark:text-neutral-400 mt-1">
        Kelola informasi umum organisasi RT seperti data Ketua RT, Bendahara, dan Kontak WhatsApp.
      </p>
    </div>

    <div
      v-if="pending && !response?.data"
      class="space-y-6"
    >
      <UCard>
        <div class="space-y-4">
          <USkeleton class="h-4 w-1/4" />
          <USkeleton class="h-10 w-full" />
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-10 w-full" />
        </div>
      </UCard>
    </div>

    <div
      v-else
      class="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <!-- Left Column: RT Info & Contact Settings -->
      <div class="lg:col-span-2 space-y-6">
        <UCard class="border border-gray-100 dark:border-neutral-900 shadow-sm">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-sliders"
                class="size-5 text-primary-500"
              />
              <h3 class="font-bold text-gray-900 dark:text-white">
                Informasi Utama RT
              </h3>
            </div>
          </template>

          <form
            class="space-y-6"
            @submit.prevent="saveSettings"
          >
            <!-- Ketua RT -->
            <UFormField
              label="Nama Ketua RT"
              required
            >
              <UInput
                v-model="form.ketua_rt"
                placeholder="Masukkan nama Ketua RT resmi"
                size="lg"
                class="w-full"
              />
            </UFormField>

            <!-- Kontak Admin -->
            <UFormField
              label="Nomor Kontak WhatsApp Admin"
              required
              help="Nomor WhatsApp ini digunakan sebagai tujuan layanan tanya jawab pada landing page."
            >
              <UInput
                v-model="form.kontak_admin"
                placeholder="Contoh: +62 896-8458-6168"
                size="lg"
                class="w-full"
              />
            </UFormField>
          </form>
        </UCard>
      </div>

      <!-- Right Column: Bendahara List with Drag and Drop -->
      <div class="space-y-6">
        <UCard class="border border-gray-100 dark:border-neutral-900 shadow-sm flex flex-col h-full">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-users-round"
                class="size-5 text-primary-500"
              />
              <h3 class="font-bold text-gray-900 dark:text-white">
                Daftar Bendahara RT
              </h3>
            </div>
          </template>

          <div class="space-y-4 flex-1">
            <!-- Add new treasurer input -->
            <div class="flex gap-2">
              <UInput
                v-model="newTreasurerName"
                placeholder="Nama bendahara baru"
                class="flex-1"
                @keydown.enter.prevent="addTreasurer"
              />
              <UButton
                label="Tambah"
                color="primary"
                icon="i-lucide-plus"
                @click="addTreasurer"
              />
            </div>

            <!-- Drag & Drop Sortable List -->
            <div class="space-y-2">
              <p class="text-xs text-gray-400 dark:text-neutral-500 font-medium">
                Seret ikon grip <UIcon
                  name="i-lucide-grip-vertical"
                  class="align-middle inline size-3"
                /> untuk mengurutkan posisi bendahara.
              </p>

              <transition-group
                name="list"
                tag="ul"
                class="space-y-2"
              >
                <li
                  v-for="(name, index) in bendaharaList"
                  :key="name"
                  draggable="true"
                  class="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-900/50 border border-gray-150 dark:border-neutral-800 rounded-xl transition-all duration-200"
                  :class="{
                    'opacity-40 border-dashed border-primary-500 scale-95': draggedIndex === index
                  }"
                  @dragstart="handleDragStart(index)"
                  @dragover="handleDragOver"
                  @dragend="handleDragEnd"
                  @drop="handleDrop(index)"
                >
                  <div class="flex items-center gap-3">
                    <span class="cursor-grab active:cursor-grabbing text-gray-400 dark:text-neutral-600 hover:text-gray-600 transition-colors p-1">
                      <UIcon
                        name="i-lucide-grip-vertical"
                        class="size-5"
                      />
                    </span>
                    <span class="text-sm font-semibold text-gray-800 dark:text-neutral-200">
                      {{ name }}
                    </span>
                  </div>

                  <UButton
                    icon="i-lucide-trash"
                    color="error"
                    variant="ghost"
                    size="sm"
                    @click="removeTreasurer(index)"
                  />
                </li>
              </transition-group>

              <div
                v-if="bendaharaList.length === 0"
                class="text-center py-8 text-gray-400 dark:text-neutral-600 italic text-xs border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl"
              >
                Belum ada bendahara ditambahkan.
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="flex justify-end bg-white dark:bg-neutral-950 p-4 border border-gray-150 dark:border-neutral-850 rounded-2xl">
      <UButton
        label="Simpan Perubahan"
        color="primary"
        icon="i-lucide-save"
        size="lg"
        :loading="isSaving"
        @click="saveSettings"
      />
    </div>
  </div>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>

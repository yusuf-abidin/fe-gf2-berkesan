<script setup lang="ts">
import AppConfirmModal from '~/components/AppConfirmModal.vue'

const { user, logout } = useAuth()
const isLogoutConfirmOpen = ref(false)
const isLoggingOut = ref(false)

const route = useRoute()
const isSidebarOpen = ref(false)

// Auto-close sidebar on mobile when navigating
watch(() => route.path, () => {
  isSidebarOpen.value = false
})

const links = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/admin'
  },
  {
    label: 'Buku Kerja',
    icon: 'i-lucide-book-open',
    to: '/admin/accounts'
  },
  {
    label: 'Iuran Warga',
    icon: 'i-lucide-hand-coins',
    to: '/admin/contributions'
  },
  {
    label: 'Data Warga',
    icon: 'i-lucide-id-card',
    to: '/admin/residents'
  },
  {
    label: 'Kode Registrasi',
    icon: 'i-lucide-key',
    to: '/admin/registration-codes'
  },
  {
    label: 'Manajemen Pengguna',
    icon: 'i-lucide-users',
    to: '/admin/users'
  },
  {
    label: 'Pengaturan',
    icon: 'i-lucide-settings',
    to: '/admin/settings'
  }
]

const handleLogout = async () => {
  isLoggingOut.value = true
  try {
    await logout()
  } finally {
    isLoggingOut.value = false
    isLogoutConfirmOpen.value = false
  }
}
</script>

<template>
  <div class="flex h-screen bg-gray-50 dark:bg-neutral-950 overflow-hidden text-sm relative">
    <!-- Mobile Sidebar Backdrop Overlay -->
    <div
      v-if="isSidebarOpen"
      class="fixed inset-0 z-40 bg-black/50 md:hidden"
      @click="isSidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col shrink-0 transition-transform duration-300 md:static md:translate-x-0',
        isSidebarOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none md:pointer-events-auto'
      ]"
    >
      <!-- Sidebar Header -->
      <div class="h-16 flex items-center justify-between px-6 border-b border-gray-100 dark:border-neutral-800 shrink-0">
        <NuxtLink
          to="/admin"
          class="inline-block"
        >
          <AppLogo class="h-8 w-auto text-gray-900 dark:text-white" />
        </NuxtLink>
        <UButton
          type="button"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          class="md:hidden"
          @click="isSidebarOpen = false"
        />
      </div>

      <!-- Navigation -->
      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <UNavigationMenu
          orientation="vertical"
          variant="pill"
          :items="links"
          class="w-full"
        />
      </div>

      <!-- Sidebar Footer -->
      <div class="p-4 border-t border-gray-100 dark:border-neutral-800">
        <div class="mb-4 px-2">
          <p class="text-[10px] font-semibold text-gray-400 dark:text-neutral-500 uppercase tracking-wider mb-2">
            Logged in as
          </p>
          <div class="flex items-center gap-2">
            <UAvatar
              :alt="user?.name"
              size="2xs"
            />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-white truncate">
                {{ user?.name }}
              </p>
              <p class="text-xs text-gray-500 dark:text-neutral-400 truncate uppercase">
                {{ user?.role }}
              </p>
            </div>
          </div>
        </div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-log-out"
          class="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
          @click="isLogoutConfirmOpen = true"
        >
          Logout
        </UButton>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Content Header -->
      <header class="h-16 border-b border-gray-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0">
        <div class="flex items-center gap-2">
          <!-- Mobile Sidebar Toggle -->
          <UButton
            type="button"
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            class="md:hidden"
            @click="isSidebarOpen = true"
          />
          <h2 class="font-semibold text-gray-900 dark:text-white">
            Admin Panel
          </h2>
        </div>

        <div class="flex items-center gap-3">
          <!-- Additional Header Actions can go here -->
          <UColorModeButton />
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div class="max-w-6xl mx-auto">
          <slot />
        </div>
      </main>
    </div>

    <AppConfirmModal
      v-model="isLogoutConfirmOpen"
      title="Konfirmasi Logout"
      description="Apakah Anda yakin ingin keluar dari aplikasi?"
      confirm-label="Logout"
      :loading="isLoggingOut"
      @confirm="handleLogout"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 10px;
}
.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: #262626;
}
</style>

<script setup lang="ts">
const { token, user, fetchMe } = useAuth()

// Load user details if token is present but user profile state is empty
if (token.value && !user.value) {
  fetchMe().catch(() => {})
}

useHead({
  title: 'Portal Transparansi Keuangan RT 01 RW 021 - Griya Family 2',
  meta: [
    { name: 'description', content: 'Portal transparansi keuangan kas, iuran warga, dan pembukuan resmi Perumahan Griya Family 2 RT 01 RW 021 Desa Cikahuripan, Klapanunggal, Bogor.' }
  ],
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap' }
  ]
})

interface AppSettings {
  ketua_rt: string
  bendahara: string[]
  kontak_admin: string
}

const { data: settingsResponse } = useCustomFetch<AppSettings>('/settings')

const kontakAdmin = computed(() => {
  return settingsResponse.value?.data?.kontak_admin || '+62 896-8458-6168'
})

const waLink = computed(() => {
  const cleanPhone = kontakAdmin.value.replace(/[^0-9]/g, '')
  const formattedPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone
  return `https://wa.me/${formattedPhone}?text=Halo%20Admin%20Keuangan%20RT%2001%20Griya%20Family%202%2C%20saya%20warga%20ingin%20bertanya%20mengenai...`
})
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-neutral-950 font-outfit text-gray-900 dark:text-neutral-100 flex flex-col">
    <!-- Navbar -->
    <header class="sticky top-0 z-50 backdrop-blur-md bg-white/75 dark:bg-neutral-950/75 border-b border-gray-100 dark:border-neutral-900 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="flex items-center"
        >
          <AppLogo class="h-8 w-auto text-gray-900 dark:text-white" />
        </NuxtLink>

        <nav class="flex items-center gap-4">
          <UColorModeButton />

          <template v-if="token">
            <div class="hidden sm:flex flex-col items-end text-xs mr-2 text-gray-500">
              <span>Masuk sebagai</span>
              <span class="font-semibold text-gray-800 dark:text-neutral-200">{{ user?.name }}</span>
            </div>
            <UButton
              :to="user?.role === 'ADMIN' ? '/admin' : '/user/accounts'"
              :label="user?.role === 'ADMIN' ? 'Dashboard Admin' : 'Laporan Keuangan'"
              icon="i-lucide-layout-dashboard"
              color="primary"
              size="sm"
              class="shadow-sm shadow-primary-500/10 hover:shadow-md transition-all duration-200"
            />
          </template>
          <template v-else>
            <UButton
              to="/login"
              label="Masuk"
              variant="ghost"
              color="neutral"
              size="sm"
            />
            <UButton
              to="/register"
              label="Daftar Warga"
              color="primary"
              size="sm"
              class="shadow-sm shadow-primary-500/10 hover:shadow-md transition-all duration-200"
            />
          </template>
        </nav>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative overflow-hidden pt-20 pb-16 lg:pt-32 lg:pb-24 flex-1">
      <div class="absolute inset-0 -z-10 overflow-hidden">
        <div class="absolute -top-40 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-gradient-to-tr from-primary-400/20 to-indigo-500/20 blur-3xl dark:from-primary-650/10 dark:to-indigo-500/10 opacity-70" />
      </div>

      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div class="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide border border-emerald-100 dark:border-emerald-900/30">
          <UIcon
            name="i-lucide-sparkles"
            class="size-4"
          />
          <span>Portal Keuangan Warga Resmi</span>
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight max-w-4xl mx-auto">
          Mewujudkan Transparansi Keuangan di
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-indigo-600 to-emerald-600 dark:from-primary-400 dark:via-indigo-400 dark:to-emerald-400">
            RT 01 RW 021 Griya Family 2
          </span>
        </h1>

        <p class="text-base sm:text-lg text-gray-500 dark:text-neutral-450 max-w-2xl mx-auto leading-relaxed">
          Platform keterbukaan informasi untuk warga RT 01. Pantau arus kas masuk, pengeluaran pembangunan, santunan sosial, serta status iuran warga secara real-time dan terbuka.
        </p>

        <div class="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <template v-if="token">
            <UButton
              :to="user?.role === 'ADMIN' ? '/admin' : '/user/accounts'"
              :label="user?.role === 'ADMIN' ? 'Buka Dashboard Admin' : 'Buka Laporan Keuangan'"
              color="primary"
              size="lg"
              icon="i-lucide-arrow-right"
              trailing
              class="w-full sm:w-auto px-6 shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            />
          </template>
          <template v-else>
            <UButton
              to="/login"
              label="Buka Laporan Keuangan"
              color="primary"
              size="lg"
              icon="i-lucide-line-chart"
              class="w-full sm:w-auto px-6 shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            />
            <UButton
              to="/register"
              label="Registrasi Akun Warga"
              color="neutral"
              variant="outline"
              size="lg"
              icon="i-lucide-user-plus"
              class="w-full sm:w-auto px-6 hover:bg-gray-50 dark:hover:bg-neutral-900 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            />
          </template>
        </div>
      </div>
    </section>

    <!-- Core Pillars of Transparency -->
    <section class="py-20 lg:py-24 border-t border-gray-100 dark:border-neutral-900 bg-gray-50/30 dark:bg-neutral-950/20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div class="text-center space-y-3">
          <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Pilar Transparansi Kas & Iuran Warga
          </h2>
          <p class="text-gray-500 dark:text-neutral-450 max-w-xl mx-auto text-sm sm:text-base">
            Kami mengedepankan prinsip akuntabilitas agar pengelolaan dana warga dapat dipertanggungjawabkan bersama.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Pillar 1 -->
          <div class="group p-6 bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-850 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div class="space-y-4">
              <div class="size-10 bg-primary-50 dark:bg-primary-950/30 text-primary-650 dark:text-primary-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UIcon
                  name="i-lucide-eye"
                  class="size-5"
                />
              </div>
              <h3 class="font-bold text-gray-900 dark:text-white text-base">
                Transparansi Mutlak
              </h3>
              <p class="text-xs text-gray-500 dark:text-neutral-450 leading-relaxed">
                Setiap rupiah yang masuk (pemasukan/iuran) dan keluar (operasional/sosial) dicatat secara terbuka dan dapat dipantau oleh setiap warga.
              </p>
            </div>
          </div>

          <!-- Pillar 2 -->
          <div class="group p-6 bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-850 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div class="space-y-4">
              <div class="size-10 bg-violet-50 dark:bg-violet-950/30 text-violet-650 dark:text-violet-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UIcon
                  name="i-lucide-globe"
                  class="size-5"
                />
              </div>
              <h3 class="font-bold text-gray-900 dark:text-white text-base">
                Laporan Terpublikasi
              </h3>
              <p class="text-xs text-gray-500 dark:text-neutral-450 leading-relaxed">
                Laporan keuangan bulanan dipublikasikan secara resmi oleh Admin setelah divalidasi, memberikan laporan pertanggungjawaban yang kredibel.
              </p>
            </div>
          </div>

          <!-- Pillar 3 -->
          <div class="group p-6 bg-white dark:bg-neutral-900 border border-gray-150 dark:border-neutral-850 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
            <div class="space-y-4">
              <div class="size-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UIcon
                  name="i-lucide-message-square"
                  class="size-5"
                />
              </div>
              <h3 class="font-bold text-gray-900 dark:text-white text-base">
                Aduan & Komunikasi
              </h3>
              <p class="text-xs text-gray-500 dark:text-neutral-450 leading-relaxed">
                Menyediakan jalur komunikasi cepat kepada pengurus RT via WhatsApp apabila terdapat kesalahan pencatatan atau pertanyaan dana.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Address & Contact Info Section -->
    <section class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <!-- Address Card -->
        <div class="lg:col-span-2 p-8 bg-neutral-50 dark:bg-neutral-900/40 border border-gray-100 dark:border-neutral-900 rounded-3xl flex flex-col justify-center space-y-6">
          <div class="space-y-4">
            <div class="inline-flex items-center gap-2 bg-gray-150 dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 px-3 py-1 rounded-full text-xs font-semibold">
              <UIcon
                name="i-lucide-map-pin"
                class="size-4 text-primary-500"
              />
              <span>Lokasi Administrasi RT</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
              Perumahan Griya Family 2 RT 01 RW 021
            </h3>
            <p class="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed">
              Jl. Raya Klapanunggal – Cipecang Cibeber, Desa Cikahuripan, Kecamatan Klapanunggal, Kabupaten Bogor, Jawa Barat. Kode Pos 16710.
            </p>
          </div>
        </div>

        <!-- Contact WhatsApp Card -->
        <div class="p-8 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl flex flex-col justify-between space-y-8 shadow-sm">
          <div class="space-y-4">
            <div class="size-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-650 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
              <UIcon
                name="i-lucide-messages-square"
                class="size-6"
              />
            </div>
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white">
              Layanan Tanya Jawab Warga
            </h3>
            <p class="text-xs text-gray-500 dark:text-neutral-450 leading-relaxed">
              Ada pertanyaan seputar iuran bulanan atau butuh klarifikasi mutasi kas? Hubungi langsung Admin RT 01 via WhatsApp untuk respon cepat.
            </p>
          </div>

          <div class="space-y-4">
            <div class="flex items-center gap-3 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-850 p-3 rounded-2xl">
              <div class="size-10 bg-emerald-50 dark:bg-emerald-950 text-emerald-650 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                <UIcon
                  name="i-lucide-phone"
                  class="size-5"
                />
              </div>
              <div class="flex flex-col text-xs">
                <span class="text-gray-400 dark:text-neutral-500">Kontak Admin</span>
                <span class="font-bold font-mono text-sm text-gray-800 dark:text-neutral-200">{{ kontakAdmin }}</span>
              </div>
            </div>

            <a
              :href="waLink"
              target="_blank"
              class="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <UIcon
                name="i-lucide-message-circle"
                class="size-5"
              />
              <span>Hubungi Admin (WhatsApp)</span>
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="mt-auto py-8 border-t border-gray-100 dark:border-neutral-900 bg-gray-50/30 dark:bg-neutral-950/40 text-center text-xs text-gray-400 dark:text-neutral-500 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-2">
        <p>&copy; {{ new Date().getFullYear() }} Portal Keuangan RT 01 RW 021 - Griya Family 2. Hak Cipta Dilindungi.</p>
        <p>Klapanunggal, Cikahuripan, Kabupaten Bogor 16710.</p>
      </div>
    </footer>
  </div>
</template>

<style>
.font-outfit {
  font-family: 'Outfit', sans-serif;
}
</style>

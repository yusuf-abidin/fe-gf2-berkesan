<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Pengguna</h1>
        <p class="text-gray-500 dark:text-neutral-400 mt-1">Daftar pengguna aplikasi keuangan RT.</p>
      </div>
    </div>

    <UCard>
      <div class="text-center py-10">
        <UIcon name="i-lucide-users" class="size-10 text-gray-300 mx-auto mb-3" />
        <p class="text-gray-500">Belum ada data pengguna.</p>
      </div>
    </UCard>
  </div>
</template>

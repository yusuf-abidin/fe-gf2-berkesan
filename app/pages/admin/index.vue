<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  roles: ['ADMIN']
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">
      Dashboard Admin
    </h1>
    <p class="text-gray-600 dark:text-neutral-400">
      Selamat datang di panel administrasi Keuangan RT.
    </p>
  </div>
</template>

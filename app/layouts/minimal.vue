<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <NuxtLink
          to="/"
          class="inline-block"
        >
          <AppLogo class="h-12 w-auto mx-auto" />
        </NuxtLink>
      </div>
      <slot />
    </div>
  </div>
</template>

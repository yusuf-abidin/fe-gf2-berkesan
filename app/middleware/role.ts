export default defineNuxtRouteMiddleware(async (to) => {
  const { token, fetchMe, user, hasRole } = useAuth()

  if (!token.value) {
    return navigateTo('/login')
  }

  await fetchMe()

  if (!user.value) {
    return navigateTo('/login')
  }

  const allowedRoles = to.meta.roles as string[] | undefined

  if (!allowedRoles || allowedRoles.length === 0) return

  if (!hasRole(...allowedRoles)) {
    return navigateTo('/403')
  }
})

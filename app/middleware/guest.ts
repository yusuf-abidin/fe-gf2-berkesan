export default defineNuxtRouteMiddleware(async () => {
  const { token, fetchMe, user } = useAuth()

  if (!token.value) return

  await fetchMe()

  if (user.value) {
    return navigateTo('/')
  }
})

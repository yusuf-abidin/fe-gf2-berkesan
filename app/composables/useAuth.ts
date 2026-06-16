import type { AuthResponse, UserResponse } from '~/types/auth'
import type { LoginForm, RegisterForm } from '~/utils/validator/auth.schema'

export const useAuth = () => {
  const { request } = useApi()
  const token = useCookie('access_token')
  const user = useState<UserResponse | null>('user', () => null)

  const login = async (credentials: LoginForm) => {
    const response = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: credentials
    })
    token.value = response.data.access_token
    user.value = response.data.user
    return response.message
  }

  const register = async (userData: RegisterForm) => {
    const response = await request<null>('/auth/register', {
      method: 'POST',
      body: {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        registration_code: userData.registration_code
      }
    })
    return response.message
  }

  const logout = async () => {
    await request('/auth/logout', { method: 'POST' }).catch(() => {})
    token.value = null
    user.value = null
    await navigateTo('/login')
  }

  const fetchMe = async () => {
    if (user.value || !token.value) return
    const response = await request<UserResponse>('/users/me')
    user.value = response.data
  }

  const hasRole = (...roles: string[]) => {
    if (!user.value?.role) return false
    const userRole = user.value.role.toUpperCase()
    return roles.some(role => role.toUpperCase() === userRole)
  }

  return { user, token, register, login, logout, fetchMe, hasRole }
}

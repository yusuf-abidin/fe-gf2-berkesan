export interface AuthResponse {
  access_token: string
  token_type: string
  user: UserResponse
}

export interface UserResponse {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'USER'
  created_at: string
}

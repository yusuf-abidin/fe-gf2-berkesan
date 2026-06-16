export interface RegistrationCode {
  id: number
  code: string
  expires_at: string
  usage_limit: number | null
  current_usage: number
  created_at: string
}

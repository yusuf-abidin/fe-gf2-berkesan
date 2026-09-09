import type { Coordinator } from './coordinator'

export interface Resident {
  id: number
  coordinator_id: number | null
  name: string
  block: string | null
  house_number: string | null
  status: string | null
  phone: string | null
  created_at?: string
  updated_at?: string
  coordinator?: Coordinator | null
}

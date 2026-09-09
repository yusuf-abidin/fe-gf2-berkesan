import type { Category } from './category'

export interface Transaction {
  id: number
  period_id: number
  category_id: number | null
  contribution_period_id: number | null
  type: 'IN' | 'OUT'
  name: string
  day: number | null
  quantity: number | null
  amount: number
  description: string | null
  category?: Category | null
  created_at?: string
  updated_at?: string
}

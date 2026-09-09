export interface Period {
  id: number
  account_id: number
  month: number
  year: number
  is_published: boolean
  start_balance?: number
  created_at?: string
  updated_at?: string
}

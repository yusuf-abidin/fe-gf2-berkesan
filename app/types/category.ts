export interface Category {
  id: number
  account_id: number
  name: string
  type: 'IN' | 'OUT'
  created_at: string
  deleted_at: string | null
}

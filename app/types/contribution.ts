export interface ContributionType {
  id: number
  name: string
  description: string | null
  is_public?: boolean
  created_at?: string
  updated_at?: string
}

export interface UnpaidResident {
  id: number
  resident_id: number
  name: string
  block: string | null
  house_number: string | null
}

export interface ContributionPeriod {
  id: number
  contribution_type_id: number
  month: number
  year: number
  amount_per_resident: number
  created_at?: string
  updated_at?: string
  contribution_type?: ContributionType
}

export interface ContributionPayment {
  id: number
  resident_id: number
  name: string
  block: string | null
  house_number: string | null
  coordinator_name: string
  amount_paid: number
  payment_status: 'PAID' | 'UNPAID'
  paid_at: string | null
}

export interface ContributionSummary {
  total_paid_amount: number
  total_paid_residents: number
  total_unpaid_residents: number
}

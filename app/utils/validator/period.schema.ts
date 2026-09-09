import { z } from 'zod'

export const periodSchema = z.object({
  month: z
    .number({
      message: 'Bulan wajib dipilih'
    })
    .int()
    .min(1)
    .max(12),
  year: z
    .number({
      message: 'Tahun wajib diisi'
    })
    .int()
    .min(2000)
    .max(2100),
  start_balance: z
    .number({
      message: 'Saldo awal harus berupa angka'
    })
    .min(0, 'Saldo awal tidak boleh negatif')
    .optional()
    .default(0)
})

export type PeriodForm = z.infer<typeof periodSchema>

import { z } from 'zod'

export const contributionPeriodSchema = z.object({
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
  amount_per_resident: z
    .number({
      message: 'Nominal wajib diisi'
    })
    .min(0, 'Nominal tidak boleh negatif')
})

export type ContributionPeriodForm = z.infer<typeof contributionPeriodSchema>

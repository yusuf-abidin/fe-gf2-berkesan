import { z } from 'zod'

export const contributionTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama iuran tidak boleh kosong')
    .max(255, 'Nama iuran terlalu panjang'),
  description: z
    .string()
    .trim()
    .max(1000, 'Deskripsi terlalu panjang')
    .optional()
})

export type ContributionTypeForm = z.infer<typeof contributionTypeSchema>

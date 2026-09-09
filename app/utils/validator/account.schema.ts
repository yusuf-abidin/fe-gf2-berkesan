import { z } from 'zod'

export const accountSchema = z.object({
  name: z.string().min(1, 'Nama Buku Kerja wajib diisi'),
  slug: z.string().min(1, 'Slug wajib diisi'),
  description: z.string().optional()
})

export type AccountForm = z.infer<typeof accountSchema>

import { z } from 'zod'

export const categorySchema = z.object({
  account_id: z.number(),
  name: z.string().min(1, 'Nama kategori wajib diisi')
})

export type CategoryForm = z.infer<typeof categorySchema>

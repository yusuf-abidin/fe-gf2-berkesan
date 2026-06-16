import { z } from 'zod'

export const categorySchema = z.object({
  account_id: z.number(),
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  type: z.enum(['IN', 'OUT'], { 
    required_error: 'Tipe kategori wajib dipilih',
    invalid_type_error: 'Tipe kategori tidak valid'
  })
})

export type CategoryForm = z.infer<typeof categorySchema>

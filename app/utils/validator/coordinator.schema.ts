import { z } from 'zod'

export const coordinatorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama tidak boleh kosong')
    .max(255, 'Nama terlalu panjang'),
  managed_blocks: z
    .string()
    .trim()
    .min(1, 'Blok yang dikelola tidak boleh kosong')
    .max(255, 'Blok terlalu panjang')
})

export type CoordinatorForm = z.infer<typeof coordinatorSchema>

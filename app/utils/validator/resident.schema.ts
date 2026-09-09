import { z } from 'zod'

export const residentSchema = z.object({
  coordinator_id: z
    .number()
    .nullable()
    .optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Nama tidak boleh kosong')
    .max(255, 'Nama terlalu panjang'),
  block: z
    .string()
    .trim()
    .max(255, 'Blok terlalu panjang')
    .optional(),
  house_number: z
    .string()
    .trim()
    .max(255, 'Nomor rumah terlalu panjang')
    .optional(),
  status: z
    .string()
    .trim()
    .optional(),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true
      return /^(08|628)[1-9][0-9]{6,13}$/.test(val)
    }, {
      message: 'Nomor telepon tidak valid (contoh: 08123456789)'
    })
})

export type ResidentForm = z.infer<typeof residentSchema>

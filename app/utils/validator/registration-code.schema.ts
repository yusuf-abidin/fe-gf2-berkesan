import { z } from 'zod'

export const registrationCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, 'Kode tidak boleh kosong')
    .max(255, 'Kode terlalu panjang'),
  expires_at: z
    .number({
      message: 'Waktu kedaluwarsa harus dipilih'
    })
    .int(),
  usage_limit: z
    .number()
    .min(1, 'Batas penggunaan minimal 1')
    .nullable()
    .optional()
})

export type RegistrationCodeForm = z.infer<typeof registrationCodeSchema>

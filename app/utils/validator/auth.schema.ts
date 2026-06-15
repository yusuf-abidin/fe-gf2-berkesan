import { z } from 'zod'

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Nama lengkap tidak boleh kosong')
    .max(100, 'Nama lengkap tidak boleh lebih dari 100 karakter'),
  email: z
    .string()
    .email('Format email tidak valid')
    .min(1, 'Email tidak boleh kosong')
    .max(100, 'Email tidak boleh lebih dari 100 karakter'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .max(255, 'Password tidak boleh lebih dari 255 karakter'),
  confirm_password: z
    .string()
    .min(1, 'Konfirmasi password tidak boleh kosong'),
  registration_code: z
    .string()
    .min(1, 'Kode registrasi tidak boleh kosong')
}).refine(data => data.password === data.confirm_password, {
  message: 'Konfirmasi password tidak sesuai',
  path: ['confirm_password']
})

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email tidak boleh kosong')
    .email('Format email tidak valid'),
  password: z
    .string()
    .min(1, 'Password tidak boleh kosong')
})

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>

import { z } from 'zod'

export const transactionSchema = z.object({
  period_id: z.number({
    message: 'Periode wajib diisi'
  }),
  category_id: z.number().nullable().optional(),
  contribution_period_id: z.number().nullable().optional(),
  type: z.enum(['IN', 'OUT'], {
    message: 'Tipe transaksi wajib dipilih'
  }),
  name: z
    .string()
    .trim()
    .min(1, 'Nama transaksi wajib diisi')
    .max(255, 'Nama transaksi terlalu panjang'),
  day: z
    .number()
    .int()
    .min(1)
    .max(31)
    .nullable()
    .optional(),
  quantity: z
    .number()
    .int()
    .min(1)
    .nullable()
    .optional(),
  amount: z
    .number({
      message: 'Nominal wajib diisi'
    })
    .min(0, 'Nominal tidak boleh negatif'),
  description: z.string().optional()
})

export type TransactionForm = z.infer<typeof transactionSchema>

import { z } from 'zod';

export const adminLoginSchema = z.object({
  storeCode: z.string().trim().min(1),
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const tableLoginSchema = z.object({
  storeCode: z.string().trim().min(1),
  tableNumber: z.string().trim().min(1),
  password: z.string().optional().default(''),
});

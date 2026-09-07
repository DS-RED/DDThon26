import { z } from 'zod';

export const createTableSchema = z.object({
  tableNumber: z.string().trim().min(1).max(20),
  // Optional table password for tablet auto-login (FR-C1); hashed server-side.
  password: z.string().min(1).max(100).optional(),
});

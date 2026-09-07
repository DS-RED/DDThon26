import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        menu_item_id: z.number().int().positive(),
        quantity: z.number().int().min(1).max(999),
      }),
    )
    .min(1, 'At least one item is required'),
});

export const updateStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'completed']),
});

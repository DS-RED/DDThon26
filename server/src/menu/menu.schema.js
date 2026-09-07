import { z } from 'zod';

const MAX_PRICE = 100_000_000; // 1억 KRW guard

// Raw field validators WITHOUT defaults — reused by both create and update.
// Defaults live only on the create schema so partial (PUT) updates never
// silently reset an omitted field.
const categoryIdField = z.number().int().positive().nullable();
const nameField = z.string().trim().min(1).max(100);
const priceField = z.number().int().min(0).max(MAX_PRICE);
const descriptionField = z.string().max(500).nullable();
const imageUrlField = z.string().url().max(2048).nullable();
const displayOrderField = z.number().int().min(0);
const isAvailableField = z.boolean();

export const menuItemCreateSchema = z.object({
  category_id: categoryIdField.optional().default(null),
  name: nameField,
  price: priceField,
  description: descriptionField.optional().default(null),
  image_url: imageUrlField.optional().default(null),
  display_order: displayOrderField.optional().default(0),
  is_available: isAvailableField.optional().default(true),
});

// PUT: every field optional, NO defaults; require at least one field present.
export const menuItemUpdateSchema = z
  .object({
    category_id: categoryIdField.optional(),
    name: nameField.optional(),
    price: priceField.optional(),
    description: descriptionField.optional(),
    image_url: imageUrlField.optional(),
    display_order: displayOrderField.optional(),
    is_available: isAvailableField.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field must be provided' });

export const reorderSchema = z.object({
  items: z
    .array(z.object({ id: z.number().int().positive(), display_order: z.number().int().min(0) }))
    .min(1),
});

export const categoryCreateSchema = z.object({
  name: nameField,
  display_order: displayOrderField.optional().default(0),
});

export const categoryUpdateSchema = z
  .object({
    name: nameField.optional(),
    display_order: displayOrderField.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: 'At least one field must be provided' });

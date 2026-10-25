import { z } from 'zod';
export const standupSaveSchema = z.object({
  version: z.number().int().min(0),
  reviewed: z.boolean(),
  items: z.unknown(),
});

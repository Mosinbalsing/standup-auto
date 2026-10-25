import { z } from 'zod';
export const settingsSchema = z.object({
  timezone: z.string(),
  standupTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a valid standup time.'),
  activityWindow: z.enum(['yesterday', 'previous-working-day']),
  workingDays: z.array(z.number().int().min(0).max(6)),
  scheduledSync: z.boolean(),
});

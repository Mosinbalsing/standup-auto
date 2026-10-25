import { z } from 'zod';
export const repositorySelectionSchema = z.object({
  selected: z.array(z.string()).max(20, 'Select at most 20 repositories.'),
});

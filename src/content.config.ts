import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const essays = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/essays' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    order: z.number(),
    video: z.string().optional(),
  }),
});

export const collections = { essays };

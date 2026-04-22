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

const responses = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/responses' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string(),
    publishedDate: z.coerce.date().optional(),
    modifiedDate: z.coerce.date().optional(),
    order: z.number(),
    framing: z.string().optional(),
    tags: z.array(z.string()).optional(),
    consultationUrl: z.string().url().optional(),
    consultationQuestions: z
      .array(z.object({ ref: z.string(), label: z.string() }))
      .optional(),
  }),
});

export const collections = { essays, responses };

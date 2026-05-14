import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/portfolio' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    video: z.string(),
    poster: z.string().optional(),
    order: z.number(),
    lock: z.boolean().default(false),
  }),
});

const privateWork = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/private' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    video: z.string(),
    poster: z.string().optional(),
    order: z.number(),
    lock: z.boolean().default(false),
  }),
});

const drawings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/drawings' }),
  schema: z.object({
    alt: z.string(),
    image: z.string(),
    order: z.number(),
    full: z.boolean().default(false),
  }),
});

const privateDrawings = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/private-drawings' }),
  schema: z.object({
    alt: z.string(),
    image: z.string(),
    order: z.number(),
    project: z.string(),
    description: z.string().optional(),
    full: z.boolean().default(false),
  }),
});

export const collections = { portfolio, private: privateWork, drawings, 'private-drawings': privateDrawings };

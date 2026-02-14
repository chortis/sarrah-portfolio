import { defineCollection, z } from 'astro:content';

const portfolio = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    video: z.string(),
    poster: z.string().optional(),
    order: z.number(),
  }),
});

const privateWork = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    video: z.string(),
    poster: z.string().optional(),
    order: z.number(),
  }),
});

const drawings = defineCollection({
  type: 'content',
  schema: z.object({
    alt: z.string(),
    image: z.string(),
    order: z.number(),
    full: z.boolean().default(false),
  }),
});

const privateDrawings = defineCollection({
  type: 'content',
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

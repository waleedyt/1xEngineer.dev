import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.mdx' }),
  schema: ({ image }) =>
    z.object({
      title: z.string().transform((s) => s.trim()),
      description: z.string().transform((s) => s.trim()),
      date: z.coerce.date(),
      image: image(),
      imageAlt: z.string(),
    }),
});

export const collections = { posts };

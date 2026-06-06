import { defineCollection, z } from 'astro:content';
import { file } from 'astro/loaders';

const statusSchema = z.object({
  published: z.boolean(),
  featured: z.boolean(),
  draft: z.boolean(),
  trashed: z.boolean(),
  hidden: z.boolean(),
  excludedHomepage: z.boolean(),
});

const featuredImageSchema = z
  .object({
    src: z.string(),
    srcset: z.string().nullable(),
    sizes: z.string().nullable(),
    alt: z.string(),
    caption: z.string(),
    credits: z.string(),
  })
  .nullable();

const posts = defineCollection({
  loader: file('src/data/posts.json'),
  schema: z.object({
    postId: z.number(),
    title: z.string(),
    slug: z.string(),
    html: z.string(),
    excerpt: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date(),
    authors: z.array(z.string()),
    tags: z.array(z.string()),
    featuredImage: featuredImageSchema,
    template: z.enum(['default', 'alternative']),
    status: statusSchema,
    metaTitle: z.string(),
    metaDesc: z.string(),
    metaRobots: z.string(),
    canonicalUrl: z.string(),
    mainTag: z.string(),
  }),
});

const authors = defineCollection({
  loader: file('src/data/authors.json'),
  schema: z.object({
    name: z.string(),
    username: z.string(),
    email: z.string(),
    website: z.string(),
    avatar: z.string().nullable(),
    useGravatar: z.boolean(),
    description: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string(),
  }),
});

const tags = defineCollection({
  loader: file('src/data/tags.json'),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    description: z.string(),
  }),
});

export const collections = { posts, authors, tags };

#!/usr/bin/env node
/**
 * One-shot import: Publii input/db.sqlite -> Astro content collections.
 *
 * Emits JSON data files consumed by src/content.config.ts via the `file()` loader:
 *   - src/data/posts.json
 *   - src/data/authors.json
 *   - src/data/tags.json
 *
 * Run with:  npm run import
 *
 * Source DB defaults to the Publii project; override with PUBLII_DB / PUBLII_MEDIA env vars.
 */
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DB_PATH =
  process.env.PUBLII_DB ||
  resolve(
    process.env.HOME,
    'Documents/Publii/sites/codamoscombr/input/db.sqlite'
  );
// Media is copied into public/media (see README). We probe it to build responsive srcsets.
const MEDIA_DIR = process.env.PUBLII_MEDIA || join(ROOT, 'public', 'media');
const DATA_DIR = join(ROOT, 'src', 'data');

const RESPONSIVE_SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
// Pixel widths Publii assigns to each responsive suffix (technews theme defaults).
const RESPONSIVE_WIDTHS = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1366,
  '2xl': 1920,
};

if (!existsSync(DB_PATH)) {
  console.error(`✖ Publii DB not found at ${DB_PATH}`);
  console.error('  Set PUBLII_DB=/path/to/db.sqlite and retry.');
  process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });

/* ------------------------------------------------------------------ helpers */

const parseJSON = (s, fallback = {}) => {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
};

// Publii stores epoch-millis in created_at / modified_at.
const toISO = (ms) => new Date(Number(ms)).toISOString();

const stripHtml = (html) =>
  (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const STATUS_FLAGS = [
  'published',
  'featured',
  'draft',
  'trashed',
  'hidden',
  'excluded_homepage',
];

const parseStatus = (status) => {
  const set = new Set((status || '').split(',').map((s) => s.trim()));
  return {
    published: set.has('published'),
    featured: set.has('featured'),
    draft: set.has('draft'),
    trashed: set.has('trashed'),
    hidden: set.has('hidden'),
    excludedHomepage: set.has('excluded_homepage'),
  };
};

/* ----------------------------------------------------------------- lookups */

const tagRows = db.prepare('SELECT id, name, slug, description FROM tags').all();
const tagById = new Map(tagRows.map((t) => [t.id, t]));

const authorRows = db
  .prepare('SELECT id, name, username, config FROM authors')
  .all();
const authorById = new Map(authorRows.map((a) => [a.id, a]));

const postRows = db
  .prepare(
    `SELECT id, title, authors, slug, text, featured_image_id, created_at, modified_at, status, template
     FROM posts`
  )
  .all();
const slugById = new Map(postRows.map((p) => [p.id, p.slug]));

const postsTags = db.prepare('SELECT tag_id, post_id FROM posts_tags').all();
const tagsByPost = new Map();
for (const { tag_id, post_id } of postsTags) {
  if (!tagsByPost.has(post_id)) tagsByPost.set(post_id, []);
  const tag = tagById.get(tag_id);
  if (tag) tagsByPost.get(post_id).push(tag.slug);
}

const imageById = new Map(
  db
    .prepare('SELECT id, post_id, url, title, caption, additional_data FROM posts_images')
    .all()
    .map((img) => [img.id, img])
);

/* --------------------------------------------------------- link rewriting */

/**
 * Rewrite Publii placeholder URLs to live site paths.
 *   #DOMAIN_NAME#<file>        -> /media/posts/<postId>/<file>
 *   #INTERNAL_LINK#/post/<id>  -> /<slug>/
 *   #INTERNAL_LINK#/tag/<id>   -> /tema/<tagslug>/
 */
const rewriteBody = (html, postId) => {
  let out = html || '';

  out = out.replace(/#DOMAIN_NAME#\/?/g, `/media/posts/${postId}/`);

  out = out.replace(/#INTERNAL_LINK#\/post\/(\d+)/g, (_, id) => {
    const slug = slugById.get(Number(id));
    return slug ? `/${slug}/` : '#';
  });

  out = out.replace(/#INTERNAL_LINK#\/tag\/(\d+)/g, (_, id) => {
    const tag = tagById.get(Number(id));
    return tag ? `/tema/${tag.slug}/` : '#';
  });

  // Any leftover internal-link placeholders -> homepage (defensive).
  out = out.replace(/#INTERNAL_LINK#\/?/g, '/');

  return out;
};

/* ------------------------------------------------- responsive image srcset */

const splitExt = (filename) => {
  const dot = filename.lastIndexOf('.');
  return dot === -1
    ? [filename, '']
    : [filename.slice(0, dot), filename.slice(dot)];
};

/**
 * Build a responsive descriptor for a featured image whose base file is
 * /media/posts/<postId>/<url>. Probes public/media for the Publii responsive
 * variants and returns { src, srcset, sizes, width? } when present.
 */
const buildFeatured = (postId, image) => {
  if (!image || !image.url) return null;
  const meta = parseJSON(image.additional_data, {});
  const baseUrl = `/media/posts/${postId}/${image.url}`;
  const [stem, ext] = splitExt(image.url);

  const variants = [];
  for (const size of RESPONSIVE_SIZES) {
    const rel = join('posts', String(postId), 'responsive', `${stem}-${size}${ext}`);
    if (existsSync(join(MEDIA_DIR, rel))) {
      variants.push({
        url: `/media/posts/${postId}/responsive/${stem}-${size}${ext}`,
        width: RESPONSIVE_WIDTHS[size],
      });
    }
  }

  const srcset = variants.map((v) => `${v.url} ${v.width}w`).join(', ');

  return {
    src: baseUrl,
    srcset: srcset || null,
    sizes: srcset ? '(max-width: 50rem) 100vw, 50rem' : null,
    alt: meta.alt || image.title || '',
    caption: meta.caption || image.caption || '',
    credits: meta.credits || '',
  };
};

/* ----------------------------------------------------------------- authors */

const authors = authorRows.map((a) => {
  const cfg = parseJSON(a.config, {});
  let avatar = null;
  if (cfg.avatar) {
    // Author avatars live in media/website/<file>.
    avatar = cfg.avatar.startsWith('http')
      ? cfg.avatar
      : `/media/website/${cfg.avatar}`;
  }
  return {
    id: a.username,
    name: a.name,
    username: a.username,
    email: cfg.email || '',
    website: cfg.website || '',
    avatar,
    useGravatar: !!cfg.useGravatar,
    description: cfg.description || '',
    metaTitle: cfg.metaTitle || '',
    metaDescription: cfg.metaDescription || '',
  };
});

/* -------------------------------------------------------------------- tags */

const tags = tagRows.map((t) => ({
  id: t.slug,
  name: t.name,
  slug: t.slug,
  description: t.description || '',
}));

/* ------------------------------------------------------------------- posts */

const posts = [];
for (const p of postRows) {
  const status = parseStatus(p.status);
  if (status.trashed) continue; // never migrate trashed content
  if (!p.slug || !p.slug.trim()) continue; // skip empty-slug autosave junk

  const core = parseJSON(
    db
      .prepare(
        "SELECT value FROM posts_additional_data WHERE post_id = ? AND key = '_core'"
      )
      .get(p.id)?.value,
    {}
  );

  const authorUsernames = (p.authors || '')
    .split(',')
    .map((id) => authorById.get(Number(id.trim()))?.username)
    .filter(Boolean);

  const postTags = tagsByPost.get(p.id) || [];

  // _core.mainTag may be a numeric tag id, a slug, or empty. Normalise to a slug.
  let mainTag = core.mainTag;
  if (mainTag !== undefined && mainTag !== null && mainTag !== '') {
    const asNum = Number(mainTag);
    if (Number.isFinite(asNum) && tagById.has(asNum)) {
      mainTag = tagById.get(asNum).slug;
    } else {
      mainTag = String(mainTag);
    }
  } else {
    mainTag = '';
  }
  if (!mainTag) mainTag = postTags[0] || '';
  const featuredImage = buildFeatured(p.id, imageById.get(p.featured_image_id));
  const html = rewriteBody(p.text, p.id);

  posts.push({
    id: p.slug,
    postId: p.id,
    title: p.title,
    slug: p.slug,
    html,
    excerpt: stripHtml(p.text).slice(0, 200),
    date: toISO(p.created_at),
    updated: toISO(p.modified_at),
    authors: authorUsernames,
    tags: postTags,
    featuredImage,
    template: p.template === 'alternative' ? 'alternative' : 'default',
    status,
    metaTitle: core.metaTitle || '',
    metaDesc: core.metaDesc || '',
    metaRobots: core.metaRobots || '',
    canonicalUrl: core.canonicalUrl || '',
    mainTag,
  });
}

// Stable ordering: newest first (matches Publii postsListingOrder DESC).
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

/* ------------------------------------------------------------------- write */

mkdirSync(DATA_DIR, { recursive: true });
writeFileSync(join(DATA_DIR, 'posts.json'), JSON.stringify(posts, null, 2));
writeFileSync(join(DATA_DIR, 'authors.json'), JSON.stringify(authors, null, 2));
writeFileSync(join(DATA_DIR, 'tags.json'), JSON.stringify(tags, null, 2));

const published = posts.filter((p) => p.status.published && !p.status.draft);
console.log(`✔ posts:   ${posts.length} migrated (${published.length} published, ${posts.length - published.length} draft/hidden)`);
console.log(`✔ authors: ${authors.length}`);
console.log(`✔ tags:    ${tags.length}`);
console.log(`→ wrote src/data/{posts,authors,tags}.json`);

db.close();

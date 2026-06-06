/**
 * Content-query helpers over the posts/authors/tags collections.
 * Centralises the Publii status-flag semantics so pages stay declarative.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Author = CollectionEntry<'authors'>;
export type Tag = CollectionEntry<'tags'>;

const byDateDesc = (a: Post, b: Post) =>
  b.data.date.getTime() - a.data.date.getTime();

/** Posts that should produce a rendered page: published and not draft/trashed. */
export async function getRenderablePosts(): Promise<Post[]> {
  const posts = await getCollection('posts');
  return posts
    .filter((p) => p.data.status.published && !p.data.status.draft && !p.data.status.trashed)
    .sort(byDateDesc);
}

/** Homepage / listing posts: renderable and not excluded from homepage, not hidden. */
export async function getListablePosts(): Promise<Post[]> {
  const posts = await getRenderablePosts();
  return posts.filter(
    (p) => !p.data.status.excludedHomepage && !p.data.status.hidden
  );
}

export async function getFeaturedPosts(limit?: number): Promise<Post[]> {
  const posts = await getRenderablePosts();
  const featured = posts.filter((p) => p.data.status.featured);
  return limit ? featured.slice(0, limit) : featured;
}

export async function getPostsByTag(slug: string): Promise<Post[]> {
  const posts = await getListablePosts();
  return posts.filter((p) => p.data.tags.includes(slug));
}

export async function getPostsByAuthor(username: string): Promise<Post[]> {
  const posts = await getListablePosts();
  return posts.filter((p) => p.data.authors.includes(username));
}

/** Related posts by shared tags (Publii relatedPostsCriteria titles-and-tags). */
export async function getRelatedPosts(post: Post, limit: number): Promise<Post[]> {
  const posts = await getRenderablePosts();
  const tagSet = new Set(post.data.tags);
  const scored = posts
    .filter((p) => p.id !== post.id)
    .map((p) => ({
      post: p,
      score: p.data.tags.filter((t) => tagSet.has(t)).length,
    }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || byDateDesc(a.post, b.post));

  const out = scored.slice(0, limit).map((s) => s.post);
  // Pad with recent posts if not enough shared-tag matches (relatedPostsIncludeAllPosts).
  if (out.length < limit) {
    for (const p of posts) {
      if (out.length >= limit) break;
      if (p.id !== post.id && !out.includes(p)) out.push(p);
    }
  }
  return out;
}

/** Previous/next in chronological order (next = newer, prev = older). */
export async function getAdjacentPosts(
  post: Post
): Promise<{ prev: Post | null; next: Post | null }> {
  const posts = await getRenderablePosts(); // newest first
  const idx = posts.findIndex((p) => p.id === post.id);
  if (idx === -1) return { prev: null, next: null };
  return {
    next: idx > 0 ? posts[idx - 1] : null,
    prev: idx < posts.length - 1 ? posts[idx + 1] : null,
  };
}

export async function getAuthor(username: string): Promise<Author | undefined> {
  const authors = await getCollection('authors');
  return authors.find((a) => a.data.username === username);
}

export async function getAuthorsByUsernames(usernames: string[]): Promise<Author[]> {
  const authors = await getCollection('authors');
  return usernames
    .map((u) => authors.find((a) => a.data.username === u))
    .filter((a): a is Author => Boolean(a));
}

export async function getTag(slug: string): Promise<Tag | undefined> {
  const tags = await getCollection('tags');
  return tags.find((t) => t.data.slug === slug);
}

export async function getTagsBySlugs(slugs: string[]): Promise<Tag[]> {
  const tags = await getCollection('tags');
  return slugs
    .map((s) => tags.find((t) => t.data.slug === s))
    .filter((t): t is Tag => Boolean(t));
}

/** Tags that have at least one listable post, with counts (displayEmptyTags:false). */
export async function getNonEmptyTags(): Promise<Array<{ tag: Tag; count: number }>> {
  const [tags, posts] = [await getCollection('tags'), await getListablePosts()];
  return tags
    .map((tag) => ({
      tag,
      count: posts.filter((p) => p.data.tags.includes(tag.data.slug)).length,
    }))
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count || a.tag.data.name.localeCompare(b.tag.data.name));
}

/** Authors that have at least one listable post (displayEmptyAuthors:false). */
export async function getNonEmptyAuthors(): Promise<Author[]> {
  const [authors, posts] = [await getCollection('authors'), await getListablePosts()];
  return authors.filter((a) =>
    posts.some((p) => p.data.authors.includes(a.data.username))
  );
}

import type { APIContext } from 'astro';
import { getListablePosts, getAuthor } from '../lib/content';
import { SITE } from '../lib/site';

// JSON Feed 1.1 (Publii feed.enableJson:1), full text + featured image.
export async function GET(_context: APIContext) {
  const posts = (await getListablePosts()).slice(0, 1000);

  const items = await Promise.all(
    posts.map(async (post) => {
      const d = post.data;
      const author = d.authors[0] ? await getAuthor(d.authors[0]) : undefined;
      const url = new URL(`/${d.slug}/`, SITE.domain).href;
      return {
        id: url,
        url,
        title: d.title,
        content_html: d.html,
        summary: d.excerpt,
        date_published: d.date.toISOString(),
        date_modified: d.updated.toISOString(),
        ...(d.featuredImage?.src
          ? { image: new URL(d.featuredImage.src, SITE.domain).href }
          : {}),
        ...(author ? { authors: [{ name: author.data.name }] } : {}),
        tags: d.tags,
      };
    })
  );

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE.displayName,
    home_page_url: SITE.domain + '/',
    feed_url: new URL('/feed.json', SITE.domain).href,
    description: 'Codamos: blogs sobre desenvolvimento de software.',
    language: 'pt-br',
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: { 'Content-Type': 'application/feed+json; charset=utf-8' },
  });
}

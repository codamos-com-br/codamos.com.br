import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getListablePosts } from '../lib/content';
import { SITE } from '../lib/site';

// Full-text RSS (Publii feed.showFullText:1), newest first, up to 1000 posts.
export async function GET(context: APIContext) {
  const posts = (await getListablePosts()).slice(0, 1000);
  const site = context.site ?? new URL(SITE.domain);

  return rss({
    title: SITE.displayName,
    description: 'Codamos: blogs sobre desenvolvimento de software.',
    site,
    items: posts.map((post) => ({
      title: post.data.title,
      link: `/${post.data.slug}/`,
      pubDate: post.data.date,
      description: post.data.excerpt,
      content: post.data.html,
      categories: post.data.tags,
    })),
    customData: `<language>pt-br</language>`,
  });
}

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readFileSync } from 'node:fs';

const SITE_URL = 'https://codamos.com.br';

// Dados dos posts para o sitemap: <lastmod> real (campo `updated`) e exclusão
// de posts com meta robots `noindex` — listar no sitemap uma URL que pede para
// não ser indexada é um sinal contraditório para o Google.
const posts = JSON.parse(readFileSync(new URL('./src/data/posts.json', import.meta.url), 'utf8'));
const renderable = posts.filter(
  (p) => p.status.published && !p.status.draft && !p.status.trashed
);
const postUrl = (p) => `${SITE_URL}/${p.slug}/`;
const noindexUrls = new Set(
  renderable.filter((p) => /noindex/i.test(p.metaRobots)).map(postUrl)
);
const lastmodByUrl = new Map(renderable.map((p) => [postUrl(p), p.updated]));
// Homepage e paginações mudam sempre que sai um post novo.
const latestUpdate = renderable
  .filter((p) => !p.status.hidden && !p.status.excludedHomepage)
  .map((p) => p.updated)
  .sort()
  .at(-1);

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  // Publii used cleanUrls:true, addIndex:false → directory-style /<slug>/ URLs.
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  // URL audit: every published slug is carried over unchanged from Publii.
  // The one canonical override (tdd-php-exemplos → canonical /php-tdd/) gets a
  // redirect so that canonical URL resolves instead of 404ing. (#15)
  redirects: {
    '/php-tdd': '/tdd-php-exemplos/',
  },
  integrations: [
    sitemap({
      // Tag pages and the tags list are noindex in Publii — keep them out of the sitemap
      // to match `metaRobotsTags`/`metaRobotsTagsList: noindex`.
      filter: (page) =>
        !page.includes('/tema/') &&
        !page.includes('/search') &&
        !page.includes('/404') &&
        !noindexUrls.has(page),
      serialize: (item) => {
        const lastmod =
          lastmodByUrl.get(item.url) ??
          (item.url === `${SITE_URL}/` || item.url.startsWith(`${SITE_URL}/pagina/`)
            ? latestUpdate
            : undefined);
        return lastmod ? { ...item, lastmod } : item;
      },
      i18n: undefined,
    }),
  ],
});

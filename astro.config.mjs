// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://codamos.com.br',
  // Publii used cleanUrls:true, addIndex:false → directory-style /<slug>/ URLs.
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      // Tag pages and the tags list are noindex in Publii — keep them out of the sitemap
      // to match `metaRobotsTags`/`metaRobotsTagsList: noindex`.
      filter: (page) =>
        !page.includes('/tema/') &&
        !page.includes('/search') &&
        !page.includes('/404'),
      i18n: undefined,
    }),
  ],
});

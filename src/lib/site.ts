/**
 * Central site configuration — ported from Publii site.config.json /
 * theme.config.json so every page/component shares one source of truth.
 */

export const SITE = {
  domain: 'https://codamos.com.br',
  name: 'codamos.com.br',
  displayName: 'codamos.com.br',
  language: 'pt-br',
  locale: 'pt_BR',

  logo: '/media/website/codamos-logo-2.png',
  favicon: '/media/website/codamos-favicon-2.png',
  faviconType: 'image/png',
  // Default OpenGraph image (Publii openGraphImage).
  ogImage: '/media/website/codamos_logo_quadrado.jpg',

  // Layout tokens (theme.config customConfig).
  mainWidth: '50rem',
  sidebarWidth: '18rem',

  // Pagination sizes.
  postsPerPage: 20,
  tagsPostsPerPage: 10,
  authorsPostsPerPage: 20,
  featuredPostsNumber: 2,
  relatedPostsNumber: 3,

  // URL prefixes (Publii urls config).
  tagsPrefix: 'tema',
  authorsPrefix: 'autor',
  pageName: 'pagina',

  // theme-color (metaTabColors plugin).
  themeColorLight: '#3F51B5',
  themeColorDark: '#FFFFFF',

  // Integrations.
  ga4Id: 'G-Q9019ZP1VV',
  adsenseClient: 'ca-pub-3681134868307419',
  disqusShortname: 'codamos',
  twitterUsername: 'nawarian',
  twitterShareName: '_codamos',
  newsletterEndpoint: 'https://newsletter.codamos.com.br/',

  social: {
    twitter: 'https://twitter.com/_codamos',
    telegram: 'https://t.me/codamos_forum',
  },

  // Year range ends at the current (build-time) year so it never goes stale.
  copyright: `© 2021-${new Date().getFullYear()} codamos.com.br`,
} as const;

/* SEO meta title templates (Publii advanced.*MetaTitle). %sitename = SITE.name */
export const META = {
  siteTitle: 'Codamos: blogs sobre desenvolvimento de software - %sitename',
  postTitle: '%posttitle - %sitename',
  tagTitle: 'Tag: %tagname - %sitename',
  tagsTitle: 'Tags - %sitename',
  authorTitle: 'Autor: %authorname - %sitename',
  authorDescription: 'Leia artigos, tutoriais e de programação escritas por %authorname',
  errorTitle: 'Página não encontrada: 404 - %sitename',
  searchTitle: 'Busca - %sitename',

  robotsSite: 'index, follow',
  robotsPost: 'index, follow',
  robotsTags: 'noindex, follow',
  robotsTagsList: 'noindex, follow',
  robotsAuthors: 'index, follow',
  robotsError: 'noindex, follow',
  robotsSearch: 'noindex, follow',
} as const;

export const fillTemplate = (
  template: string,
  vars: Record<string, string>
): string => {
  let out = template.replace(/%sitename/g, SITE.name);
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`%${key}`, 'g'), value);
  }
  return out.trim();
};

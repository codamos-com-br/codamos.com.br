/**
 * Main navigation, resolved from Publii menu.config.json.
 * Link ids were mapped to slugs at migration time:
 *   tags  35→mysql 8→javascript 1→php 2→git 7→c 12→sokoban 6→emulador-nes
 *   posts 55→codigo-de-conduta 21→sobre-o-codamoscombr
 */
export interface MenuItem {
  label: string;
  href: string;
  title?: string;
  items?: MenuItem[];
}

export const MAIN_MENU: MenuItem[] = [
  { label: 'Início', href: '/', title: 'Ir para home-page.' },
  { label: 'MySQL', href: '/tema/mysql/' },
  { label: 'JS', href: '/tema/javascript/' },
  { label: 'PHP', href: '/tema/php/' },
  { label: 'GIT', href: '/tema/git/' },
  { label: 'C', href: '/tema/c/' },
  {
    label: 'Devlog',
    href: '/tema/',
    items: [
      { label: 'Jogo: Sokoban', href: '/tema/sokoban/' },
      { label: 'Emulador NES', href: '/tema/emulador-nes/' },
    ],
  },
  { label: 'Código de conduta', href: '/codigo-de-conduta/' },
  { label: 'Sobre nós', href: '/sobre-o-codamoscombr/' },
];

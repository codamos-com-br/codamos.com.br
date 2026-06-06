# codamos.com.br

Blog sobre desenvolvimento de software — migrado de [Publii](https://getpublii.com)
(tema `technews`) para **[Astro](https://astro.build)**, preservando paridade de
funcionalidades, URLs e SEO. Veja o épico [#1](../../issues/1).

## Stack

- **Astro** (output estático), TypeScript estrito.
- Conteúdo em **content collections** geradas a partir do `db.sqlite` do Publii.
- CSS portado do tema `technews` (`src/styles/theme.css`), fontes do sistema (`font-pair-0`).
- Busca client-side via **Pagefind**.
- Deploy em **GitHub Pages**.

## Desenvolvimento

```bash
npm install        # instala dependências
npm run import     # (re)gera src/data/*.json a partir do db.sqlite do Publii
npm run dev        # servidor local em http://localhost:4321
npm run build      # build estático em dist/ (Astro + índice Pagefind)
npm run preview    # serve o build de dist/
npm run format     # Prettier
```

Node 20+ (veja `.nvmrc`).

### Migração de conteúdo

`npm run import` executa `scripts/import-content.mjs`, que lê o banco do Publii com
`better-sqlite3` e emite `src/data/{posts,authors,tags}.json` (validados por schemas
zod em `src/content.config.ts`).

- Caminho do banco padrão: `~/Documents/Publii/sites/codamoscombr/input/db.sqlite`
  (sobrescreva com `PUBLII_DB=/caminho/db.sqlite`).
- Decodifica flags de status (`published`, `featured`, `draft`, `hidden`,
  `excluded_homepage`, `trashed`); conteúdo `trashed` nunca é migrado, drafts são
  importados mas **não** geram páginas.
- Reescreve placeholders do Publii: `#DOMAIN_NAME#` → `/media/posts/<id>/`,
  `#INTERNAL_LINK#/post/<id>` → `/<slug>/`, `#INTERNAL_LINK#/tag/<id>` → `/tema/<slug>/`.
- Monta `srcset` responsivo dos thumbnails de capa a partir das variantes do Publii.

## Decisões de migração

- **Mídia** (`public/media`, ~319 MB): a árvore de mídia do Publii é copiada como
  está para preservar as URLs codificadas no corpo dos posts. (Candidato futuro a
  Git LFS / storage externo.)
- **/docs** (`public/docs`): manual do Composer (mdBook pré-buildado) — **fora do
  escopo** da migração, mantido por *passthrough* para não quebrar. Para atualizá-lo,
  substitua `public/docs/` pelo novo output do mdBook.
- **URLs**: estilo diretório `/<slug>/` (`trailingSlash: 'always'`), prefixos
  `tema/`, `autor/`, paginação `pagina/<n>/` — idênticos ao Publii. Único redirect:
  `/php-tdd` → `/tdd-php-exemplos/` (canonical override).
- **GDPR**: scripts não essenciais (GA4, AdSense, Disqus) só carregam após consentimento.

## Deploy

`git push` na branch `main` dispara `.github/workflows/deploy.yml`:
instala → `npm run build` → publica `dist/` no **GitHub Pages**.

Domínio customizado `codamos.com.br` via `public/CNAME`. Após o primeiro deploy,
habilite Pages em *Settings → Pages → Source: GitHub Actions* e configure o DNS
(`A`/`AAAA` para os IPs do GitHub Pages, ou `CNAME` no apex conforme o provedor).
O `/docs` é preservado no mesmo artefato de build.

# codamos.com.br

Blog sobre desenvolvimento de software — migrado de [Publii](https://getpublii.com)
(tema `technews`) para **[Astro](https://astro.build)**, preservando paridade de
funcionalidades, URLs e SEO. Veja o épico [#1](../../issues/1).

## Stack

- **Astro** (output estático), TypeScript estrito.
- Conteúdo em **content collections** a partir de `src/data/*.json` (fonte de verdade canônica; o Publii foi abandonado).
- CSS portado do tema `technews` (`src/styles/theme.css`), fontes do sistema (`font-pair-0`).
- Busca client-side via **Pagefind**.
- Deploy em **GitHub Pages**.

## Desenvolvimento

```bash
npm install        # instala dependências
npm run import     # (legado) importação única do Publii — NÃO reexecute (ver abaixo)
npm run dev        # servidor local em http://localhost:4321
npm run build      # build estático em dist/ (Astro + índice Pagefind)
npm run preview    # serve o build de dist/
npm run format     # Prettier
```

Node 20+ (veja `.nvmrc`).

### Fonte de verdade do conteúdo

> **O Publii foi abandonado.** A migração terminou e `src/data/{posts,authors,tags}.json`
> é agora a **fonte de verdade canônica** do conteúdo — edite esses arquivos
> diretamente. **Não reexecute `npm run import`:** ele sobrescreveria as edições feitas
> no JSON com o estado antigo (e já defasado) do `db.sqlite` do Publii.

`scripts/import-content.mjs` fica preservado apenas como registro histórico da
importação única. Para referência, ele lia o banco do Publii com `better-sqlite3` e
emitia os três JSON (validados por schemas zod em `src/content.config.ts`):

- Decodificava flags de status (`published`, `featured`, `draft`, `hidden`,
  `excluded_homepage`, `trashed`); conteúdo `trashed` nunca era migrado, drafts eram
  importados mas **não** geram páginas.
- Reescrevia placeholders do Publii: `#DOMAIN_NAME#` → `/media/posts/<id>/`,
  `#INTERNAL_LINK#/post/<id>` → `/<slug>/`, `#INTERNAL_LINK#/tag/<id>` → `/tema/<slug>/`.
- Montava `srcset` responsivo dos thumbnails de capa a partir das variantes do Publii.

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

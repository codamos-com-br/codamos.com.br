# AGENTS.md

Este arquivo fornece orientações para agentes de código ao trabalhar com o código
deste repositório.

## Idioma

Tudo o que for escrito neste repositório deve estar em **português do Brasil
(pt-BR)**: issues, pull requests (títulos e descrições), documentação e mensagens de
commit. Identificadores de código e termos técnicos podem permanecer em inglês onde
essa for a convenção estabelecida, mas todo texto escrito para humanos deve estar em
pt-BR.

## Convenção de commits

Todo commit deve ter como co-autor **Apiario Dev**, e nenhum outro co-autor pode ser
adicionado. Finalize cada mensagem de commit com exatamente este trailer (e nada mais
em seu lugar):

```
Co-authored-by: Apiario Dev <noreply@apiario.dev>
```

Não substitua pela identidade do seu agente/modelo nem por qualquer outro co-autor.

## Registro de alterações

Toda alteração feita no repositório deve ser registrada no `CHANGELOG.md`,
idealmente **antes de fazer o commit**. Agrupe as entradas sob a data
correspondente (formato `AAAA-MM-DD`) e escreva-as em pt-BR.

## O que é isto

`codamos.com.br` — um blog de desenvolvimento de software em português **migrado do
Publii** (tema `technews`) para um site estático em **Astro**. A estrela-guia da
migração é a **paridade**: URLs, metadados de SEO e comportamento devem coincidir com
a saída antiga do Publii. Na dúvida, preserve a semântica do Publii em vez de
"melhorá-la" — muitas decisões não óbvias (noindex nas páginas de tema, o único
redirect, URLs no estilo de diretório) existem puramente para manter a migração sem
perdas. Veja a seção "Decisões de migração" do `README.md`.

## Comandos

```bash
npm run import     # (re)gera src/data/*.json a partir do db.sqlite do Publii
npm run dev        # servidor de desenvolvimento local em http://localhost:4321
npm run build      # build estático para dist/ (astro build + índice pagefind)
npm run preview    # serve o build de dist/
npm run format     # Prettier (escreve src/**/*.{astro,ts,js,mjs,css} + scripts)
```

Node 20+ (`.nvmrc`). **Não há** suíte de testes nem linter além do Prettier.

## Arquitetura

O site é orientado a dados, não um arquivo por post. O conteúdo vive em **três
arquivos JSON** (`src/data/{posts,authors,tags}.json`) carregados como **content
collections** do Astro (`src/content.config.ts`, validados por schemas zod). Esses
arquivos JSON são **artefatos gerados** — não os edite manualmente.

Fluxo de dados:

```
Publii db.sqlite ──(npm run import)──> src/data/*.json ──(content collections)──> páginas Astro ──(astro build + pagefind)──> dist/
```

- **`scripts/import-content.mjs`** lê o banco SQLite do Publii com `better-sqlite3`
  e emite o JSON. Ele decodifica os bit-flags de status do Publii (`published`,
  `featured`, `draft`, `hidden`, `excludedHomepage`, `trashed`), reescreve os
  placeholders do Publii no HTML dos posts (`#DOMAIN_NAME#`,
  `#INTERNAL_LINK#/post/<id>`, `#INTERNAL_LINK#/tag/<id>`), e constrói o `srcset`
  responsivo para as miniaturas de capa. O caminho padrão do banco é
  `~/Documents/Publii/sites/codamoscombr/input/db.sqlite`; sobrescreva com
  `PUBLII_DB=...`. Conteúdo na lixeira nunca é emitido; rascunhos são emitidos, mas
  não geram páginas.

- **`src/lib/content.ts`** é o único lugar que codifica a **semântica das flags de
  status** do Publii como helpers de consulta. Use-os em vez de filtrar
  `getCollection` diretamente, para que as regras de published/draft/hidden/excluded
  permaneçam consistentes:
  - `getRenderablePosts()` — published, não draft/trashed (estes geram páginas).
  - `getListablePosts()` — renderable menos hidden/excluídos da homepage (listagens).
  - Além de `getFeaturedPosts`, `getPostsByTag`, `getPostsByAuthor`, `getRelatedPosts`
    (pontuação por tags compartilhadas), `getAdjacentPosts` (prev=mais antigo,
    next=mais recente), e helpers de tag/autor não vazios.

- **`src/lib/site.ts`** é a única fonte de verdade para a configuração do site
  (`SITE`) e os templates de título/robots de SEO (`META`, `fillTemplate`), portados
  do JSON de configuração do Publii. Tamanhos de paginação, prefixos de URL
  (`tema`/`autor`/`pagina`), IDs de integração (GA4, AdSense, Disqus) e cores do tema
  vivem todos aqui.

- **`src/lib/menu.ts`** — navegação principal, mapeada manualmente a partir do
  `menu.config.json` do Publii (ids de link → slugs).

### Roteamento (deve coincidir com as URLs do Publii)

`astro.config.mjs` define `trailingSlash: 'always'` + `format: 'directory'` para
reproduzir as URLs no estilo de diretório `/<slug>/` do Publii. Arquivos de rota em
`src/pages/`: posts em `/[slug]`, temas em `/tema/[tag]/` (+ `pagina/[page]`), autores
em `/autor/[author]/` (+ paginação), paginação da homepage em `/pagina/[page]`, além
de `feed.xml`/`feed.json`, `search/` e `404`. O **único** redirect é
`/php-tdd → /tdd-php-exemplos/` (uma sobrescrita canônica). As páginas de tema e a
busca são `noindex` e são filtradas do sitemap — mantenha-as fora.

### Estilização

O CSS é portado do tema `technews` do Publii: `src/styles/theme.css` (tema
principal), além de `editor.css`, `overrides.css`, `photoswipe.css`. Fontes de
sistema (`font-pair-0`).

### Peças do lado do cliente

- **Busca**: Pagefind, indexado como parte do `npm run build` (não no `dev`).
- **LGPD/GDPR**: scripts não essenciais (GA4, AdSense, Disqus) carregam **somente
  após o consentimento** via `CookieConsent.astro` / `Analytics.astro`. As analytics
  são renderizadas somente em builds de produção.

## Ativos mantidos como estão (não reestruturar)

- `public/media/` (~319 MB): a árvore de mídia do Publii, copiada literalmente para
  preservar as URLs codificadas nos corpos dos posts.
- `public/docs/`: mdBook pré-construído (manual do Composer), fora do escopo da
  migração, servido por passthrough. Para atualizar, substitua `public/docs/` pela
  saída fresca do mdBook.

## Deploy

Fazer push para `main` dispara `.github/workflows/deploy.yml`: install →
`npm run build` → publica `dist/` no GitHub Pages. Domínio personalizado via
`public/CNAME`.

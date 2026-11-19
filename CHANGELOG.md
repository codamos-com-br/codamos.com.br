# Registro de alterações

Todas as alterações relevantes deste projeto estão documentadas neste arquivo.

## 2026-11-19

- **Novo post `nginx2root-cves-nginx-o-que-fazer`:** adicionado em
  `src/data/posts.json` (postId 81, autor `nawarian`, tags `linux` e `tecnica`) o
  artigo "nginx2root: novas falhas críticas de segurança dão acesso de root ao seu
  site!", sobre a série de CVEs do nginx divulgada em 18/11/2026. Traz
  plano de ação por prazo (hoje / esta semana / depois), mitigações por CVE, o caso do
  ingress-nginx aposentado, o bug de SCTP no kernel, quem descobriu as falhas e um
  resumo da repercussão. Baseado no blog da Xint, nos FAQs da Tenable e da watchTowr e
  em reportagens linkadas no post, com canonical absoluta autorreferente.
- **Capa do post `nginx2root-cves-nginx-o-que-fazer`:** criada no mesmo estilo da capa
  do post do PHP 8.6 (janela de editor com `listen 443 ssl http2;` em destaque, logo
  CAMARADEV e wordmark), em `public/media/posts/81/`, com original 1280×720 e variantes
  `xs`/`sm`/`md`/`lg`/`xl`/`2xl` em `responsive/`.
- **Artes SVG no post `nginx2root-cves-nginx-o-que-fazer`:** as tabelas dos cinco CVEs
  e da linha do tempo da divulgação viraram ilustrações SVG com a paleta do site
  (`public/media/posts/81/nginx2root-cves*.svg` e
  `nginx2root-linha-do-tempo*.svg`), cada uma com versão desktop e mobile servidas via
  `<picture>` para o texto continuar legível em telas estreitas.
- **Numeração do sumário:** corrigido em `src/styles/overrides.css` o sumário
  (`.post__toc`) que começava a numerar do ponto onde uma lista anterior do post
  parou (no post do nginx2root, começava no 8). O `counter-reset:item` do tema
  anulava o reset do contador nativo `list-item`; agora os dois são resetados.
- **Agente `nawarian`:** criado `.claude/agents/nawarian.md`, uma definição de agente
  que reproduz a voz, o tom e o raciocínio de engenharia do Nawarian. Ela foi destilada
  da leitura dos 67 posts do autor em `src/data/posts.json` e serve para redigir e
  revisar posts e responder dúvidas técnicas no estilo do blog.
- **Novo post `php-8-6-novidades`:** adicionado em `src/data/posts.json` (postId 80,
  autor `nawarian`, tag `php`) o artigo "Novidades do PHP 8.6: o que muda no seu
  código e o que pode quebrar no upgrade", baseado na página oficial de lançamento
  (`php.net/releases/8.6`) e nas RFCs linkadas nela. Cobre Partial Function
  Application, `Time\Duration`, `clamp()`, `SortDirection`, readonly com valor padrão,
  erros de stream, `Io\Poll`, novidades de Reflection, mudanças de comportamento e
  deprecações, com canonical absoluta autorreferente.
- **Capa do post `php-8-6-novidades`:** criada a imagem de capa (editor com exemplo de
  Partial Function Application, logo CAMARADEV e wordmark em Courier Prime) em
  `public/media/posts/80/`, seguindo o padrão dos posts migrados do Publii: original
  1280×720 e variantes `xs`/`sm`/`md`/`lg`/`xl`/`2xl` em `responsive/` (JPEG
  qualidade 60, sem metadados), com `srcset`/`sizes` no mesmo formato dos demais.
- **CTA de contato via LinkedIn:** o post `php-8-6-novidades` deixa de chamar o leitor
  para o Twitter e passa a apontar para o LinkedIn do autor. A definição do agente
  `nawarian` (`.claude/agents/nawarian.md`) foi atualizada com a mesma regra: posts
  novos não convidam para o Twitter/X; o contato é pelo LinkedIn.
- **Bio do autor `nawarian`:** em `src/data/authors.json`, o nome exibido passa de
  "Nawarian" para "Níckolas Da Silva"; a bio agora apresenta o autor como CEO e
  fundador do [Apiário Dev](https://apiario.dev) e remove a menção ao Núcleo de
  Tecnologia do MTST; o `website` passa do Twitter para o LinkedIn. O `id`/`username`
  continua `nawarian`, preservando a URL `/autor/nawarian/`.

## 2026-07-09

Revisão editorial e de SEO dos posts do Nawarian — **fase 1: correção crítica** (issue #17).

- **Documentação:** `src/data/*.json` passa a ser a fonte de verdade canônica do
  conteúdo; o Publii foi abandonado e o `db.sqlite` não deve mais ser reimportado
  (`AGENTS.md` e `README.md` atualizados; `npm run import` marcado como legado).
- **Canonical:** corrigidas duas `canonicalUrl` suspeitas que podiam desindexar/diluir
  páginas — `tdd-php-exemplos` (apontava para `php-tdd`, uma URL que redireciona) e
  `como-php-funciona` (canonical relativa fora do padrão). Ambas passam a
  autorreferenciar o próprio slug absoluto.
- **Correção de código que não colava/compilava ou renderizava quebrado:**
  - `subindo-arquivos-no-github`: en-dashes (`–`) em flags de comandos git → hífen.
  - `tdd-php-exemplos`: `phpunnit` → `phpunit`.
  - `testes-php-phpunit`: variáveis-variáveis acidentais (`$$umaAsa`, `$$duasAsas`).
  - `como-escrever-macros-em-c`: `#define LOG_INFO(__VA_ARGS__)` → `(...)`.
  - `jogos-em-php`: game loop com `||` que nunca parava → `!$this->shouldStop &&`;
    `Timming` → `Timing`.
  - `como-conectar-mongodb-nodejs-com-mongoose-tdd`: `mongoose.model('artigos')`
    registrado 2× (`OverwriteModelError`) → guarda com `mongoose.models`.
  - `migracao-banco-de-dados`: `-` no lugar de `=` na atribuição do UUID; `findnById`
    → `findById`; `$id->getId` → `$id->getId()`.
  - `devlog-emulador-nes-emulacao-da-cpu-6502-parte-1`: `bus[0xFFFF]` → `bus[0x10000]`
    (o array precisa comportar o endereço 0xFFFF).
  - `devlog-sokoban-jogador-movimento`: inicializador de `Rectangle` sem `;`;
    comentário `100 + 0 = 0` → `100`.
  - `php-docker-setup`: `restart: never` (política inválida do Compose) → `restart: "no"`;
    `.` não escapado no `location ~ .php$` do nginx → `\.php$`.
  - `o-que-e-software-livre`: `<div>` do painel de destaque não fechada — o restante do
    post ficava dentro do painel verde; painel agora fecha após a mensagem.
  - `php-bitwise`: aspas tipográficas (`‘ ’`) em blocos de código PHP (Parse error) →
    aspas retas.
  - `guia-arrays-no-php`: typos que quebravam exemplos (`$file_do_mercado`,
    `$site_prontuacao`); interpolação `"$arr['chave']"` (Parse error) → `{$arr['chave']}`.
  - `como-redefinir-a-senha-de-root-mysql-mariadb`: sob `--skip-grant-tables`, o
    `ALTER USER` falha no MySQL 5.7+/8.0 — `FLUSH PRIVILEGES` movido para antes, com
    explicação.
- **Correções remanescentes que o passo mecânico deixou passar (revisão):**
  - `php-bitwise`: `fopen(arquivo.jpeg', 'rb')` sem a aspa de abertura (Parse error) →
    `fopen('arquivo.jpeg', 'rb')`.
  - `subindo-arquivos-no-github`: o en-dash representava a flag longa de dois hífens —
    `git rm -cached` → `git rm --cached`.
  - `subindo-arquivos-no-github`: aspas tipográficas (`" "`) nos blocos `<pre>` (saída do
    git e comando `git commit -m`) → aspas retas; a prosa foi mantida intacta.

## 2026-07-08

- Migração do site para Astro + GitHub Pages.
- Ajuste de títulos e meta descrições da maioria das páginas.
- Otimização do gerador de UUID para funcionar sem depender de rede.

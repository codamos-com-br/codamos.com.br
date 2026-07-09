# Registro de alterações

Todas as alterações relevantes deste projeto estão documentadas neste arquivo.

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

## 2026-07-08

- Migração do site para Astro + GitHub Pages.
- Ajuste de títulos e meta descrições da maioria das páginas.
- Otimização do gerador de UUID para funcionar sem depender de rede.

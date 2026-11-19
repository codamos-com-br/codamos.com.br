---
name: analise-gsc
description: >-
  Analisa exportações do Google Search Console (GSC / Search Console — o .zip
  "Performance on Search" / "Desempenho na Pesquisa" com Consultas.csv,
  Páginas.csv, Gráfico.csv etc.) para medir desempenho de busca orgânica do
  codamos.com.br. Use SEMPRE que o usuário mencionar GSC, Search Console, dados
  de busca do Google, cliques/impressões/CTR/posição, quiser saber o IMPACTO de
  mudanças recentes (deploy, SEO, meta tags, sitemap) no tráfego orgânico, ou
  pedir para achar páginas/consultas com potencial de otimização — mesmo que não
  cite a sigla "GSC" ou o nome do arquivo. Também vale para "por que o tráfego
  caiu/subiu?", "essas mudanças funcionaram?" e "onde vale mexer no SEO?".
---

# Análise de Google Search Console (GSC)

Este skill transforma uma exportação crua do Search Console em conclusões
acionáveis e **honestas** sobre o desempenho de busca orgânica. O modo carro-chefe
é medir o **impacto de uma mudança** (um deploy, uma rodada de SEO), amarrando os
números do GSC ao histórico do git — mas também serve para panorama geral e para
achar as melhores oportunidades de otimização.

O objetivo não é despejar métricas: é dizer **o que mudou, o quanto disso dá para
atribuir à mudança, e o que fazer a seguir** — sem exagerar em cima de poucos dias
de dados.

## Quando o GSC exporta e o que você recebe

O botão de exportar no relatório de Desempenho gera um `.zip` com vários CSVs, **no
idioma da conta** (aqui, pt-BR): `Gráfico.csv` (série temporal por dia — o mais
importante), `Consultas.csv`, `Páginas.csv`, `Países.csv`, `Dispositivos.csv`,
`Filtros.csv`. Em contas em inglês os nomes mudam (`Dates.csv`, `Queries.csv`,
`Pages.csv`...). Em toda exportação as colunas são posicionais: dimensão, cliques,
impressões, CTR, posição.

Dois fatos que mudam a leitura e você **não pode esquecer**:
- **Janela padrão de 28 dias.** Confira `Filtros.csv` para o período real.
- **Atraso de ~2 dias.** Os últimos 1-2 dias quase sempre estão incompletos —
  nunca leia uma "queda" nas pontas como real sem considerar isso.

## Fluxo

### 1. Localize a exportação e a data da mudança

O `.zip` costuma estar em `~/Downloads/` (nome tipo
`codamos.com.br-Performance-on-Search-AAAA-MM-DD.zip`). Não precisa descompactar —
o script aceita o `.zip` direto.

Para o modo de impacto, descubra **o que** mudou e **quando** pelo git:

```bash
git log --since="AAAA-MM-DD" --until="AAAA-MM-DD" --pretty=format:"%h %ad %s" --date=short
```

A data da mudança é a do **deploy** (merge na `main` / publicação), não a de quando o
código foi escrito — o Google só vê o que está no ar. É comum os commits de conteúdo
serem de um dia (ex.: 08/07) e o merge/publicação de outro (ex.: 09/07); nesse caso
use o **dia da publicação** como corte, e trate o próprio dia da mudança como
transição (nem antes, nem depois — o script já faz isso). Se o usuário citar uma data,
confirme que ela bate com o merge; se divergir, diga qual você usou e por quê.

### 2. Rode o analisador

O script empacotado faz todo o trabalho pesado de parsing e das contas (posição
ponderada por impressão, janelas equivalentes antes/depois) de forma determinística
— não reescreva isso à mão a cada vez.

```bash
# Panorama geral (sem comparação temporal):
python3 .agents/skills/analise-gsc/scripts/analisar_gsc.py <caminho-do-zip-ou-pasta>

# Modo impacto (compara antes x depois da data da mudança):
python3 .agents/skills/analise-gsc/scripts/analisar_gsc.py <zip> --data-mudanca AAAA-MM-DD --janela 7
```

`--janela N` define quantos dias de cada lado entram na comparação equivalente. Não
existe número mágico: **combine a janela com quantos dias limpos há após a mudança**.
Se o deploy foi há poucos dias (o caso mais comum, já que o GSC tem atraso de ~2
dias), passe `--janela 3` para uma comparação de 3x3 dias em vez dos 7 do exemplo — o
script reduz a janela sozinho e avisa, mas ser explícito deixa a leitura mais clara.
`--top N` controla o tamanho das listas de páginas/consultas.

### 3. Para o modo impacto: descubra o que foi mirado

Antes de interpretar, veja **quais páginas** a mudança tocou, para ligar causa e
efeito. Mudanças de SEO no repo aparecem em lugares previsíveis — metadados dos
posts (`src/data/{posts,authors,tags}.json`), `public/robots.txt`, sitemap,
canonical:

```bash
git show --stat <commit>                 # o que o commit tocou e o assunto
git show <commit> -- src/data/posts.json # o diff dos metadados, por completo
git show <commit> -- public/robots.txt
```

**Leia o diff inteiro, não filtre por linhas adicionadas.** Uma rodada de SEO quase
sempre **edita** `metaTitle`/`metaDescription` que já existiam — isso aparece como
par de linhas `-`/`+` (valor trocado), então um `grep '^+metaDescription'` retornaria
0 e daria a falsa impressão de que nada mudou. Se precisar filtrar, olhe adições e
remoções juntas (`grep -E '^[+-].*metaTitle'`) e confirme pela mensagem do commit.

Cruze as páginas/consultas mais afetadas (saída do script) com o que os commits
mexeram. Se a mudança editou títulos/descrições de 5 páginas e a posição do site
inteiro oscilou, provavelmente é recrawl do site todo — não só daquelas 5.

### 4. Interprete com honestidade

Esta é a parte que dá valor ao skill. Métrica sem contexto engana. Aplique:

**Posição média é ponderada por impressão, nunca média simples.** Um dia com 1000
impressões pesa mais que um com 50. O script já faz isso; se calcular à mão, faça
igual.

**Poucos dias após a mudança = leitura preliminar.** Com menos de ~5-7 dias depois,
diga explicitamente que é um sinal precoce, não um veredito. O GSC leva dias/semanas
para reindexar e estabilizar.

**O padrão "mais impressões + posição muito pior" costuma ser recrawl, não
regressão.** Quando você mexe em títulos/descrições de muitas páginas de uma vez, ou
referencia o sitemap no robots, o Google reavalia o site e temporariamente mostra as
páginas para um conjunto mais amplo e de menor relevância de consultas — isso derruba
a posição média mesmo sem perda de ranking real. Costuma assentar em 1-3 semanas.

**Sempre considere as alternativas antes de cravar causa:**
- *Volatilidade de reindexação* (mais provável logo após mudanças amplas de metadados/sitemap).
- *Atualização de algoritmo do Google* na mesma semana (você não tem como confirmar só com este CSV — diga isso).
- *Regressão real* (queda que persiste e se concentra nas páginas mexidas).
- *Confundidores de deploy*: canonical/autor/URL que mudaram junto e podem, sozinhos, resetar ranking.

**CTR novo demora.** Título/descrição novos levam tempo para propagar no SERP; não
julgue o ganho de CTR em poucos dias. E se a posição caiu, o CTR do site cai junto —
separe os dois efeitos.

### 5. Entregue o relatório

Escreva em **pt-BR**. Use esta estrutura (adapte a profundidade ao pedido):

```markdown
## Impacto das mudanças de <data>

**Janela dos dados:** <período do Filtros.csv; avise sobre o atraso de ~2 dias e
quantos dias limpos há após a mudança>

### O que mudou
<commits relevantes e, no modo impacto, quais páginas foram miradas>

### O sinal principal
<a tabela antes/depois do script: cliques/dia, impressões/dia, CTR, posição
ponderada; destaque o que saltou aos olhos e em que dia>

### Leitura honesta
<hipótese mais provável + alternativas não descartadas + confundidores; deixe claro
o nível de confiança dado o tamanho da janela>

### O que fazer
<próximos passos concretos: reavaliar em X dias, comparação por página no GSC,
verificar o deploy, quais páginas otimizar>
```

Regras de tom: recomende, não faça catálogo de opções. Não infle conclusões em cima
de 3 dias de dados. Se algo não dá para saber com este CSV (ex.: se foi update de
algoritmo), diga que não dá — é mais útil que um palpite confiante.

## Modo panorama / oportunidades (sem data de mudança)

Sem `--data-mudanca`, o script lista as **páginas e consultas com maior potencial**:
muitas impressões + CTR baixo + posição fora do top-3 = onde otimizar rende mais.
Use isso para responder "onde vale mexer no SEO?". A recomendação típica é priorizar
páginas na faixa de posição ~4-15 com CTR abaixo do esperado (título/descrição fracos
ou snippet pouco atraente), já que pequenas melhorias de posição/snippet ali têm o
maior retorno.

## Convenções do repositório

- Todo texto para humanos em **pt-BR** (ver `AGENTS.md`).
- Se você fizer commit de algo, registre no `CHANGELOG.md` e use o trailer de
  co-autor exigido pelo `AGENTS.md`.
- O conteúdo do site vive em `src/data/{posts,authors,tags}.json` — é lá que moram
  os `metaTitle`/`metaDescription` que afetam CTR e o que uma rodada de SEO edita.

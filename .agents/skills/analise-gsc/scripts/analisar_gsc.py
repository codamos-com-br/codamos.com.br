#!/usr/bin/env python3
"""Analisa uma exportação do Google Search Console (relatório de Desempenho).

Aceita o .zip baixado do GSC ou uma pasta já descompactada e produz um resumo
estruturado: totais, série temporal e — quando você informa uma data de mudança —
uma comparação "antes x depois" com janelas de dias equivalentes.

Robusto a idioma: o GSC exporta os arquivos no idioma da conta (pt-BR: Gráfico.csv,
Consultas.csv, Páginas.csv...; en: Dates.csv, Queries.csv, Pages.csv...). Os arquivos
são identificados pelo conteúdo (datas, URLs) e por pistas no nome, não por um nome
fixo. As colunas de métrica são posicionais em toda exportação do GSC:
    coluna 0 = dimensão | 1 = cliques | 2 = impressões | 3 = CTR | 4 = posição

Uso:
    python analisar_gsc.py <caminho-do-zip-ou-pasta> [--data-mudanca AAAA-MM-DD]
                           [--janela N] [--top N]

Sem --data-mudanca, imprime apenas o panorama (totais + oportunidades). Com ela,
adiciona a comparação antes/depois. Somente biblioteca padrão do Python 3.
"""
import argparse
import csv
import glob
import os
import sys
import tempfile
import unicodedata
import zipfile
from datetime import date


def _norm(s):
    """minúsculas + sem acentos, para casar nomes em qualquer idioma."""
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower()


def _num(s):
    """converte '22.52%', '1.234', '' para float; devolve 0.0 se vazio."""
    s = (s or "").strip().replace("%", "").replace(" ", "")
    if not s:
        return 0.0
    # exportações do GSC usam '.' como decimal e sem separador de milhar
    try:
        return float(s)
    except ValueError:
        # fallback defensivo para locais com vírgula decimal
        return float(s.replace(".", "").replace(",", "."))


def _is_date(s):
    s = (s or "").strip()
    if len(s) != 10 or s[4] != "-" or s[7] != "-":
        return False
    try:
        date.fromisoformat(s)
        return True
    except ValueError:
        return False


def _read_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))
    return rows[0] if rows else [], rows[1:] if len(rows) > 1 else []


def discover(folder):
    """Mapeia os CSVs da exportação por conteúdo + pistas de nome."""
    found = {}
    for path in sorted(glob.glob(os.path.join(folder, "*.csv"))):
        header, data = _read_csv(path)
        if not data:
            continue
        name = _norm(os.path.basename(path))
        first_cells = [r[0] for r in data if r]
        kind = None
        if first_cells and all(_is_date(c) for c in first_cells[:5]):
            kind = "series"
        elif first_cells and first_cells[0].startswith("http"):
            kind = "pages"
        elif any(h in name for h in ("consulta", "quer")):
            kind = "queries"
        elif any(h in name for h in ("pais", "countr")):
            kind = "countries"
        elif any(h in name for h in ("dispositivo", "device")):
            kind = "devices"
        if kind and kind not in found:
            found[kind] = (header, data)
    return found


def parse_series(rows):
    out = []
    for r in rows:
        if len(r) < 5 or not _is_date(r[0]):
            continue
        out.append({
            "date": r[0], "clicks": int(_num(r[1])),
            "impr": int(_num(r[2])), "ctr": _num(r[3]), "pos": _num(r[4]),
        })
    return sorted(out, key=lambda x: x["date"])


def summ(subset):
    days = len(subset)
    clicks = sum(x["clicks"] for x in subset)
    impr = sum(x["impr"] for x in subset)
    ctr = 100 * clicks / impr if impr else 0.0
    pos = sum(x["pos"] * x["impr"] for x in subset) / impr if impr else 0.0
    return {"days": days, "clicks": clicks, "impr": impr, "ctr": ctr, "pos": pos,
            "clicks_d": clicks / days if days else 0, "impr_d": impr / days if days else 0}


def fmt(label, s):
    return (f"{label}: {s['days']}d | cliques {s['clicks']} ({s['clicks_d']:.2f}/d) | "
            f"impressões {s['impr']} ({s['impr_d']:.0f}/d) | CTR {s['ctr']:.2f}% | "
            f"posição(pond.) {s['pos']:.2f}")


def delta_line(pre, post):
    def pct(a, b):
        return f"{(b - a) / a * 100:+.0f}%" if a else "n/a"
    dpos = post["pos"] - pre["pos"]
    arrow = "PIOROU" if dpos > 0.5 else ("MELHOROU" if dpos < -0.5 else "estável")
    return (f"  Δ cliques/d {pct(pre['clicks_d'], post['clicks_d'])} | "
            f"impressões/d {pct(pre['impr_d'], post['impr_d'])} | "
            f"CTR {post['ctr'] - pre['ctr']:+.2f}pp | "
            f"posição {dpos:+.2f} ({arrow})")


def opportunities(pages, top):
    """Páginas com muitas impressões mas CTR/posição fracos = maior potencial."""
    scored = []
    for r in pages:
        if len(r) < 5 or not r[0].startswith("http"):
            continue
        impr = int(_num(r[2]))
        if impr < 100:
            continue
        pos = _num(r[4])
        ctr = _num(r[3])
        # potencial: muitas impressões, fora do top-3, CTR baixo
        scored.append((impr, ctr, pos, r[0]))
    scored.sort(key=lambda x: -x[0])
    return scored[:top]


def main():
    ap = argparse.ArgumentParser(description="Analisa exportação do GSC (Desempenho).")
    ap.add_argument("path", help="caminho do .zip do GSC ou pasta descompactada")
    ap.add_argument("--data-mudanca", dest="change", default=None,
                    help="AAAA-MM-DD do deploy/mudança para comparar antes x depois")
    ap.add_argument("--janela", dest="window", type=int, default=7,
                    help="nº de dias em cada lado da janela equivalente (padrão 7)")
    ap.add_argument("--top", type=int, default=15, help="quantas linhas listar (padrão 15)")
    args = ap.parse_args()

    tmp = None
    folder = args.path
    if os.path.isfile(args.path) and args.path.lower().endswith(".zip"):
        tmp = tempfile.mkdtemp(prefix="gsc_")
        with zipfile.ZipFile(args.path) as z:
            z.extractall(tmp)
        folder = tmp
    if not os.path.isdir(folder):
        sys.exit(f"Não é uma pasta nem um .zip válido: {args.path}")

    found = discover(folder)
    if "series" not in found:
        sys.exit("Não encontrei o CSV de série temporal (aba de Datas/Gráfico). "
                 "Exporte o relatório de Desempenho com a dimensão de data ativa.")

    series = parse_series(found["series"][1])
    total = summ(series)
    print("=" * 64)
    print("PANORAMA (todo o período exportado)")
    print("=" * 64)
    print(f"Intervalo: {series[0]['date']} a {series[-1]['date']}")
    print(fmt("TOTAL", total))
    print("Obs.: os últimos ~2 dias do GSC costumam estar incompletos.\n")

    if args.change:
        if not _is_date(args.change):
            sys.exit("--data-mudanca deve ser AAAA-MM-DD")
        c = args.change
        # o efeito começa após o deploy (lag de recrawl): dia da mudança é transição
        pre_all = [x for x in series if x["date"] < c]
        post_all = [x for x in series if x["date"] > c]
        w = args.window
        pre_w = pre_all[-w:] if pre_all else []
        post_w = post_all[:w] if post_all else []
        print("=" * 64)
        print(f"IMPACTO DA MUDANÇA em {c}")
        print("=" * 64)
        if not post_all:
            print("AVISO: nenhum dia após a mudança na exportação. Baixe de novo mais tarde.")
        elif len(post_all) < 5:
            print(f"AVISO: só há {len(post_all)} dia(s) após a mudança — leitura preliminar, "
                  "não conclusiva. Reavalie em ~1-2 semanas.\n")
        if pre_all and post_all:
            print(fmt("ANTES (todo pré) ", summ(pre_all)))
            print(fmt("DEPOIS (todo pós)", summ(post_all)))
            print()
            spre, spost = summ(pre_w), summ(post_w)
            print(f"Janelas equivalentes de {min(len(pre_w), len(post_w))} dia(s):")
            print(fmt("  ANTES ", spre))
            print(fmt("  DEPOIS", spost))
            print(delta_line(spre, spost))
        print("\nSérie diária ao redor da mudança:")
        window_days = [x for x in series if
                       abs((date.fromisoformat(x["date"]) - date.fromisoformat(c)).days) <= max(w, 5)]
        for x in window_days:
            mark = "  <- mudança" if x["date"] == c else ""
            print(f"  {x['date']}  cliques {x['clicks']:>3}  impr {x['impr']:>5}  "
                  f"CTR {x['ctr']:>5.2f}%  pos {x['pos']:>5.1f}{mark}")
        print()

    if "pages" in found:
        print("=" * 64)
        print(f"PÁGINAS COM MAIOR POTENCIAL (>=100 impressões, top {args.top})")
        print("=" * 64)
        print("Muitas impressões + CTR baixo / posição fora do top-3 = onde otimizar rende mais.")
        for impr, ctr, pos, url in opportunities(found["pages"][1], args.top):
            print(f"  impr {impr:>5}  CTR {ctr:>5.2f}%  pos {pos:>5.1f}  {url}")
        print()

    if "queries" in found:
        print("=" * 64)
        print(f"CONSULTAS COM MAIOR POTENCIAL (>=30 impressões, top {args.top})")
        print("=" * 64)
        rows = [r for r in found["queries"][1] if len(r) >= 5 and int(_num(r[2])) >= 30]
        rows.sort(key=lambda r: -int(_num(r[2])))
        for r in rows[:args.top]:
            print(f"  impr {int(_num(r[2])):>4}  CTR {_num(r[3]):>5.2f}%  "
                  f"pos {_num(r[4]):>5.1f}  {r[0]}")
        print()


if __name__ == "__main__":
    main()

#!/usr/bin/env node
// Gera as tabelas de status/checklist dentro de docs/07-entregas/*.md a partir
// de scripts/entregas/manifest.json e do estado real do repositorio (arquivos
// existentes + tags git). So reescreve o trecho entre os marcadores
// "entregas:...:start" / "entregas:...:end" (comentarios HTML no markdown) -
// o resto de cada arquivo e escrito a mao e nunca e tocado.
//
// Uso:
//   node scripts/entregas/gerar-entregas.mjs            atualiza os arquivos
//   node scripts/entregas/gerar-entregas.mjs --check     so verifica (CI)
//   node scripts/entregas/gerar-entregas.mjs --print-file entrega-1
//     imprime o caminho do doc correspondente a tag (usado pelo workflow de release)

import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const manifest = JSON.parse(readFileSync(path.join(__dirname, "manifest.json"), "utf8"));

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const printFileIdx = args.indexOf("--print-file");

const BADGES = {
  entregue: "Entregue",
  pronta: "Pronta para entrega",
  "em-construcao": "Em construção",
  planejada: "Planejada",
};

const EMOJI = {
  entregue: "🟢",
  pronta: "🔵",
  "em-construcao": "🟡",
  planejada: "⚪",
};

function gitTags() {
  try {
    return execFileSync("git", ["tag", "--list"], { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function tagDate(tag) {
  try {
    return execFileSync("git", ["log", "-1", "--format=%ad", "--date=short", tag], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return null;
  }
}

function countLines(abs) {
  try {
    return readFileSync(abs, "utf8").split("\n").length;
  } catch {
    return 0;
  }
}

function itemOk(item) {
  const abs = path.join(ROOT, item.caminho);
  if (!existsSync(abs)) return false;
  const st = statSync(abs);
  if (st.isDirectory()) {
    let entradas = [];
    try {
      entradas = readdirSync(abs).filter((f) => f.charAt(0) !== ".");
    } catch {
      return false;
    }
    if (item.minArquivos) return entradas.length >= item.minArquivos;
    return entradas.length > 0;
  }
  if (item.minLinhas && countLines(abs) < item.minLinhas) return false;
  if (item.requerConteudo || item.naoPodeConter) {
    const txt = readFileSync(abs, "utf8").toLowerCase();
    if (item.requerConteudo) {
      for (const trecho of item.requerConteudo) {
        if (txt.indexOf(trecho.toLowerCase()) === -1) return false;
      }
    }
    if (item.naoPodeConter) {
      for (const trecho of item.naoPodeConter) {
        if (txt.indexOf(trecho.toLowerCase()) !== -1) return false;
      }
    }
  }
  return true;
}

function linkPara(caminhoRelativoAoRepo, arquivoQueVaiConterOLink) {
  const de = path.dirname(path.join(ROOT, arquivoQueVaiConterOLink));
  const rel = path.relative(de, path.join(ROOT, caminhoRelativoAoRepo));
  return rel.split(path.sep).join("/");
}

const tags = gitTags();

function avaliarEntrega(entrega) {
  const resultados = entrega.itens.map((item) => ({ item, ok: itemOk(item) }));
  const prontos = resultados.filter((r) => r.ok).length;
  const total = resultados.length;
  const tagged = entrega.tag && tags.indexOf(entrega.tag) !== -1;
  let estado;
  if (tagged) estado = "entregue";
  else if (prontos === 0) estado = "planejada";
  else if (prontos === total) estado = "pronta";
  else estado = "em-construcao";
  return { resultados, prontos, total, estado, dataTag: tagged ? tagDate(entrega.tag) : null };
}

function badgeLinha(entrega, av) {
  const emoji = EMOJI[av.estado];
  const texto = BADGES[av.estado];
  const contagem = av.prontos + "/" + av.total + " itens prontos";
  if (av.estado === "entregue") {
    const quando = av.dataTag ? " em " + av.dataTag : "";
    return emoji + " **" + texto + "** — tag `" + entrega.tag + "`" + quando + " · " + contagem;
  }
  return emoji + " **" + texto + "** — " + contagem + " · revisão em sala: " + entrega.dataRevisao;
}

function tabelaChecklist(entrega, av) {
  const linhas = ["| Item | Situação | Local |", "| --- | --- | --- |"];
  for (const { item, ok } of av.resultados) {
    const link = "[`" + item.caminho + "`](" + linkPara(item.caminho, entrega.arquivo) + ")";
    linhas.push("| " + item.label + " | " + (ok ? "✅" : "❌") + " | " + link + " |");
  }
  return linhas.join("\n");
}

function substituirBloco(conteudo, marcador, novoTrecho, arquivoParaErro) {
  const start = "<!-- entregas:" + marcador + ":start -->";
  const end = "<!-- entregas:" + marcador + ":end -->";
  const i = conteudo.indexOf(start);
  const j = conteudo.indexOf(end);
  if (i === -1 || j === -1 || j < i) {
    throw new Error('Marcador "' + marcador + '" não encontrado em ' + arquivoParaErro);
  }
  const antes = conteudo.slice(0, i);
  const depois = conteudo.slice(j + end.length);
  return antes + start + "\n" + novoTrecho + "\n" + end + depois;
}

if (printFileIdx !== -1) {
  const tag = args[printFileIdx + 1];
  const entrega = manifest.entregas.find((e) => e.tag === tag);
  if (!entrega) {
    console.error('Nenhuma entrega no manifest com tag "' + tag + '"');
    process.exit(1);
  }
  process.stdout.write(entrega.arquivo);
  process.exit(0);
}

let alterou = false;
const avaliacoes = [];

for (const entrega of manifest.entregas) {
  const av = avaliarEntrega(entrega);
  avaliacoes.push({ entrega, av });

  const arquivoAbs = path.join(ROOT, entrega.arquivo);
  if (!existsSync(arquivoAbs)) {
    console.error("Arquivo de entrega não existe ainda: " + entrega.arquivo);
    process.exitCode = 1;
    continue;
  }
  let conteudo = readFileSync(arquivoAbs, "utf8");
  const original = conteudo;
  conteudo = substituirBloco(conteudo, "status", badgeLinha(entrega, av), entrega.arquivo);
  conteudo = substituirBloco(conteudo, "checklist", tabelaChecklist(entrega, av), entrega.arquivo);

  if (conteudo !== original) {
    alterou = true;
    if (!CHECK) writeFileSync(arquivoAbs, conteudo, "utf8");
  }
}

// Índice geral em docs/07-entregas/README.md
const indexPath = path.join(ROOT, "docs/07-entregas/README.md");
if (existsSync(indexPath)) {
  let conteudo = readFileSync(indexPath, "utf8");
  const original = conteudo;
  const linhas = ["| # | Entrega | Pergunta-chave | Revisão em sala | Status |", "| --- | --- | --- | --- | --- |"];
  for (const { entrega, av } of avaliacoes) {
    const link = "[" + entrega.titulo + "](" + path.basename(entrega.arquivo) + ")";
    const status = EMOJI[av.estado] + " " + BADGES[av.estado] + " (" + av.prontos + "/" + av.total + ")";
    linhas.push("| " + entrega.numero + " | " + link + " | " + entrega.perguntaChave + " | " + entrega.dataRevisao + " | " + status + " |");
  }
  conteudo = substituirBloco(conteudo, "indice", linhas.join("\n"), "docs/07-entregas/README.md");
  if (conteudo !== original) {
    alterou = true;
    if (!CHECK) writeFileSync(indexPath, conteudo, "utf8");
  }
}

for (const { entrega, av } of avaliacoes) {
  console.log(entrega.id.padEnd(14) + " " + EMOJI[av.estado] + " " + BADGES[av.estado] + " (" + av.prontos + "/" + av.total + ")");
}

if (CHECK && alterou) {
  console.error("\nAs tabelas geradas estão desatualizadas. Rode `node scripts/entregas/gerar-entregas.mjs` e faça commit do resultado.");
  process.exit(1);
}

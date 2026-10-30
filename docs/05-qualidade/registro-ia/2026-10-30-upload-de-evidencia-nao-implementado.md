# 2026-10-30 — Documenta que o upload direto de evidência não foi implementado

| Campo | Valor |
| --- | --- |
| **Data** | 2026-10-30 |
| **Responsável** | Rafael Alves |
| **Ferramenta** | Claude Code (Sonnet 5.5) |
| **Artefato afetado** | `07-requisitos.md` (RF06), `08-regras-de-negocio.md` (RN22), ADR 0009, `13-visao-geral.md`, `15-integracao-sistema-bd.md`, tela 26, `19-limitacoes-e-melhorias.md` |

## O que foi pedido

Alinhar a documentação ao que o sistema faz. Ao preparar os testes do MinIO, a
IA percebeu que a API só recebe a URL do comprovante, enquanto o RF06, a RN22,
o ADR 0009 e dois diagramas descrevem upload direto por URL assinada.

## O que a IA produziu

Notas de "estado atual" nos sete documentos e uma linha na tabela "Modelado,
não implementado" do documento 19, dizendo o que existe (`tipo_midia`,
`url_comprovante`, bucket) e o que falta (a API gravar no bucket). Os dois
diagramas Mermaid alterados foram renderizados para confirmar que continuam
válidos.

## O que a IA errou

* **Deixou a divergência passar por quase uma semana de trabalho.** A IA que
  escreveu o documento 16 e o registro do MinIO só viu o problema ao ler o
  código do endpoint, e mesmo então o RF06, a RN22 e o doc 19 ficaram sem nota até
  este registro.
* **Linguagem imprecisa.** Ao relatar o achado, a IA disse que "a funcionalidade
  não existe", o que foi lido como se o fluxo principal de evidência faltasse.
  Não falta: link, texto e a URL de mídia externa funcionam e foram testados; só
  o envio do arquivo ao storage não existe.

## Como o time validou

A afirmação foi conferida no código: o handler de evidência recebe
`TipoMidia` e `UrlComprovante` e nenhum `.cs` lê a seção `Storage`. O fluxo de
evidência, júri e liquidação segue coberto pelos roteiros e2e (API: E04; tela:
U07 e U08).

## Decisão final

O time optou por documentar a limitação e tratar o upload direto como evolução,
em vez de implementá-lo na véspera da revisão para não arriscar o fluxo central.

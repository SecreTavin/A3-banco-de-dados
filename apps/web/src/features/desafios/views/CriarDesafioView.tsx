import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Alerta, Badge, Botao, Icone, LinkVoltar, SaldoCp, SpinnerCentral } from '../../../shared/ui'
import { formatarDataHora } from '../../../shared/ui/formato'
import { exemploRecompensa, rotuloNivelFiltro, rotuloRecompensa } from '../../../shared/ui/status'
import type { NivelFiltro, TipoRecompensa } from '../../../shared/api/tipos'
import { useAuth } from '../../../shared/auth/AuthContext'
import { useGruposQuery } from '../../grupos/hooks/useGruposQuery'
import { useCategoriasQuery } from '../hooks/useCategoriasQuery'
import { useCriarDesafioCommand } from '../hooks/useCriarDesafioCommand'
import estilos from '../criar.module.css'

const TIPOS_RECOMPENSA: TipoRecompensa[] = ['MONETARIA', 'PRENDA_ACAO', 'ITEM_MATERIAL', 'OUTRO']
const CUSTOS = [5, 10, 20, 50]

type Atalho = 'hoje' | 'domingo' | 'semana' | 'data'
const ATALHOS: { valor: Atalho; rotulo: string }[] = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: 'domingo', rotulo: 'Domingo' },
  { valor: 'semana', rotulo: '1 semana' },
  { valor: 'data', rotulo: 'Outra data' },
]

const PREFIXO_RECUSA = /^A IA de modera[cç][aã]o recusou a proposta de desafio:\s*/i

/** Fim do dia (23h59, hora local) do atalho escolhido. */
function prazoDoAtalho(atalho: Exclude<Atalho, 'data'>): Date {
  const data = new Date()
  if (atalho === 'domingo') data.setDate(data.getDate() + ((7 - data.getDay()) % 7))
  if (atalho === 'semana') data.setDate(data.getDate() + 7)
  data.setHours(23, 59, 0, 0)
  return data
}

/** `datetime-local` compara com horário local, não com UTC. */
function agoraLocal() {
  const agora = new Date()
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

type Moderacao =
  | { tipo: 'parada' }
  | { tipo: 'recusada'; motivo: string; nivel: NivelFiltro }
  | { tipo: 'indisponivel'; mensagem: string }

export function CriarDesafioView() {
  const { usuario } = useAuth()
  const { dados: grupos, carregando: carregandoGrupos } = useGruposQuery()
  const { dados: categorias, carregando: carregandoCategorias } = useCategoriasQuery()
  const criar = useCriarDesafioCommand()
  const navegar = useNavigate()
  // Vindo de "Desafiar alguém" no grupo, ele já chega escolhido.
  const { state } = useLocation() as { state: { idGrupo?: number } | null }

  const [idGrupo, setIdGrupo] = useState<number | null>(state?.idGrupo ?? null)
  const [idCategoria, setIdCategoria] = useState<number | null>(null)
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorCp, setValorCp] = useState(10)
  const [custoLivre, setCustoLivre] = useState(false)
  const [atalho, setAtalho] = useState<Atalho>('domingo')
  const [dataLivre, setDataLivre] = useState('')
  const [combinado, setCombinado] = useState(false)
  const [tipoRecompensa, setTipoRecompensa] = useState<TipoRecompensa>('MONETARIA')
  const [descricaoRecompensa, setDescricaoRecompensa] = useState('')
  const [moderacao, setModeracao] = useState<Moderacao>({ tipo: 'parada' })

  if (carregandoGrupos || carregandoCategorias) return <SpinnerCentral />

  const grupo = grupos?.find((g) => g.idGrupo === idGrupo) ?? grupos?.[0]
  const categoria = categorias?.find((c) => c.idCategoria === idCategoria)
  const prazo = atalho === 'data' ? (dataLivre ? new Date(dataLivre) : null) : prazoDoAtalho(atalho)
  const sobra = grupo ? grupo.saldoCp - valorCp : 0

  async function submeter(evento: FormEvent) {
    evento.preventDefault()
    if (!grupo || !categoria || !prazo) return
    setModeracao({ tipo: 'parada' })

    const resultado = await criar.executar({
      idGrupo: grupo.idGrupo,
      idCategoria: categoria.idCategoria,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      valorCp,
      // Sem nada combinado fora do app, a recompensa é só o CP do pote.
      tipoRecompensa: combinado ? tipoRecompensa : 'OUTRO',
      descricaoRecompensa: combinado ? descricaoRecompensa.trim() || null : null,
      dataLimite: prazo.toISOString(),
    })

    if (resultado.ok) {
      navegar(`/desafios/${resultado.dados.idDesafio}`, { replace: true })
    } else if (resultado.status === 422 && PREFIXO_RECUSA.test(resultado.erro)) {
      setModeracao({ tipo: 'recusada', motivo: resultado.erro.replace(PREFIXO_RECUSA, ''), nivel: grupo.nivelFiltro })
    } else if (resultado.status === 503) {
      setModeracao({ tipo: 'indisponivel', mensagem: resultado.erro })
    }
  }

  const etapa = criar.enviando ? 2 : moderacao.tipo === 'parada' ? 1 : 2
  const erroComum = criar.erro && moderacao.tipo === 'parada' && !criar.enviando ? criar.erro : null

  return (
    <>
      <LinkVoltar para="/desafios" rotulo="Desafios" />
      <header className={estilos.cabecalho}>
        <h1>Novo desafio</h1>
        <p>Depois de criado não dá para editar — só cancelar, com motivo.</p>
      </header>

      <form className={estilos.grade} onSubmit={submeter}>
        <div className={estilos.formulario}>
          <fieldset className={estilos.campo}>
            <legend>Em qual grupo?</legend>
            <div className={estilos.grupos}>
              {grupos?.map((g) => (
                <button
                  key={g.idGrupo}
                  type="button"
                  aria-pressed={g.idGrupo === grupo?.idGrupo}
                  className={[estilos.grupo, g.idGrupo === grupo?.idGrupo && estilos.ativo].filter(Boolean).join(' ')}
                  onClick={() => setIdGrupo(g.idGrupo)}
                >
                  <span>
                    <strong>{g.nome}</strong>
                    <small>saldo {g.saldoCp} CP</small>
                  </span>
                  <span className={[estilos.nivel, estilos[`nivel${g.nivelFiltro}`]].join(' ')}>
                    filtro {rotuloNivelFiltro[g.nivelFiltro].toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className={estilos.campo}>
            <span className={estilos.rotulo}>
              Desafio <small>{titulo.length} / 120</small>
            </span>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={120}
              placeholder="Correr 10 km até domingo"
              required
            />
          </label>

          <label className={estilos.campo}>
            <span className={estilos.rotulo}>
              O que vale como cumprido <small>o júri vai ler isso</small>
            </span>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={600}
              placeholder="Print do app de corrida com 10 km e a data"
              required
            />
          </label>

          <fieldset className={estilos.campo}>
            <legend>Categoria</legend>
            <div className={estilos.chips}>
              {categorias?.map((c) => (
                <button
                  key={c.idCategoria}
                  type="button"
                  aria-pressed={c.idCategoria === idCategoria}
                  className={[estilos.chip, c.idCategoria === idCategoria && estilos.ativo].filter(Boolean).join(' ')}
                  onClick={() => setIdCategoria(c.idCategoria)}
                >
                  {c.nome}
                </button>
              ))}
            </div>
          </fieldset>

          <div className={estilos.dupla}>
            <fieldset className={estilos.campo}>
              <legend>Quanto custa para entrar</legend>
              <div className={estilos.chips}>
                {CUSTOS.map((custo) => (
                  <button
                    key={custo}
                    type="button"
                    aria-pressed={!custoLivre && valorCp === custo}
                    className={[estilos.chip, !custoLivre && valorCp === custo && estilos.ativo].filter(Boolean).join(' ')}
                    onClick={() => {
                      setCustoLivre(false)
                      setValorCp(custo)
                    }}
                  >
                    {custo} CP
                  </button>
                ))}
                {custoLivre ? (
                  <input
                    className={estilos.custoLivre}
                    type="number"
                    min={1}
                    value={valorCp}
                    onChange={(e) => setValorCp(Math.max(1, Number(e.target.value) || 1))}
                    aria-label="Custo em CP"
                    autoFocus
                  />
                ) : (
                  <button type="button" className={estilos.chip} onClick={() => setCustoLivre(true)}>
                    outro
                  </button>
                )}
              </div>
              <span className={sobra < 0 ? estilos.notaErro : estilos.nota}>
                Cada um paga ao entrar.{' '}
                {grupo && (sobra < 0
                    ? `Seu saldo no grupo é ${grupo.saldoCp} CP — não daria para você entrar.`
                    : `Se você entrar, fica com ${sobra} CP.`)}
              </span>
            </fieldset>

            <fieldset className={estilos.campo}>
              <legend>Prazo</legend>
              <div className={estilos.chips}>
                {ATALHOS.map((opcao) => (
                  <button
                    key={opcao.valor}
                    type="button"
                    aria-pressed={atalho === opcao.valor}
                    className={[estilos.chip, atalho === opcao.valor && estilos.ativo].filter(Boolean).join(' ')}
                    onClick={() => setAtalho(opcao.valor)}
                  >
                    {opcao.rotulo}
                  </button>
                ))}
              </div>
              {atalho === 'data' ? (
                <input
                  type="datetime-local"
                  min={agoraLocal()}
                  value={dataLivre}
                  onChange={(e) => setDataLivre(e.target.value)}
                  aria-label="Data e hora do prazo"
                  required
                />
              ) : (
                prazo && <span className={estilos.nota}>Até {formatarDataHora(prazo.toISOString())}.</span>
              )}
            </fieldset>
          </div>

          {combinado ? (
            <fieldset className={[estilos.campo, estilos.combinado].join(' ')}>
              <legend>Combinado fora do app</legend>
              <div className={estilos.chips}>
                {TIPOS_RECOMPENSA.map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    aria-pressed={tipoRecompensa === tipo}
                    className={[estilos.chip, tipoRecompensa === tipo && estilos.ativo].filter(Boolean).join(' ')}
                    onClick={() => setTipoRecompensa(tipo)}
                  >
                    {rotuloRecompensa[tipo]}
                  </button>
                ))}
              </div>
              <input
                value={descricaoRecompensa}
                onChange={(e) => setDescricaoRecompensa(e.target.value)}
                maxLength={255}
                placeholder={exemploRecompensa[tipoRecompensa]}
                aria-label="O que foi combinado"
              />
              <span className={estilos.nota}>Só descreve o acordo: o app não movimenta dinheiro, só CP.</span>
            </fieldset>
          ) : (
            <button type="button" className={estilos.abrirCombinado} onClick={() => setCombinado(true)}>
              <Icone nome="mais" tamanho={16} />
              Combinaram algo fora do app? (opcional: Pix, prenda, item)
            </button>
          )}
        </div>

        <aside className={estilos.lateral}>
          <div>
            <span className={estilos.rotuloLateral}>Assim o grupo vai ver</span>
            <div className={estilos.previa}>
              <Badge cor="var(--aberta)">Aberto</Badge>
              <strong className={titulo ? undefined : estilos.vazio}>{titulo || 'Título do desafio'}</strong>
              <span className={estilos.previaMeta}>
                {grupo?.nome ?? 'Grupo'} · {categoria?.nome ?? 'Categoria'}
                {prazo && ` · até ${formatarDataHora(prazo.toISOString())}`}
              </span>
              <span className={estilos.previaRodape}>
                <span>{usuario?.apelido} desafia quem topar</span>
                <SaldoCp valor={valorCp} />
              </span>
            </div>
          </div>

          <div className={estilos.moderacao}>
            <h2>
              <Icone nome="escudo" tamanho={20} />
              Moderação do grupo
            </h2>
            <ol className={estilos.fluxo}>
              <li className={etapa >= 1 ? estilos.fluxoFeito : undefined}>1 · Você envia</li>
              <li
                className={
                  moderacao.tipo === 'recusada' || moderacao.tipo === 'indisponivel'
                    ? estilos.fluxoFalhou
                    : etapa >= 2
                      ? estilos.fluxoFeito
                      : undefined
                }
              >
                2 · IA avalia{grupo && ` no nível ${rotuloNivelFiltro[grupo.nivelFiltro]}`}
              </li>
              <li>3 · Grupo vê</li>
            </ol>

            {criar.enviando && (
              <p className={estilos.avaliando}>A IA está lendo a proposta — leva alguns segundos.</p>
            )}

            {moderacao.tipo === 'recusada' && (
              <div className={estilos.recusa} role="alert">
                <strong>Não passou no filtro {rotuloNivelFiltro[moderacao.nivel]}</strong>
                <p>Motivo da IA: “{moderacao.motivo}”</p>
                <p>Nada foi criado e nenhum CP saiu. Ajuste o texto e envie de novo — o que você escreveu continua aqui.</p>
              </div>
            )}

            {moderacao.tipo === 'indisponivel' && (
              <div className={estilos.indisponivel} role="alert">
                <strong>A moderação está fora do ar</strong>
                <p>Sem avaliação, nenhum desafio é aprovado. Nada foi criado; tente de novo em instantes.</p>
              </div>
            )}

            {erroComum && <Alerta>{erroComum}</Alerta>}
            {!categoria && titulo && descricao && <span className={estilos.nota}>Escolha uma categoria para enviar.</span>}

            <Botao type="submit" bloco carregando={criar.enviando} disabled={!grupo || !categoria || !prazo}>
              Enviar para a moderação
            </Botao>
          </div>
        </aside>
      </form>
    </>
  )
}

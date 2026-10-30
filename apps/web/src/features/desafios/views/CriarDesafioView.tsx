import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Alerta,
  Botao,
  CabecalhoPagina,
  Campo,
  Card,
  Icone,
  LinkVoltar,
  SpinnerCentral,
} from '../../../shared/ui'
import { paraIso } from '../../../shared/ui/formato'
import { exemploRecompensa, rotuloNivelFiltro, rotuloRecompensa } from '../../../shared/ui/status'
import type { TipoRecompensa } from '../../../shared/api/tipos'
import { useGruposQuery } from '../../grupos/hooks/useGruposQuery'
import { useCategoriasQuery } from '../hooks/useCategoriasQuery'
import { useCriarDesafioCommand } from '../hooks/useCriarDesafioCommand'
import estilos from '../desafios.module.css'

const TIPOS_RECOMPENSA: TipoRecompensa[] = ['MONETARIA', 'PRENDA_ACAO', 'ITEM_MATERIAL', 'OUTRO']

/** `datetime-local` compara com horário local, não com UTC. */
function agoraLocal() {
  const agora = new Date()
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export function CriarDesafioView() {
  const { dados: grupos, carregando: carregandoGrupos } = useGruposQuery()
  const { dados: categorias, carregando: carregandoCategorias } = useCategoriasQuery()
  const criar = useCriarDesafioCommand()
  const navegar = useNavigate()

  const [idGrupo, setIdGrupo] = useState('')
  const [idCategoria, setIdCategoria] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorCp, setValorCp] = useState('10')
  const [tipoRecompensa, setTipoRecompensa] = useState<TipoRecompensa>('MONETARIA')
  const [descricaoRecompensa, setDescricaoRecompensa] = useState('')
  const [dataLimite, setDataLimite] = useState('')

  const grupoEscolhido = grupos?.find((grupo) => grupo.idGrupo === Number(idGrupo))

  async function submeter(evento: FormEvent) {
    evento.preventDefault()

    const resultado = await criar.executar({
      idGrupo: Number(idGrupo),
      idCategoria: Number(idCategoria),
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      valorCp: Number(valorCp),
      tipoRecompensa,
      descricaoRecompensa: descricaoRecompensa.trim() || null,
      dataLimite: paraIso(dataLimite),
    })

    if (resultado.ok) navegar(`/desafios/${resultado.dados.idDesafio}`, { replace: true })
  }

  if (carregandoGrupos || carregandoCategorias) return <SpinnerCentral />

  return (
    <>
      <LinkVoltar para="/desafios" rotulo="Meus desafios" />
      <CabecalhoPagina
        titulo="Novo desafio"
        descricao="O desafio não pode ser editado depois de criado — só cancelado, com motivo."
      />

      <Card className={estilos.cartaoCriar}>
        <form className={[estilos.formulario, estilos.formularioCriar].join(' ')} onSubmit={submeter}>
          <div className={estilos.camposCriar}>
          <div className={estilos.formularioLinha}>
            <Campo rotulo="Grupo">
              <select value={idGrupo} onChange={(e) => setIdGrupo(e.target.value)} required>
                <option value="">Escolha o grupo</option>
                {grupos?.map((grupo) => (
                  <option key={grupo.idGrupo} value={grupo.idGrupo}>
                    {grupo.nome} — {grupo.saldoCp} CP
                  </option>
                ))}
              </select>
            </Campo>

            <Campo rotulo="Categoria">
              <select value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)} required>
                <option value="">Escolha a categoria</option>
                {categorias?.map((categoria) => (
                  <option key={categoria.idCategoria} value={categoria.idCategoria}>
                    {categoria.nome}
                  </option>
                ))}
              </select>
            </Campo>
          </div>

          <Campo rotulo="Título">
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={120}
              placeholder="Duvido você correr 10 km até domingo"
              required
            />
          </Campo>

          <Campo rotulo="Descrição" dica="Deixe claro o que conta como cumprido — o júri vai ler isso.">
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={600}
              required
            />
          </Campo>

          <div className={estilos.formularioLinha}>
            <Campo rotulo="Custo em CP" dica="Cobrado de cada participante ao aceitar.">
              <input
                type="number"
                min={1}
                value={valorCp}
                onChange={(e) => setValorCp(e.target.value)}
                required
              />
            </Campo>

            <Campo rotulo="Prazo">
              <input
                type="datetime-local"
                min={agoraLocal()}
                value={dataLimite}
                onChange={(e) => setDataLimite(e.target.value)}
                required
              />
            </Campo>
          </div>

          <Campo rotulo="Tipo de recompensa">
            <select
              value={tipoRecompensa}
              onChange={(e) => setTipoRecompensa(e.target.value as TipoRecompensa)}
            >
              {TIPOS_RECOMPENSA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {rotuloRecompensa[tipo]}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            rotulo="O que foi combinado"
            dica="Opcional, mas recomendado. Só descreve o acordo: o app não movimenta dinheiro, só CP."
          >
            <input
              value={descricaoRecompensa}
              onChange={(e) => setDescricaoRecompensa(e.target.value)}
              maxLength={255}
              placeholder={exemploRecompensa[tipoRecompensa]}
            />
          </Campo>

          </div>

          <aside className={estilos.moderacao}>
          <h2 className={estilos.moderacaoTitulo}>
            <Icone nome="escudo" tamanho={26} />
            Moderação de IA
          </h2>

          {criar.erro && <Alerta>{criar.erro}</Alerta>}

          <p className={estilos.notaIa}>
            {grupoEscolhido
              ? `A proposta passa pela moderação de IA do grupo (nível ${rotuloNivelFiltro[grupoEscolhido.nivelFiltro]}) antes de virar desafio.`
              : 'Toda proposta passa pela moderação de IA do grupo antes de virar desafio.'}
            {criar.enviando && ' A IA está avaliando — pode levar alguns segundos.'}
          </p>

          {grupoEscolhido && (
            <div className={estilos.nivelGrupo}>
              <span className={estilos.nivelRotulo}>Nível do filtro do grupo</span>
              <span className={estilos.nivelValor}>{rotuloNivelFiltro[grupoEscolhido.nivelFiltro]}</span>
            </div>
          )}

          <div className={estilos.formularioBotoes}>
            <Botao type="submit" carregando={criar.enviando}>
              Criar desafio
            </Botao>
            <Botao type="button" variante="fantasma" onClick={() => navegar('/desafios')}>
              Cancelar
            </Botao>
          </div>
          </aside>
        </form>
      </Card>
    </>
  )
}

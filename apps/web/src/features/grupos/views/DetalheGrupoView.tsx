import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Alerta,
  Avatar,
  Botao,
  Dialogo,
  EstadoVazio,
  Icone,
  LinkVoltar,
  Menu,
  SaldoCp,
  SpinnerCentral,
} from '../../../shared/ui'
import { NIVEIS_FILTRO, rotuloNivelFiltro } from '../../../shared/ui/status'
import { useAuth } from '../../../shared/auth/AuthContext'
import type { MembroGrupo, NivelFiltro } from '../../../shared/api/tipos'
import { LinhaDesafio } from '../../desafios/components/LinhaDesafio'
import { useDesafiosQuery } from '../../desafios/hooks/useDesafiosQuery'
import { useAdicionarMembroCommand } from '../hooks/useAdicionarMembroCommand'
import { useAlterarNivelFiltroCommand } from '../hooks/useAlterarNivelFiltroCommand'
import { useGrupoQuery } from '../hooks/useGrupoQuery'
import { useRemoverMembroCommand } from '../hooks/useRemoverMembroCommand'
import estilos from '../grupo.module.css'

/**
 * Propostas que a IA real aprovou (✓) e recusou (✕) em cada nível, nos testes de 31/10/2026
 * (documento 17). Exemplo, não promessa: o veredito é do modelo.
 */
const NIVEIS: Record<NivelFiltro, { resumo: string; aprova: string; recusa: string }> = {
  LEVE: {
    resumo: 'Aceita o desconfortável; barra só o perigoso de verdade.',
    aprova: 'foto de pijama nos stories',
    recusa: 'pular de um muro de 2 m',
  },
  MODERADO: {
    resumo: 'Barra risco físico, bebida e humilhação pública.',
    aprova: 'foto de pijama nos stories',
    recusa: 'garrafa de vodka em 10 min',
  },
  PESADO: {
    resumo: 'Para grupos com adolescentes: nada de redes sociais nem constrangimento.',
    aprova: 'correr 5 km no parque',
    recusa: 'foto de pijama nos stories',
  },
}

type Aba = 'membros' | 'desafios'

/** Por que o membro não pode sair agora — as mesmas condições de remover_membro (RN25). */
function pendencia(membro: MembroGrupo): string | null {
  if (membro.desafiosEmCurso > 0) {
    return membro.desafiosEmCurso === 1 ? 'em 1 desafio em curso' : `em ${membro.desafiosEmCurso} desafios em curso`
  }
  if (membro.noJuri) return 'no júri de uma prova aberta'
  return null
}

export function DetalheGrupoView() {
  const { id } = useParams()
  const idGrupo = Number(id)
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const { dados: grupo, carregando, erro, recarregar } = useGrupoQuery(idGrupo)
  const { dados: desafios } = useDesafiosQuery('TODAS')

  const alterarNivel = useAlterarNivelFiltroCommand(idGrupo)
  const adicionar = useAdicionarMembroCommand(idGrupo)
  const remover = useRemoverMembroCommand(idGrupo)
  // Instância separada para o erro de "sair" não aparecer embaixo da lista de membros.
  const sair = useRemoverMembroCommand(idGrupo)

  const [aba, setAba] = useState<Aba>('membros')
  const [nivelEscolhido, setNivelEscolhido] = useState<NivelFiltro | null>(null)
  const [email, setEmail] = useState('')
  const [removendo, setRemovendo] = useState<MembroGrupo | null>(null)
  const [saindo, setSaindo] = useState(false)

  if (carregando) return <SpinnerCentral />
  if (erro) return <Alerta>{erro}</Alerta>
  if (!grupo) return <EstadoVazio titulo="Grupo não encontrado" />

  const souAdmin = grupo.meuPapel === 'ADMIN'
  const nivelAtual = nivelEscolhido ?? grupo.nivelFiltro
  const desafiosDoGrupo = (desafios ?? []).filter((d) => d.idGrupo === idGrupo)
  const unicoAdmin =
    souAdmin && grupo.membros.length > 1 && grupo.membros.filter((m) => m.papel === 'ADMIN').length === 1

  const salvarNivel = async () => {
    const resultado = await alterarNivel.executar(nivelAtual)
    if (!resultado.ok) return
    setNivelEscolhido(null)
    recarregar()
  }

  const submeterMembro = async (evento: FormEvent) => {
    evento.preventDefault()
    const resultado = await adicionar.executar({ email: email.trim() })
    if (!resultado.ok) return
    setEmail('')
    recarregar()
  }

  const confirmarRemocao = async () => {
    if (!removendo) return
    const resultado = await remover.executar(removendo.idUsuario)
    if (!resultado.ok) return
    setRemovendo(null)
    recarregar()
  }

  const confirmarSaida = async () => {
    if (!usuario) return
    const resultado = await sair.executar(usuario.idUsuario)
    if (resultado.ok) navegar('/grupos', { replace: true })
  }

  return (
    <>
      <LinkVoltar para="/grupos" rotulo="Meus grupos" />

      <header className={estilos.cabecalho}>
        <div className={estilos.cabecalhoTextos}>
          <h1 className={estilos.nome}>
            {grupo.nome}
            {souAdmin && <span className={estilos.admin}>você é admin</span>}
          </h1>
          {grupo.descricao && <p className={estilos.descricao}>{grupo.descricao}</p>}
          <dl className={estilos.numeros}>
            <div>
              <dt>membros</dt>
              <dd>{grupo.membros.length}</dd>
            </div>
            <div>
              <dt>desafios ativos</dt>
              <dd>{grupo.desafiosAtivos}</dd>
            </div>
            <div>
              <dt>em jogo</dt>
              <dd>
                <SaldoCp valor={grupo.cpEmJogo} />
              </dd>
            </div>
            <div>
              <dt>filtro da IA</dt>
              <dd>{rotuloNivelFiltro[grupo.nivelFiltro]}</dd>
            </div>
          </dl>
        </div>
        <Botao onClick={() => navegar('/desafios/nova', { state: { idGrupo } })}>
          <Icone nome="mais" tamanho={18} />
          Desafiar alguém
        </Botao>
      </header>

      <nav className={estilos.abas} aria-label="Seções do grupo">
        <button
          type="button"
          className={[estilos.aba, aba === 'membros' && estilos.abaAtiva].filter(Boolean).join(' ')}
          onClick={() => setAba('membros')}
        >
          Membros <span>{grupo.membros.length}</span>
        </button>
        <button
          type="button"
          className={[estilos.aba, aba === 'desafios' && estilos.abaAtiva].filter(Boolean).join(' ')}
          onClick={() => setAba('desafios')}
        >
          Desafios <span>{desafiosDoGrupo.length}</span>
        </button>
        <Link to={`/ranking?grupo=${idGrupo}`} className={estilos.aba}>
          Ranking
        </Link>
      </nav>

      <div className={estilos.grade}>
        <div className={estilos.coluna}>
          {aba === 'membros' ? (
            <>
              <ul className={estilos.membros}>
                {grupo.membros.map((membro) => {
                  const souEu = membro.idUsuario === usuario?.idUsuario
                  const motivo = pendencia(membro)
                  return (
                    <li key={membro.idUsuario} className={estilos.membro}>
                      <Avatar apelido={membro.apelido} url={membro.avatarUrl} />
                      <span className={estilos.membroTextos}>
                        <strong>{membro.apelido}</strong>
                        <small className={motivo ? estilos.ocupado : undefined}>
                          {[membro.papel === 'ADMIN' ? 'admin' : null, souEu ? 'você' : null, motivo]
                            .filter(Boolean)
                            .join(' · ') || 'membro'}
                        </small>
                      </span>
                      <SaldoCp valor={membro.saldoCp} />
                      {souAdmin && !souEu ? (
                        <Menu
                          rotulo={`Ações para ${membro.apelido}`}
                          itens={[
                            {
                              rotulo: 'Remover do grupo…',
                              perigo: true,
                              indisponivel: motivo ? `Indisponível: ${membro.apelido} está ${motivo}` : undefined,
                              aoEscolher: () => {
                                remover.limparErro()
                                setRemovendo(membro)
                              },
                            },
                          ]}
                        />
                      ) : (
                        <span className={estilos.semMenu} />
                      )}
                    </li>
                  )
                })}
              </ul>

              {souAdmin && (
                <form className={estilos.adicionar} onSubmit={submeterMembro}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={120}
                    placeholder="E-mail de quem já tem conta"
                    aria-label="E-mail do novo membro"
                    required
                  />
                  <Botao type="submit" variante="secundaria" carregando={adicionar.enviando}>
                    Adicionar · entra com 100 CP
                  </Botao>
                  {adicionar.erro && <Alerta>{adicionar.erro}</Alerta>}
                </form>
              )}
            </>
          ) : desafiosDoGrupo.length === 0 ? (
            <EstadoVazio titulo="Nenhum desafio neste grupo ainda" />
          ) : (
            <div className={estilos.desafios}>
              {desafiosDoGrupo.map((desafio) => (
                <LinhaDesafio key={desafio.idDesafio} desafio={desafio} />
              ))}
            </div>
          )}
        </div>

        <aside className={estilos.coluna}>
          <section className={estilos.filtro}>
            <h2>
              <Icone nome="escudo" tamanho={20} />
              Filtro da IA para novos desafios
            </h2>
            <div role="radiogroup" aria-label="Nível do filtro" className={estilos.niveis}>
              {NIVEIS_FILTRO.map((nivel) => (
                <button
                  key={nivel}
                  type="button"
                  role="radio"
                  aria-checked={nivelAtual === nivel}
                  disabled={!souAdmin}
                  className={[estilos.nivel, nivelAtual === nivel && estilos.nivelAtivo].filter(Boolean).join(' ')}
                  onClick={() => setNivelEscolhido(nivel)}
                >
                  <span className={estilos.radio} aria-hidden="true" />
                  <span className={estilos.nivelTextos}>
                    <strong>{rotuloNivelFiltro[nivel]}</strong>
                    <span>{NIVEIS[nivel].resumo}</span>
                    <span className={estilos.exemplos}>
                      <span className={estilos.aprova}>✓ {NIVEIS[nivel].aprova}</span>
                      <span className={estilos.recusa}>✕ {NIVEIS[nivel].recusa}</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {!souAdmin && <p className={estilos.nota}>Só o admin muda o filtro.</p>}
            {alterarNivel.erro && <Alerta>{alterarNivel.erro}</Alerta>}
            {souAdmin && nivelAtual !== grupo.nivelFiltro && (
              <Botao carregando={alterarNivel.enviando} onClick={salvarNivel}>
                Salvar filtro {rotuloNivelFiltro[nivelAtual]}
              </Botao>
            )}
          </section>

          <div className={estilos.sair}>
            <span>
              {unicoAdmin ? 'Para sair, o grupo precisa de outro admin.' : 'Seu saldo aqui sai de circulação se você sair.'}
            </span>
            <button
              type="button"
              onClick={() => {
                sair.limparErro()
                setSaindo(true)
              }}
            >
              Sair do grupo…
            </button>
          </div>
        </aside>
      </div>

      {removendo && (
        <Dialogo titulo={`Remover ${removendo.apelido}?`} aoFechar={() => setRemovendo(null)}>
          <p className={estilos.textoDialogo}>
            O saldo de {removendo.saldoCp} CP de {removendo.apelido} neste grupo sai de circulação, com um lançamento de
            saída no extrato.
          </p>
          {remover.erro && <Alerta>{remover.erro}</Alerta>}
          <Botao variante="perigo" carregando={remover.enviando} onClick={confirmarRemocao}>
            Remover do grupo
          </Botao>
          <Botao variante="fantasma" onClick={() => setRemovendo(null)}>
            Voltar
          </Botao>
        </Dialogo>
      )}

      {saindo && (
        <Dialogo titulo="Sair do grupo?" aoFechar={() => setSaindo(false)}>
          <p className={estilos.textoDialogo}>
            Seu saldo de CP neste grupo sai de circulação. Não dá para sair com desafio em andamento, com júri aberto ou
            sendo o único admin enquanto houver outros membros.
          </p>
          {sair.erro && <Alerta>{sair.erro}</Alerta>}
          <Botao variante="perigo" carregando={sair.enviando} onClick={confirmarSaida}>
            Sair do grupo
          </Botao>
          <Botao variante="fantasma" onClick={() => setSaindo(false)}>
            Voltar
          </Botao>
        </Dialogo>
      )}
    </>
  )
}

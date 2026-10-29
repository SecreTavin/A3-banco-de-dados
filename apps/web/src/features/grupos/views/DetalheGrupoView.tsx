import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alerta,
  Badge,
  Botao,
  CabecalhoPagina,
  Campo,
  Card,
  EstadoVazio,
  LinkVoltar,
  Secao,
  SpinnerCentral,
} from '../../../shared/ui'
import { NIVEIS_FILTRO, descricaoNivelFiltro, rotuloNivelFiltro } from '../../../shared/ui/status'
import { useAuth } from '../../../shared/auth/AuthContext'
import type { MembroGrupo, NivelFiltro } from '../../../shared/api/tipos'
import { LinhaMembro } from '../components/LinhaMembro'
import { useAdicionarMembroCommand } from '../hooks/useAdicionarMembroCommand'
import { useAlterarNivelFiltroCommand } from '../hooks/useAlterarNivelFiltroCommand'
import { useGrupoQuery } from '../hooks/useGrupoQuery'
import { useRemoverMembroCommand } from '../hooks/useRemoverMembroCommand'
import estilos from '../grupos.module.css'

export function DetalheGrupoView() {
  const { id } = useParams()
  const idGrupo = Number(id)
  const { usuario } = useAuth()
  const navegar = useNavigate()
  const { dados: grupo, carregando, erro, recarregar } = useGrupoQuery(idGrupo)

  const alterarNivel = useAlterarNivelFiltroCommand(idGrupo)
  const adicionar = useAdicionarMembroCommand(idGrupo)
  const remover = useRemoverMembroCommand(idGrupo)
  // Instância separada para o erro de "sair" não aparecer embaixo da lista de membros.
  const sair = useRemoverMembroCommand(idGrupo)

  const [nivelEscolhido, setNivelEscolhido] = useState<NivelFiltro | null>(null)
  const [email, setEmail] = useState('')
  const [removendo, setRemovendo] = useState<number | null>(null)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)

  if (carregando) return <SpinnerCentral />
  if (erro) return <Alerta>{erro}</Alerta>
  if (!grupo) return <EstadoVazio titulo="Grupo não encontrado" />

  const souAdmin = grupo.meuPapel === 'ADMIN'
  const nivelAtual = nivelEscolhido ?? grupo.nivelFiltro

  const submeterNivel = async (evento: FormEvent) => {
    evento.preventDefault()
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

  const removerMembro = async (membro: MembroGrupo) => {
    if (!window.confirm(`Remover ${membro.apelido} do grupo?`)) return

    setRemovendo(membro.idUsuario)
    const resultado = await remover.executar(membro.idUsuario)
    setRemovendo(null)
    if (resultado.ok) recarregar()
  }

  const sairDoGrupo = async () => {
    if (!usuario) return
    const resultado = await sair.executar(usuario.idUsuario)
    if (resultado.ok) navegar('/grupos', { replace: true })
  }

  return (
    <>
      <LinkVoltar para="/grupos" rotulo="Meus grupos" />
      <CabecalhoPagina titulo={grupo.nome} descricao={grupo.descricao ?? undefined} />

      <Secao titulo="Moderação de IA">
        {souAdmin ? (
          <Card className={estilos.formularioCartao}>
            <form className={estilos.formulario} onSubmit={submeterNivel}>
              <Campo rotulo="Nível do filtro" dica={descricaoNivelFiltro[nivelAtual]}>
                <select
                  value={nivelAtual}
                  onChange={(e) => setNivelEscolhido(e.target.value as NivelFiltro)}
                >
                  {NIVEIS_FILTRO.map((nivel) => (
                    <option key={nivel} value={nivel}>
                      {rotuloNivelFiltro[nivel]}
                    </option>
                  ))}
                </select>
              </Campo>

              {alterarNivel.erro && <Alerta>{alterarNivel.erro}</Alerta>}

              <div className={estilos.formularioBotoes}>
                <Botao
                  type="submit"
                  variante="secundaria"
                  carregando={alterarNivel.enviando}
                  disabled={nivelAtual === grupo.nivelFiltro}
                >
                  Salvar nível
                </Botao>
              </div>
            </form>
          </Card>
        ) : (
          <Card className={estilos.formularioCartao}>
            <div className={estilos.moderacao}>
              <Badge cor="var(--em-votacao)">{rotuloNivelFiltro[grupo.nivelFiltro]}</Badge>
              <span className={estilos.aviso}>{descricaoNivelFiltro[grupo.nivelFiltro]}</span>
            </div>
          </Card>
        )}
      </Secao>

      <Secao titulo="Membros" contagem={grupo.membros.length}>
        {souAdmin && (
          <Card className={estilos.formularioCartao}>
            <form className={estilos.formulario} onSubmit={submeterMembro}>
              <Campo rotulo="Adicionar por e-mail" dica="A pessoa precisa já ter conta no Eu Duvido!.">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={120}
                  placeholder="amigo@exemplo.com"
                  required
                />
              </Campo>

              {adicionar.erro && <Alerta>{adicionar.erro}</Alerta>}

              <div className={estilos.formularioBotoes}>
                <Botao type="submit" carregando={adicionar.enviando}>
                  Adicionar
                </Botao>
              </div>
            </form>
          </Card>
        )}

        <ul className={estilos.membros}>
          {grupo.membros.map((membro) => (
            <LinhaMembro
              key={membro.idUsuario}
              membro={membro}
              aoRemover={
                souAdmin && membro.idUsuario !== usuario?.idUsuario
                  ? () => removerMembro(membro)
                  : undefined
              }
              removendo={removendo === membro.idUsuario}
            />
          ))}
        </ul>

        {remover.erro && <Alerta>{remover.erro}</Alerta>}
      </Secao>

      <Secao titulo="Sair do grupo">
        {confirmandoSaida ? (
          <Card className={estilos.formularioCartao}>
            <div className={estilos.formulario}>
              <p className={estilos.aviso}>
                Seu saldo de CP neste grupo sai de circulação. Não dá para sair com desafio em
                andamento, com júri aberto ou sendo o único admin enquanto houver outros membros.
              </p>

              {sair.erro && <Alerta>{sair.erro}</Alerta>}

              <div className={estilos.formularioBotoes}>
                <Botao variante="perigo" carregando={sair.enviando} onClick={sairDoGrupo}>
                  Confirmar saída
                </Botao>
                <Botao
                  variante="fantasma"
                  onClick={() => {
                    setConfirmandoSaida(false)
                    sair.limparErro()
                  }}
                >
                  Voltar
                </Botao>
              </div>
            </div>
          </Card>
        ) : (
          <Botao variante="perigo" onClick={() => setConfirmandoSaida(true)}>
            Sair do grupo
          </Botao>
        )}
      </Secao>
    </>
  )
}

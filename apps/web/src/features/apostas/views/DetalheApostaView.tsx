import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  Alerta,
  Badge,
  Botao,
  CabecalhoPagina,
  Campo,
  Card,
  EstadoVazio,
  LinkVoltar,
  SaldoCp,
  Secao,
  SpinnerCentral,
} from '../../../shared/ui'
import { descreverPrazo, formatarDataCompleta } from '../../../shared/ui/formato'
import {
  aparenciaStatusAposta,
  descreverRecompensa,
  rotuloEscolha,
  rotuloMidia,
  rotuloPapelAposta,
} from '../../../shared/ui/status'
import { useAuth } from '../../../shared/auth/AuthContext'
import type { Escolha, PapelAposta, StatusAposta, TipoMidia } from '../../../shared/api/tipos'
import { ItemEvidencia } from '../components/ItemEvidencia'
import { LinhaParticipante } from '../components/LinhaParticipante'
import { useAceitarApostaCommand } from '../hooks/useAceitarApostaCommand'
import { useApostaQuery } from '../hooks/useApostaQuery'
import { useCancelarApostaCommand } from '../hooks/useCancelarApostaCommand'
import { useEnviarEvidenciaCommand } from '../hooks/useEnviarEvidenciaCommand'
import estilos from '../apostas.module.css'

const ENCERRADAS: StatusAposta[] = ['FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA']
const PAPEIS: PapelAposta[] = ['DESAFIANTE', 'DESAFIADO', 'APOSTADOR']
const ESCOLHAS: Escolha[] = ['VAI_CUMPRIR', 'NAO_VAI_CUMPRIR']
const MIDIAS: TipoMidia[] = ['FOTO', 'VIDEO', 'LINK', 'TEXTO']
const MAXIMO_EVIDENCIAS = 5

export function DetalheApostaView() {
  const { id } = useParams()
  const idAposta = Number(id)
  const { usuario } = useAuth()
  const { dados: aposta, carregando, erro, recarregar } = useApostaQuery(idAposta)

  const aceitar = useAceitarApostaCommand(idAposta)
  const cancelar = useCancelarApostaCommand(idAposta)
  const enviarEvidencia = useEnviarEvidenciaCommand(idAposta)

  const [papelAposta, setPapelAposta] = useState<PapelAposta>('APOSTADOR')
  const [escolha, setEscolha] = useState<Escolha>('VAI_CUMPRIR')
  const [motivo, setMotivo] = useState('')
  const [pedindoCancelamento, setPedindoCancelamento] = useState(false)
  const [tipoMidia, setTipoMidia] = useState<TipoMidia>('FOTO')
  const [urlComprovante, setUrlComprovante] = useState('')
  const [notaEvidencia, setNotaEvidencia] = useState('')

  if (carregando) return <SpinnerCentral />
  if (erro) return <Alerta>{erro}</Alerta>
  if (!aposta) return <EstadoVazio titulo="Aposta não encontrada" />

  const status = aparenciaStatusAposta[aposta.status]
  const prazo = descreverPrazo(aposta.dataLimite)
  const encerrada = ENCERRADAS.includes(aposta.status)
  const minhaParticipacao = aposta.participantes.find((p) => p.idUsuario === usuario?.idUsuario)

  const podeAceitar = aposta.status === 'ABERTA' && !minhaParticipacao
  const podeCancelar = aposta.souCriador && !encerrada
  const podeEnviarEvidencia =
    minhaParticipacao?.papelAposta === 'DESAFIADO' &&
    (aposta.status === 'EM_ANDAMENTO' || aposta.status === 'EM_VOTACAO') &&
    aposta.evidencias.length < MAXIMO_EVIDENCIAS &&
    !aposta.evidencias.some((evidencia) => evidencia.status === 'EM_VOTACAO')

  const submeterAceite = async (evento: FormEvent) => {
    evento.preventDefault()
    const resultado = await aceitar.executar({ papelAposta, escolha })
    if (resultado.ok) recarregar()
  }

  const submeterCancelamento = async (evento: FormEvent) => {
    evento.preventDefault()
    const resultado = await cancelar.executar(motivo.trim())
    if (!resultado.ok) return

    setMotivo('')
    setPedindoCancelamento(false)
    recarregar()
  }

  const submeterEvidencia = async (evento: FormEvent) => {
    evento.preventDefault()
    const resultado = await enviarEvidencia.executar({
      tipoMidia,
      urlComprovante: urlComprovante.trim(),
      comentario: notaEvidencia.trim(),
    })
    if (!resultado.ok) return

    setUrlComprovante('')
    setNotaEvidencia('')
    recarregar()
  }

  return (
    <>
      <LinkVoltar para="/apostas" rotulo="Minhas apostas" />
      <CabecalhoPagina
        titulo={aposta.titulo}
        descricao={`${aposta.grupo} · ${aposta.categoria}`}
        acao={<Badge cor={status.cor}>{status.rotulo}</Badge>}
      />

      <Card className={estilos.resumo}>
        {aposta.descricao && <p className={estilos.resumoDescricao}>{aposta.descricao}</p>}

        <dl className={estilos.resumoGrade}>
          <div className={estilos.resumoItem}>
            <dt>Custo por participante</dt>
            <dd>
              <SaldoCp valor={aposta.valorCp} />
            </dd>
          </div>
          <div className={estilos.resumoItem}>
            <dt>Pote em jogo</dt>
            <dd>
              <SaldoCp valor={aposta.valorCp * aposta.participantes.length} />
            </dd>
          </div>
          <div className={estilos.resumoItem}>
            <dt>Recompensa</dt>
            <dd>
              {descreverRecompensa(aposta.tipoRecompensa, aposta.descricaoRecompensa)}
            </dd>
          </div>
          <div className={estilos.resumoItem}>
            <dt>Prazo</dt>
            <dd>
              {formatarDataCompleta(aposta.dataLimite)}
              {!encerrada && <span className={estilos.prazoNota}> — {prazo.texto}</span>}
            </dd>
          </div>
        </dl>
      </Card>

      {aposta.status === 'CANCELADA' && (
        <Alerta>Aposta cancelada. Motivo: {aposta.motivoCancelamento ?? 'não informado'}.</Alerta>
      )}
      {aposta.status === 'FINALIZADA_CUMPRIU' && (
        <Alerta tom="ok">
          Desafio cumprido
          {aposta.dataEncerramento && ` em ${formatarDataCompleta(aposta.dataEncerramento)}`}. O CP
          já foi liquidado.
        </Alerta>
      )}
      {aposta.status === 'FINALIZADA_PERDEU' && (
        <Alerta>
          Desafio perdido
          {aposta.dataEncerramento && ` em ${formatarDataCompleta(aposta.dataEncerramento)}`}. O CP
          já foi liquidado.
        </Alerta>
      )}

      <Secao titulo="Participantes" contagem={aposta.participantes.length}>
        {aposta.participantes.length === 0 ? (
          <EstadoVazio titulo="Ninguém aceitou ainda" />
        ) : (
          <ul className={estilos.participantes}>
            {aposta.participantes.map((participante) => (
              <LinhaParticipante key={participante.idUsuario} participante={participante} />
            ))}
          </ul>
        )}

        {podeAceitar && (
          <Card>
            <form className={estilos.formulario} onSubmit={submeterAceite}>
              <div className={estilos.formularioLinha}>
                <Campo rotulo="Entro como">
                  <select
                    value={papelAposta}
                    onChange={(e) => setPapelAposta(e.target.value as PapelAposta)}
                  >
                    {PAPEIS.map((papel) => (
                      <option key={papel} value={papel}>
                        {rotuloPapelAposta[papel]}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo rotulo="Minha aposta">
                  <select value={escolha} onChange={(e) => setEscolha(e.target.value as Escolha)}>
                    {ESCOLHAS.map((opcao) => (
                      <option key={opcao} value={opcao}>
                        {rotuloEscolha[opcao]}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>

              {aceitar.erro && <Alerta>{aceitar.erro}</Alerta>}

              <div className={estilos.formularioBotoes}>
                <Botao type="submit" carregando={aceitar.enviando}>
                  Aceitar por {aposta.valorCp} CP
                </Botao>
              </div>
            </form>
          </Card>
        )}
      </Secao>

      <Secao titulo="Evidências" contagem={aposta.evidencias.length}>
        {aposta.evidencias.length === 0 ? (
          <EstadoVazio titulo="Nenhuma evidência enviada" />
        ) : (
          <ul className={estilos.evidencias}>
            {aposta.evidencias.map((evidencia) => (
              <ItemEvidencia key={evidencia.idEvidencia} evidencia={evidencia} />
            ))}
          </ul>
        )}

        {podeEnviarEvidencia && (
          <Card>
            <form className={estilos.formulario} onSubmit={submeterEvidencia}>
              <div className={estilos.formularioLinha}>
                <Campo rotulo="Tipo de mídia">
                  <select
                    value={tipoMidia}
                    onChange={(e) => setTipoMidia(e.target.value as TipoMidia)}
                  >
                    {MIDIAS.map((midia) => (
                      <option key={midia} value={midia}>
                        {rotuloMidia[midia]}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo
                  rotulo={tipoMidia === 'TEXTO' ? 'Relato' : 'Link do comprovante'}
                  dica={
                    tipoMidia === 'FOTO'
                      ? 'Link público da imagem (JPEG, PNG, WebP ou GIF, até 5 MB).'
                      : undefined
                  }
                >
                  <input
                    value={urlComprovante}
                    onChange={(e) => setUrlComprovante(e.target.value)}
                    maxLength={500}
                    required
                  />
                </Campo>
              </div>

              <Campo
                rotulo="Comentário"
                dica={
                  tipoMidia === 'FOTO'
                    ? 'Descreva o que a foto mostra — a IA lê o comentário junto com a imagem.'
                    : undefined
                }
              >
                <input
                  value={notaEvidencia}
                  onChange={(e) => setNotaEvidencia(e.target.value)}
                  maxLength={300}
                />
              </Campo>

              {enviarEvidencia.erro && <Alerta>{enviarEvidencia.erro}</Alerta>}

              <p className={estilos.notaIa}>
                A IA confere o comprovante antes de ir para o júri. Pode levar alguns segundos. Se
                ela não reconhecer a prova, é só corrigir e reenviar — a recusa não conta no limite
                de {MAXIMO_EVIDENCIAS} evidências. O júri é congelado no envio: quem for adicionado
                ao grupo depois não vota.
              </p>

              <div className={estilos.formularioBotoes}>
                <Botao type="submit" carregando={enviarEvidencia.enviando}>
                  Enviar evidência
                </Botao>
              </div>
            </form>
          </Card>
        )}
      </Secao>

      {podeCancelar && (
        <Secao titulo="Cancelamento">
          {pedindoCancelamento ? (
            <Card>
              <form className={estilos.formulario} onSubmit={submeterCancelamento}>
                <Campo
                  rotulo="Motivo"
                  dica="Obrigatório. O CP de todos volta por um lançamento novo no ledger."
                >
                  <input
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    maxLength={300}
                    required
                  />
                </Campo>

                {cancelar.erro && <Alerta>{cancelar.erro}</Alerta>}

                <div className={estilos.formularioBotoes}>
                  <Botao type="submit" variante="perigo" carregando={cancelar.enviando}>
                    Confirmar cancelamento
                  </Botao>
                  <Botao
                    type="button"
                    variante="fantasma"
                    onClick={() => setPedindoCancelamento(false)}
                  >
                    Voltar
                  </Botao>
                </div>
              </form>
            </Card>
          ) : (
            <Botao variante="perigo" onClick={() => setPedindoCancelamento(true)}>
              Cancelar aposta
            </Botao>
          )}
        </Secao>
      )}
    </>
  )
}

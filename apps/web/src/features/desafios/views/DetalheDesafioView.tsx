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
  aparenciaStatusDesafio,
  descreverRecompensa,
  rotuloEscolha,
  rotuloMidia,
  rotuloPapelDesafio,
} from '../../../shared/ui/status'
import { useAuth } from '../../../shared/auth/AuthContext'
import type { Escolha, PapelDesafio, StatusDesafio, TipoMidia } from '../../../shared/api/tipos'
import { ItemEvidencia } from '../components/ItemEvidencia'
import { LinhaParticipante } from '../components/LinhaParticipante'
import { useAceitarDesafioCommand } from '../hooks/useAceitarDesafioCommand'
import { useDesafioQuery } from '../hooks/useDesafioQuery'
import { useCancelarDesafioCommand } from '../hooks/useCancelarDesafioCommand'
import { useEnviarEvidenciaCommand } from '../hooks/useEnviarEvidenciaCommand'
import estilos from '../desafios.module.css'

const ENCERRADAS: StatusDesafio[] = ['FINALIZADA_CUMPRIU', 'FINALIZADA_PERDEU', 'CANCELADA']
const PAPEIS: PapelDesafio[] = ['DESAFIANTE', 'DESAFIADO', 'APOSTADOR']
const ESCOLHAS: Escolha[] = ['VAI_CUMPRIR', 'NAO_VAI_CUMPRIR']
const MIDIAS: TipoMidia[] = ['FOTO', 'VIDEO', 'LINK', 'TEXTO']
const MAXIMO_EVIDENCIAS = 5

export function DetalheDesafioView() {
  const { id } = useParams()
  const idDesafio = Number(id)
  const { usuario } = useAuth()
  const { dados: desafio, carregando, erro, recarregar } = useDesafioQuery(idDesafio)

  const aceitar = useAceitarDesafioCommand(idDesafio)
  const cancelar = useCancelarDesafioCommand(idDesafio)
  const enviarEvidencia = useEnviarEvidenciaCommand(idDesafio)

  const [papelDesafio, setPapelDesafio] = useState<PapelDesafio>('APOSTADOR')
  const [escolha, setEscolha] = useState<Escolha>('VAI_CUMPRIR')
  const [motivo, setMotivo] = useState('')
  const [pedindoCancelamento, setPedindoCancelamento] = useState(false)
  const [tipoMidia, setTipoMidia] = useState<TipoMidia>('FOTO')
  const [urlComprovante, setUrlComprovante] = useState('')
  const [notaEvidencia, setNotaEvidencia] = useState('')

  if (carregando) return <SpinnerCentral />
  if (erro) return <Alerta>{erro}</Alerta>
  if (!desafio) return <EstadoVazio titulo="Desafio não encontrado" />

  const status = aparenciaStatusDesafio[desafio.status]
  const prazo = descreverPrazo(desafio.dataLimite)
  const encerrada = ENCERRADAS.includes(desafio.status)
  const minhaParticipacao = desafio.participantes.find((p) => p.idUsuario === usuario?.idUsuario)

  const podeAceitar = desafio.status === 'ABERTA' && !minhaParticipacao
  const podeCancelar = desafio.souCriador && !encerrada
  const podeEnviarEvidencia =
    minhaParticipacao?.papelDesafio === 'DESAFIADO' &&
    (desafio.status === 'EM_ANDAMENTO' || desafio.status === 'EM_VOTACAO') &&
    desafio.evidencias.length < MAXIMO_EVIDENCIAS &&
    !desafio.evidencias.some((evidencia) => evidencia.status === 'EM_VOTACAO')

  const submeterAceite = async (evento: FormEvent) => {
    evento.preventDefault()
    const resultado = await aceitar.executar({ papelDesafio, escolha })
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
      <LinkVoltar para="/desafios" rotulo="Meus desafios" />
      <CabecalhoPagina
        titulo={desafio.titulo}
        descricao={`${desafio.grupo} · ${desafio.categoria}`}
        acao={<Badge cor={status.cor}>{status.rotulo}</Badge>}
      />

      <Card className={estilos.resumo}>
        {desafio.descricao && <p className={estilos.resumoDescricao}>{desafio.descricao}</p>}

        <dl className={estilos.resumoGrade}>
          <div className={estilos.resumoItem}>
            <dt>Custo por participante</dt>
            <dd>
              <SaldoCp valor={desafio.valorCp} />
            </dd>
          </div>
          <div className={estilos.resumoItem}>
            <dt>Pote em jogo</dt>
            <dd>
              <SaldoCp valor={desafio.valorCp * desafio.participantes.length} />
            </dd>
          </div>
          <div className={estilos.resumoItem}>
            <dt>Recompensa</dt>
            <dd>
              {descreverRecompensa(desafio.tipoRecompensa, desafio.descricaoRecompensa)}
            </dd>
          </div>
          <div className={estilos.resumoItem}>
            <dt>Prazo</dt>
            <dd>
              {formatarDataCompleta(desafio.dataLimite)}
              {!encerrada && <span className={estilos.prazoNota}> — {prazo.texto}</span>}
            </dd>
          </div>
        </dl>
      </Card>

      {desafio.status === 'CANCELADA' && (
        <Alerta>Desafio cancelado. Motivo: {desafio.motivoCancelamento ?? 'não informado'}.</Alerta>
      )}
      {desafio.status === 'FINALIZADA_CUMPRIU' && (
        <Alerta tom="ok">
          Desafio cumprido
          {desafio.dataEncerramento && ` em ${formatarDataCompleta(desafio.dataEncerramento)}`}. O CP
          já foi liquidado.
        </Alerta>
      )}
      {desafio.status === 'FINALIZADA_PERDEU' && (
        <Alerta>
          Desafio perdido
          {desafio.dataEncerramento && ` em ${formatarDataCompleta(desafio.dataEncerramento)}`}. O CP
          já foi liquidado.
        </Alerta>
      )}

      <Secao titulo="Participantes" contagem={desafio.participantes.length}>
        {desafio.participantes.length === 0 ? (
          <EstadoVazio titulo="Ninguém aceitou ainda" />
        ) : (
          <ul className={estilos.participantes}>
            {desafio.participantes.map((participante) => (
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
                    value={papelDesafio}
                    onChange={(e) => setPapelDesafio(e.target.value as PapelDesafio)}
                  >
                    {PAPEIS.map((papel) => (
                      <option key={papel} value={papel}>
                        {rotuloPapelDesafio[papel]}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo rotulo="Meu desafio">
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
                  Aceitar por {desafio.valorCp} CP
                </Botao>
              </div>
            </form>
          </Card>
        )}
      </Secao>

      <Secao titulo="Evidências" contagem={desafio.evidencias.length}>
        {desafio.evidencias.length === 0 ? (
          <EstadoVazio titulo="Nenhuma evidência enviada" />
        ) : (
          <ul className={estilos.evidencias}>
            {desafio.evidencias.map((evidencia) => (
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
                  dica="O júri é congelado no envio: quem entrar no grupo depois não vota."
                >
                  <input
                    value={urlComprovante}
                    onChange={(e) => setUrlComprovante(e.target.value)}
                    maxLength={500}
                    required
                  />
                </Campo>
              </div>

              <Campo rotulo="Comentário">
                <input
                  value={notaEvidencia}
                  onChange={(e) => setNotaEvidencia(e.target.value)}
                  maxLength={300}
                />
              </Campo>

              {enviarEvidencia.erro && <Alerta>{enviarEvidencia.erro}</Alerta>}

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
              Cancelar desafio
            </Botao>
          )}
        </Secao>
      )}
    </>
  )
}

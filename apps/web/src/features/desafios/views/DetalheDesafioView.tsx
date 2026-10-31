import { useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  Alerta,
  Badge,
  Botao,
  Campo,
  Dialogo,
  EstadoVazio,
  LinkVoltar,
  Menu,
  SaldoCp,
  SpinnerCentral,
  Trilha,
} from '../../../shared/ui'
import { formatarDataCompleta, formatarDataHora } from '../../../shared/ui/formato'
import { aparenciaStatusDesafio, rotuloMidia, rotuloPapelDesafio } from '../../../shared/ui/status'
import { useAuth } from '../../../shared/auth/AuthContext'
import type { DesafioDetalhe, Escolha, PapelDesafio, TipoMidia } from '../../../shared/api/tipos'
import { ENCERRADOS, etapasDoDesafio, formatarDia } from '../apresentacao'
import { CartaoProva } from '../components/CartaoProva'
import { Confronto } from '../components/Confronto'
import { useAceitarDesafioCommand } from '../hooks/useAceitarDesafioCommand'
import { useCancelarDesafioCommand } from '../hooks/useCancelarDesafioCommand'
import { useDesafioQuery } from '../hooks/useDesafioQuery'
import { useEnviarEvidenciaCommand } from '../hooks/useEnviarEvidenciaCommand'
import estilos from '../detalhe.module.css'

const MIDIAS: TipoMidia[] = ['FOTO', 'VIDEO', 'LINK', 'TEXTO']
const MAXIMO_EVIDENCIAS = 5

/** O que aparece embaixo de cada etapa da linha do tempo. */
function detalhesDasEtapas(desafio: DesafioDetalhe): string[] {
  const ultima = desafio.evidencias[desafio.evidencias.length - 1]
  const n = desafio.participantes.length
  return [
    `por ${desafio.criador}`,
    n === 0 ? 'ninguém entrou' : `${n} ${n === 1 ? 'pessoa' : 'pessoas'}`,
    ultima
      ? ultima.status === 'EM_VOTACAO'
        ? `${Math.max(ultima.votosFavoraveis, ultima.votosContra)} de ${ultima.quorum} votos · até ${formatarDia(ultima.dataLimiteVotacao)}`
        : `prova #${ultima.ordem} ${ultima.status === 'ACEITA' ? 'aceita' : 'recusada'}`
      : 'sem prova ainda',
    desafio.dataEncerramento ? formatarDia(desafio.dataEncerramento) : 'pote dividido',
  ]
}

export function DetalheDesafioView() {
  const { id } = useParams()
  const idDesafio = Number(id)
  const { usuario } = useAuth()
  const { dados: desafio, carregando, erro, recarregar } = useDesafioQuery(idDesafio)

  const aceitar = useAceitarDesafioCommand(idDesafio)
  const cancelar = useCancelarDesafioCommand(idDesafio)
  const enviarEvidencia = useEnviarEvidenciaCommand(idDesafio)

  const [papelDesafio, setPapelDesafio] = useState<PapelDesafio | null>(null)
  const [escolha, setEscolha] = useState<Escolha>('VAI_CUMPRIR')
  const [motivo, setMotivo] = useState('')
  const [cancelando, setCancelando] = useState(false)
  const [tipoMidia, setTipoMidia] = useState<TipoMidia>('FOTO')
  const [urlComprovante, setUrlComprovante] = useState('')
  const [notaEvidencia, setNotaEvidencia] = useState('')

  if (carregando) return <SpinnerCentral />
  if (erro) return <Alerta>{erro}</Alerta>
  if (!desafio) return <EstadoVazio titulo="Desafio não encontrado" />

  const status = aparenciaStatusDesafio[desafio.status]
  const encerrado = ENCERRADOS.includes(desafio.status)
  const trilha = etapasDoDesafio(desafio.status)
  const detalhes = detalhesDasEtapas(desafio)
  const minhaParticipacao = desafio.participantes.find((p) => p.idUsuario === usuario?.idUsuario)

  // Desafiante e desafiado são únicos (RN09); apostador é livre.
  const papeisLivres: PapelDesafio[] = (['DESAFIADO', 'DESAFIANTE', 'APOSTADOR'] as PapelDesafio[]).filter(
    (papel) => papel === 'APOSTADOR' || !desafio.participantes.some((p) => p.papelDesafio === papel),
  )
  const papel = papelDesafio && papeisLivres.includes(papelDesafio) ? papelDesafio : papeisLivres[0]

  const podeAceitar = desafio.status === 'ABERTA' && !minhaParticipacao
  const podeCancelar = desafio.souCriador && !encerrado
  const evidencias = desafio.evidencias
  const ultima = evidencias[evidencias.length - 1]
  const podeEnviarEvidencia =
    minhaParticipacao?.papelDesafio === 'DESAFIADO' &&
    (desafio.status === 'EM_ANDAMENTO' || desafio.status === 'EM_VOTACAO') &&
    evidencias.length < MAXIMO_EVIDENCIAS &&
    !evidencias.some((evidencia) => evidencia.status === 'EM_VOTACAO')

  const escolherPapel = (novo: PapelDesafio) => {
    setPapelDesafio(novo)
    // Quem é desafiado aposta em si; quem desafia, contra. Dá para trocar depois.
    if (novo === 'DESAFIADO') setEscolha('VAI_CUMPRIR')
    if (novo === 'DESAFIANTE') setEscolha('NAO_VAI_CUMPRIR')
  }

  const submeterAceite = async (evento: FormEvent) => {
    evento.preventDefault()
    const resultado = await aceitar.executar({ papelDesafio: papel, escolha })
    if (resultado.ok) recarregar()
  }

  const submeterCancelamento = async (evento: FormEvent) => {
    evento.preventDefault()
    const resultado = await cancelar.executar(motivo.trim())
    if (!resultado.ok) return

    setMotivo('')
    setCancelando(false)
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
      <LinkVoltar para="/desafios" rotulo="Desafios" />

      <header className={estilos.cabecalho}>
        <div className={estilos.cabecalhoTextos}>
          <Badge cor={status.cor}>{status.rotulo}</Badge>
          <h1 className={estilos.titulo}>{desafio.titulo}</h1>
          <p className={estilos.meta}>
            {desafio.grupo} · {desafio.categoria} · criado por {desafio.criador}
          </p>
        </div>
        {podeCancelar && (
          <Menu
            rotulo="Mais ações"
            itens={[{ rotulo: 'Cancelar desafio…', perigo: true, aoEscolher: () => setCancelando(true) }]}
          />
        )}
      </header>

      <div className={estilos.trilha}>
        <Trilha
          etapas={trilha.etapas.map((etapa, indice) => ({ ...etapa, detalhe: detalhes[indice] }))}
          atual={trilha.atual}
          cor={trilha.cor}
        />
      </div>

      {desafio.status === 'CANCELADA' && (
        <Alerta>Desafio cancelado. Motivo: {desafio.motivoCancelamento ?? 'não informado'}. O CP voltou para todos.</Alerta>
      )}
      {(desafio.status === 'FINALIZADA_CUMPRIU' || desafio.status === 'FINALIZADA_PERDEU') && (
        <Alerta tom={desafio.status === 'FINALIZADA_CUMPRIU' ? 'ok' : 'erro'}>
          {desafio.status === 'FINALIZADA_CUMPRIU' ? 'Desafio cumprido' : 'Desafio perdido'}
          {desafio.dataEncerramento && ` em ${formatarDataCompleta(desafio.dataEncerramento)}`}. O pote já foi
          dividido.
        </Alerta>
      )}

      <div className={estilos.grade}>
        <div className={estilos.coluna}>
          <Confronto desafio={desafio} idUsuario={usuario?.idUsuario} />

          <section className={estilos.sobre}>
            {desafio.descricao && <p className={estilos.descricao}>{desafio.descricao}</p>}
            <dl className={estilos.fatos}>
              <div>
                <dt>Combinado fora do app</dt>
                <dd>{desafio.descricaoRecompensa?.trim() || 'nada combinado'}</dd>
              </div>
              <div>
                <dt>Prazo</dt>
                <dd>{formatarDataHora(desafio.dataLimite)}</dd>
              </div>
            </dl>
          </section>

          {podeAceitar && (
            <form className={estilos.entrar} onSubmit={submeterAceite}>
              <h2 className={estilos.entrarTitulo}>
                Entrar por <SaldoCp valor={desafio.valorCp} />
              </h2>
              <div className={estilos.opcoes} role="radiogroup" aria-label="Seu papel">
                {papeisLivres.map((opcao) => (
                  <button
                    key={opcao}
                    type="button"
                    role="radio"
                    aria-checked={papel === opcao}
                    className={[estilos.opcao, papel === opcao && estilos.opcaoAtiva].filter(Boolean).join(' ')}
                    onClick={() => escolherPapel(opcao)}
                  >
                    {rotuloPapelDesafio[opcao]}
                  </button>
                ))}
              </div>
              <div className={estilos.opcoes} role="radiogroup" aria-label="Sua aposta">
                {(['VAI_CUMPRIR', 'NAO_VAI_CUMPRIR'] as Escolha[]).map((opcao) => (
                  <button
                    key={opcao}
                    type="button"
                    role="radio"
                    aria-checked={escolha === opcao}
                    className={[
                      estilos.opcao,
                      escolha === opcao && (opcao === 'VAI_CUMPRIR' ? estilos.opcaoSim : estilos.opcaoNao),
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setEscolha(opcao)}
                  >
                    {opcao === 'VAI_CUMPRIR' ? 'Vai cumprir' : 'Não vai cumprir'}
                  </button>
                ))}
              </div>
              {aceitar.erro && <Alerta>{aceitar.erro}</Alerta>}
              <Botao type="submit" carregando={aceitar.enviando}>
                Entrar como {rotuloPapelDesafio[papel].toLowerCase()}
              </Botao>
            </form>
          )}
        </div>

        <div className={estilos.coluna}>
          {ultima ? (
            <>
              <CartaoProva evidencia={ultima} destaque />
              {evidencias.length > 1 && (
                <ul className={estilos.provasAntigas}>
                  {evidencias
                    .slice(0, -1)
                    .reverse()
                    .map((evidencia) => (
                      <CartaoProva key={evidencia.idEvidencia} evidencia={evidencia} destaque={false} />
                    ))}
                </ul>
              )}
            </>
          ) : (
            <div className={estilos.semProva}>
              <strong>Nenhuma prova ainda</strong>
              <span>
                {desafio.status === 'ABERTA'
                  ? 'O desafiado envia a prova depois que o desafio começa.'
                  : 'O desafiado ainda não mandou a prova.'}
              </span>
            </div>
          )}

          {podeEnviarEvidencia && (
            <form className={estilos.enviar} onSubmit={submeterEvidencia}>
              <h2 className={estilos.entrarTitulo}>{ultima ? 'Enviar nova prova' : 'Enviar a prova'}</h2>
              <div className={estilos.opcoes} role="radiogroup" aria-label="Tipo de prova">
                {MIDIAS.map((midia) => (
                  <button
                    key={midia}
                    type="button"
                    role="radio"
                    aria-checked={tipoMidia === midia}
                    className={[estilos.opcao, tipoMidia === midia && estilos.opcaoAtiva].filter(Boolean).join(' ')}
                    onClick={() => setTipoMidia(midia)}
                  >
                    {rotuloMidia[midia]}
                  </button>
                ))}
              </div>
              <Campo
                rotulo={tipoMidia === 'TEXTO' ? 'Relato' : 'Link do comprovante'}
                dica="O júri é definido no envio: quem entrar no grupo depois não vota."
              >
                <input
                  value={urlComprovante}
                  onChange={(e) => setUrlComprovante(e.target.value)}
                  maxLength={500}
                  placeholder={tipoMidia === 'TEXTO' ? 'Conte como foi' : 'https://'}
                  required
                />
              </Campo>
              <Campo rotulo="Comentário">
                <input
                  value={notaEvidencia}
                  onChange={(e) => setNotaEvidencia(e.target.value)}
                  maxLength={300}
                  placeholder="Opcional"
                />
              </Campo>
              {enviarEvidencia.erro && <Alerta>{enviarEvidencia.erro}</Alerta>}
              <Botao type="submit" carregando={enviarEvidencia.enviando}>
                Mandar para o júri
              </Botao>
            </form>
          )}
        </div>
      </div>

      {cancelando && (
        <Dialogo titulo="Cancelar o desafio?" aoFechar={() => setCancelando(false)}>
          <form className={estilos.formDialogo} onSubmit={submeterCancelamento}>
            <p className={estilos.textoDialogo}>
              O CP de quem entrou volta por um lançamento novo no extrato. Não dá para desfazer.
            </p>
            <Campo rotulo="Motivo" dica="Obrigatório — aparece para o grupo.">
              <input value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={300} required autoFocus />
            </Campo>
            {cancelar.erro && <Alerta>{cancelar.erro}</Alerta>}
            <Botao type="submit" variante="perigo" carregando={cancelar.enviando}>
              Cancelar o desafio
            </Botao>
            <Botao type="button" variante="fantasma" onClick={() => setCancelando(false)}>
              Voltar
            </Botao>
          </form>
        </Dialogo>
      )}
    </>
  )
}

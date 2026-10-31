import { useNavigate } from 'react-router-dom'
import { Avatar, Botao, Dialogo, Icone, SaldoCp } from '../../../shared/ui'
import type { DesafioDetalhe } from '../../../shared/api/tipos'
import { dividirPote } from '../../desafios/apresentacao'
import estilos from '../votacao.module.css'

interface Props {
  desafio: DesafioDetalhe
  idEvidencia: number
  aoFechar: () => void
}

/** Recompensa por voto quando a evidência atinge quórum (RN17). */
const RECOMPENSA_VOTO = 2

/**
 * O que o banco acabou de fazer com o meu voto. Nada aqui decide: tudo é lido do desafio
 * depois que `apurar_votacao` commitou.
 */
export function ResultadoVoto({ desafio, idEvidencia, aoFechar }: Props) {
  const navegar = useNavigate()
  const evidencia = desafio.evidencias.find((e) => e.idEvidencia === idEvidencia)
  const fechou = evidencia !== undefined && evidencia.status !== 'EM_VOTACAO'
  const vale = evidencia?.status === 'ACEITA'
  const encerrou = desafio.status === 'FINALIZADA_CUMPRIU' || desafio.status === 'FINALIZADA_PERDEU'

  const vencedor = desafio.status === 'FINALIZADA_CUMPRIU' ? 'VAI_CUMPRIR' : 'NAO_VAI_CUMPRIR'
  const ganhos = encerrou ? dividirPote(desafio.participantes, desafio.valorCp, vencedor) : []
  const perdedores = encerrou ? desafio.participantes.filter((p) => p.escolha !== vencedor) : []
  const desafiado = desafio.participantes.find((p) => p.papelDesafio === 'DESAFIADO')?.apelido ?? 'O desafiado'

  if (!fechou || !evidencia) {
    const lider = evidencia ? Math.max(evidencia.votosFavoraveis, evidencia.votosContra) : 0
    const faltam = evidencia ? evidencia.quorum - lider : 0
    return (
      <Dialogo titulo="Voto registrado" aoFechar={aoFechar}>
        <p className={estilos.textoDialogo}>
          {faltam === 1 ? 'Falta 1 voto' : `Faltam ${faltam} votos`} para o júri fechar. Quando fechar, o banco apura
          e divide o pote na mesma transação — e você recebe {RECOMPENSA_VOTO} CP.
        </p>
        <Botao bloco onClick={aoFechar}>
          Ok
        </Botao>
      </Dialogo>
    )
  }

  return (
    <Dialogo
      aoFechar={aoFechar}
      titulo={<span className={estilos.resultadoTitulo}>Júri fechou: {vale ? 'vale!' : 'não vale'}</span>}
    >
      <div className={[estilos.selo, vale ? estilos.seloVale : estilos.seloNaoVale].join(' ')} aria-hidden="true">
        <Icone nome={vale ? 'check' : 'fechar'} tamanho={44} />
      </div>

      <p className={estilos.resultadoResumo}>
        {encerrou
          ? `${desafiado} ${desafio.status === 'FINALIZADA_CUMPRIU' ? 'cumpriu' : 'não cumpriu'} o desafio. Pote de ${
              desafio.valorCp * desafio.participantes.length
            } CP dividido.`
          : `${desafiado} pode mandar outra prova.`}
      </p>

      {encerrou && (
        <ul className={estilos.pagamentos}>
          {ganhos.map((ganho) => (
            <li key={ganho.participante.idUsuario}>
              <Avatar apelido={ganho.participante.apelido} url={ganho.participante.avatarUrl} />
              {ganho.participante.apelido}
              <span className={estilos.mais}>+{ganho.valor} CP</span>
            </li>
          ))}
          {perdedores.map((pessoa) => (
            <li key={pessoa.idUsuario}>
              <Avatar apelido={pessoa.apelido} url={pessoa.avatarUrl} />
              {pessoa.apelido}
              <span className={estilos.perdeu}>perdeu {desafio.valorCp} CP</span>
            </li>
          ))}
        </ul>
      )}

      <div className={estilos.voce}>
        <span>Você, pelo voto</span>
        <SaldoCp valor={RECOMPENSA_VOTO} comSinal />
      </div>

      <span className={estilos.banco}>
        <Icone nome="banco" tamanho={14} />
        Apurado e pago pelo banco numa transação só
      </span>

      <Botao bloco variante="secundaria" onClick={() => navegar(`/desafios/${desafio.idDesafio}`)}>
        Ver o desafio
      </Botao>
    </Dialogo>
  )
}

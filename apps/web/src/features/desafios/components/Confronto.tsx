import { Avatar, SaldoCp } from '../../../shared/ui'
import { rotuloPapelDesafio } from '../../../shared/ui/status'
import type { DesafioDetalhe, Escolha } from '../../../shared/api/tipos'
import { dividirPote } from '../apresentacao'
import estilos from '../detalhe.module.css'

interface Props {
  desafio: DesafioDetalhe
  idUsuario: number | undefined
}

const VENCEDOR: Partial<Record<DesafioDetalhe['status'], Escolha>> = {
  FINALIZADA_CUMPRIU: 'VAI_CUMPRIR',
  FINALIZADA_PERDEU: 'NAO_VAI_CUMPRIR',
}

/** A aposta como dois lados: quem diz que cumpre, quem duvida, e o que cada lado leva. */
export function Confronto({ desafio, idUsuario }: Props) {
  const pote = desafio.valorCp * desafio.participantes.length
  const vencedor = VENCEDOR[desafio.status]

  const lado = (escolha: Escolha) => {
    const pessoas = desafio.participantes.filter((p) => p.escolha === escolha)
    const ganhos = dividirPote(desafio.participantes, desafio.valorCp, escolha)
    const sim = escolha === 'VAI_CUMPRIR'
    const ganhou = vencedor === escolha
    const perdeu = vencedor !== undefined && !ganhou

    return (
      <div
        className={[
          estilos.lado,
          sim ? estilos.ladoSim : estilos.ladoNao,
          ganhou && estilos.ladoVenceu,
          perdeu && estilos.ladoPerdeu,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <span className={estilos.ladoTitulo}>
          {sim ? 'Vai cumprir' : 'Não vai cumprir'}
          {ganhou && <span className={estilos.ladoSelo}>venceu</span>}
        </span>

        {pessoas.length === 0 ? (
          <span className={estilos.ladoVazio}>Ninguém deste lado ainda</span>
        ) : (
          <ul className={estilos.pessoas}>
            {pessoas.map((pessoa) => (
              <li key={pessoa.idUsuario} className={estilos.pessoa}>
                <Avatar apelido={pessoa.apelido} url={pessoa.avatarUrl} />
                <span>
                  {pessoa.apelido}
                  <small>
                    {rotuloPapelDesafio[pessoa.papelDesafio].toLowerCase()}
                    {pessoa.idUsuario === idUsuario && ' · você'}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        )}

        {ganhos.length > 0 && desafio.status !== 'CANCELADA' && (
          <span className={estilos.ganho}>
            {ganhou ? 'Levou' : perdeu ? 'Levaria' : sim ? 'Se cumprir' : 'Se não cumprir'}:{' '}
            {ganhos.length === 1 ? (
              <>
                <SaldoCp valor={ganhos[0].valor} /> para {ganhos[0].participante.apelido}
              </>
            ) : ganhos.every((g) => g.valor === ganhos[0].valor) ? (
              <>
                <SaldoCp valor={ganhos[0].valor} /> para cada
              </>
            ) : (
              ganhos.map((g) => `${g.participante.apelido} ${g.valor}`).join(' · ') + ' CP'
            )}
          </span>
        )}
      </div>
    )
  }

  return (
    <section className={estilos.confronto} aria-label="Quem está em jogo">
      {lado('VAI_CUMPRIR')}
      <div className={estilos.pote}>
        <span className={estilos.poteRotulo}>pote</span>
        <SaldoCp valor={pote} grande />
        <span className={estilos.poteRotulo}>{desafio.valorCp} CP por pessoa</span>
      </div>
      {lado('NAO_VAI_CUMPRIR')}
    </section>
  )
}

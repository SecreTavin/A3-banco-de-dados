import { useState } from 'react'
import { Alerta, Botao, Dialogo, Icone } from '../../../shared/ui'
import type { TipoVoto } from '../../../shared/api/tipos'
import estilos from '../votacao.module.css'

interface Props {
  voto: TipoVoto
  enviando: boolean
  erro: string | null
  aoConfirmar: (justificativa: string) => void
  aoVoltar: () => void
}

const MOTIVOS: Record<TipoVoto, string[]> = {
  VALIDO: ['A prova confere', 'Cumpriu o combinado', 'Dentro do prazo'],
  INVALIDO: ['A prova não mostra o combinado', 'Parece editada', 'Fora do prazo'],
}

/** O voto é único (RN14): confirma antes de gravar, com motivos prontos. */
export function ConfirmarVoto({ voto, enviando, erro, aoConfirmar, aoVoltar }: Props) {
  const [marcados, setMarcados] = useState<string[]>([])
  const [texto, setTexto] = useState('')
  const vale = voto === 'VALIDO'

  const alternar = (motivo: string) =>
    setMarcados((atual) => (atual.includes(motivo) ? atual.filter((m) => m !== motivo) : [...atual, motivo]))

  const confirmar = () => aoConfirmar([...marcados, texto.trim()].filter(Boolean).join('. '))

  return (
    <Dialogo
      aoFechar={aoVoltar}
      titulo={
        <>
          <span className={vale ? estilos.iconeVale : estilos.iconeNaoVale}>
            <Icone nome={vale ? 'check' : 'fechar'} tamanho={20} />
          </span>
          {vale ? 'Vale' : 'Não vale'}
        </>
      }
    >
      <p className={estilos.textoDialogo}>Quer dizer por quê? Ajuda quem for ler a apuração.</p>
      <div className={estilos.motivos}>
        {MOTIVOS[voto].map((motivo) => (
          <button
            key={motivo}
            type="button"
            aria-pressed={marcados.includes(motivo)}
            className={[estilos.motivo, marcados.includes(motivo) && (vale ? estilos.motivoVale : estilos.motivoNaoVale)]
              .filter(Boolean)
              .join(' ')}
            onClick={() => alternar(motivo)}
          >
            {motivo}
          </button>
        ))}
      </div>
      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        maxLength={200}
        placeholder="Escreva algo (opcional)"
        aria-label="Justificativa"
      />
      <span className={estilos.aviso}>
        <Icone nome="info" tamanho={15} />O voto não pode ser mudado depois.
      </span>
      {erro && <Alerta>{erro}</Alerta>}
      <Botao bloco carregando={enviando} onClick={confirmar}>
        Confirmar voto
      </Botao>
      <Botao bloco variante="fantasma" onClick={aoVoltar}>
        Voltar
      </Botao>
    </Dialogo>
  )
}

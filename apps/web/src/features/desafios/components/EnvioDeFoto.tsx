import { useEffect, useRef, useState } from 'react'
import { Alerta, Botao } from '../../../shared/ui'
import { useEnviarFotoCommand } from '../hooks/useEnviarFotoCommand'
import estilos from '../detalhe.module.css'

interface Props {
  /** URL da foto já guardada, ou '' para limpar. */
  aoMudar: (url: string) => void
}

/** Escolher a foto da prova no celular ou no computador; ela sobe na hora (ADR 0022). */
export function EnvioDeFoto({ aoMudar }: Props) {
  const enviar = useEnviarFotoCommand()
  const seletor = useRef<HTMLInputElement>(null)
  const [previa, setPrevia] = useState<string | null>(null)

  useEffect(() => () => {
    if (previa) URL.revokeObjectURL(previa)
  }, [previa])

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return
    aoMudar('')
    setPrevia(URL.createObjectURL(arquivo))
    const resultado = await enviar.executar(arquivo)
    if (resultado.ok) aoMudar(resultado.dados)
    else setPrevia(null)
  }

  return (
    <div className={estilos.envioFoto}>
      <input
        ref={seletor}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        hidden
        onChange={(e) => {
          void escolher(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      {previa && <img className={estilos.previaFoto} src={previa} alt="Foto escolhida" />}
      <Botao
        type="button"
        variante={previa ? 'fantasma' : 'secundaria'}
        carregando={enviar.enviando}
        onClick={() => seletor.current?.click()}
      >
        {previa ? 'Trocar foto' : 'Escolher foto'}
      </Botao>
      {enviar.erro && <Alerta>{enviar.erro}</Alerta>}
    </div>
  )
}

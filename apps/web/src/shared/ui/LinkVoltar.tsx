import { Link } from 'react-router-dom'
import { Icone } from './Icone'
import estilos from './ui.module.css'

export function LinkVoltar({ para, rotulo }: { para: string; rotulo: string }) {
  return (
    <Link to={para} className={estilos.voltar}>
      <Icone nome="voltar" tamanho={15} />
      {rotulo}
    </Link>
  )
}

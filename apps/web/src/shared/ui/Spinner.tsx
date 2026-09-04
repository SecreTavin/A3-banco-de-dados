import estilos from './ui.module.css'

export function Spinner({ tamanho = 22 }: { tamanho?: number }) {
  return <span className={estilos.spinner} style={{ width: tamanho, height: tamanho }} />
}

export function SpinnerCentral() {
  return (
    <div className={estilos.spinnerCentral}>
      <Spinner tamanho={28} />
    </div>
  )
}

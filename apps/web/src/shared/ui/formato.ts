const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const dataCompleta = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function formatarDataHora(iso: string) {
  return dataHora.format(new Date(iso))
}

export function formatarDataCompleta(iso: string) {
  return dataCompleta.format(new Date(iso))
}

export function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const MINUTO = 60_000
const HORA = 60 * MINUTO
const DIA = 24 * HORA

export interface Prazo {
  texto: string
  vencido: boolean
  urgente: boolean
}

export function descreverPrazo(iso: string): Prazo {
  const restante = new Date(iso).getTime() - Date.now()

  if (restante <= 0) return { texto: 'prazo encerrado', vencido: true, urgente: false }

  if (restante < HORA) {
    const minutos = Math.max(1, Math.round(restante / MINUTO))
    return { texto: `faltam ${minutos} min`, vencido: false, urgente: true }
  }

  if (restante < DIA) {
    const horas = Math.round(restante / HORA)
    return { texto: `faltam ${horas} h`, vencido: false, urgente: true }
  }

  const dias = Math.round(restante / DIA)
  return { texto: `faltam ${dias} ${dias === 1 ? 'dia' : 'dias'}`, vencido: false, urgente: dias <= 2 }
}

/** `datetime-local` devolve horário local sem fuso; a API espera ISO com offset. */
export function paraIso(valorLocal: string) {
  return new Date(valorLocal).toISOString()
}

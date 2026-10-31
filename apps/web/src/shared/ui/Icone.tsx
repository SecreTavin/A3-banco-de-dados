const CAMINHOS = {
  desafios: 'M4 6h16M4 12h10M4 18h7M17 15l2.5 2.5L23 13',
  votacao: 'M9 12l2 2 4-4M4 5h16v14H4z',
  grupos: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 9.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM21 19v-1a4 4 0 0 0-3-3.8M16.5 3.7a3 3 0 0 1 0 5.8',
  ranking: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  perfil: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mais: 'M12 5v14M5 12h14',
  voltar: 'M15 19l-7-7 7-7',
  sair: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  relogio: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  escudo: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  trofeu: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  pontos: 'M5 12h.01M12 12h.01M19 12h.01',
  check: 'M20 6L9 17l-5-5',
  fechar: 'M18 6L6 18M6 6l12 12',
  ampliar: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  banco: 'M4 5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  filtro: 'M3 6h18M6 12h12M10 18h4',
} as const

export type NomeIcone = keyof typeof CAMINHOS

interface Props {
  nome: NomeIcone
  tamanho?: number
}

export function Icone({ nome, tamanho = 20 }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={nome === 'pontos' ? 3 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={CAMINHOS[nome]} />
    </svg>
  )
}

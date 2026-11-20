import { Link, NavLink, Outlet } from 'react-router-dom'
import type { Usuario } from '../api/tipos'
import { Avatar } from './Avatar'
import { BotaoTema } from './BotaoTema'
import { Icone } from './Icone'
import type { NomeIcone } from './Icone'
import estilos from './shell.module.css'

export interface AbaNavegacao {
  rota: string
  rotulo: string
  icone: NomeIcone
  /** Pendências da aba (provas esperando o voto); 0 esconde a bolha. */
  contagem?: number
}

interface Props {
  usuario: Usuario
  abas: AbaNavegacao[]
  aoSair: () => void
}

/**
 * Moldura do app. Um DOM só para dois arranjos: no celular a marca e o usuário
 * ficam no topo e a navegação vira barra inferior, com o "Novo desafio" no
 * meio, ao alcance do polegar; no desktop a mesma barra vira a coluna lateral.
 */
export function AppShell({ usuario, abas, aoSair }: Props) {
  const metade = Math.ceil(abas.length / 2)
  const Aba = ({ aba }: { aba: AbaNavegacao }) => (
    <NavLink
      to={aba.rota}
      className={({ isActive }) => [estilos.aba, isActive && estilos.abaAtiva].filter(Boolean).join(' ')}
    >
      <span className={estilos.abaIcone}>
        <Icone nome={aba.icone} tamanho={22} />
        {Boolean(aba.contagem) && (
          <span className={estilos.bolha} aria-label={`${aba.contagem} pendente(s)`}>
            {aba.contagem}
          </span>
        )}
      </span>
      <span className={estilos.abaRotulo}>{aba.rotulo}</span>
    </NavLink>
  )

  return (
    <div className={estilos.app}>
      <a href="#conteudo" className={estilos.pular}>
        Pular para o conteúdo
      </a>

      <header className={estilos.barra}>
        <Link to="/desafios" className={estilos.marca} aria-label="Eu Duvido! Início">
          <span className={estilos.marcaIcone} aria-hidden="true">
            ?<em>!</em>
          </span>
          <span className={estilos.marcaNome}>Eu Duvido!</span>
        </Link>

        <nav className={estilos.nav} aria-label="Principal">
          {abas.slice(0, metade).map((aba) => (
            <Aba key={aba.rota} aba={aba} />
          ))}
          <Link to="/desafios/nova" className={estilos.novo} aria-label="Novo desafio">
            <span className={estilos.novoIcone}>
              <Icone nome="mais" tamanho={24} />
            </span>
            <span className={estilos.novoRotulo}>Novo desafio</span>
          </Link>
          {abas.slice(metade).map((aba) => (
            <Aba key={aba.rota} aba={aba} />
          ))}
        </nav>

        <div className={estilos.acoes}>
          <BotaoTema />
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              [estilos.usuario, isActive && estilos.usuarioAtivo].filter(Boolean).join(' ')
            }
            title="Meu perfil"
          >
            <Avatar apelido={usuario.apelido} url={usuario.avatarUrl} />
            <span className={estilos.usuarioTextos}>
              <span className={estilos.apelido}>{usuario.apelido}</span>
              <span className={estilos.verPerfil}>Ver perfil</span>
            </span>
          </NavLink>
          <button className={estilos.sair} onClick={aoSair} title="Sair" aria-label="Sair">
            <Icone nome="sair" tamanho={18} />
          </button>
        </div>
      </header>

      <main id="conteudo" className={estilos.conteudo} tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}

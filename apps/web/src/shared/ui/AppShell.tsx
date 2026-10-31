import { NavLink, Outlet } from 'react-router-dom'
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

export function AppShell({ usuario, abas, aoSair }: Props) {
  return (
    <div className={estilos.app}>
      <header className={estilos.topo}>
        <span className={estilos.marca}>
          <span className={estilos.marcaIcone}>?</span>
          Eu Duvido!
        </span>

        <span className={estilos.espaco} />

        <span className={estilos.acoes}>
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              [estilos.usuario, isActive && estilos.usuarioAtivo].filter(Boolean).join(' ')
            }
            title="Meu perfil"
          >
            <Avatar apelido={usuario.apelido} url={usuario.avatarUrl} />
            <span className={estilos.apelido}>{usuario.apelido}</span>
          </NavLink>

          <BotaoTema />

          <button className={estilos.sair} onClick={aoSair} title="Sair" aria-label="Sair">
            <Icone nome="sair" tamanho={18} />
          </button>
        </span>
      </header>

      <nav className={estilos.nav}>
        {abas.map((aba) => (
          <NavLink
            key={aba.rota}
            to={aba.rota}
            className={({ isActive }) =>
              [estilos.aba, isActive && estilos.abaAtiva].filter(Boolean).join(' ')
            }
          >
            <span className={estilos.abaIcone}>
              <Icone nome={aba.icone} tamanho={19} />
              {Boolean(aba.contagem) && (
                <span className={estilos.bolha} aria-label={`${aba.contagem} pendente(s)`}>
                  {aba.contagem}
                </span>
              )}
            </span>
            {aba.rotulo}
          </NavLink>
        ))}
      </nav>

      <main className={estilos.conteudo}>
        <Outlet />
      </main>
    </div>
  )
}

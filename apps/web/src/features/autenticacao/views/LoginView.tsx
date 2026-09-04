import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alerta, SpinnerCentral } from '../../../shared/ui'
import { CartaoUsuario } from '../components/CartaoUsuario'
import { useLoginCommand } from '../hooks/useLoginCommand'
import { useUsuariosSeedQuery } from '../hooks/useUsuariosSeedQuery'
import estilos from '../login.module.css'

export function LoginView() {
  const { dados: usuarios, carregando, erro } = useUsuariosSeedQuery()
  const { executar: entrar, enviando, erro: erroLogin } = useLoginCommand()
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const navegar = useNavigate()

  async function selecionar(apelido: string) {
    setEscolhido(apelido)
    const resultado = await entrar(apelido)

    if (resultado.ok) navegar('/apostas', { replace: true })
    else setEscolhido(null)
  }

  return (
    <div className={estilos.tela}>
      <div className={estilos.painel}>
        <div className={estilos.marca}>
          <span className={estilos.logo}>?</span>
          <h1 className={estilos.titulo}>Eu Duvido!</h1>
          <p className={estilos.subtitulo}>
            Apostas entre amigos, decididas pelo grupo — e pagas em CP.
          </p>
        </div>

        {erro && <Alerta>{erro}</Alerta>}
        {erroLogin && <Alerta>{erroLogin}</Alerta>}

        {carregando ? (
          <SpinnerCentral />
        ) : (
          <div className={estilos.lista}>
            <span className={estilos.rotuloLista}>Entrar como</span>
            {usuarios?.map((usuario) => (
              <CartaoUsuario
                key={usuario.idUsuario}
                usuario={usuario}
                entrando={enviando && escolhido === usuario.apelido}
                desabilitado={enviando}
                aoSelecionar={selecionar}
              />
            ))}
          </div>
        )}

        <p className={estilos.rodape}>
          Login de desenvolvimento. O acesso por Google entra quando <code>Auth:Provider</code>{' '}
          virar <code>Google</code>.
        </p>
      </div>
    </div>
  )
}

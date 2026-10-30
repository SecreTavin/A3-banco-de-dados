import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alerta, Botao, Campo, Card, SpinnerCentral } from '../../../shared/ui'
import { CartaoUsuario } from '../components/CartaoUsuario'
import { useCadastroCommand } from '../hooks/useCadastroCommand'
import { useLoginCommand } from '../hooks/useLoginCommand'
import { useUsuariosSeedQuery } from '../hooks/useUsuariosSeedQuery'
import estilos from '../login.module.css'

/** `<input type="date">` compara com a data local, não com UTC. */
function hojeLocal() {
  const agora = new Date()
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export function LoginView() {
  const { dados: usuarios, carregando, erro } = useUsuariosSeedQuery()
  const { executar: entrar, enviando, erro: erroLogin } = useLoginCommand()
  const cadastro = useCadastroCommand()
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const navegar = useNavigate()

  const [cadastrando, setCadastrando] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [apelido, setApelido] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')

  async function selecionar(apelidoEscolhido: string) {
    setEscolhido(apelidoEscolhido)
    const resultado = await entrar(apelidoEscolhido)

    if (resultado.ok) navegar('/desafios', { replace: true })
    else setEscolhido(null)
  }

  async function submeterCadastro(evento: FormEvent) {
    evento.preventDefault()
    const resultado = await cadastro.executar({
      nome: nome.trim(),
      email: email.trim(),
      apelido: apelido.trim(),
      dataNascimento,
    })

    if (resultado.ok) navegar('/desafios', { replace: true })
  }

  function fecharCadastro() {
    setCadastrando(false)
    cadastro.limparErro()
  }

  return (
    <div className={estilos.tela}>
      <div className={estilos.painel}>
        <div className={estilos.marca}>
          <span className={estilos.logo}>?</span>
          <h1 className={estilos.titulo}>Eu Duvido!</h1>
          <p className={estilos.subtitulo}>
            Desafios entre amigos, decididas pelo grupo — e pagas em CP.
          </p>
        </div>

        <div className={[estilos.entrada, cadastrando && estilos.entradaCadastrando].filter(Boolean).join(' ')}>
        {erro && <Alerta>{erro}</Alerta>}
        {erroLogin && <Alerta>{erroLogin}</Alerta>}

        {carregando ? (
          <SpinnerCentral />
        ) : (
          <div
            className={[estilos.lista, (usuarios?.length ?? 0) > 9 && estilos.listaCompacta]
              .filter(Boolean)
              .join(' ')}
          >
            <span className={estilos.rotuloLista}>Entrar como</span>
            {usuarios?.map((usuario) => (
              <CartaoUsuario
                key={usuario.idUsuario}
                usuario={usuario}
                entrando={enviando && escolhido === usuario.apelido}
                desabilitado={enviando || cadastro.enviando}
                aoSelecionar={selecionar}
              />
            ))}
          </div>
        )}

        {cadastrando ? (
          <Card className={estilos.cadastro}>
            <form className={estilos.formulario} onSubmit={submeterCadastro}>
              <span className={estilos.rotuloLista}>Criar conta</span>

              <Campo rotulo="Nome">
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={100}
                  autoComplete="name"
                  required
                />
              </Campo>

              <Campo rotulo="E-mail" dica="É por ele que um admin te adiciona a um grupo.">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={120}
                  autoComplete="email"
                  required
                />
              </Campo>

              <Campo rotulo="Apelido" dica="É como o grupo vai te ver.">
                <input
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  maxLength={50}
                  required
                />
              </Campo>

              <Campo rotulo="Data de nascimento" dica="É preciso ter 16 anos ou mais.">
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  max={hojeLocal()}
                  required
                />
              </Campo>

              {cadastro.erro && <Alerta>{cadastro.erro}</Alerta>}

              <div className={estilos.formularioBotoes}>
                <Botao type="submit" carregando={cadastro.enviando} disabled={enviando}>
                  Criar e entrar
                </Botao>
                <Botao type="button" variante="fantasma" onClick={fecharCadastro}>
                  Cancelar
                </Botao>
              </div>
            </form>
          </Card>
        ) : (
          <Botao
            variante="secundaria"
            bloco
            className={estilos.criarConta}
            onClick={() => setCadastrando(true)}
          >
            Criar conta de teste
          </Botao>
        )}

        <p className={estilos.rodape}>
          Login de desenvolvimento. O acesso por Google entra quando <code>Auth:Provider</code>{' '}
          virar <code>Google</code>.
        </p>
        </div>
      </div>
    </div>
  )
}

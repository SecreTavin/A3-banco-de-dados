import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { RespostaEntrada } from '../../../shared/api/tipos'
import { desenharBotaoGoogle } from '../../../shared/auth/google'
import { Alerta, Avatar, Botao, Campo, Card, SpinnerCentral } from '../../../shared/ui'
import { useCadastroCommand } from '../hooks/useCadastroCommand'
import { useConfiguracaoAuthQuery } from '../hooks/useConfiguracaoAuthQuery'
import { useLoginGoogleCommand } from '../hooks/useLoginGoogleCommand'
import estilos from '../login.module.css'

/** `<input type="date">` compara com a data local, não com UTC. */
function hojeLocal() {
  const agora = new Date()
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

/** O acesso é só pelo Google (RN05, ADR 0021). Quem entra pela primeira vez completa o cadastro. */
export function LoginView() {
  const config = useConfiguracaoAuthQuery()
  const login = useLoginGoogleCommand()
  const cadastro = useCadastroCommand()
  const navegar = useNavigate()

  const lugarDoBotao = useRef<HTMLDivElement>(null)
  const [erroGoogle, setErroGoogle] = useState<string | null>(null)
  const [pendente, setPendente] = useState<RespostaEntrada | null>(null)
  const [apelido, setApelido] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')

  const clientId = config.dados?.googleClientId ?? null

  // O executar do login muda a cada render; a ref evita redesenhar o botão por isso.
  const entrarRef = useRef(login.executar)
  entrarRef.current = login.executar

  useEffect(() => {
    if (!clientId || pendente || !lugarDoBotao.current) return
    let ativo = true
    desenharBotaoGoogle(lugarDoBotao.current, clientId, async (credencial) => {
      const resultado = await entrarRef.current(credencial)
      if (!ativo || !resultado.ok) return
      if (resultado.dados.cadastroPendente) {
        setPendente(resultado.dados)
        setApelido(resultado.dados.nome?.split(' ')[0] ?? '')
      } else {
        navegar('/desafios', { replace: true })
      }
    }).catch((falha: Error) => ativo && setErroGoogle(falha.message))
    return () => {
      ativo = false
    }
  }, [clientId, pendente, navegar])

  async function completarCadastro(evento: FormEvent) {
    evento.preventDefault()
    if (!pendente?.tokenCadastro) return
    const resultado = await cadastro.executar({
      tokenCadastro: pendente.tokenCadastro,
      apelido: apelido.trim(),
      dataNascimento,
    })
    if (resultado.ok) navegar('/desafios', { replace: true })
    // Token de cadastro vencido: volta ao botão do Google.
    else if (resultado.status === 401) setPendente(null)
  }

  function voltar() {
    setPendente(null)
    cadastro.limparErro()
  }

  return (
    <div className={estilos.tela}>
      <div className={estilos.painel}>
        <div className={estilos.marca}>
          <span className={estilos.logo} aria-hidden="true">
            ?<em>!</em>
          </span>
          <h1 className={estilos.titulo}>Eu Duvido!</h1>
          <p className={estilos.subtitulo}>Desafios entre amigos, decididos pelo grupo e pagos em CP.</p>
        </div>

        <div className={estilos.entrada}>
          {config.erro && <Alerta>{config.erro}</Alerta>}
          {erroGoogle && <Alerta>{erroGoogle}</Alerta>}
          {login.erro && <Alerta>{login.erro}</Alerta>}

          {pendente ? (
            <Card className={estilos.cadastro}>
              <form className={estilos.formulario} onSubmit={completarCadastro}>
                <span className={estilos.rotuloLista}>Complete seu cadastro</span>

                <div className={estilos.perfilGoogle}>
                  <Avatar apelido={pendente.nome ?? '?'} url={pendente.avatarUrl} grande />
                  <span className={estilos.perfilTextos}>
                    <span className={estilos.perfilNome}>{pendente.nome}</span>
                    <span className={estilos.perfilEmail}>{pendente.email}</span>
                  </span>
                </div>

                <Campo rotulo="Apelido" dica="É como o grupo vai te ver. Pode repetir o de outra pessoa.">
                  <input value={apelido} onChange={(e) => setApelido(e.target.value)} maxLength={50} required />
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
                  <Botao type="submit" carregando={cadastro.enviando}>
                    Criar conta e entrar
                  </Botao>
                  <Botao type="button" variante="fantasma" onClick={voltar}>
                    Voltar
                  </Botao>
                </div>
              </form>
            </Card>
          ) : config.carregando ? (
            <SpinnerCentral />
          ) : clientId ? (
            <div className={estilos.google}>
              <span className={estilos.rotuloLista}>Entrar</span>
              <div ref={lugarDoBotao} className={estilos.botaoGoogle} aria-label="Entrar com Google" />
              {login.enviando && <SpinnerCentral />}
            </div>
          ) : (
            !config.erro && <Alerta>O login com Google ainda não foi configurado neste servidor.</Alerta>
          )}

          <p className={estilos.rodape}>
            Sua identidade vem do Google: o Eu Duvido! não guarda senha.
          </p>
        </div>
      </div>
    </div>
  )
}

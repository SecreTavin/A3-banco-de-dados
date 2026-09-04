import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alerta, Botao, CabecalhoPagina, Campo, Card, EstadoVazio, SpinnerCentral } from '../../../shared/ui'
import { CardGrupo } from '../components/CardGrupo'
import { useCriarGrupoCommand } from '../hooks/useCriarGrupoCommand'
import { useEntrarPorCodigoCommand } from '../hooks/useEntrarPorCodigoCommand'
import { useGruposQuery } from '../hooks/useGruposQuery'
import estilos from '../grupos.module.css'

type Painel = 'nenhum' | 'criar' | 'entrar'

export function GruposView() {
  const { dados: grupos, carregando, erro, recarregar } = useGruposQuery()
  const criar = useCriarGrupoCommand()
  const entrar = useEntrarPorCodigoCommand()

  const [painel, setPainel] = useState<Painel>('nenhum')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [codigo, setCodigo] = useState('')

  function alternar(alvo: Painel) {
    setPainel((atual) => (atual === alvo ? 'nenhum' : alvo))
    criar.limparErro()
    entrar.limparErro()
  }

  async function submeterCriacao(evento: FormEvent) {
    evento.preventDefault()
    const resultado = await criar.executar({ nome: nome.trim(), descricao: descricao.trim() })
    if (!resultado.ok) return

    setNome('')
    setDescricao('')
    setPainel('nenhum')
    recarregar()
  }

  async function submeterEntrada(evento: FormEvent) {
    evento.preventDefault()
    const resultado = await entrar.executar(codigo)
    if (!resultado.ok) return

    setCodigo('')
    setPainel('nenhum')
    recarregar()
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Meus grupos"
        descricao="Cada grupo tem seu próprio saldo de CP e seu próprio histórico."
      />

      <div className={estilos.acoes}>
        <Botao variante={painel === 'criar' ? 'secundaria' : 'primaria'} onClick={() => alternar('criar')}>
          Criar grupo
        </Botao>
        <Botao variante="secundaria" onClick={() => alternar('entrar')}>
          Entrar com código
        </Botao>
      </div>

      {painel === 'criar' && (
        <Card className={estilos.formularioCartao}>
          <form className={estilos.formulario} onSubmit={submeterCriacao}>
            <Campo rotulo="Nome do grupo">
              <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required />
            </Campo>
            <Campo rotulo="Descrição" dica="Opcional — ajuda quem entra pelo convite a se situar.">
              <input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={200} />
            </Campo>
            {criar.erro && <Alerta>{criar.erro}</Alerta>}
            <div className={estilos.formularioBotoes}>
              <Botao type="submit" carregando={criar.enviando}>
                Criar
              </Botao>
              <Botao type="button" variante="fantasma" onClick={() => setPainel('nenhum')}>
                Cancelar
              </Botao>
            </div>
          </form>
        </Card>
      )}

      {painel === 'entrar' && (
        <Card className={estilos.formularioCartao}>
          <form className={estilos.formulario} onSubmit={submeterEntrada}>
            <Campo rotulo="Código do convite" dica="Seis caracteres, uso único.">
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                maxLength={6}
                required
              />
            </Campo>
            {entrar.erro && <Alerta>{entrar.erro}</Alerta>}
            <div className={estilos.formularioBotoes}>
              <Botao type="submit" carregando={entrar.enviando}>
                Entrar
              </Botao>
              <Botao type="button" variante="fantasma" onClick={() => setPainel('nenhum')}>
                Cancelar
              </Botao>
            </div>
          </form>
        </Card>
      )}

      {erro && <Alerta>{erro}</Alerta>}

      {carregando ? (
        <SpinnerCentral />
      ) : grupos && grupos.length > 0 ? (
        <div className={estilos.lista}>
          {grupos.map((grupo) => (
            <CardGrupo key={grupo.idGrupo} grupo={grupo} />
          ))}
        </div>
      ) : (
        !erro && (
          <EstadoVazio
            titulo="Você ainda não está em nenhum grupo"
            descricao="Crie o seu ou entre com o código que alguém te passou."
          />
        )
      )}
    </>
  )
}

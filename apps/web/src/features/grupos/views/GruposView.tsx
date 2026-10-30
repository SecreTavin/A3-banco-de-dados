import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alerta, Botao, CabecalhoPagina, Campo, Card, EstadoVazio, SpinnerCentral } from '../../../shared/ui'
import { NIVEIS_FILTRO, descricaoNivelFiltro, rotuloNivelFiltro } from '../../../shared/ui/status'
import type { NivelFiltro } from '../../../shared/api/tipos'
import { CardGrupo } from '../components/CardGrupo'
import { useCriarGrupoCommand } from '../hooks/useCriarGrupoCommand'
import { useGruposQuery } from '../hooks/useGruposQuery'
import estilos from '../grupos.module.css'

export function GruposView() {
  const { dados: grupos, carregando, erro, recarregar } = useGruposQuery()
  const criar = useCriarGrupoCommand()

  const [criando, setCriando] = useState(false)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [nivelFiltro, setNivelFiltro] = useState<NivelFiltro>('MODERADO')

  function alternar() {
    setCriando((atual) => !atual)
    criar.limparErro()
  }

  async function submeterCriacao(evento: FormEvent) {
    evento.preventDefault()
    const resultado = await criar.executar({
      nome: nome.trim(),
      descricao: descricao.trim(),
      nivelFiltro,
    })
    if (!resultado.ok) return

    setNome('')
    setDescricao('')
    setNivelFiltro('MODERADO')
    setCriando(false)
    recarregar()
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Meus grupos"
        descricao="Cada grupo tem seu próprio saldo de CP e seu próprio histórico."
        acao={
          <Botao
            variante={criando ? 'secundaria' : 'primaria'}
            className={estilos.botaoCriarGrupo}
            onClick={alternar}
          >
            Criar grupo
          </Botao>
        }
      />

      {erro && <Alerta>{erro}</Alerta>}

      <div className={estilos.corpoGrupos}>
      {/* No desktop o formulário fica sempre à direita; no celular só aparece ao clicar em "Criar grupo". */}
      <Card
        className={[estilos.formularioCartao, estilos.criarGrupo, criando && estilos.criarAberto]
          .filter(Boolean)
          .join(' ')}
      >
          <form className={estilos.formulario} onSubmit={submeterCriacao}>
            <Campo rotulo="Nome do grupo">
              <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required />
            </Campo>
            <Campo rotulo="Descrição" dica="Opcional — ajuda quem for adicionado a se situar.">
              <input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={200} />
            </Campo>
            <Campo rotulo="Moderação de IA" dica={descricaoNivelFiltro[nivelFiltro]}>
              <select
                value={nivelFiltro}
                onChange={(e) => setNivelFiltro(e.target.value as NivelFiltro)}
              >
                {NIVEIS_FILTRO.map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {rotuloNivelFiltro[nivel]}
                  </option>
                ))}
              </select>
            </Campo>
            {criar.erro && <Alerta>{criar.erro}</Alerta>}
            <div className={estilos.formularioBotoes}>
              <Botao type="submit" carregando={criar.enviando}>
                Criar
              </Botao>
              <Botao
                type="button"
                variante="fantasma"
                className={estilos.cancelarCriacao}
                onClick={() => setCriando(false)}
              >
                Cancelar
              </Botao>
            </div>
          </form>
      </Card>

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
            descricao="Crie o seu ou peça para o admin de um grupo te adicionar pelo seu e-mail."
          />
        )
      )}
      </div>
    </>
  )
}

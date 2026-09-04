import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Alerta, CabecalhoPagina, EstadoVazio, LinkVoltar, Secao, SpinnerCentral } from '../../../shared/ui'
import type { Convite } from '../../../shared/api/tipos'
import { LinhaMembro } from '../components/LinhaMembro'
import { PainelConvite } from '../components/PainelConvite'
import { useGerarConviteCommand } from '../hooks/useGerarConviteCommand'
import { useGrupoQuery } from '../hooks/useGrupoQuery'
import estilos from '../grupos.module.css'

export function DetalheGrupoView() {
  const { id } = useParams()
  const idGrupo = Number(id)
  const { dados: grupo, carregando, erro } = useGrupoQuery(idGrupo)
  const gerarConvite = useGerarConviteCommand(idGrupo)
  const [convite, setConvite] = useState<Convite | null>(null)

  async function gerar() {
    const resultado = await gerarConvite.executar()
    if (resultado.ok) setConvite(resultado.dados)
  }

  if (carregando) return <SpinnerCentral />
  if (erro) return <Alerta>{erro}</Alerta>
  if (!grupo) return <EstadoVazio titulo="Grupo não encontrado" />

  return (
    <>
      <LinkVoltar para="/grupos" rotulo="Meus grupos" />
      <CabecalhoPagina titulo={grupo.nome} descricao={grupo.descricao ?? undefined} />

      <Secao titulo="Convite">
        <PainelConvite convite={convite} gerando={gerarConvite.enviando} aoGerar={gerar} />
        {gerarConvite.erro && <Alerta>{gerarConvite.erro}</Alerta>}
      </Secao>

      <Secao titulo="Membros" contagem={grupo.membros.length}>
        <ul className={estilos.membros}>
          {grupo.membros.map((membro) => (
            <LinhaMembro key={membro.idUsuario} membro={membro} />
          ))}
        </ul>
      </Secao>
    </>
  )
}

import { useNavigate } from 'react-router-dom'
import {
  Alerta,
  Avatar,
  Botao,
  CabecalhoPagina,
  Card,
  EstadoVazio,
  Secao,
  SpinnerCentral,
} from '../../../shared/ui'
import { formatarDataCompleta } from '../../../shared/ui/formato'
import { LinhaExtrato } from '../components/LinhaExtrato'
import { SaldoNoGrupo } from '../components/SaldoNoGrupo'
import { usePerfilQuery } from '../hooks/usePerfilQuery'
import estilos from '../perfil.module.css'

export function PerfilView() {
  const { dados: perfil, carregando, erro } = usePerfilQuery()
  const navegar = useNavigate()

  if (carregando) return <SpinnerCentral />
  if (erro) return <Alerta>{erro}</Alerta>
  if (!perfil) return <EstadoVazio titulo="Perfil indisponível" />

  const { usuario, saldos, extrato, historico } = perfil

  return (
    <>
      <div className={estilos.tituloPagina}>
        <CabecalhoPagina titulo="Perfil" />
      </div>

      <div className={estilos.corpoPerfil}>
      <div className={estilos.colunaResumo}>
      <Card className={estilos.identidade}>
        <Avatar apelido={usuario.apelido} url={usuario.avatarUrl} grande />
        <div className={estilos.identidadeTextos}>
          <h1 className={estilos.nome}>{usuario.nome}</h1>
          <span className={estilos.apelido}>@{usuario.apelido}</span>
          <span className={estilos.contato}>{usuario.email}</span>
          <span className={estilos.contato}>
            No app desde {formatarDataCompleta(usuario.dataCadastro)}
          </span>
        </div>
      </Card>

      <Secao titulo="Histórico">
        <div className={estilos.numeros}>
          <Card className={estilos.numero}>
            <span className={estilos.numeroValor}>{historico.desafiosCriadas}</span>
            <span className={estilos.numeroRotulo}>desafios criados</span>
          </Card>
          <Card className={estilos.numero}>
            <span className={estilos.numeroValor}>{historico.participacoes}</span>
            <span className={estilos.numeroRotulo}>participações</span>
          </Card>
          <Card className={estilos.numero}>
            <span className={estilos.numeroValor}>{historico.evidenciasEnviadas}</span>
            <span className={estilos.numeroRotulo}>evidências enviadas</span>
          </Card>
        </div>
      </Secao>

      <Secao titulo="Seu CP em cada grupo" contagem={saldos.length}>
        {saldos.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum grupo ainda"
            acao={<Botao onClick={() => navegar('/grupos')}>Entrar em um grupo</Botao>}
          />
        ) : (
          <ul className={estilos.saldos}>
            {saldos.map((saldo) => (
              <SaldoNoGrupo key={saldo.idGrupo} saldo={saldo} apelido={usuario.apelido} />
            ))}
          </ul>
        )}
      </Secao>

      </div>

      <Secao titulo="Extrato de CP" contagem={extrato.length} className={estilos.areaExtrato}>
        {extrato.length === 0 ? (
          <EstadoVazio
            titulo="Sem movimentações"
            descricao="Aceitar um desafio ou votar numa evidência já mexe no seu saldo."
          />
        ) : (
          <ul className={estilos.extrato}>
            {extrato.map((lancamento, indice) => (
              <LinhaExtrato key={`${lancamento.data}-${indice}`} lancamento={lancamento} />
            ))}
          </ul>
        )}
      </Secao>
      </div>
    </>
  )
}

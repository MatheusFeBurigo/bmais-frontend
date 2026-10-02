// Aviso de versão nova no topo do Painel Operacional. Sem botão de fechar: a
// versão velha é a que o usuário não pode continuar usando, então o aviso fica
// até ele recarregar.
import { Alerta, alertaStyles } from './Alerta'
import { useNovaVersao } from '../lib/versaoApp'

export default function AvisoNovaVersao() {
  const nova = useNovaVersao()
  if (!nova) return null
  return (
    <div style={{ marginBottom: 12 }}>
      <style>{alertaStyles}</style>
      <Alerta
        nivel="atencao"
        acao={
          <button type="button" className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>
            Atualizar agora
          </button>
        }
      >
        <strong>Nova versão do sistema disponível.</strong> Atualize para carregar as melhorias.
      </Alerta>
    </div>
  )
}

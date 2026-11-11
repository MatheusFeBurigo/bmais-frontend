// Aviso de versão nova, em TODAS as telas (11/11/2026; antes só no Painel
// Operacional). Montado no AppLayout (área interna), no portal de médico e
// enfermeiro e no login. Sem botão de fechar: a versão velha é a que o usuário
// não pode continuar usando, então o aviso fica até ele recarregar. Não sai na
// impressão: a folha impressa não é lugar de aviso de sistema.
import type { CSSProperties } from 'react'
import { Alerta, alertaStyles } from './Alerta'
import { useNovaVersao } from '../lib/versaoApp'

const estilos = `${alertaStyles}
@media print{.aviso-versao{display:none!important}}
`

export default function AvisoNovaVersao({ style }: { style?: CSSProperties }) {
  const nova = useNovaVersao()
  if (!nova) return null
  return (
    <div className="aviso-versao" role="status" style={{ marginBottom: 12, ...style }}>
      <style>{estilos}</style>
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

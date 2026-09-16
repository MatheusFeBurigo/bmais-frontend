// Envio de censos: escolher o hospital, mandar os arquivos, conferir o que entrou.
//
// A página é só o orquestrador — estado do envio e as chamadas ao backend. O que
// se vê mora em `components/upload/`: o formulário dos três passos, o resultado do
// lote (placar + um cartão por arquivo) e o assistente que completa o que faltou.

import { useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { invalidarPorEvento } from '../lib/invalidation'
import { ehSomenteLeitura } from '../auth/permissions'
import { useAuth } from '../auth/AuthContext'
import { enviarCensos, reverterEnvioCenso } from '../services/censos.service'
import type { HospitalManual, Operadora, PendenteCenso, UploadCensoResponse, UploadCensoResult } from '../types/api'
import { usePageHeader } from '../components/PageHeader'
import Toast from '../components/Toast'
import WizardComplemento from '../components/upload/WizardComplemento'
import { ConfirmarModal } from '../components/ConfirmarModal'
import { FormularioEnvio, formularioStyles } from '../components/upload/FormularioEnvio'
import { ResultadoEnvio, estilosResultado } from '../components/upload/ResultadoEnvio'
import { plural } from '../components/upload/comuns'
import { useTodosHospitais } from '../hooks/useEquipe'
import { useSidebar } from '../hooks/useDashboard'

// Estilos específicos da tela, reunidos dos componentes que a compõem (o projeto
// injeta CSS por <style> na própria tela, não por arquivo .css importado).
const localStyles = [formularioStyles, estilosResultado].join('\n')

// Todos os pendentes de um conjunto de resultados (o backend carimba o arquivo em cada um).
function coletarPendentes(resultados: UploadCensoResult[]): PendenteCenso[] {
  return resultados.flatMap((r) => r.pendentes_detalhe ?? [])
}

export default function Upload() {
  const qc = useQueryClient()
  // Todo upload muda os dados de origem — o evento de domínio "dadosAlterados"
  // invalida (centralizadamente) os caches derivados: Dashboard/Diretoria/Gestor/
  // Sidebar/Kanban refazem o fetch ao serem abertos, sem esperar o staleTime.
  function invalidarDados() {
    invalidarPorEvento(qc, 'dadosAlterados')
  }

  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<UploadCensoResponse | null>(null)
  // Pacientes que o sistema leu mas não conseguiu completar e ainda não foram gravados.
  // Cada um já é uma pendência no Kanban — o que ficar sem completar continua lá.
  const [pendentes, setPendentes] = useState<PendenteCenso[]>([])
  // O assistente abre sozinho quando há algo a resolver; pode ser reaberto.
  const [wizardAberto, setWizardAberto] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  // Arquivos que o usuário mandou ignorar (só na tela): o PDF ilegível sai da lista
  // e do placar. Nada é gravado — não há o que gravar, o arquivo não foi lido.
  const [ignorados, setIgnorados] = useState<string[]>([])
  // Hospital do LOTE, escolhido antes de anexar os arquivos. É o 1º passo do envio:
  // com ele o sistema já lê cada PDF sabendo a origem (usando o leitor próprio
  // daquele hospital quando existe) em vez de perguntar depois.
  // Operadora primeiro, hospital depois. O cadastro tem uma linha por
  // hospital×operadora (385 linhas para 219 hospitais distintos), então uma lista
  // única repetiria o mesmo nome até 4x, sem nada que os diferenciasse na tela.
  // Filtrar pela operadora resolve na origem: cada nome aparece uma vez só.
  const [operadora, setOperadora] = useState('')
  const [hospital, setHospital] = useState('')
  // Desfazer: sessão em processo de reversão (trava o botão) e envios recentes.
  const [revertendo, setRevertendo] = useState<string | null>(null)
  // Envio aguardando confirmação para ser desfeito (null = modal fechada). Guarda
  // o que a modal mostra, para o texto citar o hospital e a quantidade.
  const [confirmarDesfazer, setConfirmarDesfazer] = useState<
    { sessao: string; quantos: number; hospital?: string | null
      /** Presente = desfazer só este arquivo do lote. */
      arquivo?: string } | null>(null)
  // Perfil de observação (analista interno): a lista de conferência é só leitura,
  // sem o lápis de editar. O backend recusaria de qualquer forma (`requer_escrita`),
  // mas oferecer um botão que dá erro é pior que não oferecer.
  const { role } = useAuth()
  const somenteLeitura = ehSomenteLeitura(role)
  // Apagar paciente é destrutivo e a rota exige admin (política do projeto:
  // operacional=acesso, gerencial=diretor, destrutivo=admin). O gestor edita,
  // mas não apaga — mostrar a lixeira a ele daria 403 no clique.
  const podeExcluir = role === 'admin'
  const hospitaisQ = useTodosHospitais()
  const sidebarQ = useSidebar()

  const operadoras = useMemo<Operadora[]>(() => {
    const daSidebar = sidebarQ.data?.operadoras ?? []
    if (daSidebar.length) return daSidebar
    // Fallback: deriva do próprio cadastro de hospitais enquanto a sidebar carrega.
    const vistas = new Map<string, string>()
    for (const h of hospitaisQ.data ?? []) {
      if (h.operadora_key && !vistas.has(h.operadora_key)) {
        vistas.set(h.operadora_key, h.operadora_nome || h.operadora_key)
      }
    }
    return [...vistas.entries()].map(([key, nome]) => ({ key, nome }))
  }, [sidebarQ.data, hospitaisQ.data])

  // Hospitais da operadora escolhida, sem nomes repetidos.
  const hospitaisDaOperadora = useMemo(() => {
    if (!operadora) return []
    return (hospitaisQ.data ?? []).filter((h) => h.operadora_key === operadora)
  }, [hospitaisQ.data, operadora])

  const hospitalEscolhido = hospitaisDaOperadora.find((h) => h.key === hospital) ?? null

  // Trocar de operadora invalida o hospital anterior (era de outra operadora).
  function trocarOperadora(nova: string) {
    setOperadora(nova)
    setHospital('')
  }

  // Arquivos ignorados saem de tudo o que a tela mostra — inclusive do placar,
  // senão o "1 com erro" continuaria contando o que o usuário mandou tirar.
  const visiveis = (result?.resultados ?? []).filter((r) => !ignorados.includes(r.arquivo))
  // Arquivos lidos cujo hospital não está no cadastro (o assistente pede o hospital).
  const semHospital = visiveis.filter((r) => r.precisa_hospital)
  // Pacientes que ESTE envio criou — exatamente o que o desfazer apaga. Não é o
  // total gravado: quem já existia e foi só atualizado não é removido.
  const gravados = visiveis.reduce((n, r) => n + (r.criados ?? 0), 0)
  // Pacientes que JÁ existiam e foram atualizados por este envio. O desfazer não os
  // toca (não há valor anterior guardado), então a tela precisa avisar: se o envio
  // foi no hospital errado, esses registros ficaram com dados de outro censo.
  const atualizados = visiveis.reduce((n, r) => n + (r.atualizados?.length ?? 0), 0)
  const aResolver = pendentes.length + semHospital.length

  async function processar(e: React.FormEvent) {
    e.preventDefault()
    if (!files.length) return
    setBusy(true)
    try {
      // O hospital do lote vale para TODOS os arquivos deste envio. O backend usa a
      // key para escolher o leitor e carimbar o resultado.
      const hospitais: Record<string, HospitalManual> = {}
      for (const f of files) hospitais[f.name] = { key: hospital }
      const data = await enviarCensos(files, hospitais)
      const pend = coletarPendentes(data.resultados ?? [])
      const faltaHosp = (data.resultados ?? []).filter((r) => r.precisa_hospital).length
      const scans = (data.resultados ?? []).filter((r) => r.erro_tipo === 'imagem').length
      setResult(data)
      setPendentes(pend)
      setWizardAberto(pend.length + faltaHosp > 0)
      setFiles([])
      setIgnorados([])
      invalidarDados()
      const partes: string[] = []
      if (faltaHosp) partes.push(`${faltaHosp} ${plural(faltaHosp, 'arquivo')} sem hospital`)
      // O digitalizado entra no toast porque é o único caso cuja saída está FORA
      // desta tela: os pacientes vão ter de ser cadastrados na Visão Geral, e
      // quem envia precisa sair daqui sabendo disso.
      if (scans) {
        partes.push(`${scans} ${plural(scans, 'arquivo')} ${plural(scans, 'digitalizado')}`
          + ': cadastrar à mão')
      }
      if (pend.length) partes.push(`${pend.length} ${plural(pend.length, 'paciente')} para completar`)
      setToast(partes.length ? `Censos lidos: ${partes.join(' · ')}` : 'Censos processados')
    } catch (err) {
      setToast(`Erro: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  // Desfazer um envio: apaga os pacientes que ELE criou. É o conserto do erro mais
  // comum — mandar o censo no hospital errado. Passa pela modal de confirmação:
  // apagar paciente é irreversível.
  async function desfazer(sessao: string, arquivo?: string) {
    setConfirmarDesfazer(null)
    setRevertendo(arquivo ?? sessao)
    try {
      const r = await reverterEnvioCenso(sessao, arquivo)
      invalidarDados()
      if (result?.sessao === sessao) {
        if (arquivo) {
          // Só o arquivo desfeito sai da tela; os outros continuam, com o
          // resultado que têm. Limpar tudo faria o usuário perder de vista o
          // que deu certo no mesmo envio.
          setResult((atual) => atual
            ? { ...atual, resultados: atual.resultados.filter((x) => x.arquivo !== arquivo) }
            : atual)
          setPendentes((lista) => lista.filter((x) => x.arquivo !== arquivo))
        } else {
          setResult(null)
          setPendentes([])
        }
      }
      setToast(`${arquivo ? 'Arquivo' : 'Envio'} desfeito: ${r.removidos} ${plural(r.removidos, 'paciente')} ${plural(r.removidos, 'removido')}`)
    } catch (err) {
      setToast(`Erro ao desfazer: ${(err as Error).message}`)
    } finally {
      setRevertendo(null)
    }
  }

  // Arquivo reprocessado pelo assistente com o hospital informado: substitui o
  // resultado daquele arquivo e soma os pendentes que ele trouxe.
  function onArquivoProcessado(res: UploadCensoResult) {
    setResult((atual) => atual
      ? { ...atual, resultados: atual.resultados.map((r) => (r.arquivo === res.arquivo ? res : r)) }
      : atual)
    setPendentes((lista) => [...lista, ...(res.pendentes_detalhe ?? [])])
    invalidarDados()
    setToast(`${res.arquivo}: ${res.total ?? 0} ${plural(res.total ?? 0, 'paciente')} ${plural(res.total ?? 0, 'gravado')}`)
  }

  function onSalvo(id: number, nome: string, situacao?: 'INTERNADO' | 'ALTA') {
    setPendentes((lista) => lista.filter((p) => p.pendencia_id !== id))
    // O paciente entrou agora: soma no placar do arquivo de origem, na coluna certa.
    // Sem isto os números do resumo ficavam no valor do processamento inicial e não
    // refletiam o que o próprio usuário acabou de completar.
    setResult((atual) => {
      if (!atual) return atual
      const pendente = pendentes.find((p) => p.pendencia_id === id)
      const alvo = pendente?.arquivo
      if (!alvo) return atual
      return {
        ...atual,
        resultados: atual.resultados.map((r) => (r.arquivo !== alvo ? r : {
          ...r,
          total: (r.total ?? 0) + 1,
          criados: (r.criados ?? 0) + 1,
          altas: (r.altas ?? 0) + (situacao === 'ALTA' ? 1 : 0),
          internados: (r.internados ?? 0) + (situacao === 'ALTA' ? 0 : 1),
          pendentes: Math.max(0, (r.pendentes ?? 0) - 1),
          // Entra também na lista de nomes: quem completou espera vê-lo ali junto
          // dos demais, e não só o contador subir.
          gravados_detalhe: [
            ...(r.gravados_detalhe ?? []),
            {
              nome: nome || pendente?.nome || null,
              atendimento: pendente?.atendimento ?? null,
              situacao: situacao === 'ALTA' ? 'ALTA' : 'INTERNADO',
              leito_codigo: pendente?.leito_codigo ?? null,
              // O convênio vem junto: a lista de conferência tem coluna para ele,
              // e sem isto o paciente que o usuário acabou de completar aparecia
              // com um "—" no meio dos vizinhos do mesmo arquivo, como se o censo
              // não tivesse trazido o dado. `senha` não existe em PendenteCenso,
              // então quem foi completado à mão se identifica pelo nome digitado.
              convenio: pendente?.convenio ?? null,
              data_entrada: pendente?.data_entrada ?? null,
              data_alta: pendente?.data_alta ?? null,
            },
          ],
        })),
      }
    })
    invalidarDados()
    setToast(`${nome || 'Paciente'} gravado`)
  }

  // Descartado = resolvido sem gravar. Sai da lista de pendentes igual ao gravado:
  // em ambos os casos a decisão já foi tomada e não há mais o que fazer com ele.
  function onDescartado(id: number, nome: string) {
    const pendente = pendentes.find((p) => p.pendencia_id === id)
    setPendentes((lista) => lista.filter((p) => p.pendencia_id !== id))
    // E some do PLACAR do arquivo de origem, como o gravado. O contador
    // `pendentes` é o que mantém o cartão em "aguarda sua decisão" e no topo da
    // lista; sem baixá-lo aqui, o arquivo continuava cobrando uma decisão que o
    // usuário acabou de tomar — descartar é decidir, não adiar.
    //
    // O descartado não entra em `total`/`criados` nem na lista de gravados: ele
    // não foi gravado. O que muda é só a cobrança desaparecer.
    setResult((atual) => {
      const alvo = pendente?.arquivo
      if (!atual || !alvo) return atual
      return {
        ...atual,
        resultados: atual.resultados.map((r) => (r.arquivo !== alvo ? r : {
          ...r,
          pendentes: Math.max(0, (r.pendentes ?? 0) - 1),
        })),
      }
    })
    setToast(`${nome || 'Paciente'} descartado. Não foi gravado`)
  }

  usePageHeader({
    title: 'Envio de Censos',
    subtitle: 'Escolha o hospital e envie os arquivos do censo (PDF, CSV ou Excel).',
  })

  return (
    <>
      <style>{localStyles}</style>
      <div>
        <FormularioEnvio
          operadoras={operadoras}
          hospitaisDaOperadora={hospitaisDaOperadora}
          hospitalEscolhido={hospitalEscolhido}
          carregandoHospitais={hospitaisQ.isLoading}
          operadora={operadora}
          hospital={hospital}
          files={files}
          busy={busy}
          onTrocarOperadora={trocarOperadora}
          onHospital={setHospital}
          onFiles={setFiles}
          onSubmit={processar}
        />

        {result && visiveis.length > 0 && (
          <>
            <div className="section-label">Resultado do processamento</div>
            <ResultadoEnvio
              resultados={visiveis}
              pendentes={pendentes.length}
              semHospital={semHospital.length}
              criados={gravados}
              atualizados={atualizados}
              podeDesfazer={Boolean(result.sessao) && gravados > 0}
              desfazendo={revertendo === result.sessao}
              onCompletar={!wizardAberto && aResolver > 0 ? () => setWizardAberto(true) : undefined}
              onDesfazer={() => setConfirmarDesfazer({
                sessao: result.sessao, quantos: gravados, hospital: hospitalEscolhido?.nome,
              })}
              somenteLeitura={somenteLeitura}
              onDesfazerArquivo={(arquivo) => {
                const r = visiveis.find((x) => x.arquivo === arquivo)
                setConfirmarDesfazer({
                  sessao: result.sessao, arquivo,
                  quantos: r?.criados ?? 0, hospital: hospitalEscolhido?.nome,
                })
              }}
              desfazendoArquivo={revertendo}
              podeExcluir={podeExcluir}
              operadoras={operadoras}
              onIgnorar={(arquivo) => {
                setIgnorados((lista) => [...lista, arquivo])
                setToast(`${arquivo} ignorado`)
              }}
            />
          </>
        )}
      </div>

      {wizardAberto && result && aResolver > 0 && (
        <WizardComplemento
          sessao={result.sessao}
          arquivosSemHospital={semHospital}
          pendentes={pendentes}
          onArquivoProcessado={onArquivoProcessado}
          onSalvo={onSalvo}
          onDescartado={onDescartado}
          onClose={() => setWizardAberto(false)}
        />
      )}

      {confirmarDesfazer && (
        <ConfirmarModal
          titulo={confirmarDesfazer.arquivo ? 'Desfazer este arquivo?' : 'Desfazer este envio?'}
          perigo
          confirmar="Apagar e desfazer"
          cancelar="Manter como está"
          ocupado={revertendo === (confirmarDesfazer.arquivo ?? confirmarDesfazer.sessao)}
          onCancelar={() => setConfirmarDesfazer(null)}
          onConfirmar={() => desfazer(confirmarDesfazer.sessao, confirmarDesfazer.arquivo)}
        >
          <div>
            <strong>{confirmarDesfazer.quantos} {plural(confirmarDesfazer.quantos, 'paciente')}</strong>{' '}
            {plural(confirmarDesfazer.quantos, 'criado')}{' '}
            {confirmarDesfazer.arquivo
              ? <>por <strong>{confirmarDesfazer.arquivo}</strong></>
              : 'por este envio'}
            {confirmarDesfazer.hospital && <> em <strong>{confirmarDesfazer.hospital}</strong></>}{' '}
            {plural(confirmarDesfazer.quantos, 'será', 'serão')}{' '}
            {plural(confirmarDesfazer.quantos, 'apagado')}. Esta ação não pode ser desfeita.
          </div>
          <div>
            Pacientes que já existiam antes e foram apenas atualizados{' '}
            <strong>não são apagados</strong>.
            {confirmarDesfazer.arquivo && ' Os outros arquivos deste envio não são afetados.'}
          </div>
        </ConfirmarModal>
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  )
}

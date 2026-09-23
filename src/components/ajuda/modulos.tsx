// Ícones dos módulos da Ajuda.
//
// Os tipos e a ordem das seções ficam em `tipos.ts`: este arquivo exporta só
// componentes, para o fast refresh continuar funcionando.
import type { ReactNode } from 'react'

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export const IconVisao = () => (
  <Svg><circle cx="12" cy="12" r="9" /><path d="M3.6 9h16.8M3.6 15h16.8" />
    <path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" /></Svg>
)
export const IconPerfis = () => (
  <Svg><path d="M12 21s7.2-3.5 7.2-9V5.6L12 3 4.8 5.6V12c0 5.5 7.2 9 7.2 9Z" />
    <circle cx="12" cy="10.2" r="2" /><path d="M8.6 15.8a3.8 3.8 0 0 1 6.8 0" /></Svg>
)
export const IconPulso = () => (
  <Svg><path d="M3 12h4l2.5-6 4 12L16 12h5" /></Svg>
)
export const IconPaciente = () => (
  <Svg><circle cx="12" cy="8" r="3.6" /><path d="M5 20a7 7 0 0 1 14 0" /></Svg>
)
export const IconQuadro = () => (
  <Svg><rect x="3" y="3" width="6" height="14" rx="1" /><rect x="10" y="3" width="6" height="9" rx="1" />
    <rect x="17" y="3" width="4" height="11" rx="1" /></Svg>
)
export const IconEnvio = () => (
  <Svg><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></Svg>
)
export const IconGrafico = () => (
  <Svg><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20H2" /></Svg>
)
export const IconFluxo = () => (
  <Svg><path d="M3 3v18h18" /><path d="M7 14l4-4 4 4 5-6" /></Svg>
)
export const IconRede = () => (
  <Svg><circle cx="12" cy="5" r="2.2" /><circle cx="5" cy="19" r="2.2" /><circle cx="19" cy="19" r="2.2" />
    <path d="M12 7.2v3.6M11 12.6 6.6 16.8M13 12.6l4.4 4.2" /></Svg>
)
export const IconCracha = () => (
  <Svg><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M9 3h6v2.5H9z" />
    <circle cx="12" cy="11.6" r="2" /><path d="M8.6 16.8a3.7 3.7 0 0 1 6.8 0" /></Svg>
)
export const IconAjustes = () => (
  <Svg><path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h7M17 18h3" />
    <circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="14" cy="18" r="2" /></Svg>
)
export const IconHistorico = () => (
  <Svg><path d="M3.3 12a8.7 8.7 0 1 0 2.5-6.2" /><path d="M3 4v4h4" /><path d="M12 7.5V12l3 2" /></Svg>
)
export const IconBalanca = () => (
  <Svg><path d="M12 3v18M7.5 21h9" /><path d="M12 6 5 8.2 2.6 14.5h8.8L9 8.2M12 6l7 2.2 2.4 6.3h-8.8L15 8.2" /></Svg>
)
export const IconEquilibrio = () => (
  <Svg><path d="M4 20h16" /><path d="M8 20v-6M12 20V8M16 20v-9" />
    <circle cx="12" cy="4.6" r="1.8" /></Svg>
)
export const IconObra = () => (
  <Svg><path d="M3 20h18" /><path d="M5.5 20V9.5l6.5-4.5 6.5 4.5V20" />
    <path d="M9.2 20v-5.2h5.6V20" /></Svg>
)

import { useEffect } from 'react'

interface Props {
  message: string
  duration?: number
  onDone: () => void
}

export default function Toast({ message, duration = 2400, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [duration, onDone])

  return <div className="bm-toast">{message}</div>
}

import { useEffect, useId, useRef, useState } from 'react'
import type { ThemeKey } from './data'
import type { GlassController } from './glassRenderer'
import { useMotion } from './motion'

export default function GlassSculpture({ theme }: { theme: ThemeKey }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const controller = useRef<GlassController | null>(null)
  const state = useRef({ theme, paused: false })
  const { paused } = useMotion()
  const [ready, setReady] = useState(false)
  const id = useId().replace(/:/g, '')
  state.current = { theme, paused }
  useEffect(() => {
    let disposed = false
    if (!canvas.current) return
    const target = canvas.current
    void import('./glassRenderer').then(({ createGlassRenderer }) => {
      if (disposed) return
      try {
        controller.current = createGlassRenderer(target, state.current.theme, state.current.paused, () => {
          setReady(false); controller.current?.dispose(); controller.current = null
        })
        setReady(true)
      } catch { setReady(false) }
    }).catch(() => { if (!disposed) setReady(false) })
    return () => { disposed = true; controller.current?.dispose(); controller.current = null }
  }, [])
  useEffect(() => { controller.current?.select(theme) }, [theme])
  useEffect(() => { controller.current?.pause(paused) }, [paused])
  return <div className="glass-sculpture" data-renderer={ready ? 'webgl' : 'fallback'} data-theme={theme} aria-hidden="true">
    <svg className="glass-fallback" viewBox="0 0 500 400" fill="none">
      <defs><linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff" stopOpacity=".85"/><stop offset=".3" stopColor="#9faebd" stopOpacity=".12"/><stop offset=".55" stopColor="#f4f8ff" stopOpacity=".6"/><stop offset=".8" stopColor="#6e7b86" stopOpacity=".08"/><stop offset="1" stopColor="#fff" stopOpacity=".8"/></linearGradient></defs>
      <g stroke={`url(#${id}-glass)`} strokeWidth="20">
        {theme === 'trust' && <ellipse cx="250" cy="200" rx="120" ry="100" transform="rotate(-28 250 200)"/>}
        {theme === 'prediction' && <path d="M100 200C175 205 205 45 310 85S355 135 405 70M100 200C180 165 220 295 300 275S365 215 405 325M100 200C180 235 250 145 315 185S370 225 410 190"/>}
        {theme === 'time' && <path d="M155 65C155 175 345 225 345 335M345 65C345 175 155 225 155 335M155 65H345M155 335H345"/>}
        {theme === 'recovery' && <path d="M250 200C100 -20 30 230 135 270C240 305 270 95 370 130C475 170 410 410 250 200Z"/>}
      </g>
    </svg>
    <canvas ref={canvas} className="form-sculpture" data-theme={theme}/>
  </div>
}

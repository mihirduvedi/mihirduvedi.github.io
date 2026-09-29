import { ArrowDownRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { atlasProjects, type ThemeKey } from './data'
import { useMotion } from './motion'

const TAU = Math.PI * 2
const forms: Record<ThemeKey, { title: string; description: string; metaphor: string }> = {
  trust: { title: 'A boundary you can inspect.', description: 'Follow an action back to the authority behind it.', metaphor: 'A closed form, with every thread in view.' },
  prediction: { title: 'Room for the next possibility.', description: 'See how a fragment of language becomes a suggestion.', metaphor: 'One starting point. Many possible continuations.' },
  time: { title: 'A day, made visible.', description: 'Watch the hours settle into a hand-painted hourglass.', metaphor: 'Two chambers connected by a single moment.' },
  recovery: { title: 'A way back to where you were.', description: 'Keep a workout intact through an interruption.', metaphor: 'A continuous line that finds its way back.' },
}

type Point = [number, number, number]
function pointAt(theme: ThemeKey, u: number, v: number): Point {
  if (theme === 'time') {
    const y = (u / TAU - .5) * 2.6
    const radius = .13 + .88 * Math.pow(Math.abs(y) / 1.3, 1.15)
    const angle = v + y * .6
    return [radius * Math.cos(angle), y, radius * Math.sin(angle)]
  }
  if (theme === 'prediction') {
    const t = u / TAU
    const spread = Math.pow(t, .8)
    return [(t - .5) * 3.1, Math.sin(v) * spread * 1.3 + .18 * Math.sin(t * TAU + v), Math.cos(v) * spread * .95]
  }
  if (theme === 'recovery') {
    const radius = .25
    const a = 1 + Math.cos(u) ** 2
    return [1.65 * Math.sin(u) / a + radius * Math.cos(v) * Math.cos(u), 1.9 * Math.sin(u) * Math.cos(u) / a + radius * Math.cos(v) * Math.sin(u), .38 * Math.cos(u) + radius * Math.sin(v)]
  }
  const tube = .38 + .08 * Math.sin(u * 3)
  return [(1 + tube * Math.cos(v + u)) * Math.cos(u), (1 + tube * Math.cos(v + u)) * Math.sin(u), tube * Math.sin(v + u)]
}

// A small, dependency-free line renderer. The geometry is a visual metaphor,
// not project telemetry. Keeping points outside React avoids per-frame renders.
function FormSculpture({ theme }: { theme: ThemeKey }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const target = useRef(theme)
  const { paused } = useMotion()
  useEffect(() => { target.current = theme }, [theme])
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0, height = 0, frame = 0, phase = 0, lastFrame = 0
    let visible = true
    let points: Point[][] = []
    let lastTheme = target.current
    const lineCount = 68, resolution = 112
    const makePoints = (key: ThemeKey) => Array.from({ length: lineCount }, (_, i) =>
      Array.from({ length: resolution + 1 }, (_, j) => pointAt(key, j / resolution * TAU, i / lineCount * TAU)))
    let destination = makePoints(target.current)
    points = destination.map(line => line.map(p => [...p] as Point))
    let settling = 0
    function draw(timestamp: number) {
      frame = 0
      if (timestamp - lastFrame < 32 && !paused && !media.matches) { schedule(); return }
      lastFrame = timestamp
      if (lastTheme !== target.current) {
        lastTheme = target.current
        destination = makePoints(lastTheme)
        settling = paused || media.matches ? 1 : 90
      }
      if (settling) {
        const amount = paused || media.matches ? 1 : .09
        points.forEach((line, i) => line.forEach((p, j) => {
          for (let k = 0; k < 3; k++) p[k] += (destination[i][j][k] - p[k]) * amount
        }))
        settling--
      }
      if (!paused && !media.matches) phase += .003
      context!.clearRect(0, 0, width, height)
      const scale = Math.min(width, height) * .285
      const rx = lastTheme === 'time' ? .12 : .55
      const ry = -.2 + Math.sin(phase) * .28
      const rz = lastTheme === 'time' ? -.13 : -.38
      const projected = points.map((line, i) => {
        let depth = 0
        const vertices = line.map(([x, y, z]) => {
          const y1 = y * Math.cos(rx) - z * Math.sin(rx)
          const z1 = y * Math.sin(rx) + z * Math.cos(rx)
          const x2 = x * Math.cos(ry) + z1 * Math.sin(ry)
          const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry)
          const x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz)
          const y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz)
          const perspective = 4.7 / (4.7 - z2)
          depth += z2
          return [width / 2 + x3 * scale * perspective, height / 2 + y3 * scale * perspective]
        })
        return { vertices, depth: depth / line.length, i }
      }).sort((a, b) => a.depth - b.depth)
      projected.forEach(({ vertices, depth, i }) => {
        context!.beginPath()
        vertices.forEach(([x, y], j) => j ? context!.lineTo(x, y) : context!.moveTo(x, y))
        const light = Math.min(88, Math.max(31, 56 + depth * 27))
        const accent = i % 17 < 4
        context!.strokeStyle = accent ? `hsla(18, 75%, ${light}%, .9)` : `hsla(38, 30%, ${light + 10}%, .69)`
        context!.lineWidth = accent ? 1.1 : .7
        context!.stroke()
      })
      if ((!paused && !media.matches) || settling) schedule()
    }
    function schedule() { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw) }
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      width = rect.width; height = rect.height
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      schedule()
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) schedule()
      else { cancelAnimationFrame(frame); frame = 0 }
    })
    observer.observe(canvas)
    const visibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0 }
      else schedule()
    }
    document.addEventListener('visibilitychange', visibility)
    // Observe React's public DOM state to redraw an explicitly selected form
    // even when ambient motion is paused.
    const mutations = new MutationObserver(schedule)
    mutations.observe(canvas, { attributes: true, attributeFilter: ['data-theme'] })
    media.addEventListener('change', schedule)
    resize()
    return () => {
      cancelAnimationFrame(frame); resizeObserver.disconnect(); observer.disconnect(); mutations.disconnect()
      document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', schedule)
    }
  }, [paused])
  return <canvas ref={canvasRef} className="form-sculpture" data-theme={theme} aria-hidden="true" />
}

export function ThemeGlyph({ theme }: { theme: ThemeKey }) {
  return <svg className="theme-glyph" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
    {theme === 'trust' && <><ellipse cx="24" cy="24" rx="17" ry="11" transform="rotate(-35 24 24)" /><ellipse cx="24" cy="24" rx="11" ry="17" transform="rotate(-35 24 24)" /><circle cx="24" cy="24" r="17" /></>}
    {theme === 'prediction' && <>{[8, 16, 24, 32, 40].map(y => <path key={y} d={`M6 24 C24 24 22 ${y} 41 ${y}`} />)}</>}
    {theme === 'time' && <><path d="M10 7H38M10 41H38M13 7C13 19 35 29 35 41M35 7C35 19 13 29 13 41" /><path d="M19 7C19 19 29 29 29 41M29 7C29 19 19 29 19 41" /></>}
    {theme === 'recovery' && <><path d="M24 24C8 0-3 24 9 33C20 41 27 12 37 15C53 19 40 47 24 24Z" /><path d="M24 24C10 5 4 24 11 29C20 35 29 16 36 19C47 23 38 40 24 24Z" /></>}
  </svg>
}

export default function WorkingForms() {
  const [selected, setSelected] = useState<ThemeKey>('trust')
  const project = atlasProjects.find(item => item.key === selected)!
  const form = forms[selected]
  return <div className="working-forms">
    <div className="working-forms__label"><span>Explore the collection</span><span aria-hidden="true">01—04</span></div>
    <div className="working-forms__art" role="img" aria-label={`${project.theme} form study. ${form.metaphor}`}>
      <FormSculpture theme={selected} />
      <div className="form-registration form-registration--tl" aria-hidden="true" />
      <div className="form-registration form-registration--br" aria-hidden="true" />
      <span className="form-axis" aria-hidden="true">FORM {project.index}</span>
    </div>
    <div className="form-controls" role="group" aria-label="Explore an idea">
      {atlasProjects.map(item => <button key={item.key} type="button" aria-pressed={selected === item.key} onClick={() => setSelected(item.key)}><span>{item.index}</span>{' '}{item.theme}</button>)}
    </div>
    <div className="form-caption" aria-live="polite">
      <div><h2>{form.title}</h2><p>{form.description}</p></div>
      <a href={project.href} aria-label={`Explore ${project.title}`}><span>Explore {project.title}</span><ArrowDownRight aria-hidden="true" /></a>
    </div>
  </div>
}

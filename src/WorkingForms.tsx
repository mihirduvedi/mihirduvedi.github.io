import { ArrowDownRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { atlasProjects, type ThemeKey } from './data'
import { useMotion } from './motion'

const TAU = Math.PI * 2
const forms: Record<ThemeKey, { title: string; description: string; metaphor: string; steps: string[] }> = {
  trust: { title: 'A boundary you can inspect.', description: 'The woven boundary stands for the permission given to an agent. Agent Receipt checks whether its actions stayed inside it.', metaphor: 'An inspectable boundary', steps: ['Permission', 'Action', 'Evidence'] },
  prediction: { title: 'Room for the next possibility.', description: 'The form opens from one point into many paths, just as Autocomplete turns a word fragment into possible continuations.', metaphor: 'One fragment, many paths', steps: ['A fragment', 'Possibilities', 'Your choice'] },
  time: { title: 'A day, made visible.', description: 'Two chambers meet at a narrow present. Clock Museum makes the same passage visible as the day settles into an hourglass.', metaphor: 'Hours passing through the present', steps: ['Hours left', 'This moment', 'Day so far'] },
  recovery: { title: 'A way back to where you were.', description: 'The line bends away and returns without breaking. Atrium carries that idea into a workout you can resume after an interruption.', metaphor: 'A continuous way back', steps: ['Interrupted', 'Preserved', 'Resumed'] },
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
    return [(t - .5) * 3.1, Math.sin(v) * spread * 1.3 + .18 * Math.sin(t * TAU + v) * spread, Math.cos(v) * spread * .95]
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
  const phaseRef = useRef(0)
  const redraw = useRef<() => void>(() => {})
  const { paused } = useMotion()
  useEffect(() => { target.current = theme; redraw.current() }, [theme])
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = 0, height = 0, frame = 0, phase = phaseRef.current, lastFrame = 0
    let pointerX = 0, pointerY = 0, tiltX = 0, tiltY = 0
    const finePointer = window.matchMedia('(pointer: fine)')
    let visible = true
    let points: Point[][] = []
    let lastTheme = target.current
    const lineCount = 68, resolution = 112
    const makePoints = (key: ThemeKey) => Array.from({ length: lineCount }, (_, i) =>
      Array.from({ length: resolution + 1 }, (_, j) => pointAt(key, j / resolution * TAU, i / lineCount * TAU)))
    let destination = makePoints(target.current)
    points = destination.map(line => line.map(p => [...p] as Point))
    let settling = 0
    function draw(timestamp: number, force = false) {
      frame = 0
      if (!force && timestamp - lastFrame < 32 && !paused && !media.matches) { schedule(); return }
      const elapsed = lastFrame ? Math.min((timestamp - lastFrame) / 1000, .065) : 0
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
      if (!paused && !media.matches) {
        phase += elapsed * .48
        phaseRef.current = phase
        tiltX += (pointerX - tiltX) * .055
        tiltY += (pointerY - tiltY) * .055
      }
      context!.clearRect(0, 0, width, height)
      const scale = Math.min(width, height) * .285
      const rx = (lastTheme === 'time' ? .1 : .46) + Math.sin(phase * .7) * .12 + tiltY * .12
      const ry = -.2 + Math.sin(phase * .65) * .42 + tiltX * .2
      const rz = (lastTheme === 'time' ? -.08 : -.32) + Math.sin(phase * .4) * .09
      const cosX = Math.cos(rx), sinX = Math.sin(rx), cosY = Math.cos(ry), sinY = Math.sin(ry), cosZ = Math.cos(rz), sinZ = Math.sin(rz)
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      const projected = points.map((line, i) => {
        let depth = 0
        const v = i / lineCount * TAU, cosV = Math.cos(v), sinV = Math.sin(v)
        const vertices = line.map(([baseX, baseY, baseZ], j) => {
          const u = j / resolution * TAU
          // Traveling waves bend the surface itself. Keep the hourglass neck
          // and prediction origin intact so each idea remains recognizable.
          const envelope = lastTheme === 'time' ? Math.min(1, Math.abs(baseY) + .1) : lastTheme === 'prediction' ? j / resolution : 1
          const ripple = Math.sin(u * 3 + v * 2 - phase * 2) * .055 * envelope
          const breath = 1 + Math.sin(u * 2 - phase * 1.4) * .055
          const x = baseX * breath + ripple * cosV
          const y = baseY + Math.sin(u * 2 + v - phase) * .065 * envelope
          const z = baseZ * breath + ripple * sinV + Math.cos(u * 3 - phase) * .055 * envelope
          const y1 = y * cosX - z * sinX
          const z1 = y * sinX + z * cosX
          const x2 = x * cosY + z1 * sinY
          const z2 = -x * sinY + z1 * cosY
          const x3 = x2 * cosZ - y1 * sinZ
          const y3 = x2 * sinZ + y1 * cosZ
          const perspective = 4.7 / (4.7 - z2)
          depth += z2
          const px = x3 * scale * perspective, py = y3 * scale * perspective
          minX = Math.min(minX, px); maxX = Math.max(maxX, px)
          minY = Math.min(minY, py); maxY = Math.max(maxY, py)
          return [px, py]
        })
        return { vertices, depth: depth / line.length, i }
      }).sort((a, b) => a.depth - b.depth)
      const fit = Math.min(1, (width - 40) / Math.max(1, maxX - minX), (height - 84) / Math.max(1, maxY - minY))
      const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2
      projected.forEach(({ vertices, depth, i }) => {
        vertices.forEach(p => { p[0] = width / 2 + (p[0] - centerX) * fit; p[1] = height / 2 + (p[1] - centerY) * fit })
        context!.beginPath()
        vertices.forEach(([x, y], j) => j ? context!.lineTo(x, y) : context!.moveTo(x, y))
        const light = Math.min(88, Math.max(31, 56 + depth * 27))
        const accent = Math.sin(i / lineCount * TAU * 3 - phase * 1.2) > .66
        context!.strokeStyle = accent ? `hsla(18, 75%, ${light}%, .9)` : `hsla(38, 30%, ${light + 10}%, .69)`
        context!.lineWidth = accent ? 1.1 : .7
        context!.stroke()
        if (i % 17 === 0) {
          const head = ((phase * .13 + i / lineCount) % 1) * resolution
          context!.beginPath()
          const start = Math.max(0, Math.floor(head) - 9)
          for (let j = start; j <= Math.floor(head); j++) {
            const [x, y] = vertices[j]
            if (j === start) context!.moveTo(x, y)
            else context!.lineTo(x, y)
          }
          context!.strokeStyle = 'rgba(255, 224, 191, .88)'
          context!.lineWidth = 1.35
          context!.stroke()
        }
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
      // Paint once even in a hidden tab: a resized canvas must never be blank.
      cancelAnimationFrame(frame); frame = 0
      draw(performance.now(), true)
    }
    const pointer = (event: PointerEvent) => {
      if (!finePointer.matches || paused || media.matches) return
      const bounds = canvas.getBoundingClientRect()
      pointerX = (event.clientX - bounds.left) / bounds.width * 2 - 1
      pointerY = (event.clientY - bounds.top) / bounds.height * 2 - 1
    }
    const leave = () => { pointerX = 0; pointerY = 0 }
    canvas.addEventListener('pointermove', pointer, { passive: true })
    canvas.addEventListener('pointerleave', leave)
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
    // Selection is an explicit action, even with ambient motion paused. Read
    // the target after React updates it; DOM mutation callbacks can run earlier.
    redraw.current = () => {
      if (paused || media.matches || document.hidden) {
        cancelAnimationFrame(frame); frame = 0
        draw(performance.now(), true)
      } else schedule()
    }
    media.addEventListener('change', schedule)
    resize()
    return () => {
      canvas.removeEventListener('pointermove', pointer); canvas.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(frame); resizeObserver.disconnect(); observer.disconnect(); redraw.current = () => {}
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
    <div className="working-forms__label"><span>A visual index of the work</span><span aria-hidden="true">01—04</span></div>
    <div className="working-forms__art" role="img" aria-label={`${project.theme} form study. ${form.metaphor}`}>
      <FormSculpture theme={selected} />
      <div className="form-registration form-registration--tl" aria-hidden="true" />
      <div className="form-registration form-registration--br" aria-hidden="true" />
      <span className="form-axis" aria-hidden="true">{form.metaphor}</span>
      <span className="form-project" aria-hidden="true">{project.index} / {project.title}</span>
    </div>
    <div className="form-controls" role="group" aria-label="Explore an idea">
      {atlasProjects.map(item => <button key={item.key} type="button" aria-pressed={selected === item.key} onClick={() => setSelected(item.key)}><span>{item.index}</span>{' '}{item.theme}</button>)}
    </div>
    <div className="form-caption" aria-live="polite">
      <ol className="form-sequence" aria-label={`${project.title} concept`}>{form.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <div><h2>{form.title}</h2><p>{form.description}</p></div>
      <a href={project.href} aria-label={`Explore ${project.title}`}><span>Explore {project.title}</span><ArrowDownRight aria-hidden="true" /></a>
    </div>
  </div>
}

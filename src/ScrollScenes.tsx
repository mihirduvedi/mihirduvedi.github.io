import { useEffect } from 'react'
import { useMotion } from './motion'

const clamp = (value: number) => Math.max(0, Math.min(1, value))

// A single event-driven scheduler. Nothing animates on a timer while scrolling
// is idle, and all content has a complete, readable static state in CSS.
export function ScrollScenes() {
  const { paused } = useMotion()
  useEffect(() => {
    if (paused) return
    const root = document.documentElement
    const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'))
    const threads = Array.from(document.querySelectorAll<SVGPathElement>('.meaning-bridge__threads path'))
    const bridge = document.querySelector<HTMLElement>('.meaning-bridge')
    let frame = 0, disposed = false
    root.dataset.scrollScenes = 'on'
    const update = () => {
      frame = 0
      const height = window.innerHeight
      const measurements = scenes.map(scene => ({ scene, rect: scene.getBoundingClientRect() }))
      const bridgeRect = bridge?.getBoundingClientRect()
      const total = root.scrollHeight - height
      root.style.setProperty('--reading', String(total > 0 ? clamp(window.scrollY / total) : 0))
      measurements.forEach(({ scene, rect }) => {
        if (rect.bottom < -height * .2 || rect.top > height * 1.2) return
        const enter = clamp((height * .96 - rect.top) / Math.min(height * .72, rect.height * .8))
        const travel = clamp(-rect.top / Math.max(height, rect.height))
        scene.style.setProperty('--enter', enter.toFixed(4))
        scene.style.setProperty('--travel', travel.toFixed(4))
      })
      if (bridgeRect && bridgeRect.top < height && bridgeRect.bottom > 0) {
        const progress = clamp((height - bridgeRect.top) / (height + bridgeRect.height))
        threads.forEach((path, i) => path.setAttribute('d', threadPath(i, progress)))
      }
    }
    const schedule = () => { if (!disposed && !frame && !document.hidden) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    document.addEventListener('visibilitychange', schedule)
    window.addEventListener('load', schedule)
    void document.fonts?.ready.then(schedule)
    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      document.removeEventListener('visibilitychange', schedule)
      window.removeEventListener('load', schedule)
      delete root.dataset.scrollScenes
      root.style.removeProperty('--reading')
      scenes.forEach(scene => { scene.style.removeProperty('--enter'); scene.style.removeProperty('--travel') })
      threads.forEach((path, i) => path.setAttribute('d', threadPath(i, .5)))
    }
  }, [paused])
  return <div className="reading-thread" aria-hidden="true" />
}

function threadPath(index: number, progress: number) {
  const t = (index - 24) / 24
  const spread = 104 + 24 * Math.sin(progress * Math.PI)
  const twist = .3 + progress * .95
  const left = 150 + t * spread
  const right = 150 - t * spread
  const center = 150 + Math.sin(t * Math.PI * twist) * 36
  return `M0 ${left} C240 ${left}, 345 ${center}, 600 ${center} S960 ${right}, 1200 ${right}`
}

export function MeaningBridge() {
  return <figure className="meaning-bridge" aria-label="A woven thread diagram connects system state to human context through an interface.">
    <div className="meaning-bridge__labels"><span>System state</span><span>The interface</span><span>Human context</span></div>
    <svg viewBox="0 0 1200 300" fill="none" aria-hidden="true" preserveAspectRatio="none">
      <defs><linearGradient id="thread-ink"><stop stopColor="#ab6541" /><stop offset=".5" stopColor="#6f4936" /><stop offset="1" stopColor="#ab6541" /></linearGradient></defs>
      <path className="meaning-bridge__axis" d="M0 150H1200M600 5V295" />
      <g className="meaning-bridge__threads">{Array.from({ length: 49 }, (_, i) => <path key={i} d={threadPath(i, .5)} stroke="url(#thread-ink)" strokeWidth={i % 12 === 0 ? 1.4 : .65} opacity={i % 12 === 0 ? .85 : .42} />)}</g>
      <circle cx="600" cy="150" r="5" className="meaning-bridge__point" />
    </svg>
    <figcaption><span>What happened.</span><span>What it means.</span><span>What happens next.</span></figcaption>
  </figure>
}

export function ChapterMark({ number, theme }: { number: string; theme: string }) {
  const paths: Record<string, string[]> = {
    Trust: ['M0 16H470C475 16 475 2 495 2S520 30 495 30S475 16 530 16H1000'],
    Prediction: ['M0 16H470C510 16 510 2 560 2H1000', 'M470 16H1000', 'M470 16C510 16 510 30 560 30H1000'],
    Time: ['M0 2H430C485 2 515 30 570 30H1000', 'M0 30H430C485 30 515 2 570 2H1000'],
    Recovery: ['M0 16H465C485 16 490 2 510 2C550 2 550 30 510 30C480 30 485 16 545 16H1000'],
  }
  return <div className="chapter-mark" aria-hidden="true"><span>{number}</span><span>{theme}</span><svg viewBox="0 0 1000 32" preserveAspectRatio="none" fill="none">{paths[theme].map((d, i) => <path key={i} d={d} pathLength="1000" />)}</svg></div>
}

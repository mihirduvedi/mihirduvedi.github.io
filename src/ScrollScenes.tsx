import { Fragment, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useMotion } from './motion'

gsap.registerPlugin(ScrollTrigger)
// Rebuild scrub tween values after layout changes so a breakpoint or an
// interrupted anchor jump cannot retain the previous timeline's end state.
ScrollTrigger.defaults({ invalidateOnRefresh: true })

// Triggers remain in document flow; only their children are transformed.
// Numeric scrub eases wheel/trackpad updates without replacing native scroll.
export function ScrollScenes() {
  const { paused } = useMotion()
  useEffect(() => {
    if (paused) return
    const root = document.documentElement
    root.dataset.scrollScenes = 'on'
    let disposed = false
    const media = gsap.matchMedia()
    media.add({ wide: '(min-width: 901px)', small: '(max-width: 900px)' }, context => {
      const wide = context.conditions?.wide
      const distance = wide ? 1 : .52
      const hero = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .7 } })
      hero.fromTo('.hero__identity', { y: 0, opacity: 1 }, { y: 120 * distance, opacity: .35, ease: 'none' }, 0)
        .fromTo('.working-forms__art', { y: 0, rotate: 0, scale: 1 }, { y: -65 * distance, rotate: 9, scale: .82, ease: 'none' }, 0)
      const orientation = gsap.timeline({ scrollTrigger: { trigger: '.orientation', start: 'top 55%', end: wide ? 'bottom 100%' : 'bottom 65%', scrub: .85 } })
      orientation.fromTo('.orientation__grid > p', { y: 70 * distance }, { y: 0, duration: .45, ease: 'power2.out' }, 0)
        .fromTo('.meaning-bridge__word--system', { x: 28 * distance, y: 24 }, { x: 0, y: 0, duration: .8, ease: 'sine.inOut' }, 0)
        .fromTo('.meaning-bridge__word--people', { x: -28 * distance, y: 24 }, { x: 0, y: 0, duration: .8, ease: 'sine.inOut' }, 0)
      // Like Codrops' path studies, compatible cubic control points are
      // interpolated directly. One scrubbed timeline owns all four connections.
      document.querySelectorAll<SVGPathElement>('.meaning-bridge__thread').forEach(path => {
        orientation.fromTo(path, { attr: { d: path.dataset.woven! } }, { attr: { d: path.dataset.open! }, duration: 1.4, ease: 'sine.inOut' }, .05)
      })
      orientation.fromTo('.meaning-bridge__outputs li', { y: 26, opacity: .2 }, { y: 0, opacity: 1, stagger: .08, duration: .45, ease: 'power2.out' }, .65)
        .fromTo('.meaning-bridge__note', { opacity: .2 }, { opacity: 1, duration: .45 }, .9)
      gsap.fromTo('.work-threshold h2', { y: 110 * distance, rotate: -4 }, { y: 0, rotate: 0, ease: 'power2.out', scrollTrigger: { trigger: '.work-threshold', start: 'top 90%', end: 'top 25%', scrub: .7 } })
      gsap.fromTo('.work-threshold li', { x: 150 * distance, opacity: .25 }, { x: 0, opacity: 1, stagger: .13, ease: 'power2.out', scrollTrigger: { trigger: '.work-threshold', start: 'top 75%', end: 'bottom 80%', scrub: .65 } })
      document.querySelectorAll<HTMLElement>('.exhibit').forEach((exhibit, i) => {
        const q = gsap.utils.selector(exhibit)
        const timeline = gsap.timeline({ scrollTrigger: { trigger: exhibit, start: 'top 92%', end: wide ? 'top 8%' : 'top 15%', scrub: .65 } })
        timeline.fromTo(q('.chapter-mark > span:first-child'), { scale: 1.65, x: 25, opacity: .12, transformOrigin: 'left bottom' }, { scale: 1, x: 0, opacity: 1, duration: .8, ease: 'power2.out' }, 0)
          .fromTo(q('.chapter-mark path'), { strokeDasharray: 1000, strokeDashoffset: 1000 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power1.inOut' }, 0)
          .fromTo(q('.title-word > span'), { yPercent: 115, rotate: 5 }, { yPercent: 0, rotate: 0, stagger: .14, duration: .8, ease: 'power3.out' }, .14)
        const mediaTargets = q('.receipt-stage, .dayglass-stage, .atrium-screen')
        if (mediaTargets.length) {
          gsap.fromTo(mediaTargets, { y: 150 * distance, scale: .86, rotationY: (i % 2 ? 12 : -12) * distance, rotationX: 7 * distance, transformPerspective: 1200 }, {
            y: 0, scale: 1, rotationY: 0, rotationX: 0, ease: 'power2.out',
            scrollTrigger: { trigger: mediaTargets[0].parentElement, start: 'top 100%', end: 'top 28%', scrub: .8 },
          })
        }
        if (q('.prediction-branches').length) gsap.fromTo(q('.prediction-branches path'), { strokeDasharray: 200, strokeDashoffset: 200 }, { strokeDashoffset: 0, stagger: .13, ease: 'none', scrollTrigger: { trigger: '.prediction-stage', start: 'top 85%', end: 'top 30%', scrub: .6 } })
      })
      gsap.fromTo('.question-list li', { y: 65 * distance, opacity: .25 }, { y: 0, opacity: 1, stagger: .18, ease: 'power2.out', scrollTrigger: { trigger: '.question-list', start: 'top 90%', end: 'bottom 80%', scrub: .65 } })
      gsap.fromTo('.footer-signature > span:first-child', { yPercent: 85, scale: .9 }, { yPercent: 0, scale: 1, ease: 'power2.out', scrollTrigger: { trigger: '.site-footer', start: 'top 90%', end: 'bottom bottom', scrub: .9 } })
      gsap.fromTo('.reading-thread', { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .2 } })
    })
    let refreshFrame = 0
    const refresh = () => { if (!disposed) { ScrollTrigger.refresh(); ScrollTrigger.update() } }
    const resizeObserver = new ResizeObserver(() => {
      if (!refreshFrame && !disposed) refreshFrame = requestAnimationFrame(() => { refreshFrame = 0; refresh() })
    })
    document.querySelectorAll('.exhibit, .orientation').forEach(element => resizeObserver.observe(element))
    void document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    // Hash navigation and a breakpoint refresh can coincide. Read the actual
    // scroll position again after native scrolling settles, including #top.
    let syncFrame = 0
    const syncPosition = () => {
      cancelAnimationFrame(syncFrame)
      syncFrame = requestAnimationFrame(() => { if (!disposed) ScrollTrigger.update() })
    }
    window.addEventListener('scrollend', syncPosition)
    window.addEventListener('hashchange', syncPosition)
    ScrollTrigger.addEventListener('refresh', syncPosition)
    return () => {
      disposed = true; window.removeEventListener('load', refresh)
      window.removeEventListener('scrollend', syncPosition)
      window.removeEventListener('hashchange', syncPosition)
      ScrollTrigger.removeEventListener('refresh', syncPosition)
      cancelAnimationFrame(syncFrame)
      cancelAnimationFrame(refreshFrame); resizeObserver.disconnect()
      media.revert(); delete root.dataset.scrollScenes
    }
  }, [paused])
  return <div className="reading-thread" aria-hidden="true" />
}

const translations = [
  { system: 'Permission', human: 'Trust', project: 'Agent Receipt' },
  { system: 'Candidates', human: 'Choice', project: 'Autocomplete' },
  { system: 'Hours', human: 'Perspective', project: 'Clock Museum' },
  { system: 'Saved state', human: 'Continuity', project: 'Atrium' },
]

function bridgePath(index: number, woven: boolean) {
  const y = 40 + index * 80
  const lift = (index % 2 ? -1 : 1) * 22
  if (!woven) return `M0 ${y} C210 ${y},230 ${y+lift},400 ${y+lift} C570 ${y+lift},620 ${y-lift},780 ${y-lift} C890 ${y-lift},930 ${y},1000 ${y}`
  const turn = index % 2 ? 42 + index * 20 : 278 - index * 20
  return `M0 ${y} C190 ${y},300 ${turn},540 ${turn} C830 ${turn},250 ${320-turn},490 ${320-turn} C720 ${320-turn},810 ${y},1000 ${y}`
}

export function MeaningBridge() {
  return <figure className="meaning-bridge" aria-label="Four connections untangle from system state into human meaning: permission to trust, candidates to choice, hours to perspective, and saved state to continuity.">
    <div className="meaning-bridge__labels"><span>System state<strong className="meaning-bridge__word--system">Systems</strong></span><span className="meaning-bridge__note">The common thread</span><span>Human context<strong className="meaning-bridge__word--people">People</strong></span></div>
    <div className="meaning-bridge__flow">
      <ol className="meaning-bridge__inputs">{translations.map(item => <li key={item.system}>{item.system}</li>)}</ol>
      <svg viewBox="0 0 1000 320" fill="none" aria-hidden="true" preserveAspectRatio="none">
        <defs>
          <linearGradient id="thread-silver" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#8a9aa4"/><stop offset=".32" stopColor="#fdfefe"/><stop offset=".5" stopColor="#91a2ad"/><stop offset=".7" stopColor="#566f80"/><stop offset="1" stopColor="#cbd3d6"/></linearGradient>
          <linearGradient id="thread-light"><stop stopColor="#8195a2" stopOpacity=".15"/><stop offset=".45" stopColor="#fff"/><stop offset="1" stopColor="#8195a2" stopOpacity=".4"/></linearGradient>
        </defs>
        {translations.map((item, i) => <g key={item.system}>
          <path className="meaning-bridge__thread meaning-bridge__shadow" d={bridgePath(i, false)} data-woven={bridgePath(i, true)} data-open={bridgePath(i, false)}/>
          <path className="meaning-bridge__thread meaning-bridge__silver" d={bridgePath(i, false)} data-woven={bridgePath(i, true)} data-open={bridgePath(i, false)}/>
          <path className="meaning-bridge__thread meaning-bridge__light" d={bridgePath(i, false)} data-woven={bridgePath(i, true)} data-open={bridgePath(i, false)}/>
        </g>)}
      </svg>
      <ol className="meaning-bridge__outputs">{translations.map(item => <li key={item.human}><strong>{item.human}</strong><span>{item.project}</span></li>)}</ol>
    </div>
    <figcaption><span>What the system knows.</span><span className="meaning-bridge__note">An interface makes the connection.</span><span>What it means to someone.</span></figcaption>
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

export function ExhibitTitle({ title }: { title: string }) {
  const words = title.split(' ')
  return <h3 aria-label={title}>{words.map((word, index) => <Fragment key={index}><span className="title-word" aria-hidden="true"><span>{word}</span></span>{index < words.length - 1 ? ' ' : ''}</Fragment>)}</h3>
}

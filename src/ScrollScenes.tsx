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
      const orientation = gsap.timeline({ scrollTrigger: { trigger: '.orientation', start: 'top 65%', end: wide ? 'bottom 95%' : 'bottom 65%', scrub: .75 } })
      orientation.fromTo('.orientation__grid > p', { y: 80 * distance }, { y: 0, duration: .35, ease: 'power2.out' }, 0)
        .fromTo('.meaning-bridge__incoming path', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: .025, duration: .4, ease: 'sine.inOut' }, 0)
        .fromTo('.meaning-bridge__lens', { scaleX: .6, rotate: -18, transformOrigin: '50% 50%', opacity: .4 }, { scaleX: 1, rotate: 12, opacity: 1, duration: .85, ease: 'sine.inOut' }, .1)
        .fromTo('.meaning-bridge__outgoing path', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, stagger: .03, duration: .45, ease: 'sine.inOut' }, .35)
        .fromTo('.meaning-bridge__destinations circle', { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, stagger: .03, duration: .2, ease: 'power2.out' }, .78)
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

export function MeaningBridge() {
  const paths = Array.from({ length: 8 }, (_, i) => ({ entry: 104 + i * 16, waist: 139 + i * 6, exit: 41 + i * 34 }))
  return <figure className="meaning-bridge" aria-label="Paths from a system pass through a glass lens and separate into clear choices for people.">
    <div className="meaning-bridge__labels"><span>System state<strong>Systems</strong></span><span>The interface<strong>Made clear</strong></span><span>Human context<strong>People</strong></span></div>
    <svg viewBox="0 0 1200 320" fill="none" aria-hidden="true" preserveAspectRatio="none">
      <defs>
        <linearGradient id="signal-ink" x1="0" x2="1"><stop stopColor="#9fadb5" stopOpacity=".3"/><stop offset=".48" stopColor="#657a88"/><stop offset="1" stopColor="#8099a7"/></linearGradient>
        <linearGradient id="lens-glass" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ffffff" stopOpacity=".95"/><stop offset=".18" stopColor="#c6d5de" stopOpacity=".6"/><stop offset=".4" stopColor="#f4f8fa" stopOpacity=".1"/><stop offset=".72" stopColor="#8b9fac" stopOpacity=".55"/><stop offset=".88" stopColor="#ffffff" stopOpacity=".95"/><stop offset="1" stopColor="#a3b4be" stopOpacity=".6"/></linearGradient>
        <linearGradient id="lens-edge"><stop stopColor="#8196a4"/><stop offset=".4" stopColor="#fff"/><stop offset="1" stopColor="#798d9b"/></linearGradient>
        <radialGradient id="lens-light"><stop stopColor="#fff" stopOpacity=".9"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
      </defs>
      <g className="meaning-bridge__incoming" stroke="url(#signal-ink)" strokeWidth="2.5">{paths.map((p, i) => <path key={i} pathLength="1" d={`M12 ${p.entry} C210 ${p.entry-42}, 350 ${p.waist+35}, 600 ${p.waist}`}/>)}</g>
      <g className="meaning-bridge__outgoing" stroke="url(#signal-ink)" strokeWidth="2.5">{paths.map((p, i) => <path key={i} pathLength="1" d={`M600 ${p.waist} C820 ${p.waist-25}, 840 ${p.exit}, 1182 ${p.exit}`}/>)}</g>
      <g className="meaning-bridge__destinations" fill="#758e9e">{paths.map((p, i) => <circle key={i} cx="1182" cy={p.exit} r="3.2"/>)}</g>
      <g className="meaning-bridge__lens">
        <ellipse cx="600" cy="170" rx="98" ry="129" fill="#647a8b" opacity=".06"/>
        <ellipse cx="600" cy="160" rx="82" ry="126" fill="url(#lens-glass)" stroke="url(#lens-edge)" strokeWidth="1.5"/>
        <ellipse cx="600" cy="160" rx="67" ry="114" stroke="#fff" strokeWidth="1.5" opacity=".7"/>
        <ellipse cx="576" cy="107" rx="50" ry="65" fill="url(#lens-light)"/>
        <path d="M557 70C526 117 529 196 554 239" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".9"/>
        <path d="M649 91C673 144 665 214 640 250" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".8"/>
      </g>
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

export function ExhibitTitle({ title }: { title: string }) {
  const words = title.split(' ')
  return <h3 aria-label={title}>{words.map((word, index) => <Fragment key={index}><span className="title-word" aria-hidden="true"><span>{word}</span></span>{index < words.length - 1 ? ' ' : ''}</Fragment>)}</h3>
}

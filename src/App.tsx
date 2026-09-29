import { ArrowDown, ArrowDownRight, ArrowRight, ExternalLink, Menu, X, Pause, Play } from 'lucide-react'
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import Dayglass from './Dayglass'
import {
  acceptSuggestion,
  createAutocompleteIndex,
  fallbackAutocompleteIndex,
  getInputContext,
  getSuggestions,
  type AutocompleteIndex,
} from './autocomplete'
import { atlasProjects, workingQuestions } from './data'
import WorkingForms, { ThemeGlyph } from './WorkingForms'
import { MotionProvider, useMotion } from './motion'
import { mountLiquidGlass } from './liquidGlass'
import { ScrollScenes, MeaningBridge, ChapterMark } from './ScrollScenes'

export { getSuggestions } from './autocomplete'

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`
const githubUrl = 'https://github.com/mihirduvedi'
const linkedInUrl = 'https://www.linkedin.com/in/mihirduvedi'
const autocompleteUrl = 'https://github.com/mihirduvedi/autocomplete-engine'
const receiptUrl = 'https://github.com/mihirduvedi/agent-receipt'

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target.id) setActive(visible.target.id)
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.2, 0.6] },
    )
    ids.forEach((id) => {
      const node = document.getElementById(id)
      if (node) observer.observe(node)
    })
    return () => observer.disconnect()
  }, [ids])
  return active
}

function useLiveTime(paused: boolean) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (paused) return
    setNow(new Date())
    const timer = window.setInterval(() => { if (!document.hidden) setNow(new Date()) }, 1000)
    return () => window.clearInterval(timer)
  }, [paused])
  return now
}

function Header() {
  const [open, setOpen] = useState(false)
  const { paused, reduced, toggle } = useMotion()
  const motionLabel = reduced ? 'Reduced motion is enabled in your system settings' : paused ? 'Enable motion' : 'Pause motion'
  const menuRef = useRef<HTMLButtonElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const sections = useMemo(() => ['top', 'work', 'questions', 'about'], [])
  const active = useActiveSection(sections)

  useEffect(() => {
    document.body.dataset.menuOpen = String(open)
    return () => { delete document.body.dataset.menuOpen }
  }, [open])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); menuRef.current?.focus() } }
    const closeOnWideScreen = () => { if (window.innerWidth > 760) setOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    window.addEventListener('resize', closeOnWideScreen)
    return () => { window.removeEventListener('keydown', closeOnEscape); window.removeEventListener('resize', closeOnWideScreen) }
  }, [open])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    return mountLiquidGlass(header, { scale: -18, border: 0.19, mapBlur: 9, fallbackBlur: 13 })
  }, [])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    if (typeof document.elementsFromPoint !== 'function') {
      header.dataset.surface = 'dark'
      return () => { delete header.dataset.surface }
    }
    let frame = 0
    const updateSurface = () => {
      frame = 0
      const bounds = header.getBoundingClientRect()
      const under = document.elementsFromPoint(window.innerWidth / 2, bounds.top + bounds.height / 2)
        .find((element) => element !== header && !header.contains(element))
      const surface = under?.closest('.paper-space, .dark-space')
      header.dataset.surface = surface?.classList.contains('paper-space') ? 'paper' : 'dark'
    }
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateSurface)
    }
    updateSurface()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      delete header.dataset.surface
    }
  }, [])

  const close = () => setOpen(false)
  return (
    <header
      ref={headerRef}
      className="site-header"
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        event.currentTarget.style.setProperty('--glass-x', `${event.clientX - bounds.left}px`)
        event.currentTarget.style.setProperty('--glass-y', `${event.clientY - bounds.top}px`)
      }}
    >
      <a className="wordmark" href="#top" onClick={close} aria-label="Mihir Duvedi, back to top">
        <span aria-hidden="true">MD</span><strong>Mihir Duvedi</strong>
      </a>
      <div className="header-actions">
        <button className="motion-button" type="button" onClick={toggle} disabled={reduced} aria-label={motionLabel} title={motionLabel}>{paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}<span>{reduced ? 'Reduced motion' : `Motion ${paused ? 'off' : 'on'}`}</span></button>
        <button ref={menuRef} className="menu-button" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen((value) => !value)}>
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}<span>{open ? 'Close' : 'Menu'}</span>
        </button>
        <nav id="primary-navigation" className={`primary-nav ${open ? 'primary-nav--open' : ''}`} aria-label="Primary">
          {([['work', 'Work'], ['questions', 'Questions'], ['about', 'About']] as const).map(([id, label]) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={close}>{label}</a>
          ))}
        </nav>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section id="top" className="hero dark-space" data-scene="hero">
      <div className="page-shell hero__grid">
        <div className="hero__identity">
          <p className="hero__eyebrow"><span className="identity-mark" aria-hidden="true" />A museum of working ideas</p>
          <h1 aria-label="Mihir Duvedi"><span>Mihir</span><span className="hero__surname">Duvedi</span></h1>
          <div className="hero__statement">
            <p>I build software for the gap between what a system does and what a person understands.</p>
            <a className="primary-link" href="#work">See the work <ArrowDown aria-hidden="true" /></a>
          </div>
        </div>
        <WorkingForms />
        <div className="hero__foot"><span>Software, systems & interaction</span><a href="#work">Four working ideas <ArrowDown aria-hidden="true" /></a></div>
      </div>
    </section>
  )
}

function Orientation() {
  return <section className="orientation paper-space" data-scene="orientation">
    <div className="page-shell">
      <div className="orientation__grid">
        <div className="orientation__aside"><span className="plate-label">The common thread</span><span>Systems ↔ people</span></div>
        <p>I study computer science and Spanish because I care about how systems carry meaning between machines, between people, and between the two.</p>
      </div>
      <MeaningBridge />
    </div>
  </section>
}

const receiptStates = [
  { key: 'trace', label: 'Trace intake', image: 'assets/projects/agent-receipt-trace.jpg', alt: 'Agent Receipt trace intake with source selection and trace details.', note: 'Start with the trace and the authority that were actually supplied.' },
  { key: 'deviation', label: 'Deviation', image: 'assets/projects/agent-receipt-deviation.jpg', alt: 'Agent Receipt overview with a material deviation verdict and findings.', note: 'Separate an expected action from a material deviation.' },
  { key: 'gap', label: 'Evidence gap', image: 'assets/projects/agent-receipt-gap.jpg', alt: 'Agent Receipt evidence-gap view with a qualified conclusion.', note: 'Let missing evidence weaken the conclusion instead of filling it in.' },
] as const

function ReceiptExhibit() {
  const [stateKey, setStateKey] = useState<(typeof receiptStates)[number]['key']>('deviation')
  const state = receiptStates.find((item) => item.key === stateKey) ?? receiptStates[1]
  return (
    <article id="agent-receipt" className="exhibit exhibit--receipt dark-space" data-scene="exhibit">
      <div className="page-shell"><ChapterMark number="01" theme="Trust" /></div>
      <div className="page-shell exhibit-grid">
        <header className="exhibit-header">
          <p className="plate-label"><ThemeGlyph theme="trust" />01 / Trust</p><h3>Agent Receipt</h3>
          <p className="exhibit-premise">When an AI agent acts, its operator needs more than a log.</p>
          <p className="exhibit-description">Agent Receipt compares the action trace with the authority a person granted, then makes the difference reviewable.</p>
          <a className="text-link" href={receiptUrl} target="_blank" rel="noreferrer">View source <ExternalLink aria-hidden="true" /></a>
        </header>
        <div className="media-glass receipt-stage"><div className="exhibit-windowbar"><span>Agent Receipt</span><span>Evidence viewer</span></div><img src={asset(state.image)} width="1280" height="720" alt={state.alt} loading="lazy" decoding="async" /><p aria-live="polite">{state.note}</p></div>
        <div className="state-selector" role="group" aria-label="Agent Receipt views">
          {receiptStates.map((item, index) => (
            <button key={item.key} type="button" aria-pressed={stateKey === item.key} onClick={() => setStateKey(item.key)}>
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{item.label}</strong><ArrowRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

function AutocompleteExhibit() {
  const [value, setValue] = useState('She was very pr')
  const [selected, setSelected] = useState(0)
  const [index, setIndex] = useState<AutocompleteIndex>(fallbackAutocompleteIndex)
  const [corpusState, setCorpusState] = useState<'loading' | 'ready' | 'fallback'>('loading')
  const suggestions = useMemo(() => getSuggestions(value, index), [value, index])
  const { fragment } = getInputContext(value)

  useEffect(() => {
    let cancelled = false
    fetch(asset('data/pride-and-prejudice.txt'))
      .then((response) => {
        if (!response.ok) throw new Error(`Corpus request failed: ${response.status}`)
        return response.text()
      })
      .then((corpus) => {
        if (cancelled) return
        setIndex(createAutocompleteIndex(corpus)); setCorpusState('ready')
      })
      .catch(() => { if (!cancelled) setCorpusState('fallback') })
    return () => { cancelled = true }
  }, [])

  useEffect(() => setSelected(0), [value])
  const accept = (word: string) => setValue((current) => acceptSuggestion(current, word))
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return
    if (event.key === 'ArrowDown') { event.preventDefault(); setSelected((current) => (current + 1) % suggestions.length) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setSelected((current) => (current - 1 + suggestions.length) % suggestions.length) }
    if ((event.key === 'Enter' || (event.key === 'Tab' && !event.shiftKey && fragment)) && suggestions[selected]) { event.preventDefault(); accept(suggestions[selected]) }
    if (event.key === 'Escape') setSelected(0)
  }
  const status = corpusState === 'ready'
    ? `${index.wordCount.toLocaleString()} corpus words indexed in this page.`
    : corpusState === 'loading'
      ? 'Loading the full corpus; a small local index is ready now.'
      : 'The full corpus could not load; the small local index is still available.'

  return (
    <article id="autocomplete" className="exhibit exhibit--autocomplete paper-space" data-scene="exhibit">
      <div className="page-shell"><ChapterMark number="02" theme="Prediction" /></div>
      <div className="page-shell autocomplete-grid">
        <header className="exhibit-header">
          <p className="plate-label"><ThemeGlyph theme="prediction" />02 / Prediction</p><h3>Autocomplete</h3>
          <p className="exhibit-premise">A useful prediction should be quick to inspect and easy to reject.</p>
          <p className="exhibit-description">This browser study uses the project’s real Pride and Prejudice vocabulary and its Trie-plus-bigram candidate rule. The full engine adds a character LSTM to rerank the same candidates.</p>
          <a className="text-link text-link--dark" href={autocompleteUrl} target="_blank" rel="noreferrer">Open the full engine <ExternalLink aria-hidden="true" /></a>
        </header>
        <div className="prediction-stage">
          <label htmlFor="prediction-input">Try a phrase</label>
          <input id="prediction-input" value={value} maxLength={120} autoComplete="off" spellCheck="false" aria-describedby="prediction-help prediction-status" onChange={(event) => setValue(event.target.value)} onKeyDown={handleKeyDown} />
          <p id="prediction-help">Suggestions must begin with the unfinished word. Use arrows to choose; press Enter to accept, or Tab to finish a word.</p>
          <div className={`suggestion-list ${suggestions.length ? 'suggestion-list--branching' : ''}`} role="group" aria-label="Suggestions">
            {suggestions.length > 0 && <div className="prediction-branches" aria-hidden="true">
              <span className="prediction-root"><small>{fragment ? 'Prefix' : 'Next word'}</small><strong>{fragment || '…'}</strong></span>
              <svg viewBox={`0 0 200 ${suggestions.length * 80}`} preserveAspectRatio="none" fill="none">
                {suggestions.map((word, i) => <path key={word} className={i === selected ? 'is-active' : ''} d={`M0 ${suggestions.length * 40} C110 ${suggestions.length * 40} 70 ${i * 80 + 40} 200 ${i * 80 + 40}`} />)}
              </svg>
            </div>}
            {suggestions.map((word, suggestionIndex) => (
              <button key={word} type="button" aria-pressed={selected === suggestionIndex} onPointerEnter={() => setSelected(suggestionIndex)} onClick={() => accept(word)}>
                <span>{String(suggestionIndex + 1).padStart(2, '0')}</span><strong>{word}</strong><ArrowRight aria-hidden="true" />
              </button>
            ))}
            {!suggestions.length && <p className="suggestion-empty">{fragment ? `No corpus word starts with “${fragment}.” Keep typing or try another prefix.` : 'Type a word or phrase to see its possible continuations.'}</p>}
          </div>
          <p id="prediction-status" className="prediction-status" aria-live="polite">{status}</p>
        </div>
      </div>
    </article>
  )
}

function ClockExhibit() {
  const { paused } = useMotion()
  const now = useLiveTime(paused)
  const [previewHour, setPreviewHour] = useState<number | null>(null)
  const frozenTime = useRef(now)
  if (!paused) frozenTime.current = now
  const displayedTime = new Date(previewHour === null ? (paused ? frozenTime.current : now) : now)
  if (previewHour !== null) displayedTime.setHours(Math.floor(previewHour), Math.round((previewHour % 1) * 60), 0, 0)
  const hours = displayedTime.getHours() + displayedTime.getMinutes() / 60
  const timeLabel = displayedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  return (
    <article id="clock-museum" className="exhibit exhibit--clocks dark-space" data-scene="exhibit">
      <div className="page-shell"><ChapterMark number="03" theme="Time" /></div>
      <div className="page-shell clock-grid">
        <header className="exhibit-header">
          <p className="plate-label"><ThemeGlyph theme="time" />03 / Time</p><h3>Clock Museum</h3>
          <p className="exhibit-premise">This hourglass turns the whole day into one slow pour.</p>
          <p className="exhibit-description">It follows your local time: the day so far settles below, while the hours left stay above.</p>
          <a className="text-link" href={githubUrl} target="_blank" rel="noreferrer">Browse my GitHub <ExternalLink aria-hidden="true" /></a>
        </header>
        <div className="clock-instrument">
          <div className="dayglass-stage"><Dayglass now={displayedTime} /></div>
          <div className="dayglass-controls">
            <div className="dayglass-readout"><div><span>{previewHour === null ? (paused ? 'Time held' : 'Your local time') : 'Preview time'}</span><strong>{timeLabel}</strong></div><p>{Math.round(hours / 24 * 100)}% of the day<br /><span>{previewHour === null ? 'A day in one slow pour.' : 'Move through the day.'}</span></p></div>
            <label htmlFor="dayglass-time">Explore a different hour</label>
            <input id="dayglass-time" type="range" min="0" max="1439" step="1" value={Math.round((previewHour ?? hours) * 60)} aria-valuetext={timeLabel} onChange={event => setPreviewHour(Number(event.target.value) / 60)} />
            <div className="dayglass-scale"><span>00:00</span><button type="button" disabled={previewHour === null} onClick={() => setPreviewHour(null)}>{previewHour === null ? (paused ? 'Motion paused' : 'Following your clock') : 'Return to local time'}</button><span>24:00</span></div>
          </div>
        </div>
      </div>
    </article>
  )
}

const atriumViews = [
  { key: 'recover', label: 'Recovery', image: 'assets/projects/atrium-today-current.png', alt: 'Current Atrium Today screen showing a workout ready to resume and a recovery score.', note: 'An interrupted workout returns as the first clear action.' },
  { key: 'workout', label: 'Workout', image: 'assets/projects/atrium-workout-current.png', alt: 'Current Atrium workout screen with set logging and the full workout timeline.', note: 'The whole session stays visible while a set is being logged.' },
  { key: 'progress', label: 'Progress', image: 'assets/projects/atrium-progress-current.png', alt: 'Current Atrium Progress screen with training volume and exercise comparison.', note: 'Recovered sessions flow back into the training record.' },
] as const

function AtriumExhibit() {
  const [viewKey, setViewKey] = useState<(typeof atriumViews)[number]['key']>('recover')
  const current = atriumViews.find((item) => item.key === viewKey) ?? atriumViews[0]
  return (
    <article id="atrium" className="exhibit exhibit--atrium dark-space" data-scene="exhibit">
      <div className="page-shell"><ChapterMark number="04" theme="Recovery" /></div>
      <div className="page-shell atrium-grid">
        <header className="exhibit-header">
          <p className="plate-label"><ThemeGlyph theme="recovery" />04 / Recovery</p><h3>Atrium</h3>
          <p className="exhibit-premise">A workout should survive the moment the network or the app does not.</p>
          <p className="exhibit-description">Atrium keeps an active session on the device, restores interrupted work, and reconciles it with the training record when the app returns.</p>
        </header>
        <div className="atrium-stage">
          <div className="recovery-orbits" aria-hidden="true"><i /><i /><i /></div>
          <div className="atrium-screen"><img src={asset(current.image)} width="1206" height="2622" alt={current.alt} loading="lazy" decoding="async" /></div>
          <p aria-live="polite">{current.note}</p>
        </div>
        <div className="atrium-selector" role="group" aria-label="Atrium views">
          {atriumViews.map((item, index) => (
            <button key={item.key} type="button" aria-pressed={viewKey === item.key} onClick={() => setViewKey(item.key)}>
              <span>{String(index + 1).padStart(2, '0')}</span><strong>{item.label}</strong><ArrowRight aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
    </article>
  )
}

function ExhibitRail() {
  const [active, setActive] = useState<string | null>(null)
  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const mark = window.innerHeight * .45
      const current = atlasProjects.find(project => {
        const rect = document.querySelector(project.href)?.getBoundingClientRect()
        return rect && rect.top <= mark && rect.bottom > mark
      })
      setActive(current?.key ?? null)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [])
  return <nav className="exhibit-rail" aria-label="Exhibition navigation" hidden={!active}>
    {atlasProjects.map(project => <a key={project.key} href={project.href} aria-current={active === project.key ? 'location' : undefined} aria-label={`${project.index} ${project.title}`}><span>{project.index}</span><span className="exhibit-rail__title">{project.title}</span></a>)}
  </nav>
}

function Work() {
  return (
    <section id="work" aria-labelledby="work-heading">
      <div className="work-threshold paper-space" data-scene="index">
        <div className="page-shell work-threshold__grid">
          <div><p className="plate-label">Selected work / 2025–2026</p><h2 id="work-heading">Four systems under pressure.</h2></div>
          <ol>{atlasProjects.map((project) => <li key={project.key}><a href={project.href}><span>{project.index}</span><strong>{project.title}</strong><ThemeGlyph theme={project.key} /><ArrowDownRight aria-hidden="true" /></a></li>)}</ol>
        </div>
      </div>
      <ExhibitRail />
      <ReceiptExhibit /><AutocompleteExhibit /><ClockExhibit /><AtriumExhibit />
    </section>
  )
}

function Questions() {
  return (
    <section id="questions" className="questions paper-space" aria-labelledby="questions-heading">
      <div className="page-shell questions-grid">
        <header><p className="plate-label">Questions I am still working on</p><h2 id="questions-heading">Field notes</h2></header>
        <ol className="question-list">{workingQuestions.map((question) => <li key={question.number} data-scene="note"><span>{question.number}</span><h3>{question.title}</h3></li>)}</ol>
      </div>
    </section>
  )
}

function About() {
  return (
    <section id="about" className="about paper-space" aria-labelledby="about-heading">
      <div className="page-shell about-grid">
        <div className="about-ledger" aria-label="Current practice">
          <span>Now</span>
          <ol>
            <li><strong>Product engineering</strong><small>Interfaces with state you can see</small></li>
            <li><strong>Research software</strong><small>Evidence before confidence</small></li>
            <li><strong>Creative coding</strong><small>Time, type, and interaction</small></li>
          </ol>
        </div>
        <div className="about-copy">
          <p className="plate-label">About / Mihir Duvedi</p><h2 id="about-heading">I care about software people can read.</h2>
          <p className="body-large">I’m a computer science and Spanish student at USC. I build product and research software, with a focus on systems that have to make their state clear.</p>
          <div className="about-links"><a className="primary-link primary-link--dark" href={linkedInUrl} target="_blank" rel="noreferrer">LinkedIn <ExternalLink aria-hidden="true" /></a><a className="text-link text-link--dark" href={githubUrl} target="_blank" rel="noreferrer">GitHub <ExternalLink aria-hidden="true" /></a></div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer dark-space" data-scene="footer"><div className="page-shell footer-grid"><p className="plate-label">Contact</p><h2>Let’s keep talking.</h2><a className="footer-contact" href={linkedInUrl} target="_blank" rel="noreferrer">Find me on LinkedIn <ArrowDownRight aria-hidden="true" /></a><a className="back-to-top" href="#top">Back to top <ArrowDown aria-hidden="true" /></a></div><div className="page-shell footer-signature" aria-hidden="true"><span>Mihir Duvedi</span><span className="footer-signature__caption">A museum of working ideas</span></div></footer>
  )
}

export default function App() {
  useEffect(() => {
    const targetId = decodeURIComponent(window.location.hash.slice(1))
    if (!targetId) return
    let frame = 0; let cancelled = false
    const settleOnTarget = () => {
      if (cancelled) return
      frame = window.requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ block: 'start', behavior: 'instant' }))
    }
    settleOnTarget(); void document.fonts.ready.then(settleOnTarget); window.addEventListener('load', settleOnTarget, { once: true })
    return () => { cancelled = true; window.cancelAnimationFrame(frame); window.removeEventListener('load', settleOnTarget) }
  }, [])
  return <>
    <svg className="filter-definitions" width="0" height="0" aria-hidden="true">
      <defs>
        <filter id="hero-hollow-outline" x="-4%" y="-8%" width="108%" height="116%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius="1.45" result="outside" />
          <feMorphology in="SourceAlpha" operator="erode" radius="1.45" result="inside" />
          <feComposite in="outside" in2="inside" operator="out" result="outline" />
          <feFlood floodColor="#bbc2d0" floodOpacity=".88" result="outline-color" />
          <feComposite in="outline-color" in2="outline" operator="in" />
        </filter>
      </defs>
    </svg>
    <a className="skip-link" href="#main">Skip to main content</a>
    <MotionProvider><ScrollScenes /><Header />
    <main id="main"><Hero /><Orientation /><Work /><Questions /><About /></main>
    <Footer /></MotionProvider>
  </>
}

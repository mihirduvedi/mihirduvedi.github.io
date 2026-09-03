import { ArrowDown, ArrowDownRight, ArrowRight, ExternalLink, Menu, X } from 'lucide-react'
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
import { atlasProjects, workingQuestions, type ThemeKey } from './data'
import { mountLiquidGlass } from './liquidGlass'

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

function useLiveTime() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 250)
    return () => window.clearInterval(timer)
  }, [])
  return now
}

function Header() {
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const sections = useMemo(() => ['top', 'work', 'questions', 'about'], [])
  const active = useActiveSection(sections)

  useEffect(() => {
    document.body.dataset.menuOpen = String(open)
    return () => { delete document.body.dataset.menuOpen }
  }, [open])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return
    return mountLiquidGlass(header, { scale: -48, border: 0.19, mapBlur: 9, fallbackBlur: 13 })
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
      <button className="menu-button" type="button" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen((value) => !value)}>
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}<span>{open ? 'Close' : 'Menu'}</span>
      </button>
      <nav id="primary-navigation" className={`primary-nav ${open ? 'primary-nav--open' : ''}`} aria-label="Primary">
        {([['work', 'Work'], ['questions', 'Questions'], ['about', 'About']] as const).map(([id, label]) => (
          <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined} onClick={close}>{label}</a>
        ))}
      </nav>
    </header>
  )
}

function ProjectIndex() {
  const [selected, setSelected] = useState<ThemeKey>('trust')
  const nodeRefs = useRef<Array<HTMLAnchorElement | null>>([])
  const handleNodeKeyDown = (event: KeyboardEvent<HTMLAnchorElement>, index: number) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    let next = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % atlasProjects.length
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + atlasProjects.length) % atlasProjects.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = atlasProjects.length - 1
    nodeRefs.current[next]?.focus()
  }
  return (
    <div className="project-index">
      <div className="project-index__question">
        <span>Four systems, one question</span>
        <h2>How should software explain itself when the result matters?</h2>
      </div>
      <ol aria-label="Project index">
        {atlasProjects.map((project, index) => (
          <li key={project.key}>
            <a
              ref={(node) => { nodeRefs.current[index] = node }}
              className={selected === project.key ? 'is-selected' : ''}
              href={project.href}
              onFocus={() => setSelected(project.key)}
              onPointerEnter={() => setSelected(project.key)}
              onKeyDown={(event) => handleNodeKeyDown(event, index)}
            >
              <span>{project.index}</span><strong>{project.theme}</strong><small>{project.title}</small><ArrowDownRight aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </div>
  )
}

function Hero() {
  return (
    <section id="top" className="hero dark-space">
      <div className="hero__glow" aria-hidden="true" />
      <div className="page-shell hero__grid">
        <h1 aria-label="Mihir Duvedi"><span>Mihir</span><span className="hero__surname">Duvedi</span></h1>
        <div className="hero__statement">
          <p>I build software for the gap between what a system does and what a person understands.</p>
          <a className="primary-link" href="#work">See the work <ArrowDown aria-hidden="true" /></a>
        </div>
        <ProjectIndex />
      </div>
    </section>
  )
}

function Orientation() {
  return <section className="orientation paper-space"><div className="page-shell"><p>I study computer science and Spanish because I care about how systems carry meaning between machines, between people, and between the two.</p></div></section>
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
    <article id="agent-receipt" className="exhibit exhibit--receipt dark-space">
      <div className="page-shell exhibit-grid">
        <header className="exhibit-header">
          <p className="plate-label">01 / Trust</p><h3>Agent Receipt</h3>
          <p className="exhibit-premise">When an AI agent acts, its operator needs more than a log.</p>
          <p className="exhibit-description">Agent Receipt compares the action trace with the authority a person granted, then makes the difference reviewable.</p>
          <a className="text-link" href={receiptUrl} target="_blank" rel="noreferrer">View source <ExternalLink aria-hidden="true" /></a>
        </header>
        <div className="media-glass receipt-stage"><img src={asset(state.image)} alt={state.alt} loading="lazy" decoding="async" /><p aria-live="polite">{state.note}</p></div>
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
    if ((event.key === 'Enter' || event.key === 'Tab') && suggestions[selected]) { event.preventDefault(); accept(suggestions[selected]) }
    if (event.key === 'Escape') setSelected(0)
  }
  const status = corpusState === 'ready'
    ? `${index.wordCount.toLocaleString()} corpus words indexed in this page.`
    : corpusState === 'loading'
      ? 'Loading the full corpus; a small local index is ready now.'
      : 'The full corpus could not load; the small local index is still available.'

  return (
    <article id="autocomplete" className="exhibit exhibit--autocomplete paper-space">
      <div className="page-shell autocomplete-grid">
        <header className="exhibit-header">
          <p className="plate-label">02 / Prediction</p><h3>Autocomplete</h3>
          <p className="exhibit-premise">A useful prediction should be quick to inspect and easy to reject.</p>
          <p className="exhibit-description">This browser study uses the project’s real Pride and Prejudice vocabulary and its Trie-plus-bigram candidate rule. The full engine adds a character LSTM to rerank the same candidates.</p>
          <a className="text-link text-link--dark" href={autocompleteUrl} target="_blank" rel="noreferrer">Open the full engine <ExternalLink aria-hidden="true" /></a>
        </header>
        <div className="prediction-stage">
          <label htmlFor="prediction-input">Try a phrase</label>
          <input id="prediction-input" value={value} maxLength={120} autoComplete="off" spellCheck="false" aria-describedby="prediction-help prediction-status" onChange={(event) => setValue(event.target.value)} onKeyDown={handleKeyDown} />
          <p id="prediction-help">Suggestions must begin with the unfinished word. Use arrows to choose; press Enter or Tab to accept.</p>
          <div className="suggestion-list" role="group" aria-label="Suggestions">
            {suggestions.map((word, suggestionIndex) => (
              <button key={word} type="button" aria-pressed={selected === suggestionIndex} onPointerEnter={() => setSelected(suggestionIndex)} onClick={() => accept(word)}>
                <span>{String(suggestionIndex + 1).padStart(2, '0')}</span><strong>{word}</strong><ArrowRight aria-hidden="true" />
              </button>
            ))}
            {!suggestions.length && <p className="suggestion-empty">No corpus word starts with “{fragment}.” Keep typing or try another prefix.</p>}
          </div>
          <p id="prediction-status" className="prediction-status" aria-live="polite">{status}</p>
        </div>
      </div>
    </article>
  )
}

function ClockExhibit() {
  const now = useLiveTime()
  return (
    <article id="clock-museum" className="exhibit exhibit--clocks dark-space">
      <div className="page-shell clock-grid">
        <header className="exhibit-header">
          <p className="plate-label">03 / Time</p><h3>Clock Museum</h3>
          <p className="exhibit-premise">This hourglass turns the whole day into one slow pour.</p>
          <p className="exhibit-description">It follows your local time: the day so far settles below, while the hours left stay above.</p>
          <a className="text-link" href={githubUrl} target="_blank" rel="noreferrer">Browse my GitHub <ExternalLink aria-hidden="true" /></a>
        </header>
        <div className="dayglass-stage"><Dayglass now={now} /></div>
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
    <article id="atrium" className="exhibit exhibit--atrium dark-space">
      <div className="page-shell atrium-grid">
        <header className="exhibit-header">
          <p className="plate-label">04 / Recovery</p><h3>Atrium</h3>
          <p className="exhibit-premise">A workout should survive the moment the network or the app does not.</p>
          <p className="exhibit-description">Atrium keeps an active session on the device, restores interrupted work, and reconciles it with the training record when the app returns.</p>
        </header>
        <div className="atrium-stage">
          <div className="atrium-screen"><img src={asset(current.image)} alt={current.alt} loading="lazy" decoding="async" /></div>
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

function Work() {
  return (
    <section id="work" aria-labelledby="work-heading">
      <div className="work-threshold paper-space">
        <div className="page-shell work-threshold__grid">
          <div><p className="plate-label">Selected work / 2025–2026</p><h2 id="work-heading">Four systems under pressure.</h2></div>
          <ol>{atlasProjects.map((project) => <li key={project.key}><a href={project.href}><span>{project.index}</span><strong>{project.title}</strong><ArrowDownRight aria-hidden="true" /></a></li>)}</ol>
        </div>
      </div>
      <ReceiptExhibit /><AutocompleteExhibit /><ClockExhibit /><AtriumExhibit />
    </section>
  )
}

function Questions() {
  return (
    <section id="questions" className="questions paper-space" aria-labelledby="questions-heading">
      <div className="page-shell questions-grid">
        <header><p className="plate-label">Questions I am still working on</p><h2 id="questions-heading">Field notes</h2></header>
        <ol className="question-list">{workingQuestions.map((question) => <li key={question.number}><span>{question.number}</span><h3>{question.title}</h3></li>)}</ol>
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
    <footer className="site-footer dark-space"><div className="page-shell footer-grid"><p className="plate-label">Contact</p><h2>Let’s keep talking.</h2><a className="footer-contact" href={linkedInUrl} target="_blank" rel="noreferrer">Find me on LinkedIn <ArrowDownRight aria-hidden="true" /></a><a className="back-to-top" href="#top">Back to top <ArrowDown aria-hidden="true" /></a></div></footer>
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
    <Header />
    <main id="main"><Hero /><Orientation /><Work /><Questions /><About /></main>
    <Footer />
  </>
}

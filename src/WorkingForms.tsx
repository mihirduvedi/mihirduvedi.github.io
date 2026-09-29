import { ArrowDownRight } from 'lucide-react'
import { useState } from 'react'
import { atlasProjects, type ThemeKey } from './data'
import GlassSculpture from './GlassSculpture'

const forms: Record<ThemeKey, { title: string; description: string; metaphor: string; steps: string[] }> = {
  trust: { title: 'A boundary you can inspect.', description: 'The glass boundary stands for the permission given to an agent. Agent Receipt checks whether its actions stayed inside it.', metaphor: 'An inspectable boundary', steps: ['Permission', 'Action', 'Evidence'] },
  prediction: { title: 'Room for the next possibility.', description: 'Three glass ribbons unfold from one starting point. Autocomplete makes the same move from a word fragment to possible continuations.', metaphor: 'One fragment, many paths', steps: ['A fragment', 'Possibilities', 'Your choice'] },
  time: { title: 'A day, made visible.', description: 'Two chambers meet at a narrow present. Clock Museum makes the same passage visible as the day settles into an hourglass.', metaphor: 'Hours passing through the present', steps: ['Hours left', 'This moment', 'Day so far'] },
  recovery: { title: 'A way back to where you were.', description: 'The line bends away and returns without breaking. Atrium carries that idea into a workout you can resume after an interruption.', metaphor: 'A continuous way back', steps: ['Interrupted', 'Preserved', 'Resumed'] },
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
      <GlassSculpture theme={selected} />
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

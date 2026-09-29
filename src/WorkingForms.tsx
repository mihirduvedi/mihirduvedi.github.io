import { ArrowDownRight } from 'lucide-react'
import { useState } from 'react'
import { atlasProjects, type ThemeKey } from './data'
import GlassSculpture from './GlassSculpture'

const forms: Record<ThemeKey, { title: string; description: string; metaphor: string; steps: string[] }> = {
  trust: { title: 'A boundary you can inspect.', description: 'The glass boundary stands for the permission given to an agent. Agent Receipt checks whether its actions stayed inside it.', metaphor: 'An inspectable boundary', steps: ['Permission', 'Action', 'Evidence'] },
  prediction: { title: 'Room for the next possibility.', description: 'One glass thread weaves through three possibilities. The knot is a study of the choices Autocomplete opens from a single word fragment.', metaphor: 'One fragment, many paths', steps: ['A fragment', 'Possibilities', 'Your choice'] },
  time: { title: 'A day, made visible.', description: 'Three glass orbits turn at different rhythms. They echo the cycles of a day that Clock Museum translates into light, shadow, and passing sand.', metaphor: 'Different rhythms, one day', steps: ['Hours left', 'This moment', 'Day so far'] },
  recovery: { title: 'A way back to where you were.', description: 'The line bends away and returns without breaking. Atrium carries that idea into a workout you can resume after an interruption.', metaphor: 'A continuous way back', steps: ['Interrupted', 'Preserved', 'Resumed'] },
}

export function ThemeGlyph({ theme }: { theme: ThemeKey }) {
  return <svg className="theme-glyph" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
    {theme === 'trust' && <><ellipse cx="24" cy="24" rx="17" ry="11" transform="rotate(-35 24 24)" /><ellipse cx="24" cy="24" rx="11" ry="17" transform="rotate(-35 24 24)" /><circle cx="24" cy="24" r="17" /></>}
    {theme === 'prediction' && <>{[8, 16, 24, 32, 40].map(y => <path key={y} d={`M6 24 C24 24 22 ${y} 41 ${y}`} />)}</>}
    {theme === 'time' && <><circle cx="24" cy="24" r="18"/><ellipse cx="24" cy="24" rx="13" ry="8" transform="rotate(-40 24 24)"/><ellipse cx="24" cy="24" rx="5" ry="9" transform="rotate(25 24 24)"/></>}
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

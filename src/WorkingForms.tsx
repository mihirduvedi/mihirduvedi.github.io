import { ArrowDownRight } from 'lucide-react'
import { useState } from 'react'
import { atlasProjects, type ThemeKey } from './data'
import GlassSculpture from './GlassSculpture'

const forms: Record<ThemeKey, { title: string; description: string; metaphor: string; steps: string[] }> = {
  trust: { title: 'Checking and repairing an agent’s work.', description: 'Agent Receipt checks what an agent did against what it was allowed to do. Counterstep follows up by repairing what’s still reversible. The ring marks the permission boundary they share.', metaphor: 'Permission and action', steps: ['Permission', 'Action', 'Evidence'] },
  prediction: { title: 'What comes after “pr”?', description: 'Autocomplete suggests words from the letters you’ve typed. The knot takes one thread through several turns, a loose picture of those possibilities.', metaphor: 'Possible next words', steps: ['Your letters', 'Possible words', 'Your choice'] },
  time: { title: 'Twenty-four hours of sand.', description: 'An hourglass in Clock Museum takes a whole day to empty. The rings are another way of looking at time, with several cycles running together.', metaphor: 'Hours within a day', steps: ['Hours left', 'This moment', 'Day so far'] },
  recovery: { title: 'Picking up an unfinished workout.', description: 'Atrium saves an unfinished workout so you can come back to it. The loop bends away and returns to the same path.', metaphor: 'Back to the same workout', steps: ['Stopped', 'Saved', 'Resumed'] },
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
    <div className="working-forms__label"><span>Five projects, four shapes</span><span aria-hidden="true">01–04</span></div>
    <div className="working-forms__art" role="img" aria-label={`${project.theme} sculpture. ${form.metaphor}`}>
      <GlassSculpture theme={selected} />
      <div className="form-registration form-registration--tl" aria-hidden="true" />
      <div className="form-registration form-registration--br" aria-hidden="true" />
      <span className="form-axis" aria-hidden="true">{form.metaphor}</span>
      <span className="form-project" aria-hidden="true">{project.index} / {project.title}{project.companion && ` & ${project.companion.title}`}</span>
    </div>
    <div className="form-controls" role="group" aria-label="Choose a project">
      {atlasProjects.map(item => <button key={item.key} type="button" aria-pressed={selected === item.key} onClick={() => setSelected(item.key)}><span>{item.index}</span>{' '}{item.theme}</button>)}
    </div>
    <div className="form-caption" aria-live="polite">
      <ol className="form-sequence" aria-label={`${project.title} steps`}>{form.steps.map(step => <li key={step}>{step}</li>)}</ol>
      <div><h2>{form.title}</h2><p>{form.description}</p></div>
      <div className="form-project-links"><a href={project.href}><span>See {project.title}</span><ArrowDownRight aria-hidden="true" /></a>{project.companion && <a href={project.companion.href}><span>See {project.companion.title}</span><ArrowDownRight aria-hidden="true" /></a>}</div>
    </div>
  </div>
}

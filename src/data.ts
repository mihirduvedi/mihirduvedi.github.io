export type ThemeKey = 'trust' | 'prediction' | 'time' | 'recovery'

export type AtlasProject = {
  key: ThemeKey
  index: string
  title: string
  theme: string
  href: string
  companion?: { title: string; href: string }
}

export const atlasProjects: AtlasProject[] = [
  {
    key: 'trust',
    index: '01',
    title: 'Agent Receipt',
    theme: 'Trust',
    href: '#agent-receipt',
    companion: { title: 'Counterstep', href: '#counterstep' },
  },
  {
    key: 'prediction',
    index: '02',
    title: 'Autocomplete',
    theme: 'Prediction',
    href: '#autocomplete',
  },
  {
    key: 'time',
    index: '03',
    title: 'Clock Museum',
    theme: 'Time',
    href: '#clock-museum',
  },
  {
    key: 'recovery',
    index: '04',
    title: 'Atrium',
    theme: 'Recovery',
    href: '#atrium',
  },
]

export const workingQuestions = [
  {
    number: '1',
    title: 'What would make an activity log actually explain what happened?',
  },
  {
    number: '2',
    title: 'When should an app explain what it’s doing without waiting for someone to ask?',
  },
  {
    number: '3',
    title: 'How would I build an app if I started with what could go wrong?',
  },
]

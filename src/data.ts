export type ThemeKey = 'trust' | 'prediction' | 'time' | 'recovery'

export type AtlasProject = {
  key: ThemeKey
  index: string
  title: string
  theme: string
  href: string
}

export const atlasProjects: AtlasProject[] = [
  {
    key: 'trust',
    index: '01',
    title: 'Agent Receipt',
    theme: 'Trust',
    href: '#agent-receipt',
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
    title: 'What makes a log feel like an explanation?',
  },
  {
    number: '2',
    title: 'When should software explain itself without being asked?',
  },
  {
    number: '3',
    title: 'What changes when we design the failure first?',
  },
]

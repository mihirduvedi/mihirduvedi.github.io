import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const MotionContext = createContext({ paused: true, reduced: false, toggle: () => {} })

export function MotionProvider({ children }: { children: ReactNode }) {
  const [reduced, setReduced] = useState(() => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [paused, setPaused] = useState(() => {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
    try { return window.localStorage.getItem('portfolio-motion') === 'paused' } catch { return false }
  })
  useEffect(() => {
    document.documentElement.dataset.motion = paused ? 'paused' : 'running'
    return () => { delete document.documentElement.dataset.motion }
  }, [paused])
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { setReduced(preference.matches); if (preference.matches) setPaused(true) }
    preference.addEventListener('change', update)
    return () => preference.removeEventListener('change', update)
  }, [])
  const toggle = () => setPaused((previous) => {
    try { window.localStorage.setItem('portfolio-motion', previous ? 'running' : 'paused') } catch { /* Storage is optional. */ }
    return !previous
  })
  return <MotionContext.Provider value={{ paused, reduced, toggle }}>{children}</MotionContext.Provider>
}

export const useMotion = () => useContext(MotionContext)

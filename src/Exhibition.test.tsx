import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { MeaningBridge, ScrollScenes } from './ScrollScenes'
import { MotionProvider, useMotion } from './motion'
import WorkingForms from './WorkingForms'

afterEach(() => { localStorage.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('working forms exhibition', () => {
  it('connects every form selection to the correct project and description', () => {
    render(<App />)
    const group = screen.getByRole('group', { name: 'Explore an idea' })
    const entries = [
      ['01 Trust', 'Agent Receipt', '#agent-receipt', /A boundary you can inspect/],
      ['02 Prediction', 'Autocomplete', '#autocomplete', /Room for the next possibility/],
      ['03 Time', 'Clock Museum', '#clock-museum', /A day, made visible/],
      ['04 Recovery', 'Atrium', '#atrium', /A way back to where you were/],
    ] as const
    for (const [name, project, target, title] of entries) {
      fireEvent.click(within(group).getByRole('button', { name }))
      expect(within(group).getAllByRole('button').filter(button => button.getAttribute('aria-pressed') === 'true')).toHaveLength(1)
      expect(screen.getByRole('link', { name: `Explore ${project}` })).toHaveAttribute('href', target)
      expect(screen.getByRole('heading', { name: title })).toBeInTheDocument()
      expect(screen.getByRole('list', { name: `${project} concept` }).querySelectorAll('li')).toHaveLength(3)
      expect(document.querySelector('.form-caption p')).toHaveTextContent(project)
    }
  })

  it('pauses motion, retains explicit choice, and leaves the index usable', () => {
    const view = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }))
    expect(document.documentElement).toHaveAttribute('data-motion', 'paused')
    fireEvent.click(screen.getByRole('button', { name: '03 Time' }))
    expect(screen.getByRole('link', { name: 'Explore Clock Museum' })).toBeInTheDocument()
    view.unmount()
    render(<App />)
    expect(screen.getByRole('button', { name: 'Enable motion' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Enable motion' }))
    expect(document.documentElement).toHaveAttribute('data-motion', 'running')
  })

  it('starts paused when the operating system requests reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} })))
    render(<App />)
    expect(screen.getByRole('button', { name: 'Reduced motion is enabled in your system settings' })).toBeDisabled()
    expect(document.documentElement).toHaveAttribute('data-motion', 'paused')
  })

  it('previews the full day and returns to the actual local clock', () => {
    render(<App />)
    const slider = screen.getByRole('slider', { name: 'Explore a different hour' })
    fireEvent.change(slider, { target: { value: '0' } })
    expect(slider).toHaveAttribute('aria-valuetext', '00:00')
    fireEvent.change(slider, { target: { value: '720' } })
    expect(document.querySelector('.dayglass')).toHaveAttribute('data-progress', '0.500000')
    expect(screen.getByText('Preview time')).toBeInTheDocument()
    expect(slider).toHaveAttribute('aria-valuetext', '12:00')
    fireEvent.change(slider, { target: { value: '1439' } })
    expect(Number(document.querySelector('.dayglass')?.getAttribute('data-progress'))).toBeGreaterThan(.999)
    fireEvent.click(screen.getByRole('button', { name: 'Return to local time' }))
    expect(screen.getByText('Your local time')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Following your clock' })).toBeDisabled()
  })

  it('renders candidate branches from the real suggestion set and clears them for an empty result', () => {
    render(<App />)
    const input = screen.getByRole('textbox', { name: 'Try a phrase' })
    fireEvent.change(input, { target: { value: 'She was very pr' } })
    expect(document.querySelector('.prediction-root strong')).toHaveTextContent('pr')
    const buttons = within(screen.getByRole('group', { name: 'Suggestions' })).getAllByRole('button')
    expect(document.querySelectorAll('.prediction-branches path')).toHaveLength(buttons.length)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
    fireEvent.change(input, { target: { value: 'zzzzq' } })
    expect(document.querySelector('.prediction-branches')).not.toBeInTheDocument()
    expect(screen.getByText(/No corpus word starts with/)).toBeInTheDocument()
  })
  it('lets keyboard users leave autocomplete in either direction', () => {
    render(<App />)
    const input = screen.getByRole('textbox', { name: 'Try a phrase' })
    fireEvent.change(input, { target: { value: 'She was very pr' } })
    expect(fireEvent.keyDown(input, { key: 'Tab', shiftKey: true })).toBe(true)
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(false)
    expect(input.getAttribute('value')).toMatch(/ $/)
    expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(true)
  })

})

function MotionSwitch() {
  const { paused, toggle } = useMotion()
  return <button onClick={toggle}>{paused ? 'Resume scenes' : 'Pause scenes'}</button>
}

describe('scroll choreography preferences', () => {
  it('responds to native scroll, restores static art on pause, and cleans up on unmount', () => {
    let top = 600
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(() => ({
      x: 0, y: top, top, bottom: top + 300, left: 0, right: 1200, width: 1200, height: 300, toJSON() {},
    }))
    const frames = new Map<number, FrameRequestCallback>()
    let nextFrame = 0
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
    const flush = () => act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(16)) })
    const view = render(<MotionProvider><ScrollScenes /><MotionSwitch /><section data-scene="orientation"><p>The content stays readable.</p><MeaningBridge /></section></MotionProvider>)
    const path = document.querySelector('.meaning-bridge__threads path')!
    const initial = path.getAttribute('d')
    top = 100
    fireEvent.scroll(window); flush()
    expect(path.getAttribute('d')).not.toBe(initial)
    expect(screen.getByText('The content stays readable.')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Pause scenes' }))
    expect(document.documentElement).not.toHaveAttribute('data-scroll-scenes')
    const paused = path.getAttribute('d')
    top = 400
    fireEvent.scroll(window); flush()
    expect(path.getAttribute('d')).toBe(paused)
    fireEvent.click(screen.getByRole('button', { name: 'Resume scenes' }))
    expect(document.documentElement).toHaveAttribute('data-scroll-scenes', 'on')
    view.unmount()
    expect(document.documentElement).not.toHaveAttribute('data-scroll-scenes')
    expect(frames.size).toBe(0)
  })
})

describe('static sculpture selection', () => {
  it('redraws the geometry immediately when another idea is selected while paused', () => {
    localStorage.setItem('portfolio-motion', 'paused')
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 0, top: 0, bottom: 400, left: 0, right: 600, width: 600, height: 400, toJSON() {} })
    let geometry = 0, draws = 0
    const context = {
      clearRect() { geometry = 0; draws++ }, setTransform() {}, beginPath() {}, stroke() {},
      moveTo(x: number, y: number) { geometry += x * .3 + y * .7 },
      lineTo(x: number, y: number) { geometry += x * .3 + y * .7 },
    }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D)
    render(<MotionProvider><WorkingForms /></MotionProvider>)
    const firstGeometry = geometry, firstDraws = draws
    fireEvent.click(screen.getByRole('button', { name: '03 Time' }))
    expect(draws).toBeGreaterThan(firstDraws)
    expect(geometry).not.toBe(firstGeometry)
    expect(screen.getByRole('link', { name: 'Explore Clock Museum' })).toBeInTheDocument()
  })
})

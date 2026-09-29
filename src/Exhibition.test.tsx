import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionProvider } from './motion'
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

describe('scroll choreography preferences', () => {
  it('reverts its timelines on pause and cleans up all triggers on unmount', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('min-width: 901px'), media: query, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }))
    const view = render(<App />)
    expect(ScrollTrigger.getAll().length).toBeGreaterThan(0)
    fireEvent.click(screen.getByRole('button', { name: 'Pause motion' }))
    expect(ScrollTrigger.getAll()).toHaveLength(0)
    expect(document.documentElement).not.toHaveAttribute('data-scroll-scenes')
    expect(screen.getByRole('heading', { name: 'Agent Receipt' })).toBeVisible()
    expect(document.querySelector('.title-word > span')?.getAttribute('style') || '').not.toContain('transform')
    fireEvent.click(screen.getByRole('button', { name: 'Enable motion' }))
    expect(ScrollTrigger.getAll().length).toBeGreaterThan(0)
    view.unmount()
    expect(ScrollTrigger.getAll()).toHaveLength(0)
    expect(document.documentElement).not.toHaveAttribute('data-scroll-scenes')
  })
})

describe('glass fallback selection', () => {
  it('keeps every idea and destination usable with no WebGL and motion paused', async () => {
    localStorage.setItem('portfolio-motion', 'paused')
    render(<MotionProvider><WorkingForms /></MotionProvider>)
    await waitFor(() => expect(document.querySelector('.glass-sculpture')).toHaveAttribute('data-renderer', 'fallback'))
    const initial = document.querySelector('.glass-fallback')?.innerHTML
    fireEvent.click(screen.getByRole('button', { name: '03 Time' }))
    expect(document.querySelector('.glass-sculpture')).toHaveAttribute('data-theme', 'time')
    expect(document.querySelector('.glass-fallback')?.innerHTML).not.toBe(initial)
    expect(screen.getByRole('link', { name: 'Explore Clock Museum' })).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute('data-motion', 'paused')
  })
})

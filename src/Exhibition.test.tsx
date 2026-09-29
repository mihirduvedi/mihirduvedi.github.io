import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

afterEach(() => { localStorage.clear(); vi.unstubAllGlobals() })

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

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MotionProvider, useMotion } from './motion'
import GlassSculpture from './GlassSculpture'

const driver = vi.hoisted(() => ({ select: vi.fn(), pause: vi.fn(), dispose: vi.fn(), fail: null as null | (() => void) }))
vi.mock('./glassRenderer', () => ({ createGlassRenderer: vi.fn((_canvas, _theme, _paused, fail) => { driver.fail = fail; return driver }) }))
function Switch() { const { toggle } = useMotion(); return <button onClick={toggle}>Toggle motion</button> }
afterEach(() => { localStorage.clear(); vi.clearAllMocks() })

describe('glass renderer lifecycle', () => {
  it('keeps one renderer through selection and pause, and disposes it on unmount', async () => {
    const view = render(<MotionProvider><Switch /><GlassSculpture theme="trust" /></MotionProvider>)
    await waitFor(() => expect(document.querySelector('.glass-sculpture')).toHaveAttribute('data-renderer', 'webgl'))
    view.rerender(<MotionProvider><Switch /><GlassSculpture theme="time" /></MotionProvider>)
    expect(driver.select).toHaveBeenLastCalledWith('time')
    fireEvent.click(screen.getByRole('button', { name: 'Toggle motion' }))
    expect(driver.pause).toHaveBeenLastCalledWith(true)
    expect(driver.dispose).not.toHaveBeenCalled()
    view.unmount()
    expect(driver.dispose).toHaveBeenCalledOnce()
  })
  it('restores the selected static form when the graphics context fails', async () => {
    const view = render(<MotionProvider><GlassSculpture theme="recovery" /></MotionProvider>)
    await waitFor(() => expect(document.querySelector('.glass-sculpture')).toHaveAttribute('data-renderer', 'webgl'))
    const { act } = await import('@testing-library/react')
    act(() => driver.fail?.())
    expect(document.querySelector('.glass-sculpture')).toHaveAttribute('data-renderer', 'fallback')
    expect(document.querySelector('.glass-sculpture')).toHaveAttribute('data-theme', 'recovery')
    expect(document.querySelector('.glass-fallback path')).toBeInTheDocument()
    expect(driver.dispose).toHaveBeenCalledOnce()
    view.unmount()
    expect(driver.dispose).toHaveBeenCalledOnce()
  })
})

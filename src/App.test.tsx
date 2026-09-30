import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import Dayglass from './Dayglass'
import { createAutocompleteIndex, getSuggestions } from './autocomplete'

describe('portfolio homepage', () => {
  it('renders the core narrative and five projects', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /Mihir Duvedi/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Skip to main content/ })).toHaveAttribute('href', '#main')
    expect(screen.getByRole('heading', { level: 3, name: 'Agent Receipt' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Counterstep' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Counterstep' })).toHaveAttribute('href', '#counterstep')
    expect(screen.getByRole('heading', { level: 3, name: 'Autocomplete' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Clock Museum' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Atrium' })).toBeInTheDocument()
    expect(screen.queryByText(/Mihir Duvedi \/ Los Angeles/i)).not.toBeInTheDocument()
  })

  it('lets visitors inspect the Agent Receipt states', () => {
    render(<App />)
    const controls = screen.getByRole('group', { name: 'Agent Receipt views' })
    const gapButton = within(controls).getByRole('button', { name: /Missing evidence/ })
    fireEvent.click(gapButton)
    expect(gapButton).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByAltText(/conclusion as uncertain/i)).toBeInTheDocument()
  })

  it('only returns candidates that begin with the unfinished prefix', () => {
    const corpus = createAutocompleteIndex('all almost alone already allow always also altar altered other words')
    const suggestions = getSuggestions('I build systems al', corpus)
    expect(suggestions).toHaveLength(4)
    expect(suggestions.every((word) => word.startsWith('al'))).toBe(true)
    expect(getSuggestions('quantum zebra', corpus)).toEqual([])
  })

  it('accepts a valid prefix completion and shows an honest empty state', () => {
    render(<App />)
    const input = screen.getByLabelText('Try a phrase')
    fireEvent.change(input, { target: { value: 'I build systems al' } })
    const choices = within(screen.getByRole('group', { name: 'Suggestions' })).getAllByRole('button')
    expect(choices).toHaveLength(4)
    expect(choices.every((button) => button.textContent?.replace(/^\d+/, '').toLowerCase().startsWith('al'))).toBe(true)
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(input.getAttribute('value')).toMatch(/^I build systems al[a-z']+ $/i)

    fireEvent.change(input, { target: { value: 'quantum zebra' } })
    expect(screen.getByText(/No match for “zebra”/)).toBeInTheDocument()
  })

  it('renders one 24-hour sand clock and changes the Atrium view', () => {
    render(<App />)
    expect(screen.getByRole('figure', { name: /24-hour hourglass/i })).toBeInTheDocument()
    expect(document.querySelectorAll('.dayglass__vessel')).toHaveLength(2)
    expect(document.querySelector('.dayglass__live-sand')).toBeInTheDocument()
    expect(document.querySelectorAll('.atrium-screen::before')).toHaveLength(0)

    const progress = screen.getByRole('button', { name: /Progress/ })
    fireEvent.click(progress)
    expect(progress).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByAltText(/Atrium’s Progress screen/i)).toBeInTheDocument()
  })

  it('maps the full 24-hour day to the clock state', () => {
    const { rerender } = render(<Dayglass now={new Date(2026, 8, 2, 0, 0, 0)} />)
    expect(document.querySelector('.dayglass')).toHaveAttribute('data-progress', '0.000000')
    expect(document.querySelector('.dayglass')).toHaveAttribute('data-flowing', 'false')
    const midnightUpper = document.querySelector('.dayglass')?.getAttribute('data-upper-level')
    const midnightLower = document.querySelector('.dayglass')?.getAttribute('data-lower-level')

    rerender(<Dayglass now={new Date(2026, 8, 2, 12, 0, 0)} />)
    expect(document.querySelector('.dayglass')).toHaveAttribute('data-progress', '0.500000')
    expect(document.querySelector('.dayglass')).toHaveAttribute('data-flowing', 'true')
    const noonUpper = document.querySelector('.dayglass')?.getAttribute('data-upper-level')
    const noonLower = document.querySelector('.dayglass')?.getAttribute('data-lower-level')
    expect(Number(noonUpper)).toBeGreaterThan(Number(midnightUpper))
    expect(Number(noonLower)).toBeLessThan(Number(midnightLower))
    expect(document.querySelector('.dayglass__sand-thread')).toBeInTheDocument()
    expect(document.querySelectorAll('.dayglass__grain')).toHaveLength(8)
    expect(document.querySelector('.dayglass__falling-grains')).toBeNull()

    rerender(<Dayglass now={new Date(2026, 8, 2, 23, 59, 59)} />)
    expect(Number(document.querySelector('.dayglass')?.getAttribute('data-progress'))).toBeGreaterThan(.9999)
    expect(document.querySelector('.dayglass')).toHaveAttribute('data-flowing', 'true')
    expect(Number(document.querySelector('.dayglass')?.getAttribute('data-upper-level'))).toBeGreaterThan(Number(noonUpper))
    expect(Number(document.querySelector('.dayglass')?.getAttribute('data-lower-level'))).toBeLessThan(Number(noonLower))
  })

  it('uses a composited silhouette outline for the hollow surname', () => {
    render(<App />)
    expect(document.querySelector('.hero__surname')).toHaveTextContent('Duvedi')
    expect(document.querySelector('#hero-hollow-outline feMorphology[operator="dilate"]')).toBeInTheDocument()
    expect(document.querySelector('#hero-hollow-outline feComposite[operator="out"]')).toBeInTheDocument()
  })

  it('keeps field-note numbering simple and external links limited to GitHub and LinkedIn', () => {
    render(<App />)
    const questionList = document.querySelector('.question-list')
    expect(questionList?.querySelectorAll('li > span')).toHaveLength(3)
    expect(questionList?.textContent).not.toMatch(/TRUST · SYSTEMS|LANGUAGE · LEARNING|RELIABILITY/i)

    const externalLinks = screen.getAllByRole('link').filter((link) => link.getAttribute('target') === '_blank')
    expect(externalLinks.every((link) => /github\.com|linkedin\.com/.test(link.getAttribute('href') ?? ''))).toBe(true)
    expect(document.querySelector('a[href*="resume"], a[href^="mailto:"]')).toBeNull()
    expect(screen.queryByText(/Teaching English to Spanish-speaking adults/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/USC · Computer science \+ Spanish · 2026/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Playground' })).not.toBeInTheDocument()
  })
})

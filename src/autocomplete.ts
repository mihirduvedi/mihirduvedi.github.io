export type AutocompleteIndex = {
  vocabulary: string[]
  frequencies: Map<string, number>
  followers: Map<string, Map<string, number>>
  wordCount: number
}

const FALLBACK_CORPUS = `
  She was very proud and very pretty. She was prepared to speak plainly.
  All people almost always allow another answer. Already alone, altogether alert.
  Pride and prejudice shaped every conversation. Elizabeth answered Darcy carefully.
  A system should explain itself clearly. A person should understand the result.
  Build software that stays legible. Design interfaces that preserve control.
`

export function tokenizeCorpus(text: string) {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? []
}

export function createAutocompleteIndex(corpus: string): AutocompleteIndex {
  const words = tokenizeCorpus(corpus)
  const frequencies = new Map<string, number>()
  const followers = new Map<string, Map<string, number>>()

  words.forEach((word, index) => {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1)
    const previous = words[index - 1]
    if (!previous) return
    const nextWords = followers.get(previous) ?? new Map<string, number>()
    nextWords.set(word, (nextWords.get(word) ?? 0) + 1)
    followers.set(previous, nextWords)
  })

  const vocabulary = [...frequencies.keys()].sort((a, b) => {
    const byFrequency = (frequencies.get(b) ?? 0) - (frequencies.get(a) ?? 0)
    return byFrequency || a.localeCompare(b)
  })

  return { vocabulary, frequencies, followers, wordCount: words.length }
}

export const fallbackAutocompleteIndex = createAutocompleteIndex(FALLBACK_CORPUS)

export function getInputContext(value: string) {
  const words = tokenizeCorpus(value)
  const hasOpenPrefix = !/\s$/.test(value) && /[a-z']$/i.test(value)
  const fragment = hasOpenPrefix ? words.at(-1) ?? '' : ''
  const previous = hasOpenPrefix ? words.at(-2) ?? '' : words.at(-1) ?? ''
  return { fragment, previous }
}

export function getSuggestions(
  value: string,
  index: AutocompleteIndex = fallbackAutocompleteIndex,
  limit = 4,
) {
  if (!value.trim() || limit <= 0) return []
  const { fragment, previous } = getInputContext(value)
  const contextual = index.followers.get(previous)

  const candidates = index.vocabulary
    .filter((word) => (!fragment || word.startsWith(fragment)) && word !== fragment)
    .map((word) => ({
      word,
      frequency: index.frequencies.get(word) ?? 0,
      context: contextual?.get(word) ?? 0,
    }))
    .sort((a, b) => {
      const byContext = b.context - a.context
      const byFrequency = b.frequency - a.frequency
      const byLength = a.word.length - b.word.length
      return byContext || byFrequency || byLength || a.word.localeCompare(b.word)
    })

  return candidates.slice(0, limit).map(({ word }) => word)
}

export function acceptSuggestion(value: string, suggestion: string) {
  const match = value.match(/[a-z]+(?:'[a-z]+)?$/i)
  const start = match ? value.length - match[0].length : value.length
  return `${value.slice(0, start)}${suggestion} `
}

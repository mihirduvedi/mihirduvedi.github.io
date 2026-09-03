type LiquidGlassOptions = {
  scale?: number
  border?: number
  mapBlur?: number
  fallbackBlur?: number
}

const SVG_NS = 'http://www.w3.org/2000/svg'
let instance = 0

function supportsBackdropRefraction() {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false
  const userAgent = navigator.userAgent
  const isFirefox = /Firefox/i.test(userAgent)
  const isSafari = /Safari/i.test(userAgent) && !/Chrome|Chromium|Edg/i.test(userAgent)
  return !isFirefox && !isSafari && CSS.supports('backdrop-filter', 'url(#liquid-glass-test)')
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.arcTo(x + width, y, x + width, y + height, r)
  context.arcTo(x + width, y + height, x, y + height, r)
  context.arcTo(x, y + height, x, y, r)
  context.arcTo(x, y, x + width, y, r)
  context.closePath()
}

function makeDisplacementMap(
  width: number,
  height: number,
  radius: number,
  padding: number,
  border: number,
  mapBlur: number,
) {
  const canvas = document.createElement('canvas')
  canvas.width = width + padding * 2
  canvas.height = height + padding * 2
  const context = canvas.getContext('2d')
  if (!context) return ''

  context.fillStyle = 'rgb(128, 128, 128)'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.save()
  context.translate(padding, padding)
  roundedRect(context, 0, 0, width, height, radius)
  context.clip()

  const horizontal = context.createLinearGradient(0, 0, width, 0)
  horizontal.addColorStop(0, 'rgb(0, 0, 0)')
  horizontal.addColorStop(1, 'rgb(255, 0, 0)')
  context.fillStyle = horizontal
  context.fillRect(0, 0, width, height)

  const vertical = context.createLinearGradient(0, 0, 0, height)
  vertical.addColorStop(0, 'rgb(0, 0, 0)')
  vertical.addColorStop(1, 'rgb(0, 0, 255)')
  context.globalCompositeOperation = 'difference'
  context.fillStyle = vertical
  context.fillRect(0, 0, width, height)
  context.globalCompositeOperation = 'source-over'

  const inset = border * Math.min(width, height)
  context.filter = `blur(${mapBlur}px)`
  context.fillStyle = 'rgba(128, 128, 128, .96)'
  roundedRect(
    context,
    inset,
    inset,
    width - inset * 2,
    height - inset * 2,
    Math.max(radius - inset, 2),
  )
  context.fill()
  context.restore()
  return canvas.toDataURL()
}

/**
 * Gives one DOM surface a refractive edge in Chromium and a restrained blur
 * fallback elsewhere. The displacement-map approach is adapted from the
 * MIT-licensed deepika-builds/liquid-glass reference implementation.
 */
export function mountLiquidGlass(
  element: HTMLElement,
  {
    scale = -52,
    border = 0.2,
    mapBlur = 10,
    fallbackBlur = 14,
  }: LiquidGlassOptions = {},
) {
  const previousBackdrop = element.style.backdropFilter
  const previousWebkitBackdrop = element.style.getPropertyValue('-webkit-backdrop-filter')

  if (!supportsBackdropRefraction()) {
    const fallback = `blur(${fallbackBlur}px) saturate(1.22)`
    element.style.backdropFilter = fallback
    element.style.setProperty('-webkit-backdrop-filter', fallback)
    element.dataset.glassMode = 'frosted'
    return () => {
      element.style.backdropFilter = previousBackdrop
      element.style.setProperty('-webkit-backdrop-filter', previousWebkitBackdrop)
      delete element.dataset.glassMode
    }
  }

  const id = `liquid-glass-${++instance}`
  const host = document.createElementNS(SVG_NS, 'svg')
  host.setAttribute('width', '0')
  host.setAttribute('height', '0')
  host.setAttribute('aria-hidden', 'true')
  host.style.position = 'absolute'
  host.style.pointerEvents = 'none'

  const defs = document.createElementNS(SVG_NS, 'defs')
  const filter = document.createElementNS(SVG_NS, 'filter')
  filter.setAttribute('id', id)
  filter.setAttribute('filterUnits', 'userSpaceOnUse')
  filter.setAttribute('primitiveUnits', 'userSpaceOnUse')
  filter.setAttribute('color-interpolation-filters', 'sRGB')

  const map = document.createElementNS(SVG_NS, 'feImage')
  map.setAttribute('result', 'map')
  map.setAttribute('preserveAspectRatio', 'none')
  const displacement = document.createElementNS(SVG_NS, 'feDisplacementMap')
  displacement.setAttribute('in', 'SourceGraphic')
  displacement.setAttribute('in2', 'map')
  displacement.setAttribute('scale', String(scale))
  displacement.setAttribute('xChannelSelector', 'R')
  displacement.setAttribute('yChannelSelector', 'B')
  filter.append(map, displacement)
  defs.append(filter)
  host.append(defs)
  document.body.append(host)

  const refresh = () => {
    const width = Math.round(element.offsetWidth)
    const height = Math.round(element.offsetHeight)
    if (!width || !height) return
    const radius = Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0
    const padding = Math.ceil(Math.abs(scale) / 2 + mapBlur + 4)
    const data = makeDisplacementMap(width, height, radius, padding, border, mapBlur)
    if (!data) return

    filter.setAttribute('x', String(-padding))
    filter.setAttribute('y', String(-padding))
    filter.setAttribute('width', String(width + padding * 2))
    filter.setAttribute('height', String(height + padding * 2))
    map.setAttribute('x', String(-padding))
    map.setAttribute('y', String(-padding))
    map.setAttribute('width', String(width + padding * 2))
    map.setAttribute('height', String(height + padding * 2))
    map.setAttribute('href', data)
  }

  refresh()
  const filterValue = `url(#${id}) blur(.6px) saturate(1.24) contrast(1.03)`
  element.style.backdropFilter = filterValue
  element.style.setProperty('-webkit-backdrop-filter', filterValue)
  element.dataset.glassMode = 'refractive'

  let refreshTimer = 0
  const observer = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(() => {
      window.clearTimeout(refreshTimer)
      refreshTimer = window.setTimeout(refresh, 100)
    })
  observer?.observe(element)

  return () => {
    observer?.disconnect()
    window.clearTimeout(refreshTimer)
    host.remove()
    element.style.backdropFilter = previousBackdrop
    element.style.setProperty('-webkit-backdrop-filter', previousWebkitBackdrop)
    delete element.dataset.glassMode
  }
}

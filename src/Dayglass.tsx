import type { CSSProperties } from 'react'

type DayglassProps = {
  now: Date
}

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`

const sandTexture = asset('assets/projects/dayglass-sand-brush.png')
const vesselPng = asset('assets/projects/dayglass-vessel.png')

const clamp = (value: number, minimum = 0, maximum = 1) =>
  Math.min(maximum, Math.max(minimum, value))

type GrainStyle = CSSProperties & {
  '--grain-x-30': string
  '--grain-y-30': string
  '--grain-x-67': string
  '--grain-y-67': string
  '--grain-x-end': string
  '--grain-y-end': string
}

const streamGrains = [
  { x: -1.6, radiusX: 1.15, radiusY: 1.75, drift: -2.8, phase: 0 },
  { x: 1.1, radiusX: .95, radiusY: 1.5, drift: 2.2, phase: .13 },
  { x: -.4, radiusX: 1.25, radiusY: 2.05, drift: -1.2, phase: .27 },
  { x: 1.8, radiusX: .8, radiusY: 1.35, drift: 3.1, phase: .41 },
  { x: -1.1, radiusX: 1, radiusY: 1.7, drift: -2.1, phase: .55 },
  { x: .45, radiusX: .9, radiusY: 1.45, drift: 1.4, phase: .68 },
  { x: -2, radiusX: .75, radiusY: 1.25, drift: -3.4, phase: .81 },
  { x: 1.35, radiusX: 1.05, radiusY: 1.8, drift: 2.6, phase: .92 },
] as const

function sandLevels(progress: number) {
  const dayProgress = clamp(progress)
  const chamberExponent = 1 / 1.65
  const upperLevel = 130 + (1 - Math.pow(1 - dayProgress, chamberExponent)) * 360
  const lowerLevel = 525 + Math.pow(1 - dayProgress, chamberExponent) * 360

  return {
    upperLevel,
    lowerLevel,
    landingLevel: clamp(lowerLevel - 42, 532, 850),
  }
}

export default function Dayglass({ now }: DayglassProps) {
  const elapsedMilliseconds =
    now.getHours() * 3_600_000 +
    now.getMinutes() * 60_000 +
    now.getSeconds() * 1_000 +
    now.getMilliseconds()
  const progress = elapsedMilliseconds / 86_400_000
  const percentage = Math.round(progress * 100)
  const isFlowing = progress > 0 && progress < 1
  const { upperLevel, lowerLevel, landingLevel } = sandLevels(progress)
  const upperSurface = `
    M 610 ${upperLevel + 3}
    C 700 ${upperLevel - 17}, 778 ${upperLevel + 15}, 852 ${upperLevel + 6}
    C 930 ${upperLevel - 14}, 1022 ${upperLevel + 15}, 1100 ${upperLevel + 1}
    L 1100 522 L 610 522 Z
  `
  const lowerSurface = `
    M 610 ${lowerLevel + 37}
    C 690 ${lowerLevel + 28}, 780 ${lowerLevel - 8}, 852 ${lowerLevel - 42}
    C 932 ${lowerLevel - 8}, 1018 ${lowerLevel + 25}, 1100 ${lowerLevel + 38}
    L 1100 930 L 610 930 Z
  `
  const streamStart = 499
  const fallDistance = Math.max(24, landingLevel - streamStart)
  const fallDuration = .34 + Math.sqrt(fallDistance / 360) * .48
  const streamCenter = `M 851 ${streamStart} C 849 ${streamStart + fallDistance * .35}, 853 ${streamStart + fallDistance * .72}, 851 ${landingLevel}`
  const streamBody = `
    M 847.3 ${streamStart}
    C 847.6 ${streamStart + fallDistance * .35}, 849.3 ${streamStart + fallDistance * .72}, 849.6 ${landingLevel}
    C 850.1 ${landingLevel + 1.2}, 852.1 ${landingLevel + 1.2}, 852.6 ${landingLevel}
    C 853 ${streamStart + fallDistance * .72}, 855 ${streamStart + fallDistance * .35}, 854.7 ${streamStart}
    Z
  `

  return (
    <figure
      className="dayglass"
      data-progress={progress.toFixed(6)}
      data-flowing={String(isFlowing)}
      data-upper-level={upperLevel.toFixed(2)}
      data-lower-level={lowerLevel.toFixed(2)}
      data-fall-distance={fallDistance.toFixed(2)}
      aria-label={`A hand-painted 24-hour hourglass marking ${percentage}% of the way through today.`}
    >
      <picture className="dayglass__vessel" aria-hidden="true">
        <img src={vesselPng} alt="" width="1536" height="1024" loading="eager" decoding="async" />
      </picture>

      <svg className="dayglass__live-sand" viewBox="0 0 1536 1024" aria-hidden="true">
        <defs>
          <pattern id="dayglass-sand-texture" width="320" height="320" patternUnits="userSpaceOnUse">
            <image href={sandTexture} width="320" height="320" preserveAspectRatio="xMidYMid slice" />
          </pattern>
          <clipPath id="dayglass-upper-chamber">
            <path d="M 669 123 C 650 252 707 379 825 469 C 841 482 846 494 851 501 C 858 492 863 480 878 467 C 985 374 1048 251 1027 126 C 925 96 770 94 669 123 Z" />
          </clipPath>
          <clipPath id="dayglass-lower-chamber">
            <path d="M 851 520 C 840 534 825 548 804 568 C 736 630 707 703 708 774 C 708 821 725 855 756 878 C 808 905 952 909 1007 883 C 1038 857 1048 821 1043 777 C 1034 701 980 633 899 571 C 874 551 859 533 851 520 Z" />
          </clipPath>
          <filter id="dayglass-sand-edge" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.055" numOctaves="2" seed="17" result="grain" />
            <feDisplacementMap in="SourceGraphic" in2="grain" scale="4" xChannelSelector="R" yChannelSelector="B" />
          </filter>
          <filter id="dayglass-landing-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        <g clipPath="url(#dayglass-upper-chamber)" opacity={progress < 0.99999 ? 1 : 0}>
          <path className="dayglass__sand-mass" d={upperSurface} fill="url(#dayglass-sand-texture)" filter="url(#dayglass-sand-edge)" />
          <path className="dayglass__sand-ridge" d={`M 620 ${upperLevel + 2} C 728 ${upperLevel - 16}, 787 ${upperLevel + 14}, 852 ${upperLevel + 5} C 935 ${upperLevel - 13}, 1018 ${upperLevel + 14}, 1090 ${upperLevel + 2}`} />
        </g>

        <g clipPath="url(#dayglass-lower-chamber)" opacity={progress > 0.00001 ? 1 : 0}>
          <path className="dayglass__sand-mass" d={lowerSurface} fill="url(#dayglass-sand-texture)" filter="url(#dayglass-sand-edge)" />
          <path className="dayglass__sand-ridge" d={`M 620 ${lowerLevel + 35} C 704 ${lowerLevel + 24}, 785 ${lowerLevel - 10}, 852 ${lowerLevel - 42} C 928 ${lowerLevel - 9}, 1010 ${lowerLevel + 23}, 1092 ${lowerLevel + 35}`} />
        </g>

        {isFlowing && (
          <g className="dayglass__stream">
            <ellipse className="dayglass__landing-glow" cx="851" cy={landingLevel + 1} rx="30" ry="8" />
            <path className="dayglass__sand-thread" d={streamBody} fill="url(#dayglass-sand-texture)" />
            <path className="dayglass__sand-thread-glint" d={streamCenter} />
            <g className="dayglass__grain-field" transform={`translate(851 ${streamStart})`}>
              {streamGrains.map((grain, index) => {
                const grainStyle: GrainStyle = {
                  animationDelay: `${-fallDuration * grain.phase}s`,
                  animationDuration: `${fallDuration}s`,
                  '--grain-x-30': `${grain.drift * .25}px`,
                  '--grain-y-30': `${fallDistance * .3}px`,
                  '--grain-x-67': `${grain.drift * .66}px`,
                  '--grain-y-67': `${fallDistance * .67}px`,
                  '--grain-x-end': `${grain.drift}px`,
                  '--grain-y-end': `${fallDistance}px`,
                }
                return (
                  <ellipse
                    key={index}
                    className="dayglass__grain"
                    cx={grain.x}
                    cy="0"
                    rx={grain.radiusX}
                    ry={grain.radiusY}
                    style={grainStyle}
                  />
                )
              })}
            </g>
            <ellipse className="dayglass__impact-ring" cx="851" cy={landingLevel} rx="10" ry="3" />
          </g>
        )}
      </svg>

      <picture className="dayglass__vessel dayglass__vessel--sheen" aria-hidden="true">
        <img src={vesselPng} alt="" width="1536" height="1024" loading="eager" decoding="async" />
      </picture>

      <figcaption className="sr-only">
        The sand follows local time, settling lower throughout the day while a continuous painted stream falls through the glass.
      </figcaption>
    </figure>
  )
}

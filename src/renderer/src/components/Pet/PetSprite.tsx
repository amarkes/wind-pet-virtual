import type { PetMood } from '../../../../shared/types'

interface Props {
  mood:    PetMood
  size?:   number
  weight?: number  // 0.75 (thin) → 1.0 (normal) → 1.4 (fat)
}

type HolidayTheme =
  | 'christmas' | 'newyear' | 'carnival' | 'halloween'
  | 'festajunina' | 'easter' | 'indigenous'

function getEasterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day   = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function getHolidayTheme(): HolidayTheme | null {
  const now   = new Date()
  const month = now.getMonth() + 1
  const day   = now.getDate()
  const year  = now.getFullYear()

  if (month === 12 && day === 31) return 'newyear'
  if (month === 1  && day === 1)  return 'newyear'
  if (month === 12 && day >= 20)  return 'christmas'
  if (month === 10 && day === 31) return 'halloween'
  if (month === 4  && day === 19) return 'indigenous'

  const easter      = getEasterDate(year)
  const carnivalStart = new Date(easter); carnivalStart.setDate(carnivalStart.getDate() - 52)
  const carnivalEnd   = new Date(easter); carnivalEnd.setDate(carnivalEnd.getDate() - 47)
  if (now >= carnivalStart && now <= carnivalEnd) return 'carnival'

  const palmSunday = new Date(easter); palmSunday.setDate(palmSunday.getDate() - 7)
  if (now >= palmSunday && now <= easter) return 'easter'

  if (month === 6 && day >= 13) return 'festajunina'
  return null
}

// ── Seasonal accessories ────────────────────────────────────────────────────
// Head is centered at (60, 50), top ≈ y=22. Accessories sit above y=30.

function ChristmasHat() {
  return (
    <g>
      <ellipse cx="60" cy="28" rx="25" ry="6" fill="white" opacity="0.95" />
      <path d="M 37 29 Q 57 10 62 2 Q 66 10 83 29" fill="#DC2626" />
      <path d="M 53 20 Q 58 10 62 2 Q 65 10 72 24" fill="#7F1D1D" opacity="0.3" />
      <circle cx="62" cy="3" r="6.5" fill="white" opacity="0.95" />
      <circle cx="65" cy="1" r="2.5" fill="white" opacity="0.5" />
    </g>
  )
}

function WitchHat() {
  return (
    <g>
      <path d="M 38 35 L 60 4 L 82 35 Z" fill="#111827" />
      <ellipse cx="60" cy="35" rx="28" ry="7" fill="#1F2937" />
      <path d="M 36 31 L 84 31" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <rect x="55" y="28" width="10" height="6" rx="1.5" fill="#D97706" opacity="0.9" />
      <rect x="57.5" y="30" width="5" height="2" rx="0.5" fill="#111827" />
    </g>
  )
}

function CarnivalHeaddress() {
  return (
    <g>
      <ellipse cx="34" cy="22" rx="5" ry="18" fill="#EF4444" transform="rotate(-22 34 40)" opacity="0.92" />
      <ellipse cx="46" cy="14" rx="5" ry="20" fill="#F59E0B" transform="rotate(-10 46 38)" opacity="0.92" />
      <ellipse cx="60" cy="10" rx="5.5" ry="22" fill="#10B981" opacity="0.92" />
      <ellipse cx="74" cy="14" rx="5" ry="20" fill="#3B82F6" transform="rotate(10 74 38)" opacity="0.92" />
      <ellipse cx="86" cy="22" rx="5" ry="18" fill="#EC4899" transform="rotate(22 86 40)" opacity="0.92" />
      <path d="M 26 38 Q 60 30 94 38" stroke="#FCD34D" strokeWidth="5.5" fill="none" strokeLinecap="round" />
      <path d="M 26 38 Q 60 30 94 38" stroke="#D97706" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      <circle cx="42" cy="35" r="3"   fill="#EC4899" />
      <circle cx="60" cy="32" r="3.5" fill="#A78BFA" />
      <circle cx="78" cy="35" r="3"   fill="#34D399" />
    </g>
  )
}

function BunnyEars() {
  return (
    <g>
      <ellipse cx="40" cy="10" rx="8.5" ry="20" fill="white" opacity="0.95" />
      <ellipse cx="40" cy="11" rx="4.5" ry="13" fill="#F9A8D4" opacity="0.9" />
      <ellipse cx="80" cy="10" rx="8.5" ry="20" fill="white" opacity="0.95" />
      <ellipse cx="80" cy="11" rx="4.5" ry="13" fill="#F9A8D4" opacity="0.9" />
    </g>
  )
}

function StrawHat() {
  return (
    <g>
      <ellipse cx="60" cy="28" rx="30" ry="7.5" fill="#92400E" />
      <ellipse cx="60" cy="28" rx="30" ry="7.5" fill="#D97706" opacity="0.5" />
      <path d="M 38 27 Q 60 5 82 27 Z" fill="#B45309" />
      <path d="M 44 23 Q 60 9 76 23 Z" fill="#D97706" opacity="0.4" />
      {[0,1,2,3,4,5,6,7].map((i) => (
        <rect key={i} x={38 + i * 6} y={24} width={6} height={5}
          fill={i % 2 === 0 ? '#EF4444' : 'white'} opacity="0.9" />
      ))}
      <path d="M 47 20 Q 60 10 73 20" stroke="white" strokeWidth="1.5" fill="none" opacity="0.25" strokeLinecap="round" />
    </g>
  )
}

function IndigenousHeadband() {
  return (
    <g>
      <ellipse cx="38" cy="22" rx="4" ry="15" fill="#EF4444" transform="rotate(-24 38 38)" opacity="0.92" />
      <ellipse cx="48" cy="14" rx="4" ry="17" fill="#F59E0B" transform="rotate(-10 48 38)" opacity="0.92" />
      <ellipse cx="60" cy="10" rx="4.5" ry="19" fill="#10B981" opacity="0.92" />
      <ellipse cx="72" cy="14" rx="4" ry="17" fill="#F59E0B" transform="rotate(10 72 38)" opacity="0.92" />
      <ellipse cx="82" cy="22" rx="4" ry="15" fill="#EF4444" transform="rotate(24 82 38)" opacity="0.92" />
      <line x1="38" y1="16" x2="38" y2="26" stroke="white" strokeWidth="0.8" opacity="0.4" />
      <line x1="60" y1="11" x2="60" y2="23" stroke="white" strokeWidth="0.8" opacity="0.4" />
      <line x1="82" y1="16" x2="82" y2="26" stroke="white" strokeWidth="0.8" opacity="0.4" />
      <path d="M 26 38 Q 60 32 94 38" stroke="#92400E" strokeWidth="5.5" fill="none" strokeLinecap="round" />
      <circle cx="38" cy="36" r="3" fill="#EF4444" />
      <circle cx="52" cy="34" r="3" fill="#F59E0B" />
      <circle cx="60" cy="33" r="3" fill="#10B981" />
      <circle cx="68" cy="34" r="3" fill="#3B82F6" />
      <circle cx="82" cy="36" r="3" fill="#EF4444" />
    </g>
  )
}

function PartyHat() {
  return (
    <g>
      <path d="M 43 31 L 60 3 L 77 31 Z" fill="#7C3AED" />
      <circle cx="55" cy="17" r="2.5" fill="#FCD34D" />
      <circle cx="63" cy="22" r="2"   fill="#F472B6" />
      <circle cx="60" cy="10" r="2"   fill="#34D399" />
      <circle cx="52" cy="25" r="1.5" fill="#60A5FA" />
      <circle cx="66" cy="14" r="1.5" fill="#FCD34D" />
      <ellipse cx="60" cy="31" rx="17" ry="5" fill="#6D28D9" />
      <circle cx="60" cy="4" r="5.5" fill="#FCD34D" opacity="0.95" />
      <circle cx="62" cy="2" r="2" fill="white" opacity="0.5" />
      <rect x="8"  y="20" width="4" height="6" rx="1" fill="#EF4444" transform="rotate(30 10 23)"  opacity="0.85" />
      <rect x="102" y="17" width="4" height="6" rx="1" fill="#10B981" transform="rotate(-20 104 20)" opacity="0.85" />
      <circle cx="18" cy="36" r="2" fill="#EC4899" opacity="0.8" />
      <circle cx="100" cy="32" r="2" fill="#FCD34D" opacity="0.8" />
    </g>
  )
}

// ── Main component ──────────────────────────────────────────────────────────

export default function PetSprite({ mood, size = 130, weight = 1.0 }: Props) {
  const isHappy     = mood === 'happy'
  const isExcited   = mood === 'excited'
  const isTired     = mood === 'tired'
  const isSad       = mood === 'sad'
  const isFocused   = mood === 'focused'
  const isCelebrate = mood === 'celebrating'
  const isDancing   = mood === 'dancing'
  const isNormal    = mood === 'idle' || isFocused

  // Body weight scaling — centered on torso (60, 115)
  const scaleX        = weight
  const scaleY        = 0.7 + weight * 0.3
  const bodyTransform = `translate(60,115) scale(${scaleX},${scaleY}) translate(-60,-115)`

  // Tail wag
  const wagActive = mood === 'idle' || mood === 'happy' || mood === 'excited' || mood === 'celebrating' || mood === 'dancing'
  const wagDur    = mood === 'excited' ? '0.45s' : mood === 'celebrating' ? '0.38s' : mood === 'happy' ? '0.65s' : '1.4s'
  const wagValues =
    mood === 'excited' || mood === 'celebrating'
      ? '0 80 118;20 80 118;-15 80 118;20 80 118;0 80 118'
      : mood === 'happy'
      ? '0 80 118;15 80 118;-8 80 118;13 80 118;0 80 118'
      : '0 80 118;10 80 118;-5 80 118;8 80 118;0 80 118'

  const holiday = getHolidayTheme()

  return (
    <svg viewBox="0 0 120 180" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hg" cx="38%" cy="32%" r="65%">
          <stop offset="0%"   stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#5B21B6" />
        </radialGradient>
        <radialGradient id="bg" cx="50%" cy="28%" r="70%">
          <stop offset="0%"   stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#4C1D95" />
        </radialGradient>
        <radialGradient id="ig" cx="38%" cy="32%" r="60%">
          <stop offset="0%"   stopColor="#818CF8" />
          <stop offset="100%" stopColor="#1E1B4B" />
        </radialGradient>
        <radialGradient id="pg" cx="40%" cy="28%" r="70%">
          <stop offset="0%"   stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </radialGradient>
        <filter id="ds" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#3B0764" floodOpacity="0.25" />
        </filter>
        <filter id="sm" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#3B0764" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* ── Ground shadow ── */}
      <ellipse cx="60" cy="177" rx="32" ry="4.5" fill="#000" opacity="0.1" />

      {/* ── Tail (wag animation, outside weight group) ── */}
      <g>
        <path d="M 80 118 Q 116 108 112 83 Q 108 62 94 68"
          stroke="#6D28D9" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M 80 118 Q 116 108 112 83 Q 108 62 94 68"
          stroke="#9D6FE8" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.5" />
        <ellipse cx="94" cy="67" rx="5.5" ry="4.5" fill="#A78BFA" />
        {wagActive && (
          // @ts-ignore
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={wagValues}
            dur={wagDur}
            repeatCount="indefinite"
          />
        )}
      </g>

      {/* ── Body group — scales with weight ── */}
      <g transform={bodyTransform}>

        {/* Back legs — drawn first so body renders on top */}
        {/* Left back leg */}
        <path d="M 47 132 Q 40 150 37 164"
          stroke="#5B21B6" strokeWidth="13" fill="none" strokeLinecap="round" />
        <ellipse cx="34" cy="169" rx="13" ry="7.5" fill="url(#pg)" />
        <ellipse cx="27" cy="171" rx="3.5" ry="2.5" fill="#4C1D95" opacity="0.55" />
        <ellipse cx="34" cy="173" rx="3.5" ry="2.5" fill="#4C1D95" opacity="0.55" />
        <ellipse cx="41" cy="171" rx="3.5" ry="2.5" fill="#4C1D95" opacity="0.55" />

        {/* Right back leg */}
        <path d="M 73 132 Q 80 150 83 164"
          stroke="#5B21B6" strokeWidth="13" fill="none" strokeLinecap="round" />
        <ellipse cx="86" cy="169" rx="13" ry="7.5" fill="url(#pg)" />
        <ellipse cx="79" cy="171" rx="3.5" ry="2.5" fill="#4C1D95" opacity="0.55" />
        <ellipse cx="86" cy="173" rx="3.5" ry="2.5" fill="#4C1D95" opacity="0.55" />
        <ellipse cx="93" cy="171" rx="3.5" ry="2.5" fill="#4C1D95" opacity="0.55" />

        {/* Torso */}
        <ellipse cx="60" cy="110" rx="22" ry="26" fill="url(#bg)" filter="url(#sm)" />
        {/* Belly highlight */}
        <ellipse cx="60" cy="116" rx="12" ry="16" fill="#A78BFA" opacity="0.28" />

        {/* Front arms — each in own group so dance animateTransform works independently */}
        <g>
          <path d="M 42 96 Q 28 114 26 131"
            stroke="#7C3AED" strokeWidth="13" fill="none" strokeLinecap="round" />
          <ellipse cx="25" cy="136" rx="11" ry="7.5" fill="url(#pg)" />
          <ellipse cx="20" cy="138" rx="3.5" ry="2.5" fill="#6D28D9" opacity="0.55" />
          <ellipse cx="25" cy="140" rx="3.5" ry="2.5" fill="#6D28D9" opacity="0.55" />
          <ellipse cx="30" cy="138" rx="3.5" ry="2.5" fill="#6D28D9" opacity="0.55" />
          {isDancing && (
            // @ts-ignore
            <animateTransform
              attributeName="transform" type="rotate"
              values="0 42 96;-55 42 96;10 42 96;-55 42 96;0 42 96"
              dur="0.75s" repeatCount="indefinite"
            />
          )}
        </g>

        <g>
          <path d="M 78 96 Q 92 114 94 131"
            stroke="#7C3AED" strokeWidth="13" fill="none" strokeLinecap="round" />
          <ellipse cx="95" cy="136" rx="11" ry="7.5" fill="url(#pg)" />
          <ellipse cx="90" cy="138" rx="3.5" ry="2.5" fill="#6D28D9" opacity="0.55" />
          <ellipse cx="95" cy="140" rx="3.5" ry="2.5" fill="#6D28D9" opacity="0.55" />
          <ellipse cx="100" cy="138" rx="3.5" ry="2.5" fill="#6D28D9" opacity="0.55" />
          {isDancing && (
            // @ts-ignore
            <animateTransform
              attributeName="transform" type="rotate"
              values="0 78 96;55 78 96;-10 78 96;55 78 96;0 78 96"
              dur="0.75s" begin="0.375s" repeatCount="indefinite"
            />
          )}
        </g>

      </g>{/* end body group */}

      {/* ── Ears (outside weight group, drawn before head) ── */}
      <g>
        <path d="M 34 39 Q 26 14 45 23 Q 49 30 51 39" fill="#7C3AED" />
        <path d="M 36 39 Q 31 18 44 25 Q 47 31 49 39" fill="#F9A8D4" opacity="0.6" />
        {/* @ts-ignore */}
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 42 39;-6 42 39;0 42 39;-3 42 39;0 42 39"
          keyTimes="0;0.1;0.2;0.3;1"
          dur="9s"
          begin="2s"
          repeatCount="indefinite"
        />
      </g>
      <g>
        <path d="M 86 39 Q 94 14 75 23 Q 71 30 69 39" fill="#7C3AED" />
        <path d="M 84 39 Q 89 18 76 25 Q 73 31 71 39" fill="#F9A8D4" opacity="0.6" />
        {/* @ts-ignore */}
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 78 39;6 78 39;0 78 39;3 78 39;0 78 39"
          keyTimes="0;0.1;0.2;0.3;1"
          dur="9s"
          begin="2.4s"
          repeatCount="indefinite"
        />
      </g>

      {/* ── Head ── */}
      <ellipse cx="60" cy="50" rx="30" ry="28" fill="url(#hg)" filter="url(#ds)" />

      {/* Cheek blush */}
      <ellipse cx="35" cy="58" rx="9" ry="5.5" fill="#F472B6" opacity="0.16" />
      <ellipse cx="85" cy="58" rx="9" ry="5.5" fill="#F472B6" opacity="0.16" />

      {/* ── Collar ── */}
      <path d="M 40 74 Q 60 84 80 74" stroke="#F472B6" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle  cx="60"  cy="83" r="5"    fill="#FCD34D" />
      <ellipse cx="60"  cy="85" rx="3"   ry="2.2" fill="#D97706" />
      <circle  cx="61.5" cy="81.5" r="1.1" fill="#FDE68A" opacity="0.85" />

      {/* ── EYES ── */}

      {/* Normal / Focused */}
      {isNormal && (
        <>
          <ellipse cx="47" cy="46" rx="6.5" ry="7" fill="white" />
          <ellipse cx="47" cy="46" rx="5"   ry="5.5" fill="url(#ig)" />
          <circle  cx="47.5" cy="46.5" r="2.7" fill="#0D0A1E" />
          <circle  cx="49.5" cy="43.5" r="1.5" fill="white" opacity="0.9" />
          <circle  cx="45.5" cy="49"   r="0.7" fill="white" opacity="0.5" />
          {/* Left blink lid */}
          <ellipse cx="47" cy="39" rx="6.5" ry="0.5" fill="#8B5CF6">
            {/* @ts-ignore */}
            <animate attributeName="ry" values="0.5;0.5;7;0.5" keyTimes="0;0.87;0.92;1" dur="6s" repeatCount="indefinite" />
            {/* @ts-ignore */}
            <animate attributeName="cy" values="39;39;46;39" keyTimes="0;0.87;0.92;1" dur="6s" repeatCount="indefinite" />
          </ellipse>

          <ellipse cx="73" cy="46" rx="6.5" ry="7"   fill="white" />
          <ellipse cx="73" cy="46" rx="5"   ry="5.5"  fill="url(#ig)" />
          <circle  cx="73.5" cy="46.5" r="2.7" fill="#0D0A1E" />
          <circle  cx="75.5" cy="43.5" r="1.5" fill="white" opacity="0.9" />
          <circle  cx="71.5" cy="49"   r="0.7" fill="white" opacity="0.5" />
          {/* Right blink lid */}
          <ellipse cx="73" cy="39" rx="6.5" ry="0.5" fill="#8B5CF6">
            {/* @ts-ignore */}
            <animate attributeName="ry" values="0.5;0.5;7;0.5" keyTimes="0;0.87;0.92;1" dur="6s" begin="0.12s" repeatCount="indefinite" />
            {/* @ts-ignore */}
            <animate attributeName="cy" values="39;39;46;39" keyTimes="0;0.87;0.92;1" dur="6s" begin="0.12s" repeatCount="indefinite" />
          </ellipse>

          {isFocused && (
            <>
              <path d="M 40 40 Q 47 37 54 40" fill="url(#hg)" />
              <path d="M 67 40 Q 73 37 80 40" fill="url(#hg)" />
            </>
          )}
        </>
      )}

      {/* Happy / Celebrating / Dancing — arc eyes */}
      {(isHappy || isCelebrate || isDancing) && (
        <>
          <path d="M 40 48 Q 47 40 53 48" stroke="#1E1B4B" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 67 48 Q 73 40 79 48" stroke="#1E1B4B" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* Excited — wide eyes + sparkles */}
      {isExcited && (
        <>
          <ellipse cx="47" cy="45" rx="7.5" ry="8.5" fill="white" />
          <ellipse cx="47" cy="45" rx="6"   ry="7"   fill="url(#ig)" />
          <circle  cx="48"   cy="45"   r="3"   fill="#0D0A1E" />
          <circle  cx="50.5" cy="42.5" r="2"   fill="white" opacity="0.9" />
          <text x="41" y="38" fontSize="8" textAnchor="middle" fill="#FCD34D">✦</text>

          <ellipse cx="73" cy="45" rx="7.5" ry="8.5" fill="white" />
          <ellipse cx="73" cy="45" rx="6"   ry="7"   fill="url(#ig)" />
          <circle  cx="74"   cy="45"   r="3"   fill="#0D0A1E" />
          <circle  cx="76.5" cy="42.5" r="2"   fill="white" opacity="0.9" />
          <text x="80" y="38" fontSize="8" textAnchor="middle" fill="#FCD34D">✦</text>
        </>
      )}

      {/* Tired — heavy lids */}
      {isTired && (
        <>
          <ellipse cx="47" cy="48" rx="6"   ry="5"   fill="white" />
          <ellipse cx="47" cy="48" rx="4.5" ry="3.5" fill="url(#ig)" />
          <circle  cx="47.5" cy="48.5" r="2" fill="#0D0A1E" />
          <path d="M 40 43 Q 47 39 54 43" fill="url(#hg)" />
          <path d="M 40 48 Q 47 43 54 48" fill="url(#hg)" opacity="0.45" />

          <ellipse cx="73" cy="48" rx="6"   ry="5"   fill="white" />
          <ellipse cx="73" cy="48" rx="4.5" ry="3.5" fill="url(#ig)" />
          <circle  cx="73.5" cy="48.5" r="2" fill="#0D0A1E" />
          <path d="M 67 43 Q 73 39 80 43" fill="url(#hg)" />
          <path d="M 67 48 Q 73 43 80 48" fill="url(#hg)" opacity="0.45" />
        </>
      )}

      {/* Sad — downcast + worried brows */}
      {isSad && (
        <>
          <ellipse cx="47" cy="47" rx="6.5" ry="7" fill="white" />
          <ellipse cx="47" cy="47" rx="5"   ry="5.5" fill="url(#ig)" />
          <circle  cx="46.5" cy="49"   r="2.7" fill="#0D0A1E" />
          <circle  cx="49"   cy="47"   r="1.5" fill="white" opacity="0.8" />
          <path d="M 41 39 Q 47 42 54 39" stroke="#2E1065" strokeWidth="2" fill="none" strokeLinecap="round" />

          <ellipse cx="73" cy="47" rx="6.5" ry="7"   fill="white" />
          <ellipse cx="73" cy="47" rx="5"   ry="5.5"  fill="url(#ig)" />
          <circle  cx="72.5" cy="49"   r="2.7" fill="#0D0A1E" />
          <circle  cx="75"   cy="47"   r="1.5" fill="white" opacity="0.8" />
          <path d="M 66 39 Q 73 42 80 39" stroke="#2E1065" strokeWidth="2" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── NOSE — small heart ── */}
      <path d="M 58 52 Q 58 50 60 51 Q 62 50 62 52 Q 62 54 60 55 Q 58 54 58 52"
        fill="#F472B6" />

      {/* ── MOUTH ── */}
      {mood === 'idle' && !isDancing && (
        <path d="M 55 57 Q 60 60 65 57"
          stroke="#F472B6" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {isHappy && (
        <>
          <path d="M 52 57 Q 60 65 68 57"
            stroke="#F472B6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 52 57 Q 60 65 68 57 Z"
            fill="#F472B6" opacity="0.12" />
        </>
      )}
      {isExcited && (
        <>
          <ellipse cx="60" cy="60" rx="6.5" ry="4.5" fill="#F472B6" opacity="0.95" />
          <ellipse cx="60" cy="59.5" rx="4"   ry="2.7" fill="#1E1B4B" opacity="0.12" />
        </>
      )}
      {isCelebrate && (
        <>
          <path d="M 51 57 Q 60 67 68 57"
            stroke="#F472B6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 51 57 Q 60 67 68 57 Z"
            fill="#F472B6" opacity="0.12" />
        </>
      )}
      {isTired && (
        <path d="M 55 58 Q 60 56 65 58"
          stroke="#94A3B8" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {isSad && (
        <path d="M 55 60 Q 60 56 65 60"
          stroke="#94A3B8" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}
      {isFocused && (
        <path d="M 55 57 Q 60 59 65 57"
          stroke="#C4B5FD" strokeWidth="2" fill="none" strokeLinecap="round" />
      )}

      {/* ── Whiskers ── */}
      <line x1="4"   y1="47" x2="47"  y2="50" stroke="white" strokeWidth="1.3" opacity="0.38" strokeLinecap="round" />
      <line x1="4"   y1="52" x2="47"  y2="52" stroke="white" strokeWidth="1.3" opacity="0.3"  strokeLinecap="round" />
      <line x1="4"   y1="57" x2="47"  y2="54" stroke="white" strokeWidth="1.3" opacity="0.25" strokeLinecap="round" />
      <line x1="73"  y1="50" x2="116" y2="47" stroke="white" strokeWidth="1.3" opacity="0.38" strokeLinecap="round" />
      <line x1="73"  y1="52" x2="116" y2="52" stroke="white" strokeWidth="1.3" opacity="0.3"  strokeLinecap="round" />
      <line x1="73"  y1="54" x2="116" y2="57" stroke="white" strokeWidth="1.3" opacity="0.25" strokeLinecap="round" />

      {/* Dancing mouth — big happy open */}
      {isDancing && (
        <>
          <path d="M 51 57 Q 60 67 68 57"
            stroke="#F472B6" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 51 57 Q 60 67 68 57 Z"
            fill="#F472B6" opacity="0.12" />
        </>
      )}

      {/* ── Dancing musical notes (animated) ── */}
      {isDancing && (
        <>
          <text x="6" y="35" fontSize="13" fill="#FCD34D" fontWeight="bold">
            ♪
            {/* @ts-ignore */}
            <animate attributeName="y"       values="35;18;35"   dur="1.1s"                  repeatCount="indefinite" />
            {/* @ts-ignore */}
            <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.1s"                 repeatCount="indefinite" />
          </text>
          <text x="101" y="28" fontSize="15" fill="#A78BFA" fontWeight="bold">
            ♫
            {/* @ts-ignore */}
            <animate attributeName="y"       values="28;12;28"   dur="0.95s" begin="0.3s"    repeatCount="indefinite" />
            {/* @ts-ignore */}
            <animate attributeName="opacity" values="0.9;0.1;0.9" dur="0.95s" begin="0.3s"   repeatCount="indefinite" />
          </text>
          <text x="10" y="52" fontSize="10" fill="#F472B6" fontWeight="bold">
            ♩
            {/* @ts-ignore */}
            <animate attributeName="y"       values="52;36;52"   dur="0.85s" begin="0.6s"    repeatCount="indefinite" />
            {/* @ts-ignore */}
            <animate attributeName="opacity" values="0.8;0.1;0.8" dur="0.85s" begin="0.6s"   repeatCount="indefinite" />
          </text>
          <text x="98" y="48" fontSize="11" fill="#34D399" fontWeight="bold">
            ♬
            {/* @ts-ignore */}
            <animate attributeName="y"       values="48;32;48"   dur="1.0s"  begin="0.15s"   repeatCount="indefinite" />
            {/* @ts-ignore */}
            <animate attributeName="opacity" values="0.8;0.1;0.8" dur="1.0s"  begin="0.15s"  repeatCount="indefinite" />
          </text>
        </>
      )}

      {/* ── Celebrating / Excited sparkles ── */}
      {(isCelebrate || isExcited) && (
        <>
          <text x="4"   y="22" fontSize="14" opacity="0.9">✨</text>
          <text x="97"  y="18" fontSize="11" opacity="0.85">⭐</text>
          <text x="8"   y="40" fontSize="9"  opacity="0.7" fill="#FCD34D">✦</text>
          <text x="101" y="36" fontSize="9"  opacity="0.7" fill="#FCD34D">✦</text>
        </>
      )}

      {/* ── Tired ZZZ ── */}
      {isTired && (
        <>
          <text x="90"  y="36" fontSize="10" fill="#A78BFA" opacity="0.65" fontWeight="600">z</text>
          <text x="97"  y="27" fontSize="13" fill="#A78BFA" opacity="0.75" fontWeight="600">z</text>
          <text x="104" y="17" fontSize="16" fill="#A78BFA" opacity="0.6"  fontWeight="600">Z</text>
        </>
      )}

      {/* ── Sad tear ── */}
      {isSad && (
        <>
          <ellipse cx="42" cy="55" rx="2"   ry="2.5" fill="#93C5FD" opacity="0.7" />
          <ellipse cx="42" cy="58" rx="1.5" ry="2"   fill="#93C5FD" opacity="0.55" />
        </>
      )}

      {/* ── SEASONAL ACCESSORIES ── */}
      {holiday === 'christmas'   && <ChristmasHat />}
      {holiday === 'halloween'   && <WitchHat />}
      {holiday === 'carnival'    && <CarnivalHeaddress />}
      {holiday === 'easter'      && <BunnyEars />}
      {holiday === 'festajunina' && <StrawHat />}
      {holiday === 'indigenous'  && <IndigenousHeadband />}
      {holiday === 'newyear'     && <PartyHat />}
    </svg>
  )
}

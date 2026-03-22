import type { PetMood } from '../../../../shared/types'

interface Props {
  mood: PetMood
  size?: number
}

type EyeProps = { cx: number; cy: number }

function EyeIdle({ cx, cy }: EyeProps) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="6" ry="7" fill="white" />
      <circle cx={cx + 1} cy={cy + 1} r="4" fill="#1a1a2e" />
      <circle cx={cx + 2} cy={cy - 1} r="1.5" fill="white" />
    </>
  )
}

function EyeHappy({ cx, cy }: EyeProps) {
  return (
    <path
      d={`M${cx - 6} ${cy + 2} Q${cx} ${cy - 6} ${cx + 6} ${cy + 2}`}
      stroke="#1a1a2e"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
  )
}

function EyeExcited({ cx, cy }: EyeProps) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="7" ry="8" fill="white" />
      <circle cx={cx + 1} cy={cy + 1} r="4.5" fill="#1a1a2e" />
      <circle cx={cx + 2.5} cy={cy - 1.5} r="2" fill="white" />
      {/* Star highlight */}
      <circle cx={cx + 3} cy={cy - 4} r="1" fill="#F59E0B" />
    </>
  )
}

function EyeTired({ cx, cy }: EyeProps) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="6" ry="7" fill="white" />
      <circle cx={cx + 1} cy={cy + 1} r="4" fill="#1a1a2e" />
      {/* Half-closed lid */}
      <rect x={cx - 6} y={cy - 7} width="12" height="7" fill="#7C3AED" rx="2" />
    </>
  )
}

function EyeSad({ cx, cy }: EyeProps) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="6" ry="7" fill="white" />
      <circle cx={cx} cy={cy + 2} r="4" fill="#1a1a2e" />
      <circle cx={cx + 2} cy={cy + 1} r="1.5" fill="white" />
    </>
  )
}

function EyeFocused({ cx, cy }: EyeProps) {
  return (
    <>
      <ellipse cx={cx} cy={cy} rx="5" ry="5" fill="white" />
      <circle cx={cx} cy={cy} r="3.5" fill="#1a1a2e" />
      <circle cx={cx + 1.5} cy={cy - 1} r="1" fill="white" />
    </>
  )
}

const EYES: Record<PetMood, (props: EyeProps) => JSX.Element> = {
  idle:        EyeIdle,
  happy:       EyeHappy,
  excited:     EyeExcited,
  tired:       EyeTired,
  sad:         EyeSad,
  focused:     EyeFocused,
  celebrating: EyeHappy,
}

function Mouth({ mood }: { mood: PetMood }) {
  switch (mood) {
    case 'happy':
    case 'celebrating':
      return <path d="M 50 70 Q 60 80 70 70" stroke="#EC4899" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    case 'excited':
      return (
        <>
          <path d="M 50 70 Q 60 82 70 70" stroke="#EC4899" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="60" cy="75" rx="6" ry="4" fill="#EC4899" opacity="0.3" />
        </>
      )
    case 'sad':
      return <path d="M 50 76 Q 60 68 70 76" stroke="#94A3B8" strokeWidth="2" fill="none" strokeLinecap="round" />
    case 'tired':
      return <line x1="52" y1="72" x2="68" y2="72" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
    case 'focused':
      return <line x1="54" y1="71" x2="66" y2="71" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
    default:
      return <path d="M 54 71 Q 60 76 66 71" stroke="#EC4899" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  }
}

export default function PetSprite({ mood, size = 130 }: Props) {
  const EyeComponent = EYES[mood]

  return (
    <svg viewBox="0 0 120 140" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="60" cy="136" rx="28" ry="5" fill="#000" opacity="0.2" />

      {/* Body */}
      <ellipse cx="60" cy="116" rx="26" ry="18" fill="#6D28D9" />

      {/* Collar */}
      <path d="M 34 108 Q 60 120 86 108" stroke="#EC4899" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Bell */}
      <circle cx="60" cy="114" r="5" fill="#F59E0B" />
      <ellipse cx="60" cy="116" rx="3" ry="2" fill="#D97706" />

      {/* Left ear */}
      <polygon points="22,42 16,14 44,36" fill="#7C3AED" />
      <polygon points="25,40 20,18 40,36" fill="#EC4899" opacity="0.5" />

      {/* Right ear */}
      <polygon points="98,42 104,14 76,36" fill="#7C3AED" />
      <polygon points="95,40 100,18 80,36" fill="#EC4899" opacity="0.5" />

      {/* Head */}
      <ellipse cx="60" cy="62" rx="40" ry="36" fill="#7C3AED" />

      {/* Cheek blush */}
      <ellipse cx="30" cy="72" rx="9" ry="6" fill="#EC4899" opacity="0.2" />
      <ellipse cx="90" cy="72" rx="9" ry="6" fill="#EC4899" opacity="0.2" />

      {/* Eyes */}
      <EyeComponent cx={42} cy={57} />
      <EyeComponent cx={78} cy={57} />

      {/* Nose */}
      <ellipse cx="60" cy="67" rx="4" ry="3" fill="#EC4899" />

      {/* Mouth */}
      <Mouth mood={mood} />

      {/* Left whiskers */}
      <line x1="8"  y1="63" x2="46" y2="66" stroke="#E2E8F0" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
      <line x1="8"  y1="69" x2="46" y2="68" stroke="#E2E8F0" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
      <line x1="8"  y1="75" x2="46" y2="70" stroke="#E2E8F0" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />

      {/* Right whiskers */}
      <line x1="74" y1="66" x2="112" y2="63" stroke="#E2E8F0" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
      <line x1="74" y1="68" x2="112" y2="69" stroke="#E2E8F0" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
      <line x1="74" y1="70" x2="112" y2="75" stroke="#E2E8F0" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />

      {/* Celebrating sparkles */}
      {(mood === 'celebrating' || mood === 'excited') && (
        <>
          <text x="5"  y="30" fontSize="12" opacity="0.8">✨</text>
          <text x="95" y="25" fontSize="10" opacity="0.8">⭐</text>
          <text x="10" y="55" fontSize="8"  opacity="0.6">•</text>
          <text x="100" y="50" fontSize="8" opacity="0.6">•</text>
        </>
      )}
    </svg>
  )
}

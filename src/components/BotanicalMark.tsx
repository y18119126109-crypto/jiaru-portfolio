export function BotanicalMark({ variant = 0 }: { variant?: number }) {
  return (
    <svg viewBox="0 0 180 180" fill="none" className="botanical-mark" aria-hidden="true">
      <g transform={`translate(90 79) rotate(${variant * 18 - 12})`}>
        {Array.from({ length: 11 }, (_, index) => (
          <g key={index} transform={`rotate(${index * 360 / 11})`}>
            <path d="M0 9C-43-5-36-48-6-60C12-54 37-21 0 9Z" fill="currentColor" fillOpacity=".035" stroke="currentColor" strokeOpacity=".32" strokeWidth=".65" />
            <path d="M0 7C-12-12-14-38-6-59M-2-1C3-24-2-44-6-59M-1 2C-27-17-21-40-6-59" stroke="currentColor" strokeOpacity=".19" strokeWidth=".5" />
          </g>
        ))}
        <circle r="9" fill="currentColor" fillOpacity=".08" />
      </g>
      <path d="M90 87C90 115 76 130 87 167M86 133C65 132 60 118 59 111C76 112 87 117 86 133M85 148C99 147 109 134 110 127C94 128 88 135 85 148" stroke="currentColor" strokeOpacity=".4" strokeWidth=".8" />
    </svg>
  )
}

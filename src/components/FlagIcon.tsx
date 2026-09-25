interface FlagIconProps {
  countryCode: 'US' | 'PK'
  size?: number
}

/** Inline SVG flags so widgets show real flag artwork instead of relying on emoji font
 *  support, which Windows often falls back to rendering as bare "US"/"PK" letters. */
export function FlagIcon({ countryCode, size = 15 }: FlagIconProps): JSX.Element {
  const width = size
  const height = Math.round((size * 2) / 3)

  if (countryCode === 'PK') {
    return (
      <svg
        className="flag-icon"
        width={width}
        height={height}
        viewBox="0 0 30 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="30" height="20" fill="#01411c" />
        <rect width="7.5" height="20" fill="#ffffff" />
        <g fill="#ffffff">
          <circle cx="20" cy="10" r="5.4" />
          <circle cx="21.6" cy="10" r="4.5" fill="#01411c" />
          <path d="M24.5 5.8 L25.4 8.6 L28.3 8.6 L25.9 10.3 L26.8 13.1 L24.5 11.3 L22.2 13.1 L23.1 10.3 L20.7 8.6 L23.6 8.6 Z" />
        </g>
      </svg>
    )
  }

  return (
    <svg
      className="flag-icon"
      width={width}
      height={height}
      viewBox="0 0 30 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="30" height="20" fill="#b31942" />
      <g fill="#ffffff">
        <rect y="1.54" width="30" height="1.54" />
        <rect y="4.62" width="30" height="1.54" />
        <rect y="7.69" width="30" height="1.54" />
        <rect y="10.77" width="30" height="1.54" />
        <rect y="13.85" width="30" height="1.54" />
        <rect y="16.92" width="30" height="1.54" />
      </g>
      <rect width="12" height="10.77" fill="#0a3161" />
    </svg>
  )
}

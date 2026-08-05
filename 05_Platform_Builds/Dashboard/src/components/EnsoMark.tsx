interface EnsoMarkProps {
  size?: number;
  color?: string;
}

/** Zenny's ensō mark — a single hand-drawn, deliberately open circle. */
export function EnsoMark({ size = 32, color = '#6E9179' }: EnsoMarkProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      style={{ transform: 'rotate(-18deg)', flexShrink: 0 }}
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke={color}
        strokeWidth="9"
        strokeLinecap="round"
        strokeDasharray="290"
        strokeDashoffset="34"
      />
    </svg>
  );
}

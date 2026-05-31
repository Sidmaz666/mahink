interface Props {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
}

export default function GoalRing({ pct, color, size = 80, stroke = 6 }: Props) {
  const r    = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div style={{
      position: "relative", width: size, height: size,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
    }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={`${color}25`} strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <span style={{
        position: "absolute",
        fontFamily: "var(--ui-font)",
        fontSize: size * 0.22,
        fontWeight: 700,
        color,
      }}>
        {Math.round(pct)}%
      </span>
    </div>
  );
}

interface ReputationScoreProps {
  score: number; // 0–10
}

export function ReputationScore({ score }: ReputationScoreProps) {
  const pct = (score / 10) * 100;
  const color = score >= 7 ? '#16a34a' : score >= 4 ? '#d97706' : '#dc2626';
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex items-center gap-2" title={`Reputation: ${score}/10`}>
      <svg width="48" height="48" viewBox="0 0 48 48">
        {/* Track */}
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        {/* Progress */}
        <circle
          cx="24" cy="24" r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 24 24)"
        />
        <text x="24" y="28" textAnchor="middle" fontSize="12" fontWeight="600" fill={color}>
          {score.toFixed(1)}
        </text>
      </svg>
      <span className="text-xs text-gray-500">Reputation</span>
    </div>
  );
}

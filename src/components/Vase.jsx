export default function Vase({ size = 120 }) {
  const w = size, h = size * 1.15, cx = w / 2;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="vg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#B8A888"/>
          <stop offset="30%" stopColor="#DDD0B8"/>
          <stop offset="65%" stopColor="#E8D8C0"/>
          <stop offset="100%" stopColor="#B8A080"/>
        </linearGradient>
      </defs>
      <path d={`M${cx-w*0.22},${h*0.18} Q${cx-w*0.33},${h*0.5} ${cx-w*0.38},${h*0.75} Q${cx-w*0.3},${h*0.98} ${cx},${h} Q${cx+w*0.3},${h*0.98} ${cx+w*0.38},${h*0.75} Q${cx+w*0.33},${h*0.5} ${cx+w*0.22},${h*0.18} Z`}
        fill="url(#vg)" stroke="#A89870" strokeWidth="1"/>
      <ellipse cx={cx} cy={h*0.18} rx={w*0.24} ry={h*0.042} fill="#D8C8A8" stroke="#B8A070" strokeWidth="1"/>
      <path d={`M${cx-w*0.28},${h*0.28} Q${cx-w*0.24},${h*0.55} ${cx-w*0.26},${h*0.72}`}
        stroke="white" strokeWidth={w*0.025} fill="none" opacity="0.25" strokeLinecap="round"/>
      {[0.42, 0.58, 0.72].map((t,i) => (
        <path key={i} d={`M${cx-w*0.31+w*0.02*i},${h*t} Q${cx},${h*t-h*0.013} ${cx+w*0.31-w*0.02*i},${h*t}`}
          stroke="#C8A878" strokeWidth="0.5" fill="none" opacity="0.4"/>
      ))}
    </svg>
  );
}
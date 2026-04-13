export default function Vase({ size = 2500 }) {
  const w = size;
  const h = size * 1.1;
  const cx = w / 2;

  const rimY = h * 0.18;
  const rimHalfW = w * 0.42;
  const baseY = h * 0.97;
  const baseHalfW = w * 0.32;
  const midY = h * 0.60;
  const midHalfW = w * 0.38;

  const bodyPath = `
    M${cx - rimHalfW},${rimY}
    Q${cx - midHalfW},${midY} ${cx - baseHalfW},${baseY}
    L${cx + baseHalfW},${baseY}
    Q${cx + midHalfW},${midY} ${cx + rimHalfW},${rimY}
    Z
  `;

  const weaveCount = 9;
  const weaveLines = Array.from({ length: weaveCount }, (_, i) => {
    const t = (i + 1) / (weaveCount + 1);
    const y = rimY + (baseY - rimY) * t;
    const hw = rimHalfW + (baseHalfW - rimHalfW) * t;
    return { y, x1: cx - hw + 2, x2: cx + hw - 2 };
  });

  const diagCount = 10;
  const diagLinesA = Array.from({ length: diagCount }, (_, i) => ({
    sx: cx - rimHalfW + (2 * rimHalfW) * (i / diagCount),
    sy: rimY,
  }));

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <clipPath id="basketClip">
          <path d={bodyPath} />
        </clipPath>
        <linearGradient id="rattanBase" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#9C7A52" />
          <stop offset="18%"  stopColor="#C49A68" />
          <stop offset="50%"  stopColor="#DDB882" />
          <stop offset="82%"  stopColor="#C49A68" />
          <stop offset="100%" stopColor="#9C7A52" />
        </linearGradient>
        <pattern id="weavePattern" x="0" y="0" width="12" height="8" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="12" height="4" fill="#C49A68" opacity="0.55"/>
          <rect x="0" y="4" width="12" height="4" fill="#A87E50" opacity="0.35"/>
          <rect x="4" y="0" width="3" height="8" fill="#8C6A3C" opacity="0.28"/>
        </pattern>
      </defs>

      <path d={bodyPath} fill="url(#rattanBase)" />

      <g clipPath="url(#basketClip)">
        <rect x="0" y="0" width={w} height={h} fill="url(#weavePattern)" opacity="0.7" />
        {weaveLines.map(({ y, x1, x2 }, i) => (
          <line key={`h${i}`} x1={x1} y1={y} x2={x2} y2={y}
            stroke={i % 2 === 0 ? '#7A5830' : '#A07848'}
            strokeWidth={i % 3 === 0 ? 1.4 : 0.8}
            opacity="0.55"
          />
        ))}
        {diagLinesA.map(({ sx, sy }, i) => (
          <line key={`da${i}`} x1={sx} y1={sy} x2={sx + w * 0.55} y2={sy + h * 0.9}
            stroke="#8C6030" strokeWidth="0.7" opacity="0.22" />
        ))}
        {diagLinesA.map(({ sx, sy }, i) => (
          <line key={`db${i}`} x1={sx} y1={sy} x2={sx - w * 0.55} y2={sy + h * 0.9}
            stroke="#8C6030" strokeWidth="0.7" opacity="0.22" />
        ))}
        <ellipse
          cx={cx - rimHalfW * 0.45}
          cy={rimY + (baseY - rimY) * 0.28}
          rx={rimHalfW * 0.18}
          ry={(baseY - rimY) * 0.22}
          fill="white" opacity="0.12"
          transform={`rotate(-8 ${cx - rimHalfW * 0.45} ${rimY + (baseY - rimY) * 0.28})`}
        />
      </g>

      <ellipse cx={cx} cy={rimY} rx={rimHalfW} ry={h * 0.045}
        fill="#C49A62" stroke="#8C6030" strokeWidth="1.2" />
      {Array.from({ length: 14 }, (_, i) => {
        const angle = (i / 14) * Math.PI;
        const x = cx + rimHalfW * Math.cos(Math.PI + angle);
        const y = rimY + h * 0.045 * Math.sin(Math.PI + angle);
        return <line key={`r${i}`} x1={x} y1={y - 2} x2={x} y2={y + 2}
          stroke="#7A5030" strokeWidth="0.9" opacity="0.5" />;
      })}
      <ellipse cx={cx} cy={rimY - h * 0.01} rx={rimHalfW * 0.7} ry={h * 0.016}
        fill="white" opacity="0.2" />

      <ellipse cx={cx} cy={baseY} rx={baseHalfW} ry={h * 0.025}
        fill="#8C6230" stroke="#6A4820" strokeWidth="0.8" />

      {[-1, 1].map(side => {
        const hx = cx + side * (rimHalfW + 1);
        return (
          <g key={side}>
            <path
              d={`M${hx},${rimY + 2} Q${hx + side * w * 0.12},${rimY - h * 0.14} ${hx + side * w * 0.08},${rimY + h * 0.08}`}
              fill="none" stroke="#9C7040" strokeWidth="4.5" strokeLinecap="round" opacity="0.9"
            />
            <path
              d={`M${hx},${rimY + 2} Q${hx + side * w * 0.12},${rimY - h * 0.14} ${hx + side * w * 0.08},${rimY + h * 0.08}`}
              fill="none" stroke="#D4A870" strokeWidth="1.5" strokeLinecap="round" opacity="0.45"
            />
          </g>
        );
      })}
    </svg>
  );
}
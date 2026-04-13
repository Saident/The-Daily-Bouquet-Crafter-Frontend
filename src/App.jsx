import { useState, useRef, useEffect } from "react";
import Vase from "./components/Vase";
import GalleryCard from "./components/GalleryCard";
import { PARTICLE_COLORS, formatImageName } from "./utils/constants";

let Z = 1;

export default function App() {
  const [dailyFlowers, setDailyFlowers] = useState([]);
  const [placed, setPlaced] = useState([]);
  const [sel, setSel] = useState(null);
  const [title, setTitle] = useState('');
  const [gallery, setGallery] = useState([]);
  const [view, setView] = useState('craft');
  const [particles, setParticles] = useState([]);
  const [ghost, setGhost] = useState(null);
  const [saveFlash, setSaveFlash] = useState(false);
  const [easterEggUnlocked, setEasterEggUnlocked] = useState(false);
  const canvasRef = useRef(null);

  const selFlower = placed.find(f => f.id === sel);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const sorted = [...placed].sort((a, b) => (a.z || 0) - (b.z || 0));

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/inventory');
        const data = await res.json();
        setDailyFlowers(data.flowers);
      } catch (error) {
        console.error("Error fetching daily flowers:", error);
      }
    };
    const fetchGallery = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/bouquets');
        const data = await res.json();
        const formattedGallery = data.map(b => ({
          id: b.id,
          title: b.title,
          date: b.date,
          flowers: b.flowers.map(f => ({
            type: f.asset_url, x: f.x_position, y: f.y_position, rot: f.rotation, scale: 1, z: f.z_index
          }))
        }));
        setGallery(formattedGallery);
      } catch (error) {
        console.error("Error fetching gallery:", error);
      }
    };
    fetchInventory();
    fetchGallery();
  }, []);

  const onInventoryDown = (e, type) => {
    e.preventDefault();
    setGhost({ type, x: e.clientX, y: e.clientY });
    const onMove = (e) => setGhost({ type, x: e.clientX, y: e.clientY });
    const onUp = (e) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setGhost(null);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
        const id = `f${Date.now()}${Math.random()}`;
        const x = e.clientX - rect.left - 35;
        const y = e.clientY - rect.top - 35;
        setPlaced(p => [...p, { id, type, x, y, rot: 0, scale: 1, z: Z++ }]);
        setSel(id);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const onFlowerDown = (e, id, ox, oy) => {
    e.preventDefault();
    e.stopPropagation();
    setSel(id);
    setPlaced(p => p.map(f => f.id === id ? { ...f, z: Z++ } : f));
    const startX = e.clientX, startY = e.clientY;
    const onMove = (e) => {
      const dx = e.clientX - startX, dy = e.clientY - startY;
      setPlaced(p => p.map(f => f.id === id ? { ...f, x: ox + dx, y: oy + dy } : f));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const rotate = dir => setPlaced(p => p.map(f => f.id === sel ? { ...f, rot: f.rot + dir * 15 } : f));
  const rescale = d => setPlaced(p => p.map(f => f.id === sel ? { ...f, scale: Math.max(0.4, Math.min(2.2, f.scale + d)) } : f));
  const deleteSel = () => { setPlaced(p => p.filter(f => f.id !== sel)); setSel(null); };
  const clearAll = () => { setPlaced([]); setSel(null); };

  const handleSave = async () => {
    if (!placed.length) return;
    const arrangementTitle = title.trim() || `Bouquet ${gallery.length + 1}`;
    const payload = {
      title: arrangementTitle,
      items: placed.map(f => ({ asset_url: f.type, x_position: f.x, y_position: f.y, rotation: f.rot, z_index: f.z || 1 }))
    };
    try {
      const res = await fetch('http://localhost:8080/api/bouquets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === "success") {
        setEasterEggUnlocked(data.special);
        const bq = { id: data.bouquet_id || Date.now(), title: arrangementTitle, date: today, flowers: [...placed] };
        setGallery(g => [bq, ...g]);
        setParticles(Array.from({ length: 48 }, (_, i) => ({
          id: i,
          color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
          angle: Math.random() * Math.PI * 2,
          dist: 90 + Math.random() * 200,
          size: 5 + Math.random() * 9,
          delay: Math.random() * 0.25,
          dur: 0.9 + Math.random() * 0.8,
        })));
        setTimeout(() => setParticles([]), 2500);
        setSaveFlash(true);
        setTimeout(() => setSaveFlash(false), 2800);
        setPlaced([]); setSel(null); setTitle('');
      }
    } catch (error) {
      console.error("Error saving bouquet:", error);
    }
  };

  const handleDeleteBouquet = async (id) => {
    if (!window.confirm("Remove this bouquet from your greenhouse?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/bouquets/delete?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === "success") setGallery(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error("Error deleting bouquet:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#F7F2EB', fontFamily: "'Georgia', serif" }}>

      {/* ── HEADER ── */}
      <header style={{ background: '#FFFDF9', borderBottom: '1px solid #E6DDD0' }} className="shrink-0 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Monogram mark */}
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: '#3D2B1F', color: '#F7F2EB',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontFamily: 'Georgia, serif', letterSpacing: '0.05em', flexShrink: 0
          }}>✿</div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: '#1E1410', letterSpacing: '0.02em', margin: 0, lineHeight: 1.2 }}>
              Daily Bouquet
            </h1>
            <p style={{ fontSize: 11, color: '#A08878', margin: 0, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'system-ui, sans-serif' }}>
              {today}
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <nav style={{
          display: 'flex', gap: 3, background: '#F0E8DC',
          borderRadius: 12, padding: 4,
          border: '1px solid #E0D4C0'
        }}>
          {[
            { key: 'craft', label: '✂️ Craft' },
            { key: 'gallery', label: `🌿 Greenhouse${gallery.length ? ` · ${gallery.length}` : ''}` }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              style={{
                padding: '8px 20px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontSize: 15,
                fontFamily: 'Georgia, serif',
                fontWeight: view === key ? 600 : 400,
                color: view === key ? '#1E1410' : '#8A6E60',
                background: view === key ? '#FFFDF9' : 'transparent',
                boxShadow: view === key ? '0 1px 3px rgba(60,30,10,0.10)' : 'none',
                transition: 'all 0.15s ease',
                letterSpacing: '0.01em',
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {/* ── CRAFT VIEW ── */}
      {view === 'craft' && (
        <div className="flex flex-1 overflow-hidden min-h-0" style={{ gap: 0 }}>

          {/* LEFT PANEL — Garden inventory */}
          <aside style={{
            width: 140, flexShrink: 0,
            background: '#FFFDF9',
            borderRight: '1px solid #E6DDD0',
            display: 'flex', flexDirection: 'column',
            overflowY: 'auto', padding: '16px 10px 16px',
          }}>
            <p style={{
              fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: '#B09888', textAlign: 'center', margin: '0 0 14px',
              fontFamily: 'system-ui, sans-serif', fontWeight: 500,
            }}>
              🌿 Today's Garden
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {dailyFlowers.length > 0 ? dailyFlowers.map((type, i) => (
                <div
                  key={`${type}-${i}`}
                  onPointerDown={e => onInventoryDown(e, type)}
                  title={formatImageName(type)}
                  style={{
                    background: '#F7F2EB',
                    border: '1px solid #E0D4C0',
                    borderRadius: 12,
                    padding: '12px 8px 10px',
                    cursor: 'grab',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    userSelect: 'none', touchAction: 'none',
                    transition: 'border-color 0.15s, transform 0.1s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#C07050';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(80,30,10,0.10)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#E0D4C0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <img src={`/flowers/${type}`} alt={formatImageName(type)} style={{ width: 58, height: 58, objectFit: 'contain', pointerEvents: 'none' }} draggable="false" />
                  <span style={{ fontSize: 10, color: '#7A6050', textAlign: 'center', lineHeight: 1.3, fontFamily: 'system-ui, sans-serif' }}>
                    {formatImageName(type)}
                  </span>
                </div>
              )) : (
                // Placeholder skeleton cards while loading
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} style={{
                    background: '#F7F2EB', border: '1px solid #E0D4C0', borderRadius: 12,
                    padding: '12px 8px 10px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 8, opacity: 0.5,
                  }}>
                    {/* Flower petal SVG placeholder */}
                    <svg width="58" height="58" viewBox="0 0 58 58" fill="none">
                      <circle cx="29" cy="29" r="10" fill="#D8CCBC"/>
                      {[0,60,120,180,240,300].map(deg => (
                        <ellipse key={deg}
                          cx={29 + 16 * Math.cos((deg - 90) * Math.PI / 180)}
                          cy={29 + 16 * Math.sin((deg - 90) * Math.PI / 180)}
                          rx="7" ry="11"
                          transform={`rotate(${deg} ${29 + 16 * Math.cos((deg - 90) * Math.PI / 180)} ${29 + 16 * Math.sin((deg - 90) * Math.PI / 180)})`}
                          fill="#E8DECE"
                        />
                      ))}
                      <circle cx="29" cy="29" r="7" fill="#D0C4B0"/>
                    </svg>
                    <div style={{ width: 44, height: 8, background: '#D8CCBC', borderRadius: 4 }} />
                  </div>
                ))
              )}
            </div>
          </aside>

          {/* CENTER — Canvas */}
          <main className="flex-1 flex flex-col min-w-0" style={{ padding: 16 }}>
            <div
              ref={canvasRef}
              style={{
                flex: 1, position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(160deg, #FBF7F0 0%, #F2EDE3 100%)',
                border: '1.5px dashed #D8CCBC',
                borderRadius: 18,
                cursor: 'default',
              }}
              onClick={() => setSel(null)}
            >
              {/* Subtle dot grid */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.18 }}>
                <defs>
                  <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
                    <circle cx="12" cy="12" r="0.9" fill="#8A7060" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots)" />
              </svg>

              {/* Corner flourishes */}
              {['top-3 left-4', 'top-3 right-4'].map((pos, i) => (
                <div key={i} style={{
                  position: 'absolute', ...Object.fromEntries(pos.split(' ').map(s => s.split('-').length === 2 ? [s.split('-')[0], s.split('-')[1] + 'px'] : [])),
                  opacity: 0.12, pointerEvents: 'none', fontSize: 22, color: '#5A3820',
                  top: 12, [i === 0 ? 'left' : 'right']: 14,
                }}>✿</div>
              ))}

              {/* Vase */}
              <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none' }}>
                <Vase size={100} />
              </div>

              {/* Empty state */}
              {placed.length === 0 && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: 0.38, pointerEvents: 'none', zIndex: 5,
                }}>
                  <div style={{ fontSize: 36, opacity: 0.6 }}>✿</div>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#5A3820', margin: 0, fontStyle: 'italic' }}>
                    Drag flowers here
                  </p>
                  <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: '#8A7060', margin: 0 }}>
                    Arrange them to craft your bouquet
                  </p>
                </div>
              )}

              {/* Flowers */}
              {sorted.map(f => (
                <div
                  key={f.id}
                  style={{
                    position: 'absolute',
                    left: f.x, top: f.y,
                    transform: `rotate(${f.rot}deg) scale(${f.scale})`,
                    transformOrigin: '50% 50%',
                    zIndex: f.z || 1,
                    touchAction: 'none',
                    cursor: 'grab',
                    filter: f.id === sel ? 'drop-shadow(0 0 8px rgba(180, 100, 50, 0.65))' : 'none',
                    transition: 'filter 0.15s',
                  }}
                  onPointerDown={e => onFlowerDown(e, f.id, f.x, f.y)}
                  onClick={e => e.stopPropagation()}
                >
                  <img src={`/flowers/${f.type}`} alt="flower" style={{ width: 70, height: 70, objectFit: 'contain', pointerEvents: 'none' }} draggable="false" />
                </div>
              ))}

              {/* Particles */}
              {particles.map(p => (
                <div key={p.id}
                  className="absolute pointer-events-none z-[999] opacity-0 animate-particle-float"
                  style={{
                    left: '50%', top: '40%',
                    width: p.size, height: p.size,
                    borderRadius: p.id % 3 === 0 ? '3px' : '50%',
                    background: p.color,
                    '--px': `${Math.cos(p.angle) * p.dist}px`,
                    '--py': `${Math.sin(p.angle) * p.dist - 40}px`,
                    '--dur': `${p.dur}s`,
                    animationDelay: `${p.delay}s`,
                  }}
                />
              ))}

              {/* Save flash */}
              {saveFlash && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 998, pointerEvents: 'none',
                }}>
                  <div className="animate-flash-in" style={{
                    background: 'rgba(255,253,249,0.97)',
                    borderRadius: 20, padding: '28px 40px',
                    textAlign: 'center',
                    border: '1px solid #E0D4C0',
                    boxShadow: '0 12px 40px rgba(80,30,10,0.13)',
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🌸</div>
                    <p style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1E1410', margin: '0 0 4px', fontWeight: 600 }}>
                      {easterEggUnlocked ? '✨ Secret Unlocked!' : 'Bouquet Saved!'}
                    </p>
                    <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 12, color: '#8A7060', margin: 0 }}>
                      {easterEggUnlocked ? 'A rare flower awaits tomorrow' : 'Added to your greenhouse'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* RIGHT PANEL — Tools */}
          <aside style={{
            width: 200, flexShrink: 0,
            background: '#FFFDF9',
            borderLeft: '1px solid #E6DDD0',
            display: 'flex', flexDirection: 'column',
            padding: '16px 14px',
            gap: 16,
          }}>
            {/* Selected flower label */}
            <div>
              <p style={{
                fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#B09888', margin: '0 0 10px', fontFamily: 'system-ui, sans-serif', fontWeight: 500,
              }}>
                {selFlower ? 'Selected' : 'Flower tools'}
              </p>
              {selFlower && (
                <div style={{
                  background: '#F7F2EB', borderRadius: 8, padding: '7px 10px',
                  fontSize: 12, color: '#3D2B1F', fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  border: '1px solid #E0D4C0', marginBottom: 10,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {formatImageName(selFlower.type)}
                </div>
              )}
              {/* Rotate */}
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, color: '#B09888', margin: '0 0 5px', fontFamily: 'system-ui, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Rotate</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {[['↺', () => rotate(-1)], ['↻', () => rotate(1)]].map(([icon, fn]) => (
                    <ToolBtn key={icon} onClick={fn} disabled={!sel}>{icon}</ToolBtn>
                  ))}
                </div>
              </div>
              {/* Scale */}
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, color: '#B09888', margin: '0 0 5px', fontFamily: 'system-ui, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Size</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {[['−', () => rescale(-0.1)], ['+', () => rescale(0.1)]].map(([icon, fn]) => (
                    <ToolBtn key={icon} onClick={fn} disabled={!sel}>{icon}</ToolBtn>
                  ))}
                </div>
              </div>
              {/* Remove */}
              <ToolBtn
                onClick={deleteSel}
                disabled={!sel}
                danger
                style={{ width: '100%', marginTop: 2 }}
              >
                ✕ Remove
              </ToolBtn>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#E6DDD0', margin: '0 -2px' }} />

            {/* Name */}
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#B09888', margin: '0 0 8px', fontFamily: 'system-ui, sans-serif', fontWeight: 500 }}>
                Name it
              </p>
              <input
                type="text"
                placeholder="Morning Light…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={40}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#F7F2EB',
                  border: '1px solid #D8CCBC',
                  borderRadius: 8,
                  padding: '8px 10px',
                  fontSize: 12,
                  fontFamily: 'Georgia, serif',
                  fontStyle: title ? 'normal' : 'italic',
                  color: '#2C1810',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#B07050'}
                onBlur={e => e.target.style.borderColor = '#D8CCBC'}
              />
            </div>

            {/* Flower count */}
            {placed.length > 0 && (
              <p style={{ fontSize: 11, color: '#A08878', textAlign: 'center', margin: '-6px 0', fontFamily: 'system-ui, sans-serif' }}>
                {placed.length} flower{placed.length !== 1 ? 's' : ''} arranged
              </p>
            )}

            <div style={{ flex: 1 }} />

            {/* Clear */}
            <button
              onClick={clearAll}
              disabled={placed.length === 0}
              style={{
                background: 'transparent',
                border: '1px solid #D8CCBC',
                borderRadius: 8,
                padding: '8px',
                fontSize: 12,
                fontFamily: 'system-ui, sans-serif',
                color: '#7A6050',
                cursor: placed.length === 0 ? 'not-allowed' : 'pointer',
                opacity: placed.length === 0 ? 0.35 : 1,
                transition: 'all 0.15s',
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => { if (placed.length) e.currentTarget.style.background = '#F0E8DC'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              ⟳ Clear all
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={placed.length === 0}
              style={{
                background: placed.length === 0 ? '#C4856A' : '#3D2B1F',
                border: 'none',
                borderRadius: 12,
                padding: '12px 8px',
                fontSize: 13,
                fontFamily: 'Georgia, serif',
                fontWeight: 600,
                color: '#FFF9F3',
                cursor: placed.length === 0 ? 'not-allowed' : 'pointer',
                opacity: placed.length === 0 ? 0.4 : 1,
                transition: 'all 0.15s',
                letterSpacing: '0.03em',
              }}
              onMouseEnter={e => { if (placed.length) { e.currentTarget.style.background = '#5A3D28'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
              onMouseLeave={e => { e.currentTarget.style.background = placed.length ? '#3D2B1F' : '#C4856A'; e.currentTarget.style.transform = 'none'; }}
            >
              ✦ Save Bouquet
            </button>
          </aside>
        </div>
      )}

      {/* ── GALLERY VIEW ── */}
      {view === 'gallery' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1E1410', margin: '0 0 4px', fontWeight: 600 }}>
                Your Greenhouse
              </h2>
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#8A7060', margin: 0 }}>
                {gallery.length === 0
                  ? 'Save your first bouquet to begin your collection.'
                  : `${gallery.length} bouquet${gallery.length !== 1 ? 's' : ''} preserved`}
              </p>
            </div>

            {gallery.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: 280, gap: 12, opacity: 0.4,
              }}>
                <div style={{ fontSize: 48 }}>🌱</div>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#5A3820', margin: 0, fontStyle: 'italic' }}>
                  Your greenhouse awaits
                </p>
                <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#8A7060', margin: 0 }}>
                  Craft and save your first bouquet
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 16 }}>
                {gallery.map(b => (
                  <GalleryCard key={b.id} bouquet={b} onDelete={handleDeleteBouquet} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DRAG GHOST */}
      {ghost && (
        <div style={{
          position: 'fixed', pointerEvents: 'none', zIndex: 9999,
          left: ghost.x - 35, top: ghost.y - 35, opacity: 0.82, transform: 'scale(1.08)',
        }}>
          <img src={`/flowers/${ghost.type}`} alt="flower" style={{ width: 70, height: 70, objectFit: 'contain' }} draggable="false" />
        </div>
      )}
    </div>
  );
}

// ── Small reusable tool button ──
function ToolBtn({ children, onClick, disabled, danger, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: '#F7F2EB',
        border: `1px solid ${danger ? '#DDB8A8' : '#E0D4C0'}`,
        borderRadius: 8,
        padding: '8px 6px',
        fontSize: 13,
        fontFamily: 'system-ui, sans-serif',
        color: danger ? '#B04030' : '#3D2B1F',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transition: 'all 0.12s',
        textAlign: 'center',
        ...style,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = '#F0E8DC'; e.currentTarget.style.borderColor = danger ? '#C07050' : '#C07050'; } }}
      onMouseLeave={e => { e.currentTarget.style.background = '#F7F2EB'; e.currentTarget.style.borderColor = danger ? '#DDB8A8' : '#E0D4C0'; }}
    >
      {children}
    </button>
  );
}
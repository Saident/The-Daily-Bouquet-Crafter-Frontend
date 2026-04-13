import { useState, useRef, useEffect } from "react";
import Vase from "../components/Vase";
import { PARTICLE_COLORS, formatImageName } from "../utils/constants";

let Z = 1;

export default function Craft({ onSaveSuccess, galleryCount }) {
  const [dailyFlowers, setDailyFlowers] = useState([]);
  const [placed, setPlaced] = useState([]);
  const [sel, setSel] = useState(null);
  const [title, setTitle] = useState('');
  const [particles, setParticles] = useState([]);
  const [ghost, setGhost] = useState(null);
  const [saveFlash, setSaveFlash] = useState(false);
  const [easterEggUnlocked, setEasterEggUnlocked] = useState(false);
  const canvasRef = useRef(null);

  const selFlower = placed.find(f => f.id === sel);
  const sorted = [...placed].sort((a,b) => (a.z||0)-(b.z||0));

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
    fetchInventory();
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
    setPlaced(p => p.map(f => f.id === id ? {...f, z: Z++} : f));
    const startX = e.clientX, startY = e.clientY;
    const onMove = (e) => {
      const dx = e.clientX - startX, dy = e.clientY - startY;
      setPlaced(p => p.map(f => f.id === id ? {...f, x: ox+dx, y: oy+dy} : f));
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const rotate = dir => setPlaced(p => p.map(f => f.id === sel ? {...f, rot: f.rot + dir*15} : f));
  const rescale = d => setPlaced(p => p.map(f => f.id === sel ? {...f, scale: Math.max(0.4, Math.min(2.2, f.scale+d))} : f));
  const deleteSel = () => { setPlaced(p => p.filter(f => f.id !== sel)); setSel(null); };
  const clearAll = () => { setPlaced([]); setSel(null); };

  const handleSave = async () => {
    if (!placed.length) return;
    const arrangementTitle = title.trim() || `Bouquet ${galleryCount+1}`;
    
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
        onSaveSuccess(); // Tells App.jsx to refresh the global gallery count!

        setParticles(Array.from({length:48},(_,i) => ({
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

  return (
    <div className="flex flex-1 p-3.5 gap-3 overflow-hidden min-h-0">
      {/* LEFT: Inventory */}
      <div className="w-[118px] shrink-0 bg-[#FFF9F3] border-[1.5px] border-[#E0D4C4] rounded-2xl p-2 flex flex-col gap-1.5 overflow-y-auto">
        <div className="font-serif text-[13px] text-[#9A7A68] text-center mb-0.5 italic">
          Today's Garden
        </div>
        {dailyFlowers.map((type, i) => (
          <div 
            key={`${type}-${i}`} 
            onPointerDown={e => onInventoryDown(e, type)}
            className="bg-[#FFF9F3] border-[1.5px] border-[#E0D4C4] rounded-xl px-2 py-2.5 cursor-grab flex flex-col items-center gap-1 transition-all select-none touch-none hover:-translate-y-1 hover:shadow-md hover:border-[#C4856A] active:cursor-grabbing"
          >
            <img src={`/flowers/${type}`} alt="flower" className="w-[50px] h-[50px] object-contain pointer-events-none" draggable="false" />
            <span className="text-[10px] text-[#7A6050] text-center leading-tight mt-1">
              {formatImageName(type)}
            </span>
          </div>
        ))}
      </div>

      {/* CENTER: Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#F8F4EE] to-[#EDE8E0] border-2 border-dashed border-[#DDD0C0] rounded-2xl cursor-default"
          onClick={() => setSel(null)}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <defs>
              <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="1" fill="#A89878"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)"/>
          </svg>

          <div className="absolute top-3.5 left-4 text-xl opacity-20 pointer-events-none text-[#7A6050]">✿</div>
          <div className="absolute top-3.5 right-4 text-xl opacity-20 pointer-events-none text-[#7A6050] -scale-x-100">✿</div>
          <div className="absolute bottom-3.5 left-4 text-base opacity-15 pointer-events-none text-[#7A6050]">❦</div>
          <div className="absolute bottom-3.5 right-4 text-base opacity-15 pointer-events-none text-[#7A6050]">❦</div>

          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <Vase size={100}/>
          </div>

          {placed.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 opacity-40 pointer-events-none z-10">
              <div className="font-serif text-lg text-[#7A6050] italic">Drag flowers from the garden</div>
              <div className="text-xs text-[#9A7A68]">arrange them to craft your bouquet</div>
            </div>
          )}

          {sorted.map(f => (
            <div
              key={f.id}
              className={`absolute touch-none cursor-grab active:cursor-grabbing ${f.id === sel ? 'drop-shadow-[0_0_7px_rgba(196,133,106,0.75)]' : ''}`}
              style={{left:f.x, top:f.y, transform:`rotate(${f.rot}deg) scale(${f.scale})`, transformOrigin:'50% 50%', zIndex:f.z||1}}
              onPointerDown={e => onFlowerDown(e, f.id, f.x, f.y)}
              onClick={e => e.stopPropagation()} 
            >
              <img src={`/flowers/${f.type}`} alt="flower" className="w-[70px] h-[70px] object-contain pointer-events-none" draggable="false" />
            </div>
          ))}

          {particles.map(p => (
            <div key={p.id} 
              className="absolute left-1/2 top-[40%] pointer-events-none z-[999] opacity-0 animate-particle-float"
              style={{
                width: p.size, height: p.size, borderRadius: p.id % 3 === 0 ? '3px' : '50%', background: p.color,
                '--px': `${Math.cos(p.angle) * p.dist}px`, '--py': `${Math.sin(p.angle) * p.dist - 40}px`,
                '--dur': `${p.dur}s`, animationDelay: `${p.delay}s`
              }}
            />
          ))}

          {saveFlash && (
            <div className="absolute inset-0 flex items-center justify-center z-[998] pointer-events-none">
              <div className="bg-white/95 rounded-2xl px-9 py-5 text-center border-[1.5px] border-[#E0D4C4] shadow-[0_8px_32px_rgba(100,60,20,0.12)] animate-flash-in">
                <div className="text-[32px] mb-2">🌸</div>
                <div className="font-serif text-[22px] text-[#2C1F14] font-semibold">
                  {easterEggUnlocked ? '✨ Secret Unlocked!' : 'Bouquet Saved!'}
                </div>
                <div className="text-xs text-[#9A7A68] mt-1 font-sans">
                  {easterEggUnlocked ? 'A rare flower awaits tomorrow' : 'Added to your greenhouse'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Tools */}
      <div className="w-[152px] shrink-0 bg-[#FFF9F3] border-[1.5px] border-[#E0D4C4] rounded-2xl p-3 flex flex-col gap-2.5">
        <div>
          <div className="font-serif text-[13px] text-[#9A7A68] mb-2 italic min-h-[20px]">
            {selFlower ? `✦ ${formatImageName(selFlower.type)}` : 'Select a flower'}
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="grid grid-cols-2 gap-1">
              <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-lg py-1.5 text-[13px] text-[#3D2B1F] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed" onClick={() => rotate(-1)} disabled={!sel}>↺</button>
              <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-lg py-1.5 text-[13px] text-[#3D2B1F] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed" onClick={() => rotate(1)} disabled={!sel}>↻</button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-lg py-1.5 text-[13px] text-[#3D2B1F] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed" onClick={() => rescale(-0.1)} disabled={!sel}>−</button>
              <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-lg py-1.5 text-[13px] text-[#3D2B1F] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed" onClick={() => rescale(0.1)} disabled={!sel}>+</button>
            </div>
            <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-lg py-1.5 text-[13px] text-[#C05030] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-1" onClick={deleteSel} disabled={!sel}>✕ Remove</button>
          </div>
        </div>

        <div className="h-px bg-[#E8DDD0] my-1" />

        <div>
          <div className="font-serif text-[13px] text-[#9A7A68] mb-1.5 italic">Name it</div>
          <input type="text" placeholder="e.g. Morning Light" value={title} onChange={e => setTitle(e.target.value)} maxLength={40} className="w-full bg-[#FFF9F3] border-[1.5px] border-[#E0D4C4] rounded-lg px-2.5 py-2 text-[13px] text-[#3D2B1F] outline-none transition-colors focus:border-[#C4856A] placeholder-[#B8A898]" />
        </div>

        {placed.length > 0 && (
          <div className="text-[11px] text-[#9A7A68] text-center mt-1">
            {placed.length} flower{placed.length!==1?'s':''} arranged
          </div>
        )}

        <div className="flex-1" />

        <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-lg py-1.5 text-xs text-[#3D2B1F] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed mb-2" onClick={clearAll} disabled={placed.length===0}>
          ⟳ Clear
        </button>
        <button className="bg-[#C4856A] border-none text-white rounded-xl p-3 text-sm font-semibold tracking-wide transition-all hover:not-disabled:bg-[#B0704E] hover:not-disabled:-translate-y-[1px] hover:not-disabled:shadow-[0_6px_18px_rgba(196,133,106,0.35)] disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleSave} disabled={placed.length===0}>
          ✦ Save Bouquet
        </button>
      </div>

      {/* DRAG GHOST */}
      {ghost && (
        <div className="fixed pointer-events-none z-[9999] opacity-80 scale-105" style={{left: ghost.x-35, top: ghost.y-35}}>
          <img src={`/flowers/${ghost.type}`} alt="flower" className="w-[70px] h-[70px] object-contain" draggable="false" />
        </div>
      )}
    </div>
  );
}
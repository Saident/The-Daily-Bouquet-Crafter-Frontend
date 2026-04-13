import { useState, useEffect, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import GalleryCard from "./components/GalleryCard";
import { PARTICLE_COLORS, formatImageName } from "./utils/constants";

let Z = 1;

// --- CRAFT PAGE COMPONENT ---
function Craft({ onSaveSuccess, galleryCount }) {
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
        onSaveSuccess(); 

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
    <div className="flex-1 w-full flex justify-center overflow-hidden">
      
      {/* Centered App Container */}
      <div className="flex w-full max-w-[1280px] h-full p-4 md:p-6 gap-5 min-h-0">
        
        {/* LEFT MENU */}
        <div className="w-[140px] md:w-[160px] shrink-0 bg-[#FFF9F3] border-[1.5px] border-[#E0D4C4] rounded-2xl p-4 flex flex-col gap-3 overflow-y-auto">
          <div className="font-serif text-base md:text-[17px] text-[#9A7A68] text-center mb-1.5 italic">
            Today's Garden
          </div>
          {dailyFlowers.map((type, i) => (
            <div 
              key={`${type}-${i}`} 
              onPointerDown={e => onInventoryDown(e, type)}
              className="bg-[#FFF9F3] border-[1.5px] border-[#E0D4C4] rounded-xl px-2 py-3.5 cursor-grab flex flex-col items-center gap-2 transition-all select-none touch-none hover:-translate-y-1 hover:shadow-md hover:border-[#C4856A] active:cursor-grabbing"
            >
              <img src={`/flowers/${type}`} alt="flower" className="w-[64px] h-[64px] object-contain pointer-events-none" draggable="false" />
              <span className="text-xs text-[#7A6050] text-center leading-tight">
                {formatImageName(type)}
              </span>
            </div>
          ))}
        </div>

        {/* CENTER CANVAS */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-[#FCFBF9] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-[#E8DDD0] rounded-sm cursor-default"
          onClick={() => setSel(null)}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15]">
            <defs>
              <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="1" fill="#A89878"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)"/>
          </svg>

          <div className="absolute top-4 left-5 text-2xl opacity-20 pointer-events-none text-[#7A6050]">✿</div>
          <div className="absolute top-4 right-5 text-2xl opacity-20 pointer-events-none text-[#7A6050] -scale-x-100">✿</div>
          <div className="absolute bottom-4 left-5 text-lg opacity-15 pointer-events-none text-[#7A6050]">❦</div>
          <div className="absolute bottom-4 right-5 text-lg opacity-15 pointer-events-none text-[#7A6050]">❦</div>

          {placed.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 opacity-40 pointer-events-none z-10">
              <div className="font-serif text-[22px] text-[#7A6050] italic">Arrange your canvas</div>
              <div className="text-[14px] text-[#9A7A68]">drag flowers from the garden</div>
            </div>
          )}

          {sorted.map(f => (
            <div
              key={f.id}
              className={`absolute touch-none cursor-grab active:cursor-grabbing ${
                f.id === sel ? 'drop-shadow-[0_0_7px_rgba(196,133,106,0.75)]' : ''
              }`}
              style={{
                left: f.x,
                top: f.y,
                transform: `rotate(${f.rot}deg) scale(${f.scale})`,
                transformOrigin: '50% 50%',
                zIndex: f.z || 1
              }}
              onPointerDown={e => onFlowerDown(e, f.id, f.x, f.y)}
              onClick={e => e.stopPropagation()}
            >
              <img
                src={`/flowers/${f.type}`}
                alt="flower"
                className="w-[70px] h-[70px] object-contain pointer-events-none"
                draggable="false"
              />
            </div>
          ))}

          {particles.map(p => (
            <div
              key={p.id}
              className="absolute left-1/2 top-[40%] pointer-events-none z-[999] opacity-0 animate-particle-float"
              style={{
                width: p.size,
                height: p.size,
                borderRadius: p.id % 3 === 0 ? '3px' : '50%',
                background: p.color,
                '--px': `${Math.cos(p.angle) * p.dist}px`,
                '--py': `${Math.sin(p.angle) * p.dist - 40}px`,
                '--dur': `${p.dur}s`,
                animationDelay: `${p.delay}s`
              }}
            />
          ))}

          {saveFlash && (
            <div className="absolute inset-0 flex items-center justify-center z-[998] pointer-events-none">
              <div className="bg-white/95 rounded-2xl px-10 py-6 text-center border-[1.5px] border-[#E0D4C4] shadow-[0_8px_32px_rgba(100,60,20,0.12)] animate-flash-in">
                <div className="text-[36px] mb-2">🌸</div>
                <div className="font-serif text-[24px] text-[#2C1F14] font-semibold">
                  {easterEggUnlocked ? '✨ Secret Unlocked!' : 'Bouquet Saved!'}
                </div>
                <div className="text-[13px] text-[#9A7A68] mt-1 font-sans">
                  {easterEggUnlocked ? 'A rare flower awaits tomorrow' : 'Added to your greenhouse'}
                </div>
              </div>
            </div>
          )}

          {/* 🌸 GHOST PREVIEW */}
          {ghost && (
            <div
              className="fixed pointer-events-none z-[1000]"
              style={{
                left: ghost.x - 35,
                top: ghost.y - 35,
                opacity: 0.7,
                transform: "scale(1.05)"
              }}
            >
              <img
                src={`/flowers/${ghost.type}`}
                alt="ghost"
                className="w-[70px] h-[70px] object-contain"
              />
            </div>
          )}
        </div>

        {/* RIGHT MENU */}
        <div className="w-[200px] md:w-[220px] shrink-0 bg-[#FFF9F3] border-[1.5px] border-[#E0D4C4] rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <div className="font-serif text-base md:text-[17px] text-[#9A7A68] mb-3 italic min-h-[24px]">
              {selFlower ? `✦ ${formatImageName(selFlower.type)}` : 'Select a flower'}
            </div>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-lg py-2.5 text-[15px] text-[#3D2B1F] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed" onClick={() => rotate(-1)} disabled={!sel}>↺</button>
                <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-lg py-2.5 text-[15px] text-[#3D2B1F] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed" onClick={() => rotate(1)} disabled={!sel}>↻</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-lg py-2.5 text-[15px] text-[#3D2B1F] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed" onClick={() => rescale(-0.1)} disabled={!sel}>−</button>
                <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-lg py-2.5 text-[15px] text-[#3D2B1F] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed" onClick={() => rescale(0.1)} disabled={!sel}>+</button>
              </div>
              <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-lg py-2.5 mt-1.5 text-[14px] text-[#C05030] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center gap-1.5" onClick={deleteSel} disabled={!sel}>✕ Remove</button>
            </div>
          </div>

          <div className="h-px bg-[#E8DDD0] my-2" />

          <div>
            <div className="font-serif text-base text-[#9A7A68] mb-2.5 italic">Name it</div>
            <input type="text" placeholder="e.g. Morning Light" value={title} onChange={e => setTitle(e.target.value)} maxLength={40} className="w-full bg-[#FFF9F3] border-[1.5px] border-[#E0D4C4] rounded-xl px-3.5 py-3 text-[14px] text-[#3D2B1F] outline-none transition-colors focus:border-[#C4856A] placeholder-[#B8A898]" />
          </div>

          {placed.length > 0 && (
            <div className="text-[13px] text-[#9A7A68] text-center mt-2">
              {placed.length} flower{placed.length!==1?'s':''} arranged
            </div>
          )}

          <div className="flex-1" />

          <button className="bg-[#F8F2EA] border-[1.5px] border-[#E0D4C4] rounded-xl py-2.5 text-[14px] text-[#3D2B1F] transition-colors hover:not-disabled:bg-[#F0E8DC] hover:not-disabled:border-[#C4856A] disabled:opacity-35 disabled:cursor-not-allowed mb-3" onClick={clearAll} disabled={placed.length===0}>
            ⟳ Clear
          </button>
          <button className="bg-[#C4856A] border-none text-white rounded-xl py-4 px-2 text-[15px] font-semibold tracking-wide transition-all hover:not-disabled:bg-[#B0704E] hover:not-disabled:-translate-y-[1px] hover:not-disabled:shadow-[0_6px_18px_rgba(196,133,106,0.35)] disabled:opacity-40 disabled:cursor-not-allowed" onClick={handleSave} disabled={placed.length===0}>
            ✦ Save Bouquet
          </button>
        </div>
      </div>
    </div>
  );
}

// --- GREENHOUSE PAGE COMPONENT ---
function Greenhouse({ gallery, onDelete }) {
  return (
    <div className="flex-1 w-full overflow-y-auto p-5 md:px-6 flex justify-center">
      
      {/* Centered App Container */}
      <div className="w-full max-w-[1280px] h-full flex flex-col">
        <div className="font-serif text-[26px] text-[#2C1F14] mb-1">Your Greenhouse</div>
        <div className="text-[14px] text-[#9A7A68] mb-5">
          {gallery.length === 0 ? 'Save your first bouquet to begin your collection.' : `${gallery.length} bouquet${gallery.length!==1?'s':''} preserved`}
        </div>

        {gallery.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] gap-3 opacity-45 pb-20">
            <div className="text-[54px] mb-2">🌱</div>
            <div className="font-serif text-[22px] text-[#7A6050]">Your greenhouse awaits</div>
            <div className="text-[14px] text-[#9A7A68]">Craft and save your first bouquet</div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4 pb-10">
            {gallery.map(b => (
              <GalleryCard key={b.id} bouquet={b} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [gallery, setGallery] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
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

    fetchGallery(); 
  }, [refreshTrigger]); 

  const handleDeleteBouquet = async (id) => {
    if (!window.confirm("Are you sure you want to remove this from your greenhouse?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/bouquets/delete?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.status === "success") {
        setGallery(prev => prev.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error("Error deleting bouquet:", error);
    }
  };

  return (
    <div className="h-screen w-full bg-[#FAF6EF] font-sans flex flex-col overflow-hidden">
      <Navbar galleryCount={gallery.length} />
      
      <Routes>
        <Route 
          path="/" 
          element={
            <Craft 
              onSaveSuccess={() => setRefreshTrigger(prev => prev + 1)} 
              galleryCount={gallery.length} 
            />
          } 
        />
        <Route 
          path="/greenhouse" 
          element={<Greenhouse gallery={gallery} onDelete={handleDeleteBouquet} />} 
        />
      </Routes>
    </div>
  );
}
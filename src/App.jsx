// src/App.jsx
import { useState, useRef, useEffect } from "react";
import './App.css';
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
  const today = new Date().toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric'});
  const sorted = [...placed].sort((a,b) => (a.z||0)-(b.z||0));

// --- API CALLS ---
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

    // NEW: Fetch the saved greenhouse gallery from Postgres
    const fetchGallery = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/bouquets');
        const data = await res.json();
        
        // Map the database snake_case fields back into the format your UI expects
        const formattedGallery = data.map(b => ({
          id: b.id,
          title: b.title,
          date: b.date,
          flowers: b.flowers.map(f => ({
            type: f.asset_url,
            x: f.x_position,
            y: f.y_position,
            rot: f.rotation,
            scale: 1, // Default scale so the mini-preview works
            z: f.z_index
          }))
        }));
        
        setGallery(formattedGallery);
      } catch (error) {
        console.error("Error fetching gallery:", error);
      }
    };

    fetchInventory();
    fetchGallery(); // Trigger the fetch on load
  }, []);

  // --- EVENT HANDLERS ---
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

    const arrangementTitle = title.trim() || `Bouquet ${gallery.length+1}`;
    
    const payload = {
      title: arrangementTitle,
      items: placed.map(f => ({
        asset_url: f.type, 
        x_position: f.x,
        y_position: f.y,
        rotation: f.rot,
        z_index: f.z || 1,
      }))
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

// --- DELETE LOGIC ---
  const handleDeleteBouquet = async (id) => {
    // Add a quick confirmation so she doesn't accidentally delete a favorite
    if (!window.confirm("Are you sure you want to remove this from your greenhouse?")) return;

    try {
      const res = await fetch(`http://localhost:8080/api/bouquets/delete?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (data.status === "success") {
        // Remove it from the UI immediately
        setGallery(prevGallery => prevGallery.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error("Error deleting bouquet:", error);
    }
  };

  // --- RENDER ---
  return (
    <div style={{height:'100vh',background:'#FAF6EF',fontFamily:"'Nunito',sans-serif",display:'flex',flexDirection:'column',overflow:'hidden'}}>
      
      {/* HEADER */}
      <div style={{padding:'12px 20px',borderBottom:'1px solid #E8DDD0',background:'#FFF9F3',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:'#2C1F14',lineHeight:1}}>
            The Daily Bouquet Crafter
          </div>
          <div style={{fontSize:12,color:'#9A7A68',fontStyle:'italic',fontFamily:"'Cormorant Garamond',serif",marginTop:3}}>
            {today}
          </div>
        </div>
        <div style={{display:'flex',gap:4}}>
          <button className={`tabbtn${view==='craft'?' on':''}`} onClick={() => setView('craft')}>✦ Craft</button>
          <button className={`tabbtn${view==='gallery'?' on':''}`} onClick={() => setView('gallery')}>
            ❧ Greenhouse
            {gallery.length > 0 && <span style={{marginLeft:5,fontSize:11,background:'#C4856A',color:'white',borderRadius:8,padding:'1px 6px'}}>{gallery.length}</span>}
          </button>
        </div>
      </div>

      {/* CRAFT VIEW */}
      {view === 'craft' && (
        <div style={{display:'flex',flex:1,padding:'14px',gap:'12px',overflow:'hidden',minHeight:0}}>

          {/* LEFT: Inventory */}
          <div style={{width:118,flexShrink:0,background:'#FFF9F3',border:'1.5px solid #E0D4C4',borderRadius:16,padding:'12px 8px',display:'flex',flexDirection:'column',gap:7,overflowY:'auto'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'#9A7A68',textAlign:'center',marginBottom:2,fontStyle:'italic'}}>
              Today's Garden
            </div>
            {dailyFlowers.map((type, i) => (
              <div key={`${type}-${i}`} className="fbtn" onPointerDown={e => onInventoryDown(e, type)}>
                <img src={`/flowers/${type}`} alt="flower" style={{width: 50, height: 50, objectFit: 'contain'}} draggable="false" />
                <span style={{fontSize:10,color:'#7A6050',textAlign:'center',lineHeight:1.2, marginTop: 4}}>
                  {formatImageName(type)}
                </span>
              </div>
            ))}
          </div>

          {/* CENTER: Canvas */}
          <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
            <div
              ref={canvasRef}
              style={{flex:1,position:'relative',overflow:'hidden',background:'linear-gradient(155deg,#F8F4EE 0%,#EDE8E0 100%)',border:'2px dashed #DDD0C0',borderRadius:20,cursor:'default'}}
              onClick={() => setSel(null)}
            >
              <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0.22}}>
                <defs>
                  <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
                    <circle cx="14" cy="14" r="1" fill="#A89878"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dots)"/>
              </svg>

              <div style={{position:'absolute',top:14,left:16,fontSize:20,opacity:0.2,pointerEvents:'none',color:'#7A6050'}}>✿</div>
              <div style={{position:'absolute',top:14,right:16,fontSize:20,opacity:0.2,pointerEvents:'none',color:'#7A6050',transform:'scaleX(-1)'}}>✿</div>
              <div style={{position:'absolute',bottom:14,left:16,fontSize:16,opacity:0.15,pointerEvents:'none',color:'#7A6050'}}>❦</div>
              <div style={{position:'absolute',bottom:14,right:16,fontSize:16,opacity:0.15,pointerEvents:'none',color:'#7A6050'}}>❦</div>

              <div style={{position:'absolute',bottom:-6,left:'50%',transform:'translateX(-50%)',zIndex:2,pointerEvents:'none'}}>
                <Vase size={100}/>
              </div>

              {placed.length === 0 && (
                <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,opacity:0.4,pointerEvents:'none',zIndex:1}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:'#7A6050',fontStyle:'italic'}}>Drag flowers from the garden</div>
                  <div style={{fontSize:12,color:'#9A7A68'}}>arrange them to craft your bouquet</div>
                </div>
              )}

              {sorted.map(f => (
                <div
                  key={f.id}
                  className={`cf${f.id === sel ? ' sel' : ''}`}
                  style={{left:f.x,top:f.y,transform:`rotate(${f.rot}deg) scale(${f.scale})`,transformOrigin:'50% 50%',zIndex:f.z||1}}
                  onPointerDown={e => onFlowerDown(e, f.id, f.x, f.y)}
                  onClick={e => e.stopPropagation()} 
                >
                  <img src={`/flowers/${f.type}`} alt="flower" style={{width: 70, height: 70, objectFit: 'contain', pointerEvents: 'none'}} draggable="false" />
                </div>
              ))}

              {particles.map(p => (
                <div key={p.id} style={{
                  position:'absolute',left:'50%',top:'40%',
                  width:p.size,height:p.size,
                  borderRadius:p.id%3===0?'3px':'50%',
                  background:p.color,
                  pointerEvents:'none',zIndex:999,
                  '--px':`${Math.cos(p.angle)*p.dist}px`,
                  '--py':`${Math.sin(p.angle)*p.dist-40}px`,
                  animation:`particleFloat ${p.dur}s ease-out forwards`,
                  animationDelay:`${p.delay}s`,
                  opacity:0,
                  animationFillMode:'both',
                }}/>
              ))}

              {saveFlash && (
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:998,pointerEvents:'none'}}>
                  <div style={{background:'rgba(255,253,248,0.95)',borderRadius:20,padding:'20px 36px',textAlign:'center',border:'1.5px solid #E0D4C4',boxShadow:'0 8px 32px rgba(100,60,20,0.12)',animation:'flashIn 2.5s ease forwards'}}>
                    <div style={{fontSize:32,marginBottom:8}}>🌸</div>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:'#2C1F14',fontWeight:600}}>
                      {easterEggUnlocked ? '✨ Secret Unlocked!' : 'Bouquet Saved!'}
                    </div>
                    <div style={{fontSize:12,color:'#9A7A68',marginTop:5,fontFamily:'Nunito'}}>
                      {easterEggUnlocked ? 'A rare flower awaits tomorrow' : 'Added to your greenhouse'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Tools */}
          <div style={{width:152,flexShrink:0,background:'#FFF9F3',border:'1.5px solid #E0D4C4',borderRadius:16,padding:'14px 11px',display:'flex',flexDirection:'column',gap:11}}>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'#9A7A68',marginBottom:8,fontStyle:'italic',minHeight:20}}>
                {selFlower ? `✦ ${formatImageName(selFlower.type)}` : 'Select a flower'}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
                  <button className="cbtn" onClick={() => rotate(-1)} disabled={!sel} title="Rotate left">↺</button>
                  <button className="cbtn" onClick={() => rotate(1)} disabled={!sel} title="Rotate right">↻</button>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:5}}>
                  <button className="cbtn" onClick={() => rescale(-0.1)} disabled={!sel} title="Shrink">−</button>
                  <button className="cbtn" onClick={() => rescale(0.1)} disabled={!sel} title="Grow">+</button>
                </div>
                <button className="cbtn" onClick={deleteSel} disabled={!sel} style={{color:'#C05030'}}>✕ Remove</button>
              </div>
            </div>

            <div style={{height:1,background:'#E8DDD0'}}/>

            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'#9A7A68',marginBottom:6,fontStyle:'italic'}}>Name it</div>
              <input type="text" placeholder="e.g. Morning Light" value={title} onChange={e => setTitle(e.target.value)} maxLength={40}/>
            </div>

            {placed.length > 0 && (
              <div style={{fontSize:11,color:'#9A7A68',textAlign:'center'}}>
                {placed.length} flower{placed.length!==1?'s':''} arranged
              </div>
            )}

            <div style={{flex:1}}/>

            <button className="cbtn" onClick={clearAll} disabled={placed.length===0} style={{fontSize:12}}>
              ⟳ Clear
            </button>
            <button className="sbtn" onClick={handleSave} disabled={placed.length===0}>
              ✦ Save Bouquet
            </button>
          </div>
        </div>
      )}

      {/* GALLERY VIEW */}
      {view === 'gallery' && (
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>
          <div style={{maxWidth:820,margin:'0 auto'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:'#2C1F14',marginBottom:4}}>Your Greenhouse</div>
            <div style={{fontSize:13,color:'#9A7A68',marginBottom:20}}>
              {gallery.length === 0 ? 'Save your first bouquet to begin your collection.' : `${gallery.length} bouquet${gallery.length!==1?'s':''} preserved`}
            </div>

            {gallery.length === 0 ? (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:280,gap:12,opacity:0.45}}>
                <div style={{fontSize:48}}>🌱</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#7A6050'}}>Your greenhouse awaits</div>
                <div style={{fontSize:13,color:'#9A7A68'}}>Craft and save your first bouquet</div>
              </div>
            ) : (
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))',gap:16}}>
                {gallery.map(b => (
                  <div key={b.id} style={{ position: 'relative' }}>
                    <GalleryCard key={b.id} bouquet={b} onDelete={handleDeleteBouquet} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DRAG GHOST */}
      {ghost && (
        <div style={{position:'fixed',left:ghost.x-35,top:ghost.y-35,pointerEvents:'none',zIndex:9999,opacity:0.82,transform:'scale(1.08)'}}>
          <img src={`/flowers/${ghost.type}`} alt="flower" style={{width: 70, height: 70, objectFit: 'contain'}} draggable="false" />
        </div>
      )}
    </div>
  );
}
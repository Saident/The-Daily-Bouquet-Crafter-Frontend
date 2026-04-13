import Vase from './Vase';
import { PREVIEW_POSITIONS, formatImageName } from '../utils/constants';

export default function GalleryCard({ bouquet, onDelete }) {
  return (
    <div className="gcard" style={{ position: 'relative' }}>
      
      {/* NEW: The Delete Button */}
      <button 
        onClick={() => onDelete(bouquet.id)}
        style={{
          position: 'absolute', top: 18, right: 18, zIndex: 10,
          background: 'rgba(255, 255, 255, 0.85)', border: '1px solid #E0D4C4', 
          borderRadius: '50%', width: 26, height: 26, 
          cursor: 'pointer', color: '#C05030', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', fontSize: 13, 
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)', transition: 'all 0.2s'
        }}
        title="Remove from Greenhouse"
        onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        ✕
      </button>

      <div style={{height:150,background:'linear-gradient(155deg,#F8F4EE,#EDE8E0)',borderRadius:10,position:'relative',overflow:'hidden',marginBottom:10}}>
        <div style={{position:'absolute',bottom:-4,left:'50%',transform:'translateX(-50%)',opacity:0.75}}>
          <Vase size={60}/>
        </div>
        {bouquet.flowers.slice(0,8).map((f,fi) => {
          const pos = PREVIEW_POSITIONS[fi] || {x:`${15+fi*9}%`,y:'8%'};
          return (
            <div key={fi} style={{position:'absolute',left:pos.x,top:pos.y,transform:`rotate(${f.rot}deg) scale(${f.scale*0.38})`,transformOrigin:'center bottom'}}>
              <img src={`/flowers/${f.type}`} alt="flower" style={{width: 70, height: 70, objectFit: 'contain'}} draggable="false" />
            </div>
          );
        })}
      </div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,color:'#2C1F14',marginBottom:2}}>
        {bouquet.title}
      </div>
      <div style={{fontSize:11,color:'#9A7A68',marginBottom:8}}>
        {bouquet.date}
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
        {[...new Set(bouquet.flowers.map(f => f.type))].map(t => (
          <span key={t} style={{fontSize:10,padding:'2px 7px',borderRadius:8,background:'#F5EFE7',color:'#5C3A28',border:'1px solid #E0D4C4'}}>
            {formatImageName(t)}
          </span>
        ))}
      </div>
    </div>
  );
}
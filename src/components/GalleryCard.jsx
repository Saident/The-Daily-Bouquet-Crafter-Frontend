import Vase from './Vase';
import { PREVIEW_POSITIONS, formatImageName } from '../utils/constants';

export default function GalleryCard({ bouquet, onDelete }) {
  return (
    <div className="bg-[#FFF9F3] border-[1.5px] border-[#E0D4C4] rounded-2xl p-3 relative animate-pop-in">
      
      <button 
        onClick={() => onDelete(bouquet.id)}
        className="absolute top-[18px] right-[18px] z-10 bg-white/85 border border-[#E0D4C4] rounded-full w-[26px] h-[26px] cursor-pointer text-[#C05030] flex items-center justify-center text-[13px] shadow-sm transition-all duration-200 hover:bg-white hover:scale-110"
        title="Remove from Greenhouse"
      >
        ✕
      </button>

      <div className="h-[150px] bg-gradient-to-br from-[#F8F4EE] to-[#EDE8E0] rounded-[10px] relative overflow-hidden mb-2.5">
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-75">
          <Vase size={60}/>
        </div>
        {bouquet.flowers.slice(0,8).map((f,fi) => {
          const pos = PREVIEW_POSITIONS[fi] || {x:`${15+fi*9}%`,y:'8%'};
          return (
            <div key={fi} className="absolute origin-bottom" style={{left:pos.x, top:pos.y, transform:`rotate(${f.rot}deg) scale(${f.scale*0.38})`}}>
              <img src={`/flowers/${f.type}`} alt="flower" className="w-[70px] h-[70px] object-contain" draggable="false" />
            </div>
          );
        })}
      </div>
      <div className="font-serif text-[17px] font-semibold text-[#2C1F14] mb-0.5">
        {bouquet.title}
      </div>
      <div className="text-[11px] text-[#9A7A68] mb-2">
        {bouquet.date}
      </div>
      <div className="flex flex-wrap gap-1">
        {[...new Set(bouquet.flowers.map(f => f.type))].map(t => (
          <span key={t} className="text-[10px] px-2 py-0.5 rounded-lg bg-[#F5EFE7] text-[#5C3A28] border border-[#E0D4C4]">
            {formatImageName(t)}
          </span>
        ))}
      </div>
    </div>
  );
}
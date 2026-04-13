import { formatImageName } from '../utils/constants';

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

      <div className="h-[150px] bg-[#FCFBF9] shadow-[inset_0_2px_8px_rgba(0,0,0,0.03)] border border-[#E8DDD0] rounded-sm relative overflow-hidden mb-3">
        {bouquet.flowers.map((f, fi) => {
          
          // Fallback check: If the DB has old absolute pixel coordinates from your earlier tests,
          // normalize them to rough percentages so they don't fly off the screen.
          const isOldPixelData = f.x > 100 || f.y > 100;
          const xPct = isOldPixelData ? (f.x / 800) * 100 : f.x;
          const yPct = isOldPixelData ? (f.y / 600) * 100 : f.y;

          return (
            <div 
              key={fi} 
              className="absolute" 
              style={{
                left: `${xPct}%`, 
                top: `${yPct}%`, 
                // FIX: Shrink the image with a base scale of 0.25 to fit the tiny thumbnail
                transform: `translate(-50%, -50%) rotate(${f.rot}deg) scale(${(f.scale || 1) * 0.25})`,
                transformOrigin: '50% 50%',
                zIndex: f.z || 1
              }}
            >
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
        {[...new Set(bouquet.flowers.map(f => f.type))].slice(0, 5).map(t => (
          <span key={t} className="text-[10px] px-2 py-0.5 rounded-lg bg-[#F5EFE7] text-[#5C3A28] border border-[#E0D4C4]">
            {formatImageName(t)}
          </span>
        ))}
      </div>
    </div>
  );
}
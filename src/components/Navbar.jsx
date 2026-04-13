import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ galleryCount }) {
  const location = useLocation();
  const today = new Date().toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric'});

  return (
    <div className="px-5 py-3 border-b border-[#E8DDD0] bg-[#FFF9F3] flex items-center justify-between shrink-0">
      <div>
        <div className="font-serif text-[26px] font-semibold text-[#2C1F14] leading-none">
          The Daily Bouquet Crafter
        </div>
        <div className="text-xs text-[#9A7A68] italic font-serif mt-1">
          {today}
        </div>
      </div>
      <div className="flex gap-1">
        <Link 
          to="/"
          className={`px-3.5 py-2 rounded-lg font-serif text-base cursor-pointer transition-colors ${location.pathname === '/' ? 'bg-[#F3EDE3] text-[#2C1F14]' : 'text-[#9A7A68] hover:bg-[#F5EFE740]'}`} 
        >
          ✦ Craft
        </Link>
        <Link 
          to="/greenhouse"
          className={`px-3.5 py-2 rounded-lg font-serif text-base cursor-pointer transition-colors flex items-center ${location.pathname === '/greenhouse' ? 'bg-[#F3EDE3] text-[#2C1F14]' : 'text-[#9A7A68] hover:bg-[#F5EFE740]'}`} 
        >
          ❧ Greenhouse
          {galleryCount > 0 && <span className="ml-1.5 text-[11px] bg-[#C4856A] text-white rounded-lg px-1.5 py-px leading-none">{galleryCount}</span>}
        </Link>
      </div>
    </div>
  );
}
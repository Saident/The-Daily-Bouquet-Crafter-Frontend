import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ galleryCount }) {
  const location = useLocation();
  const today = new Date().toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric'});

  return (
    <div className="border-b border-[#E8DDD0] bg-[#FFF9F3] shrink-0 w-full flex justify-center">
      <div className="max-w-[1280px] w-full px-6 md:px-8 py-4 flex items-center justify-between">
        
        <div>
          <div className="font-serif text-[26px] md:text-[28px] font-semibold text-[#2C1F14] leading-none">
            The Daily Bouquet Crafter
          </div>
          <div className="text-xs md:text-sm text-[#9A7A68] italic font-serif mt-1.5">
            {today}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link 
            to="/"
            className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-serif text-base md:text-lg cursor-pointer transition-all duration-200 ${location.pathname === '/' ? 'text-[#2C1F14]' : 'text-[#9A7A68] hover:bg-[#F5EFE740]'}`} 
          >
            ✦ Craft
          </Link>
          <Link 
            to="/greenhouse"
            className={`px-4 py-2 md:px-5 md:py-2.5 rounded-xl font-serif text-base md:text-lg cursor-pointer transition-all duration-200 flex items-center ${location.pathname === '/greenhouse' ? 'text-[#2C1F14]' : 'text-[#9A7A68] hover:bg-[#F5EFE740]'}`} 
          >
            ❧ Greenhouse
            {galleryCount > 0 && (
              <span className="ml-2 text-[11px] md:text-xs bg-[#C4856A] text-white rounded-lg px-2 py-0.5 leading-none shadow-sm">
                {galleryCount}
              </span>
            )}
          </Link>
        </div>

      </div>
    </div>
  );
}
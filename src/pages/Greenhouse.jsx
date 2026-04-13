import GalleryCard from "../components/GalleryCard";

export default function Greenhouse({ gallery, onDelete }) {
  return (
    <div className="flex-1 overflow-y-auto p-5 md:px-6">
      <div className="max-w-[820px] mx-auto">
        <div className="font-serif text-[26px] text-[#2C1F14] mb-1">Your Greenhouse</div>
        <div className="text-[13px] text-[#9A7A68] mb-5">
          {gallery.length === 0 ? 'Save your first bouquet to begin your collection.' : `${gallery.length} bouquet${gallery.length!==1?'s':''} preserved`}
        </div>

        {gallery.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[280px] gap-3 opacity-45">
            <div className="text-[48px]">🌱</div>
            <div className="font-serif text-xl text-[#7A6050]">Your greenhouse awaits</div>
            <div className="text-[13px] text-[#9A7A68]">Craft and save your first bouquet</div>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
            {gallery.map(b => (
              <GalleryCard key={b.id} bouquet={b} onDelete={onDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
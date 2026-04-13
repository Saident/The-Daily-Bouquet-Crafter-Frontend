import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Craft from "./pages/Craft";
import Greenhouse from "./pages/Greenhouse";

export default function App() {
  const [gallery, setGallery] = useState([]);
  
  // 1. Create a trigger state
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 2. Define the fetch strictly inside the effect
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
    <div className="h-screen bg-[#FAF6EF] font-sans flex flex-col overflow-hidden">
      <Navbar galleryCount={gallery.length} />
      
      <Routes>
        <Route 
          path="/" 
          element={
            <Craft 
              // 4. Increment the trigger on save to force a refresh
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
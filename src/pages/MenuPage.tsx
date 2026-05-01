import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { Link } from "react-router-dom";
import { ShoppingCart, Plus, Search, Utensils, ArrowLeft } from "lucide-react";
import { MenuItem } from "./admin/MenuManagement";
import { formatNaira } from "../utils/format";
import { cn } from "../utils/cn";

export const MenuPage: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map(item => item.category)));
    return ["All", ...cats];
  }, [menu]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menu"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setMenu(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "menu");
    });
    return () => unsubscribe();
  }, []);

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, categoryFilter, searchTerm]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-dark hover:text-red-600 transition-colors">
            <ArrowLeft size={20} />
            <span className="font-bold text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-red-600 p-1.5 rounded-lg">
              <Utensils className="text-white" size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight uppercase">Menu</span>
          </div>
          <Link to="/login" className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-colors">
            Order Now
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap",
                  categoryFilter === cat 
                    ? "bg-red-600 text-white border-red-600 shadow-md" 
                    : "bg-white text-gray-500 border-gray-200 hover:border-red-600 hover:text-red-600"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        {filteredMenu.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <Utensils size={48} className="mx-auto text-gray-200" />
            <p className="text-gray-500 font-medium">No items found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMenu.map(item => (
              <div key={item.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all flex flex-col">
                <div className="aspect-[4/3] bg-gray-50 relative">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    loading="lazy"
                  />
                  {item.stockQuantity <= 0 && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-red-600 font-bold text-xs uppercase tracking-widest border-2 border-red-600 px-3 py-1 rounded">Sold Out</span>
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-dark text-base leading-tight mb-1">{item.name}</h3>
                    <p className="text-red-600 font-bold text-lg">{formatNaira(item.price)}</p>
                  </div>
                  <Link 
                    to="/signup" 
                    className={cn(
                      "w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all",
                      item.stockQuantity > 0 
                        ? "bg-red-600 text-white hover:bg-red-700 shadow-md active:scale-95" 
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    <Plus size={14} /> Add to Cart
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Simplified Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            &copy; {new Date().getFullYear()} Queen Eatery Palace and Event Hall
          </p>
        </div>
      </footer>
    </div>
  );
};

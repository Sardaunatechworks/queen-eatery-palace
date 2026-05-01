import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { formatNaira } from "../../utils/format";
import { useUI } from "../../context/UIContext";
import { Plus, Trash2, Search, Filter, UtensilsCrossed, X, Edit } from "lucide-react";
import { cn } from "../../utils/cn";
import { ImageUpload } from "../../components/ImageUpload";

const CATEGORIES = ["Meals", "Rice Dishes", "Soups", "Drinks", "Snacks", "Desserts"];

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  isAvailable?: boolean;
  stockQuantity: number;
}

export const MenuManagement: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [formData, setFormData] = useState({ name: "", price: "", image: "", category: CATEGORIES[0], stockQuantity: "0" });
  
  const { setLoading: setGlobalLoading, showToast } = useUI();

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
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [menu, searchTerm, categoryFilter]);

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: "", price: "", image: "", category: CATEGORIES[0], stockQuantity: "0" });
  };

  const handleEditClick = (item: MenuItem) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      image: item.image,
      category: item.category,
      stockQuantity: item.stockQuantity.toString()
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      const dataToSave = {
        name: formData.name,
        price: Number(formData.price),
        image: formData.image || "https://picsum.photos/seed/food/400/300",
        category: formData.category,
        stockQuantity: Number(formData.stockQuantity) || 0
      };

      if (editingId) {
        await updateDoc(doc(db, "menu", editingId), dataToSave);
        showToast("Menu item updated successfully", "success");
      } else {
        await addDoc(collection(db, "menu"), {
          ...dataToSave,
          isAvailable: true
        });
        showToast("Menu item added successfully", "success");
      }
      closeModal();
    } catch (error: any) {
      showToast(editingId ? "Failed to update item" : "Failed to add menu item", "error");
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, "menu");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      setGlobalLoading(true);
      try {
        await deleteDoc(doc(db, "menu", id));
        showToast("Item deleted successfully", "success");
      } catch (error: any) {
        showToast("Failed to delete item", "error");
        handleFirestoreError(error, OperationType.DELETE, `menu/${id}`);
      } finally {
        setGlobalLoading(false);
      }
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark tracking-tight">Menu</h2>
          <p className="text-sm text-gray-500">Manage your restaurant menu items.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-sm font-semibold text-sm"
        >
          <Plus size={18} /> Add Menu Item
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search menu..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm appearance-none min-w-[140px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredMenu.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 border-dashed">
          <UtensilsCrossed className="text-gray-200 mb-2" size={40} />
          <p className="font-semibold text-gray-400">No items found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredMenu.map(item => (
            <div 
              key={item.id} 
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 group hover:shadow-md transition-all"
            >
              <div className="relative h-40 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" referrerPolicy="no-referrer" />
                <div className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 rounded-full text-[10px] font-bold text-primary uppercase border border-gray-100">
                  {item.category}
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-dark text-base leading-tight">{item.name}</h3>
                  <span className="text-primary font-bold text-base">{formatNaira(item.price)}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                  <button 
                    onClick={async () => {
                      try {
                        const newStatus = item.isAvailable === false;
                        await updateDoc(doc(db, "menu", item.id), { isAvailable: newStatus });
                        showToast(`"${item.name}" is now ${newStatus ? 'available' : 'unavailable'}`, "success");
                      } catch (e) {
                        showToast("Failed to update status", "error");
                      }
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all border",
                      item.isAvailable !== false 
                        ? "bg-green-50 text-green-600 border-green-100 hover:bg-green-100" 
                        : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                    )}
                  >
                    {item.isAvailable !== false ? "Available" : "Unavailable"}
                  </button>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleEditClick(item)} 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Item"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id, item.name)} 
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      item.stockQuantity > 0 ? "bg-gray-100 text-gray-500" : "bg-red-100 text-red-600"
                    )}>
                      Stock: {item.stockQuantity}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={closeModal}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-dark hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-6 text-dark tracking-tight">{editingId ? "Update Menu Item" : "Add Menu Item"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Item Name</label>
                <input type="text" placeholder="Jollof Rice" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Price (₦)</label>
                  <input type="number" step="0.01" placeholder="0.00" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Initial Stock</label>
                  <input type="number" placeholder="0" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Item Photo</label>
                <ImageUpload 
                  onUploadComplete={(url) => setFormData({...formData, image: url})} 
                  folder="menu"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Category</label>
                <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-primary-dark transition-all shadow-sm">{editingId ? "Update Item" : "Add Item"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, doc, deleteDoc, addDoc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { useUI } from "../../context/UIContext";
import { Plus, Trash2, AlertTriangle, Search, Package, Minus, Plus as PlusIcon, X, CheckCircle2 } from "lucide-react";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  threshold: number;
}

export const InventoryManagement: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ name: "", quantity: "", threshold: "" });
  
  const { setLoading: setGlobalLoading, showToast } = useUI();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "inventory"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
      setInventory(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "inventory");
    });
    return () => unsubscribe();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      await addDoc(collection(db, "inventory"), {
        name: formData.name,
        quantity: Number(formData.quantity),
        threshold: Number(formData.threshold)
      });
      setShowModal(false);
      setFormData({ name: "", quantity: "", threshold: "" });
      showToast("Item added successfully", "success");
    } catch (error: any) {
      showToast("Failed to add item", "error");
      handleFirestoreError(error, OperationType.CREATE, "inventory");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      setGlobalLoading(true);
      try {
        await deleteDoc(doc(db, "inventory", id));
        showToast("Item deleted", "success");
      } catch (error: any) {
        showToast("Failed to delete item", "error");
        handleFirestoreError(error, OperationType.DELETE, `inventory/${id}`);
      } finally {
        setGlobalLoading(false);
      }
    }
  };

  const updateInventoryQuantity = async (id: string, name: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    try {
      await updateDoc(doc(db, "inventory", id), { quantity: newQuantity });
      const item = inventory.find(i => i.id === id);
      if (item && newQuantity <= item.threshold) {
        showToast(`${name} is low on stock!`, "info");
      }
    } catch (error: any) {
      showToast("Failed to update quantity", "error");
      handleFirestoreError(error, OperationType.UPDATE, `inventory/${id}`);
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
          <h2 className="text-xl font-bold text-dark tracking-tight">Inventory</h2>
          <p className="text-sm text-gray-500">Monitor and manage your stock levels.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-sm font-semibold text-sm"
        >
          <Plus size={18} /> Add Item
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text" 
          placeholder="Search inventory..." 
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredInventory.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 border-dashed">
          <Package className="text-gray-200 mb-2" size={40} />
          <p className="font-semibold text-gray-400">No items found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Mobile Inventory Cards */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
            {filteredInventory.map(item => {
              const isLow = item.quantity <= item.threshold;
              return (
                <div key={item.id} className={`p-4 rounded-2xl border ${isLow ? 'bg-red-50/50 border-red-100' : 'bg-gray-50/50 border-gray-100'} space-y-4`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Item Name</p>
                      <p className="font-bold text-dark text-sm">{item.name}</p>
                    </div>
                    {isLow ? (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black uppercase rounded-full">Low Stock</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-black uppercase rounded-full">In Stock</span>
                    )}
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quantity</p>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateInventoryQuantity(item.id, item.name, item.quantity - 1)} 
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateInventoryQuantity(item.id, item.name, item.quantity + 1)} 
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-lg border border-gray-200 shadow-sm"
                        >
                          <PlusIcon size={14} />
                        </button>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(item.id, item.name)} className="p-2 text-gray-300 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Inventory Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Item Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight text-center">Quantity</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight text-center">Threshold</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(item => {
                  const isLow = item.quantity <= item.threshold;
                  return (
                    <tr key={item.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${isLow ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4 font-semibold text-dark text-sm">{item.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => updateInventoryQuantity(item.id, item.name, item.quantity - 1)} 
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:text-red-500 transition-all shadow-sm"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-bold text-dark text-sm">{item.quantity}</span>
                          <button 
                            onClick={() => updateInventoryQuantity(item.id, item.name, item.quantity + 1)} 
                            className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 hover:text-green-600 transition-all shadow-sm"
                          >
                            <PlusIcon size={14} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500 text-sm font-medium">{item.threshold}</td>
                      <td className="px-6 py-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-50 text-red-700 text-[11px] font-bold uppercase tracking-tight rounded-full border border-red-100">
                            <AlertTriangle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 text-green-700 text-[11px] font-bold uppercase tracking-tight rounded-full border border-green-100">
                            <CheckCircle2 size={12} /> In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(item.id, item.name)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-dark hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-6 text-dark tracking-tight">Add Inventory Item</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Item Name</label>
                <input type="text" placeholder="e.g. Rice, Chicken, etc." required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Quantity</label>
                  <input type="number" placeholder="0" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Threshold</label>
                  <input type="number" placeholder="0" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm" value={formData.threshold} onChange={e => setFormData({...formData, threshold: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-primary-dark transition-all shadow-sm">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


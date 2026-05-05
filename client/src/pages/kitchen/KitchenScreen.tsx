import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { ChefHat, CheckCircle, Clock, Timer, UtensilsCrossed, Bell, Package } from "lucide-react";
import { Order } from "../admin/OrdersView";
import { MenuItem } from "../admin/MenuManagement";
import { cn } from "../../utils/cn";
import { format } from "date-fns";
import { useUI } from "../../context/UIContext";

const kitchenNavigation = [
  { name: "Kitchen", path: "/kitchen", icon: ChefHat },
];

export const KitchenScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "menu">("orders");
  const { showToast, setLoading: setGlobalLoading } = useUI();

  useEffect(() => {
    // Listen to active orders
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["pending", "preparing"])
    );

    const unsubOrders = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeA - timeB;
      });
      setOrders(items);
    }, (error: any) => {
      showToast("Failed to load kitchen orders", "error");
    });

    // Listen to menu for stock management
    const unsubMenu = onSnapshot(collection(db, "menu"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setMenu(items);
      setLoading(false);
    });

    return () => {
      unsubOrders();
      unsubMenu();
    };
  }, []);

  const updateOrderStatus = async (id: string, newStatus: "preparing" | "ready") => {
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
    } catch (error: any) {
      showToast("Failed to update status", "error");
    }
  };

  const updateStock = async (id: string, newQuantity: number) => {
    try {
      const isAvailable = newQuantity > 0;
      await updateDoc(doc(db, "menu", id), { 
        stockQuantity: Math.max(0, newQuantity),
        isAvailable 
      });
      showToast("Menu availability updated", "success");
    } catch (error: any) {
      showToast("Failed to update menu", "error");
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <DashboardLayout navigation={kitchenNavigation} title="Kitchen Portal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex bg-gray-100 p-1.5 rounded-2xl shadow-inner">
           <button 
             onClick={() => setActiveTab("orders")}
             className={cn(
               "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2",
               activeTab === "orders" ? "bg-white text-primary shadow-lg" : "text-gray-400 hover:text-gray-600"
             )}
           >
             <Clock size={14} /> Active Orders ({orders.length})
           </button>
           <button 
             onClick={() => setActiveTab("menu")}
             className={cn(
               "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2",
               activeTab === "menu" ? "bg-white text-primary shadow-lg" : "text-gray-400 hover:text-gray-600"
             )}
           >
             <Package size={14} /> Manage Menu
           </button>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-xl border border-primary/10 text-[10px] font-black uppercase tracking-widest">
           <Bell size={14} className="animate-bounce" /> Live Kitchen Feed
        </div>
      </div>

      {activeTab === "orders" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-xl transition-all duration-300"
            >
              <div className={`h-2 w-full ${order.status === 'pending' ? 'bg-red-500' : 'bg-primary'}`} />
              
              <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-xl text-dark tracking-tighter">
                    #{order.orderId || order.id.slice(0, 8)}
                  </h3>
                  <p className="text-[10px] font-black text-gray-400 flex items-center gap-1.5 uppercase tracking-[0.1em] mt-1">
                    <Clock size={12} className="text-primary" />
                    {order.createdAt?.toDate ? format(order.createdAt.toDate(), "h:mm aa") : "Unknown"}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                  order.status === 'pending' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-primary text-white border-primary/20'
                }`}>
                  {order.status === 'pending' ? <Timer size={12} /> : <ChefHat size={12} />}
                  {order.status}
                </span>
              </div>
              
              <div className="p-8">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                   <div className="w-1.5 h-4 bg-primary rounded-full" />
                   Order Details
                </div>
                <div className="space-y-4 mb-8 min-h-[120px]">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start group/item">
                      <div className="flex flex-col">
                        <span className="font-black text-lg text-dark leading-none group-hover/item:text-primary transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">Unit: {item.quantity}</span>
                      </div>
                      <span className="bg-dark text-white w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-dark/10 group-hover/item:scale-110 transition-transform">
                        {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
 
                <div className="flex gap-3">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "preparing")}
                      className="flex-1 bg-dark text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-dark/10 active:scale-95"
                    >
                      Start Preparation
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "ready")}
                      className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <CheckCircle size={16} /> Mark as Ready
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
 
          {orders.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-32 text-center bg-white rounded-[3rem] border-2 border-gray-100 border-dashed">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <ChefHat size={48} className="text-gray-200" />
              </div>
              <h2 className="text-2xl font-black text-gray-400 tracking-tighter uppercase">Kitchen is Clear</h2>
              <p className="text-[10px] text-gray-300 font-black uppercase mt-2 tracking-[0.3em]">No active orders at the moment.</p>
            </div>
          )}
        </div>
      ) : (
        /* Menu Management View */
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 border-b border-gray-100">
                    <th className="px-8 py-6">Item Name</th>
                    <th className="px-8 py-6">Category</th>
                    <th className="px-8 py-6">Current Availability</th>
                    <th className="px-8 py-6 text-center">Quick Adjust Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {menu.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/30 transition-colors group">
                      <td className="px-8 py-6">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                               <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-black text-dark text-base uppercase tracking-tight">{item.name}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">{item.category}</span>
                      </td>
                      <td className="px-8 py-6">
                         <div className={cn(
                           "inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest shadow-sm",
                           item.stockQuantity === 0 
                            ? "bg-red-50 text-red-600 border-red-100" 
                            : item.stockQuantity < 10 
                              ? "bg-amber-50 text-amber-600 border-amber-100" 
                              : "bg-green-50 text-green-600 border-green-100"
                         )}>
                           <div className={cn("w-2 h-2 rounded-full animate-pulse", 
                             item.stockQuantity === 0 ? "bg-red-600" : item.stockQuantity < 10 ? "bg-amber-600" : "bg-green-600"
                           )} />
                           {item.stockQuantity === 0 ? "Sold Out" : `${item.stockQuantity} Remaining`}
                         </div>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => updateStock(item.id, item.stockQuantity - 1)}
                              disabled={item.stockQuantity <= 0}
                              className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center font-black text-sm border border-gray-100 disabled:opacity-30 shadow-sm active:scale-90"
                            >
                              -1
                            </button>
                            <button 
                              onClick={() => updateStock(item.id, item.stockQuantity + 1)}
                              className="w-10 h-10 rounded-xl bg-primary/5 text-primary hover:bg-primary/20 transition-all flex items-center justify-center font-black text-sm border border-primary/10 shadow-sm active:scale-90"
                            >
                              +1
                            </button>
                            <button 
                              onClick={() => updateStock(item.id, item.stockQuantity + 10)}
                              className="px-4 h-10 rounded-xl bg-primary text-white hover:bg-primary-dark transition-all flex items-center justify-center font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-90"
                            >
                              +10
                            </button>
                            <div className="w-[1px] h-8 bg-gray-100 mx-2" />
                            <button 
                              onClick={() => updateStock(item.id, 0)}
                              disabled={item.stockQuantity === 0}
                              className="px-5 py-2.5 rounded-xl bg-dark text-white hover:bg-black transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-30 shadow-lg active:scale-95"
                            >
                              MARK SOLD OUT
                            </button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      )}
    </DashboardLayout>
  );
};

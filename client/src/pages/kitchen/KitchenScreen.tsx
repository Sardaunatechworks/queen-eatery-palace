import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { ChefHat, CheckCircle, Clock, Timer, UtensilsCrossed, Bell } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"orders" | "inventory">("orders");
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
      setLoading(false);
    }, (error: any) => {
      showToast("Failed to load kitchen orders", "error");
    });

    // Listen to menu for inventory
    const unsubMenu = onSnapshot(collection(db, "menu"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setMenu(items);
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
      showToast("Stock updated", "success");
    } catch (error: any) {
      showToast("Failed to update stock", "error");
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
        <div className="flex bg-gray-100 p-1 rounded-xl">
           <button 
             onClick={() => setActiveTab("orders")}
             className={cn(
               "px-6 py-2 rounded-lg text-xs font-bold transition-all",
               activeTab === "orders" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
             )}
           >
             Active Orders ({orders.length})
           </button>
           <button 
             onClick={() => setActiveTab("inventory")}
             className={cn(
               "px-6 py-2 rounded-lg text-xs font-bold transition-all",
               activeTab === "inventory" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
             )}
           >
             Inventory Management
           </button>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary rounded-lg border border-primary/10 text-xs font-bold">
           <Bell size={14} /> Kitchen View
        </div>
      </div>

      {activeTab === "orders" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative group hover:shadow-md transition-all"
            >
              <div className={`h-1.5 w-full ${order.status === 'pending' ? 'bg-red-500' : 'bg-primary'}`} />
              
              <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-dark tracking-tight">
                    {order.orderId || order.id.slice(0, 8)}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-tight mt-0.5">
                    <Clock size={12} className="text-primary" />
                    {order.createdAt?.toDate ? format(order.createdAt.toDate(), "h:mm aa") : "Unknown"}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${
                  order.status === 'pending' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-primary text-white border-primary/20'
                }`}>
                  {order.status === 'pending' ? <Timer size={10} /> : <ChefHat size={10} />}
                  {order.status}
                </span>
              </div>
              
              <div className="p-6">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-4 flex items-center gap-2">
                   <UtensilsCrossed size={12} /> Order Items
                </div>
                <div className="space-y-3 mb-6 min-h-[100px]">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-bold text-base text-dark leading-tight">
                          {item.name}
                        </span>
                      </div>
                      <span className="bg-gray-100 text-dark w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs border border-gray-200">
                        {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "preparing")}
                      className="flex-1 bg-dark text-white py-3 rounded-lg font-bold text-xs uppercase hover:bg-black transition-all shadow-sm active:scale-95"
                    >
                      Start Cooking
                    </button>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, "ready")}
                      className="flex-1 bg-primary text-white py-3 rounded-lg font-bold text-xs uppercase hover:bg-primary-dark transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                    >
                      <CheckCircle size={14} /> Mark as Ready
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-gray-200 border-dashed">
              <ChefHat size={32} className="text-gray-100 mb-4" />
              <h2 className="text-lg font-bold text-gray-400">No Active Orders</h2>
              <p className="text-xs text-gray-300 font-bold uppercase mt-1">The kitchen is clear.</p>
            </div>
          )}
        </div>
      ) : (
        /* Inventory Management View */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4">Item Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {menu.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                       <span className="font-bold text-dark text-sm">{item.name}</span>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-xs text-gray-500 font-medium">{item.category}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className={cn(
                         "inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-bold",
                         item.stockQuantity === 0 
                          ? "bg-red-50 text-red-600 border-red-100" 
                          : item.stockQuantity < 10 
                            ? "bg-orange-50 text-orange-600 border-orange-100" 
                            : "bg-green-50 text-green-600 border-green-100"
                       )}>
                         {item.stockQuantity} in stock
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => updateStock(item.id, item.stockQuantity - 5)}
                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold"
                          >
                            -5
                          </button>
                          <button 
                            onClick={() => updateStock(item.id, item.stockQuantity - 1)}
                            className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold"
                          >
                            -1
                          </button>
                          <button 
                            onClick={() => updateStock(item.id, item.stockQuantity + 1)}
                            className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center font-bold"
                          >
                            +1
                          </button>
                          <button 
                            onClick={() => updateStock(item.id, item.stockQuantity + 10)}
                            className="w-10 h-8 rounded-lg bg-primary text-white hover:bg-primary-dark flex items-center justify-center font-bold text-xs"
                          >
                            +10
                          </button>
                          <div className="w-[1px] h-8 bg-gray-100 mx-2" />
                          <button 
                            onClick={() => updateStock(item.id, 0)}
                            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-black uppercase tracking-tighter"
                          >
                            Mark Sold Out
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}
    </DashboardLayout>
  );
};


import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { Order } from "../admin/OrdersView";
import { format } from "date-fns";
import { Clock, MapPin, Package, Receipt, ArrowRight, CheckCircle2, Timer } from "lucide-react";
import { formatNaira } from "../../utils/format";
import { useUI } from "../../context/UIContext";
import { ReceiptModal } from "../../components/ReceiptModal";

export const CustomerOrders: React.FC = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const { showToast } = useUI();

  useEffect(() => {
    if (!profile?.uid) return;

    const q = query(
      collection(db, "orders"),
      where("userId", "==", profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setOrders(items);
      setLoading(false);
    }, (error: any) => {
      showToast("Failed to load orders", "error");
      handleFirestoreError(error, OperationType.LIST, "orders");
    });
    return () => unsubscribe();
  }, [profile?.uid]);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const getStatusStyle = (status: Order["status"]) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-100';
      case 'ready': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'preparing': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-2xl font-bold text-dark tracking-tight">Your Orders</h2>
            <p className="text-sm text-gray-500">Track and manage your orders.</p>
         </div>
         <div className="bg-primary/5 px-3 py-1.5 rounded-lg text-primary text-xs font-bold border border-primary/10">
            Showing {orders.length} orders
         </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-200 border-dashed">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
             <Receipt size={32} className="text-gray-100" />
          </div>
          <h3 className="text-lg font-bold text-dark mb-1">No orders found</h3>
          <p className="text-sm text-gray-400 max-w-xs mx-auto mb-6">You haven't placed any orders yet.</p>
          <button className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase hover:bg-primary-dark transition-all">
             View Menu
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6 md:p-8 bg-gray-50/50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary border border-gray-100 shadow-sm">
                      <Receipt size={24} />
                   </div>
                   <div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1 flex items-center gap-1.5">
                        <Clock size={12} />
                        {order.createdAt?.toDate ? format(order.createdAt.toDate(), "MMM d, yyyy 'at' h:mm aa") : "N/A"}
                     </p>
                     <h3 className="text-xl font-bold text-dark tracking-tight">
                        Order #{order.orderId || order.id.slice(0, 8)}
                     </h3>
                   </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-1">Amount</p>
                    <p className="text-xl font-bold text-primary">{formatNaira(order.total)}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight border ${getStatusStyle(order.status)}`}>
                    {order.status === 'completed' ? <CheckCircle2 size={12} /> : 
                     order.status === 'pending' ? <Timer size={12} /> : <Clock size={12} />}
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-4 flex items-center gap-2">
                       Items
                    </h4>
                    <ul className="space-y-3">
                      {order.items.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                             <span className="text-gray-400 font-bold">{item.quantity}x</span>
                             <span className="font-semibold text-dark">{item.name}</span>
                          </div>
                          <span className="font-bold text-gray-500">{formatNaira(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-50 flex flex-col justify-center">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-3">Delivery Info</h4>
                    {order.deliveryType === 'delivery' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary">
                          <MapPin size={16} />
                          <span className="font-bold text-[10px] uppercase">Delivery</span>
                        </div>
                        <p className="text-sm text-dark font-medium leading-relaxed pl-6">
                          {order.address}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-500">
                           <Package size={16} />
                           <span className="font-bold text-[10px] uppercase tracking-tight">Pickup</span>
                        </div>
                        <p className="text-sm text-dark font-medium pl-6">Collect from our restaurant.</p>
                      </div>
                    )}
                    
                    <div className="mt-6 pt-6 border-t border-gray-100">
                       <button 
                          onClick={() => { setSelectedOrder(order); setShowReceipt(true); }}
                          className="flex items-center gap-2 text-primary hover:underline text-[10px] font-bold uppercase tracking-tight"
                       >
                          View Receipt <ArrowRight size={14} />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        order={selectedOrder} 
        mode="customer" 
      />
    </div>
  );
};


import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, updateDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { format } from "date-fns";
import { formatNaira } from "../../utils/format";
import { useUI } from "../../context/UIContext";
import { Search, Filter, Receipt, Clock, CheckCircle2, Truck, Timer, XCircle, MoreVertical } from "lucide-react";

export interface Order {
  id: string;
  orderId?: string; // Sequential ID (e.g., QEP-0001)
  customerName?: string;
  items: any[];
  total: number;
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled";
  source: "staff" | "customer";
  deliveryType: "pickup" | "delivery";
  address?: string;
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: any;
}

export const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const { showToast, setLoading: setGlobalLoading } = useUI();

  useEffect(() => {
    const q = query(collection(db, "orders"));
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
      showToast("Error loading orders", "error");
      handleFirestoreError(error, OperationType.LIST, "orders");
    });
    return () => unsubscribe();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const displayId = order.orderId || order.id.slice(0, 8);
      const matchesSearch = displayId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const updateStatus = async (id: string, newStatus: Order["status"]) => {
    setGlobalLoading(true);
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
      showToast(`Order marked as ${newStatus}`, "success");
    } catch (error) {
      showToast("Failed to update status", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const getStatusStyle = (status: Order["status"]) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700 border-green-100';
      case 'ready': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'preparing': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={12} />;
      case 'ready': return <CheckCircle2 size={12} />;
      case 'preparing': return <Timer size={12} />;
      case 'cancelled': return <XCircle size={12} />;
      default: return <Clock size={12} />;
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
          <h2 className="text-xl font-bold text-dark tracking-tight">Orders</h2>
          <p className="text-sm text-gray-500">View and manage all customer orders.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary rounded-lg border border-primary/10 text-xs font-bold">
           <Receipt size={14} /> Total: {orders.length}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Order ID or Customer..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm appearance-none min-w-[140px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Mobile Card Layout */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center opacity-50">
              <Receipt className="mx-auto mb-2 text-gray-300" size={32} />
              <p className="text-sm font-bold text-gray-400">No orders found</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order ID</p>
                    <p className="font-mono font-bold text-dark text-sm">{order.orderId || order.id.slice(0, 8)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border ${getStatusStyle(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Items</p>
                    <p className="font-semibold text-dark">{order.items.length} items</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Total</p>
                    <p className="font-bold text-primary text-sm">{formatNaira(order.total)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                    <CheckCircle2 size={12} /> {order.paymentStatus}
                  </span>
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold uppercase text-gray-600 hover:text-primary transition-all">
                       Status <MoreVertical size={12} />
                    </button>
                    <div className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity z-10">
                      {["preparing", "ready", "completed", "cancelled"].map((s) => (
                        <button 
                          key={s}
                          onClick={() => updateStatus(order.id, s as Order["status"])}
                          className="w-full text-left px-3 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-50 hover:text-primary capitalize transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Order ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Date & Time</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight text-center">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight text-center">Payment</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Receipt className="text-gray-200 mb-2" size={40} />
                      <p className="font-semibold text-gray-400">No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors text-sm">
                    <td className="px-6 py-4 font-mono font-bold text-dark">
                      {order.orderId || order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-dark">
                          {order.createdAt?.toDate ? format(order.createdAt.toDate(), "MMM dd, yyyy") : "Unknown Date"}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {order.createdAt?.toDate ? format(order.createdAt.toDate(), "h:mm aa") : "--:--"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight border ${
                        order.deliveryType === 'delivery' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-purple-50 text-purple-700 border-purple-100'
                      }`}>
                        {order.deliveryType === 'delivery' ? <Truck size={12} /> : <Clock size={12} />}
                        {order.deliveryType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-dark">{formatNaira(order.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight border ${getStatusStyle(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-tight border ${
                        order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-100' :
                        order.paymentStatus === 'failed' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative group inline-block">
                         <button className="p-2 text-gray-400 hover:text-dark transition-colors">
                            <MoreVertical size={18} />
                         </button>
                         <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">Status</div>
                            {["preparing", "ready", "completed", "cancelled"].map((s) => (
                              <button 
                                key={s}
                                onClick={() => updateStatus(order.id, s as Order["status"])}
                                className="w-full text-left px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-primary capitalize transition-colors"
                              >
                                {s}
                              </button>
                            ))}
                         </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


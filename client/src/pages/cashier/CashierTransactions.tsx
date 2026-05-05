import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { Order } from "../admin/OrdersView";
import { format, isToday } from "date-fns";
import { Search, Filter, Receipt, Clock, CheckCircle, XCircle, Timer, AlertCircle, TrendingUp, ShoppingBag, CreditCard, Box } from "lucide-react";
import { formatNaira } from "../../utils/format";
import { useUI } from "../../context/UIContext";
import { cn } from "../../utils/cn";
import { OrderAcceptanceModal } from "../../components/OrderAcceptanceModal";

export const CashierTransactions: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<Order | null>(null);
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
      showToast("Failed to load transactions", "error");
      handleFirestoreError(error, OperationType.LIST, "orders");
    });
    return () => unsubscribe();
  }, []);

  const eodReport = useMemo(() => {
    const todayOrders = orders.filter(o => o.createdAt?.toDate && isToday(o.createdAt.toDate()));
    
    return {
      totalSales: todayOrders.reduce((sum, o) => o.paymentStatus === 'paid' ? sum + o.total : sum, 0),
      orderCount: todayOrders.length,
      completedCount: todayOrders.filter(o => o.status === 'completed').length,
      pendingPayments: todayOrders.reduce((sum, o) => o.paymentStatus !== 'paid' ? sum + o.total : sum, 0),
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesSearch = 
        (order.orderId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (order.id.toLowerCase()).includes(searchTerm.toLowerCase()) ||
        (order.customerName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  const updateStatus = async (id: string, newStatus: string) => {
    setGlobalLoading(true);
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
      showToast(`Status updated: ${newStatus}`, "success");
    } catch (error: any) {
      showToast("Failed to update status", "error");
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    } finally {
      setGlobalLoading(false);
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-tight">Today</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Today's Sales</p>
            <h3 className="text-xl font-bold text-dark">{formatNaira(eodReport.totalSales)}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Orders</p>
            <h3 className="text-xl font-bold text-dark">{eodReport.orderCount} Orders</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <Box size={20} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed Today</p>
            <h3 className="text-xl font-bold text-dark">{eodReport.completedCount} Served</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <CreditCard size={20} />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending Payment</p>
            <h3 className="text-xl font-bold text-dark">{formatNaira(eodReport.pendingPayments)}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 text-primary rounded-full text-[11px] font-bold uppercase tracking-tight mb-2">
              <Receipt size={14} /> Transactions
           </div>
           <h2 className="text-xl font-bold text-dark tracking-tight">Transaction History</h2>
           <p className="text-sm text-gray-500">Viewing {filteredOrders.length} transactions.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
           <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select 
                className="w-full sm:w-44 pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm appearance-none"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Order ID</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Items</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Delivery</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="group hover:bg-gray-50/50 transition-colors text-sm">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                         <Receipt size={14} className="text-accent" />
                         <span className="font-bold text-dark">{order.orderId || order.id.slice(0, 8)}</span>
                      </div>
                      <span className={`text-[9px] font-black uppercase mt-1 px-2 py-0.5 rounded w-fit ${order.source === 'staff' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                        {order.source === 'staff' ? 'Cashier Counter' : 'Online Order'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="font-semibold text-dark">{order.createdAt?.toDate ? format(order.createdAt.toDate(), "MMM d, h:mm aa") : "N/A"}</span>
                       <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Local Time</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                       {order.items.slice(0, 2).map((item, i) => (
                         <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-[9px] font-bold text-gray-500 uppercase">
                            {item.quantity}x {item.name}
                         </span>
                       ))}
                       {order.items.length > 2 && (
                         <span className="px-2 py-0.5 bg-primary/5 rounded text-[9px] font-bold text-primary uppercase">
                            +{order.items.length - 2} More
                         </span>
                       )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-col">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${order.deliveryType === 'delivery' ? 'text-indigo-600' : 'text-gray-500'}`}>
                           {order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}
                        </span>
                        {order.deliveryType === 'delivery' && order.address && (
                           <span className="text-xs text-gray-600 font-medium truncate max-w-[150px]" title={order.address}>
                              {order.address}
                           </span>
                        )}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="font-bold text-primary">{formatNaira(order.total)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${
                      order.status === 'completed' ? 'bg-green-50 text-green-600 border-green-100' :
                      order.status === 'ready' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                      order.status === 'preparing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                      {order.status === 'completed' ? <CheckCircle size={10} /> :
                       order.status === 'pending' ? <Timer size={10} /> : <AlertCircle size={10} />}
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {order.status === 'pending' && (
                          <button 
                            onClick={() => setSelectedPendingOrder(order)} 
                            className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all text-[10px] font-bold uppercase tracking-tight"
                          >
                             Receive Order
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button onClick={() => updateStatus(order.id, "completed")} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all">
                             <CheckCircle size={14} />
                          </button>
                        )}
                        {['pending', 'preparing', 'ready'].includes(order.status) && (
                          <button onClick={() => updateStatus(order.id, "cancelled")} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                             <XCircle size={14} />
                          </button>
                        )}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <OrderAcceptanceModal 
        isOpen={!!selectedPendingOrder} 
        onClose={() => setSelectedPendingOrder(null)} 
        order={selectedPendingOrder} 
        onConfirm={updateStatus} 
      />
    </div>
  );
};


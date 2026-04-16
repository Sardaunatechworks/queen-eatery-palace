import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { formatNaira } from "../../utils/format";
import { useUI } from "../../context/UIContext";
import { 
  DollarSign, 
  ShoppingBag, 
  Users as UsersIcon, 
  Package, 
  TrendingUp, 
  BarChart3,
  Calendar
} from "lucide-react";

export const Reports: React.FC = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    lowStockItems: 0
  });
  const [loading, setLoading] = useState(true);
  const { showToast } = useUI();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch Orders
        const ordersSnap = await getDocs(collection(db, "orders"));
        let sales = 0;
        ordersSnap.forEach(doc => {
          if (doc.data().paymentStatus === 'paid') {
            sales += doc.data().total || 0;
          }
        });

        // Fetch Users
        const usersSnap = await getDocs(collection(db, "users"));
        let customers = 0;
        usersSnap.forEach(doc => {
          if (doc.data().role === 'customer') customers++;
        });

        // Fetch Inventory
        const invSnap = await getDocs(collection(db, "inventory"));
        let lowStock = 0;
        invSnap.forEach(doc => {
          const data = doc.data();
          if (data.quantity <= data.threshold) lowStock++;
        });

        setStats({
          totalSales: sales,
          totalOrders: ordersSnap.size,
          totalCustomers: customers,
          lowStockItems: lowStock
        });
      } catch (error) {
        showToast("Failed to load reports", "error");
        handleFirestoreError(error, OperationType.LIST, "multiple");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const analyticalCards = [
    { 
      label: "Total Sales", 
      value: formatNaira(stats.totalSales), 
      icon: DollarSign, 
      color: "text-green-600", 
      bg: "bg-green-50" 
    },
    { 
      label: "Total Orders", 
      value: stats.totalOrders.toString(), 
      icon: ShoppingBag, 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Total Customers", 
      value: stats.totalCustomers.toString(), 
      icon: UsersIcon, 
      color: "text-purple-600", 
      bg: "bg-purple-50" 
    },
    { 
      label: "Low Stock Items", 
      value: stats.lowStockItems.toString(), 
      icon: Package, 
      color: "text-red-600", 
      bg: "bg-red-50" 
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark tracking-tight">Reports</h2>
          <p className="text-sm text-gray-500">Monitor your business performance.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-500">
           <Calendar size={14} /> All Time
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {analyticalCards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all"
          >
            <div className={`w-12 h-12 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-4`}>
              <card.icon size={24} />
            </div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mb-1">{card.label}</p>
            <h3 className="text-xl font-bold text-dark tracking-tight">{card.value}</h3>
            <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight ${card.color}`}>
              <TrendingUp size={12} /> Live Tracking
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-center">
         <div className="relative z-10 max-w-lg">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-white/10 text-white rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
               <BarChart3 size={14} /> Overview
            </div>
            <h3 className="text-2xl font-bold mb-3 tracking-tight">Business Health</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Track your restaurant's growth and operational efficiency through detailed metrics. Monitor these regularly to ensure high standards.
            </p>
            <div className="flex gap-4">
               <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Efficiency</div>
                  <div className="text-lg font-bold">98.4%</div>
               </div>
               <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Satisfaction</div>
                  <div className="text-lg font-bold">4.9/5</div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};


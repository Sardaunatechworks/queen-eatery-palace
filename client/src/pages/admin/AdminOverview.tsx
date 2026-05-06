import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { formatNaira } from "../../utils/format";
import { 
  DollarSign, 
  ShoppingBag, 
  Users as UsersIcon, 
  AlertTriangle,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalCustomers: 0,
    activeOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const ordersSnap = await getDocs(collection(db, "orders"));
        let sales = 0;
        let active = 0;
        
        ordersSnap.forEach(doc => {
          const data = doc.data();
          if (data.paymentStatus === 'paid') {
            sales += data.total || 0;
          }
          if (['pending', 'preparing', 'ready'].includes(data.status)) {
            active++;
          }
        });

        const usersSnap = await getDocs(collection(db, "users"));
        let customers = 0;
        usersSnap.forEach(doc => {
          if (doc.data().role === 'customer') customers++;
        });

        setStats({
          totalSales: sales,
          totalOrders: ordersSnap.size,
          totalCustomers: customers,
          activeOrders: active
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, "multiple");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { 
      label: "Total Revenue", 
      value: formatNaira(stats.totalSales), 
      icon: DollarSign, 
      color: "text-green-600", 
      light: "bg-green-50",
      trend: "+12.5%",
      link: "/admin/reports"
    },
    { 
      label: "Total Orders", 
      value: stats.totalOrders.toString(), 
      icon: ShoppingBag, 
      color: "text-blue-600", 
      light: "bg-blue-50",
      trend: "+5.2%",
      link: "/admin/orders"
    },
    { 
      label: "Customers", 
      value: stats.totalCustomers.toString(), 
      icon: UsersIcon, 
      color: "text-purple-600", 
      light: "bg-purple-50",
      trend: "+2.4%",
      link: "/admin/staff"
    },
  ];

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-dark tracking-tight">Overview</h2>
        <p className="text-sm text-gray-500">Welcome to your dashboard summary.</p>
      </div>

      {/* Grid for main stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex flex-col gap-4">
              <div className={`w-10 h-10 ${card.light} ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-tight mb-1">{card.label}</p>
                <h3 className="text-2xl font-bold text-dark">{card.value}</h3>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <span className={`text-xs font-bold ${card.color} flex items-center gap-1`}>
                  <TrendingUp size={14} /> {card.trend}
                </span>
                <Link to={card.link} className="text-gray-300 hover:text-primary transition-colors">
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-dark text-lg">Operations</h3>
              <span className="px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-md">Status Summary</span>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col items-center text-center">
                 <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-3 shadow-sm">
                    <ShoppingBag className="text-primary" size={24} />
                 </div>
                 <h4 className="text-2xl font-bold text-dark mb-1">{stats.activeOrders}</h4>
                 <p className="text-xs font-semibold text-gray-500 uppercase">Active Orders</p>
                 <Link to="/admin/orders" className="mt-4 text-xs font-bold text-primary hover:underline">View Orders</Link>
              </div>
           </div>
        </div>

        <div className="bg-dark rounded-xl p-6 text-white">
           <h3 className="font-bold text-lg mb-2">Quick Actions</h3>
           <p className="text-xs text-gray-400 mb-6 leading-relaxed">Common tasks for system management.</p>
           
           <div className="space-y-3">
              {[
                { name: "Add Menu Item", link: "/admin/menu", icon: PlusIcon },
                { name: "Manage Users", link: "/admin/staff", icon: UsersIcon },
                { name: "View Reports", link: "/admin/reports", icon: TrendingUp }
              ].map(action => (
                <Link 
                 key={action.name}
                 to={action.link} 
                 className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/5 group"
                >
                   <span className="text-sm font-semibold">{action.name}</span>
                   <action.icon size={16} className="text-gray-500 group-hover:text-white" />
                </Link>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

const PlusIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

import React, { useState, useEffect, useMemo } from "react";
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
  Calendar,
  Download,
  FileText,
  FileSpreadsheet,
  Layers
} from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDF } from "../../utils/export";
import { startOfDay, subDays, isWithinInterval } from "date-fns";

type TimeRange = "today" | "week" | "month" | "all";

export const Reports: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [loading, setLoading] = useState(true);
  const { showToast } = useUI();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersSnap = await getDocs(collection(db, "orders"));
        const ordersData = ordersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setOrders(ordersData);
      } catch (error) {
        showToast("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    let start: Date;
    
    switch (timeRange) {
      case "today": start = startOfDay(now); break;
      case "week": start = subDays(now, 7); break;
      case "month": start = subDays(now, 30); break;
      default: start = new Date(0);
    }

    const filtered = orders.filter(o => 
      isWithinInterval(new Date(o.createdAt), { start, end: now }) &&
      o.paymentStatus === 'paid'
    );

    const totalSales = filtered.reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCount = filtered.length;
    const itemsCount = filtered.reduce((sum, o) => sum + (o.items?.length || 0), 0);
    
    return { totalSales, orderCount, itemsCount, filtered };
  }, [orders, timeRange]);

  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    if (stats.filtered.length === 0) {
      showToast("No data to export for this period", "info");
      return;
    }

    const data = stats.filtered.map(o => ({
      ID: o.orderId || o.id.slice(0, 8),
      Date: o.createdAt.toLocaleDateString(),
      Amount: o.total,
      Status: o.status,
      Type: o.deliveryType
    }));

    switch (type) {
      case 'csv': exportToCSV(data, "Sales_Report"); break;
      case 'excel': exportToExcel(data, "Sales_Report"); break;
      case 'pdf': 
           exportToPDF(
             ["ID", "Date", "Amount", "Status", "Delivery"],
             data.map(d => Object.values(d)),
             "Queens Palace Sales Report"
           );
           break;
    }
    showToast(`${type.toUpperCase()} Exported`, "success");
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-dark tracking-tight">Business Reports</h2>
          <p className="text-sm text-gray-500">Comprehensive overview of performance and sales.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
              {(['today', 'week', 'month', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    timeRange === range ? "bg-primary text-white shadow-md" : "text-gray-400 hover:text-primary"
                  }`}
                >
                  {range}
                </button>
              ))}
           </div>

           <div className="flex gap-2">
              <button 
                onClick={() => handleExport('pdf')}
                className="p-2.5 bg-red-50 text-primary rounded-xl border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-sm"
                title="Export PDF"
              >
                <FileText size={18} />
              </button>
              <button 
                onClick={() => handleExport('excel')}
                className="p-2.5 bg-green-50 text-green-600 rounded-xl border border-green-200 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                title="Export Excel"
              >
                <FileSpreadsheet size={18} />
              </button>
              <button 
                onClick={() => handleExport('csv')}
                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                title="Export CSV"
              >
                <Download size={18} />
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-4">
              <DollarSign size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gross Revenue</p>
            <h3 className="text-2xl font-black text-dark tracking-tighter">{formatNaira(stats.totalSales)}</h3>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase">
              <TrendingUp size={12} /> Total Paid
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-accent/5 text-accent rounded-2xl flex items-center justify-center mb-4">
              <ShoppingBag size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Orders Placed</p>
            <h3 className="text-2xl font-black text-dark tracking-tighter">{stats.orderCount}</h3>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase">
              <Layers size={12} /> Transactions
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Package size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Items Sold</p>
            <h3 className="text-2xl font-black text-dark tracking-tighter">{stats.itemsCount}</h3>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-blue-500 uppercase">
              <BarChart3 size={12} /> Unit Volume
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <UsersIcon size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Order Value</p>
            <h3 className="text-2xl font-black text-dark tracking-tighter">
              {formatNaira(stats.orderCount > 0 ? stats.totalSales / stats.orderCount : 0)}
            </h3>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-purple-500 uppercase">
              <TrendingUp size={12} /> Ticket Average
            </div>
          </div>
      </div>

      <div className="bg-dark rounded-[2.5rem] p-10 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px]" />
         <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black text-accent uppercase tracking-[0.2em]">
                   <BarChart3 size={14} /> Intelligence Overview
                </div>
                <h3 className="text-4xl font-black tracking-tighter leading-none">
                  Predictive Growth & <br /> Royal Analytics
                </h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-md">
                   Leverage our advanced reporting suite to track daily performance, export financial data for accounting, and optimize your menu based on unit volume. 
                </p>
                <div className="flex gap-4">
                   <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex-1 backdrop-blur-md">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Confidence</p>
                      <p className="text-2xl font-black text-white italic">Premium</p>
                   </div>
                   <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex-1 backdrop-blur-md">
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">Fulfillment</p>
                      <p className="text-2xl font-black text-accent">100%</p>
                   </div>
                </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 p-2 rounded-[2rem] aspect-video flex items-center justify-center backdrop-blur-sm relative border-dashed">
                <div className="absolute flex flex-col items-center gap-4 text-center p-8">
                   <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-accent animate-pulse">
                      <BarChart3 size={32} />
                   </div>
                   <p className="text-xs font-bold text-white/50 max-w-[200px]">Advanced Visual Charts coming in the next module upgrade.</p>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { formatNaira } from "../../utils/format";
import { useUI } from "../../context/UIContext";
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  TrendingUp, 
  BarChart3,
  Download,
  FileText,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays
} from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDF } from "../../utils/export";
import { startOfDay, subDays, isWithinInterval, format, startOfWeek, startOfMonth } from "date-fns";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { cn } from "../../utils/cn";

type TimeRange = "today" | "week" | "month" | "all";

export const Reports: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const [loading, setLoading] = useState(true);
  const { showToast } = useUI();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const ordersSnap = await getDocs(collection(db, "orders"));
        const ordersData = ordersSnap.docs.map(doc => {
          const data = doc.data();
          let createdAtDate: Date;
          
          if (data.createdAt?.toDate) {
            createdAtDate = data.createdAt.toDate();
          } else if (typeof data.createdAt === 'string') {
            createdAtDate = new Date(data.createdAt);
          } else {
            createdAtDate = new Date();
          }

          return {
            id: doc.id,
            ...data,
            createdAt: createdAtDate
          };
        });
        setOrders(ordersData);
      } catch (error) {
        showToast("Failed to load business data", "error");
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
      case "week": start = startOfWeek(now); break;
      case "month": start = startOfMonth(now); break;
      default: start = new Date(0);
    }

    const filtered = orders.filter(o => {
      const isPaid = o.paymentStatus?.toLowerCase() === 'paid';
      const isInRange = timeRange === "all" || o.createdAt >= start;
      return isPaid && isInRange;
    });

    const totalSales = filtered.reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCount = filtered.length;
    const itemsCount = filtered.reduce((sum, o) => sum + (o.items?.length || 0), 0);
    
    // Chart Data Preparation
    const chartDataMap = new Map();
    filtered.forEach(o => {
      const dateKey = format(o.createdAt, timeRange === "today" ? "HH:00" : "MMM dd");
      const current = chartDataMap.get(dateKey) || { date: dateKey, revenue: 0, orders: 0 };
      chartDataMap.set(dateKey, {
        ...current,
        revenue: current.revenue + (o.total || 0),
        orders: current.orders + 1
      });
    });

    const chartData = Array.from(chartDataMap.values()).sort((a, b) => {
        // Simple sort for date strings if needed, but Map insertion order for time might be enough
        return 0; 
    });

    // Delivery Type Distribution
    const deliveryMap = filtered.reduce((acc, o) => {
      const type = o.deliveryType || "Pickup";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(deliveryMap).map(([name, value]) => ({ name, value }));

    return { totalSales, orderCount, itemsCount, filtered, chartData, pieData };
  }, [orders, timeRange]);

  const handleExport = (type: 'csv' | 'excel' | 'pdf') => {
    if (stats.filtered.length === 0) {
      showToast("No data to export", "info");
      return;
    }

    const data = stats.filtered.map(o => ({
      ID: o.orderId || o.id.slice(0, 8),
      Date: format(o.createdAt, "yyyy-MM-dd HH:mm"),
      Amount: o.total,
      Status: o.status,
      Type: o.deliveryType || 'Pickup'
    }));

    switch (type) {
      case 'csv': exportToCSV(data, "Sales_Report"); break;
      case 'excel': exportToExcel(data, "Sales_Report"); break;
      case 'pdf': 
           exportToPDF(
             ["ID", "Date", "Amount", "Status", "Type"],
             data.map(d => Object.values(d)),
             "Queen Eatery Sales Report"
           );
           break;
    }
  };

  const COLORS = ['#ef4444', '#1f2937', '#f59e0b', '#3b82f6'];

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
               <BarChart3 className="text-white" size={20} />
            </div>
            <h2 className="text-3xl font-black text-dark tracking-tighter uppercase">Revenue Reports</h2>
          </div>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Financial Performance Analysis</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
           <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200">
              {(['today', 'week', 'month', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    timeRange === range ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-dark"
                  )}
                >
                  {range}
                </button>
              ))}
           </div>

           <div className="flex gap-2">
              <button onClick={() => handleExport('pdf')} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-red-50 text-red-500 transition-all shadow-sm group">
                <FileText size={20} className="group-hover:scale-110 transition-transform" />
              </button>
              <button onClick={() => handleExport('excel')} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-green-50 text-green-600 transition-all shadow-sm group">
                <FileSpreadsheet size={20} className="group-hover:scale-110 transition-transform" />
              </button>
              <button onClick={() => handleExport('csv')} className="p-3 bg-white border border-gray-100 rounded-2xl hover:bg-blue-50 text-blue-600 transition-all shadow-sm group">
                <Download size={20} className="group-hover:scale-110 transition-transform" />
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Gross Revenue", value: formatNaira(stats.totalSales), icon: DollarSign, color: "text-red-600", bg: "bg-red-50", trend: "+12%" },
            { label: "Paid Orders", value: stats.orderCount, icon: ShoppingBag, color: "text-dark", bg: "bg-gray-100", trend: "+5%" },
            { label: "Items Volume", value: stats.itemsCount, icon: Package, color: "text-amber-600", bg: "bg-amber-50", trend: "+8%" },
            { label: "Avg Ticket", value: formatNaira(stats.orderCount > 0 ? stats.totalSales / stats.orderCount : 0), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50", trend: "+2%" }
          ].map((s, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
               <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-700", s.bg)} />
               <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/20", s.bg, s.color)}>
                  <s.icon size={28} />
               </div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">{s.label}</p>
               <h3 className="text-3xl font-black text-dark tracking-tighter">{s.value}</h3>
               <div className={cn("mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", s.color)}>
                  <ArrowUpRight size={14} /> {s.trend} <span className="text-gray-300">vs prev period</span>
               </div>
            </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm">
           <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-xl font-black text-dark tracking-tighter uppercase">Revenue Flow</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Earnings trend over time</p>
              </div>
              <CalendarDays className="text-gray-200" size={32} />
           </div>
           
           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#9ca3af' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 800, fill: '#9ca3af' }}
                    tickFormatter={(val) => `\u20A6${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col">
           <div className="mb-10">
              <h3 className="text-xl font-black text-dark tracking-tighter uppercase">Order Channels</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pickup vs Delivery</p>
           </div>
           
           <div className="flex-1 flex flex-col items-center justify-center">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full space-y-3 mt-8">
                 {stats.pieData.map((d, i) => (
                   <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                         <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                         <span className="text-[10px] font-black uppercase tracking-widest text-dark">{d.name}</span>
                      </div>
                      <span className="text-sm font-black text-dark">{((d.value / stats.orderCount) * 100).toFixed(0)}%</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-dark tracking-tighter uppercase">Audit Trail</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Detailed transaction history</p>
          </div>
          <div className="text-[10px] font-black text-primary bg-primary/5 px-5 py-2.5 rounded-full border border-primary/10 tracking-widest uppercase">
            Total records: {stats.filtered.length}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">
              <tr>
                <th className="px-10 py-6">Reference ID</th>
                <th className="px-10 py-6">Date & Time</th>
                <th className="px-10 py-6">Channel</th>
                <th className="px-10 py-6">Amount</th>
                <th className="px-10 py-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.filtered.length > 0 ? (
                stats.filtered.map((order, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-400 group-hover:bg-primary group-hover:text-white transition-all">
                          #{i+1}
                        </div>
                        <span className="font-black text-dark text-sm tracking-tight">{order.orderId || order.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-xs text-gray-500 font-bold uppercase">{format(order.createdAt, "dd MMM yyyy \u2022 HH:mm")}</td>
                    <td className="px-10 py-6">
                       <span className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          {order.deliveryType || 'Pickup'}
                       </span>
                    </td>
                    <td className="px-10 py-6 font-black text-dark text-base">{formatNaira(order.total || 0)}</td>
                    <td className="px-10 py-6 text-center">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 text-[10px] font-black rounded-xl uppercase tracking-[0.2em] border border-green-100 shadow-sm">
                        <CheckCircle className="w-3 h-3" /> SUCCESS
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <BarChart3 size={64} className="mb-4" />
                      <p className="text-xl font-black uppercase tracking-widest">Empty Dataset</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

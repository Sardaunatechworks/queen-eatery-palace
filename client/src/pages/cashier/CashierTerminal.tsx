import React, { useState, useEffect, useMemo, useRef } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp, query, where, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { 
  ShoppingCart, Plus, Minus, Trash2, Search, UtensilsCrossed, 
  CheckCircle2, Wallet, CreditCard, Landmark, Bell, 
  Clock, Package, ChefHat, CheckCircle, Timer,
  Volume2, VolumeX, Volume1
} from "lucide-react";
import { MenuItem } from "../admin/MenuManagement";
import { formatNaira } from "../../utils/format";
import { getNextOrderId } from "../../services/counters";
import { useUI } from "../../context/UIContext";
import { ReceiptModal } from "../../components/ReceiptModal";
import { format } from "date-fns";
import { cn } from "../../utils/cn";

const NOTIFICATION_SOUND = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const MenuCard = React.memo(({ item, onAdd }: { item: MenuItem, onAdd: (item: MenuItem) => void }) => {
  const isOutOfStock = item.stockQuantity <= 0;
  
  return (
    <div
      className={cn(
        "group bg-white p-3 rounded-2xl shadow-sm border border-gray-100 transition-all text-left flex flex-col relative overflow-hidden",
        isOutOfStock ? "opacity-60" : "hover:border-primary hover:shadow-lg"
      )}
    >
      <div className="w-full aspect-square mb-3 rounded-xl overflow-hidden bg-gray-50 relative">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          loading="lazy"
          referrerPolicy="no-referrer" 
        />
        <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/95 rounded-full text-[9px] font-bold text-accent uppercase border border-accent/10">
          {item.category}
        </div>
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">Sold Out</span>
          </div>
        )}
      </div>
      <div className="flex justify-between items-start mb-1">
        <h3 className="font-bold text-dark text-xs leading-tight line-clamp-2 min-h-[2rem] flex-1">{item.name}</h3>
        <div className={cn(
          "text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
          item.stockQuantity === 0 ? "bg-red-100 text-red-600" : item.stockQuantity < 10 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
        )}>
          {item.stockQuantity}
        </div>
      </div>
      <p className="text-primary font-bold mt-auto text-sm mb-3">{formatNaira(item.price)}</p>
      
      <button
        onClick={() => !isOutOfStock && onAdd(item)}
        disabled={isOutOfStock}
        className={cn(
          "w-full py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 active:scale-95",
          isOutOfStock 
            ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
            : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
        )}
      >
        <Plus size={14} /> Add
      </button>
    </div>
  );
});

export const CashierTerminal: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<"pos" | "incoming">("pos");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "pos">("cash");
  
  // Notification States
  const [unreadCount, setUnreadCount] = useState(0);
  const [volume, setVolume] = useState(() => Number(localStorage.getItem('notiVolume') || 0.5));
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('notiMuted') === 'true');
  const isFirstLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Simulation State
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const { setLoading: setGlobalLoading, showToast } = useUI();

  const categories = ["All", "Meals", "Drinks", "Desserts"];

  // Initialize Audio
  useEffect(() => {
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.volume = volume;
    audio.muted = isMuted;
    audioRef.current = audio;
  }, []);

  // Sync Audio Settings
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
    localStorage.setItem('notiVolume', volume.toString());
    localStorage.setItem('notiMuted', isMuted.toString());
  }, [volume, isMuted]);

  // Listen to Menu
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menu"), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
      setMenu(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "menu");
    });
    return () => unsubscribe();
  }, []);

  // Listen to Incoming Orders (Customer Only)
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("source", "==", "customer"),
      where("paymentStatus", "==", "paid"),
      where("status", "in", ["pending", "preparing"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Notification Logic
      if (!isFirstLoad.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            try {
              audioRef.current?.play().catch(e => console.log("Audio block:", e));
              showToast("New customer order received!", "success");
              if (activeTab !== "incoming") {
                setUnreadCount(prev => prev + 1);
              }
            } catch (err) {
              console.error("Notification failed", err);
            }
          }
        });
      }

      setIncomingOrders(orders.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return tB - tA; // Newest first
      }));
      
      isFirstLoad.current = false;
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "orders");
    });

    return () => unsubscribe();
  }, [activeTab, showToast]);

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menu, searchTerm, activeCategory]);

  const addToCart = React.useCallback((item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
    showToast(`${item.name} added to cart`, "info");
  }, [showToast]);

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.item.id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => {
    const item = cart.find(i => i.item.id === id);
    setCart(prev => prev.filter(i => i.item.id !== id));
    if (item) showToast(`${item.item.name} removed`, "info");
  };

  const total = cart.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", id), { status: newStatus });
      showToast(`Order marked as ${newStatus}`, "success");
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    
    setGlobalLoading(true);
    try {
      const orderId = await getNextOrderId();
      const batch = writeBatch(db);
      
      const orderData = {
        orderId,
        userId: profile?.uid,
        cashierName: profile?.name || "Queen's Staff",
        customerName: "Counter Customer",
        items: cart.map(i => ({ id: i.item.id, name: i.item.name, price: i.item.price, quantity: i.quantity })),
        total,
        status: "completed",
        source: "staff",
        deliveryType: "pickup",
        paymentStatus: "paid", 
        paymentMethod: paymentMethod,
        createdAt: serverTimestamp()
      };
      
      // Add Order Document
      const orderRef = doc(collection(db, "orders"));
      batch.set(orderRef, orderData);

      // Deduct Stock
      cart.forEach(({ item, quantity }) => {
        const itemRef = doc(db, "menu", item.id);
        const newStock = Math.max(0, item.stockQuantity - quantity);
        batch.update(itemRef, { 
          stockQuantity: newStock,
          isAvailable: newStock > 0
        });

        // Sound alert if hit zero
        if (newStock === 0) {
          audioRef.current?.play().catch(e => console.log("Audio block:", e));
          showToast(`${item.name} is now OUT OF STOCK!`, "error");
        }
      });
      
      await batch.commit();

      setCompletedOrder({ 
        id: orderRef.id, 
        ...orderData,
        createdAt: new Date()
      });
      setCart([]);
      setShowReceipt(true);
      showToast(`Order ${orderId} confirmed and stock updated!`, "success");

    } catch (err: any) {
      showToast("Failed to process order", "error");
      console.error(err);
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleSwitchTab = (tab: "pos" | "incoming") => {
    setActiveTab(tab);
    if (tab === "incoming") setUnreadCount(0);
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-10rem)] min-h-[600px]">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative">
        <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
          <button 
            onClick={() => handleSwitchTab("pos")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'pos' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <ShoppingCart size={16} /> POS Terminal
          </button>
          <button 
            onClick={() => handleSwitchTab("incoming")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all relative ${activeTab === 'incoming' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Bell size={16} /> Incoming Orders
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-6 w-full sm:w-auto">
          {/* Volume Control */}
          <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 group">
             <button 
               onClick={() => setIsMuted(!isMuted)}
               className={`transition-colors ${isMuted ? 'text-red-500' : 'text-primary'}`}
             >
                {isMuted || volume === 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
             </button>
             <input 
               type="range" 
               min="0" 
               max="1" 
               step="0.1" 
               value={volume}
               onChange={(e) => {
                 setVolume(parseFloat(e.target.value));
                 if (isMuted) setIsMuted(false);
               }}
               className="w-20 sm:w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary group-hover:bg-gray-300 transition-all shadow-inner"
             />
          </div>

          {activeTab === 'pos' && (
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search dishes..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:ring-4 focus:ring-primary/10 transition-all text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {activeTab === "pos" ? (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
               {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-full text-[11px] font-bold transition-all whitespace-nowrap border ${
                      activeCategory === cat 
                        ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                        : "bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {cat}
                  </button>
               ))}
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {filteredMenu.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100 opacity-50">
                  <UtensilsCrossed size={40} className="text-gray-300 mb-2" />
                  <p className="text-gray-400 font-bold text-xs">No items found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                  {filteredMenu.map(item => (
                    <MenuCard key={item.id} item={item} onAdd={addToCart} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart Sidebar */}
          <div className="w-full lg:w-[380px] flex flex-col h-full">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                <h2 className="text-sm font-bold text-dark flex items-center gap-3">
                  <ShoppingCart size={18} className="text-accent" />
                  Cart Items
                </h2>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-[10px] font-bold uppercase text-gray-400 hover:text-red-500 transition-colors">
                    Clear
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-20">
                    <ShoppingCart className="text-gray-400 mb-4" size={48} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">The cart is empty</p>
                  </div>
                ) : (
                  cart.map(i => (
                    <div key={i.item.id} className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-dark text-xs truncate">{i.item.name}</h4>
                        <p className="text-[10px] font-bold text-primary">{formatNaira(i.item.price)}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <button onClick={() => updateQuantity(i.item.id, -1)} className="p-1 px-1.5 text-gray-400 hover:text-primary transition-colors"><Minus size={12} /></button>
                        <span className="w-4 text-center text-[12px] font-bold text-dark">{i.quantity}</span>
                        <button onClick={() => updateQuantity(i.item.id, 1)} className="p-1 px-1.5 text-gray-400 hover:text-primary transition-colors"><Plus size={12} /></button>
                      </div>
                      <button onClick={() => removeFromCart(i.item.id)} className="text-gray-300 hover:text-red-500 transition-colors ml-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-4">
                 {/* Payment Selector */}
                 <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'cash', icon: Wallet, label: 'Cash' },
                      { id: 'pos', icon: CreditCard, label: 'POS' },
                      { id: 'transfer', icon: Landmark, label: 'Transfer' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                          paymentMethod === method.id 
                            ? 'border-primary bg-primary/5 text-primary' 
                            : 'border-white bg-white text-gray-400 hover:border-gray-100'
                        }`}
                      >
                        <method.icon size={14} />
                        <span className="text-[9px] font-bold uppercase">{method.label}</span>
                      </button>
                    ))}
                 </div>

                <div className="pt-2">
                  <div className="flex justify-between items-center text-xl font-black text-dark tracking-tighter">
                    <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Total</span>
                    <span className="text-2xl text-primary">{formatNaira(total)}</span>
                  </div>
                </div>
                
                <button
                  onClick={handleConfirmOrder}
                  disabled={cart.length === 0}
                  className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  <CheckCircle2 size={18} /> Confirm Order
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Incoming Orders View */
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {incomingOrders.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-100 border-dashed">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                 <Bell size={32} className="text-gray-200" />
              </div>
              <h2 className="text-lg font-bold text-gray-400">No New Orders</h2>
              <p className="text-xs text-gray-300 font-bold uppercase mt-1">Watching for customer arrivals...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
              {incomingOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative flex flex-col hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
                >
                  <div className={`h-1.5 w-full ${order.status === 'pending' ? 'bg-red-500 animate-pulse' : 'bg-primary'}`} />
                  
                  <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-dark tracking-tight">#{order.orderId || order.id.slice(0, 8)}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5 mt-0.5 tracking-widest">
                        <Clock size={12} className="text-accent" /> {order.createdAt?.toDate ? format(order.createdAt.toDate(), "h:mm aa") : "Just now"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                       <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${order.deliveryType === 'delivery' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                          {order.deliveryType}
                       </span>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="space-y-2 mb-6 flex-1">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="font-bold text-dark line-clamp-1 flex-1">{item.name} <span className="text-gray-400 font-medium">×{item.quantity}</span></span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center mb-4 pt-3 border-t border-gray-50">
                       <span className="text-[10px] font-black uppercase text-gray-400">Amount</span>
                       <span className="text-sm font-black text-primary">{formatNaira(order.total)}</span>
                    </div>

                    <div className="flex gap-2">
                       {order.status === 'pending' ? (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "preparing")}
                          className="flex-1 bg-dark text-white py-3 rounded-xl font-bold text-[10px] uppercase hover:bg-black transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                        >
                          <ChefHat size={14} /> Start Preparing
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(order.id, "ready")}
                          className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-[10px] uppercase hover:bg-primary-dark transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                        >
                          <CheckCircle size={14} /> Mark as Ready
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        order={completedOrder} 
        mode="cashier"
      />
    </div>
  );
};

import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { ShoppingCart, Plus, Minus, Trash2, Search, UtensilsCrossed, CheckCircle2, Wallet, CreditCard, Landmark } from "lucide-react";
import { MenuItem } from "../admin/MenuManagement";
import { formatNaira } from "../../utils/format";
import { getNextOrderId } from "../../services/counters";
import { useUI } from "../../context/UIContext";
import { ReceiptModal } from "../../components/ReceiptModal";

const MenuCard = React.memo(({ item, onAdd }: { item: MenuItem, onAdd: (item: MenuItem) => void }) => (
  <div
    className="group bg-white p-3 rounded-2xl shadow-sm border border-gray-100 hover:border-primary hover:shadow-lg transition-all text-left flex flex-col relative overflow-hidden"
  >
    <div className="w-full aspect-square mb-3 rounded-xl overflow-hidden bg-gray-50 relative">
      <img 
        src={item.image} 
        alt={item.name} 
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
        loading="lazy"
        referrerPolicy="no-referrer" 
      />
      <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/95 rounded-full text-[9px] font-bold text-primary uppercase border border-gray-100">
        {item.category}
      </div>
    </div>
    <h3 className="font-bold text-dark text-xs leading-tight mb-1 line-clamp-2 min-h-[2rem]">{item.name}</h3>
    <p className="text-primary font-bold mt-auto text-sm mb-3">{formatNaira(item.price)}</p>
    
    <button
      onClick={() => onAdd(item)}
      className="w-full bg-primary/10 text-primary py-2 rounded-lg text-xs font-bold uppercase transition-all hover:bg-primary hover:text-white flex items-center justify-center gap-1.5 active:scale-95"
    >
      <Plus size={14} /> Add
    </button>
  </div>
));

export const CashierTerminal: React.FC = () => {
  const { profile } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer" | "pos">("cash");
  
  // Simulation State
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const { setLoading: setGlobalLoading, showToast } = useUI();

  const categories = ["All", "Meals", "Drinks", "Desserts"];

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

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;
    
    setGlobalLoading(true);
    try {
      const orderId = await getNextOrderId();
      const orderData = {
        orderId,
        userId: profile?.uid,
        cashierName: profile?.name || "Queen's Staff",
        customerName: "Counter Customer",
        items: cart.map(i => ({ id: i.item.id, name: i.item.name, price: i.item.price, quantity: i.quantity })),
        total,
        status: "preparing",
        source: "staff",
        deliveryType: "pickup",
        paymentStatus: "paid", 
        paymentMethod: paymentMethod,
        createdAt: serverTimestamp()
      };
      
      try {
        const docRef = await addDoc(collection(db, "orders"), orderData);
        setCompletedOrder({ id: docRef.id, ...orderData });
        setCart([]);
        setShowReceipt(true);
        showToast(`Order ${orderId} confirmed!`, "success");
      } catch (orderError: any) {
        showToast("Failed to save order", "error");
        handleFirestoreError(orderError, OperationType.CREATE, "orders");
      }
    } catch (counterError: any) {
      showToast("Order ID generation failed", "error");
      handleFirestoreError(counterError, OperationType.UPDATE, "metadata/counters");
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
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)] min-h-[500px]">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-dark tracking-tight">Menu</h2>
            <p className="text-sm text-gray-500">Add items to the order.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search food, drinks..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-6 pt-2 no-scrollbar">
           {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
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
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-100">
              <UtensilsCrossed className="text-gray-200 mb-2" size={40} />
              <p className="text-gray-400 font-semibold text-sm">No items matching filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {filteredMenu.map(item => (
                <MenuCard key={item.id} item={item} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>
      </div>


      <div className="w-full lg:w-[400px] flex flex-col">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col h-full relative overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-base font-bold text-dark flex items-center gap-3">
              <ShoppingCart size={20} className="text-primary" />
              Cart Items
            </h2>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors">
                Empty Cart
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
                <ShoppingCart className="text-gray-400 mb-4" size={56} />
                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest leading-loose">The cart is empty</p>
              </div>
            ) : (
              cart.map(i => (
                <div key={i.item.id} className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm transition-all hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-dark text-[13px] truncate">{i.item.name}</h4>
                    <p className="text-gray-400 font-medium text-[11px] mt-0.5">{formatNaira(i.item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1.5">
                    <button onClick={() => updateQuantity(i.item.id, -1)} className="p-1 px-1.5 text-gray-500 hover:text-primary transition-colors hover:bg-white rounded-lg shadow-none hover:shadow-sm"><Minus size={14} /></button>
                    <span className="w-5 text-center text-[13px] font-bold text-dark">{i.quantity}</span>
                    <button onClick={() => updateQuantity(i.item.id, 1)} className="p-1 px-1.5 text-gray-500 hover:text-primary transition-colors hover:bg-white rounded-lg shadow-none hover:shadow-sm"><Plus size={14} /></button>
                  </div>
                  <div className="text-right font-bold text-primary text-[13px] min-w-[75px]">
                    {formatNaira(i.item.price * i.quantity)}
                  </div>
                  <button onClick={() => removeFromCart(i.item.id)} className="text-gray-300 hover:text-red-500 p-1.5 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            {/* Payment Method Selector */}
            <div className="mb-6">
               <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Payment Method</label>
               <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', icon: Wallet, label: 'Cash' },
                    { id: 'pos', icon: CreditCard, label: 'POS' },
                    { id: 'transfer', icon: Landmark, label: 'Transfer' }
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                        paymentMethod === method.id 
                          ? 'border-primary bg-primary/5 text-primary' 
                          : 'border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}
                    >
                      <method.icon size={16} />
                      <span className="text-[10px] font-bold">{method.label}</span>
                    </button>
                  ))}
               </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-dark">{formatNaira(total)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-xl font-black text-dark tracking-tight mt-2 border-t border-gray-200">
                <span className="text-gray-500 font-bold text-sm uppercase">Total Amount</span>
                <span className="text-2xl text-primary font-black">{formatNaira(total)}</span>
              </div>
            </div>
            
            <button
              onClick={handleConfirmOrder}
              disabled={cart.length === 0}
              className="w-full bg-primary text-white py-4.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg hover:shadow-primary/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <CheckCircle2 size={20} />
              Confirm Order
            </button>
          </div>
        </div>
      </div>

      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        order={completedOrder} 
        mode="cashier"
      />
    </div>
  );
};




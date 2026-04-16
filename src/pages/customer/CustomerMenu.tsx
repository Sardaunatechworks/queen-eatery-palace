import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { ShoppingCart, Plus, Minus, Trash2, MapPin, Search, Utensils, Star, Clock, CheckCircle2 } from "lucide-react";
import { MenuItem } from "../admin/MenuManagement";
import { usePaystackPayment } from "react-paystack";
import { formatNaira } from "../../utils/format";
import { getNextOrderId } from "../../services/counters";
import { useUI } from "../../context/UIContext";
import { PaymentModal } from "../../components/PaymentModal";
import { ReceiptModal } from "../../components/ReceiptModal";

const MenuCard = React.memo(({ item, onAdd }: { item: MenuItem, onAdd: (item: MenuItem) => void }) => (
  <div 
    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-lg transition-all"
  >
    <div className="relative aspect-square overflow-hidden bg-gray-50">
      <img 
        src={item.image} 
        alt={item.name} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        loading="lazy"
        referrerPolicy="no-referrer" 
      />
      <div className="absolute top-3 right-3 px-2 py-0.5 bg-white/90 rounded-full text-[10px] font-bold text-primary uppercase border border-gray-100">
        {item.category}
      </div>
    </div>
    <div className="p-5 flex flex-col flex-1">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg text-dark leading-tight line-clamp-2 min-h-[3.5rem]">{item.name}</h3>
      </div>
      <div className="flex items-center justify-between gap-4 mt-auto">
        <span className="text-primary font-bold text-lg">
          {formatNaira(item.price)}
        </span>
        <button
          onClick={() => onAdd(item)}
          className="bg-primary text-white p-2.5 rounded-xl font-bold text-xs uppercase hover:bg-primary-dark transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add
        </button>
      </div>
    </div>
  </div>
));

export const CustomerMenu: React.FC = () => {
  const { profile } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState(profile?.address || "");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Simulation State
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  const { setLoading: setGlobalLoading, showToast } = useUI();

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map(item => item.category)));
    return ["All", ...cats];
  }, [menu]);

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
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, categoryFilter, searchTerm]);

  const addToCart = React.useCallback((item: MenuItem) => {
    let isNew = false;
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      isNew = true;
      return [...prev, { item, quantity: 1 }];
    });
    
    if (isNew) {
      showToast(`${item.name} added to cart`, "success");
    }
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
    setCart(prev => prev.filter(i => i.item.id !== id));
    showToast("Item removed from cart", "info");
  };

  const total = cart.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);

  // Paystack config
  const config = {
    reference: (new Date()).getTime().toString(),
    email: profile?.email || "customer@example.com",
    amount: total * 100, // Paystack expects amount in kobo/cents
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
  };

  const initializePayment = usePaystackPayment(config);

  const handlePaymentComplete = async () => {
    setShowPayment(false);
    setGlobalLoading(true);
    try {
      const orderId = await getNextOrderId();
      const orderData = {
        orderId,
        userId: profile?.uid,
        customerName: profile?.name || "Customer",
        items: cart.map(i => ({ id: i.item.id, name: i.item.name, price: i.item.price, quantity: i.quantity })),
        total,
        status: "pending",
        source: "customer",
        deliveryType,
        address: deliveryType === "delivery" ? address : null,
        paymentStatus: "paid",
        paymentReference: `MOCK-${Date.now()}`,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, "orders"), orderData);
      setCompletedOrder({ id: docRef.id, ...orderData });
      setCart([]);
      setShowReceipt(true);
      showToast(`Order ${orderId} has been placed successfully.`, "success");
    } catch (error: any) {
      showToast("Failed to place order", "error");
      handleFirestoreError(error, OperationType.CREATE, "orders");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (deliveryType === "delivery" && !address) {
      showToast("Please provide a delivery address", "error");
      return;
    }
    // Simple simulation for this request
    setShowPayment(true);
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[calc(100vh-10rem)] pb-10">
      <div className="flex-1 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-dark tracking-tight">Menu</h2>
            <p className="text-gray-500 max-w-md text-sm">Select items to order.</p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search menu..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
           {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  categoryFilter === cat 
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20" 
                    : "bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
           ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMenu.map((item) => (
            <MenuCard key={item.id} item={item} onAdd={addToCart} />
          ))}
        </div>

      </div>

      <div className="w-full lg:w-[400px]">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col h-full sticky top-28 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h2 className="text-lg font-bold text-dark flex items-center gap-2">
              <ShoppingCart size={20} className="text-primary" /> 
              Your Cart
            </h2>
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
               {cart.length}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar min-h-[250px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-30">
                <Utensils size={64} />
                <p className="text-base font-bold text-gray-500">Your cart is empty</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Add items to start your order.</p>
              </div>
            ) : (
              cart.map(i => (
                <div key={i.item.id} className="relative flex items-center gap-4 group">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                     <img src={i.item.image} alt={i.item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-dark text-sm truncate">{i.item.name}</h4>
                    <p className="text-primary font-bold text-xs">{formatNaira(i.item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                    <button onClick={() => updateQuantity(i.item.id, -1)} className="p-1 text-gray-400 hover:text-primary transition-colors"><Minus size={14} /></button>
                    <span className="w-5 text-center text-xs font-bold text-dark">{i.quantity}</span>
                    <button onClick={() => updateQuantity(i.item.id, 1)} className="p-1 text-gray-400 hover:text-primary transition-colors"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(i.item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50/50 space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block ml-1">Delivery Option</label>
              <div className="flex gap-2 p-1 bg-white rounded-xl border border-gray-200">
                <button 
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${deliveryType === 'pickup' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-primary'}`}
                  onClick={() => setDeliveryType('pickup')}
                >
                  <Clock size={14} /> Pickup
                </button>
                <button 
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase rounded-lg transition-all ${deliveryType === 'delivery' ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:text-primary'}`}
                  onClick={() => setDeliveryType('delivery')}
                >
                  <MapPin size={14} /> Delivery
                </button>
              </div>
              
              {deliveryType === 'delivery' && (
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Delivery Address" 
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-xs font-bold transition-all shadow-sm"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="text-sm font-bold text-gray-500 uppercase">Total</span>
              <span className="text-2xl font-bold text-primary">{formatNaira(total)}</span>
            </div>
            
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm uppercase hover:bg-primary-dark transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} /> Place Order
            </button>
          </div>
        </div>
      </div>

      {/* Checkout Simulators */}
      <PaymentModal 
        isOpen={showPayment} 
        onComplete={handlePaymentComplete} 
        amount={total} 
      />
      <ReceiptModal 
        isOpen={showReceipt} 
        onClose={() => setShowReceipt(false)} 
        order={completedOrder} 
        mode="customer"
      />
    </div>
  );
};



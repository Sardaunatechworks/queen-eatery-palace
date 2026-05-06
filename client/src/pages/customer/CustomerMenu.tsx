import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, writeBatch, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { useAuth } from "../../context/AuthContext";
import { ShoppingCart, Plus, Minus, Trash2, MapPin, Search, Utensils, Clock, CheckCircle2, X } from "lucide-react";
import { MenuItem } from "../admin/MenuManagement";
import { usePaystackPayment } from "react-paystack";
import { formatNaira } from "../../utils/format";
import { useUI } from "../../context/UIContext";
import { ReceiptModal } from "../../components/ReceiptModal";
import { cn } from "../../utils/cn";
import { PaymentModal } from "../../components/PaymentModal";

const MenuCard = React.memo(({ item, onAdd }: { item: MenuItem, onAdd: (item: MenuItem) => void }) => {
  const isAvailable = item.isAvailable !== false && item.stockQuantity > 0;

  return (
    <div 
      className={cn(
        "group bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col transition-all",
        !isAvailable && "opacity-60 grayscale"
      )}
    >
      <div className="relative aspect-[4/3] bg-gray-50 border-b border-gray-50">
        <img 
          src={item.image} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          loading="lazy"
        />
        {!isAvailable && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="text-red-600 font-bold text-[10px] uppercase tracking-widest border-2 border-red-600 px-3 py-1 rounded">Sold Out</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 space-y-4">
        <div className="space-y-1">
          <h3 className="font-bold text-dark text-sm sm:text-base leading-tight">{item.name}</h3>
          <p className="text-red-600 font-bold text-base">{formatNaira(item.price)}</p>
        </div>
        <div className="flex items-center justify-between gap-1 text-[10px] uppercase font-bold tracking-tight">
           <span className={cn(isAvailable ? "text-green-600" : "text-red-600")}>
             {isAvailable ? "Available" : "Sold Out"}
           </span>
        </div>
        <button
          onClick={() => isAvailable && onAdd(item)}
          disabled={!isAvailable}
          className={cn(
            "w-full py-3 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
            isAvailable ? "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-lg shadow-red-100" : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          <Plus size={14} /> 
          <span>Add</span>
        </button>
      </div>
    </div>
  );
});

export const CustomerMenu: React.FC = () => {
  const { profile } = useAuth();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{item: MenuItem, quantity: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveryType, setDeliveryType] = useState<"pickup" | "delivery">("pickup");
  const [address, setAddress] = useState(profile?.address || "");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

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
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      const currentQty = existing ? existing.quantity : 0;
      
      if (currentQty >= item.stockQuantity) {
        showToast("Stock limit reached.", "error");
        return prev;
      }

      if (existing) {
        return prev.map(i => i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { item, quantity: 1 }];
    });
    showToast(`${item.name} added.`, "success");
  }, [showToast]);

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.item.id === id) {
        const itemInMenu = menu.find(m => m.id === id);
        const newQ = i.quantity + delta;
        if (delta > 0 && itemInMenu && newQ > itemInMenu.stockQuantity) return i;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.item.id !== id));
  };

  const total = cart.reduce((sum, i) => sum + (i.item.price * i.quantity), 0);

  const config = {
    reference: (new Date()).getTime().toString(),
    email: profile?.email || "customer@example.com",
    amount: total * 100,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "",
  };

  const initializePayment = usePaystackPayment(config);

  const handlePaymentComplete = async (reference: string) => {
    setIsProcessing(true);
    setGlobalLoading(true);
    const userId = profile?.uid;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5050";

    try {
      const orderData = {
        userId,
        customerName: profile?.name || "Customer",
        customerEmail: profile?.email || "N/A",
        customerPhone: profile?.phone || "N/A",
        items: cart.map(i => ({ id: i.item.id, name: i.item.name, price: i.item.price, quantity: i.quantity })),
        total,
        deliveryType,
        address: deliveryType === "delivery" ? address : null,
      };

      const response = await fetch(`${apiUrl}/api/verify-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, orderData, userId }),
      });

      const result = await response.json();

      if (result.success) {
        try {
          const batch = writeBatch(db);
          cart.forEach(({ item, quantity }) => {
            const itemRef = doc(db, "menu", item.id);
            const menuRecord = menu.find(m => m.id === item.id);
            const currentStock = menuRecord?.stockQuantity ?? 0;
            const newStock = Math.max(0, currentStock - quantity);
            batch.update(itemRef, { 
              stockQuantity: newStock,
              isAvailable: newStock > 0
            });
          });
          await batch.commit();
        } catch (stockErr) {
          console.error("Stock update failed:", stockErr);
        }

        setCompletedOrder({ id: reference, ...orderData, orderId: result.orderId, paymentStatus: "paid", createdAt: new Date().toISOString() });
        setCart([]);
        setShowReceipt(true);
        setIsCartOpen(false);
        showToast("Order placed successfully.", "success");
      } else {
        showToast(result.message || "Payment failed", "error");
        console.error("Payment Verification Failed:", result);
      }
    } catch (error: any) {
      showToast("Verification failed.", "error");
    } finally {
      setIsProcessing(false);
      setGlobalLoading(false);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0 || isProcessing) return;
    if (deliveryType === "delivery" && !address) {
      showToast("Address required.", "error");
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const handleConfirmedPayment = () => {
    setIsProcessing(true);
    initializePayment({
      onSuccess: (response: any) => {
        setIsPaymentModalOpen(false);
        handlePaymentComplete(response.reference);
      },
      onClose: () => {
        setIsProcessing(false);
      },
    });
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const CartContent = () => (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex items-center justify-between">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <ShoppingCart size={18} className="text-red-600" />
          Your Order
        </h2>
        <button onClick={() => setIsCartOpen(false)} className="lg:hidden text-gray-400">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-30">
            <ShoppingCart className="text-gray-300 mb-4" size={40} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Empty</p>
          </div>
        ) : (
          cart.map(i => (
            <div key={i.item.id} className="flex gap-4 items-center animate-in fade-in slide-in-from-right-2">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                 <img src={i.item.image} alt={i.item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[11px] truncate leading-tight">{i.item.name}</h4>
                <p className="text-red-600 font-bold text-[10px]">{formatNaira(i.item.price)}</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-100">
                <button onClick={() => updateQuantity(i.item.id, -1)} className="p-1 hover:text-red-600"><Minus size={12} /></button>
                <span className="w-4 text-center text-[10px] font-bold">{i.quantity}</span>
                <button onClick={() => updateQuantity(i.item.id, 1)} className="p-1 hover:text-red-600"><Plus size={12} /></button>
                <button onClick={() => removeFromCart(i.item.id)} className="ml-1 text-gray-300 hover:text-red-600">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-gray-50 space-y-6">
        <div className="space-y-4">
          <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
            <button 
              className={cn("flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all", deliveryType === 'pickup' ? "bg-white text-red-600 shadow-sm" : "text-gray-400")}
              onClick={() => setDeliveryType('pickup')}
            >
              Pickup
            </button>
            <button 
              className={cn("flex-1 py-2 text-[10px] font-bold uppercase rounded-lg transition-all", deliveryType === 'delivery' ? "bg-white text-red-600 shadow-sm" : "text-gray-400")}
              onClick={() => setDeliveryType('delivery')}
            >
              Delivery
            </button>
          </div>
          
          {deliveryType === 'delivery' && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <textarea 
                placeholder="Delivery address..." 
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-red-600 outline-none text-[11px] font-bold transition-all resize-none"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <div className="flex items-start gap-1.5 px-1">
                <MapPin size={12} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-gray-500 font-medium leading-tight">
                  <span className="font-bold text-red-600">Note:</span> Delivery fee is not included in the total and will be charged separately based on your location.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</span>
          <span className="text-xl font-bold text-red-600">{formatNaira(total)}</span>
        </div>
        
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || isProcessing}
          className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-12">
      <div className="flex-1 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 leading-none flex items-center gap-3">
              <div className="bg-red-600 p-1.5 rounded-lg shadow-lg">
                <Utensils className="text-white" size={20} />
              </div>
              Menu
            </h2>
          </div>
          
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search items..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 outline-none transition-all text-sm shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
           {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                  categoryFilter === cat 
                    ? "bg-red-600 text-white border-red-600 shadow-md" 
                    : "bg-white text-gray-500 border-gray-200 hover:text-red-600 hover:border-red-600"
                )}
              >
                {cat}
              </button>
           ))}
        </div>

        {filteredMenu.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl opacity-40">
            <Search size={40} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No results</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredMenu.map((item) => (
              <MenuCard key={item.id} item={item} onAdd={addToCart} />
            ))}
          </div>
        )}
      </div>

      <div className="hidden lg:block w-[400px]">
        <div className="sticky top-28 h-[calc(100vh-14rem)]">
          <CartContent />
        </div>
      </div>

      {cart.length > 0 && !isCartOpen && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 z-50 lg:hidden bg-red-600 text-white px-8 py-4 rounded-full shadow-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center gap-3 animate-bounce"
        >
          <ShoppingCart size={20} />
          <span>Checkout ({cart.reduce((a, c) => a + c.quantity, 0)})</span>
        </button>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden animate-in fade-in">
           <div className="absolute inset-0 bg-dark/20 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
           <div className="absolute bottom-0 left-0 right-0 h-[85vh] bg-white rounded-t-[3rem] animate-in slide-in-from-bottom duration-500 overflow-hidden flex flex-col p-2">
              <CartContent />
           </div>
        </div>
      )}

      <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} order={completedOrder} mode="customer" />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onConfirm={handleConfirmedPayment} amount={total} items={cart.map(i => ({ name: i.item.name, quantity: i.quantity, price: i.item.price }))} isProcessing={isProcessing} />
    </div>
  );
};

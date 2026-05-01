import React from "react";
import { X, CreditCard, ShoppingBag, ShieldCheck, CheckCircle2 } from "lucide-react";
import { formatNaira } from "../utils/format";
import { cn } from "../utils/cn";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  items: any[];
  isProcessing: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  items,
  isProcessing
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20">
        {/* Header Decor */}
        <div className="h-24 bg-primary relative overflow-hidden flex items-center px-8">
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-dark/30 rounded-full translate-y-1/2 -translate-x-1/3" />
           
           <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl backdrop-blur-md flex items-center justify-center border border-white/20">
                 <ShoppingBag size={24} className="text-white" />
              </div>
              <div>
                 <h2 className="text-white font-black text-lg tracking-tight">Checkout Details</h2>
                 <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Safe & Secure Payment</p>
              </div>
           </div>

           <button 
             onClick={onClose}
             className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
           >
             <X size={24} />
           </button>
        </div>

        <div className="p-8 space-y-6">
           <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                 <span className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Order Summary</span>
                 <span className="text-xs font-bold text-gray-500">{items.length} Items</span>
              </div>

              <div className="max-h-[120px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                 {items.map((i, idx) => (
                   <div key={idx} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-bold text-dark">{i.name}</span>
                        <span className="text-[9px] font-black text-primary/60">QTY: {i.quantity}</span>
                      </div>
                      <span className="text-[11px] font-bold text-dark">{formatNaira(i.price * i.quantity)}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10">
              <div className="flex justify-between items-center mb-1">
                 <span className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Amount to Pay</span>
                 <ShieldCheck size={14} className="text-primary/40" />
              </div>
              <div className="text-4xl font-black text-primary tracking-tighter">
                 {formatNaira(amount)}
              </div>
           </div>

           <div className="pt-2 text-center">
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-6">
                By clicking "Proceed to Secure Payment", you will be redirected to our secure payment processor (Paystack) to complete your transaction.
              </p>

              <button 
                onClick={onConfirm}
                disabled={isProcessing}
                className="group w-full bg-primary text-white py-5 rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>Proceed to Secure Payment</span>
                  </>
                )}
              </button>
           </div>
        </div>

        <div className="bg-gray-50 p-6 flex items-center justify-center gap-6">
           <img src="https://paystack.com/assets/img/login/paystack-logo.png" alt="Paystack" className="h-4 opacity-30 grayscale" />
           <div className="w-[1px] h-3 bg-gray-300" />
           <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              <CheckCircle2 size={12} className="text-green-500" />
              Verified Merchant
           </div>
        </div>
      </div>
    </div>
  );
};

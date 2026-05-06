import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X, CheckCircle2, ShoppingBag, MapPin, Receipt, Share2, Phone, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { formatNaira } from '../utils/format';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any; // Order data
  mode: 'cashier' | 'customer';
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, order, mode }) => {
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm print:p-0 print:bg-white print:static">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[95vh] print:shadow-none print:rounded-none print:max-w-none print:h-auto"
      >

        {/* Header - Hidden in Print */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between print:hidden">
          <h2 className="text-base font-bold text-dark flex items-center gap-2">
            <Receipt size={18} className="text-primary" />
            Official Royal Receipt
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={18} />
          </button>
        </div>

        {/* Receipt content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar print:overflow-visible print:px-8 print:py-6">
          {/* Logo & Info */}
          <div className="text-center space-y-2 pb-2">
            <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-4 print:w-12 print:h-12 border-4 border-primary/10 shadow-lg shadow-primary/20 print:shadow-none">
               <ShoppingBag size={28} className="print:size-6" />
            </div>
            <h1 className="text-xl font-black text-dark tracking-tighter uppercase print:text-lg leading-tight">Queen Eatery Palace <br /> and Event Hall</h1>
            <div className="space-y-0.5">
              <p className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1.5">
                <MapPin size={10} className="text-accent" /> Behind Dutse Emirs House, Opposite Glo Office
              </p>
              <p className="text-[10px] text-gray-500 font-bold flex items-center justify-center gap-1.5">
                <Phone size={10} className="text-accent" /> 09155290102
              </p>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="border-y border-dashed border-gray-200 py-4 grid grid-cols-2 gap-y-4 text-xs print:py-3 print:gap-y-3">
            <div className="space-y-0.5">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Order Reference</p>
              <p className="font-bold text-dark text-sm">#{order.orderId || order.id?.slice(0, 8)}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Transaction Date</p>
              <p className="font-bold text-dark">
                {(() => {
                  try {
                    if (order.createdAt?.toDate) {
                      return format(order.createdAt.toDate(), "dd/MM/yyyy h:mm a");
                    }
                    const date = order.createdAt ? new Date(order.createdAt) : new Date();
                    return isNaN(date.getTime()) 
                      ? format(new Date(), "dd/MM/yyyy h:mm a")
                      : format(date, "dd/MM/yyyy h:mm a");
                  } catch (e) {
                    return format(new Date(), "dd/MM/yyyy h:mm a");
                  }
                })()}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Counter Staff</p>
              <p className="font-bold text-gray-700">{order.cashierName || "Palace Attendant"}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Payment Mode</p>
              <span className="inline-block bg-primary/5 text-primary px-2 py-0.5 rounded font-black text-[10px] uppercase border border-primary/10">
                {order.paymentMethod || "Direct"}
              </span>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-2">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <div className="space-y-3.5">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start text-[13px]">
                  <div className="flex-1 pr-4">
                    <p className="font-bold text-gray-800 leading-tight">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5 italic">{item.quantity} × {formatNaira(item.price)}</p>
                  </div>
                  <p className="font-bold text-dark">
                    {formatNaira(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Section */}
          <div className="space-y-2 border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-tight">
              <span>Net Subtotal</span>
              <span>{formatNaira(order.total || 0)}</span>
            </div>
            <div className="flex justify-between items-center bg-primary/5 p-3 rounded-2xl print:bg-white print:p-0 print:pt-2">
              <span className="text-sm font-black text-gray-600 uppercase tracking-tighter">Grand Total</span>
              <span className="text-2xl font-black text-primary">{formatNaira(order.total || 0)}</span>
            </div>
          </div>

          {/* Lower Metadata / Fulfillment */}
          <div className="text-center space-y-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[9px] font-bold text-gray-500 uppercase tracking-widest print:bg-white">
               {order.deliveryType === 'delivery' ? <MapPin size={10} className="text-primary" /> : <CheckCircle2 size={10} className="text-primary" />}
               {order.deliveryType === 'delivery' ? 'Delivery Address' : 'POS Fulfillment'}
            </div>
            <p className="text-[11px] text-gray-500 font-bold leading-relaxed px-4">
               {order.deliveryType === 'delivery' ? order.address : 'Store Front Counter Sale'}
            </p>
          </div>

          {/* Footer / QR */}
          <div className="pt-6 border-t border-dashed border-gray-200 text-center space-y-4 pb-4">
            <div className="flex flex-col items-center gap-2 opacity-30">
               <QrCode size={40} className="text-gray-400" strokeWidth={1.5} />
               <p className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">Scan for Feedback</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-dark uppercase tracking-[0.3em]">Royal Visit Appreciated</p>
              <p className="text-[9px] font-bold text-gray-400 italic">No refund after payment. Thank you!</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Hidden in Print */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 print:hidden">
          {mode === 'cashier' ? (
            <button
              onClick={handlePrint}
              className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
            >
              <Printer size={18} /> Print Receipt
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 bg-white text-dark border border-gray-200 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                 Close
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Printer size={18} /> Download
              </button>
            </>
          )}
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: 'Queen Eatery Palace Receipt',
                  text: `Receipt for Order #${order.orderId || order?.id?.slice(0, 8) || 'Unknown'}`,
                  url: window.location.href,
                }).catch(console.error);
              }
            }}
            className="bg-white text-gray-400 p-4 rounded-2xl border border-gray-200 hover:text-primary transition-colors flex items-center justify-center"
          >
            <Share2 size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};


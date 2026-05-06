import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, User, MapPin, Mail, Phone, ShoppingBag } from 'lucide-react';
import { Order } from '../pages/admin/OrdersView';
import { formatNaira } from '../utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onConfirm: (id: string, status: Order["status"]) => void;
}

export const OrderAcceptanceModal: React.FC<Props> = ({ isOpen, onClose, order, onConfirm }) => {
  if (!isOpen || !order) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-xl font-black text-dark tracking-tight">Receive Order Confirmation</h2>
              <p className="text-sm font-bold text-gray-500">#{order.orderId || order.id.slice(0, 8)}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white hover:bg-red-50 hover:text-red-600 rounded-full transition-colors text-gray-400 shadow-sm border border-gray-100">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Customer Info */}
            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/10 space-y-4">
              <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                <User size={14} /> Customer Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</p>
                  <p className="font-bold text-dark">{order.customerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone</p>
                  <p className="font-bold text-dark flex items-center gap-1.5"><Phone size={12} className="text-gray-400"/> {order.customerPhone || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                  <p className="font-bold text-dark flex items-center gap-1.5"><Mail size={12} className="text-gray-400"/> {order.customerEmail || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Delivery Info */}
            {order.deliveryType === 'delivery' && (
              <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100 space-y-3">
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} /> Delivery Location
                </h3>
                <p className="font-semibold text-dark text-sm leading-relaxed bg-white p-3 rounded-xl border border-indigo-50">
                  {order.address || 'No address provided'}
                </p>
              </div>
            )}

            {/* Order Items */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag size={14} /> Order Items
              </h3>
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 border-b border-gray-100 last:border-0 bg-white m-1 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center font-black text-xs">{item.quantity}</span>
                      <span className="font-bold text-sm text-dark">{item.name}</span>
                    </div>
                    <span className="font-bold text-gray-500 text-sm">{formatNaira(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Total */}
            <div className="flex justify-between items-center p-5 bg-dark rounded-2xl text-white">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Order Total</span>
              <span className="text-2xl font-black">{formatNaira(order.total)}</span>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-gray-50 grid grid-cols-2 gap-3">
            <button
              onClick={onClose}
              className="py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm(order.id, "preparing");
                onClose();
              }}
              className="py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 active:scale-95"
            >
              <CheckCircle2 size={18} /> Confirm & Accept
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

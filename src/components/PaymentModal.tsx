import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2, CreditCard } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onComplete: () => void;
  amount: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onComplete, amount }) => {
  const [status, setStatus] = useState<'processing' | 'success'>('processing');

  useEffect(() => {
    if (isOpen) {
      setStatus('processing');
      const timer = setTimeout(() => {
        setStatus('success');
        const completeTimer = setTimeout(() => {
          onComplete();
        }, 1500);
        return () => clearTimeout(completeTimer);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-500 ${
              status === 'success' ? 'bg-green-50 text-green-500' : 'bg-primary/5 text-primary'
            }`}>
              {status === 'processing' ? (
                <Loader2 className="animate-spin" size={40} />
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <CheckCircle2 size={40} />
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-dark tracking-tight">
              {status === 'processing' ? 'Processing Payment' : 'Payment Approved'}
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              {status === 'processing' 
                ? 'Verifying transaction with secure gateway...' 
                : 'Your transaction was successful!'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 border border-gray-100">
                <CreditCard size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Amount</p>
                <p className="text-sm font-bold text-dark">Mock Transaction</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">₦{amount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="h-1.5 w-full bg-gray-100 overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: status === 'processing' ? "70%" : "100%" }}
            transition={{ duration: status === 'processing' ? 2.5 : 0.5 }}
            className={`h-full transition-colors duration-500 ${
              status === 'success' ? 'bg-green-500' : 'bg-primary'
            }`}
          />
        </div>
      </motion.div>
    </div>
  );
};

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { Utensils, Mail, ArrowLeft, Key, ShieldAlert } from "lucide-react";
import { useUI } from "../context/UIContext";

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorType, setErrorType] = useState<"none" | "staff" | "not_found" | "other">("none");
  const { setLoading, showToast } = useUI();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorType("none");

    try {
      // 1. Verify if the email belongs to a customer
      const q = query(collection(db, "users"), where("email", "==", email.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorType("not_found");
        showToast("No account found with this email", "error");
        setLoading(false);
        return;
      }

      const userData = querySnapshot.docs[0].data();
      
      // 2. Strict check: only allow customers to reset via email
      if (userData.role !== "customer") {
        setErrorType("staff");
        showToast("Access Denied", "error");
        setLoading(false);
        return;
      }

      // 3. Trigger Firebase reset
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
      showToast("Reset link sent to your email", "success");
    } catch (err: any) {
      setErrorType("other");
      showToast(err.message || "Failed to send reset email", "error");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 space-y-6">
            <div className="flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <Mail size={32} className="text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-dark">Check your email</h1>
            <p className="text-gray-500 text-sm leading-relaxed">
              We've sent a password reset link to <span className="font-semibold text-dark">{email}</span>. 
              Please follow the instructions to reset your password.
            </p>
            <Link 
              to="/login" 
              className="block w-full bg-primary text-white py-4 rounded-xl font-bold text-sm hover:bg-primary-dark transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex justify-center mb-8">
             <div className="bg-primary p-4 rounded-xl shadow-lg">
                <Utensils size={32} className="text-white" />
             </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark tracking-tight">Forgot Password</h1>
            <p className="text-sm text-gray-500 mt-2">Enter your email for the reset link</p>
          </div>

          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 ml-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  className="w-full pl-11 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {errorType === "staff" && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                <ShieldAlert size={20} className="text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700 leading-normal">
                  <strong>Staff Note:</strong> Online password reset is only available for Customers. 
                  Staff members must contact their local manager for credential recovery.
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-primary-dark transition-all shadow-lg flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Key size={18} /> Send Reset Link
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-gray-50">
            <Link to="/login" className="text-primary font-bold text-sm hover:underline flex items-center justify-center gap-2">
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

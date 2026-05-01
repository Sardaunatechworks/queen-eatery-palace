import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { Utensils, LogIn, Eye, EyeOff } from "lucide-react";
import { useUI } from "../context/UIContext";

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setLoading, showToast } = useUI();
  const navigate = useNavigate();


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      try {
        const userDoc = await getDoc(doc(db, "users", cred.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role;
          const isSuperAdmin = userData.isSuperAdmin;
          const status = userData.status;
          const suspensionReason = userData.suspensionReason;
          const suspensionEndDate = userData.suspensionEndDate;
          
          // Check for suspension
          if (status === 'suspended') {
            const now = new Date();
            const endDate = suspensionEndDate?.toDate ? suspensionEndDate.toDate() : null;
            
            if (!endDate || now < endDate) {
              const dateStr = endDate ? endDate.toLocaleDateString() : "indefinitely";
              showToast(`ACCESS DENIED: Your account is suspended until ${dateStr}. Reason: ${suspensionReason || 'N/A'}`, "error");
              await auth.signOut();
              return;
            }
          }
          
          showToast(
            isSuperAdmin ? "Welcome back, Super Admin!" : `Welcome back, ${role}`, 
            "success"
          );

          if (role === "admin") navigate("/admin");
          else if (role === "cashier") navigate("/cashier");
          else if (role === "kitchen") navigate("/kitchen");
          else navigate("/customer");
        } else {
          showToast("User record not found", "error");
          await auth.signOut();
        }
      } catch (firestoreErr: any) {
        showToast("Access error", "error");
        await auth.signOut();
      }
    } catch (err: any) {
      showToast("Invalid credentials", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex justify-center mb-8">
             <div className="bg-primary p-4 rounded-xl shadow-lg">
                <Utensils size={32} className="text-white" />
             </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-dark tracking-tight">Login</h1>
            <p className="text-sm text-gray-500 mt-2">Access your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 ml-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end pt-1">
                <Link to="/forgot-password" size={12} className="text-xs font-semibold text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </div>



            <button
              type="submit"
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-primary-dark transition-all shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] mt-4"
            >
              <LogIn size={18} /> Login
            </button>
          </form>

          <div className="mt-10 text-center pt-8 border-t border-gray-50">
            <p className="text-sm text-gray-500 mb-2">Don't have an account?</p>
            <Link to="/signup" className="text-primary font-bold text-sm hover:underline">
              Sign Up
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
           <Link to="/" className="text-sm font-medium text-gray-400 hover:text-dark transition-colors">
              Return to Home
           </Link>
        </div>
      </div>
    </div>
  );
};


import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "../services/firebase";
import { Utensils, UserPlus, MapPin, Phone, Mail, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useUI } from "../context/UIContext";

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { setLoading, showToast } = useUI();

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return showToast("Passwords do not match", "error");
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      try {
        await setDoc(doc(db, "users", user.uid), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          role: "customer",
        });
        showToast("Account created successfully", "success");
      } catch (firestoreError) {
        handleFirestoreError(firestoreError, OperationType.CREATE, `users/${user.uid}`);
      }

      navigate("/customer");
    } catch (err: any) {
      showToast("Signup failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 py-20">
      <div className="w-full max-w-2xl">
        <div className="bg-white p-10 md:p-12 rounded-2xl shadow-xl border border-gray-100">
          <div className="flex justify-center mb-8">
             <div className="bg-primary p-4 rounded-xl shadow-lg">
                <Utensils size={32} className="text-white" />
             </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-dark tracking-tight">Sign Up</h1>
            <p className="text-sm text-gray-500 mt-2">Create your Queen's Eatery account</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 ml-1 flex items-center gap-2">
                   <User size={14} className="text-primary" /> Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="John Doe"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 ml-1 flex items-center gap-2">
                   <Mail size={14} className="text-primary" /> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@example.com"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 ml-1 flex items-center gap-2">
                   <Phone size={14} className="text-primary" /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="+234 ..."
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 ml-1 flex items-center gap-2">
                   <MapPin size={14} className="text-primary" /> Address
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="Street Address, City"
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 ml-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium pr-12"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600 ml-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium pr-12"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>


            <button
              type="submit"
              className="w-full bg-primary text-white py-4 rounded-xl font-bold text-sm tracking-wide hover:bg-primary-dark transition-all shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] mt-6"
            >
              <UserPlus size={18} /> Sign Up
            </button>
          </form>

          <div className="mt-10 text-center pt-8 border-t border-gray-50">
            <p className="text-sm text-gray-500 mb-2">Already have an account?</p>
            <Link to="/login" className="text-primary font-bold text-sm hover:underline flex items-center justify-center gap-1">
              Login <ArrowRight size={14} />
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


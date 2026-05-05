import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { GlobalOrderNotifier } from "./components/GlobalOrderNotifier";
import { SessionTimeout } from "./components/SessionTimeout";
const Landing = React.lazy(() => import("./pages/Landing").then(m => ({ default: m.Landing })));
const Login = React.lazy(() => import("./pages/Login").then(m => ({ default: m.Login })));
const Signup = React.lazy(() => import("./pages/Signup").then(m => ({ default: m.Signup })));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const CashierPOS = React.lazy(() => import("./pages/cashier/CashierPOS").then(m => ({ default: m.CashierPOS })));
const KitchenScreen = React.lazy(() => import("./pages/kitchen/KitchenScreen").then(m => ({ default: m.KitchenScreen })));
const CustomerDashboard = React.lazy(() => import("./pages/customer/CustomerDashboard").then(m => ({ default: m.CustomerDashboard })));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword").then(m => ({ default: m.ForgotPassword })));
const MenuPage = React.lazy(() => import("./pages/MenuPage").then(m => ({ default: m.MenuPage })));

const LoadingFallback = () => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-light">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-dark font-black tracking-widest text-[10px] uppercase animate-pulse">Loading Palace...</p>
  </div>
);

export default function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <GlobalOrderNotifier />
        <SessionTimeout />
        <Router>
        <React.Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            {/* Cashier Routes */}
            <Route path="/cashier/*" element={
              <ProtectedRoute allowedRoles={["cashier"]}>
                <CashierPOS />
              </ProtectedRoute>
            } />

            {/* Kitchen Routes */}
            <Route path="/kitchen/*" element={
              <ProtectedRoute allowedRoles={["kitchen"]}>
                <KitchenScreen />
              </ProtectedRoute>
            } />

            {/* Customer Routes */}
            <Route path="/customer/*" element={
              <ProtectedRoute allowedRoles={["customer"]}>
                <CustomerDashboard />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </Router>
    </AuthProvider>
    </UIProvider>
  );
}

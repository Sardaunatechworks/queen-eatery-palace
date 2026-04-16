import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { UIProvider } from "./context/UIContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";

// We'll create these placeholder components next
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { CashierPOS } from "./pages/cashier/CashierPOS";
import { KitchenScreen } from "./pages/kitchen/KitchenScreen";
import { CustomerDashboard } from "./pages/customer/CustomerDashboard";
import { ForgotPassword } from "./pages/ForgotPassword";

export default function App() {
  return (
    <UIProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
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
      </Router>
    </AuthProvider>
    </UIProvider>
  );
}

import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Utensils, Clock } from "lucide-react";

// Customer sub-pages
import { CustomerMenu } from "./CustomerMenu";
import { CustomerOrders } from "./CustomerOrders";

const customerNavigation = [
  { name: "Menu", path: "/customer/menu", icon: Utensils },
  { name: "My Orders", path: "/customer/orders", icon: Clock },
];

export const CustomerDashboard: React.FC = () => {
  return (
    <DashboardLayout navigation={customerNavigation} title="Dashboard">
      <Routes>
        <Route path="/" element={<Navigate to="/customer/menu" replace />} />
        <Route path="/menu" element={<CustomerMenu />} />
        <Route path="/orders" element={<CustomerOrders />} />
      </Routes>
    </DashboardLayout>
  );
};


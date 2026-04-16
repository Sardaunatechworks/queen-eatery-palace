import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Users, UtensilsCrossed, Package, Receipt, BarChart3, LayoutDashboard } from "lucide-react";

// Admin sub-pages
import { AdminOverview } from "./AdminOverview";
import { UsersManagement } from "./UsersManagement";
import { MenuManagement } from "./MenuManagement";
import { InventoryManagement } from "./InventoryManagement";
import { OrdersView } from "./OrdersView";
import { Reports } from "./Reports";

const adminNavigation = [
  { name: "Overview", path: "/admin/overview", icon: LayoutDashboard },
  { name: "Users", path: "/admin/users", icon: Users },
  { name: "Menu", path: "/admin/menu", icon: UtensilsCrossed },
  { name: "Inventory", path: "/admin/inventory", icon: Package },
  { name: "Orders", path: "/admin/orders", icon: Receipt },
  { name: "Reports", path: "/admin/reports", icon: BarChart3 },
];

export const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout navigation={adminNavigation} title="Admin Portal">
      <Routes>
        <Route path="/" element={<Navigate to="/admin/overview" replace />} />
        <Route path="/overview" element={<AdminOverview />} />
        <Route path="/users" element={<UsersManagement />} />
        <Route path="/menu" element={<MenuManagement />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/orders" element={<OrdersView />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </DashboardLayout>
  );
};

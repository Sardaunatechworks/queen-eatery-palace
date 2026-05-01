import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Users, UtensilsCrossed, Package, Receipt, BarChart3, LayoutDashboard, FileText } from "lucide-react";

// Admin sub-pages
import { AdminOverview } from "./AdminOverview";
import { StaffManagement } from "./StaffManagement";
import { MenuManagement } from "./MenuManagement";
import { InventoryManagement } from "./InventoryManagement";
import { OrdersView } from "./OrdersView";
import { Reports } from "./Reports";
import { CMSManagement } from "./CMSManagement";

const adminNavigation = [
  { name: "Overview", path: "/admin/overview", icon: LayoutDashboard },
  { name: "Staff Management", path: "/admin/staff", icon: Users },
  { name: "Menu", path: "/admin/menu", icon: UtensilsCrossed },
  { name: "Inventory", path: "/admin/inventory", icon: Package },
  { name: "Orders", path: "/admin/orders", icon: Receipt },
  { name: "Reports", path: "/admin/reports", icon: BarChart3 },
  { name: "CMS Management", path: "/admin/cms", icon: FileText },
];

export const AdminDashboard: React.FC = () => {
  return (
    <DashboardLayout navigation={adminNavigation} title="Admin Portal">
      <Routes>
        <Route path="/" element={<Navigate to="/admin/overview" replace />} />
        <Route path="/overview" element={<AdminOverview />} />
        <Route path="/staff" element={<StaffManagement />} />
        <Route path="/menu" element={<MenuManagement />} />
        <Route path="/inventory" element={<InventoryManagement />} />
        <Route path="/orders" element={<OrdersView />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/cms" element={<CMSManagement />} />
      </Routes>
    </DashboardLayout>
  );
};

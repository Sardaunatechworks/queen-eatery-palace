import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { Calculator, Receipt } from "lucide-react";

// Cashier sub-pages
import { CashierTerminal } from "./CashierTerminal";
import { CashierTransactions } from "./CashierTransactions";

const cashierNavigation = [
  { name: "POS Terminal", path: "/cashier/terminal", icon: Calculator },
  { name: "Transactions", path: "/cashier/transactions", icon: Receipt },
];

export const CashierPOS: React.FC = () => {
  return (
    <DashboardLayout navigation={cashierNavigation} title="Cashier Portal">
      <Routes>
        <Route path="/" element={<Navigate to="terminal" replace />} />
        <Route path="/terminal" element={<CashierTerminal />} />
        <Route path="/transactions" element={<CashierTransactions />} />
      </Routes>
    </DashboardLayout>
  );
};

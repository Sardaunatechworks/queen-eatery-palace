import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Menu as MenuIcon, X, Utensils } from "lucide-react";
import { cn } from "../utils/cn";

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  navigation: SidebarItem[];
  title: string;
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ navigation, title, children }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { pathname } = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="px-6 py-8 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="text-primary" size={20} />
              <span className="text-sm font-bold tracking-tight text-dark uppercase">Queen's Eatery</span>
            </div>
            <button className="md:hidden text-gray-400 hover:text-dark" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>
          
          <div className="flex-1 px-4 py-6 overflow-y-auto">
            <div className="mb-8 px-4 py-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Signed in as</p>
              <p className="font-bold text-dark truncate text-sm">{profile?.name || 'User'}</p>
              <p className="text-[10px] text-primary capitalize mt-0.5">
                {profile?.role}
              </p>
            </div>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium",
                      isActive 
                        ? "bg-primary/5 text-primary" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-dark"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon size={18} className={isActive ? "text-primary" : "text-gray-400"} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 mt-auto border-t border-gray-100">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all text-sm font-medium"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <MenuIcon size={20} />
            </button>
            <h1 className="text-lg font-bold text-dark tracking-tight">
              {navigation.find(n => pathname.startsWith(n.path))?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden sm:block text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
             </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};


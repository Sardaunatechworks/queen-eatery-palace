import React from "react";
import { Link } from "react-router-dom";
import { Utensils, ArrowRight, ShieldCheck, Star } from "lucide-react";

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white border-b border-gray-100 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg">
             <Utensils className="text-white" size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight text-dark">QUEEN'S EATERY</span>
        </div>
        
        <nav className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">
            Login
          </Link>
          <Link 
            to="/signup" 
            className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          >
            Sign Up
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col pt-20">
        <section className="px-8 py-20 lg:py-32">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                <Star size={14} fill="currentColor" /> Welcome to Queen's Eatery
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold text-dark leading-tight tracking-tight">
                Modern Dining <br/>
                <span className="text-primary">Management</span> <br/>
                Simplified.
              </h1>
              
              <p className="text-lg text-gray-500 max-w-xl leading-relaxed">
                Experience a clean and professional dining service. Manage orders, inventory, and customer relationships with ease.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link 
                  to="/signup" 
                  className="bg-primary text-white px-8 py-4 rounded-xl font-semibold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
                >
                  Get Started <ArrowRight size={18} />
                </Link>
                <div className="flex items-center gap-4 px-6 text-xs font-medium text-gray-400">
                  <ShieldCheck size={20} className="text-primary" />
                  Fast & Secure POS System
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                <img 
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop" 
                  alt="Modern Restaurant" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Simple Feature Card */}
              <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Utensils size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-dark text-sm">Dashboard</p>
                    <p className="text-xs text-gray-400">Real-time stats</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-8 py-12 border-t border-gray-100 bg-white mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Utensils className="text-primary" size={20} />
            <span className="text-sm font-bold tracking-tight text-dark uppercase">Queen's Eatery</span>
          </div>
          
          <div className="flex gap-8 text-sm font-medium text-gray-400">
            <a href="#" className="hover:text-primary transition-colors">Home</a>
            <a href="#" className="hover:text-primary transition-colors">About</a>
            <a href="#" className="hover:text-primary transition-colors">Features</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>

          <p className="text-xs text-gray-300">
            &copy; {new Date().getFullYear()} Queen's Eatery. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};


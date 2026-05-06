import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Utensils, ArrowRight, MapPin, Phone, MessageSquare, Calendar, Menu, X, Loader2 } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "../utils/cn";
import { getCMSContent, CMSData } from "../services/cmsService";

export const Landing: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [cmsData, setCmsData] = useState<CMSData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    const fetchCms = async () => {
      try {
        const data = await getCMSContent();
        setCmsData(data);
      } catch (error) {
        console.error("Failed to load CMS content:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCms();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleWhatsApp = () => {
    const phone = cmsData?.contact.phone.replace(/[^0-9]/g, '') || "2349155290102";
    window.open(`https://wa.me/${phone}`, "_blank");
  };

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "Menu", href: "/menu", isLink: true },
    { name: "Services", href: "#services" },
    { name: "Event Hall", href: "#event-hall" },
    { name: "Contact", href: "#contact" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
      </div>
    );
  }

  // Fallback if somehow CMS data is completely missing and defaults failed
  if (!cmsData) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900 overflow-x-hidden">
      {/* Header */}
      <header className={cn(
        "fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center transition-all duration-300",
        scrolled ? "bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm" : "bg-transparent"
      )}>
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-1.5 rounded-lg">
             <Utensils className="text-white" size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight uppercase">Queen Eatery Palace & Event Hall</span>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            link.isLink ? (
              <Link key={link.name} to={link.href} className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-red-600 transition-colors">
                {link.name}
              </Link>
            ) : (
              <a key={link.name} href={link.href} className="text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-red-600 transition-colors">
                {link.name}
              </a>
            )
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden sm:block text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-red-600 transition-colors">
            Login
          </Link>
          <Link to="/menu" className="hidden sm:block bg-red-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition-all shadow-md active:scale-95">
            Order Now
          </Link>
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-red-600 transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      <div className={cn(
        "fixed inset-0 z-[60] bg-white transform transition-transform duration-500 ease-in-out lg:hidden",
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full p-8 pt-24 space-y-8">
          {navLinks.map((link) => (
            link.isLink ? (
              <Link 
                key={link.name} 
                to={link.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4"
              >
                {link.name}
              </Link>
            ) : (
              <a 
                key={link.name} 
                href={link.href} 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-2xl font-bold text-gray-900 border-b border-gray-100 pb-4"
              >
                {link.name}
              </a>
            )
          ))}
          <div className="pt-8 flex flex-col gap-4">
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="bg-gray-100 text-dark py-4 rounded-xl text-center font-bold uppercase tracking-widest text-sm">
              Login
            </Link>
            <Link to="/menu" onClick={() => setIsMobileMenuOpen(false)} className="bg-red-600 text-white py-4 rounded-xl text-center font-bold uppercase tracking-widest text-sm shadow-lg shadow-red-200">
              Order Now
            </Link>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-dark transition-colors"
          >
            <X size={28} />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative min-h-[90vh] flex items-center px-6 md:px-12 bg-white pt-20">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left animate-in fade-in slide-in-from-left-8 duration-700">
              <h1 className="text-5xl md:text-6xl xl:text-8xl font-bold text-gray-900 leading-[1.05] tracking-tight whitespace-pre-wrap">
                {cmsData.hero.title}
              </h1>
              <p className="text-lg md:text-xl text-gray-500 max-w-lg mx-auto lg:mx-0 leading-relaxed whitespace-pre-wrap">
                {cmsData.hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/menu" className="bg-red-600 text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95">
                  View Menu
                </Link>
                <button onClick={handleWhatsApp} className="border border-gray-200 text-gray-600 px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-gray-50 transition-all active:scale-95">
                  Contact Us
                </button>
              </div>
            </div>
            <div className="relative animate-in fade-in scale-95 duration-1000 delay-200">
              <div className="rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-gray-50 aspect-square sm:aspect-video lg:aspect-square">
                <img 
                  src={cmsData.hero.imageUrl} 
                  alt="Dining" 
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-gray-50 hidden sm:flex items-center gap-4">
                 <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                 <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Ready to Serve You</span>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 px-6 md:px-12 bg-gray-50/50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {cmsData.about.imageUrl && (
              <div className="rounded-3xl overflow-hidden shadow-lg border border-gray-100 order-2 lg:order-1 aspect-square lg:aspect-auto h-full max-h-[500px]">
                <img 
                  src={cmsData.about.imageUrl} 
                  alt="About Us" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className={cn("space-y-6 text-center lg:text-left", cmsData.about.imageUrl ? "order-1 lg:order-2" : "col-span-1 lg:col-span-2 max-w-4xl mx-auto text-center")}>
              <span className="text-red-500 font-bold uppercase tracking-[0.3em] text-[10px]">Backyard tradition</span>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">About Queen Eatery</h2>
              <p className="text-gray-500 leading-relaxed text-lg md:text-xl whitespace-pre-wrap">
                {cmsData.about.text}
              </p>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-24 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {cmsData.services.map((service) => {
              // Dynamically get icon component from Lucide
              const IconComponent = (Icons as any)[service.icon] || Icons.HelpCircle;
              
              return (
                <div key={service.id} className="p-10 bg-white border border-gray-100 rounded-[2rem] space-y-6 hover:border-red-600 transition-all duration-300 shadow-sm hover:shadow-xl group">
                  <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                    <IconComponent size={32} />
                  </div>
                  <h3 className="text-2xl font-bold">{service.title}</h3>
                  <p className="text-gray-500 leading-relaxed whitespace-pre-wrap">{service.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Event Hall Section */}
        <section id="event-hall" className="py-24 px-6 md:px-12 bg-gray-900 text-white overflow-hidden relative">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <h2 className="text-xs font-bold uppercase tracking-[0.4em] text-red-500">Venue Hire</h2>
              <h3 className="text-5xl md:text-6xl font-bold leading-tight">Host Your Events.</h3>
              <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-xl mx-auto lg:mx-0 whitespace-pre-wrap">
                {cmsData.eventHall.description}
              </p>
              <button 
                onClick={handleWhatsApp}
                className="bg-red-600 text-white px-10 py-5 rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-white hover:text-red-700 transition-all flex items-center gap-3 w-fit mx-auto lg:mx-0 shadow-2xl shadow-red-500/20"
              >
                Reserve Date
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="space-y-4">
                <img src={cmsData.eventHall.imageUrls[0] || "https://placehold.co/600x400"} className="rounded-3xl h-64 sm:h-80 w-full object-cover" alt="Event Hall 1" />
                <div className="h-32 bg-red-600 rounded-3xl" />
              </div>
              <div className="space-y-4 pt-12">
                <div className="h-32 bg-gray-800 rounded-3xl" />
                <img src={cmsData.eventHall.imageUrls[1] || "https://placehold.co/600x400"} className="rounded-3xl h-64 sm:h-80 w-full object-cover" alt="Event Hall 2" />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Footer */}
        <footer id="contact" className="py-24 px-6 md:px-12 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center md:text-left">
            <div className="space-y-6">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <div className="bg-red-600 p-1.5 rounded-lg">
                   <Utensils className="text-white" size={18} />
                </div>
                <span className="font-bold text-lg tracking-tight uppercase">Queen Eatery</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">The finest dining experience and event center in the heart of Dutse.</p>
            </div>
            
            <div className="space-y-6">
               <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Our Space</h4>
               <div className="flex items-start justify-center md:justify-start gap-4">
                  <MapPin size={20} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-500 font-medium whitespace-pre-wrap">
                    {cmsData.contact.address}
                  </p>
               </div>
            </div>

            <div className="space-y-6">
               <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Communication</h4>
               <div className="flex flex-col items-center md:items-start gap-4">
                 <div className="flex items-center gap-4">
                   <Phone size={20} className="text-red-600 shrink-0" />
                   <p className="text-sm text-gray-500 font-medium">{cmsData.contact.phone}</p>
                 </div>
                 <button onClick={handleWhatsApp} className="flex items-center gap-3 text-red-600 font-bold text-sm uppercase tracking-wider hover:opacity-80 transition-opacity">
                    <MessageSquare size={20} />
                    <span>WhatsApp Live Chat</span>
                 </button>
               </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Menu Access</h4>
              <Link to="/menu" className="block w-full py-4 px-6 border-2 border-gray-100 rounded-xl text-sm font-bold uppercase tracking-widest text-center hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-300">
                Browse Collection
              </Link>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-gray-50 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">
              &copy; {new Date().getFullYear()} Queen Eatery Palace and Event Hall. Fully Optimized.
            </p>
          </div>
        </footer>
      </main>

      {/* Floating Action WhatsApp */}
      <button 
        onClick={handleWhatsApp}
        className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all animate-in fade-in zoom-in duration-500 shadow-green-200"
      >
        <MessageSquare size={24} fill="currentColor" />
      </button>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { 
  Save, 
  Image as ImageIcon, 
  Layout, 
  Phone, 
  Info, 
  Calendar,
  Loader2
} from "lucide-react";
import { getCMSContent, updateCMSContent, uploadCMSImage, CMSData } from "../../services/cmsService";
import { useUI } from "../../context/UIContext";

export const CMSManagement: React.FC = () => {
  const { showToast } = useUI();
  const [cmsData, setCmsData] = useState<CMSData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");

  useEffect(() => {
    const fetchCMS = async () => {
      try {
        const data = await getCMSContent();
        setCmsData(data);
      } catch (error) {
        showToast("Failed to load CMS content", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCMS();
  }, [showToast]);

  const handleSave = async () => {
    if (!cmsData) return;
    setIsSaving(true);
    try {
      await updateCMSContent(cmsData);
      showToast("Content updated successfully", "success");
    } catch (error) {
      showToast("Failed to update content", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, path: string, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Toast doesn't support loading state in useUI apparently, just show info
    showToast("Uploading image...", "info");
    try {
      const url = await uploadCMSImage(file, path);
      callback(url);
      showToast("Image uploaded", "success");
    } catch (error) {
      showToast("Upload failed", "error");
    }
  };


  const tabs = [
    { id: "hero", label: "Hero Section", icon: Layout },
    { id: "about", label: "About Section", icon: Info },
    { id: "services", label: "Services", icon: Layout },
    { id: "event-hall", label: "Event Hall", icon: Calendar },
    { id: "contact", label: "Contact", icon: Phone },
  ];

  if (isLoading || !cmsData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-red-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CMS Management</h2>
          <p className="text-gray-500">Manage your landing page content dynamically</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          Save All Changes
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-white text-red-600 shadow-sm border border-gray-100"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8">
          
          {/* HERO SECTION */}
          {activeTab === "hero" && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-xl font-bold border-b pb-4">Hero Settings</h3>
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title (Use \n for line break)</label>
                  <textarea
                    value={cmsData.hero.title}
                    onChange={(e) => setCmsData({ ...cmsData, hero: { ...cmsData.hero, title: e.target.value } })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                  <textarea
                    value={cmsData.hero.subtitle}
                    onChange={(e) => setCmsData({ ...cmsData, hero: { ...cmsData.hero, subtitle: e.target.value } })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
                  <div className="flex gap-6 items-start">
                    <img src={cmsData.hero.imageUrl} alt="Hero" className="w-48 h-32 object-cover rounded-xl border border-gray-200" />
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <ImageIcon size={16} />
                        Upload New Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, 'hero', (url) => setCmsData({ ...cmsData, hero: { ...cmsData.hero, imageUrl: url } }))}
                        />
                      </label>
                      <p className="text-xs text-gray-500">Recommended size: 1920x1080px</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABOUT SECTION */}
          {activeTab === "about" && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-xl font-bold border-b pb-4">About Settings</h3>
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">About Text</label>
                  <textarea
                    value={cmsData.about.text}
                    onChange={(e) => setCmsData({ ...cmsData, about: { ...cmsData.about, text: e.target.value } })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    rows={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">About Image</label>
                  <div className="flex gap-6 items-start">
                    {cmsData.about.imageUrl ? (
                      <img src={cmsData.about.imageUrl} alt="About" className="w-48 h-48 object-cover rounded-xl border border-gray-200" />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <ImageIcon size={16} />
                        Upload Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e, 'about', (url) => setCmsData({ ...cmsData, about: { ...cmsData.about, imageUrl: url } }))}
                        />
                      </label>
                      <p className="text-xs text-gray-500">Recommended size: 800x800px</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SERVICES SECTION */}
          {activeTab === "services" && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-xl font-bold border-b pb-4">Services Settings</h3>
              <div className="space-y-8">
                {cmsData.services.map((service, index) => (
                  <div key={service.id} className="p-6 border border-gray-100 rounded-2xl bg-gray-50/50">
                    <h4 className="font-bold mb-4 flex items-center gap-2">
                      <Layout size={18} className="text-red-500" />
                      Service {index + 1}
                    </h4>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                          <input
                            type="text"
                            value={service.title}
                            onChange={(e) => {
                              const newServices = [...cmsData.services];
                              newServices[index].title = e.target.value;
                              setCmsData({ ...cmsData, services: newServices });
                            }}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Icon Name (Lucide)</label>
                          <input
                            type="text"
                            value={service.icon}
                            onChange={(e) => {
                              const newServices = [...cmsData.services];
                              newServices[index].icon = e.target.value;
                              setCmsData({ ...cmsData, services: newServices });
                            }}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={service.description}
                          onChange={(e) => {
                            const newServices = [...cmsData.services];
                            newServices[index].description = e.target.value;
                            setCmsData({ ...cmsData, services: newServices });
                          }}
                          className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EVENT HALL SECTION */}
          {activeTab === "event-hall" && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-xl font-bold border-b pb-4">Event Hall Settings</h3>
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={cmsData.eventHall.description}
                    onChange={(e) => setCmsData({ ...cmsData, eventHall: { ...cmsData.eventHall, description: e.target.value } })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">Event Hall Images (Requires 2 images)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[0, 1].map((index) => (
                      <div key={index} className="space-y-3">
                        <img 
                          src={cmsData.eventHall.imageUrls[index] || "https://placehold.co/600x400?text=No+Image"} 
                          alt={`Event Hall ${index + 1}`} 
                          className="w-full h-48 object-cover rounded-xl border border-gray-200" 
                        />
                        <label className="flex justify-center items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          <ImageIcon size={16} />
                          Upload Image {index + 1}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleImageUpload(e, 'event', (url) => {
                              const newUrls = [...cmsData.eventHall.imageUrls];
                              newUrls[index] = url;
                              setCmsData({ ...cmsData, eventHall: { ...cmsData.eventHall, imageUrls: newUrls } });
                            })}
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT SECTION */}
          {activeTab === "contact" && (
            <div className="space-y-6 animate-in fade-in">
              <h3 className="text-xl font-bold border-b pb-4">Contact Settings</h3>
              <div className="grid gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={cmsData.contact.phone}
                    onChange={(e) => setCmsData({ ...cmsData, contact: { ...cmsData.contact, phone: e.target.value } })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address (Use \n for line break)</label>
                  <textarea
                    value={cmsData.contact.address}
                    onChange={(e) => setCmsData({ ...cmsData, contact: { ...cmsData.contact, address: e.target.value } })}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

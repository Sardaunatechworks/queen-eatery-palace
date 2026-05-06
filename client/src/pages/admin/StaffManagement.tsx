import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, Timestamp, deleteDoc } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useUI } from "../../context/UIContext";
import { User, ShieldAlert, ShieldCheck, Ban, Clock, Search, X, CheckCircle, Plus, Trash2, Users, UserPlus } from "lucide-react";
import { cn } from "../../utils/cn";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'suspended';
  suspensionReason?: string;
  suspensionEndDate?: any;
}

export const StaffManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"staff" | "customers">("staff");
  
  const [showSuspendModal, setShowSuspendModal] = useState<UserProfile | null>(null);
  const [suspensionData, setSuspensionData] = useState({ reason: "", duration: "1" });
  
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaffData, setNewStaffData] = useState({ name: "", email: "", password: "", role: "cashier" });
  
  const { showToast, setLoading: setGlobalLoading } = useUI();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(allUsers);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const staff = users.filter(u => u.role !== 'customer');
  const customers = users.filter(u => u.role === 'customer');

  const currentList = activeTab === "staff" ? staff : customers;

  const filteredUsers = currentList.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5050";

    try {
      const response = await fetch(`${apiUrl}/api/users/create-staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStaffData),
      });

      const result = await response.json();

      if (result.success) {
        showToast("Staff member added successfully", "success");
        setShowAddStaffModal(false);
        setNewStaffData({ name: "", email: "", password: "", role: "cashier" });
      } else {
        showToast(result.message || "Failed to add staff", "error");
      }
    } catch (error) {
      showToast("Network error while adding staff", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}? This cannot be undone.`)) return;
    
    setGlobalLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5050";

    try {
      const response = await fetch(`${apiUrl}/api/users/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        showToast("User deleted successfully", "success");
      } else {
        showToast(result.message || "Failed to delete user", "error");
      }
    } catch (error) {
      showToast("Network error while deleting user", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!showSuspendModal) return;
    
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(suspensionData.duration));
      
      await updateDoc(doc(db, "users", showSuspendModal.id), {
        status: 'suspended',
        suspensionReason: suspensionData.reason,
        suspensionEndDate: Timestamp.fromDate(endDate)
      });
      
      showToast(`Staff ${showSuspendModal.name} suspended.`, "success");
      setShowSuspendModal(null);
      setSuspensionData({ reason: "", duration: "1" });
    } catch (error) {
      showToast("Failed to suspend staff", "error");
    }
  };

  const handleLiftSuspension = async (id: string, name: string) => {
    try {
      await updateDoc(doc(db, "users", id), {
        status: 'active',
        suspensionReason: null,
        suspensionEndDate: null
      });
      showToast(`Suspension lifted for ${name}.`, "success");
    } catch (error) {
      showToast("Failed to lift suspension", "error");
    }
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-dark tracking-tighter">USER MANAGEMENT</h2>
          <p className="text-sm text-gray-500 font-medium">Manage access and restrictions for eatery personnel.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button 
               onClick={() => setActiveTab("staff")}
               className={cn(
                 "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                 activeTab === "staff" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
             >
               <User size={14} /> Staff ({staff.length})
             </button>
             <button 
               onClick={() => setActiveTab("customers")}
               className={cn(
                 "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                 activeTab === "customers" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
               )}
             >
               <Users size={14} /> Customers ({customers.length})
             </button>
          </div>
          
          {activeTab === "staff" && (
            <button 
              onClick={() => setShowAddStaffModal(true)}
              className="bg-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <UserPlus size={16} /> Add Staff
            </button>
          )}
        </div>
      </div>

      <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
         <input 
           type="text" 
           placeholder={`Search ${activeTab}...`} 
           className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 transition-all text-sm font-bold"
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-100">
                  <th className="px-8 py-5">Profile</th>
                  <th className="px-8 py-5">Role</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5">History/Info</th>
                  <th className="px-8 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-lg border border-primary/10 shadow-sm">
                            {user.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-dark text-base leading-none mb-1.5 uppercase tracking-tight">{user.name}</p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{user.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className={cn(
                         "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                         user.role === 'admin' ? "bg-dark text-white border-dark" : "bg-gray-100 text-gray-500 border-gray-200"
                       )}>
                          {user.role}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       <span className={cn(
                         "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm",
                         user.status === 'suspended' ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"
                       )}>
                         <div className={cn("w-2 h-2 rounded-full", user.status === 'suspended' ? "bg-red-600" : "bg-green-600")} />
                         {user.status || 'active'}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       {user.status === 'suspended' ? (
                         <div className="space-y-1.5">
                            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest flex items-center gap-2">
                               <ShieldAlert size={12} /> {user.suspensionReason}
                            </p>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.1em] flex items-center gap-1.5">
                               <Clock size={12} /> Until {user.suspensionEndDate?.toDate ? format(user.suspensionEndDate.toDate(), "MMM dd, yyyy") : "Forever"}
                            </p>
                         </div>
                       ) : (
                         <span className="text-[10px] text-gray-300 font-black uppercase tracking-[0.2em]">Verified Account</span>
                       )}
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center justify-center gap-3">
                          {activeTab === "staff" && (
                            <>
                              {user.status === 'suspended' ? (
                                <button 
                                  onClick={() => handleLiftSuspension(user.id, user.name)}
                                  className="bg-green-500 text-white p-2.5 rounded-xl hover:bg-green-600 transition-all shadow-md active:scale-95"
                                  title="Lift Suspension"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setShowSuspendModal(user)}
                                  className="bg-amber-500 text-white p-2.5 rounded-xl hover:bg-amber-600 transition-all shadow-md active:scale-95"
                                  title="Suspend Staff"
                                >
                                  <Ban size={18} />
                                </button>
                              )}
                            </>
                          )}
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="bg-red-50 text-red-400 p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95 border border-red-100"
                            title="Delete User"
                          >
                            <Trash2 size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
         </div>
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative animate-in zoom-in duration-300">
             <button onClick={() => setShowAddStaffModal(false)} className="absolute top-8 right-8 text-gray-400 hover:text-dark transition-colors">
                <X size={24} />
             </button>
             
             <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-8 ring-primary/5">
                   <UserPlus size={40} />
                </div>
                <h3 className="text-3xl font-black text-dark tracking-tighter uppercase">Add Staff</h3>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">Create new system personnel</p>
             </div>

             <form onSubmit={handleAddStaff} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. John Doe"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold shadow-sm"
                      value={newStaffData.name}
                      onChange={(e) => setNewStaffData({...newStaffData, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      placeholder="staff@queeneatery.com"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold shadow-sm"
                      value={newStaffData.email}
                      onChange={(e) => setNewStaffData({...newStaffData, email: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Initial Password</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold shadow-sm"
                      value={newStaffData.password}
                      onChange={(e) => setNewStaffData({...newStaffData, password: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">System Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      {["cashier", "kitchen"].map(r => (
                        <button 
                          key={r}
                          type="button"
                          onClick={() => setNewStaffData({...newStaffData, role: r})}
                          className={cn(
                            "py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2",
                            newStaffData.role === r ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white text-gray-400 border-gray-50 hover:border-primary/20"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-dark text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-2xl active:scale-95 mt-4"
                >
                  Register Staff
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-dark/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative animate-in zoom-in duration-300 border-b-[8px] border-red-500">
             <button onClick={() => setShowSuspendModal(null)} className="absolute top-8 right-8 text-gray-400 hover:text-dark">
                <X size={24} />
             </button>
             
             <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-8 ring-red-50/50">
                   <ShieldAlert size={40} />
                </div>
                <h3 className="text-3xl font-black text-dark tracking-tighter uppercase">SUSPEND STAFF</h3>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">Restrict access for <b>{showSuspendModal.name}</b></p>
             </div>

             <div className="space-y-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Reason for Suspension</label>
                   <textarea 
                     className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-sm font-bold min-h-[120px] resize-none shadow-sm"
                     placeholder="e.g. Policy violation, Unprofessional behavior..."
                     value={suspensionData.reason}
                     onChange={(e) => setSuspensionData({...suspensionData, reason: e.target.value})}
                   />
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Suspension Duration</label>
                   <div className="grid grid-cols-4 gap-2">
                      {["1", "3", "7", "30"].map(d => (
                        <button 
                          key={d}
                          onClick={() => setSuspensionData({...suspensionData, duration: d})}
                          className={cn(
                            "py-4 rounded-xl text-[10px] font-black uppercase transition-all border-2",
                            suspensionData.duration === d ? "bg-red-500 text-white border-red-500 shadow-xl shadow-red-200" : "bg-white text-gray-400 border-gray-50 hover:border-red-200"
                          )}
                        >
                          {d}D
                        </button>
                      ))}
                   </div>
                </div>

                <button 
                  onClick={handleSuspend}
                  disabled={!suspensionData.reason}
                  className="w-full bg-red-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-dark transition-all shadow-2xl shadow-red-200 active:scale-95 disabled:opacity-50 mt-4"
                >
                  Finalize Restriction
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

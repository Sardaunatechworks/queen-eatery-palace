import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { useUI } from "../../context/UIContext";
import { User, ShieldAlert, ShieldCheck, Ban, Clock, Search, X, CheckCircle } from "lucide-react";
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
  const [showSuspendModal, setShowSuspendModal] = useState<UserProfile | null>(null);
  const [suspensionData, setSuspensionData] = useState({ reason: "", duration: "1" });
  
  const { showToast } = useUI();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const staff = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as UserProfile))
        .filter(u => u.role !== 'customer');
      setUsers(staff);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-dark tracking-tight">Staff Management</h2>
          <p className="text-sm text-gray-500">Manage access and restrictions for eatery personnel.</p>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
           <input 
             type="text" 
             placeholder="Search staff..." 
             className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 transition-all text-sm"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                  <th className="px-6 py-4">Staff Member</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Suspension Info</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/20 transition-colors">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black">
                            {user.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-dark text-sm leading-none mb-1">{user.name}</p>
                            <p className="text-xs text-gray-400 font-medium">{user.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                          {user.role}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <span className={cn(
                         "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter",
                         user.status === 'suspended' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                       )}>
                         {user.status === 'suspended' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                         {user.status || 'active'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       {user.status === 'suspended' ? (
                         <div className="space-y-1">
                            <p className="text-xs text-red-500 font-bold line-clamp-1 italic">"{user.suspensionReason}"</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                               <Clock size={10} /> Until {user.suspensionEndDate?.toDate ? format(user.suspensionEndDate.toDate(), "MMM dd, yyyy") : "Forever"}
                            </p>
                         </div>
                       ) : (
                         <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">No violations</span>
                       )}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center justify-center gap-2">
                          {user.status === 'suspended' ? (
                            <button 
                              onClick={() => handleLiftSuspension(user.id, user.name)}
                              className="bg-green-500 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all flex items-center gap-2"
                            >
                              <CheckCircle size={14} /> Lift Access
                            </button>
                          ) : (
                            <button 
                              onClick={() => setShowSuspendModal(user)}
                              className="bg-white border-2 border-red-100 text-red-500 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2"
                            >
                              <Ban size={14} /> Suspend
                            </button>
                          )}
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
         </div>
      </div>

      {showSuspendModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl relative animate-in zoom-in duration-300">
             <button onClick={() => setShowSuspendModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-dark">
                <X size={20} />
             </button>
             
             <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-4">
                   <ShieldAlert size={32} />
                </div>
                <h3 className="text-xl font-black text-dark tracking-tighter">SUSPEND STAFF</h3>
                <p className="text-sm text-gray-400 font-medium mt-1">Restrict access for <b>{showSuspendModal.name}</b></p>
             </div>

             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Reason for Suspension</label>
                   <textarea 
                     className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-sm font-bold min-h-[100px] resize-none"
                     placeholder="e.g. Policy violation, Unprofessional behavior..."
                     value={suspensionData.reason}
                     onChange={(e) => setSuspensionData({...suspensionData, reason: e.target.value})}
                   />
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Duration (Days)</label>
                   <div className="grid grid-cols-4 gap-2">
                      {["1", "3", "7", "30"].map(d => (
                        <button 
                          key={d}
                          onClick={() => setSuspensionData({...suspensionData, duration: d})}
                          className={cn(
                            "py-3 rounded-xl text-xs font-black transition-all border-2",
                            suspensionData.duration === d ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-200" : "bg-white text-gray-400 border-gray-100 hover:border-red-200"
                          )}
                        >
                          {d}d
                        </button>
                      ))}
                   </div>
                </div>

                <button 
                  onClick={handleSuspend}
                  disabled={!suspensionData.reason}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-dark transition-all shadow-xl shadow-red-200 active:scale-95 disabled:opacity-50 mt-4"
                >
                  Confirm Suspension
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

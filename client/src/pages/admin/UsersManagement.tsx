import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, handleFirestoreError, OperationType } from "../../services/firebase";
import { UserProfile, UserRole } from "../../context/AuthContext";
import { useUI } from "../../context/UIContext";
import { Plus, Trash2, Search, Filter, Users, X, Mail, Phone, ShieldCheck, Shield, User as UserIcon } from "lucide-react";
import firebaseConfig from "../../../firebase-applet-config.json";
import { cn } from "../../utils/cn";

// Safe initialization for the secondary app to prevent "duplicate-app" errors in HMR
const secondaryApp = getApps().find(a => a.name === "SecondaryApp") 
  || initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

export const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "cashier", password: "" });
  
  const { setLoading: setGlobalLoading, showToast } = useUI();

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersData);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.LIST, "users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (user.isDeleted) return false;
      
      const userName = user.name?.toLowerCase() || "";
      const userEmail = user.email?.toLowerCase() || "";
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch = userName.includes(searchLower) || userEmail.includes(searchLower);
      const matchesRole = roleFilter === "All" || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
      });
      
      await signOut(secondaryAuth);
      
      setShowModal(false);
      setFormData({ name: "", email: "", phone: "", role: "cashier", password: "" });
      fetchUsers();
      showToast("User added successfully", "success");
    } catch (error: any) {
      showToast(error.message || "Failed to add user", "error");
    } finally {
      setGlobalLoading(false);
    }
  };


  const toggleUserStatus = async (user: UserProfile) => {
    if (user.role === 'admin') {
      showToast("Admin accounts cannot be disabled", "error");
      return;
    }
    
    setGlobalLoading(true);
    try {
      const newStatus = !user.isDisabled;
      await setDoc(doc(db, "users", user.uid), { isDisabled: newStatus }, { merge: true });
      showToast(`User ${newStatus ? 'disabled' : 'enabled'} successfully`, "success");
      fetchUsers();
    } catch (error: any) {
      showToast("Failed to update user status", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.role === 'admin') {
      showToast("Admin accounts cannot be deleted", "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to permanentely delete ${user.name}? This action cannot be undone.`)) return;

    setGlobalLoading(true);
    try {
      // Note: This only deletes from Firestore. 
      // To delete from Firebase Auth, a cloud function or admin SDK on backend is needed.
      // But clearing Firestore record effectively removes them from our system.
      await setDoc(doc(db, "users", user.uid), { isDeleted: true }, { merge: true });
      showToast("User record marked as deleted", "success");
      fetchUsers();
    } catch (error: any) {
      showToast("Failed to delete user", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const updateUserRole = async (uid: string, newRole: UserRole) => {
    setGlobalLoading(true);
    try {
      await setDoc(doc(db, "users", uid), { role: newRole }, { merge: true });
      showToast("Role updated successfully", "success");
      fetchUsers();
    } catch (error: any) {
      showToast("Failed to update role", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldCheck size={14} />;
      case 'kitchen': return <Shield size={14} />;
      case 'cashier': return <Shield size={14} />;
      default: return <UserIcon size={14} />;
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
          <h2 className="text-xl font-bold text-dark tracking-tight">Users</h2>
          <p className="text-sm text-gray-500">Manage your system users and staff.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-dark transition-colors shadow-sm font-semibold text-sm"
        >
          <Plus size={18} /> Add User
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search users..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <select 
            className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm appearance-none min-w-[140px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
            <option value="kitchen">Kitchen</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Mobile User Cards */}
        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center opacity-50">
              <Users className="mx-auto mb-2 text-gray-300" size={32} />
              <p className="text-sm font-bold text-gray-400">No users found</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.uid} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {user.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-dark text-sm">{user.name || "Unnamed"}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <button className="p-2 text-gray-300 hover:text-red-500">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail size={14} className="text-gray-400" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone size={14} className="text-gray-400" />
                    {user.phone || "No phone"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop User Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Account Information</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="text-gray-200 mb-2" size={40} />
                      <p className="font-semibold text-gray-400">No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.uid} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {user.name?.charAt(0) || '?'}
                        </div>
                        <span className="font-semibold text-dark text-sm">{user.name || "Unnamed User"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={12} className="text-gray-400" />
                          {user.email || "No email"}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Phone size={10} className="text-gray-300" />
                          {user.phone || "No contact"}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select 
                          value={user.role} 
                          onChange={(e) => updateUserRole(user.uid, e.target.value as UserRole)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-tight border outline-none cursor-pointer transition-all ${
                            user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                            user.role === 'kitchen' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            user.role === 'cashier' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            'bg-green-50 text-green-700 border-green-100'
                          }`}
                        >
                          <option value="admin">Admin</option>
                          <option value="cashier">Cashier</option>
                          <option value="kitchen">Kitchen</option>
                          <option value="customer">Customer</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <button 
                         onClick={() => toggleUserStatus(user)}
                         className={cn(
                           "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                           user.isDisabled 
                            ? "bg-red-50 text-primary border border-primary/20" 
                            : "bg-green-50 text-green-600 border border-green-200"
                         )}
                       >
                         {user.isDisabled ? "Disabled" : "Active"}
                       </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDeleteUser(user)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-dark hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-6 text-dark tracking-tight">Add New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Full Name</label>
                <input type="text" placeholder="John Doe" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm" onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Email Address</label>
                <input type="email" placeholder="john@example.com" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm" onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Phone Number</label>
                <input type="tel" placeholder="+234 ..." required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm" onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Role</label>
                <select className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm appearance-none" onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="cashier">Cashier</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-1.5 ml-1">Password</label>
                <input type="password" placeholder="••••••••" required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm" onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-lg font-bold text-sm hover:bg-primary-dark transition-all shadow-sm">Add User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


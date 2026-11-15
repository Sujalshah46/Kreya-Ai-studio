import React, { useState } from 'react';
import { 
  Settings, Users, Building2, ShieldCheck, Printer, Key, 
  Plus, Edit, CheckCircle2, Lock, Smartphone, Mail, X, Save, KeyRound, Image, FileText
} from 'lucide-react';
import { StoreProfile, UserAccount, Counter } from '../../types';

interface ShopSettingsUsersViewProps {
  initialTab?: string;
  store: StoreProfile;
  users: UserAccount[];
  counters: Counter[];
  onUpdateStore?: (store: StoreProfile) => void;
  onAddUser?: (user: UserAccount) => void;
  onUpdateUser?: (user: UserAccount) => void;
}

export const ShopSettingsUsersView: React.FC<ShopSettingsUsersViewProps> = ({
  initialTab = 'profile',
  store: initialStore,
  users: initialUsers,
  counters,
  onUpdateStore,
  onAddUser,
  onUpdateUser
}) => {
  // Tabs matching Frame 6 & 190
  const [activeTab, setActiveTab] = useState<
    'profile' | 'branding' | 'gst' | 'prefixes' | 'users' | 'security'
  >(
    initialTab === 'users' ? 'users' :
    initialTab === 'branding' ? 'branding' :
    initialTab === 'gst' ? 'gst' :
    initialTab === 'prefixes' ? 'prefixes' :
    initialTab === 'security' ? 'security' : 'profile'
  );

  // Form Fields matching S.B Borana Jewellers & Live DB
  const [shopName, setShopName] = useState(initialStore?.tradeName || 'S.B Borana Jewellers');
  const [ownerName, setOwnerName] = useState('Sujal shah');
  const [code, setCode] = useState(initialStore?.code || 'SBJ');
  const [address, setAddress] = useState(initialStore?.address || '3-5 Niwas , Vile parle east Mumbai');
  const [city, setCity] = useState(initialStore?.city || 'Mumbai');
  const [state, setState] = useState('27 - Maharashtra');
  const [pincode, setPincode] = useState(initialStore?.pincode || '400057');
  const [phone, setPhone] = useState(initialStore?.mobile || '9324773823');
  const [email, setEmail] = useState(initialStore?.email || 'admin@jewellery.com');
  const [mobile, setMobile] = useState(initialStore?.mobile || '9324773823');
  const [gstin, setGstin] = useState(initialStore?.gstin || '27ACZPJ7126B1ZA');
  const [panNumber, setPanNumber] = useState('ACZPJ7126B');

  // Doc Prefixes matching standard jewellery software & live DB
  const [invPrefix, setInvPrefix] = useState(initialStore?.invoicePrefix || 'INV-');
  const [loanPrefix, setLoanPrefix] = useState('LOAN-');
  const [repPrefix, setRepPrefix] = useState('REP-');
  const [schemePrefix, setSchemePrefix] = useState('BKG-');

  // Users state
  const [usersList, setUsersList] = useState<UserAccount[]>(initialUsers && initialUsers.length > 0 ? initialUsers : [
    {
      id: "usr-001",
      username: "admin",
      fullName: "Admin (Shop Owner)",
      email: "admin@jewellery.com",
      role: "ADMIN",
      assignedCounter: "MAIN",
      pinCode: "1234",
      isActive: true,
      lastLogin: "Today, 11:37 AM"
    },
    {
      id: "usr-002",
      username: "sandeepshah2000@gmail.com",
      fullName: "Sandeep Shah",
      email: "sandeepshah2000@gmail.com",
      role: "MANAGER",
      assignedCounter: "MAIN",
      pinCode: "5678",
      isActive: true,
      lastLogin: "Today, 10:55 AM"
    },
    {
      id: "usr-003",
      username: "sbjrahul01@gmail.com",
      fullName: "Rahul Jain",
      email: "sbjrahul01@gmail.com",
      role: "CASHIER",
      assignedCounter: "MAIN",
      pinCode: "9900",
      isActive: true,
      lastLogin: "Today, 11:37 AM"
    }
  ]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER'>('CASHIER');
  const [newUserCounter, setNewUserCounter] = useState('MAIN');
  const [newUserPin, setNewUserPin] = useState('1111');

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setPasswordError(null);
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateStore) {
      onUpdateStore({
        ...initialStore,
        tradeName: shopName,
        legalName: shopName,
        address,
        city,
        pincode,
        state: 'Maharashtra',
        stateCode: '27',
        gstin,
        phone,
        email,
        mobile,
        code
      });
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    const createdUser: UserAccount = {
      id: `usr-${Date.now()}`,
      username: newUserEmail,
      fullName: newUserName,
      email: newUserEmail,
      role: newUserRole,
      assignedCounter: newUserCounter,
      pinCode: newUserPin,
      isActive: true,
      lastLogin: 'Just added'
    };
    setUsersList(prev => [...prev, createdUser]);
    if (onAddUser) onAddUser(createdUser);
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
  };

  return (
    <div className="page">
      
      {/* Top Header Matching Frame 6 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Shop Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shop profile, GST, users, appearance and security · S.B Borana Jewellers
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-semibold shadow-2xs cursor-pointer"
          >
            Change My Password
          </button>
          
          <button
            type="button"
            onClick={handleSaveSettings}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white rounded-md text-xs font-bold shadow-2xs cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-md text-xs text-emerald-800 font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Shop settings updated and active across all showroom terminals!</span>
        </div>
      )}

      {/* Tabs Bar Matching Frame 6 & 190 */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto text-xs">
        {[
          { id: 'profile', label: 'Shop Profile' },
          { id: 'branding', label: 'Logo & Branding' },
          { id: 'gst', label: 'GST & Finance' },
          { id: 'prefixes', label: 'Doc Prefixes' },
          { id: 'users', label: 'Users & Passwords' },
          { id: 'security', label: 'Appearance & Security' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Shop Profile Matching Frame 190 */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Shop Name *</label>
              <input 
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Owner Name</label>
              <input 
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Code</label>
              <input 
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono uppercase font-bold"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Address *</label>
            <input 
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">City *</label>
              <input 
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">State</label>
              <input 
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Pincode *</label>
              <input 
                type="text"
                required
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Phone</label>
              <input 
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Mobile or Landline (022-26123456)</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mobile</label>
              <input 
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">GSTIN</label>
              <input 
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono uppercase font-bold"
              />
              <span className="text-[10px] text-emerald-700 mt-0.5 block font-semibold">Maharashtra · State Code 27</span>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">PAN Number</label>
              <input 
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 font-mono uppercase font-bold"
              />
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Logo & Branding */}
      {activeTab === 'branding' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-2xl border-2 border-emerald-600 shadow-sm">
              SBJ
            </div>
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-800 text-xs">S.B Borana Jewellers · Showroom Emblem</h3>
              <p className="text-[11px] text-slate-500">
                Uploaded image prints on top of Tax Invoices, Thermal Receipts, Estimates, and WhatsApp Bill PDFs.
              </p>
              <button 
                onClick={() => alert('Select logo image (PNG/JPG max 2MB)')}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold text-slate-700 cursor-pointer"
              >
                Upload New Emblem (PNG / JPG)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: GST & Finance */}
      {activeTab === 'gst' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Statutory Tax Rates (Maharashtra 27)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">Gold & Bullion GST (HSN 7113)</span>
              <span className="text-base font-bold font-mono text-emerald-800">3.00%</span>
              <p className="text-[10px] text-slate-500 mt-0.5">1.50% CGST + 1.50% SGST</p>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">Silver Articles GST (HSN 7113)</span>
              <span className="text-base font-bold font-mono text-emerald-800">3.00%</span>
              <p className="text-[10px] text-slate-500 mt-0.5">1.50% CGST + 1.50% SGST</p>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-700 block mb-1">Making Charges GST</span>
              <span className="text-base font-bold font-mono text-amber-800">5.00%</span>
              <p className="text-[10px] text-slate-500 mt-0.5">2.50% CGST + 2.50% SGST</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 mt-2">
            <span className="font-semibold text-slate-700 block mb-1">Labour & Repair Services (SAC 998722)</span>
            <span className="text-base font-bold font-mono text-blue-800">18.00%</span>
            <p className="text-[10px] text-slate-500 mt-0.5">9.00% CGST + 9.00% SGST</p>
          </div>
        </div>
      )}

      {/* Tab 4: Doc Prefixes */}
      {activeTab === 'prefixes' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Voucher & Serial Number Formats</h3>
          <div className="grid grid-cols-2 gap-4 font-mono">
            <div>
              <label className="font-sans font-semibold text-slate-700 block mb-1">Sales Tax Invoice Prefix</label>
              <input type="text" value={invPrefix} onChange={(e) => setInvPrefix(e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5" />
            </div>
            <div>
              <label className="font-sans font-semibold text-slate-700 block mb-1">Girvi Loan Account Prefix</label>
              <input type="text" value={loanPrefix} onChange={(e) => setLoanPrefix(e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5" />
            </div>
            <div>
              <label className="font-sans font-semibold text-slate-700 block mb-1">Repair Order Prefix</label>
              <input type="text" value={repPrefix} onChange={(e) => setRepPrefix(e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5" />
            </div>
            <div>
              <label className="font-sans font-semibold text-slate-700 block mb-1">Advance Booking Prefix</label>
              <input type="text" value={schemePrefix} onChange={(e) => setSchemePrefix(e.target.value)} className="w-full border border-slate-300 rounded px-2.5 py-1.5" />
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Users & Passwords */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden text-xs">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Showroom Staff & Terminal Accounts</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Role assignments, login credentials, and terminal authentication PINs</p>
            </div>
            <button 
              onClick={() => setShowAddUserModal(true)}
              className="px-3 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white rounded font-bold shadow-2xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff User</span>
            </button>
          </div>

          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">NAME & EMAIL</th>
                <th className="py-2.5 px-3">ROLE</th>
                <th className="py-2.5 px-3">ASSIGNED COUNTER</th>
                <th className="py-2.5 px-3">TERMINAL PIN</th>
                <th className="py-2.5 px-3">LAST LOGIN</th>
                <th className="py-2.5 px-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {usersList.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-semibold text-slate-900">{u.fullName}</div>
                    <div className="text-[11px] text-slate-500">{u.email}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-sans">{u.assignedCounter}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">••••</td>
                  <td className="py-2.5 px-3 text-[11px] text-slate-500 font-sans">{u.lastLogin}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {u.isActive ? 'Active' : 'Locked'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 6: Appearance & Security */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
          <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Terminal Lock & Security Rules</h3>
          <p className="text-slate-600">
            Showroom cashiers require PIN authentication for opening drawers, issuing cash refunds, and giving discounts above approved thresholds.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button 
              onClick={() => alert('PIN reset instructions sent to registered phones.')}
              className="px-3 py-1.5 bg-slate-800 text-white font-semibold rounded cursor-pointer hover:bg-slate-900"
            >
              Force PIN Reset on All Cashier Terminals
            </button>
            <button 
              onClick={() => alert('All remote cashier sessions terminated.')}
              className="px-3 py-1.5 bg-rose-700 text-white font-semibold rounded cursor-pointer hover:bg-rose-800"
            >
              Terminate All Active Sessions
            </button>
          </div>
        </div>
      )}

      {/* MODAL: ADD USER */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="p-4 border-b border-slate-200 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Add Showroom Staff User</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Varma"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email / Login ID *</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@jewellery.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-700 focus:outline-none"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="CASHIER">CASHIER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Counter</label>
                  <select
                    value={newUserCounter}
                    onChange={(e) => setNewUserCounter(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-700 focus:outline-none"
                  >
                    <option value="MAIN">MAIN</option>
                    <option value="C1">C1 - Diamond</option>
                    <option value="C2">C2 - Gold Ornaments</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Terminal 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newUserPin}
                  onChange={(e) => setNewUserPin(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg font-mono focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE MY PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">Change My Password</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowPasswordModal(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4 text-xs">
              {passwordError && (
                <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-md font-semibold">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Password updated successfully!</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

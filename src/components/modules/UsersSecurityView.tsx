import React, { useState } from 'react';
import { 
  Users, Shield, KeyRound, Lock, CheckCircle2, AlertTriangle, 
  Plus, Edit, Trash2, Key, Search, Filter, ShieldAlert, 
  Smartphone, Mail, Check, X, Eye, EyeOff, RotateCcw, UserCheck, 
  FileText, ShieldCheck
} from 'lucide-react';
import { UserAccount, StoreProfile } from '../../types';

interface ExtendedUserAccount extends UserAccount {
  phoneNumber?: string;
  avatarColor?: string;
  isLocked?: boolean;
  permissions?: {
    allowManualDiscount: boolean;
    allowRateOverride: boolean;
    allowBackdatedEntries: boolean;
    allowDeleteRecords: boolean;
    allowVoidPettyCash: boolean;
    allowRegisterDiffApprove: boolean;
  };
}

interface UsersSecurityViewProps {
  users?: UserAccount[];
  store?: StoreProfile;
  onNavigate?: (module: string) => void;
  onAddUser?: (user: UserAccount) => void;
  onUpdateUser?: (user: UserAccount) => void;
}

export const UsersSecurityView: React.FC<UsersSecurityViewProps> = ({
  users: initialUsers,
  store,
  onNavigate,
  onAddUser,
  onUpdateUser
}) => {
  // Active top tab: 'users' | 'roles' | 'security'
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'security'>('users');

  // Initial staff data matching dump.sql
  const [usersList, setUsersList] = useState<ExtendedUserAccount[]>([
    {
      id: 'u-1',
      username: 'admin',
      fullName: 'Admin (Sujal Shah)',
      email: 'admin@jewellery.com',
      phoneNumber: '9324773823',
      role: 'ADMIN',
      assignedCounter: 'Counter MAIN',
      pinCode: '1234',
      isActive: true,
      lastLogin: 'Today 11:42 AM',
      avatarColor: 'bg-emerald-700',
      permissions: {
        allowManualDiscount: true,
        allowRateOverride: true,
        allowBackdatedEntries: true,
        allowDeleteRecords: true,
        allowVoidPettyCash: true,
        allowRegisterDiffApprove: true
      }
    },
    {
      id: 'u-2',
      username: 'sandeep',
      fullName: 'Sandeep Shah',
      email: 'sandeepshah2000@gmail.com',
      phoneNumber: '9820154321',
      role: 'MANAGER',
      assignedCounter: 'Express POS 1',
      pinCode: '5678',
      isActive: true,
      lastLogin: 'Yesterday 07:15 PM',
      avatarColor: 'bg-blue-600',
      permissions: {
        allowManualDiscount: true,
        allowRateOverride: true,
        allowBackdatedEntries: false,
        allowDeleteRecords: false,
        allowVoidPettyCash: true,
        allowRegisterDiffApprove: true
      }
    },
    {
      id: 'u-3',
      username: 'rahul',
      fullName: 'Rahul Jain',
      email: 'sbjrahul01@gmail.com',
      phoneNumber: '9167234567',
      role: 'CASHIER',
      assignedCounter: 'Counter 2 (Retail Diamond)',
      pinCode: '4321',
      isActive: true,
      lastLogin: 'Today 10:15 AM',
      avatarColor: 'bg-amber-600',
      permissions: {
        allowManualDiscount: false,
        allowRateOverride: false,
        allowBackdatedEntries: false,
        allowDeleteRecords: false,
        allowVoidPettyCash: false,
        allowRegisterDiffApprove: false
      }
    },
    {
      id: 'u-4',
      username: 'bablu_karigar',
      fullName: 'Bablu Karigar',
      email: 'bablu.workshop@jewellery.com',
      phoneNumber: '9892112233',
      role: 'AUDITOR', // Workshop Karigar
      assignedCounter: 'Workshop Bench B1',
      pinCode: '9900',
      isActive: true,
      lastLogin: '14-Nov-2026 04:30 PM',
      avatarColor: 'bg-purple-600',
      permissions: {
        allowManualDiscount: false,
        allowRateOverride: false,
        allowBackdatedEntries: false,
        allowDeleteRecords: false,
        allowVoidPettyCash: false,
        allowRegisterDiffApprove: false
      }
    }
  ]);

  // Filtering & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Disabled' | 'Locked'>('All');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'MANAGER' | 'CASHIER' | 'AUDITOR'>('ALL');

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [activeUserForPin, setActiveUserForPin] = useState<ExtendedUserAccount | null>(null);
  const [newPinValue, setNewPinValue] = useState('');
  const [confirmPinValue, setConfirmPinValue] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Form State for User
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER' | 'AUDITOR'>('CASHIER');
  const [formCounter, setFormCounter] = useState('Counter MAIN');
  const [formPin, setFormPin] = useState('1111');
  const [formManualDiscount, setFormManualDiscount] = useState(false);
  const [formRateOverride, setFormRateOverride] = useState(false);
  const [formBackdated, setFormBackdated] = useState(false);
  const [formDeletePerm, setFormDeletePerm] = useState(false);
  const [formVoidCash, setFormVoidCash] = useState(false);
  const [formDiffApprove, setFormDiffApprove] = useState(false);

  // Quick Terminal PIN pad simulator
  const [testPinInput, setTestPinInput] = useState('');
  const [pinVerificationResult, setPinVerificationResult] = useState<string | null>(null);

  // Feedback alert
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // High-level Security policies
  const [requireOwnerOtpOver50k, setRequireOwnerOtpOver50k] = useState(true);
  const [maxFailedPinAttempts, setMaxFailedPinAttempts] = useState('3');
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState('15');
  const [lockoutAfterInactivity, setLockoutAfterInactivity] = useState(true);

  // Open Add User
  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('CASHIER');
    setFormCounter('Counter MAIN');
    setFormPin('1234');
    setFormManualDiscount(false);
    setFormRateOverride(false);
    setFormBackdated(false);
    setFormDeletePerm(false);
    setFormVoidCash(false);
    setFormDiffApprove(false);
    setIsUserModalOpen(true);
  };

  // Open Edit User
  const handleOpenEditUser = (user: ExtendedUserAccount) => {
    setEditingUserId(user.id);
    setFormName(user.fullName);
    setFormEmail(user.email);
    setFormPhone(user.phoneNumber || '');
    setFormRole(user.role);
    setFormCounter(user.assignedCounter);
    setFormPin(user.pinCode);
    setFormManualDiscount(user.permissions?.allowManualDiscount ?? false);
    setFormRateOverride(user.permissions?.allowRateOverride ?? false);
    setFormBackdated(user.permissions?.allowBackdatedEntries ?? false);
    setFormDeletePerm(user.permissions?.allowDeleteRecords ?? false);
    setFormVoidCash(user.permissions?.allowVoidPettyCash ?? false);
    setFormDiffApprove(user.permissions?.allowRegisterDiffApprove ?? false);
    setIsUserModalOpen(true);
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    if (editingUserId) {
      setUsersList(prev => prev.map(u => {
        if (u.id === editingUserId) {
          const updated: ExtendedUserAccount = {
            ...u,
            fullName: formName.trim(),
            email: formEmail.trim(),
            phoneNumber: formPhone.trim(),
            role: formRole,
            assignedCounter: formCounter,
            pinCode: formPin,
            permissions: {
              allowManualDiscount: formRole === 'ADMIN' ? true : formManualDiscount,
              allowRateOverride: formRole === 'ADMIN' ? true : formRateOverride,
              allowBackdatedEntries: formRole === 'ADMIN' ? true : formBackdated,
              allowDeleteRecords: formRole === 'ADMIN' ? true : formDeletePerm,
              allowVoidPettyCash: formRole === 'ADMIN' ? true : formVoidCash,
              allowRegisterDiffApprove: formRole === 'ADMIN' ? true : formDiffApprove
            }
          };
          if (onUpdateUser) onUpdateUser(updated);
          return updated;
        }
        return u;
      }));
      setAlertMsg(`User "${formName}" updated successfully.`);
    } else {
      const newUser: ExtendedUserAccount = {
        id: `u-${Date.now()}`,
        username: formEmail.split('@')[0].toLowerCase(),
        fullName: formName.trim(),
        email: formEmail.trim(),
        phoneNumber: formPhone.trim(),
        role: formRole,
        assignedCounter: formCounter,
        pinCode: formPin,
        isActive: true,
        lastLogin: 'Never logged in',
        avatarColor: formRole === 'ADMIN' ? 'bg-emerald-700' : formRole === 'MANAGER' ? 'bg-blue-600' : 'bg-amber-600',
        permissions: {
          allowManualDiscount: formRole === 'ADMIN' ? true : formManualDiscount,
          allowRateOverride: formRole === 'ADMIN' ? true : formRateOverride,
          allowBackdatedEntries: formRole === 'ADMIN' ? true : formBackdated,
          allowDeleteRecords: formRole === 'ADMIN' ? true : formDeletePerm,
          allowVoidPettyCash: formRole === 'ADMIN' ? true : formVoidCash,
          allowRegisterDiffApprove: formRole === 'ADMIN' ? true : formDiffApprove
        }
      };
      setUsersList(prev => [...prev, newUser]);
      if (onAddUser) onAddUser(newUser);
      setAlertMsg(`New user "${newUser.fullName}" added to showroom access!`);
    }

    setIsUserModalOpen(false);
    setTimeout(() => setAlertMsg(null), 3500);
  };

  const handleToggleUserStatus = (user: ExtendedUserAccount) => {
    if (user.role === 'ADMIN') {
      alert('The Master Admin / Owner login cannot be disabled.');
      return;
    }
    const newStatus = !user.isActive;
    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, isActive: newStatus } : u));
    setAlertMsg(`User "${user.fullName}" is now ${newStatus ? 'ACTIVE' : 'DISABLED'}.`);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // Open PIN change
  const handleOpenPinModal = (user: ExtendedUserAccount) => {
    setActiveUserForPin(user);
    setNewPinValue('');
    setConfirmPinValue('');
    setShowPin(false);
    setIsPinModalOpen(true);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUserForPin) return;
    if (newPinValue.length < 4 || newPinValue.length > 6) {
      alert('PIN must be 4 to 6 numeric digits.');
      return;
    }
    if (newPinValue !== confirmPinValue) {
      alert('PIN confirmation does not match.');
      return;
    }

    setUsersList(prev => prev.map(u => u.id === activeUserForPin.id ? { ...u, pinCode: newPinValue } : u));
    setIsPinModalOpen(false);
    setAlertMsg(`Terminal PIN for "${activeUserForPin.fullName}" has been changed.`);
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // Verify PIN in simulator
  const handleVerifyTestPin = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = usersList.find(u => u.pinCode === testPinInput && u.isActive);
    if (matched) {
      setPinVerificationResult(`✅ Authenticated: ${matched.fullName} (${getRoleBadgeName(matched.role)})`);
    } else {
      setPinVerificationResult(`❌ Invalid PIN! No active user matched.`);
    }
    setTimeout(() => setPinVerificationResult(null), 4000);
  };

  const getRoleBadgeName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Admin / Owner';
      case 'MANAGER': return 'Manager';
      case 'CASHIER': return 'Cashier / Sales Staff';
      case 'AUDITOR': return 'Workshop Karigar';
      default: return role;
    }
  };

  const filteredUsers = usersList.filter(u => {
    if (statusFilter === 'Active' && (!u.isActive || u.isLocked)) return false;
    if (statusFilter === 'Disabled' && u.isActive) return false;
    if (statusFilter === 'Locked' && !u.isLocked) return false;
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.assignedCounter.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="page">
      {/* 1. Header Banner & Expiry Alert */}
      <div 
        className="license-banner rounded-lg mb-3 flex items-center justify-between p-3" 
        style={{ background: '#fef8ee', borderColor: '#fde68a', borderWidth: 1 }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-medium text-amber-950">
            ⚠️ Licence expires in 30 days (15-Dec-2026). Contact Kreya IT Consulting to renew.
          </span>
        </div>
        <button 
          onClick={() => onNavigate ? onNavigate('licence') : alert('Navigating to Licence Renewal...')}
          className="font-semibold text-amber-900 hover:text-amber-950 cursor-pointer flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors"
        >
          <span>Licence</span>
          <span>→</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="page-hdr flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="page-hdr-left">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">Users</h1>
            {/* Header banner Counter badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper text-xs text-slate-500 mt-1">
            Multi-tier Role-Based Access Control, PIN terminal authentication, sensitive operation overrides & active operator sessions · S.B Borana Jewellers
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Licence Seats Indicator */}
          <div className="text-right hidden sm:block pr-2 border-r border-slate-200">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Licence Seats</div>
            <div className="text-sm font-bold text-slate-800">{usersList.length} / 5 used</div>
          </div>

          <button 
            type="button"
            onClick={handleOpenAddUser}
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Add user</span>
          </button>
        </div>
      </div>

      {/* Save / Status Notification */}
      {alertMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2 mb-3 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="tabs mb-4 flex border-b border-slate-200">
        <button 
          type="button" 
          className={`tab px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-[#237a57] text-[#237a57] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('users')}
        >
          <div className="flex items-center gap-1.5">
            <Users size={14} />
            <span>Staff Users & Terminals ({usersList.length})</span>
          </div>
        </button>

        <button 
          type="button" 
          className={`tab px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'roles' ? 'border-[#237a57] text-[#237a57] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('roles')}
        >
          <div className="flex items-center gap-1.5">
            <Shield size={14} />
            <span>4-Tier RBAC & Permissions Matrix</span>
          </div>
        </button>

        <button 
          type="button" 
          className={`tab px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'security' ? 'border-[#237a57] text-[#237a57] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('security')}
        >
          <div className="flex items-center gap-1.5">
            <Lock size={14} />
            <span>Terminal PIN & Showroom Safeguards</span>
          </div>
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="card p-3 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="search-box relative w-full">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search staff by name, email, role, or counter..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-sm w-full pl-8 text-xs"
                />
                {search && (
                  <button 
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="input input-sm text-xs"
              >
                <option value="ALL">All 4 Roles</option>
                <option value="ADMIN">Admin / Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="CASHIER">Cashier / Sales Staff</option>
                <option value="AUDITOR">Workshop Karigar</option>
              </select>

              <div className="seg flex rounded border border-slate-200 overflow-hidden text-xs">
                {(['All', 'Active', 'Disabled', 'Locked'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 text-xs font-medium capitalize transition-colors ${statusFilter === st ? 'bg-slate-800 text-white font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card">
            <div className="tbl-wrap tbl-desktop-only">
              <table className="tbl w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 px-3 text-left">USER</th>
                    <th className="py-2.5 px-3 text-left">ROLES</th>
                    <th className="py-2.5 px-3 text-left">STATUS</th>
                    <th className="py-2.5 px-3 text-left">LAST SIGN-IN</th>
                    <th className="py-2.5 px-3 text-left">SESSIONS</th>
                    <th className="py-2.5 px-3 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map(u => {
                    const isOwner = u.role === 'ADMIN';

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full ${u.avatarColor || 'bg-slate-700'} text-white flex items-center justify-center font-bold text-xs uppercase shrink-0`}>
                              {u.fullName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{u.fullName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`badge ${
                            u.role === 'ADMIN' ? 'badge-green text-[#185b40]' :
                            u.role === 'MANAGER' ? 'badge-indigo' :
                            u.role === 'CASHIER' ? 'badge-yellow text-amber-800' :
                            'badge-gray text-purple-800'
                          }`}>
                            {getRoleBadgeName(u.role)}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className={`badge ${u.isLocked ? 'badge-yellow' : u.isActive ? 'badge-green' : 'badge-red'}`}>
                            {u.isLocked ? 'Locked' : u.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3 px-3">{u.lastLogin || '—'}</td>
                        <td className="py-3 px-3" title="Session counts are unavailable">—</td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenPinModal(u)}
                              className="btn btn-outline btn-sm py-1 px-2 text-xs flex items-center gap-1"
                              title="Reset user PIN / Password"
                            >
                              <RotateCcw size={12} />
                              <span>Reset</span>
                            </button>

                            {!isOwner && (
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u)}
                                className={`btn btn-outline btn-sm py-1 px-2 text-xs ${u.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                title={u.isActive ? 'Disable User Login' : 'Reactivate User Login'}
                              >
                                {u.isActive ? 'Disable' : 'Enable'}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(u)}
                              className="btn btn-outline btn-sm py-1 px-2 text-xs flex items-center gap-1"
                              title="Edit user details and permissions"
                            >
                              <Edit size={12} />
                              <span>Edit</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="dt-pager p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
              <span>Showing {filteredUsers.length} of {usersList.length} staff members</span>
              <span></span>
            </div>
          </div>

          {/* Pristine Empty State */}
          {filteredUsers.length === 0 && (
            <div className="card p-12 text-center bg-white border border-dashed border-slate-200 rounded-lg">
              <Users size={36} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">No Staff Users Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No users match the search "{search}" or selected filters.
              </p>
              <button
                type="button"
                onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('All'); }}
                className="btn btn-outline btn-sm mt-3"
              >
                Clear Search Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 4-TIER RBAC & PERMISSIONS MATRIX */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-header border-b border-slate-100 p-3 bg-slate-50 flex items-center justify-between">
              <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
                Showroom Governance: 4-Tier Role-Based Access Control (RBAC)
              </span>
              <span className="badge badge-indigo text-[10px]">Strict Segregation of Duties</span>
            </div>
            <div className="card-body p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                
                {/* 1. Admin/Owner */}
                <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-950">1. Admin / Owner</span>
                    <span className="badge badge-green text-[10px]">Master</span>
                  </div>
                  <p className="text-[11px] text-emerald-900 leading-snug">
                    Shop proprietor & master administrator. Full irrevocable permissions across GST, financials, users, and audit logs.
                  </p>
                  <div className="text-[10px] text-emerald-800 space-y-0.5 pt-1 border-t border-emerald-200">
                    <div>✓ Uncapped manual discount</div>
                    <div>✓ Daily rate updates</div>
                    <div>✓ Database sync & restores</div>
                    <div>✓ Security policy modification</div>
                  </div>
                </div>

                {/* 2. Manager */}
                <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-blue-950">2. Manager</span>
                    <span className="badge badge-indigo text-[10px]">Supervisory</span>
                  </div>
                  <p className="text-[11px] text-blue-900 leading-snug">
                    Runs showroom operations day-to-day. Handles customer escalations, loan sanctions, and register closures.
                  </p>
                  <div className="text-[10px] text-blue-800 space-y-0.5 pt-1 border-t border-blue-200">
                    <div>✓ Manual discount up to limit (5%)</div>
                    <div>✓ Daily metal rate override</div>
                    <div>✓ Disburse Girvi gold loans</div>
                    <div>✗ Cannot alter statutory audit log</div>
                  </div>
                </div>

                {/* 3. Cashier/Sales Staff */}
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-amber-950">3. Cashier / Sales</span>
                    <span className="badge badge-yellow text-[10px]">Counter POS</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-snug">
                    Frontline billing, estimate creation, old gold intake, and cash drawer management at assigned terminal.
                  </p>
                  <div className="text-[10px] text-amber-800 space-y-0.5 pt-1 border-t border-amber-200">
                    <div>✓ POS invoice creation & receipt</div>
                    <div>✓ Barcode tag lookup</div>
                    <div>✓ Daily cash drawer tally</div>
                    <div>✗ No backdated entries / No delete</div>
                  </div>
                </div>

                {/* 4. Workshop Karigar */}
                <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-purple-950">4. Workshop Karigar</span>
                    <span className="badge badge-gray text-[10px] text-purple-800">Manufacturing</span>
                  </div>
                  <p className="text-[11px] text-purple-900 leading-snug">
                    Internal goldsmith bench. Repairs queue, casting, melting, and raw metal loss tracking with zero pricing visibility.
                  </p>
                  <div className="text-[10px] text-purple-800 space-y-0.5 pt-1 border-t border-purple-200">
                    <div>✓ Update repair progress (QC, Ready)</div>
                    <div>✓ Gross/net touch recording</div>
                    <div>✗ Zero financial & sales visibility</div>
                    <div>✗ No customer contacts access</div>
                  </div>
                </div>

              </div>

              {/* Granular Permission Toggles Matrix */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-800 mb-2">Showroom Security Override Matrix</h4>
                <div className="tbl-wrap">
                  <table className="tbl w-full text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600">
                        <th className="p-2 text-left">SECURITY CAPABILITY</th>
                        <th className="p-2 text-center">ADMIN / OWNER</th>
                        <th className="p-2 text-center">MANAGER</th>
                        <th className="p-2 text-center">CASHIER / SALES</th>
                        <th className="p-2 text-center">WORKSHOP KARIGAR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="p-2.5 font-medium text-slate-800">
                          <div>Allow manual discount override</div>
                          <div className="text-[10px] text-slate-400">Override system-suggested making discounts at billing</div>
                        </td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">✓ Uncapped</td>
                        <td className="p-2.5 text-center text-blue-600 font-medium">✓ Up to 5%</td>
                        <td className="p-2.5 text-center text-red-500 font-medium">✗ Gated</td>
                        <td className="p-2.5 text-center text-slate-400 font-medium">✗ N/A</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-slate-800">
                          <div>Allow daily metal rate override</div>
                          <div className="text-[10px] text-slate-400">Temporarily override board gold/silver rates for VIP clients</div>
                        </td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">✓ Full</td>
                        <td className="p-2.5 text-center text-blue-600 font-medium">✓ Full</td>
                        <td className="p-2.5 text-center text-red-500 font-medium">✗ Gated</td>
                        <td className="p-2.5 text-center text-slate-400 font-medium">✗ N/A</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-slate-800">
                          <div>Allow backdated voucher entries</div>
                          <div className="text-[10px] text-slate-400">Issue invoices or loans with past transaction dates</div>
                        </td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">✓ Full</td>
                        <td className="p-2.5 text-center text-red-500 font-medium">✗ Gated</td>
                        <td className="p-2.5 text-center text-red-500 font-medium">✗ Gated</td>
                        <td className="p-2.5 text-center text-slate-400 font-medium">✗ N/A</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-slate-800">
                          <div>Delete permanent records</div>
                          <div className="text-[10px] text-slate-400">Permanent purge of inventory tag or draft records</div>
                        </td>
                        <td className="p-2.5 text-center text-emerald-600 font-bold">✓ Audit Logged</td>
                        <td className="p-2.5 text-center text-red-500 font-medium">✗ Disabled</td>
                        <td className="p-2.5 text-center text-red-500 font-medium">✗ Disabled</td>
                        <td className="p-2.5 text-center text-slate-400 font-medium">✗ N/A</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PIN AUTHENTICATION & SHOWROOM SAFEGUARDS */}
      {activeTab === 'security' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* PIN Pad Terminal Simulator */}
            <div className="card">
              <div className="card-header border-b border-slate-100 p-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-[#237a57]" />
                  <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Terminal PIN Fast-Switch Simulator
                  </span>
                </div>
                <span className="badge badge-green text-[10px]">Instant Sign-in</span>
              </div>
              <div className="card-body p-4 space-y-3">
                <p className="text-xs text-slate-500">
                  Test showroom counter quick switch using staff 4-digit PIN (e.g. Admin: 1234, Sandeep: 5678, Rahul: 4321, Bablu: 9900).
                </p>

                <form onSubmit={handleVerifyTestPin} className="space-y-3">
                  <div className="flex gap-2">
                    <input 
                      type="password"
                      maxLength={6}
                      value={testPinInput}
                      onChange={(e) => setTestPinInput(e.target.value.replace(/\D/g, ''))}
                      className="input text-center text-lg font-mono tracking-widest font-bold flex-1"
                      placeholder="Enter 4-digit PIN"
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm px-4"
                    >
                      Authenticate
                    </button>
                  </div>

                  {pinVerificationResult && (
                    <div className={`p-2.5 rounded text-xs font-semibold ${pinVerificationResult.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                      {pinVerificationResult}
                    </div>
                  )}

                  {/* Onscreen Numpad for Touch Terminals */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 max-w-[200px] mx-auto">
                    {['1','2','3','4','5','6','7','8','9','C','0','⌫'].map(btn => (
                      <button
                        key={btn}
                        type="button"
                        onClick={() => {
                          if (btn === 'C') setTestPinInput('');
                          else if (btn === '⌫') setTestPinInput(prev => prev.slice(0, -1));
                          else if (testPinInput.length < 6) setTestPinInput(prev => prev + btn);
                        }}
                        className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded text-xs transition-colors"
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                </form>
              </div>
            </div>

            {/* High-Value Security Policies */}
            <div className="card">
              <div className="card-header border-b border-slate-100 p-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-amber-600" />
                  <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
                    High-Value Transaction Safeguards
                  </span>
                </div>
                <span className="badge badge-yellow text-[10px]">Active Enforcement</span>
              </div>
              <div className="card-body p-4 space-y-3">
                <label className="flex items-start gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input 
                    type="checkbox"
                    checked={requireOwnerOtpOver50k}
                    onChange={(e) => setRequireOwnerOtpOver50k(e.target.checked)}
                    className="mt-0.5 rounded text-[#237a57]"
                  />
                  <div>
                    <span>Require Owner OTP / Master PIN for cash refunds exceeding ₹50,000 or voided tax invoices</span>
                    <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                      Prevents unauthorized voucher cancellations or cashier cash drainage.
                    </p>
                  </div>
                </label>

                <div className="pt-2 border-t border-slate-100">
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Max Failed PIN Attempts Before Terminal Lockout
                  </label>
                  <select 
                    value={maxFailedPinAttempts}
                    onChange={(e) => setMaxFailedPinAttempts(e.target.value)}
                    className="input w-full text-xs"
                  >
                    <option value="3">3 Attempts (Standard Security Recommendation)</option>
                    <option value="5">5 Attempts</option>
                    <option value="10">10 Attempts</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    POS Counter Idle Timeout
                  </label>
                  <select 
                    value={sessionTimeoutMinutes}
                    onChange={(e) => setSessionTimeoutMinutes(e.target.value)}
                    className="input w-full text-xs"
                  >
                    <option value="5">5 Minutes</option>
                    <option value="15">15 Minutes (Recommended)</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">60 Minutes</option>
                  </select>
                  <p className="helper text-[11px] text-slate-400 mt-0.5">
                    Terminal locks back to PIN keypad after elapsed idle time.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setAlertMsg('Showroom security policies successfully updated across all POS terminals!');
                      setTimeout(() => setAlertMsg(null), 3000);
                    }}
                    className="btn btn-primary btn-sm"
                  >
                    Save Security Policies
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT USER */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#237a57]" />
                <h3 className="font-bold text-sm text-slate-800">
                  {editingUserId ? `Edit Staff Member (${formName})` : 'Register New Staff Member'}
                </h3>
              </div>
              <button 
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserForm} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="input w-full text-xs"
                    placeholder="e.g. Ramesh Soni"
                    required
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Official Email / Login ID <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="input w-full text-xs font-mono"
                    placeholder="ramesh@jewellery.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Mobile Phone
                  </label>
                  <input 
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="input w-full text-xs font-mono"
                    placeholder="9820011223"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Showroom Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="input w-full text-xs"
                  >
                    <option value="ADMIN">Admin / Owner</option>
                    <option value="MANAGER">Manager</option>
                    <option value="CASHIER">Cashier / Sales</option>
                    <option value="AUDITOR">Workshop Karigar</option>
                  </select>
                </div>
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Assigned Terminal
                  </label>
                  <select
                    value={formCounter}
                    onChange={(e) => setFormCounter(e.target.value)}
                    className="input w-full text-xs"
                  >
                    <option value="Counter MAIN">Counter MAIN</option>
                    <option value="Counter 2 (Retail Diamond)">Counter 2</option>
                    <option value="Express POS 1">Express POS 1</option>
                    <option value="Workshop Bench B1">Workshop</option>
                  </select>
                </div>
              </div>

              {!editingUserId && (
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Initial Terminal PIN Code (4 Digits) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="password"
                    maxLength={6}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                    className="input w-full text-xs font-mono tracking-widest text-center"
                    placeholder="1234"
                    required
                  />
                </div>
              )}

              {/* Individual Permission Toggles */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                  Fine-Grained Permissions
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formRole === 'ADMIN' ? true : formManualDiscount}
                      disabled={formRole === 'ADMIN'}
                      onChange={(e) => setFormManualDiscount(e.target.checked)}
                      className="rounded text-[#237a57]"
                    />
                    <span>Allow manual discount</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formRole === 'ADMIN' ? true : formRateOverride}
                      disabled={formRole === 'ADMIN'}
                      onChange={(e) => setFormRateOverride(e.target.checked)}
                      className="rounded text-[#237a57]"
                    />
                    <span>Allow rate override</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formRole === 'ADMIN' ? true : formBackdated}
                      disabled={formRole === 'ADMIN'}
                      onChange={(e) => setFormBackdated(e.target.checked)}
                      className="rounded text-[#237a57]"
                    />
                    <span>Allow backdated entries</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formRole === 'ADMIN' ? true : formDeletePerm}
                      disabled={formRole === 'ADMIN'}
                      onChange={(e) => setFormDeletePerm(e.target.checked)}
                      className="rounded text-[#237a57]"
                    />
                    <span>Delete permission</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formRole === 'ADMIN' ? true : formVoidCash}
                      disabled={formRole === 'ADMIN'}
                      onChange={(e) => setFormVoidCash(e.target.checked)}
                      className="rounded text-[#237a57]"
                    />
                    <span>Void petty cash vouchers</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formRole === 'ADMIN' ? true : formDiffApprove}
                      disabled={formRole === 'ADMIN'}
                      onChange={(e) => setFormDiffApprove(e.target.checked)}
                      className="rounded text-[#237a57]"
                    />
                    <span>Approve register differences</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsUserModalOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{editingUserId ? 'Save Staff Changes' : 'Create Staff Login'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE PIN CODE */}
      {isPinModalOpen && activeUserForPin && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#237a57]" />
                <h3 className="font-bold text-sm text-slate-800">
                  Change Terminal PIN: {activeUserForPin.fullName}
                </h3>
              </div>
              <button 
                onClick={() => setIsPinModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="p-4 space-y-3">
              <div>
                <label className="label text-xs font-semibold text-slate-700 block mb-1">
                  New 4-Digit Numeric PIN <span className="text-red-500">*</span>
                </label>
                <input 
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={newPinValue}
                  onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                  className="input w-full text-center text-lg font-mono tracking-widest font-bold"
                  placeholder="••••"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="label text-xs font-semibold text-slate-700 block mb-1">
                  Confirm New PIN <span className="text-red-500">*</span>
                </label>
                <input 
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={confirmPinValue}
                  onChange={(e) => setConfirmPinValue(e.target.value.replace(/\D/g, ''))}
                  className="input w-full text-center text-lg font-mono tracking-widest font-bold"
                  placeholder="••••"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  {showPin ? <EyeOff size={12} /> : <Eye size={12} />}
                  <span>{showPin ? 'Hide PIN' : 'Reveal PIN'}</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsPinModalOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Save New PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


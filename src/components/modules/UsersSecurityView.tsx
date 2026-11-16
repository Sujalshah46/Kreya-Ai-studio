import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Shield, Lock, RotateCcw, Monitor, Edit, Copy, Check, X, Key, UserX, UserCheck
} from 'lucide-react';
import { UserAccount, StoreProfile } from '../../types';

interface UserRole {
  id: number;
  name: string;
  systemKey: string;
  description?: string;
  permissions?: string[];
}

interface ERPUser {
  id: number;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  is_owner: boolean;
  must_change_password: boolean;
  failed_logins: number;
  locked_until: string | null;
  last_login_at: string | null;
  password_changed_at?: string;
  disabled_reason: string | null;
  disabled_at?: string | null;
  created_at: string;
  row_version: number;
  roles: UserRole[];
  active_sessions: number;
}

interface UsersSecurityViewProps {
  users?: UserAccount[];
  store?: StoreProfile;
  onNavigate?: (module: string) => void;
  onAddUser?: (user: UserAccount) => void;
  onUpdateUser?: (user: UserAccount) => void;
}

const AVAILABLE_ROLES: UserRole[] = [
  { id: 2, name: 'Admin', systemKey: 'admin', description: 'Full access to the shop, including users and settings.' },
  { id: 3, name: 'Manager', systemKey: 'manager', description: 'Runs the shop day to day. No security, integrations or role editing.' },
  { id: 4, name: 'Cashier', systemKey: 'cashier', description: 'Counter billing, receipts and the cash register.' },
  { id: 5, name: 'Sales', systemKey: 'sales', description: 'Sales staff: customers, orders, bookings, repairs, old gold. (Legacy "staff" users get this role.)' },
  { id: 6, name: 'Accountant', systemKey: 'accountant', description: 'Views everything, runs reports and exports, handles bills and supplier payments.' },
  { id: 8, name: 'Viewer', systemKey: 'viewer', description: 'Read-only.' },
  { id: 7, name: 'Stock Manager', systemKey: 'stock_manager', description: 'Inventory only: adds stock items and edits the items he added. Items added by others open read-only.' }
];

const INITIAL_ERP_USERS: ERPUser[] = [
  {
    id: 1,
    name: 'Admin',
    email: 'admin@jewellery.com',
    username: null,
    phone: null,
    role: 'admin',
    is_active: true,
    is_owner: true,
    must_change_password: false,
    failed_logins: 0,
    locked_until: null,
    last_login_at: '2026-11-16T08:20:53.580Z',
    disabled_reason: null,
    created_at: '2026-11-15T10:55:11.977Z',
    row_version: 2,
    roles: [
      { id: 2, name: 'Admin', systemKey: 'admin' },
      { id: 1, name: 'Owner', systemKey: 'owner' }
    ],
    active_sessions: 5
  },
  {
    id: 3,
    name: 'Rahul Jain',
    email: 'sbjrahul01@gmail.com',
    username: 'sbjrahul01@gmail.com',
    phone: null,
    role: 'accountant',
    is_active: true,
    is_owner: false,
    must_change_password: true,
    failed_logins: 0,
    locked_until: null,
    last_login_at: null,
    disabled_reason: null,
    created_at: '2026-11-15T11:27:00.180Z',
    row_version: 1,
    roles: [
      { id: 6, name: 'Accountant', systemKey: 'accountant' },
      { id: 8, name: 'Viewer', systemKey: 'viewer' }
    ],
    active_sessions: 0
  },
  {
    id: 2,
    name: 'Sandeep Shah',
    email: 'sandeepshah2000@gmail.com',
    username: 'sandeepshah2000@gmail.com',
    phone: null,
    role: 'staff',
    is_active: true,
    is_owner: false,
    must_change_password: true,
    failed_logins: 0,
    locked_until: null,
    last_login_at: null,
    disabled_reason: null,
    created_at: '2026-11-15T11:25:56.396Z',
    row_version: 1,
    roles: [
      { id: 4, name: 'Cashier', systemKey: 'cashier' },
      { id: 5, name: 'Sales', systemKey: 'sales' }
    ],
    active_sessions: 0
  }
];

export const UsersSecurityView: React.FC<UsersSecurityViewProps> = ({
  onNavigate
}) => {
  const [usersList, setUsersList] = useState<ERPUser[]>(INITIAL_ERP_USERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'disabled' | 'locked'>('');
  const [editingUser, setEditingUser] = useState<ERPUser | 'new' | null>(null);
  const [disablingUser, setDisablingUser] = useState<ERPUser | null>(null);
  const [disableReason, setDisableReason] = useState('');
  const [sessionsUser, setSessionsUser] = useState<ERPUser | null>(null);
  const [tempPasswordModal, setTempPasswordModal] = useState<{ title: string; value: string; note: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const seats = useMemo(() => ({
    used: usersList.filter(u => u.is_active).length,
    allowed: null
  }), [usersList]);

  const filteredUsers = useMemo(() => {
    return usersList.filter(u => {
      const isLocked = u.locked_until && new Date(u.locked_until) > new Date();
      if (statusFilter === 'active' && (!u.is_active || isLocked)) return false;
      if (statusFilter === 'disabled' && u.is_active) return false;
      if (statusFilter === 'locked' && !isLocked) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const nameMatch = u.name.toLowerCase().includes(q);
        const emailMatch = u.email.toLowerCase().includes(q);
        const phoneMatch = u.phone ? u.phone.includes(q) : false;
        const roleMatch = u.roles.some(r => r.name.toLowerCase().includes(q));
        if (!nameMatch && !emailMatch && !phoneMatch && !roleMatch) return false;
      }
      return true;
    });
  }, [usersList, statusFilter, search]);

  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return '—';
    try {
      return new Date(isoStr).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  const handleResetPassword = (user: ERPUser) => {
    const reason = window.prompt(`Reset the password of ${user.name}? They will be signed out and must choose a new one.\n\nReason (kept in the security log):`);
    if (reason === null) return;
    if (reason.trim().length < 3) {
      alert('Give a reason for the reset (at least 3 letters)');
      return;
    }
    const tempPw = 'Temp-' + Math.floor(1000 + Math.random() * 9000) + '!' + String.fromCharCode(65 + Math.floor(Math.random() * 26));
    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, must_change_password: true, active_sessions: 0 } : u));
    setTempPasswordModal({
      title: `Temporary password for ${user.name}`,
      value: tempPw,
      note: 'Give this to the user. They must change it when they sign in.'
    });
    showToast(`Password reset for ${user.name}`);
  };

  const handleEnableUser = (user: ERPUser) => {
    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, is_active: true, disabled_reason: null } : u));
    showToast(`${user.name} enabled`);
  };

  const handleConfirmDisable = () => {
    if (!disablingUser || !disableReason.trim()) return;
    setUsersList(prev => prev.map(u => u.id === disablingUser.id ? {
      ...u,
      is_active: false,
      disabled_reason: disableReason.trim(),
      active_sessions: 0
    } : u));
    showToast(`${disablingUser.name} disabled and signed out`);
    setDisablingUser(null);
    setDisableReason('');
  };

  const handleUnlockUser = (user: ERPUser) => {
    setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, locked_until: null, failed_logins: 0 } : u));
    showToast('Unlocked');
  };

  return (
    <div className="page" id="main">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className="kj-toast" 
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: '10px 16px',
            background: 'var(--surface)',
            color: 'var(--text)',
            borderRadius: 8,
            boxShadow: 'var(--sh-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600
          }}
        >
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="16" width="16" style={{ color: 'var(--primary)' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Users</h1>
          <p>Create staff logins, assign roles, disable users and see who is signed in.</p>
        </div>
      </div>

      {/* Controls Card */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '16px 18px' }}>
          <div className="search-box">
            <Search size={14} />
            <input 
              placeholder="Search name, email, mobile…" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>

          <div className="seg">
            {[
              ['', 'All'],
              ['active', 'Active'],
              ['disabled', 'Disabled'],
              ['locked', 'Locked']
            ].map(([val, label]) => (
              <button 
                key={val} 
                className={statusFilter === val ? 'on' : ''} 
                onClick={() => setStatusFilter(val as any)}
              >
                {label}
              </button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Licence seats
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>
                {seats.used} / ∞
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => setEditingUser('new')}>
              <Plus size={14} /> Add user
            </button>
          </div>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="card">
        <div className="tbl-wrap tbl-desktop-only">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Last sign-in</th>
                <th className="num">Sessions</th>
                <th className="num">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => {
                const isLocked = u.locked_until && new Date(u.locked_until) > new Date();
                const isCurrent = u.id === 1;

                return (
                  <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.6 }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {u.name}{' '}
                        {u.is_owner && (
                          <span className="badge badge-purple" style={{ marginLeft: 4 }}>
                            <Shield size={10} style={{ display: 'inline', marginRight: 2 }} /> Owner
                          </span>
                        )}{' '}
                        {isCurrent && <span className="badge badge-gray">You</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {u.email}{u.phone ? ` · ${u.phone}` : ''}
                      </div>
                    </td>

                    <td>
                      {(u.roles || []).map(r => (
                        <span key={r.id} className="badge badge-indigo" style={{ marginRight: 4 }}>
                          {r.name}
                        </span>
                      ))}
                    </td>

                    <td>
                      {u.is_active ? (
                        isLocked ? (
                          <span className="badge badge-yellow">Locked</span>
                        ) : u.must_change_password ? (
                          <span className="badge badge-blue">Temp password</span>
                        ) : (
                          <span className="badge badge-green">Active</span>
                        )
                      ) : (
                        <span className="badge badge-red" title={u.disabled_reason || ''}>
                          Disabled
                        </span>
                      )}
                      {!u.is_active && u.disabled_reason && (
                        <div className="helper">{u.disabled_reason}</div>
                      )}
                    </td>

                    <td>{formatDate(u.last_login_at)}</td>

                    <td className="num">
                      <button className="btn btn-xs btn-outline" onClick={() => setSessionsUser(u)}>
                        <Monitor size={11} style={{ display: 'inline', marginRight: 2 }} /> {u.active_sessions}
                      </button>
                    </td>

                    <td className="num">
                      <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-xs btn-outline" title="Edit" onClick={() => setEditingUser(u)}>
                          <Edit size={11} />
                        </button>

                        {isLocked && (
                          <button className="btn btn-xs btn-outline" onClick={() => handleUnlockUser(u)}>
                            <Key size={11} /> Unlock
                          </button>
                        )}

                        <button className="btn btn-xs btn-outline" onClick={() => handleResetPassword(u)}>
                          <Lock size={11} /> Reset
                        </button>

                        {!u.is_owner && !isCurrent && (
                          u.is_active ? (
                            <button className="btn btn-xs btn-danger-outline" onClick={() => { setDisablingUser(u); setDisableReason(''); }}>
                              <UserX size={11} /> Disable
                            </button>
                          ) : (
                            <button className="btn btn-xs btn-success" onClick={() => handleEnableUser(u)}>
                              <UserCheck size={11} /> Enable
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">No users match.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="tbl-mobile-only" style={{ padding: 10 }}>
          {filteredUsers.map(u => (
            <div key={u.id} className="tbl-card-row" onClick={() => setEditingUser(u)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong>{u.name}</strong>
                {u.is_active ? (
                  <span className="badge badge-green">Active</span>
                ) : (
                  <span className="badge badge-red">Disabled</span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{u.email}</div>
              <div style={{ marginTop: 6 }}>
                {(u.roles || []).map(r => (
                  <span key={r.id} className="badge badge-indigo" style={{ marginRight: 4 }}>
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {editingUser && (
        <UserFormModal 
          user={editingUser === 'new' ? null : editingUser}
          roles={AVAILABLE_ROLES}
          onClose={() => setEditingUser(null)}
          onSaved={(user, tempPw) => {
            if (editingUser === 'new') {
              setUsersList(prev => [...prev, user]);
              setEditingUser(null);
              if (tempPw) {
                setTempPasswordModal({
                  title: `User created: ${user.name}`,
                  value: tempPw,
                  note: 'Give this temporary password to the user. They must change it when they first sign in.'
                });
              }
              showToast(`User ${user.name} created`);
            } else {
              setUsersList(prev => prev.map(u => u.id === user.id ? user : u));
              setEditingUser(null);
              showToast('User updated');
            }
          }}
        />
      )}

      {/* Disable User Modal */}
      {disablingUser && (
        <div className="overlay" onClick={() => setDisablingUser(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Disable {disablingUser.name}?</h3>
              <button className="btn btn-ghost" onClick={() => setDisablingUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <ul style={{ paddingLeft: 18, fontSize: 13.5, lineHeight: 1.8, marginBottom: 12 }}>
                <li>They are signed out of every device now.</li>
                <li>Their history (bills, receipts, audit) stays linked to them.</li>
                <li>The licence seat becomes free. You can enable them again later.</li>
              </ul>
              <label className="label">Reason *</label>
              <textarea 
                className="input" 
                value={disableReason} 
                onChange={e => setDisableReason(e.target.value)} 
                placeholder="e.g. Left the shop"
                autoFocus 
              />
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setDisablingUser(null)}>Keep user</button>
              <button 
                className="btn btn-danger" 
                disabled={!disableReason.trim()} 
                onClick={handleConfirmDisable}
              >
                Disable user
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Password Modal */}
      {tempPasswordModal && (
        <div className="overlay" onClick={() => setTempPasswordModal(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{tempPasswordModal.title}</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
                {tempPasswordModal.note}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  className="input mono" 
                  readOnly 
                  value={tempPasswordModal.value} 
                  style={{ fontSize: 16, letterSpacing: '.06em' }} 
                />
                <button 
                  className="btn btn-outline" 
                  onClick={() => {
                    navigator.clipboard?.writeText(tempPasswordModal.value);
                    showToast('Copied');
                  }}
                >
                  <Copy size={14} />
                </button>
              </div>
              <div className="alert alert-warn" style={{ marginTop: 12 }}>
                This is shown only once. It is stored encrypted and cannot be seen again.
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" onClick={() => setTempPasswordModal(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {sessionsUser && (
        <div className="overlay" onClick={() => setSessionsUser(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3><Monitor size={14} style={{ display: 'inline', marginRight: 6 }} /> Sessions — {sessionsUser.name}</h3>
              <button className="btn btn-ghost" onClick={() => setSessionsUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Signed in</th>
                      <th>Last seen</th>
                      <th>Device</th>
                      <th>IP</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{formatDate(sessionsUser.last_login_at || new Date().toISOString())}</td>
                      <td>{formatDate(new Date().toISOString())}</td>
                      <td style={{ maxWidth: 260, fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title="Chrome 131 on macOS">
                        Chrome 131 on macOS
                      </td>
                      <td className="mono">192.168.1.102</td>
                      <td>
                        <span className="badge badge-green">Active · this device</span>
                      </td>
                      <td></td>
                    </tr>
                    {sessionsUser.active_sessions > 1 && (
                      <tr>
                        <td>{formatDate(new Date(Date.now() - 3600000 * 2).toISOString())}</td>
                        <td>{formatDate(new Date(Date.now() - 3600000).toISOString())}</td>
                        <td style={{ maxWidth: 260, fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title="Firefox 132 on POS Terminal 1">
                          Firefox 132 on POS Terminal 1
                        </td>
                        <td className="mono">192.168.1.105</td>
                        <td>
                          <span className="badge badge-green">Active</span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-xs btn-danger-outline" 
                            onClick={() => {
                              setUsersList(prev => prev.map(u => u.id === sessionsUser.id ? { ...u, active_sessions: Math.max(1, u.active_sessions - 1) } : u));
                              setSessionsUser(prev => prev ? { ...prev, active_sessions: Math.max(1, prev.active_sessions - 1) } : null);
                              showToast('Session ended');
                            }}
                          >
                            End
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-outline" onClick={() => setSessionsUser(null)}>Close</button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  setUsersList(prev => prev.map(u => u.id === sessionsUser.id ? { ...u, active_sessions: 1 } : u));
                  showToast('Signed out everywhere');
                  setSessionsUser(null);
                }}
              >
                Sign out of all devices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface UserFormModalProps {
  user: ERPUser | null;
  roles: UserRole[];
  onClose: () => void;
  onSaved: (user: ERPUser, tempPw?: string) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  roles,
  onClose,
  onSaved
}) => {
  const isEdit = !!user;
  const isOwner = user?.is_owner ?? false;

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [username, setUsername] = useState(user?.username || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>(
    (user?.roles || []).map(r => r.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a full name');
      return;
    }
    if (!email.trim()) {
      alert('Please enter an email address');
      return;
    }

    const assignedRoles = roles.filter(r => selectedRoleIds.includes(r.id));
    if (isOwner) {
      assignedRoles.push({ id: 1, name: 'Owner', systemKey: 'owner' });
    }

    if (isEdit && user) {
      const updated: ERPUser = {
        ...user,
        name: isOwner ? user.name : name.trim(),
        email: isOwner ? user.email : email.trim(),
        username: isOwner ? user.username : username.trim() || null,
        phone: phone.trim() || null,
        roles: isOwner ? user.roles : assignedRoles
      };
      onSaved(updated);
    } else {
      const tempPw = 'Temp-' + Math.floor(1000 + Math.random() * 9000) + '!' + String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const created: ERPUser = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim(),
        username: username.trim() || null,
        phone: phone.trim() || null,
        role: assignedRoles[0]?.systemKey || 'staff',
        is_active: true,
        is_owner: false,
        must_change_password: true,
        failed_logins: 0,
        locked_until: null,
        last_login_at: null,
        disabled_reason: null,
        created_at: new Date().toISOString(),
        row_version: 1,
        roles: assignedRoles,
        active_sessions: 0
      };
      onSaved(created, tempPw);
    }
  };

  const toggleRole = (roleId: number) => {
    setSelectedRoleIds(prev => 
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal modal-md" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-head">
          <h3>{isEdit ? `Edit ${user.name}` : 'Add user'}</h3>
          <button type="button" className="btn btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {isOwner && (
            <div className="alert alert-info">
              <Shield size={14} style={{ display: 'inline', marginRight: 4 }} /> 
              This is the shop owner. Name, email and roles are protected.
            </div>
          )}

          <div className="g2">
            <div className="form-group">
              <label className="label">Full name *</label>
              <input 
                className="input" 
                required 
                value={name} 
                onChange={e => setName(e.target.value)} 
                disabled={isOwner}
              />
            </div>

            <div className="form-group">
              <label className="label">Mobile</label>
              <input 
                className="input" 
                inputMode="numeric" 
                autoComplete="tel" 
                maxLength={10} 
                placeholder="10-digit mobile" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="label">Email *</label>
              <input 
                className="input" 
                type="email" 
                autoComplete="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                disabled={isOwner}
              />
            </div>

            <div className="form-group">
              <label className="label">
                User name <span className="label-optional">(optional, can be used to sign in)</span>
              </label>
              <input 
                className="input" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                disabled={isOwner}
              />
            </div>
          </div>

          {!isOwner && (
            <div className="form-group">
              <label className="label">Roles *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                {roles.map(r => {
                  const isChecked = selectedRoleIds.includes(r.id);
                  return (
                    <label 
                      key={r.id} 
                      className="card" 
                      style={{ 
                        padding: '16px 18px', 
                        borderRadius: 14,
                        cursor: 'pointer',
                        borderColor: isChecked ? 'var(--primary)' : undefined 
                      }}
                    >
                      <span className="check">
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => toggleRole(r.id)} 
                        />
                        {' '}<strong>{r.name}</strong>
                      </span>
                      <div className="helper" style={{ marginLeft: 24 }}>
                        {r.description}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {!isEdit && (
            <div className="alert alert-info">
              A temporary password will be created. The user must change it at first sign-in.
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Save changes' : 'Create user'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UsersSecurityView;

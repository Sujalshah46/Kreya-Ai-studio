import React, { useState } from 'react';
import { 
  Building2, Save, KeyRound, ShieldCheck, CheckCircle2, 
  Upload, Printer, UserPlus, Check, Trash2, Edit3, X, Eye, 
  Coins, Sparkles, Hash, Award, RefreshCw 
} from 'lucide-react';
import type { StoreProfile, UserAccount } from '../../types';
import { mockStore, mockUsers } from '../../data/mockData';

export interface ShopSettingsViewProps {
  store?: StoreProfile;
  onUpdateStore?: (store: StoreProfile) => void;
  users?: UserAccount[];
  onAddUser?: (user: UserAccount) => void;
  onUpdateUser?: (user: UserAccount) => void;
  onDeleteUser?: (id: string) => void;
}

export const ShopSettingsView: React.FC<ShopSettingsViewProps> = ({
  store: initialStore = mockStore,
  onUpdateStore,
  users: initialUsers = mockUsers,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'logo' | 'gst' | 'prefixes' | 'users' | 'security'>('shop');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Shop Profile State
  const [shopName, setShopName] = useState(initialStore?.tradeName || 'S.B Borana Jewellers');
  const [ownerName, setOwnerName] = useState(initialStore?.ownerName || 'Sujal shah');
  const [shopCode, setShopCode] = useState(initialStore?.code || 'SBJ');
  const [address, setAddress] = useState(initialStore?.address || '3-5 Niwas, Vile parle east Mumbai');
  const [city, setCity] = useState(initialStore?.city || 'Mumbai');
  const [state, setState] = useState(initialStore?.state ? `27 - ${initialStore.state}` : '27 - Maharashtra');
  const [pincode, setPincode] = useState(initialStore?.pincode || '400057');
  const [phone, setPhone] = useState(initialStore?.mobile || '9324773823');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState(initialStore?.email || 'sbjrahul01@gmail.com');
  const [gstin, setGstin] = useState(initialStore?.gstin || '27ACZPJ7126B1ZA');
  const [panNo, setPanNo] = useState(initialStore?.pan || 'ACZPJ7126B');
  const [bisLicenseNo, setBisLicenseNo] = useState(initialStore?.bisLicenseNo || 'HM/C-7592841');

  // Logo & Branding State
  const [logoUrl, setLogoUrl] = useState('');
  const [tagline, setTagline] = useState('Exquisite Hallmarked Gold & Diamond Jewellery');
  const [invoiceTerms, setInvoiceTerms] = useState(
    '1. Goods once sold will be accepted for return/exchange as per prevailing store policy.\n2. 100% BIS Hallmarked Jewellery guarantee.\n3. Making charges and taxes subject to government notifications.'
  );

  // GST & Finance Rates
  const [goldGstRate, setGoldGstRate] = useState(3);
  const [silverGstRate, setSilverGstRate] = useState(3);
  const [makingGstRate, setMakingGstRate] = useState(5);
  const [fyStart, setFyStart] = useState('04-01');

  // Prefixes
  const [invPrefix, setInvPrefix] = useState(initialStore?.invoicePrefix || 'INV-2026-');
  const [loanPrefix, setLoanPrefix] = useState('LOAN-2026-');
  const [repPrefix, setRepPrefix] = useState('REP-2026-');
  const [bkgPrefix, setBkgPrefix] = useState('BKG-2026-');
  const [poPrefix, setPoPrefix] = useState('PO-2026-');
  const [grnPrefix, setGrnPrefix] = useState('GRN-2026-');

  // Users
  const [usersList, setUsersList] = useState<UserAccount[]>(
    initialUsers && initialUsers.length > 0 ? initialUsers : [
      {
        id: "usr-001",
        username: "admin",
        fullName: "Admin (Sujal Shah)",
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
    ]
  );

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER'>('CASHIER');
  const [newUserCounter, setNewUserCounter] = useState('MAIN');
  const [newUserPin, setNewUserPin] = useState('1234');

  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updatedStore: StoreProfile = {
      ...initialStore,
      tradeName: shopName,
      legalName: shopName,
      ownerName,
      code: shopCode,
      address,
      city,
      state: state.replace(/^\d+\s*-\s*/, ''),
      stateCode: '27',
      pincode,
      mobile: phone,
      email,
      gstin,
      pan: panNo,
      bisLicenseNo,
      invoicePrefix: invPrefix
    };
    if (onUpdateStore) {
      onUpdateStore(updatedStore);
    }
    setSaveSuccess(`Settings saved — "${shopName}" profile is active across all terminals.`);
    setTimeout(() => setSaveSuccess(null), 4000);
  };

  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    const u: UserAccount = {
      id: `usr-${Date.now()}`,
      username: newUserEmail.split('@')[0],
      fullName: newUserName,
      email: newUserEmail,
      role: newUserRole,
      assignedCounter: newUserCounter,
      pinCode: newUserPin,
      isActive: true,
      lastLogin: "Just now"
    };
    setUsersList(prev => [u, ...prev]);
    if (onAddUser) onAddUser(u);
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setSaveSuccess(`User ${u.fullName} created successfully.`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`Remove user account "${name}"?`)) {
      setUsersList(prev => prev.filter(u => u.id !== id));
      if (onDeleteUser) onDeleteUser(id);
    }
  };

  const tabs: [typeof activeTab, string][] = [
    ['shop', 'Shop Profile'],
    ['logo', 'Logo & Branding'],
    ['gst', 'GST & Finance'],
    ['prefixes', 'Doc Prefixes'],
    ['users', 'Users & Passwords'],
    ['security', 'Appearance & Security']
  ];

  return (
    <div className="page">
      {/* 1. Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Settings</h1>
          <p>Shop profile, GST, users, appearance and security · S.B Borana Jewellers</p>
        </div>
        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => setShowPasswordModal(true)}
          >
            <KeyRound size={13} />
            <span>Change My Password</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => handleSave()}
          >
            <Save size={13} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="card" style={{ marginBottom: 14, background: '#ecfdf5', borderColor: '#10b981', color: '#065f46', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            <span>{saveSuccess}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSaveSuccess(null)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Tabs */}
      <div className="tabs">
        {tabs.map(([id, label]) => (
          <button 
            key={id}
            type="button" 
            className={`tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: Shop Profile */}
      {activeTab === 'shop' && (
        <div className="card">
          <div className="card-header">
            <strong>Showroom Profile &amp; Legal Identity</strong>
          </div>
          <div className="card-body">
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="g2">
                <div className="form-group">
                  <label className="label">Shop Name *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={shopName} 
                    onChange={(e) => setShopName(e.target.value)} 
                    required 
                  />
                  <div className="helper">Trade name printed on invoices, estimates, and certificates</div>
                </div>

                <div className="form-group">
                  <label className="label">Owner Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={ownerName} 
                    onChange={(e) => setOwnerName(e.target.value)} 
                  />
                  <div className="helper">Sole proprietor / Managing Partner</div>
                </div>
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">
                    Shop Code <span className="helper" style={{ display: 'inline' }}>(short code printed on jewellery tags)</span>
                  </label>
                  <input 
                    type="text" 
                    className="input mono" 
                    maxLength={8} 
                    style={{ maxWidth: 200 }} 
                    value={shopCode} 
                    onChange={(e) => setShopCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))} 
                  />
                  <div className="helper">1–8 letters or digits (e.g. SBJ). Prints on 95x14mm thermal barbell tags.</div>
                </div>

                <div className="form-group">
                  <label className="label">BIS Hallmark Licence No</label>
                  <input 
                    type="text" 
                    className="input mono" 
                    value={bisLicenseNo} 
                    onChange={(e) => setBisLicenseNo(e.target.value)} 
                  />
                  <div className="helper">Bureau of Indian Standards gold hallmarking license</div>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Showroom Address</label>
                <textarea 
                  className="input" 
                  rows={2} 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                />
              </div>

              <div className="g3">
                <div className="form-group">
                  <label className="label">City</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="label">State</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={state} 
                    onChange={(e) => setState(e.target.value)} 
                  />
                  <div className="helper">State code: 27 (Maharashtra)</div>
                </div>

                <div className="form-group">
                  <label className="label">PIN Code *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={pincode} 
                    onChange={(e) => setPincode(e.target.value)} 
                    required 
                  />
                </div>
              </div>

              <div className="g3">
                <div className="form-group">
                  <label className="label">Shop Mobile / Phone</label>
                  <input 
                    type="tel" 
                    className="input" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                  />
                  <div className="helper">Receives customer billing SMS alerts</div>
                </div>

                <div className="form-group">
                  <label className="label">Alternate Phone</label>
                  <input 
                    type="tel" 
                    className="input" 
                    value={phone2} 
                    onChange={(e) => setPhone2(e.target.value)} 
                  />
                </div>

                <div className="form-group">
                  <label className="label">Email Address</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                  />
                </div>
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">
                    GSTIN <span className="helper" style={{ display: 'inline' }}>(15-character statutory GST identification)</span>
                  </label>
                  <input 
                    type="text" 
                    className="input mono" 
                    maxLength={15} 
                    value={gstin} 
                    onChange={(e) => setGstin(e.target.value.toUpperCase())} 
                  />
                  <div className="helper">State code: 27 (Maharashtra) · Verified on GST Portal</div>
                </div>

                <div className="form-group">
                  <label className="label">PAN Number</label>
                  <input 
                    type="text" 
                    className="input mono" 
                    maxLength={10} 
                    value={panNo} 
                    onChange={(e) => setPanNo(e.target.value.toUpperCase())} 
                  />
                  <div className="helper">Income tax permanent account number</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={13} />
                  <span>Save Showroom Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Logo & Branding */}
      {activeTab === 'logo' && (
        <div className="card">
          <div className="card-header">
            <strong>Showroom Brand Assets &amp; Invoice Styling</strong>
          </div>
          <div className="card-body">
            <div className="g2" style={{ alignItems: 'start', marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', padding: 20, background: 'var(--zebra)', borderRadius: 10, border: '1px dashed var(--border2)' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ maxHeight: 120, objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: 100, height: 100, borderRadius: 12, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800 }}>
                    SBJ
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700 }}>{shopName}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Logo prints on thermal bills &amp; A4 tax invoices</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="label">Logo Image URL</label>
                  <input 
                    type="url" 
                    className="input" 
                    placeholder="https://example.com/sbj-logo.png" 
                    value={logoUrl} 
                    onChange={(e) => setLogoUrl(e.target.value)} 
                  />
                  <div className="helper">PNG or JPG with transparent or white background recommended</div>
                </div>

                <div className="form-group">
                  <label className="label">Invoice Header Tagline</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={tagline} 
                    onChange={(e) => setTagline(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Default Invoice Terms &amp; Conditions</label>
              <textarea 
                className="input" 
                rows={4} 
                value={invoiceTerms} 
                onChange={(e) => setInvoiceTerms(e.target.value)} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" className="btn btn-primary" onClick={() => handleSave()}>
                <Save size={13} />
                <span>Save Branding Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GST & Finance */}
      {activeTab === 'gst' && (
        <div className="card">
          <div className="card-header">
            <strong>Statutory GST Rates &amp; Financial Parameters</strong>
          </div>
          <div className="card-body">
            <div className="g3" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="label">Gold GST Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  value={goldGstRate} 
                  onChange={(e) => setGoldGstRate(parseFloat(e.target.value) || 0)} 
                />
                <div className="helper">Statutory: 1.5% CGST + 1.5% SGST = 3.0%</div>
              </div>

              <div className="form-group">
                <label className="label">Silver GST Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  value={silverGstRate} 
                  onChange={(e) => setSilverGstRate(parseFloat(e.target.value) || 0)} 
                />
                <div className="helper">Statutory: 3.0% GST</div>
              </div>

              <div className="form-group">
                <label className="label">Making Charges GST (%)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  className="input" 
                  value={makingGstRate} 
                  onChange={(e) => setMakingGstRate(parseFloat(e.target.value) || 0)} 
                />
                <div className="helper">Jobwork making charges (5%)</div>
              </div>
            </div>

            <div className="g2">
              <div className="form-group">
                <label className="label">Financial Year Starting Date</label>
                <input 
                  type="text" 
                  className="input" 
                  value={fyStart} 
                  onChange={(e) => setFyStart(e.target.value)} 
                />
                <div className="helper">Standard Indian Fiscal Year: April 01 (04-01)</div>
              </div>

              <div className="form-group">
                <label className="label">Currency Code</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value="INR (₹)" 
                  readOnly 
                  style={{ background: 'var(--zebra)' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" className="btn btn-primary" onClick={() => handleSave()}>
                <Save size={13} />
                <span>Save GST Parameters</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Doc Prefixes */}
      {activeTab === 'prefixes' && (
        <div className="card">
          <div className="card-header">
            <strong>Document Auto-Numbering Prefixes</strong>
          </div>
          <div className="card-body">
            <div className="g3" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="label">Sales Invoice Prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={invPrefix} 
                  onChange={(e) => setInvPrefix(e.target.value)} 
                />
                <div className="helper">e.g. INV-2026-00001</div>
              </div>

              <div className="form-group">
                <label className="label">Gold Loan Prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={loanPrefix} 
                  onChange={(e) => setLoanPrefix(e.target.value)} 
                />
                <div className="helper">e.g. LOAN-2026-00001</div>
              </div>

              <div className="form-group">
                <label className="label">Repair Order Prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={repPrefix} 
                  onChange={(e) => setRepPrefix(e.target.value)} 
                />
                <div className="helper">e.g. REP-2026-00001</div>
              </div>
            </div>

            <div className="g3">
              <div className="form-group">
                <label className="label">Metal Booking Prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={bkgPrefix} 
                  onChange={(e) => setBkgPrefix(e.target.value)} 
                />
                <div className="helper">e.g. BKG-2026-00001</div>
              </div>

              <div className="form-group">
                <label className="label">Purchase Order Prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={poPrefix} 
                  onChange={(e) => setPoPrefix(e.target.value)} 
                />
                <div className="helper">e.g. PO-2026-00019</div>
              </div>

              <div className="form-group">
                <label className="label">Goods Receipt (GRN) Prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={grnPrefix} 
                  onChange={(e) => setGrnPrefix(e.target.value)} 
                />
                <div className="helper">e.g. GRN-2026-00024</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" className="btn btn-primary" onClick={() => handleSave()}>
                <Save size={13} />
                <span>Save Prefixes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Users & Passwords */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Store Operators &amp; User Accounts ({usersList.length})</strong>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddUserModal(true)}
            >
              <UserPlus size={13} />
              <span>Add User</span>
            </button>
          </div>
          <div className="tbl-wrap tbl-desktop-only">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username / Email</th>
                  <th>Role</th>
                  <th>Assigned Counter</th>
                  <th>Terminal PIN</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                    <td className="mono" style={{ fontSize: 12 }}>{u.email || u.username}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-purple' : u.role === 'MANAGER' ? 'badge-blue' : 'badge-green'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="mono">{u.assignedCounter || 'MAIN'}</td>
                    <td className="mono" style={{ fontSize: 12 }}>••••</td>
                    <td>
                      <span className="badge badge-green">Active</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {u.role !== 'ADMIN' && (
                        <button 
                          type="button" 
                          className="btn btn-xs btn-outline btn-danger"
                          onClick={() => handleDeleteUser(u.id, u.fullName)}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Appearance & Security */}
      {activeTab === 'security' && (
        <div className="card">
          <div className="card-header">
            <strong>Terminal Security &amp; Workstation Session Controls</strong>
          </div>
          <div className="card-body">
            <div className="g2">
              <div className="form-group">
                <label className="label">Cash Register Auto-Lock Idle Timeout</label>
                <select className="input" defaultValue="15">
                  <option value="5">5 Minutes</option>
                  <option value="15">15 Minutes (Recommended)</option>
                  <option value="30">30 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="0">Never auto-lock</option>
                </select>
                <div className="helper">Locks POS screen when cashier is away from showroom floor</div>
              </div>

              <div className="form-group">
                <label className="label">Terminal Authorization Mode</label>
                <select className="input" defaultValue="pin">
                  <option value="pin">4-Digit Quick PIN + Password</option>
                  <option value="password">Full Password Only</option>
                </select>
                <div className="helper">Allows rapid cashier switching during rush hours</div>
              </div>
            </div>

            <div style={{ background: 'var(--zebra)', padding: 14, borderRadius: 10, marginTop: 14, fontSize: 12.5, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 4 }}>
                Active Security Enforcement
              </div>
              <div>
                Tenant ID: <span className="mono font-semibold">788195d6-463b-4f94-bfeb-41aad2c84f5e</span> · Encrypted Session Storage enabled.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
              <button type="button" className="btn btn-primary" onClick={() => handleSave()}>
                <Save size={13} />
                <span>Save Security Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add User */}
      {showAddUserModal && (
        <div className="overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Create User Account</h3>
              <button type="button" className="btn btn-outline btn-xs" onClick={() => setShowAddUserModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddUserSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="label">Full Name *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={newUserName} 
                    onChange={(e) => setNewUserName(e.target.value)} 
                    required 
                    placeholder="e.g. Ramesh Suthar" 
                  />
                </div>

                <div className="form-group">
                  <label className="label">Email / Login ID *</label>
                  <input 
                    type="email" 
                    className="input" 
                    value={newUserEmail} 
                    onChange={(e) => setNewUserEmail(e.target.value)} 
                    required 
                    placeholder="ramesh@sbborana.com" 
                  />
                </div>

                <div className="g2">
                  <div className="form-group">
                    <label className="label">Role</label>
                    <select 
                      className="input" 
                      value={newUserRole} 
                      onChange={(e) => setNewUserRole(e.target.value as any)}
                    >
                      <option value="CASHIER">Cashier (Billing &amp; Inventory Lookup)</option>
                      <option value="MANAGER">Manager (Discounts, Rates &amp; Purchasing)</option>
                      <option value="ADMIN">Administrator (Full Access)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Assigned Showroom Counter</label>
                    <input 
                      type="text" 
                      className="input" 
                      value={newUserCounter} 
                      onChange={(e) => setNewUserCounter(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Quick PIN (4 Digits)</label>
                  <input 
                    type="password" 
                    maxLength={4} 
                    className="input mono" 
                    value={newUserPin} 
                    onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, ''))} 
                    placeholder="1234" 
                  />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Change Password */}
      {showPasswordModal && (
        <div className="overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Change Password</h3>
              <button type="button" className="btn btn-outline btn-xs" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (newPassword !== confirmPassword) {
                alert("Passwords do not match!");
                return;
              }
              setShowPasswordModal(false);
              setSaveSuccess("Password updated successfully.");
              setTimeout(() => setSaveSuccess(null), 3000);
            }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="label">Current Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={currPassword} 
                    onChange={(e) => setCurrPassword(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="label">New Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export { ShopSettingsView as ShopSettingsUsersView };
export default ShopSettingsView;

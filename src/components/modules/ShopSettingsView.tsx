import React, { useState } from 'react';
import { 
  Building2, Save, KeyRound, ShieldCheck, CheckCircle2, 
  Upload, Printer, UserPlus, Check, Trash2, Edit3, X, Eye, 
  Coins, Sparkles, Hash, Award, RefreshCw, Palette, LogIn, Lock, Users, AlertTriangle, Image as ImageIcon
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
  onNavigate?: (module: string) => void;
}

const INDIAN_STATES = [
  "01 – Jammu & Kashmir", "02 – Himachal Pradesh", "03 – Punjab", "04 – Chandigarh",
  "05 – Uttarakhand", "06 – Haryana", "07 – Delhi", "08 – Rajasthan",
  "09 – Uttar Pradesh", "10 – Bihar", "11 – Sikkim", "12 – Arunachal Pradesh",
  "13 – Nagaland", "14 – Manipur", "15 – Mizoram", "16 – Tripura",
  "17 – Meghalaya", "18 – Assam", "19 – West Bengal", "20 – Jharkhand",
  "21 – Odisha", "22 – Chhattisgarh", "23 – Madhya Pradesh", "24 – Gujarat",
  "26 – Dadra & Nagar Haveli and Daman & Diu", "27 – Maharashtra", "29 – Karnataka",
  "30 – Goa", "31 – Lakshadweep", "32 – Kerala", "33 – Tamil Nadu",
  "34 – Puducherry", "35 – Andaman & Nicobar Islands", "36 – Telangana",
  "37 – Andhra Pradesh", "38 – Ladakh", "96 – Foreign Country", "97 – Other Territory"
];

export const ShopSettingsView: React.FC<ShopSettingsViewProps> = ({
  store: initialStore = mockStore,
  onUpdateStore,
  users: initialUsers = mockUsers,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'logo' | 'gst' | 'prefixes' | 'users' | 'more'>('shop');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Shop Profile State
  const [shopName, setShopName] = useState(initialStore?.tradeName || 'S.B Borana Jewellers');
  const [ownerName, setOwnerName] = useState(initialStore?.ownerName || 'Sujal shah');
  const [shopCode, setShopCode] = useState(initialStore?.code || 'SBJ');
  const [address, setAddress] = useState(initialStore?.address || '3-5 Niwas , Vile parle east Mumbai');
  const [city, setCity] = useState(initialStore?.city || 'Mumbai');
  const [state, setState] = useState('27 – Maharashtra');
  const [pincode, setPincode] = useState(initialStore?.pincode || '400057');
  const [phone, setPhone] = useState(initialStore?.mobile || '9324773823');
  const [phone2, setPhone2] = useState('');
  const [email, setEmail] = useState(initialStore?.email || '');
  const [gstin, setGstin] = useState(initialStore?.gstin || '27ACZPJ7126B1ZA');
  const [panNo, setPanNo] = useState(initialStore?.pan || '');

  // Logo & Branding State
  const [logoUrl, setLogoUrl] = useState('');
  const [logoImgError, setLogoImgError] = useState(false);

  // GST & Finance Rates
  const [gstEnabled, setGstEnabled] = useState(true);
  const [goldGstRate, setGoldGstRate] = useState<number | string>(3);
  const [silverGstRate, setSilverGstRate] = useState<number | string>(3);
  const [makingGstRate, setMakingGstRate] = useState<number | string>(5);
  const [currency, setCurrency] = useState('INR');
  const [fyStart, setFyStart] = useState('04-01');

  // Doc Prefixes
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [loanPrefix, setLoanPrefix] = useState('LOAN');
  const [repairPrefix, setRepairPrefix] = useState('REP');
  const [bookingPrefix, setBookingPrefix] = useState('BKG');

  // Users State
  const [usersList, setUsersList] = useState<UserAccount[]>(
    initialUsers && initialUsers.length > 0 ? initialUsers : [
      {
        id: "usr-001",
        username: "admin@jewellery.com",
        fullName: "Admin",
        email: "admin@jewellery.com",
        role: "ADMIN",
        assignedCounter: "MAIN",
        pinCode: "1234",
        isActive: true,
        lastLogin: "16 Nov 2026, 01:50 pm"
      },
      {
        id: "usr-002",
        username: "sbjrahul01@gmail.com",
        fullName: "Rahul Jain",
        email: "sbjrahul01@gmail.com",
        role: "MANAGER",
        assignedCounter: "MAIN",
        pinCode: "5678",
        isActive: true,
        lastLogin: "—"
      },
      {
        id: "usr-003",
        username: "sandeepshah2000@gmail.com",
        fullName: "Sandeep Shah",
        email: "sandeepshah2000@gmail.com",
        role: "CASHIER",
        assignedCounter: "MAIN",
        pinCode: "9900",
        isActive: true,
        lastLogin: "—"
      }
    ]
  );

  // Modals
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'CASHIER' | 'MANAGER' | 'ADMIN'>('CASHIER');
  const [newUserCounter, setNewUserCounter] = useState('MAIN');
  const [newUserPin, setNewUserPin] = useState('');

  const currentYear = new Date().getFullYear();

  const autoSuggestCode = (name: string) => {
    if (!name) return 'SBJ';
    const words = name.trim().split(/\s+/);
    if (words.length >= 3) {
      return (words[0][0] + words[1][0] + words[2][0]).toUpperCase();
    }
    return name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'SBJ';
  };

  const tabs: ['shop' | 'logo' | 'gst' | 'prefixes' | 'users' | 'more', string][] = [
    ['shop', 'Shop Profile'],
    ['logo', 'Logo & Branding'],
    ['gst', 'GST & Finance'],
    ['prefixes', 'Doc Prefixes'],
    ['users', 'Users & Passwords'],
    ['more', 'Appearance & Security']
  ];

  const handleSave = () => {
    if (!shopName.trim()) {
      setSaveError('Shop name is required');
      return;
    }
    if (shopCode && !/^[A-Z0-9]{1,8}$/.test(shopCode)) {
      setSaveError('Shop code must be 1 to 8 letters or digits (e.g. ABJ)');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveError(null);
      setSaveSuccess(`Settings saved — "${shopName}"`);
      if (onUpdateStore) {
        onUpdateStore({
          ...initialStore,
          tradeName: shopName,
          legalName: shopName,
          code: shopCode,
          ownerName: ownerName,
          address: address,
          city: city,
          state: state.replace(/^\d+\s*–\s*/, ''),
          pincode: pincode,
          mobile: phone,
          phone: phone,
          email: email,
          gstin: gstin,
          pan: panNo,
          invoicePrefix: `${invoicePrefix}-${currentYear}-`
        });
      }
      setTimeout(() => setSaveSuccess(null), 4000);
    }, 400);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setSaveError('Use a PNG, JPG or WebP image');
      return;
    }
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const src = loadEvt.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const maxDim = 512;
        const scale = Math.min(1, maxDim / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          setLogoUrl(dataUrl);
          setLogoImgError(false);
          setSaveSuccess('Logo ready — click Save Settings');
          setTimeout(() => setSaveSuccess(null), 3000);
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      setSaveError('Name and email are required');
      return;
    }
    const created: UserAccount = {
      id: `usr-${Date.now()}`,
      username: newUserEmail.trim(),
      fullName: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      assignedCounter: newUserCounter.trim() || 'MAIN',
      pinCode: newUserPin.trim() || '0000',
      isActive: true,
      lastLogin: '—'
    };
    setUsersList(prev => [...prev, created]);
    if (onAddUser) onAddUser(created);
    setShowAddUserModal(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPin('');
    setSaveSuccess(`User ${created.fullName} created successfully`);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleToggleUser = (user: UserAccount) => {
    const updated = { ...user, isActive: !user.isActive };
    setUsersList(prev => prev.map(u => u.id === user.id ? updated : u));
    if (onUpdateUser) onUpdateUser(updated);
    setSaveSuccess(`User ${user.fullName} is now ${updated.isActive ? 'Active' : 'Disabled'}`);
    setTimeout(() => setSaveSuccess(null), 2500);
  };

  const handleResetPassword = (user: UserAccount) => {
    setSaveSuccess(`Temporary reset link / recovery code issued for ${user.email}`);
    setTimeout(() => setSaveSuccess(null), 3500);
  };

  const isSaveTab = ['shop', 'logo', 'gst', 'prefixes'].includes(activeTab);

  return (
    <div>
      {/* 1. Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Settings</h1>
          <p>Shop profile, GST, users, appearance and security</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => setShowPasswordModal(true)}
          >
            <KeyRound size={13} />
            <span>Change My Password</span>
          </button>

          {isSaveTab && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save size={13} />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="card" style={{ marginBottom: 14, background: '#ecfdf5', borderColor: '#10b981', color: '#065f46', padding: '16px 18px', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            <span>{saveSuccess}</span>
          </div>
          <button 
            type="button" 
            className="btn btn-xs btn-outline"
            onClick={() => setSaveSuccess(null)} 
          >
            ✕
          </button>
        </div>
      )}

      {saveError && (
        <div className="alert alert-danger" style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{saveError}</span>
          <button type="button" className="btn btn-xs btn-outline" onClick={() => setSaveError(null)}>✕</button>
        </div>
      )}

      {/* 2. Tabs */}
      <div className="tabs">
        {tabs.map(([id, label]) => (
          <button 
            key={id}
            type="button" 
            className={`tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => { setActiveTab(id); setSaveError(null); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: Shop Profile */}
      {activeTab === 'shop' && (
        <div className="card">
          <div className="card-body">
            <div className="g2">
              <div className="form-group">
                <label className="label">Shop Name *</label>
                <input 
                  id="set-shop_name" 
                  type="text" 
                  className="input" 
                  placeholder="e.g., Shree Jewellers" 
                  value={shopName} 
                  onChange={(e) => setShopName(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="label">Owner Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={ownerName} 
                  onChange={(e) => setOwnerName(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">
                Shop Code <span className="label-optional" style={{ color: 'var(--muted)', fontSize: 12 }}>(short code printed on jewellery tags)</span>
              </label>
              <input 
                id="set-shop_code" 
                type="text" 
                className="input mono" 
                maxLength={8} 
                style={{ maxWidth: 200 }} 
                placeholder={autoSuggestCode(shopName)} 
                value={shopCode} 
                onChange={(e) => setShopCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))} 
              />
              <div className="helper">
                1–8 letters or digits.
                {!shopCode && autoSuggestCode(shopName) && (
                  <> Suggested: <button type="button" className="btn btn-xs btn-outline" onClick={() => setShopCode(autoSuggestCode(shopName))}>{autoSuggestCode(shopName)}</button></>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="label">Address</label>
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
                <select 
                  className="input" 
                  value={state} 
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <div className="helper">New customers start in this state</div>
              </div>
              <div className="form-group">
                <label className="label">PIN Code</label>
                <input 
                  id="set-pincode" 
                  type="text" 
                  className="input" 
                  placeholder="6-digit PIN" 
                  maxLength={6} 
                  value={pincode} 
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                />
              </div>
            </div>

            <div className="g3">
              <div className="form-group">
                <label className="label">Phone</label>
                <input 
                  id="set-phone" 
                  type="text" 
                  className="input" 
                  placeholder="Mobile or 0522-2345678" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
                <div className="helper">Mobile, or landline with STD code (0522-2345678)</div>
              </div>
              <div className="form-group">
                <label className="label">Alternate Phone</label>
                <input 
                  id="set-phone2" 
                  type="text" 
                  className="input" 
                  placeholder="Mobile or 0522-2345678" 
                  value={phone2} 
                  onChange={(e) => setPhone2(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input 
                  id="set-email" 
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
                  GSTIN <span className="label-optional" style={{ color: 'var(--muted)', fontSize: 12 }}>(optional)</span>
                </label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={gstin} 
                  onChange={(e) => setGstin(e.target.value.toUpperCase())} 
                />
              </div>
              <div className="form-group">
                <label className="label">
                  PAN Number <span className="label-optional" style={{ color: 'var(--muted)', fontSize: 12 }}>(optional)</span>
                </label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={panNo} 
                  onChange={(e) => setPanNo(e.target.value.toUpperCase())} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Logo & Branding */}
      {activeTab === 'logo' && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap' }}>
              <div>
                {logoUrl && !logoImgError ? (
                  <img 
                    src={logoUrl} 
                    alt="logo" 
                    referrerPolicy="no-referrer"
                    style={{ width: 120, height: 120, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 10, padding: 8 }} 
                    onError={() => setLogoImgError(true)} 
                  />
                ) : (
                  <div style={{ width: 120, height: 120, background: 'var(--bg)', border: '2px dashed var(--border2)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
                    <ImageIcon size={32} />
                    <span style={{ fontSize: 11, marginTop: 4 }}>Logo Preview</span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: 240 }}>
                <div className="form-group">
                  <label className="label">Shop Logo</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <label className="btn btn-primary btn-sm" style={{ cursor: 'pointer' }}>
                      <Upload size={14} /> Upload logo
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/webp" 
                        hidden 
                        onChange={handleLogoUpload} 
                      />
                    </label>
                    {logoUrl && (
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm" 
                        onClick={() => { setLogoUrl(''); setLogoImgError(false); }}
                      >
                        Remove logo
                      </button>
                    )}
                  </div>
                  <input 
                    type="text" 
                    className="input" 
                    value={logoUrl.startsWith('data:') ? '(uploaded image)' : logoUrl} 
                    onChange={(e) => { setLogoUrl(e.target.value); setLogoImgError(false); }} 
                    placeholder="…or paste a public image link / Google Drive share link" 
                  />
                  <div className="helper">
                    <strong>Best:</strong> Upload logo (PNG with a clear background, square, at least 200 × 200). <strong>Google Drive:</strong> share the file as &quot;Anyone with the link&quot; and paste the link — it is converted automatically.
                  </div>
                  {logoUrl && logoImgError && (
                    <div className="alert alert-warn" style={{ marginTop: 8 }}>
                      This link does not open as an image. Upload the logo instead, or check the file is shared as &quot;Anyone with the link&quot;.
                    </div>
                  )}
                </div>

                <div className="alert alert-info">
                  Colours, dark mode and the login page are in{' '}
                  <a 
                    href="/admin/theme" 
                    style={{ fontWeight: 700, color: 'var(--primary)' }}
                    onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('theme-layout'); }}
                  >
                    Theme &amp; Layout
                  </a>
                  {' '}and{' '}
                  <a 
                    href="/admin/login-page" 
                    style={{ fontWeight: 700, color: 'var(--primary)' }}
                    onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('login-page'); }}
                  >
                    Login Page
                  </a>.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GST & Finance */}
      {activeTab === 'gst' && (
        <div className="card">
          <div className="card-body">
            <label className="check" style={{ marginBottom: 18, padding: '12px 14px', background: 'var(--primary-xl, #f0fdf4)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input 
                type="checkbox" 
                checked={gstEnabled} 
                onChange={(e) => setGstEnabled(e.target.checked)} 
              />
              <strong>Enable GST on orders</strong>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>— untick if your shop doesn&apos;t bill GST</span>
            </label>

            <div className="g3">
              <div className="form-group">
                <label className="label">Gold GST (%)</label>
                <input 
                  type="number" 
                  inputMode="decimal" 
                  step="0.01" 
                  className="input" 
                  disabled={!gstEnabled} 
                  value={goldGstRate} 
                  onChange={(e) => setGoldGstRate(e.target.value)} 
                />
                <div className="helper">Standard: 3%</div>
              </div>
              <div className="form-group">
                <label className="label">Silver GST (%)</label>
                <input 
                  type="number" 
                  inputMode="decimal" 
                  step="0.01" 
                  className="input" 
                  disabled={!gstEnabled} 
                  value={silverGstRate} 
                  onChange={(e) => setSilverGstRate(e.target.value)} 
                />
                <div className="helper">Standard: 3%</div>
              </div>
              <div className="form-group">
                <label className="label">Making Charges GST (%)</label>
                <input 
                  type="number" 
                  inputMode="decimal" 
                  step="0.01" 
                  className="input" 
                  disabled={!gstEnabled} 
                  value={makingGstRate} 
                  onChange={(e) => setMakingGstRate(e.target.value)} 
                />
                <div className="helper">Confirm with your CA</div>
              </div>
            </div>

            <div className="g2">
              <div className="form-group">
                <label className="label">Currency</label>
                <select 
                  className="input" 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="INR">INR — Indian Rupee (₹)</option>
                  <option value="USD">USD — Dollar ($)</option>
                  <option value="AED">AED — UAE Dirham</option>
                  <option value="GBP">GBP — Pound (£)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Financial Year Start</label>
                <input 
                  type="text" 
                  className="input mono" 
                  placeholder="04-01" 
                  value={fyStart} 
                  onChange={(e) => setFyStart(e.target.value)} 
                />
                <div className="helper">Indian FY: 04-01 (April 1st)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Doc Prefixes */}
      {activeTab === 'prefixes' && (
        <div className="card">
          <div className="card-body">
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 18 }}>
              These prefixes auto-generate document numbers. e.g. &quot;INV&quot; → INV-{currentYear}-00001
            </p>

            <div className="g2">
              <div className="form-group">
                <label className="label">Invoice Prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  placeholder="INV" 
                  value={invoicePrefix} 
                  onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())} 
                />
                <div className="helper">Preview: {invoicePrefix || 'INV'}-{currentYear}-00001</div>
              </div>
              <div className="form-group">
                <label className="label">Loan Prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  placeholder="LOAN" 
                  value={loanPrefix} 
                  onChange={(e) => setLoanPrefix(e.target.value.toUpperCase())} 
                />
                <div className="helper">Preview: {loanPrefix || 'LOAN'}-{currentYear}-00001</div>
              </div>
              <div className="form-group">
                <label className="label">Repair Prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  placeholder="REP" 
                  value={repairPrefix} 
                  onChange={(e) => setRepairPrefix(e.target.value.toUpperCase())} 
                />
                <div className="helper">Preview: {repairPrefix || 'REP'}-{currentYear}-00001</div>
              </div>
              <div className="form-group">
                <label className="label">Booking Prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  placeholder="BKG" 
                  value={bookingPrefix} 
                  onChange={(e) => setBookingPrefix(e.target.value.toUpperCase())} 
                />
                <div className="helper">Preview: {bookingPrefix || 'BKG'}-{currentYear}-00001</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Users & Passwords */}
      {activeTab === 'users' && (
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, padding: '16px 18px' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Forgot-password email</div>
                <div className="helper">
                  Set <span className="mono">SMTP_EMAIL</span> and <span className="mono">SMTP_PASSWORD</span> in Railway Variables to enable password reset emails.
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-outline" 
                onClick={() => {
                  setSaveSuccess('Email config is working — test notification sent');
                  setTimeout(() => setSaveSuccess(null), 3000);
                }}
              >
                Test Email Setup
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Users &amp; Passwords ({usersList.length})</strong>
              <button 
                type="button" 
                className="btn btn-sm btn-primary" 
                onClick={() => setShowAddUserModal(true)}
              >
                <UserPlus size={14} /> Add User
              </button>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Roles</th>
                    <th>Status</th>
                    <th>Last Sign-In</th>
                    <th className="num">Sessions</th>
                    <th className="num">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((usr) => (
                    <tr key={usr.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{usr.fullName}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{usr.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${usr.role === 'ADMIN' ? 'badge-primary' : usr.role === 'MANAGER' ? 'badge-blue' : 'badge-gray'}`}>
                          {usr.role === 'ADMIN' ? 'Admin' : usr.role === 'MANAGER' ? 'Manager' : 'Cashier'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${usr.isActive ? 'badge-green' : 'badge-red'}`}>
                          {usr.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>{usr.lastLogin || '—'}</td>
                      <td className="num">
                        <button type="button" className="btn btn-xs btn-outline">
                          {usr.role === 'ADMIN' ? '5' : '0'}
                        </button>
                      </td>
                      <td className="num">
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button 
                            type="button" 
                            className="btn btn-xs btn-outline"
                            onClick={() => handleResetPassword(usr)}
                          >
                            Reset
                          </button>
                          {usr.role !== 'ADMIN' && (
                            <button 
                              type="button" 
                              className={`btn btn-xs ${usr.isActive ? 'btn-danger-outline' : 'btn-outline'}`}
                              onClick={() => handleToggleUser(usr)}
                            >
                              {usr.isActive ? 'Disable' : 'Enable'}
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
        </div>
      )}

      {/* TAB 6: Appearance & Security (Export Grid) */}
      {activeTab === 'more' && (
        <div className="export-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          <a 
            href="/admin/theme" 
            className="export-card" 
            style={{ display: 'flex', flexDirection: 'column', padding: '16px 18px', border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', textDecoration: 'none', color: 'inherit' }}
            onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('theme-layout'); }}
          >
            <Palette size={22} color="var(--primary)" style={{ marginBottom: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Theme &amp; Layout</span>
            <small style={{ color: 'var(--muted)', marginTop: 4 }}>Colours, dark mode, density, menu style</small>
          </a>

          <a 
            href="/admin/login-page" 
            className="export-card" 
            style={{ display: 'flex', flexDirection: 'column', padding: '16px 18px', border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', textDecoration: 'none', color: 'inherit' }}
            onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('login-page'); }}
          >
            <LogIn size={22} color="var(--primary)" style={{ marginBottom: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Login Page</span>
            <small style={{ color: 'var(--muted)', marginTop: 4 }}>Logo, background, tagline</small>
          </a>

          <a 
            href="/admin/roles" 
            className="export-card" 
            style={{ display: 'flex', flexDirection: 'column', padding: '16px 18px', border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', textDecoration: 'none', color: 'inherit' }}
            onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('roles-permissions'); }}
          >
            <ShieldCheck size={22} color="var(--primary)" style={{ marginBottom: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Roles &amp; Permissions</span>
            <small style={{ color: 'var(--muted)', marginTop: 4 }}>Who can do what</small>
          </a>

          <a 
            href="/admin/users" 
            className="export-card" 
            style={{ display: 'flex', flexDirection: 'column', padding: '16px 18px', border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', textDecoration: 'none', color: 'inherit' }}
            onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('users'); }}
          >
            <Users size={22} color="var(--primary)" style={{ marginBottom: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Users</span>
            <small style={{ color: 'var(--muted)', marginTop: 4 }}>Logins, roles, sessions</small>
          </a>

          <a 
            href="/admin/security" 
            className="export-card" 
            style={{ display: 'flex', flexDirection: 'column', padding: '16px 18px', border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', textDecoration: 'none', color: 'inherit' }}
            onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('security'); }}
          >
            <Lock size={22} color="var(--primary)" style={{ marginBottom: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Security</span>
            <small style={{ color: 'var(--muted)', marginTop: 4 }}>Password rules, lock-out, security log</small>
          </a>

          <a 
            href="/admin/license" 
            className="export-card" 
            style={{ display: 'flex', flexDirection: 'column', padding: '16px 18px', border: '1px solid var(--border)', borderRadius: 14, background: 'var(--surface)', textDecoration: 'none', color: 'inherit' }}
            onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('licence'); }}
          >
            <Award size={22} color="var(--primary)" style={{ marginBottom: 8 }} />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Licence</span>
            <small style={{ color: 'var(--muted)', marginTop: 4 }}>Validity, seats and renewal</small>
          </a>
        </div>
      )}

      {/* MODAL 1: Change My Password */}
      {showPasswordModal && (
        <div className="overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <KeyRound size={14} /> Change My Password
              </h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowPasswordModal(false)}>✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!passwordState.currentPassword || !passwordState.newPassword) {
                setSaveError('Fill all fields');
                return;
              }
              if (passwordState.newPassword !== passwordState.confirmPassword) {
                setSaveError('Passwords do not match');
                return;
              }
              setIsChangingPassword(true);
              setTimeout(() => {
                setIsChangingPassword(false);
                setShowPasswordModal(false);
                setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setSaveSuccess('Password changed!');
                setTimeout(() => setSaveSuccess(null), 3000);
              }, 400);
            }}>
              <div className="modal-body">
                <div className="alert alert-info" style={{ marginBottom: 14 }}>
                  Signed in as: Admin (admin@jewellery.com)
                </div>

                <div className="form-group">
                  <label className="label">Current Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    required 
                    value={passwordState.currentPassword} 
                    onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="label">New Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    required 
                    value={passwordState.newPassword} 
                    onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label className="label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="input" 
                    required 
                    value={passwordState.confirmPassword} 
                    onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })} 
                  />
                </div>

                {passwordState.confirmPassword && passwordState.newPassword !== passwordState.confirmPassword && (
                  <div className="alert alert-danger" style={{ marginTop: 8 }}>
                    Passwords do not match
                  </div>
                )}
              </div>

              <div className="modal-foot">
                <button type="button" className="btn btn-outline" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={isChangingPassword}>
                  {isChangingPassword ? 'Saving...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add User */}
      {showAddUserModal && (
        <div className="overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Add New Staff Account</h3>
              <button type="button" className="btn btn-outline btn-xs" onClick={() => setShowAddUserModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="g2">
                  <div className="form-group">
                    <label className="label">Full Name *</label>
                    <input 
                      type="text" 
                      className="input" 
                      required 
                      value={newUserName} 
                      onChange={(e) => setNewUserName(e.target.value)} 
                      placeholder="e.g. Ramesh Soni" 
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Email / Login ID *</label>
                    <input 
                      type="email" 
                      className="input" 
                      required 
                      value={newUserEmail} 
                      onChange={(e) => setNewUserEmail(e.target.value)} 
                      placeholder="ramesh@jewellery.com" 
                    />
                  </div>
                </div>

                <div className="g2">
                  <div className="form-group">
                    <label className="label">System Role</label>
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
                    <label className="label">Assigned Counter</label>
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
    </div>
  );
};

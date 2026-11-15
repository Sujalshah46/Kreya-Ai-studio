import React, { useState } from 'react';
import { 
  Building2, Monitor, Hash, Award, CheckCircle2, AlertTriangle, 
  Plus, Edit, Save, Trash2, ArrowRight, ShieldCheck, 
  CreditCard, Landmark, RefreshCw, KeyRound, Check, X, Search, Filter
} from 'lucide-react';
import { StoreProfile, Counter, UserAccount } from '../../types';

interface StoreProfileCountersViewProps {
  store?: StoreProfile;
  counters?: Counter[];
  users?: UserAccount[];
  onUpdateStore?: (store: StoreProfile) => void;
  onNavigate?: (module: string) => void;
}

export const StoreProfileCountersView: React.FC<StoreProfileCountersViewProps> = ({
  store: initialStore,
  counters: initialCounters,
  users: initialUsers,
  onUpdateStore,
  onNavigate
}) => {
  // Active sub-tab: 'profile' | 'counters' | 'prefixes' | 'hallmarking'
  const [activeTab, setActiveTab] = useState<'profile' | 'counters' | 'prefixes' | 'hallmarking'>('profile');

  // Store Profile State matching "S.B Borana Jewellers", "SBJ", "27ACZPJ7126B1ZA"
  const [tradeName, setTradeName] = useState(initialStore?.tradeName || 'S.B Borana Jewellers');
  const [legalName, setLegalName] = useState(initialStore?.legalName || 'S.B Borana Jewellers Pvt Ltd');
  const [shopCode, setShopCode] = useState(initialStore?.code || 'SBJ');
  const [ownerName, setOwnerName] = useState('Sujal shah');
  const [gstin, setGstin] = useState(initialStore?.gstin || '27ACZPJ7126B1ZA');
  const [panNumber, setPanNumber] = useState(initialStore?.pan || 'ACZPJ7126B');
  const [address, setAddress] = useState(initialStore?.address || '3-5 Niwas, Vile parle east Mumbai');
  const [city, setCity] = useState(initialStore?.city || 'Mumbai');
  const [state, setState] = useState('27 - Maharashtra');
  const [pincode, setPincode] = useState(initialStore?.pincode || '400057');
  const [phone, setPhone] = useState(initialStore?.phone || initialStore?.mobile || '9324773823');
  const [email, setEmail] = useState(initialStore?.email || 'admin@jewellery.com');

  // BIS Hallmarking registration details
  const [bisLicenseNo, setBisLicenseNo] = useState(initialStore?.bisLicenseNo || 'HM/C-7592841');
  const [bisCenterCode, setBisCenterCode] = useState('MH-MUM-042');
  const [assayingCenter, setAssayingCenter] = useState('Mumbai Bullion & Jewellery Assaying Centre');
  const [huidEnabled, setHuidEnabled] = useState(initialStore?.huidRegistered ?? true);
  const [bisValidUntil, setBisValidUntil] = useState('31-Mar-2028');

  // Sequence prefixes
  const [invPrefix, setInvPrefix] = useState(initialStore?.invoicePrefix || 'INV-');
  const [loanPrefix, setLoanPrefix] = useState('LOAN-');
  const [repairPrefix, setRepairPrefix] = useState('REP-');
  const [bookingPrefix, setBookingPrefix] = useState('BKG-');
  const [fyNumbering, setFyNumbering] = useState<'standard' | 'fy'>('standard');
  const [nextInvNumber, setNextInvNumber] = useState('2026-00277');

  // Bank & Settlement Setup
  const [bankName, setBankName] = useState(initialStore?.bankDetails?.bankName || 'HDFC Bank Ltd.');
  const [accountNumber, setAccountNumber] = useState(initialStore?.bankDetails?.accountNumber || '50200084729104');
  const [ifscCode, setIfscCode] = useState(initialStore?.bankDetails?.ifscCode || 'HDFC0000123');
  const [branchName, setBranchName] = useState(initialStore?.bankDetails?.branch || 'Vile Parle East');
  const [upiId, setUpiId] = useState('sbborana@hdfcbank');

  // Feedback alerts
  const [saveAlert, setSaveAlert] = useState<string | null>(null);

  // Counters State
  const defaultCounters = [
    {
      id: 'c1',
      code: 'MAIN',
      name: 'Main Counter',
      subtitle: 'Primary Showroom POS Terminal',
      assignedCashier: 'Admin (Sujal Shah)',
      status: 'closing' as const,
      activeSessionId: 'REG-2026-00001',
      openingCash: 50000,
      currentDrawerCash: 49970,
      lastSync: 'Just now',
      printer: 'Epson TM-T82III (Thermal 80mm)'
    },
    {
      id: 'c2',
      code: 'COUNTER2',
      name: 'Counter 2 (Retail Diamond)',
      subtitle: 'Diamond & Precious Stones Gallery',
      assignedCashier: 'Rahul Jain',
      status: 'open' as const,
      activeSessionId: 'REG-2026-00002',
      openingCash: 25000,
      currentDrawerCash: 25000,
      lastSync: '4 mins ago',
      printer: 'Citizen CT-S310II'
    },
    {
      id: 'c3',
      code: 'POS1',
      name: 'Express Billing POS 1',
      subtitle: 'Fast Checkout & Silver Ornaments',
      assignedCashier: 'Sandeep Shah',
      status: 'closed' as const,
      activeSessionId: null,
      openingCash: 0,
      currentDrawerCash: 0,
      lastSync: '12-Nov-2026',
      printer: 'Network Printer 192.168.1.180'
    }
  ];

  const [countersList, setCountersList] = useState(defaultCounters);
  const [counterSearch, setCounterSearch] = useState('');
  const [counterFilterStatus, setCounterFilterStatus] = useState<'ALL' | 'open' | 'closing' | 'closed'>('ALL');

  // Modal State for Counter Add/Edit
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [editingCounterId, setEditingCounterId] = useState<string | null>(null);
  const [counterFormCode, setCounterFormCode] = useState('');
  const [counterFormName, setCounterFormName] = useState('');
  const [counterFormSubtitle, setCounterFormSubtitle] = useState('');
  const [counterFormCashier, setCounterFormCashier] = useState('Admin (Sujal Shah)');
  const [counterFormPrinter, setCounterFormPrinter] = useState('Thermal 80mm');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateStore) {
      onUpdateStore({
        id: initialStore?.id || '1',
        tradeName,
        legalName,
        code: shopCode,
        gstin,
        pan: panNumber,
        address,
        city,
        state,
        stateCode: '27',
        pincode,
        phone,
        email,
        mobile: phone,
        invoicePrefix: invPrefix,
        bisLicenseNo,
        huidRegistered: huidEnabled,
        bankDetails: {
          bankName,
          accountNumber,
          ifscCode,
          branch: branchName
        }
      });
    }
    setSaveAlert('Store Profile & Statutory details saved successfully!');
    setTimeout(() => setSaveAlert(null), 3500);
  };

  const handleOpenAddCounter = () => {
    setEditingCounterId(null);
    setCounterFormCode('');
    setCounterFormName('');
    setCounterFormSubtitle('');
    setCounterFormCashier('Admin (Sujal Shah)');
    setCounterFormPrinter('Thermal 80mm');
    setIsCounterModalOpen(true);
  };

  const handleOpenEditCounter = (c: typeof defaultCounters[0]) => {
    setEditingCounterId(c.id);
    setCounterFormCode(c.code);
    setCounterFormName(c.name);
    setCounterFormSubtitle(c.subtitle);
    setCounterFormCashier(c.assignedCashier);
    setCounterFormPrinter(c.printer);
    setIsCounterModalOpen(true);
  };

  const handleSaveCounterForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterFormCode.trim() || !counterFormName.trim()) return;

    if (editingCounterId) {
      setCountersList(prev => prev.map(c => c.id === editingCounterId ? {
        ...c,
        code: counterFormCode.toUpperCase().trim(),
        name: counterFormName.trim(),
        subtitle: counterFormSubtitle.trim(),
        assignedCashier: counterFormCashier,
        printer: counterFormPrinter
      } : c));
      setSaveAlert(`Counter ${counterFormCode.toUpperCase()} updated successfully!`);
    } else {
      const newCounter = {
        id: `c_${Date.now()}`,
        code: counterFormCode.toUpperCase().trim(),
        name: counterFormName.trim(),
        subtitle: counterFormSubtitle.trim() || 'Showroom POS Station',
        assignedCashier: counterFormCashier,
        status: 'closed' as const,
        activeSessionId: null,
        openingCash: 0,
        currentDrawerCash: 0,
        lastSync: 'Just now',
        printer: counterFormPrinter
      };
      setCountersList(prev => [...prev, newCounter]);
      setSaveAlert(`Counter ${newCounter.code} added to showroom network!`);
    }

    setIsCounterModalOpen(false);
    setTimeout(() => setSaveAlert(null), 3500);
  };

  const handleDeleteCounter = (id: string, code: string) => {
    if (code === 'MAIN') {
      alert('The primary MAIN counter cannot be deleted.');
      return;
    }
    if (confirm(`Remove counter ${code} from this showroom profile?`)) {
      setCountersList(prev => prev.filter(c => c.id !== id));
      setSaveAlert(`Counter ${code} removed.`);
      setTimeout(() => setSaveAlert(null), 3000);
    }
  };

  const filteredCounters = countersList.filter(c => {
    if (counterFilterStatus !== 'ALL' && c.status !== counterFilterStatus) return false;
    if (counterSearch.trim()) {
      const q = counterSearch.toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.assignedCashier.toLowerCase().includes(q) ||
        (c.activeSessionId && c.activeSessionId.toLowerCase().includes(q))
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
            <h1 className="text-xl font-bold tracking-tight">Store Profile & Counters</h1>
            {/* Header banner Counter badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper text-xs text-slate-500 mt-1">
            Store identity, GSTIN registration, BIS Hallmarking center, document sequence prefixes & active POS terminal network · {tradeName} ({shopCode})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'counters' ? (
            <button 
              type="button"
              onClick={handleOpenAddCounter}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>+ Add POS Counter</span>
            </button>
          ) : (
            <button 
              type="button"
              onClick={handleSaveProfile}
              className="btn btn-primary btn-sm flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>Save Configuration</span>
            </button>
          )}
        </div>
      </div>

      {/* Save Notification */}
      {saveAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center gap-2 mb-3 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{saveAlert}</span>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="tabs mb-4 flex border-b border-slate-200">
        <button 
          type="button" 
          className={`tab px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'profile' ? 'border-[#237a57] text-[#237a57] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('profile')}
        >
          <div className="flex items-center gap-1.5">
            <Building2 size={14} />
            <span>Store Profile & GST</span>
          </div>
        </button>

        <button 
          type="button" 
          className={`tab px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'counters' ? 'border-[#237a57] text-[#237a57] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('counters')}
        >
          <div className="flex items-center gap-1.5">
            <Monitor size={14} />
            <span>Showroom Counters ({countersList.length})</span>
          </div>
        </button>

        <button 
          type="button" 
          className={`tab px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'prefixes' ? 'border-[#237a57] text-[#237a57] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('prefixes')}
        >
          <div className="flex items-center gap-1.5">
            <Hash size={14} />
            <span>Invoice & Document Prefixes</span>
          </div>
        </button>

        <button 
          type="button" 
          className={`tab px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === 'hallmarking' ? 'border-[#237a57] text-[#237a57] font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('hallmarking')}
        >
          <div className="flex items-center gap-1.5">
            <Award size={14} />
            <span>BIS Hallmarking & Bank Setup</span>
          </div>
        </button>
      </div>

      {/* TAB 1: STORE PROFILE & GST */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Legal Entity Card */}
            <div className="card">
              <div className="card-header border-b border-slate-100 p-3 bg-slate-50 flex items-center justify-between">
                <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Legal Entity & Showroom Identity
                </span>
                <span className="badge badge-indigo text-[10px] font-mono">CODE: {shopCode}</span>
              </div>
              <div className="card-body p-4 space-y-3">
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Legal Trade Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    className="input w-full text-xs" 
                    placeholder="e.g. S.B Borana Jewellers"
                    required
                  />
                  <p className="helper text-[11px] text-slate-400 mt-0.5">Printed at the header of all tax invoices and estimates</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs font-semibold text-slate-700 block mb-1">
                      Shop Code Prefix <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={shopCode}
                      onChange={(e) => setShopCode(e.target.value.toUpperCase())}
                      className="input w-full text-xs font-mono font-bold uppercase" 
                      maxLength={6}
                      placeholder="SBJ"
                      required
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold text-slate-700 block mb-1">
                      Proprietor / Managing Director
                    </label>
                    <input 
                      type="text" 
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="input w-full text-xs" 
                      placeholder="Sujal shah"
                    />
                  </div>
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Registered Company Name
                  </label>
                  <input 
                    type="text" 
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="input w-full text-xs" 
                    placeholder="S.B Borana Jewellers Pvt Ltd"
                  />
                </div>
              </div>
            </div>

            {/* GSTIN & Tax Registration */}
            <div className="card">
              <div className="card-header border-b border-slate-100 p-3 bg-slate-50 flex items-center justify-between">
                <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
                  GSTIN & Tax Identifiers
                </span>
                <span className="badge badge-green text-[10px]">Verified Active</span>
              </div>
              <div className="card-body p-4 space-y-3">
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    GSTIN (15 Digits) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="input w-full text-xs font-mono font-bold uppercase text-[#237a57]" 
                    maxLength={15}
                    placeholder="27ACZPJ7126B1ZA"
                    required
                  />
                  <p className="helper text-[11px] text-slate-400 mt-0.5">State code: 27 (Maharashtra) · Verified on GST portal</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs font-semibold text-slate-700 block mb-1">
                      PAN Identifier
                    </label>
                    <input 
                      type="text" 
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      className="input w-full text-xs font-mono font-semibold uppercase" 
                      maxLength={10}
                      placeholder="ACZPJ7126B"
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold text-slate-700 block mb-1">
                      State Jurisdiction
                    </label>
                    <input 
                      type="text" 
                      value={state}
                      disabled
                      className="input w-full text-xs bg-slate-50 text-slate-600 cursor-not-allowed" 
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-800">
                  <strong>GST Jewellery Rule:</strong> 3% IGST on inter-state gold/silver bullion; 1.5% CGST + 1.5% SGST on intra-state jewellery sales.
                </div>
              </div>
            </div>

            {/* Showroom Address */}
            <div className="card md:col-span-2">
              <div className="card-header border-b border-slate-100 p-3 bg-slate-50">
                <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Showroom Address & Direct Contacts
                </span>
              </div>
              <div className="card-body p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Street Address / Showroom Premises <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input w-full text-xs" 
                    placeholder="3-5 Niwas , Vile parle east Mumbai"
                    required
                  />
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="input w-full text-xs font-mono" 
                    maxLength={6}
                    placeholder="400057"
                    required
                  />
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    City
                  </label>
                  <input 
                    type="text" 
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input w-full text-xs" 
                    placeholder="Mumbai"
                  />
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Primary Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input w-full text-xs font-mono" 
                    placeholder="9324773823"
                    required
                  />
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Official Support Email
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input w-full text-xs font-mono" 
                    placeholder="admin@jewellery.com"
                  />
                </div>
              </div>
            </div>

          </div>
        </form>
      )}

      {/* TAB 2: SHOWROOM COUNTERS */}
      {activeTab === 'counters' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="card p-3 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="search-box relative w-full">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search counters by code, name, or cashier..."
                  value={counterSearch}
                  onChange={(e) => setCounterSearch(e.target.value)}
                  className="input input-sm w-full pl-8 text-xs"
                />
                {counterSearch && (
                  <button 
                    onClick={() => setCounterSearch('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <div className="seg flex rounded border border-slate-200 overflow-hidden text-xs">
                {(['ALL', 'open', 'closing', 'closed'] as const).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setCounterFilterStatus(st)}
                    className={`px-2.5 py-1 text-xs font-medium capitalize transition-colors ${counterFilterStatus === st ? 'bg-slate-800 text-white font-bold' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {st === 'ALL' ? 'All Counters' : st}
                  </button>
                ))}
              </div>

              <button 
                type="button"
                onClick={handleOpenAddCounter}
                className="btn btn-primary btn-sm flex items-center gap-1.5 ml-2"
              >
                <Plus size={14} />
                <span>Add Counter</span>
              </button>
            </div>
          </div>

          {/* Counters Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {countersList.map(c => {
              const isOpen = c.status === 'open';
              const isClosing = c.status === 'closing';
              const isMain = c.code === 'MAIN';

              return (
                <div 
                  key={c.id} 
                  className={`card transition-shadow hover:shadow-md border-l-4 ${
                    isClosing ? 'border-l-amber-500' :
                    isOpen ? 'border-l-emerald-500' : 'border-l-slate-300'
                  }`}
                >
                  <div className="card-header p-3 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{c.code}</span>
                      {isMain && (
                        <span className="badge badge-indigo text-[10px]">PRIMARY</span>
                      )}
                    </div>
                    <span className={`badge ${
                      isClosing ? 'badge-yellow text-amber-800' :
                      isOpen ? 'badge-green text-emerald-800' : 'badge-gray text-slate-600'
                    }`}>
                      ● {c.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="card-body p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{c.name}</h4>
                      <p className="text-[11px] text-slate-400">{c.subtitle}</p>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded border border-slate-100 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Assigned Cashier:</span>
                        <span className="font-semibold text-slate-800">{c.assignedCashier}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Active Register Session:</span>
                        {c.activeSessionId ? (
                          <button 
                            type="button"
                            onClick={() => onNavigate ? onNavigate('cash-register') : alert(`Navigating to session ${c.activeSessionId}`)}
                            className="font-mono text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                          >
                            <span>{c.activeSessionId}</span>
                            <ArrowRight size={10} />
                          </button>
                        ) : (
                          <span className="font-mono text-slate-400">None (Closed)</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Drawer Opening Cash:</span>
                        <span className="font-mono font-medium">₹{c.openingCash.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current Cash in Till:</span>
                        <span className="font-mono font-bold text-slate-900">₹{c.currentDrawerCash.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Slip Printer:</span>
                        <span className="text-[11px] text-slate-600 truncate max-w-[150px]">{c.printer}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">Sync: {c.lastSync}</span>
                      <div className="flex items-center gap-1.5">
                        <button 
                          type="button"
                          onClick={() => handleOpenEditCounter(c)}
                          className="btn btn-outline btn-sm py-1 px-2 text-xs flex items-center gap-1"
                          title="Edit Counter Settings"
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </button>
                        {!isMain && (
                          <button 
                            type="button"
                            onClick={() => handleDeleteCounter(c.id, c.code)}
                            className="btn btn-outline btn-sm py-1 px-2 text-xs text-red-600 hover:bg-red-50 border-red-200"
                            title="Delete Counter"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pristine Empty State */}
          {filteredCounters.length === 0 && (
            <div className="card p-12 text-center bg-white border border-dashed border-slate-200 rounded-lg">
              <Monitor size={36} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-semibold text-slate-700">No Showroom Counters Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No POS counters match filter "{counterFilterStatus}" or query "{counterSearch}".
              </p>
              <button
                type="button"
                onClick={() => { setCounterSearch(''); setCounterFilterStatus('ALL'); }}
                className="btn btn-outline btn-sm mt-3"
              >
                Reset Counter Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVOICE & DOCUMENT PREFIXES */}
      {activeTab === 'prefixes' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-header border-b border-slate-100 p-3 bg-slate-50 flex items-center justify-between">
              <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
                Statutory Invoice Serial Sequences & Document Prefixes
              </span>
              <span className="badge badge-green text-[10px]">Rule 46 Compliant</span>
            </div>
            <div className="card-body p-4 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Section 31 of CGST Act read with Rule 46 requires sequential numbering unique for each financial year, containing only alphabets, numerals, and special characters (/ or -).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Sales Tax Invoice Prefix</label>
                    <span className="text-[10px] font-mono text-slate-400">Next: {invPrefix}{nextInvNumber}</span>
                  </div>
                  <input 
                    type="text"
                    value={invPrefix}
                    onChange={(e) => setInvPrefix(e.target.value.toUpperCase())}
                    className="input w-full text-xs font-mono font-bold"
                    placeholder="INV-"
                  />
                  <p className="helper text-[11px] text-slate-500">Sample output: {invPrefix}2026-00001</p>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Gold & Silver Girvi Loan Prefix</label>
                    <span className="text-[10px] font-mono text-slate-400">Sample: {loanPrefix}2026-00014</span>
                  </div>
                  <input 
                    type="text"
                    value={loanPrefix}
                    onChange={(e) => setLoanPrefix(e.target.value.toUpperCase())}
                    className="input w-full text-xs font-mono font-bold"
                    placeholder="LOAN-"
                  />
                  <p className="helper text-[11px] text-slate-500">Sample output: {loanPrefix}2026-00001</p>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Jewellery Repair Order Prefix</label>
                    <span className="text-[10px] font-mono text-slate-400">Sample: {repairPrefix}2026-00009</span>
                  </div>
                  <input 
                    type="text"
                    value={repairPrefix}
                    onChange={(e) => setRepairPrefix(e.target.value.toUpperCase())}
                    className="input w-full text-xs font-mono font-bold"
                    placeholder="REP-"
                  />
                  <p className="helper text-[11px] text-slate-500">Sample output: {repairPrefix}2026-00001</p>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">Advance Metal Booking Prefix</label>
                    <span className="text-[10px] font-mono text-slate-400">Sample: {bookingPrefix}2026-00005</span>
                  </div>
                  <input 
                    type="text"
                    value={bookingPrefix}
                    onChange={(e) => setBookingPrefix(e.target.value.toUpperCase())}
                    className="input w-full text-xs font-mono font-bold"
                    placeholder="BKG-"
                  />
                  <p className="helper text-[11px] text-slate-500">Sample output: {bookingPrefix}2026-00001</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  type="button"
                  onClick={handleSaveProfile}
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>Update Sequence Prefixes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BIS HALLMARKING & BANK SETUP */}
      {activeTab === 'hallmarking' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* BIS Hallmarking Card */}
            <div className="card">
              <div className="card-header border-b border-slate-100 p-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-amber-600" />
                  <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
                    BIS Hallmarking Certified Registration
                  </span>
                </div>
                <span className="badge badge-yellow text-[10px]">Mandatory HUID</span>
              </div>
              <div className="card-body p-4 space-y-3">
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    BIS Hallmarking License No. <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={bisLicenseNo}
                    onChange={(e) => setBisLicenseNo(e.target.value)}
                    className="input w-full text-xs font-mono font-bold text-slate-900"
                    placeholder="HM/C-7592841"
                  />
                  <p className="helper text-[11px] text-slate-400 mt-0.5">Assigned by Bureau of Indian Standards (Govt. of India)</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs font-semibold text-slate-700 block mb-1">
                      Assaying Center Code
                    </label>
                    <input 
                      type="text"
                      value={bisCenterCode}
                      onChange={(e) => setBisCenterCode(e.target.value)}
                      className="input w-full text-xs font-mono"
                      placeholder="MH-MUM-042"
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold text-slate-700 block mb-1">
                      License Validity
                    </label>
                    <input 
                      type="text"
                      value={bisValidUntil}
                      onChange={(e) => setBisValidUntil(e.target.value)}
                      className="input w-full text-xs font-mono"
                      placeholder="31-Mar-2028"
                    />
                  </div>
                </div>

                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Assaying & Hallmarking Center Name
                  </label>
                  <input 
                    type="text"
                    value={assayingCenter}
                    onChange={(e) => setAssayingCenter(e.target.value)}
                    className="input w-full text-xs"
                    placeholder="Mumbai Bullion & Jewellery Assaying Centre"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input 
                      type="checkbox"
                      checked={huidEnabled}
                      onChange={(e) => setHuidEnabled(e.target.checked)}
                      className="rounded text-[#237a57]"
                    />
                    <span>Enforce 6-character alphanumeric HUID stamping validation on tag creation</span>
                  </label>
                  <p className="text-[11px] text-slate-400 pl-5 mt-0.5">
                    Ensures strict compliance with Ministry of Consumer Affairs guidelines.
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Settlement & QR Code */}
            <div className="card">
              <div className="card-header border-b border-slate-100 p-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark size={16} className="text-blue-600" />
                  <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Bank Account & Dynamic UPI QR
                  </span>
                </div>
                <span className="badge badge-green text-[10px]">Auto Printed on Bill</span>
              </div>
              <div className="card-body p-4 space-y-3">
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Beneficiary Bank Name
                  </label>
                  <input 
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="input w-full text-xs font-medium"
                    placeholder="HDFC Bank Ltd."
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs font-semibold text-slate-700 block mb-1">
                      Current Account No.
                    </label>
                    <input 
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="input w-full text-xs font-mono font-bold"
                      placeholder="50200084729104"
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold text-slate-700 block mb-1">
                      IFSC Code
                    </label>
                    <input 
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      className="input w-full text-xs font-mono uppercase font-bold"
                      placeholder="HDFC0000123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-xs font-semibold text-slate-700 block mb-1">
                      Branch Location
                    </label>
                    <input 
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="input w-full text-xs"
                      placeholder="Vile Parle East"
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-semibold text-slate-700 block mb-1">
                      Showroom UPI ID (VPA)
                    </label>
                    <input 
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="input w-full text-xs font-mono text-blue-700 font-bold"
                      placeholder="sbborana@hdfcbank"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-blue-50 rounded border border-blue-200 text-[11px] text-blue-800">
                  A dynamic UPI QR code with encoded invoice number and net bill amount will be printed on sales slips for instant customer scanning.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SHOWROOM COUNTER */}
      {isCounterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#237a57]" />
                <h3 className="font-bold text-sm text-slate-800">
                  {editingCounterId ? `Edit Counter ${counterFormCode}` : 'Register New POS Counter'}
                </h3>
              </div>
              <button 
                onClick={() => setIsCounterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCounterForm} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Counter Code <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    value={counterFormCode}
                    onChange={(e) => setCounterFormCode(e.target.value.toUpperCase())}
                    className="input w-full text-xs font-mono font-bold uppercase"
                    placeholder="e.g. POS2"
                    required
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold text-slate-700 block mb-1">
                    Slip / Bill Printer
                  </label>
                  <select 
                    value={counterFormPrinter}
                    onChange={(e) => setCounterFormPrinter(e.target.value)}
                    className="input w-full text-xs"
                  >
                    <option value="Epson TM-T82III (Thermal 80mm)">Epson TM-T82III (Thermal 80mm)</option>
                    <option value="Citizen CT-S310II">Citizen CT-S310II</option>
                    <option value="LaserJet A4/A5">LaserJet A4/A5</option>
                    <option value="Network Printer">Network Printer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label text-xs font-semibold text-slate-700 block mb-1">
                  Counter Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  value={counterFormName}
                  onChange={(e) => setCounterFormName(e.target.value)}
                  className="input w-full text-xs font-medium"
                  placeholder="e.g. Diamond Gallery Counter"
                  required
                />
              </div>

              <div>
                <label className="label text-xs font-semibold text-slate-700 block mb-1">
                  Location / Department Subtitle
                </label>
                <input 
                  type="text"
                  value={counterFormSubtitle}
                  onChange={(e) => setCounterFormSubtitle(e.target.value)}
                  className="input w-full text-xs"
                  placeholder="e.g. 1st Floor High Value Bridal Section"
                />
              </div>

              <div>
                <label className="label text-xs font-semibold text-slate-700 block mb-1">
                  Assigned Cashier / Operator
                </label>
                <select 
                  value={counterFormCashier}
                  onChange={(e) => setCounterFormCashier(e.target.value)}
                  className="input w-full text-xs"
                >
                  <option value="Admin (Sujal Shah)">Admin (Sujal Shah) - Owner</option>
                  <option value="Rahul Jain">Rahul Jain - Cashier</option>
                  <option value="Sandeep Shah">Sandeep Shah - Manager</option>
                  <option value="Unassigned Standby">Unassigned Standby Terminal</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsCounterModalOpen(false)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary btn-sm flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{editingCounterId ? 'Update Counter' : 'Create Counter'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { 
  PiggyBank, Plus, Search, Calendar, CheckCircle2, 
  DollarSign, ArrowRight, User, X, ShieldCheck, Printer,
  AlertTriangle, Clock, Sparkles, CreditCard, Check, Gift
} from 'lucide-react';
import { SavingScheme, Customer, StoreProfile, PaymentMode, SchemeStatus } from '../../types';

interface SavingsSchemesViewProps {
  store: StoreProfile;
  schemes: SavingScheme[];
  customers: Customer[];
  onSaveScheme: (scheme: SavingScheme) => void;
  onPayInstallment: (schemeId: string, amount: number, mode?: PaymentMode) => void;
}

const DEFAULT_SAMPLE_SCHEMES: SavingScheme[] = [
  {
    id: 'sch-001',
    schemeNo: 'SCH-2026-00013',
    customer: {
      id: 'cust-102',
      code: 'CUST-00102',
      name: 'Sunita Sharma',
      phone: '9810554433',
      mobile: '9810554433',
      address: 'Beta 2, Greater Noida',
      state: 'Uttar Pradesh',
      stateCode: '09'
    },
    schemeName: 'Swarna Nidhi 11+1 Gold Savings',
    monthlyInstallment: 5000,
    totalMonths: 11,
    bonusMonths: 1,
    bonusInstalments: 1,
    bonusAmount: 5000,
    totalPaid: 25000,
    totalAmountPaid: 25000,
    installmentsPaid: 5,
    atMaturityValue: 60000,
    startDate: '2026-06-15',
    endDate: '2027-05-15',
    nextDueDate: '2026-11-15',
    status: 'ACTIVE',
    notes: 'Monthly savings for daughter wedding jewellery',
    installments: [
      { monthIndex: 1, date: '2026-06-15', amount: 5000, mode: 'UPI', receiptNo: 'REC-SCH-13-01' },
      { monthIndex: 2, date: '2026-07-15', amount: 5000, mode: 'CASH', receiptNo: 'REC-SCH-13-02' },
      { monthIndex: 3, date: '2026-08-15', amount: 5000, mode: 'UPI', receiptNo: 'REC-SCH-13-03' },
      { monthIndex: 4, date: '2026-09-15', amount: 5000, mode: 'UPI', receiptNo: 'REC-SCH-13-04' },
      { monthIndex: 5, date: '2026-10-15', amount: 5000, mode: 'CASH', receiptNo: 'REC-SCH-13-05' }
    ]
  },
  {
    id: 'sch-002',
    schemeNo: 'SCH-2026-00014',
    customer: {
      id: 'cust-103',
      code: 'CUST-00103',
      name: 'Pooja Agarwal',
      phone: '9876543210',
      mobile: '9876543210',
      address: 'Alpha 1, Greater Noida',
      state: 'Uttar Pradesh',
      stateCode: '09'
    },
    schemeName: 'Dhanvarsha 11+1 Scheme',
    monthlyInstallment: 10000,
    totalMonths: 11,
    bonusMonths: 1,
    bonusInstalments: 1,
    bonusAmount: 10000,
    totalPaid: 110000,
    totalAmountPaid: 110000,
    installmentsPaid: 11,
    atMaturityValue: 120000,
    startDate: '2025-12-01',
    endDate: '2026-11-01',
    nextDueDate: '2026-11-01',
    status: 'MATURED',
    notes: 'All 11 installments completed. Ready for gold redemption!',
    installments: Array.from({ length: 11 }).map((_, i) => ({
      monthIndex: i + 1,
      date: `2026-${String(i + 1).padStart(2, '0')}-01`,
      amount: 10000,
      mode: 'UPI',
      receiptNo: `REC-SCH-14-${String(i + 1).padStart(2, '0')}`
    }))
  }
];

export const SavingsSchemesView: React.FC<SavingsSchemesViewProps> = ({
  store,
  schemes: propSchemes,
  customers,
  onSaveScheme,
  onPayInstallment
}) => {
  const schemes = propSchemes && propSchemes.length > 0 ? propSchemes : DEFAULT_SAMPLE_SCHEMES;
  const [selectedScheme, setSelectedScheme] = useState<SavingScheme | null>(schemes[0] || null);
  const [statusFilter, setStatusFilter] = useState<'active' | 'redeemed' | 'all'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const [showNewSchemeModal, setShowNewSchemeModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showPassbookModal, setShowPassbookModal] = useState(false);

  // New Scheme Form
  const [custSearchTerm, setCustSearchTerm] = useState('');
  const [selectedCustId, setSelectedCustId] = useState<string>(customers[0]?.id || '');
  const [schemePreset, setSchemePreset] = useState<'11+1' | '10+1' | '12+1.5' | 'custom'>('11+1');
  const [schemeName, setSchemeName] = useState('Swarna Nidhi 11+1 Gold Savings');
  const [monthlyAmount, setMonthlyAmount] = useState('5000');
  const [tenureMonths, setTenureMonths] = useState('11');
  const [bonusInstalments, setBonusInstalments] = useState('1');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [schemeNotes, setSchemeNotes] = useState('');

  // Collect installment modal
  const [payMode, setPayMode] = useState<PaymentMode>('UPI');
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  // Early redeem modal
  const [earlyRedeemReason, setEarlyRedeemReason] = useState('Customer purchase requirement');

  // Lucky Draw Modal
  const [showLuckyDrawModal, setShowLuckyDrawModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentSpinName, setCurrentSpinName] = useState('CLICK SPIN TO START');
  const [winnerResult, setWinnerResult] = useState<string | null>(null);

  const handlePresetSelect = (preset: '11+1' | '10+1' | '12+1.5' | 'custom') => {
    setSchemePreset(preset);
    if (preset === '11+1') {
      setSchemeName('Swarna Nidhi 11+1 Gold Savings');
      setTenureMonths('11');
      setBonusInstalments('1');
    } else if (preset === '10+1') {
      setSchemeName('Gold Tree 10+1 Savings Scheme');
      setTenureMonths('10');
      setBonusInstalments('1');
    } else if (preset === '12+1.5') {
      setSchemeName('Dhanvarsha Chit 12+1.5 Months');
      setTenureMonths('12');
      setBonusInstalments('1.5');
    } else {
      setSchemeName('Custom Jewellery Savings Chit');
    }
  };

  const handleSpinDraw = () => {
    const activeMembers = schemes.filter(s => s.status === 'ACTIVE' || s.status === 'MATURED');
    const memberPool = activeMembers.length > 0 
      ? activeMembers.map(s => `${s.customer.name} (#${s.schemeNo})`)
      : ['Sunita Sharma (#SCH-2026-0012)', 'Pooja Agarwal (#SCH-2026-0015)', 'Ramesh Verma (#SCH-2026-0021)'];
    
    setIsSpinning(true);
    setWinnerResult(null);
    let count = 0;
    const interval = setInterval(() => {
      const rand = memberPool[Math.floor(Math.random() * memberPool.length)];
      setCurrentSpinName(rand);
      count++;
      if (count > 25) {
        clearInterval(interval);
        const winner = memberPool[Math.floor(Math.random() * memberPool.length)];
        setCurrentSpinName(winner);
        setWinnerResult(winner);
        setIsSpinning(false);
      }
    }, 90);
  };

  // Math calculations for New Scheme form
  const mAmount = parseFloat(monthlyAmount) || 0;
  const tMonths = parseInt(tenureMonths) || 11;
  const bInstalments = parseFloat(bonusInstalments) || 1;
  const totalCustomerContribution = mAmount * tMonths;
  const bonusAmountGiven = Math.round(mAmount * bInstalments);
  const totalMaturityValue = totalCustomerContribution + bonusAmountGiven;

  // Maturity date calculation
  const getMaturityDate = (start: string, months: number): string => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  };
  const calculatedMaturityDate = getMaturityDate(startDate, tMonths);

  const filteredCustomers = customers.filter(c => {
    if (!custSearchTerm.trim()) return true;
    const term = custSearchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || (c.phone || c.mobile || '').includes(term);
  });

  const handleCreateScheme = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustId) || customers[0] || {
      id: 'cust-1',
      code: 'CUST-00101',
      name: 'Walk-in Member',
      mobile: '9810012345',
      phone: '9810012345',
      address: 'Greater Noida',
      state: 'Uttar Pradesh',
      stateCode: '09'
    };

    const schemeNum = `SCH-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const newSch: SavingScheme = {
      id: `sch-${Date.now()}`,
      schemeNo: schemeNum,
      customer: cust,
      schemeName: schemeName || `${tMonths}+${bInstalments} Gold Savings`,
      monthlyInstallment: mAmount,
      totalMonths: tMonths,
      bonusMonths: bInstalments,
      bonusInstalments: bInstalments,
      bonusAmount: bonusAmountGiven,
      totalPaid: mAmount,
      totalAmountPaid: mAmount,
      installmentsPaid: 1,
      atMaturityValue: totalMaturityValue,
      startDate,
      endDate: calculatedMaturityDate,
      nextDueDate: getMaturityDate(startDate, 1),
      status: 'ACTIVE',
      notes: schemeNotes,
      installments: [
        {
          monthIndex: 1,
          date: startDate,
          amount: mAmount,
          mode: 'CASH',
          receiptNo: `REC-${schemeNum}-01`
        }
      ]
    };

    onSaveScheme(newSch);
    setSelectedScheme(newSch);
    setShowNewSchemeModal(false);
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheme) return;

    const nextIndex = (selectedScheme.installments || []).length + 1;
    const newInstallment = {
      monthIndex: nextIndex,
      date: payDate,
      amount: selectedScheme.monthlyInstallment,
      mode: payMode,
      receiptNo: `REC-${selectedScheme.schemeNo}-${String(nextIndex).padStart(2, '0')}`,
      referenceNo: payRef || undefined
    };

    const updatedInstallments = [...(selectedScheme.installments || []), newInstallment];
    const newTotalPaid = (selectedScheme.totalAmountPaid || selectedScheme.totalPaid || 0) + selectedScheme.monthlyInstallment;
    const newCount = (selectedScheme.installmentsPaid || 0) + 1;
    const isNowMatured = newCount >= (selectedScheme.totalMonths || 11);

    const updatedScheme: SavingScheme = {
      ...selectedScheme,
      totalPaid: newTotalPaid,
      totalAmountPaid: newTotalPaid,
      installmentsPaid: newCount,
      status: isNowMatured ? 'MATURED' : 'ACTIVE',
      nextDueDate: getMaturityDate(selectedScheme.startDate || new Date().toISOString(), newCount),
      installments: updatedInstallments
    };

    onSaveScheme(updatedScheme);
    onPayInstallment(selectedScheme.id, selectedScheme.monthlyInstallment, payMode);
    setSelectedScheme(updatedScheme);
    setShowPayModal(false);
  };

  const handleRedeemScheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheme) return;

    const isComplete = (selectedScheme.installmentsPaid || 0) >= selectedScheme.totalMonths;
    const updatedScheme: SavingScheme = {
      ...selectedScheme,
      status: 'REDEEMED',
      redeemedAt: new Date().toISOString().slice(0, 10),
      redeemedValue: isComplete ? selectedScheme.atMaturityValue : (selectedScheme.totalAmountPaid || selectedScheme.totalPaid),
      closeReason: !isComplete ? earlyRedeemReason : undefined,
      notes: `${selectedScheme.notes ? selectedScheme.notes + ' | ' : ''}Redeemed to customer credit: ${earlyRedeemReason}`
    };

    onSaveScheme(updatedScheme);
    setSelectedScheme(updatedScheme);
    setShowRedeemModal(false);
  };

  // Filter schemes
  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredSchemes = schemes.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q ||
      s.schemeNo.toLowerCase().includes(q) ||
      s.customer.name.toLowerCase().includes(q) ||
      (s.customer.phone || s.customer.mobile || '').includes(q) ||
      s.schemeName.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && (s.status === 'ACTIVE' || s.status === 'MATURED')) ||
      (statusFilter === 'redeemed' && (s.status === 'REDEEMED' || s.status === 'CLOSED'));

    return matchesQ && matchesStatus;
  });

  const totalCorpusCollected = schemes.reduce((sum, s) => sum + (s.totalAmountPaid || s.totalPaid || 0), 0);
  const totalActiveMembers = schemes.filter(s => s.status === 'ACTIVE' || s.status === 'MATURED').length;
  const overdueSchemes = schemes.filter(s => s.status === 'ACTIVE' && s.nextDueDate && s.nextDueDate <= todayStr);

  return (
    <div className="page" style={{ padding: 0 }}>
      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Savings Schemes</h1>
          <p>Recurring chit fund & gold saving schemes · Monthly installments · Jeweler maturity bonus tracking</p>
        </div>
        <div className="btn-group">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewSchemeModal(true)}
          >
            <Plus size={14} />
            <span>New scheme</span>
          </button>
        </div>
      </div>

      {/* KPI Sum Grid */}
      <div className="sum-grid">
        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--primary)' }}>
            ₹{totalCorpusCollected.toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Installments Corpus Collected</div>
          <div className="helper">Total advance customer savings</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono">{totalActiveMembers}</div>
          <div className="sum-lbl">Active Scheme Accounts</div>
          <div className="helper">Recurring monthly contributors</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: overdueSchemes.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {overdueSchemes.length}
          </div>
          <div className="sum-lbl">Due Today or Overdue</div>
          <div className="helper">{overdueSchemes.length > 0 ? 'Pending collection follow-up' : 'All accounts up to date'}</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--gold)' }}>
            {schemes.filter(s => s.status === 'MATURED').length}
          </div>
          <div className="sum-lbl">Matured Accounts Ready</div>
          <div className="helper">Eligible for bonus jewellery redemption</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="search-row" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
          <Search size={16} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search savings schemes"
            placeholder="Search scheme no., customer or mobile"
          />
        </div>
        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {[
            { id: 'active', label: 'Active' },
            { id: 'redeemed', label: 'Redeemed / closed' },
            { id: 'all', label: 'All' }
          ].map(st => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id as any)}
              className={`tab ${statusFilter === st.id ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: 12.5 }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <span className="card-title">Savings Chit & Passbook Register</span>
            <span className="helper" style={{ marginLeft: 8, display: 'inline' }}>
              Swarna 11+1 Scheme · Guaranteed Jeweler Bonus Month · Passbook Audit
            </span>
          </div>
          <span className="badge badge-gold">11+1 Bonus Protected</span>
        </div>

        <div className="tbl-wrap">
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ width: 130 }}>Scheme No</th>
                <th>Customer</th>
                <th>Scheme</th>
                <th style={{ textAlign: 'right', width: 105 }}>Monthly</th>
                <th style={{ textAlign: 'center', width: 95 }}>Paid</th>
                <th style={{ textAlign: 'right', width: 110 }}>Total Paid</th>
                <th style={{ textAlign: 'right', width: 115 }}>At Maturity</th>
                <th style={{ width: 105 }}>Next Due</th>
                <th style={{ textAlign: 'center', width: 95 }}>Status</th>
                <th style={{ textAlign: 'right', width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchemes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty">
                    No savings schemes found
                  </td>
                </tr>
              ) : (
                filteredSchemes.map((s) => {
                  const isSelected = selectedScheme?.id === s.id;
                  const paidCount = s.installmentsPaid ?? (s.installments?.length || 0);
                  const isOverdue = s.status === 'ACTIVE' && s.nextDueDate && s.nextDueDate <= todayStr;
                  const isComplete = paidCount >= s.totalMonths;

                  return (
                    <tr 
                      key={s.id}
                      onClick={() => setSelectedScheme(s)}
                      style={{ cursor: 'pointer', background: isSelected ? 'var(--row-hover)' : undefined }}
                    >
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--text)' }}>
                        {s.schemeNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.customer.name}</div>
                        <div className="helper" style={{ margin: 0 }}>{s.customer.phone || s.customer.mobile}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {s.schemeName}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                        ₹{s.monthlyInstallment.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 700 }}>{paidCount}</span>
                        <span style={{ color: 'var(--muted)' }}> / {s.totalMonths}</span>
                        {isComplete && (
                          <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 800 }}>COMPLETE</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="font-mono">
                        ₹{(s.totalAmountPaid || s.totalPaid || 0).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--gold)' }} className="font-mono">
                        ₹{s.atMaturityValue.toLocaleString('en-IN')}
                      </td>
                      <td className="font-mono" style={{ fontSize: 12, color: isOverdue ? 'var(--danger)' : undefined }}>
                        {s.nextDueDate || '—'}
                        {isOverdue && <span style={{ color: 'var(--danger)', fontWeight: 700, marginLeft: 2 }}>!</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${
                          s.status === 'MATURED' ? 'badge-green' :
                          s.status === 'REDEEMED' ? 'badge-gray' :
                          isOverdue ? 'badge-red' :
                          'badge-blue'
                        }`}>
                          {s.status === 'MATURED' ? 'MATURED' : s.status === 'REDEEMED' ? 'REDEEMED' : isOverdue ? 'OVERDUE' : 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                          {s.status === 'ACTIVE' && (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedScheme(s);
                                setPayRef('');
                                setPayDate(new Date().toISOString().slice(0, 10));
                                setShowPayModal(true);
                              }}
                            >
                              Collect Installment
                            </button>
                          )}
                          {(s.status === 'ACTIVE' || s.status === 'MATURED') && (
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedScheme(s);
                                setShowRedeemModal(true);
                              }}
                            >
                              Redeem
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedScheme(s);
                              setShowPassbookModal(true);
                            }}
                            title="Member Passbook"
                          >
                            <Printer size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="dt-pager">
          <span className="helper">
            Showing {filteredSchemes.length} of {schemes.length} savings schemes · Total Accumulated Corpus: ₹{totalCorpusCollected.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* --- ENROLL NEW SCHEME MODAL --- */}
      {showNewSchemeModal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewSchemeModal(false); }}>
          <form onSubmit={handleCreateScheme} className="modal modal-xl">
            <div className="modal-head">
              <div>
                <span className="card-title">Enroll Member into Savings Scheme (Chit Fund)</span>
                <div className="helper">Recurring installments · Jeweler maturity bonus contribution · Passbook issuance</div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowNewSchemeModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Scheme Template Presets */}
              <div>
                <label className="label">Scheme Structure Preset</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { id: '11+1', title: '11+1 Scheme (Standard)', desc: '11 Mo + 1 Mo Jeweler Bonus' },
                    { id: '10+1', title: '10+1 Scheme (Fast)', desc: '10 Mo + 1 Mo Jeweler Bonus' },
                    { id: '12+1.5', title: 'Dhanvarsha 12+1.5', desc: '12 Mo + 1.5 Mo Jeweler Bonus' },
                    { id: 'custom', title: 'Custom Chit', desc: 'Custom Months & Bonus' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetSelect(p.id as any)}
                      className="btn btn-xs"
                      style={{
                        padding: '6px 12px',
                        background: schemePreset === p.id ? 'var(--primary)' : 'var(--bg)',
                        color: schemePreset === p.id ? '#fff' : 'var(--text)',
                        border: '1px solid var(--border)',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{p.title}</div>
                      <div style={{ fontSize: 10, opacity: 0.8 }}>{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Search & Scheme Name */}
              <div className="g4">
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="label">Customer / Member Search *</label>
                  <input
                    type="text"
                    value={custSearchTerm}
                    onChange={(e) => setCustSearchTerm(e.target.value)}
                    placeholder="Search customer name or mobile..."
                    className="input input-sm"
                  />
                  <select
                    value={selectedCustId}
                    onChange={(e) => setSelectedCustId(e.target.value)}
                    className="input input-sm"
                    style={{ marginTop: 4 }}
                  >
                    {filteredCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone || c.mobile || 'No Phone'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="label">Scheme Marketing Name</label>
                  <input 
                    type="text"
                    value={schemeName}
                    onChange={(e) => setSchemeName(e.target.value)}
                    className="input input-sm"
                  />
                </div>
              </div>

              {/* Financial Inputs */}
              <div className="g4">
                <div className="form-group">
                  <label className="label">Monthly Installment (₹) *</label>
                  <input 
                    type="number"
                    step="100"
                    required
                    value={monthlyAmount}
                    onChange={(e) => setMonthlyAmount(e.target.value)}
                    className="input input-sm font-mono"
                    style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Tenure (Months) *</label>
                  <input 
                    type="number"
                    min="1"
                    max="120"
                    required
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(e.target.value)}
                    className="input input-sm font-mono"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Jeweler Bonus Months</label>
                  <input 
                    type="number"
                    step="0.5"
                    min="0"
                    value={bonusInstalments}
                    onChange={(e) => setBonusInstalments(e.target.value)}
                    className="input input-sm font-mono"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Enrollment Date</label>
                  <input 
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input input-sm"
                  />
                </div>
              </div>

              {/* Financial Summary & Maturity Projection */}
              <div style={{ background: 'var(--surface2)', padding: 14, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
                  MATURITY VALUE PROJECTION & BONUS BENEFIT
                </div>
                <div className="g3" style={{ textAlign: 'center' }}>
                  <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6 }}>
                    <div className="helper">Customer Total Contribution</div>
                    <div className="font-mono" style={{ fontSize: 16, fontWeight: 700 }}>
                      ₹{totalCustomerContribution.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>{tMonths} installments × ₹{mAmount}</div>
                  </div>

                  <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6 }}>
                    <div className="helper">Jeweler Contribution (Bonus)</div>
                    <div className="font-mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)' }}>
                      +₹{bonusAmountGiven.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--gold)', marginTop: 2 }}>{bInstalments} free month bonus</div>
                  </div>

                  <div style={{ background: 'var(--bg)', padding: 10, borderRadius: 6 }}>
                    <div className="helper">Total Value at Maturity</div>
                    <div className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>
                      ₹{totalMaturityValue.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 2 }}>Matures on {calculatedMaturityDate}</div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Special Instructions / Remarks</label>
                <input 
                  type="text"
                  value={schemeNotes}
                  onChange={(e) => setSchemeNotes(e.target.value)}
                  placeholder="e.g. Member prefers UPI collection, wedding in June"
                  className="input input-sm"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                onClick={() => setShowNewSchemeModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Enroll & Collect Initial Installment (₹{mAmount.toLocaleString('en-IN')})
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- COLLECT INSTALLMENT MODAL --- */}
      {showPayModal && selectedScheme && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPayModal(false); }}>
          <form onSubmit={handleExecutePayment} className="modal modal-md">
            <div className="modal-head">
              <span className="card-title">Collect Monthly Chit Installment · {selectedScheme.schemeNo}</span>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowPayModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedScheme.customer.name}</div>
                <div className="helper">{selectedScheme.customer.phone || selectedScheme.customer.mobile} · {selectedScheme.schemeName}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span>Installment Number:</span>
                  <strong className="font-mono">#{(selectedScheme.installmentsPaid || 0) + 1} of {selectedScheme.totalMonths}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                  <span>Installment Amount:</span>
                  <strong className="font-mono" style={{ fontSize: 16 }}>₹{selectedScheme.monthlyInstallment.toLocaleString('en-IN')}</strong>
                </div>
                {selectedScheme.nextDueDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, color: selectedScheme.nextDueDate <= todayStr ? 'var(--danger)' : 'var(--muted)' }}>
                    <span>Due Date:</span>
                    <strong className="font-mono">{selectedScheme.nextDueDate}</strong>
                  </div>
                )}
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">Payment Date</label>
                  <input 
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="input input-sm"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                    className="input input-sm"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash Till</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">UTR / Cheque / Auth Reference No</label>
                <input 
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="Optional for Cash"
                  className="input input-sm font-mono"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                onClick={() => setShowPayModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Receive ₹{selectedScheme.monthlyInstallment.toLocaleString('en-IN')} & Print Slip
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- REDEEM SCHEME MODAL --- */}
      {showRedeemModal && selectedScheme && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowRedeemModal(false); }}>
          <form onSubmit={handleRedeemScheme} className="modal modal-md">
            <div className="modal-head">
              <div>
                <span className="card-title">Redeem Savings Scheme · {selectedScheme.schemeNo}</span>
                <div className="helper">{selectedScheme.customer.name} · {selectedScheme.schemeName}</div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowRedeemModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(() => {
                const paidCount = selectedScheme.installmentsPaid ?? (selectedScheme.installments?.length || 0);
                const isComplete = paidCount >= selectedScheme.totalMonths;
                const creditValue = isComplete ? selectedScheme.atMaturityValue : (selectedScheme.totalAmountPaid || selectedScheme.totalPaid);

                return (
                  <>
                    <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 'var(--r)', border: '1px solid var(--border)', fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Installments Paid:</span>
                        <strong className="font-mono">{paidCount} of {selectedScheme.totalMonths} (₹{(selectedScheme.totalAmountPaid || selectedScheme.totalPaid || 0).toLocaleString('en-IN')})</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Jeweler Bonus:</span>
                        <strong className="font-mono" style={{ color: isComplete ? 'var(--gold)' : 'var(--muted)' }}>
                          {isComplete ? `+₹${(selectedScheme.bonusAmount || selectedScheme.monthlyInstallment).toLocaleString('en-IN')}` : 'Not given (early closure)'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border)', fontWeight: 800, fontSize: 15 }}>
                        <span>Total Credit to Customer Account:</span>
                        <span className="font-mono" style={{ color: 'var(--success)' }}>₹{creditValue.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {!isComplete && (
                      <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: '#92400e' }}>
                        ⚠️ <strong>Early Redemption Warning:</strong> Only {paidCount} of {selectedScheme.totalMonths} installments have been deposited. Closing now refunds the deposited amount into customer credit, but forfeits the maturity bonus.
                      </div>
                    )}

                    <div className="form-group">
                      <label className="label">Redemption Reason / Notes *</label>
                      <input 
                        type="text"
                        required
                        value={earlyRedeemReason}
                        onChange={(e) => setEarlyRedeemReason(e.target.value)}
                        placeholder="e.g. Wedding gold purchase / Early withdrawal"
                        className="input input-sm"
                      />
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      Note: The credited ₹{creditValue.toLocaleString('en-IN')} will be available under <strong>Customer Credit</strong> to be applied directly at Billing checkout against jewellery purchases.
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                onClick={() => setShowRedeemModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Confirm Redemption to Customer Credit
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MEMBER PASSBOOK MODAL --- */}
      {showPassbookModal && selectedScheme && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPassbookModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PiggyBank size={18} style={{ color: 'var(--primary)' }} />
                <span className="card-title">Swarna Nidhi Savings Passbook · {selectedScheme.schemeNo}</span>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowPassbookModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ background: '#fdfdfc', fontFamily: 'monospace', fontSize: 12 }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--text)', paddingBottom: 8, marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'sans-serif' }}>{store.legalName || 'DADHIBAMAN JEWELLERS'}</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11, fontFamily: 'sans-serif' }}>{store.address || 'SHOP NO 1 & 2 GURUBAKSH PLAZA, JAGAT FARM, GR. NOIDA'}</p>
                <div style={{ marginTop: 6, padding: '3px 10px', background: 'var(--text)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-block', borderRadius: 4 }}>
                  MEMBER SAVINGS CHIT PASSBOOK & STATEMENT
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 10 }}>
                <div>
                  <p style={{ margin: 0 }}>Scheme No: <strong>{selectedScheme.schemeNo}</strong></p>
                  <p style={{ margin: 0 }}>Scheme Name: <strong>{selectedScheme.schemeName}</strong></p>
                  <p style={{ margin: 0 }}>Enrollment Date: {selectedScheme.startDate}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0 }}>Member Name: <strong>{selectedScheme.customer.name}</strong></p>
                  <p style={{ margin: 0 }}>Mobile: {selectedScheme.customer.phone || selectedScheme.customer.mobile}</p>
                  <p style={{ margin: 0 }}>Maturity Date: <strong>{selectedScheme.endDate}</strong></p>
                </div>
              </div>

              {/* Installments Table */}
              <div style={{ marginBottom: 12 }}>
                <div className="tbl-wrap" style={{ border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', fontSize: 11.5 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>Month #</th>
                        <th>Deposit Date</th>
                        <th>Receipt No</th>
                        <th>Payment Mode</th>
                        <th>Reference</th>
                        <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                        <th style={{ textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: selectedScheme.totalMonths }).map((_, idx) => {
                        const mNo = idx + 1;
                        const inst = (selectedScheme.installments || []).find(i => i.monthIndex === mNo);

                        return (
                          <tr key={idx} style={{ background: inst ? 'transparent' : 'var(--surface2)' }}>
                            <td className="font-mono" style={{ fontWeight: 700 }}>#{mNo}</td>
                            <td>{inst?.date || '—'}</td>
                            <td className="font-mono">{inst?.receiptNo || '—'}</td>
                            <td>{inst ? <span className="badge badge-gray">{inst.mode}</span> : '—'}</td>
                            <td className="font-mono" style={{ fontSize: 10.5 }}>{inst?.referenceNo || '—'}</td>
                            <td style={{ textAlign: 'right', fontWeight: inst ? 700 : 400 }} className="font-mono">
                              ₹{selectedScheme.monthlyInstallment.toLocaleString('en-IN')}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`badge ${inst ? 'badge-green' : 'badge-gray'}`}>
                                {inst ? 'DEPOSITED ✓' : 'PENDING'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial summary */}
              <div style={{ background: 'var(--surface2)', padding: 10, borderRadius: 6, border: '1px solid var(--border)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Total Installments Deposited:</span>
                  <span className="font-mono" style={{ fontWeight: 700 }}>
                    ₹{(selectedScheme.totalAmountPaid || selectedScheme.totalPaid || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--gold)' }}>
                  <span>Jeweler Maturity Bonus Month:</span>
                  <span className="font-mono" style={{ fontWeight: 700 }}>
                    +₹{(selectedScheme.bonusAmount || selectedScheme.monthlyInstallment).toLocaleString('en-IN')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border)', fontWeight: 800, fontSize: 14 }}>
                  <span>Guaranteed Value on Maturity:</span>
                  <span className="font-mono" style={{ color: 'var(--success)' }}>
                    ₹{selectedScheme.atMaturityValue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', paddingTop: 16 }}>
                <div>Member Signature</div>
                <div>Authorized Signatory for {store.tradeName}</div>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={14} />
                <span>Print Passbook</span>
              </button>
              <button 
                type="button"
                onClick={() => setShowPassbookModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- LUCKY DRAW SPINNER MODAL --- */}
      {showLuckyDrawModal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowLuckyDrawModal(false); }}>
          <div className="modal modal-md">
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Gift size={18} style={{ color: 'var(--gold)' }} />
                <span className="card-title">Monthly Chit Member Lucky Draw</span>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowLuckyDrawModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
                Eligible pool: Active scheme members with all monthly installments deposited on time
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
                color: '#fff',
                padding: '24px 16px',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                marginBottom: 20
              }}>
                <Sparkles size={28} style={{ color: 'var(--gold)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.8 }}>
                  {winnerResult ? '🏆 WINNER SELECTED 🏆' : isSpinning ? 'SPINNING WHEEL...' : 'READY FOR LUCKY DRAW'}
                </div>
                <div className="font-mono" style={{ fontSize: 20, fontWeight: 800, marginTop: 10, color: winnerResult ? 'var(--gold)' : '#fff' }}>
                  {currentSpinName}
                </div>
                {winnerResult && (
                  <div style={{ fontSize: 12, marginTop: 10, color: 'var(--success-l)', fontWeight: 600 }}>
                    Congratulations! Won 1 Gram Pure 24K Gold Coin!
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={isSpinning}
                onClick={handleSpinDraw}
                className="btn btn-primary"
                style={{ fontSize: 15, padding: '10px 24px' }}
              >
                <Sparkles size={16} />
                <span>{isSpinning ? 'Spinning...' : 'Spin Lucky Draw'}</span>
              </button>
            </div>

            <div className="modal-foot">
              <button 
                type="button"
                onClick={() => setShowLuckyDrawModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


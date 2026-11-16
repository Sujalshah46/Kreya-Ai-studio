import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { 
  ArrowDownRight, Search, Plus, DollarSign, Calendar, Printer, 
  FileText, CheckCircle2, AlertCircle, Clock, ShieldCheck, X,
  Coffee, Users, Wrench, Zap, Trash2, RotateCcw, Download, FileSpreadsheet
} from 'lucide-react';
import { CashOutflowRecord, StoreProfile, PaymentMode } from '../../types';

interface CashOutflowsViewProps {
  store: StoreProfile;
  outflows: CashOutflowRecord[];
  onSaveOutflow?: (outflow: CashOutflowRecord) => void;
}

const CATEGORIES = [
  { id: '', label: 'All Categories' },
  { id: 'staff', label: 'Staff Salary & Advances', icon: Users, chip: 'Staff' },
  { id: 'chai/snacks', label: 'Chai, Snacks & Hospitality', icon: Coffee, chip: 'Chai / Snacks' },
  { id: 'workshop expenses', label: 'Workshop & Karigar Labour', icon: Wrench, chip: 'Workshop Labour' },
  { id: 'utility bills', label: 'Utility Bills (Power, Water, Net)', icon: Zap, chip: 'Utility Bills' },
  { id: 'expense', label: 'General Petty Expense', icon: DollarSign, chip: 'General Expense' },
  { id: 'sales_order_refund', label: 'Sales Order Refund', icon: ArrowDownRight, chip: 'Order Refund' },
  { id: 'buyback_refund', label: 'Buy-Back Refund', icon: ArrowDownRight, chip: 'Buyback' },
  { id: 'metal_refund', label: 'Metal Advance Refund', icon: ArrowDownRight, chip: 'Metal Refund' },
  { id: 'loan_principal', label: 'Girvi Loan Disbursal', icon: ArrowDownRight, chip: 'Loan Principal' },
  { id: 'old_gold_paid', label: 'Old Gold Scrap Cash Payout', icon: ArrowDownRight, chip: 'Old Gold Paid' },
  { id: 'supplier_payment', label: 'Supplier / Bullion Payment', icon: ArrowDownRight, chip: 'Supplier Payout' },
  { id: 'other', label: 'Other Sundry Payout', icon: FileText, chip: 'Other' }
];

const DEFAULT_SAMPLE_OUTFLOWS: CashOutflowRecord[] = [
  {
    id: 'co-001',
    voucherNo: 'EXP-2026-00042',
    date: '2026-11-15',
    amount: 350,
    category: 'chai/snacks',
    paidTo: 'Sharma Tea Stall & Biscuits',
    paymentMode: 'CASH',
    counterCode: 'MAIN1',
    notes: 'Evening tea & snacks for showroom staff and VIP customers',
    authorizedBy: 'Store Manager',
    approvedBy: 'Store Manager',
    voided: false
  },
  {
    id: 'co-002',
    voucherNo: 'EXP-2026-00043',
    date: '2026-11-15',
    amount: 5000,
    category: 'staff',
    paidTo: 'Raju (Sales Executive)',
    paymentMode: 'CASH',
    counterCode: 'MAIN1',
    notes: 'Advance salary request approved for Diwali shopping',
    authorizedBy: 'Store Manager',
    approvedBy: 'Store Manager',
    voided: false
  },
  {
    id: 'co-003',
    voucherNo: 'EXP-2026-00044',
    date: '2026-11-14',
    amount: 2400,
    category: 'workshop expenses',
    paidTo: 'Ramesh Karigar Bench',
    paymentMode: 'CASH',
    counterCode: 'VAULT',
    notes: 'Polishing consumables, rouge compound & emery paper batch',
    authorizedBy: 'Master Goldsmith',
    approvedBy: 'Store Manager',
    voided: false
  },
  {
    id: 'co-004',
    voucherNo: 'EXP-2026-00045',
    date: '2026-11-13',
    amount: 4200,
    category: 'utility bills',
    paidTo: 'Noida Power Company Ltd (NPCL)',
    paymentMode: 'UPI',
    counterCode: 'ADMIN',
    referenceNo: 'UPI-99283716',
    notes: 'Showroom electricity supplementary meter recharge',
    authorizedBy: 'Store Manager',
    approvedBy: 'Store Manager',
    voided: false
  }
];

export const CashOutflowsView: React.FC<CashOutflowsViewProps> = ({
  store,
  outflows: propOutflows,
  onSaveOutflow
}) => {
  const [outflowsList, setOutflowsList] = useState<CashOutflowRecord[]>(
    propOutflows && propOutflows.length > 0 ? propOutflows : DEFAULT_SAMPLE_OUTFLOWS
  );

  React.useEffect(() => {
    if (propOutflows && propOutflows.length > 0) {
      setOutflowsList(propOutflows);
    }
  }, [propOutflows]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [includeVoided, setIncludeVoided] = useState(false);

  // Modals
  const [selectedVoucher, setSelectedVoucher] = useState<CashOutflowRecord | null>(outflowsList[0] || null);
  const [showNewVoucherModal, setShowNewVoucherModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');

  // New Voucher Form
  const [voucherCategory, setVoucherCategory] = useState('chai/snacks');
  const [paidTo, setPaidTo] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [notes, setNotes] = useState('');
  const [counterCode, setCounterCode] = useState('MAIN1');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().slice(0, 10));

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    const newV: CashOutflowRecord = {
      id: `co-${Date.now()}`,
      voucherNo: `EXP-2026-${String(outflowsList.length + 46).padStart(5, '0')}`,
      date: voucherDate,
      amount: amt,
      category: voucherCategory,
      paidTo: paidTo || 'Staff / Vendor Payee',
      paymentMode,
      referenceNo: paymentRef || undefined,
      counterCode,
      notes,
      authorizedBy: 'Store Manager',
      approvedBy: 'Store Manager',
      voided: false
    };

    setOutflowsList([newV, ...outflowsList]);
    onSaveOutflow?.(newV);
    setSelectedVoucher(newV);
    setShowNewVoucherModal(false);
    setShowPrintModal(true);
    setPaidTo('');
    setAmount('');
    setPaymentRef('');
    setNotes('');
  };

  const handleOpenVoidModal = (voucher: CashOutflowRecord) => {
    setSelectedVoucher(voucher);
    setVoidReason('');
    setShowVoidModal(true);
  };

  const handleConfirmVoid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVoucher) return;

    const updated = outflowsList.map(v => {
      if (v.id === selectedVoucher.id) {
        return {
          ...v,
          voided: true,
          voidReason: voidReason.trim() || 'Voided by Store Manager'
        };
      }
      return v;
    });

    setOutflowsList(updated);
    setShowVoidModal(false);
  };

  // Filter logic
  const filteredOutflows = outflowsList.filter(o => {
    if (!includeVoided && o.voided) return false;

    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q ||
      o.voucherNo.toLowerCase().includes(q) ||
      o.paidTo.toLowerCase().includes(q) ||
      o.category.toLowerCase().includes(q) ||
      (o.notes && o.notes.toLowerCase().includes(q)) ||
      (o.referenceNo && o.referenceNo.toLowerCase().includes(q));

    const matchesCat = !categoryFilter || o.category === categoryFilter;
    const matchesFrom = !fromDate || o.date >= fromDate;
    const matchesTo = !toDate || o.date <= toDate;

    return matchesQ && matchesCat && matchesFrom && matchesTo;
  });

  // KPI Calculations (active non-voided)
  const activeOutflows = outflowsList.filter(o => !o.voided);
  const totalOutflowToday = activeOutflows.reduce((a, b) => a + b.amount, 0);
  const staffOutflow = activeOutflows.filter(o => o.category === 'staff').reduce((a, b) => a + b.amount, 0);
  const hospitalityOutflow = activeOutflows.filter(o => o.category === 'chai/snacks').reduce((a, b) => a + b.amount, 0);
  const workshopOutflow = activeOutflows.filter(o => o.category === 'workshop expenses').reduce((a, b) => a + b.amount, 0);
  const utilityOutflow = activeOutflows.filter(o => o.category === 'utility bills').reduce((a, b) => a + b.amount, 0);

  const getCategoryLabel = (catId: string) => {
    const found = CATEGORIES.find(c => c.id === catId);
    return found ? found.label : catId.replace(/_/g, ' ');
  };

  const handleExportCSV = () => {
    const headers = ['Voucher No', 'Date', 'Category', 'Paid To / Purpose', 'Amount', 'Payment Mode', 'Reference No', 'Counter', 'Status', 'Notes'];
    const rows = filteredOutflows.map(o => [
      o.voucherNo,
      o.date,
      getCategoryLabel(o.category),
      o.paidTo,
      o.amount,
      o.paymentMode,
      o.referenceNo || '',
      o.counterCode || '',
      o.voided ? 'VOIDED' : 'PAID',
      o.notes || ''
    ]);

    let csvContent = '\uFEFF' + headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
    rows.forEach(r => {
      csvContent += r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',') + '\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cash_Outflows_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const headers = ['Voucher No', 'Date', 'Category', 'Paid To / Purpose', 'Amount (INR)', 'Payment Mode', 'Reference No', 'Counter', 'Status', 'Notes'];
    const rows = filteredOutflows.map(o => [
      o.voucherNo,
      o.date,
      getCategoryLabel(o.category),
      o.paidTo,
      o.amount,
      o.paymentMode,
      o.referenceNo || '',
      o.counterCode || '',
      o.voided ? 'VOIDED' : 'PAID',
      o.notes || ''
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));
    XLSX.utils.book_append_sheet(wb, ws, 'Outflows');
    XLSX.writeFile(wb, `Cash_Outflows_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Cash outflows</h1>
          <p>Showroom till disbursements · Category tracking · Petty cash voucher generation · Void audit</p>
        </div>
        <div className="btn-group">
          <button 
            type="button"
            className="btn btn-outline"
            onClick={handleExportCSV}
            title="Export filtered outflows to CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button 
            type="button"
            className="btn btn-outline"
            onClick={handleExportExcel}
            title="Export filtered outflows to Excel spreadsheet"
          >
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => setShowNewVoucherModal(true)}
          >
            <Plus size={14} />
            <span>Add Expense / Outflow</span>
          </button>
        </div>
      </div>

      {/* KPI Sum Grid */}
      <div className="sum-grid">
        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--danger)' }}>
            ₹{totalOutflowToday.toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Total Cash Outflows</div>
          <div className="helper">{activeOutflows.length} active disbursements</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--primary)' }}>
            ₹{staffOutflow.toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Staff Salary & Advances</div>
          <div className="helper">Wages, incentives & travel</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--warn)' }}>
            ₹{hospitalityOutflow.toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Chai, Snacks & Hospitality</div>
          <div className="helper">Customer refreshments & pantry</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--info)' }}>
            ₹{(workshopOutflow + utilityOutflow).toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Workshop & Utility Bills</div>
          <div className="helper">Labour, power & consumables</div>
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
            placeholder="Search voucher no, payee, notes or UTR..."
          />
        </div>
        <button 
          type="button" 
          className="btn btn-outline btn-sm"
          onClick={() => {}}
          title="Search outflows"
        >
          <Search size={14} /> Search
        </button>
        <button 
          type="button" 
          className="btn btn-outline btn-sm"
          onClick={() => {
            setSearchQuery('');
            setCategoryFilter('');
            setFromDate('');
            setToDate('');
          }}
          title="Clear search and filters"
        >
          Clear
        </button>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input 
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="input input-sm"
            style={{ width: 'auto' }}
            title="From Date"
          />
          <span className="helper">→</span>
          <input 
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="input input-sm"
            style={{ width: 'auto' }}
            title="To Date"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input input-sm"
            style={{ width: 'auto' }}
          >
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <label className="check" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, whiteSpace: 'nowrap' }}>
            <input 
              type="checkbox"
              checked={includeVoided}
              onChange={(e) => setIncludeVoided(e.target.checked)}
            />
            <span>Include Voided</span>
          </label>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <span className="card-title">Petty Cash Disbursement Ledger</span>
            <span className="helper" style={{ marginLeft: 8, display: 'inline' }}>
              Till Authorizations · Category Tagging · Cash Register Synchronized
            </span>
          </div>
          <span className="badge badge-gold">Active Till Session</span>
        </div>

        <div className="tbl-wrap">
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>No.</th>
                <th>Category</th>
                <th>Mode</th>
                <th className="num">Amount</th>
                <th>Customer</th>
                <th>Source</th>
                <th>Reference</th>
                <th>By</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredOutflows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty">
                    No cash outflow vouchers found
                  </td>
                </tr>
              ) : (
                filteredOutflows.map((v) => {
                  const isSelected = selectedVoucher?.id === v.id;
                  const isVoid = !!v.voided;

                  return (
                    <tr 
                      key={v.id}
                      onClick={() => setSelectedVoucher(v)}
                      style={{ 
                        cursor: 'pointer', 
                        background: isSelected ? 'var(--row-hover)' : undefined,
                        opacity: isVoid ? 0.5 : undefined,
                        textDecoration: isVoid ? 'line-through' : undefined
                      }}
                    >
                      <td className="font-mono">{v.date.slice(0, 10)}</td>
                      <td className="font-mono">{v.voucherNo}</td>
                      <td><span className="badge badge-blue">{getCategoryLabel(v.category)}</span></td>
                      <td><span className="badge badge-gray">{v.paymentMode}</span></td>
                      <td className="num">₹{v.amount.toLocaleString('en-IN')}</td>
                      <td>{v.paidTo || '—'}</td>
                      <td>{v.sourceRef || '—'}</td>
                      <td>{v.referenceNo || '—'}</td>
                      <td>{v.authorizedBy || v.approvedBy || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isVoid ? 'badge-red' : 'badge-green'}`}>
                          {isVoid ? 'VOIDED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedVoucher(v);
                              setShowPrintModal(true);
                            }}
                            title="Print Voucher"
                          >
                            <Printer size={12} />
                          </button>
                          {!isVoid && (
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              style={{ color: 'var(--danger)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenVoidModal(v);
                              }}
                              title="Void Outflow"
                            >
                              <X size={12} />
                            </button>
                          )}
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
            Showing {filteredOutflows.length} of {outflowsList.length} vouchers · Active Total: ₹{totalOutflowToday.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* --- NEW VOUCHER DISBURSEMENT MODAL --- */}
      {showNewVoucherModal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewVoucherModal(false); }}>
          <form onSubmit={handleCreateVoucher} className="modal modal-md">
            <div className="modal-head">
              <div>
                <span className="card-title">New Cash Outflow / Petty Voucher</span>
                <div className="helper">Showroom till cash disbursement · Expense categorization · Sign-off</div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowNewVoucherModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Quick Category Chips */}
              <div>
                <label className="label">Outflow Category Preset *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CATEGORIES.filter(c => c.id !== '').map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setVoucherCategory(cat.id)}
                      className="btn btn-xs"
                      style={{
                        background: voucherCategory === cat.id ? 'var(--primary)' : 'var(--bg)',
                        color: voucherCategory === cat.id ? '#fff' : 'var(--text)',
                        border: '1px solid var(--border)',
                        fontWeight: voucherCategory === cat.id ? 700 : 500
                      }}
                    >
                      {cat.chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="g3">
                <div className="form-group">
                  <label className="label">Disbursement Date</label>
                  <input 
                    type="date"
                    value={voucherDate}
                    onChange={(e) => setVoucherDate(e.target.value)}
                    className="input input-sm"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Payee / Paid To *</label>
                  <input 
                    type="text"
                    required
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="e.g. Ramesh Tea Stall / Vendor / Staff Name"
                    className="input input-sm"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Disbursed Amount (₹) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="input input-sm font-mono"
                    style={{ fontWeight: 800, color: 'var(--danger)', fontSize: 15 }}
                  />
                </div>
              </div>

              <div className="g3">
                <div className="form-group">
                  <label className="label">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                    className="input input-sm"
                  >
                    <option value="CASH">Cash Till Drawer</option>
                    <option value="UPI">Showroom UPI QR</option>
                    <option value="CHEQUE">Cheque Issue</option>
                    <option value="BANK_TRANSFER">Bank Transfer / IMPS</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">UTR / Reference No</label>
                  <input 
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="Optional for UPI/Bank"
                    className="input input-sm font-mono"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Counter / Till Allocation</label>
                  <select
                    value={counterCode}
                    onChange={(e) => setCounterCode(e.target.value)}
                    className="input input-sm font-mono"
                  >
                    <option value="MAIN1">MAIN1 · Ground Floor Front Till</option>
                    <option value="MAIN2">MAIN2 · Gold Counter Till</option>
                    <option value="VAULT">VAULT · Manager Safe Till</option>
                    <option value="ADMIN">ADMIN · Office Petty Cash</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Particulars / Reason for Payout</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Chai and snacks for showroom staff and walk-in wedding party"
                  className="input input-sm"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                onClick={() => setShowNewVoucherModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Authorize & Generate Voucher Slip
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- VOID CONFIRMATION MODAL --- */}
      {showVoidModal && selectedVoucher && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowVoidModal(false); }}>
          <form onSubmit={handleConfirmVoid} className="modal modal-sm">
            <div className="modal-head">
              <span className="card-title">Void Voucher {selectedVoucher.voucherNo}?</span>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowVoidModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: 13, marginBottom: 12 }}>
                The payout of <strong>₹{selectedVoucher.amount.toLocaleString('en-IN')}</strong> will be reversed. Cash register totals and daily audit reports will update accordingly.
              </p>

              <div className="form-group">
                <label className="label">Reason for Voiding *</label>
                <input 
                  type="text"
                  required
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  placeholder="e.g. Entry cancelled / Money returned to till"
                  className="input"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                onClick={() => setShowVoidModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-danger"
              >
                Confirm Void Voucher
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- PRINTABLE PETTY CASH VOUCHER SLIP MODAL --- */}
      {showPrintModal && selectedVoucher && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPrintModal(false); }}>
          <div className="modal modal-md">
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} style={{ color: 'var(--danger)' }} />
                <span className="card-title">Petty Cash Voucher · {selectedVoucher.voucherNo}</span>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowPrintModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ background: '#fdfdfc', fontFamily: 'monospace', fontSize: 12 }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--text)', paddingBottom: 8, marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'sans-serif' }}>{store.legalName || 'DADHIBAMAN JEWELLERS'}</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11, fontFamily: 'sans-serif' }}>{store.address || 'SHOP NO 1 & 2 GURUBAKSH PLAZA, JAGAT FARM, GR. NOIDA'}</p>
                <p style={{ margin: 0, fontSize: 11, fontFamily: 'sans-serif' }}>GSTIN: {store.gstin}</p>
                <div style={{ marginTop: 6, padding: '3px 10px', background: 'var(--text)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-block', borderRadius: 4 }}>
                  PETTY CASH PAYMENT VOUCHER
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                <div>
                  <p style={{ margin: 0 }}>Voucher No: <strong>{selectedVoucher.voucherNo}</strong></p>
                  <p style={{ margin: 0 }}>Date: <strong>{selectedVoucher.date.slice(0, 10)}</strong></p>
                  <p style={{ margin: 0 }}>Counter: <strong>{selectedVoucher.counterCode || 'MAIN1'}</strong></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0 }}>Paid To: <strong>{selectedVoucher.paidTo}</strong></p>
                  <p style={{ margin: 0 }}>Mode: <strong>{selectedVoucher.paymentMode}</strong></p>
                  <p style={{ margin: 0 }}>Category: <strong>{getCategoryLabel(selectedVoucher.category)}</strong></p>
                </div>
              </div>

              <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 6, border: '1px solid var(--border)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Disbursed Cash Amount:</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger)' }} className="font-mono">
                    ₹{selectedVoucher.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {selectedVoucher.notes && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6, paddingTop: 6, borderTop: '1px dashed var(--border)' }}>
                    Particulars: {selectedVoucher.notes}
                  </div>
                )}
                {selectedVoucher.referenceNo && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    Reference / UTR: {selectedVoucher.referenceNo}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', paddingTop: 20 }}>
                <div>Receiver / Payee Signature</div>
                <div>Authorized By: {selectedVoucher.authorizedBy || selectedVoucher.approvedBy || 'Store Manager'}</div>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={14} />
                <span>Print Voucher</span>
              </button>
              <button 
                type="button"
                onClick={() => setShowPrintModal(false)}
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


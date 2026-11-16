import React, { useState } from 'react';
import { 
  DollarSign, Monitor, Lock, Unlock, Plus, Printer, CheckCircle2, 
  AlertTriangle, Calculator, ArrowDownRight, ArrowUpRight, X, ShieldCheck, FileText, Share2, Download 
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { CashRegisterSession, Counter, StoreProfile, DenominationCount } from '../../types';

interface CashRegisterViewProps {
  store: StoreProfile;
  activeCounter: Counter;
  counters: Counter[];
  session: CashRegisterSession;
  onSelectCounter: (counter: Counter) => void;
  onCloseRegister: (denominations: DenominationCount, discrepancy: number, notes: string) => void;
  onAddManualCashFlow: (type: 'IN' | 'OUT', amount: number, category: string, notes: string) => void;
}

interface CashLedgerEntry {
  id: string;
  time: string;
  voucherNo: string;
  particulars: string;
  category: string;
  type: 'FLOAT' | 'SALE' | 'IN' | 'OUT';
  inflow: number;
  outflow: number;
  balance: number;
}

export const CashRegisterView: React.FC<CashRegisterViewProps> = ({
  store,
  activeCounter,
  counters,
  session,
  onSelectCounter,
  onCloseRegister,
  onAddManualCashFlow
}) => {
  // Ensure default counter is MAIN and session is REG-2026-00001 in closing state
  const [selectedCounterTab, setSelectedCounterTab] = useState<string>(activeCounter?.id || 'c1');
  const [sessionStatus, setSessionStatus] = useState<'open' | 'closing' | 'closed'>('closing');
  const [showDenomModal, setShowDenomModal] = useState(false);
  const [showManualCashModal, setShowManualCashModal] = useState(false);
  const [showClosingSlipModal, setShowClosingSlipModal] = useState(false);
  const [showAddCounterModal, setShowAddCounterModal] = useState(false);
  const [newCounterName, setNewCounterName] = useState('');
  const [newCounterCode, setNewCounterCode] = useState('');
  const [newCounterFloat, setNewCounterFloat] = useState('25000');
  const [workOnRegisterMsg, setWorkOnRegisterMsg] = useState<string | null>(null);
  const [activeRegisterTab, setActiveRegisterTab] = useState<'mode' | 'receipts' | 'refunds' | 'cash_entries'>('mode');

  // Dynamic counter list
  const [countersList, setCountersList] = useState([
    { id: 'c1', name: 'COUNTER MAIN', code: 'MAIN' },
    { id: 'c2', name: 'COUNTER MAIN2', code: 'MAIN2' },
    { id: 'c3', name: 'COUNTER QA5', code: 'QA5' },
    { id: 'c4', name: 'COUNTER QA6', code: 'QA6' },
    { id: 'c5', name: 'COUNTER QA7', code: 'QA7' },
    { id: 'c6', name: 'COUNTER QA8', code: 'QA8' },
    { id: 'c7', name: 'Exhibition', code: 'EXH' }
  ]);

  // Manual Cash Flow State
  const [flowType, setFlowType] = useState<'IN' | 'OUT'>('OUT');
  const [flowAmount, setFlowAmount] = useState('');
  const [flowCategory, setFlowCategory] = useState('Petty Expenses (Tea/Snacks)');
  const [flowNotes, setFlowNotes] = useState('');

  // Physical Denomination breakdown: 2000, 500, 200, 100, 50, 20, 10, coins
  const [denoms, setDenoms] = useState<DenominationCount>({
    n2000: 0,
    n500: 100,
    n200: 0,
    n100: 0,
    n50: 0,
    n20: 0,
    n10: 0,
    coins: 0
  });

  const [differenceReason, setDifferenceReason] = useState('');

  // Dynamic ledger entries initialized from live DB snapshot (Opening Float ₹50,000 + Cash Sale ₹94,650)
  const [ledgerEntries, setLedgerEntries] = useState<CashLedgerEntry[]>([
    {
      id: 'entry-1',
      time: '11:37:37 AM',
      voucherNo: 'REG-OPEN',
      particulars: 'Drawer Opening Cash Float',
      category: 'Float',
      type: 'FLOAT',
      inflow: 50000,
      outflow: 0,
      balance: 50000
    },
    {
      id: 'entry-2',
      time: '12:51:22 PM',
      voucherNo: 'INV-2026-00276',
      particulars: 'Cash Sale - Sujal Singh (22 ct Gold Ring)',
      category: 'Order Collection',
      type: 'SALE',
      inflow: 94650,
      outflow: 0,
      balance: 144650
    }
  ]);

  // Calculations
  const openingFloat = 50000;
  const cashSales = ledgerEntries.filter(e => e.type === 'SALE').reduce((s, e) => s + e.inflow, 0);
  const manualCashIn = ledgerEntries.filter(e => e.type === 'IN').reduce((s, e) => s + e.inflow, 0);
  const manualCashOut = ledgerEntries.filter(e => e.type === 'OUT').reduce((s, e) => s + e.outflow, 0);
  const expectedCash = openingFloat + cashSales + manualCashIn - manualCashOut;

  const physicalTotal = (
    (denoms.n2000 || 0) * 2000 +
    (denoms.n500 || 0) * 500 +
    (denoms.n200 || 0) * 200 +
    (denoms.n100 || 0) * 100 +
    (denoms.n50 || 0) * 50 +
    (denoms.n20 || 0) * 20 +
    (denoms.n10 || 0) * 10 +
    (denoms.coins || 0)
  );

  const discrepancy = physicalTotal - expectedCash;

  const handleWorkOnRegister = (counterId: string) => {
    setSelectedCounterTab(counterId);
    const found = countersList.find(ct => ct.id === counterId);
    if (found) onSelectCounter(found as any);
    setWorkOnRegisterMsg(`Now working on register: ${found?.name || 'Counter'}`);
    setTimeout(() => setWorkOnRegisterMsg(null), 3000);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = ledgerEntries.map(e => ({
      Time: e.time,
      'Voucher No': e.voucherNo,
      Particulars: e.particulars,
      Category: e.category,
      Type: e.type,
      'Inflow (₹)': e.inflow,
      'Outflow (₹)': e.outflow,
      'Balance (₹)': e.balance
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Register Ledger');
    XLSX.writeFile(wb, `cash_register_statement_${selectedCounterTab}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleAddCounterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCounterName.trim()) return;
    const newId = `c${countersList.length + 1}`;
    const newC = {
      id: newId,
      name: newCounterName.trim().toUpperCase(),
      code: (newCounterCode.trim() || `C${countersList.length + 1}`).toUpperCase()
    };
    setCountersList(prev => [...prev, newC]);
    setSelectedCounterTab(newId);
    setShowAddCounterModal(false);
    setNewCounterName('');
    setNewCounterCode('');
    setWorkOnRegisterMsg(`Counter ${newC.name} added successfully!`);
    setTimeout(() => setWorkOnRegisterMsg(null), 3000);
  };

  // Counter list matching live Kreya configuration
  const counterTabs = countersList;

  const handleManualCashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(flowAmount);
    if (!amt || amt <= 0) return;

    const voucherNumber = flowType === 'IN' 
      ? `VOC-IN-${String(ledgerEntries.length + 1).padStart(3, '0')}`
      : `VOC-OUT-${String(ledgerEntries.length + 1).padStart(3, '0')}`;

    const newBalance = flowType === 'IN' ? expectedCash + amt : expectedCash - amt;

    const newEntry: CashLedgerEntry = {
      id: `entry-${Date.now()}`,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      voucherNo: voucherNumber,
      particulars: flowNotes || `${flowCategory} voucher`,
      category: flowCategory,
      type: flowType,
      inflow: flowType === 'IN' ? amt : 0,
      outflow: flowType === 'OUT' ? amt : 0,
      balance: newBalance
    };

    setLedgerEntries([...ledgerEntries, newEntry]);
    onAddManualCashFlow(flowType, amt, flowCategory, flowNotes);
    setShowManualCashModal(false);
    setFlowAmount('');
    setFlowNotes('');
  };

  const handleConfirmClose = () => {
    onCloseRegister(denoms, discrepancy, differenceReason || 'Day session closed & verified');
    setSessionStatus('closed');
    setShowDenomModal(false);
    setShowClosingSlipModal(true);
  };

  const denominationList = [
    { label: '₹2000 Note', key: 'n2000' as keyof DenominationCount, mult: 2000 },
    { label: '₹500 Note', key: 'n500' as keyof DenominationCount, mult: 500 },
    { label: '₹200 Note', key: 'n200' as keyof DenominationCount, mult: 200 },
    { label: '₹100 Note', key: 'n100' as keyof DenominationCount, mult: 100 },
    { label: '₹50 Note', key: 'n50' as keyof DenominationCount, mult: 50 },
    { label: '₹20 Note', key: 'n20' as keyof DenominationCount, mult: 20 },
    { label: '₹10 Note', key: 'n10' as keyof DenominationCount, mult: 10 },
    { label: 'Coins (₹)', key: 'coins' as keyof DenominationCount, mult: 1 }
  ];

  return (
    <div className="page">
      {/* Exact Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Cash register</h1>
          <p>Open → receipts & payouts attach automatically → count notes & coins → close. A closed day is locked.</p>
        </div>
        <div className="btn-group" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn btn-outline"
            onClick={() => setShowAddCounterModal(true)}
            title="Add counter"
          >
            <Plus size={13} /> Add counter
          </button>
          <button 
            type="button"
            className="btn btn-outline"
            onClick={() => handleWorkOnRegister(selectedCounterTab)}
            title="Work on this register"
          >
            <Monitor size={13} /> Work on this register
          </button>
          <button 
            type="button"
            className="btn btn-outline"
            onClick={() => setShowManualCashModal(true)}
            title="Cash entry"
          >
            <Plus size={13} /> Cash entry
          </button>
          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => setShowDenomModal(true)}
            title="Start closing"
          >
            <Lock size={13} /> Start closing
          </button>
          <button 
            type="button"
            className="btn btn-outline"
            onClick={() => setShowClosingSlipModal(true)}
            title="Statement"
          >
            <FileText size={13} /> Statement
          </button>
          <button 
            type="button"
            className="btn btn-outline"
            onClick={handleExportExcel}
            title="Excel Export"
          >
            <Download size={13} /> Excel
          </button>
          </div>
        </div>

      {workOnRegisterMsg && (
        <div style={{ padding: '8px 16px', background: 'var(--success-l)', color: 'var(--success)', borderRadius: 6, marginBottom: 12, fontSize: 12, fontWeight: 600 }}>
          ✓ {workOnRegisterMsg}
          </div>
      )}

      {/* Tabs for Counter selection */}
      <div className="tabs">
        {counterTabs.map(c => (
          <button
            key={c.id}
            type="button"
            className={`tab ${selectedCounterTab === c.id ? 'active' : ''}`}
            onClick={() => {
              setSelectedCounterTab(c.id);
              const found = counters.find(ct => ct.id === c.id);
              if (found) onSelectCounter(found);
            }}
          >
            {c.name}
          </button>
        ))}
        </div>

      {/* Sum Grid for Drawer status & Float calculation */}
      <div className="sum-grid">
        <div className="sum-box">
          <div className="sum-val font-mono">₹{openingFloat.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="sum-lbl">Opening Float</div>
          <div className="helper">11:37:37 AM Session Start</div>
          </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--primary)' }}>
            +₹{cashSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          <div className="sum-lbl">Cash Sales (+)</div>
          <div className="helper">Collected Tax Invoices</div>
          </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--text)' }}>
            +₹{manualCashIn.toLocaleString('en-IN')} / -₹{manualCashOut.toLocaleString('en-IN')}
            </div>
          <div className="sum-lbl">Cash In / Out</div>
          <div className="helper">Petty vouchers & adjustments</div>
          </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--primary)' }}>
            ₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          <div className="sum-lbl">Expected in Drawer</div>
          <div className="helper">System calculated closing balance</div>
          </div>
        </div>

      {/* Cards Section: Drawer Status & Reconciliation + Denomination Breakdown */}
      <div className="g2" style={{ marginBottom: 16 }}>
        {/* Drawer Status & Reconciliation Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Drawer Status & Reconciliation</span>
            <div className="btn-group">
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowClosingSlipModal(true)}
              >
                <Printer size={13} />
                <span>Closing Slip</span>
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-xs"
                onClick={() => setShowManualCashModal(true)}
              >
                <Plus size={13} />
                <span>+ Cash In / Out</span>
              </button>
              </div>
            </div>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <span className="helper" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Counter</span>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                  {activeCounter?.name || 'COUNTER MAIN'} 
                  <span className="helper" style={{ marginLeft: 6, display: 'inline' }}>(Session: REG-2026-00001)</span>
                  </div>
                </div>
              <div>
                <span className={`badge ${
                  sessionStatus === 'closing' ? 'badge-yellow' : sessionStatus === 'closed' ? 'badge-gray' : 'badge-green'
                }`} style={{ padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>
                  {sessionStatus === 'closing' ? 'CLOSING IN PROGRESS' : sessionStatus === 'closed' ? 'SESSION CLOSED' : 'REGISTER OPEN'}
                </span>
                </div>
              </div>

            <div className="section-divider">TALLY SUMMARY</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)' }}>Expected Drawer Cash (System Target):</span>
                <span className="font-mono" style={{ fontWeight: 700 }}>₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)' }}>Physical Counted Cash:</span>
                <span className="font-mono" style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>
                  ₹{physicalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <span style={{ fontWeight: 600 }}>Drawer Discrepancy / Variance:</span>
                <span className={`badge ${discrepancy === 0 ? 'badge-green' : discrepancy > 0 ? 'badge-blue' : 'badge-red'}`} style={{ padding: '3px 8px', fontWeight: 700 }}>
                  {discrepancy === 0 
                    ? '₹0.00 (Balanced)' 
                    : (discrepancy > 0 
                        ? `+₹${discrepancy.toLocaleString('en-IN')} (Surplus)` 
                        : `-₹${Math.abs(discrepancy).toLocaleString('en-IN')} (Shortage)`)}
                </span>
                </div>
              </div>

            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => setShowDenomModal(true)}
              >
                <Calculator size={14} />
                <span>Count & Reconcile</span>
              </button>
              </div>
            </div>
          </div>

        {/* Physical Cash Denomination Breakdown Card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Denomination Breakdown</span>
            <span className="badge badge-gold" style={{ fontSize: 11 }}>Live Counter Tally</span>
            </div>
          <div className="card-body" style={{ padding: 14 }}>
            <div className="tbl-wrap" style={{ border: 'none' }}>
              <table style={{ width: '100%', fontSize: 12.5 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>DENOMINATION</th>
                    <th style={{ textAlign: 'center', width: 90 }}>COUNT</th>
                    <th style={{ textAlign: 'right' }}>LINE AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {denominationList.map((d) => {
                    const count = (denoms[d.key] as number) || 0;
                    const lineAmt = count * d.mult;
                    return (
                      <tr key={d.key}>
                        <td style={{ fontWeight: 600, color: 'var(--text)' }}>{d.label}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input 
                            type="number"
                            min="0"
                            value={count || ''}
                            onChange={(e) => setDenoms({ ...denoms, [d.key]: parseInt(e.target.value) || 0 })}
                            className="input input-sm"
                            style={{ width: 75, textAlign: 'center', padding: '4px 6px', height: 28, minHeight: 28 }}
                            placeholder="0"
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                          ₹{lineAmt.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: 'var(--surface2)', fontWeight: 800 }}>
                    <td colSpan={2} style={{ textAlign: 'left' }}>TOTAL PHYSICAL CASH:</td>
                    <td style={{ textAlign: 'right', color: 'var(--primary)' }} className="font-mono">
                      ₹{physicalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>

      {/* Session Transaction List Card with Tabs */}
      <div className="card">
        <div className="card-header">
          <div>
            <span className="card-title">Register Journal & Daily Breakdown</span>
            <span className="helper" style={{ marginLeft: 8, display: 'inline' }}>
              Counter {countersList.find(c => c.id === selectedCounterTab)?.name || 'MAIN'} · REG-2026-00001
            </span>
            </div>
          <div className="btn-group">
            <button
              type="button"
              onClick={() => setShowManualCashModal(true)}
              className="btn btn-primary btn-sm"
              title="Record Cash Entry"
            >
              <Plus size={14} />
              <span>Cash entry</span>
            </button>
            </div>
          </div>

        {/* 4 Required Tabs matching original software */}
        <div className="tabs" style={{ padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
          <button
            type="button"
            className={`tab ${activeRegisterTab === 'mode' ? 'active' : ''}`}
            onClick={() => setActiveRegisterTab('mode')}
          >
            By mode
          </button>
          <button
            type="button"
            className={`tab ${activeRegisterTab === 'receipts' ? 'active' : ''}`}
            onClick={() => setActiveRegisterTab('receipts')}
          >
            Receipts (2)
          </button>
          <button
            type="button"
            className={`tab ${activeRegisterTab === 'refunds' ? 'active' : ''}`}
            onClick={() => setActiveRegisterTab('refunds')}
          >
            Refunds & payouts (2)
          </button>
          <button
            type="button"
            className={`tab ${activeRegisterTab === 'cash_entries' ? 'active' : ''}`}
            onClick={() => setActiveRegisterTab('cash_entries')}
          >
            Cash entries ({ledgerEntries.length})
          </button>
          </div>

        {activeRegisterTab === 'mode' && (
          <div className="tbl-wrap">
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Mode</th>
                  <th style={{ textAlign: 'center' }}>Count</th>
                  <th style={{ textAlign: 'right' }}>Received</th>
                  <th style={{ textAlign: 'right' }}>Refunds / Paid Out</th>
                  <th style={{ textAlign: 'right' }}>Net</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>💵 Cash (Counter Drawer)</td>
                  <td style={{ textAlign: 'center' }}>{ledgerEntries.length}</td>
                  <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }} className="font-mono">
                    ₹{(openingFloat + cashSales + manualCashIn).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 700 }} className="font-mono">
                    ₹{manualCashOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }} className="font-mono">
                    ₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>📱 UPI / Dynamic QR</td>
                  <td style={{ textAlign: 'center' }}>2</td>
                  <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }} className="font-mono">
                    ₹1,00,000.00
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--danger)', fontWeight: 700 }} className="font-mono">
                    ₹47,500.00
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }} className="font-mono">
                    ₹52,500.00
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>💳 POS Terminal (Card)</td>
                  <td style={{ textAlign: 'center' }}>1</td>
                  <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }} className="font-mono">
                    ₹25,000.00
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--muted)' }} className="font-mono">—</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }} className="font-mono">
                    ₹25,000.00
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>🏛 Bank Transfer (NEFT / RTGS)</td>
                  <td style={{ textAlign: 'center' }}>1</td>
                  <td style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 700 }} className="font-mono">
                    ₹15,000.00
                  </td>
                  <td style={{ textAlign: 'right', color: 'var(--muted)' }} className="font-mono">—</td>
                  <td style={{ textAlign: 'right', fontWeight: 800 }} className="font-mono">
                    ₹15,000.00
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
        )}

        {activeRegisterTab === 'receipts' && (
          <div className="tbl-wrap">
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>RECEIPT / INVOICE</th>
                  <th>CUSTOMER</th>
                  <th>MODE</th>
                  <th style={{ textAlign: 'right' }}>AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono" style={{ color: 'var(--muted)', fontSize: 12 }}>12:51:22 PM</td>
                  <td className="font-mono" style={{ fontWeight: 700 }}>INV-2026-00276</td>
                  <td>Sujal Singh (9876543210)</td>
                  <td><span className="badge badge-green">Cash</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="font-mono">
                    ₹94,650.00
                  </td>
                </tr>
                <tr>
                  <td className="font-mono" style={{ color: 'var(--muted)', fontSize: 12 }}>11:45:10 AM</td>
                  <td className="font-mono" style={{ fontWeight: 700 }}>ADV-2026-00042</td>
                  <td>Priya Sharma (9811234567)</td>
                  <td><span className="badge badge-blue">UPI</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="font-mono">
                    ₹50,000.00
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
        )}

        {activeRegisterTab === 'refunds' && (
          <div className="tbl-wrap">
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>REFERENCE</th>
                  <th>PARTICULARS</th>
                  <th>PAYOUT MODE</th>
                  <th style={{ textAlign: 'right' }}>REFUND AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono" style={{ color: 'var(--muted)', fontSize: 12 }}>02:22:15 PM</td>
                  <td className="font-mono" style={{ fontWeight: 700 }}>CAN-2026-00004</td>
                  <td>Order Cancellation Refund — Priya Sharma</td>
                  <td><span className="badge badge-blue">UPI</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }} className="font-mono">
                    -₹47,500.00
                  </td>
                </tr>
                <tr>
                  <td className="font-mono" style={{ color: 'var(--muted)', fontSize: 12 }}>03:15:00 PM</td>
                  <td className="font-mono" style={{ fontWeight: 700 }}>VOC-OUT-001</td>
                  <td>Petty Cash Expense (Tea / Snacks)</td>
                  <td><span className="badge badge-gray">Cash</span></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }} className="font-mono">
                    -₹350.00
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
        )}

        {activeRegisterTab === 'cash_entries' && (
          <div className="tbl-wrap">
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ width: 110 }}>TIME</th>
                  <th style={{ width: 130 }}>VOUCHER / REF</th>
                  <th>PARTICULARS</th>
                  <th>CATEGORY</th>
                  <th style={{ textAlign: 'center', width: 90 }}>TYPE</th>
                  <th style={{ textAlign: 'right', width: 130 }}>INFLOW (+)</th>
                  <th style={{ textAlign: 'right', width: 130 }}>OUTFLOW (-)</th>
                  <th style={{ textAlign: 'right', width: 140 }}>BALANCE</th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((e) => (
                  <tr key={e.id}>
                    <td className="font-mono" style={{ color: 'var(--muted)', fontSize: 12 }}>{e.time}</td>
                    <td className="font-mono" style={{ fontWeight: 700, color: 'var(--text)' }}>{e.voucherNo}</td>
                    <td style={{ fontWeight: 500 }}>{e.particulars}</td>
                    <td style={{ color: 'var(--muted)' }}>{e.category}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${
                        e.type === 'FLOAT' ? 'badge-gray' :
                        e.type === 'SALE' ? 'badge-green' :
                        e.type === 'IN' ? 'badge-blue' :
                        'badge-red'
                      }`}>
                        {e.type}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="font-mono">
                      {e.inflow > 0 ? `₹${e.inflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }} className="font-mono">
                      {e.outflow > 0 ? `₹${e.outflow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                      ₹{e.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
        )}

        <div className="dt-pager">
          <span className="helper">Showing {ledgerEntries.length} transactions · Drawer Cash Total: ₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

      {/* Denomination Counter Modal (2000, 500, 200, 100, 50, 20, 10, coins) */}
      {showDenomModal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDenomModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-head">
              <div>
                <span className="card-title">Physical Cash Denomination Count</span>
                <div className="helper">Session: REG-2026-00001 · Counter {activeCounter?.name || 'MAIN'} · Expected: ₹{expectedCash.toLocaleString('en-IN')}</div>
                </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowDenomModal(false)}
              >
                ✕
              </button>
              </div>

            <div className="modal-body">
              <p className="helper" style={{ marginBottom: 12 }}>
                Enter exact physical counts of currency notes and coins currently in the counter cash drawer:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                {denominationList.map(d => (
                  <div key={d.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ width: 120, fontWeight: 500 }}>{d.label}:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="helper">×</span>
                      <input 
                        type="number"
                        min="0"
                        value={(denoms as any)[d.key] || ''}
                        onChange={(e) => setDenoms({ ...denoms, [d.key]: parseInt(e.target.value) || 0 })}
                        className="input input-sm"
                        style={{ width: 90, textAlign: 'center', fontWeight: 700 }}
                        placeholder="0"
                      />
                      </div>
                    <span className="font-mono" style={{ width: 120, textAlign: 'right', fontWeight: 700 }}>
                      = ₹{(((denoms as any)[d.key] || 0) * d.mult).toLocaleString('en-IN')}
                    </span>
                    </div>
                ))}
                </div>

              {/* Reconciliation Totals */}
              <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)' }}>Expected Drawer Total:</span>
                  <span className="font-mono" style={{ fontWeight: 700 }}>₹{expectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600 }}>Physical Counted Cash:</span>
                  <span className="font-mono" style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 16 }}>
                    ₹{physicalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 600 }}>Discrepancy:</span>
                  <span className={`badge ${discrepancy === 0 ? 'badge-green' : discrepancy > 0 ? 'badge-blue' : 'badge-red'}`} style={{ fontWeight: 700 }}>
                    {discrepancy === 0 
                      ? '₹0.00 (Balanced)' 
                      : (discrepancy > 0 
                          ? `+₹${discrepancy.toLocaleString('en-IN')} (Surplus)` 
                          : `-₹${Math.abs(discrepancy).toLocaleString('en-IN')} (Shortage)`)}
                  </span>
                  </div>

                {discrepancy !== 0 && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <label className="label helper" style={{ fontWeight: 700, color: 'var(--warn)' }}>
                      Difference Reason * (Required for day closing audit):
                    </label>
                    <input
                      type="text"
                      value={differenceReason}
                      onChange={(e) => setDifferenceReason(e.target.value)}
                      placeholder="e.g. Minor cash rounding / verified change float difference"
                      className="input input-sm"
                      required
                    />
                    </div>
                )}
                </div>
              </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setShowDenomModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="btn btn-primary"
              >
                Lock & Close Register
              </button>
              </div>
            </div>
          </div>
      )}

      {/* Manual Cash Flow In/Out Modal */}
      {showManualCashModal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowManualCashModal(false); }}>
          <div className="modal modal-md">
            <div className="modal-head">
              <span className="card-title">Record Petty Cash Voucher</span>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowManualCashModal(false)}
              >
                ✕
              </button>
              </div>

            <form onSubmit={handleManualCashSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setFlowType('OUT')}
                    className={`btn ${flowType === 'OUT' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1, backgroundColor: flowType === 'OUT' ? 'var(--danger)' : undefined, borderColor: flowType === 'OUT' ? 'var(--danger)' : undefined }}
                  >
                    Cash Out (Expense)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlowType('IN')}
                    className={`btn ${flowType === 'IN' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ flex: 1 }}
                  >
                    Cash In (Receipt)
                  </button>
                  </div>

                <div>
                  <label className="label">Category</label>
                  <select 
                    value={flowCategory}
                    onChange={(e) => setFlowCategory(e.target.value)}
                    className="input input-sm"
                  >
                    {flowType === 'OUT' ? (
                      <>
                        <option value="Petty Expenses (Tea/Snacks)">Petty Expenses (Tea/Snacks)</option>
                        <option value="Office Stationery & Packing">Office Stationery & Packing</option>
                        <option value="Travel & Delivery Logistics">Travel & Delivery Logistics</option>
                        <option value="Old Gold Purchase Outflow">Old Gold Purchase Outflow</option>
                        <option value="Customer Return Refund">Customer Return Refund</option>
                        <option value="Supplier Cash Settlement">Supplier Cash Settlement</option>
                      </>
                    ) : (
                      <>
                        <option value="Float Addition / Cash Top-up">Float Addition / Cash Top-up</option>
                        <option value="Customer Cash Advance">Customer Cash Advance</option>
                        <option value="Petty Cash Return / Change">Petty Cash Return / Change</option>
                        <option value="Other Cash Receipt">Other Cash Receipt</option>
                      </>
                    )}
                  </select>
                  </div>

                <div>
                  <label className="label">Amount (₹) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={flowAmount}
                    onChange={(e) => setFlowAmount(e.target.value)}
                    placeholder="e.g. 250"
                    className="input input-sm font-mono"
                    style={{ fontWeight: 700 }}
                  />
                  </div>

                <div>
                  <label className="label">Particulars / Reason</label>
                  <input 
                    type="text"
                    value={flowNotes}
                    onChange={(e) => setFlowNotes(e.target.value)}
                    placeholder="e.g. Evening staff tea & refreshments"
                    className="input input-sm"
                  />
                  </div>
                </div>

              <div className="modal-foot">
                <button 
                  type="button"
                  onClick={() => setShowManualCashModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Entry
                </button>
                </div>
            </form>
            </div>
          </div>
      )}

      {/* Day Closing Statement Modal Slip */}
      {showClosingSlipModal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowClosingSlipModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} style={{ color: 'var(--champagne)' }} />
                <span className="card-title">Day Closing Statement · REG-2026-00001</span>
                </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowClosingSlipModal(false)}
              >
                ✕
              </button>
              </div>

            {/* Printable Slip Content */}
            <div className="modal-body" style={{ background: '#fdfdfc', fontFamily: 'monospace', fontSize: 12 }}>
              {/* Slip Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: 12, marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'sans-serif' }}>
                  {store.legalName || 'DADHIBAMAN JEWELLERS'}
                </h3>
                <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 11, fontFamily: 'sans-serif' }}>
                  {store.address || 'SHOP NO 1 & 2 GURUBAKSH PLAZA, JAGAT FARM, GR. NOIDA'}
                </p>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11, fontFamily: 'sans-serif' }}>
                  GSTIN: {store.gstin || '09AAHFG6953Q1Z5'} · Code: 09
                </p>
                <div style={{ marginTop: 8, padding: '4px 8px', background: 'var(--surface2)', borderRadius: 4, display: 'inline-block', fontWeight: 700, fontFamily: 'sans-serif' }}>
                  DAY CLOSING STATEMENT · CASH REGISTER RECONCILIATION
                  </div>
                </div>

              {/* Meta information */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, paddingBottom: 10, borderBottom: '1px dashed var(--border)', marginBottom: 12 }}>
                <div>Session ID: <strong>REG-2026-00001</strong></div>
                <div style={{ textAlign: 'right' }}>Date: <strong>15/11/2026</strong></div>
                <div>Counter: <strong>{activeCounter?.name || 'COUNTER MAIN'}</strong></div>
                <div style={{ textAlign: 'right' }}>Cashier: <strong>Admin Cashier</strong></div>
                </div>

              {/* Flow summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 10, borderBottom: '1px dashed var(--border)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Opening Cash Float:</span>
                  <span style={{ fontWeight: 700 }}>₹{openingFloat.toFixed(2)}</span>
                  </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                  <span>+ Cash Receipts (Sales):</span>
                  <span style={{ fontWeight: 700 }}>+₹{cashSales.toFixed(2)}</span>
                  </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>+ Other Cash In:</span>
                  <span style={{ fontWeight: 700 }}>+₹{manualCashIn.toFixed(2)}</span>
                  </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>- Cash Refunds / Buybacks:</span>
                  <span style={{ fontWeight: 700 }}>-₹0.00</span>
                  </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                  <span>- Cash Expenses (Petty):</span>
                  <span style={{ fontWeight: 700 }}>-₹{manualCashOut.toFixed(2)}</span>
                  </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border)', fontWeight: 800, fontSize: 13 }}>
                  <span>Expected Closing Cash:</span>
                  <span>₹{expectedCash.toFixed(2)}</span>
                  </div>
                </div>

              {/* Denominations breakdown table */}
              <div style={{ marginBottom: 14 }}>
                <div className="helper" style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  Physical Denomination Breakdown
                  </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 14px', background: 'var(--surface2)', padding: 10, borderRadius: 6, border: '1px solid var(--border)' }}>
                  <div>₹2000 × {denoms.n2000 || 0} = ₹{((denoms.n2000 || 0) * 2000).toLocaleString('en-IN')}</div>
                  <div>₹500 × {denoms.n500 || 0} = ₹{((denoms.n500 || 0) * 500).toLocaleString('en-IN')}</div>
                  <div>₹200 × {denoms.n200 || 0} = ₹{((denoms.n200 || 0) * 200).toLocaleString('en-IN')}</div>
                  <div>₹100 × {denoms.n100 || 0} = ₹{((denoms.n100 || 0) * 100).toLocaleString('en-IN')}</div>
                  <div>₹50 × {denoms.n50 || 0} = ₹{((denoms.n50 || 0) * 50).toLocaleString('en-IN')}</div>
                  <div>₹20 × {denoms.n20 || 0} = ₹{((denoms.n20 || 0) * 20).toLocaleString('en-IN')}</div>
                  <div>₹10 × {denoms.n10 || 0} = ₹{((denoms.n10 || 0) * 10).toLocaleString('en-IN')}</div>
                  <div>Coins = ₹{(denoms.coins || 0).toLocaleString('en-IN')}</div>
                  </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginTop: 6 }}>
                  <span>Actual Cash Counted:</span>
                  <span style={{ color: 'var(--primary)' }}>₹{physicalTotal.toFixed(2)}</span>
                  </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 2 }}>
                  <span>Cash Discrepancy:</span>
                  <span style={{ fontWeight: 700, color: discrepancy === 0 ? 'var(--primary)' : 'var(--danger)' }}>
                    {discrepancy === 0 ? '₹0.00 (Balanced)' : `₹${discrepancy.toFixed(2)} (${differenceReason || 'unreconciled'})`}
                  </span>
                  </div>
                </div>

              {/* Sign-off signatures */}
              <div style={{ paddingTop: 16, borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', fontFamily: 'sans-serif' }}>
                <div>
                  <div style={{ height: 28 }}></div>
                  <div>Cashier / Drawer Incharge</div>
                  </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ height: 28 }}></div>
                  <div>Authorized Showroom Manager</div>
                  </div>
                </div>
              </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={14} />
                <span>Print Statement</span>
              </button>
              <button
                type="button"
                onClick={() => setShowClosingSlipModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
              </div>
            </div>
          </div>
      )}
         {/* ADD COUNTER MODAL */}
      {showAddCounterModal && (
        <div className="overlay" onClick={() => setShowAddCounterModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>+ Add New Register Counter</h3>
              <button 
                type="button" 
                className="btn btn-xs btn-outline"
                onClick={() => setShowAddCounterModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCounterSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="label">Counter Name *</label>
                  <input 
                    className="input" 
                    placeholder="e.g. COUNTER 3, BRIDAL SECTION"
                    value={newCounterName}
                    onChange={(e) => setNewCounterName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Counter Code</label>
                  <input 
                    className="input" 
                    placeholder="e.g. C3, BRD"
                    value={newCounterCode}
                    onChange={(e) => setNewCounterCode(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Opening Float Amount (₹)</label>
                  <input 
                    className="input" 
                    type="number"
                    value={newCounterFloat}
                    onChange={(e) => setNewCounterFloat(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-foot">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowAddCounterModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!newCounterName.trim()}
                >
                  Create Counter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

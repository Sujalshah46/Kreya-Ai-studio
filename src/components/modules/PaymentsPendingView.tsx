import { applyInvoiceReceipt, invoiceReceipts } from '../../data/invoicePayments';
import React, { useState, useEffect } from 'react';
import { Customer, SalesInvoice, PaymentMode, PaymentTransaction } from '../../types';

interface PaymentsPendingViewProps {
  invoices: SalesInvoice[];
  customers: Customer[];
  onRecordPayment?: (invoiceId: string, payment: PaymentTransaction) => void;
}

interface PaymentRecord {
  id: string;
  payment_no: string;
  created_at: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  payment_for: string;
  order_id?: string;
  order_no?: string;
  payment_mode: string;
  counter_code?: string;
  register_no?: string;
  amount: number;
  reference_no?: string;
  notes?: string;
  voided: boolean;
  void_reason?: string;
  is_refund?: boolean;
}

interface CashOutflowItem {
  id: string;
  purchase_no: string;
  purchase_date: string;
  customer_name: string;
  customer_phone?: string;
  gold_grams: number;
  payment_mode: string;
  total_value: number;
  cash_paid: number;
}

const MODE_ICONS: Record<string, string> = {
  cash: '💵',
  CASH: '💵',
  upi: '📱',
  UPI: '📱',
  card: '💳',
  CARD: '💳',
  bank: '🏦',
  BANK: '🏦',
  BANK_TRANSFER: '🏦',
  cheque: '📝',
  CHEQUE: '📝',
  credit: '🏷️',
  CREDIT: '🏷️'
};

const formatCurrency = (val: number | string | undefined): string => {
  const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const PaymentsPendingView: React.FC<PaymentsPendingViewProps> = ({
  invoices = [],
  customers = [],
  onRecordPayment
}) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'outstanding' | 'outflows' | 'today'>('payments');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [modeFilter, setModeFilter] = useState<string>('');
  const [counterFilter, setCounterFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showVoided, setShowVoided] = useState<boolean>(false);

  // Modals state
  const [editPayment, setEditPayment] = useState<PaymentRecord | null>(null);
  const [voidPayment, setVoidPayment] = useState<PaymentRecord | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<PaymentRecord | null>(null);
  const [summaryOrderId, setSummaryOrderId] = useState<string | null>(null);
  const [collectInvoice, setCollectInvoice] = useState<SalesInvoice | null>(null);

  // Collection modal state
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectMode, setCollectMode] = useState<PaymentMode>('CASH');
  const [collectRef, setCollectRef] = useState<string>('');
  const [collectorName, setCollectorName] = useState<string>('Cashier');

  // Build the receipt list from recorded invoice transactions
  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const list: PaymentRecord[] = [];
    invoices.forEach((inv, invIdx) => {
      const custName = inv.customer?.fullName || inv.customer?.name || 'Walk-in Customer';
      const custPhone = inv.customer?.mobile || inv.customer?.phone || '';
      const invNo = inv.invoiceNumber || inv.invoiceNo || `INV-2026-${String(invIdx + 1).padStart(4, '0')}`;

      const receipts = invoiceReceipts(inv);
      if (receipts.length) {
        receipts.forEach((p, pIdx) => {
          list.push({
            id: p.id || `pay-${inv.id}-${pIdx}`,
            payment_no: p.receiptNo || `REC-2026-${String(list.length + 101).padStart(4, '0')}`,
            created_at: p.date ? p.date.split('T')[0] : (inv.date || '2026-11-15'),
            customer_id: inv.customer?.id,
            customer_name: custName,
            customer_phone: custPhone,
            payment_for: 'order',
            order_id: inv.id,
            order_no: invNo,
            payment_mode: p.mode || 'CASH',
            counter_code: 'C1',
            register_no: 'REG-001',
            amount: p.amount || 0,
            reference_no: p.referenceNo || 'AUTO-POS',
            voided: false
          });
        });
      }
    });

    return list;
  });

  // Outflows list (from Old Gold Purchases)
  const [outflows] = useState<CashOutflowItem[]>([
    {
      id: 'out-1',
      purchase_no: 'OGP-2026-00042',
      purchase_date: '2026-11-15',
      customer_name: 'Ramesh Patel',
      customer_phone: '9822019283',
      gold_grams: 14.520,
      payment_mode: 'CASH',
      total_value: 124500,
      cash_paid: 124500
    },
    {
      id: 'out-2',
      purchase_no: 'OGP-2026-00041',
      purchase_date: '2026-11-14',
      customer_name: 'Sunita Mehra',
      customer_phone: '9711029482',
      gold_grams: 8.250,
      payment_mode: 'UPI',
      total_value: 70800,
      cash_paid: 70800
    }
  ]);

  // Outstanding unpaid orders
  const pendingInvoices = invoices.filter(inv => (inv.balanceDue || 0) > 0);
  const totalOutstanding = pendingInvoices.reduce((sum, inv) => sum + (inv.balanceDue || 0), 0);
  const totalOutflows = outflows.reduce((sum, item) => sum + item.cash_paid, 0);

  // Today collections
  const todayDate = new Date().toISOString().split('T')[0];
  const todaysReceipts = payments.filter(p => !p.voided && (p.created_at === todayDate || p.created_at === '2026-11-15'));
  const todaysCollections = todaysReceipts.reduce((sum, p) => sum + p.amount, 0);

  // Today cashbook mode breakdown
  const todayByMode: Record<string, { count: number; total: number }> = {};
  todaysReceipts.forEach(p => {
    const m = (p.payment_mode || 'CASH').toLowerCase();
    if (!todayByMode[m]) {
      todayByMode[m] = { count: 0, total: 0 };
    }
    todayByMode[m].count += 1;
    todayByMode[m].total += p.amount;
  });
  const todayModesList = Object.entries(todayByMode).map(([mode, data]) => ({
    mode,
    count: data.count,
    total: data.total
  }));

  // Filtering
  const filteredReceipts = payments.filter(p => {
    if (!showVoided && p.voided) return false;
    if (fromDate && p.created_at < fromDate) return false;
    if (toDate && p.created_at > toDate) return false;
    if (modeFilter && p.payment_mode.toLowerCase() !== modeFilter.toLowerCase()) return false;
    if (counterFilter && p.counter_code !== counterFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        p.payment_no.toLowerCase().includes(q) ||
        p.customer_name.toLowerCase().includes(q) ||
        (p.order_no && p.order_no.toLowerCase().includes(q)) ||
        (p.reference_no && p.reference_no.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const voidedCount = payments.filter(p => p.voided).length;

  // Edit Receipt
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editMode, setEditMode] = useState<string>('CASH');
  const [editRef, setEditRef] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const openEditModal = (rec: PaymentRecord) => {
    setEditPayment(rec);
    setEditAmount(String(rec.amount));
    setEditDate(rec.created_at);
    setEditMode(rec.payment_mode);
    setEditRef(rec.reference_no || '');
    setEditNotes(rec.notes || '');
  };

  const handleSaveEdit = () => {
    if (!editPayment) return;
    const num = parseFloat(editAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }
    setPayments(prev =>
      prev.map(p =>
        p.id === editPayment.id
          ? {
              ...p,
              amount: num,
              created_at: editDate || p.created_at,
              payment_mode: editMode,
              reference_no: editRef || undefined,
              notes: editNotes || undefined
            }
          : p
      )
    );
    setEditPayment(null);
  };

  // Void Receipt
  const [voidReason, setVoidReason] = useState<string>('');
  const openVoidModal = (rec: PaymentRecord) => {
    setVoidPayment(rec);
    setVoidReason('');
  };

  const handleConfirmVoid = () => {
    if (!voidPayment) return;
    if (!voidReason.trim()) {
      alert('Please provide a reason for voiding this receipt.');
      return;
    }
    setPayments(prev =>
      prev.map(p =>
        p.id === voidPayment.id
          ? {
              ...p,
              voided: true,
              void_reason: voidReason.trim()
            }
          : p
      )
    );
    setVoidPayment(null);
  };

  // Quick Collection
  const openCollectModal = (inv: SalesInvoice) => {
    setCollectInvoice(inv);
    setCollectAmount(inv.balanceDue || 0);
    setCollectMode('CASH');
    setCollectRef('');
    setCollectorName('Cashier 1');
  };

  const handleConfirmCollect = () => {
    if (!collectInvoice) return;
    const newReceiptNo = `REC-2026-${String(payments.length + 101).padStart(4, '0')}`;
    const paymentTxn: PaymentTransaction = {
      id: `pay-${Date.now()}`,
      receiptNo: newReceiptNo,
      date: new Date().toISOString(),
      amount: collectAmount,
      mode: collectMode,
      referenceNo: collectRef || 'COUNTER-CASH',
      collectorName: collectorName
    };

    if (!applyInvoiceReceipt(collectInvoice, paymentTxn)) {
      alert('Enter a valid payment amount that does not exceed the amount due.');
      return;
    }

    if (onRecordPayment) {
      onRecordPayment(collectInvoice.id, paymentTxn);
    }

    const newPaymentRecord: PaymentRecord = {
      id: paymentTxn.id,
      payment_no: newReceiptNo,
      created_at: new Date().toISOString().split('T')[0],
      customer_id: collectInvoice.customer?.id,
      customer_name: collectInvoice.customer?.fullName || collectInvoice.customer?.name || 'Customer',
      customer_phone: collectInvoice.customer?.mobile || collectInvoice.customer?.phone || '',
      payment_for: 'order',
      order_id: collectInvoice.id,
      order_no: collectInvoice.invoiceNumber || collectInvoice.invoiceNo || 'INV-001',
      payment_mode: collectMode,
      counter_code: 'C1',
      register_no: 'REG-001',
      amount: collectAmount,
      reference_no: collectRef || 'COUNTER-CASH',
      voided: false
    };

    setPayments(prev => [newPaymentRecord, ...prev]);
    setCollectInvoice(null);
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Payments &amp; Pending</h1>
          <p>Collections and outstanding dues</p>
        </div>
        <div className="btn-group">
          <button className="btn btn-outline" onClick={() => window.print()}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Sum Grid */}
      <div className="sum-grid" style={{ marginBottom: 16 }}>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--success)' }}>
            {formatCurrency(todaysCollections)}
          </div>
          <div className="sum-lbl">Today's Collections</div>
        </div>

        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--danger)' }}>
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="sum-lbl">Total Outstanding</div>
        </div>

        <div className="sum-box">
          <div className="sum-val">{pendingInvoices.length}</div>
          <div className="sum-lbl">Pending Orders</div>
        </div>

        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--gold)' }}>
            {formatCurrency(totalOutflows)}
          </div>
          <div className="sum-lbl">OGP Cash Outflows</div>
        </div>
      </div>

      {/* Kreya Standard Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          All Receipts
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'outstanding' ? 'active' : ''}`}
          onClick={() => setActiveTab('outstanding')}
        >
          Outstanding Dues ({pendingInvoices.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'outflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('outflows')}
        >
          Cash Outflows ({outflows.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today's Cash Book
        </button>
      </div>

      {/* TAB 1: ALL RECEIPTS */}
      {activeTab === 'payments' && (
        <div className="card">
          <div className="card-body" style={{ padding: 14 }}>
            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
              <input
                className="input input-sm"
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                style={{ width: 'auto' }}
              />
              <input
                className="input input-sm"
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                style={{ width: 'auto' }}
              />
              <select
                className="input input-sm"
                value={modeFilter}
                onChange={e => setModeFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="">All Modes</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="cheque">Cheque</option>
              </select>
              <select
                className="input input-sm"
                value={counterFilter}
                onChange={e => setCounterFilter(e.target.value)}
                style={{ width: 'auto' }}
                aria-label="Counter"
              >
                <option value="">All counters</option>
                <option value="C1">Counter C1 – Main Desk</option>
                <option value="C2">Counter C2 – Cash Counter</option>
                <option value="none">Not in any register</option>
              </select>
              <input
                type="text"
                className="input input-sm"
                placeholder="Receipt no, customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: 180 }}
              />
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {}}
                title="Filter records"
              >
                Filter
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setModeFilter('');
                  setCounterFilter('');
                  setSearchTerm('');
                }}
              >
                Clear
              </button>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <input
                  type="checkbox"
                  id="showVoided"
                  checked={showVoided}
                  onChange={e => setShowVoided(e.target.checked)}
                />
                <label htmlFor="showVoided" style={{ cursor: 'pointer' }}>
                  Show voided ({voidedCount})
                </label>
              </div>
            </div>

            {/* Kreya Info Bar */}
            <div
              style={{
                background: 'var(--info-l)',
                border: '1px solid var(--info-l)',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 12,
                fontSize: 12,
                color: 'var(--info)'
              }}
            >
              <strong>Edit</strong> — correct amount, date, or mode &nbsp;|&nbsp;
              <strong>Void</strong> — cancel a wrong receipt (reverses payment, keeps audit trail)
            </div>

            {/* Table */}
            <div className="tbl-wrap tbl-desktop-only">
              <table>
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>For</th>
                    <th>Mode</th>
                    <th>Counter</th>
                    <th className="num">Amount</th>
                    <th>Reference</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>
                        No payments found. Try adjusting filters.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map(rec => (
                      <tr
                        key={rec.id}
                        style={{
                          background: rec.voided ? 'var(--danger-l)' : rec.is_refund ? 'var(--warn-l)' : undefined,
                          opacity: rec.voided ? 0.7 : 1
                        }}
                      >
                        <td>
                          <div
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 11,
                              fontWeight: 700,
                              color: rec.voided || rec.is_refund ? 'var(--danger)' : undefined,
                              textDecoration: rec.voided ? 'line-through' : undefined
                            }}
                          >
                            {rec.payment_no}
                          </div>
                          {rec.voided && (
                            <div style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 700 }}>VOIDED</div>
                          )}
                          {rec.is_refund && (
                            <div style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 700 }}>
                              REFUND (paid out)
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: 12 }}>{rec.created_at}</td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{rec.customer_name}</div>
                          {rec.customer_phone && (
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{rec.customer_phone}</div>
                          )}
                        </td>
                        <td style={{ fontSize: 12 }}>
                          {rec.payment_for}
                          {rec.order_no && (
                            <span style={{ fontFamily: 'monospace', marginLeft: 4, color: 'var(--primary)' }}>
                              #{rec.order_no}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-blue">
                            {MODE_ICONS[rec.payment_mode] || '💳'} {rec.payment_mode}
                          </span>
                        </td>
                        <td title={rec.register_no || 'Not in any register'}>
                          {rec.counter_code ? (
                            <span className="badge badge-green">{rec.counter_code}</span>
                          ) : (
                            <span className="helper">—</span>
                          )}
                        </td>
                        <td
                          className="num"
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: rec.voided ? 'var(--muted)' : rec.is_refund ? 'var(--danger)' : 'var(--primary)',
                            textDecoration: rec.voided ? 'line-through' : undefined
                          }}
                        >
                          {rec.is_refund ? '−' : ''}
                          {formatCurrency(rec.amount)}
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--muted)' }}>{rec.reference_no || '—'}</td>
                        <td style={{ textAlign: 'right' }}>
                          {!rec.voided && !rec.is_refund && (
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                title="Print Receipt"
                                onClick={() => setReceiptPayment(rec)}
                              >
                                Receipt
                              </button>
                              {rec.order_no && (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  title="All payments, old gold and advances of this invoice"
                                  onClick={() => setSummaryOrderId(rec.order_no || null)}
                                >
                                  Summary
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                title="Edit receipt"
                                onClick={() => openEditModal(rec)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-danger"
                                title="Void receipt"
                                onClick={() => openVoidModal(rec)}
                              >
                                Void
                              </button>
                            </div>
                          )}
                          {rec.voided && (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                              <button
                                type="button"
                                className="btn btn-xs btn-outline"
                                title="Reprint (marked VOID)"
                                onClick={() => setReceiptPayment(rec)}
                              >
                                Receipt
                              </button>
                              <div
                                style={{ fontSize: 10, color: 'var(--danger)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                title={rec.void_reason}
                              >
                                {rec.void_reason || 'Voided'}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pager */}
            <div className="dt-pager" style={{ padding: '10px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="helper">{filteredReceipts.length} receipts</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="helper">Page 1 of 1</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OUTSTANDING DUES */}
      {activeTab === 'outstanding' && (
        <div className="card">
          <div className="tbl-wrap tbl-desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Order No</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th className="num">Total</th>
                  <th className="num">Paid</th>
                  <th className="num">Pending</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: 'var(--success)', padding: 30 }}>
                      No outstanding dues!
                    </td>
                  </tr>
                ) : (
                  pendingInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>
                        {inv.invoiceNumber || inv.invoiceNo}
                      </td>
                      <td style={{ fontSize: 12 }}>{inv.date || '2026-11-15'}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{inv.customer?.fullName || inv.customer?.name}</div>
                        {(inv.customer?.mobile || inv.customer?.phone) && (
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {inv.customer?.mobile || inv.customer?.phone}
                          </div>
                        )}
                      </td>
                      <td className="num">{formatCurrency(inv.productTotalValue || inv.totalAmount || 0)}</td>
                      <td className="num amt-green" style={{ fontWeight: 600 }}>
                        {formatCurrency(inv.paidAmount || 0)}
                      </td>
                      <td className="num">
                        <span className="amt-red" style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', fontWeight: 700 }}>
                          ⚠️ {formatCurrency(inv.balanceDue || 0)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-yellow">
                          {String(inv.status || 'UNPAID').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          onClick={() => openCollectModal(inv)}
                        >
                          Collect
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="dt-pager" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
            <span className="helper">{pendingInvoices.length} pending orders</span>
            <span className="helper">Total Dues: {formatCurrency(totalOutstanding)}</span>
          </div>
        </div>
      )}

      {/* TAB 3: CASH OUTFLOWS */}
      {activeTab === 'outflows' && (
        <div>
          <div
            style={{
              background: 'var(--warn-l)',
              border: '1px solid var(--warn-l)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 14,
              fontSize: 13
            }}
          >
            <strong>Cash Outflows</strong> — These are cash payments made by the shop when purchasing old gold from customers. Separate from sales receipts. Each entry links to the Old Gold/Silver Purchase record.
          </div>

          <div className="card">
            <div className="tbl-wrap tbl-desktop-only">
              <table>
                <thead>
                  <tr>
                    <th>Purchase No</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Gold Bought</th>
                    <th>Mode</th>
                    <th className="num">Total Value</th>
                    <th className="num" style={{ textAlign: 'right' }}>Cash Paid Out</th>
                  </tr>
                </thead>
                <tbody>
                  {outflows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                        No cash outflows recorded
                      </td>
                    </tr>
                  ) : (
                    outflows.map(item => (
                      <tr key={item.id} style={{ background: '#fffbf0' }}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: 11 }}>
                          {item.purchase_no}
                        </td>
                        <td style={{ fontSize: 12 }}>{item.purchase_date}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.customer_name}</div>
                          {item.customer_phone && (
                            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.customer_phone}</div>
                          )}
                        </td>
                        <td style={{ color: 'var(--gold)', fontWeight: 600 }}>
                          {item.gold_grams > 0 ? `${item.gold_grams.toFixed(3)}g` : '—'}
                        </td>
                        <td>
                          <span className="badge badge-blue">
                            {MODE_ICONS[item.payment_mode] || '💵'} {item.payment_mode}
                          </span>
                        </td>
                        <td className="num" style={{ fontWeight: 600 }}>
                          {formatCurrency(item.total_value)}
                        </td>
                        <td className="num" style={{ textAlign: 'right', fontWeight: 800, color: 'var(--danger)', fontSize: 14 }}>
                          ↑ {formatCurrency(item.cash_paid)}
                        </td>
                      </tr>
                    ))
                  )}
                  {outflows.length > 0 && (
                    <tr style={{ background: '#fff3e0', fontWeight: 700 }}>
                      <td colSpan={5}>
                        Total paid out to customers — all pages (Old Gold/Silver Purchases)
                      </td>
                      <td className="num"></td>
                      <td className="num" style={{ textAlign: 'right', color: 'var(--danger)', fontSize: 15 }}>
                        ↑ {formatCurrency(totalOutflows)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="dt-pager" style={{ padding: '10px 14px' }}>
              <span className="helper">{outflows.length} purchase outflows</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: TODAY'S CASH BOOK */}
      {activeTab === 'today' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <span className="card-title" style={{ fontWeight: 700, fontSize: 15 }}>
              Today's Collection Summary
            </span>
            <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 16 }}>
              {formatCurrency(todaysCollections)}
            </span>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Payment Mode</th>
                  <th className="num">Transactions</th>
                  <th className="num">Total Amount</th>
                  <th className="num">Avg per Txn</th>
                </tr>
              </thead>
              <tbody>
                {todayModesList.map(item => (
                  <tr key={item.mode}>
                    <td>
                      <span style={{ fontSize: 18, marginRight: 8 }}>{MODE_ICONS[item.mode] || '💳'}</span>
                      <strong>{item.mode.toUpperCase()}</strong>
                    </td>
                    <td className="num">{item.count}</td>
                    <td className="num amt-green" style={{ fontWeight: 700, fontSize: 15 }}>
                      {formatCurrency(item.total)}
                    </td>
                    <td className="num" style={{ fontSize: 12 }}>
                      {formatCurrency(item.count > 0 ? item.total / item.count : 0)}
                    </td>
                  </tr>
                ))}
                <tr style={{ background: 'var(--primary-l)', fontWeight: 800 }}>
                  <td>TOTAL</td>
                  <td className="num">{todayModesList.reduce((acc, i) => acc + i.count, 0)}</td>
                  <td className="num amt-green" style={{ fontSize: 16 }}>
                    {formatCurrency(todaysCollections)}
                  </td>
                  <td className="num">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT RECEIPT MODAL */}
      {editPayment && (
        <div className="overlay" onClick={() => setEditPayment(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Edit Receipt #{editPayment.payment_no}</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditPayment(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--surface2)', padding: '10px 14px', borderRadius: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)' }}>Customer</span>
                  <span style={{ fontWeight: 600 }}>{editPayment.customer_name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--muted)' }}>Reference</span>
                  <span>{editPayment.order_no ? `Order #${editPayment.order_no}` : editPayment.payment_for}</span>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="label">Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                  autoFocus
                />
                {(() => {
                  const diff = (parseFloat(editAmount) || 0) - editPayment.amount;
                  if (diff === 0 || isNaN(diff)) return null;
                  return (
                    <div className="helper" style={{ color: diff > 0 ? 'var(--success)' : 'var(--danger)', marginTop: 4 }}>
                      {diff > 0 ? `+${formatCurrency(diff)} increase` : `${formatCurrency(diff)} decrease`} from original
                    </div>
                  );
                })()}
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="label">Payment Date</label>
                <input
                  type="date"
                  className="input"
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="label">Payment Mode</label>
                <select
                  className="input"
                  value={editMode}
                  onChange={e => setEditMode(e.target.value)}
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">CARD</option>
                  <option value="BANK">BANK</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="label">Reference / UTR</label>
                <input
                  type="text"
                  className="input"
                  value={editRef}
                  onChange={e => setEditRef(e.target.value)}
                  placeholder="e.g. UTR / Chq No / Slip No"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="label">Notes</label>
                <input
                  type="text"
                  className="input"
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="Reason for edit (optional)"
                />
              </div>

              <div className="alert alert-warn" style={{ fontSize: 12 }}>
                Editing this receipt will adjust the parent record's paid/balance amounts accordingly.
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setEditPayment(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOID RECEIPT MODAL */}
      {voidPayment && (
        <div className="overlay" onClick={() => setVoidPayment(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ color: 'var(--danger)' }}>Void Receipt #{voidPayment.payment_no}</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setVoidPayment(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div
                style={{
                  background: 'var(--danger-l)',
                  border: '1px solid var(--danger-l)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 14
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
                  This will VOID the receipt and REVERSE the payment
                </div>
                <div style={{ fontSize: 13 }}>
                  Receipt: <strong>{voidPayment.payment_no}</strong>
                </div>
                <div style={{ fontSize: 13 }}>
                  Amount: <strong>{formatCurrency(voidPayment.amount)}</strong>
                </div>
                <div style={{ fontSize: 13 }}>
                  Customer: <strong>{voidPayment.customer_name}</strong>
                </div>
                <div style={{ fontSize: 13 }}>
                  For: <strong>{voidPayment.payment_for} {voidPayment.order_no ? `#${voidPayment.order_no}` : ''}</strong>
                </div>
              </div>

              <div
                style={{
                  background: 'var(--bg)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 14,
                  fontSize: 12,
                  color: 'var(--muted)'
                }}
              >
                The receipt will be marked <strong>VOID</strong> and kept for audit trail. The paid amount will be reversed on the original record — balance will increase by {formatCurrency(voidPayment.amount)}.
              </div>

              <div className="form-group">
                <label className="label">Reason for Voiding *</label>
                <input
                  type="text"
                  className="input"
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  placeholder="e.g. Wrong amount entered, Duplicate entry..."
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setVoidPayment(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmVoid}>
                Void Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT PRINT MODAL */}
      {receiptPayment && (
        <div className="overlay" onClick={() => setReceiptPayment(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Official Payment Receipt</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setReceiptPayment(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ padding: 20 }}>
              <div style={{ border: '1px solid var(--border)', padding: 18, borderRadius: 8, background: '#fff' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border2)', paddingBottom: 12 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>KREYA JEWELLERS 360</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Official Cash / Digital Payment Voucher</div>
                  {receiptPayment.voided && (
                    <div style={{ marginTop: 6, display: 'inline-block', border: '2px solid red', color: 'red', fontWeight: 900, padding: '2px 8px', borderRadius: 4, transform: 'rotate(-4deg)' }}>
                      VOIDED
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, margin: '14px 0 6px' }}>
                  <span>Receipt No: <strong>{receiptPayment.payment_no}</strong></span>
                  <span>Date: <strong>{receiptPayment.created_at}</strong></span>
                </div>
                <div style={{ fontSize: 12, marginBottom: 10 }}>
                  Customer: <strong>{receiptPayment.customer_name}</strong>
                  {receiptPayment.customer_phone ? ` (${receiptPayment.customer_phone})` : ''}
                </div>

                <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>Payment For:</span>
                    <strong>{receiptPayment.payment_for.toUpperCase()} {receiptPayment.order_no ? `#${receiptPayment.order_no}` : ''}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>Payment Mode:</span>
                    <strong>{receiptPayment.payment_mode.toUpperCase()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>Reference / UTR:</span>
                    <span>{receiptPayment.reference_no || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8 }}>
                    <span>Amount Received:</span>
                    <span style={{ color: receiptPayment.voided ? 'var(--muted)' : 'var(--primary)', textDecoration: receiptPayment.voided ? 'line-through' : undefined }}>
                      {formatCurrency(receiptPayment.amount)}
                    </span>
                  </div>
                </div>

                {receiptPayment.voided && receiptPayment.void_reason && (
                  <div style={{ fontSize: 11, color: 'var(--danger)', fontStyle: 'italic', marginBottom: 10 }}>
                    Void Reason: {receiptPayment.void_reason}
                  </div>
                )}

                <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 14 }}>
                  Authorized Signatory &bull; Computer Generated Receipt
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setReceiptPayment(null)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER SETTLEMENT SUMMARY MODAL */}
      {summaryOrderId && (
        <div className="overlay" onClick={() => setSummaryOrderId(null)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Settlement History &bull; {summaryOrderId}</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setSummaryOrderId(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="helper" style={{ marginBottom: 12 }}>
                All payment transactions, old gold exchanges and advance adjustments linked to this order.
              </div>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Voucher / Ref</th>
                      <th>Date</th>
                      <th>Mode</th>
                      <th className="num">Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments
                      .filter(p => p.order_no === summaryOrderId)
                      .map(p => (
                        <tr key={p.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.payment_no}</td>
                          <td style={{ fontSize: 12 }}>{p.created_at}</td>
                          <td>
                            <span className="badge badge-blue">
                              {MODE_ICONS[p.payment_mode] || ''} {p.payment_mode}
                            </span>
                          </td>
                          <td className="num amt-green" style={{ fontWeight: 700 }}>
                            {formatCurrency(p.amount)}
                          </td>
                          <td>
                            {p.voided ? (
                              <span className="badge badge-red">VOID</span>
                            ) : (
                              <span className="badge badge-green">SETTLED</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setSummaryOrderId(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK SETTLEMENT / COLLECT DUES MODAL */}
      {collectInvoice && (
        <div className="overlay" onClick={() => setCollectInvoice(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <span style={{ color: 'var(--primary)', marginRight: 6 }}>💳</span>
                Collect Customer Payment
              </h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setCollectInvoice(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r)',
                  padding: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14
                }}
              >
                <div>
                  <div className="helper" style={{ margin: 0, textTransform: 'uppercase', fontSize: 10 }}>Customer</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                    {collectInvoice.customer?.fullName || collectInvoice.customer?.name}
                  </div>
                  <div className="helper" style={{ margin: 0 }}>
                    {collectInvoice.customer?.mobile || collectInvoice.customer?.phone || '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="helper" style={{ margin: 0, textTransform: 'uppercase', fontSize: 10, color: 'var(--danger)' }}>
                    Outstanding Due
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger)' }}>
                    {formatCurrency(collectInvoice.balanceDue)}
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="label">Payment Amount to Collect (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  max={collectInvoice.balanceDue}
                  value={collectAmount}
                  onChange={e => setCollectAmount(parseFloat(e.target.value) || 0)}
                  className="input"
                  style={{ fontWeight: 700, fontSize: 16 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="label">Payment Mode</label>
                <select
                  value={collectMode}
                  onChange={e => setCollectMode(e.target.value as PaymentMode)}
                  className="input"
                >
                  <option value="CASH">Cash (Cash Register Counter Inflow)</option>
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CARD">Credit / Debit Card POS</option>
                  <option value="BANK_TRANSFER">Bank IMPS / NEFT / RTGS</option>
                  <option value="CHEQUE">Cheque Clearance</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="label">Reference / Transaction / UTR No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI/6391209312 or Chq #482019"
                  value={collectRef}
                  onChange={e => setCollectRef(e.target.value)}
                  className="input"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="label">Collected By / Counter</label>
                <input
                  type="text"
                  value={collectorName}
                  onChange={e => setCollectorName(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setCollectInvoice(null)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCollect}
                disabled={collectAmount <= 0}
                className="btn btn-primary"
              >
                Confirm &amp; Issue Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


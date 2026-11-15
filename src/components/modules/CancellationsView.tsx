import React, { useState } from 'react';
import { 
  RotateCcw, Search, AlertCircle, FileText, ArrowRight, CheckCircle2, 
  Printer, DollarSign, Clock, ShieldAlert, X, ChevronRight, Tag 
} from 'lucide-react';
import { CancellationRecord, CreditMemoRecord, StoreProfile } from '../../types';

interface CancellationsViewProps {
  store: StoreProfile;
  cancellations: CancellationRecord[];
  creditMemos: CreditMemoRecord[];
  onIssueRefund: (memo: CreditMemoRecord) => void;
}

export const CancellationsView: React.FC<CancellationsViewProps> = ({
  store,
  cancellations: cancellationsList,
  creditMemos,
  onIssueRefund
}) => {
  const [activeTab, setActiveTab] = useState<'cancellations' | 'credit_memos'>('cancellations');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCancellation, setSelectedCancellation] = useState<CancellationRecord | null>(null);
  const [activeCreditMemoForRefund, setActiveCreditMemoForRefund] = useState<CreditMemoRecord | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [activeSlipData, setActiveSlipData] = useState<any>(null);

  // Refund form states
  const [refundMode, setRefundMode] = useState<string>('cash');
  const [refundRefNo, setRefundRefNo] = useState<string>('');
  const [refundNotes, setRefundNotes] = useState<string>('');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const [refundDate, setRefundDate] = useState(today);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Filter calculations
  const totalCancelledCount = cancellationsList.length;
  const fullOrderCount = cancellationsList.filter(c => c.referenceType === 'order').length;
  const partialOrderCount = cancellationsList.filter(c => c.referenceType === 'partial_order').length;
  const pendingRefundsCount = creditMemos.filter(c => c.refundStatus === 'pending').length;
  const totalRefundSum = creditMemos.reduce((s, c) => s + (c.refundAmount || 0), 0);

  const filteredCancellations = cancellationsList.filter(c => 
    !searchQuery || 
    c.cancellationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.originalInvoiceNo && c.originalInvoiceNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCreditMemos = creditMemos.filter(c =>
    !searchQuery ||
    c.creditMemoNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProcessRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCreditMemoForRefund || !refundDate || refundDate > today) return;
    onIssueRefund({
      ...activeCreditMemoForRefund,
      refundStatus: 'issued',
      refundMode,
      refundDate,
      refundReference: refundRefNo.trim() || undefined,
      notes: [activeCreditMemoForRefund.notes, refundNotes.trim()].filter(Boolean).join(' | ')
    });

    setActiveCreditMemoForRefund(null);
    setRefundRefNo('');
    setRefundNotes('');
  };

  const openSlip = (data: any, type: 'cancellation' | 'credit_memo') => {
    setActiveSlipData({ ...data, slipType: type });
    setShowSlipModal(true);
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Cancellations & Refunds</h1>
          <p>{totalCancelledCount} cancellations · {pendingRefundsCount} pending refunds</p>
        </div>
      </div>

      {/* Sum Grid Matching Kreya .sum-grid .sum-box */}
      <div className="sum-grid">
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)' }}>{totalCancelledCount}</div>
          <div className="sum-lbl">Total Cancelled</div>
        </div>

        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--danger)' }}>{fullOrderCount}</div>
          <div className="sum-lbl">Full Cancellations</div>
        </div>

        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--warn)' }}>{partialOrderCount}</div>
          <div className="sum-lbl">Partial Cancellations</div>
        </div>

        <div className="sum-box">
          <div className="sum-val" style={{ color: pendingRefundsCount > 0 ? 'var(--danger)' : 'var(--text)' }}>{pendingRefundsCount}</div>
          <div className="sum-lbl">Pending Refunds</div>
        </div>

        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)' }}>
            ₹{totalRefundSum.toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Total Refund Amount</div>
        </div>
      </div>

      {/* Tabs matching Kreya .tabs .tab */}
      <div className="tabs">
        <button
          type="button"
          onClick={() => setActiveTab('cancellations')}
          className={`tab ${activeTab === 'cancellations' ? 'active' : ''}`}
        >
          Cancellations ({cancellationsList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('credit_memos')}
          className={`tab ${activeTab === 'credit_memos' ? 'active' : ''}`}
        >
          <span>Credit Memos ({creditMemos.length})</span>
          {pendingRefundsCount > 0 && (
            <span style={{ 
              background: 'var(--danger-l)', 
              color: 'var(--danger)', 
              fontSize: 10, 
              fontWeight: 700, 
              padding: '1px 6px', 
              borderRadius: 10,
              marginLeft: 6 
            }}>
              {pendingRefundsCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Card */}
      <div className="card">
        <div className="card-body" style={{ padding: 14 }}>
          <div className="search-row" style={{ margin: 0 }}>
            <div className="search-box">
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Can No, Order No, Customer..."
              />
            </div>
          </div>
        </div>

        {/* TAB 1: CANCELLATIONS */}
        {activeTab === 'cancellations' && (
          <div className="tbl-wrap tbl-desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Can. No</th>
                  <th>Type</th>
                  <th>Order Ref</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="num">Total (₹)</th>
                  <th className="num">Paid Collected</th>
                  <th className="num">Deduction</th>
                  <th className="num">Refund</th>
                  <th>Credit Memo</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCancellations.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: 'var(--danger)' }}>
                      {c.cancellationNo}
                    </td>
                    <td>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: 10,
                        fontWeight: 700,
                        background: c.referenceType === 'order' ? 'var(--info-l)' : 'var(--warn-l)',
                        color: c.referenceType === 'order' ? 'var(--info-m)' : 'var(--warn)'
                      }}>
                        {c.referenceType === 'order' ? 'Full Order' : 'Partial'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {c.originalInvoiceNo || c.originalReferenceNo}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.customerName}</div>
                      <div className="helper" style={{ margin: 0 }}>{c.customerPhone || c.customerMobile}</div>
                    </td>
                    <td style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.itemsSummary || c.reason}>
                      {c.itemsSummary || c.reason || 'All line items'}
                    </td>
                    <td className="num">
                      ₹{(c.originalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="num" style={{ color: 'var(--primary)' }}>
                      ₹{(c.paidAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="num" style={{ color: 'var(--danger)' }}>
                      ₹{(c.deductionAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="num" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{(c.refundAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ color: 'var(--muted)' }}>
                      {c.creditMemoNo || '—'}
                    </td>
                    <td>
                      {c.date || (c.cancelledAt ? c.cancelledAt.slice(0, 10) : '—')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => openSlip(c, 'cancellation')}
                        className="btn btn-xs btn-outline"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCancellations.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                      No cancellation records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: CREDIT MEMOS */}
        {activeTab === 'credit_memos' && (
          <div className="tbl-wrap tbl-desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Credit Memo No</th>
                  <th>Invoice Ref</th>
                  <th>Customer</th>
                  <th className="num">Original (₹)</th>
                  <th className="num">Deduction (₹)</th>
                  <th className="num">Refund Amount (₹)</th>
                  <th>Refund Mode</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCreditMemos.map((cm) => (
                  <tr key={cm.id}>
                    <td style={{ fontWeight: 600 }}>
                      {cm.creditMemoNo}
                    </td>
                    <td>{cm.orderNo}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{cm.customerName}</div>
                      <div className="helper" style={{ margin: 0 }}>{cm.customerPhone}</div>
                    </td>
                    <td className="num">
                      ₹{cm.originalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="num" style={{ color: 'var(--danger)' }}>
                      ₹{cm.deductionAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="num" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{cm.refundAmount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: 10,
                        fontWeight: 600,
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)'
                      }}>
                        {cm.refundMode.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: 10,
                        fontWeight: 700,
                        background: cm.refundStatus === 'issued' ? 'var(--success-l)' : 'var(--warn-l)',
                        color: cm.refundStatus === 'issued' ? 'var(--success-m)' : 'var(--warn)'
                      }}>
                        {cm.refundStatus === 'issued' ? 'Refund Issued' : 'Pending Payout'}
                      </span>
                    </td>
                    <td>{cm.refundDate || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {cm.refundStatus === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => { setRefundDate(today); setActiveCreditMemoForRefund(cm); }}
                            className="btn btn-xs btn-primary"
                          >
                            Disburse
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => openSlip(cm, 'credit_memo')}
                          className="btn btn-xs btn-outline"
                          title="Print Credit Note"
                        >
                          <Printer size={11} /> Print Credit Note
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCreditMemos.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                      No credit memo records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="dt-pager">
          <span className="helper">
            {activeTab === 'cancellations' ? `${filteredCancellations.length} records` : `${filteredCreditMemos.length} credit memos`}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
            <span className="helper">Rows per page:</span>
            <select 
              className="input input-sm" 
              style={{ width: 'auto', minHeight: 32, padding: '4px 24px 4px 8px' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <div className="btn-group">
              <button 
                type="button"
                className="btn btn-xs btn-outline" 
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Prev
              </button>
              <button type="button" className="btn btn-xs btn-primary" onClick={() => setCurrentPage(currentPage)}>{currentPage}</button>
              <button 
                type="button"
                className="btn btn-xs btn-outline" 
                disabled={currentPage >= Math.ceil((activeTab === 'cancellations' ? filteredCancellations.length : filteredCreditMemos.length) / pageSize)}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Disburse Refund Modal */}
      {activeCreditMemoForRefund && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10, 8, 30, 0.55)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', background: 'var(--surface)', padding: 0 }}>
            <div className="modal-head">
              <div>
                <h3>Issue Refund Voucher</h3>
                <div className="helper" style={{ margin: 0 }}>
                  {activeCreditMemoForRefund.creditMemoNo} · {activeCreditMemoForRefund.customerName}
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveCreditMemoForRefund(null)}
                className="btn btn-xs btn-outline"
                style={{ padding: '2px 8px', minWidth: 28 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="helper" style={{ margin: 0, fontSize: 13 }}>Refund Amount Due:</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                  ₹{activeCreditMemoForRefund.refundAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="label">Payout Payment Mode</label>
                <div className="g2">
                  {[
                    { id: 'cash', label: 'Cash (Counter MAIN)' },
                    { id: 'upi', label: 'UPI / QR Transfer' },
                    { id: 'bank_transfer', label: 'Bank RTGS / NEFT' },
                    { id: 'customer_credit', label: 'Store Credit Voucher' }
                  ].map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setRefundMode(m.id)}
                      className={`btn btn-sm ${refundMode === m.id ? 'btn-primary' : 'btn-outline'}`}
                      style={{ justifyContent: 'flex-start', fontSize: 12 }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {refundMode !== 'cash' && refundMode !== 'customer_credit' && (
                <div>
                  <label className="label">Transaction Ref / UTR No. *</label>
                  <input
                    type="text"
                    required
                    value={refundRefNo}
                    onChange={(e) => setRefundRefNo(e.target.value)}
                    placeholder="e.g. UTR / IMPS ref 429384729"
                    className="input"
                  />
                </div>
              )}

              <div>
                <label className="label">Refund Date</label>
                <input
                  type="date"
                  required
                  max={today}
                  value={refundDate}
                  onChange={(e) => setRefundDate(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Notes / Authorization</label>
                <input
                  type="text"
                  value={refundNotes}
                  onChange={(e) => setRefundNotes(e.target.value)}
                  placeholder="e.g. Approved by Showroom Manager"
                  className="input"
                />
              </div>

              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setActiveCreditMemoForRefund(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Mark as Refunded
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slip Modal */}
      {showSlipModal && activeSlipData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in">
            <div className="bg-[#171c19] text-white px-5 py-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#c5a46d]">
                {activeSlipData.slipType === 'credit_memo' ? 'Credit Memo Voucher' : 'Order Cancellation Receipt'}
              </span>
              <button 
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="text-white/60 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 text-xs text-slate-800 space-y-3 font-mono bg-[#fdfdfc]">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h3 className="font-bold text-sm font-sans tracking-wide text-slate-900">
                  {store.legalName || 'DADHIBAMAN JEWELLERS'}
                </h3>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">{store.address}</p>
                <p className="text-[10px] text-slate-500 font-sans">GSTIN: {store.gstin}</p>
                <div className="mt-2 text-xs font-bold uppercase bg-slate-100 py-1 rounded font-sans">
                  {activeSlipData.slipType === 'credit_memo' ? 'CREDIT NOTE / REFUND ADVICE' : 'TAX INVOICE CANCELLATION'}
                </div>
              </div>

              <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-300">
                <div>Document: <strong>{activeSlipData.cancellationNo || activeSlipData.creditMemoNo}</strong></div>
                <div>Invoice Ref: <strong>{activeSlipData.originalInvoiceNo || activeSlipData.orderNo}</strong></div>
                <div>Customer: <strong>{activeSlipData.customerName}</strong></div>
                <div>Date: <strong>{activeSlipData.date || activeSlipData.refundDate || '15-Nov-2026'}</strong></div>
              </div>

              <div className="space-y-1.5 text-xs pb-3 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Original Order Value:</span>
                  <span>₹{(activeSlipData.originalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Less Deductions:</span>
                  <span>-₹{(activeSlipData.deductionAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold text-sm text-[#237a57]">
                  <span>Refund Disbursed:</span>
                  <span>₹{(activeSlipData.refundAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Payment Mode:</span>
                  <span className="font-bold uppercase">{activeSlipData.refundMode}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 pt-2 text-center">
                Authorized showroom sign-off. Stock restocked into inventory ledger.
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-[#237a57] hover:bg-[#185b40] text-white text-xs font-bold rounded flex items-center space-x-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{activeSlipData.slipType === 'credit_memo' ? 'Print Credit Note' : 'Print Receipt'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded cursor-pointer"
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


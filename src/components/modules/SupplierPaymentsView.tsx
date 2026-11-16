import React, { useState, useMemo } from 'react';
import { 
  CreditCard, Plus, Search, Filter, Calendar, Eye, 
  CheckCircle2, AlertCircle, X, Download, Printer, 
  Trash2, ChevronRight, ShoppingBag, Truck, Receipt, 
  Building2, ArrowRight, RotateCcw, Ban, FileText, 
  Coins, Sparkles, Check, DollarSign
} from 'lucide-react';
import { 
  Supplier, SupplierBill, SupplierPayment, SupplierPaymentAllocation, 
  PaymentMode 
} from '../../types';

interface SupplierPaymentsViewProps {
  suppliers: Supplier[];
  supplierBills: SupplierBill[];
  supplierPayments: SupplierPayment[];
  onRecordSupplierPayment?: (spay: SupplierPayment) => void;
  onNavigate?: (tab: string, id?: string) => void;
}

const DEFAULT_SAMPLE_PAYMENTS: SupplierPayment[] = [
  {
    id: "sp-0001",
    paymentNumber: "SPAY-2026-00001",
    billNumber: "BILL-SUP-2026-0001",
    billId: "sb-0001",
    supplierId: "sup-004",
    supplierName: "Rajesh Bullion Refinery Ltd",
    date: "2026-11-05",
    amount: 808550.00,
    moneyAmount: 808550.00,
    mode: "RTGS",
    referenceNo: "RTGS/HDFC2026110500918",
    utr: "RTGS/HDFC2026110500918",
    operator: "Admin (Shop Owner)",
    status: "ACTIVE",
    notes: "Full settlement for 100g 24K casting bullion bar tax invoice BILL-SUP-2026-0001 via HDFC Current A/c RTGS. UTR #HDFC2026110500918.",
    unallocated: 0,
    openingApplied: 0,
    allocations: [
      { billId: "sb-0001", billNumber: "BILL-SUP-2026-0001", amount: 808550.00 }
    ]
  },
  {
    id: "sp-001",
    paymentNumber: "SPAY-2026-00055",
    billNumber: "BILL-SUP-891",
    billId: "sb-001",
    supplierId: "sup-002",
    supplierName: "Rajkot Fine Chains Pvt. Ltd.",
    date: "2026-11-07",
    amount: 500000.00,
    moneyAmount: 500000.00,
    mode: "BANK_TRANSFER",
    referenceNo: "RTGS/HDFC90812345",
    utr: "RTGS/HDFC90812345",
    operator: "Admin (Shop Owner)",
    status: "ACTIVE",
    notes: "Part payment against chain consignment bill BILL-SUP-891 via HDFC Current A/c.",
    unallocated: 0,
    openingApplied: 0,
    allocations: [
      { billId: "sb-001", billNumber: "BILL-SUP-891", amount: 500000.00 }
    ]
  },
  {
    id: "sp-002",
    paymentNumber: "SPAY-2026-00056",
    billNumber: "BILL-SUP-891",
    billId: "sb-001",
    supplierId: "sup-002",
    supplierName: "Rajkot Fine Chains Pvt. Ltd.",
    date: "2026-11-09",
    amount: 231700.00,
    moneyAmount: 75000.00,
    mode: "NEFT",
    referenceNo: "NEFT/ICIC229014",
    utr: "NEFT/ICIC229014",
    operator: "Admin",
    status: "ACTIVE",
    notes: "Settled with ₹75,000 NEFT + 20.000g 24K Refined Gold Bar transfer from refinery.",
    unallocated: 0,
    metalAdjustment: {
      metal: "gold",
      purity: "24K (999)",
      fineQty: 20.000,
      ratePer10g: 78350.00,
      metalAmount: 156700.00
    },
    allocations: [
      { billId: "sb-001", billNumber: "BILL-SUP-891", amount: 231700.00 }
    ]
  },
  {
    id: "sp-003",
    paymentNumber: "SPAY-2026-00057",
    billNumber: "BILL-SUP-892",
    billId: "sb-002",
    supplierId: "sup-003",
    supplierName: "Surat Diamond Cutters",
    date: "2026-11-10",
    amount: 545900.00,
    moneyAmount: 545900.00,
    mode: "RTGS",
    referenceNo: "RTGS/SBIN890123",
    utr: "RTGS/SBIN890123",
    operator: "Admin",
    status: "ACTIVE",
    notes: "Full settlement for diamond solitaire rings bill SDC/INV/1102.",
    unallocated: 0,
    allocations: [
      { billId: "sb-002", billNumber: "BILL-SUP-892", amount: 545900.00 }
    ]
  }
];

export const SupplierPaymentsView: React.FC<SupplierPaymentsViewProps> = ({
  suppliers,
  supplierBills,
  supplierPayments: initialPayments,
  onRecordSupplierPayment,
  onNavigate
}) => {
  // Merge prop payments with default samples
  const [paymentsList, setPaymentsList] = useState<SupplierPayment[]>(() => {
    if (initialPayments && initialPayments.length > 0) {
      return initialPayments.map((p, idx) => {
        const sample = DEFAULT_SAMPLE_PAYMENTS.find(s => s.id === p.id || s.paymentNumber === p.paymentNumber) || DEFAULT_SAMPLE_PAYMENTS[idx] || DEFAULT_SAMPLE_PAYMENTS[0];
        return {
          ...sample,
          ...p,
          allocations: p.allocations || sample.allocations || []
        };
      });
    }
    return DEFAULT_SAMPLE_PAYMENTS;
  });

  React.useEffect(() => {
    if (initialPayments && initialPayments.length > 0) {
      setPaymentsList(initialPayments.map((p, idx) => {
        const sample = DEFAULT_SAMPLE_PAYMENTS.find(s => s.id === p.id || s.paymentNumber === p.paymentNumber) || DEFAULT_SAMPLE_PAYMENTS[idx] || DEFAULT_SAMPLE_PAYMENTS[0];
        return {
          ...sample,
          ...p,
          allocations: p.allocations || sample.allocations || []
        };
      }));
    }
  }, [initialPayments]);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentDetail, setSelectedPaymentDetail] = useState<SupplierPayment | null>(null);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReasonText, setVoidReasonText] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Form State
  const [formSupplierId, setFormSupplierId] = useState(suppliers[0]?.id || 'sup-001');
  const [formMoneyAmount, setFormMoneyAmount] = useState<number>(100000);
  const [formMode, setFormMode] = useState<string>('NEFT');
  const [formUtr, setFormUtr] = useState(`NEFT/HDFC${Math.floor(100000 + Math.random() * 900000)}`);
  const [formPaymentDate, setFormPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [formNotes, setFormNotes] = useState('');

  // Metal Adjustment Toggle
  const [payWithMetal, setPayWithMetal] = useState(false);
  const [metalType, setMetalType] = useState<'gold' | 'silver'>('gold');
  const [metalFineQty, setMetalFineQty] = useState<number>(10.000);
  const [metalRatePer10g, setMetalRatePer10g] = useState<number>(78500);

  // Allocation State
  const [allocateByHand, setAllocateByHand] = useState(false);
  const [customAllocations, setCustomAllocations] = useState<Record<string, number>>({});
  const [openingBalanceAllocation, setOpeningBalanceAllocation] = useState<number>(0);

  // Selected Supplier Profile
  const selectedSupplier = useMemo(() => {
    return suppliers.find(s => s.id === formSupplierId) || suppliers[0];
  }, [suppliers, formSupplierId]);

  // Unpaid Bills for selected supplier
  const supplierUnpaidBills = useMemo(() => {
    return supplierBills.filter(b => (b.supplierId === formSupplierId || b.supplierName === selectedSupplier.tradeName) && b.balanceDue > 0);
  }, [supplierBills, formSupplierId, selectedSupplier]);

  // Refined Metal Inventory In Hand (from Refinery Ledger)
  const inHandRefinedStock = {
    gold: 450.250, // grams
    silver: 12500.000 // grams
  };

  // Metal Value Calculation
  const computedMetalValue = useMemo(() => {
    if (!payWithMetal) return 0;
    return Math.round((metalFineQty * (metalRatePer10g / 10)) * 100) / 100;
  }, [payWithMetal, metalFineQty, metalRatePer10g]);

  // Total Settled Amount = Money + Metal
  const computedTotalSettled = useMemo(() => {
    return Math.round((Number(formMoneyAmount || 0) + computedMetalValue) * 100) / 100;
  }, [formMoneyAmount, computedMetalValue]);

  // Automatic Waterfall Allocations calculation
  const automaticAllocations = useMemo(() => {
    let remaining = computedTotalSettled;
    const allocs: Record<string, number> = {};
    let openingSettled = 0;

    // 1. Settle opening balance if any
    const openingDue = selectedSupplier.currentBalanceDue || 0;
    if (openingDue > 0 && remaining > 0) {
      openingSettled = Math.min(openingDue, remaining);
      remaining -= openingSettled;
    }

    // 2. Settle oldest due bills first
    for (const bill of supplierUnpaidBills) {
      if (remaining <= 0) break;
      const allocated = Math.min(bill.balanceDue, remaining);
      allocs[bill.id] = allocated;
      remaining -= allocated;
    }

    return {
      allocs,
      openingSettled,
      advance: remaining > 0 ? remaining : 0
    };
  }, [computedTotalSettled, selectedSupplier, supplierUnpaidBills]);

  // Active Total Allocated
  const activeTotalAllocated = useMemo(() => {
    if (allocateByHand) {
      const sumBills = Object.values(customAllocations).reduce((acc, v) => acc + (v || 0), 0);
      return sumBills + (openingBalanceAllocation || 0);
    }
    return computedTotalSettled - automaticAllocations.advance;
  }, [allocateByHand, customAllocations, openingBalanceAllocation, computedTotalSettled, automaticAllocations]);

  const activeAdvance = useMemo(() => {
    if (allocateByHand) {
      return Math.max(0, computedTotalSettled - activeTotalAllocated);
    }
    return automaticAllocations.advance;
  }, [allocateByHand, computedTotalSettled, activeTotalAllocated, automaticAllocations]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return paymentsList.filter(p => {
      const matchSearch = 
        p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.referenceNo && p.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchMode = modeFilter === 'ALL' || p.mode === modeFilter;
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;

      return matchSearch && matchMode && matchStatus;
    });
  }, [paymentsList, searchTerm, modeFilter, statusFilter]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalCount = paymentsList.length;
    const totalAmount = paymentsList.filter(p => p.status !== 'VOIDED').reduce((acc, p) => acc + p.amount, 0);
    const totalMoney = paymentsList.filter(p => p.status !== 'VOIDED').reduce((acc, p) => acc + (p.moneyAmount ?? p.amount), 0);
    const totalMetalVal = paymentsList.filter(p => p.status !== 'VOIDED' && p.metalAdjustment).reduce((acc, p) => acc + (p.metalAdjustment?.metalAmount || 0), 0);
    const totalAdvance = paymentsList.filter(p => p.status !== 'VOIDED').reduce((acc, p) => acc + (p.unallocated || 0), 0);

    return {
      totalCount,
      totalAmount,
      totalMoney,
      totalMetalVal,
      totalAdvance
    };
  }, [paymentsList]);

  // Save Payment
  const handleSavePayment = () => {
    const paymentNumber = `SPAY-2026-${String(paymentsList.length + 58).padStart(5, '0')}`;
    const allocationsList: SupplierPaymentAllocation[] = [];

    if (allocateByHand) {
      for (const [billId, amt] of Object.entries(customAllocations)) {
        if (amt > 0) {
          const bill = supplierBills.find(b => b.id === billId);
          allocationsList.push({
            billId,
            billNumber: bill?.billNumber || billId,
            amount: amt
          });
        }
      }
    } else {
      for (const [billId, amt] of Object.entries(automaticAllocations.allocs)) {
        if (amt > 0) {
          const bill = supplierBills.find(b => b.id === billId);
          allocationsList.push({
            billId,
            billNumber: bill?.billNumber || billId,
            amount: amt
          });
        }
      }
    }

    const newPayment: SupplierPayment = {
      id: `sp-${Date.now()}`,
      paymentNumber,
      billNumber: allocationsList.map(a => a.billNumber).join(', ') || 'Advance Payment',
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.tradeName,
      date: formPaymentDate,
      amount: computedTotalSettled,
      moneyAmount: Number(formMoneyAmount || 0),
      mode: formMode,
      referenceNo: formUtr,
      utr: formUtr,
      operator: 'Admin (Shop Owner)',
      status: 'ACTIVE',
      notes: formNotes,
      unallocated: activeAdvance,
      openingApplied: allocateByHand ? openingBalanceAllocation : automaticAllocations.openingSettled,
      metalAdjustment: payWithMetal ? {
        metal: metalType,
        purity: metalType === 'gold' ? '24K (999)' : '999 Silver',
        fineQty: metalFineQty,
        ratePer10g: metalRatePer10g,
        metalAmount: computedMetalValue
      } : undefined,
      allocations: allocationsList
    };

    const nextList = [newPayment, ...paymentsList];
    setPaymentsList(nextList);
    if (onRecordSupplierPayment) onRecordSupplierPayment(newPayment);
    setShowPaymentModal(false);
    setSelectedPaymentDetail(newPayment);
  };

  // Void Payment
  const handleVoidPayment = (payment: SupplierPayment, reason: string) => {
    const updated: SupplierPayment = {
      ...payment,
      status: 'VOIDED',
      voidReason: reason
    };
    const nextList = paymentsList.map(p => p.id === payment.id ? updated : p);
    setPaymentsList(nextList);
    setSelectedPaymentDetail(updated);
    setShowVoidModal(false);
    setVoidReasonText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <CreditCard size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Supplier Payments</h1>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                Payments to suppliers, allocated to the oldest bills first; anything left is a supplier advance. Open a payment for the bills, GRNs and POs it settled.
              </p>
            </div>
          </div>
        </div>

        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => {
              setFormMoneyAmount(100000);
              setFormPaymentDate(new Date().toISOString().slice(0, 10));
              setFormUtr(`NEFT/HDFC${Math.floor(100000 + Math.random() * 900000)}`);
              setFormNotes('');
              setPayWithMetal(false);
              setShowPaymentModal(true);
            }}
          >
            <Plus size={16} /> New payment
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => {
              const csv = [
                ['Payment #', 'Date', 'Supplier', 'Mode', 'UTR/Ref', 'Money Amount', 'Metal Amount', 'Total Settled', 'Advance', 'Status'],
                ...paymentsList.map(p => [
                  p.paymentNumber, p.date, p.supplierName, p.mode, p.referenceNo,
                  p.moneyAmount ?? p.amount, p.metalAdjustment?.metalAmount || 0, p.amount, p.unallocated || 0, p.status
                ])
              ].map(r => r.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `supplier_payments_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            }}
          >
            <Download size={15} /> Export CSV
          </button>

        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="s360-grid">
        <div className="card s360-card">
          <div className="s360-label">Total Settled</div>
          <div className="s360-val" style={{ color: 'var(--success)' }}>
            ₹{(kpis.totalAmount / 100000).toFixed(2)} L
          </div>
          <div className="helper">₹{kpis.totalAmount.toLocaleString('en-IN')} all disbursements</div>
        </div>

        <div className="card s360-card">
          <div className="s360-label">Bank / Cash Money Paid</div>
          <div className="s360-val">
            ₹{(kpis.totalMoney / 100000).toFixed(2)} L
          </div>
          <div className="helper">RTGS, NEFT, IMPS & Cheques</div>
        </div>

        <div className="card s360-card">
          <div className="s360-label">Refined Metal Bar Transferred</div>
          <div className="s360-val" style={{ color: 'var(--gold)' }}>
            ₹{kpis.totalMetalVal.toLocaleString('en-IN')}
          </div>
          <div className="helper">24K Bullion / refinery bars</div>
        </div>

        <div className="card s360-card">
          <div className="s360-label">Unallocated Advance</div>
          <div className="s360-val" style={{ color: 'var(--indigo, #4f46e5)' }}>
            ₹{kpis.totalAdvance.toLocaleString('en-IN')}
          </div>
          <div className="helper">Held with suppliers for next POs</div>
        </div>
      </div>

      {/* 3. Filter Toolbar */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, flex: '1 1 320px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--muted)' }} />
              <input 
                type="text" 
                className="input input-sm" 
                style={{ paddingLeft: 34, width: '100%' }}
                placeholder="Search Payment #, Supplier, UTR..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              className="input input-sm" 
              style={{ width: 'auto' }}
              value={modeFilter}
              onChange={e => setModeFilter(e.target.value)}
            >
              <option value="ALL">All Payment Modes</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="IMPS">IMPS</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>

            <select 
              className="input input-sm" 
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="VOIDED">Voided</option>
            </select>
          </div>

          <div className="helper">
            Showing <b>{filteredPayments.length}</b> of <b>{paymentsList.length}</b> payments
          </div>
        </div>
      </div>

      {/* 4. Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Payment</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Mode</th>
                <th>UTR</th>
                <th className="num">Money</th>
                <th className="num">Metal g</th>
                <th className="num">Total</th>
                <th>Bills</th>
                <th className="num">Advance</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right', width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((pay) => (
                <tr 
                  key={pay.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedPaymentDetail(pay)}
                >
                  <td>
                    <span className="mono" style={{ fontWeight: 700, color: 'var(--success, #059669)' }}>
                      {pay.paymentNumber}
                    </span>
                  </td>
                  <td>{new Date(pay.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{pay.supplierName}</div>
                  </td>
                  <td>
                    <span className="badge badge-teal" style={{ fontSize: 11 }}>
                      {pay.mode}
                    </span>
                  </td>
                  <td><span className="mono">{pay.referenceNo || pay.utr || '—'}</span></td>
                  <td className="num mono">₹{(pay.moneyAmount ?? pay.amount).toLocaleString('en-IN')}</td>
                  <td className="num mono">
                    {pay.metalAdjustment ? `${pay.metalAdjustment.fineQty.toFixed(3)} g` : '—'}
                  </td>
                  <td className="num mono" style={{ fontWeight: 700, color: 'var(--success)' }}>
                    ₹{pay.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <div className="helper mono" style={{ fontSize: 11 }}>
                      {pay.billNumber || 'Direct Advance'}
                    </div>
                  </td>
                  <td className="num mono">
                    {pay.unallocated ? `₹${pay.unallocated.toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {pay.status === 'ACTIVE' ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge badge-red">Voided</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        title="View Payment Voucher"
                        onClick={() => setSelectedPaymentDetail(pay)}
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-xs"
                        title="Payment Receipt"
                        onClick={() => {
                          setSelectedPaymentDetail(pay);
                          setShowReceiptModal(true);
                        }}
                      >
                        <Printer size={13} />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <CreditCard size={36} style={{ color: 'var(--muted)', opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, fontSize: 15 }}>No Supplier Payments Recorded</div>
                      <div className="helper" style={{ maxWidth: 360 }}>
                        {searchTerm || modeFilter !== 'ALL' || statusFilter !== 'ALL'
                          ? 'No payments match your filter parameters. Clear filters or disburse a payment.'
                          : 'No supplier disbursements are recorded yet. Click "+ Record Supplier Payment" to pay an invoice or advance.'}
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm" 
                        style={{ marginTop: 8 }}
                        onClick={() => setShowPaymentModal(true)}
                      >
                        <Plus size={14} /> Record First Payment
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Payment Modal (`PaymentForm`) */}
      {showPaymentModal && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card modal-lg" style={{ maxWidth: 900, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-head">
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Disburse Supplier Payment</h3>
                <div className="helper">
                  Allocate across oldest due bills, settle opening balance, or adjust refined bullion bar transfers.
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowPaymentModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: 20 }}>
              {/* Supplier Selection Banner */}
              <div style={{ 
                padding: '12px 16px', background: 'var(--surface-2, #faf7ef)', borderRadius: 10, 
                border: '1px solid var(--border)', marginBottom: 16 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: '1 1 280px' }}>
                    <label className="label">Pay To Supplier *</label>
                    <select 
                      className="input"
                      value={formSupplierId}
                      onChange={e => setFormSupplierId(e.target.value)}
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.tradeName} ({s.code}) · Outstanding Due: ₹{s.currentBalanceDue.toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <div className="helper" style={{ fontSize: 11 }}>Opening Due</div>
                      <div style={{ fontWeight: 700 }} className="mono">
                        ₹{(selectedSupplier.currentBalanceDue || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div>
                      <div className="helper" style={{ fontSize: 11 }}>Unpaid Bills</div>
                      <div style={{ fontWeight: 700, color: 'var(--danger)' }} className="mono">
                        ₹{supplierUnpaidBills.reduce((acc, b) => acc + b.balanceDue, 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disbursement Mode & Amount */}
              <div className="g3" style={{ marginBottom: 16 }}>
                <div>
                  <label className="label">Bank / Cash Money Amount (₹) *</label>
                  <input 
                    type="number" 
                    className="input mono"
                    value={formMoneyAmount}
                    onChange={e => setFormMoneyAmount(Number(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className="label">Payment Mode *</label>
                  <select 
                    className="input"
                    value={formMode}
                    onChange={e => setFormMode(e.target.value)}
                  >
                    <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                    <option value="RTGS">RTGS (Real Time Gross Settlement)</option>
                    <option value="IMPS">IMPS (Immediate Payment Service)</option>
                    <option value="CHEQUE">Bank Cheque / DD</option>
                    <option value="CASH">Cash Payment</option>
                    <option value="BANK_TRANSFER">Direct Account Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="label">UTR / Cheque Reference # *</label>
                  <input 
                    type="text" 
                    className="input mono"
                    placeholder="Transaction reference ID"
                    value={formUtr}
                    onChange={e => setFormUtr(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Payment Date *</label>
                  <input 
                    type="date" 
                    className="input"
                    value={formPaymentDate}
                    onChange={e => setFormPaymentDate(e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Voucher Remarks / Notes</label>
                  <input 
                    type="text" 
                    className="input"
                    placeholder="Authorized signatory, purpose of payment..."
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* 24K Bullion / Refined Bar Adjustment Section */}
              <div style={{ 
                padding: 14, borderRadius: 10, border: '1px solid var(--gold, #d97706)', 
                background: 'var(--surface-2, #faf7ef)', marginBottom: 16 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="checkbox" 
                      id="metal_adjust"
                      checked={payWithMetal}
                      onChange={e => setPayWithMetal(e.target.checked)}
                    />
                    <label htmlFor="metal_adjust" style={{ fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>
                      <Coins size={15} style={{ display: 'inline', marginRight: 6, color: 'var(--gold)' }} />
                      Also Pay with 24K Refined Bullion Bar from Refinery
                    </label>
                  </div>

                  <div className="helper">
                    In hand: Gold <b>{inHandRefinedStock.gold.toFixed(3)}g</b> · Silver <b>{inHandRefinedStock.silver.toFixed(3)}g</b>
                  </div>
                </div>

                {payWithMetal && (
                  <div className="g3" style={{ marginTop: 12 }}>
                    <div>
                      <label className="label">Refined Metal Type</label>
                      <select 
                        className="input"
                        value={metalType}
                        onChange={e => {
                          const val = e.target.value as 'gold' | 'silver';
                          setMetalType(val);
                          setMetalRatePer10g(val === 'gold' ? 78500 : 920);
                        }}
                      >
                        <option value="gold">24K Fine Gold Bar (99.50%+)</option>
                        <option value="silver">999 Fine Silver Bar (99.90%+)</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Fine Quantity (grams) *</label>
                      <input 
                        type="number" 
                        step="0.001"
                        className="input mono"
                        value={metalFineQty}
                        onChange={e => setMetalFineQty(Number(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <label className="label">Agreed Rate per 10g (₹) *</label>
                      <input 
                        type="number" 
                        className="input mono"
                        value={metalRatePer10g}
                        onChange={e => setMetalRatePer10g(Number(e.target.value) || 0)}
                      />
                    </div>

                    <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
                      <div className="helper">
                        Evaluated Metal Value:
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--gold, #b45309)' }} className="mono">
                        ₹{computedMetalValue.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Settlement Calculation Banner */}
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '10px 16px', background: '#fff', border: '1px solid var(--border)', 
                borderRadius: 8, marginBottom: 16 
              }}>
                <div style={{ fontWeight: 600 }}>Total Settled via this Payment:</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success, #059669)' }} className="mono">
                  ₹{computedTotalSettled.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Allocation Mode & Interactive Table */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Allocation across Inward Bills</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input 
                      type="checkbox" 
                      id="alloc_hand"
                      checked={allocateByHand}
                      onChange={e => setAllocateByHand(e.target.checked)}
                    />
                    <label htmlFor="alloc_hand" style={{ fontSize: 12, cursor: 'pointer' }}>
                      Allocate by hand (otherwise auto-applies oldest bills first)
                    </label>
                  </div>
                </div>

                <div className="tbl-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Bill #</th>
                        <th>Supplier Inv. #</th>
                        <th>Due Date</th>
                        <th className="num">Balance Due</th>
                        <th className="num" style={{ width: 140 }}>Allocated Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Opening Balance row */}
                      {selectedSupplier.currentBalanceDue > 0 && (
                        <tr style={{ background: 'var(--surface-2)' }}>
                          <td><b>Opening Balance</b></td>
                          <td className="helper">Owed before software</td>
                          <td>—</td>
                          <td className="num mono">₹{selectedSupplier.currentBalanceDue.toLocaleString('en-IN')}</td>
                          <td className="num">
                            {allocateByHand ? (
                              <input 
                                type="number" 
                                className="input input-sm mono"
                                style={{ width: 120, marginLeft: 'auto' }}
                                value={openingBalanceAllocation}
                                onChange={e => setOpeningBalanceAllocation(Number(e.target.value) || 0)}
                              />
                            ) : (
                              <span className="mono" style={{ fontWeight: 700 }}>
                                ₹{automaticAllocations.openingSettled.toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>
                        </tr>
                      )}

                      {/* Unpaid Bills */}
                      {supplierUnpaidBills.map((bill) => {
                        const allocatedAmt = allocateByHand ? (customAllocations[bill.id] || 0) : (automaticAllocations.allocs[bill.id] || 0);

                        return (
                          <tr key={bill.id}>
                            <td><span className="mono" style={{ fontWeight: 600 }}>{bill.billNumber}</span></td>
                            <td><span className="mono">{bill.supplierInvoiceNo}</span></td>
                            <td>{bill.dueDate}</td>
                            <td className="num mono">₹{bill.balanceDue.toLocaleString('en-IN')}</td>
                            <td className="num">
                              {allocateByHand ? (
                                <input 
                                  type="number" 
                                  className="input input-sm mono"
                                  style={{ width: 120, marginLeft: 'auto' }}
                                  value={customAllocations[bill.id] || ''}
                                  onChange={e => setCustomAllocations({
                                    ...customAllocations,
                                    [bill.id]: Number(e.target.value) || 0
                                  })}
                                />
                              ) : (
                                <span className="mono" style={{ fontWeight: 700, color: allocatedAmt > 0 ? 'var(--success)' : 'inherit' }}>
                                  ₹{allocatedAmt.toLocaleString('en-IN')}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                      {supplierUnpaidBills.length === 0 && selectedSupplier.currentBalanceDue === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: 20 }}>
                            <div className="helper">No outstanding bills for this supplier. Entire payment will be recorded as supplier advance.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: 700, background: 'var(--surface-2)' }}>
                        <td colSpan={4}>Allocated to Bills</td>
                        <td className="num mono">₹{activeTotalAllocated.toLocaleString('en-IN')}</td>
                      </tr>
                      {activeAdvance > 0 && (
                        <tr style={{ color: 'var(--indigo, #4f46e5)', fontWeight: 700 }}>
                          <td colSpan={4}>Remaining Unallocated (Kept as Supplier Advance)</td>
                          <td className="num mono">₹{activeAdvance.toLocaleString('en-IN')}</td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="helper">
                Total: <b>₹{computedTotalSettled.toLocaleString('en-IN')}</b> · Allocated: <b>₹{activeTotalAllocated.toLocaleString('en-IN')}</b> · Advance: <b>₹{activeAdvance.toLocaleString('en-IN')}</b>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={computedTotalSettled <= 0}
                  onClick={handleSavePayment}
                >
                  <CheckCircle2 size={16} /> Disburse & Save Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Payment Detail Modal (`PaymentDetail`) */}
      {selectedPaymentDetail && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card modal-lg" style={{ maxWidth: 850, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedPaymentDetail.paymentNumber}</h3>
                  <span className={`badge ${selectedPaymentDetail.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                    {selectedPaymentDetail.status}
                  </span>
                  <span className="badge badge-teal">{selectedPaymentDetail.mode}</span>
                </div>
                <div className="helper" style={{ marginTop: 2 }}>
                  Supplier: <b>{selectedPaymentDetail.supplierName}</b> · Date: {selectedPaymentDetail.date} · UTR: <span className="mono">{selectedPaymentDetail.referenceNo}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setSelectedPaymentDetail(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: 20 }}>
              {/* Settlement Composition Cards */}
              <div className="s360-grid" style={{ marginBottom: 16 }}>
                <div className="card s360-card">
                  <div className="s360-label">Total Amount Settled</div>
                  <div className="s360-val" style={{ color: 'var(--success)' }}>
                    ₹{selectedPaymentDetail.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="helper">Via {selectedPaymentDetail.mode}</div>
                </div>

                <div className="card s360-card">
                  <div className="s360-label">Money Disbursed</div>
                  <div className="s360-val">
                    ₹{(selectedPaymentDetail.moneyAmount || selectedPaymentDetail.amount).toLocaleString('en-IN')}
                  </div>
                  <div className="helper">Bank transfer</div>
                </div>

                <div className="card s360-card">
                  <div className="s360-label">Metal Adjustment</div>
                  <div className="s360-val mono" style={{ color: 'var(--gold)' }}>
                    {selectedPaymentDetail.metalAdjustment ? `${selectedPaymentDetail.metalAdjustment.fineQty.toFixed(3)} g` : '0 g'}
                  </div>
                  <div className="helper">
                    {selectedPaymentDetail.metalAdjustment ? `₹${selectedPaymentDetail.metalAdjustment.metalAmount.toLocaleString('en-IN')}` : 'No metal adjustment'}
                  </div>
                </div>

                <div className="card s360-card">
                  <div className="s360-label">Supplier Advance</div>
                  <div className="s360-val" style={{ color: 'var(--indigo, #4f46e5)' }}>
                    ₹{(selectedPaymentDetail.unallocated || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="helper">Unallocated balance</div>
                </div>
              </div>

              {/* Settled Bills Breakdown Table */}
              <div style={{ marginBottom: 14 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700 }}>Allocated Against Invoices</h4>
                <div className="tbl-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Bill Reference</th>
                        <th>Description</th>
                        <th className="num">Allocated Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPaymentDetail.allocations || []).map((alloc, idx) => (
                        <tr key={idx}>
                          <td><span className="mono" style={{ fontWeight: 700 }}>{alloc.billNumber}</span></td>
                          <td>Consignment Jewellery Inward Invoice Settlement</td>
                          <td className="num mono" style={{ fontWeight: 700 }}>₹{alloc.amount.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                      {(selectedPaymentDetail.openingApplied || 0) > 0 && (
                        <tr style={{ background: 'var(--surface-2)' }}>
                          <td><b>Opening Balance</b></td>
                          <td>Settled historical balance prior to app</td>
                          <td className="num mono">₹{(selectedPaymentDetail.openingApplied || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      )}
                      {(selectedPaymentDetail.unallocated || 0) > 0 && (
                        <tr style={{ color: 'var(--indigo, #4f46e5)' }}>
                          <td><b>Supplier Advance</b></td>
                          <td>Carried forward on supplier ledger for future POs</td>
                          <td className="num mono">₹{(selectedPaymentDetail.unallocated || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: 800, background: 'var(--surface-2)' }}>
                        <td colSpan={2}>Total Payment Disbursed</td>
                        <td className="num mono" style={{ color: 'var(--success, #059669)' }}>
                          ₹{selectedPaymentDetail.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {selectedPaymentDetail.notes && (
                <div style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 8, fontSize: 13 }}>
                  <b>Voucher Remarks:</b> <span className="helper" style={{ color: 'inherit' }}>{selectedPaymentDetail.notes}</span>
                </div>
              )}

              {selectedPaymentDetail.voidReason && (
                <div style={{ marginTop: 10, padding: 10, background: '#fee2e2', borderRadius: 8, fontSize: 13, color: 'var(--danger)' }}>
                  <b>Void Reason:</b> {selectedPaymentDetail.voidReason}
                </div>
              )}
            </div>

            <div className="modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowReceiptModal(true)}
                >
                  <Printer size={14} /> Print Payment Receipt
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {selectedPaymentDetail.status === 'ACTIVE' && (
                  <button
                    type="button"
                    className="btn btn-danger-outline"
                    onClick={() => setShowVoidModal(true)}
                  >
                    <Ban size={14} /> Void Payment
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedPaymentDetail(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Void Payment Prompt */}
      {showVoidModal && selectedPaymentDetail && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>
                Void {selectedPaymentDetail.paymentNumber}?
              </h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowVoidModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--muted)' }}>
                Bills become unpaid again and the cash-out ledger entry is voided. {selectedPaymentDetail.metalAdjustment ? 'The refined bullion metal goes back into stock.' : ''}
              </p>
              <label className="label">Reason for Voiding *</label>
              <textarea 
                className="input" 
                rows={3}
                placeholder="e.g. Bank transfer rejected, incorrect supplier account..."
                value={voidReasonText}
                onChange={e => setVoidReasonText(e.target.value)}
              />
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowVoidModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                disabled={!voidReasonText.trim()}
                onClick={() => handleVoidPayment(selectedPaymentDetail, voidReasonText)}
              >
                Confirm Void
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Official Payment Receipt Simulation */}
      {showReceiptModal && selectedPaymentDetail && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card modal-lg" style={{ maxWidth: 700 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Payment Disbursement Voucher</h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowReceiptModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ background: '#fff', color: '#000', padding: 24, borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 10 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>KRIYA JEWELLERS 360</h2>
                  <div style={{ fontSize: 11 }}>104, Zaveri Bazaar, Mumbai · Phone: +91 22 2345 6789</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>PAYMENT VOUCHER</div>
                  <div style={{ fontSize: 13, fontWeight: 700 }} className="mono">{selectedPaymentDetail.paymentNumber}</div>
                  <div style={{ fontSize: 11 }}>Date: {selectedPaymentDetail.date}</div>
                </div>
              </div>

              <div style={{ margin: '14px 0', fontSize: 12 }}>
                <div><b>PAID TO:</b> {selectedPaymentDetail.supplierName}</div>
                <div><b>PAYMENT MODE:</b> {selectedPaymentDetail.mode}</div>
                <div><b>UTR / CHEQUE REF:</b> <span className="mono">{selectedPaymentDetail.referenceNo}</span></div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, margin: '12px 0' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>Particulars</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: 6 }}>Direct Bank / Cash Remittance</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>
                      ₹{(selectedPaymentDetail.moneyAmount || selectedPaymentDetail.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {selectedPaymentDetail.metalAdjustment && (
                    <tr>
                      <td style={{ padding: 6 }}>
                        Refined 24K Bullion Bar ({selectedPaymentDetail.metalAdjustment.fineQty.toFixed(3)}g @ ₹{selectedPaymentDetail.metalAdjustment.ratePer10g}/10g)
                      </td>
                      <td style={{ padding: 6, textAlign: 'right' }}>
                        ₹{selectedPaymentDetail.metalAdjustment.metalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '2px solid #000', fontWeight: 800 }}>
                    <td style={{ padding: 6 }}>Total Disbursed</td>
                    <td style={{ padding: 6, textAlign: 'right' }}>
                      ₹{selectedPaymentDetail.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 10, borderTop: '1px solid #999', fontSize: 11 }}>
                <div>Authorized Signatory</div>
                <div>Receiver / Beneficiary Signature</div>
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => window.print()}
              >
                <Printer size={15} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


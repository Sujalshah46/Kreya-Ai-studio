import React, { useState } from 'react';
import { 
  Flame, Plus, Search, DollarSign, X, CheckCircle2, 
  Printer, Scale, ArrowRight, ShieldCheck, FileText, Check, 
  AlertCircle, Sparkles, RefreshCw, Copy
} from 'lucide-react';
import { OldGoldPurchase, StoreProfile, DailyRates, PaymentMode, Customer, OldGoldPurchaseItem } from '../../types';

interface OldGoldPurchaseViewProps {
  store: StoreProfile;
  rates: DailyRates;
  purchases: OldGoldPurchase[];
  customers?: Customer[];
  onSavePurchase: (purchase: OldGoldPurchase) => void;
}

interface ItemFormState {
  description: string;
  metalType: 'GOLD' | 'SILVER' | 'PLATINUM';
  purity: string;
  pieces: number;
  grossWeight: string;
  stoneDeduction: string;
  otherDeduction: string;
  touchPurity: string;
  rateBasis: 'per_gram' | 'per_10g';
  rateOffered: string;
  notes: string;
}

const DEFAULT_SAMPLE_PURCHASES: OldGoldPurchase[] = [
  {
    id: 'ogp-001',
    purchaseVoucherNo: 'OGP-2026-00055',
    purchaseNo: 'OGP-2026-00055',
    voucherNo: 'OGP-2026-00055',
    date: '2026-11-13',
    purchaseDate: '2026-11-13',
    customerName: 'Ravi Prakash',
    customerMobile: '9810123456',
    customerAddress: 'Surajpur, Greater Noida',
    customerPan: 'ABCDE1234F',
    metalType: 'GOLD',
    description: 'Old 22K Traditional Chain & Broken Hook',
    itemDescription: 'Old 22K Traditional Chain & Broken Hook',
    grossWeight: 15.200,
    stoneDeduction: 0.200,
    meltingLossGrams: 0.350,
    touchPurityPercent: 91.6,
    purityTouchPercent: 91.6,
    netWeight: 14.650,
    netFineGoldWeight: 13.419,
    netFineWeight: 13.419,
    rateAppliedPer10g: 78500,
    ratePer10g: 78500,
    totalValuation: 105342,
    totalPurchaseValue: 105342,
    totalCashPayout: 105342,
    totalCashPaidOut: 105342,
    totalAmount: 105342,
    payoutMode: 'CASH',
    paymentRef: 'Till 1 Payout',
    status: 'COMPLETED',
    items: [
      {
        id: 'ogi-001',
        description: 'Old 22K Traditional Chain & Broken Hook',
        metalType: 'GOLD',
        purity: '22K (916)',
        pieces: 1,
        grossWeight: 15.200,
        stoneDeduction: 0.200,
        otherDeduction: 0.350,
        netWeight: 14.650,
        touchPurity: 91.6,
        netFineWeight: 13.419,
        ratePerGram: 7850,
        ratePer10g: 78500,
        value: 105342,
        notes: 'Tested 91.6% by XRF melter'
      }
    ],
    adjustedAmount: 0,
    excessOwed: 0
  },
  {
    id: 'ogp-002',
    purchaseVoucherNo: 'OGP-2026-00056',
    purchaseNo: 'OGP-2026-00056',
    voucherNo: 'OGP-2026-00056',
    date: '2026-11-15',
    purchaseDate: '2026-11-15',
    customerName: 'Meenakshi Sundaram',
    customerMobile: '9840011223',
    customerAddress: 'Jagat Farm, Greater Noida',
    metalType: 'SILVER',
    description: 'Old Silver Glass & Plate Scrap',
    itemDescription: 'Old Silver Glass & Plate Scrap',
    grossWeight: 120.000,
    stoneDeduction: 0.000,
    meltingLossGrams: 2.000,
    touchPurityPercent: 80.0,
    purityTouchPercent: 80.0,
    netWeight: 118.000,
    netFineGoldWeight: 94.400,
    netFineWeight: 94.400,
    rateAppliedPer10g: 920,
    ratePer10g: 920,
    totalValuation: 8685,
    totalPurchaseValue: 8685,
    totalCashPayout: 8685,
    totalCashPaidOut: 8685,
    totalAmount: 8685,
    payoutMode: 'UPI',
    paymentRef: 'UPI-99281923',
    status: 'COMPLETED',
    items: [
      {
        id: 'ogi-002',
        description: 'Old Silver Glass & Plate Scrap',
        metalType: 'SILVER',
        purity: '800 Silver',
        pieces: 2,
        grossWeight: 120.000,
        stoneDeduction: 0.000,
        otherDeduction: 2.000,
        netWeight: 118.000,
        touchPurity: 80.0,
        netFineWeight: 94.400,
        ratePerGram: 92,
        ratePer10g: 920,
        value: 8685,
        notes: 'Acid tested 80% touch'
      }
    ],
    adjustedAmount: 0,
    excessOwed: 0
  }
];

export const OldGoldPurchaseView: React.FC<OldGoldPurchaseViewProps> = ({
  store,
  rates,
  purchases: propPurchases,
  customers = [],
  onSavePurchase
}) => {
  const purchases = propPurchases && propPurchases.length > 0 ? propPurchases : DEFAULT_SAMPLE_PURCHASES;
  const [showModal, setShowModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showMeltModal, setShowMeltModal] = useState(false);
  const [meltPurchase, setMeltPurchase] = useState<OldGoldPurchase | null>(null);
  const [meltingLossInput, setMeltingLossInput] = useState('0.050');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<OldGoldPurchase | null>(purchases[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenMeltModal = (p: OldGoldPurchase) => {
    setMeltPurchase(p);
    setMeltingLossInput(String(p.meltingLossGrams || '0.050'));
    setShowMeltModal(true);
  };

  const handleConfirmMelt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meltPurchase) return;
    const voucherNo = meltPurchase.purchaseVoucherNo || meltPurchase.voucherNo || meltPurchase.purchaseNo;
    const loss = parseFloat(meltingLossInput) || 0;
    const netFine = (meltPurchase.netFineWeight || meltPurchase.netFineGoldWeight || 0);
    showToast(`Melt completed for ${voucherNo}: ${netFine.toFixed(3)}g fine pure metal cast into dhal with ${loss.toFixed(3)}g melting loss.`);
    setShowMeltModal(false);
    setMeltPurchase(null);
  };

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('Ravi Prakash');
  const [customerMobile, setCustomerMobile] = useState('9810123456');
  const [customerAddress, setCustomerAddress] = useState('Surajpur, Greater Noida');
  const [customerPan, setCustomerPan] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));

  // Invoice offset
  const [linkInvoice, setLinkInvoice] = useState(false);
  const [linkedInvoiceNo, setLinkedInvoiceNo] = useState('');
  const [adjustedAmount, setAdjustedAmount] = useState('0');

  // Disbursement
  const [payoutMode, setPayoutMode] = useState<PaymentMode>('CASH');
  const [payoutRef, setPayoutRef] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');

  // Safe pure gold rate
  const pureGoldRatePerGram = rates.gold24kPerGram || Math.round(rates.gold22kPerGram * (24 / 22));

  // Multi-item scrap intake
  const [items, setItems] = useState<ItemFormState[]>([
    {
      description: 'Old 22K Traditional Chain & Broken Hook',
      metalType: 'GOLD',
      purity: '22K (916)',
      pieces: 1,
      grossWeight: '15.200',
      stoneDeduction: '0.200',
      otherDeduction: '0.350', // Melt loss / solder
      touchPurity: '91.6',
      rateBasis: 'per_10g',
      rateOffered: String(Math.round(pureGoldRatePerGram * 10 * 0.99)),
      notes: 'Customer worn jewellery, solder at clasp'
    }
  ]);

  // Calculations for line items
  const calculateItemRow = (item: ItemFormState) => {
    const gross = parseFloat(item.grossWeight) || 0;
    const stone = parseFloat(item.stoneDeduction) || 0;
    const other = parseFloat(item.otherDeduction) || 0;
    const netWeight = Math.max(0, gross - stone - other);

    const touch = parseFloat(item.touchPurity) || 0;
    const hasTestedPurity = touch > 0;
    
    // Fine weight
    const netFineWeight = hasTestedPurity 
      ? Number(((netWeight * touch) / 100).toFixed(3))
      : Number(((netWeight * 0.916)).toFixed(3));

    const rateOffered = parseFloat(item.rateOffered) || 0;
    const ratePerGram = item.rateBasis === 'per_10g' ? rateOffered / 10 : rateOffered;
    
    // Live app calculation: (onFine ? fine : net) * rate_per_10g / 10
    const lineValue = hasTestedPurity
      ? Math.round(netFineWeight * (ratePerGram))
      : Math.round(netWeight * ratePerGram);

    return {
      gross,
      stone,
      other,
      netWeight,
      netFineWeight,
      ratePerGram,
      lineValue: Math.max(0, lineValue),
      hasTestedPurity
    };
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: '',
        metalType: 'GOLD',
        purity: '22K (916)',
        pieces: 1,
        grossWeight: '',
        stoneDeduction: '0',
        otherDeduction: '0',
        touchPurity: '91.6',
        rateBasis: 'per_10g',
        rateOffered: String(Math.round(pureGoldRatePerGram * 10 * 0.99)),
        notes: ''
      }
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleUpdateItem = (idx: number, field: keyof ItemFormState, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    
    if (field === 'metalType') {
      const defaultRate = val === 'GOLD' 
        ? Math.round(pureGoldRatePerGram * 10 * 0.99)
        : Math.round(rates.silverPer10g * 0.98);
      updated[idx].rateOffered = String(defaultRate);
    }

    setItems(updated);
  };

  const handleApplyTodayRate = (idx: number) => {
    const item = items[idx];
    const touch = parseFloat(item.touchPurity) || 0;
    let rate = 0;
    if (item.metalType === 'GOLD') {
      // If tested purity entered, use pure 24K rate; else 22K rate
      rate = touch > 0 ? Math.round(pureGoldRatePerGram * 10) : Math.round(rates.gold22kPerGram * 10);
    } else {
      rate = Math.round(rates.silverPer10g);
    }
    handleUpdateItem(idx, 'rateOffered', String(rate));
  };

  // Grand Totals for modal
  const formCalculations = items.map(calculateItemRow);
  const totalGrossWeight = formCalculations.reduce((s, c) => s + c.gross, 0);
  const totalStoneWeight = formCalculations.reduce((s, c) => s + c.stone, 0);
  const totalMeltLossWeight = formCalculations.reduce((s, c) => s + c.other, 0);
  const totalNetFineWeight = formCalculations.reduce((s, c) => s + c.netFineWeight, 0);
  const totalNetWeight = formCalculations.reduce((s, c) => s + c.netWeight, 0);
  const totalPurchaseValue = formCalculations.reduce((s, c) => s + c.lineValue, 0);
  
  const adjAmt = linkInvoice ? (parseFloat(adjustedAmount) || 0) : 0;
  const cashDisbursement = Math.max(0, totalPurchaseValue - adjAmt);
  const isPanRequired = totalPurchaseValue >= 200000;

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPanRequired && !customerPan.trim()) {
      alert('Income Tax Rule 114B: PAN is mandatory for gold purchase/sale exceeding ₹2,00,000');
      return;
    }

    const voucherNum = `OGP-2026-${String(purchases.length + 57).padStart(5, '0')}`;
    
    const generatedItems: OldGoldPurchaseItem[] = items.map((it, idx) => {
      const calc = formCalculations[idx];
      return {
        id: `ogi-${Date.now()}-${idx}`,
        description: it.description || `${it.metalType} Scrap Item`,
        metalType: it.metalType,
        purity: it.purity,
        pieces: it.pieces || 1,
        grossWeight: calc.gross,
        stoneDeduction: calc.stone,
        otherDeduction: calc.other,
        netWeight: calc.netWeight,
        touchPurity: parseFloat(it.touchPurity) || 0,
        netFineWeight: calc.netFineWeight,
        ratePerGram: calc.ratePerGram,
        ratePer10g: it.rateBasis === 'per_10g' ? parseFloat(it.rateOffered) || 0 : (parseFloat(it.rateOffered) || 0) * 10,
        value: calc.lineValue,
        notes: it.notes
      };
    });

    const newP: OldGoldPurchase = {
      id: `ogp-${Date.now()}`,
      purchaseVoucherNo: voucherNum,
      purchaseNo: voucherNum,
      voucherNo: voucherNum,
      date: purchaseDate,
      purchaseDate,
      customerName,
      customerMobile,
      customerAddress,
      customerPan: customerPan || undefined,
      metalType: items[0]?.metalType || 'GOLD',
      description: items[0]?.description || 'Old Scrap Purchase',
      itemDescription: items[0]?.description || 'Old Scrap Purchase',
      grossWeight: totalGrossWeight,
      stoneDeduction: totalStoneWeight,
      meltingLossGrams: totalMeltLossWeight,
      purityTouchPercent: items[0] ? parseFloat(items[0].touchPurity) || 91.6 : 91.6,
      touchPurityPercent: items[0] ? parseFloat(items[0].touchPurity) || 91.6 : 91.6,
      netWeight: totalNetWeight,
      netFineGoldWeight: totalNetFineWeight,
      netFineWeight: totalNetFineWeight,
      rateAppliedPer10g: parseFloat(items[0]?.rateOffered) || 0,
      ratePer10g: parseFloat(items[0]?.rateOffered) || 0,
      totalValuation: totalPurchaseValue,
      totalPurchaseValue,
      totalCashPayout: cashDisbursement,
      totalCashPaidOut: cashDisbursement,
      totalAmount: totalPurchaseValue,
      payoutMode: linkInvoice && adjAmt >= totalPurchaseValue ? 'ADJUSTED_INVOICE' : payoutMode,
      paymentRef: payoutRef,
      status: 'COMPLETED',
      items: generatedItems,
      adjustedInvoiceNo: linkInvoice ? linkedInvoiceNo : undefined,
      adjustedAmount: linkInvoice ? adjAmt : 0,
      excessOwed: 0
    };

    onSavePurchase(newP);
    setSelectedPurchase(newP);
    setShowModal(false);
    setShowVoucherModal(true);
  };

  // Filtered List
  const filteredPurchases = purchases.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q ||
      (p.purchaseNo && p.purchaseNo.toLowerCase().includes(q)) ||
      (p.purchaseVoucherNo && p.purchaseVoucherNo.toLowerCase().includes(q)) ||
      (p.customerName && p.customerName.toLowerCase().includes(q)) ||
      (p.customerMobile && p.customerMobile.includes(q));

    const matchesDate = !dateFilter || (p.purchaseDate || p.date || '').includes(dateFilter);
    return matchesQ && matchesDate;
  });

  // KPI Aggregates
  const totalCount = purchases.length;
  const totalGrossIntake = purchases.reduce((s, p) => s + (p.grossWeight || 0), 0);
  const totalFineIntake = purchases.reduce((s, p) => s + (p.netFineWeight || p.netFineGoldWeight || 0), 0);
  const totalPayoutDisbursed = purchases.reduce((s, p) => s + (p.totalCashPayout || p.totalCashPaidOut || p.totalAmount || 0), 0);

  return (
    <div className="page" style={{ padding: 0 }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 18px', boxShadow: '0 4px 14px rgba(0,0,0,.15)', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
          ✓ {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Old Gold & Silver Purchases (Scrap Intake)</h1>
          <p>Scrap custody intake · Touch assays & melter loss testing · Net pure metal valuation · Purchase vouchers</p>
        </div>
        <div className="btn-group">
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={14} />
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      {/* Sum Grid */}
      <div className="sum-grid">
        <div className="sum-box">
          <div className="sum-val font-mono">{totalCount}</div>
          <div className="sum-lbl">Total Purchases</div>
          <div className="helper">Lifetime scrap intake vouchers</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--champagne-d)' }}>
            {totalGrossIntake.toFixed(3)}g
          </div>
          <div className="sum-lbl">Gross Weight Intake</div>
          <div className="helper">Total weight before deductions</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--primary)' }}>
            {totalFineIntake.toFixed(3)}g
          </div>
          <div className="sum-lbl">Fine Pure Metal Assayed</div>
          <div className="helper">999 pure metal content credited</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--danger)' }}>
            ₹{totalPayoutDisbursed.toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Total Payout Disbursed</div>
          <div className="helper">Cash, Bank & Invoice deductions</div>
        </div>
      </div>

      {/* Search Row */}
      <div className="search-row" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
          <Search size={16} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voucher no, customer or mobile..."
          />
        </div>
        <button 
          type="button" 
          className="btn btn-outline btn-sm"
          onClick={() => {}}
          title="Search vouchers"
        >
          <Search size={14} /> Search
        </button>
        <button 
          type="button" 
          className="btn btn-outline btn-sm"
          onClick={() => {
            setSearchQuery('');
            setDateFilter('');
          }}
          title="Clear search and filters"
        >
          Clear
        </button>

        <input 
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input input-sm"
          style={{ width: 'auto' }}
        />
      </div>

      {/* Purchases Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <span className="card-title">Scrap Purchase Register</span>
            <span className="helper" style={{ marginLeft: 8, display: 'inline' }}>
              Section 9(4) RCM Reverse Charge Compliant · XRF / Touch Assay
            </span>
          </div>
          <span className="badge badge-gold">Touch Assayed Intake</span>
        </div>

        <div className="tbl-wrap">
          <table style={{ width: '100%', fontSize: 12.5 }}>
            <thead>
              <tr>
                <th style={{ width: 130 }}>Voucher No</th>
                <th style={{ width: 95 }}>Date</th>
                <th>Customer / Seller</th>
                <th>Scrap Items</th>
                <th style={{ textAlign: 'right', width: 95 }}>Gross Wt</th>
                <th style={{ textAlign: 'right', width: 90 }}>Net Wt</th>
                <th style={{ textAlign: 'center', width: 85 }}>Touch %</th>
                <th style={{ textAlign: 'right', width: 95 }}>Fine Wt</th>
                <th style={{ textAlign: 'right', width: 105 }}>Rate / 10g</th>
                <th style={{ textAlign: 'right', width: 110 }}>Total Value</th>
                <th style={{ textAlign: 'center', width: 110 }}>Settlement</th>
                <th style={{ textAlign: 'right', width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={12} className="empty">
                    No scrap purchases found
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const isSelected = selectedPurchase?.id === p.id;
                  const firstItem = p.items && p.items[0];
                  const touchVal = firstItem?.touchPurity || p.touchPurityPercent || p.purityTouchPercent || 91.6;
                  const fineVal = p.netFineWeight || p.netFineGoldWeight || 0;
                  const totalVal = p.totalValuation || p.totalPurchaseValue || p.totalAmount || 0;

                  return (
                    <tr 
                      key={p.id}
                      onClick={() => setSelectedPurchase(p)}
                      style={{ cursor: 'pointer', background: isSelected ? 'var(--row-hover)' : undefined }}
                    >
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--text)' }}>
                        {p.purchaseVoucherNo || p.voucherNo || p.purchaseNo}
                      </td>
                      <td className="font-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {p.purchaseDate || p.date}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.customerName || 'Walk-in Seller'}</div>
                        <div className="helper" style={{ margin: 0 }}>{p.customerMobile}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {firstItem?.description || p.description || p.itemDescription}
                        {(p.items || []).length > 1 && (
                          <span className="helper" style={{ marginLeft: 4 }}>+{(p.items || []).length - 1} more</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }} className="font-mono">
                        {p.grossWeight.toFixed(3)}g
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }} className="font-mono">
                        {(p.netWeight || p.grossWeight).toFixed(3)}g
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-purple" style={{ fontSize: 11 }}>
                          {touchVal}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="font-mono">
                        {fineVal.toFixed(3)}g
                      </td>
                      <td style={{ textAlign: 'right' }} className="font-mono">
                        ₹{(p.rateAppliedPer10g || p.ratePer10g || 78500).toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--success)' }} className="font-mono">
                        ₹{totalVal.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${p.adjustedAmount && p.adjustedAmount > 0 ? 'badge-blue' : 'badge-green'}`}>
                          {p.adjustedAmount && p.adjustedAmount > 0 ? 'INVOICE ADJ' : (p.payoutMode || 'CASH')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPurchase(p);
                              setShowVoucherModal(true);
                            }}
                            title="Print Purchase Voucher"
                          >
                            <Printer size={12} />
                            <span>Print voucher</span>
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMeltModal(p);
                            }}
                            title="Melt scrap lot into dhal ingot"
                          >
                            <Flame size={12} />
                            <span>Melt</span>
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
            Showing {filteredPurchases.length} of {purchases.length} scrap purchase vouchers
          </span>
        </div>
      </div>

      {/* --- NEW SCRAP PURCHASE & TOUCH ASSAY MODAL --- */}
      {showModal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <form onSubmit={handleCreatePurchase} className="modal modal-xl">
            <div className="modal-head">
              <div>
                <span className="card-title">New Scrap Purchase Intake & Melter Assay</span>
                <div className="helper">Melter testing · Stone deduction · Touch purity % · Net fine metal valuation</div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Customer & KYC */}
              <div className="g4">
                <div className="form-group">
                  <label className="label">Customer / Seller Name *</label>
                  <input 
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Ramesh Chandra"
                    className="input input-sm"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Mobile Number *</label>
                  <input 
                    type="text"
                    required
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="10-digit mobile"
                    className="input input-sm"
                  />
                </div>

                <div className="form-group">
                  <label className="label">
                    PAN Card {isPanRequired && <span style={{ color: 'var(--danger)' }}>* (Rule 114B &gt; ₹2 Lakhs)</span>}
                  </label>
                  <input 
                    type="text"
                    required={isPanRequired}
                    value={customerPan}
                    onChange={(e) => setCustomerPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="input input-sm font-mono"
                    style={{ borderColor: isPanRequired && !customerPan ? 'var(--danger)' : undefined }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Purchase Date</label>
                  <input 
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="input input-sm"
                  />
                </div>
              </div>

              <div className="section-divider">SCRAP INTAKE ITEMS & TOUCH ASSAYS</div>

              {/* Multi-Item Scrap Intake Form */}
              {items.map((item, idx) => {
                const rowCalc = formCalculations[idx];
                return (
                  <div key={idx} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                        Scrap Article #{idx + 1} Assay Details
                      </span>
                      {items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(idx)}
                          className="btn btn-outline btn-xs"
                          style={{ color: 'var(--danger)' }}
                        >
                          Remove Item
                        </button>
                      )}
                    </div>

                    <div className="g4" style={{ marginBottom: 8 }}>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="label">Description *</label>
                        <input 
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                          placeholder="e.g. Old 22K Bangle Scrap, Broken Chain"
                          className="input input-sm"
                        />
                      </div>

                      <div>
                        <label className="label">Metal Type</label>
                        <select
                          value={item.metalType}
                          onChange={(e) => handleUpdateItem(idx, 'metalType', e.target.value)}
                          className="input input-sm"
                        >
                          <option value="GOLD">Gold</option>
                          <option value="SILVER">Silver</option>
                          <option value="PLATINUM">Platinum</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">Claimed Karat</label>
                        <select
                          value={item.purity}
                          onChange={(e) => handleUpdateItem(idx, 'purity', e.target.value)}
                          className="input input-sm"
                        >
                          <option value="24K (999)">24K (999 Pure)</option>
                          <option value="22K (916)">22K (916 Standard)</option>
                          <option value="20K (833)">20K (833)</option>
                          <option value="18K (750)">18K (750 Hallmark)</option>
                          <option value="14K (585)">14K (585)</option>
                          <option value="999 Silver">999 Silver</option>
                          <option value="925 Silver">925 Silver</option>
                          <option value="800 Silver">800 Silver</option>
                        </select>
                      </div>
                    </div>

                    {/* Weight & Deductions Breakdown */}
                    <div className="g4" style={{ marginBottom: 8 }}>
                      <div>
                        <label className="label">Gross Weight (g) *</label>
                        <input 
                          type="number"
                          step="0.001"
                          required
                          value={item.grossWeight}
                          onChange={(e) => handleUpdateItem(idx, 'grossWeight', e.target.value)}
                          placeholder="0.000"
                          className="input input-sm font-mono"
                          style={{ fontWeight: 700 }}
                        />
                      </div>

                      <div>
                        <label className="label">Less Stone Deduction (g)</label>
                        <input 
                          type="number"
                          step="0.001"
                          value={item.stoneDeduction}
                          onChange={(e) => handleUpdateItem(idx, 'stoneDeduction', e.target.value)}
                          placeholder="0.000"
                          className="input input-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="label">Less Solder / Melt Loss (g)</label>
                        <input 
                          type="number"
                          step="0.001"
                          value={item.otherDeduction}
                          onChange={(e) => handleUpdateItem(idx, 'otherDeduction', e.target.value)}
                          placeholder="0.000"
                          className="input input-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="label">Net Custody Weight (g)</label>
                        <input 
                          type="text"
                          readOnly
                          value={`${rowCalc.netWeight.toFixed(3)}g`}
                          className="input input-sm font-mono"
                          style={{ fontWeight: 800, background: 'var(--bg)', color: 'var(--gold)' }}
                        />
                      </div>
                    </div>

                    {/* Melter Testing & Pure Valuation */}
                    <div className="g3" style={{ alignItems: 'flex-end', background: 'var(--bg)', padding: 10, borderRadius: 6 }}>
                      <div>
                        <label className="label">
                          Tested Purity (Tunch %)
                          {rowCalc.hasTestedPurity && <span style={{ color: 'var(--success)', marginLeft: 4 }}>✓ Fine Wt Valued</span>}
                        </label>
                        <input 
                          type="number"
                          step="0.1"
                          placeholder="e.g. 91.6 or 76.0"
                          value={item.touchPurity}
                          onChange={(e) => handleUpdateItem(idx, 'touchPurity', e.target.value)}
                          className="input input-sm font-mono"
                          style={{ fontWeight: 700 }}
                        />
                        <div className="helper" style={{ fontSize: 10 }}>
                          Fine Wt: <strong>{rowCalc.netFineWeight.toFixed(3)}g</strong> pure metal
                        </div>
                      </div>

                      <div>
                        <label className="label">
                          Valuation Rate (₹/10g) *
                          <button
                            type="button"
                            onClick={() => handleApplyTodayRate(idx)}
                            className="btn btn-xs"
                            style={{ marginLeft: 6, padding: '1px 5px', fontSize: 10 }}
                          >
                            Today's Spot
                          </button>
                        </label>
                        <input 
                          type="number"
                          required
                          value={item.rateOffered}
                          onChange={(e) => handleUpdateItem(idx, 'rateOffered', e.target.value)}
                          className="input input-sm font-mono"
                          style={{ fontWeight: 700 }}
                        />
                        <div className="helper" style={{ fontSize: 10 }}>
                          {rowCalc.hasTestedPurity ? 'Pure 24K metal basis' : 'Karat metal basis'}
                        </div>
                      </div>

                      <div>
                        <label className="label">Assayed Net Value (₹)</label>
                        <div className="font-mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)', padding: '5px 0' }}>
                          ₹{rowCalc.lineValue.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button 
                type="button" 
                onClick={handleAddItem}
                className="btn btn-outline btn-sm"
                style={{ alignSelf: 'flex-start' }}
              >
                + Add Another Scrap Article
              </button>

              {/* Settlement & Payout */}
              <div style={{ background: 'var(--surface2)', padding: 14, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>Settlement & Payment Method</span>
                  <div style={{ textAlign: 'right' }}>
                    <span className="helper">Total Purchase Value: </span>
                    <strong className="font-mono" style={{ fontSize: 16, color: 'var(--primary)' }}>
                      ₹{totalPurchaseValue.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                <div className="g3" style={{ alignItems: 'flex-end' }}>
                  <div className="form-group">
                    <label className="check" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600 }}>
                      <input 
                        type="checkbox"
                        checked={linkInvoice}
                        onChange={(e) => setLinkInvoice(e.target.checked)}
                      />
                      <span>Offset Against Sales Invoice</span>
                    </label>
                    {linkInvoice && (
                      <input 
                        type="text"
                        value={linkedInvoiceNo}
                        onChange={(e) => setLinkedInvoiceNo(e.target.value)}
                        placeholder="e.g. INV-2026-00042"
                        className="input input-sm font-mono"
                        style={{ marginTop: 4 }}
                      />
                    )}
                  </div>

                  {linkInvoice ? (
                    <div className="form-group">
                      <label className="label">Amount to Deduct from Invoice (₹)</label>
                      <input 
                        type="number"
                        value={adjustedAmount}
                        onChange={(e) => setAdjustedAmount(e.target.value)}
                        className="input input-sm font-mono"
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="label">Disbursement Mode</label>
                      <select
                        value={payoutMode}
                        onChange={(e) => setPayoutMode(e.target.value as PaymentMode)}
                        className="input input-sm"
                      >
                        <option value="CASH">Cash Till Outflow</option>
                        <option value="UPI">UPI / IMPS Payout</option>
                        <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                        <option value="CHEQUE">Cheque Issue</option>
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label className="label">Cash Disbursed to Seller</label>
                    <div className="font-mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--danger)' }}>
                      ₹{cashDisbursement.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Issue Purchase Voucher & Disburse ₹{cashDisbursement.toLocaleString('en-IN')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- PRINTABLE PURCHASE VOUCHER SLIP MODAL --- */}
      {showVoucherModal && selectedPurchase && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowVoucherModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flame size={18} style={{ color: 'var(--champagne-d)' }} />
                <span className="card-title">Scrap Purchase Voucher · {selectedPurchase.purchaseVoucherNo || selectedPurchase.voucherNo}</span>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowVoucherModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ background: '#fdfdfc', fontFamily: 'monospace', fontSize: 12 }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--text)', paddingBottom: 8, marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'sans-serif' }}>{store.legalName || 'DADHIBAMAN JEWELLERS'}</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11, fontFamily: 'sans-serif' }}>{store.address || 'SHOP NO 1 & 2 GURUBAKSH PLAZA, JAGAT FARM, GR. NOIDA'}</p>
                <p style={{ margin: 0, fontSize: 11, fontFamily: 'sans-serif' }}>GSTIN: {store.gstin} · Section 9(4) Reverse Charge Voucher</p>
                <div style={{ marginTop: 6, padding: '3px 10px', background: 'var(--text)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-block', borderRadius: 4 }}>
                  OLD GOLD / SILVER PURCHASE VOUCHER & MELT INTAKE
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                <div>
                  <p style={{ margin: 0 }}>Voucher No: <strong>{selectedPurchase.purchaseVoucherNo || selectedPurchase.voucherNo}</strong></p>
                  <p style={{ margin: 0 }}>Date: <strong>{selectedPurchase.purchaseDate || selectedPurchase.date}</strong></p>
                  <p style={{ margin: 0 }}>Settlement Mode: <strong>{selectedPurchase.payoutMode}</strong></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0 }}>Seller Name: <strong>{selectedPurchase.customerName}</strong></p>
                  <p style={{ margin: 0 }}>Mobile: {selectedPurchase.customerMobile}</p>
                  <p style={{ margin: 0 }}>PAN / Aadhaar: <strong>{selectedPurchase.customerPan || 'Declared Form 60'}</strong></p>
                </div>
              </div>

              {/* Line items table */}
              <div style={{ marginBottom: 12 }}>
                <div className="tbl-wrap" style={{ border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', fontSize: 11.5 }}>
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Metal</th>
                        <th style={{ textAlign: 'right' }}>Gross Wt</th>
                        <th style={{ textAlign: 'right' }}>Less Stone</th>
                        <th style={{ textAlign: 'right' }}>Less Solder</th>
                        <th style={{ textAlign: 'right' }}>Net Wt</th>
                        <th style={{ textAlign: 'center' }}>Touch %</th>
                        <th style={{ textAlign: 'right' }}>Fine Wt</th>
                        <th style={{ textAlign: 'right' }}>Rate / 10g</th>
                        <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPurchase.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{it.description}</td>
                          <td>{it.metalType}</td>
                          <td style={{ textAlign: 'right' }} className="font-mono">{it.grossWeight.toFixed(3)}g</td>
                          <td style={{ textAlign: 'right', color: 'var(--muted)' }} className="font-mono">{(it.stoneDeduction || 0).toFixed(3)}g</td>
                          <td style={{ textAlign: 'right', color: 'var(--muted)' }} className="font-mono">{(it.otherDeduction || 0).toFixed(3)}g</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">{it.netWeight.toFixed(3)}g</td>
                          <td style={{ textAlign: 'center' }} className="font-mono">{it.touchPurity}%</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }} className="font-mono">{it.netFineWeight.toFixed(3)}g</td>
                          <td style={{ textAlign: 'right' }} className="font-mono">₹{it.ratePer10g.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }} className="font-mono">₹{it.value.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & Payout */}
              <div style={{ background: 'var(--surface2)', padding: 10, borderRadius: 6, border: '1px solid var(--border)', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Gross Scrap Intake Weight:</span>
                  <span className="font-mono" style={{ fontWeight: 700 }}>{selectedPurchase.grossWeight.toFixed(3)}g</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Net Assayed Fine Metal Weight:</span>
                  <span className="font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                    {(selectedPurchase.netFineWeight || selectedPurchase.netFineGoldWeight || 0).toFixed(3)}g
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 700 }}>
                  <span>Total Assayed Value:</span>
                  <span className="font-mono">₹{(selectedPurchase.totalValuation || selectedPurchase.totalPurchaseValue || 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedPurchase.adjustedAmount && selectedPurchase.adjustedAmount > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
                    <span>Offset Against Sales Invoice ({selectedPurchase.adjustedInvoiceNo || 'Order'}):</span>
                    <span className="font-mono">-₹{selectedPurchase.adjustedAmount.toLocaleString('en-IN')}</span>
                  </div>
                ) : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border)', fontWeight: 800, fontSize: 14 }}>
                  <span>Net Cash Disbursed to Seller:</span>
                  <span className="font-mono" style={{ color: 'var(--danger)' }}>
                    ₹{(selectedPurchase.totalCashPayout || selectedPurchase.totalCashPaidOut || selectedPurchase.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 12 }}>
                <strong>SELLER DECLARATION:</strong> I hereby declare that the old scrap jewellery described above is my personal bona fide property. I have received the settlement amount in full and hold the purchaser harmless against any third-party claim.
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', paddingTop: 20 }}>
                <div>Seller Signature / Thumbprint</div>
                <div>Assayer & Authorized Signatory</div>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={14} />
                <span>Print Purchase Voucher</span>
              </button>
              <button 
                type="button"
                onClick={() => setShowVoucherModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MELT SCRAP ACTION MODAL --- */}
      {showMeltModal && meltPurchase && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowMeltModal(false); }}>
          <form onSubmit={handleConfirmMelt} className="modal modal-md">
            <div className="modal-head">
              <div>
                <span className="card-title">Melt Scrap Lot · {meltPurchase.purchaseVoucherNo || meltPurchase.voucherNo}</span>
                <div className="helper">Crucible furnace melt · Slag/solder deduction · Cast into bullion dhal</div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowMeltModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 6, border: '1px solid var(--border)', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Customer:</span>
                  <strong>{meltPurchase.customerName || 'Walk-in Seller'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Gross Scrap Intake:</span>
                  <strong className="font-mono">{meltPurchase.grossWeight.toFixed(3)}g</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Net Pure Fine Metal:</span>
                  <strong className="font-mono" style={{ color: 'var(--primary)' }}>
                    {(meltPurchase.netFineWeight || meltPurchase.netFineGoldWeight || 0).toFixed(3)}g
                  </strong>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Crucible Melt Loss / Solder Burn (g)</label>
                <input 
                  type="number"
                  step="0.001"
                  required
                  value={meltingLossInput}
                  onChange={(e) => setMeltingLossInput(e.target.value)}
                  className="input input-sm font-mono"
                />
                <div className="helper">Standard melter loss: 0.050g - 0.350g based on soldered joints</div>
              </div>

              <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--bg)', padding: 10, borderRadius: 6 }}>
                🔥 <strong>Melting Action:</strong> Confirms transfer of this scrap lot from intake tray to the furnace crucible. Fine metal will be cast into dhal ingot and credited to Melting Vault inventory.
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                onClick={() => setShowMeltModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Confirm Melt Action
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

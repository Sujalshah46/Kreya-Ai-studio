import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { StoreProfile, SalesInvoice, Customer } from '../../types';

export interface BuybacksViewProps {
  store?: StoreProfile;
  invoices?: SalesInvoice[];
  customers?: Customer[];
  buybacks?: BuybackRecord[];
  onAddCredit?: (customerId: string, amount: number, refNo: string) => void;
}

export interface BuybackItem {
  id?: string;
  orderItemId?: string;
  itemId?: string;
  item_code?: string;
  description: string;
  purity: string;
  metalType: string;
  qty: number;
  gross: string;
  stone: string;
  net: string;
  diamondValue: string;
  gemValue: string;
  otherDeduction: string;
  stockAction: '' | 'restock' | 'melt';
  // Calculated values
  ratePer10g?: number;
  metalGross?: number;
  refining?: number;
  stones?: number;
  netAmount?: number;
}

export interface BuybackRefund {
  mode: string;
  amount: string;
  reference: string;
}

export interface BuybackRecord {
  id: string;
  buyback_no: string;
  buyback_date: string;
  customer_id?: string;
  customer_name: string;
  customer_phone?: string;
  order_id?: number | string;
  order_no?: string;
  rate_per_10g?: number;
  gross_value: number;
  total_deduction: number;
  net_amount: number;
  refund_amount: number;
  credit_amount: number;
  status: 'completed' | 'cancelled';
  cancel_reason?: string;
  created_by_name?: string;
  notes?: string;
  items: Array<{
    id: string;
    item_code?: string;
    description: string;
    purity: string;
    net_weight: number;
    gross_weight?: number;
    rate_per_10g: number;
    metal_value: number;
    refining_amount: number;
    stone_value: number;
    net_amount: number;
    stock_action: 'restock' | 'melt';
  }>;
  refunds: Array<{
    id?: string;
    payment_mode: string;
    amount: number;
    reference?: string;
    voided?: boolean;
  }>;
}

const defaultItemTemplate: BuybackItem = {
  description: '',
  purity: '22K',
  metalType: 'gold',
  qty: 1,
  gross: '0',
  stone: '0',
  net: '',
  diamondValue: '0',
  gemValue: '0',
  otherDeduction: '0',
  stockAction: ''
};

const formatCurrency = (val: number | string | undefined): string => {
  const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Purity to fine multiplier for 24K baseline
const getPurityRatio = (purity: string): number => {
  const p = purity.toUpperCase().trim();
  if (p.includes('24K') || p.includes('999')) return 0.999;
  if (p.includes('22K') || p.includes('916')) return 0.916;
  if (p.includes('18K') || p.includes('750')) return 0.750;
  if (p.includes('14K') || p.includes('585')) return 0.585;
  if (p.includes('925') || p.includes('SILVER')) return 0.925;
  return 0.916; // default 22K
};

export const BuybacksView: React.FC<BuybacksViewProps> = ({
  store,
  invoices = [],
  customers = [],
  buybacks: initialBuybacks
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedBuyback, setSelectedBuyback] = useState<BuybackRecord | null>(null);
  const [cancelModalBuyback, setCancelModalBuyback] = useState<BuybackRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [printVoucher, setPrintVoucher] = useState<BuybackRecord | null>(null);

  // Settings
  const refiningPct = 2.0; // 2% deduction on gross metal
  const defaultRatePer10g = 78500; // 24K baseline gold rate per 10g

  // Sample initial records
  const [buybacks, setBuybacks] = useState<BuybackRecord[]>(() => {
    const defaultList: BuybackRecord[] = [
      {
        id: 'bb-3',
        buyback_no: 'BB-2026-00043',
        buyback_date: '2026-11-15',
        customer_id: 'cust-pakshal-01',
        customer_name: 'Pakshal',
        customer_phone: '9876543210',
        order_id: 102,
        order_no: 'INV-2026-00001',
        rate_per_10g: 78500,
        gross_value: 179765.00,
        total_deduction: 3595.00,
        net_amount: 176170.00,
        refund_amount: 150000.00,
        credit_amount: 26170.00,
        status: 'completed',
        created_by_name: 'Admin',
        notes: 'Old 22K Kada return with melting loss deduction and exchange store credit voucher',
        items: [
          {
            id: 'bi-3',
            item_code: 'KAD-22K-RET',
            description: 'Old 22K Gold Antique Kada Melting Return',
            purity: '22K',
            net_weight: 25.000,
            gross_weight: 25.500,
            rate_per_10g: 71906,
            metal_value: 179765.00,
            refining_amount: 3595.00,
            stone_value: 0,
            net_amount: 176170.00,
            stock_action: 'melt'
          }
        ],
        refunds: [
          { id: 'ref-3', payment_mode: 'bank_transfer', amount: 150000.00, reference: 'NEFT/HDFC298104' }
        ]
      },
      {
        id: 'bb-1',
        buyback_no: 'BB-2026-00042',
        buyback_date: '2026-11-14',
        customer_id: 'cust-1',
        customer_name: 'Sujal Singh',
        customer_phone: '8977897896',
        order_id: 101,
        order_no: 'INV-2026-00276',
        rate_per_10g: 78500,
        gross_value: 62450.00,
        total_deduction: 1825.00,
        net_amount: 60625.00,
        refund_amount: 50000.00,
        credit_amount: 10625.00,
        status: 'completed',
        created_by_name: 'Admin',
        notes: 'Customer exchange voucher issued for festival purchase',
        items: [
          {
            id: 'bi-1',
            item_code: 'RNG-22K-091',
            description: '22K Gold Antique Bangle',
            purity: '22K',
            net_weight: 8.500,
            gross_weight: 9.200,
            rate_per_10g: 71906, // 78500 * 0.916
            metal_value: 61120.10,
            refining_amount: 1222.40,
            stone_value: 727.30,
            net_amount: 60625.00,
            stock_action: 'melt'
          }
        ],
        refunds: [
          { id: 'ref-1', payment_mode: 'cash', amount: 50000.00, reference: 'CASH-REF' }
        ]
      },
      {
        id: 'bb-2',
        buyback_no: 'BB-2026-00041',
        buyback_date: '2026-11-10',
        customer_id: 'cust-2',
        customer_name: 'Priya Sharma',
        customer_phone: '9811234567',
        order_id: 98,
        order_no: 'INV-2026-00269',
        rate_per_10g: 78200,
        gross_value: 46800.00,
        total_deduction: 936.00,
        net_amount: 45864.00,
        refund_amount: 45864.00,
        credit_amount: 0,
        status: 'completed',
        created_by_name: 'Cashier 1',
        items: [
          {
            id: 'bi-2',
            item_code: 'CHN-18K-014',
            description: '18K Diamond Studded Pendant',
            purity: '18K',
            net_weight: 5.600,
            gross_weight: 6.100,
            rate_per_10g: 58650,
            metal_value: 32844.00,
            refining_amount: 656.88,
            stone_value: 13676.88,
            net_amount: 45864.00,
            stock_action: 'restock'
          }
        ],
        refunds: [
          { id: 'ref-2', payment_mode: 'upi', amount: 45864.00, reference: 'UPI/981729012' }
        ]
      }
    ];

    if (initialBuybacks && initialBuybacks.length > 0) {
      return initialBuybacks;
    }
    return defaultList;
  });

  // Form State for "New Buyback"
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string; phone?: string } | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [customRate, setCustomRate] = useState<string>('');
  const [formItems, setFormItems] = useState<BuybackItem[]>([]);
  const [refundModes, setRefundModes] = useState<BuybackRefund[]>([
    { mode: 'cash', amount: '', reference: '' }
  ]);
  const [customerCreditAmount, setCustomerCreditAmount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');
  const [isCashWarning, setIsCashWarning] = useState<string | null>(null);

  // Returnable items from selected invoice
  const selectedInvoice = invoices.find(inv => String(inv.id) === String(selectedInvoiceId));
  const invoiceReturnablePieces = selectedInvoice?.items || [];

  // When customer changes, clear invoice
  const handleCustomerChange = (cust: { id: string; name: string; phone?: string } | null) => {
    setSelectedCustomer(cust);
    setSelectedInvoiceId('');
  };

  // Add item from returnable invoice pieces
  const handleAddPieceFromInvoice = (piece: any) => {
    const grossVal = piece.grossWeight || piece.weight || 5.0;
    const netVal = piece.netWeight || piece.weight || grossVal;
    const newItem: BuybackItem = {
      ...defaultItemTemplate,
      orderItemId: String(piece.id || Date.now()),
      itemId: String(piece.id || ''),
      item_code: piece.itemCode || piece.huid || '',
      description: piece.description || piece.name || 'Returned Jewellery Piece',
      purity: piece.purity || '22K',
      metalType: piece.category?.toLowerCase() || 'gold',
      gross: String(Number(grossVal).toFixed(3)),
      stone: String(Number(grossVal - netVal > 0 ? grossVal - netVal : 0).toFixed(3)),
      net: String(Number(netVal).toFixed(3)),
      diamondValue: String(piece.diamondValue || '0'),
      gemValue: String(piece.gemValue || '0'),
      otherDeduction: '0',
      stockAction: 'melt'
    };
    setFormItems(prev => [...prev, newItem]);
  };

  // Update item field
  const updateItemField = (index: number, field: keyof BuybackItem, value: any) => {
    setFormItems(prev =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };
        if (field === 'gross' || field === 'stone') {
          const g = parseFloat(field === 'gross' ? value : item.gross) || 0;
          const s = parseFloat(field === 'stone' ? value : item.stone) || 0;
          const n = Math.max(0, g - s);
          updated.net = n.toFixed(3);
        }
        return updated;
      })
    );
  };

  // Compute live calculations for an item
  const calculateItem = (item: BuybackItem) => {
    const rate24K = parseFloat(customRate) || defaultRatePer10g;
    const ratio = getPurityRatio(item.purity);
    const effectiveRatePer10g = rate24K * ratio;
    const netG = parseFloat(item.net) || 0;
    const metalGross = (netG / 10) * effectiveRatePer10g;
    const refining = (metalGross * refiningPct) / 100;
    const stones = (parseFloat(item.diamondValue) || 0) + (parseFloat(item.gemValue) || 0);
    const otherD = parseFloat(item.otherDeduction) || 0;
    const netAmount = Math.max(0, metalGross - refining + stones - otherD);

    return {
      effectiveRatePer10g,
      metalGross,
      refining,
      stones,
      otherD,
      netAmount
    };
  };

  // Aggregate totals of all items in form
  const totalFormNetValue = formItems.reduce((acc, item) => {
    const c = calculateItem(item);
    return acc + c.netAmount;
  }, 0);

  const totalRefundAmount = refundModes.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  const creditNum = parseFloat(customerCreditAmount) || 0;
  const isSettlementBalanced = Math.abs(totalRefundAmount + creditNum - totalFormNetValue) < 0.05 && totalFormNetValue > 0;

  // Split rest helper
  const handleRefundRest = () => {
    const rest = Math.max(0, totalFormNetValue - creditNum);
    setRefundModes(prev => [
      { ...prev[0], amount: rest.toFixed(2) },
      ...prev.slice(1)
    ]);
  };

  // Save new buyback voucher
  const handleSaveVoucher = (bypassCashWarning = false) => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (formItems.length === 0) {
      alert('Please add at least one return / buyback item');
      return;
    }
    if (!isSettlementBalanced) {
      alert('Refund and Credit amounts must add up exactly to the total Buy-back Value.');
      return;
    }

    // Cash limit check (Section 269ST limit of ₹2 Lakhs in cash)
    const cashRefundSum = refundModes
      .filter(r => r.mode.toLowerCase() === 'cash')
      .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    if (!bypassCashWarning && cashRefundSum >= 200000) {
      setIsCashWarning(
        `High Cash Disbursement Warning: ₹${cashRefundSum.toLocaleString('en-IN')} exceeds Section 269ST threshold of ₹2,00,000 per day. Digital settlement (NEFT/UPI/Cheque) is recommended.`
      );
      return;
    }

    const newVoucherNo = `BB-2026-${String(buybacks.length + 43).padStart(5, '0')}`;
    const calculatedLines = formItems.map((item, idx) => {
      const calc = calculateItem(item);
      return {
        id: `bi-${Date.now()}-${idx}`,
        item_code: item.item_code || `RET-${idx + 1}`,
        description: item.description || 'Customer Return Piece',
        purity: item.purity,
        net_weight: parseFloat(item.net) || 0,
        gross_weight: parseFloat(item.gross) || 0,
        rate_per_10g: calc.effectiveRatePer10g,
        metal_value: calc.metalGross,
        refining_amount: calc.refining,
        stone_value: calc.stones,
        net_amount: calc.netAmount,
        stock_action: (item.stockAction || 'melt') as 'restock' | 'melt'
      };
    });

    const newRecord: BuybackRecord = {
      id: `bb-${Date.now()}`,
      buyback_no: newVoucherNo,
      buyback_date: new Date().toISOString().split('T')[0],
      customer_id: selectedCustomer.id,
      customer_name: selectedCustomer.name,
      customer_phone: selectedCustomer.phone,
      order_id: selectedInvoice?.id,
      order_no: selectedInvoice?.invoiceNumber || selectedInvoice?.invoiceNo,
      rate_per_10g: parseFloat(customRate) || defaultRatePer10g,
      gross_value: calculatedLines.reduce((s, l) => s + l.metal_value + l.stone_value, 0),
      total_deduction: calculatedLines.reduce((s, l) => s + l.refining_amount, 0),
      net_amount: totalFormNetValue,
      refund_amount: totalRefundAmount,
      credit_amount: creditNum,
      status: 'completed',
      created_by_name: 'Admin',
      notes: notes || undefined,
      items: calculatedLines,
      refunds: refundModes
        .filter(r => (parseFloat(r.amount) || 0) > 0)
        .map((r, i) => ({
          id: `ref-${Date.now()}-${i}`,
          payment_mode: r.mode,
          amount: parseFloat(r.amount) || 0,
          reference: r.reference || undefined
        }))
    };

    setBuybacks(prev => [newRecord, ...prev]);
    setShowNewModal(false);
    setSelectedBuyback(newRecord);
    setIsCashWarning(null);
  };

  // Cancel Voucher Confirmation
  const handleConfirmCancel = () => {
    if (!cancelModalBuyback) return;
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancelling this voucher.');
      return;
    }

    setBuybacks(prev =>
      prev.map(bb =>
        bb.id === cancelModalBuyback.id
          ? {
              ...bb,
              status: 'cancelled',
              cancel_reason: cancelReason.trim()
            }
          : bb
      )
    );
    setCancelModalBuyback(null);
    setCancelReason('');
  };

  // Filtered List
  const filteredBuybacks = buybacks.filter(bb => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      bb.buyback_no.toLowerCase().includes(q) ||
      bb.customer_name.toLowerCase().includes(q) ||
      (bb.order_no && bb.order_no.toLowerCase().includes(q))
    );
  });

  const totalValueSum = buybacks
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.net_amount, 0);
  const totalRefundSum = buybacks
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.refund_amount, 0);
  const totalCreditSum = buybacks
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.credit_amount, 0);

  const handleExportCSV = () => {
    const headers = ['Buyback No', 'Date', 'Customer Name', 'Customer Phone', 'Invoice Ref', 'Gross Value (Rs)', 'Total Deduction (Rs)', 'Net Amount (Rs)', 'Refund Amount (Rs)', 'Credit Amount (Rs)', 'Status'];
    const rows = filteredBuybacks.map(b => [
      b.buyback_no,
      b.buyback_date,
      `"${b.customer_name}"`,
      b.customer_phone || '',
      b.order_no || '',
      b.gross_value,
      b.total_deduction,
      b.net_amount,
      b.refund_amount,
      b.credit_amount,
      b.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `buybacks_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = filteredBuybacks.map(b => ({
      'Buyback No': b.buyback_no,
      'Date': b.buyback_date,
      'Customer Name': b.customer_name,
      'Customer Phone': b.customer_phone || '',
      'Invoice Ref': b.order_no || '',
      'Gross Value (₹)': b.gross_value,
      'Total Deduction (₹)': b.total_deduction,
      'Net Amount (₹)': b.net_amount,
      'Refund Amount (₹)': b.refund_amount,
      'Credit Amount (₹)': b.credit_amount,
      'Status': b.status
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Buybacks');
    XLSX.writeFile(wb, `buybacks_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Returns / Buy-back</h1>
          <p>
            Buy-back voucher at today's rate. Refund in any mode and/or keep as customer credit; pieces go back to stock or to melting.
          </p>
        </div>
        <div className="btn-group">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleExportCSV}
            title="Export CSV"
          >
            CSV
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleExportExcel}
            title="Export Excel"
          >
            Excel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setShowNewModal(true);
              setSelectedCustomer(null);
              setSelectedInvoiceId('');
              setFormItems([]);
              setRefundModes([{ mode: 'cash', amount: '', reference: '' }]);
              setCustomerCreditAmount('0');
              setNotes('');
              setIsCashWarning(null);
            }}
          >
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New buy-back
          </button>
        </div>
      </div>

      {/* Sum Grid */}
      <div className="sum-grid" style={{ marginBottom: 16 }}>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)' }}>
            {formatCurrency(totalValueSum)}
          </div>
          <div className="sum-lbl">Total Buy-back Value</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--success)' }}>
            {formatCurrency(totalRefundSum)}
          </div>
          <div className="sum-lbl">Total Cash / Bank Refunded</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--gold)' }}>
            {formatCurrency(totalCreditSum)}
          </div>
          <div className="sum-lbl">Retained Customer Credit</div>
        </div>
        <div className="sum-box">
          <div className="sum-val">{buybacks.length}</div>
          <div className="sum-lbl">Vouchers Issued</div>
        </div>
      </div>

      {/* Main Table Card */}
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
                placeholder="Search voucher, customer, invoice..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="tbl-wrap tbl-desktop-only">
          <table>
            <thead>
              <tr>
                <th>Voucher</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Invoice</th>
                <th className="num">Value</th>
                <th className="num">Refunded</th>
                <th className="num">Credit</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuybacks.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                    No buy-back records found.
                  </td>
                </tr>
              ) : (
                filteredBuybacks.map(bb => (
                  <tr
                    key={bb.id}
                    onClick={() => setSelectedBuyback(bb)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        {bb.buyback_no}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{bb.buyback_date}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{bb.customer_name}</div>
                      {bb.customer_phone && (
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{bb.customer_phone}</div>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>{bb.order_no || '—'}</td>
                    <td className="num" style={{ fontWeight: 700 }}>
                      {formatCurrency(bb.net_amount)}
                    </td>
                    <td className="num amt-green">{formatCurrency(bb.refund_amount)}</td>
                    <td className="num" style={{ color: 'var(--gold)', fontWeight: 600 }}>
                      {formatCurrency(bb.credit_amount)}
                    </td>
                    <td>
                      <span className={`badge ${bb.status === 'completed' ? 'badge-green' : 'badge-red'}`}>
                        {bb.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          title="Voucher PDF"
                          onClick={() => setPrintVoucher(bb)}
                        >
                          📄
                        </button>
                        {bb.status === 'completed' && (
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            title="Cancel"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => {
                              setCancelModalBuyback(bb);
                              setCancelReason('');
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dt-pager" style={{ padding: '10px 14px' }}>
          <span className="helper">{filteredBuybacks.length} vouchers</span>
        </div>
      </div>

      {/* DETAIL MODAL (Matching Kreya x Component) */}
      {selectedBuyback && (
        <div className="overlay" onClick={() => setSelectedBuyback(null)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{selectedBuyback.buyback_no} &bull; {selectedBuyback.customer_name}</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setSelectedBuyback(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="flow" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <span className={`badge ${selectedBuyback.status === 'completed' ? 'badge-green' : 'badge-red'}`}>
                  {selectedBuyback.status.toUpperCase()}
                </span>
                <span>{selectedBuyback.buyback_date}</span>
                {selectedBuyback.order_no && (
                  <span>Invoice <b>{selectedBuyback.order_no}</b></span>
                )}
                <span className="helper">By {selectedBuyback.created_by_name || 'Admin'}</span>
              </div>

              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Piece</th>
                      <th className="num">Net g</th>
                      <th className="num">Rate/10g</th>
                      <th className="num">Metal</th>
                      <th className="num">Refining</th>
                      <th className="num">Stones</th>
                      <th className="num">Net</th>
                      <th>To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBuyback.items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.description}</div>
                          <div className="helper" style={{ margin: 0 }}>
                            {item.purity} {item.item_code}
                          </div>
                        </td>
                        <td className="num">{item.net_weight.toFixed(3)}</td>
                        <td className="num">{formatCurrency(item.rate_per_10g)}</td>
                        <td className="num">{formatCurrency(item.metal_value)}</td>
                        <td className="num" style={{ color: 'var(--danger)' }}>
                          −{formatCurrency(item.refining_amount)}
                        </td>
                        <td className="num">{formatCurrency(item.stone_value)}</td>
                        <td className="num" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {formatCurrency(item.net_amount)}
                        </td>
                        <td>
                          <span className="badge badge-blue">
                            {item.stock_action === 'restock' ? 'Stock' : 'Old metal (melt)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <dl className="kv" style={{ marginTop: 14 }}>
                <dt>Value</dt>
                <dd><strong>{formatCurrency(selectedBuyback.net_amount)}</strong></dd>

                <dt>Refunded</dt>
                <dd>
                  {selectedBuyback.refunds
                    .filter(r => !r.voided)
                    .map(r => `${formatCurrency(r.amount)} ${r.payment_mode.toUpperCase()}`)
                    .join(' + ') || '—'}
                </dd>

                <dt>Customer credit</dt>
                <dd>{formatCurrency(selectedBuyback.credit_amount)}</dd>

                {selectedBuyback.cancel_reason && (
                  <>
                    <dt style={{ color: 'var(--danger)' }}>Cancelled</dt>
                    <dd style={{ color: 'var(--danger)' }}>{selectedBuyback.cancel_reason}</dd>
                  </>
                )}
              </dl>
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPrintVoucher(selectedBuyback)}
              >
                📄 Voucher PDF
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedBuyback(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW BUY-BACK MODAL (Matching Kreya h Component) */}
      {showNewModal && (
        <div className="overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" style={{ maxWidth: 780 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>New buy-back / return</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowNewModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Header Grid: Customer, Today's Rate, Invoice */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Customer *</label>
                  <select
                    className="input"
                    value={selectedCustomer?.id || ''}
                    onChange={e => {
                      const c = customers.find(item => item.id === e.target.value);
                      if (c) {
                        handleCustomerChange({
                          id: c.id,
                          name: c.fullName || c.name || 'Customer',
                          phone: c.mobile || c.phone
                        });
                      } else {
                        handleCustomerChange(null);
                      }
                    }}
                  >
                    <option value="">— Select Customer —</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.fullName || c.name} &bull; {c.mobile || c.phone || 'No phone'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Today's rate /10 g</label>
                  <input
                    type="number"
                    className="input"
                    placeholder={`e.g. ${defaultRatePer10g}`}
                    value={customRate}
                    onChange={e => setCustomRate(e.target.value)}
                  />
                  <div className="helper" style={{ fontSize: 10 }}>Blank = ₹{defaultRatePer10g}</div>
                </div>

                {selectedCustomer && (
                  <div style={{ gridColumn: 'span 3' }}>
                    <label className="label">Original invoice (optional)</label>
                    <select
                      className="input"
                      value={selectedInvoiceId}
                      onChange={e => setSelectedInvoiceId(e.target.value)}
                    >
                      <option value="">— Not from an invoice —</option>
                      {invoices
                        .filter(inv => inv.customer?.id === selectedCustomer.id || (inv as any).customerId === selectedCustomer.id)
                        .map(inv => (
                          <option key={inv.id} value={inv.id}>
                            {inv.invoiceNumber || inv.invoiceNo} &bull; {inv.date || '2026-11-15'} &bull; {formatCurrency(inv.totalAmount || inv.productTotalValue)}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Returnable Pieces Chips if Invoice Selected */}
              {invoiceReturnablePieces.length > 0 && (
                <div className="alert alert-info" style={{ marginBottom: 12 }}>
                  <b>Returnable pieces from invoice:</b>{' '}
                  {invoiceReturnablePieces.map((piece, i) => (
                    <button
                      key={piece.id || i}
                      type="button"
                      className="btn btn-outline btn-xs"
                      style={{ margin: '4px 4px 0 0' }}
                      onClick={() => handleAddPieceFromInvoice(piece)}
                    >
                      + {(piece as any).name || (piece as any).itemName || (piece as any).description || 'Item'} ({(piece as any).purityKarat || piece.purity || '22K'}, {(piece as any).grossWeight || (piece as any).weight || 0}g)
                    </button>
                  ))}
                </div>
              )}

              {/* Form Items List */}
              {formItems.map((item, idx) => {
                const calc = calculateItem(item);
                return (
                  <div key={idx} className="card" style={{ padding: 12, marginBottom: 10, background: 'var(--surface2)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div>
                        <label className="label">Piece Description</label>
                        <input
                          className="input"
                          value={item.description}
                          placeholder="e.g. 22K Gold Bangle"
                          onChange={e => updateItemField(idx, 'description', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">Purity</label>
                        <select
                          className="input"
                          value={item.purity}
                          onChange={e => updateItemField(idx, 'purity', e.target.value)}
                        >
                          <option value="24K">24K (999)</option>
                          <option value="22K">22K (916)</option>
                          <option value="18K">18K (750)</option>
                          <option value="14K">14K (585)</option>
                          <option value="SILVER 925">Silver (925)</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Back to</label>
                        <select
                          className="input"
                          value={item.stockAction}
                          onChange={e => updateItemField(idx, 'stockAction', e.target.value as any)}
                        >
                          <option value="">Default (settings)</option>
                          <option value="restock">Stock (resell)</option>
                          <option value="melt">To old metal (melting)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
                      <div>
                        <label className="label">Gross g</label>
                        <input
                          type="number"
                          step="0.001"
                          className="input"
                          value={item.gross}
                          onChange={e => updateItemField(idx, 'gross', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">Stone g</label>
                        <input
                          type="number"
                          step="0.001"
                          className="input"
                          value={item.stone}
                          onChange={e => updateItemField(idx, 'stone', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">Net g</label>
                        <input
                          type="number"
                          step="0.001"
                          className="input"
                          value={item.net}
                          onChange={e => updateItemField(idx, 'net', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">Other deduction ₹</label>
                        <input
                          type="number"
                          className="input"
                          value={item.otherDeduction}
                          onChange={e => updateItemField(idx, 'otherDeduction', e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div>
                        <label className="label">Diamond value ₹</label>
                        <input
                          type="number"
                          className="input"
                          value={item.diamondValue}
                          onChange={e => updateItemField(idx, 'diamondValue', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">Gem value ₹</label>
                        <input
                          type="number"
                          className="input"
                          value={item.gemValue}
                          onChange={e => updateItemField(idx, 'gemValue', e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                      <span className="helper" style={{ fontSize: 12 }}>
                        Metal {formatCurrency(calc.metalGross)} − refining {formatCurrency(calc.refining)} + stones {formatCurrency(calc.stones)} − {formatCurrency(calc.otherD)} = <b>{formatCurrency(calc.netAmount)}</b>
                      </span>
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => setFormItems(prev => prev.filter((_, i) => i !== idx))}
                      >
                        Remove Piece
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setFormItems(prev => [...prev, { ...defaultItemTemplate }])}
                style={{ marginBottom: 14 }}
              >
                + Add a piece (not from an invoice)
              </button>

              <p className="helper" style={{ margin: '6px 0 14px' }}>
                Refining 2% &bull; diamonds 90% &bull; gems 80%. Making and GST are not refunded. The original invoice is not changed.
              </p>

              {/* Settlement Section */}
              <h4 style={{ margin: '14px 0 8px', fontSize: 14, fontWeight: 700 }}>Settlement</h4>

              {refundModes.map((ref, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <div>
                    {idx === 0 && <label className="label">Refund mode</label>}
                    <select
                      className="input"
                      value={ref.mode}
                      onChange={e => {
                        const val = e.target.value;
                        setRefundModes(prev => prev.map((item, i) => (i === idx ? { ...item, mode: val } : item)));
                      }}
                    >
                      <option value="cash">CASH</option>
                      <option value="upi">UPI</option>
                      <option value="card">CARD</option>
                      <option value="bank">BANK TRANSFER</option>
                      <option value="cheque">CHEQUE</option>
                    </select>
                  </div>
                  <div>
                    {idx === 0 && <label className="label">Amount ₹</label>}
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={ref.amount}
                      onChange={e => {
                        const val = e.target.value;
                        setRefundModes(prev => prev.map((item, i) => (i === idx ? { ...item, amount: val } : item)));
                      }}
                    />
                  </div>
                  <div>
                    {idx === 0 && <label className="label">Reference</label>}
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. UTR / Chq No"
                      value={ref.reference}
                      onChange={e => {
                        const val = e.target.value;
                        setRefundModes(prev => prev.map((item, i) => (i === idx ? { ...item, reference: val } : item)));
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="btn-group" style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => setRefundModes(prev => [...prev, { mode: 'upi', amount: '', reference: '' }])}
                >
                  + Split into another mode
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={handleRefundRest}
                  disabled={totalFormNetValue <= 0}
                >
                  Refund the rest
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <label className="label">Keep as customer credit ₹</label>
                  <input
                    type="number"
                    className="input"
                    value={customerCreditAmount}
                    onChange={e => setCustomerCreditAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Old mangalsutra exchange against new set"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {isCashWarning && (
                <div className="alert alert-warn" style={{ marginBottom: 12 }}>
                  <div>{isCashWarning}</div>
                  <div style={{ marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleSaveVoucher(true)}
                    >
                      Yes, refund in cash
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-foot">
              <span className="helper" style={{ marginRight: 'auto' }}>
                Value {formatCurrency(totalFormNetValue)} = refund {formatCurrency(totalRefundAmount)} + credit {formatCurrency(creditNum)}{' '}
                {isSettlementBalanced ? '✓' : '(must add up)'}
              </span>
              <button type="button" className="btn btn-outline" onClick={() => setShowNewModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!selectedCustomer || formItems.length === 0 || !isSettlementBalanced}
                onClick={() => handleSaveVoucher(false)}
              >
                Save voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL VOUCHER DIALOG (Matching Kreya c.to Component) */}
      {cancelModalBuyback && (
        <div className="overlay" onClick={() => setCancelModalBuyback(null)}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ color: 'var(--danger)' }}>Cancel {cancelModalBuyback.buyback_no}?</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setCancelModalBuyback(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
                Refunds are voided, credit taken back (only if unused), stock and melting entries reversed.
              </p>
              <div className="form-group">
                <label className="label">Reason for cancellation *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Customer cancelled return"
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setCancelModalBuyback(null)}>
                Close
              </button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmCancel}>
                Cancel voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT VOUCHER MODAL */}
      {printVoucher && (
        <div className="overlay" onClick={() => setPrintVoucher(null)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Official Buy-back Voucher PDF</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setPrintVoucher(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ border: '1px solid var(--border)', padding: 18, borderRadius: 8, background: '#fff' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border2)', paddingBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{store?.legalName || 'KREYA JEWELLERS 360'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{store?.address || 'Showroom Address'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>GSTIN: {store?.gstin || '24AAACD1234F1Z5'}</div>
                  <div style={{ marginTop: 6, display: 'inline-block', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 12 }}>
                    CUSTOMER BUY-BACK / EXCHANGE VOUCHER
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, margin: '12px 0 6px' }}>
                  <span>Voucher No: <b>{printVoucher.buyback_no}</b></span>
                  <span>Date: <b>{printVoucher.buyback_date}</b></span>
                </div>
                <div style={{ fontSize: 12, marginBottom: 10 }}>
                  Customer: <b>{printVoucher.customer_name}</b> {printVoucher.customer_phone ? `(${printVoucher.customer_phone})` : ''}
                  {printVoucher.order_no && <span> &bull; Invoice: <b>{printVoucher.order_no}</b></span>}
                </div>

                <div className="tbl-wrap" style={{ marginBottom: 12 }}>
                  <table style={{ fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th className="num">Net Wt</th>
                        <th className="num">Rate/10g</th>
                        <th className="num">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printVoucher.items.map(item => (
                        <tr key={item.id}>
                          <td>{item.description} ({item.purity})</td>
                          <td className="num">{item.net_weight.toFixed(3)}g</td>
                          <td className="num">{formatCurrency(item.rate_per_10g)}</td>
                          <td className="num">{formatCurrency(item.net_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: 'var(--surface2)', padding: 10, borderRadius: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Total Assayed Value:</span>
                    <b>{formatCurrency(printVoucher.net_amount)}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Disbursed Refund:</span>
                    <span>{formatCurrency(printVoucher.refund_amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span>Retained Customer Credit:</span>
                    <span style={{ color: 'var(--primary)' }}>{formatCurrency(printVoucher.credit_amount)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 24 }}>
                  <span>Customer Signature</span>
                  <span>Store Manager Signatory</span>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setPrintVoucher(null)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                Print Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Aliased export for compatibility with ReturnsBuybackView
export const ReturnsBuybackView = BuybacksView;
export default BuybacksView;

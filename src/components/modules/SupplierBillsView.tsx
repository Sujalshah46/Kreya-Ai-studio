import React, { useState, useMemo } from 'react';
import { 
  Receipt, Plus, Search, Filter, Calendar, Eye, Edit3, 
  CheckCircle2, AlertCircle, X, Download, Printer, 
  Trash2, ChevronRight, ShoppingBag, Truck, CreditCard, 
  Building2, ArrowRight, RotateCcw, FileText, Upload, 
  Camera, Check, AlertTriangle, ShieldCheck, Sparkles
} from 'lucide-react';
import { 
  Supplier, PurchaseOrder, GoodsReceipt, SupplierBill, 
  SupplierBillLine, SupplierPayment 
} from '../../types';

interface SupplierBillsViewProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  supplierBills: SupplierBill[];
  supplierPayments?: SupplierPayment[];
  onAddBill?: (bill: SupplierBill) => void;
  onUpdateBill?: (bill: SupplierBill) => void;
  onRecordPayment?: (spay: SupplierPayment) => void;
  onNavigate?: (tab: string, id?: string) => void;
}

const DEFAULT_SAMPLE_BILLS: SupplierBill[] = [
  {
    id: "sb-0001",
    billNumber: "BILL-SUP-2026-0001",
    supplierInvoiceNo: "RBR/INV/2026/0412",
    supplierInvoiceDate: "2026-11-04",
    billDate: "2026-11-04",
    dueDate: "2026-11-18",
    supplier: {
      id: "sup-004",
      code: "SUP-0004",
      tradeName: "Rajesh Bullion Refinery Ltd",
      contactPerson: "Rajesh Mehta",
      mobile: "9820198765",
      city: "Mumbai",
      state: "Maharashtra",
      gstin: "27AABCR9876Q1ZM",
      category: "Bullion Dealer",
      currentBalanceDue: 0.00
    },
    supplierId: "sup-004",
    supplierName: "Rajesh Bullion Refinery Ltd",
    taxMode: "intra",
    taxableAmount: 785000.00,
    cgstAmount: 11775.00,
    sgstAmount: 11775.00,
    gstAmount: 23550.00,
    totalAmount: 808550.00,
    printedTotal: 808550.00,
    paidAmount: 808550.00,
    balanceDue: 0.00,
    balanceAmount: 0.00,
    itcEligible: true,
    tdsApplicable: true,
    tdsSection: "194Q",
    tdsRatePct: 0.1,
    tdsAmount: 785.00,
    netPayableAmount: 807765.00,
    status: "POSTED",
    payStatus: "PAID",
    poNumbers: ["PO-2026-00001"],
    grnNumbers: ["GRN-2026-00001"],
    notes: "Tax Invoice for 100g 24K casting gold grain bar from Rajesh Bullion. 3% GST input tax credit claimed in GSTR-2B. TDS u/s 194Q deducted.",
    documents: [{ name: "Rajesh_Bullion_Invoice_0412.pdf", size: 312000, type: "application/pdf" }],
    lines: [
      {
        id: "sbl-0001",
        grnLineId: "grnl-0001",
        grnNumber: "GRN-2026-00001",
        description: "24K Casting Gold Grain Bar (999.9 Pure)",
        hsn: "7108",
        qty: 1,
        netWeight: 100.000,
        rateBasis: "per_gram",
        rate: 7850.00,
        taxable: 785000.00,
        gstPct: 3,
        cgst: 11775.00,
        sgst: 11775.00,
        gstAmount: 23550.00,
        lineTotal: 808550.00
      }
    ]
  },
  {
    id: "sb-001",
    billNumber: "BILL-SUP-891",
    supplierInvoiceNo: "INV/2026/8941",
    supplierInvoiceDate: "2026-11-06",
    billDate: "2026-11-06",
    dueDate: "2026-11-20",
    supplierId: "sup-002",
    supplierName: "Rajkot Fine Chains Pvt. Ltd.",
    taxMode: "intra",
    taxableAmount: 890000.00,
    cgstAmount: 13350.00,
    sgstAmount: 13350.00,
    gstAmount: 26700.00,
    totalAmount: 916700.00,
    printedTotal: 916700.00,
    paidAmount: 731700.00,
    balanceDue: 185000.00,
    itcEligible: true,
    tdsApplicable: true,
    tdsSection: "194Q",
    tdsRatePct: 0.1,
    tdsAmount: 890.00,
    netPayableAmount: 915810.00,
    status: "POSTED",
    payStatus: "PARTIALLY_PAID",
    poNumbers: ["PO-2026-00018"],
    grnNumbers: ["GRN-2026-00024"],
    notes: "Consignment inward chain invoice. 3% GST input tax credit confirmed in GSTR-2B.",
    documents: [{ name: "Rajkot_Chains_Invoice_8941.pdf", size: 248000, type: "application/pdf" }],
    lines: [
      {
        id: "sbl-1",
        grnLineId: "grnl-1",
        grnNumber: "GRN-2026-00024",
        description: "22K Hollow Rope Chain 20 inches",
        hsn: "7113",
        qty: 12,
        netWeight: 64.200,
        rateBasis: "per_gram",
        rate: 7820.00,
        taxable: 890000.00,
        gstPct: 3,
        cgst: 13350.00,
        sgst: 13350.00,
        gstAmount: 26700.00,
        lineTotal: 916700.00
      }
    ]
  },
  {
    id: "sb-002",
    billNumber: "BILL-SUP-892",
    supplierInvoiceNo: "SDC/INV/1102",
    supplierInvoiceDate: "2026-11-08",
    billDate: "2026-11-08",
    dueDate: "2026-11-23",
    supplierId: "sup-003",
    supplierName: "Surat Diamond Cutters",
    taxMode: "intra",
    taxableAmount: 530000.00,
    cgstAmount: 7950.00,
    sgstAmount: 7950.00,
    gstAmount: 15900.00,
    totalAmount: 545900.00,
    printedTotal: 545900.00,
    paidAmount: 545900.00,
    balanceDue: 0.00,
    itcEligible: true,
    tdsApplicable: false,
    netPayableAmount: 545900.00,
    status: "POSTED",
    payStatus: "PAID",
    poNumbers: ["PO-2026-00017"],
    grnNumbers: ["GRN-2026-00025"],
    notes: "Diamond solitaire rings bill settled via RTGS.",
    documents: [{ name: "SDC_1102_Certified.pdf", size: 310000, type: "application/pdf" }],
    lines: [
      {
        id: "sbl-2",
        grnLineId: "grnl-2",
        grnNumber: "GRN-2026-00025",
        description: "18K White Gold Solitaire Diamond Ring (VVS-EF)",
        hsn: "7113",
        qty: 5,
        netWeight: 13.800,
        rateBasis: "fixed",
        rate: 106000.00,
        taxable: 530000.00,
        gstPct: 3,
        cgst: 7950.00,
        sgst: 7950.00,
        gstAmount: 15900.00,
        lineTotal: 545900.00
      }
    ]
  },
  {
    id: "sb-003",
    billNumber: "BILL-SUP-893",
    supplierInvoiceNo: "SGW/2026/7721",
    supplierInvoiceDate: "2026-11-12",
    billDate: "2026-11-12",
    dueDate: "2026-11-27",
    supplierId: "sup-001",
    supplierName: "Surat Gold Works Ltd.",
    taxMode: "intra",
    taxableAmount: 680225.00,
    cgstAmount: 10203.38,
    sgstAmount: 10203.38,
    gstAmount: 20406.75,
    totalAmount: 700632.00,
    printedTotal: 700632.00,
    paidAmount: 0.00,
    balanceDue: 700632.00,
    itcEligible: true,
    tdsApplicable: true,
    tdsSection: "194Q",
    tdsRatePct: 0.1,
    tdsAmount: 680.00,
    netPayableAmount: 699952.00,
    status: "DRAFT",
    payStatus: "UNPAID",
    poNumbers: [],
    grnNumbers: ["GRN-2026-00026"],
    notes: "Direct bullion intake invoice awaiting owner posting approval.",
    lines: [
      {
        id: "sbl-3",
        grnLineId: "grnl-3",
        grnNumber: "GRN-2026-00026",
        description: "24K Minted Gold Coins 10g (999)",
        hsn: "7108",
        qty: 8,
        netWeight: 80.500,
        rateBasis: "per_gram",
        rate: 8450.00,
        taxable: 680225.00,
        gstPct: 3,
        cgst: 10203.38,
        sgst: 10203.38,
        gstAmount: 20406.75,
        lineTotal: 700632.00
      }
    ]
  }
];

export const SupplierBillsView: React.FC<SupplierBillsViewProps> = ({
  suppliers,
  purchaseOrders,
  goodsReceipts,
  supplierBills: initialBills,
  supplierPayments = [],
  onAddBill,
  onUpdateBill,
  onRecordPayment,
  onNavigate
}) => {
  // Merge prop bills with default samples
  const [billsList, setBillsList] = useState<SupplierBill[]>(() => {
    if (initialBills && initialBills.length > 0) {
      return initialBills.map((b, idx) => {
        const sample = DEFAULT_SAMPLE_BILLS.find(s => s.id === b.id || s.billNumber === b.billNumber) || DEFAULT_SAMPLE_BILLS[idx] || DEFAULT_SAMPLE_BILLS[0];
        return {
          ...sample,
          ...b,
          lines: b.lines || sample.lines || []
        };
      });
    }
    return DEFAULT_SAMPLE_BILLS;
  });

  React.useEffect(() => {
    if (initialBills && initialBills.length > 0) {
      setBillsList(initialBills.map((b, idx) => {
        const sample = DEFAULT_SAMPLE_BILLS.find(s => s.id === b.id || s.billNumber === b.billNumber) || DEFAULT_SAMPLE_BILLS[idx] || DEFAULT_SAMPLE_BILLS[0];
        return {
          ...sample,
          ...b,
          lines: b.lines || sample.lines || []
        };
      }));
    }
  }, [initialBills]);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [payStatusFilter, setPayStatusFilter] = useState('ALL');

  // Modals state
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingBill, setEditingBill] = useState<SupplierBill | null>(null);
  const [selectedBillDetail, setSelectedBillDetail] = useState<SupplierBill | null>(null);
  const [detailTab, setDetailTab] = useState<'lines' | 'grns' | 'payments' | 'document' | 'history'>('lines');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState<'NO_DOC' | 'VARIANCE' | 'CONFLICT'>('NO_DOC');
  const [duplicateReasonText, setDuplicateReasonText] = useState('');

  // Form State
  const [formSupplierId, setFormSupplierId] = useState(suppliers[0]?.id || 'sup-001');
  const [formInvoiceNo, setFormInvoiceNo] = useState(`INV/2026/${Math.floor(1000 + Math.random() * 9000)}`);
  const [formInvoiceDate, setFormInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDueDate, setFormDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [formTaxMode, setFormTaxMode] = useState<'intra' | 'inter'>('intra');
  const [formItcEligible, setFormItcEligible] = useState<string>('yes');
  const [formPrintedTotal, setFormPrintedTotal] = useState<number>(0);
  const [formIsCustomPrintedTotal, setFormIsCustomPrintedTotal] = useState(false);
  const [formOtherCharges, setFormOtherCharges] = useState<number>(0);
  const [formTdsApplicable, setFormTdsApplicable] = useState(true);
  const [formTdsSection, setFormTdsSection] = useState<'194Q' | '206C(1H)'>('194Q');
  const [formNotes, setFormNotes] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; size: number; type: string }>>([]);
  const [formLines, setFormLines] = useState<SupplierBillLine[]>([
    {
      id: `sbl-${Date.now()}`,
      description: '22K Gold Antique Broad Bridal Bangles (Pair)',
      hsn: '7113',
      qty: 4,
      netWeight: 40.050,
      rateBasis: 'per_gram',
      rate: 7850,
      taxable: 314392.50,
      gstPct: 3,
      cgst: 4715.89,
      sgst: 4715.89,
      gstAmount: 9431.78,
      lineTotal: 323824.28
    }
  ]);

  // Calculations for bill line
  const calculateBillLine = (line: Partial<SupplierBillLine>): SupplierBillLine => {
    const qty = Number(line.qty || 1);
    const netWeight = Number(line.netWeight || 0);
    const rate = Number(line.rate || 0);
    const basis = line.rateBasis || 'per_gram';
    const gstPct = Number(line.gstPct || 3);

    let taxable = 0;
    if (basis === 'per_gram') {
      taxable = netWeight * rate;
    } else {
      taxable = qty * rate;
    }

    const gstAmount = Math.round(taxable * (gstPct / 100) * 100) / 100;
    const cgst = formTaxMode === 'intra' ? Math.round(gstAmount / 2 * 100) / 100 : 0;
    const sgst = formTaxMode === 'intra' ? Math.round(gstAmount / 2 * 100) / 100 : 0;
    const igst = formTaxMode === 'inter' ? gstAmount : 0;
    const lineTotal = taxable + gstAmount;

    return {
      description: line.description || '',
      hsn: line.hsn || '7113',
      qty,
      netWeight,
      rateBasis: basis,
      rate,
      taxable,
      gstPct,
      cgst,
      sgst,
      igst,
      gstAmount,
      lineTotal,
      grnLineId: line.grnLineId,
      grnNumber: line.grnNumber
    };
  };

  // Form Computed Totals
  const computedTaxable = useMemo(() => formLines.reduce((acc, l) => acc + l.taxable, 0), [formLines]);
  const computedGst = useMemo(() => formLines.reduce((acc, l) => acc + l.gstAmount, 0), [formLines]);
  const computedGrandTotal = useMemo(() => Math.round(computedTaxable + computedGst + Number(formOtherCharges || 0)), [computedTaxable, computedGst, formOtherCharges]);
  const computedTds = useMemo(() => formTdsApplicable ? Math.round(computedTaxable * 0.001 * 100) / 100 : 0, [computedTaxable, formTdsApplicable]);
  const computedNetPayable = useMemo(() => Math.round((computedGrandTotal - computedTds) * 100) / 100, [computedGrandTotal, computedTds]);

  // Keep printed total synced with computed total unless user overrides
  useMemo(() => {
    if (!formIsCustomPrintedTotal) {
      setFormPrintedTotal(computedGrandTotal);
    }
  }, [computedGrandTotal, formIsCustomPrintedTotal]);

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return billsList.filter(bill => {
      const matchSearch = 
        bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (bill.supplierInvoiceNo && bill.supplierInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (bill.supplierName && bill.supplierName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'ALL' || bill.status === statusFilter;
      const matchPay = payStatusFilter === 'ALL' || bill.payStatus === payStatusFilter;

      return matchSearch && matchStatus && matchPay;
    });
  }, [billsList, searchTerm, statusFilter, payStatusFilter]);

  // KPI calculations
  const kpis = useMemo(() => {
    const totalCount = billsList.length;
    const totalInvoiced = billsList.reduce((acc, b) => acc + b.totalAmount, 0);
    const totalItc = billsList.reduce((acc, b) => acc + (b.gstAmount || 0), 0);
    const totalDue = billsList.reduce((acc, b) => acc + b.balanceDue, 0);
    const totalOverdue = billsList.filter(b => b.balanceDue > 0 && new Date(b.dueDate) < new Date()).reduce((acc, b) => acc + b.balanceDue, 0);

    return {
      totalCount,
      totalInvoiced,
      totalItc,
      totalDue,
      totalOverdue
    };
  }, [billsList]);

  // Open Editor for New Bill
  const handleOpenNewBill = () => {
    setEditingBill(null);
    setFormSupplierId(suppliers[0]?.id || 'sup-001');
    setFormInvoiceNo(`INV/2026/${Math.floor(1000 + Math.random() * 9000)}`);
    setFormInvoiceDate(new Date().toISOString().slice(0, 10));
    const d = new Date();
    d.setDate(d.getDate() + 15);
    setFormDueDate(d.toISOString().slice(0, 10));
    setFormTaxMode('intra');
    setFormItcEligible('yes');
    setFormOtherCharges(0);
    setFormTdsApplicable(true);
    setFormNotes('');
    setAttachedFiles([]);
    setFormIsCustomPrintedTotal(false);
    setFormLines([
      calculateBillLine({
        description: '22K Gold Antique Choker Set (Kundan / Meena)',
        hsn: '7113',
        qty: 4,
        netWeight: 48.000,
        rateBasis: 'per_gram',
        rate: 7850
      })
    ]);
    setShowEditorModal(true);
  };

  // Open Editor for Existing Draft Bill
  const handleOpenEditBill = (bill: SupplierBill) => {
    setEditingBill(bill);
    setFormSupplierId(bill.supplierId || suppliers[0]?.id);
    setFormInvoiceNo(bill.supplierInvoiceNo || '');
    setFormInvoiceDate(bill.supplierInvoiceDate || bill.billDate);
    setFormDueDate(bill.dueDate);
    setFormTaxMode(bill.taxMode || 'intra');
    setFormItcEligible(bill.itcEligible ? 'yes' : 'no');
    setFormOtherCharges(bill.otherCharges || 0);
    setFormTdsApplicable(bill.tdsApplicable || false);
    setFormPrintedTotal(bill.printedTotal || bill.totalAmount);
    setFormIsCustomPrintedTotal(true);
    setFormNotes(bill.notes || '');
    setAttachedFiles((bill.documents || []).map(d => ({ name: d.name, size: d.size || 0, type: d.type || 'application/pdf' })));
    setFormLines(bill.lines && bill.lines.length > 0 ? bill.lines : [
      calculateBillLine({
        description: 'Inward Gold Jewellery Goods',
        hsn: '7113',
        qty: 1,
        netWeight: 50.0,
        rate: 7850
      })
    ]);
    setShowEditorModal(true);
  };

  // Save Bill (Draft)
  const handleSaveBill = (statusToSave: 'DRAFT' | 'POSTED' = 'DRAFT') => {
    const selectedSupplier = suppliers.find(s => s.id === formSupplierId) || suppliers[0];
    const billNumber = editingBill ? editingBill.billNumber : `BILL-SUP-${String(billsList.length + 894).padStart(3, '0')}`;

    // Verify printed total matches
    if (Math.abs(formPrintedTotal - computedGrandTotal) > 1 && statusToSave === 'POSTED') {
      alert(`Printed total (₹${formPrintedTotal}) does not match lines total (₹${computedGrandTotal}). Adjust lines or update printed total before posting.`);
      return;
    }

    const newBill: SupplierBill = {
      id: editingBill ? editingBill.id : `sb-${Date.now()}`,
      billNumber,
      supplierInvoiceNo: formInvoiceNo,
      supplierInvoiceDate: formInvoiceDate,
      billDate: formInvoiceDate,
      dueDate: formDueDate,
      supplier: selectedSupplier,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.tradeName,
      taxMode: formTaxMode,
      taxableAmount: computedTaxable,
      cgstAmount: formTaxMode === 'intra' ? computedGst / 2 : 0,
      sgstAmount: formTaxMode === 'intra' ? computedGst / 2 : 0,
      igstAmount: formTaxMode === 'inter' ? computedGst : 0,
      gstAmount: computedGst,
      otherCharges: formOtherCharges,
      printedTotal: formPrintedTotal,
      totalAmount: computedGrandTotal,
      paidAmount: editingBill ? editingBill.paidAmount : 0,
      balanceDue: editingBill ? Math.max(0, computedGrandTotal - editingBill.paidAmount) : computedGrandTotal,
      itcEligible: formItcEligible === 'yes',
      tdsApplicable: formTdsApplicable,
      tdsSection: formTdsSection,
      tdsRatePct: 0.1,
      tdsAmount: computedTds,
      netPayableAmount: computedNetPayable,
      status: statusToSave,
      payStatus: editingBill ? editingBill.payStatus : 'UNPAID',
      notes: formNotes,
      documents: attachedFiles,
      lines: formLines,
      poNumbers: editingBill?.poNumbers || [],
      grnNumbers: editingBill?.grnNumbers || []
    };

    let nextList: SupplierBill[];
    if (editingBill) {
      nextList = billsList.map(b => b.id === editingBill.id ? newBill : b);
      if (onUpdateBill) onUpdateBill(newBill);
    } else {
      nextList = [newBill, ...billsList];
      if (onAddBill) onAddBill(newBill);
    }

    setBillsList(nextList);
    setShowEditorModal(false);
    setSelectedBillDetail(newBill);
  };

  // Post Bill action with verification
  const handlePostBillAction = (bill: SupplierBill, allowNoDoc = false) => {
    if (!bill.documents || bill.documents.length === 0) {
      if (!allowNoDoc) {
        setWarningMessage('No supplier invoice PDF/photo is attached to this bill. Posting without document requires confirmation.');
        setWarningType('NO_DOC');
        setShowWarningModal(true);
        return;
      }
    }

    const updated: SupplierBill = {
      ...bill,
      status: 'POSTED'
    };
    const nextList = billsList.map(b => b.id === bill.id ? updated : b);
    setBillsList(nextList);
    setSelectedBillDetail(updated);
    if (onUpdateBill) onUpdateBill(updated);
    setShowWarningModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <Receipt size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Supplier Bills</h1>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                Bills received from suppliers. Capture invoice numbers, match against goods receipts, check against PO rates, then post for payment.
              </p>
            </div>
          </div>
        </div>

        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleOpenNewBill}
          >
            <Plus size={16} /> New bill
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => {
              const csv = [
                ['Bill #', 'Invoice #', 'Date', 'Supplier', 'Taxable', 'GST 3%', 'Total', 'Balance Due', 'Due Date', 'Status', 'Payment'],
                ...billsList.map(b => [
                  b.billNumber, b.supplierInvoiceNo || '', b.billDate, b.supplierName || '',
                  b.taxableAmount, b.gstAmount || 0, b.totalAmount, b.balanceDue, b.dueDate, b.status, b.payStatus
                ])
              ].map(r => r.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `supplier_bills_${new Date().toISOString().slice(0,10)}.csv`;
              a.click();
            }}
          >
            <Download size={15} /> Export CSV
          </button>

          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => {
              if (billsList.length > 0) {
                const unpaid = billsList.find(b => b.balanceDue > 0) || billsList[0];
                if (onNavigate) {
                  onNavigate('supplier-payments', unpaid.id);
                } else {
                  setSelectedBillDetail(unpaid);
                  setDetailTab('payments');
                }
              }
            }}
          >
            <CreditCard size={15} /> Record Payment
          </button>

        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="s360-grid">
        <div className="card s360-card">
          <div className="s360-label">Total Inward Invoices</div>
          <div className="s360-val">{kpis.totalCount}</div>
          <div className="helper">Billed supplier consignments</div>
        </div>

        <div className="card s360-card">
          <div className="s360-label">Invoiced Value</div>
          <div className="s360-val" style={{ color: 'var(--gold)' }}>
            ₹{(kpis.totalInvoiced / 100000).toFixed(2)} L
          </div>
          <div className="helper">₹{kpis.totalInvoiced.toLocaleString('en-IN')} gross billings</div>
        </div>

        <div className="card s360-card">
          <div className="s360-label">GST Input Tax Credit (ITC)</div>
          <div className="s360-val" style={{ color: 'var(--success)' }}>
            ₹{kpis.totalItc.toLocaleString('en-IN')}
          </div>
          <div className="helper">3% GST claimable on GSTR-2B</div>
        </div>

        <div className="card s360-card">
          <div className="s360-label">Balance Payable</div>
          <div className="s360-val" style={{ color: kpis.totalDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
            ₹{(kpis.totalDue / 100000).toFixed(2)} L
          </div>
          <div className="helper">
            {kpis.totalOverdue > 0 ? `₹${kpis.totalOverdue.toLocaleString('en-IN')} overdue` : 'All bills within credit cycle'}
          </div>
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
                placeholder="Search Bill #, Invoice #, Supplier..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <select 
              className="input input-sm" 
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Bill Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select 
              className="input input-sm" 
              style={{ width: 'auto' }}
              value={payStatusFilter}
              onChange={e => setPayStatusFilter(e.target.value)}
            >
              <option value="ALL">All Pay Statuses</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div className="helper">
            Showing <b>{filteredBills.length}</b> of <b>{billsList.length}</b> bills
          </div>
        </div>
      </div>

      {/* 4. Bills Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 140 }}>Bill</th>
                <th>Supplier Inv.</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>PO</th>
                <th>GRN</th>
                <th className="num">Total</th>
                <th className="num">Balance</th>
                <th>Due</th>
                <th style={{ textAlign: 'center' }}>Invoice</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'center' }}>Paid</th>
                <th style={{ textAlign: 'right', width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => {
                const isOverdue = bill.balanceDue > 0 && new Date(bill.dueDate) < new Date();

                return (
                  <tr 
                    key={bill.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedBillDetail(bill);
                      setDetailTab('lines');
                    }}
                  >
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--indigo, #4f46e5)' }}>
                        {bill.billNumber}
                      </span>
                    </td>
                    <td><span className="mono" style={{ fontWeight: 600 }}>{bill.supplierInvoiceNo}</span></td>
                    <td>{new Date(bill.billDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{bill.supplierName}</div>
                      <div className="helper" style={{ fontSize: 11 }}>ITC: {bill.itcEligible ? 'Eligible' : 'Ineligible'}</div>
                    </td>
                    <td className="mono">{bill.poNumbers?.join(', ') || '—'}</td>
                    <td className="mono">{bill.grnNumbers?.join(', ') || '—'}</td>
                    <td className="num mono" style={{ fontWeight: 700 }}>
                      ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="num mono" style={{ fontWeight: 700, color: bill.balanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ₹{bill.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <span style={{ color: isOverdue ? 'var(--danger)' : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
                        {new Date(bill.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {isOverdue && <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 10 }}>Overdue</span>}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {bill.documents && bill.documents.length > 0 ? (
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedBillDetail(bill);
                            setDetailTab('document');
                          }}
                        >
                          <FileText size={12} /> View
                        </button>
                      ) : (
                        <span className="helper">No Doc</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {bill.status === 'POSTED' ? (
                        <span className="badge badge-green">Posted</span>
                      ) : bill.status === 'DRAFT' ? (
                        <span className="badge badge-gray">Draft</span>
                      ) : (
                        <span className="badge badge-red">Cancelled</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {bill.payStatus === 'PAID' ? (
                        <span className="badge badge-green">Paid</span>
                      ) : bill.payStatus === 'PARTIALLY_PAID' ? (
                        <span className="badge badge-orange">Partial</span>
                      ) : (
                        <span className="badge badge-red">Unpaid</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          title="View Invoice"
                          onClick={() => {
                            setSelectedBillDetail(bill);
                            setDetailTab('document');
                          }}
                        >
                          <Eye size={13} />
                          <span>View Invoice</span>
                        </button>
                        {bill.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            title="Edit Draft Bill"
                            onClick={() => handleOpenEditBill(bill)}
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                        {bill.status === 'POSTED' && bill.balanceDue > 0 && (
                          <button
                            type="button"
                            className="btn btn-success btn-xs"
                            title="Record Payment"
                            onClick={() => {
                              if (onNavigate) {
                                onNavigate('supplier-payments', bill.id);
                              } else {
                                setSelectedBillDetail(bill);
                                setDetailTab('payments');
                              }
                            }}
                          >
                            <CreditCard size={13} />
                            <span>Record Payment</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBills.length === 0 && (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <Receipt size={36} style={{ color: 'var(--muted)', opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, fontSize: 15 }}>No Supplier Bills Found</div>
                      <div className="helper" style={{ maxWidth: 360 }}>
                        {searchTerm || statusFilter !== 'ALL' || payStatusFilter !== 'ALL'
                          ? 'No supplier bills match your search criteria. Clear filters or create a bill.'
                          : 'There are no bills captured yet. Click "+ New Supplier Bill" to enter a supplier invoice.'}
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm" 
                        style={{ marginTop: 8 }}
                        onClick={handleOpenNewBill}
                      >
                        <Plus size={14} /> Capture First Supplier Bill
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bill Editor Modal (`BillEditor`) */}
      {showEditorModal && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card modal-lg" style={{ maxWidth: 1000, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-head">
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {editingBill ? `Edit Supplier Bill (${editingBill.billNumber})` : 'Capture Supplier Bill (Inward)'}
                </h3>
                <div className="helper">
                  Match against goods receipt, verify 3% GST input tax credit, compute 194Q TDS and net payable.
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowEditorModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: 20 }}>
              {/* Header Fields */}
              <div className="g3" style={{ marginBottom: 16 }}>
                <div>
                  <label className="label">Supplier *</label>
                  <select 
                    className="input"
                    value={formSupplierId}
                    onChange={e => setFormSupplierId(e.target.value)}
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.tradeName} ({s.code}) · GSTIN: {s.gstin}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Supplier Invoice No. *</label>
                  <input 
                    type="text" 
                    className="input"
                    placeholder="e.g. INV/2026/8941"
                    value={formInvoiceNo}
                    onChange={e => setFormInvoiceNo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Invoice Date *</label>
                  <input 
                    type="date" 
                    className="input"
                    value={formInvoiceDate}
                    onChange={e => setFormInvoiceDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Payment Due Date *</label>
                  <input 
                    type="date" 
                    className="input"
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">GST Tax Mode</label>
                  <select 
                    className="input"
                    value={formTaxMode}
                    onChange={e => {
                      const mode = e.target.value as 'intra' | 'inter';
                      setFormTaxMode(mode);
                      setFormLines(formLines.map(l => calculateBillLine({ ...l })));
                    }}
                  >
                    <option value="intra">Intra-State (CGST 1.5% + SGST 1.5%)</option>
                    <option value="inter">Inter-State (IGST 3.0%)</option>
                  </select>
                </div>

                <div>
                  <label className="label">ITC Eligibility</label>
                  <select 
                    className="input"
                    value={formItcEligible}
                    onChange={e => setFormItcEligible(e.target.value)}
                  >
                    <option value="yes">Yes — Eligible for Full Input Tax Credit</option>
                    <option value="no">No — Ineligible / Blocked Credit</option>
                    <option value="partial">Partial ITC</option>
                  </select>
                </div>
              </div>

              {/* Unbilled Consignments Helper Box */}
              <div style={{ 
                padding: '10px 14px', borderRadius: 8, background: 'var(--surface-2, #faf7ef)', 
                border: '1px dashed var(--gold-m, #f59e0b)', marginBottom: 16 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    <Sparkles size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--gold)' }} />
                    Received Goods Awaiting Supplier Invoice
                  </div>
                  <div className="btn-group">
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => {
                        // Quick populate from recent goods receipts
                        const recent = goodsReceipts.filter(g => g.supplierId === formSupplierId && (g.billedPieces || 0) < g.receivedPieces);
                        if (recent.length > 0) {
                          const newLines = recent.flatMap(g => (g.lines || []).map(l => calculateBillLine({
                            description: l.description,
                            hsn: '7113',
                            qty: l.acceptedQty,
                            netWeight: l.netWeight,
                            rateBasis: 'per_gram',
                            rate: 7820,
                            grnLineId: l.id,
                            grnNumber: g.grnNumber
                          })));
                          setFormLines(newLines);
                        } else {
                          alert("All received consignments for this supplier are already billed.");
                        }
                      }}
                    >
                      + Autofill from Unbilled GRNs
                    </button>
                  </div>
                </div>
              </div>

              {/* Lines Table */}
              <div className="tbl-wrap" style={{ marginBottom: 16 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>#</th>
                      <th>Item Description</th>
                      <th>HSN</th>
                      <th className="num">Qty</th>
                      <th className="num">Net Wt (g)</th>
                      <th>Rate Basis</th>
                      <th className="num">Rate (₹)</th>
                      <th className="num">Taxable (₹)</th>
                      <th className="num">GST 3%</th>
                      <th className="num">Line Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formLines.map((line, idx) => (
                      <tr key={line.id || idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <input 
                            type="text" 
                            className="input input-sm"
                            value={line.description}
                            onChange={e => {
                              const val = e.target.value;
                              setFormLines(formLines.map((l, i) => i === idx ? calculateBillLine({ ...l, description: val }) : l));
                            }}
                          />
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="input input-sm mono"
                            style={{ width: 70 }}
                            value={line.hsn}
                            onChange={e => {
                              const val = e.target.value;
                              setFormLines(formLines.map((l, i) => i === idx ? { ...l, hsn: val } : l));
                            }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="input input-sm mono"
                            style={{ width: 60 }}
                            value={line.qty}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setFormLines(formLines.map((l, i) => i === idx ? calculateBillLine({ ...l, qty: val }) : l));
                            }}
                          />
                        </td>
                        <td>
                          <input 
                            type="number" 
                            step="0.001"
                            className="input input-sm mono"
                            style={{ width: 85 }}
                            value={line.netWeight}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setFormLines(formLines.map((l, i) => i === idx ? calculateBillLine({ ...l, netWeight: val }) : l));
                            }}
                          />
                        </td>
                        <td>
                          <select 
                            className="input input-sm"
                            value={line.rateBasis}
                            onChange={e => {
                              const val = e.target.value;
                              setFormLines(formLines.map((l, i) => i === idx ? calculateBillLine({ ...l, rateBasis: val }) : l));
                            }}
                          >
                            <option value="per_gram">/g</option>
                            <option value="fixed">/pc</option>
                          </select>
                        </td>
                        <td>
                          <input 
                            type="number" 
                            className="input input-sm mono"
                            style={{ width: 85 }}
                            value={line.rate}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setFormLines(formLines.map((l, i) => i === idx ? calculateBillLine({ ...l, rate: val }) : l));
                            }}
                          />
                        </td>
                        <td className="num mono">₹{line.taxable.toLocaleString('en-IN')}</td>
                        <td className="num mono">₹{line.gstAmount.toLocaleString('en-IN')}</td>
                        <td className="num mono" style={{ fontWeight: 700 }}>₹{line.lineTotal.toLocaleString('en-IN')}</td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs"
                            onClick={() => setFormLines(formLines.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => setFormLines([...formLines, calculateBillLine({ description: 'Gold Jewellery Item', rate: 7850 })])}
                >
                  <Plus size={13} /> Add Line Item
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => setFormLines([...formLines, calculateBillLine({ description: 'Making Charges / Labour (HSN 9988)', rateBasis: 'fixed', rate: 2500, gstPct: 5 })])}
                >
                  <Plus size={13} /> Add Labour / Hallmarking Charge
                </button>
              </div>

              {/* Printed Total Check & TDS Section */}
              <div className="g3" style={{ padding: 14, background: 'var(--surface-2, #faf7ef)', borderRadius: 10, marginBottom: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="label">Printed Total on Invoice (₹) *</label>
                    {formIsCustomPrintedTotal && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        style={{ fontSize: 11 }}
                        onClick={() => {
                          setFormIsCustomPrintedTotal(false);
                          setFormPrintedTotal(computedGrandTotal);
                        }}
                      >
                        Reset to Lines Total
                      </button>
                    )}
                  </div>
                  <input 
                    type="number" 
                    className="input mono"
                    value={formPrintedTotal}
                    onChange={e => {
                      setFormIsCustomPrintedTotal(true);
                      setFormPrintedTotal(Number(e.target.value) || 0);
                    }}
                  />
                  {Math.abs(formPrintedTotal - computedGrandTotal) > 1 && (
                    <div className="helper" style={{ color: 'var(--danger)', marginTop: 4 }}>
                      ⚠️ Mismatch: Lines total is ₹{computedGrandTotal.toLocaleString('en-IN')}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">TDS under Sec 194Q / 206C(1H)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <input 
                      type="checkbox" 
                      id="tds_check"
                      checked={formTdsApplicable}
                      onChange={e => setFormTdsApplicable(e.target.checked)}
                    />
                    <label htmlFor="tds_check" style={{ fontSize: 13, cursor: 'pointer' }}>
                      Deduct TDS @ 0.1% (Purchases &gt; ₹50L)
                    </label>
                  </div>
                  {formTdsApplicable && (
                    <div className="helper mono" style={{ marginTop: 4 }}>
                      TDS Deductible: <b>₹{computedTds.toLocaleString('en-IN')}</b>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Net Payable to Supplier</label>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold, #b45309)', marginTop: 6 }} className="mono">
                    ₹{computedNetPayable.toLocaleString('en-IN')}
                  </div>
                  <div className="helper">Total ₹{computedGrandTotal.toLocaleString('en-IN')} - TDS ₹{computedTds.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Upload Invoice Document */}
              <div style={{ 
                padding: '14px 16px', borderRadius: 10, border: '1px dashed var(--border)', 
                background: '#fff', marginBottom: 14 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Upload size={20} style={{ color: 'var(--muted)' }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>Supplier's Original Invoice (PDF / Photo)</div>
                      <div className="helper">Attach digital invoice copy for audit, GSTR-2B matching, and TDS filing.</div>
                    </div>
                  </div>

                  <div className="btn-group">
                    <label className="btn btn-outline btn-xs" style={{ cursor: 'pointer' }}>
                      <FileText size={13} /> Select File
                      <input 
                        type="file" 
                        accept="application/pdf,image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setAttachedFiles([...attachedFiles, { name: file.name, size: file.size, type: file.type }]);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => {
                        setAttachedFiles([...attachedFiles, { name: `Invoice_Camera_Scan_${Date.now()}.jpg`, size: 185000, type: 'image/jpeg' }]);
                      }}
                    >
                      <Camera size={13} /> Camera Scan
                    </button>
                  </div>
                </div>

                {attachedFiles.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                    {attachedFiles.map((f, i) => (
                      <span key={i} className="badge badge-indigo" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FileText size={12} /> {f.name} ({(f.size / 1024).toFixed(0)} KB)
                        <X 
                          size={12} 
                          style={{ cursor: 'pointer' }} 
                          onClick={() => setAttachedFiles(attachedFiles.filter((_, idx) => idx !== i))}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="helper">
                Taxable: <b>₹{computedTaxable.toLocaleString('en-IN')}</b> · GST 3%: <b>₹{computedGst.toLocaleString('en-IN')}</b> · Total: <b>₹{computedGrandTotal.toLocaleString('en-IN')}</b>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowEditorModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => handleSaveBill('DRAFT')}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSaveBill('POSTED')}
                >
                  <CheckCircle2 size={16} /> Post Supplier Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Bill Detail Modal (`BillDetail`) */}
      {selectedBillDetail && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card modal-lg" style={{ maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedBillDetail.billNumber}</h3>
                  <span className={`badge ${selectedBillDetail.status === 'POSTED' ? 'badge-green' : selectedBillDetail.status === 'DRAFT' ? 'badge-gray' : 'badge-red'}`}>
                    {selectedBillDetail.status}
                  </span>
                  <span className={`badge ${selectedBillDetail.payStatus === 'PAID' ? 'badge-green' : selectedBillDetail.payStatus === 'PARTIALLY_PAID' ? 'badge-orange' : 'badge-red'}`}>
                    {selectedBillDetail.payStatus}
                  </span>
                </div>
                <div className="helper" style={{ marginTop: 2 }}>
                  Supplier: <b>{selectedBillDetail.supplierName}</b> · Inv #: <span className="mono">{selectedBillDetail.supplierInvoiceNo}</span> ({selectedBillDetail.supplierInvoiceDate || selectedBillDetail.billDate})
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setSelectedBillDetail(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: 20 }}>
              {/* Progress Pipeline */}
              <div style={{ 
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, 
                padding: '12px 16px', background: 'var(--surface-2, #faf7ef)', borderRadius: 10, marginBottom: 16 
              }}>
                <div>
                  <div className="helper" style={{ fontSize: 11 }}>1. Purchase Orders</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedBillDetail.poNumbers?.join(', ') || 'Direct'}</div>
                  <div className="helper">Purchase Orders</div>
                </div>
                <div>
                  <div className="helper" style={{ fontSize: 11 }}>2. Goods Receipts</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedBillDetail.grnNumbers?.join(', ') || 'Inwarded'}</div>
                  <div className="helper">Stock received</div>
                </div>
                <div>
                  <div className="helper" style={{ fontSize: 11 }}>3. Supplier Bill</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>₹{selectedBillDetail.totalAmount.toLocaleString('en-IN')}</div>
                  <div className="helper">{selectedBillDetail.status}</div>
                </div>
                <div>
                  <div className="helper" style={{ fontSize: 11 }}>4. Payments</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>₹{selectedBillDetail.paidAmount.toLocaleString('en-IN')} paid</div>
                  <div className="helper">₹{selectedBillDetail.balanceDue.toLocaleString('en-IN')} due</div>
                </div>
              </div>

              {/* KPI Strip */}
              <div className="s360-grid" style={{ marginBottom: 16 }}>
                <div className="card s360-card">
                  <div className="s360-label">Bill Total</div>
                  <div className="s360-val" style={{ color: 'var(--gold)' }}>
                    ₹{selectedBillDetail.totalAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="helper">Taxable: ₹{selectedBillDetail.taxableAmount.toLocaleString('en-IN')}</div>
                </div>
                <div className="card s360-card">
                  <div className="s360-label">Input Tax Credit (ITC)</div>
                  <div className="s360-val" style={{ color: 'var(--success)' }}>
                    ₹{(selectedBillDetail.gstAmount || 0).toLocaleString('en-IN')}
                  </div>
                  <div className="helper">CGST + SGST (3% GST)</div>
                </div>
                <div className="card s360-card">
                  <div className="s360-label">Paid Amount</div>
                  <div className="s360-val" style={{ color: 'var(--success)' }}>
                    ₹{selectedBillDetail.paidAmount.toLocaleString('en-IN')}
                  </div>
                  <div className="helper">Allocated from payments</div>
                </div>
                <div className="card s360-card">
                  <div className="s360-label">Balance Due</div>
                  <div className="s360-val" style={{ color: selectedBillDetail.balanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    ₹{selectedBillDetail.balanceDue.toLocaleString('en-IN')}
                  </div>
                  <div className="helper">Due on {selectedBillDetail.dueDate}</div>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${detailTab === 'lines' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailTab('lines')}
                >
                  Lines & Tax Breakdown
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${detailTab === 'document' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailTab('document')}
                >
                  Attached Document ({selectedBillDetail.documents?.length || 0})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${detailTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailTab('history')}
                >
                  History
                </button>
              </div>

              {/* Tab 1: Line Items Table */}
              {detailTab === 'lines' && (
                <div className="tbl-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>HSN</th>
                        <th className="num">Qty</th>
                        <th className="num">Net Wt</th>
                        <th className="num">Rate</th>
                        <th className="num">Taxable</th>
                        <th className="num">CGST 1.5%</th>
                        <th className="num">SGST 1.5%</th>
                        <th className="num">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedBillDetail.lines || []).map((l, i) => (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{l.description}</div>
                            {l.grnNumber && <div className="helper mono">Ref: {l.grnNumber}</div>}
                          </td>
                          <td className="mono">{l.hsn}</td>
                          <td className="num mono">{l.qty}</td>
                          <td className="num mono">{l.netWeight.toFixed(3)} g</td>
                          <td className="num mono">₹{l.rate.toLocaleString('en-IN')}</td>
                          <td className="num mono">₹{l.taxable.toLocaleString('en-IN')}</td>
                          <td className="num mono">₹{(l.cgst || l.gstAmount / 2).toLocaleString('en-IN')}</td>
                          <td className="num mono">₹{(l.sgst || l.gstAmount / 2).toLocaleString('en-IN')}</td>
                          <td className="num mono" style={{ fontWeight: 700 }}>₹{l.lineTotal.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: 'var(--surface-2)', fontWeight: 700 }}>
                        <td colSpan={5}>Total & Taxable</td>
                        <td className="num mono">₹{selectedBillDetail.taxableAmount.toLocaleString('en-IN')}</td>
                        <td className="num mono">₹{(selectedBillDetail.cgstAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="num mono">₹{(selectedBillDetail.sgstAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="num mono" style={{ color: 'var(--gold, #b45309)' }}>
                          ₹{selectedBillDetail.totalAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Tab 2: Document */}
              {detailTab === 'document' && (
                <div style={{ textAlign: 'center', padding: 24, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <FileText size={36} style={{ color: 'var(--indigo)', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>Supplier Invoice Attachment</div>
                  {selectedBillDetail.documents && selectedBillDetail.documents.length > 0 && selectedBillDetail.documents[0] ? (
                    <div style={{ marginTop: 10 }}>
                      <span className="badge badge-indigo">
                        {selectedBillDetail.documents[0].name} ({((selectedBillDetail.documents[0].size || 0) / 1024).toFixed(0)} KB)
                      </span>
                      <div style={{ marginTop: 12 }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => alert(`Simulating PDF Viewer for: ${selectedBillDetail.documents?.[0]?.name}`)}
                        >
                          <Eye size={13} /> View Attached PDF in Browser
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="helper" style={{ marginTop: 4 }}>No invoice document was attached to this bill.</div>
                  )}
                </div>
              )}

              {/* Tab 3: History */}
              {detailTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Bill Captured on {selectedBillDetail.billDate}</div>
                    <div className="helper">Status: {selectedBillDetail.status}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => alert(`Printing Tax Invoice Voucher for Bill ${selectedBillDetail.billNumber}`)}
                >
                  <Printer size={14} /> Print Bill Voucher
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {selectedBillDetail.status === 'DRAFT' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleOpenEditBill(selectedBillDetail)}
                    >
                      <Edit3 size={14} /> Edit Draft
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handlePostBillAction(selectedBillDetail)}
                    >
                      <CheckCircle2 size={14} /> Post Bill
                    </button>
                  </>
                )}

                {selectedBillDetail.status === 'POSTED' && selectedBillDetail.balanceDue > 0 && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => {
                      if (onNavigate) {
                        onNavigate('supplier-payments', selectedBillDetail.id);
                      }
                    }}
                  >
                    <CreditCard size={14} /> Pay This Bill (₹{selectedBillDetail.balanceDue.toLocaleString('en-IN')})
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedBillDetail(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Document Warning Prompt */}
      {showWarningModal && selectedBillDetail && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--warning, #f59e0b)' }}>
                Document Missing Warning
              </h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowWarningModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: 0, fontSize: 13 }}>{warningMessage}</p>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowWarningModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => handlePostBillAction(selectedBillDetail, true)}
              >
                Post Without Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import * as XLSX from 'xlsx';
import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, Plus, Search, Filter, Calendar, Eye, Edit3, 
  CheckCircle2, Clock, AlertCircle, X, Download, Printer, 
  Trash2, ChevronRight, Truck, Receipt, CreditCard, Sparkles, 
  Building2, ArrowRight, RotateCcw, Ban, FileText, Check, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { 
  Supplier, PurchaseOrder, PurchaseOrderLine, GoodsReceipt, 
  SupplierBill, SupplierPayment 
} from '../../types';

interface PurchaseOrdersViewProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts?: GoodsReceipt[];
  supplierBills?: SupplierBill[];
  supplierPayments?: SupplierPayment[];
  onAddPO?: (po: PurchaseOrder) => void;
  onUpdatePO?: (po: PurchaseOrder) => void;
  onAddGRN?: (grn: GoodsReceipt) => void;
  onNavigate?: (tab: string, id?: string) => void;
}

const DEFAULT_SAMPLE_POS: PurchaseOrder[] = [
  {
    id: "po-0001",
    poNumber: "PO-2026-00001",
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
    orderDate: "2026-11-01",
    expectedDeliveryDate: "2026-11-04",
    metalType: "GOLD",
    orderedWeightGrams: 100.000,
    agreedRatePerGram: 7850.00,
    estimatedTotal: 808550.00,
    status: "FULFILLED",
    taxable: 785000.00,
    cgst: 11775.00,
    sgst: 11775.00,
    igst: 0,
    otherCharges: 0,
    terms: "999.9 Fine Pure Gold Grain / Casting Bar with Refinery Assay Certificate. NABL certified.",
    notes: "Raw material bullion stock replenishment for casting and custom jewellery manufacturing.",
    deliveryLocation: "Main Showroom Vault, Zaveri Bazaar, Mumbai",
    orderedQty: 1,
    receivedQty: 1,
    grnCount: 1,
    billedAmount: 808550.00,
    lines: [
      {
        id: "pol-0001",
        lineNo: 1,
        description: "24K Casting Gold Grain Bar (999.9 Pure)",
        metalType: "gold",
        purity: "24K (999.9)",
        category: "Bullion",
        hsn: "7108",
        qty: 1,
        grossWeight: 100.000,
        netWeight: 100.000,
        stoneWeight: 0,
        rateBasis: "per_gram",
        rate: 7850.00,
        discount: 0,
        gstPct: 3,
        taxable: 785000.00,
        gstAmount: 23550.00,
        lineTotal: 808550.00,
        receivedQty: 1,
        pendingQty: 0
      }
    ]
  },
  {
    id: "po-001",
    poNumber: "PO-2026-00019",
    supplier: {
      id: "sup-001",
      code: "SUP-0001",
      tradeName: "Surat Gold Works Ltd.",
      contactPerson: "Ramesh Patel",
      mobile: "9825123456",
      city: "Surat",
      state: "Gujarat",
      gstin: "24AABCS1429B1ZB",
      category: "Bullion Dealer",
      currentBalanceDue: 450000.00
    },
    orderDate: "2026-11-04",
    expectedDeliveryDate: "2026-11-18",
    metalType: "GOLD",
    orderedWeightGrams: 100.000,
    agreedRatePerGram: 7850.00,
    estimatedTotal: 808550.00,
    status: "APPROVED",
    taxable: 785000.00,
    cgst: 11775.00,
    sgst: 11775.00,
    igst: 0,
    otherCharges: 0,
    terms: "Delivery at Showroom vault within 14 days. BIS 916 hallmarked only.",
    notes: "Festive wedding collection replenishment order.",
    deliveryLocation: "Main Showroom Vault, Zaveri Bazaar",
    receivedQty: 0,
    orderedQty: 10,
    grnCount: 0,
    billedAmount: 0,
    lines: [
      {
        id: "pol-1",
        lineNo: 1,
        description: "22K Antique Choker Set (Kundan / Meena)",
        metalType: "gold",
        purity: "22K (916)",
        category: "Necklace",
        hsn: "7113",
        qty: 4,
        grossWeight: 52.500,
        netWeight: 48.000,
        stoneWeight: 4.500,
        rateBasis: "per_gram",
        rate: 7850.00,
        discount: 0,
        gstPct: 3,
        taxable: 376800.00,
        gstAmount: 11304.00,
        lineTotal: 388104.00,
        receivedQty: 0,
        pendingQty: 4
      },
      {
        id: "pol-2",
        lineNo: 2,
        description: "22K Filigree Broad Bridal Bangles (Pair)",
        metalType: "gold",
        purity: "22K (916)",
        category: "Bangles",
        hsn: "7113",
        qty: 6,
        grossWeight: 54.000,
        netWeight: 52.000,
        stoneWeight: 2.000,
        rateBasis: "per_gram",
        rate: 7850.00,
        discount: 0,
        gstPct: 3,
        taxable: 408200.00,
        gstAmount: 12246.00,
        lineTotal: 420446.00,
        receivedQty: 0,
        pendingQty: 6
      }
    ]
  },
  {
    id: "po-002",
    poNumber: "PO-2026-00018",
    supplier: {
      id: "sup-002",
      code: "SUP-0002",
      tradeName: "Rajkot Fine Chains Pvt. Ltd.",
      contactPerson: "Harish Bhai",
      mobile: "9879156789",
      city: "Rajkot",
      state: "Gujarat",
      gstin: "24AAACR5678K1Z3",
      category: "Chain Manufacturer",
      currentBalanceDue: 185000.00
    },
    orderDate: "2026-11-01",
    expectedDeliveryDate: "2026-11-10",
    metalType: "GOLD",
    orderedWeightGrams: 85.500,
    agreedRatePerGram: 7820.00,
    estimatedTotal: 688668.00,
    status: "PARTIALLY_RECEIVED",
    taxable: 668610.00,
    cgst: 10029.00,
    sgst: 10029.00,
    igst: 0,
    otherCharges: 0,
    notes: "Machine hollow and solid chains 22K (916)",
    receivedQty: 12,
    orderedQty: 20,
    grnCount: 1,
    billedAmount: 0,
    lines: [
      {
        id: "pol-3",
        lineNo: 1,
        description: "22K Hollow Rope Chain 20 inches",
        metalType: "gold",
        purity: "22K (916)",
        category: "Chain",
        hsn: "7113",
        qty: 20,
        grossWeight: 85.500,
        netWeight: 85.500,
        stoneWeight: 0,
        rateBasis: "per_gram",
        rate: 7820.00,
        discount: 0,
        gstPct: 3,
        taxable: 668610.00,
        gstAmount: 20058.00,
        lineTotal: 688668.00,
        receivedQty: 12,
        pendingQty: 8
      }
    ]
  },
  {
    id: "po-003",
    poNumber: "PO-2026-00017",
    supplier: {
      id: "sup-003",
      code: "SUP-0003",
      tradeName: "Surat Diamond Cutters",
      contactPerson: "Pravin Shah",
      mobile: "9426890123",
      city: "Surat",
      state: "Gujarat",
      gstin: "24AADCS9012M1Z5",
      category: "Diamond Wholesale",
      currentBalanceDue: 320000.00
    },
    orderDate: "2026-10-25",
    expectedDeliveryDate: "2026-11-05",
    metalType: "DIAMOND",
    orderedWeightGrams: 15.200,
    agreedRatePerGram: 5500.00,
    estimatedTotal: 545900.00,
    status: "FULFILLED",
    taxable: 530000.00,
    cgst: 7950.00,
    sgst: 7950.00,
    igst: 0,
    otherCharges: 0,
    receivedQty: 5,
    orderedQty: 5,
    grnCount: 1,
    billedAmount: 545900.00,
    lines: [
      {
        id: "pol-4",
        lineNo: 1,
        description: "18K White Gold Solitaire Diamond Ring (VVS-EF)",
        metalType: "gold",
        purity: "18K (750)",
        category: "Ring",
        hsn: "7113",
        qty: 5,
        grossWeight: 15.200,
        netWeight: 13.800,
        stoneWeight: 1.400,
        rateBasis: "fixed",
        rate: 106000.00,
        discount: 0,
        gstPct: 3,
        taxable: 530000.00,
        gstAmount: 15900.00,
        lineTotal: 545900.00,
        receivedQty: 5,
        pendingQty: 0
      }
    ]
  }
];

const SUPPLIER_CATALOG_ITEMS = [
  { id: 'cat-1', name: '22K Antique Temple Choker Necklace', metalType: 'gold', purity: '22K (916)', category: 'Necklace', hsn: '7113', gross: 45.0, net: 42.0, stone: 3.0, rate: 7850, basis: 'per_gram' },
  { id: 'cat-2', name: '22K Broad Calcutta Jhumka Earrings', metalType: 'gold', purity: '22K (916)', category: 'Earrings', hsn: '7113', gross: 18.5, net: 18.0, stone: 0.5, rate: 7850, basis: 'per_gram' },
  { id: 'cat-3', name: '22K Daily Wear Machine Chain 22"', metalType: 'gold', purity: '22K (916)', category: 'Chain', hsn: '7113', gross: 12.0, net: 12.0, stone: 0, rate: 7820, basis: 'per_gram' },
  { id: 'cat-4', name: '18K Diamond Solitaire Engagement Ring', metalType: 'gold', purity: '18K (750)', category: 'Ring', hsn: '7113', gross: 4.2, net: 3.8, stone: 0.4, rate: 65000, basis: 'fixed' },
  { id: 'cat-5', name: '24K Minted Gold Bullion Bar 50g (999)', metalType: 'gold', purity: '24K (999)', category: 'Bullion', hsn: '7108', gross: 50.0, net: 50.0, stone: 0, rate: 8450, basis: 'per_gram' },
  { id: 'cat-6', name: '925 Sterling Silver Antique Payal (Pair)', metalType: 'silver', purity: '925', category: 'Payal', hsn: '7114', gross: 120.0, net: 120.0, stone: 0, rate: 110, basis: 'per_gram' },
];

export const PurchaseOrdersView: React.FC<PurchaseOrdersViewProps> = ({
  suppliers,
  purchaseOrders: initialPOs,
  goodsReceipts = [],
  supplierBills = [],
  supplierPayments = [],
  onAddPO,
  onUpdatePO,
  onAddGRN,
  onNavigate
}) => {
  // Merge prop POs with default samples if empty
  const [poList, setPoList] = useState<PurchaseOrder[]>(() => {
    if (initialPOs && initialPOs.length > 0) {
      // enhance with defaults if lines missing
      return initialPOs.map((po, idx) => {
        const sample = DEFAULT_SAMPLE_POS.find(s => s.id === po.id || s.poNumber === po.poNumber) || DEFAULT_SAMPLE_POS[idx] || DEFAULT_SAMPLE_POS[0];
        return {
          ...sample,
          ...po,
          lines: po.lines || sample.lines || []
        };
      });
    }
    return DEFAULT_SAMPLE_POS;
  });

  React.useEffect(() => {
    if (initialPOs && initialPOs.length > 0) {
      setPoList(initialPOs.map((po, idx) => {
        const sample = DEFAULT_SAMPLE_POS.find(s => s.id === po.id || s.poNumber === po.poNumber) || DEFAULT_SAMPLE_POS[idx] || DEFAULT_SAMPLE_POS[0];
        return {
          ...sample,
          ...po,
          lines: po.lines || sample.lines || []
        };
      }));
    }
  }, [initialPOs]);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');

  // Modals state
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingPo, setEditingPo] = useState<PurchaseOrder | null>(null);
  const [selectedPoDetail, setSelectedPoDetail] = useState<PurchaseOrder | null>(null);
  const [detailTab, setDetailTab] = useState<'lines' | 'grns' | 'bills' | 'payments' | 'history'>('lines');
  const [showItemPickerModal, setShowItemPickerModal] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerMetal, setPickerMetal] = useState('ALL');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // New / Edit PO Form state
  const [formSupplierId, setFormSupplierId] = useState(suppliers[0]?.id || 'sup-001');
  const [formPoDate, setFormPoDate] = useState(new Date().toISOString().slice(0, 10));
  const [formExpectedDate, setFormExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [formDeliveryLocation, setFormDeliveryLocation] = useState('Main Showroom Vault, Zaveri Bazaar, Mumbai');
  const [formOtherCharges, setFormOtherCharges] = useState<number>(0);
  const [formTerms, setFormTerms] = useState('Delivery at Showroom vault. BIS 916 hallmarked only. Tolerance ±0.050g.');
  const [formNotes, setFormNotes] = useState('');
  const [formLines, setFormLines] = useState<PurchaseOrderLine[]>([
    {
      id: `line-${Date.now()}`,
      lineNo: 1,
      description: '22K Gold Antique Necklace Set',
      metalType: 'gold',
      purity: '22K (916)',
      category: 'Necklace',
      hsn: '7113',
      qty: 2,
      grossWeight: 48.500,
      netWeight: 45.000,
      stoneWeight: 3.500,
      rateBasis: 'per_gram',
      rate: 7850,
      discount: 0,
      gstPct: 3,
      taxable: 353250,
      gstAmount: 10597.50,
      lineTotal: 363847.50,
      receivedQty: 0,
      pendingQty: 2
    }
  ]);

  // Derived filtered POs
  const filteredPOs = useMemo(() => {
    return poList.filter(po => {
      const matchSearch = 
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier.tradeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.supplier.code && po.supplier.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (po.notes && po.notes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchStatus = statusFilter === 'ALL' || po.status === statusFilter;
      const matchSupplier = supplierFilter === 'ALL' || po.supplier.id === supplierFilter;

      return matchSearch && matchStatus && matchSupplier;
    });
  }, [poList, searchTerm, statusFilter, supplierFilter]);

  // KPI calculations
  const kpiStats = useMemo(() => {
    const total = poList.length;
    const totalValue = poList.reduce((acc, p) => acc + (p.estimatedTotal || 0), 0);
    const approvedCount = poList.filter(p => ['APPROVED', 'ISSUED', 'PARTIALLY_RECEIVED', 'SENT'].includes(p.status)).length;
    const fulfilledCount = poList.filter(p => ['FULFILLED', 'RECEIVED', 'CLOSED'].includes(p.status)).length;
    const totalOrderedQty = poList.reduce((acc, p) => acc + (p.orderedQty || (p.lines ? p.lines.reduce((s, l) => s + l.qty, 0) : 1)), 0);
    const totalReceivedQty = poList.reduce((acc, p) => acc + (p.receivedQty || 0), 0);

    return {
      total,
      totalValue,
      approvedCount,
      fulfilledCount,
      totalOrderedQty,
      totalReceivedQty,
      fulfilledPct: totalOrderedQty > 0 ? Math.round((totalReceivedQty / totalOrderedQty) * 100) : 0
    };
  }, [poList]);

  // Calculations for PO line items
  const calculateLine = (line: Partial<PurchaseOrderLine>): PurchaseOrderLine => {
    const qty = Number(line.qty || 1);
    const netWeight = Number(line.netWeight || 0);
    const stoneWeight = Number(line.stoneWeight || 0);
    const rate = Number(line.rate || 0);
    const discount = Number(line.discount || 0);
    const gstPct = Number(line.gstPct || 3);
    const basis = line.rateBasis || 'per_gram';

    let base = 0;
    if (basis === 'per_gram') {
      base = netWeight * rate;
    } else if (basis === 'per_ct') {
      base = stoneWeight * rate;
    } else {
      base = qty * rate;
    }

    const taxable = Math.max(0, base - discount);
    const gstAmount = Math.round(taxable * (gstPct / 100) * 100) / 100;
    const lineTotal = taxable + gstAmount;

    return {
      description: line.description || '',
      metalType: line.metalType || 'gold',
      purity: line.purity || '22K (916)',
      category: line.category || 'Jewellery',
      hsn: line.hsn || '7113',
      qty,
      grossWeight: Number(line.grossWeight || netWeight),
      netWeight,
      stoneWeight,
      rateBasis: basis,
      rate,
      discount,
      gstPct,
      taxable,
      gstAmount,
      lineTotal,
      receivedQty: line.receivedQty || 0,
      pendingQty: line.pendingQty !== undefined ? line.pendingQty : qty,
      stones: line.stones || []
    };
  };

  // Form totals
  const formTaxable = useMemo(() => formLines.reduce((acc, l) => acc + (l.taxable || 0), 0), [formLines]);
  const formGst = useMemo(() => formLines.reduce((acc, l) => acc + (l.gstAmount || 0), 0), [formLines]);
  const formGrandTotal = useMemo(() => formTaxable + formGst + Number(formOtherCharges || 0), [formTaxable, formGst, formOtherCharges]);
  const formTotalPcs = useMemo(() => formLines.reduce((acc, l) => acc + l.qty, 0), [formLines]);
  const formTotalNetWt = useMemo(() => formLines.reduce((acc, l) => acc + l.netWeight, 0), [formLines]);

  // Open Editor for New PO
  const handleOpenNewPO = () => {
    setEditingPo(null);
    setFormSupplierId(suppliers[0]?.id || 'sup-001');
    setFormPoDate(new Date().toISOString().slice(0, 10));
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setFormExpectedDate(d.toISOString().slice(0, 10));
    setFormDeliveryLocation('Main Showroom Vault, Zaveri Bazaar, Mumbai');
    setFormOtherCharges(0);
    setFormTerms('Delivery at Showroom vault. BIS 916 hallmarked only. Tolerance ±0.050g.');
    setFormNotes('');
    setFormLines([
      calculateLine({
        description: '22K Gold Antique Broad Kada Bangle',
        metalType: 'gold',
        purity: '22K (916)',
        category: 'Bangles',
        qty: 2,
        grossWeight: 42.0,
        netWeight: 40.0,
        stoneWeight: 2.0,
        rateBasis: 'per_gram',
        rate: 7850
      })
    ]);
    setShowEditorModal(true);
  };

  // Open Editor for Existing PO
  const handleOpenEditPO = (po: PurchaseOrder) => {
    setEditingPo(po);
    setFormSupplierId(po.supplier.id);
    setFormPoDate(po.orderDate);
    setFormExpectedDate(po.expectedDeliveryDate);
    setFormDeliveryLocation(po.deliveryLocation || 'Main Showroom Vault, Zaveri Bazaar, Mumbai');
    setFormOtherCharges(po.otherCharges || 0);
    setFormTerms(po.terms || '');
    setFormNotes(po.notes || '');
    setFormLines(po.lines && po.lines.length > 0 ? po.lines : [
      calculateLine({
        description: `${po.metalType} Item Order`,
        metalType: po.metalType.toLowerCase(),
        purity: '22K (916)',
        qty: po.orderedQty || 1,
        grossWeight: po.orderedWeightGrams,
        netWeight: po.orderedWeightGrams,
        rateBasis: 'per_gram',
        rate: po.agreedRatePerGram
      })
    ]);
    setShowEditorModal(true);
  };

  // Save PO (Draft or Update)
  const handleSavePO = (saveAsStatus: 'DRAFT' | 'APPROVED' = 'DRAFT') => {
    const selectedSupplier = suppliers.find(s => s.id === formSupplierId) || suppliers[0];
    const poNumber = editingPo ? editingPo.poNumber : `PO-2026-${String(poList.length + 20).padStart(5, '0')}`;

    const newPO: PurchaseOrder = {
      id: editingPo ? editingPo.id : `po-${Date.now()}`,
      poNumber,
      supplier: selectedSupplier,
      orderDate: formPoDate,
      expectedDeliveryDate: formExpectedDate,
      metalType: formLines[0]?.metalType.toUpperCase() || 'GOLD',
      orderedWeightGrams: formTotalNetWt,
      agreedRatePerGram: formLines[0]?.rate || 7850,
      estimatedTotal: formGrandTotal,
      taxable: formTaxable,
      cgst: formGst / 2,
      sgst: formGst / 2,
      igst: 0,
      otherCharges: Number(formOtherCharges || 0),
      status: editingPo ? (editingPo.status === 'DRAFT' ? saveAsStatus : editingPo.status) : saveAsStatus,
      terms: formTerms,
      notes: formNotes,
      deliveryLocation: formDeliveryLocation,
      lines: formLines,
      orderedQty: formTotalPcs,
      receivedQty: editingPo ? editingPo.receivedQty || 0 : 0,
      grnCount: editingPo ? editingPo.grnCount || 0 : 0,
      billedAmount: editingPo ? editingPo.billedAmount || 0 : 0
    };

    let updatedList: PurchaseOrder[];
    if (editingPo) {
      updatedList = poList.map(p => p.id === editingPo.id ? newPO : p);
      if (onUpdatePO) onUpdatePO(newPO);
    } else {
      updatedList = [newPO, ...poList];
      if (onAddPO) onAddPO(newPO);
    }

    setPoList(updatedList);
    setShowEditorModal(false);
    setSelectedPoDetail(newPO);
  };

  // Status transitions
  const handleUpdateStatus = (po: PurchaseOrder, newStatus: string, reason?: string) => {
    const updated = { 
      ...po, 
      status: newStatus,
      ...(newStatus === 'APPROVED' ? { approvedBy: 'Admin (Shop Owner)', approvedAt: new Date().toISOString() } : {}),
      ...(reason ? { cancelReason: reason } : {})
    };
    const nextList = poList.map(p => p.id === po.id ? updated : p);
    setPoList(nextList);
    setSelectedPoDetail(updated);
    if (onUpdatePO) onUpdatePO(updated);
    setShowCancelModal(false);
    setCancelReasonText('');
  };

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="badge badge-gray">Draft</span>;
      case 'SUBMITTED':
        return <span className="badge badge-blue">Submitted</span>;
      case 'APPROVED':
        return <span className="badge badge-teal">Approved</span>;
      case 'SENT':
      case 'ISSUED':
        return <span className="badge badge-indigo">Issued / Sent</span>;
      case 'PARTIALLY_RECEIVED':
        return <span className="badge badge-orange">Partially Received</span>;
      case 'FULFILLED':
      case 'RECEIVED':
        return <span className="badge badge-green">Received / Fulfilled</span>;
      case 'CLOSED':
        return <span className="badge badge-gray">Closed</span>;
      case 'CANCELLED':
        return <span className="badge badge-red">Cancelled</span>;
      default:
        return <span className="badge badge-gray">{status}</span>;
    }
  };

  const exportPurchaseOrders = (format: 'csv' | 'xlsx') => {
    const rows = [
      ['PO', 'Date', 'Supplier', 'Expected', 'Total', 'Received', 'GRNs', 'Billed', 'Status'],
      ...filteredPOs.map(po => [
        po.poNumber, po.orderDate, po.supplier.tradeName, po.expectedDeliveryDate,
        po.estimatedTotal, po.receivedQty ?? 0, po.grnCount ?? 0, po.billedAmount ?? 0, po.status
      ])
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), 'Purchase Orders');
    XLSX.writeFile(workbook, `purchase_orders.${format}`, { bookType: format });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
            }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Purchase Orders</h1>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
                Draft → Submitted → Approved → Received / Closed. Open a PO for its goods receipts, supplier bills and payments.
              </p>
            </div>
          </div>
        </div>

        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleOpenNewPO}
          >
            <Plus size={16} /> New PO
          </button>
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => exportPurchaseOrders('csv')}
          >
            <Download size={15} /> CSV
          </button>

          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => exportPurchaseOrders('xlsx')}
          >
            <FileSpreadsheet size={15} /> Excel
          </button>

        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="s360-grid">
        <div className="card s360-card">
          <div className="s360-label">Total Purchase Orders</div>
          <div className="s360-val">{kpiStats.total}</div>
          <div className="helper">{kpiStats.approvedCount} in active workflow</div>
        </div>

        <div className="card s360-card">
          <div className="s360-label">Total Ordered Value</div>
          <div className="s360-val" style={{ color: 'var(--gold)' }}>
            ₹{(kpiStats.totalValue / 100000).toFixed(2)} L
          </div>
          <div className="helper">₹{kpiStats.totalValue.toLocaleString('en-IN')} gross estimate</div>
        </div>

        <div className="card s360-card">
          <div className="s360-label">Fulfillment Status</div>
          <div className="s360-val" style={{ color: kpiStats.fulfilledPct >= 80 ? 'var(--success)' : 'var(--warning, #f59e0b)' }}>
            {kpiStats.fulfilledPct}%
          </div>
          <div className="helper">{kpiStats.totalReceivedQty} of {kpiStats.totalOrderedQty} pieces received</div>
        </div>

        <div className="card s360-card">
          <div className="s360-label">Closed / Completed</div>
          <div className="s360-val" style={{ color: 'var(--success)' }}>
            {kpiStats.fulfilledCount}
          </div>
          <div className="helper">Fully received & stock verified</div>
        </div>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 10, flex: '1 1 320px', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: 360 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: 'var(--muted)' }} />
              <input 
                type="text" 
                className="input input-sm" 
                style={{ paddingLeft: 34, width: '100%' }}
                placeholder="Search PO #, supplier name, notes..."
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
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="PARTIALLY_RECEIVED">Partially Received</option>
              <option value="FULFILLED">Received / Fulfilled</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <select 
              className="input input-sm" 
              style={{ width: 'auto' }}
              value={supplierFilter}
              onChange={e => setSupplierFilter(e.target.value)}
            >
              <option value="ALL">All Suppliers</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.tradeName}</option>
              ))}
            </select>
          </div>

          <div className="helper">
            Showing <b>{filteredPOs.length}</b> of <b>{poList.length}</b> purchase orders
          </div>
        </div>
      </div>

      {/* 4. PO Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="tbl-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 130 }}>PO</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Expected</th>
                <th className="num">Total</th>
                <th style={{ textAlign: 'center' }}>Received</th>
                <th style={{ textAlign: 'center' }}>GRNs</th>
                <th className="num">Billed</th>
                <th style={{ textAlign: 'center' }}>Status</th>
                <th style={{ textAlign: 'right', width: 110 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.map((po) => {
                const isOverdue = po.status !== 'FULFILLED' && po.status !== 'CLOSED' && po.status !== 'CANCELLED' && 
                  new Date(po.expectedDeliveryDate) < new Date();
                const ordered = po.orderedQty || (po.lines ? po.lines.reduce((s, l) => s + l.qty, 0) : 1);
                const received = po.receivedQty || 0;
                const badgeColor = received >= ordered && ordered > 0 ? 'badge-green' : received > 0 ? 'badge-orange' : 'badge-gray';

                return (
                  <tr 
                    key={po.id} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedPoDetail(po);
                      setDetailTab('lines');
                    }}
                  >
                    <td>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--gold, #b45309)' }}>
                        {po.poNumber}
                      </span>
                    </td>
                    <td>{new Date(po.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{po.supplier.tradeName}</div>
                      <div className="helper mono" style={{ fontSize: 11 }}>{po.supplier.code} · {po.supplier.city}</div>
                    </td>
                    <td>
                      <span style={{ color: isOverdue ? 'var(--danger, #ef4444)' : 'inherit', fontWeight: isOverdue ? 700 : 400 }}>
                        {new Date(po.expectedDeliveryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {isOverdue && <span className="badge badge-red" style={{ marginLeft: 6, fontSize: 10 }}>Overdue</span>}
                      </span>
                    </td>
                    <td className="num mono" style={{ fontWeight: 700 }}>
                      ₹{po.estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${badgeColor}`}>
                        {received} / {ordered} pc
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="mono">{po.grnCount || 0}</span>
                    </td>
                    <td className="num mono">
                      {po.billedAmount ? `₹${po.billedAmount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {renderStatusBadge(po.status)}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          title="View"
                          onClick={() => {
                            setSelectedPoDetail(po);
                            setDetailTab('lines');
                          }}
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                        {po.status === 'DRAFT' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            title="Edit Draft PO"
                            onClick={() => handleOpenEditPO(po)}
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                        {['APPROVED', 'PARTIALLY_RECEIVED', 'DRAFT'].includes(po.status) && (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            title="Receive GRN"
                            onClick={() => {
                              if (onNavigate) {
                                onNavigate('goods-receipts', po.id);
                              } else {
                                setSelectedPoDetail(po);
                                setDetailTab('grns');
                              }
                            }}
                          >
                            <Truck size={13} />
                            <span>Receive GRN</span>
                          </button>
                        )}
                        {po.status !== 'CANCELLED' && po.status !== 'CLOSED' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            title="Cancel"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => {
                              setSelectedPoDetail(po);
                              setShowCancelModal(true);
                            }}
                          >
                            <Ban size={13} />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredPOs.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <ShoppingBag size={36} style={{ color: 'var(--muted)', opacity: 0.5 }} />
                      <div style={{ fontWeight: 600, fontSize: 15 }}>No Purchase Orders Found</div>
                      <div className="helper" style={{ maxWidth: 360 }}>
                        {searchTerm || statusFilter !== 'ALL' || supplierFilter !== 'ALL'
                          ? 'No purchase orders match your filter criteria. Clear filters or create a new order.'
                          : 'There are no purchase orders in the database. Click "+ New Purchase Order" to issue an order to a supplier.'}
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm" 
                        style={{ marginTop: 8 }}
                        onClick={handleOpenNewPO}
                      >
                        <Plus size={14} /> Create First Purchase Order
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. PO Details Modal / Drawer (`PoDetail`) */}
      {selectedPoDetail && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card modal-lg" style={{ maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-head">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{selectedPoDetail.poNumber}</h3>
                  {renderStatusBadge(selectedPoDetail.status)}
                </div>
                <div className="helper" style={{ marginTop: 2 }}>
                  Supplier: <b>{selectedPoDetail.supplier.tradeName}</b> ({selectedPoDetail.supplier.code}) · GSTIN: <span className="mono">{selectedPoDetail.supplier.gstin}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setSelectedPoDetail(null)}
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
                  <div className="helper" style={{ fontSize: 11 }}>1. Purchase Order</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{selectedPoDetail.poNumber}</div>
                  <div className="helper">₹{selectedPoDetail.estimatedTotal.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <div className="helper" style={{ fontSize: 11 }}>2. Goods Received</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {selectedPoDetail.receivedQty || 0} / {selectedPoDetail.orderedQty || 0} pc
                  </div>
                  <div className="helper">{selectedPoDetail.grnCount || 0} GRN(s)</div>
                </div>
                <div>
                  <div className="helper" style={{ fontSize: 11 }}>3. Supplier Bills</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {selectedPoDetail.billedAmount ? `₹${selectedPoDetail.billedAmount.toLocaleString('en-IN')}` : '0 Billed'}
                  </div>
                  <div className="helper">Inward Invoices</div>
                </div>
                <div>
                  <div className="helper" style={{ fontSize: 11 }}>4. Payments</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {selectedPoDetail.billedAmount ? 'Pending' : '—'}
                  </div>
                  <div className="helper">Payables settled</div>
                </div>
              </div>

              {/* Order Info Grid */}
              <div className="g4" style={{ marginBottom: 16 }}>
                <div>
                  <div className="helper">Order Date</div>
                  <div style={{ fontWeight: 600 }}>{selectedPoDetail.orderDate}</div>
                </div>
                <div>
                  <div className="helper">Expected Delivery</div>
                  <div style={{ fontWeight: 600 }}>{selectedPoDetail.expectedDeliveryDate}</div>
                </div>
                <div>
                  <div className="helper">Delivery Vault</div>
                  <div style={{ fontWeight: 600 }}>{selectedPoDetail.deliveryLocation || 'Main Showroom'}</div>
                </div>
                <div>
                  <div className="helper">Total Ordered Net Wt</div>
                  <div style={{ fontWeight: 700 }} className="mono">{selectedPoDetail.orderedWeightGrams.toFixed(3)} g</div>
                </div>
              </div>

              {/* Detail Tabs */}
              <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${detailTab === 'lines' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailTab('lines')}
                >
                  Line Items ({selectedPoDetail.lines?.length || 0})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${detailTab === 'grns' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailTab('grns')}
                >
                  Goods Receipts ({goodsReceipts.filter(g => g.poNumber === selectedPoDetail.poNumber).length})
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${detailTab === 'bills' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailTab('bills')}
                >
                  Supplier Bills
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${detailTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setDetailTab('history')}
                >
                  Audit Trail
                </button>
              </div>

              {/* Tab 1: Line Items Table */}
              {detailTab === 'lines' && (
                <div className="tbl-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: 30 }}>#</th>
                        <th>Item Description</th>
                        <th>Metal / Purity</th>
                        <th className="num">Qty</th>
                        <th className="num">Net Wt</th>
                        <th className="num">Rate</th>
                        <th className="num">Taxable</th>
                        <th className="num">GST 3%</th>
                        <th className="num">Line Total</th>
                        <th style={{ textAlign: 'center' }}>Inward</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPoDetail.lines || []).map((line, idx) => (
                        <tr key={line.id || idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{line.description}</div>
                            <div className="helper">Category: {line.category || 'Jewellery'} · HSN: {line.hsn || '7113'}</div>
                          </td>
                          <td>
                            <span className="badge badge-gold" style={{ fontSize: 11 }}>
                              {line.purity}
                            </span>
                          </td>
                          <td className="num mono">{line.qty}</td>
                          <td className="num mono">{line.netWeight.toFixed(3)} g</td>
                          <td className="num mono">
                            ₹{line.rate.toLocaleString('en-IN')} {line.rateBasis === 'per_gram' ? '/g' : line.rateBasis === 'per_ct' ? '/ct' : '/pc'}
                          </td>
                          <td className="num mono">₹{line.taxable?.toLocaleString('en-IN')}</td>
                          <td className="num mono">₹{line.gstAmount?.toLocaleString('en-IN')}</td>
                          <td className="num mono" style={{ fontWeight: 700 }}>
                            ₹{line.lineTotal?.toLocaleString('en-IN')}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge ${(line.receivedQty || 0) >= line.qty ? 'badge-green' : (line.receivedQty || 0) > 0 ? 'badge-orange' : 'badge-gray'}`}>
                              {line.receivedQty || 0} / {line.qty}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: 700, background: 'var(--surface-2, #faf7ef)' }}>
                        <td colSpan={3}>Subtotal & Taxes</td>
                        <td className="num mono">{selectedPoDetail.orderedQty || selectedPoDetail.lines?.reduce((s, l) => s + l.qty, 0)}</td>
                        <td className="num mono">{selectedPoDetail.orderedWeightGrams.toFixed(3)} g</td>
                        <td></td>
                        <td className="num mono">₹{(selectedPoDetail.taxable || 0).toLocaleString('en-IN')}</td>
                        <td className="num mono">₹{((selectedPoDetail.cgst || 0) + (selectedPoDetail.sgst || 0)).toLocaleString('en-IN')}</td>
                        <td className="num mono" style={{ color: 'var(--gold, #b45309)' }}>
                          ₹{selectedPoDetail.estimatedTotal.toLocaleString('en-IN')}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Tab 2: Linked Goods Receipts */}
              {detailTab === 'grns' && (
                <div>
                  {goodsReceipts.filter(g => g.poNumber === selectedPoDetail.poNumber).length > 0 ? (
                    <div className="tbl-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>GRN #</th>
                            <th>Date</th>
                            <th>Challan #</th>
                            <th className="num">Pieces</th>
                            <th className="num">Net Wt</th>
                            <th>Purity</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {goodsReceipts.filter(g => g.poNumber === selectedPoDetail.poNumber).map(grn => (
                            <tr key={grn.id}>
                              <td className="mono" style={{ fontWeight: 700 }}>{grn.grnNumber}</td>
                              <td>{grn.receiptDate}</td>
                              <td>{grn.challanNo || '—'}</td>
                              <td className="num mono">{grn.receivedPieces}</td>
                              <td className="num mono">{grn.receivedNetWeight.toFixed(3)} g</td>
                              <td><span className="badge badge-gold">{grn.hallmarkedPurity}</span></td>
                              <td><span className="badge badge-green">{grn.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 30, background: 'var(--surface-2)', borderRadius: 8 }}>
                      <Truck size={32} style={{ color: 'var(--muted)', marginBottom: 8 }} />
                      <div style={{ fontWeight: 600 }}>No Goods Received Yet for this PO</div>
                      <div className="helper">Once goods arrive from {selectedPoDetail.supplier.tradeName}, inward them via Goods Receipts.</div>
                      {['APPROVED', 'PARTIALLY_RECEIVED'].includes(selectedPoDetail.status) && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ marginTop: 10 }}
                          onClick={() => {
                            if (onNavigate) {
                              onNavigate('goods-receipts', selectedPoDetail.id);
                            }
                          }}
                        >
                          <Truck size={14} /> Record Goods Intake (GRN)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Supplier Bills */}
              {detailTab === 'bills' && (
                <div style={{ textAlign: 'center', padding: 30, background: 'var(--surface-2)', borderRadius: 8 }}>
                  <Receipt size={32} style={{ color: 'var(--muted)', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>Inward Invoices Linked to PO</div>
                  <div className="helper">Capture supplier GST invoice under Supplier Bills after verifying goods receipt.</div>
                </div>
              )}

              {/* Tab 4: Audit Trail */}
              {detailTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '10px 0' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)', marginTop: 4 }}></div>
                    <div>
                      <div style={{ fontWeight: 600 }}>Purchase Order Created ({selectedPoDetail.orderDate})</div>
                      <div className="helper">Draft initiated by Purchasing Manager</div>
                    </div>
                  </div>
                  {selectedPoDetail.approvedBy && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--gold)', marginTop: 4 }}></div>
                      <div>
                        <div style={{ fontWeight: 600 }}>Approved by {selectedPoDetail.approvedBy}</div>
                        <div className="helper">{selectedPoDetail.approvedAt ? new Date(selectedPoDetail.approvedAt).toLocaleString('en-IN') : 'Approved for delivery'}</div>
                      </div>
                    </div>
                  )}
                  {selectedPoDetail.cancelReason && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--danger)', marginTop: 4 }}></div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--danger)' }}>Order Cancelled</div>
                        <div className="helper">Reason: {selectedPoDetail.cancelReason}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Terms & Notes */}
              {(selectedPoDetail.terms || selectedPoDetail.notes) && (
                <div style={{ marginTop: 16, padding: 12, background: 'var(--surface-2, #faf7ef)', borderRadius: 8, fontSize: 13 }}>
                  {selectedPoDetail.terms && (
                    <div><b>Terms:</b> <span className="helper" style={{ color: 'inherit' }}>{selectedPoDetail.terms}</span></div>
                  )}
                  {selectedPoDetail.notes && (
                    <div style={{ marginTop: 4 }}><b>Notes:</b> <span className="helper" style={{ color: 'inherit' }}>{selectedPoDetail.notes}</span></div>
                  )}
                </div>
              )}
            </div>

            {/* Workflow Action Buttons */}
            <div className="modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowPrintModal(true)}
                >
                  <Printer size={14} /> Print PO Voucher
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                {selectedPoDetail.status === 'DRAFT' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleOpenEditPO(selectedPoDetail)}
                    >
                      <Edit3 size={14} /> Edit Draft
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleUpdateStatus(selectedPoDetail, 'SUBMITTED')}
                    >
                      <ArrowRight size={14} /> Submit for Approval
                    </button>
                  </>
                )}

                {selectedPoDetail.status === 'SUBMITTED' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleUpdateStatus(selectedPoDetail, 'DRAFT')}
                    >
                      <RotateCcw size={14} /> Back to Draft
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleUpdateStatus(selectedPoDetail, 'APPROVED')}
                    >
                      <CheckCircle2 size={14} /> Approve Purchase Order
                    </button>
                  </>
                )}

                {selectedPoDetail.status === 'APPROVED' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleUpdateStatus(selectedPoDetail, 'SENT')}
                    >
                      <FileText size={14} /> Mark as Sent to Supplier
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('goods-receipts', selectedPoDetail.id);
                        } else {
                          setDetailTab('grns');
                        }
                      }}
                    >
                      <Truck size={14} /> Receive Goods (GRN)
                    </button>
                  </>
                )}

                {selectedPoDetail.status === 'PARTIALLY_RECEIVED' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        if (onNavigate) {
                          onNavigate('goods-receipts', selectedPoDetail.id);
                        }
                      }}
                    >
                      <Truck size={14} /> Inward Remaining Goods
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleUpdateStatus(selectedPoDetail, 'CLOSED')}
                    >
                      Close PO Early
                    </button>
                  </>
                )}

                {!['FULFILLED', 'CLOSED', 'CANCELLED'].includes(selectedPoDetail.status) && (
                  <button
                    type="button"
                    className="btn btn-danger-outline"
                    onClick={() => setShowCancelModal(true)}
                  >
                    <Ban size={14} /> Cancel PO
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setSelectedPoDetail(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. New / Edit PO Editor Modal (`PoEditor`) */}
      {showEditorModal && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card modal-lg" style={{ maxWidth: 1000, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-head">
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  {editingPo ? `Edit Purchase Order (${editingPo.poNumber})` : 'New Purchase Order'}
                </h3>
                <div className="helper">
                  Select supplier, specify metal items, agreed rates and scheduled delivery.
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
              {/* Supplier & Header Fields */}
              <div className="g3" style={{ marginBottom: 16 }}>
                <div>
                  <label className="label">Supplier *</label>
                  <select 
                    className="input"
                    value={formSupplierId}
                    onChange={e => setFormSupplierId(e.target.value)}
                    disabled={!!editingPo && editingPo.status !== 'DRAFT'}
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.tradeName} ({s.code}) · {s.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Order Date *</label>
                  <input 
                    type="date" 
                    className="input"
                    value={formPoDate}
                    onChange={e => setFormPoDate(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Expected Delivery Date *</label>
                  <input 
                    type="date" 
                    className="input"
                    value={formExpectedDate}
                    min={formPoDate}
                    onChange={e => setFormExpectedDate(e.target.value)}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="label">Delivery Vault / Location</label>
                  <input 
                    type="text" 
                    className="input"
                    placeholder="Showroom vault address"
                    value={formDeliveryLocation}
                    onChange={e => setFormDeliveryLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Other Charges (₹ Freight/Hallmarking)</label>
                  <input 
                    type="number" 
                    className="input"
                    value={formOtherCharges}
                    onChange={e => setFormOtherCharges(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Items Section Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Line Items to Order</h4>
                  <div className="helper">Pick from supplier catalog items or type custom free-text specifications.</div>
                </div>

                <div className="btn-group">
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => setShowItemPickerModal(true)}
                  >
                    <Sparkles size={13} /> Pick from Catalog
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => {
                      setFormLines([
                        ...formLines,
                        calculateLine({
                          description: '22K Gold Plain Ornament',
                          metalType: 'gold',
                          purity: '22K (916)',
                          category: 'Jewellery',
                          qty: 1,
                          grossWeight: 10.0,
                          netWeight: 10.0,
                          stoneWeight: 0,
                          rateBasis: 'per_gram',
                          rate: 7850
                        })
                      ]);
                    }}
                  >
                    <Plus size={13} /> Add Free-Text Item
                  </button>
                </div>
              </div>

              {/* Line Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {formLines.map((line, idx) => (
                  <div 
                    key={line.id || idx} 
                    style={{ 
                      padding: 14, borderRadius: 10, border: '1px solid var(--border)', 
                      background: 'var(--surface-2, #faf7ef)' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span className="badge badge-gold" style={{ fontWeight: 700 }}>
                        Item #{idx + 1}
                      </span>
                      {formLines.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => setFormLines(formLines.filter((_, i) => i !== idx))}
                        >
                          <Trash2 size={14} /> Remove Line
                        </button>
                      )}
                    </div>

                    <div className="g4">
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="label">Item Name & Description *</label>
                        <input 
                          type="text" 
                          className="input"
                          value={line.description}
                          onChange={e => {
                            const val = e.target.value;
                            setFormLines(formLines.map((l, i) => i === idx ? calculateLine({ ...l, description: val }) : l));
                          }}
                        />
                      </div>

                      <div>
                        <label className="label">Metal Type</label>
                        <select 
                          className="input"
                          value={line.metalType}
                          onChange={e => {
                            const val = e.target.value;
                            setFormLines(formLines.map((l, i) => i === idx ? calculateLine({ ...l, metalType: val }) : l));
                          }}
                        >
                          <option value="gold">Gold</option>
                          <option value="silver">Silver</option>
                          <option value="platinum">Platinum</option>
                          <option value="diamond">Diamond</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">Purity *</label>
                        <select 
                          className="input"
                          value={line.purity}
                          onChange={e => {
                            const val = e.target.value;
                            setFormLines(formLines.map((l, i) => i === idx ? calculateLine({ ...l, purity: val }) : l));
                          }}
                        >
                          <option value="24K (999)">24K (999)</option>
                          <option value="22K (916)">22K (916)</option>
                          <option value="18K (750)">18K (750)</option>
                          <option value="14K (585)">14K (585)</option>
                          <option value="925 Sterling">925 Sterling</option>
                          <option value="999 Silver">999 Silver</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">Qty (Pieces) *</label>
                        <input 
                          type="number" 
                          className="input"
                          min="1"
                          value={line.qty}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormLines(formLines.map((l, i) => i === idx ? calculateLine({ ...l, qty: val }) : l));
                          }}
                        />
                      </div>

                      <div>
                        <label className="label">Gross Wt (g)</label>
                        <input 
                          type="number" 
                          step="0.001"
                          className="input"
                          value={line.grossWeight}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormLines(formLines.map((l, i) => i === idx ? calculateLine({ ...l, grossWeight: val }) : l));
                          }}
                        />
                      </div>

                      <div>
                        <label className="label">Net Wt (g) *</label>
                        <input 
                          type="number" 
                          step="0.001"
                          className="input"
                          value={line.netWeight}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormLines(formLines.map((l, i) => i === idx ? calculateLine({ ...l, netWeight: val }) : l));
                          }}
                        />
                      </div>

                      <div>
                        <label className="label">Rate Basis</label>
                        <select 
                          className="input"
                          value={line.rateBasis}
                          onChange={e => {
                            const val = e.target.value;
                            setFormLines(formLines.map((l, i) => i === idx ? calculateLine({ ...l, rateBasis: val }) : l));
                          }}
                        >
                          <option value="per_gram">Per Gram (/g)</option>
                          <option value="per_ct">Per Carat (/ct)</option>
                          <option value="fixed">Per Piece (/pc)</option>
                        </select>
                      </div>

                      <div>
                        <label className="label">Agreed Rate (₹) *</label>
                        <input 
                          type="number" 
                          className="input"
                          value={line.rate}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormLines(formLines.map((l, i) => i === idx ? calculateLine({ ...l, rate: val }) : l));
                          }}
                        />
                      </div>

                      <div>
                        <label className="label">GST %</label>
                        <input 
                          type="number" 
                          className="input"
                          value={line.gstPct}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setFormLines(formLines.map((l, i) => i === idx ? calculateLine({ ...l, gstPct: val }) : l));
                          }}
                        />
                      </div>

                      <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 14 }}>
                        <div className="helper">
                          Taxable: <b>₹{line.taxable?.toLocaleString('en-IN')}</b> · GST 3%: <b>₹{line.gstAmount?.toLocaleString('en-IN')}</b>
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--gold, #b45309)' }} className="mono">
                          ₹{line.lineTotal?.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Terms & Notes */}
              <div className="g2" style={{ marginTop: 16 }}>
                <div>
                  <label className="label">Terms & Specifications</label>
                  <textarea 
                    className="input" 
                    rows={2}
                    value={formTerms}
                    onChange={e => setFormTerms(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Internal Notes / Instructions</label>
                  <textarea 
                    className="input" 
                    rows={2}
                    placeholder="Instructions for inward inspection, karigar reference..."
                    value={formNotes}
                    onChange={e => setFormNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Live Calculation Footer */}
            <div className="modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div className="helper">
                  <b>{formTotalPcs}</b> pcs · <b>{formTotalNetWt.toFixed(3)}</b> g net
                </div>
                <div className="helper">
                  Taxable: <b>₹{formTaxable.toLocaleString('en-IN')}</b>
                </div>
                <div className="helper">
                  GST 3%: <b>₹{formGst.toLocaleString('en-IN')}</b>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold, #b45309)' }} className="mono">
                  Grand Total: ₹{formGrandTotal.toLocaleString('en-IN')}
                </div>
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
                  onClick={() => handleSavePO('DRAFT')}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSavePO('APPROVED')}
                >
                  <CheckCircle2 size={16} /> Save & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Catalog Item Picker Modal (`ItemPicker`) */}
      {showItemPickerModal && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card" style={{ maxWidth: 700 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Pick from Supplier Catalog</h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowItemPickerModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input 
                  type="text" 
                  className="input input-sm" 
                  placeholder="Search design, name, category..."
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
                <select 
                  className="input input-sm" 
                  value={pickerMetal}
                  onChange={e => setPickerMetal(e.target.value)}
                  style={{ width: 130 }}
                >
                  <option value="ALL">All Metals</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                </select>
              </div>

              <div className="tbl-wrap" style={{ maxHeight: 320, overflowY: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item Description</th>
                      <th>Purity</th>
                      <th className="num">Est. Net Wt</th>
                      <th className="num">Rate</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {SUPPLIER_CATALOG_ITEMS
                      .filter(item => {
                        const matchText = item.name.toLowerCase().includes(pickerSearch.toLowerCase()) || item.category.toLowerCase().includes(pickerSearch.toLowerCase());
                        const matchM = pickerMetal === 'ALL' || item.metalType === pickerMetal;
                        return matchText && matchM;
                      })
                      .map(item => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                            <div className="helper">{item.category}</div>
                          </td>
                          <td><span className="badge badge-gold">{item.purity}</span></td>
                          <td className="num mono">{item.net.toFixed(3)} g</td>
                          <td className="num mono">₹{item.rate}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={() => {
                                setFormLines([
                                  ...formLines,
                                  calculateLine({
                                    description: item.name,
                                    metalType: item.metalType,
                                    purity: item.purity,
                                    category: item.category,
                                    hsn: item.hsn,
                                    qty: 1,
                                    grossWeight: item.gross,
                                    netWeight: item.net,
                                    stoneWeight: item.stone,
                                    rateBasis: item.basis,
                                    rate: item.rate
                                  })
                                ]);
                                setShowItemPickerModal(false);
                              }}
                            >
                              Add Line
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowItemPickerModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Cancel PO Reason Prompt */}
      {showCancelModal && selectedPoDetail && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card" style={{ maxWidth: 460 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>
                Cancel Purchase Order {selectedPoDetail.poNumber}?
              </h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowCancelModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 12px 0', fontSize: 13, color: 'var(--muted)' }}>
                Cancelling this order stops inward goods receipts and removes it from active purchasing pipelines.
              </p>
              <label className="label">Cancellation Reason *</label>
              <textarea 
                className="input" 
                rows={3}
                placeholder="e.g. Supplier rates mismatched, delay beyond festive window..."
                value={cancelReasonText}
                onChange={e => setCancelReasonText(e.target.value)}
              />
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowCancelModal(false)}
              >
                Go Back
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                disabled={!cancelReasonText.trim()}
                onClick={() => handleUpdateStatus(selectedPoDetail, 'CANCELLED', cancelReasonText)}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Print PO Voucher Simulation */}
      {showPrintModal && selectedPoDetail && (
        <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-card modal-lg" style={{ maxWidth: 750 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Purchase Order Voucher</h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setShowPrintModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ background: '#fff', color: '#000', padding: 24, borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>KRIYA JEWELLERS 360</h2>
                  <div style={{ fontSize: 12 }}>104, Zaveri Bazaar, Kalbadevi, Mumbai - 400002</div>
                  <div style={{ fontSize: 12 }}>GSTIN: 27AABCK1234F1Z1 · Phone: +91 22 2345 6789</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>PURCHASE ORDER</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }} className="mono">{selectedPoDetail.poNumber}</div>
                  <div style={{ fontSize: 12 }}>Date: {selectedPoDetail.orderDate}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '14px 0', fontSize: 12 }}>
                <div>
                  <b>VENDOR / SUPPLIER:</b>
                  <div>{selectedPoDetail.supplier.tradeName}</div>
                  <div>GSTIN: {selectedPoDetail.supplier.gstin}</div>
                  <div>City: {selectedPoDetail.supplier.city}, {selectedPoDetail.supplier.state}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b>SHIP TO:</b>
                  <div>{selectedPoDetail.deliveryLocation || 'Main Showroom Vault'}</div>
                  <div>Expected Date: {selectedPoDetail.expectedDeliveryDate}</div>
                  <div>Status: {selectedPoDetail.status}</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, margin: '12px 0' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                    <th style={{ textAlign: 'left', padding: 6 }}>#</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Description</th>
                    <th style={{ textAlign: 'left', padding: 6 }}>Purity</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Qty</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Net Wt (g)</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Rate (₹)</th>
                    <th style={{ textAlign: 'right', padding: 6 }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedPoDetail.lines || []).map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: 6 }}>{i + 1}</td>
                      <td style={{ padding: 6 }}>{l.description}</td>
                      <td style={{ padding: 6 }}>{l.purity}</td>
                      <td style={{ padding: 6, textAlign: 'right' }}>{l.qty}</td>
                      <td style={{ padding: 6, textAlign: 'right' }}>{l.netWeight.toFixed(3)}</td>
                      <td style={{ padding: 6, textAlign: 'right' }}>₹{l.rate}</td>
                      <td style={{ padding: 6, textAlign: 'right' }}>₹{l.lineTotal?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 12 }}>
                <div>
                  <b>Terms & Conditions:</b>
                  <div>{selectedPoDetail.terms || 'Standard payment on invoice verification.'}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 200 }}>
                  <div>Taxable: ₹{(selectedPoDetail.taxable || 0).toLocaleString('en-IN')}</div>
                  <div>GST 3%: ₹{((selectedPoDetail.cgst || 0) + (selectedPoDetail.sgst || 0)).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, marginTop: 4 }}>
                    Grand Total: ₹{selectedPoDetail.estimatedTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 10, borderTop: '1px solid #999', fontSize: 12 }}>
                <div>Authorized Signatory (Store Manager)</div>
                <div>Supplier Acceptance Signature</div>
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={() => setShowPrintModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => window.print()}
              >
                <Printer size={15} /> Print Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


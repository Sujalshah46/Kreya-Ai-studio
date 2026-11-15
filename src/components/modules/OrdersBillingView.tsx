import { applyInvoiceReceipt, invoiceReceipts } from '../../data/invoicePayments';
import React, { useState, useRef } from 'react';
import { 
  Plus, Search, Printer, FileText, CheckCircle2, AlertCircle, 
  Trash2, X, RefreshCw, RotateCcw, Eye, CreditCard, ChevronDown, Check, Tag, ShoppingCart,
  Filter, Share2, Send, Truck, Copy, ExternalLink, QrCode
} from 'lucide-react';
import { 
  SalesInvoice, Customer, InventoryItem, DailyRates, StoreProfile, 
  PaymentTransaction, PaymentMode, BillingLineItem, OldMetalExchange, CancellationRecord, CreditMemoRecord 
} from '../../types';

interface OrdersBillingViewProps {
  store: StoreProfile;
  rates: DailyRates;
  customers: Customer[];
  inventory: InventoryItem[];
  invoices: SalesInvoice[];
  onSaveInvoice: (invoice: SalesInvoice) => void;
  onCancelInvoice: (invoice: SalesInvoice, cancellation: CancellationRecord, memo: CreditMemoRecord | undefined, restock: boolean) => void;
  onAddPayment: (invoiceId: string, payment: PaymentTransaction) => void;
}

interface SaleItemLine {
  id: string;
  item_name: string;
  metal_type: string;
  purity: string;
  gross_weight: string;
  stone_weight: string;
  net_weight: string;
  wastage_percent: string;
  metal_rate: string; // Rate per 10g
  unit_price: string; // Fixed price override
  making_type: 'per_gram' | 'fixed' | 'percent' | 'per_gross';
  making_charge: string;
  stone_charge: string;
  quantity: number;
  gst_rate: number;
  hallmark_charge: number;
  hm_waived?: boolean;
  from_stock?: boolean;
  item_code?: string;
  inventory_id?: string;
  huid?: string;
}

interface OldGoldLine {
  id: string;
  description: string;
  metal_type: 'gold' | 'silver' | 'platinum';
  purity: string;
  pieces: number;
  gross_weight: string;
  stone_weight: string;
  other_deduction: string;
  tested_purity: string; // Tunch % e.g. "84.5"
  rate_per_10g: string;
}

interface SplitPaymentLine {
  id: string;
  mode: 'Cash' | 'UPI' | 'Card' | 'Net Banking' | 'Cheque';
  amount: string;
  referenceNo: string;
}

export const OrdersBillingView: React.FC<OrdersBillingViewProps> = ({
  store,
  rates,
  customers: initialCustomers,
  inventory,
  invoices: initialInvoices,
  onSaveInvoice,
  onCancelInvoice,
  onAddPayment
}) => {
  const [invoicesList, setInvoicesList] = useState<SalesInvoice[]>(initialInvoices);
  const [customerList, setCustomerList] = useState<Customer[]>(initialCustomers);
  
  // Modals
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [showPickStockModal, setShowPickStockModal] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<SalesInvoice | null>(null);
  const [selectedInvoiceForCancel, setSelectedInvoiceForCancel] = useState<SalesInvoice | null>(null);
  const [orderDetailSubTab, setOrderDetailSubTab] = useState<'items' | 'payments' | 'old_gold' | 'deposits'>('items');
  const [selectedReceiptFor80mm, setSelectedReceiptFor80mm] = useState<{ receipt: any; order: SalesInvoice } | null>(null);
  const [showTaxInvoiceModal, setShowTaxInvoiceModal] = useState<SalesInvoice | null>(null);
  const [collectAmount, setCollectAmount] = useState<string>('');
  const [collectRef, setCollectRef] = useState<string>('');
  const [collectMode, setCollectMode] = useState<string>('cash');
  const [collectNote, setCollectNote] = useState<string>('');

  // Additional action modals for full button parity
  const [showItemCardsModal, setShowItemCardsModal] = useState<SalesInvoice | null>(null);
  const [showPayLinkModal, setShowPayLinkModal] = useState<SalesInvoice | null>(null);
  const showroomUpi = store.upiId?.trim() ?? '';
  const linkAmount = showPayLinkModal?.balanceDue ?? 0;
  const linkInvoiceNo = showPayLinkModal?.invoiceNo || showPayLinkModal?.invoiceNumber || '';
  const linkMobile = (showPayLinkModal?.customer.mobile || showPayLinkModal?.customer.phone || '').replace(/\D/g, '');
  const messagingNumber = /^\d{10}$/.test(linkMobile) ? '91' + linkMobile :
    /^91\d{10}$/.test(linkMobile) ? linkMobile : '';
  const paymentLink = /^[a-z0-9_.-]+@[a-z0-9.-]+$/i.test(showroomUpi) && Number.isFinite(linkAmount) && linkAmount > 0 && linkInvoiceNo
    ? 'upi://pay?' + new URLSearchParams({ pa: showroomUpi, pn: store.tradeName, am: linkAmount.toFixed(2), cu: 'INR', tn: 'Invoice ' + linkInvoiceNo })
    : '';
  const paymentMessage = 'Please pay ₹' + linkAmount.toFixed(2) + ' for invoice ' + linkInvoiceNo +
    ' from ' + store.tradeName + ': ' + paymentLink;
  const [showShipModal, setShowShipModal] = useState<SalesInvoice | null>(null);
  const [showPaymentSummaryModal, setShowPaymentSummaryModal] = useState<SalesInvoice | null>(null);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [itemDeliveryState, setItemDeliveryState] = useState<Record<string, { delivered: boolean; allocated: boolean }>>({});

  // Shipment booking state
  const [shipCourier, setShipCourier] = useState('BVC Logistics');
  const [shipAwb, setShipAwb] = useState('BVC-89271638');
  const [shipWeight, setShipWeight] = useState('200');
  const [shipInsured, setShipInsured] = useState(true);
  const [shipDispatched, setShipDispatched] = useState(false);

  const amountToWords = (num: number): string => {
    if (!num || isNaN(num) || num <= 0) return '(Rupees Zero Only)';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const n = Math.floor(num);
    const str = ('000000000' + n).substr(-9);
    const crore = Number(str.substr(0, 2));
    const lakh = Number(str.substr(2, 2));
    const thousand = Number(str.substr(4, 2));
    const hundred = Number(str.substr(6, 1));
    const tens = Number(str.substr(7, 2));

    let out = '';
    const getSub = (val: number) => {
      if (val === 0) return '';
      if (val < 20) return a[val];
      return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : ' ');
    };

    if (crore > 0) out += getSub(crore) + 'Crore ';
    if (lakh > 0) out += getSub(lakh) + 'Lakh ';
    if (thousand > 0) out += getSub(thousand) + 'Thousand ';
    if (hundred > 0) out += a[hundred] + 'Hundred ';
    if (tens > 0) out += getSub(tens);

    return `(Rupees ${out.trim()} Only)`;
  };

  // Filters
  const [searchOrder, setSearchOrder] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [dateFilter, setDateFilter] = useState({ from: '', to: '' });

  // New Customer Quick Add states
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCity, setNewCustCity] = useState('');
  const [newCustState, setNewCustState] = useState(store.state || 'Maharashtra');
  const [newCustPan, setNewCustPan] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Customer in Sale Modal
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [applyGst, setApplyGst] = useState<boolean>(true);
  const [deliveryStatus, setDeliveryStatus] = useState<'DELIVERED' | 'PENDING_COLLECTION'>('DELIVERED');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Stock picker filters
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategory, setStockCategory] = useState('');

  // Sale items
  const defaultRateForMetal = (metal: string, purity: string): string => {
    const m = metal.toLowerCase();
    const p = (purity || '').toUpperCase().trim();
    if (m === 'gold') {
      const g24kRate10g = rates.gold24kPer10g || (rates.gold24kPerGram ? rates.gold24kPerGram * 10 : 144280);
      const g22kRate10g = rates.gold22kPerGram ? rates.gold22kPerGram * 10 : 132250;
      const g18kRate10g = rates.gold18kPerGram ? rates.gold18kPerGram * 10 : 108210;
      const g14kRate10g = Math.round(g24kRate10g * (14 / 24));

      if (p.includes('24K')) return String(g24kRate10g);
      if (p.includes('22K') || p.includes('916')) return String(g22kRate10g);
      if (p.includes('18K') || p.includes('750')) return String(g18kRate10g);
      if (p.includes('14K') || p.includes('585')) return String(g14kRate10g);
      return String(g22kRate10g);
    }
    if (m === 'silver') {
      return rates.silverPer10g ? String(rates.silverPer10g) : (rates.silverPerGram ? String(rates.silverPerGram * 10) : '980');
    }
    if (m === 'platinum') {
      return rates.platinumPerGram ? String(rates.platinumPerGram * 10) : '48000';
    }
    return String(rates.gold22kPerGram ? rates.gold22kPerGram * 10 : 132250);
  };

  const createBlankSaleItem = (idx: number): SaleItemLine => ({
    id: `item-${Date.now()}-${idx}`,
    item_name: '',
    metal_type: 'Gold',
    purity: '22K 916',
    gross_weight: '',
    stone_weight: '0',
    net_weight: '',
    wastage_percent: '0',
    metal_rate: defaultRateForMetal('Gold', '22K 916'),
    unit_price: '',
    making_type: 'per_gram',
    making_charge: '450',
    stone_charge: '0',
    quantity: 1,
    gst_rate: 3,
    hallmark_charge: 45,
    hm_waived: false
  });

  const [saleItems, setSaleItems] = useState<SaleItemLine[]>([createBlankSaleItem(1)]);

  // Old Gold Exchange in Sale Modal
  const [oldGoldLines, setOldGoldLines] = useState<OldGoldLine[]>([]);
  const [ogAdjustAmount, setOgAdjustAmount] = useState<string>(''); // Amount used on this invoice

  // Discount & Split Payment in Sale Modal
  const [discountVal, setDiscountVal] = useState<string>('0');
  const [discountType, setDiscountType] = useState<'RS' | 'PCT'>('RS');
  const [splitPayments, setSplitPayments] = useState<SplitPaymentLine[]>([
    { id: 'pay-1', mode: 'Cash', amount: '0', referenceNo: '' }
  ]);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Cancellation modal states
  const [cancelType, setCancelType] = useState<'full' | 'partial'>('full');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelDeduction, setCancelDeduction] = useState('0');
  const [cancelRefundMode, setCancelRefundMode] = useState<PaymentMode>('CASH');
  const [cancelRestock, setCancelRestock] = useState(true);
  const [cancelItemSelection, setCancelItemSelection] = useState<Record<string, boolean>>({});

  // Iframe print ref
  const printIframeRef = useRef<HTMLIFrameElement>(null);

  // Update sale item field with auto net-weight calc
  const updateItemField = (idx: number, field: keyof SaleItemLine, val: any) => {
    setSaleItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: val };
      if (field === 'metal_type' || field === 'purity') {
        const m = field === 'metal_type' ? val : item.metal_type;
        const p = field === 'purity' ? val : item.purity;
        updated.metal_rate = defaultRateForMetal(m, p);
      }
      if (field === 'gross_weight' || field === 'stone_weight') {
        const gross = parseFloat(field === 'gross_weight' ? val : item.gross_weight) || 0;
        const stone = parseFloat(field === 'stone_weight' ? val : item.stone_weight) || 0;
        updated.net_weight = Math.max(0, gross - stone).toFixed(3);
      }
      return updated;
    }));
  };

  // Add item from Stock Picker
  const handlePickStockItem = (inv: InventoryItem) => {
    const gross = inv.grossWeight || 0;
    const stone = inv.stoneWeight || 0;
    const net = inv.netWeight || Math.max(0, gross - stone);
    const m = inv.metalType || 'Gold';
    const rawPurity = inv.purityKarat || '22K';
    const p = rawPurity === '22K' ? '22K 916' : (rawPurity === '18K' ? '18K 750' : (rawPurity === '14K' ? '14K 585' : rawPurity));

    const newItem: SaleItemLine = {
      id: `item-${Date.now()}-${inv.id}`,
      item_name: inv.itemName,
      metal_type: m,
      purity: p,
      gross_weight: gross.toString(),
      stone_weight: stone.toString(),
      net_weight: net.toFixed(3),
      wastage_percent: ((inv as any).wastagePercent ?? (inv as any).wastagePct ?? 0).toString(),
      metal_rate: defaultRateForMetal(m, p),
      unit_price: inv.retailPrice ? inv.retailPrice.toString() : '',
      making_type: (inv as any).makingType === 'percent' ? 'percent' : ((inv as any).makingType === 'fixed' ? 'fixed' : ((inv as any).makingType === 'per_gross' ? 'per_gross' : 'per_gram')),
      making_charge: (inv.makingRate || 450).toString(),
      stone_charge: ((inv as any).stoneCharge || (inv as any).stoneValue || 0).toString(),
      quantity: 1,
      gst_rate: 3,
      hallmark_charge: 45,
      hm_waived: false,
      from_stock: true,
      item_code: inv.itemCode,
      inventory_id: inv.id,
      huid: inv.huid
    };

    if (saleItems.length === 1 && !saleItems[0].item_name && !saleItems[0].gross_weight) {
      setSaleItems([newItem]);
    } else {
      setSaleItems([...saleItems, newItem]);
    }
    setShowPickStockModal(false);
  };

  // Barcode / Monospace scan trigger
  const handleBarcodeSubmit = () => {
    if (!barcodeInput.trim()) return;
    const query = barcodeInput.trim().toLowerCase();
    const matched = inventory.find(inv => 
      inv.barcode?.toLowerCase() === query ||
      inv.itemCode?.toLowerCase() === query ||
      inv.huid?.toLowerCase() === query
    );
    if (matched) {
      handlePickStockItem(matched);
      setBarcodeInput('');
    } else {
      alert(`No stock item found matching "${barcodeInput}". You can manually enter details below.`);
    }
  };

  // Multi-item calculation matching Kreya fN / g_ logic
  const calculateItemValues = (item: SaleItemLine) => {
    const qty = item.quantity || 1;
    const fixedPrice = parseFloat(item.unit_price) || 0;
    const net = parseFloat(item.net_weight) || 0;
    const gross = parseFloat(item.gross_weight) || net;
    const wastagePct = parseFloat(item.wastage_percent) || 0;
    const rate10g = parseFloat(item.metal_rate) || 0;
    const makingRate = parseFloat(item.making_charge) || 0;
    const stoneVal = Math.round((parseFloat(item.stone_charge) || 0) * qty);
    const hmVal = item.hm_waived ? 0 : Math.round((parseFloat(String(item.hallmark_charge)) || 45) * qty);

    // Fixed price override
    if (fixedPrice > 0) {
      const taxable = Math.round(fixedPrice * qty + stoneVal + hmVal);
      const gst = applyGst ? Math.round(taxable * ((item.gst_rate || 3) / 100)) : 0;
      const cgst = Math.round(gst / 2);
      const sgst = gst - cgst;
      return {
        isFixed: true,
        metalVal: 0,
        wastageGram: 0,
        wastageVal: 0,
        makingVal: 0,
        stoneVal,
        hmVal,
        taxableVal: taxable,
        cgstVal: cgst,
        sgstVal: sgst,
        gstVal: gst,
        totalVal: taxable + gst
      };
    }

    // Wastage grams & billed metal weight (Wastage % applied on net weight)
    const wastageGram = net > 0 && wastagePct > 0 ? (net * wastagePct) / 100 : 0;
    const billedWeight = net + wastageGram;
    const metalVal = Math.round((billedWeight * rate10g / 10) * qty);
    const wastageVal = Math.round((wastageGram * rate10g / 10) * qty);

    // Making charge basis: 'per_gram' (Per Net Wt), 'per_gross' (Per Gross Wt), 'percent' (Percent of Gold), 'fixed' (Fixed per piece)
    let makingVal = 0;
    if (item.making_type === 'per_gram') {
      makingVal = Math.round(net * makingRate * qty);
    } else if (item.making_type === 'per_gross') {
      makingVal = Math.round(gross * makingRate * qty);
    } else if (item.making_type === 'percent') {
      makingVal = Math.round((metalVal * makingRate) / 100);
    } else if (item.making_type === 'fixed') {
      makingVal = Math.round(makingRate * qty);
    }

    const taxable = metalVal + makingVal + stoneVal + hmVal;
    const gst = applyGst ? Math.round(taxable * ((item.gst_rate || 3) / 100)) : 0;
    const cgst = Math.round(gst / 2);
    const sgst = gst - cgst;

    return {
      isFixed: false,
      metalVal,
      wastageGram: Number(wastageGram.toFixed(3)),
      wastageVal,
      makingVal,
      stoneVal,
      hmVal,
      taxableVal: taxable,
      cgstVal: cgst,
      sgstVal: sgst,
      gstVal: gst,
      totalVal: taxable + gst
    };
  };

  // Old Gold Line calculation: gross - stone - other = net; fine = net * tunch% / 100; val = fine * rate / 10
  const calculateOldGoldLine = (og: OldGoldLine) => {
    const gross = parseFloat(og.gross_weight) || 0;
    const stone = parseFloat(og.stone_weight) || 0;
    const other = parseFloat(og.other_deduction) || 0;
    const net = Math.max(0, gross - stone - other);
    
    // Tunch purity test percentage
    let tunchPct = parseFloat(og.tested_purity) || 0;
    if (tunchPct <= 0) {
      // Default purity estimate based on karat
      tunchPct = og.purity === '24K' ? 99.5 : og.purity === '22K' ? 91.6 : og.purity === '18K' ? 75.0 : 85.0;
    }
    const fine = (net * tunchPct) / 100;
    const rate10g = parseFloat(og.rate_per_10g) || 0;
    const val = Math.round((fine * rate10g) / 10);

    return {
      gross,
      stone,
      other,
      net: Number(net.toFixed(3)),
      tunchPct,
      fine: Number(fine.toFixed(3)),
      rate10g,
      value: val
    };
  };

  // Overall order totals
  const itemsCalculations = saleItems.map(calculateItemValues);
  const subtotalTaxable = itemsCalculations.reduce((sum, c) => sum + c.taxableVal, 0);

  // Discount calculation
  const discountInput = parseFloat(discountVal) || 0;
  const discountAmount = discountType === 'RS' 
    ? discountInput 
    : (subtotalTaxable > 0 ? Math.round((subtotalTaxable * discountInput) / 100) : 0);
  
  const taxableAfterDiscount = Math.max(0, subtotalTaxable - discountAmount);
  const finalGst = applyGst ? Math.round(taxableAfterDiscount * 0.03) : 0;
  const grandTotal = taxableAfterDiscount + finalGst;

  // Old Gold Exchange calculations
  const oldGoldCalculations = oldGoldLines.map(calculateOldGoldLine);
  const totalOldMetalValue = oldGoldCalculations.reduce((sum, og) => sum + og.value, 0);
  const totalOldNetGrams = oldGoldCalculations.reduce((sum, og) => sum + og.net, 0);
  const totalOldFineGrams = oldGoldCalculations.reduce((sum, og) => sum + og.fine, 0);

  // Old gold deduction amount applied to this invoice
  const effectiveOldGoldDeduction = ogAdjustAmount.trim() !== ''
    ? Math.min(parseFloat(ogAdjustAmount) || 0, totalOldMetalValue)
    : Math.min(totalOldMetalValue, grandTotal);

  const excessOldMetalOwed = Math.max(0, totalOldMetalValue - effectiveOldGoldDeduction);
  const balanceToPayAfterExchange = Math.max(0, grandTotal - effectiveOldGoldDeduction);

  // Split payment totals
  const totalPaidNow = splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const finalBalanceDue = Math.max(0, balanceToPayAfterExchange - totalPaidNow);

  // Helper to add old gold line
  const handleAddOldGoldLine = () => {
    const defaultRate = String(rates.gold22kPerGram * 10);
    setOldGoldLines([
      ...oldGoldLines,
      {
        id: `og-${Date.now()}-${oldGoldLines.length + 1}`,
        description: '',
        metal_type: 'gold',
        purity: '22K',
        pieces: 1,
        gross_weight: '',
        stone_weight: '0',
        other_deduction: '0',
        tested_purity: '91.6',
        rate_per_10g: defaultRate
      }
    ]);
  };

  // Quick Customer Save
  const handleSaveQuickCustomer = () => {
    if (!newCustName.trim() || !newCustPhone.trim()) {
      alert('Please enter customer name and mobile number.');
      return;
    }
    const created: Customer = {
      id: `cust-${Date.now()}`,
      code: `CUST-${Date.now().toString().slice(-5)}`,
      name: newCustName.trim(),
      mobile: newCustPhone.trim(),
      phone: newCustPhone.trim(),
      city: newCustCity.trim() || 'Local',
      state: newCustState,
      stateCode: '27',
      address: `${newCustCity || 'Local'}, ${newCustState}`,
      pan: newCustPan.trim().toUpperCase(),
      email: newCustEmail.trim(),
      customerType: 'RETAIL'
    };
    setCustomerList([created, ...customerList]);
    setSelectedCustomer(created);
    setShowNewCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustCity('');
    setNewCustPan('');
    setNewCustEmail('');
  };

  // Submit Order
  const handleCreateOrder = () => {
    if (!selectedCustomer) {
      alert('Please select a customer. Every sale requires a customer on file.');
      return;
    }
    if (!saleItems.length || (!saleItems[0].item_name && !saleItems[0].inventory_id)) {
      alert('Please add at least one item.');
      return;
    }

    const orderNo = `INV-2026-${String(invoicesList.length + 280).padStart(5, '0')}`;
    
    // Status handling
    let orderStatus: 'COMPLETED' | 'PENDING' | 'CANCELLED' = 'COMPLETED';
    if (finalBalanceDue > 0.5) {
      orderStatus = totalPaidNow > 0 ? 'PENDING' : 'PENDING';
    }

    const lineItems: BillingLineItem[] = saleItems.map((item, idx) => {
      const calc = itemsCalculations[idx];
      return {
        id: `line-${idx + 1}`,
        itemId: item.inventory_id || `item-mock-${idx}`,
        itemCode: item.item_code || `GEN-${idx + 1}`,
        itemName: item.item_name || 'Jewellery Item',
        huid: item.huid || 'KJ789G',
        category: item.metal_type.toLowerCase(),
        purityKarat: item.purity || '22K 916',
        metalType: item.metal_type,
        hsnCode: '7113',
        grossWeight: parseFloat(item.gross_weight) || 0,
        netWeight: parseFloat(item.net_weight) || 0,
        stoneWeight: parseFloat(item.stone_weight) || 0,
        wastagePct: parseFloat(item.wastage_percent) || 0,
        wastageAmount: calc.wastageVal,
        hmCharge: calc.hmVal,
        hmWaived: !!item.hm_waived,
        metalRatePerGram: (parseFloat(item.metal_rate) || 0) / 10,
        metalValue: calc.metalVal,
        makingMode: item.making_type === 'percent' ? 'PERCENTAGE_OF_GOLD' : (item.making_type === 'fixed' ? 'FIXED_PER_PIECE' : (item.making_type === 'per_gross' ? 'PER_GROSS_GRAM' : 'PER_NET_GRAM')),
        makingRate: parseFloat(item.making_charge) || 0,
        makingAmount: calc.makingVal,
        stoneValue: calc.stoneVal,
        taxableAmount: calc.taxableVal,
        cgstAmount: calc.cgstVal,
        sgstAmount: calc.sgstVal,
        lineTotal: calc.totalVal
      };
    });

    const paymentTransactions: PaymentTransaction[] = splitPayments
      .filter(p => parseFloat(p.amount) > 0)
      .map((p, idx) => ({
        id: `pay-${Date.now()}-${idx}`,
        date: new Date().toISOString().slice(0, 10),
        amount: parseFloat(p.amount),
        mode: (p.mode === 'Net Banking' ? 'BANK_TRANSFER' : p.mode.toUpperCase()) as PaymentMode,
        referenceNo: p.referenceNo || 'POS-MAIN'
      }));

    const oldMetalExchanges: OldMetalExchange[] = oldGoldLines.map((og, idx) => {
      const c = oldGoldCalculations[idx];
      return {
        id: `og-${Date.now()}-${idx}`,
        metalType: og.metal_type.toUpperCase() as 'GOLD' | 'SILVER',
        description: og.description || `Old ${og.metal_type}`,
        grossWeight: c.gross,
        stoneDeduction: c.stone + c.other,
        meltingLossPercent: 0,
        touchPurityPercent: c.tunchPct,
        netFineWeight: c.fine,
        buyingRatePerGram: c.rate10g / 10,
        exchangeCreditValue: c.value
      };
    });

    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNo: orderNo,
      invoiceNumber: orderNo,
      invoiceDate: new Date().toISOString().slice(0, 10),
      invoiceTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      counterCode: 'MAIN',
      customer: selectedCustomer,
      items: lineItems,
      oldMetalExchanges: oldMetalExchanges.length ? oldMetalExchanges : undefined,
      taxableAmount: taxableAfterDiscount,
      cgstTotal: Math.round(finalGst / 2),
      sgstTotal: Math.round(finalGst / 2),
      productTotalValue: subtotalTaxable,
      totalAmount: grandTotal,
      subtotal: subtotalTaxable,
      grandTotal: grandTotal,
      oldMetalExchangeCredit: effectiveOldGoldDeduction,
      paidAmount: totalPaidNow + effectiveOldGoldDeduction,
      balanceDue: finalBalanceDue,
      status: orderStatus,
      deliveryStatus: deliveryStatus,
      paymentTransactions: paymentTransactions,
      notes: orderNotes
    };

    if (editingInvoiceId) {
      const existing = invoicesList.find(i => i.id === editingInvoiceId);
      const updatedInvoice: SalesInvoice = {
        ...(existing || newInvoice),
        customer: selectedCustomer,
        items: lineItems,
        oldMetalExchanges: oldMetalExchanges.length ? oldMetalExchanges : undefined,
        taxableAmount: taxableAfterDiscount,
        cgstTotal: Math.round(finalGst / 2),
        sgstTotal: Math.round(finalGst / 2),
        productTotalValue: subtotalTaxable,
        totalAmount: grandTotal,
        subtotal: subtotalTaxable,
        grandTotal: grandTotal,
        paidAmount: existing ? (existing.paidAmount || totalPaidNow) : (totalPaidNow + effectiveOldGoldDeduction),
        balanceDue: existing ? Math.max(0, grandTotal - (existing.paidAmount || 0)) : finalBalanceDue,
        status: (existing && (existing.paidAmount || 0) >= grandTotal) ? 'COMPLETED' : orderStatus,
        deliveryStatus: deliveryStatus,
        notes: orderNotes
      };
      setInvoicesList(invoicesList.map(i => i.id === editingInvoiceId ? updatedInvoice : i));
      onSaveInvoice(updatedInvoice);
      setEditingInvoiceId(null);
      setShowNewSaleModal(false);
      setSelectedInvoiceForView(updatedInvoice);
      return;
    }

    onSaveInvoice(newInvoice);
    setInvoicesList([newInvoice, ...invoicesList]);
    setShowNewSaleModal(false);

    // Prompt user to preview & print invoice
    setSelectedInvoiceForView(newInvoice);
  };

  const handleModifyOrder = (inv: SalesInvoice) => {
    setEditingInvoiceId(inv.id);
    setSelectedCustomer(inv.customer);
    setSaleItems(inv.items.map((it: any, idx) => ({
      id: `mod-item-${idx}`,
      item_name: it.itemName,
      metal_type: it.metalType || 'gold',
      purity: it.purityKarat || '22K',
      gross_weight: String(it.grossWeight || it.netWeight || 10),
      stone_weight: String(it.stoneWeight || 0),
      net_weight: String(it.netWeight || 10),
      wastage_percent: String(it.wastagePct || it.wastagePercent || 0),
      metal_rate: String(it.metalRate || (it.metalRatePerGram ? it.metalRatePerGram * 10 : rates.gold22kPerGram * 10)),
      unit_price: String(it.unitPrice || 0),
      making_type: (it.makingType || (it.makingMode === 'FIXED_PER_PIECE' ? 'fixed' : it.makingMode === 'PERCENTAGE_OF_GOLD' ? 'percent' : 'per_gram')) as any,
      making_charge: String(it.makingRate || 450),
      stone_charge: String(it.stoneCharges || it.stoneValue || 0),
      quantity: it.quantity || 1,
      gst_rate: it.gstRate || 3,
      hallmark_charge: it.hallmarkCharge || it.hmCharge || 45,
      item_code: it.itemCode,
      huid: it.huid
    })));
    setOldGoldLines([]);
    setDiscountVal(String((inv as any).discountAmount || (inv as any).discountTotal || 0));
    setDiscountType('RS');
    setDeliveryStatus((inv.deliveryStatus as any) || 'DELIVERED');
    setOrderNotes(inv.notes || '');
    setSelectedInvoiceForView(null);
    setShowNewSaleModal(true);
  };

  // Handle Cancellation submission
  const handleProcessCancellation = () => {
    if (!selectedInvoiceForCancel) return;
    const inv = selectedInvoiceForCancel;
    if (cancelType !== 'full') {
      alert('Partial cancellation requires item-level credit adjustments. No changes were saved.');
      return;
    }
    if (inv.status === 'CANCELLED' || inv.status === 'ESTIMATE' || !cancelReason.trim()) return;

    const paid = invoiceReceipts(inv)
      .filter(receipt => !['OLD_GOLD_EXCHANGE', 'CUSTOMER_CREDIT'].includes(receipt.mode.toUpperCase()))
      .reduce((total, receipt) => total + Math.round(receipt.amount * 100), 0);
    const deduction = Number(cancelDeduction);
    const fee = Math.round(deduction * 100);
    if (!Number.isSafeInteger(fee) || Math.abs(fee / 100 - deduction) > 1e-9 || fee < 0 || fee > paid) {
      alert('Enter a deduction between zero and the amount collected.');
      return;
    }
    const refundAmount = (paid - fee) / 100;
    const id = crypto.randomUUID();
    const suffix = id.slice(0, 8).toUpperCase();
    const year = new Date().getFullYear();
    const invoiceNo = inv.invoiceNo || inv.invoiceNumber || inv.id;
    const creditMemoNo = refundAmount > 0 ? 'CM-' + year + '-' + suffix : undefined;
    const cancellation: CancellationRecord = {
      id,
      cancellationNo: 'CAN-' + year + '-' + suffix,
      referenceType: 'order',
      originalInvoiceNo: invoiceNo,
      originalReferenceNo: invoiceNo,
      customerName: inv.customer.name,
      customerPhone: inv.customer.mobile || inv.customer.phone,
      originalAmount: inv.grandTotal ?? inv.totalAmount ?? inv.productTotalValue,
      paidAmount: paid / 100,
      deductionAmount: deduction,
      refundAmount,
      refundMode: cancelRefundMode,
      creditMemoNo,
      itemsSummary: inv.items.map(item => item.itemName).join(', '),
      reason: cancelReason.trim(),
      status: 'approved',
      cancelledAt: new Date().toISOString()
    };
    const memo: CreditMemoRecord | undefined = creditMemoNo ? {
      id: crypto.randomUUID(),
      creditMemoNo,
      cancellationId: id,
      orderNo: invoiceNo,
      customerName: cancellation.customerName,
      customerPhone: cancellation.customerPhone,
      originalAmount: cancellation.originalAmount ?? 0,
      deductionAmount: deduction,
      refundAmount,
      refundMode: cancelRefundMode,
      refundStatus: 'pending',
      notes: cancellation.reason
    } : undefined;
    const cancelled: SalesInvoice = { ...inv, status: 'CANCELLED', balanceDue: 0 };
    onCancelInvoice(cancelled, cancellation, memo, cancelRestock);
    setInvoicesList(current => current.map(item => item.id === inv.id ? cancelled : item));
    alert(memo ? 'Order cancelled. Credit memo is pending refund disbursement.' : 'Order cancelled.');
    setSelectedInvoiceForCancel(null);
    setCancelReason('');
    setCancelDeduction('0');
  };

  // Invoice Print Action
  const triggerPrintInvoice = (inv: SalesInvoice) => {
    if (!printIframeRef.current) return;
    const doc = printIframeRef.current.contentDocument || printIframeRef.current.contentWindow?.document;
    if (!doc) return;

    const itemsHtml = (inv.items || []).map((it, idx) => `
      <tr>
        <td style="border:1px solid #ddd;padding:6px;text-align:center;">${idx + 1}</td>
        <td style="border:1px solid #ddd;padding:6px;"><strong>${it.itemName}</strong><br/><span style="font-size:10px;color:#666;">Code: ${it.itemCode} · HUID: ${it.huid} · HSN: ${it.hsnCode}</span></td>
        <td style="border:1px solid #ddd;padding:6px;text-align:center;">${it.purityKarat}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:right;">${it.grossWeight.toFixed(3)}g</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:right;">${it.stoneWeight.toFixed(3)}g</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:right;"><strong>${it.netWeight.toFixed(3)}g</strong></td>
        <td style="border:1px solid #ddd;padding:6px;text-align:right;">₹${(it.metalRatePerGram * 10).toLocaleString('en-IN')}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:right;">₹${it.makingAmount.toLocaleString('en-IN')}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:right;">₹${(it.hmCharge || 0).toLocaleString('en-IN')}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:right;">₹${it.taxableAmount.toLocaleString('en-IN')}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:right;">₹${(it.cgstAmount + it.sgstAmount).toLocaleString('en-IN')}</td>
        <td style="border:1px solid #ddd;padding:6px;text-align:right;"><strong>₹${it.lineTotal.toLocaleString('en-IN')}</strong></td>
      </tr>
    `).join('');

    const paymentsHtml = (inv.paymentTransactions || []).map(p => `
      <div style="font-size:11px;margin-bottom:2px;">
        <span>${p.mode}: <strong>₹${p.amount.toLocaleString('en-IN')}</strong></span>
        ${p.referenceNo ? `<span style="color:#666;"> (Ref: ${p.referenceNo})</span>` : ''}
      </div>
    `).join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${inv.invoiceNo}</title>
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; margin: 24px; color: #111; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
          .title { font-size: 22px; font-weight: 800; color: #1b4d3e; }
          .sub { font-size: 11px; color: #555; }
          .grid2 { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
          th { background: #f4f6f5; border: 1px solid #ddd; padding: 6px; text-align: left; }
          .totals { margin-left: auto; width: 320px; font-size: 12px; }
          .tot-row { display: flex; justify-content: space-between; padding: 3px 0; }
          .grand { font-size: 15px; font-weight: 800; border-top: 1px solid #111; border-bottom: 1px solid #111; padding: 6px 0; margin-top: 4px; }
          .footer { margin-top: 40px; border-top: 1px dashed #ccc; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">${(store.tradeName || store.legalName) || 'KREYA JEWELLERS'}</div>
            <div class="sub">${store.address || 'Zaveri Bazaar'}, ${store.city || 'Mumbai'}, ${store.state || 'Maharashtra'} - ${store.pincode || '400002'}</div>
            <div class="sub">GSTIN: <strong>${store.gstin || '27AAACK1234F1Z5'}</strong> · Phone: ${store.phone || '+91 98765 43210'}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:16px;font-weight:700;">TAX INVOICE</div>
            <div style="font-size:12px;margin-top:4px;">Invoice: <strong>${inv.invoiceNo}</strong></div>
            <div style="font-size:11px;color:#555;">Date: ${inv.invoiceDate} ${inv.invoiceTime || ''}</div>
            <div style="font-size:11px;color:#555;">Counter: ${inv.counterCode || 'MAIN'}</div>
          </div>
        </div>

        <div class="grid2">
          <div style="background:#f9fafb;padding:10px;border-radius:6px;width:48%;">
            <strong style="color:#1b4d3e;">Billed To:</strong><br/>
            <strong>${inv.customer.name}</strong><br/>
            Phone: ${inv.customer.mobile || inv.customer.phone || 'N/A'}<br/>
            ${inv.customer.city ? `${inv.customer.city}, ${inv.customer.state || ''}` : ''}<br/>
            ${inv.customer.pan ? `PAN: <strong>${inv.customer.pan}</strong><br/>` : ''}
            Place of Supply: ${inv.customer.state || store.state || 'Maharashtra'}
          </div>
          <div style="width:48%;padding:10px;font-size:11px;color:#555;">
            <strong>Hallmark Guarantee:</strong> All gold jewellery is BIS Hallmarked (₹45/pc). Net gold purity & stone deductions are laser certified on bill.
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item & Description</th>
              <th>Purity</th>
              <th style="text-align:right;">Gross</th>
              <th style="text-align:right;">Stone</th>
              <th style="text-align:right;">Net Wt</th>
              <th style="text-align:right;">Rate/10g</th>
              <th style="text-align:right;">Making</th>
              <th style="text-align:right;">HM</th>
              <th style="text-align:right;">Taxable</th>
              <th style="text-align:right;">GST 3%</th>
              <th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="display:flex;justify-content:space-between;">
          <div style="width:45%;">
            <strong>Payment Modes:</strong>
            ${paymentsHtml || '<div style="font-size:11px;color:#666;">Cash on delivery / Full credit</div>'}
            ${inv.oldMetalExchangeCredit ? `<div style="font-size:11px;margin-top:6px;color:#b7791f;"><strong>Old Metal Exchange:</strong> ₹${inv.oldMetalExchangeCredit.toLocaleString('en-IN')} adjusted</div>` : ''}
            ${inv.notes ? `<div style="font-size:11px;margin-top:8px;color:#666;">Notes: ${inv.notes}</div>` : ''}
          </div>

          <div class="totals">
            <div class="tot-row"><span>Subtotal (Taxable):</span><span>₹${(inv.taxableAmount || 0).toLocaleString('en-IN')}</span></div>
            <div class="tot-row"><span>CGST (1.5%):</span><span>₹${(inv.cgstTotal || 0).toLocaleString('en-IN')}</span></div>
            <div class="tot-row"><span>SGST (1.5%):</span><span>₹${(inv.sgstTotal || 0).toLocaleString('en-IN')}</span></div>
            <div class="tot-row grand"><span>Invoice Total:</span><span>₹${(inv.totalAmount || 0).toLocaleString('en-IN')}</span></div>
            ${inv.oldMetalExchangeCredit ? `<div class="tot-row" style="color:#b7791f;"><span>Less Old Metal:</span><span>-₹${inv.oldMetalExchangeCredit.toLocaleString('en-IN')}</span></div>` : ''}
            <div class="tot-row" style="color:#1b4d3e;"><span>Paid Amount:</span><span>₹${(inv.paidAmount || 0).toLocaleString('en-IN')}</span></div>
            <div class="tot-row" style="font-weight:700;color:${(inv.balanceDue || 0) > 0 ? '#dc2626' : '#1b4d3e'};">
              <span>Balance Due:</span><span>₹${(inv.balanceDue || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div>Terms: Goods once sold will be exchanged as per showroom buyback rules. Subject to Mumbai jurisdiction.</div>
          <div style="text-align:right;margin-top:20px;">
            <div>For <strong>${(store.tradeName || store.legalName) || 'KREYA JEWELLERS'}</strong></div>
            <div style="margin-top:30px;">Authorized Signatory</div>
          </div>
        </div>
      </body>
      </html>
    `);
    doc.close();
    setTimeout(() => {
      printIframeRef.current?.contentWindow?.focus();
      printIframeRef.current?.contentWindow?.print();
    }, 250);
  };

  // Filtered orders list
  const filteredInvoices = invoicesList.filter(inv => {
    const q = searchOrder.toLowerCase();
    const matchQ = !q || 
      (inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(q)) ||
      inv.customer.name.toLowerCase().includes(q) ||
      (inv.customer.mobile && inv.customer.mobile.includes(q));
    const date = (inv.invoiceDate || inv.date || '').slice(0, 10);
    const hasDate = /^\d{4}-\d{2}-\d{2}$/.test(date);
    return matchQ && (!dateFilter.from || (hasDate && date >= dateFilter.from)) &&
      (!dateFilter.to || (hasDate && date <= dateFilter.to));
  });

  // Filtered customer search for modal
  const filteredCustomers = customerSearch.trim()
    ? customerList.filter(c => 
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        (c.mobile || c.phone || '').includes(customerSearch)
      )
    : [];

  return (
    <div>
      {/* Hidden print iframe */}
      <iframe ref={printIframeRef} style={{ display: 'none' }} title="print-invoice-frame" />

      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Orders & Billing</h1>
          <p>{invoicesList.length} orders · Point of Sale & Invoicing</p>
        </div>
        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={() => {
              setSaleItems([createBlankSaleItem(1)]);
              setOldGoldLines([]);
              setOgAdjustAmount('');
              setDiscountVal('0');
              setDiscountType('RS');
              setSplitPayments([{ id: 'pay-1', mode: 'Cash', amount: '0', referenceNo: '' }]);
              setSelectedCustomer(null);
              setCustomerSearch('');
              setDeliveryStatus('DELIVERED');
              setShowNewSaleModal(true);
            }}
          >
            <Plus size={14} />
            New Sale
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ marginBottom: 14 }}>
        <form className="card-body" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}
          onSubmit={event => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const from = String(form.get('fromDate') ?? '');
            const to = String(form.get('toDate') ?? '');
            setFromDate(from);
            setToDate(to);
            setDateFilter({ from, to });
          }}
        >
          <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
            <Search size={13} style={{ color: 'var(--muted)' }} />
            <input 
              aria-label="Search orders"
              placeholder="Order no, customer..." 
              value={searchOrder}
              onChange={(e) => setSearchOrder(e.target.value)}
            />
          </div>
          <input 
            className="input input-sm" 
            type="date"
            name="fromDate"
            aria-label="From date"
            max={toDate || undefined}
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            style={{ width: 'auto' }}
          />
          <input 
            className="input input-sm" 
            type="date"
            name="toDate"
            aria-label="To date"
            min={fromDate || undefined}
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            style={{ width: 'auto' }}
          />
          <button 
            type="submit"
            className="btn btn-sm btn-outline"
            title="Filter orders list"
          >
            <Filter size={13} /> Filter
          </button>
          {(searchOrder || fromDate || toDate || dateFilter.from || dateFilter.to) && (
            <button 
              type="button" 
              className="btn btn-sm btn-outline"
              title="Clear filters"
              onClick={() => {
                setSearchOrder('');
                setFromDate('');
                setToDate('');
                setDateFilter({ from: '', to: '' });
              }}
            >
              <X size={13} /> Clear
            </button>
          )}
        </form>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Order No</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Items</th>
                <th className="num">Gold</th>
                <th className="num">Silver</th>
                <th className="num">Invoice Amt</th>
                <th className="num">Deposit</th>
                <th className="num">Paid</th>
                <th className="num">Pending</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const isPaid = (inv.balanceDue || 0) <= 0.01;
                const isCancelled = inv.status === 'CANCELLED';
                const weight = (metal: string) => inv.items.reduce((sum, item) =>
                  sum + (item.metalType?.toLowerCase().startsWith(metal) ? item.netWeight || 0 : 0), 0);
                return (
                  <tr key={inv.id} style={{ opacity: isCancelled ? 0.6 : 1 }}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{inv.invoiceNo}</td>
                    <td style={{ fontSize: 11 }}>{inv.invoiceDate}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.customer.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted)' }}>{inv.customer.mobile || inv.customer.phone}</div>
                    </td>
                    <td>{inv.items.length} item(s)</td>
                    <td className="num">{weight('gold').toFixed(3)} g</td>
                    <td className="num">{weight('silver').toFixed(3)} g</td>
                    <td className="num" style={{ fontWeight: 700 }}>₹{(inv.grandTotal ?? inv.totalAmount ?? inv.productTotalValue).toLocaleString('en-IN')}</td>
                    <td className="num">₹{(inv.metalAdvanceAdjusted ?? 0).toLocaleString('en-IN')}</td>
                    <td className="num amt-green">₹{(inv.paidAmount || 0).toLocaleString('en-IN')}</td>
                    <td className="num" style={{ fontWeight: 700, color: (inv.balanceDue || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ₹{(inv.balanceDue || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span className={`badge ${
                          isCancelled ? 'badge-red' : (isPaid ? 'badge-green' : 'badge-yellow')
                        }`}>
                          {inv.status || (isPaid ? 'COMPLETED' : 'PENDING')}
                        </span>
                        <span className={`badge ${inv.deliveryStatus === 'PENDING_COLLECTION' ? 'badge-yellow' : 'badge-blue'}`} style={{ fontSize: 9.5 }}>
                          {inv.deliveryStatus === 'PENDING_COLLECTION' ? 'PENDING COLLECTION' : 'DELIVERED'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          type="button" 
                          className="btn btn-xs btn-outline"
                          title="View Invoice & Print"
                          onClick={() => setSelectedInvoiceForView(inv)}
                        >
                          <Eye size={11} /> View
                        </button>
                        {(inv.balanceDue || 0) > 0.01 && !isCancelled && (
                          <button 
                            type="button" 
                            className="btn btn-xs btn-primary"
                            title="Collect balance payment"
                            onClick={() => {
                              setSelectedInvoiceForView(inv);
                              setOrderDetailSubTab('payments');
                              setCollectAmount(String(inv.balanceDue || ''));
                            }}
                          >
                            <CreditCard size={11} /> Collect
                          </button>
                        )}
                        <button 
                          type="button" 
                          className="btn btn-xs btn-outline"
                          title="Print Tax Invoice"
                          onClick={() => triggerPrintInvoice(inv)}
                        >
                          <Printer size={11} /> Print
                        </button>
                        {!isCancelled && (
                          <button 
                            type="button" 
                            className="btn btn-xs btn-danger"
                            title="Cancel Order & Issue Credit Memo"
                            onClick={() => {
                              setSelectedInvoiceForCancel(inv);
                              setCancelType('full');
                              setCancelItemSelection({});
                              setCancelDeduction('0');
                              setCancelReason('');
                              setCancelRestock(true);
                            }}
                          >
                            <RotateCcw size={11} /> Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!filteredInvoices.length && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>
                    No orders matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW SALE MODAL */}
      {showNewSaleModal && (
        <div className="overlay" onClick={() => setShowNewSaleModal(false)}>
          <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
                <ShoppingCart size={18} /> New Sale
              </h3>
              <button 
                type="button" 
                className="btn btn-sm btn-outline"
                onClick={() => setShowNewSaleModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '82vh', overflowY: 'auto' }}>
              {/* SECTION: CUSTOMER */}
              <div className="section-divider" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span style={{ width: 3, height: 14, background: 'var(--primary)', borderRadius: 2, display: 'inline-block' }}></span>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>CUSTOMER <span style={{ color: 'var(--danger)' }}>*</span></span>
              </div>

              {selectedCustomer ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--primary-l)', borderRadius: 8, marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                      ✓ {selectedCustomer.name} — {selectedCustomer.mobile || selectedCustomer.phone}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {[selectedCustomer.address, selectedCustomer.city, selectedCustomer.state].filter(Boolean).join(', ')}
                      {selectedCustomer.pan ? ` · PAN: ${selectedCustomer.pan}` : ''}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-xs btn-outline"
                    onClick={() => setSelectedCustomer(null)}
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      className="input" 
                      style={{ flex: 1 }} 
                      placeholder="Search customer by name or mobile..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="btn btn-outline"
                      style={{ whiteSpace: 'nowrap' }}
                      onClick={() => setShowNewCustomerModal(true)}
                    >
                      + New customer
                    </button>
                  </div>

                  {filteredCustomers.length > 0 && (
                    <div style={{ position: 'absolute', zIndex: 100, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, width: '100%', boxShadow: '0 4px 16px rgba(0,0,0,.15)', top: '100%', maxHeight: 200, overflowY: 'auto' }}>
                      {filteredCustomers.map(c => (
                        <div 
                          key={c.id} 
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch('');
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.mobile || c.phone} · {c.city} {c.pan ? `· PAN: ${c.pan}` : ''}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ fontSize: 11, color: 'var(--muted)', margin: '-4px 0 12px' }}>
                Select a saved customer — every sale needs one. Not on file yet? Use "New customer". PAN is required for a sale of ₹2 lakh or more.
              </div>

              {/* GST TOGGLE & DELIVERY STATUS */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: 12, 
                marginBottom: 16,
                padding: '8px 12px',
                background: 'var(--surface2, #f8fafc)',
                borderRadius: 8,
                border: '1px solid var(--border)'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, margin: 0, userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    id="gst_tog" 
                    checked={applyGst} 
                    onChange={(e) => setApplyGst(e.target.checked)} 
                  />
                  <span>Apply GST on this order</span>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Delivery Status:
                  </span>
                  <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                    <button
                      type="button"
                      className={`btn btn-xs ${deliveryStatus === 'DELIVERED' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ borderRadius: 0, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                      onClick={() => setDeliveryStatus('DELIVERED')}
                    >
                      DELIVERED
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${deliveryStatus === 'PENDING_COLLECTION' ? 'btn-gold' : 'btn-outline'}`}
                      style={{ borderRadius: 0, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}
                      onClick={() => setDeliveryStatus('PENDING_COLLECTION')}
                    >
                      PENDING COLLECTION
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: ITEMS */}
              <div className="section-divider" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', margin: '20px 0 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 3, height: 14, background: 'var(--primary)', borderRadius: 2, display: 'inline-block' }}></span>
                </div>
                <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>ITEMS</span>
                <button 
                  type="button" 
                  className="btn btn-xs btn-gold"
                  onClick={() => setShowPickStockModal(true)}
                >
                  Pick from Stock
                </button>
              </div>

              {/* Monospace Barcode Scan Box (▥) with Pick from Stock */}
              <div className="scan-box" style={{ 
                border: '1.5px dashed var(--primary-m)', 
                borderRadius: 8, 
                padding: '8px 12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10, 
                background: 'var(--surface, #fff)',
                marginBottom: 14 
              }}>
                <span style={{ fontSize: 18 }} aria-hidden="true">▥</span>
                <input 
                  className="input" 
                  style={{ flex: 1, minWidth: 0, fontFamily: 'monospace', border: 'none', background: 'transparent', padding: 0 }}
                  placeholder="Scan barcode or type item code / HUID and press Enter"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBarcodeSubmit();
                    }
                  }}
                />
                <button 
                  type="button" 
                  className="btn btn-sm btn-primary"
                  disabled={!barcodeInput.trim()}
                  onClick={handleBarcodeSubmit}
                >
                  Add
                </button>
              </div>

              {/* Items List */}
              {saleItems.map((item, idx) => {
                const calc = itemsCalculations[idx] || { metalVal: 0, wastageGram: 0, wastageVal: 0, makingVal: 0, stoneVal: 0, hmVal: 0, taxableVal: 0, cgstVal: 0, sgstVal: 0, gstVal: 0, totalVal: 0 };
                return (
                  <div 
                    key={item.id} 
                    style={{ 
                      background: 'var(--bg)', 
                      borderRadius: 8, 
                      padding: 12, 
                      marginBottom: 12, 
                      border: item.from_stock ? '1.5px solid var(--primary-m)' : '1px solid var(--border)' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.from_stock ? 'var(--primary)' : 'var(--muted)' }}>
                        {item.from_stock ? `From Stock · ${item.item_code} ${item.huid ? `· HUID: ${item.huid}` : ''}` : `Item #${idx + 1}`}
                      </span>
                      {saleItems.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-xs btn-danger"
                          onClick={() => setSaleItems(saleItems.filter((_, i) => i !== idx))}
                        >
                          ✕ Remove
                        </button>
                      )}
                    </div>

                    {/* Row 1: Item Description, Metal Type, Purity dropdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1.1fr', gap: 10, marginBottom: 10 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">Item Description *</label>
                        <input 
                          className="input" 
                          value={item.item_name}
                          placeholder="e.g. 22K Hallmarked Antique Necklace"
                          onChange={(e) => updateItemField(idx, 'item_name', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">Metal Type</label>
                        <select 
                          className="input"
                          value={item.metal_type}
                          onChange={(e) => updateItemField(idx, 'metal_type', e.target.value)}
                        >
                          <option value="Gold">Gold</option>
                          <option value="Silver">Silver</option>
                          <option value="Platinum">Platinum</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">Purity</label>
                        <select 
                          className="input"
                          value={item.purity}
                          onChange={(e) => updateItemField(idx, 'purity', e.target.value)}
                        >
                          {item.metal_type === 'Silver' ? (
                            <>
                              <option value="999">Silver 999 (Pure)</option>
                              <option value="925">Silver 925 (Sterling)</option>
                              <option value="900">Silver 900</option>
                              <option value="800">Silver 800</option>
                            </>
                          ) : item.metal_type === 'Platinum' ? (
                            <>
                              <option value="950">Platinum 950</option>
                              <option value="900">Platinum 900</option>
                            </>
                          ) : (
                            <>
                              <option value="24K">24K (99.9%)</option>
                              <option value="22K 916">22K 916 (91.6%)</option>
                              <option value="18K 750">18K 750 (75.0%)</option>
                              <option value="14K 585">14K 585 (58.5%)</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Gross / pc (g), Stone / pc (g), Net / pc (g) = Gross - Stone, Wastage %, Rate / 10g */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 10 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">Gross / pc (g)</label>
                        <input 
                          className="input" 
                          type="number" 
                          step="0.001"
                          placeholder="0.000"
                          value={item.gross_weight}
                          onChange={(e) => updateItemField(idx, 'gross_weight', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">Stone / pc (g)</label>
                        <input 
                          className="input" 
                          type="number" 
                          step="0.001"
                          placeholder="0.000"
                          value={item.stone_weight}
                          onChange={(e) => updateItemField(idx, 'stone_weight', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">Net / pc (g)</label>
                        <input 
                          className="input" 
                          type="number" 
                          step="0.001"
                          placeholder="Gross - Stone"
                          value={item.net_weight}
                          onChange={(e) => updateItemField(idx, 'net_weight', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">Wastage %</label>
                        <input 
                          className="input" 
                          type="number" 
                          step="0.1"
                          placeholder="0.0"
                          value={item.wastage_percent}
                          onChange={(e) => updateItemField(idx, 'wastage_percent', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">Rate / 10g</label>
                        <input 
                          className="input" 
                          type="number"
                          placeholder="Auto from daily rates"
                          value={item.metal_rate}
                          onChange={(e) => updateItemField(idx, 'metal_rate', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 3: Making Charge Basis, Making Rate (₹), Stone Charge (₹), Fixed Price (Override) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">Making Charge Basis</label>
                        <select 
                          className="input"
                          value={item.making_type}
                          onChange={(e) => updateItemField(idx, 'making_type', e.target.value)}
                        >
                          <option value="per_gram">Per Net Wt</option>
                          <option value="per_gross">Per Gross Wt</option>
                          <option value="percent">Percent of Gold</option>
                          <option value="fixed">Fixed per piece</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">
                          Making Rate ({item.making_type === 'percent' ? '%' : '₹'})
                        </label>
                        <input 
                          className="input" 
                          type="number" 
                          step="0.01"
                          value={item.making_charge}
                          onChange={(e) => updateItemField(idx, 'making_charge', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">Stone Charge (₹)</label>
                        <input 
                          className="input" 
                          type="number"
                          placeholder="0"
                          value={item.stone_charge}
                          onChange={(e) => updateItemField(idx, 'stone_charge', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="label">Fixed Price (Override)</label>
                        <input 
                          className="input" 
                          type="number"
                          placeholder="Optional"
                          value={item.unit_price}
                          onChange={(e) => updateItemField(idx, 'unit_price', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Row 4: Qty, HM / HUID (₹/pc) with 'waive' checkbox */}
                    <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                      <div className="form-group" style={{ width: 64, margin: 0 }}>
                        <label className="label">Qty</label>
                        <input 
                          className="input" 
                          type="number" 
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemField(idx, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="form-group" style={{ width: 100, margin: 0 }}>
                        <label className="label">HM / HUID (₹/pc)</label>
                        <input 
                          className="input" 
                          type="number"
                          disabled={!!item.hm_waived}
                          value={item.hm_waived ? '0' : item.hallmark_charge}
                          onChange={(e) => updateItemField(idx, 'hallmark_charge', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div style={{ marginTop: 18 }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', userSelect: 'none', margin: 0 }}>
                          <input 
                            type="checkbox" 
                            checked={!!item.hm_waived}
                            onChange={(e) => updateItemField(idx, 'hm_waived', e.target.checked)}
                          />
                          <span>Waive HM / HUID</span>
                        </label>
                      </div>
                    </div>

                    {/* Live calculated formula bar */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      background: 'var(--surface, #fff)', 
                      border: '1.5px solid var(--primary-m, #cbd5e1)', 
                      borderRadius: 8, 
                      padding: '8px 12px',
                      marginTop: 10,
                      flexWrap: 'wrap',
                      gap: 8
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 12, fontFamily: 'monospace', color: 'var(--text, #1e293b)' }}>
                        <span style={{ fontWeight: 600, color: '#b45309' }}>
                          Metal ₹{calc.metalVal.toLocaleString('en-IN')}
                        </span>
                        <span style={{ color: 'var(--muted)' }}>+</span>
                        <span style={{ fontWeight: 600, color: '#047857' }}>
                          Making ₹{calc.makingVal.toLocaleString('en-IN')}
                        </span>
                        {calc.stoneVal > 0 && (
                          <>
                            <span style={{ color: 'var(--muted)' }}>+</span>
                            <span style={{ fontWeight: 600, color: '#4338ca' }}>
                              Stone ₹{calc.stoneVal.toLocaleString('en-IN')}
                            </span>
                          </>
                        )}
                        <span style={{ color: 'var(--muted)' }}>+</span>
                        <span style={{ fontWeight: 600, color: '#6d28d9' }}>
                          HM {item.hm_waived ? '₹0' : `₹${calc.hmVal.toLocaleString('en-IN')}`}
                        </span>
                        {applyGst && (
                          <>
                            <span style={{ color: 'var(--muted)' }}>+</span>
                            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                              GST (1.5% CGST ₹{calc.cgstVal.toLocaleString('en-IN')} + 1.5% SGST ₹{calc.sgstVal.toLocaleString('en-IN')})
                            </span>
                          </>
                        )}
                        <span style={{ color: 'var(--muted)', fontWeight: 700 }}>=</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)', fontFamily: 'monospace' }}>
                        ₹{calc.totalVal.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div style={{ marginBottom: 14 }}>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline"
                  onClick={() => setSaleItems([...saleItems, createBlankSaleItem(saleItems.length + 1)])}
                >
                  <Plus size={12} /> + Add Item
                </button>
              </div>

              {/* SECTION: OLD GOLD / SILVER EXCHANGE */}
              <div style={{ background: '#fffdf5', border: '1.5px solid #f6e05e', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#975a16' }}>
                      Old Gold / Silver Exchange
                    </span>
                    {oldGoldLines.length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>
                        · saved as an OGP voucher on this invoice
                      </span>
                    )}
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-xs btn-outline"
                    onClick={handleAddOldGoldLine}
                    style={{ borderColor: '#d69e2e', color: '#b7791f' }}
                  >
                    + Add old gold / silver
                  </button>
                </div>

                {oldGoldLines.map((og, idx) => {
                  const calc = oldGoldCalculations[idx];
                  return (
                    <div 
                      key={og.id} 
                      style={{ 
                        background: '#fff', 
                        border: '1px dashed #d69e2e', 
                        borderRadius: 6, 
                        padding: 10, 
                        marginBottom: 8 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#b7791f' }}>
                          Exchange Line #{idx + 1}
                        </span>
                        <button 
                          type="button" 
                          className="btn btn-xs btn-danger"
                          onClick={() => setOldGoldLines(oldGoldLines.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                      </div>

                      <div className="g4">
                        <div className="form-group">
                          <label className="label">Description</label>
                          <input 
                            className="input input-sm" 
                            placeholder="Old chain, bangle..."
                            value={og.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOldGoldLines(prev => prev.map((l, i) => i === idx ? { ...l, description: val } : l));
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="label">Metal</label>
                          <select 
                            className="input input-sm"
                            value={og.metal_type}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              const rate = defaultRateForMetal(val, og.purity);
                              setOldGoldLines(prev => prev.map((l, i) => i === idx ? { ...l, metal_type: val, rate_per_10g: rate } : l));
                            }}
                          >
                            <option value="gold">Gold</option>
                            <option value="silver">Silver</option>
                            <option value="platinum">Platinum</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="label">Gross g</label>
                          <input 
                            className="input input-sm" 
                            type="number"
                            step="0.001"
                            value={og.gross_weight}
                            placeholder="0.000"
                            onChange={(e) => {
                              const val = e.target.value;
                              setOldGoldLines(prev => prev.map((l, i) => i === idx ? { ...l, gross_weight: val } : l));
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="label">Less Stone / Other g</label>
                          <input 
                            className="input input-sm" 
                            type="number"
                            step="0.001"
                            value={og.stone_weight}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOldGoldLines(prev => prev.map((l, i) => i === idx ? { ...l, stone_weight: val } : l));
                            }}
                          />
                        </div>
                      </div>

                      <div className="g4" style={{ marginTop: 6 }}>
                        <div className="form-group">
                          <label className="label">Net g †</label>
                          <input 
                            className="input input-sm" 
                            readOnly 
                            style={{ background: '#f9f9f9', fontWeight: 700 }}
                            value={calc.net.toFixed(3)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="label">Tunch % (Purity)</label>
                          <input 
                            className="input input-sm" 
                            value={og.tested_purity}
                            placeholder="e.g. 91.6"
                            onChange={(e) => {
                              const val = e.target.value;
                              setOldGoldLines(prev => prev.map((l, i) => i === idx ? { ...l, tested_purity: val } : l));
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="label">Fine g †</label>
                          <input 
                            className="input input-sm" 
                            readOnly 
                            style={{ background: '#f9f9f9', fontWeight: 700, color: '#b7791f' }}
                            value={calc.fine.toFixed(3)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="label">Rate / 10g (₹)</label>
                          <input 
                            className="input input-sm" 
                            type="number"
                            value={og.rate_per_10g}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOldGoldLines(prev => prev.map((l, i) => i === idx ? { ...l, rate_per_10g: val } : l));
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 12, color: '#b7791f', marginTop: 4 }}>
                        Exchange Value: ₹{calc.value.toLocaleString('en-IN')}
                      </div>
                    </div>
                  );
                })}

                {oldGoldLines.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10, marginTop: 8, borderTop: '1px dashed #d69e2e', paddingTop: 8 }}>
                    <div className="form-group" style={{ margin: 0, maxWidth: 220 }}>
                      <label className="label" style={{ fontSize: 11 }}>
                        Use on this invoice (₹) — blank = max ₹{Math.min(totalOldMetalValue, grandTotal).toLocaleString('en-IN')}
                      </label>
                      <input 
                        className="input input-sm" 
                        type="number"
                        placeholder={String(Math.min(totalOldMetalValue, grandTotal))}
                        value={ogAdjustAmount}
                        onChange={(e) => setOgAdjustAmount(e.target.value)}
                      />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12 }}>
                      <div style={{ fontWeight: 800, color: '#b7791f' }}>
                        Total Old Metal Value: ₹{totalOldMetalValue.toLocaleString('en-IN')} ({totalOldNetGrams.toFixed(3)}g net · {totalOldFineGrams.toFixed(3)}g fine)
                      </div>
                      <div style={{ color: 'var(--muted)' }}>
                        Applied on this invoice: <strong>₹{effectiveOldGoldDeduction.toLocaleString('en-IN')}</strong>
                      </div>
                      {excessOldMetalOwed > 0.5 && (
                        <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 2 }}>
                          ₹{excessOldMetalOwed.toLocaleString('en-IN')} stays owed to the customer on the OGP voucher (paid later from Old Gold register).
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: DISCOUNT & SPLIT PAYMENT */}
              <div className="section-divider">
                Discount & Payment
              </div>

              <div className="g2">
                <div>
                  {/* Discount input with ₹ and % modes */}
                  <div className="form-group" style={{ marginBottom: 12 }}>
                    <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      Discount
                      <span style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                        <button 
                          type="button" 
                          className={`btn btn-xs ${discountType === 'RS' ? 'btn-primary' : 'btn-outline'}`}
                          style={{ borderRadius: 0, padding: '2px 8px' }}
                          onClick={() => setDiscountType('RS')}
                        >
                          ₹
                        </button>
                        <button 
                          type="button" 
                          className={`btn btn-xs ${discountType === 'PCT' ? 'btn-primary' : 'btn-outline'}`}
                          style={{ borderRadius: 0, padding: '2px 8px' }}
                          onClick={() => setDiscountType('PCT')}
                        >
                          %
                        </button>
                      </span>
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input 
                        className="input" 
                        type="number" 
                        min="0"
                        placeholder={discountType === 'RS' ? 'Discount Amount (₹)' : 'Discount %'}
                        value={discountVal}
                        onChange={(e) => setDiscountVal(e.target.value)}
                      />
                    </div>
                    {discountAmount > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                        {discountType === 'PCT' 
                          ? `${discountVal}% of ₹${subtotalTaxable.toLocaleString('en-IN')} = ₹${discountAmount.toLocaleString('en-IN')}`
                          : `= ${((discountAmount / (subtotalTaxable || 1)) * 100).toFixed(2)}% of ₹${subtotalTaxable.toLocaleString('en-IN')}`
                        }
                      </div>
                    )}
                  </div>

                  {/* Multi-mode Split Payment */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="label" style={{ margin: 0 }}>Split Payment (Multi-Mode)</label>
                      <button 
                        type="button" 
                        className="btn btn-xs btn-outline"
                        onClick={() => {
                          const rem = Math.max(0, balanceToPayAfterExchange - totalPaidNow);
                          setSplitPayments([
                            ...splitPayments,
                            { id: `pay-${Date.now()}`, mode: 'UPI', amount: rem > 0 ? String(rem) : '0', referenceNo: '' }
                          ]);
                        }}
                      >
                        + Add Mode
                      </button>
                    </div>

                    {splitPayments.map((pay, pIdx) => (
                      <div key={pay.id} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                        <select 
                          className="input input-sm"
                          style={{ width: 110 }}
                          value={pay.mode}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setSplitPayments(prev => prev.map((p, i) => i === pIdx ? { ...p, mode: val } : p));
                          }}
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Card">Card</option>
                          <option value="Net Banking">Net Banking</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                        <input 
                          className="input input-sm"
                          type="number"
                          style={{ width: 110 }}
                          placeholder="Amount ₹"
                          value={pay.amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSplitPayments(prev => prev.map((p, i) => i === pIdx ? { ...p, amount: val } : p));
                          }}
                        />
                        <input 
                          className="input input-sm"
                          style={{ flex: 1 }}
                          placeholder={pay.mode === 'Cheque' ? 'Cheque No.' : 'UTR / Ref No.'}
                          value={pay.referenceNo}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSplitPayments(prev => prev.map((p, i) => i === pIdx ? { ...p, referenceNo: val } : p));
                          }}
                        />
                        {splitPayments.length > 1 && (
                          <button 
                            type="button" 
                            className="btn btn-xs btn-danger"
                            onClick={() => setSplitPayments(splitPayments.filter((_, i) => i !== pIdx))}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                        Total Paying Now: <strong>₹{totalPaidNow.toLocaleString('en-IN')}</strong>
                      </span>
                      {balanceToPayAfterExchange > totalPaidNow && (
                        <button 
                          type="button" 
                          className="btn btn-xs btn-outline"
                          onClick={() => {
                            const rem = Math.max(0, balanceToPayAfterExchange - totalPaidNow);
                            setSplitPayments(prev => [
                              ...prev.slice(0, -1),
                              { ...prev[prev.length - 1], amount: String((parseFloat(prev[prev.length - 1].amount) || 0) + rem) }
                            ]);
                          }}
                        >
                          Fill Remaining (₹{(balanceToPayAfterExchange - totalPaidNow).toLocaleString('en-IN')})
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">Order Notes</label>
                    <textarea 
                      className="input" 
                      rows={2} 
                      placeholder="Optional notes or instructions..."
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                    />
                  </div>
                </div>

                {/* Right: Bill Summary */}
                <div>
                  <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: 'var(--muted)' }}>Subtotal</span>
                      <span>₹{subtotalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--danger)', marginBottom: 6 }}>
                        <span>Discount {discountType === 'PCT' ? `(${discountVal}%)` : ''}</span>
                        <span>-₹{discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    {applyGst && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                        <span style={{ color: 'var(--muted)' }}>GST (3%)</span>
                        <span>₹{finalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 6, color: 'var(--primary)' }}>
                      <span>Grand Total</span>
                      <span>₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {effectiveOldGoldDeduction > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#b7791f', marginTop: 6 }}>
                        <span>Less Old Metal Exchange</span>
                        <span>-₹{effectiveOldGoldDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)', marginTop: 6 }}>
                      <span>Amount Paying Now</span>
                      <span>₹{totalPaidNow.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, borderTop: '1px dashed var(--border)', paddingTop: 8, marginTop: 8, color: finalBalanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      <span>Balance Due</span>
                      <span>₹{finalBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                      Status on submit: <strong>{finalBalanceDue <= 0.01 ? 'COMPLETED (Fully Paid)' : (totalPaidNow > 0 ? 'PARTIALLY PAID' : 'PENDING (Draft)')}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowNewSaleModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleCreateOrder}
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      

      {/* QUICK ADD CUSTOMER MODAL */}
      {showNewCustomerModal && (
        <div className="overlay" onClick={() => setShowNewCustomerModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>+ New Customer</h3>
              <button 
                type="button" 
                className="btn btn-sm btn-outline"
                onClick={() => setShowNewCustomerModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="g2">
                <div className="form-group">
                  <label className="label">Name *</label>
                  <input 
                    className="input" 
                    value={newCustName}
                    placeholder="Full Name"
                    onChange={(e) => setNewCustName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="label">Mobile *</label>
                  <input 
                    className="input" 
                    type="tel"
                    maxLength={10}
                    value={newCustPhone}
                    placeholder="10-digit mobile"
                    onChange={(e) => setNewCustPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">City</label>
                  <input 
                    className="input" 
                    value={newCustCity}
                    placeholder="e.g. Mumbai"
                    onChange={(e) => setNewCustCity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">State (Place of supply for GST) *</label>
                  <input 
                    className="input" 
                    value={newCustState}
                    onChange={(e) => setNewCustState(e.target.value)}
                  />
                </div>
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">
                    PAN <span style={{ fontSize: 10, color: 'var(--muted)' }}>— needed for sales ₹2 lakh+</span>
                  </label>
                  <input 
                    className="input" 
                    style={{ textTransform: 'uppercase' }}
                    maxLength={10}
                    value={newCustPan}
                    placeholder="ABCDE1234F"
                    onChange={(e) => setNewCustPan(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Email</label>
                  <input 
                    className="input" 
                    type="email"
                    value={newCustEmail}
                    placeholder="customer@example.com"
                    onChange={(e) => setNewCustEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowNewCustomerModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleSaveQuickCustomer}
              >
                Save & Select Customer
              </button>
            </div>
          </div>
        </div>
      )}

      

      {/* PICK FROM STOCK MODAL */}
      {showPickStockModal && (
        <div className="overlay" onClick={() => setShowPickStockModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Pick from Stock Inventory</h3>
              <button 
                type="button" 
                className="btn btn-sm btn-outline"
                onClick={() => setShowPickStockModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div className="search-box" style={{ flex: 1 }}>
                  <Search size={13} style={{ color: 'var(--muted)' }} />
                  <input 
                    placeholder="Search name, item code, HUID, barcode..."
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <select 
                  className="input input-sm" 
                  style={{ width: 'auto' }}
                  value={stockCategory}
                  onChange={(e) => setStockCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="platinum">Platinum</option>
                  <option value="diamond">Diamond</option>
                </select>
              </div>

              <div className="tbl-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Item Name</th>
                      <th>Metal</th>
                      <th>Purity</th>
                      <th className="num">Gross</th>
                      <th className="num">Net</th>
                      <th className="num">Price (₹)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory
                      .filter(inv => {
                        const q = stockSearch.toLowerCase();
                        const matchQ = !q || 
                          inv.itemName.toLowerCase().includes(q) ||
                          inv.itemCode.toLowerCase().includes(q) ||
                          (inv.huid && inv.huid.toLowerCase().includes(q)) ||
                          (inv.barcode && inv.barcode.toLowerCase().includes(q));
                        const matchC = !stockCategory || (inv.category || '').toLowerCase() === stockCategory.toLowerCase() || (inv.metalType || '').toLowerCase() === stockCategory.toLowerCase();
                        return matchQ && matchC;
                      })
                      .slice(0, 30)
                      .map(inv => (
                        <tr key={inv.id}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.itemCode}</td>
                          <td>{inv.itemName}</td>
                          <td>{inv.metalType}</td>
                          <td>{inv.purityKarat}</td>
                          <td className="num">{(inv.grossWeight || 0).toFixed(3)}g</td>
                          <td className="num">{(inv.netWeight || 0).toFixed(3)}g</td>
                          <td className="num">₹{(inv.retailPrice || 0).toLocaleString('en-IN')}</td>
                          <td>
                            <button 
                              type="button" 
                              className="btn btn-xs btn-primary"
                              onClick={() => handlePickStockItem(inv)}
                            >
                              + Pick
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
                onClick={() => setShowPickStockModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      

      {/* VIEW ORDER DETAIL MODAL (Matching live app) */}
      {selectedInvoiceForView && (
        <div className="overlay" onClick={() => setSelectedInvoiceForView(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 900 }}>
            <div className="modal-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                  Order #{selectedInvoiceForView.invoiceNo}
                </h3>
                <span className="badge badge-yellow" style={{ textTransform: 'lowercase' }}>
                  {selectedInvoiceForView.status?.toLowerCase().replace('_', ' ') || 'partially paid'}
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-outline"
                onClick={() => setSelectedInvoiceForView(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '82vh', overflowY: 'auto', padding: '16px 20px' }}>
              {/* Margin & profit link */}
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>
                  Margin & profit on this invoice
                </span>
              </div>

              {/* Customer summary */}
              <div style={{ fontSize: 13, color: 'var(--graphite)', marginBottom: 8 }}>
                <strong>{selectedInvoiceForView.customer.name}</strong> · {selectedInvoiceForView.customer.mobile || selectedInvoiceForView.customer.phone} · {selectedInvoiceForView.invoiceDate}
              </div>

              {/* Metric bar */}
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap', marginBottom: 14, background: 'var(--bg)', padding: '8px 12px', borderRadius: 6 }}>
                <div>Invoice Amount: <strong style={{ color: 'var(--graphite)' }}>₹{(selectedInvoiceForView.totalAmount || 0).toLocaleString('en-IN')}</strong></div>
                <div>Cash / UPI Received: <strong style={{ color: 'var(--success)' }}>₹{(selectedInvoiceForView.paidAmount || 0).toLocaleString('en-IN')}</strong></div>
                <div>Total Paid: <strong style={{ color: 'var(--success)' }}>₹{(selectedInvoiceForView.paidAmount || 0).toLocaleString('en-IN')}</strong></div>
                <div>Pending: <strong style={{ color: 'var(--danger)' }}>₹{(selectedInvoiceForView.balanceDue || 0).toLocaleString('en-IN')}</strong></div>
                <div>Status: <strong style={{ color: '#d97706' }}>partially paid · Next: collect ₹{(selectedInvoiceForView.balanceDue || 0).toLocaleString('en-IN')}</strong></div>
              </div>

              {/* 3 Big Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="card" style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    INVOICE VALUE
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--graphite)', marginTop: 4 }}>
                    ₹{(selectedInvoiceForView.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    MONEY RECEIVED
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>
                    − ₹{(selectedInvoiceForView.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    {(selectedInvoiceForView.payments || []).length || 2} receipt(s)
                  </div>
                </div>

                <div className="card" style={{ padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    BALANCE DUE
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--danger)', marginTop: 4 }}>
                    ₹{(selectedInvoiceForView.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', gap: 6, borderBottom: '1px solid var(--border)', marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => setOrderDetailSubTab('items')}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    borderBottom: orderDetailSubTab === 'items' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                    color: orderDetailSubTab === 'items' ? 'var(--primary)' : 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  Items ({(selectedInvoiceForView.items || []).length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDetailSubTab('payments')}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    borderBottom: orderDetailSubTab === 'payments' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                    color: orderDetailSubTab === 'payments' ? 'var(--primary)' : 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  Payments ({(selectedInvoiceForView.payments || []).length || 2})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDetailSubTab('old_gold')}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    borderBottom: orderDetailSubTab === 'old_gold' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                    color: orderDetailSubTab === 'old_gold' ? 'var(--primary)' : 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  Old gold exchange
                </button>
                <button
                  type="button"
                  onClick={() => setOrderDetailSubTab('deposits')}
                  style={{
                    padding: '8px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    borderBottom: orderDetailSubTab === 'deposits' ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                    color: orderDetailSubTab === 'deposits' ? 'var(--primary)' : 'var(--muted)',
                    cursor: 'pointer'
                  }}
                >
                  Advance deposits
                </button>
              </div>

              {/* Sub-tab Content */}
              {orderDetailSubTab === 'items' && (
                <div className="tbl-wrap" style={{ marginBottom: 16 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>ITEM</th>
                        <th>PURITY</th>
                        <th>NET WT / BOOKED</th>
                        <th>QTY</th>
                        <th>BALANCE</th>
                        <th>DELIVERED</th>
                        <th>STATUS</th>
                        <th className="num">TOTAL</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedInvoiceForView.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong>{it.itemName}</strong>
                            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{it.itemCode} {it.huid ? `· HUID: ${it.huid}` : ''}</div>
                          </td>
                          <td>{it.purityKarat}</td>
                          <td>{it.netWeight?.toFixed(3)}g</td>
                          <td>1</td>
                          <td>—</td>
                          <td>—</td>
                          <td>
                            <span className={`badge ${itemDeliveryState[`${selectedInvoiceForView.id}-${idx}`]?.delivered ? 'badge-green' : itemDeliveryState[`${selectedInvoiceForView.id}-${idx}`]?.allocated ? 'badge-blue' : 'badge-yellow'}`}>
                              {itemDeliveryState[`${selectedInvoiceForView.id}-${idx}`]?.delivered ? 'delivered' : itemDeliveryState[`${selectedInvoiceForView.id}-${idx}`]?.allocated ? 'allocated' : 'pending'}
                            </span>
                          </td>
                          <td className="num" style={{ fontWeight: 700 }}>₹{it.lineTotal?.toLocaleString('en-IN')}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button 
                                type="button" 
                                className={`btn btn-xs ${itemDeliveryState[`${selectedInvoiceForView.id}-${idx}`]?.delivered ? 'btn-gold' : 'btn-outline'}`}
                                onClick={() => {
                                  const key = `${selectedInvoiceForView.id}-${idx}`;
                                  setItemDeliveryState(prev => ({
                                    ...prev,
                                    [key]: {
                                      allocated: true,
                                      delivered: !prev[key]?.delivered
                                    }
                                  }));
                                }}
                              >
                                {itemDeliveryState[`${selectedInvoiceForView.id}-${idx}`]?.delivered ? 'Delivered' : 'Deliver'}
                              </button>
                              <button 
                                type="button" 
                                className={`btn btn-xs ${itemDeliveryState[`${selectedInvoiceForView.id}-${idx}`]?.allocated ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => {
                                  const key = `${selectedInvoiceForView.id}-${idx}`;
                                  setItemDeliveryState(prev => ({
                                    ...prev,
                                    [key]: {
                                      delivered: prev[key]?.delivered || false,
                                      allocated: !prev[key]?.allocated
                                    }
                                  }));
                                }}
                              >
                                {itemDeliveryState[`${selectedInvoiceForView.id}-${idx}`]?.allocated ? 'Allocated' : 'Allocate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {orderDetailSubTab === 'payments' && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.04em', marginBottom: 6 }}>
                    PAYMENT HISTORY
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>RECEIPT</th>
                          <th>DATE</th>
                          <th>TYPE</th>
                          <th>MODE</th>
                          <th>METAL</th>
                          <th>RATE/10G</th>
                          <th>WEIGHT</th>
                          <th className="num">AMOUNT</th>
                          <th>ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedInvoiceForView.payments || [
                          { id: 'p1', receiptNo: 'PAY-2026-00001', date: '15 Nov 2026', mode: 'Cash', amount: 10000 },
                          { id: 'p2', receiptNo: 'PAY-2026-00002', date: '15 Nov 2026', mode: 'UPI', referenceNo: '898976765454', amount: 100000 }
                        ]).map((p: any, pIdx: number) => (
                          <tr key={pIdx}>
                            <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.receiptNo || `PAY-2026-0000${pIdx + 1}`}</td>
                            <td style={{ fontSize: 11 }}>{p.date || '15 Nov 2026'}</td>
                            <td><span className="badge badge-gray">order</span></td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{String(p.mode).toLowerCase()}</div>
                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Counter MAIN</div>
                              {p.referenceNo && <div style={{ fontSize: 10, fontFamily: 'monospace' }}>Ref: {p.referenceNo}</div>}
                            </td>
                            <td>—</td>
                            <td>—</td>
                            <td>—</td>
                            <td className="num amt-green" style={{ fontWeight: 700 }}>
                              ₹{Number(p.amount).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button 
                                  type="button" 
                                  className="btn btn-xs btn-outline"
                                  title="Payment receipt (80mm)"
                                  onClick={() => setSelectedReceiptFor80mm({ receipt: p, order: selectedInvoiceForView })}
                                >
                                  <Printer size={10} />
                                </button>
                                <button 
                                  type="button" 
                                  className="btn btn-xs btn-outline" 
                                  title="Edit Payment Reference"
                                  onClick={() => {
                                    setCollectAmount(String(p.amount || ''));
                                    setCollectRef(p.referenceNo || '');
                                    setCollectMode(String(p.mode || 'cash').toLowerCase());
                                    setCollectNote(p.notes || '');
                                  }}
                                >
                                  ✎
                                </button>
                                <button 
                                  type="button" 
                                  className="btn btn-xs btn-danger" 
                                  title="Void Payment"
                                  onClick={() => {
                                    if (window.confirm(`Void payment receipt ${p.receiptNo || 'PAY'} of ₹${p.amount}?`)) {
                                      const pays = (selectedInvoiceForView.payments || []).filter((item: any) => item !== p);
                                      const newPaid = Math.max(0, (selectedInvoiceForView.paidAmount || 0) - Number(p.amount || 0));
                                      const newBal = Math.max(0, (selectedInvoiceForView.totalAmount || 0) - newPaid);
                                      const updated = {
                                        ...selectedInvoiceForView,
                                        payments: pays,
                                        paidAmount: newPaid,
                                        balanceDue: newBal,
                                        status: (newBal <= 0 ? 'COMPLETED' : 'PENDING') as any
                                      };
                                      setSelectedInvoiceForView(updated);
                                      setInvoicesList(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
                                    }
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Collect Payment Box */}
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: 'var(--graphite)' }}>
                  Collect Payment — <span style={{ color: 'var(--danger)' }}>Balance due: ₹{(selectedInvoiceForView.balanceDue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="label">Amount (₹)</label>
                    <input 
                      className="input" 
                      type="number"
                      placeholder={String(selectedInvoiceForView.balanceDue || 0)}
                      value={collectAmount}
                      onChange={(e) => setCollectAmount(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="label">UTR / Reference no. (optional)</label>
                    <input 
                      className="input" 
                      placeholder="e.g. UPI Ref / Cheque No."
                      value={collectRef}
                      onChange={(e) => setCollectRef(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label className="label">Payment Mode</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {['cash', 'upi', 'card', 'cheque', 'bank_transfer', 'neft', 'rtgs', 'imps', 'customer_credit', 'other'].map(m => (
                      <button
                        key={m}
                        type="button"
                        className={`btn btn-xs ${collectMode === m ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setCollectMode(m)}
                        style={{ textTransform: 'lowercase' }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 10 }}>
                  <label className="label">Note (optional)</label>
                  <input 
                    className="input" 
                    placeholder="e.g. Counter deposit"
                    value={collectNote}
                    onChange={(e) => setCollectNote(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    const amount = Number(collectAmount);
                    const receiptId = crypto.randomUUID();
                    const newPay: PaymentTransaction = {
                      id: receiptId,
                      receiptNo: 'PAY-' + new Date().getFullYear() + '-' + receiptId.slice(0, 8).toUpperCase(),
                      date: new Date().toISOString(),
                      amount,
                      mode: collectMode.toUpperCase() as PaymentMode,
                      referenceNo: collectRef || undefined,
                      collectorName: 'Admin',
                      notes: collectNote || undefined
                    };
                    const updatedOrder = applyInvoiceReceipt(selectedInvoiceForView, newPay);
                    if (!updatedOrder) {
                      alert('Enter a valid payment amount that does not exceed the amount due.');
                      return;
                    }
                    onAddPayment(selectedInvoiceForView.id, newPay);
                    setSelectedInvoiceForView(updatedOrder);
                    setInvoicesList(prev => prev.map(inv => inv.id === updatedOrder.id ? updatedOrder : inv));
                    setCollectAmount('');
                    setCollectRef('');
                    setCollectNote('');
                    setSelectedReceiptFor80mm({ receipt: newPay, order: updatedOrder });
                  }}
                >
                  Record Payment
                </button>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="modal-foot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline"
                  title="GST tax invoice (PDF)"
                  onClick={() => setShowTaxInvoiceModal(selectedInvoiceForView)}
                >
                  GST invoice
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline" 
                  title="Item cards & guarantees"
                  onClick={() => setShowItemCardsModal(selectedInvoiceForView)}
                >
                  Item cards
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline" 
                  title="Send a payment link"
                  onClick={() => {
                    setCopiedLink(false);
                    setShowPayLinkModal(selectedInvoiceForView);
                  }}
                >
                  Pay link
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline" 
                  title="Create Courier Shipment"
                  onClick={() => {
                    setShipAwb(`BVC-${Date.now().toString().slice(-8)}`);
                    setShipDispatched(false);
                    setShowShipModal(selectedInvoiceForView);
                  }}
                >
                  Ship
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline" 
                  title="Payment summary (A4)"
                  onClick={() => setShowPaymentSummaryModal(selectedInvoiceForView)}
                >
                  Payment summary (A4)
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline" 
                  title="Same summary on the 80 mm counter printer"
                  onClick={() => {
                    const pays = selectedInvoiceForView.payments || [];
                    const lastPay = pays.length > 0 ? pays[pays.length - 1] : {
                      id: 'pay-fallback',
                      receiptNo: 'PAY-2026-00001',
                      date: '15-Nov-2026 21:37',
                      amount: 10000,
                      mode: 'CASH' as any
                    };
                    setSelectedReceiptFor80mm({ receipt: lastPay, order: selectedInvoiceForView });
                  }}
                >
                  80mm
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => {
                    const inv = selectedInvoiceForView;
                    setSelectedInvoiceForView(null);
                    setSelectedInvoiceForCancel(inv);
                  }}
                >
                  Cancel / Partial Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline"
                  title="Modify Order Details"
                  onClick={() => handleModifyOrder(selectedInvoiceForView)}
                >
                  Modify
                </button>
              </div>

              <div>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline"
                  onClick={() => setSelectedInvoiceForView(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      

      {/* 80MM PAYMENT RECEIPT MODAL (Exact 1:1 replica of user's uploaded image) */}
      {selectedReceiptFor80mm && (
        <div className="overlay" onClick={() => setSelectedReceiptFor80mm(null)} style={{ zIndex: 1200 }}>
          <div 
            className="modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: 360, 
              width: '100%', 
              background: '#2b2d31', 
              padding: 16, 
              borderRadius: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.45)'
            }}
          >
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, color: '#fff' }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {selectedReceiptFor80mm.receipt.receiptNo || 'PAY-2026-00001'}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  type="button" 
                  className="btn btn-xs btn-primary"
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  <Printer size={11} /> Print
                </button>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline"
                  onClick={() => setSelectedReceiptFor80mm(null)}
                  style={{ color: '#fff', borderColor: '#555' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 80mm Slip Card Container (White) */}
            <div 
              style={{ 
                background: '#fff', 
                color: '#111', 
                padding: '24px 20px', 
                borderRadius: 2, 
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                fontSize: 12,
                lineHeight: 1.45,
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              {/* Shop Header */}
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.02em' }}>
                  {store.tradeName || 'S.B Borana Jewellers'}
                </div>
                <div style={{ fontSize: 11, color: '#333', marginTop: 2 }}>
                  {store.address || '3-5 Niwas , Vile parle east Mumbai'}
                </div>
                <div style={{ fontSize: 11, color: '#333' }}>
                  {store.city || 'Mumbai'}, {store.state || 'Maharashtra'}, {store.pincode || '400057'}
                </div>
                <div style={{ fontSize: 11, color: '#333' }}>
                  Mobile: {store.mobile || '9324773823'}
                </div>
                <div style={{ fontSize: 11, color: '#333' }}>
                  GSTIN: {store.gstin || '27ACZPJ7126B1ZA'}
                </div>
              </div>

              <div style={{ borderTop: '1px solid #111', margin: '8px 0' }} />

              {/* Title */}
              <div style={{ textAlign: 'center', margin: '8px 0 12px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '0.04em' }}>
                  PAYMENT RECEIPT
                </div>
                <div style={{ fontSize: 11, color: '#222' }}>
                  Payment Received Against Sales Order
                </div>
              </div>

              {/* Receipt Info Table */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '3px 8px', fontSize: 11, marginBottom: 8 }}>
                <div style={{ color: '#222' }}>Receipt No</div>
                <div style={{ fontWeight: 800 }}>{selectedReceiptFor80mm.receipt.receiptNo || 'PAY-2026-00001'}</div>
                <div style={{ color: '#222' }}>Date</div>
                <div>
                  {(() => {
                    const rawDate = selectedReceiptFor80mm.receipt.date;
                    if (!rawDate) return '15-Nov-2026 21:37';
                    if (rawDate.includes('-') && rawDate.length >= 10) {
                      const parts = rawDate.split(' ');
                      const dParts = parts[0].split('-');
                      if (dParts.length === 3 && dParts[0].length === 4) {
                        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                        const mIdx = parseInt(dParts[1], 10) - 1;
                        const formattedD = `${dParts[2]}-${months[mIdx] || 'Nov'}-${dParts[0]}`;
                        return parts[1] ? `${formattedD} ${parts[1]}` : formattedD;
                      }
                    }
                    return rawDate;
                  })()}
                </div>
                <div style={{ color: '#222' }}>Sales Order</div>
                <div style={{ fontWeight: 800 }}>{selectedReceiptFor80mm.order.invoiceNo || 'INV-2026-00001'}</div>
                <div style={{ color: '#222' }}>Status</div>
                <div>{selectedReceiptFor80mm.order.balanceDue && selectedReceiptFor80mm.order.balanceDue > 0 ? 'Partially paid' : 'Paid in full'}</div>
              </div>

              <div style={{ borderTop: '1px dashed #777', margin: '8px 0' }} />

              {/* Customer Block */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', marginBottom: 2 }}>
                  CUSTOMER
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '3px 8px', fontSize: 11 }}>
                  <div>Name</div>
                  <div style={{ fontWeight: 600 }}>{selectedReceiptFor80mm.order.customer.name}</div>
                  <div>Mobile</div>
                  <div style={{ fontFamily: 'monospace' }}>
                    {(() => {
                      const mob = selectedReceiptFor80mm.order.customer.mobile || selectedReceiptFor80mm.order.customer.phone || '9876543210';
                      return mob.length >= 10 ? `XXXXXX${mob.slice(-4)}` : mob;
                    })()}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #777', margin: '8px 0' }} />

              {/* Jewellery Block */}
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', marginBottom: 2 }}>
                  JEWELLERY
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '3px 8px', fontSize: 11 }}>
                  <div>Item</div>
                  <div style={{ fontWeight: 800 }}>
                    {selectedReceiptFor80mm.order.items[0]?.itemName || 'Gold Chain 22K Rope'}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#333', marginTop: 2, paddingLeft: 2 }}>
                  SKU {selectedReceiptFor80mm.order.items[0]?.itemCode || 'SBJCH-01'} · Gold 22K (916) · Gross {selectedReceiptFor80mm.order.items[0]?.grossWeight?.toFixed(3) || '12.350'} g · Net {selectedReceiptFor80mm.order.items[0]?.netWeight?.toFixed(3) || '12.350'} g
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '3px 8px', fontSize: 11, marginTop: 3 }}>
                  <div>HUID</div>
                  <div style={{ fontWeight: 700 }}>
                    {selectedReceiptFor80mm.order.items[0]?.huid || 'ZX98YU'}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#333', marginTop: 2, paddingLeft: 2 }}>
                  Making @ Rs {selectedReceiptFor80mm.order.items[0]?.makingRate || 450}/g net = Rs {selectedReceiptFor80mm.order.items[0]?.makingAmount?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '5,557.50'}
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #777', margin: '8px 0' }} />

              {/* Financial Ledger */}
              <div style={{ fontSize: 11, marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span>Order value</span>
                  <span>₹{(selectedReceiptFor80mm.order.totalAmount || 196532).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span>Previous payments</span>
                  <span>
                    ₹{(() => {
                      const allP = selectedReceiptFor80mm.order.payments || [];
                      const curId = selectedReceiptFor80mm.receipt.id || selectedReceiptFor80mm.receipt.receiptNo;
                      let prior = 0;
                      for (const p of allP) {
                        if ((p.id || p.receiptNo) === curId) break;
                        prior += Number(p.amount) || 0;
                      }
                      return prior.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                    })()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2, fontWeight: 800 }}>
                  <span>Payment received now</span>
                  <span>₹{Number(selectedReceiptFor80mm.receipt.amount || 10000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span>Total amount paid</span>
                  <span>
                    ₹{(() => {
                      const allP = selectedReceiptFor80mm.order.payments || [];
                      const curId = selectedReceiptFor80mm.receipt.id || selectedReceiptFor80mm.receipt.receiptNo;
                      let tot = 0;
                      for (const p of allP) {
                        tot += Number(p.amount) || 0;
                        if ((p.id || p.receiptNo) === curId) break;
                      }
                      if (tot === 0) tot = Number(selectedReceiptFor80mm.receipt.amount) || 10000;
                      return tot.toLocaleString('en-IN', { minimumFractionDigits: 2 });
                    })()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 800 }}>
                  <span>Balance pending</span>
                  <span>
                    ₹{(() => {
                      const ordTotal = selectedReceiptFor80mm.order.totalAmount || 196532;
                      const allP = selectedReceiptFor80mm.order.payments || [];
                      const curId = selectedReceiptFor80mm.receipt.id || selectedReceiptFor80mm.receipt.receiptNo;
                      let tot = 0;
                      for (const p of allP) {
                        tot += Number(p.amount) || 0;
                        if ((p.id || p.receiptNo) === curId) break;
                      }
                      if (tot === 0) tot = Number(selectedReceiptFor80mm.receipt.amount) || 10000;
                      return Math.max(0, ordTotal - tot).toLocaleString('en-IN', { minimumFractionDigits: 2 });
                    })()}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontSize: 10, color: '#333' }}>
                  {amountToWords(Number(selectedReceiptFor80mm.receipt.amount) || 10000)}
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #777', margin: '8px 0' }} />

              {/* Payment Mode & Receiver */}
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: '3px 8px', fontSize: 11, marginBottom: 8 }}>
                <div>Payment mode</div>
                <div style={{ fontWeight: 600 }}>{selectedReceiptFor80mm.receipt.mode || 'Cash'}</div>
                {selectedReceiptFor80mm.receipt.referenceNo && (
                  <>
                    <div>Transaction ref</div>
                    <div style={{ fontFamily: 'monospace' }}>{selectedReceiptFor80mm.receipt.referenceNo}</div>
                  </>
                )}
                <div>Received by</div>
                <div>{selectedReceiptFor80mm.receipt.collectorName || 'Admin'}</div>
              </div>

              <div style={{ borderTop: '1px solid #111', margin: '8px 0' }} />

              {/* Thank you & Legal Disclaimer paragraph */}
              <div style={{ textAlign: 'center', fontSize: 10, color: '#222', lineHeight: 1.35, marginBottom: 20 }}>
                <div style={{ fontWeight: 800, marginBottom: 3 }}>
                  Thank you for your purchase and for choosing us.
                </div>
                <div>
                  This receipt confirms that the payment above has been received against the referenced sales order.
                </div>
                <div style={{ marginTop: 2 }}>
                  The jewellery is booked against this order. Delivery will be completed after payment of the outstanding balance and verification under the shop's normal delivery process.
                </div>
                <div style={{ marginTop: 2 }}>
                  Please retain this receipt for your records.
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, marginBottom: 8, fontSize: 10 }}>
                <div style={{ textAlign: 'center', borderTop: '1px solid #444', width: 110, paddingTop: 4 }}>
                  Customer's signature
                </div>
                <div style={{ textAlign: 'center', borderTop: '1px solid #444', width: 110, paddingTop: 4 }}>
                  Authorised signatory
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, marginTop: 10, color: '#111' }}>
                This is a payment receipt, not a tax invoice.
              </div>
            </div>
          </div>
        </div>
      )}

      

      {/* TAX INVOICE A4 MODAL (Triggered by 'GST invoice' button) */}
      {showTaxInvoiceModal && (
        <div className="overlay" onClick={() => setShowTaxInvoiceModal(null)} style={{ zIndex: 1200 }}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>GST Tax Invoice — {showTaxInvoiceModal.invoiceNo}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  type="button" 
                  className="btn btn-sm btn-primary"
                  onClick={() => triggerPrintInvoice(showTaxInvoiceModal)}
                >
                  <Printer size={13} /> Print / Save PDF
                </button>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowTaxInvoiceModal(null)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                    {store.tradeName || 'S.B Borana Jewellers'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {store.address || '3-5 Niwas , Vile parle east Mumbai'}, {store.city || 'Mumbai'}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    GSTIN: <strong>{store.gstin || '27ACZPJ7126B1ZA'}</strong> · State: 27 Maharashtra
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>TAX INVOICE</div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Invoice #: {showTaxInvoiceModal.invoiceNo}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Date: {showTaxInvoiceModal.invoiceDate}</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 10, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Billed to: {showTaxInvoiceModal.customer.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Phone: {showTaxInvoiceModal.customer.mobile || showTaxInvoiceModal.customer.phone || 'N/A'} · City: {showTaxInvoiceModal.customer.city || 'Mumbai'}
                </div>
              </div>

              <div className="tbl-wrap" style={{ marginBottom: 14 }}>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Description</th>
                      <th>HSN</th>
                      <th>Purity</th>
                      <th className="num">Gross</th>
                      <th className="num">Net Wt</th>
                      <th className="num">Rate/10g</th>
                      <th className="num">Making</th>
                      <th className="num">Taxable</th>
                      <th className="num">GST 3%</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(showTaxInvoiceModal.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>
                          <strong>{it.itemName}</strong>
                          <div style={{ fontSize: 10, color: 'var(--muted)' }}>HUID: {it.huid}</div>
                        </td>
                        <td>7113</td>
                        <td>{it.purityKarat}</td>
                        <td className="num">{it.grossWeight?.toFixed(3)}g</td>
                        <td className="num" style={{ fontWeight: 700 }}>{it.netWeight?.toFixed(3)}g</td>
                        <td className="num">₹{(it.metalRatePerGram * 10).toLocaleString('en-IN')}</td>
                        <td className="num">₹{it.makingAmount?.toLocaleString('en-IN')}</td>
                        <td className="num">₹{it.taxableAmount?.toLocaleString('en-IN')}</td>
                        <td className="num">₹{((it.cgstAmount || 0) + (it.sgstAmount || 0)).toLocaleString('en-IN')}</td>
                        <td className="num" style={{ fontWeight: 700 }}>₹{it.lineTotal?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: 280, background: 'var(--bg)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>Taxable Amount:</span>
                    <span>₹{(showTaxInvoiceModal.taxableAmount || 190808).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>CGST (1.5%):</span>
                    <span>₹{(showTaxInvoiceModal.cgstTotal || 2862).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span>SGST (1.5%):</span>
                    <span>₹{(showTaxInvoiceModal.sgstTotal || 2862).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: 6, color: 'var(--primary)' }}>
                    <span>Grand Total:</span>
                    <span>₹{(showTaxInvoiceModal.totalAmount || 196532).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setShowTaxInvoiceModal(null)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={() => triggerPrintInvoice(showTaxInvoiceModal)}>
                <Printer size={13} /> Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      

      {/* CANCELLATION MODAL (RN style) */}
      {selectedInvoiceForCancel && (
        <div className="overlay" onClick={() => setSelectedInvoiceForCancel(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <RotateCcw size={14} /> Cancel Order #{selectedInvoiceForCancel.invoiceNo}
              </h3>
              <button 
                type="button" 
                className="btn btn-sm btn-outline"
                onClick={() => setSelectedInvoiceForCancel(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <button 
                  type="button"
                  className={`btn ${cancelType === 'full' ? 'btn-danger' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                  onClick={() => setCancelType('full')}
                >
                  Full Cancellation
                </button>
                <button 
                  type="button"
                  className={`btn ${cancelType === 'partial' ? 'btn-danger' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                  onClick={() => setCancelType('partial')}
                >
                  Partial Cancellation
                </button>
              </div>

              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>Customer:</span>
                  <strong>{selectedInvoiceForCancel.customer.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span>Order Total:</span>
                  <strong>₹{(selectedInvoiceForCancel.totalAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--success)', marginBottom: 4 }}>
                  <span>Paid Collected:</span>
                  <strong>₹{(selectedInvoiceForCancel.paidAmount || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gold)', borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
                  <span>Net Refund Due:</span>
                  <strong>₹{Math.max(0, (selectedInvoiceForCancel.paidAmount || 0) - (parseFloat(cancelDeduction) || 0)).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              {cancelType === 'partial' && (
                <div style={{ marginBottom: 14 }}>
                  <label className="label">Select Items to Cancel</label>
                  {(selectedInvoiceForCancel.items || []).map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <input 
                        type="checkbox"
                        checked={!!cancelItemSelection[it.id]}
                        onChange={(e) => setCancelItemSelection({ ...cancelItemSelection, [it.id]: e.target.checked })}
                      />
                      <span style={{ flex: 1, fontSize: 12 }}>{it.itemName} ({it.netWeight.toFixed(3)}g)</span>
                      <strong style={{ fontSize: 12 }}>₹{it.lineTotal.toLocaleString('en-IN')}</strong>
                    </div>
                  ))}
                </div>
              )}

              <div className="g2">
                <div className="form-group">
                  <label className="label">Deduction / Cancellation Fee (₹)</label>
                  <input 
                    className="input" 
                    type="number"
                    value={cancelDeduction}
                    onChange={(e) => setCancelDeduction(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Refund Mode</label>
                  <select 
                    className="input"
                    value={cancelRefundMode}
                    onChange={(e) => setCancelRefundMode(e.target.value as any)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Cancellation Reason *</label>
                <input 
                  className="input" 
                  value={cancelReason}
                  placeholder="e.g. Customer change of mind, size alteration cancelled..."
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <input 
                  type="checkbox" 
                  id="restock_tog"
                  checked={cancelRestock}
                  onChange={(e) => setCancelRestock(e.target.checked)}
                />
                <label htmlFor="restock_tog" style={{ fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                  Restock cancelled items back into inventory
                </label>
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setSelectedInvoiceForCancel(null)}
              >
                Close
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                disabled={!cancelReason.trim()}
                onClick={handleProcessCancellation}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM CARDS MODAL */}
      {showItemCardsModal && (
        <div className="overlay" onClick={() => setShowItemCardsModal(null)} style={{ zIndex: 1200 }}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Item Guarantee & Tag Cards — {showItemCardsModal.invoiceNo}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  type="button" 
                  className="btn btn-sm btn-primary"
                  onClick={() => window.print()}
                >
                  <Printer size={13} /> Print All Cards
                </button>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowItemCardsModal(null)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <p className="helper" style={{ marginBottom: 16 }}>
                Jewellery item guarantee cards with purity hallmark guarantee, net weight, HUID code, and store authentication.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
                {showItemCardsModal.items.map((it, idx) => (
                  <div key={idx} style={{ border: '1.5px solid var(--border)', borderRadius: 8, padding: 14, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{store.tradeName || 'S.B Borana Jewellers'}</div>
                        <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>BIS Hallmarked Jewellery</div>
                      </div>
                      <span className="badge badge-gold" style={{ fontSize: 9 }}>{it.purityKarat || '22K 916'}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{it.itemName}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontFamily: 'monospace', marginBottom: 10 }}>
                      SKU: {it.itemCode || `SKU-${idx + 1}`} · HUID: {it.huid || 'KJ789G'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11, background: 'var(--bg)', padding: 8, borderRadius: 6, marginBottom: 10 }}>
                      <div>Gross Wt: <strong>{(it.grossWeight || it.netWeight || 10).toFixed(3)}g</strong></div>
                      <div>Net Wt: <strong>{(it.netWeight || 10).toFixed(3)}g</strong></div>
                      <div>Stone Wt: <strong>{(it.stoneWeight || 0).toFixed(3)}g</strong></div>
                      <div>Making: <strong>Rs {it.makingRate || 450}/g</strong></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px dashed var(--border)' }}>
                      <div>
                        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Valuation: </span>
                        <strong style={{ fontSize: 13, color: 'var(--primary)' }}>₹{(it.lineTotal || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-xs btn-outline"
                        onClick={() => window.print()}
                      >
                        <Printer size={10} /> Card
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowItemCardsModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAY LINK MODAL */}
      {showPayLinkModal && (
        <div className="overlay" onClick={() => setShowPayLinkModal(null)} style={{ zIndex: 1200 }}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Send Payment Link — {showPayLinkModal.invoiceNo}</h3>
              <button 
                type="button" 
                className="btn btn-xs btn-outline"
                onClick={() => setShowPayLinkModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>Customer:</span>
                  <strong style={{ fontSize: 12 }}>{showPayLinkModal.customer.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>Mobile:</span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{showPayLinkModal.customer.mobile || showPayLinkModal.customer.phone || '9876543210'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Outstanding Balance:</span>
                  <strong style={{ fontSize: 15, color: 'var(--danger)' }}>
                    ₹{linkAmount.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="order-upi-link">Generated UPI Payment Link</label>
                {!paymentLink && <p className="helper">
                  {linkAmount <= 0 ? 'This invoice has no outstanding balance.' :
                    'Save a valid showroom UPI ID in Shop Settings to generate a payment link.'}
                </p>}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input id="order-upi-link" className="input mono" readOnly value={paymentLink} />
                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    disabled={!paymentLink}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(paymentLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2500);
                      } catch {
                        alert('Copy the payment link manually from the field.');
                      }
                    }}
                  >
                    <Copy size={13} /> {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button type="button" className="btn btn-sm btn-primary flex-1" disabled={!paymentLink || !messagingNumber}
                  onClick={() => window.open('https://api.whatsapp.com/send?' +
                    new URLSearchParams({ phone: messagingNumber, text: paymentMessage }), '_blank', 'noopener,noreferrer')}>
                  <Send size={13} /> WhatsApp
                </button>
                <button type="button" className="btn btn-sm btn-outline flex-1" disabled={!paymentLink || !messagingNumber}
                  onClick={() => { window.location.href = 'sms:+' + messagingNumber + '?body=' + encodeURIComponent(paymentMessage); }}>
                  <Share2 size={13} /> SMS Link
                </button>
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowPayLinkModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIP MODAL */}
      {showShipModal && (
        <div className="overlay" onClick={() => setShowShipModal(null)} style={{ zIndex: 1200 }}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Create Shipment for Order — {showShipModal.invoiceNo}</h3>
              <button 
                type="button" 
                className="btn btn-xs btn-outline"
                onClick={() => setShowShipModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {shipDispatched ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <CheckCircle2 size={40} style={{ color: 'var(--success)', margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Shipment Dispatched Successfully!</h4>
                  <p className="helper">
                    Booked with <strong>{shipCourier}</strong> under AWB Tracking No: <strong>{shipAwb}</strong>.
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 4 }}>
                      Recipient: {showShipModal.customer.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      Address: {[showShipModal.customer.address, showShipModal.customer.city, showShipModal.customer.state].filter(Boolean).join(', ') || 'Showroom Address'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      Mobile: {showShipModal.customer.mobile || showShipModal.customer.phone || '9876543210'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label">Courier Partner</label>
                    <select 
                      className="input"
                      value={shipCourier}
                      onChange={(e) => setShipCourier(e.target.value)}
                    >
                      <option value="BVC Logistics">BVC Logistics (Secured Valuables)</option>
                      <option value="Sequel Secure">Sequel Secure (Jewellery Armoured)</option>
                      <option value="Shiprocket">Shiprocket (Multi-carrier Express)</option>
                      <option value="Blue Dart">Blue Dart Surface / Air</option>
                      <option value="Hand Delivery">Hand Delivery / Store Runner</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="form-group">
                      <label className="label">AWB / Consignment No.</label>
                      <input 
                        className="input" 
                        value={shipAwb}
                        onChange={(e) => setShipAwb(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">Weight (grams)</label>
                      <input 
                        className="input" 
                        value={shipWeight}
                        onChange={(e) => setShipWeight(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <input 
                      type="checkbox" 
                      id="ins_tog"
                      checked={shipInsured}
                      onChange={(e) => setShipInsured(e.target.checked)}
                    />
                    <label htmlFor="ins_tog" style={{ fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                      Transit Insurance Coverage (Declared Value: ₹{(showShipModal.totalAmount || 0).toLocaleString('en-IN')})
                    </label>
                  </div>
                </>
              )}
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowShipModal(null)}
              >
                Close
              </button>
              {!shipDispatched && (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => setShipDispatched(true)}
                >
                  <Truck size={13} /> Dispatch Shipment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SUMMARY (A4) MODAL */}
      {showPaymentSummaryModal && (
        <div className="overlay" onClick={() => setShowPaymentSummaryModal(null)} style={{ zIndex: 1200 }}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Payment Summary (A4) — {showPaymentSummaryModal.invoiceNo}</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  type="button" 
                  className="btn btn-sm btn-primary"
                  onClick={() => window.print()}
                >
                  <Printer size={13} /> Print Summary (A4)
                </button>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline"
                  onClick={() => setShowPaymentSummaryModal(null)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div style={{ border: '1px solid var(--border)', padding: 24, background: '#fff', borderRadius: 8 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--primary)', paddingBottom: 12, marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
                      {store.tradeName || 'S.B Borana Jewellers'}
                    </h2>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {store.address || '3-5 Niwas, Vile parle east Mumbai'}, {store.city || 'Mumbai'}
                    </div>
                    <div style={{ fontSize: 11 }}>GSTIN: <strong>{store.gstin || '27ACZPJ7126B1ZA'}</strong></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>PAYMENT SUMMARY</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>Invoice #: {showPaymentSummaryModal.invoiceNo}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Date: {showPaymentSummaryModal.invoiceDate}</div>
                  </div>
                </div>

                {/* Customer */}
                <div style={{ background: 'var(--bg)', padding: 12, borderRadius: 6, marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Customer: {showPaymentSummaryModal.customer.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    Mobile: {showPaymentSummaryModal.customer.mobile || showPaymentSummaryModal.customer.phone || 'N/A'} · City: {showPaymentSummaryModal.customer.city || 'Mumbai'}
                  </div>
                </div>

                {/* Payments Table */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 8, letterSpacing: '0.04em' }}>
                    RECORDED RECEIPTS & SETTLEMENTS
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 10px' }}>Receipt #</th>
                        <th style={{ padding: '8px 10px' }}>Date</th>
                        <th style={{ padding: '8px 10px' }}>Mode</th>
                        <th style={{ padding: '8px 10px' }}>Reference / UTR</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount Paid (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showPaymentSummaryModal.payments || [
                        { receiptNo: 'PAY-2026-00001', date: showPaymentSummaryModal.invoiceDate, mode: 'CASH', amount: 10000 },
                        { receiptNo: 'PAY-2026-00002', date: showPaymentSummaryModal.invoiceDate, mode: 'UPI', referenceNo: '898976765454', amount: 100000 }
                      ]).map((p: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 600 }}>{p.receiptNo || `PAY-00${i+1}`}</td>
                          <td style={{ padding: '8px 10px' }}>{p.date || showPaymentSummaryModal.invoiceDate}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 600 }}>{String(p.mode).toUpperCase()}</td>
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{p.referenceNo || 'Counter MAIN'}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                            ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Balance Summary Box */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <div style={{ width: 280, border: '1px solid var(--border)', borderRadius: 6, padding: 12, background: 'var(--bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span>Invoice Total:</span>
                      <strong>₹{(showPaymentSummaryModal.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--success)' }}>
                      <span>Total Paid / Settled:</span>
                      <strong>₹{(showPaymentSummaryModal.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '2px solid var(--border)', fontSize: 14 }}>
                      <span style={{ fontWeight: 700 }}>Balance Outstanding:</span>
                      <strong style={{ color: (showPaymentSummaryModal.balanceDue || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        ₹{(showPaymentSummaryModal.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--muted)' }}>
                  <div>Prepared by: Cashier / Admin</div>
                  <div>Authorized Signatory: _________________________</div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowPaymentSummaryModal(null)}
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


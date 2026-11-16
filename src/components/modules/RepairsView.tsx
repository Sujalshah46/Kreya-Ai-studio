import type { PaymentTransaction } from '../../types';
import React, { useState, useEffect } from 'react';
import { 
  Wrench, Plus, Search, Printer, FileText, CheckCircle2, 
  Clock, Check, X, ShieldCheck, User, Sparkles, AlertCircle,
  Calendar, Phone, DollarSign, ArrowRight, RefreshCw, ChevronRight, Scale, Eye, Edit3
} from 'lucide-react';
import { RepairOrder, Customer, StoreProfile, RepairStatus, PaymentMode, MetalGroup, RepairItem } from '../../types';

export interface RepairsViewProps {
  store: StoreProfile;
  repairs: RepairOrder[];
  customers: Customer[];
  onSaveRepair: (repair: RepairOrder) => void;
  onUpdateRepairStatus: (repairId: string, status: RepairStatus, payment?: PaymentTransaction) => void;
}

interface NewRepairItemRow {
  id?: string;
  description: string;
  issueType: string;
  selectedIssues: string[];
  metal: MetalGroup;
  itemType: string;
  grossWeightTaken: string;
  quantity: number;
  estimatedCost: string;
  conditionNotes: string;
  accessories: string;
  specialNotes?: string;
  itemStatus?: 'pending' | 'delivered' | 'cancelled';
  deliveryDate?: string;
}

const REPAIR_STATUS_STEPS: { key: RepairStatus; label: string; badge: string; desc: string }[] = [
  { key: 'RECEIVED', label: 'Received', badge: 'badge-blue', desc: 'Intake logged & item custody verified' },
  { key: 'ESTIMATED', label: 'Estimated', badge: 'badge-yellow', desc: 'Labour & metal cost estimated' },
  { key: 'IN_WORKSHOP', label: 'In Workshop', badge: 'badge-orange', desc: 'Assigned to karigar bench for repair' },
  { key: 'QC_READY', label: 'QC Ready', badge: 'badge-purple', desc: 'Polished, cleaned & quality checked' },
  { key: 'DELIVERED', label: 'Delivered', badge: 'badge-green', desc: 'Handed over to customer with payment settled' }
];

const normalizeRepairStatus = (st: string): { key: RepairStatus; rawKey: string; label: string; badge: string; stepIdx: number } => {
  const s = String(st || '').toUpperCase();
  if (s === 'RECEIVED') return { key: 'received', rawKey: 'received', label: 'Received', badge: 'badge-blue', stepIdx: 0 };
  if (s === 'ESTIMATED') return { key: 'ESTIMATED', rawKey: 'estimated', label: 'Estimated', badge: 'badge-yellow', stepIdx: 1 };
  if (s === 'IN_WORKSHOP' || s === 'IN_PROGRESS' || s === 'ASSIGNED_KARIGAR') {
    return { key: 'in_progress', rawKey: 'in_progress', label: 'In Progress', badge: 'badge-yellow', stepIdx: 2 };
  }
  if (s === 'QC_READY' || s === 'QC_PASSED' || s === 'READY') {
    return { key: 'ready', rawKey: 'ready', label: 'Ready', badge: 'badge-purple', stepIdx: 3 };
  }
  if (s === 'DELIVERED') return { key: 'delivered', rawKey: 'delivered', label: 'Delivered', badge: 'badge-green', stepIdx: 4 };
  if (s === 'CANCELLED') return { key: 'cancelled', rawKey: 'cancelled', label: 'Cancelled', badge: 'badge-gray', stepIdx: -1 };
  return { key: 'received', rawKey: 'received', label: 'Received', badge: 'badge-blue', stepIdx: 0 };
};

const DEFAULT_SAMPLE_REPAIRS: RepairOrder[] = [
  {
    id: "rep-2026-00001",
    repairNo: "REP-2026-00001",
    receiptNo: "RR-2026-0001",
    serviceInvoiceNo: "RS/26-27/0001",
    customer: {
      id: "cust-pakshal-01",
      code: "CUST-00001",
      name: "Pakshal",
      mobile: "9876543210",
      phone: "9876543210",
      email: "pakshaljain@gmail.com",
      address: "Mumbai",
      city: "Mumbai",
      state: "Maharashtra",
      stateCode: "27",
      customerType: "retail"
    },
    receivedDate: "2026-11-15",
    promiseDate: "2026-11-18",
    technicianName: "Ramesh Karigar",
    status: "received",
    items: [
      {
        id: "rep-item-1",
        description: "Antique Kada lock soldering & ultrasonic rhodium polish",
        issueType: "Broken clasp & re-polishing",
        metal: "GOLD",
        itemType: "Kada",
        grossWeightTaken: 25.500,
        quantity: 1,
        estimatedCost: 1500,
        conditionNotes: "Loose clasp, minor surface scratches",
        accessories: "Red velvet pouch",
        itemStatus: "pending"
      }
    ],
    totalCost: 1500,
    advancePaid: 0,
    balanceDue: 1500,
    hsnSacCode: "998722",
    payments: []
  },
  {
    id: 'rep-001',
    repairNo: 'REP-2026-00053',
    receiptNo: 'RR-2026-0010',
    serviceInvoiceNo: 'RS/26-27/0010',
    customer: {
      id: 'cust-101',
      code: 'CUST-00101',
      name: 'Amita G',
      phone: '9738315315',
      mobile: '9738315315',
      address: 'Sector Alpha 1, Greater Noida',
      state: 'Uttar Pradesh',
      stateCode: '09'
    },
    receivedDate: '2026-11-12',
    promiseDate: '2026-11-16',
    technicianName: 'Ramesh Karigar (Bench)',
    status: 'in_progress',
    items: [
      {
        id: 'ri-101',
        description: 'Silver Payal Link Solder & Buffing',
        issueType: 'Polish & Solder',
        metal: 'SILVER',
        itemType: 'Anklet',
        grossWeightTaken: 12.500,
        quantity: 1,
        estimatedCost: 350,
        conditionNotes: 'Pre-existing link crack near S-hook',
        itemStatus: 'pending'
      }
    ],
    totalCost: 350,
    advancePaid: 100,
    balanceDue: 250,
    hsnSacCode: '998722',
    payments: [
      {
        id: 'pay-001',
        receiptNo: 'REC-RR-10',
        date: '2026-11-12',
        amount: 100,
        mode: 'CASH',
        collectorName: 'Front Desk'
      }
    ]
  },
  {
    id: 'rep-002',
    repairNo: 'REP-2026-00054',
    receiptNo: 'RR-2026-0011',
    serviceInvoiceNo: 'RS/26-27/0011',
    customer: {
      id: 'cust-102',
      code: 'CUST-00102',
      name: 'Sunita Sharma',
      phone: '9810554433',
      mobile: '9810554433',
      address: 'Beta 2, Greater Noida',
      state: 'Uttar Pradesh',
      stateCode: '09'
    },
    receivedDate: '2026-11-14',
    promiseDate: '2026-11-17',
    technicianName: 'Suresh Goldsmith (Setting)',
    status: 'ready',
    items: [
      {
        id: 'ri-102',
        description: '22K Gold Ring Prong Tightening & Rhodium',
        issueType: 'Prong & Rhodium',
        metal: 'GOLD',
        itemType: 'Ring',
        grossWeightTaken: 4.850,
        quantity: 1,
        estimatedCost: 650,
        conditionNotes: 'Loose center cubic zirconia stone',
        itemStatus: 'pending'
      }
    ],
    totalCost: 650,
    advancePaid: 650,
    balanceDue: 0,
    hsnSacCode: '998722',
    payments: [
      {
        id: 'pay-002',
        receiptNo: 'REC-RR-11',
        date: '2026-11-14',
        amount: 650,
        mode: 'UPI',
        collectorName: 'Front Desk'
      }
    ]
  }
];

export const RepairsView: React.FC<RepairsViewProps> = ({
  store,
  repairs: propRepairs,
  customers,
  onSaveRepair,
  onUpdateRepairStatus
}) => {
  // Use propRepairs or fallback to default sample repairs
  const repairs = propRepairs && propRepairs.length > 0 ? propRepairs : DEFAULT_SAMPLE_REPAIRS;
  const [selectedRepair, setSelectedRepair] = useState<RepairOrder | null>(repairs[0] || null);

  useEffect(() => {
    if (selectedRepair) {
      const found = repairs.find(r => r.id === selectedRepair.id);
      if (found) {
        setSelectedRepair(found);
      }
    } else if (repairs.length > 0) {
      setSelectedRepair(repairs[0]);
    }
  }, [repairs]);

  // Modals visibility
  const [showNewRepairModal, setShowNewRepairModal] = useState(false);
  const [isModifyMode, setIsModifyMode] = useState(false);
  const [editingRepairId, setEditingRepairId] = useState<string | null>(null);
  const [editingRepairNo, setEditingRepairNo] = useState<string>('');

  const [showViewModal, setShowViewModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showServiceInvoiceModal, setShowServiceInvoiceModal] = useState(false);
  const [showDeliverItemModal, setShowDeliverItemModal] = useState(false);
  const [itemToDeliver, setItemToDeliver] = useState<RepairItem | null>(null);

  // Receipt format (80mm Thermal Slip vs A6 Voucher) & Copy (Customer vs Workshop)
  const [receiptFormat, setReceiptFormat] = useState<'80mm' | 'a6'>('80mm');
  const [receiptCopyType, setReceiptCopyType] = useState<'customer' | 'workshop'>('customer');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Payment collection state inside View Modal
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMode, setCollectMode] = useState<PaymentMode>('CASH');
  const [collectRef, setCollectRef] = useState('');
  const [collectNote, setCollectNote] = useState('');

  // Deliver Item modal state
  const [deliverDate, setDeliverDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliverCollectAmount, setDeliverCollectAmount] = useState('');
  const [deliverCollectMode, setDeliverCollectMode] = useState<PaymentMode>('CASH');
  const [deliverCollectRef, setDeliverCollectRef] = useState('');

  // New / Modify Repair Form State
  const [custSearchTerm, setCustSearchTerm] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [promiseDate, setPromiseDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [technicianName, setTechnicianName] = useState('Ramesh Karigar (Bench)');
  const [formStatus, setFormStatus] = useState<string>('received');
  const [advancePaid, setAdvancePaid] = useState('0');
  const [advanceMode, setAdvanceMode] = useState<PaymentMode>('CASH');
  const [advanceRef, setAdvanceRef] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const availableIssues = [
    'soldering',
    'resizing',
    'stone fixing',
    'polishing',
    'rhodium',
    'prong tightening',
    'laser welding'
  ];

  const defaultNewItemRow: NewRepairItemRow = {
    description: '',
    issueType: 'soldering, polishing',
    selectedIssues: ['soldering', 'polishing'],
    metal: 'GOLD',
    itemType: 'Ring',
    grossWeightTaken: '',
    quantity: 1,
    estimatedCost: '',
    conditionNotes: '',
    accessories: '',
    specialNotes: '',
    itemStatus: 'pending'
  };

  const [items, setItems] = useState<NewRepairItemRow[]>([{ ...defaultNewItemRow }]);

  const handleOpenNewRepair = () => {
    setIsModifyMode(false);
    setEditingRepairId(null);
    setEditingRepairNo('');
    setCustSearchTerm('');
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerMobile('');
    setReceivedDate(new Date().toISOString().slice(0, 10));
    setPromiseDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setTechnicianName('Ramesh Karigar (Bench)');
    setFormStatus('received');
    setAdvancePaid('0');
    setAdvanceMode('CASH');
    setAdvanceRef('');
    setOrderNotes('');
    setItems([{ ...defaultNewItemRow }]);
    setShowNewRepairModal(true);
  };

  const handleOpenModifyRepair = (r: RepairOrder) => {
    setIsModifyMode(true);
    setEditingRepairId(r.id);
    setEditingRepairNo(r.repairNo);
    setCustSearchTerm('');
    setSelectedCustomerId(r.customer.id || '');
    setCustomerName(r.customer.name);
    setCustomerMobile(r.customer.phone || r.customer.mobile || '');
    setReceivedDate(r.receivedDate);
    setPromiseDate(r.promiseDate || '');
    setTechnicianName(r.technicianName || 'Ramesh Karigar (Bench)');
    setFormStatus(normalizeRepairStatus(r.status).rawKey);
    setAdvancePaid(String(r.advancePaid || 0));
    setAdvanceMode('CASH');
    setAdvanceRef('');
    setOrderNotes(r.notes || '');

    const rowItems: NewRepairItemRow[] = r.items.map(it => ({
      id: it.id,
      description: it.description,
      issueType: it.issueType,
      selectedIssues: it.issueType.split(',').map(s => s.trim().toLowerCase()),
      metal: it.metal,
      itemType: it.itemType || 'Ring',
      grossWeightTaken: String(it.grossWeightTaken || ''),
      quantity: it.quantity || 1,
      estimatedCost: String(it.estimatedCost || ''),
      conditionNotes: it.conditionNotes || '',
      accessories: it.accessories || '',
      specialNotes: it.specialNotes || '',
      itemStatus: it.itemStatus || 'pending',
      deliveryDate: it.deliveryDate
    }));

    setItems(rowItems.length > 0 ? rowItems : [{ ...defaultNewItemRow }]);
    setShowNewRepairModal(true);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        ...defaultNewItemRow
      }
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleUpdateItem = (idx: number, field: keyof NewRepairItemRow, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const toggleIssueCheckbox = (itemIdx: number, issue: string) => {
    const item = items[itemIdx];
    const has = item.selectedIssues.includes(issue);
    const newIssues = has 
      ? item.selectedIssues.filter(i => i !== issue)
      : [...item.selectedIssues, issue];
    
    handleUpdateItem(itemIdx, 'selectedIssues', newIssues);
    handleUpdateItem(itemIdx, 'issueType', newIssues.join(', '));
  };

  const totalEstimatedCost = items.reduce((s, it) => s + (parseFloat(it.estimatedCost) || 0), 0);
  const totalIntakeGrossWeight = items.reduce((s, it) => s + (parseFloat(it.grossWeightTaken) || 0), 0);
  const advAmount = parseFloat(advancePaid) || 0;
  const balanceCalculated = Math.max(0, totalEstimatedCost - advAmount);

  const handleCustomerSelect = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setCustomerName(cust.name);
    setCustomerMobile(cust.phone || cust.mobile || '');
    setShowCustDropdown(false);
  };

  const filteredCustomers = customers.filter(c => {
    if (!custSearchTerm.trim()) return true;
    const term = custSearchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || (c.phone || c.mobile || '').includes(term);
  });

  const handleSaveRepairForm = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Customer validation
    if (!customerName.trim()) {
      showToast('Customer name required', 'error');
      return;
    }

    // 2. Items validations: description and gross weight > 0
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description.trim()) {
        showToast(`Item #${i + 1}: Description is required`, 'error');
        return;
      }
      const wt = parseFloat(it.grossWeightTaken);
      if (isNaN(wt) || wt <= 0) {
        showToast(`Item #${i + 1}: Gross weight must be greater than 0`, 'error');
        return;
      }
    }

    // 3. Promise date validation
    if (!promiseDate) {
      showToast('Promised delivery date is required', 'error');
      return;
    }

    const cust: Customer = customers.find(c => c.id === selectedCustomerId) || {
      id: selectedCustomerId || `cust-${Date.now()}`,
      code: `CUST-00${Math.floor(100 + Math.random() * 900)}`,
      name: customerName,
      phone: customerMobile,
      mobile: customerMobile,
      address: 'Walk-in Customer, Local Area',
      state: store.state || 'Maharashtra',
      stateCode: store.stateCode || '27'
    };

    const repairItems: RepairItem[] = items.map((it, idx) => ({
      id: it.id || `ri-${Date.now()}-${idx}`,
      description: it.description,
      issueType: it.issueType || 'General Service',
      metal: it.metal,
      itemType: it.itemType || 'Ring',
      grossWeightTaken: parseFloat(it.grossWeightTaken) || 0,
      quantity: it.quantity || 1,
      estimatedCost: parseFloat(it.estimatedCost) || 0,
      conditionNotes: it.conditionNotes,
      accessories: it.accessories,
      specialNotes: it.specialNotes,
      itemStatus: it.itemStatus || 'pending',
      deliveryDate: it.deliveryDate
    }));

    if (isModifyMode && editingRepairId) {
      const existing = repairs.find(r => r.id === editingRepairId);
      const updatedRepair: RepairOrder = {
        id: editingRepairId,
        repairNo: editingRepairNo || existing?.repairNo || 'REP-2026-00001',
        receiptNo: existing?.receiptNo || 'RR-2026-0001',
        serviceInvoiceNo: existing?.serviceInvoiceNo || `RS/26-27/${String(repairs.length + 1).padStart(4, '0')}`,
        customer: cust,
        receivedDate,
        promiseDate,
        technicianName,
        status: (formStatus as RepairStatus) || 'received',
        items: repairItems,
        totalCost: totalEstimatedCost,
        advancePaid: advAmount,
        balanceDue: balanceCalculated,
        hsnSacCode: '998722',
        payments: existing?.payments || [],
        notes: orderNotes
      };

      onSaveRepair(updatedRepair);
      setSelectedRepair(updatedRepair);
      setShowNewRepairModal(false);
      showToast('Repair updated!', 'success');
      return;
    }

    // Sequence calculation
    const nextSeq = repairs.length + 1;
    const repairNum = `REP-2026-${String(nextSeq).padStart(5, '0')}`;
    const receiptNum = `RR-2026-${String(nextSeq).padStart(4, '0')}`;
    const invoiceNum = `RS/26-27/${String(nextSeq).padStart(4, '0')}`;

    const newRepair: RepairOrder = {
      id: `rep-${Date.now()}`,
      repairNo: repairNum,
      receiptNo: receiptNum,
      serviceInvoiceNo: invoiceNum,
      customer: cust,
      receivedDate,
      promiseDate,
      technicianName,
      status: (formStatus as RepairStatus) || 'received',
      items: repairItems,
      totalCost: totalEstimatedCost,
      advancePaid: advAmount,
      balanceDue: balanceCalculated,
      hsnSacCode: '998722',
      notes: orderNotes,
      payments: advAmount > 0 ? [
        {
          id: `p-${Date.now()}`,
          receiptNo: `PAY-${receiptNum}`,
          date: receivedDate,
          amount: advAmount,
          mode: advanceMode,
          referenceNo: advanceRef || undefined,
          collectorName: 'Front Desk Counter'
        }
      ] : []
    };

    onSaveRepair(newRepair);
    setSelectedRepair(newRepair);
    setShowNewRepairModal(false);
    showToast(`Repair ${repairNum} saved!`, 'success');

    // Prompt receipt generation
    setTimeout(() => {
      setShowReceiptModal(true);
    }, 400);
  };

  const handleStatusChange = (repairId: string, newStatus: RepairStatus) => {
    onUpdateRepairStatus(repairId, newStatus);
    if (selectedRepair && selectedRepair.id === repairId) {
      setSelectedRepair({
        ...selectedRepair,
        status: newStatus
      });
    }
    showToast(`Status → ${newStatus}`, 'info');
  };

  const handleOpenViewModal = (repair: RepairOrder) => {
    setSelectedRepair(repair);
    setCollectAmount(String(repair.balanceDue || 0));
    setCollectMode('CASH');
    setCollectRef('');
    setCollectNote('');
    setShowViewModal(true);
  };

  const handleConfirmViewPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair) return;
    const amount = Number(collectAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    if (amount > selectedRepair.balanceDue) {
      showToast(`Cannot collect more than balance due (₹${selectedRepair.balanceDue.toLocaleString('en-IN')})`, 'error');
      return;
    }

    const newBal = Math.max(0, Math.round((selectedRepair.balanceDue - amount) * 100) / 100);
    const newStatus: RepairStatus = newBal === 0 ? 'ready' : selectedRepair.status;
    const paymentId = `pay-rec-${Date.now()}`;
    const payment: PaymentTransaction = {
      id: paymentId,
      receiptNo: 'REC-' + paymentId.slice(-6).toUpperCase(),
      date: new Date().toISOString().slice(0, 10),
      amount,
      mode: collectMode,
      referenceNo: collectRef || undefined,
      notes: collectNote || undefined,
      collectorName: 'Admin Counter'
    };

    onUpdateRepairStatus(selectedRepair.id, newStatus, payment);
    const updated: RepairOrder = {
      ...selectedRepair,
      advancePaid: Math.round((selectedRepair.advancePaid + amount) * 100) / 100,
      balanceDue: newBal,
      status: newStatus,
      payments: [...selectedRepair.payments, payment]
    };

    setSelectedRepair(updated);
    setCollectAmount(String(newBal));
    setCollectRef('');
    setCollectNote('');
    showToast('Payment recorded!', 'success');
  };

  const handleOpenDeliverItem = (item: RepairItem) => {
    if (!selectedRepair) return;
    setItemToDeliver(item);
    setDeliverDate(new Date().toISOString().slice(0, 10));
    const isBalance = selectedRepair.balanceDue > 0;
    setDeliverCollectAmount(isBalance ? String(item.estimatedCost) : '0');
    setDeliverCollectMode('CASH');
    setDeliverCollectRef('');
    setShowDeliverItemModal(true);
  };

  const handleConfirmDeliverItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair || !itemToDeliver) return;

    const paymentAmt = parseFloat(deliverCollectAmount) || 0;
    if (paymentAmt > selectedRepair.balanceDue) {
      showToast(`Cannot collect more than balance due (₹${selectedRepair.balanceDue.toLocaleString('en-IN')})`, 'error');
      return;
    }

    const updatedItems = selectedRepair.items.map(it => {
      if (it.id === itemToDeliver.id) {
        return {
          ...it,
          itemStatus: 'delivered' as const,
          deliveryDate: deliverDate
        };
      }
      return it;
    });

    const allDelivered = updatedItems.every(it => it.itemStatus === 'delivered');
    const newBal = Math.max(0, Math.round((selectedRepair.balanceDue - paymentAmt) * 100) / 100);
    const finalStatus: RepairStatus = allDelivered && newBal === 0 ? 'delivered' : selectedRepair.status;

    let updatedPayments = [...selectedRepair.payments];
    if (paymentAmt > 0) {
      const pid = `pay-del-${Date.now()}`;
      const payment: PaymentTransaction = {
        id: pid,
        receiptNo: 'REC-' + pid.slice(-6).toUpperCase(),
        date: deliverDate,
        amount: paymentAmt,
        mode: deliverCollectMode,
        referenceNo: deliverCollectRef || undefined,
        collectorName: 'Admin Counter'
      };
      updatedPayments.push(payment);
      onUpdateRepairStatus(selectedRepair.id, finalStatus, payment);
    } else {
      onUpdateRepairStatus(selectedRepair.id, finalStatus);
    }

    const updatedRepair: RepairOrder = {
      ...selectedRepair,
      status: finalStatus,
      items: updatedItems,
      advancePaid: Math.round((selectedRepair.advancePaid + paymentAmt) * 100) / 100,
      balanceDue: newBal,
      payments: updatedPayments
    };

    onSaveRepair(updatedRepair);
    setSelectedRepair(updatedRepair);
    setShowDeliverItemModal(false);
    setItemToDeliver(null);
    showToast(`"${itemToDeliver.description}" marked delivered!`, 'success');
  };

  // Filtered repairs
  const filteredRepairs = repairs.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q ||
      r.repairNo.toLowerCase().includes(q) ||
      (r.receiptNo && r.receiptNo.toLowerCase().includes(q)) ||
      r.customer.name.toLowerCase().includes(q) ||
      (r.customer.phone || r.customer.mobile || '').includes(q) ||
      (r.technicianName && r.technicianName.toLowerCase().includes(q)) ||
      r.items.some(it => it.description.toLowerCase().includes(q) || it.issueType.toLowerCase().includes(q));

    const norm = normalizeRepairStatus(r.status);
    const matchesStatus = statusFilter === 'all' || norm.key === statusFilter || norm.rawKey === statusFilter || r.status === statusFilter;
    const matchesFrom = !fromDate || r.receivedDate >= fromDate;
    const matchesTo = !toDate || r.receivedDate <= toDate;

    return matchesQ && matchesStatus && matchesFrom && matchesTo;
  });

  // KPI aggregates
  const totalRepairsCount = repairs.length;
  const inWorkshopCount = repairs.filter(r => {
    const k = normalizeRepairStatus(r.status).rawKey;
    return k === 'received' || k === 'estimated' || k === 'in_progress';
  }).length;
  const readyCount = repairs.filter(r => normalizeRepairStatus(r.status).rawKey === 'ready').length;
  const deliveredCount = repairs.filter(r => normalizeRepairStatus(r.status).rawKey === 'delivered').length;
  const totalBalanceCollectible = repairs.reduce((s, r) => s + (r.balanceDue || 0), 0);
  const totalRevenue = repairs.reduce((s, r) => s + (r.totalCost || 0), 0);

  return (
    <div className="page" style={{ padding: 0 }}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div 
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: '10px 18px',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            background: toastMessage.type === 'error' ? 'var(--danger, #dc2626)' : toastMessage.type === 'info' ? 'var(--info, #2563eb)' : 'var(--success, #16a34a)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeIn 0.2s ease-in-out'
          }}
        >
          {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{toastMessage.text}</span>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: 8 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Repair Orders</h1>
          <p>Custody intake weight verification · Issue checklist · Karigar workshop assignment · Status progression</p>
        </div>
        <div className="btn-group">
          <button 
            type="button"
            className="btn btn-primary"
            onClick={handleOpenNewRepair}
          >
            <Plus size={14} />
            <span>New Repair</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Boxes */}
      <div className="sum-grid">
        <div className="sum-box">
          <div className="sum-val font-mono">{totalRepairsCount}</div>
          <div className="sum-lbl">Total Repairs</div>
          <div className="helper">₹{totalRevenue.toLocaleString('en-IN')} service value</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--warn)' }}>{inWorkshopCount}</div>
          <div className="sum-lbl">Active in Pipeline</div>
          <div className="helper">Received / Workshop bench</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--info)' }}>{readyCount}</div>
          <div className="sum-lbl">QC Ready</div>
          <div className="helper">Passed inspection, ready for pickup</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--danger)' }}>
            ₹{totalBalanceCollectible.toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Balance Collectible</div>
          <div className="helper">Due upon delivery ({deliveredCount} delivered)</div>
        </div>
      </div>

      {/* Filter Row with Search & Progression Tabs */}
      <div className="search-row" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
          <Search size={16} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Repair No, Customer Name, Mobile..."
          />
        </div>
        <input 
          type="date"
          className="input input-sm"
          style={{ width: 'auto' }}
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          title="From Date"
        />
        <input 
          type="date"
          className="input input-sm"
          style={{ width: 'auto' }}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          title="To Date"
        />
        <button 
          type="button" 
          className="btn btn-outline btn-sm"
          onClick={() => {}}
          title="Search repairs"
        >
          <Search size={14} /> Search
        </button>
        <button 
          type="button" 
          className="btn btn-outline btn-sm"
          onClick={() => {
            setSearchQuery('');
            setFromDate('');
            setToDate('');
            setStatusFilter('all');
          }}
          title="Clear search and filters"
        >
          Clear
        </button>

        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'received', label: 'Received' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'ready', label: 'Ready' },
            { id: 'delivered', label: 'Delivered' }
          ].map(st => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id)}
              className={`tab ${statusFilter === st.id ? 'active' : ''}`}
              style={{ padding: '6px 12px', fontSize: 12.5 }}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Selected Order Status Stepper */}
      {selectedRepair && (
        <div className="card" style={{ marginBottom: 12, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 14 }}>{selectedRepair.repairNo}</span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>· {selectedRepair.customer.name} ({selectedRepair.customer.phone || selectedRepair.customer.mobile})</span>
              <span className={`badge ${normalizeRepairStatus(selectedRepair.status).badge}`}>
                {normalizeRepairStatus(selectedRepair.status).label}
              </span>
            </div>

            {/* Interactive Progression Tracker & Quick Slip Access */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginRight: 4 }}>STATUS PROGRESSION:</span>
                {REPAIR_STATUS_STEPS.map((step, sIdx) => {
                  const curNorm = normalizeRepairStatus(selectedRepair.status);
                  const isActive = curNorm.stepIdx === sIdx;
                  const isPassed = curNorm.stepIdx > sIdx;

                  return (
                    <button
                      key={step.key}
                      type="button"
                      onClick={() => handleStatusChange(selectedRepair.id, step.key)}
                      className="btn btn-xs"
                      style={{
                        background: isActive ? 'var(--primary)' : isPassed ? 'var(--success-l)' : 'var(--bg)',
                        color: isActive ? '#fff' : isPassed ? 'var(--success)' : 'var(--muted)',
                        border: isActive ? '1px solid var(--primary)' : isPassed ? '1px solid var(--success)' : '1px solid var(--border)',
                        fontWeight: isActive ? 700 : 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title={step.desc}
                    >
                      {isPassed ? '✓ ' : `${sIdx + 1}. `}{step.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid var(--border)', paddingLeft: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => setShowReceiptModal(true)}
                  title="Print Repair Job Card / Custody Token Slip"
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Printer size={12} />
                  <span>Job Card Slip</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-xs"
                  onClick={() => setShowServiceInvoiceModal(true)}
                  title="Print GST Service Tax Invoice (SAC 998722)"
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <FileText size={12} />
                  <span>GST Invoice (SAC 998722)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <span className="card-title">Repair Orders</span>
            <span className="helper" style={{ marginLeft: 8, display: 'inline' }}>
              SAC 998722 · 18% GST Service Maintenance
            </span>
          </div>
          <span className="badge badge-gold">Active Workshop Ledger</span>
        </div>

        <div className="tbl-wrap">
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ width: 120 }}>Repair No</th>
                <th style={{ width: 100 }}>Receipt No</th>
                <th>Customer</th>
                <th style={{ width: 110 }}>Phone</th>
                <th style={{ textAlign: 'right', width: 95 }}>Cost</th>
                <th style={{ textAlign: 'right', width: 90 }}>Paid</th>
                <th style={{ textAlign: 'right', width: 95 }}>Balance</th>
                <th style={{ width: 100 }}>Received</th>
                <th style={{ width: 100 }}>Promise</th>
                <th style={{ textAlign: 'center', width: 115 }}>Status</th>
                <th style={{ textAlign: 'right', width: 155 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty">
                    No repair orders found
                  </td>
                </tr>
              ) : (
                filteredRepairs.map((r) => {
                  const isSelected = selectedRepair?.id === r.id;
                  const norm = normalizeRepairStatus(r.status);

                  return (
                    <tr 
                      key={r.id} 
                      onClick={() => setSelectedRepair(r)}
                      style={{ cursor: 'pointer', background: isSelected ? 'var(--row-hover)' : undefined }}
                    >
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--text)' }}>
                        {r.repairNo}
                      </td>
                      <td className="font-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {r.receiptNo || '—'}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.customer.name}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                          {r.customer.phone || r.customer.mobile || '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                        ₹{r.totalCost.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }} className="font-mono amt-green">
                        ₹{r.advancePaid.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                        {r.balanceDue > 0 ? (
                          <span style={{ color: 'var(--danger)' }} className="amt-red">
                            ₹{r.balanceDue.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--success)' }} className="amt-green">
                            NIL
                          </span>
                        )}
                      </td>
                      <td className="font-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {r.receivedDate}
                      </td>
                      <td className="font-mono" style={{ fontSize: 12, color: r.promiseDate && r.promiseDate < new Date().toISOString().slice(0, 10) && norm.rawKey !== 'delivered' ? 'var(--danger)' : undefined }}>
                        {r.promiseDate || '—'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <select
                          value={norm.rawKey}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(r.id, e.target.value as RepairStatus)}
                          className={`badge ${norm.badge}`}
                          style={{ cursor: 'pointer', border: 'none', outline: 'none' }}
                        >
                          <option value="received">received</option>
                          <option value="in_progress">in_progress</option>
                          <option value="ready">ready</option>
                          <option value="delivered">delivered</option>
                          <option value="cancelled">cancelled</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="btn-group" style={{ justifyContent: 'flex-end', gap: 4 }}>
                          {/* 1. View button */}
                          <button
                            type="button"
                            className="btn btn-xs btn-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenViewModal(r);
                            }}
                            title="View details"
                          >
                            <Eye size={10} />
                          </button>

                          {/* 2. Reprint receiving receipt */}
                          {norm.rawKey !== 'cancelled' && (
                            <button
                              type="button"
                              className="btn btn-xs btn-outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRepair(r);
                                setShowReceiptModal(true);
                              }}
                              title={r.receiptNo ? `Reprint receiving receipt ${r.receiptNo}` : 'Print receiving receipt'}
                            >
                              <Printer size={10} />
                            </button>
                          )}

                          {/* 3. Modify button */}
                          {!['delivered', 'cancelled'].includes(norm.rawKey) && (
                            <button
                              type="button"
                              className="btn btn-xs btn-outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModifyRepair(r);
                              }}
                              title="Modify Repair"
                            >
                              <Edit3 size={10} />
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
            Showing {filteredRepairs.length} of {repairs.length} repair orders · Balance: ₹{totalBalanceCollectible.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* --- NEW / MODIFY REPAIR ORDER MODAL --- */}
      {showNewRepairModal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewRepairModal(false); }}>
          <form onSubmit={handleSaveRepairForm} className="modal modal-lg">
            <div className="modal-head">
              <div>
                <span className="card-title">
                  {isModifyMode ? `Modify Repair #${editingRepairNo}` : 'New Repair Order'}
                </span>
                <div className="helper">Intake custody weight verification · Issue checklist · Karigar workshop assignment</div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowNewRepairModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Customer Search Auto-complete Dropdown */}
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={custSearchTerm}
                  onChange={(e) => {
                    setCustSearchTerm(e.target.value);
                    setShowCustDropdown(true);
                  }}
                  onFocus={() => setShowCustDropdown(true)}
                  placeholder="Search customer by name or mobile..."
                  className="input"
                />
                {showCustDropdown && custSearchTerm.trim() && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      maxHeight: 180,
                      overflowY: 'auto',
                      zIndex: 100
                    }}
                  >
                    {filteredCustomers.length === 0 ? (
                      <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--muted)' }}>No customers found</div>
                    ) : (
                      filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleCustomerSelect(c)}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid var(--border)',
                            fontSize: 12.5
                          }}
                        >
                          <strong>{c.name}</strong>
                          <span style={{ color: 'var(--muted)' }}>{c.phone || c.mobile}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Customer Name & Phone */}
              <div className="g2">
                <div className="form-group">
                  <label className="label">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Customer full name"
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Phone</label>
                  <input 
                    type="text"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="input"
                    placeholder="10-digit mobile"
                  />
                </div>
              </div>

              {/* Advance Paid, Technician & Status */}
              <div className="g3">
                <div className="form-group">
                  <label className="label">Advance Paid (₹)</label>
                  <input 
                    type="number"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value)}
                    className="input font-mono"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Technician</label>
                  <input 
                    type="text"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    placeholder="Karigar name"
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="input"
                  >
                    <option value="received">received</option>
                    <option value="in_progress">in_progress</option>
                    <option value="partially_paid">partially_paid</option>
                    <option value="ready">ready</option>
                    <option value="delivered">delivered</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </div>
              </div>

              {/* Received Date & Promise Date */}
              <div className="g2">
                <div className="form-group">
                  <label className="label">Received Date</label>
                  <input 
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="input"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Promise Date</label>
                  <input 
                    type="date"
                    value={promiseDate}
                    onChange={(e) => setPromiseDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="section-divider">Repair Items &amp; Costs</div>
              <datalist id="repair-item-types-list">
                {['Ring', 'Chain', 'Necklace', 'Bracelet', 'Bangle', 'Earring', 'Pendant', 'Anklet', 'Mangalsutra', 'Nose pin', 'Watch', 'Other'].map(t => (
                  <option key={t} value={t} />
                ))}
              </datalist>

              {/* Items List */}
              {items.map((item, idx) => (
                <div key={idx} style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>
                      Item #{idx + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="btn btn-xs btn-danger"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="g2">
                    <div className="form-group">
                      <label className="label">Description *</label>
                      <input 
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        placeholder="e.g. Gold chain link repair"
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Issue Type</label>
                      <input 
                        type="text"
                        value={item.issueType}
                        onChange={(e) => handleUpdateItem(idx, 'issueType', e.target.value)}
                        placeholder="e.g. Broken link, Polish"
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Common Issue Checklist Chips */}
                  <div style={{ marginTop: 4, marginBottom: 8 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {availableIssues.map(issue => {
                        const isChecked = item.selectedIssues.includes(issue);
                        return (
                          <button
                            type="button"
                            key={issue}
                            onClick={() => toggleIssueCheckbox(idx, issue)}
                            className="btn btn-xs"
                            style={{
                              background: isChecked ? 'var(--primary)' : 'var(--surface)',
                              color: isChecked ? '#fff' : 'var(--text)',
                              border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)',
                              fontSize: 11
                            }}
                          >
                            {isChecked ? '✓ ' : '+ '}{issue}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="g3">
                    <div className="form-group">
                      <label className="label">Metal Type</label>
                      <select
                        value={item.metal.toLowerCase()}
                        onChange={(e) => handleUpdateItem(idx, 'metal', e.target.value.toUpperCase() as MetalGroup)}
                        className="input"
                      >
                        <option value="gold">Gold</option>
                        <option value="silver">Silver</option>
                        <option value="platinum">Platinum</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="label">Weight (g) *</label>
                      <input 
                        type="number"
                        step="0.001"
                        required
                        value={item.grossWeightTaken}
                        onChange={(e) => handleUpdateItem(idx, 'grossWeightTaken', e.target.value)}
                        className="input font-mono"
                        placeholder="0.000"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Repair Cost (₹)</label>
                      <input 
                        type="number"
                        value={item.estimatedCost}
                        onChange={(e) => handleUpdateItem(idx, 'estimatedCost', e.target.value)}
                        className="input font-mono"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="g3">
                    <div className="form-group">
                      <label className="label">Item Type</label>
                      <input 
                        type="text"
                        list="repair-item-types-list"
                        value={item.itemType}
                        onChange={(e) => handleUpdateItem(idx, 'itemType', e.target.value)}
                        placeholder="Ring, Chain…"
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Quantity</label>
                      <input 
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="input font-mono"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Accessories received</label>
                      <input 
                        type="text"
                        value={item.accessories}
                        onChange={(e) => handleUpdateItem(idx, 'accessories', e.target.value)}
                        placeholder="e.g. box, pouch"
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="g2">
                    <div className="form-group">
                      <label className="label">Condition at receiving</label>
                      <input 
                        type="text"
                        value={item.conditionNotes}
                        onChange={(e) => handleUpdateItem(idx, 'conditionNotes', e.target.value)}
                        placeholder="Existing damage, scratches, missing stones…"
                        className="input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Special Note / Instructions</label>
                      <input 
                        type="text"
                        value={item.specialNotes || ''}
                        onChange={(e) => handleUpdateItem(idx, 'specialNotes', e.target.value)}
                        placeholder="Any special instruction..."
                        className="input"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="btn btn-outline btn-sm"
                >
                  <Plus size={14} /> Add Item
                </button>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <span className="helper">Gross Weight: <strong>{totalIntakeGrossWeight.toFixed(3)}g</strong></span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>
                    Total Cost: ₹{totalEstimatedCost.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Initial Payment Modes */}
              <div className="section-divider">Initial Payment (optional)</div>
              <div className="form-group">
                <label className="label">Payment Mode</label>
                <div className="pay-modes" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER'] as PaymentMode[]).map(mode => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setAdvanceMode(mode)}
                      className={`btn btn-xs ${advanceMode === mode ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {mode.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {advanceMode !== 'CASH' && advAmount > 0 && (
                <div className="form-group">
                  <label className="label">Reference / UTR no. (optional)</label>
                  <input 
                    type="text"
                    value={advanceRef}
                    onChange={(e) => setAdvanceRef(e.target.value)}
                    placeholder="Optional"
                    className="input"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="label">Notes</label>
                <textarea 
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Any additional instructions..."
                  className="input"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                onClick={() => setShowNewRepairModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                {isModifyMode ? 'Update Repair' : 'Save Repair'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- VIEW REPAIR DETAILS MODAL (m) --- */}
      {showViewModal && selectedRepair && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowViewModal(false); }}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0 }}>Repair #{selectedRepair.repairNo}</h3>
                <span className={`badge ${normalizeRepairStatus(selectedRepair.status).badge}`}>
                  {normalizeRepairStatus(selectedRepair.status).rawKey}
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowViewModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Header Info Cards */}
              <div className="g2" style={{ marginBottom: 14 }}>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{selectedRepair.customer.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    {selectedRepair.customer.phone || selectedRepair.customer.mobile || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    Received: {selectedRepair.receivedDate} | Promise: {selectedRepair.promiseDate || '—'}
                  </div>
                  {selectedRepair.technicianName && (
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      Technician: <strong>{selectedRepair.technicianName}</strong>
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span>Total Cost</span>
                    <strong>₹{selectedRepair.totalCost.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)', marginBottom: 4 }}>
                    <span>Paid</span>
                    <strong className="amt-green">₹{selectedRepair.advancePaid.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: selectedRepair.balanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    <span>Balance</span>
                    <strong className={selectedRepair.balanceDue > 0 ? 'amt-red' : 'amt-green'}>
                      {selectedRepair.balanceDue > 0 ? `₹${selectedRepair.balanceDue.toLocaleString('en-IN')}` : 'NIL'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* REPAIR ITEMS Table */}
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
                REPAIR ITEMS
              </div>
              <div className="tbl-wrap" style={{ marginBottom: 14 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Issue</th>
                      <th>Metal</th>
                      <th>Weight</th>
                      <th>Cost</th>
                      <th>Status</th>
                      <th>Delivered</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRepair.items.map((it, idx) => (
                      <tr 
                        key={it.id || idx}
                        style={{ background: it.itemStatus === 'delivered' ? 'var(--success-l)' : undefined }}
                      >
                        <td style={{ fontWeight: 600 }}>{it.description}</td>
                        <td>{it.issueType || '—'}</td>
                        <td>{it.metal.toLowerCase()}</td>
                        <td className="font-mono">{it.grossWeightTaken.toFixed(3)}g</td>
                        <td className="font-mono">₹{it.estimatedCost.toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`badge ${it.itemStatus === 'delivered' ? 'badge-green' : 'badge-gray'}`}>
                            {it.itemStatus || 'pending'}
                          </span>
                        </td>
                        <td style={{ fontSize: 11 }}>{it.deliveryDate || '—'}</td>
                        <td>
                          {it.itemStatus !== 'delivered' && selectedRepair.status !== 'cancelled' ? (
                            <button
                              type="button"
                              className={`btn btn-xs ${selectedRepair.balanceDue > 0 ? 'btn-outline' : 'btn-primary'}`}
                              onClick={() => handleOpenDeliverItem(it)}
                              title={selectedRepair.balanceDue > 0 ? `Balance ₹${selectedRepair.balanceDue.toLocaleString('en-IN')} must be paid first` : 'Mark as delivered'}
                            >
                              {selectedRepair.balanceDue > 0 ? 'Pay & Deliver' : '✓ Deliver'}
                            </button>
                          ) : (
                            <span style={{ color: 'var(--success)', fontSize: 11, fontWeight: 700 }}>
                              ✓ Done
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAYMENT HISTORY */}
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>
                PAYMENT HISTORY
              </div>
              {selectedRepair.payments.length === 0 ? (
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
                  No payments yet
                </div>
              ) : (
                <div className="tbl-wrap" style={{ marginBottom: 16 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Receipt</th>
                        <th>Date</th>
                        <th>Mode</th>
                        <th>Collector</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRepair.payments.map(p => (
                        <tr key={p.id}>
                          <td className="font-mono" style={{ fontSize: 11 }}>{p.receiptNo}</td>
                          <td style={{ fontSize: 12 }}>{p.date}</td>
                          <td>
                            <span className="badge badge-blue">{p.mode.toLowerCase()}</span>
                            {p.referenceNo && <span className="helper" style={{ marginLeft: 4 }}>({p.referenceNo})</span>}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--muted)' }}>{p.collectorName || 'Front Desk'}</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono amt-green">
                            ₹{p.amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Status Change Buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Change Status:</span>
                {(['received', 'in_progress', 'ready', 'delivered', 'cancelled'] as RepairStatus[])
                  .filter(st => normalizeRepairStatus(selectedRepair.status).rawKey !== st)
                  .map(st => (
                    <button
                      type="button"
                      key={st}
                      className="btn btn-xs btn-outline"
                      onClick={() => handleStatusChange(selectedRepair.id, st)}
                    >
                      {st}
                    </button>
                  ))}
              </div>

              {/* Collect Payment Section */}
              {selectedRepair.balanceDue > 0 && selectedRepair.status !== 'cancelled' && (
                <form onSubmit={handleConfirmViewPayment} style={{ background: '#fff9f0', border: '1.5px solid var(--gold)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={15} /> Collect Payment
                    <span>— Pending: <span style={{ color: 'var(--danger)' }}>₹{selectedRepair.balanceDue.toLocaleString('en-IN')}</span></span>
                  </div>

                  <div className="g2">
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="label">Amount (₹)</label>
                      <input 
                        type="number"
                        required
                        value={collectAmount}
                        onChange={(e) => setCollectAmount(e.target.value)}
                        placeholder={`Max: ${selectedRepair.balanceDue}`}
                        className="input font-mono"
                        style={{ fontWeight: 700 }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="label">UTR / Reference no. (optional)</label>
                      <input 
                        type="text"
                        value={collectRef}
                        onChange={(e) => setCollectRef(e.target.value)}
                        placeholder="Optional"
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label className="label">Payment Mode</label>
                    <div className="pay-modes" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER'] as PaymentMode[]).map(mode => (
                        <button
                          type="button"
                          key={mode}
                          onClick={() => setCollectMode(mode)}
                          className={`btn btn-xs ${collectMode === mode ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {mode.toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: 8 }}>
                    <label className="label">Note (optional)</label>
                    <input 
                      type="text"
                      value={collectNote}
                      onChange={(e) => setCollectNote(e.target.value)}
                      placeholder="e.g. Balance payment"
                      className="input"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 8, width: '100%', justifyContent: 'center' }}
                  >
                    Record Payment
                  </button>
                </form>
              )}
            </div>

            <div className="modal-foot" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {!['delivered', 'cancelled'].includes(normalizeRepairStatus(selectedRepair.status).rawKey) && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setShowViewModal(false);
                      handleOpenModifyRepair(selectedRepair);
                    }}
                  >
                    <Edit3 size={12} /> Modify
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowServiceInvoiceModal(true)}
                  title="GST service invoice"
                >
                  <FileText size={12} /> Service invoice
                </button>
                <div style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowReceiptModal(true)}
                    title="Print receiving receipt"
                  >
                    <Printer size={12} />
                    <span>{selectedRepair.receiptNo ? 'Reprint receiving receipt' : 'Receiving receipt'}</span>
                  </button>
                  <select
                    className="input"
                    style={{ width: 'auto', padding: '2px 6px', height: 28, fontSize: 11 }}
                    value={receiptFormat}
                    onChange={(e) => setReceiptFormat(e.target.value as '80mm' | 'a6')}
                    title="Receipt paper size"
                  >
                    <option value="80mm">80 mm</option>
                    <option value="a6">A6</option>
                  </select>
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DELIVER ITEM MODAL (P) --- */}
      {showDeliverItemModal && selectedRepair && itemToDeliver && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDeliverItemModal(false); }}>
          <form onSubmit={handleConfirmDeliverItem} className="modal modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>✓ Deliver Item</h3>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowDeliverItemModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'var(--primary-l)', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{itemToDeliver.description}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  {itemToDeliver.metal.toLowerCase()} · {itemToDeliver.grossWeightTaken}g · {itemToDeliver.issueType || '—'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>
                  Repair Cost: ₹{itemToDeliver.estimatedCost.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="form-group">
                <label className="label">Delivery Date *</label>
                <input 
                  type="date"
                  required
                  value={deliverDate}
                  onChange={(e) => setDeliverDate(e.target.value)}
                  className="input"
                />
              </div>

              <div className="section-divider">Collect Payment for this Item (optional)</div>

              <div style={{ background: selectedRepair.balanceDue <= 0 ? 'var(--success-l)' : 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', marginBottom: 8, fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: 'var(--muted)' }}>This Item Cost</span>
                  <strong style={{ color: 'var(--primary)' }}>₹{itemToDeliver.estimatedCost.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: 'var(--muted)' }}>Total Repair Cost</span>
                  <strong>₹{selectedRepair.totalCost.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ color: 'var(--muted)' }}>Already Paid</span>
                  <strong className="amt-green">₹{selectedRepair.advancePaid.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: selectedRepair.balanceDue > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                    {selectedRepair.balanceDue > 0 ? 'Balance Due' : '✓ Fully Paid'}
                  </span>
                  <strong className={selectedRepair.balanceDue > 0 ? 'amt-red' : 'amt-green'}>
                    {selectedRepair.balanceDue > 0 ? `₹${selectedRepair.balanceDue.toLocaleString('en-IN')}` : 'NIL'}
                  </strong>
                </div>
              </div>

              {selectedRepair.balanceDue > 0 && (
                <>
                  <div className="form-group">
                    <label className="label">
                      Amount to Collect (₹) <span className="helper">(max: balance due)</span>
                    </label>
                    <input 
                      type="number"
                      value={deliverCollectAmount}
                      onChange={(e) => setDeliverCollectAmount(e.target.value)}
                      placeholder={`Balance due: ₹${selectedRepair.balanceDue}`}
                      className="input font-mono"
                    />
                  </div>

                  {parseFloat(deliverCollectAmount) > 0 && (
                    <>
                      <div className="form-group">
                        <label className="label">Payment Mode</label>
                        <div className="pay-modes" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {(['CASH', 'UPI', 'CARD', 'CHEQUE', 'BANK_TRANSFER', 'OTHER'] as PaymentMode[]).map(mode => (
                            <button
                              type="button"
                              key={mode}
                              onClick={() => setDeliverCollectMode(mode)}
                              className={`btn btn-xs ${deliverCollectMode === mode ? 'btn-primary' : 'btn-outline'}`}
                            >
                              {mode.toLowerCase()}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="label">Reference / UTR no.</label>
                        <input 
                          type="text"
                          value={deliverCollectRef}
                          onChange={(e) => setDeliverCollectRef(e.target.value)}
                          placeholder="Optional"
                          className="input"
                        />
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                onClick={() => setShowDeliverItemModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                ✓ Mark "{itemToDeliver.description}" Delivered
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- INTAKE TOKEN / JOB CARD SLIP MODAL --- */}
      {showReceiptModal && selectedRepair && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowReceiptModal(false); }}>
          <div className="modal modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="card-title">
                  {receiptCopyType === 'customer' ? 'Customer Custody Token' : 'Workshop Job Card'} · {selectedRepair.receiptNo}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Switch between Customer Copy & Workshop Copy */}
                <div className="btn-group">
                  <button
                    type="button"
                    className={`btn btn-xs ${receiptCopyType === 'customer' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setReceiptCopyType('customer')}
                  >
                    Customer Copy
                  </button>
                  <button
                    type="button"
                    className={`btn btn-xs ${receiptCopyType === 'workshop' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setReceiptCopyType('workshop')}
                  >
                    Workshop Copy
                  </button>
                </div>

                {/* Switch between 80mm & A6 */}
                <select
                  value={receiptFormat}
                  onChange={(e) => setReceiptFormat(e.target.value as '80mm' | 'a6')}
                  className="input"
                  style={{ width: 'auto', padding: '2px 6px', height: 26, fontSize: 11 }}
                >
                  <option value="80mm">80 mm (Thermal)</option>
                  <option value="a6">A6 Voucher</option>
                </select>

                <button 
                  type="button" 
                  className="btn btn-outline btn-xs"
                  onClick={() => setShowReceiptModal(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div 
              className="modal-body print-preview-body"
              style={{ 
                background: '#fdfdfc', 
                fontFamily: 'monospace', 
                fontSize: 12,
                maxWidth: receiptFormat === '80mm' ? '380px' : '100%',
                margin: '0 auto',
                border: '1px solid var(--border)',
                padding: 16
              }}
            >
              {/* Store Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: 8, marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'sans-serif' }}>
                  {store.tradeName || 'S.B Borana Jewellers'}
                </h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11, fontFamily: 'sans-serif' }}>
                  {store.address || 'Zaveri Bazaar'}, {store.city || 'Mumbai'}
                </p>
                <p style={{ margin: 0, fontSize: 11 }}>
                  Ph: {store.phone || '9876543210'} · GSTIN: {store.gstin || '27AADCB2234P1Z2'}
                </p>
                <div style={{ marginTop: 6, fontWeight: 700, fontSize: 12, background: 'var(--text)', color: '#fff', display: 'inline-block', padding: '2px 10px', borderRadius: 4 }}>
                  {receiptCopyType === 'customer' ? 'REPAIR ESTIMATE & CUSTODY TOKEN' : 'WORKSHOP KARIGAR JOB CARD'}
                </div>
              </div>

              {/* Order Metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 8 }}>
                <div>
                  <p style={{ margin: 0 }}>Token No: <strong>{selectedRepair.receiptNo}</strong></p>
                  <p style={{ margin: 0 }}>Job No: <strong>{selectedRepair.repairNo}</strong></p>
                  <p style={{ margin: 0 }}>Intake Date: {selectedRepair.receivedDate}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0 }}>Customer: <strong>{selectedRepair.customer.name}</strong></p>
                  <p style={{ margin: 0 }}>Mobile: {selectedRepair.customer.phone || selectedRepair.customer.mobile}</p>
                  <p style={{ margin: 0, color: 'var(--primary)' }}>Promised Delivery: <strong>{selectedRepair.promiseDate}</strong></p>
                </div>
              </div>

              {/* Technician Workshop Info */}
              <div style={{ background: 'var(--surface2)', padding: '6px 8px', borderRadius: 4, marginBottom: 8, fontSize: 11 }}>
                <span>Karigar / Workshop Bench: <strong>{selectedRepair.technicianName || 'In-house Goldsmith'}</strong></span>
              </div>

              {/* Items Breakdown */}
              {selectedRepair.items.map((it, idx) => (
                <div key={idx} style={{ background: 'var(--surface2)', padding: 8, borderRadius: 4, marginBottom: 6 }}>
                  <div style={{ fontWeight: 700 }}>
                    Item #{idx + 1}: {it.description}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, fontSize: 11.5 }}>
                    <span>Metal: <strong>{it.metal}</strong></span>
                    <span>Custody Wt: <strong>{it.grossWeightTaken.toFixed(3)}g</strong></span>
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    Issue Nature: <strong>{it.issueType}</strong>
                  </div>
                  {it.conditionNotes && (
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>
                      Initial Condition: {it.conditionNotes}
                    </div>
                  )}
                  {it.accessories && (
                    <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 1 }}>
                      Accessories: {it.accessories}
                    </div>
                  )}
                </div>
              ))}

              {/* Financial Totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 8, marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Estimated Service Charges:</span>
                  <span>₹{selectedRepair.totalCost.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                  <span>Advance Paid:</span>
                  <span>₹{selectedRepair.advancePaid.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 13, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                  <span>Balance Due on Delivery:</span>
                  <span style={{ color: selectedRepair.balanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    ₹{selectedRepair.balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Terms / Notice */}
              <div style={{ fontSize: 9.5, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.3 }}>
                {receiptCopyType === 'customer' ? (
                  <>
                    <strong>CUSTODY NOTICE:</strong> Please present this custody token upon delivery. Handover only against signature verification. Stone/gem loss during heat laser treatment at customer risk if pre-cracked.
                  </>
                ) : (
                  <>
                    <strong>WORKSHOP BENCH INSTRUCTIONS:</strong> Check intake gross weight on bench balance before starting repairs. Record any difference in custody weight.
                  </>
                )}
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--muted)', paddingTop: 16 }}>
                <div>Customer Signature</div>
                <div>Authorised Signatory</div>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={14} />
                <span>Print Token</span>
              </button>
              <button 
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SAC 998722 GST SERVICE TAX INVOICE MODAL --- */}
      {showServiceInvoiceModal && selectedRepair && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowServiceInvoiceModal(false); }}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <span className="card-title">GST Service Tax Invoice · SAC 998722</span>
                <div className="helper">Jewellery Repair & Maintenance Services (18% GST)</div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowServiceInvoiceModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ background: '#fdfdfc', fontFamily: 'monospace', fontSize: 12 }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--text)', paddingBottom: 8, marginBottom: 10 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'sans-serif' }}>{store.tradeName || 'S.B Borana Jewellers'}</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11, fontFamily: 'sans-serif' }}>{store.address}, {store.city}</p>
                <p style={{ margin: 0, fontSize: 11 }}>Ph: {store.phone} · GSTIN: {store.gstin}</p>
                <div style={{ marginTop: 6, padding: '3px 8px', background: 'var(--text)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-block', borderRadius: 4 }}>
                  TAX INVOICE FOR SERVICES (SAC 998722)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 10 }}>
                <div>
                  <p style={{ margin: 0 }}>Invoice No: <strong>{selectedRepair.serviceInvoiceNo || 'RS/26-27/0001'}</strong></p>
                  <p style={{ margin: 0 }}>Job Order Ref: <strong>{selectedRepair.repairNo}</strong></p>
                  <p style={{ margin: 0 }}>SAC Code: <strong>998722 (Jewellery Repairs)</strong></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0 }}>Billed To: <strong>{selectedRepair.customer.name}</strong></p>
                  <p style={{ margin: 0 }}>Phone: {selectedRepair.customer.phone || selectedRepair.customer.mobile}</p>
                  <p style={{ margin: 0 }}>State Code: <strong>{selectedRepair.customer.stateCode ? `${selectedRepair.customer.stateCode} (${selectedRepair.customer.state || 'Maharashtra'})` : `${store.stateCode || '27'} (${store.state || 'Maharashtra'})`}</strong></p>
                </div>
              </div>

              {/* 18% GST Computation */}
              {(() => {
                const total = selectedRepair.totalCost;
                const taxable = Number((total / 1.18).toFixed(2));
                const custState = selectedRepair.customer.stateCode || '27';
                const storeState = store.stateCode || '27';
                const isInterState = custState !== storeState;
                const cgst = isInterState ? 0 : Number((taxable * 0.09).toFixed(2));
                const sgst = isInterState ? 0 : Number((taxable * 0.09).toFixed(2));
                const igst = isInterState ? Number((taxable * 0.18).toFixed(2)) : 0;

                return (
                  <div style={{ marginBottom: 12 }}>
                    <div className="tbl-wrap" style={{ border: '1px solid var(--border)' }}>
                      <table style={{ width: '100%', fontSize: 12 }}>
                        <thead>
                          <tr>
                            <th>Service Description</th>
                            <th>SAC</th>
                            <th style={{ textAlign: 'right' }}>Taxable Val</th>
                            {isInterState ? (
                              <th style={{ textAlign: 'right' }}>IGST (18%)</th>
                            ) : (
                              <>
                                <th style={{ textAlign: 'right' }}>CGST (9%)</th>
                                <th style={{ textAlign: 'right' }}>SGST (9%)</th>
                              </>
                            )}
                            <th style={{ textAlign: 'right' }}>Total (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedRepair.items.map((it, idx) => {
                            const itTotal = it.estimatedCost;
                            const itTaxable = Number((itTotal / 1.18).toFixed(2));
                            const itCgst = isInterState ? 0 : Number((itTaxable * 0.09).toFixed(2));
                            const itSgst = isInterState ? 0 : Number((itTaxable * 0.09).toFixed(2));
                            const itIgst = isInterState ? Number((itTaxable * 0.18).toFixed(2)) : 0;

                            return (
                              <tr key={idx}>
                                <td>{it.description} ({it.issueType})</td>
                                <td>998722</td>
                                <td style={{ textAlign: 'right' }}>₹{itTaxable.toFixed(2)}</td>
                                {isInterState ? (
                                  <td style={{ textAlign: 'right' }}>₹{itIgst.toFixed(2)}</td>
                                ) : (
                                  <>
                                    <td style={{ textAlign: 'right' }}>₹{itCgst.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>₹{itSgst.toFixed(2)}</td>
                                  </>
                                )}
                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>₹{itTotal.toFixed(2)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 800, marginTop: 8 }}>
                      Total Invoice Amount: ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Full Settlement)
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', paddingTop: 20 }}>
                <div>Customer Acknowledgment</div>
                <div>Authorized Signatory for {store.tradeName || 'S.B Borana Jewellers'}</div>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={14} />
                <span>Print Invoice</span>
              </button>
              <button 
                type="button"
                onClick={() => setShowServiceInvoiceModal(false)}
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

export { RepairsView as RepairOrdersView };
export default RepairsView;

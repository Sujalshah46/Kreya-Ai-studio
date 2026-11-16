import type { PaymentTransaction } from '../../types';
import React, { useState, useEffect } from 'react';
import { 
  Wrench, Plus, Search, Printer, FileText, CheckCircle2, 
  Clock, Check, X, ShieldCheck, User, Sparkles, AlertCircle,
  Calendar, Phone, DollarSign, ArrowRight, RefreshCw, ChevronRight, Scale
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
}

const REPAIR_STATUS_STEPS: { key: RepairStatus; label: string; badge: string; desc: string }[] = [
  { key: 'RECEIVED', label: 'Received', badge: 'badge-blue', desc: 'Intake logged & item custody verified' },
  { key: 'ESTIMATED', label: 'Estimated', badge: 'badge-yellow', desc: 'Labour & metal cost estimated' },
  { key: 'IN_WORKSHOP', label: 'In Workshop', badge: 'badge-orange', desc: 'Assigned to karigar bench for repair' },
  { key: 'QC_READY', label: 'QC Ready', badge: 'badge-purple', desc: 'Polished, cleaned & quality checked' },
  { key: 'DELIVERED', label: 'Delivered', badge: 'badge-green', desc: 'Handed over to customer with payment settled' }
];

const normalizeRepairStatus = (st: string): { key: RepairStatus; label: string; badge: string; stepIdx: number } => {
  const s = String(st || '').toUpperCase();
  if (s === 'RECEIVED') return { key: 'RECEIVED', label: 'Received', badge: 'badge-blue', stepIdx: 0 };
  if (s === 'ESTIMATED') return { key: 'ESTIMATED', label: 'Estimated', badge: 'badge-yellow', stepIdx: 1 };
  if (s === 'IN_WORKSHOP' || s === 'IN_PROGRESS' || s === 'ASSIGNED_KARIGAR') {
    return { key: 'IN_WORKSHOP', label: 'In Workshop', badge: 'badge-orange', stepIdx: 2 };
  }
  if (s === 'QC_READY' || s === 'QC_PASSED' || s === 'READY') {
    return { key: 'QC_READY', label: 'QC Ready', badge: 'badge-purple', stepIdx: 3 };
  }
  if (s === 'DELIVERED') return { key: 'DELIVERED', label: 'Delivered', badge: 'badge-green', stepIdx: 4 };
  if (s === 'CANCELLED') return { key: 'cancelled', label: 'Cancelled', badge: 'badge-gray', stepIdx: -1 };
  return { key: 'RECEIVED', label: 'Received', badge: 'badge-blue', stepIdx: 0 };
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
        conditionNotes: "Loose clasp, minor surface scratches"
      }
    ],
    totalCost: 1500,
    advancePaid: 500,
    balanceDue: 1000,
    hsnSacCode: "998722",
    payments: [
      {
        id: "pay-rep-1",
        receiptNo: "PAY-REP-001",
        date: "2026-11-15",
        amount: 500,
        mode: "CASH",
        collectorName: "Admin"
      }
    ]
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
    status: 'IN_WORKSHOP',
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
        conditionNotes: 'Pre-existing link crack near S-hook'
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
    status: 'QC_READY',
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
        conditionNotes: 'Loose center cubic zirconia stone'
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
  const [showNewRepairModal, setShowNewRepairModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showServiceInvoiceModal, setShowServiceInvoiceModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Payment collection modal state
  const [collectAmount, setCollectAmount] = useState('');
  const [collectMode, setCollectMode] = useState<PaymentMode>('CASH');
  const [collectRef, setCollectRef] = useState('');

  // New Repair Form State
  const [custSearchTerm, setCustSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [customerName, setCustomerName] = useState('Amita G');
  const [customerMobile, setCustomerMobile] = useState('9738315315');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [promiseDate, setPromiseDate] = useState(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [technicianName, setTechnicianName] = useState('Ramesh Karigar (Bench)');
  const [advancePaid, setAdvancePaid] = useState('100');
  const [advanceMode, setAdvanceMode] = useState<PaymentMode>('CASH');
  const [advanceRef, setAdvanceRef] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const availableIssues = [
    'Polish & Shine',
    'Solder / Link Join',
    'Stone Setting',
    'Ring/Bangle Resizing',
    'Rhodium Plating',
    'Clasp / Hook Replacement',
    'Prong Tightening',
    'Laser Welding'
  ];

  // Multi-item repair intake
  const [items, setItems] = useState<NewRepairItemRow[]>([
    {
      description: 'Silver Payal Polish & Link Solder',
      issueType: 'Polish & Solder',
      selectedIssues: ['Polish & Shine', 'Solder / Link Join'],
      metal: 'SILVER',
      itemType: 'Anklet',
      grossWeightTaken: '12.500',
      quantity: 1,
      estimatedCost: '350',
      conditionNotes: 'Pre-existing scratches, worn hook clasp',
      accessories: 'Small pouch'
    }
  ]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: '',
        issueType: 'Polish',
        selectedIssues: ['Polish & Shine'],
        metal: 'GOLD',
        itemType: 'Ring',
        grossWeightTaken: '',
        quantity: 1,
        estimatedCost: '',
        conditionNotes: '',
        accessories: ''
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

  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    const found = customers.find(c => c.id === custId);
    if (found) {
      setCustomerName(found.name);
      setCustomerMobile(found.phone || found.mobile || '');
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!custSearchTerm.trim()) return true;
    const term = custSearchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || (c.phone || c.mobile || '').includes(term);
  });

  const handleCreateRepair = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId) || {
      id: `cust-${Date.now()}`,
      code: `CUST-00${Math.floor(100 + Math.random() * 900)}`,
      name: customerName,
      phone: customerMobile,
      mobile: customerMobile,
      address: 'Walk-in Customer, Local Area',
      state: 'Uttar Pradesh',
      stateCode: '09'
    };

    const repairNum = `REP-2026-${String(repairs.length + 55).padStart(5, '0')}`;
    const receiptNum = `RR-2026-${String(repairs.length + 12).padStart(4, '0')}`;

    const repairItems: RepairItem[] = items.map((it, idx) => ({
      id: `ri-${Date.now()}-${idx}`,
      description: it.description || `${it.metal} ${it.itemType} Service`,
      issueType: it.issueType || 'General Service',
      metal: it.metal,
      itemType: it.itemType,
      grossWeightTaken: parseFloat(it.grossWeightTaken) || 0,
      quantity: it.quantity || 1,
      estimatedCost: parseFloat(it.estimatedCost) || 0,
      conditionNotes: [it.conditionNotes, it.accessories ? `Acc: ${it.accessories}` : ''].filter(Boolean).join(' | ')
    }));

    const newRepair: RepairOrder = {
      id: `rep-${Date.now()}`,
      repairNo: repairNum,
      receiptNo: receiptNum,
      serviceInvoiceNo: `RS/26-27/${String(repairs.length + 12).padStart(4, '0')}`,
      customer: cust,
      receivedDate,
      promiseDate,
      technicianName,
      status: 'RECEIVED',
      items: repairItems,
      totalCost: totalEstimatedCost,
      advancePaid: advAmount,
      balanceDue: balanceCalculated,
      hsnSacCode: '998722',
      payments: advAmount > 0 ? [
        {
          id: `p-${Date.now()}`,
          receiptNo: `PAY-${receiptNum}`,
          date: receivedDate,
          amount: advAmount,
          mode: advanceMode,
          collectorName: 'Front Desk'
        }
      ] : []
    };

    onSaveRepair(newRepair);
    setSelectedRepair(newRepair);
    setShowNewRepairModal(false);
    setShowReceiptModal(true);
  };

  const handleStatusChange = (repairId: string, newStatus: RepairStatus) => {
    onUpdateRepairStatus(repairId, newStatus);
    if (selectedRepair && selectedRepair.id === repairId) {
      setSelectedRepair({
        ...selectedRepair,
        status: newStatus
      });
    }
  };

  const handleOpenPayModal = (repair: RepairOrder) => {
    setSelectedRepair(repair);
    setCollectAmount(String(repair.balanceDue));
    setCollectMode('CASH');
    setCollectRef('');
    setShowPayModal(true);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepair) return;
    const amount = Number(collectAmount);
    const paise = Math.round(amount * 100);
    if (!Number.isSafeInteger(paise) || paise <= 0 || Math.abs(paise / 100 - amount) > 1e-9 ||
        paise > Math.round(selectedRepair.balanceDue * 100)) {
      alert('Enter a valid payment amount that does not exceed the repair balance.');
      return;
    }
    const newBal = (Math.round(selectedRepair.balanceDue * 100) - paise) / 100;
    const newStatus: RepairStatus = newBal === 0 ? 'DELIVERED' : selectedRepair.status;
    const id = crypto.randomUUID();
    const payment: PaymentTransaction = {
      id,
      receiptNo: 'PAY-REC-' + id.slice(0, 8).toUpperCase(),
      date: new Date().toISOString(),
      amount,
      mode: collectMode,
      referenceNo: collectRef || undefined,
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
    setShowPayModal(false);
    if (newBal === 0) {
      setShowServiceInvoiceModal(true);
    }
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
    const matchesStatus = statusFilter === 'all' || norm.key === statusFilter || r.status === statusFilter;
    const matchesFrom = !fromDate || r.receivedDate >= fromDate;
    const matchesTo = !toDate || r.receivedDate <= toDate;

    return matchesQ && matchesStatus && matchesFrom && matchesTo;
  });

  // KPI aggregates
  const totalRepairsCount = repairs.length;
  const inWorkshopCount = repairs.filter(r => {
    const k = normalizeRepairStatus(r.status).key;
    return k === 'RECEIVED' || k === 'ESTIMATED' || k === 'IN_WORKSHOP';
  }).length;
  const readyCount = repairs.filter(r => normalizeRepairStatus(r.status).key === 'QC_READY').length;
  const deliveredCount = repairs.filter(r => normalizeRepairStatus(r.status).key === 'DELIVERED').length;
  const totalBalanceCollectible = repairs.reduce((s, r) => s + (r.balanceDue || 0), 0);
  const totalRevenue = repairs.reduce((s, r) => s + (r.totalCost || 0), 0);

  return (
    <div className="page" style={{ padding: 0 }}>
      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Repair Orders & Workshop Job Cards</h1>
          <p>Custody intake weight verification · Issue checklist · Karigar workshop assignment · Status progression</p>
        </div>
        <div className="btn-group">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewRepairModal(true)}
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

      {/* Filter Row with Progression Tabs */}
      <div className="search-row" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
          <Search size={16} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search job no, receipt, customer or karigar..."
          />
        </div>
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
            setStatusFilter('all');
          }}
          title="Clear search and filters"
        >
          Clear
        </button>

        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none', overflowX: 'auto' }}>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'RECEIVED', label: 'Received' },
            { id: 'ESTIMATED', label: 'Estimated' },
            { id: 'IN_WORKSHOP', label: 'In Workshop' },
            { id: 'QC_READY', label: 'QC Ready' },
            { id: 'DELIVERED', label: 'Delivered' }
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
            <span className="card-title">Repair Orders & Job Cards</span>
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
                <th style={{ width: 120 }}>Job No</th>
                <th style={{ width: 95 }}>Date</th>
                <th>Customer</th>
                <th>Item Description</th>
                <th>Issue / Service</th>
                <th style={{ textAlign: 'right', width: 95 }}>Gross Wt</th>
                <th>Karigar / Workshop</th>
                <th style={{ width: 105 }}>Due Date</th>
                <th style={{ textAlign: 'right', width: 100 }}>Est. Cost</th>
                <th style={{ textAlign: 'right', width: 90 }}>Advance</th>
                <th style={{ textAlign: 'right', width: 95 }}>Balance</th>
                <th style={{ textAlign: 'center', width: 125 }}>Progression Status</th>
                <th style={{ textAlign: 'right', width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRepairs.length === 0 ? (
                <tr>
                  <td colSpan={13} className="empty">
                    No repair orders found
                  </td>
                </tr>
              ) : (
                filteredRepairs.map((r) => {
                  const mainItem = r.items[0];
                  const totalWt = r.items.reduce((s, it) => s + (it.grossWeightTaken || 0), 0);
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
                        {r.receivedDate}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.customer.name}</div>
                        <div className="helper" style={{ margin: 0 }}>{r.customer.phone || r.customer.mobile}</div>
                      </td>
                      <td style={{ fontWeight: 500 }}>
                        {mainItem?.description || 'Jewellery Item'}
                        {r.items.length > 1 && (
                          <span className="helper" style={{ marginLeft: 4 }}>+{r.items.length - 1} more</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                          {mainItem?.issueType || 'Polish & Service'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                        {totalWt.toFixed(3)}g
                      </td>
                      <td style={{ color: 'var(--muted)', fontSize: 12 }}>
                        {r.technicianName || 'In-house Karigar'}
                      </td>
                      <td className="font-mono" style={{ fontSize: 12, color: r.promiseDate < new Date().toISOString().slice(0, 10) && norm.key !== 'DELIVERED' ? 'var(--danger)' : undefined }}>
                        {r.promiseDate}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                        ₹{r.totalCost.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }} className="font-mono">
                        ₹{r.advancePaid.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: r.balanceDue > 0 ? 'var(--danger)' : 'var(--muted)' }} className="font-mono">
                        ₹{r.balanceDue.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <select
                          value={norm.key}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleStatusChange(r.id, e.target.value as RepairStatus)}
                          className={`badge ${norm.badge}`}
                          style={{ cursor: 'pointer', border: 'none', outline: 'none' }}
                        >
                          <option value="RECEIVED">RECEIVED</option>
                          <option value="ESTIMATED">ESTIMATED</option>
                          <option value="IN_WORKSHOP">IN WORKSHOP</option>
                          <option value="QC_READY">QC READY</option>
                          <option value="DELIVERED">DELIVERED</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                          {r.balanceDue > 0 ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPayModal(r);
                              }}
                            >
                              Collect & Deliver
                            </button>
                          ) : norm.key !== 'DELIVERED' ? (
                            <button
                              type="button"
                              className="btn btn-outline btn-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(r.id, 'DELIVERED');
                              }}
                            >
                              ✓ Deliver
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, paddingRight: 4 }}>
                              Delivered ✓
                            </span>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRepair(r);
                              setShowReceiptModal(true);
                            }}
                            title="Print Token"
                          >
                            <Printer size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRepair(r);
                              setShowServiceInvoiceModal(true);
                            }}
                            title="SAC 998722 Invoice"
                          >
                            <FileText size={12} />
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
            Showing {filteredRepairs.length} of {repairs.length} repair orders · Balance: ₹{totalBalanceCollectible.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* --- NEW REPAIR INTAKE MODAL --- */}
      {showNewRepairModal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewRepairModal(false); }}>
          <form onSubmit={handleCreateRepair} className="modal modal-xl">
            <div className="modal-head">
              <div>
                <span className="card-title">New Jewellery Repair Order</span>
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

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Customer Search & Dates Section */}
              <div className="g4">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="label">Customer Search / Select *</label>
                  <input
                    type="text"
                    value={custSearchTerm}
                    onChange={(e) => setCustSearchTerm(e.target.value)}
                    placeholder="Search name or mobile..."
                    className="input input-sm"
                  />
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleCustomerSelect(e.target.value)}
                    className="input input-sm"
                    style={{ marginTop: 4 }}
                  >
                    {filteredCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone || c.mobile || 'No Phone'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Customer Mobile</label>
                  <input 
                    type="text"
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    className="input input-sm"
                    placeholder="10-digit mobile"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Intake Date</label>
                  <input 
                    type="date"
                    value={receivedDate}
                    onChange={(e) => setReceivedDate(e.target.value)}
                    className="input input-sm"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Promised Delivery Date *</label>
                  <input 
                    type="date"
                    required
                    value={promiseDate}
                    onChange={(e) => setPromiseDate(e.target.value)}
                    className="input input-sm font-mono"
                    style={{ fontWeight: 600 }}
                  />
                </div>
              </div>

              {/* Karigar workshop assignment */}
              <div className="g2">
                <div className="form-group">
                  <label className="label">Assigned Workshop / Karigar *</label>
                  <select
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="input input-sm"
                  >
                    <option value="Ramesh Karigar (Bench)">Ramesh Karigar (Bench - Polishing & Solder)</option>
                    <option value="Suresh Goldsmith (Setting)">Suresh Goldsmith (Stone Setting & Prong)</option>
                    <option value="Master Rajesh (Handmade)">Master Rajesh (Handmade Jewellery & Jodai)</option>
                    <option value="Laser Tech Station (Main)">Laser Tech Station (Chain Welding & Knot)</option>
                    <option value="External Workshop Partner">External Workshop Partner</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Order Notes / Custody Remarks</label>
                  <input 
                    type="text"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g. Urgent for wedding, customer will bring matching bangle"
                    className="input input-sm"
                  />
                </div>
              </div>

              <div className="section-divider">INTAKE ITEMS & ISSUE CHECKLIST</div>

              {/* Repair Items Breakdown */}
              {items.map((item, idx) => (
                <div key={idx} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                      Item #{idx + 1} Custody Details
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

                  <div className="g4">
                    <div className="form-group">
                      <label className="label">Item Description *</label>
                      <input 
                        type="text"
                        required
                        value={item.description}
                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                        placeholder="e.g. 22K Ladies Gold Ring with Emerald"
                        className="input input-sm"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Item Type</label>
                      <select
                        value={item.itemType}
                        onChange={(e) => handleUpdateItem(idx, 'itemType', e.target.value)}
                        className="input input-sm"
                      >
                        {['Ring', 'Chain', 'Necklace', 'Bracelet', 'Bangle', 'Earring', 'Pendant', 'Anklet', 'Mangalsutra', 'Nose pin', 'Watch', 'Other'].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="label">Metal Group</label>
                      <select
                        value={item.metal}
                        onChange={(e) => handleUpdateItem(idx, 'metal', e.target.value as MetalGroup)}
                        className="input input-sm"
                      >
                        <option value="GOLD">Gold</option>
                        <option value="SILVER">Silver</option>
                        <option value="PLATINUM">Platinum</option>
                        <option value="DIAMOND">Diamond Studded</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="label">Intake Gross Wt (g) *</label>
                      <input 
                        type="number"
                        step="0.001"
                        required
                        value={item.grossWeightTaken}
                        onChange={(e) => handleUpdateItem(idx, 'grossWeightTaken', e.target.value)}
                        placeholder="0.000"
                        className="input input-sm font-mono"
                        style={{ fontWeight: 700 }}
                      />
                    </div>
                  </div>

                  {/* Common Issue Checklist Chips */}
                  <div style={{ marginTop: 8 }}>
                    <label className="label">Problem Description & Checklist</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      {availableIssues.map(issue => {
                        const isChecked = item.selectedIssues.includes(issue);
                        return (
                          <button
                            type="button"
                            key={issue}
                            onClick={() => toggleIssueCheckbox(idx, issue)}
                            className="btn btn-xs"
                            style={{
                              background: isChecked ? 'var(--primary)' : 'var(--bg)',
                              color: isChecked ? '#fff' : 'var(--text)',
                              border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)'
                            }}
                          >
                            {isChecked ? '✓ ' : '+ '}{issue}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="g3" style={{ marginTop: 8 }}>
                    <div className="form-group">
                      <label className="label">Estimated Repair Labour (₹) *</label>
                      <input 
                        type="number"
                        required
                        value={item.estimatedCost}
                        onChange={(e) => handleUpdateItem(idx, 'estimatedCost', e.target.value)}
                        placeholder="e.g. 350"
                        className="input input-sm font-mono"
                        style={{ fontWeight: 700, color: 'var(--primary)' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Condition at Receiving</label>
                      <input 
                        type="text"
                        value={item.conditionNotes}
                        onChange={(e) => handleUpdateItem(idx, 'conditionNotes', e.target.value)}
                        placeholder="e.g. Deep scratches, stone missing, broken clasp"
                        className="input input-sm"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Accessories Received</label>
                      <input 
                        type="text"
                        value={item.accessories}
                        onChange={(e) => handleUpdateItem(idx, 'accessories', e.target.value)}
                        placeholder="e.g. Pouch, box, old certificate"
                        className="input input-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-outline btn-sm"
                style={{ alignSelf: 'flex-start' }}
              >
                + Add Another Item
              </button>

              {/* Advance & Totals Summary */}
              <div style={{ background: 'var(--surface2)', padding: 16, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div className="g3" style={{ alignItems: 'flex-end' }}>
                  <div className="form-group">
                    <label className="label">Advance Payment (₹)</label>
                    <input 
                      type="number"
                      value={advancePaid}
                      onChange={(e) => setAdvancePaid(e.target.value)}
                      className="input input-sm font-mono"
                      style={{ fontWeight: 700 }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Payment Mode</label>
                    <select
                      value={advanceMode}
                      onChange={(e) => setAdvanceMode(e.target.value as PaymentMode)}
                      className="input input-sm"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="CARD">Credit/Debit Card</option>
                      <option value="NET_BANKING">Net Banking</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Reference / UTR</label>
                    <input 
                      type="text"
                      value={advanceRef}
                      onChange={(e) => setAdvanceRef(e.target.value)}
                      placeholder="Optional"
                      className="input input-sm"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div>
                    <span className="helper">Total Intake Gross Weight: </span>
                    <strong className="font-mono">{totalIntakeGrossWeight.toFixed(3)}g</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div>
                      <span className="helper">Total Estimated Charges: </span>
                      <strong className="font-mono" style={{ fontSize: 15 }}>₹{totalEstimatedCost.toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span className="helper">Balance Due on Delivery: </span>
                      <strong className="font-mono" style={{ fontSize: 16, color: balanceCalculated > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        ₹{balanceCalculated.toLocaleString('en-IN')}
                      </strong>
                    </div>
                  </div>
                </div>
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
                Create Job Card & Print Token
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- PAYMENT COLLECTION MODAL --- */}
      {showPayModal && selectedRepair && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPayModal(false); }}>
          <form onSubmit={handleConfirmPayment} className="modal modal-sm">
            <div className="modal-head">
              <span className="card-title">Collect Repair Payment</span>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowPayModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 'var(--r)', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedRepair.customer.name}</div>
                <div className="helper">Repair No: {selectedRepair.repairNo}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span>Total Charges:</span>
                  <strong className="font-mono">₹{selectedRepair.totalCost.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)' }}>
                  <span>Advance Received:</span>
                  <strong className="font-mono">₹{selectedRepair.advancePaid.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)', fontWeight: 800, marginTop: 4 }}>
                  <span>Pending Balance:</span>
                  <strong className="font-mono">₹{selectedRepair.balanceDue.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Amount to Collect (₹) *</label>
                <input 
                  type="number"
                  required
                  value={collectAmount}
                  onChange={(e) => setCollectAmount(e.target.value)}
                  className="input font-mono"
                  style={{ fontWeight: 800, fontSize: 16 }}
                />
              </div>

              <div className="form-group">
                <label className="label">Payment Mode</label>
                <select
                  value={collectMode}
                  onChange={(e) => setCollectMode(e.target.value as PaymentMode)}
                  className="input"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Reference / UTR / Auth Code</label>
                <input 
                  type="text"
                  value={collectRef}
                  onChange={(e) => setCollectRef(e.target.value)}
                  placeholder="Optional"
                  className="input"
                />
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button" 
                onClick={() => setShowPayModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
              >
                Receive ₹{collectAmount || '0'} & Deliver
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- INTAKE TOKEN SLIP MODAL --- */}
      {showReceiptModal && selectedRepair && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowReceiptModal(false); }}>
          <div className="modal modal-md">
            <div className="modal-head">
              <span className="card-title">Customer Custody Token · {selectedRepair.receiptNo}</span>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowReceiptModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ background: '#fdfdfc', fontFamily: 'monospace', fontSize: 12 }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: 8, marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: 'sans-serif' }}>{store.tradeName}</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11, fontFamily: 'sans-serif' }}>{store.address}, {store.city}</p>
                <p style={{ margin: 0, fontSize: 11 }}>Ph: {store.phone} · GSTIN: {store.gstin}</p>
                <div style={{ marginTop: 4, fontWeight: 700, fontSize: 13, background: 'var(--text)', color: '#fff', display: 'inline-block', padding: '2px 8px', borderRadius: 4 }}>
                  REPAIR ESTIMATE & CUSTODY TOKEN
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 8 }}>
                <div>
                  <p style={{ margin: 0 }}>Token / RR No: <strong>{selectedRepair.receiptNo}</strong></p>
                  <p style={{ margin: 0 }}>Job Order Ref: <strong>{selectedRepair.repairNo}</strong></p>
                  <p style={{ margin: 0 }}>Date: {selectedRepair.receivedDate}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0 }}>Customer: <strong>{selectedRepair.customer.name}</strong></p>
                  <p style={{ margin: 0 }}>Mobile: {selectedRepair.customer.phone || selectedRepair.customer.mobile}</p>
                  <p style={{ margin: 0, color: 'var(--primary)' }}>Promised Delivery: <strong>{selectedRepair.promiseDate}</strong></p>
                </div>
              </div>

              <div style={{ background: 'var(--surface2)', padding: 8, borderRadius: 4, marginBottom: 8 }}>
                <div style={{ fontWeight: 700 }}>Item: {selectedRepair.items[0]?.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span>Gross Custody Wt: <strong>{selectedRepair.items[0]?.grossWeightTaken}g</strong></span>
                  <span>Issue: <strong>{selectedRepair.items[0]?.issueType}</strong></span>
                </div>
                {selectedRepair.items[0]?.conditionNotes && (
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', fontStyle: 'italic', marginTop: 2 }}>
                    Notes: {selectedRepair.items[0].conditionNotes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8, borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
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
                  <span style={{ color: 'var(--danger)' }}>₹{selectedRepair.balanceDue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 12 }}>
                <strong>CUSTODY NOTICE:</strong> Please present this token upon delivery. Handover only against verification of signature.
              </div>

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
          <div className="modal modal-lg">
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
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'sans-serif' }}>{store.tradeName}</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11, fontFamily: 'sans-serif' }}>{store.address}, {store.city}</p>
                <p style={{ margin: 0, fontSize: 11 }}>Ph: {store.phone} · GSTIN: {store.gstin}</p>
                <div style={{ marginTop: 6, padding: '3px 8px', background: 'var(--text)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-block', borderRadius: 4 }}>
                  TAX INVOICE FOR SERVICES (SAC 998722)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, borderBottom: '1px solid var(--border)', paddingBottom: 8, marginBottom: 10 }}>
                <div>
                  <p style={{ margin: 0 }}>Invoice No: <strong>{selectedRepair.serviceInvoiceNo || 'RS/26-27/0010'}</strong></p>
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
                          <tr>
                            <td>{selectedRepair.items[0]?.description} ({selectedRepair.items[0]?.issueType})</td>
                            <td>998722</td>
                            <td style={{ textAlign: 'right' }}>₹{taxable.toFixed(2)}</td>
                            {isInterState ? (
                              <td style={{ textAlign: 'right' }}>₹{igst.toFixed(2)}</td>
                            ) : (
                              <>
                                <td style={{ textAlign: 'right' }}>₹{cgst.toFixed(2)}</td>
                                <td style={{ textAlign: 'right' }}>₹{sgst.toFixed(2)}</td>
                              </>
                            )}
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>₹{total.toFixed(2)}</td>
                          </tr>
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
                <div>Authorized Signatory for {store.tradeName}</div>
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



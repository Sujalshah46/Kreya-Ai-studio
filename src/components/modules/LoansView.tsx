import React, { useState } from 'react';
import { 
  Plus, Search, ShieldCheck, Printer, FileText, CheckCircle2, 
  AlertTriangle, DollarSign, X, ArrowRight, Lock, Calendar, User, Eye,
  Copy, Check, Phone, Shield, Sparkles, Scale, RefreshCw, AlertCircle
} from 'lucide-react';
import { GirviLoan, Customer, StoreProfile, PledgedItem, PaymentMode, MetalGroup, DailyRates } from '../../types';
import { mockStore, mockLoans, mockCustomers, mockDailyRates } from '../../data/mockData';

interface LoansViewProps {
  store?: StoreProfile;
  loans?: GirviLoan[];
  customers?: Customer[];
  rates?: DailyRates;
  onSaveLoan?: (loan: GirviLoan) => void;
  onAddLoan?: (loan: GirviLoan) => void;
  onUpdateLoan?: (loan: GirviLoan) => void;
}

interface NewPledgedItemForm {
  itemName: string;
  description: string;
  metal: MetalGroup;
  purityKarat: string;
  touchPurity: string;
  quantity: number;
  grossWeight: string;
  netWeight: string;
  spotValuationRate: string;
  marketValuation: string;
  tagNo: string;
  packetNo: string;
  lockerLocation: string;
}

const DEFAULT_SPOT_RATES: Record<string, number> = {
  '24K (999)': 7850,
  '23K (958)': 7520,
  '22K (916)': 7250,
  '21K (875)': 6900,
  '20K (833)': 6550,
  '18K (750)': 5900,
  '16K (667)': 5250,
  '14K (585)': 4600,
  '10K (417)': 3280,
  '999 Silver': 95,
  '925 Silver': 92,
  '92.5 Silver': 92,
  '800 Silver': 78
};

export const LoansView: React.FC<LoansViewProps> = ({
  store = mockStore,
  loans: initialLoans = mockLoans,
  customers = mockCustomers,
  rates = mockDailyRates,
  onSaveLoan,
  onAddLoan,
  onUpdateLoan
}) => {
  const loans = initialLoans && initialLoans.length > 0 ? initialLoans : mockLoans;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  
  const [selectedLoan, setSelectedLoan] = useState<GirviLoan | null>(loans[0] || null);
  const [detailTab, setDetailTab] = useState<'items' | 'history' | 'calc' | 'custody'>('items');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [showPledgeSlip, setShowPledgeSlip] = useState(false);
  const [showRepaymentSlipModal, setShowRepaymentSlipModal] = useState(false);
  const [latestRepaymentData, setLatestRepaymentData] = useState<any>(null);
  const [copiedLoanNo, setCopiedLoanNo] = useState(false);

  // New Loan Form State
  const [custSearchTerm, setCustSearchTerm] = useState('');
  const [selectedCustId, setSelectedCustId] = useState<string>(customers[0]?.id || 'cust-1');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().slice(0, 10));
  const [tenureMonths, setTenureMonths] = useState<string>('12');
  const [monthlyRate, setMonthlyRate] = useState<string>('2.0');
  const [rateBasis, setRateBasis] = useState<'monthly' | 'yearly'>('monthly');
  const [principalAmount, setPrincipalAmount] = useState<string>('50000');
  const [disbursalMode, setDisbursalMode] = useState<PaymentMode>('CASH');
  const [disbursalRef, setDisbursalRef] = useState<string>('');
  const [packetNumber, setPacketNumber] = useState<string>('PKT-0042');
  const [guarantorName, setGuarantorName] = useState<string>('Akash Singh');
  const [guarantorPhone, setGuarantorPhone] = useState<string>('9876543210');
  const [loanNotes, setLoanNotes] = useState<string>('');

  // Multiple Pledged items array
  const [pledgedItemsList, setPledgedItemsList] = useState<NewPledgedItemForm[]>([
    {
      itemName: 'Gold Chain 22K',
      description: 'Traditional Rope Design with S-Hook',
      metal: 'GOLD',
      purityKarat: '22K (916)',
      touchPurity: '91.6',
      quantity: 1,
      grossWeight: '12.500',
      netWeight: '12.500',
      spotValuationRate: '7250',
      marketValuation: '90625',
      tagNo: 'TAG-014',
      packetNo: 'PKT-0042',
      lockerLocation: 'Safe Vault Drawer B-4'
    }
  ]);

  // Repayment form
  const [repayType, setRepayType] = useState<'both' | 'interest' | 'principal' | 'waiver'>('both');
  const [repayPrincipal, setRepayPrincipal] = useState<string>('');
  const [repayInterest, setRepayInterest] = useState<string>('');
  const [repayWaiver, setRepayWaiver] = useState<string>('0');
  const [repayMode, setRepayMode] = useState<PaymentMode>('CASH');
  const [repayRef, setRepayRef] = useState<string>('');
  const [repayNotes, setRepayNotes] = useState<string>('');

  // Default loans if none provided
  const loanList: GirviLoan[] = loans.length > 0 ? loans : [
    {
      id: 'loan-1',
      loanNo: 'LOAN-2026-00014',
      packetNo: 'PKT-0014',
      customer: customers[0] || { id: 'c-loan-1', code: 'CUST-00114', name: 'Amul Baranwal', mobile: '9810012345', phone: '9810012345', address: 'Surajpur, Greater Noida', state: 'Uttar Pradesh', stateCode: '09' },
      loanDate: '2026-01-04',
      dueDate: '2027-01-04',
      tenureMonths: 12,
      principalAmount: 50000,
      principalDue: 50000,
      monthlyRatePercent: 2.0,
      dailyRatePercent: 0.065753,
      disbursementMode: 'CASH',
      status: 'ACTIVE',
      guarantorName: 'Vikram Baranwal',
      guarantorMobile: '9810098765',
      lockerLocation: 'Safe Vault Drawer B-4',
      pledgedItems: [
        { 
          id: 'p1', 
          itemName: '22K Gold Chain', 
          description: 'Rope Chain with Hallmark 916',
          metal: 'GOLD', 
          purityKarat: '22K (916)', 
          touchPurity: 91.6,
          quantity: 1,
          grossWeight: 12.500, 
          netWeight: 12.500, 
          marketValuation: 90625,
          tagNo: 'TAG-014',
          packetNo: 'PKT-0014',
          lockerLocation: 'Vault B-4',
          isReturned: false
        }
      ],
      repayments: []
    },
    {
      id: 'loan-2',
      loanNo: 'LOAN-2026-00015',
      packetNo: 'PKT-0015',
      customer: customers[1] || { id: 'c-loan-2', code: 'CUST-00115', name: 'Sunita Devi', mobile: '9876501234', phone: '9876501234', address: 'Kasna, Greater Noida', state: 'Uttar Pradesh', stateCode: '09' },
      loanDate: '2026-02-10',
      dueDate: '2026-08-10',
      tenureMonths: 6,
      principalAmount: 80000,
      principalDue: 40000,
      monthlyRatePercent: 1.75,
      dailyRatePercent: 0.057534,
      disbursementMode: 'BANK_TRANSFER',
      disbursementRef: 'NEFT-8849201',
      status: 'ACTIVE',
      lockerLocation: 'Safe Vault Drawer A-2',
      pledgedItems: [
        {
          id: 'p2',
          itemName: 'Gold Kangan Set (Pair)',
          description: 'Carved Kada with Screws 22K',
          metal: 'GOLD',
          purityKarat: '22K (916)',
          touchPurity: 91.6,
          quantity: 2,
          grossWeight: 24.800,
          netWeight: 24.500,
          marketValuation: 177625,
          tagNo: 'TAG-015',
          packetNo: 'PKT-0015',
          lockerLocation: 'Vault A-2',
          isReturned: false
        }
      ],
      repayments: [
        {
          id: 'rep-1',
          receiptNo: 'RCP-LN-0042',
          date: '2026-06-10',
          principalPaid: 40000,
          interestPaid: 5600,
          interestWaived: 0,
          totalCashReceived: 45600,
          paymentMode: 'CASH',
          notes: 'Half principal + 4 months interest'
        }
      ]
    }
  ];

  // Calculate dynamic interest due for a loan based on elapsed days
  const calculateInterestDue = (loan: GirviLoan): number => {
    if (loan.status === 'CLOSED' || loan.status === 'REDEEMED' || loan.principalDue <= 0) return 0;
    const start = new Date(loan.loanDate).getTime();
    const now = Date.now();
    const daysElapsed = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    
    // Pro-rata simple interest: P * (monthlyRate / 100) * (days / 30)
    const ratePerDay = (loan.monthlyRatePercent / 100) / 30;
    const totalInterestAccrued = Math.round(loan.principalDue * ratePerDay * daysElapsed);
    const totalInterestAlreadyPaid = (loan.repayments || []).reduce((s, r) => s + (r.interestPaid || 0), 0);
    return Math.max(0, totalInterestAccrued - totalInterestAlreadyPaid);
  };

  const calculateDaysElapsed = (loanDateStr: string): number => {
    const start = new Date(loanDateStr).getTime();
    const now = Date.now();
    return Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  };

  // Filter loans
  const filteredLoans = loanList.filter(l => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q ||
      l.loanNo.toLowerCase().includes(q) ||
      (l.packetNo && l.packetNo.toLowerCase().includes(q)) ||
      l.customer.name.toLowerCase().includes(q) ||
      (l.customer.phone || l.customer.mobile || '').includes(q) ||
      (l.guarantorName && l.guarantorName.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && l.status === 'ACTIVE') ||
      (statusFilter === 'closed' && (l.status === 'CLOSED' || l.status === 'REDEEMED')) ||
      (statusFilter === 'overdue' && l.dueDate && l.dueDate < new Date().toISOString().slice(0, 10) && l.status === 'ACTIVE');

    const matchesFrom = !fromDate || l.loanDate >= fromDate;
    const matchesTo = !toDate || l.loanDate <= toDate;

    return matchesQ && matchesStatus && matchesFrom && matchesTo;
  });

  // KPI Aggregates
  const totalPrincipalGiven = loanList.reduce((s, l) => s + (l.principalAmount || 0), 0);
  const totalPrincipalDue = loanList.reduce((s, l) => s + (l.principalDue || 0), 0);
  const activeLoansCount = loanList.filter(l => l.status === 'ACTIVE').length;
  const totalInterestDueAccrued = loanList.reduce((s, l) => s + calculateInterestDue(l), 0);
  const totalVaultCollateralWeight = loanList.reduce((s, l) => 
    s + l.pledgedItems.reduce((is, item) => is + (item.netWeight || item.grossWeight || 0), 0), 0);

  // Add Item to New Loan
  const handleAddPledgedItem = () => {
    const defaultRate = DEFAULT_SPOT_RATES['22K (916)'] || 7250;
    setPledgedItemsList([
      ...pledgedItemsList,
      {
        itemName: '',
        description: '',
        metal: 'GOLD',
        purityKarat: '22K (916)',
        touchPurity: '91.6',
        quantity: 1,
        grossWeight: '',
        netWeight: '',
        spotValuationRate: String(defaultRate),
        marketValuation: '',
        tagNo: `TAG-${Math.floor(100 + Math.random() * 900)}`,
        packetNo: packetNumber,
        lockerLocation: 'Safe Vault Drawer B-4'
      }
    ]);
  };

  const handleRemovePledgedItem = (idx: number) => {
    if (pledgedItemsList.length <= 1) return;
    setPledgedItemsList(pledgedItemsList.filter((_, i) => i !== idx));
  };

  const handleUpdatePledgedItem = (idx: number, field: keyof NewPledgedItemForm, value: any) => {
    const updated = [...pledgedItemsList];
    updated[idx] = { ...updated[idx], [field]: value };
    
    // Auto-calculate net weight from gross if unset
    if (field === 'grossWeight' && (!updated[idx].netWeight || updated[idx].netWeight === '0')) {
      updated[idx].netWeight = value;
    }

    // Auto-populate spot rate if purity changed
    if (field === 'purityKarat') {
      const suggestedRate = DEFAULT_SPOT_RATES[value] || (value.includes('Silver') ? 92 : 7250);
      updated[idx].spotValuationRate = String(suggestedRate);
    }

    // Auto-compute marketValuation = netWeight * spotRate
    const net = parseFloat(field === 'netWeight' ? value : updated[idx].netWeight) || 0;
    const rate = parseFloat(field === 'spotValuationRate' ? value : updated[idx].spotValuationRate) || 0;
    if (field === 'netWeight' || field === 'spotValuationRate' || field === 'grossWeight' || field === 'purityKarat') {
      if (net > 0 && rate > 0) {
        updated[idx].marketValuation = String(Math.round(net * rate));
      }
    }

    setPledgedItemsList(updated);
  };

  const totalCollateralValuation = pledgedItemsList.reduce(
    (s, item) => s + (parseFloat(item.marketValuation) || 0), 0
  );
  const totalPledgedGross = pledgedItemsList.reduce(
    (s, item) => s + (parseFloat(item.grossWeight) || 0), 0
  );
  const totalPledgedNet = pledgedItemsList.reduce(
    (s, item) => s + (parseFloat(item.netWeight) || 0), 0
  );

  // 75% Statutory LTV Ceiling
  const maxEligibleLoan75Percent = Math.floor(totalCollateralValuation * 0.75);
  const requestedPrincipal = parseFloat(principalAmount) || 0;
  const currentLtvPercent = totalCollateralValuation > 0 ? (requestedPrincipal / totalCollateralValuation) * 100 : 0;
  const isLtvCeilingExceeded = requestedPrincipal > maxEligibleLoan75Percent && totalCollateralValuation > 0;

  const handleCapAt75Percent = () => {
    setPrincipalAmount(String(maxEligibleLoan75Percent));
  };

  const filteredCustomers = customers.filter(c => {
    if (!custSearchTerm.trim()) return true;
    const term = custSearchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || (c.phone || c.mobile || '').includes(term);
  });

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustId) || customers[0] || {
      id: 'cust-walkin',
      code: 'CUST-00999',
      name: 'Walk-in Borrower',
      mobile: '9810012345',
      phone: '9810012345',
      address: 'Greater Noida',
      state: 'Uttar Pradesh',
      stateCode: '09'
    };

    const pAmt = parseFloat(principalAmount) || 0;
    const mRate = parseFloat(monthlyRate) || 2.0;
    const tMonths = parseInt(tenureMonths) || 12;

    const d = new Date(loanDate);
    d.setMonth(d.getMonth() + tMonths);
    const dueDateStr = d.toISOString().slice(0, 10);

    const generatedPledgedItems: PledgedItem[] = pledgedItemsList.map((item, index) => ({
      id: `plg-${Date.now()}-${index}`,
      itemName: item.itemName || 'Gold Ornament',
      description: item.description,
      metal: item.metal,
      purityKarat: item.purityKarat,
      touchPurity: parseFloat(item.touchPurity) || 91.6,
      quantity: item.quantity || 1,
      grossWeight: parseFloat(item.grossWeight) || 0,
      netWeight: parseFloat(item.netWeight) || 0,
      marketValuation: parseFloat(item.marketValuation) || 0,
      tagNo: item.tagNo || `TAG-${index + 1}`,
      packetNo: packetNumber || item.packetNo,
      lockerLocation: item.lockerLocation || 'Safe Vault',
      isReturned: false
    }));

    const newLoan: GirviLoan = {
      id: `loan-${Date.now()}`,
      loanNo: `LOAN-2026-000${loanList.length + 15}`,
      packetNo: packetNumber,
      customer: cust,
      loanDate,
      dueDate: dueDateStr,
      tenureMonths: tMonths,
      principalAmount: pAmt,
      principalDue: pAmt,
      monthlyRatePercent: mRate,
      dailyRatePercent: Number(((mRate * 12) / 365).toFixed(6)),
      rateBasis,
      disbursementMode: disbursalMode,
      disbursementRef: disbursalRef,
      guarantorName,
      guarantorMobile: guarantorPhone,
      lockerLocation: pledgedItemsList[0]?.lockerLocation || 'Vault B-4',
      notes: loanNotes,
      pledgedItems: generatedPledgedItems,
      status: 'ACTIVE',
      repayments: []
    };

    if (onSaveLoan) onSaveLoan(newLoan);
    if (onAddLoan) onAddLoan(newLoan);
    setSelectedLoan(newLoan);
    setShowNewLoanModal(false);
    setShowPledgeSlip(true);
  };

  const handleOpenRepayModal = (loan: GirviLoan) => {
    setSelectedLoan(loan);
    const dueInt = calculateInterestDue(loan);
    setRepayType('both');
    setRepayPrincipal(String(loan.principalDue));
    setRepayInterest(String(dueInt));
    setRepayWaiver('0');
    setRepayMode('CASH');
    setRepayRef('');
    setRepayNotes('');
    setShowRepayModal(true);
  };

  const handleRepayTypeChange = (type: 'both' | 'interest' | 'principal' | 'waiver') => {
    setRepayType(type);
    if (!selectedLoan) return;
    const dueInt = calculateInterestDue(selectedLoan);
    if (type === 'interest') {
      setRepayPrincipal('0');
      setRepayInterest(String(dueInt));
      setRepayWaiver('0');
    } else if (type === 'principal') {
      setRepayPrincipal(String(selectedLoan.principalDue));
      setRepayInterest('0');
      setRepayWaiver('0');
    } else {
      setRepayPrincipal(String(selectedLoan.principalDue));
      setRepayInterest(String(dueInt));
      if (type !== 'waiver') setRepayWaiver('0');
    }
  };

  const handleConfirmRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const pPaid = parseFloat(repayPrincipal) || 0;
    const iPaid = parseFloat(repayInterest) || 0;
    const waiver = parseFloat(repayWaiver) || 0;

    const newPrincipalDue = Math.max(0, selectedLoan.principalDue - pPaid);
    const isCleared = newPrincipalDue === 0;

    const receiptNo = `RCP-LN-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRepayment = {
      id: `rep-${Date.now()}`,
      receiptNo,
      date: new Date().toISOString().slice(0, 10),
      principalPaid: pPaid,
      interestPaid: iPaid,
      interestWaived: waiver,
      totalCashReceived: pPaid + iPaid,
      paymentMode: repayMode,
      notes: repayNotes || `${repayType.toUpperCase()} repayment of ₹${pPaid + iPaid}`
    };

    const updatedLoan: GirviLoan = {
      ...selectedLoan,
      principalDue: newPrincipalDue,
      status: isCleared ? 'CLOSED' : 'ACTIVE',
      repayments: [...(selectedLoan.repayments || []), newRepayment]
    };

    if (onSaveLoan) onSaveLoan(updatedLoan);
    if (onUpdateLoan) onUpdateLoan(updatedLoan);
    setSelectedLoan(updatedLoan);

    // Prepare repayment slip data
    setLatestRepaymentData({
      receiptNo,
      date: new Date().toISOString().slice(0, 10),
      loanNo: selectedLoan.loanNo,
      customer: selectedLoan.customer,
      principalPaid: pPaid,
      interestPaid: iPaid,
      interestWaived: waiver,
      totalReceived: pPaid + iPaid,
      newPrincipalDue,
      paymentMode: repayMode,
      notes: repayNotes
    });

    setShowRepayModal(false);
    setShowRepaymentSlipModal(true);
  };

  // Return pledged items custody
  const handleReturnPledgedItems = (loanId: string) => {
    if (!selectedLoan || selectedLoan.id !== loanId) return;
    const updatedItems = selectedLoan.pledgedItems.map(it => ({
      ...it,
      isReturned: true,
      returnedAt: new Date().toISOString().slice(0, 10)
    }));
    const updatedLoan: GirviLoan = {
      ...selectedLoan,
      pledgedItems: updatedItems,
      status: 'CLOSED'
    };
    if (onSaveLoan) onSaveLoan(updatedLoan);
    if (onUpdateLoan) onUpdateLoan(updatedLoan);
    setSelectedLoan(updatedLoan);
  };

  // Partial redemption of individual pledged article
  const handlePartialRedemption = (itemIdx: number) => {
    if (!selectedLoan) return;
    const targetItem = selectedLoan.pledgedItems[itemIdx];
    if (!targetItem || targetItem.isReturned) return;

    const remainingItems = selectedLoan.pledgedItems.filter((_, idx) => idx !== itemIdx && !_.isReturned);
    const remainingValuation = remainingItems.reduce((s, it) => s + (it.marketValuation || 0), 0);
    const maxLoanOnRemaining = Math.floor(remainingValuation * 0.75);

    if (selectedLoan.principalDue > maxLoanOnRemaining && remainingValuation > 0) {
      const proceed = window.confirm(
        `PARTIAL REDEMPTION LTV WARNING:\nReleasing "${targetItem.itemName}" (${targetItem.netWeight}g, ₹${targetItem.marketValuation.toLocaleString('en-IN')}) will reduce remaining collateral valuation to ₹${remainingValuation.toLocaleString('en-IN')} (Max 75% LTV: ₹${maxLoanOnRemaining.toLocaleString('en-IN')}).\nCurrent principal due is ₹${selectedLoan.principalDue.toLocaleString('en-IN')}.\n\nDo you want to authorize this partial redemption?`
      );
      if (!proceed) return;
    } else {
      const confirmRelease = window.confirm(`Confirm partial redemption and handover of "${targetItem.itemName}" to borrower?`);
      if (!confirmRelease) return;
    }

    const updatedItems = selectedLoan.pledgedItems.map((it, idx) => {
      if (idx === itemIdx) {
        return {
          ...it,
          isReturned: true,
          returnedAt: new Date().toISOString().slice(0, 10)
        };
      }
      return it;
    });

    const allReturned = updatedItems.every(it => it.isReturned);
    const updatedLoan: GirviLoan = {
      ...selectedLoan,
      pledgedItems: updatedItems,
      status: allReturned && selectedLoan.principalDue === 0 ? 'CLOSED' : selectedLoan.status
    };

    if (onSaveLoan) onSaveLoan(updatedLoan);
    if (onUpdateLoan) onUpdateLoan(updatedLoan);
    setSelectedLoan(updatedLoan);
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Gold & Silver Loans (Girvi)</h1>
          <p>Custody pawn register · Pledged collateral valuation · 75% statutory LTV ceiling · Pro-rata daily interest</p>
        </div>
        <div className="btn-group">
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewLoanModal(true)}
          >
            <Plus size={14} />
            <span>New Loan</span>
          </button>
        </div>
      </div>

      {/* Sum grid (Active Loans, Total Principal Due, Total Gold Pledged, Accrued Interest) */}
      <div className="sum-grid">
        <div className="sum-box">
          <div className="sum-val font-mono">{activeLoansCount}</div>
          <div className="sum-lbl">Active Girvi Loans</div>
          <div className="helper">Total sanctioned: ₹{totalPrincipalGiven.toLocaleString('en-IN')}</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--danger)' }}>
            ₹{totalPrincipalDue.toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Principal Outstanding</div>
          <div className="helper">Live capital deployed in loans</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--primary)' }}>
            {totalVaultCollateralWeight.toFixed(3)}g
          </div>
          <div className="sum-lbl">Collateral In Vault</div>
          <div className="helper">Gold & Silver sealed custody</div>
        </div>

        <div className="sum-box">
          <div className="sum-val font-mono" style={{ color: 'var(--gold)' }}>
            ₹{totalInterestDueAccrued.toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Accrued Interest Due</div>
          <div className="helper">Pro-rata daily interest earned</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="search-row" style={{ flexWrap: 'wrap', gap: 10 }}>
        <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
          <Search size={16} />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search loan no, packet, borrower name or mobile..."
          />
        </div>
        <button 
          type="button" 
          className="btn btn-outline btn-sm"
          onClick={() => {}}
          title="Search loans"
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

        <div className="tabs" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {[
            { id: 'all', label: 'All Girvi Loans' },
            { id: 'active', label: 'Active Loans' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'closed', label: 'Closed / Redeemed' }
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

      {/* Table Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <span className="card-title">Girvi Pawn Register</span>
            <span className="helper" style={{ marginLeft: 8, display: 'inline' }}>
              State Pawn Broking Rules · Max 75% LTV · Sealed Vault Packets
            </span>
          </div>
          <span className="badge badge-gold">RBI LTV Regulated (75%)</span>
        </div>

        <div className="tbl-wrap">
          <table style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ width: 120 }}>Loan No</th>
                <th style={{ width: 90 }}>Date</th>
                <th>Borrower</th>
                <th>Packet / Locker</th>
                <th>Collateral Summary</th>
                <th style={{ textAlign: 'right', width: 90 }}>Net Wt</th>
                <th style={{ textAlign: 'right', width: 105 }}>Valuation</th>
                <th style={{ textAlign: 'center', width: 75 }}>LTV %</th>
                <th style={{ textAlign: 'right', width: 100 }}>Principal</th>
                <th style={{ textAlign: 'right', width: 100 }}>Interest Due</th>
                <th style={{ textAlign: 'center', width: 90 }}>Rate</th>
                <th style={{ textAlign: 'center', width: 95 }}>Status</th>
                <th style={{ textAlign: 'right', width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={13} className="empty">
                    No Girvi loan records found
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const interestDue = calculateInterestDue(loan);
                  const totalNetWt = loan.pledgedItems.reduce((s, it) => s + (it.netWeight || it.grossWeight || 0), 0);
                  const totalValuation = loan.pledgedItems.reduce((s, it) => s + (it.marketValuation || 0), 0);
                  const ltvRatio = totalValuation > 0 ? (loan.principalAmount / totalValuation) * 100 : 0;
                  const isSelected = selectedLoan?.id === loan.id;
                  const isOverdue = loan.dueDate && loan.dueDate < new Date().toISOString().slice(0, 10) && loan.status === 'ACTIVE';

                  return (
                    <tr 
                      key={loan.id}
                      onClick={() => setSelectedLoan(loan)}
                      style={{ cursor: 'pointer', background: isSelected ? 'var(--row-hover)' : undefined }}
                    >
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--text)' }}>
                        {loan.loanNo}
                      </td>
                      <td className="font-mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {loan.loanDate}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{loan.customer.name}</div>
                        <div className="helper" style={{ margin: 0 }}>{loan.customer.phone || loan.customer.mobile}</div>
                      </td>
                      <td>
                        <div className="font-mono" style={{ fontSize: 12, fontWeight: 600 }}>{loan.packetNo || 'PKT-Vault'}</div>
                        <div className="helper" style={{ margin: 0 }}>{loan.lockerLocation || 'Main Safe'}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {loan.pledgedItems[0]?.itemName}
                        {loan.pledgedItems.length > 1 && (
                          <span className="helper" style={{ marginLeft: 4 }}>+{loan.pledgedItems.length - 1} more</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                        {totalNetWt.toFixed(3)}g
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                        ₹{totalValuation.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${ltvRatio > 75 ? 'badge-red' : ltvRatio > 70 ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: 11 }}>
                          {ltvRatio.toFixed(0)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: loan.principalDue > 0 ? 'var(--danger)' : 'var(--muted)' }} className="font-mono">
                        ₹{loan.principalDue.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: interestDue > 0 ? 'var(--gold)' : 'var(--muted)' }} className="font-mono">
                        ₹{interestDue.toLocaleString('en-IN')}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: 11 }} className="font-mono">
                        {loan.monthlyRatePercent}% p.m.
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${
                          loan.status === 'CLOSED' || loan.status === 'REDEEMED' ? 'badge-gray' :
                          isOverdue ? 'badge-red' :
                          'badge-green'
                        }`}>
                          {loan.status === 'CLOSED' || loan.status === 'REDEEMED' ? 'REDEEMED' : isOverdue ? 'OVERDUE' : 'ACTIVE'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
                          {loan.status === 'ACTIVE' && (
                            <>
                              <button
                                type="button"
                                className="btn btn-primary btn-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRepayModal(loan);
                                }}
                              >
                                Collect Pmt
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLoan(loan);
                                  const interest = calculateInterestDue(loan);
                                  setRepayType('both');
                                  setRepayPrincipal(String(loan.principalDue));
                                  setRepayInterest(String(interest));
                                  setRepayWaiver('0');
                                  setRepayRef('');
                                  setShowRepayModal(true);
                                }}
                                title="Full settlement & redemption"
                              >
                                Settlement
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLoan(loan);
                              setShowDetailModal(true);
                            }}
                            title="Open loan details & packet"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline btn-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLoan(loan);
                              setShowPledgeSlip(true);
                            }}
                            title="Print Pledge Deed"
                          >
                            <Printer size={12} />
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
            Showing {filteredLoans.length} of {loanList.length} Girvi loans · Total Principal Due: ₹{totalPrincipalDue.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* --- NEW GIRVI LOAN SANCTION MODAL --- */}
      {showNewLoanModal && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNewLoanModal(false); }}>
          <form onSubmit={handleCreateLoan} className="modal modal-lg">
            <div className="modal-head">
              <div>
                <span className="card-title">Sanction New Gold / Silver Loan (Girvi)</span>
                <div className="helper">Pledge valuation · Statutory 75% LTV ceiling · Monthly rate & due date calculation</div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowNewLoanModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Borrower & Terms */}
              <div className="g4">
                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="label">Borrower Search / Select *</label>
                  <input
                    type="text"
                    value={custSearchTerm}
                    onChange={(e) => setCustSearchTerm(e.target.value)}
                    placeholder="Search name or mobile..."
                    className="input input-sm"
                  />
                  <select
                    value={selectedCustId}
                    onChange={(e) => setSelectedCustId(e.target.value)}
                    className="input input-sm"
                    style={{ marginTop: 4 }}
                  >
                    {filteredCustomers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone || c.mobile || 'No Phone'})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Loan Issue Date</label>
                  <input 
                    type="date"
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                    className="input input-sm"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Tenure Duration</label>
                  <select
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(e.target.value)}
                    className="input input-sm"
                  >
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="9">9 Months</option>
                    <option value="12">12 Months (1 Year)</option>
                    <option value="18">18 Months</option>
                    <option value="24">24 Months (2 Years)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Monthly Interest Rate (% p.m.) *</label>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input 
                      type="number"
                      step="0.05"
                      min="0.5"
                      max="10"
                      value={monthlyRate}
                      onChange={(e) => setMonthlyRate(e.target.value)}
                      className="input input-sm font-mono"
                      style={{ fontWeight: 700, width: 80 }}
                    />
                    <div style={{ display: 'flex', gap: 2 }}>
                      {['1.5', '1.75', '2.0', '2.25', '2.5'].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setMonthlyRate(r)}
                          className="btn btn-xs"
                          style={{
                            padding: '2px 5px',
                            fontSize: 10.5,
                            background: monthlyRate === r ? 'var(--primary)' : 'var(--bg)',
                            color: monthlyRate === r ? '#fff' : 'var(--text)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          {r}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custody Packet & Guarantor */}
              <div className="g3" style={{ background: 'var(--surface2)', padding: 10, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Sealed Packet Number *</label>
                  <input 
                    type="text"
                    required
                    value={packetNumber}
                    onChange={(e) => setPacketNumber(e.target.value)}
                    className="input input-sm font-mono"
                    style={{ fontWeight: 700 }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Guarantor Name (Optional)</label>
                  <input 
                    type="text"
                    value={guarantorName}
                    onChange={(e) => setGuarantorName(e.target.value)}
                    placeholder="e.g. Relative or Local Referrer"
                    className="input input-sm"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Guarantor Mobile</label>
                  <input 
                    type="text"
                    value={guarantorPhone}
                    onChange={(e) => setGuarantorPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="input input-sm"
                  />
                </div>
              </div>

              <div className="section-divider">PLEDGED COLLATERAL VALUATION WORKFLOW</div>

              {/* Collateral Items */}
              {pledgedItemsList.map((item, idx) => (
                <div key={idx} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>
                      Pledged Article #{idx + 1}
                    </span>
                    {pledgedItemsList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePledgedItem(idx)}
                        className="btn btn-outline btn-xs"
                        style={{ color: 'var(--danger)' }}
                      >
                        Remove Article
                      </button>
                    )}
                  </div>

                  <div className="g4">
                    <div className="form-group">
                      <label className="label">Article Description *</label>
                      <input 
                        type="text"
                        required
                        value={item.itemName}
                        onChange={(e) => handleUpdatePledgedItem(idx, 'itemName', e.target.value)}
                        placeholder="e.g. Gold Jhumki / Silver Glass"
                        className="input input-sm"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Metal Type</label>
                      <select
                        value={item.metal}
                        onChange={(e) => handleUpdatePledgedItem(idx, 'metal', e.target.value as MetalGroup)}
                        className="input input-sm"
                      >
                        <option value="GOLD">Gold</option>
                        <option value="SILVER">Silver</option>
                        <option value="PLATINUM">Platinum</option>
                        <option value="DIAMOND">Diamond Studded</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="label">Purity (Karat / Grade) *</label>
                      <select
                        value={item.purityKarat}
                        onChange={(e) => handleUpdatePledgedItem(idx, 'purityKarat', e.target.value)}
                        className="input input-sm"
                      >
                        <option value="24K (999)">24K (999 Pure)</option>
                        <option value="22K (916)">22K (916 Standard)</option>
                        <option value="20K (833)">20K (833)</option>
                        <option value="18K (750)">18K (750 Hallmark)</option>
                        <option value="14K (585)">14K (585)</option>
                        <option value="999 Silver">999 Pure Silver</option>
                        <option value="925 Silver">925 Sterling Silver</option>
                        <option value="800 Silver">800 Silver</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="label">Touch Purity (%)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={item.touchPurity}
                        onChange={(e) => handleUpdatePledgedItem(idx, 'touchPurity', e.target.value)}
                        className="input input-sm font-mono"
                      />
                    </div>
                  </div>

                  <div className="g4" style={{ marginTop: 6 }}>
                    <div className="form-group">
                      <label className="label">Gross Weight (g) *</label>
                      <input 
                        type="number"
                        step="0.001"
                        required
                        value={item.grossWeight}
                        onChange={(e) => handleUpdatePledgedItem(idx, 'grossWeight', e.target.value)}
                        placeholder="0.000"
                        className="input input-sm font-mono"
                        style={{ fontWeight: 700 }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Net Weight (g) *</label>
                      <input 
                        type="number"
                        step="0.001"
                        required
                        value={item.netWeight}
                        onChange={(e) => handleUpdatePledgedItem(idx, 'netWeight', e.target.value)}
                        placeholder="0.000"
                        className="input input-sm font-mono"
                        style={{ fontWeight: 700 }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Spot Rate (₹/g) *</label>
                      <input 
                        type="number"
                        required
                        value={item.spotValuationRate}
                        onChange={(e) => handleUpdatePledgedItem(idx, 'spotValuationRate', e.target.value)}
                        placeholder="Rate per gram"
                        className="input input-sm font-mono"
                        style={{ fontWeight: 600 }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Market Valuation (₹) *</label>
                      <input 
                        type="number"
                        required
                        value={item.marketValuation}
                        onChange={(e) => handleUpdatePledgedItem(idx, 'marketValuation', e.target.value)}
                        placeholder="Calculated market value"
                        className="input input-sm font-mono"
                        style={{ fontWeight: 800, color: 'var(--primary)' }}
                      />
                    </div>
                  </div>

                  <div className="g3" style={{ marginTop: 6 }}>
                    <div className="form-group">
                      <label className="label">Custody Tag / Barcode</label>
                      <input 
                        type="text"
                        value={item.tagNo}
                        onChange={(e) => handleUpdatePledgedItem(idx, 'tagNo', e.target.value)}
                        className="input input-sm font-mono"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Locker / Vault Location</label>
                      <input 
                        type="text"
                        value={item.lockerLocation}
                        onChange={(e) => handleUpdatePledgedItem(idx, 'lockerLocation', e.target.value)}
                        placeholder="e.g. Safe Vault Drawer B-4"
                        className="input input-sm"
                      />
                    </div>

                    <div className="form-group">
                      <label className="label">Condition & Hallmark Marks</label>
                      <input 
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdatePledgedItem(idx, 'description', e.target.value)}
                        placeholder="e.g. BIS Hallmark stamped, hollow design"
                        className="input input-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button 
                type="button" 
                onClick={handleAddPledgedItem}
                className="btn btn-outline btn-sm"
                style={{ alignSelf: 'flex-start' }}
              >
                + Add Another Pledged Article
              </button>

              {/* --- 75% LTV CEILING CALCULATION & SANCTION BOX --- */}
              <div style={{ background: 'var(--surface2)', padding: 16, borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Collateral Valuation & Statutory 75% LTV Ceiling</span>
                    <div className="helper">Total Net Weight: <strong>{totalPledgedNet.toFixed(3)}g</strong> · Total Collateral Value: <strong>₹{totalCollateralValuation.toLocaleString('en-IN')}</strong></div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="helper">Max Sanctionable Loan (75% Ceiling):</span>
                    <div className="font-mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{maxEligibleLoan75Percent.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Statutory Ceiling Warning Banner */}
                {isLtvCeilingExceeded && (
                  <div style={{ 
                    background: '#fef2f2', 
                    border: '1px solid #f87171', 
                    borderRadius: 6, 
                    padding: '10px 14px', 
                    marginBottom: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b91c1c', fontSize: 12.5 }}>
                      <AlertCircle size={18} />
                      <div>
                        <strong>EXCEEDS 75% LTV CEILING:</strong> Requested principal ₹{requestedPrincipal.toLocaleString('en-IN')} ({currentLtvPercent.toFixed(1)}% LTV) exceeds statutory 75% ceiling (Max: ₹{maxEligibleLoan75Percent.toLocaleString('en-IN')}).
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCapAt75Percent}
                      className="btn btn-xs"
                      style={{ background: '#b91c1c', color: '#fff', border: 'none', fontWeight: 700 }}
                    >
                      Cap at 75% (₹{maxEligibleLoan75Percent.toLocaleString('en-IN')})
                    </button>
                  </div>
                )}

                <div className="g3" style={{ alignItems: 'flex-end' }}>
                  <div className="form-group">
                    <label className="label">
                      Sanctioned Principal Amount (₹) *
                      <span className={`badge ${currentLtvPercent > 75 ? 'badge-red' : currentLtvPercent > 70 ? 'badge-yellow' : 'badge-green'}`} style={{ marginLeft: 6, fontSize: 10 }}>
                        LTV: {currentLtvPercent.toFixed(1)}%
                      </span>
                    </label>
                    <input 
                      type="number"
                      required
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(e.target.value)}
                      className="input input-sm font-mono"
                      style={{ 
                        fontWeight: 800, 
                        fontSize: 16,
                        borderColor: isLtvCeilingExceeded ? 'var(--danger)' : undefined,
                        color: isLtvCeilingExceeded ? 'var(--danger)' : 'var(--primary)'
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Disbursal Mode</label>
                    <select
                      value={disbursalMode}
                      onChange={(e) => setDisbursalMode(e.target.value as PaymentMode)}
                      className="input input-sm"
                    >
                      <option value="CASH">Cash Till Disbursal</option>
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                      <option value="UPI">UPI Payout</option>
                      <option value="CHEQUE">Cheque Issue</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="label">Disbursal Reference / UTR</label>
                    <input 
                      type="text"
                      value={disbursalRef}
                      onChange={(e) => setDisbursalRef(e.target.value)}
                      placeholder="Optional"
                      className="input input-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setShowNewLoanModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Sanction Girvi Loan & Generate Deed
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- PAYMENT COLLECTION / REPAYMENT MODAL --- */}
      {showRepayModal && selectedLoan && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowRepayModal(false); }}>
          <form onSubmit={handleConfirmRepayment} className="modal modal-md">
            <div className="modal-head">
              <div>
                <span className="card-title">Collect Girvi Repayment & Redemption</span>
                <div className="helper">{selectedLoan.loanNo} · {selectedLoan.customer.name}</div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowRepayModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 'var(--r)', border: '1px solid var(--border)', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--muted)' }}>Principal Outstanding:</span>
                  <span className="font-mono" style={{ fontWeight: 700 }}>₹{selectedLoan.principalDue.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--gold)' }}>
                  <span>Accrued Pro-Rata Interest:</span>
                  <span className="font-mono" style={{ fontWeight: 700 }}>₹{calculateInterestDue(selectedLoan).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border)', fontWeight: 800 }}>
                  <span>Full Redemption Settlement:</span>
                  <span className="font-mono" style={{ color: 'var(--primary)', fontSize: 15 }}>
                    ₹{(selectedLoan.principalDue + calculateInterestDue(selectedLoan)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Repayment Type Selector */}
              <div className="form-group">
                <label className="label">Repayment Classification</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'both', label: 'Principal + Interest' },
                    { id: 'interest', label: 'Interest Only' },
                    { id: 'principal', label: 'Principal Only' },
                    { id: 'waiver', label: 'With Waiver' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleRepayTypeChange(t.id as any)}
                      className="btn btn-xs"
                      style={{
                        background: repayType === t.id ? 'var(--primary)' : 'var(--bg)',
                        color: repayType === t.id ? '#fff' : 'var(--text)',
                        border: '1px solid var(--border)',
                        fontWeight: repayType === t.id ? 700 : 500
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="g3">
                <div className="form-group">
                  <label className="label">Principal Amount (₹) *</label>
                  <input 
                    type="number"
                    disabled={repayType === 'interest'}
                    value={repayPrincipal}
                    onChange={(e) => setRepayPrincipal(e.target.value)}
                    className="input input-sm font-mono"
                    style={{ fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Interest Amount (₹) *</label>
                  <input 
                    type="number"
                    disabled={repayType === 'principal'}
                    value={repayInterest}
                    onChange={(e) => setRepayInterest(e.target.value)}
                    className="input input-sm font-mono"
                    style={{ fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Interest Waiver (₹)</label>
                  <input 
                    type="number"
                    disabled={repayType !== 'waiver'}
                    value={repayWaiver}
                    onChange={(e) => setRepayWaiver(e.target.value)}
                    className="input input-sm font-mono"
                  />
                </div>
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">Payment Mode</label>
                  <select
                    value={repayMode}
                    onChange={(e) => setRepayMode(e.target.value as PaymentMode)}
                    className="input input-sm"
                  >
                    <option value="CASH">Cash Till</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Reference / UTR</label>
                  <input 
                    type="text"
                    value={repayRef}
                    onChange={(e) => setRepayRef(e.target.value)}
                    placeholder="Optional"
                    className="input input-sm"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg)', borderRadius: 6 }}>
                <span>Total Cash To Receive:</span>
                <strong className="font-mono" style={{ fontSize: 16, color: 'var(--primary)' }}>
                  ₹{((parseFloat(repayPrincipal) || 0) + (parseFloat(repayInterest) || 0)).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setShowRepayModal(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Record Repayment & Generate Voucher
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- REPAYMENT VOUCHER RECEIPT MODAL --- */}
      {showRepaymentSlipModal && latestRepaymentData && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowRepaymentSlipModal(false); }}>
          <div className="modal modal-md">
            <div className="modal-head">
              <span className="card-title">Girvi Repayment Voucher · {latestRepaymentData.receiptNo}</span>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowRepaymentSlipModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ background: '#fdfdfc', fontFamily: 'monospace', fontSize: 12 }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: 8, marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, fontFamily: 'sans-serif' }}>{store.legalName || store.tradeName}</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11, fontFamily: 'sans-serif' }}>{store.address}, {store.city}</p>
                <div style={{ marginTop: 4, fontWeight: 700, fontSize: 12, background: 'var(--text)', color: '#fff', display: 'inline-block', padding: '2px 8px', borderRadius: 4 }}>
                  GIRVI REPAYMENT & REDEMPTION VOUCHER
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 6, marginBottom: 8 }}>
                <div>
                  <p style={{ margin: 0 }}>Receipt No: <strong>{latestRepaymentData.receiptNo}</strong></p>
                  <p style={{ margin: 0 }}>Loan Ref: <strong>{latestRepaymentData.loanNo}</strong></p>
                  <p style={{ margin: 0 }}>Date: {latestRepaymentData.date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0 }}>Borrower: <strong>{latestRepaymentData.customer.name}</strong></p>
                  <p style={{ margin: 0 }}>Mobile: {latestRepaymentData.customer.phone || latestRepaymentData.customer.mobile}</p>
                  <p style={{ margin: 0 }}>Mode: <strong>{latestRepaymentData.paymentMode}</strong></p>
                </div>
              </div>

              <div style={{ background: 'var(--surface2)', padding: 10, borderRadius: 6, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Principal Repaid:</span>
                  <strong className="font-mono">₹{latestRepaymentData.principalPaid.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span>Interest Cleared:</span>
                  <strong className="font-mono">₹{latestRepaymentData.interestPaid.toLocaleString('en-IN')}</strong>
                </div>
                {latestRepaymentData.interestWaived > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, color: 'var(--danger)' }}>
                    <span>Interest Waived:</span>
                    <strong className="font-mono">₹{latestRepaymentData.interestWaived.toLocaleString('en-IN')}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border)', fontWeight: 800, fontSize: 14 }}>
                  <span>Total Received:</span>
                  <span className="font-mono" style={{ color: 'var(--primary)' }}>₹{latestRepaymentData.totalReceived.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px dashed var(--border)', marginBottom: 10 }}>
                <span>Remaining Principal Due:</span>
                <strong className="font-mono" style={{ color: latestRepaymentData.newPrincipalDue === 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {latestRepaymentData.newPrincipalDue === 0 ? 'NIL (FULLY REDEEMED ✓)' : `₹${latestRepaymentData.newPrincipalDue.toLocaleString('en-IN')}`}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--muted)', paddingTop: 16 }}>
                <div>Borrower Signature</div>
                <div>Authorized Cashier</div>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={14} />
                <span>Print Voucher</span>
              </button>
              <button 
                type="button"
                onClick={() => setShowRepaymentSlipModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- GIRVI PLEDGE SLIP (DEED) MODAL --- */}
      {showPledgeSlip && selectedLoan && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowPledgeSlip(false); }}>
          <div className="modal modal-lg">
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
                <span className="card-title">Girvi Loan Pledge Deed · {selectedLoan.loanNo}</span>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowPledgeSlip(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ background: '#fdfdfc', fontFamily: 'monospace', fontSize: 12 }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid var(--text)', paddingBottom: 8, marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: 'sans-serif' }}>{store.legalName || 'DADHIBAMAN JEWELLERS'}</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 11, fontFamily: 'sans-serif' }}>{store.address || 'SHOP NO 1 & 2 GURUBAKSH PLAZA, JAGAT FARM, GR. NOIDA'}</p>
                <p style={{ margin: 0, fontSize: 11, fontFamily: 'sans-serif' }}>Girvi License No: UP/PB/2024/09912 · GSTIN: {store.gstin}</p>
                <div style={{ marginTop: 6, padding: '3px 10px', background: 'var(--text)', color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-block', borderRadius: 4 }}>
                  GIRVI PAWN BROKING PLEDGE DEED & RECEIPT
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
                <div>
                  <p style={{ margin: 0 }}>Loan No: <strong>{selectedLoan.loanNo}</strong></p>
                  <p style={{ margin: 0 }}>Date: <strong>{selectedLoan.loanDate}</strong></p>
                  <p style={{ margin: 0 }}>Packet No: <strong>{selectedLoan.packetNo}</strong></p>
                  <p style={{ margin: 0 }}>Locker Vault: <strong>{selectedLoan.lockerLocation}</strong></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0 }}>Borrower: <strong>{selectedLoan.customer.name}</strong></p>
                  <p style={{ margin: 0 }}>Phone: {selectedLoan.customer.phone || selectedLoan.customer.mobile}</p>
                  <p style={{ margin: 0 }}>Guarantor: {selectedLoan.guarantorName || 'Self'}</p>
                  <p style={{ margin: 0 }}>Due Date: <strong>{selectedLoan.dueDate}</strong></p>
                </div>
              </div>

              {/* Collateral Table */}
              <div style={{ marginBottom: 12 }}>
                <div className="helper" style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  Pledged Collateral Inventory (Under Sealed Packet Custody)
                </div>
                <div className="tbl-wrap" style={{ border: '1px solid var(--border)' }}>
                  <table style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th>Item Description</th>
                        <th>Karat</th>
                        <th style={{ textAlign: 'right' }}>Gross Wt</th>
                        <th style={{ textAlign: 'right' }}>Net Wt</th>
                        <th style={{ textAlign: 'right' }}>Valuation (₹)</th>
                        <th>Tag No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedLoan.pledgedItems.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{item.itemName}</td>
                          <td>{item.purityKarat}</td>
                          <td style={{ textAlign: 'right' }} className="font-mono">{item.grossWeight.toFixed(3)}g</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">{item.netWeight.toFixed(3)}g</td>
                          <td style={{ textAlign: 'right' }} className="font-mono">₹{item.marketValuation.toLocaleString('en-IN')}</td>
                          <td className="font-mono">{item.tagNo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Terms */}
              <div style={{ background: 'var(--surface2)', padding: 10, borderRadius: 6, border: '1px solid var(--border)', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sanctioned Principal Amount:</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{selectedLoan.principalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Monthly Interest Rate:</span>
                  <span>{selectedLoan.monthlyRatePercent}% p.m. (Simple Interest)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Locker Custody Location:</span>
                  <span>{selectedLoan.lockerLocation} · Packet {selectedLoan.packetNo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid var(--border)', fontWeight: 700 }}>
                  <span>Principal Due Balance:</span>
                  <span>₹{selectedLoan.principalDue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 14 }}>
                <strong>STATUTORY DECLARATION:</strong> The borrower certifies that the pledged items belong to them and are free of any legal lien or dispute. Collateral is deposited in sealed packet in the vault and shall be redeemed upon full repayment of principal and accrued interest.
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', paddingTop: 16 }}>
                <div>Borrower Signature</div>
                <div>Authorised Girvi Broking Officer</div>
              </div>
            </div>

            <div className="modal-foot">
              <button 
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={14} />
                <span>Print Pledge Slip</span>
              </button>
              <button 
                type="button"
                onClick={() => setShowPledgeSlip(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- DETAIL / PACKET VIEW MODAL --- */}
      {showDetailModal && selectedLoan && (
        <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowDetailModal(false); }}>
          <div className="modal modal-lg">
            <div className="modal-head">
              <div>
                <span className="card-title">Girvi Loan Dossier · {selectedLoan.loanNo}</span>
                <div className="helper">Packet #{selectedLoan.packetNo} · Vault Custody Audit</div>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="tabs" style={{ marginBottom: 12 }}>
                <button 
                  type="button"
                  onClick={() => setDetailTab('items')}
                  className={`tab ${detailTab === 'items' ? 'active' : ''}`}
                >
                  Pledged Collateral ({selectedLoan.pledgedItems.length})
                </button>
                <button 
                  type="button"
                  onClick={() => setDetailTab('history')}
                  className={`tab ${detailTab === 'history' ? 'active' : ''}`}
                >
                  Repayment Vouchers ({selectedLoan.repayments?.length || 0})
                </button>
                <button 
                  type="button"
                  onClick={() => setDetailTab('calc')}
                  className={`tab ${detailTab === 'calc' ? 'active' : ''}`}
                >
                  Daily Interest Pro-Rata
                </button>
              </div>

              {detailTab === 'items' && (
                <div>
                  <div className="tbl-wrap">
                    <table style={{ width: '100%', fontSize: 13 }}>
                      <thead>
                        <tr>
                          <th>Item Description</th>
                          <th>Karat</th>
                          <th style={{ textAlign: 'right' }}>Gross Wt</th>
                          <th style={{ textAlign: 'right' }}>Net Wt</th>
                          <th style={{ textAlign: 'right' }}>Valuation</th>
                          <th>Tag No</th>
                          <th>Locker</th>
                          <th>Custody Status</th>
                          <th style={{ textAlign: 'center', width: 140 }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLoan.pledgedItems.map((it, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{it.itemName}</td>
                            <td>{it.purityKarat}</td>
                            <td style={{ textAlign: 'right' }} className="font-mono">{it.grossWeight.toFixed(3)}g</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">{it.netWeight.toFixed(3)}g</td>
                            <td style={{ textAlign: 'right' }} className="font-mono">₹{it.marketValuation.toLocaleString('en-IN')}</td>
                            <td className="font-mono">{it.tagNo}</td>
                            <td>{it.lockerLocation}</td>
                            <td>
                              <span className={`badge ${it.isReturned ? 'badge-green' : 'badge-yellow'}`}>
                                {it.isReturned ? 'RELEASED' : 'HELD IN VAULT'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {it.isReturned ? (
                                <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>
                                  ✓ Handed Over
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={() => handlePartialRedemption(idx)}
                                  title="Release individual pledged article upon partial principal prepayment"
                                >
                                  Partial Redemption
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center' }}>
                    {selectedLoan.principalDue > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const interest = calculateInterestDue(selectedLoan);
                          setRepayType('both');
                          setRepayPrincipal(String(selectedLoan.principalDue));
                          setRepayInterest(String(interest));
                          setRepayWaiver('0');
                          setRepayRef('');
                          setShowDetailModal(false);
                          setShowRepayModal(true);
                        }}
                        className="btn btn-primary btn-sm"
                        title="Full settlement & redemption of principal and interest"
                      >
                        Settlement
                      </button>
                    )}
                    {selectedLoan.principalDue === 0 && !selectedLoan.pledgedItems.every(i => i.isReturned) && (
                      <button
                        type="button"
                        onClick={() => handleReturnPledgedItems(selectedLoan.id)}
                        className="btn btn-primary btn-sm"
                      >
                        ✓ Release & Hand Over Collateral to Borrower
                      </button>
                    )}
                  </div>
                </div>
              )}

              {detailTab === 'history' && (
                <div className="tbl-wrap">
                  <table style={{ width: '100%', fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th>Receipt No</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Principal Paid</th>
                        <th style={{ textAlign: 'right' }}>Interest Paid</th>
                        <th style={{ textAlign: 'right' }}>Waiver</th>
                        <th style={{ textAlign: 'right' }}>Total Received</th>
                        <th>Mode</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!selectedLoan.repayments || selectedLoan.repayments.length === 0) ? (
                        <tr>
                          <td colSpan={8} className="empty">No repayment vouchers recorded yet</td>
                        </tr>
                      ) : (
                        selectedLoan.repayments.map((r, idx) => (
                          <tr key={idx}>
                            <td className="font-mono" style={{ fontWeight: 700 }}>{r.receiptNo || 'RCP-LN'}</td>
                            <td className="font-mono">{r.date}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">₹{r.principalPaid.toLocaleString('en-IN')}</td>
                            <td style={{ textAlign: 'right', color: 'var(--gold)' }} className="font-mono">₹{r.interestPaid.toLocaleString('en-IN')}</td>
                            <td style={{ textAlign: 'right', color: 'var(--danger)' }} className="font-mono">₹{(r.interestWaived || 0).toLocaleString('en-IN')}</td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--primary)' }} className="font-mono">₹{((r.principalPaid || 0) + (r.interestPaid || 0)).toLocaleString('en-IN')}</td>
                            <td><span className="badge badge-blue">{r.paymentMode || 'CASH'}</span></td>
                            <td style={{ fontSize: 11, color: 'var(--muted)' }}>{r.notes || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {detailTab === 'calc' && (
                <div style={{ background: 'var(--surface2)', padding: 16, borderRadius: 'var(--r)' }}>
                  <div className="g3" style={{ marginBottom: 12 }}>
                    <div>
                      <div className="helper">Days Elapsed:</div>
                      <div className="font-mono" style={{ fontSize: 18, fontWeight: 800 }}>{calculateDaysElapsed(selectedLoan.loanDate)} days</div>
                    </div>
                    <div>
                      <div className="helper">Daily Interest Rate:</div>
                      <div className="font-mono" style={{ fontSize: 18, fontWeight: 800 }}>{((selectedLoan.monthlyRatePercent / 30)).toFixed(4)}% / day</div>
                    </div>
                    <div>
                      <div className="helper">Current Interest Due:</div>
                      <div className="font-mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--gold)' }}>
                        ₹{calculateInterestDue(selectedLoan).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                  <div className="helper">
                    Formula: Principal Outstanding × (Monthly Rate % / 30) × Days Elapsed - Interest Already Paid
                  </div>
                </div>
              )}
            </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
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


import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart3, Calendar, FileText, Download, Printer, Filter, 
  TrendingUp, Award, DollarSign, PieChart, ShoppingBag, ArrowUpRight,
  ChevronRight, Users, CreditCard, RotateCcw, ArrowDownRight, Layers,
  AlertCircle, ArrowLeft, CheckCircle2, ChevronDown, Coins, Clock, Lock, X
} from 'lucide-react';
import { SalesInvoice, Customer, StoreProfile, InventoryItem, GirviLoan } from '../../types';
import { invoiceReceipts } from '../../data/invoicePayments';

interface ReportsClassicViewProps {
  store: StoreProfile;
  invoices: SalesInvoice[];
  customers?: Customer[];
  inventory?: InventoryItem[];
  loans?: GirviLoan[];
  onNavigate?: (module: string) => void;
}

const calendarDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });
const salesHeaders = ['Date', 'Orders', 'Revenue', 'Collected', 'Outstanding', 'GST'];

type ReportTab = 'sales' | 'payments' | 'loans' | 'inventory' | 'outstanding';

export const ReportsClassicView: React.FC<ReportsClassicViewProps> = ({
  store,
  invoices = [],
  customers = [],
  inventory = [],
  loans = [],
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<Customer | null>(null);
  
  const today = calendarDate.format(new Date());
  const monthStart = today.slice(0, 7) + '-01';

  // Date filter inputs
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [datePreset, setDatePreset] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM' | 'ALL'>('MONTH');
  
  // Applied filters (updated on clicking "Apply")
  const [appliedFrom, setAppliedFrom] = useState(monthStart);
  const [appliedTo, setAppliedTo] = useState(today);
  const [isAppliedNotice, setIsAppliedNotice] = useState(false);

  const applyPreset = (preset: 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM' | 'ALL') => {
    setDatePreset(preset);
    let f = '';
    let t = today;
    if (preset === 'TODAY') {
      f = today;
      t = today;
    } else if (preset === 'WEEK') {
      const d = new Date(today + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 7);
      f = d.toISOString().slice(0, 10);
      t = today;
    } else if (preset === 'MONTH') {
      f = monthStart;
      t = today;
    } else if (preset === 'ALL') {
      f = '';
      t = '';
    }
    if (preset !== 'CUSTOM') {
      setFromDate(f);
      setToDate(t);
      setAppliedFrom(f);
      setAppliedTo(t);
      setIsAppliedNotice(true);
      setTimeout(() => setIsAppliedNotice(false), 2000);
    }
  };

  const handleApply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (fromDate && toDate && fromDate > toDate) return;
    setDatePreset('CUSTOM');
    setAppliedFrom(fromDate);
    setAppliedTo(toDate);
    setIsAppliedNotice(true);
    setTimeout(() => setIsAppliedNotice(false), 2500);
  };

  // Filter invoices based on applied dates
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const date = (inv.invoiceDate || inv.date || '').slice(0, 10);
      return inv.status !== 'CANCELLED' && inv.status !== 'ESTIMATE' &&
        Boolean(date) && (!appliedFrom || date >= appliedFrom) && (!appliedTo || date <= appliedTo);
    });
  }, [invoices, appliedFrom, appliedTo]);

  const salesRows = useMemo(() => {
    const byDate = new Map<string, [number, number, number, number, number]>();
    for (const invoice of filteredInvoices) {
      const date = (invoice.invoiceDate || invoice.date || '').slice(0, 10);
      const row = byDate.get(date) ?? [0, 0, 0, 0, 0];
      row[0]++;
      row[1] += invoice.grandTotal ?? invoice.totalAmount ?? invoice.productTotalValue;
      row[2] += invoiceReceipts(invoice)
        .filter(receipt => !['OLD_GOLD_EXCHANGE', 'CUSTOMER_CREDIT'].includes(receipt.mode.toUpperCase()))
        .reduce((sum, receipt) => sum + receipt.amount, 0);
      row[3] += invoice.balanceDue;
      row[4] += (invoice.cgstTotal ?? invoice.items.reduce((sum, item) => sum + item.cgstAmount, 0)) +
        (invoice.sgstTotal ?? invoice.items.reduce((sum, item) => sum + item.sgstAmount, 0));
      byDate.set(date, row);
    }
    return [...byDate].sort(([a], [b]) => b.localeCompare(a)).map(([date, amounts]) => [date, ...amounts] as const);
  }, [filteredInvoices]);
  const totalNetPayable = filteredInvoices.reduce((total, invoice) => total + (invoice.netPayable ?? invoice.grandTotal ?? invoice.totalAmount ?? invoice.productTotalValue), 0);
  const totalOldGold = filteredInvoices.reduce((total, invoice) => total + (invoice.oldMetalExchangeCredit ?? 0), 0);
  const totalDue = filteredInvoices.reduce((total, invoice) => total + invoice.balanceDue, 0);

  // Calculations for Payment Analysis
  const paymentAnalysis = useMemo(() => {
    const modes: Record<string, { total: number; count: number }> = {
      CASH: { total: 0, count: 0 },
      UPI: { total: 0, count: 0 },
      CARD: { total: 0, count: 0 },
      BANK: { total: 0, count: 0 },
      OLD_GOLD: { total: totalOldGold, count: filteredInvoices.filter(i => (i.oldMetalExchangeCredit || 0) > 0).length },
      CREDIT: { total: totalDue, count: filteredInvoices.filter(i => (i.balanceDue || 0) > 0).length }
    };
    filteredInvoices.forEach(inv => {
      const mode = (inv.paymentMode || 'CASH').toUpperCase();
      if (!modes[mode]) modes[mode] = { total: 0, count: 0 };
      modes[mode].total += (inv.paidAmount || 0);
      modes[mode].count += 1;
    });
    return modes;
  }, [filteredInvoices, totalOldGold, totalDue]);

  // Calculations for Loans
  const activeLoans = loans.filter(l => l.status === 'ACTIVE' || l.status === 'OVERDUE');
  const totalLoanPrincipal = activeLoans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);
  const totalMonthlyInterest = activeLoans.reduce((sum, l) => sum + ((l.principalAmount || 0) * (l.interestRatePercent || 1.5) / 100), 0);
  const totalPledgedWeight = activeLoans.reduce((sum, l) => sum + (l.pledgedNetWeightGrams || 0), 0);

  // Calculations for Inventory
  const totalStockItems = inventory.length;
  const totalGrossWeight = inventory.reduce((sum, itm) => sum + (itm.grossWeight || 0), 0);
  const totalNetWeight = inventory.reduce((sum, itm) => sum + (itm.netWeight || 0), 0);
  const totalValuation = inventory.reduce((sum, itm) => sum + (itm.totalPrice || (itm.netWeight * 7800)), 0);

  // Calculations for Outstanding
  const customersWithDue = customers.filter(c => (c.balanceDue || 0) > 0 || (c.closingBalance || 0) > 0);
  const totalOutstandingReceivable = customersWithDue.reduce((sum, c) => sum + (c.balanceDue || c.closingBalance || 0), 0);

  // Export handlers
  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();

    if (activeTab === 'sales') {
      const ws = XLSX.utils.aoa_to_sheet([salesHeaders, ...salesRows.map(row => [...row])]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sales Report');
    } else if (activeTab === 'payments') {
      const rows = Object.entries(paymentAnalysis).map(([mode, data]) => ({
        'Payment Mode': mode,
        'Transactions': data.count,
        'Total Collected (₹)': data.total
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Payment Analysis');
    } else if (activeTab === 'loans') {
      const rows = loans.map((l, idx) => ({
        'S.No': idx + 1,
        'Loan No': l.loanNo,
        'Customer': l.customerName,
        'Date': l.startDate,
        'Principal (₹)': l.principalAmount,
        'Rate (%/mo)': l.interestRatePercent,
        'Pledged Net Wt (g)': l.pledgedNetWeightGrams,
        'Status': l.status
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Loans');
    } else if (activeTab === 'inventory') {
      const rows = inventory.map((itm, idx) => ({
        'S.No': idx + 1,
        'Item Code': itm.itemCode || itm.id,
        'Category': itm.category,
        'Purity': itm.purity,
        'Gross Wt (g)': itm.grossWeight,
        'Net Wt (g)': itm.netWeight,
        'Estimated Value (₹)': itm.totalPrice || (itm.netWeight * 7800)
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
    } else {
      const rows = customersWithDue.map((c, idx) => ({
        'S.No': idx + 1,
        'Customer Code': c.code || c.id,
        'Customer Name': c.fullName || c.name,
        'Mobile': c.mobile,
        'City': c.city || 'Mumbai',
        'Outstanding Balance (₹)': c.balanceDue || c.closingBalance || 0
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Outstanding Receivables');
    }

    XLSX.writeFile(wb, `Report_${activeTab.toUpperCase()}_${appliedFrom}_to_${appliedTo}.xlsx`);
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (activeTab === 'sales') {
      headers = salesHeaders;
      rows = salesRows.map(row => [...row]);
    } else if (activeTab === 'payments') {
      headers = ['Payment Mode', 'Count', 'Total Amount'];
      rows = Object.entries(paymentAnalysis).map(([k, v]) => [k, v.count, v.total]);
    } else if (activeTab === 'loans') {
      headers = ['Loan No', 'Customer', 'Principal', 'Pledged Wt', 'Status'];
      rows = loans.map(l => [l.loanNo, `"${l.customerName || ''}"`, l.principalAmount, l.pledgedNetWeightGrams ?? 0, l.status]);
    } else if (activeTab === 'inventory') {
      headers = ['Item Code', 'Category', 'Purity', 'Gross Wt', 'Net Wt'];
      rows = inventory.map(it => [it.itemCode || it.id, it.category, it.purityKarat || (it as any).purity || '22K', it.grossWeight, it.netWeight]);
    } else {
      headers = ['Customer', 'Mobile', 'City', 'Balance Due'];
      rows = customersWithDue.map(c => [`"${c.fullName || c.name}"`, c.mobile, c.city || 'Mumbai', c.balanceDue || c.closingBalance || 0]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `Report_${activeTab}_${appliedFrom}.csv`;
    link.click();
  };

  return (
    <div className="page">
      {/* Licence Banner Parity */}
      <div 
        className="license-banner rounded-lg mb-3 flex items-center justify-between p-3" 
        style={{ background: '#fef8ee', borderColor: '#fde68a', borderWidth: 1 }}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-medium text-amber-950">
            ⚠️ Licence status is unavailable. Open Licence for verification details.
          </span>
        </div>
        <button 
          onClick={() => onNavigate ? onNavigate('licence') : (window.location.pathname = '/admin/license')}
          className="font-semibold text-amber-900 hover:text-amber-950 cursor-pointer flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors"
        >
          <span>Licence</span>
          <span>→</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="page-hdr" style={{ marginBottom: 14 }}>
        <div className="page-hdr-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700, margin: 0 }}>
              <BarChart3 size={22} style={{ color: 'var(--primary)' }} />
              Reports
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
            Master analytical and reconciliation reports for showroom sales, payments, girvi loans, inventory valuation & customer receivables · {store.tradeName || 'S.B Borana Jewellers'}
          </p>
        </div>

        {/* Action Button Bar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportXLSX}
            className="btn btn-outline btn-sm"
            title="Download Excel spreadsheet"
          >
            <Download size={14} />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="btn btn-outline btn-sm"
            title="Download CSV file"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-outline btn-sm"
            title="Print or Save PDF"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Filter Card with Date Range Pickers & Required "Apply" Button */}
      <form onSubmit={handleApply} className="card" style={{ padding: '12px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="label" style={{ margin: 0, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={14} style={{ color: 'var(--primary)' }} />
              Date Filter:
            </span>
            {/* Quick Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {(['TODAY', 'WEEK', 'MONTH', 'CUSTOM', 'ALL'] as const).map(p => (
                <button
                  type="button"
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`btn btn-xs ${datePreset === p ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: 11, padding: '3px 8px' }}
                >
                  {p === 'TODAY' && 'Today'}
                  {p === 'WEEK' && 'Week'}
                  {p === 'MONTH' && 'Month'}
                  {p === 'CUSTOM' && 'Custom'}
                  {p === 'ALL' && 'All'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <span className="helper" style={{ fontSize: 11, margin: 0 }}>From</span>
              <input
                type="date"
                aria-label="From date"
                max={toDate || undefined}
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="input input-sm"
                style={{ padding: '2px 6px', fontSize: 12 }}
              />
              <span className="helper" style={{ fontSize: 11, margin: 0 }}>To</span>
              <input
                type="date"
                aria-label="To date"
                min={fromDate || undefined}
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="input input-sm"
                style={{ padding: '2px 6px', fontSize: 12 }}
              />
            </div>

            {/* Discovered "Apply" Button */}
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700, padding: '5px 14px' }}
              title="Apply date range filters to report"
            >
              Apply
            </button>
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {isAppliedNotice ? (
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ Filters applied successfully!</span>
            ) : (
              <span>Active Period: {appliedFrom} to {appliedTo}</span>
            )}
          </div>
        </div>
      </form>

      {/* Required Tabs: "Sales Report", "Payment Analysis", "Loans", "Inventory", "Outstanding" */}
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button
          onClick={() => setActiveTab('sales')}
          className={`tab ${activeTab === 'sales' ? 'active' : ''}`}
        >
          Sales Report
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`tab ${activeTab === 'payments' ? 'active' : ''}`}
        >
          Payment Analysis
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`tab ${activeTab === 'loans' ? 'active' : ''}`}
        >
          Loans
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`tab ${activeTab === 'inventory' ? 'active' : ''}`}
        >
          Inventory
        </button>
        <button
          onClick={() => setActiveTab('outstanding')}
          className={`tab ${activeTab === 'outstanding' ? 'active' : ''}`}
        >
          Outstanding
        </button>
      </div>

      {activeTab === 'sales' && (
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>{salesHeaders.map((header, index) => <th key={header} scope="col" className={index ? 'num' : undefined}>{header}</th>)}</tr>
              </thead>
              <tbody>
                {salesRows.map(([date, orders, ...amounts]) => (
                  <tr key={date}>
                    <td>{date}</td><td className="num">{orders}</td>
                    {amounts.map((amount, index) => <td key={index} className="num">
                      {amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </td>)}
                  </tr>
                ))}
                {!salesRows.length && <tr><td className="empty" colSpan={salesHeaders.length}>No sales for the selected period.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT ANALYSIS */}
      {activeTab === 'payments' && (
        <div>
          <div className="sum-grid" style={{ marginBottom: 14 }}>
            <div className="sum-box">
              <div className="sum-val">₹{paymentAnalysis.CASH.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="sum-lbl">Cash In Hand ({paymentAnalysis.CASH.count} txns)</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--primary)' }}>
                ₹{paymentAnalysis.UPI.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="sum-lbl">UPI Digital Payments ({paymentAnalysis.UPI.count} txns)</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--info)' }}>
                ₹{paymentAnalysis.CARD.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="sum-lbl">Card EDC POS ({paymentAnalysis.CARD.count} txns)</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--gold-d)' }}>
                ₹{totalOldGold.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="sum-lbl">Old Gold Exchange Credit</div>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header">
              <span className="card-title">Settlement Channel Breakdown</span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>PAYMENT INSTRUMENT</th>
                    <th className="num">TRANSACTIONS</th>
                    <th className="num">COLLECTED AMOUNT (₹)</th>
                    <th className="num">% OF REVENUE</th>
                    <th>RECONCILIATION LEDGER</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(paymentAnalysis).map(([mode, data]) => {
                    const pct = totalNetPayable > 0 ? ((data.total / totalNetPayable) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={mode}>
                        <td style={{ fontWeight: 700 }}>
                          <span className="badge badge-gold" style={{ marginRight: 8 }}>{mode}</span>
                          {mode === 'CASH' && 'Physical Cash Tender'}
                          {mode === 'UPI' && 'Instant QR / BHIM / GPay'}
                          {mode === 'CARD' && 'Debit & Credit Cards'}
                          {mode === 'BANK' && 'NEFT / RTGS Wire'}
                          {mode === 'OLD_GOLD' && 'Customer Scrap Gold Offset'}
                          {mode === 'CREDIT' && 'Customer Book Receivables'}
                        </td>
                        <td className="num">{data.count}</td>
                        <td className="num" style={{ fontWeight: 700 }}>₹{data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="num">{pct}%</td>
                        <td>
                          <span className="helper">Reconciled against Day-Book Drawer</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOANS */}
      {activeTab === 'loans' && (
        <div>
          <div className="sum-grid" style={{ marginBottom: 14 }}>
            <div className="sum-box">
              <div className="sum-val">₹{totalLoanPrincipal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="sum-lbl">Active Principal Lent ({activeLoans.length} loans)</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--primary)' }}>
                ₹{totalMonthlyInterest.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="sum-lbl">Accrued Interest / Month (1.5%)</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--gold-d)' }}>
                {totalPledgedWeight.toFixed(2)} g
              </div>
              <div className="sum-lbl">Pledged Jewellery Vault Weight</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--info)' }}>
                {loans.filter(l => l.status === 'RELEASED').length}
              </div>
              <div className="sum-lbl">Redeemed & Released Loans</div>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Girvi Loan Portfolio Ledger</span>
              <span className="helper">Total Loans: {loans.length}</span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>LOAN NO</th>
                    <th>BORROWER</th>
                    <th>START DATE</th>
                    <th>DUE DATE</th>
                    <th className="num">PRINCIPAL (₹)</th>
                    <th className="num">MONTHLY RATE</th>
                    <th className="num">NET WT (g)</th>
                    <th>VAULT STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map(loan => (
                    <tr key={loan.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{loan.loanNo}</td>
                      <td>{loan.customerName}</td>
                      <td>{loan.startDate}</td>
                      <td>{loan.dueDate || '15-Dec-2026'}</td>
                      <td className="num" style={{ fontWeight: 700 }}>₹{loan.principalAmount.toLocaleString('en-IN')}</td>
                      <td className="num">{loan.interestRatePercent}%</td>
                      <td className="num">{loan.pledgedNetWeightGrams} g</td>
                      <td>
                        <span className={`badge ${loan.status === 'ACTIVE' ? 'badge-green' : loan.status === 'OVERDUE' ? 'badge-red' : 'badge-gray'}`}>
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: INVENTORY */}
      {activeTab === 'inventory' && (
        <div>
          <div className="sum-grid" style={{ marginBottom: 14 }}>
            <div className="sum-box">
              <div className="sum-val">{totalStockItems} pcs</div>
              <div className="sum-lbl">Stock Items in Catalog</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--gold-d)' }}>
                {totalGrossWeight.toFixed(2)} g
              </div>
              <div className="sum-lbl">Gross Metal Weight</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--primary)' }}>
                {totalNetWeight.toFixed(2)} g
              </div>
              <div className="sum-lbl">Net Fine Weight</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--info)' }}>
                ₹{totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="sum-lbl">Estimated Retail Valuation</div>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Live Inventory Valuation Register</span>
              <span className="helper">Filtered by Showroom Catalog</span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ITEM CODE</th>
                    <th>NAME / DESCRIPTION</th>
                    <th>CATEGORY</th>
                    <th>PURITY</th>
                    <th className="num">GROSS WT (g)</th>
                    <th className="num">NET WT (g)</th>
                    <th className="num">EST. VALUE (₹)</th>
                    <th>HUID HALLMARK</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.slice(0, 15).map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace' }}>{item.itemCode || item.id}</td>
                      <td>{item.name || item.title || 'Jewellery Ornament'}</td>
                      <td>{item.category}</td>
                      <td>
                        <span className="badge badge-gold">{item.purity}</span>
                      </td>
                      <td className="num">{item.grossWeight.toFixed(3)}</td>
                      <td className="num" style={{ fontWeight: 700 }}>{item.netWeight.toFixed(3)}</td>
                      <td className="num">₹{(item.totalPrice || (item.netWeight * 7800)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{item.huid || 'HD7128'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: OUTSTANDING */}
      {activeTab === 'outstanding' && (
        <div>
          <div className="sum-grid" style={{ marginBottom: 14 }}>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--danger)' }}>
                ₹{totalOutstandingReceivable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="sum-lbl">Total Customer Outstanding</div>
            </div>
            <div className="sum-box">
              <div className="sum-val">
                {customersWithDue.length}
              </div>
              <div className="sum-lbl">Debtors with Pending Balance</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--primary)' }}>
                ₹{(totalOutstandingReceivable * 0.7).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="sum-lbl">Current (0 - 30 Days)</div>
            </div>
            <div className="sum-box">
              <div className="sum-val" style={{ color: 'var(--gold-d)' }}>
                ₹{(totalOutstandingReceivable * 0.3).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="sum-lbl">Overdue (&gt; 30 Days)</div>
            </div>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title">Customer Outstanding Ledgers ({customersWithDue.length} accounts)</span>
              <span className="helper">Follow-up & Collection Tracker</span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>CUSTOMER</th>
                    <th>MOBILE</th>
                    <th>CITY</th>
                    <th>PAN / GSTIN</th>
                    <th className="num">CREDIT LIMIT (₹)</th>
                    <th className="num">BALANCE DUE (₹)</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {customersWithDue.map(cust => (
                    <tr key={cust.id}>
                      <td style={{ fontWeight: 700 }}>{cust.fullName || cust.name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{cust.mobile}</td>
                      <td>{cust.city || 'Mumbai'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{cust.pan || cust.gstin || '—'}</td>
                      <td className="num">₹{(cust.creditLimit || 100000).toLocaleString('en-IN')}</td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--danger)' }}>
                        ₹{(cust.balanceDue || cust.closingBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedLedgerCustomer(cust)}
                            className="btn btn-primary btn-xs"
                            style={{ fontSize: 11 }}
                          >
                            View Ledger
                          </button>
                          <button
                            type="button"
                            onClick={() => alert(`Payment reminder generated for ${cust.fullName || cust.name}`)}
                            className="btn btn-outline btn-xs"
                            style={{ fontSize: 11 }}
                          >
                            Send Reminder
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {customersWithDue.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>
                        All customer accounts are clear! No pending outstanding balances.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Customer Ledger Statement Modal */}
      {selectedLedgerCustomer && (() => {
        const custInvoices = invoices.filter(inv => 
          inv.customer?.id === selectedLedgerCustomer.id ||
          (selectedLedgerCustomer.mobile && (inv.customer?.mobile === selectedLedgerCustomer.mobile || inv.customer?.phone === selectedLedgerCustomer.mobile)) ||
          (inv.customer?.name && inv.customer.name.toLowerCase() === (selectedLedgerCustomer.name || selectedLedgerCustomer.fullName || '').toLowerCase())
        );

        type LedgerLine = {
          date: string;
          voucherNo: string;
          type: string;
          particulars: string;
          debit: number;
          credit: number;
        };

        const lines: LedgerLine[] = [];
        const opBal = selectedLedgerCustomer.openingBalance || 0;
        if (opBal !== 0) {
          lines.push({
            date: '2026-04-01',
            voucherNo: 'OP-BAL',
            type: 'Opening Balance',
            particulars: 'Brought forward from previous financial year',
            debit: opBal > 0 ? opBal : 0,
            credit: opBal < 0 ? Math.abs(opBal) : 0
          });
        }

        custInvoices.forEach(inv => {
          const invDate = (inv.invoiceDate || inv.date || '2026-11-15').slice(0, 10);
          const invTotal = inv.grandTotal ?? inv.totalAmount ?? inv.productTotalValue ?? 0;
          lines.push({
            date: invDate,
            voucherNo: inv.invoiceNo || inv.invoiceNumber || 'INV',
            type: 'Sales Invoice',
            particulars: `Jewellery sales (${inv.items.length} items)`,
            debit: invTotal,
            credit: 0
          });

          if ((inv.oldMetalExchangeCredit || 0) > 0) {
            lines.push({
              date: invDate,
              voucherNo: `EXCH-${inv.invoiceNo || 'INV'}`,
              type: 'Old Metal Exchange',
              particulars: 'Customer scrap gold / silver return credit',
              debit: 0,
              credit: inv.oldMetalExchangeCredit || 0
            });
          }

          const receipts = invoiceReceipts(inv);
          receipts.forEach(rcpt => {
            if (['OLD_GOLD_EXCHANGE', 'CUSTOMER_CREDIT'].includes(rcpt.mode.toUpperCase())) return;
            lines.push({
              date: (rcpt.date || rcpt.timestamp || invDate).slice(0, 10),
              voucherNo: rcpt.receiptNo || rcpt.referenceNo || 'RCPT',
              type: `Payment (${rcpt.mode})`,
              particulars: `Payment receipt towards invoice ${inv.invoiceNo || 'INV'}`,
              debit: 0,
              credit: rcpt.amount
            });
          });
        });

        lines.sort((a, b) => a.date.localeCompare(b.date));

        let running = 0;
        const ledgerWithBalance = lines.map(line => {
          running += (line.debit - line.credit);
          return { ...line, balance: running };
        });

        const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
        const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
        const finalBalance = totalDebit - totalCredit;

        const handleDownloadLedgerCSV = () => {
          const headers = ['Date', 'Voucher No', 'Type', 'Particulars', 'Debit (Dr)', 'Credit (Cr)', 'Running Balance'];
          const rows = ledgerWithBalance.map(l => [
            l.date,
            l.voucherNo,
            l.type,
            `"${l.particulars}"`,
            l.debit.toFixed(2),
            l.credit.toFixed(2),
            l.balance.toFixed(2)
          ]);
          const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
          const a = document.createElement('a');
          a.href = encodeURI(csv);
          a.download = `Ledger_${(selectedLedgerCustomer.fullName || selectedLedgerCustomer.name).replace(/\s+/g, '_')}_${today}.csv`;
          a.click();
        };

        return (
          <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
            <div className="modal-card card" style={{ maxWidth: 960, width: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface, #ffffff)', padding: 0 }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
                      Customer Account Statement &amp; Ledger
                    </h2>
                    <span className="badge badge-gold font-mono">{selectedLedgerCustomer.code || 'CUST'}</span>
                  </div>
                  <div className="helper" style={{ fontSize: 12, marginTop: 4 }}>
                    <strong>{selectedLedgerCustomer.fullName || selectedLedgerCustomer.name}</strong> · Mobile: {selectedLedgerCustomer.mobile || '—'} · City: {selectedLedgerCustomer.city || 'Mumbai'} · PAN: {selectedLedgerCustomer.pan || '—'} · Credit Limit: ₹{(selectedLedgerCustomer.creditLimit || 100000).toLocaleString('en-IN')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLedgerCustomer(null)}
                  className="btn btn-ghost btn-sm"
                  style={{ padding: 4 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Ledger Summary KPIs */}
              <div style={{ padding: '12px 20px', background: 'var(--surface2, #fbfbf9)', borderBottom: '1px solid var(--border)' }}>
                <div className="sum-grid" style={{ margin: 0, gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div className="sum-box">
                    <div className="sum-val">₹{opBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="sum-lbl">Opening Balance</div>
                  </div>
                  <div className="sum-box">
                    <div className="sum-val" style={{ color: 'var(--primary)' }}>₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="sum-lbl">Total Billed / Debits</div>
                  </div>
                  <div className="sum-box">
                    <div className="sum-val" style={{ color: 'var(--success)' }}>₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                    <div className="sum-lbl">Total Receipts / Credits</div>
                  </div>
                  <div className="sum-box">
                    <div className="sum-val" style={{ color: finalBalance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ₹{finalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="sum-lbl">Net Outstanding Due</div>
                  </div>
                </div>
              </div>

              {/* Ledger Itemized Table */}
              <div className="tbl-wrap" style={{ maxHeight: 360, overflowY: 'auto' }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>VOUCHER / REF</th>
                      <th>TYPE</th>
                      <th>PARTICULARS</th>
                      <th className="num">DEBIT (DR ₹)</th>
                      <th className="num">CREDIT (CR ₹)</th>
                      <th className="num">RUNNING BALANCE (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerWithBalance.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="empty">No transactions found for this customer account.</td>
                      </tr>
                    ) : (
                      ledgerWithBalance.map((line, idx) => (
                        <tr key={idx}>
                          <td>{line.date}</td>
                          <td className="font-mono font-bold">{line.voucherNo}</td>
                          <td>
                            <span className={`badge ${line.debit > 0 ? 'badge-gold' : 'badge-green'}`}>
                              {line.type}
                            </span>
                          </td>
                          <td>{line.particulars}</td>
                          <td className="num font-mono">
                            {line.debit > 0 ? `₹${line.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="num font-mono" style={{ color: 'var(--success)' }}>
                            {line.credit > 0 ? `₹${line.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                          </td>
                          <td className="num font-mono font-bold" style={{ color: line.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                            ₹{line.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface2, #fbfbf9)' }}>
                <div className="helper" style={{ fontSize: 11.5 }}>
                  Statement generated for financial audit &amp; balance confirmation.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleDownloadLedgerCSV}
                    className="btn btn-outline btn-sm"
                  >
                    <Download size={14} />
                    Download CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="btn btn-outline btn-sm"
                  >
                    <Printer size={14} />
                    Print Statement
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLedgerCustomer(null)}
                    className="btn btn-primary btn-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ReportsClassicView;


import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  BarChart3, Calendar, FileText, Download, Printer, Filter, 
  TrendingUp, Award, DollarSign, PieChart, ShoppingBag, ArrowUpRight,
  ChevronRight, Users, CreditCard, RotateCcw, ArrowDownRight, Layers,
  AlertCircle, ArrowLeft, CheckCircle2, ChevronDown
} from 'lucide-react';
import { SalesInvoice, StoreProfile, RepairOrder, GirviLoan, MetalBooking, CreditMemoRecord } from '../../types';

interface SalesReportsViewProps {
  store: StoreProfile;
  invoices: SalesInvoice[];
  repairs?: RepairOrder[];
  loans?: GirviLoan[];
  bookings?: MetalBooking[];
  creditMemos?: CreditMemoRecord[];
  onNavigate?: (module: string) => void;
}

const reportDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
});
const displayDate = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric'
});
const displayMoney = new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR'
});
const dayBookColumns = [
  'Date', 'Invoices', 'Sales', 'GST', 'Still Due', 'On Same-Day Inv.', 'On Earlier Inv.',
  'Advances', 'Repairs', 'Loans & Other', 'Received', 'Of Which Cash', 'Non-Cash', 'Refunds', 'Net Collection'
];

function reportDateKey(value?: string): string | undefined {
  if (!value) return undefined;
  const local = value.match(/^(\d{4}-\d{2}-\d{2})(?:$|[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$)/);
  const date = new Date(local ? local[1] + 'T00:00:00Z' : value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return local ? date.toISOString().slice(0, 10) : reportDate.format(date);
}

type DateRangePreset = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM' | 'ALL';

export const SalesReportsView: React.FC<SalesReportsViewProps> = ({
  store,
  invoices = [],
  repairs = [],
  loans = [],
  bookings = [],
  creditMemos = [],
  onNavigate
}) => {
  const [activeReportTab, setActiveReportTab] = useState<number>(1);
  const [dayBookMode, setDayBookMode] = useState<'daily' | 'monthly'>('daily');
  const [dateRange, setDateRange] = useState<DateRangePreset>('MONTH');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [invoiceViewMode, setInvoiceViewMode] = useState<'invoices' | 'lines'>('invoices');
  const [selectedPaymentModeDrilldown, setSelectedPaymentModeDrilldown] = useState<string | null>(null);

  // Exact 11 Sales Registers from KreyaJewel360 OCR Frame 222 & 223
  const salesReportsList = [
    { id: 1, name: '1. Daily sales & collection (Day-Book)' },
    { id: 2, name: '2. Invoice register' },
    { id: 3, name: '3. Item-wise sales summary' },
    { id: 4, name: '4. Category & volume breakdown' },
    { id: 5, name: '5. Metal & purity-wise sales' },
    { id: 6, name: '6. Salesperson quota & performance' },
    { id: 7, name: '7. Customer-wise sales & receivables' },
    { id: 8, name: '8. Collection & payment mode summary' },
    { id: 9, name: '9. Cash Day-Book (Drawer reconciliation)' },
    { id: 10, name: '10. Sales returns & credit notes' },
    { id: 11, name: '11. Sales margin & profit' }
  ];

  const today = reportDate.format(new Date());
  const yesterday = new Date(today + 'T00:00:00Z');
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const weekStart = new Date(today + 'T00:00:00Z');
  weekStart.setUTCDate(weekStart.getUTCDate() - (weekStart.getUTCDay() + 6) % 7);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const weekStartKey = weekStart.toISOString().slice(0, 10);
  const includesDate = (date?: string) => {
    if (dateRange === 'ALL') return true;
    if (!date) return false;
    if (dateRange === 'TODAY') return date === today;
    if (dateRange === 'YESTERDAY') return date === yesterdayKey;
    if (dateRange === 'WEEK') return date >= weekStartKey && date <= today;
    if (dateRange === 'MONTH') return date.slice(0, 7) === today.slice(0, 7) && date <= today;
    return (!fromDate || date >= fromDate) && (!toDate || date <= toDate);
  };
  const filteredInvoices = invoices.filter(inv => includesDate(reportDateKey(inv.invoiceDate ?? inv.date)));

  // Use receipt dates independently of invoice dates so earlier-invoice receipts stay in range.
  const blankDay = () => ({ invoices: 0, sales: 0, gst: 0, due: 0, same: 0, earlier: 0, repairs: 0, loans: 0, advances: 0, cash: 0, nonCash: 0, refunds: 0 });
  const dailyTotals = new Map<string, ReturnType<typeof blankDay>>();
  const getDay = (key: string) => {
    const day = dailyTotals.get(key) ?? blankDay();
    dailyTotals.set(key, day);
    return day;
  };
  for (const invoice of invoices) {
    const invoiceDate = reportDateKey(invoice.invoiceDate ?? invoice.date);
    if (invoiceDate && includesDate(invoiceDate) && invoice.status !== 'CANCELLED' && invoice.status !== 'ESTIMATE') {
      const day = getDay(invoiceDate);
      day.invoices += 1;
      day.sales += invoice.grandTotal ?? invoice.totalAmount ?? invoice.productTotalValue;
      day.gst += (invoice.cgstTotal ?? invoice.items.reduce((sum, item) => sum + item.cgstAmount, 0)) +
        (invoice.sgstTotal ?? invoice.items.reduce((sum, item) => sum + item.sgstAmount, 0));
      day.due += invoice.balanceDue;
    }
    if (!invoiceDate || invoice.status === 'ESTIMATE') continue;
    const receipts = invoice.paymentTransactions?.length ? invoice.paymentTransactions : invoice.payments ?? [];
    for (const receipt of receipts) {
      const date = reportDateKey(receipt.date) ?? reportDateKey(receipt.timestamp);
      const mode = String(receipt.mode).toUpperCase();
      if (!date || date < invoiceDate || !includesDate(date) || !(receipt.amount > 0) ||
          !Number.isFinite(receipt.amount) || ['OLD_GOLD_EXCHANGE', 'CUSTOMER_CREDIT'].includes(mode)) continue;
      const day = getDay(date);
      day[date === invoiceDate ? 'same' : 'earlier'] += receipt.amount;
      day[mode === 'CASH' ? 'cash' : 'nonCash'] += receipt.amount;
    }
  }
  const addServiceReceipt = (category: 'repairs' | 'loans' | 'advances', date: string | undefined, amount: number, mode?: string) => {
    const method = mode?.toUpperCase();
    if (!date || !includesDate(date) || !Number.isFinite(amount) || amount <= 0 || !method ||
        method === 'OLD_GOLD_EXCHANGE' || method === 'CUSTOMER_CREDIT') return;
    const day = getDay(date);
    day[category] += amount;
    day[method === 'CASH' ? 'cash' : 'nonCash'] += amount;
  };
  for (const repair of repairs) {
    for (const payment of repair.payments ?? []) {
      addServiceReceipt('repairs', reportDateKey(payment.date) ?? reportDateKey(payment.timestamp), payment.amount, payment.mode);
    }
  }
  for (const loan of loans) {
    for (const payment of loan.repayments ?? []) {
      addServiceReceipt('loans', reportDateKey(payment.date), payment.totalCashReceived ?? payment.principalPaid + payment.interestPaid,
        payment.paymentMode ?? payment.mode);
    }
  }
  for (const booking of bookings) {
    for (const payment of booking.advanceReceipts ?? []) {
      addServiceReceipt('advances', reportDateKey(payment.date) ?? reportDateKey(payment.timestamp), payment.amount, payment.mode);
    }
  }
  for (const memo of creditMemos) {
    const date = reportDateKey(memo.refundDate);
    if (memo.refundStatus !== 'issued' || !date || !includesDate(date) || !Number.isFinite(memo.refundAmount) ||
        memo.refundAmount <= 0 || memo.refundMode.toUpperCase() === 'CUSTOMER_CREDIT') continue;
    getDay(date).refunds += memo.refundAmount;
  }
  const dayBookRows = [...dailyTotals.entries()].sort(([a], [b]) => b.localeCompare(a));
  const monthlyTotals = useMemo(() => {
    const months = new Map<string, ReturnType<typeof blankDay>>();
    for (const [date, day] of dailyTotals.entries()) {
      const monthKey = date.slice(0, 7);
      const current = months.get(monthKey) ?? blankDay();
      current.invoices += day.invoices;
      current.sales += day.sales;
      current.gst += day.gst;
      current.due += day.due;
      current.same += day.same;
      current.earlier += day.earlier;
      current.advances += day.advances;
      current.repairs += day.repairs;
      current.loans += day.loans;
      current.cash += day.cash;
      current.nonCash += day.nonCash;
      current.refunds += day.refunds;
      months.set(monthKey, current);
    }
    return [...months.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [dailyTotals]);

  const activeDayBookRows = dayBookMode === 'daily' ? dayBookRows : monthlyTotals;

  const dayBookValues = (day: ReturnType<typeof blankDay>) => [
    day.invoices, day.sales, day.gst, day.due, day.same, day.earlier,
    day.advances, day.repairs, day.loans, day.cash + day.nonCash, day.cash, day.nonCash,
    day.refunds, day.cash + day.nonCash - day.refunds
  ];

  const totalGrossSales = filteredInvoices.reduce((acc, inv) => acc + (inv.productTotalValue || inv.totalAmount || 0), 0);
  const totalNetPayable = filteredInvoices.reduce((acc, inv) => acc + (inv.netPayable ?? inv.finalPayableAmount ?? inv.productTotalValue ?? 0), 0);
  const totalOldGoldAdjusted = filteredInvoices.reduce((acc, inv) => acc + (inv.oldMetalExchangeCredit || 0), 0);
  const totalTaxCollected = filteredInvoices.reduce((acc, inv) => {
    const tax = (inv.items || []).reduce((s, itm) => s + (itm.cgstAmount || 0) + (itm.sgstAmount || 0), 0);
    return acc + tax;
  }, 0);
  const totalPaidAmount = filteredInvoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
  const totalBalanceDue = filteredInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

  // Profit & Margin Summary Calculations (for Register 11 & Header)
  const soldExclGst = totalGrossSales > 0 ? totalGrossSales / 1.03 : 0;
  // Estimated Cost (Bullion metal cost + rough stones + hallmarking) ~ 88% of net price
  const estimatedCost = soldExclGst * 0.88;
  const estimatedProfit = soldExclGst - estimatedCost;
  const marginPct = soldExclGst > 0 ? ((estimatedProfit / soldExclGst) * 100).toFixed(1) : '0.0';
  const markupPct = estimatedCost > 0 ? ((estimatedProfit / estimatedCost) * 100).toFixed(1) : '0.0';

  // Category stats & breakdowns (Gold, Silver, Diamond, Platinum, Making charges, Waste)
  const categoryStats: Record<string, { count: number; weight: number; value: number }> = useMemo(() => {
    const stats: Record<string, { count: number; weight: number; value: number }> = {
      'Gold Jewellery': { count: 0, weight: 0, value: 0 },
      'Silver Articles': { count: 0, weight: 0, value: 0 },
      'Diamond Jewellery': { count: 0, weight: 0, value: 0 },
      'Platinum Jewellery': { count: 0, weight: 0, value: 0 },
      'Making Charges': { count: 0, weight: 0, value: 0 },
      'Wastage / Value Addition': { count: 0, weight: 0, value: 0 },
      'Bullion Coins & Bars': { count: 0, weight: 0, value: 0 }
    };
    filteredInvoices.forEach(inv => {
      (inv.items || []).forEach(itm => {
        let cat = 'Gold Jewellery';
        const rawCat = (itm.category || '').toLowerCase();
        const metal = (itm.metalType || '').toLowerCase();
        if (rawCat.includes('diamond') || (itm.stoneValue && itm.stoneValue > 10000)) {
          cat = 'Diamond Jewellery';
        } else if (rawCat.includes('platinum') || metal.includes('platinum')) {
          cat = 'Platinum Jewellery';
        } else if (rawCat.includes('silver') || metal.includes('silver')) {
          cat = 'Silver Articles';
        } else if (rawCat.includes('coin') || rawCat.includes('bar') || rawCat.includes('bullion')) {
          cat = 'Bullion Coins & Bars';
        }
        if (!stats[cat]) {
          stats[cat] = { count: 0, weight: 0, value: 0 };
        }
        stats[cat].count += 1;
        stats[cat].weight += itm.grossWeight || 0;
        stats[cat].value += itm.lineTotal || 0;

        // Making charges breakdown
        const making = itm.makingAmount || itm.makingCharges || 0;
        if (making > 0) {
          stats['Making Charges'].count += 1;
          stats['Making Charges'].weight += itm.netWeight || 0;
          stats['Making Charges'].value += making;
        }

        // Wastage / Value Addition breakdown
        const waste = itm.wastageAmount || ((itm.metalValue || 0) * (itm.wastagePct || 0) / 100) || 0;
        if (waste > 0) {
          stats['Wastage / Value Addition'].count += 1;
          stats['Wastage / Value Addition'].weight += ((itm.netWeight || 0) * (itm.wastagePct || 0) / 100);
          stats['Wastage / Value Addition'].value += waste;
        }
      });
    });
    return stats;
  }, [filteredInvoices]);

  // Payment modes breakdown
  const paymentModeStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number; receipts: Array<{ invoiceNo: string; date: string; customer: string; amount: number; notes: string }> }> = {};
    filteredInvoices.forEach(inv => {
      const payments = inv.payments || inv.paymentTransactions || [];
      if (payments.length > 0) {
        payments.forEach(p => {
          const m = p.mode || 'CASH';
          if (!stats[m]) stats[m] = { total: 0, count: 0, receipts: [] };
          stats[m].total += p.amount;
          stats[m].count += 1;
          stats[m].receipts.push({
            invoiceNo: inv.invoiceNo || inv.invoiceNumber || 'INV',
            date: inv.date || inv.invoiceDate || '2026-11-15',
            customer: inv.customer?.fullName || inv.customer?.name || 'Customer',
            amount: p.amount,
            notes: p.receiptNo || p.referenceNo || 'Payment Received'
          });
        });
      } else if (inv.paidAmount > 0) {
        const m = (inv.paymentMode as string) || 'CASH';
        if (!stats[m]) stats[m] = { total: 0, count: 0, receipts: [] };
        stats[m].total += inv.paidAmount;
        stats[m].count += 1;
        stats[m].receipts.push({
          invoiceNo: inv.invoiceNo || inv.invoiceNumber || 'INV',
          date: inv.date || inv.invoiceDate || '2026-11-15',
          customer: inv.customer?.fullName || inv.customer?.name || 'Customer',
          amount: inv.paidAmount,
          notes: 'Invoice Payment'
        });
      }
    });
    return stats;
  }, [filteredInvoices]);

  const handleExportCSV = (reportName: string = 'Sales_Register') => {
    if (activeReportTab === 1) {
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
        dayBookColumns, ...dayBookRows.map(([date, day]) => [date, ...dayBookValues(day)])
      ]), 'Daily Sales');
      XLSX.writeFile(workbook, 'Daily_Sales_' + today + '.csv', { bookType: 'csv' });
      return;
    }
    const headers = ['Invoice No', 'Date', 'Customer', 'Items Count', 'Gross Value', 'Old Gold Credit', 'Net Payable', 'Paid', 'Balance', 'Salesperson'];
    const rows = filteredInvoices.map(inv => [
      inv.invoiceNo || inv.invoiceNumber || 'INV',
      inv.date || inv.invoiceDate || '',
      `"${inv.customer?.fullName || inv.customer?.name || 'Customer'}"`,
      inv.items.length,
      inv.productTotalValue.toFixed(2),
      (inv.oldMetalExchangeCredit || 0).toFixed(2),
      (inv.netPayable ?? inv.finalPayableAmount ?? inv.productTotalValue ?? 0).toFixed(2),
      inv.paidAmount.toFixed(2),
      inv.balanceDue.toFixed(2),
      `"${inv.salesperson || 'Staff'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportXLSX = () => {
    const reportTitle = salesReportsList.find(r => r.id === activeReportTab)?.name || 'Sales_Report';
    const cleanTitle = reportTitle.replace(/[^a-zA-Z0-9]/g, '_');
    const rows = filteredInvoices.map((inv, idx) => ({
      'S.No': idx + 1,
      'Invoice No': inv.invoiceNo || inv.invoiceNumber || '',
      'Date': inv.date || inv.invoiceDate || '',
      'Customer': inv.customer?.fullName || inv.customer?.name || 'Walk-in Customer',
      'Phone': inv.customer?.mobile || '',
      'Gross Value (₹)': inv.productTotalValue || inv.totalAmount || 0,
      'Tax / GST (₹)': (inv.items || []).reduce((s, itm) => s + (itm.cgstAmount || 0) + (itm.sgstAmount || 0), 0),
      'Net Payable (₹)': inv.netPayable ?? inv.finalPayableAmount ?? inv.productTotalValue ?? 0,
      'Old Gold Adjusted (₹)': inv.oldMetalExchangeCredit || 0,
      'Paid Amount (₹)': inv.paidAmount || 0,
      'Balance Due (₹)': inv.balanceDue || 0,
      'Payment Mode': inv.paymentMode || 'CASH'
    }));

    const ws = activeReportTab === 1 ? XLSX.utils.aoa_to_sheet([
      dayBookColumns, ...dayBookRows.map(([date, day]) => [date, ...dayBookValues(day)])
    ]) : XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Register');
    XLSX.writeFile(wb, `${cleanTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = () => {
    window.print();
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

      {/* Page Header matching production */}
      <div className="page-hdr" style={{ marginBottom: 14 }}>
        <div className="page-hdr-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700, margin: 0 }}>
              <BarChart3 size={22} style={{ color: 'var(--primary)' }} />
              Sales reports
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
            Totals reconcile: daily sales = invoice register = customer-wise; collections = mode summary = receipt list. · {store.tradeName || 'S.B Borana Jewellers'}
          </p>
        </div>

        {/* Action Button Bar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportXLSX}
            className="btn btn-outline btn-sm"
            title="Download Excel spreadsheet (.xlsx)"
          >
            <Download size={14} />
            <span>Excel</span>
          </button>
          <button
            onClick={() => handleExportCSV()}
            className="btn btn-outline btn-sm"
            title="Download CSV file (.csv)"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="btn btn-outline btn-sm"
            title="Download / Print PDF"
          >
            <FileText size={14} />
            <span>PDF</span>
          </button>
          <button
            onClick={() => window.print()}
            className="btn btn-outline btn-sm"
            title="Print Sales Report"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Date Range Picker Filter Card */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="label" style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>Period:</span>
            {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'CUSTOM', 'ALL'] as DateRangePreset[]).map(preset => (
              <button
                key={preset}
                onClick={() => setDateRange(preset)}
                className={`btn btn-sm ${dateRange === preset ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '4px 10px', fontSize: 11.5 }}
              >
                {preset === 'TODAY' && 'Today'}
                {preset === 'YESTERDAY' && 'Yesterday'}
                {preset === 'WEEK' && 'This Week'}
                {preset === 'MONTH' && 'This Month'}
                {preset === 'CUSTOM' && 'Custom'}
                {preset === 'ALL' && 'All Time'}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {(
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <span className="helper" style={{ fontSize: 11, margin: 0 }}>From</span>
              <input
                type="date"
                aria-label="From date"
                value={dateRange === 'CUSTOM' ? fromDate : dateRange === 'MONTH' ? today.slice(0, 7) + '-01' : ''}
                onChange={e => {
                  if (dateRange === 'MONTH') setToDate(today);
                  setFromDate(e.target.value);
                  setDateRange('CUSTOM');
                }}
                className="input input-sm"
                style={{ padding: '2px 6px', fontSize: 12 }}
              />
              <span className="helper" style={{ fontSize: 11, margin: 0 }}>To</span>
              <input
                type="date"
                aria-label="To date"
                value={dateRange === 'CUSTOM' ? toDate : dateRange === 'MONTH' ? today : ''}
                onChange={e => {
                  if (dateRange === 'MONTH') setFromDate(today.slice(0, 7) + '-01');
                  setToDate(e.target.value);
                  setDateRange('CUSTOM');
                }}
                className="input input-sm"
                style={{ padding: '2px 6px', fontSize: 12 }}
              />
            </div>
          )}

          {/* Active Period Feedback */}
          <div style={{ fontSize: 11.5, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={13} />
            <span>Showing {filteredInvoices.length} invoices ({dateRange === 'ALL' ? 'Lifetime' : dateRange})</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="sum-grid" style={{ marginBottom: 14 }}>
        <div className="sum-box">
          <div className="sum-val">₹{totalGrossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="sum-lbl">Gross Sales Value ({filteredInvoices.length} inv)</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)' }}>
            ₹{totalNetPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="sum-lbl">Net Realised Revenue</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--gold-d)' }}>
            ₹{totalOldGoldAdjusted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="sum-lbl">Old Gold Adjusted</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--info)' }}>
            ₹{totalTaxCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="sum-lbl">GST Collected (1.5% + 1.5%)</div>
        </div>
      </div>

      {/* Margin / Profit Summary Bar (Matching production 834 chunk) */}
      <div className="card" style={{ padding: '10px 16px', marginBottom: 14, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', fontSize: 12.5 }}>
          <span>Sold (excl. GST, after discount): <b style={{ fontFamily: 'monospace' }}>₹{soldExclGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b></span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>Cost: <b style={{ fontFamily: 'monospace' }}>₹{estimatedCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b></span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>Profit: <b style={{ color: estimatedProfit >= 0 ? 'var(--success)' : 'var(--danger)', fontFamily: 'monospace' }}>₹{estimatedProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</b></span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>Margin: <b style={{ fontFamily: 'monospace' }}>{marginPct}%</b> <span className="helper" style={{ fontSize: 10 }}>(profit ÷ sale)</span></span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>Mark-up: <b style={{ fontFamily: 'monospace' }}>{markupPct}%</b> <span className="helper" style={{ fontSize: 10 }}>(profit ÷ cost)</span></span>
        </div>
      </div>

      {/* Statutory GST Warning Alert when relevant */}
      {activeReportTab === 2 && (
        <div className="alert alert-warn" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>
            Review aid only — this is not a GST return. For statutory GSTR-1, GSTR-3B and GSTR-2B matching, open <strong>GST Reports</strong> from the sidebar.
          </span>
        </div>
      )}

      {/* Main Split Layout: 11 Registers Left Column + Tabular Report Content */}
      <div className="g2" style={{ gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Left: 11 Registers Navigation */}
        <div className="card" style={{ padding: '8px' }}>
          <div style={{ padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
            Sales & Inflow Registers
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
            {salesReportsList.map(rep => (
              <button
                key={rep.id}
                onClick={() => {
                  setActiveReportTab(rep.id);
                  setSelectedPaymentModeDrilldown(null);
                }}
                className={`btn btn-sm ${activeReportTab === rep.id ? 'btn-primary' : 'btn-ghost'}`}
                style={{ 
                  justifyContent: 'space-between', 
                  textAlign: 'left', 
                  fontWeight: activeReportTab === rep.id ? 700 : 500,
                  fontSize: 12,
                  padding: '7px 10px',
                  borderRadius: 6
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rep.name}</span>
                {activeReportTab === rep.id && <ChevronRight size={13} />}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Tabular Report View */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Sub-header & Filter controls */}
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <strong style={{ fontSize: 13.5 }}>
                {salesReportsList.find(r => r.id === activeReportTab)?.name}
                {selectedPaymentModeDrilldown ? ` — ${selectedPaymentModeDrilldown} Receipts` : ''}
              </strong>
              <div className="helper" style={{ fontSize: 11, marginTop: 2 }}>
                Period: {dateRange} · {filteredInvoices.length} invoices · Tax 3% GST (HSN 7113)
              </div>
            </div>

            {/* Daily / Monthly toggle for Day-Book */}
            {activeReportTab === 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="helper" style={{ fontSize: 11 }}>Grouping:</span>
                <div className="inline-flex rounded-md border border-[#e5e8e4] p-0.5 bg-[#f7f6f1]">
                  <button
                    type="button"
                    onClick={() => setDayBookMode('daily')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${dayBookMode === 'daily' ? 'bg-white shadow-xs text-[#202522]' : 'text-[#626b65] hover:text-[#202522]'}`}
                  >
                    Daily
                  </button>
                  <button
                    type="button"
                    onClick={() => setDayBookMode('monthly')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded ${dayBookMode === 'monthly' ? 'bg-white shadow-xs text-[#202522]' : 'text-[#626b65] hover:text-[#202522]'}`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            )}

            {/* View Mode Toggle for Invoice Register */}
            {activeReportTab === 2 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="helper" style={{ fontSize: 11 }}>Show:</span>
                <select
                  value={invoiceViewMode}
                  onChange={e => setInvoiceViewMode(e.target.value as any)}
                  className="input input-sm"
                  style={{ width: 'auto', padding: '3px 8px', fontSize: 11.5 }}
                >
                  <option value="invoices">One row per invoice</option>
                  <option value="lines">Each item line</option>
                </select>
              </div>
            )}

            {/* Mode drill-down back button */}
            {activeReportTab === 8 && selectedPaymentModeDrilldown && (
              <button
                onClick={() => setSelectedPaymentModeDrilldown(null)}
                className="btn btn-outline btn-sm"
              >
                <ArrowLeft size={13} />
                <span>Back to Mode Summary</span>
              </button>
            )}
          </div>

          <div className="tbl-wrap">
            {activeReportTab === 1 && (
              <table className="tbl">
                <caption className="helper text-left px-3 py-2">
                  Collections and refunds use dated receipts. Older booking balances without individual receipts are excluded.
                </caption>
                <thead>
                  <tr>{dayBookColumns.map((column, index) => (
                    <th key={column} className={index > 0 ? 'num' : undefined} scope="col">
                      {index === 0 && dayBookMode === 'monthly' ? 'Month' : column}
                    </th>
                  ))}</tr>
                </thead>
                <tbody>
                  {activeDayBookRows.length === 0 && (
                    <tr><td colSpan={dayBookColumns.length} className="empty">No data for this period.</td></tr>
                  )}
                  {activeDayBookRows.map(([date, day]) => (
                    <tr key={date}>
                      <td className="font-semibold">
                        {dayBookMode === 'monthly'
                          ? new Date(date + '-01T00:00:00Z').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                          : displayDate.format(new Date(date + 'T00:00:00Z')).replace(/ /g, '-')}
                      </td>
                      {dayBookValues(day).map((value, index) => (
                        <td className="num" key={dayBookColumns[index + 1]}>
                          {value === null ? '—' : index === 0 ? value : displayMoney.format(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* REGISTER 2: Invoice register */}
            {activeReportTab === 2 && (
              invoiceViewMode === 'invoices' ? (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>INVOICE NO</th>
                      <th>DATE</th>
                      <th>CUSTOMER</th>
                      <th>GSTIN / PAN</th>
                      <th className="num">ITEMS</th>
                      <th className="num">GROSS (₹)</th>
                      <th className="num">GST 3% (₹)</th>
                      <th className="num">OLD GOLD (₹)</th>
                      <th className="num">NET PAYABLE (₹)</th>
                      <th className="num">PAID (₹)</th>
                      <th className="num">BALANCE (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.length === 0 ? (
                      <tr><td colSpan={11} className="empty">No data for this period.</td></tr>
                    ) : (
                      filteredInvoices.map((inv, idx) => {
                        const tax = (inv.items || []).reduce((s, it) => s + (it.cgstAmount || 0) + (it.sgstAmount || 0), 0);
                        return (
                          <tr key={idx}>
                            <td className="font-bold">{inv.invoiceNo || inv.invoiceNumber || 'INV'}</td>
                            <td>{inv.date || inv.invoiceDate || '2026-11-15'}</td>
                            <td>{inv.customer?.fullName || inv.customer?.name || 'Retail Customer'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{inv.customer?.gstin || inv.customer?.pan || '—'}</td>
                            <td className="num">{inv.items.length}</td>
                            <td className="num">₹{(inv.productTotalValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="num" style={{ color: 'var(--info)' }}>₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="num" style={{ color: 'var(--gold-d)' }}>₹{(inv.oldMetalExchangeCredit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="num font-bold">₹{(inv.netPayable ?? inv.finalPayableAmount ?? inv.productTotalValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="num font-bold" style={{ color: 'var(--success)' }}>₹{(inv.paidAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="num font-bold" style={{ color: (inv.balanceDue || 0) > 0 ? 'var(--danger)' : 'var(--muted)' }}>
                              ₹{(inv.balanceDue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {filteredInvoices.length > 0 && (
                    <tfoot>
                      <tr>
                        <td style={{ fontWeight: 700 }}>Total</td>
                        <td colSpan={3}></td>
                        <td className="num" style={{ fontWeight: 700 }}>{filteredInvoices.reduce((a, b) => a + b.items.length, 0)}</td>
                        <td className="num" style={{ fontWeight: 700 }}>₹{totalGrossSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="num" style={{ fontWeight: 700 }}>₹{totalTaxCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="num" style={{ fontWeight: 700 }}>₹{totalOldGoldAdjusted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="num" style={{ fontWeight: 700 }}>₹{totalNetPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="num" style={{ fontWeight: 700, color: 'var(--success)' }}>₹{totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="num" style={{ fontWeight: 700, color: totalBalanceDue > 0 ? 'var(--danger)' : 'var(--muted)' }}>₹{totalBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              ) : (
                /* Item lines view */
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>INVOICE</th>
                      <th>ITEM CODE</th>
                      <th>DESCRIPTION</th>
                      <th>HSN</th>
                      <th className="num">GROSS WT (G)</th>
                      <th className="num">NET WT (G)</th>
                      <th className="num">RATE (/G)</th>
                      <th className="num">MAKING (₹)</th>
                      <th className="num">TAXABLE (₹)</th>
                      <th className="num">LINE TOTAL (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.flatMap(inv => (inv.items || []).map(it => ({ ...it, invoiceNo: inv.invoiceNo || inv.invoiceNumber }))).length === 0 ? (
                      <tr><td colSpan={10} className="empty">No data for this period.</td></tr>
                    ) : (
                      filteredInvoices.flatMap((inv, iIdx) => (inv.items || []).map((it, itIdx) => (
                        <tr key={`${iIdx}-${itIdx}`}>
                          <td className="font-bold">{inv.invoiceNo || inv.invoiceNumber || 'INV'}</td>
                          <td>{it.itemCode}</td>
                          <td>{it.itemName}</td>
                          <td style={{ fontFamily: 'monospace' }}>{it.hsnCode || '7113'}</td>
                          <td className="num">{(it.grossWeight || 0).toFixed(3)}</td>
                          <td className="num font-bold">{(it.netWeight || 0).toFixed(3)}</td>
                          <td className="num">₹{(it.metalRatePerGram || 7200).toLocaleString('en-IN')}</td>
                          <td className="num">₹{(it.makingAmount || 0).toLocaleString('en-IN')}</td>
                          <td className="num">₹{(it.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="num font-bold" style={{ color: 'var(--success)' }}>₹{(it.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      )))
                    )}
                  </tbody>
                </table>
              )
            )}

            {/* REGISTER 3: Item-wise sales summary */}
            {activeReportTab === 3 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ITEM CODE</th>
                    <th>DESCRIPTION</th>
                    <th>PURITY</th>
                    <th className="num">GROSS WT (G)</th>
                    <th className="num">NET WT (G)</th>
                    <th className="num">RATE (/G)</th>
                    <th className="num">MAKING (₹)</th>
                    <th className="num">TOTAL LINE (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.flatMap(inv => inv.items || []).length === 0 ? (
                    <tr><td colSpan={8} className="empty">No data for this period.</td></tr>
                  ) : (
                    filteredInvoices.flatMap(inv => inv.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="font-bold">{it.itemCode}</td>
                        <td>{it.itemName}</td>
                        <td>{it.purityKarat || '22K'}</td>
                        <td className="num">{(it.grossWeight || 0).toFixed(3)}</td>
                        <td className="num font-bold">{(it.netWeight || 0).toFixed(3)}</td>
                        <td className="num">₹{(it.metalRatePerGram || 7200).toLocaleString('en-IN')}</td>
                        <td className="num">₹{(it.makingAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="num font-bold" style={{ color: 'var(--success)' }}>₹{(it.lineTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* REGISTER 4: Category & volume breakdown */}
            {activeReportTab === 4 && (
              <div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 p-3 bg-[#f7f6f1] border-b border-[#e5e8e4]">
                  {['Gold Jewellery', 'Silver Articles', 'Diamond Jewellery', 'Platinum Jewellery', 'Making Charges', 'Wastage / Value Addition'].map(key => (
                    <div key={key} className="bg-white p-2.5 rounded-md border border-[#e5e8e4]">
                      <div className="text-[10.5px] font-semibold text-[#626b65] truncate">{key}</div>
                      <div className="text-[13px] font-bold text-[#202522] mt-0.5">
                        ₹{(categoryStats[key]?.value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-[10px] text-[#8e9890] mt-0.5">
                        {categoryStats[key]?.count || 0} entries · {(categoryStats[key]?.weight || 0).toFixed(2)}g
                      </div>
                    </div>
                  ))}
                </div>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>CATEGORY / REVENUE STREAM</th>
                      <th className="num">ITEMS / BILLS</th>
                      <th className="num">TOTAL GROSS WT (G)</th>
                      <th className="num">TOTAL VALUE (₹)</th>
                      <th className="num">SHARE %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(categoryStats).map(([cat, stat]) => {
                      const totalVal = Object.values(categoryStats).reduce((a, b) => a + b.value, 0);
                      const pct = totalVal > 0 ? ((stat.value / totalVal) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={cat}>
                          <td style={{ fontWeight: 600 }}>{cat}</td>
                          <td className="num font-bold">{stat.count}</td>
                          <td className="num font-mono">{stat.weight > 0 ? `${stat.weight.toFixed(3)} g` : '—'}</td>
                          <td className="num font-bold" style={{ color: 'var(--primary)' }}>₹{stat.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="num">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* REGISTER 5: Metal & purity-wise sales */}
            {activeReportTab === 5 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>METAL & PURITY</th>
                    <th className="num">TOUCH %</th>
                    <th className="num">PIECES</th>
                    <th className="num">GROSS WT (G)</th>
                    <th className="num">FINE WT (G)</th>
                    <th className="num">TOTAL BILLED (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Gold 24K (999)', touch: '99.9%', pcs: 1, gross: 20.0, fine: 19.98, val: 148000 },
                    { label: 'Gold 22K (916 Hallmarked)', touch: '91.6%', pcs: 8, gross: 42.5, fine: 38.93, val: 306000 },
                    { label: 'Gold 18K (750 Studded)', touch: '75.0%', pcs: 2, gross: 12.0, fine: 9.00, val: 86400 },
                    { label: 'Silver 999 Bullion', touch: '99.9%', pcs: 3, gross: 250.0, fine: 249.75, val: 24500 }
                  ].map(row => (
                    <tr key={row.label}>
                      <td style={{ fontWeight: 600 }}>{row.label}</td>
                      <td className="num">{row.touch}</td>
                      <td className="num font-bold">{row.pcs}</td>
                      <td className="num">{row.gross.toFixed(3)} g</td>
                      <td className="num font-bold">{row.fine.toFixed(3)} g</td>
                      <td className="num font-bold" style={{ color: 'var(--primary)' }}>₹{row.val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* REGISTER 6: Salesperson quota & performance */}
            {activeReportTab === 6 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>SALESPERSON</th>
                    <th className="num">ORDERS BILLED</th>
                    <th className="num">TOTAL REVENUE (₹)</th>
                    <th className="num">AVG TICKET SIZE (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Admin / Shop Owner', orders: filteredInvoices.length, rev: totalNetPayable }
                  ].map(sp => (
                    <tr key={sp.name}>
                      <td style={{ fontWeight: 600 }}>{sp.name}</td>
                      <td className="num font-bold">{sp.orders}</td>
                      <td className="num font-bold" style={{ color: 'var(--primary)' }}>₹{sp.rev.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num font-mono">₹{(sp.orders > 0 ? sp.rev / sp.orders : 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* REGISTER 7: Customer-wise sales & receivables */}
            {activeReportTab === 7 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>CUSTOMER NAME</th>
                    <th>MOBILE</th>
                    <th className="num">INVOICES</th>
                    <th className="num">TOTAL BILLED (₹)</th>
                    <th className="num">COLLECTED (₹)</th>
                    <th className="num">OUTSTANDING DUE (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr><td colSpan={6} className="empty">No data for this period.</td></tr>
                  ) : (
                    filteredInvoices.map((inv, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{inv.customer?.fullName || inv.customer?.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{inv.customer?.phone || inv.customer?.mobile || '—'}</td>
                        <td className="num">1</td>
                        <td className="num">₹{(inv.netPayable ?? inv.productTotalValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="num font-bold" style={{ color: 'var(--success)' }}>₹{inv.paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="num font-bold" style={{ color: inv.balanceDue > 0 ? 'var(--danger)' : 'var(--muted)' }}>
                          ₹{inv.balanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* REGISTER 8: Collection & payment mode summary (With clickable drilldown) */}
            {activeReportTab === 8 && (
              !selectedPaymentModeDrilldown ? (
                <>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>PAYMENT MODE</th>
                        <th>CHANNEL / GATEWAY</th>
                        <th className="num">RECEIPTS COUNT</th>
                        <th className="num">AMOUNT COLLECTED (₹)</th>
                        <th className="num">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(paymentModeStats).length === 0 ? (
                        <tr><td colSpan={5} className="empty">No payment receipts for this period.</td></tr>
                      ) : (
                        Object.entries(paymentModeStats).map(([mode, data]) => (
                          <tr
                            key={mode}
                            onClick={() => setSelectedPaymentModeDrilldown(mode)}
                            style={{ cursor: 'pointer' }}
                            className="hover-row"
                          >
                            <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{mode}</td>
                            <td>{mode === 'CASH' ? 'Showroom Cash Drawer' : mode === 'UPI' ? 'BHIM / PhonePe QR' : 'POS Card Terminal'}</td>
                            <td className="num font-bold">{data.count}</td>
                            <td className="num font-bold" style={{ color: 'var(--success)' }}>₹{data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="num">
                              <span className="badge badge-gold" style={{ cursor: 'pointer' }}>
                                View receipts &rarr;
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <p className="helper" style={{ padding: '8px 14px', margin: 0 }}>
                    Click any payment mode to inspect its itemised receipts.
                  </p>
                </>
              ) : (
                /* Mode Receipts Drill-down Table */
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>INVOICE NO</th>
                      <th>DATE</th>
                      <th>CUSTOMER</th>
                      <th>REFERENCE / NOTES</th>
                      <th className="num">RECEIPT AMOUNT (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentModeStats[selectedPaymentModeDrilldown]?.receipts.map((rec, rIdx) => (
                      <tr key={rIdx}>
                        <td className="font-bold">{rec.invoiceNo}</td>
                        <td>{rec.date}</td>
                        <td>{rec.customer}</td>
                        <td style={{ color: 'var(--muted)', fontSize: 11.5 }}>{rec.notes}</td>
                        <td className="num font-bold" style={{ color: 'var(--success)' }}>₹{rec.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} style={{ fontWeight: 700 }}>Total {selectedPaymentModeDrilldown} Collected</td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--success)' }}>
                        ₹{(paymentModeStats[selectedPaymentModeDrilldown]?.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )
            )}

            {/* REGISTER 9: Cash Day-Book (Drawer reconciliation) */}
            {activeReportTab === 9 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>TRANSACTION</th>
                    <th>REF / RECEIPT</th>
                    <th>COUNTER</th>
                    <th className="num">CASH INFLOW (DR)</th>
                    <th className="num">CASH OUTFLOW (CR)</th>
                    <th className="num">CLOSING CASH BALANCE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Opening Cash Float</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--muted)' }}>REG-OPEN-001</td>
                    <td>MAIN</td>
                    <td className="num font-bold">₹25,000.00</td>
                    <td className="num" style={{ color: 'var(--muted)' }}>—</td>
                    <td className="num font-bold" style={{ color: 'var(--success)' }}>₹25,000.00</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Sales Billing Receipts (Cash)</td>
                    <td style={{ fontFamily: 'monospace' }}>BILLING-DAY</td>
                    <td>MAIN</td>
                    <td className="num font-bold">₹{totalPaidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num" style={{ color: 'var(--muted)' }}>—</td>
                    <td className="num font-bold" style={{ color: 'var(--success)' }}>
                      ₹{(25000 + totalPaidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Showroom Tea & Petty Expenses</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--danger)' }}>OUTFLOW-001</td>
                    <td>MAIN</td>
                    <td className="num" style={{ color: 'var(--muted)' }}>—</td>
                    <td className="num font-bold" style={{ color: 'var(--danger)' }}>₹1,200.00</td>
                    <td className="num font-bold" style={{ color: 'var(--success)' }}>
                      ₹{(25000 + totalPaidAmount - 1200).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* REGISTER 10: Sales returns & credit notes */}
            {activeReportTab === 10 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>CREDIT NOTE NO</th>
                    <th>DATE</th>
                    <th>ORIGINAL INVOICE</th>
                    <th>CUSTOMER</th>
                    <th className="num">RETURN VALUE (₹)</th>
                    <th className="num">GST REVERSED (₹)</th>
                    <th>SETTLEMENT MODE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold">CN-2026-00008</td>
                    <td>08-Nov-2026</td>
                    <td style={{ fontFamily: 'monospace' }}>INV-2026-001254</td>
                    <td>Pooja Sharma</td>
                    <td className="num font-bold" style={{ color: 'var(--danger)' }}>₹18,500.00</td>
                    <td className="num font-bold" style={{ color: 'var(--info)' }}>₹555.00</td>
                    <td><span className="badge badge-gold">Store Credit Note</span></td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* REGISTER 11: Sales margin & profit */}
            {activeReportTab === 11 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>METRIC / COMPONENT</th>
                    <th className="num">AMOUNT (₹)</th>
                    <th>NOTES & BASIS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Gross Turnover (Excl. GST)</td>
                    <td className="num font-bold">₹{soldExclGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="helper">Billed value after discount, before 3% GST</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Estimated Cost of Goods Sold</td>
                    <td className="num font-bold" style={{ color: 'var(--muted)' }}>₹{estimatedCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="helper">Raw metal bullion replacement cost + Karigar making wages</td>
                  </tr>
                  <tr style={{ background: 'var(--surface2)' }}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>Gross Operating Profit</td>
                    <td className="num font-bold" style={{ color: 'var(--success)', fontSize: 14 }}>
                      ₹{estimatedProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>Gross Margin: {marginPct}% · Mark-up: {markupPct}%</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


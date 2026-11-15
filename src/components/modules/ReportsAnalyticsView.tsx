import React, { useState, useMemo } from 'react';
import { 
  BarChart2, TrendingUp, DollarSign, Calendar, Download, 
  Printer, ArrowUpRight, ArrowDownRight, Layers, Clock, 
  Users, ShoppingBag, Award, AlertCircle, RefreshCw, ChevronRight,
  ShieldAlert, BookOpen, CheckCircle2, Sparkles, PieChart
} from 'lucide-react';
import { SalesInvoice, Customer, StoreProfile, InventoryItem } from '../../types';

interface ReportsAnalyticsViewProps {
  store: StoreProfile;
  invoices: SalesInvoice[];
  customers?: Customer[];
  inventory?: InventoryItem[];
  onNavigate?: (module: string) => void;
}

type AnalyticsTab = 'pnl' | 'margin' | 'velocity' | 'retention' | 'ledgers';
type LedgerSubTab = 'daily-cash-ledger' | 'customer-balances' | 'metal-summary' | 'trial-balance';

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({
  store,
  invoices = [],
  customers = [],
  inventory = [],
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('pnl');
  const [activeLedgerSubTab, setActiveLedgerSubTab] = useState<LedgerSubTab>('daily-cash-ledger');
  const [periodPreset, setPeriodPreset] = useState<'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM' | 'ALL'>('MONTH');
  const [fromDate, setFromDate] = useState('2026-11-01');
  const [toDate, setToDate] = useState('2026-11-15');

  // Filter invoices for chosen period
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (periodPreset === 'ALL') return true;
      const rawDate = inv.date || inv.invoiceDate || '2026-11-15';
      const invDate = new Date(rawDate);
      const now = new Date('2026-11-15T12:00:00Z');
      if (periodPreset === 'TODAY') return invDate.toDateString() === now.toDateString();
      if (periodPreset === 'YESTERDAY') {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return invDate.toDateString() === yesterday.toDateString();
      }
      if (periodPreset === 'WEEK') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return invDate >= oneWeekAgo && invDate <= now;
      }
      if (periodPreset === 'MONTH') {
        return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
      }
      if (periodPreset === 'CUSTOM') {
        return invDate >= new Date(fromDate) && invDate <= new Date(toDate + 'T23:59:59Z');
      }
      return true;
    });
  }, [invoices, periodPreset, fromDate, toDate]);

  // Financial aggregates
  const totalGrossTurnover = filteredInvoices.reduce((a, b) => a + (b.productTotalValue || b.totalAmount || 0), 0);
  const totalNetRealised = filteredInvoices.reduce((a, b) => a + (b.netPayable ?? b.finalPayableAmount ?? b.productTotalValue ?? 0), 0);
  const totalTaxCollected = filteredInvoices.reduce((a, b) => {
    const tax = (b.items || []).reduce((s, it) => s + (it.cgstAmount || 0) + (it.sgstAmount || 0), 0);
    return a + tax;
  }, 0);
  const turnoverExclGst = totalGrossTurnover > 0 ? totalGrossTurnover / 1.03 : 0;

  // Making charges & stone charges
  const totalMakingChargesRealised = filteredInvoices.reduce((a, b) => {
    return a + (b.items || []).reduce((s, it) => s + (it.makingAmount || 0), 0);
  }, 0);
  const totalStoneChargesRealised = filteredInvoices.reduce((a, b) => {
    return a + (b.items || []).reduce((s, it) => s + (it.stoneValue || 0), 0);
  }, 0);

  // Cost of Goods Sold (COGS) Estimation: Bullion replacement cost (~86%) + Hallmark (₹45/pc)
  const cogsBullion = turnoverExclGst * 0.84;
  const cogsMakingKarigar = totalMakingChargesRealised * 0.65; // Karigar share
  const cogsHallmark = filteredInvoices.reduce((a, b) => a + (b.items?.length || 1) * 45, 0);
  const totalCogs = cogsBullion + cogsMakingKarigar + cogsHallmark;

  // Gross Profit
  const grossProfit = turnoverExclGst - totalCogs;
  const grossMarginPct = turnoverExclGst > 0 ? ((grossProfit / turnoverExclGst) * 100).toFixed(1) : '0.0';

  // Operating Overhead Expenses (Showroom OPEX monthly estimate)
  const opexSalaries = 85000;
  const opexRent = 65000;
  const opexElectricity = 12000;
  const opexInsurance = 18000;
  const opexSoftwareMarketing = 15000;
  const totalOpex = opexSalaries + opexRent + opexElectricity + opexInsurance + opexSoftwareMarketing;

  // Net Operating Profit
  const netProfit = grossProfit - totalOpex;
  const netMarginPct = turnoverExclGst > 0 ? ((netProfit / turnoverExclGst) * 100).toFixed(1) : '0.0';

  // Total Fine Weight Sold
  const fineGoldSoldGrams = filteredInvoices.reduce((a, b) => {
    return a + (b.items || []).reduce((s, it) => {
      const purity = it.purityKarat === '24K' ? 0.999 : it.purityKarat === '18K' ? 0.750 : 0.916;
      return s + (it.netWeight || 0) * purity;
    }, 0);
  }, 0);

  // Fast & Slow Moving Stock Analysis
  const inventoryItems = inventory.length > 0 ? inventory : [
    { id: '1', itemCode: 'JWL-001', itemName: '22K Daily Wear Gold Chain', category: 'Chains', grossWeight: 14.5, netWeight: 14.5, retailPrice: 112000, daysInStock: 12, status: 'IN_STOCK' },
    { id: '2', itemCode: 'JWL-002', itemName: '22K Traditional Mangalsutra', category: 'Mangalsutras', grossWeight: 22.0, netWeight: 21.2, retailPrice: 168000, daysInStock: 24, status: 'IN_STOCK' },
    { id: '3', itemCode: 'JWL-003', itemName: '18K Diamond Solitaire Ring', category: 'Rings', grossWeight: 4.8, netWeight: 4.2, retailPrice: 85000, daysInStock: 45, status: 'IN_STOCK' },
    { id: '4', itemCode: 'JWL-004', itemName: '22K Antique Choker Bridal Set', category: 'Necklaces', grossWeight: 68.0, netWeight: 64.5, retailPrice: 512000, daysInStock: 135, status: 'IN_STOCK' },
    { id: '5', itemCode: 'JWL-005', itemName: '22K Heavy Jadau Kada Pair', category: 'Bangles', grossWeight: 84.0, netWeight: 76.0, retailPrice: 620000, daysInStock: 210, status: 'IN_STOCK' }
  ];

  const fastMoving = inventoryItems.filter((i: any) => (i.daysInStock || 20) <= 30);
  const slowMoving = inventoryItems.filter((i: any) => (i.daysInStock || 20) > 90);
  const capitalInSlowMoving = slowMoving.reduce((a, b) => a + (b.retailPrice || 0), 0);

  const handleExportCSV = () => {
    alert(`Exporting ${activeTab.toUpperCase()} report as CSV spreadsheet...`);
  };

  return (
    <div className="page" style={{ padding: '16px 20px', maxWidth: '100%' }}>
      {/* Licence Banner Parity */}
      <div 
        className="license-banner rounded-lg mb-3 flex items-center justify-between p-3" 
        style={{ background: '#fef8ee', borderColor: '#fde68a', borderWidth: 1 }}
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-medium text-amber-950">
            ⚠️ Licence expires in 30 days (15-Dec-2026). Contact Kreya IT Consulting to renew.
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
              <BarChart2 size={22} style={{ color: 'var(--primary)' }} />
              Reports & Financial Analytics
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
            Trading Profit & Loss statement, gross margin analysis, stock velocity/aging, customer retention cohorts, and classic ledgers · {store.tradeName || 'S.B Borana Jewellers'}
          </p>
        </div>

        {/* Global Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={handleExportCSV} className="btn btn-outline btn-sm">
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button onClick={() => window.print()} className="btn btn-outline btn-sm">
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Range Picker Filter Bar */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="label" style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>Period:</span>
            {(['TODAY', 'YESTERDAY', 'WEEK', 'MONTH', 'CUSTOM', 'ALL'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriodPreset(p)}
                className={`btn btn-sm ${periodPreset === p ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '4px 10px', fontSize: 11.5 }}
              >
                {p === 'TODAY' && 'Today'}
                {p === 'YESTERDAY' && 'Yesterday'}
                {p === 'WEEK' && 'This Week'}
                {p === 'MONTH' && 'This Month'}
                {p === 'CUSTOM' && 'Custom'}
                {p === 'ALL' && 'All Time'}
              </button>
            ))}
          </div>

          {periodPreset === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface2)', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <span className="helper" style={{ fontSize: 11, margin: 0 }}>From</span>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input input-sm" />
              <span className="helper" style={{ fontSize: 11, margin: 0 }}>To</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input input-sm" />
            </div>
          )}

          <span className="badge badge-gold font-mono" style={{ fontSize: 11.5 }}>
            Entity: {store.tradeName || 'S.B Borana Jewellers'} · Mumbai (GST: {store.gstin || '27ACZPJ7126B1ZA'})
          </span>
        </div>
      </div>

      {/* Top Level Summary Cards */}
      <div className="sum-grid" style={{ marginBottom: 14 }}>
        <div className="sum-box">
          <div className="sum-val">₹{turnoverExclGst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="sum-lbl">Net Sales Turnover (Excl. GST)</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)' }}>
            ₹{grossProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="sum-lbl">Gross Trading Profit ({grossMarginPct}%)</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: Number(netProfit) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
            ₹{netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="sum-lbl">Estimated Net Profit ({netMarginPct}%)</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--info)' }}>
            {fineGoldSoldGrams.toFixed(2)} g
          </div>
          <div className="sum-lbl">Fine Gold Delivered (24K Equiv)</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button
          onClick={() => setActiveTab('pnl')}
          className={`tab ${activeTab === 'pnl' ? 'active' : ''}`}
        >
          Profit & Loss Estimate
        </button>
        <button
          onClick={() => setActiveTab('margin')}
          className={`tab ${activeTab === 'margin' ? 'active' : ''}`}
        >
          Margin & Markup Analysis
        </button>
        <button
          onClick={() => setActiveTab('velocity')}
          className={`tab ${activeTab === 'velocity' ? 'active' : ''}`}
        >
          Fast / Slow Moving Stock
        </button>
        <button
          onClick={() => setActiveTab('retention')}
          className={`tab ${activeTab === 'retention' ? 'active' : ''}`}
        >
          Customer Retention Metrics
        </button>
        <button
          onClick={() => setActiveTab('ledgers')}
          className={`tab ${activeTab === 'ledgers' ? 'active' : ''}`}
        >
          Classic Ledgers & Day-Book
        </button>
      </div>

      {/* TAB 1: PROFIT & LOSS ESTIMATE */}
      {activeTab === 'pnl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Trading Account: Revenue & Cost of Goods Sold (COGS)</strong>
              <span className="badge badge-green font-mono">Gross Margin: {grossMarginPct}%</span>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>PARTICULARS</th>
                    <th className="num">INFLOW / REVENUE (₹)</th>
                    <th className="num">COST / OUTFLOW (₹)</th>
                    <th>ACCOUNTING BASIS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Gold & Silver Jewellery Sales</td>
                    <td className="num font-bold">₹{turnoverExclGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num">—</td>
                    <td className="helper">Billed invoices net of customer discounts, excluding 3% GST</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Making Charges Earned</td>
                    <td className="num font-bold">₹{totalMakingChargesRealised.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num">—</td>
                    <td className="helper">Per-gram and percentage crafting revenue collected</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Raw Bullion Replacement Cost</td>
                    <td className="num">—</td>
                    <td className="num font-bold" style={{ color: 'var(--danger)' }}>₹{cogsBullion.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="helper">Spot replacement cost of 999 fine bullion melted/delivered</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Karigar Workshop Casting & Setting Wages</td>
                    <td className="num">—</td>
                    <td className="num font-bold" style={{ color: 'var(--danger)' }}>₹{cogsMakingKarigar.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="helper">Artisan payouts (approx 65% of billed making charges)</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>BIS Hallmarking & HUID Testing Fees</td>
                    <td className="num">—</td>
                    <td className="num font-bold" style={{ color: 'var(--danger)' }}>₹{cogsHallmark.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="helper">Government recognized assaying centre fees (@ ₹45/pc)</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--surface2)' }}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>Gross Operating Trading Profit</td>
                    <td colSpan={2} className="num font-bold" style={{ color: 'var(--success)', fontSize: 14 }}>
                      ₹{grossProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>Gross Margin on Sales: {grossMarginPct}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <strong>Indirect Showroom Operating Overheads (OPEX)</strong>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>EXPENSE CATEGORY</th>
                    <th className="num">MONTHLY ALLOCATION (₹)</th>
                    <th>DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Staff Salaries & Counter Operators</td>
                    <td className="num font-bold">₹{opexSalaries.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="helper">Showroom manager, sales executives, cashier</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Showroom Rent & Maintenance</td>
                    <td className="num font-bold">₹{opexRent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="helper">Prime market retail space lease</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Electricity & Air Conditioning</td>
                    <td className="num font-bold">₹{opexElectricity.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="helper">Commercial power & high-intensity halogen display lighting</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Vault, Bullion & Showroom Block Insurance</td>
                    <td className="num font-bold">₹{opexInsurance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="helper">Comprehensive jewelers block insurance policy</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Software, POS Hardware & Marketing</td>
                    <td className="num font-bold">₹{opexSoftwareMarketing.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="helper">ERP cloud licence, SMS gateway, local festive promotions</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Total Showroom Operating Overheads</td>
                    <td className="num" style={{ fontWeight: 700, color: 'var(--danger)' }}>
                      ₹{totalOpex.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                  <tr style={{ background: 'var(--surface2)' }}>
                    <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 13.5 }}>Net Operating Profit (EBITDA)</td>
                    <td className="num font-bold" style={{ color: Number(netProfit) >= 0 ? 'var(--success)' : 'var(--danger)', fontSize: 14 }}>
                      ₹{netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>Net Margin: {netMarginPct}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MARGIN & MARKUP ANALYSIS */}
      {activeTab === 'margin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="sum-box">
              <div className="sum-lbl">Avg Making Charge Realised</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--primary)' }}>₹620 / gram</div>
              <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>Billed to retail customers</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">Karigar Cost Payout</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--danger)' }}>₹405 / gram</div>
              <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>Artisan workshop labor</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">Net Making Spread</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--success)' }}>+₹215 / gram</div>
              <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>34.7% retained margin</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">Diamond / Stone Markup</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--gold-d)' }}>45.0%</div>
              <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>Over wholesale certified cost</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <strong>Category-Wise Margin & Spread Contribution</strong>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>CATEGORY</th>
                    <th className="num">SHARE %</th>
                    <th className="num">AVG RATE / G (₹)</th>
                    <th className="num">MAKING / G (₹)</th>
                    <th className="num">GROSS MARGIN %</th>
                    <th>CONTRIBUTION</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>22K Plain Gold Jewellery</td>
                    <td className="num">68.0%</td>
                    <td className="num">₹7,200</td>
                    <td className="num">₹550</td>
                    <td className="num font-bold" style={{ color: 'var(--success)' }}>11.5%</td>
                    <td>High volume, steady foundation</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>18K Studded Diamond Jewellery</td>
                    <td className="num">18.5%</td>
                    <td className="num">₹5,890</td>
                    <td className="num">₹850</td>
                    <td className="num font-bold" style={{ color: 'var(--success)' }}>32.4%</td>
                    <td>Highest margin generator</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Silver Articles & Utensils</td>
                    <td className="num">8.5%</td>
                    <td className="num">₹94</td>
                    <td className="num">₹22</td>
                    <td className="num font-bold" style={{ color: 'var(--success)' }}>24.0%</td>
                    <td>Pooja articles & baby gifts</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>24K Bullion Coins & Bars</td>
                    <td className="num">5.0%</td>
                    <td className="num">₹7,850</td>
                    <td className="num">₹50</td>
                    <td className="num font-bold" style={{ color: 'var(--muted)' }}>1.2%</td>
                    <td>Liquidity & footfall anchor</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FAST / SLOW MOVING STOCK */}
      {activeTab === 'velocity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div className="sum-box">
              <div className="sum-lbl">Fast Moving Items (&lt; 30 Days)</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--success)' }}>{fastMoving.length} pieces</div>
              <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>High inventory turnover</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">Slow Moving (&gt; 90 Days)</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--danger)' }}>{slowMoving.length} pieces</div>
              <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>Capital locked in display tray</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">Capital Locked in Slow Stock</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--gold-d)' }}>₹{capitalInSlowMoving.toLocaleString('en-IN')}</div>
              <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>Recommended for remelting or promotion</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <strong>Stock Aging & Velocity Matrix</strong>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>ITEM CODE</th>
                    <th>ITEM DESCRIPTION</th>
                    <th>CATEGORY</th>
                    <th className="num">GROSS WT (G)</th>
                    <th className="num">RETAIL VALUE (₹)</th>
                    <th className="num">DAYS IN SHOWROOM</th>
                    <th>VELOCITY STATUS</th>
                    <th>RECOMMENDED ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryItems.map((itm: any) => {
                    const days = itm.daysInStock || 25;
                    const isFast = days <= 30;
                    const isSlow = days > 90;
                    return (
                      <tr key={itm.id}>
                        <td className="font-bold">{itm.itemCode}</td>
                        <td style={{ fontWeight: 600 }}>{itm.itemName}</td>
                        <td>{itm.category}</td>
                        <td className="num font-mono">{(itm.grossWeight || 0).toFixed(3)}</td>
                        <td className="num font-bold">₹{(itm.retailPrice || 0).toLocaleString('en-IN')}</td>
                        <td className="num font-bold">{days} days</td>
                        <td>
                          <span className={`badge ${isFast ? 'badge-green' : isSlow ? 'badge-danger' : 'badge-gold'}`}>
                            {isFast ? 'Fast Moving' : isSlow ? 'Dead / Slow Stock' : 'Steady'}
                          </span>
                        </td>
                        <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                          {isSlow ? 'Discount making 20% or melt to 24K bar' : 'Restock standard inventory size'}
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

      {/* TAB 4: CUSTOMER RETENTION METRICS */}
      {activeTab === 'retention' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div className="sum-box">
              <div className="sum-lbl">Repeat Customer Rate</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--primary)' }}>64.2%</div>
              <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>Family jeweller loyalty</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">Average Order Value (AOV)</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--success)' }}>
                ₹{(filteredInvoices.length > 0 ? totalNetRealised / filteredInvoices.length : 125000).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>Per transaction invoice</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">Total Registered Customers</div>
              <div className="sum-val" style={{ fontSize: 18 }}>{customers.length || 1}</div>
              <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>Full profiles on file</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">Old Gold Exchange %</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--gold-d)' }}>42.8%</div>
              <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>Transactions with metal swap</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <strong>High-Value VIP Customer Accounts</strong>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>CUSTOMER</th>
                    <th>MOBILE</th>
                    <th>CITY</th>
                    <th className="num">LIFETIME ORDERS</th>
                    <th className="num">TOTAL PURCHASES (₹)</th>
                    <th>LOYALTY TIER</th>
                  </tr>
                </thead>
                <tbody>
                  {(customers.length > 0 ? customers : [
                    { id: '1', name: 'Pakshal Jain', mobile: '9876543210', city: 'Mumbai', totalPurchased: 2450000, loyaltyPoints: 480 }
                  ]).map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.fullName || c.name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{c.mobile || c.phone || '—'}</td>
                      <td>{c.city || 'Mumbai'}</td>
                      <td className="num font-bold">12</td>
                      <td className="num font-bold" style={{ color: 'var(--primary)' }}>₹{(c.totalPurchased || 2450000).toLocaleString('en-IN')}</td>
                      <td><span className="badge badge-gold">Diamond Tier (VIP)</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CLASSIC LEDGERS & DAY-BOOK */}
      {activeTab === 'ledgers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Subtabs for classic ledgers */}
          <div className="tabs" style={{ marginBottom: 0 }}>
            <button
              onClick={() => setActiveLedgerSubTab('daily-cash-ledger')}
              className={`tab ${activeLedgerSubTab === 'daily-cash-ledger' ? 'active' : ''}`}
            >
              Daily Cash Day-Book
            </button>
            <button
              onClick={() => setActiveLedgerSubTab('customer-balances')}
              className={`tab ${activeLedgerSubTab === 'customer-balances' ? 'active' : ''}`}
            >
              Customer Receivables Ledger
            </button>
            <button
              onClick={() => setActiveLedgerSubTab('metal-summary')}
              className={`tab ${activeLedgerSubTab === 'metal-summary' ? 'active' : ''}`}
            >
              Metal Fine Gold Balance Sheet
            </button>
            <button
              onClick={() => setActiveLedgerSubTab('trial-balance')}
              className={`tab ${activeLedgerSubTab === 'trial-balance' ? 'active' : ''}`}
            >
              Trial Balance & Financial Abstract
            </button>
          </div>

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={16} style={{ color: 'var(--muted)' }} />
                <span className="card-title">
                  {activeLedgerSubTab === 'daily-cash-ledger' && 'Daily Cash Register & Transactions'}
                  {activeLedgerSubTab === 'customer-balances' && 'Customer Receivables & Balance Register'}
                  {activeLedgerSubTab === 'metal-summary' && 'Gross & Fine Gold Movement Summary'}
                  {activeLedgerSubTab === 'trial-balance' && 'General Ledger Trial Balance (Debits vs Credits)'}
                </span>
              </div>
              <span className="helper font-mono">{store.tradeName || 'S.B Borana Jewellers'} · Mumbai</span>
            </div>

            <div className="tbl-wrap">
              {/* Daily Cash Ledger */}
              {activeLedgerSubTab === 'daily-cash-ledger' && (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>ENTRY REF</th>
                      <th>DATE</th>
                      <th>PARTICULARS</th>
                      <th className="num">DEBIT / INFLOW (₹)</th>
                      <th className="num">CREDIT / OUTFLOW (₹)</th>
                      <th className="num">BALANCE (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-bold">CSH-001</td>
                      <td>15-Nov-2026</td>
                      <td style={{ fontWeight: 600 }}>Opening Float Balance</td>
                      <td className="num font-bold">₹25,000.00</td>
                      <td className="num">—</td>
                      <td className="num font-bold" style={{ color: 'var(--success)' }}>₹25,000.00</td>
                    </tr>
                    <tr>
                      <td className="font-bold">CSH-002</td>
                      <td>15-Nov-2026</td>
                      <td style={{ fontWeight: 600 }}>Cash Sales Inflow (INV-2026-00001)</td>
                      <td className="num font-bold">₹65,000.00</td>
                      <td className="num">—</td>
                      <td className="num font-bold" style={{ color: 'var(--success)' }}>₹90,000.00</td>
                    </tr>
                    <tr>
                      <td className="font-bold">CSH-003</td>
                      <td>15-Nov-2026</td>
                      <td style={{ fontWeight: 600 }}>Workshop Karigar Setting Advance</td>
                      <td className="num">—</td>
                      <td className="num font-bold" style={{ color: 'var(--danger)' }}>₹5,000.00</td>
                      <td className="num font-bold" style={{ color: 'var(--success)' }}>₹85,000.00</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ fontWeight: 700 }}>Closing Cash In Hand</td>
                      <td className="num" style={{ fontWeight: 700 }}>₹90,000.00</td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--danger)' }}>₹5,000.00</td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--success)', fontSize: 13.5 }}>₹85,000.00</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* Customer Outstanding Balances */}
              {activeLedgerSubTab === 'customer-balances' && (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>CUSTOMER</th>
                      <th>CONTACT</th>
                      <th className="num">CURRENT DUE (₹)</th>
                      <th className="num">0-30 DAYS</th>
                      <th className="num">31-60 DAYS</th>
                      <th className="num">60+ DAYS</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Pakshal Jain</td>
                      <td style={{ fontFamily: 'monospace' }}>9876543210</td>
                      <td className="num font-bold" style={{ color: 'var(--danger)' }}>₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td><span className="badge badge-green">Clear</span></td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Metal Fine Gold Balance Sheet */}
              {activeLedgerSubTab === 'metal-summary' && (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>TRANSACTION</th>
                      <th className="num">GROSS WEIGHT (G)</th>
                      <th className="num">AVG PURITY</th>
                      <th className="num">FINE GOLD IN (G)</th>
                      <th className="num">FINE GOLD OUT (G)</th>
                      <th className="num">NET METAL BALANCE (G)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Opening Bullion Stock</td>
                      <td className="num">500.000</td>
                      <td className="num">99.9%</td>
                      <td className="num font-bold">499.500</td>
                      <td className="num">—</td>
                      <td className="num font-bold">499.500</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Sales Delivery to Customers</td>
                      <td className="num">42.500</td>
                      <td className="num">91.6%</td>
                      <td className="num">—</td>
                      <td className="num font-bold" style={{ color: 'var(--danger)' }}>38.930</td>
                      <td className="num font-bold">460.570</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Old Gold Customer Exchanges</td>
                      <td className="num">15.500</td>
                      <td className="num">84.5%</td>
                      <td className="num font-bold" style={{ color: 'var(--success)' }}>13.097</td>
                      <td className="num">—</td>
                      <td className="num font-bold" style={{ color: 'var(--success)' }}>473.667</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Trial Balance */}
              {activeLedgerSubTab === 'trial-balance' && (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>LEDGER ACCOUNT HEAD</th>
                      <th className="num">DEBIT BALANCE (₹)</th>
                      <th className="num">CREDIT BALANCE (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Precious Metals Inventory (At Cost)</td>
                      <td className="num font-bold">₹42,50,000.00</td>
                      <td className="num">—</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Showroom Cash Float</td>
                      <td className="num font-bold">₹85,000.00</td>
                      <td className="num">—</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>HDFC Bank Current Account</td>
                      <td className="num font-bold">₹14,20,500.00</td>
                      <td className="num">—</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Customer Receivables</td>
                      <td className="num font-bold">₹45,000.00</td>
                      <td className="num">—</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Owner's Capital Account</td>
                      <td className="num">—</td>
                      <td className="num font-bold">₹50,00,000.00</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Bullion Supplier Payables</td>
                      <td className="num">—</td>
                      <td className="num font-bold">₹8,00,500.00</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td style={{ fontWeight: 700 }}>Total Reconciled Trial Balance</td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--primary)' }}>₹58,00,500.00</td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--primary)' }}>₹58,00,500.00</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

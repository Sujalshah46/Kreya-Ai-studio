import React from 'react';
import { 
  TrendingUp, ShoppingCart, Activity, AlertTriangle, CreditCard, Users, 
  Package, Clock, Wrench, Calendar, ChevronDown, User, FileText, ChevronRight
} from 'lucide-react';
import { SalesInvoice, GirviLoan, RepairOrder, InventoryItem, DailyRates, StoreProfile, Customer, MetalBooking } from '../../types';

const businessDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
});
const orderDateLabel = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
});
const monthLabel = new Intl.DateTimeFormat('en-GB', {
  month: 'short', year: 'numeric', timeZone: 'UTC'
});
const moneyFormat = new Intl.NumberFormat('en-IN');
const otherPaymentColors = ['#537b9c', '#946787', '#797f49'];

function dateKey(value?: string): string | undefined {
  if (!value) return undefined;
  // Date-only and local datetime values already represent the shop calendar.
  const localDate = value.match(/^(\d{4}-\d{2}-\d{2})(?:$|[ T]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$)/);
  const date = new Date(localDate ? localDate[1] + 'T00:00:00Z' : value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return localDate ? date.toISOString().slice(0, 10) : businessDate.format(date);
}

function chartTick(value: number, step: number): string {
  if (value >= 100000) return '₹' + (step >= 100000 ? Math.round(value / 100000) : value / 100000) + 'L';
  return '₹' + value / 1000 + 'k';
}

function donutSlice(start: number, sweep: number): string {
  const point = (radius: number, angle: number) =>
    [radius * Math.cos(angle), radius * Math.sin(angle)].join(' ');
  const outerStart = point(66, start);
  const outerEnd = point(66, start + sweep);
  const innerStart = point(42, start);
  const innerEnd = point(42, start + sweep);
  const large = sweep > Math.PI ? 1 : 0;
  return `M ${outerStart} A 66 66 0 ${large} 1 ${outerEnd} L ${innerEnd} A 42 42 0 ${large} 0 ${innerStart} Z`;
}

interface DashboardViewProps {
  store: StoreProfile;
  rates: DailyRates;
  invoices: SalesInvoice[];
  loans: GirviLoan[];
  repairs: RepairOrder[];
  inventory: InventoryItem[];
  customers?: Customer[];
  bookings?: MetalBooking[];
  onNavigate: (module: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  store,
  rates,
  invoices = [],
  loans = [],
  repairs = [],
  inventory = [],
  customers = [],
  bookings = [],
  onNavigate
}) => {
  const today = businessDate.format(new Date());
  const currentMonth = today.slice(0, 7);
  const postedInvoices = invoices.filter(invoice =>
    invoice.status !== 'CANCELLED' && invoice.status !== 'ESTIMATE'
  );
  const monthlyInvoices = postedInvoices.filter(invoice => {
    const date = dateKey(invoice.invoiceDate ?? invoice.date);
    return date?.slice(0, 7) === currentMonth && date <= today;
  });
  const todayInvoices = monthlyInvoices.filter(invoice => dateKey(invoice.invoiceDate ?? invoice.date) === today);
  const todaySales = todayInvoices.reduce((total, invoice) => total + invoice.productTotalValue, 0);
  const monthlyRevenue = monthlyInvoices.reduce((total, invoice) => total + invoice.productTotalValue, 0);
  const totalOutstanding = postedInvoices.reduce((total, invoice) => total + invoice.balanceDue, 0);

  const openLoans = loans.filter(loan => ['ACTIVE', 'OVERDUE', 'OPEN'].includes(loan.status.toUpperCase()));
  const loanPortfolio = openLoans.reduce((total, loan) => total + loan.principalDue, 0);
  const customerCount = customers.length;
  const openGoldWeight = 0;
  const openSilverWeight = 0;
  const pendingDelivery = postedInvoices.filter(invoice => invoice.deliveryStatus === 'PENDING_COLLECTION').length;
  const pendingRepairs = repairs.filter(repair => repair.status.toLowerCase() !== 'delivered').length;
  const openBookings = bookings.filter(booking => ['ACTIVE', 'OPEN'].includes(booking.status.toUpperCase())).length;
  const inventoryItemsCount = inventory.length;

  // Rate values for today
  const rate24k = rates.gold24kPer10g || (rates.gold24kPerGram ? rates.gold24kPerGram * 10 : 150000);
  const rate22k = rates.gold22kPer10g || (rates.gold22kPerGram ? rates.gold22kPerGram * 10 : Math.round(rate24k * 0.916));
  const rate18k = rates.gold18kPer10g || (rates.gold18kPerGram ? rates.gold18kPerGram * 10 : Math.round(rate24k * 0.75));

  // Use dated invoice records for the chart and never substitute demo chart values.
  const todayUtc = new Date(today + 'T00:00:00Z');
  const firstMonth = new Date(todayUtc);
  firstMonth.setUTCDate(1);
  firstMonth.setUTCMonth(firstMonth.getUTCMonth() - 11);
  const firstMonthKey = firstMonth.toISOString().slice(0, 7);
  const paymentStart = new Date(todayUtc);
  paymentStart.setUTCDate(paymentStart.getUTCDate() - 29);
  const paymentStartKey = paymentStart.toISOString().slice(0, 10);
  const months = new Map<string, { revenue: number; collected: number }>();
  const paymentModes = new Map<string, number>();
  const monthTotals = (date: string) => {
    const key = date.slice(0, 7);
    const totals = months.get(key) ?? { revenue: 0, collected: 0 };
    months.set(key, totals);
    return totals;
  };

  let todayCashIn = 0;
  for (const invoice of invoices) {
    const invoiceDate = dateKey(invoice.invoiceDate ?? invoice.date);
    if (invoiceDate && invoiceDate <= today && invoiceDate.slice(0, 7) >= firstMonthKey &&
        invoice.status !== 'CANCELLED' && invoice.status !== 'ESTIMATE' && Number.isFinite(invoice.productTotalValue)) {
      monthTotals(invoiceDate).revenue += invoice.productTotalValue;
    }
    const payments = invoice.paymentTransactions?.length ? invoice.paymentTransactions : invoice.payments ?? [];
    for (const payment of payments) {
      const date = dateKey(payment.date) ?? dateKey(payment.timestamp);
      if (!date || date > today || !Number.isFinite(payment.amount) || payment.amount <= 0) continue;
      if (date === today) todayCashIn += payment.amount;
      if (date.slice(0, 7) >= firstMonthKey) monthTotals(date).collected += payment.amount;
      const mode = payment.mode?.trim().toUpperCase();
      if (mode && date >= paymentStartKey) paymentModes.set(mode, (paymentModes.get(mode) ?? 0) + payment.amount);
    }
  }

  const chartMonths = [...months.entries()].sort(([a], [b]) => a.localeCompare(b));
  const highest = Math.max(0, ...chartMonths.flatMap(([, totals]) => [totals.revenue, totals.collected]));
  const tickUnit = highest >= 100000 ? 50000 : 1000;
  const step = Math.max(tickUnit, Math.ceil(highest / 4 / tickUnit) * tickUnit);
  const ticks = [0, 1, 2, 3, 4].map(index => index * step);
  const plotRef = React.useRef<HTMLDivElement>(null);
  const [plotWidth, setPlotWidth] = React.useState(453);
  React.useLayoutEffect(() => {
    const element = plotRef.current;
    if (!element) return;
    const measure = () => setPlotWidth(Math.max(72, element.clientWidth));
    const observer = new ResizeObserver(measure);
    measure();
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const plotRight = plotWidth - 8;
  const chartCenter = (50 + plotRight) / 2;
  const chartX = (index: number) => chartMonths.length === 1
    ? chartCenter
    : 50 + index * (plotRight - 50) / (chartMonths.length - 1);
  const chartY = (amount: number) => 183 - amount / (4 * step) * 178;
  const totalPaymentSum = [...paymentModes.values()].reduce((sum, amount) => sum + amount, 0);
  let angle = 0;
  let otherColorIndex = 0;
  const paymentBreakdown = [...paymentModes.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([mode, amount]) => {
      const sweep = 2 * Math.PI * amount / totalPaymentSum;
      const gap = Math.min(2 * Math.PI / 180, sweep / 3);
      const path = donutSlice(angle, sweep - gap);
      angle += sweep;
      return {
        mode: mode === 'CASH' ? 'Cash' : mode,
        amount,
        percent: Math.round(amount / totalPaymentSum * 100),
        color: mode === 'UPI' ? '#237a57' : mode === 'CASH' ? '#c5a46d' : otherPaymentColors[otherColorIndex++ % otherPaymentColors.length],
        path
      };
    });

  // Top customers by purchase
  const customerSpendMap = new Map<string, { name: string; phone: string; total: number; orders: number }>();
  postedInvoices.forEach(inv => {
    const custName = inv.customer?.name || 'Unknown customer';
    const custPhone = inv.customer?.mobile || '';
    const key = inv.customer?.id || custName;
    const existing = customerSpendMap.get(key) || { name: custName, phone: custPhone, total: 0, orders: 0 };
    existing.total += (inv.productTotalValue || 0);
    existing.orders += 1;
    customerSpendMap.set(key, existing);
  });
  const topCustomers = [...customerSpendMap.values()].sort((a, b) => b.total - a.total).slice(0, 10);
  const maxCustomerSpend = topCustomers[0]?.total || 1;
  const recentOrders = [...postedInvoices].sort((a, b) =>
    (dateKey(b.invoiceDate ?? b.date) ?? '').localeCompare(dateKey(a.invoiceDate ?? a.date) ?? '')
  ).slice(0, 5);

  return (
    <>
      
      {/* 1. Licence Expiration Warning Banner Matching Screenshot */}
      <div className="license-banner" role="status" style={{ background: '#fef8ee' }}>
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="flex-1">Licence expires in 30 days (15-Dec-2026). Contact Kreya IT Consulting to renew.</span>
        <button 
          onClick={() => onNavigate('licence')}
          className="font-semibold text-amber-900 hover:text-amber-950 cursor-pointer flex items-center gap-1 text-xs"
        >
          <span>Licence</span>
          <span>→</span>
        </button>
      </div>

      <div className="page dash">
      {/* 2. TODAY'S RATES Strip Matching Original Software */}
      <div 
        className="dash-rates"
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#f5f2eb',
          border: '1px solid #dbd2be',
          borderRadius: '14px',
          overflow: 'hidden'
        }}
      >
        <div 
          className="dash-rates-head"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 18px',
            borderRight: '1px solid #dbd2be'
          }}
        >
          <b style={{ fontSize: '11px', letterSpacing: '0.05em', color: '#725f3f', fontWeight: 700 }}>TODAY'S RATES</b>
          <span style={{ fontSize: '11.5px', color: '#89918b' }}>15 Nov 2026 · per 10 g</span>
        </div>
        <div 
          className="dash-rate"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '11px 16px',
            borderRight: '1px solid #dbd2be'
          }}
        >
          <small style={{ fontSize: '11.5px', color: '#5f6661' }}>24K Gold</small>
          <strong style={{ fontSize: '15px', fontWeight: 600, color: '#202522', fontVariantNumeric: 'tabular-nums' }}>
            ₹{rate24k.toLocaleString('en-IN')}
          </strong>
        </div>
        <div 
          className="dash-rate"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '11px 16px',
            borderRight: '1px solid #dbd2be'
          }}
        >
          <small style={{ fontSize: '11.5px', color: '#5f6661' }}>22K Gold</small>
          <strong style={{ fontSize: '15px', fontWeight: 600, color: '#202522', fontVariantNumeric: 'tabular-nums' }}>
            ₹{rate22k.toLocaleString('en-IN')}
          </strong>
        </div>
        <div 
          className="dash-rate"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '11px 16px'
          }}
        >
          <small style={{ fontSize: '11.5px', color: '#5f6661' }}>18K Gold</small>
          <strong style={{ fontSize: '15px', fontWeight: 600, color: '#202522', fontVariantNumeric: 'tabular-nums' }}>
            ₹{rate18k.toLocaleString('en-IN')}
          </strong>
        </div>
      </div>

      {/* 3. 4 Top KPI Cards Row (.dash-kpis) */}
      <div className="dash-kpis">
        {/* TODAY'S SALES */}
        <div className="kpi-card" onClick={() => onNavigate('orders')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Today's Sales</span>
            <div className="kpi-ico good">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="kpi-value">₹{todaySales.toLocaleString('en-IN')}</div>
            <div className="kpi-sub">{todayInvoices.length} invoices today</div>
          </div>
        </div>

        {/* MONTHLY REVENUE */}
        <div className="kpi-card" onClick={() => onNavigate('orders')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Monthly Revenue</span>
            <div className="kpi-ico">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="kpi-value">₹{monthlyRevenue.toLocaleString('en-IN')}</div>
            <div className="kpi-sub">{monthlyInvoices.length} orders this month</div>
          </div>
        </div>

        {/* TODAY'S CASH IN */}
        <div className="kpi-card" onClick={() => onNavigate('payments')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Today's Cash In</span>
            <div className="kpi-ico good">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="kpi-value">₹{todayCashIn.toLocaleString('en-IN')}</div>
            <div className="kpi-sub">Receipts recorded against invoices</div>
          </div>
        </div>

        {/* OUTSTANDING */}
        <div className="kpi-card" onClick={() => onNavigate('payments')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Outstanding</span>
            <div className="kpi-ico">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="kpi-value">₹{totalOutstanding.toLocaleString('en-IN')}</div>
            <div className="kpi-sub">Pending from customers</div>
          </div>
        </div>
      </div>

      {/* 4. Middle Row: Monthly Revenue & Payment Modes Charts */}
      <div 
        className="dash-row"
      >
        {/* Monthly Revenue & Collections Panel with Real Area Chart */}
        <section 
          className="dash-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            border: '1px solid #e5e8e4',
            borderRadius: '14px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="dash-panel-head"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '13px 18px',
              borderBottom: '1px solid #f0f2ef'
            }}
          >
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 650, color: '#202522' }}>
              <TrendingUp className="w-4 h-4 text-[#237a57]" />
              <span>Monthly Revenue & Collections</span>
            </h3>
            <span className="helper" style={{ fontSize: '11.5px', color: '#89918b', margin: 0 }}>12 months</span>
          </div>

          <div className="dash-panel-body" style={{ padding: '14px 18px', flex: 1 }}>
            <div ref={plotRef} className="recharts-responsive-container" style={{ width: '100%', height: '240px', minWidth: 0, position: 'relative' }}>
              <svg 
                className="recharts-surface" 
                width="100%" 
                height="100%" 
                viewBox={`0 0 ${plotWidth} 240`} 
                style={{ width: '100%', height: '100%', overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#237a57" stopOpacity="0.16" />
                    <stop offset="95%" stopColor="#237a57" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gCol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c5a46d" stopOpacity="0.16" />
                    <stop offset="95%" stopColor="#c5a46d" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {ticks.map(value => (
                  <g key={value}>
                    <line strokeDasharray="3 3" stroke="#e5e8e4" x1="50" y1={chartY(value)} x2={plotRight} y2={chartY(value)} />
                    <text fontSize="11" x="42" y={chartY(value) + 4} textAnchor="end" fill="#89918b">{chartTick(value, step)}</text>
                  </g>
                ))}
                {chartMonths.map(([month], index) => (
                  <text key={month} fontSize="11" x={chartX(index)} y="202" textAnchor="middle" fill="#89918b">
                    {monthLabel.format(new Date(month + '-01T00:00:00Z'))}
                  </text>
                ))}
                {([
                  { key: 'revenue', label: 'Revenue', color: '#237a57', gradient: 'gRev' },
                  { key: 'collected', label: 'Collected', color: '#c5a46d', gradient: 'gCol' }
                ] as const).map(series => {
                  const points = chartMonths.map(([month, totals], index) => ({
                    month, amount: totals[series.key], x: chartX(index), y: chartY(totals[series.key])
                  }));
                  const line = points.map(({ x, y }) => `${x},${y}`).join(' L ');
                  return (
                    <g key={series.key}>
                      {points.length > 1 && (
                        <>
                          <path d={`M ${points[0].x},183 L ${line} L ${points[points.length - 1].x},183 Z`} fill={`url(#${series.gradient})`} />
                          <path d={`M ${line}`} fill="none" stroke={series.color} strokeWidth="2" />
                        </>
                      )}
                      {points.map(point => (
                        <circle key={point.month} cx={point.x} cy={point.y} r="3" fill={series.color}>
                          <title>{`${series.label}: ₹${moneyFormat.format(point.amount)}`}</title>
                        </circle>
                      ))}
                    </g>
                  );
                })}
                {chartMonths.length === 0 && (
                  <text x={chartCenter} y="100" textAnchor="middle" fill="#89918b">No revenue or collections in this period.</text>
                )}
              </svg>

              {/* Bottom Chart Legend */}
              <div 
                style={{
                  position: 'absolute',
                  width: '100%',
                  bottom: '2px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '20px',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#237a57', display: 'inline-block' }} />
                  <span style={{ color: '#237a57', fontWeight: 500 }}>Revenue</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#c5a46d', display: 'inline-block' }} />
                  <span style={{ color: '#c5a46d', fontWeight: 500 }}>Collected</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payment Modes Panel with Real Donut Chart */}
        <section 
          className="dash-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            border: '1px solid #e5e8e4',
            borderRadius: '14px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="dash-panel-head"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '13px 18px',
              borderBottom: '1px solid #f0f2ef'
            }}
          >
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 650, color: '#202522' }}>
              <Clock className="w-4 h-4 text-[#c5a46d]" />
              <span>Payment Modes</span>
            </h3>
            <span className="helper" style={{ fontSize: '11.5px', color: '#89918b', margin: 0 }}>30 days</span>
          </div>

          <div className="dash-panel-body" style={{ padding: '14px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '150px', display: 'grid', placeItems: 'center' }}>
              {paymentBreakdown.length ? (
                <svg width="100%" height="150" viewBox="-70 -75 140 150" role="img" aria-label="Payment modes over the last 30 days">
                  {paymentBreakdown.length === 1 ? (
                    <circle r="54" fill="none" stroke={paymentBreakdown[0].color} strokeWidth="24" />
                  ) : paymentBreakdown.map(payment => (
                    <path key={payment.mode} d={payment.path} fill={payment.color}>
                      <title>{`${payment.mode}: ₹${moneyFormat.format(payment.amount)}`}</title>
                    </path>
                  ))}
                </svg>
              ) : <span className="helper">No payments in this period.</span>}
            </div>

            {/* Breakdown Rows Matching Screenshot */}
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paymentBreakdown.map(p => (
                <div key={p.mode} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px' }}>
                  <span 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '2px', 
                      background: p.color, 
                      flexShrink: 0 
                    }} 
                  />
                  <span style={{ flex: 1, color: '#4b5563', fontWeight: 500 }}>{p.mode}</span>
                  <span style={{ color: '#89918b', fontSize: '11.5px' }}>{p.percent}%</span>
                  <span style={{ fontWeight: 600, minWidth: '76px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{p.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 5. 8 Operational Metric Boxes (.dash-kpis.small) */}
      <div className="dash-kpis small">
        {/* LOAN PORTFOLIO */}
        <div className="kpi-card small" onClick={() => onNavigate('loans')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Loan Portfolio</span>
            <div className="kpi-ico">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="kpi-value">₹{loanPortfolio.toLocaleString('en-IN')}</div>
            <div className="kpi-sub">{openLoans.length} open loans</div>
          </div>
        </div>

        {/* CUSTOMERS */}
        <div className="kpi-card small" onClick={() => onNavigate('customers')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Customers</span>
            <div className="kpi-ico">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="kpi-value">{customerCount}</div>
            <div className="kpi-sub">Active accounts</div>
          </div>
        </div>

        {/* OPEN GOLD */}
        <div className="kpi-card small" onClick={() => onNavigate('metal-stock')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Open Gold</span>
            <div className="kpi-ico gold">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="kpi-value">{openGoldWeight.toFixed(3)} g</div>
            <div className="kpi-sub">Advance deposits pending</div>
          </div>
        </div>

        {/* OPEN SILVER */}
        <div className="kpi-card small" onClick={() => onNavigate('metal-stock')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Open Silver</span>
            <div className="kpi-ico">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="kpi-value">{openSilverWeight.toFixed(3)} g</div>
            <div className="kpi-sub">Silver deposits pending</div>
          </div>
        </div>

        {/* PENDING DELIVERY */}
        <div className="kpi-card small" onClick={() => onNavigate('orders')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Pending Delivery</span>
            <div className="kpi-ico">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="kpi-value">{pendingDelivery}</div>
            <div className="kpi-sub">Items to be delivered</div>
          </div>
        </div>

        {/* PENDING REPAIRS */}
        <div className="kpi-card small" onClick={() => onNavigate('repairs')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Pending Repairs</span>
            <div className="kpi-ico">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="kpi-value">{pendingRepairs}</div>
            <div className="kpi-sub">In workshop</div>
          </div>
        </div>

        {/* OPEN BOOKINGS */}
        <div className="kpi-card small" onClick={() => onNavigate('metal-booking')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Open Bookings</span>
            <div className="kpi-ico">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="kpi-value">{openBookings}</div>
            <div className="kpi-sub">Advance bookings active</div>
          </div>
        </div>

        {/* INVENTORY ITEMS */}
        <div className="kpi-card small" onClick={() => onNavigate('inventory')} style={{ cursor: 'pointer' }}>
          <div className="kpi-top">
            <span className="kpi-label">Inventory Items</span>
            <div className="kpi-ico">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="kpi-value">{inventoryItemsCount}</div>
            <div className="kpi-sub">0 low stock</div>
          </div>
        </div>
      </div>

      {/* 6. 3 Bottom Cards (.dash-row.even) */}
      <div 
        className="dash-row even"
      >
        {/* Top 10 Customers Panel */}
        <section 
          className="dash-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            border: '1px solid #e5e8e4',
            borderRadius: '14px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="dash-panel-head"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '13px 18px',
              borderBottom: '1px solid #f0f2ef'
            }}
          >
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 650, color: '#202522' }}>
              <User className="w-4 h-4 text-emerald-700" />
              <span>Top 10 Customers</span>
            </h3>
            <span className="helper" style={{ fontSize: '11.5px', color: '#89918b', margin: 0 }}>by purchase</span>
          </div>

          <div className="dash-panel-body" style={{ padding: '14px 18px', flex: 1 }}>
            {topCustomers.map((c, idx) => (
              <div 
                key={c.name}
                className="dash-list-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 0',
                  borderBottom: idx < topCustomers.length - 1 ? '1px solid #f5f6f4' : 'none'
                }}
              >
                <span 
                  className="dash-rank top"
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#f5efe5',
                    color: '#725f3f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {idx + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#202522' }}>
                      {c.name}
                    </span>
                    <span style={{ fontWeight: 600, flexShrink: 0, fontVariantNumeric: 'tabular-nums', color: '#202522' }}>
                      ₹{c.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#89918b', marginTop: '2px' }}>
                    {c.phone} · {c.orders} orders
                  </div>
                  <div 
                    className="dash-bar"
                    style={{
                      height: '4px',
                      borderRadius: '4px',
                      background: '#f7f8f5',
                      marginTop: '6px',
                      overflow: 'hidden'
                    }}
                  >
                    <i 
                      style={{
                        display: 'block',
                        height: '100%',
                        borderRadius: '4px',
                        background: '#237a57',
                        width: `${Math.round((c.total / maxCustomerSpend) * 100)}%`
                      }} 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Orders Panel */}
        <section 
          className="dash-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            border: '1px solid #e5e8e4',
            borderRadius: '14px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="dash-panel-head"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '13px 18px',
              borderBottom: '1px solid #f0f2ef'
            }}
          >
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 650, color: '#202522' }}>
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Recent Orders</span>
            </h3>
          </div>

          <div className="dash-panel-body" style={{ padding: '14px 18px', flex: 1 }}>
            {recentOrders.map((ord, idx) => (
              <div 
                key={ord.id}
                className="dash-list-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 0',
                  borderBottom: idx < recentOrders.length - 1 ? '1px solid #f5f6f4' : 'none'
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mono" style={{ fontWeight: 600, color: '#202522', fontSize: '13px' }}>
                    {ord.invoiceNo || ord.invoiceNumber || '—'}
                  </div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#5f6661', fontSize: '12.5px' }}>
                    {ord.customer?.name || 'Unknown customer'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#89918b', marginTop: '1px' }}>
                    {dateKey(ord.invoiceDate ?? ord.date) ? orderDateLabel.format(new Date(dateKey(ord.invoiceDate ?? ord.date)! + 'T00:00:00Z')) : '—'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#202522' }}>
                    ₹{moneyFormat.format(ord.productTotalValue)}
                  </div>
                  <span 
                    className="badge badge-yellow" 
                    style={{
                      display: 'inline-block',
                      marginTop: '3px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '12px',
                      background: '#fef3c7',
                      color: '#92400e'
                    }}
                  >
                    {ord.status.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Open Loans (0) Panel */}
        <section 
          className="dash-panel"
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            border: '1px solid #e5e8e4',
            borderRadius: '14px',
            overflow: 'hidden'
          }}
        >
          <div 
            className="dash-panel-head"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '13px 18px',
              borderBottom: '1px solid #f0f2ef'
            }}
          >
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 650, color: '#202522' }}>
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <span>Open Loans ({openLoans.length})</span>
            </h3>
          </div>
          <div className="dash-panel-body dash-empty" style={{ padding: '24px 18px', textAlign: 'center', color: '#89918b', fontSize: '13px' }}>
            {openLoans.length === 0 ? <p>No open loans.</p> : openLoans.slice(0, 5).map(loan => (
              <div className="dash-list-row justify-between" key={loan.id}>
                <span>{loan.loanNo}</span>
                <span>₹{moneyFormat.format(loan.principalDue)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      </div>
    </>
  );
};

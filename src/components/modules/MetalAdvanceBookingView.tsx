import React, { useState } from 'react';
import { 
  Plus, Search, Printer, CheckCircle2, AlertCircle, Eye, Tag, X, FileText, ChevronDown 
} from 'lucide-react';
import { MetalBooking, Customer, DailyRates, StoreProfile, PaymentMode, InventoryItem } from '../../types';

interface MetalAdvanceBookingViewProps {
  store: StoreProfile;
  rates: DailyRates;
  customers: Customer[];
  bookings: MetalBooking[];
  onSaveBooking: (booking: MetalBooking) => void;
}

interface BookingItemDetail {
  id: string;
  description: string;
  category: string;
  metal_type: string;
  purity: string;
  weight: string;
  design_note?: string;
  quantity: number;
  rate_per_unit: string; // Rate per 10g
  estimated_amount: string;
  inventory_id?: string;
  _from_stock?: boolean;
}

interface MetalDepositLine {
  id: string;
  metal_type: 'gold' | 'silver';
  deposit_date: string;
  rate_per_10g: string;
  amount: string;
  notes?: string;
}

export const MetalAdvanceBookingView: React.FC<MetalAdvanceBookingViewProps> = ({
  store,
  rates,
  customers,
  bookings: initialBookings,
  onSaveBooking
}) => {
  const [bookingsList, setBookingsList] = useState<MetalBooking[]>(initialBookings);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [activeBookingForSlip, setActiveBookingForSlip] = useState<MetalBooking | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states matching Kreya QS + XS
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[0] || {
    id: 'cust-1',
    code: 'CUST-00118',
    name: 'Sujal Singh',
    mobile: '8977897896',
    address: 'B-42 Alpha 1, Greater Noida, UP',
    state: 'Uttar Pradesh',
    stateCode: '09'
  });
  const [occasion, setOccasion] = useState('');
  const [status, setStatus] = useState<'OPEN' | 'DELIVERED' | 'CANCELLED'>('OPEN');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryDate, setDeliveryDate] = useState('2026-11-28');
  const [notes, setNotes] = useState('');

  // Advance Cash Deposit
  const [advancePaid, setAdvancePaid] = useState('50000');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentRefNo, setPaymentRefNo] = useState('');

  // Rates helper
  const rateToday = (metal: string): string => {
    const m = metal.toLowerCase();
    if (m === 'gold') {
      return String(rates.gold22kPerGram * 10);
    }
    if (m === 'silver') {
      return String(rates.silverPer10g || 980);
    }
    return String(rates.gold22kPerGram * 10);
  };

  // Booking Items list
  const [bookingItems, setBookingItems] = useState<BookingItemDetail[]>([
    {
      id: 'bi-1',
      description: 'Bridal Choker Necklace with floral motifs',
      category: 'Necklace',
      metal_type: 'gold',
      purity: '22K',
      weight: '25.000',
      design_note: 'Kolkata filigree antique polish',
      quantity: 1,
      rate_per_unit: String(rates.gold22kPerGram * 10),
      estimated_amount: String(Math.round(25.000 * rates.gold22kPerGram))
    }
  ]);

  // Metal Deposits lines (Gold / Silver advance with rate fixing and quantity lock)
  const [metalDeposits, setMetalDeposits] = useState<MetalDepositLine[]>([
    {
      id: 'md-1',
      metal_type: 'gold',
      deposit_date: new Date().toISOString().slice(0, 10),
      rate_per_10g: String(rates.gold22kPerGram * 10),
      amount: '50000',
      notes: 'Initial gold advance deposit'
    }
  ]);

  // Calculate items total estimate
  const calcItemEst = (it: BookingItemDetail): number => {
    const r = parseFloat(it.rate_per_unit) || 0;
    const w = parseFloat(it.weight) || 0;
    const q = it.quantity || 1;
    if (r > 0 && w > 0) {
      return (w * r / 10) * q;
    }
    return parseFloat(it.estimated_amount) || 0;
  };

  const totalItemsEstimate = bookingItems.reduce((sum, it) => sum + calcItemEst(it), 0);
  const [totalEstimateOverride, setTotalEstimateOverride] = useState<string>('');

  const effectiveTotalEstimate = totalEstimateOverride.trim() !== ''
    ? (parseFloat(totalEstimateOverride) || 0)
    : totalItemsEstimate;

  // Metal quantity lock formula: (Math.floor(amount / rate_per_10g * 10 * 1000 + 1e-6) / 1000).toFixed(3)
  const calculateLockedGrams = (md: MetalDepositLine): number => {
    const amt = parseFloat(md.amount) || 0;
    const rate10g = parseFloat(md.rate_per_10g) || 0;
    if (amt <= 0 || rate10g <= 0) return 0;
    return Number((Math.floor((amt / rate10g) * 10 * 1000 + 1e-6) / 1000).toFixed(3));
  };

  const totalMetalDepositsCash = metalDeposits.reduce((sum, md) => sum + (parseFloat(md.amount) || 0), 0);
  const totalGoldGramsLocked = metalDeposits
    .filter(md => md.metal_type === 'gold')
    .reduce((sum, md) => sum + calculateLockedGrams(md), 0);
  const totalSilverGramsLocked = metalDeposits
    .filter(md => md.metal_type === 'silver')
    .reduce((sum, md) => sum + calculateLockedGrams(md), 0);

  const effectiveAdvancePaid = parseFloat(advancePaid) || totalMetalDepositsCash || 0;
  const balanceDue = Math.max(0, effectiveTotalEstimate - effectiveAdvancePaid);

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const bookingNo = `BKG-2026-${String(bookingsList.length + 45).padStart(5, '0')}`;
    const newBkg: MetalBooking = {
      id: `bkg-${Date.now()}`,
      bookingNo,
      customer: selectedCustomer,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.mobile || selectedCustomer.phone,
      bookingDate: bookingDate,
      deliveryDueDate: deliveryDate,
      deliveryDate: deliveryDate,
      promisedDeliveryDate: deliveryDate,
      metalType: totalGoldGramsLocked > 0 ? 'GOLD_22K' : 'SILVER',
      lockedRatePerGram: rates.gold22kPerGram,
      bookedRatePerGram: rates.gold22kPerGram,
      totalContractValue: effectiveTotalEstimate,
      advanceCashPaid: paymentMode === 'CASH' ? effectiveAdvancePaid : 0,
      advancePaid: effectiveAdvancePaid,
      advanceAmountPaid: effectiveAdvancePaid,
      balanceAmountDue: balanceDue,
      balanceDue: balanceDue,
      lockedGrams: totalGoldGramsLocked || totalSilverGramsLocked,
      bookedWeightGrams: totalGoldGramsLocked || totalSilverGramsLocked,
      notes: notes ? `${notes} · Locked: ${totalGoldGramsLocked.toFixed(3)}g Gold, ${totalSilverGramsLocked.toFixed(3)}g Silver` : `Locked: ${totalGoldGramsLocked.toFixed(3)}g Gold, ${totalSilverGramsLocked.toFixed(3)}g Silver`,
      paymentMode,
      status: 'OPEN'
    };

    const updated = [newBkg, ...bookingsList];
    setBookingsList(updated);
    onSaveBooking(newBkg);
    setShowNewModal(false);
    setActiveBookingForSlip(newBkg);
    setShowSlipModal(true);
  };

  const handleDeliverBooking = (id: string) => {
    setBookingsList(bookingsList.map(b => 
      b.id === id ? { ...b, status: 'DELIVERED' as const } : b
    ));
  };

  const handleCancelBooking = (id: string) => {
    if (window.confirm('Cancel this forward rate-lock booking? The advance deposit will move to pending refund.')) {
      setBookingsList(bookingsList.map(b => 
        b.id === id ? { ...b, status: 'CANCELLED' as const } : b
      ));
    }
  };

  const filteredBookings = bookingsList.filter(b =>
    !searchQuery ||
    b.bookingNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.customerName && b.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.customer?.name && b.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.customerPhone && b.customerPhone.includes(searchQuery))
  );

  const openBookingsCount = bookingsList.filter(b => b.status === 'OPEN').length;
  const totalLockedGoldMetric = bookingsList
    .filter(b => b.status === 'OPEN' && (b.metalType === 'GOLD_22K' || b.metalType === 'GOLD_24K' || b.metalType === 'GOLD'))
    .reduce((a, b) => a + (b.lockedGrams || b.bookedWeightGrams || 0), 0);
  const totalAdvanceDepositsMetric = bookingsList
    .filter(b => b.status === 'OPEN')
    .reduce((a, b) => a + (b.advanceAmountPaid || b.advanceCashPaid || b.advancePaid || 0), 0);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Metal Advance Booking</h1>
          <p>{bookingsList.length} advance rate-fixed bookings · Forward Rate-Lock & Metal Deposits</p>
        </div>

        <div className="btn-group">
          <button
            type="button"
            onClick={() => {
              setTotalEstimateOverride('');
              setShowNewModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={14} />
            New Booking
          </button>
        </div>
      </div>

      {/* KPI Sum-Grid matching Kreya */}
      <div className="sum-grid" style={{ marginBottom: 16 }}>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)' }}>{openBookingsCount}</div>
          <div className="sum-lbl">Active Rate-Locks</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--gold)' }}>{totalLockedGoldMetric.toFixed(3)} g</div>
          <div className="sum-lbl">Locked Gold Weight</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--success)' }}>₹{totalAdvanceDepositsMetric.toLocaleString('en-IN')}</div>
          <div className="sum-lbl">Total Advance Deposits</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--info)' }}>₹{(rates.gold22kPerGram * 10).toLocaleString('en-IN')}</div>
          <div className="sum-lbl">Today's 22K Benchmark Rate / 10g</div>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
            <Search size={13} style={{ color: 'var(--muted)' }} />
            <input 
              placeholder="Search by Booking No, Customer Name, Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-primary"
            onClick={() => {
              // Trigger search filter
            }}
          >
            <Search size={13} /> Search
          </button>
          {searchQuery && (
            <button 
              type="button" 
              className="btn btn-sm btn-outline"
              onClick={() => setSearchQuery('')}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Booking No</th>
                <th>Booking Date</th>
                <th>Delivery Date</th>
                <th>Customer</th>
                <th>Metal</th>
                <th className="num">Locked Rate</th>
                <th className="num">Locked Wt</th>
                <th className="num">Contract Val</th>
                <th className="num">Advance Paid</th>
                <th className="num">Balance Due</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{b.bookingNo}</td>
                  <td style={{ fontSize: 11 }}>{b.bookingDate}</td>
                  <td style={{ fontSize: 11 }}>{b.deliveryDueDate || b.deliveryDate}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.customer?.name || b.customerName}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{b.customer?.mobile || b.customerPhone}</div>
                  </td>
                  <td>{b.metalType}</td>
                  <td className="num">₹{(b.lockedRatePerGram ? b.lockedRatePerGram * 10 : (rates.gold22kPerGram * 10)).toLocaleString('en-IN')}</td>
                  <td className="num" style={{ fontWeight: 700, color: 'var(--gold)' }}>
                    {(b.lockedGrams || b.bookedWeightGrams || 0).toFixed(3)} g
                  </td>
                  <td className="num">₹{(b.totalContractValue || 0).toLocaleString('en-IN')}</td>
                  <td className="num amt-green">₹{(b.advanceAmountPaid || b.advancePaid || 0).toLocaleString('en-IN')}</td>
                  <td className="num" style={{ fontWeight: 700, color: (b.balanceDue || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    ₹{(b.balanceDue || 0).toLocaleString('en-IN')}
                  </td>
                  <td>
                    <span className={`badge ${
                      b.status === 'DELIVERED' ? 'badge-blue' : (b.status === 'CANCELLED' ? 'badge-red' : 'badge-green')
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        type="button" 
                        className="btn btn-xs btn-outline"
                        title="View Certificate"
                        onClick={() => {
                          setActiveBookingForSlip(b);
                          setShowSlipModal(true);
                        }}
                      >
                        <Eye size={11} /> View
                      </button>
                      {b.status === 'OPEN' && (
                        <>
                          <button 
                            type="button" 
                            className="btn btn-xs btn-primary"
                            onClick={() => handleDeliverBooking(b.id)}
                          >
                            Deliver
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-xs btn-danger"
                            onClick={() => handleCancelBooking(b.id)}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredBookings.length && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: 30, color: 'var(--muted)' }}>
                    No bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW ADVANCE BOOKING MODAL (XS style) */}
      {showNewModal && (
        <div className="overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>New Advance Booking</h3>
              <button 
                type="button" 
                className="btn btn-sm btn-outline"
                onClick={() => setShowNewModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="modal-body" style={{ maxHeight: '82vh', overflowY: 'auto' }}>
              {/* SECTION: CUSTOMER */}
              <div className="section-divider">Customer</div>
              <div className="g2">
                <div className="form-group">
                  <label className="label">Customer *</label>
                  <select 
                    className="input"
                    value={selectedCustomer.id}
                    onChange={(e) => {
                      const c = customers.find(x => x.id === e.target.value);
                      if (c) setSelectedCustomer(c);
                    }}
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.mobile || c.phone} ({c.city || 'Local'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Occasion</label>
                  <input 
                    className="input" 
                    placeholder="Wedding, Akshaya Tritiya, Birthday..."
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                  />
                </div>
              </div>

              <div className="g3">
                <div className="form-group">
                  <label className="label">Booking Date</label>
                  <input 
                    className="input" 
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Delivery Date</label>
                  <input 
                    className="input" 
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Status</label>
                  <select 
                    className="input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="OPEN">Booked (Open)</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* SECTION: BOOKING ITEMS */}
              <div className="section-divider" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Booking Items</span>
                <button 
                  type="button" 
                  className="btn btn-xs btn-outline"
                  onClick={() => setBookingItems([
                    ...bookingItems,
                    {
                      id: `bi-${Date.now()}`,
                      description: '',
                      category: 'Jewellery',
                      metal_type: 'gold',
                      purity: '22K',
                      weight: '',
                      design_note: '',
                      quantity: 1,
                      rate_per_unit: rateToday('gold'),
                      estimated_amount: ''
                    }
                  ])}
                >
                  <Plus size={11} /> Add Item
                </button>
              </div>

              {bookingItems.map((item, idx) => {
                const est = calcItemEst(item);
                return (
                  <div 
                    key={item.id} 
                    style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid var(--border)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }}>
                        Item #{idx + 1}
                      </span>
                      {bookingItems.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-xs btn-danger"
                          onClick={() => setBookingItems(bookingItems.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="g3">
                      <div className="form-group">
                        <label className="label">Description *</label>
                        <input 
                          className="input input-sm" 
                          placeholder="e.g. Gold Necklace Set"
                          value={item.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBookingItems(prev => prev.map((it, i) => i === idx ? { ...it, description: val } : it));
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="label">Metal Type</label>
                        <select 
                          className="input input-sm"
                          value={item.metal_type}
                          onChange={(e) => {
                            const val = e.target.value;
                            const r = rateToday(val);
                            setBookingItems(prev => prev.map((it, i) => i === idx ? { ...it, metal_type: val, rate_per_unit: r } : it));
                          }}
                        >
                          <option value="gold">Gold</option>
                          <option value="silver">Silver</option>
                          <option value="platinum">Platinum</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="label">Purity</label>
                        <select 
                          className="input input-sm"
                          value={item.purity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBookingItems(prev => prev.map((it, i) => i === idx ? { ...it, purity: val } : it));
                          }}
                        >
                          <option value="24K">24K</option>
                          <option value="22K">22K</option>
                          <option value="18K">18K</option>
                          <option value="999">999</option>
                          <option value="925">925</option>
                        </select>
                      </div>
                    </div>

                    <div className="g4" style={{ marginTop: 6 }}>
                      <div className="form-group">
                        <label className="label">Weight (g)</label>
                        <input 
                          className="input input-sm" 
                          type="number"
                          step="0.001"
                          value={item.weight}
                          placeholder="0.000"
                          onChange={(e) => {
                            const val = e.target.value;
                            setBookingItems(prev => prev.map((it, i) => i === idx ? { ...it, weight: val } : it));
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="label">Qty</label>
                        <input 
                          className="input input-sm" 
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setBookingItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: val } : it));
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          Rate / 10g (₹)
                          <button 
                            type="button" 
                            style={{ fontSize: 9, background: 'var(--primary-l)', color: 'var(--primary)', border: 'none', borderRadius: 4, padding: '1px 4px', cursor: 'pointer' }}
                            onClick={() => {
                              const r = rateToday(item.metal_type);
                              setBookingItems(prev => prev.map((it, i) => i === idx ? { ...it, rate_per_unit: r } : it));
                            }}
                          >
                            Today: ₹{rateToday(item.metal_type)}
                          </button>
                        </label>
                        <input 
                          className="input input-sm" 
                          type="number"
                          value={item.rate_per_unit}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBookingItems(prev => prev.map((it, i) => i === idx ? { ...it, rate_per_unit: val } : it));
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="label">Design Note</label>
                        <input 
                          className="input input-sm" 
                          placeholder="Instructions..."
                          value={item.design_note || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBookingItems(prev => prev.map((it, i) => i === idx ? { ...it, design_note: val } : it));
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>
                      Line Total: ₹{Math.round(est).toLocaleString('en-IN')}
                    </div>
                  </div>
                );
              })}

              {/* Estimate Total Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                  Items Total: ₹{Math.round(totalItemsEstimate).toLocaleString('en-IN')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label className="label" style={{ margin: 0 }}>Total Estimate (₹):</label>
                  <input 
                    className="input input-sm" 
                    type="number"
                    style={{ width: 140 }}
                    placeholder={String(Math.round(totalItemsEstimate))}
                    value={totalEstimateOverride}
                    onChange={(e) => setTotalEstimateOverride(e.target.value)}
                  />
                  {totalEstimateOverride && (
                    <button 
                      type="button" 
                      className="btn btn-xs btn-outline"
                      onClick={() => setTotalEstimateOverride('')}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* SECTION: METAL DEPOSITS (RATE FIXING & METAL QUANTITY LOCK) */}
              <div className="section-divider" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span>Metal Deposits (Rate Fixing & Metal Quantity Lock)</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6 }}>
                    Lock gold/silver weight at today's rate
                  </span>
                </div>
                <button 
                  type="button" 
                  className="btn btn-xs btn-gold"
                  onClick={() => setMetalDeposits([
                    ...metalDeposits,
                    {
                      id: `md-${Date.now()}`,
                      metal_type: 'gold',
                      deposit_date: new Date().toISOString().slice(0, 10),
                      rate_per_10g: rateToday('gold'),
                      amount: '25000',
                      notes: ''
                    }
                  ])}
                >
                  <Plus size={11} /> Add Deposit
                </button>
              </div>

              {metalDeposits.map((md, idx) => {
                const lockedGrams = calculateLockedGrams(md);
                const amt = parseFloat(md.amount) || 0;
                const gst3Pct = Math.round(amt * 0.03);
                return (
                  <div 
                    key={md.id} 
                    style={{ 
                      background: md.metal_type === 'gold' ? '#fefbf0' : '#f0f9ff', 
                      border: `1px solid ${md.metal_type === 'gold' ? 'var(--gold)' : '#7dd3fc'}`, 
                      borderRadius: 8, 
                      padding: 12, 
                      marginBottom: 8 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: md.metal_type === 'gold' ? 'var(--gold)' : 'var(--info)' }}>
                        {md.metal_type.toUpperCase()} DEPOSIT #{idx + 1}
                      </span>
                      {metalDeposits.length > 1 && (
                        <button 
                          type="button" 
                          className="btn btn-xs btn-danger"
                          onClick={() => setMetalDeposits(metalDeposits.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="g4">
                      <div className="form-group">
                        <label className="label">Metal Type</label>
                        <select 
                          className="input input-sm"
                          value={md.metal_type}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            const r = rateToday(val);
                            setMetalDeposits(prev => prev.map((d, i) => i === idx ? { ...d, metal_type: val, rate_per_10g: r } : d));
                          }}
                        >
                          <option value="gold">Gold</option>
                          <option value="silver">Silver</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="label">Deposit Date</label>
                        <input 
                          className="input input-sm" 
                          type="date"
                          value={md.deposit_date}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMetalDeposits(prev => prev.map((d, i) => i === idx ? { ...d, deposit_date: val } : d));
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          Rate / 10g (₹)
                          <button 
                            type="button" 
                            style={{ fontSize: 9, background: 'var(--primary-l)', color: 'var(--primary)', border: 'none', borderRadius: 4, padding: '1px 4px', cursor: 'pointer' }}
                            onClick={() => {
                              const r = rateToday(md.metal_type);
                              setMetalDeposits(prev => prev.map((d, i) => i === idx ? { ...d, rate_per_10g: r } : d));
                            }}
                          >
                            Today: ₹{rateToday(md.metal_type)}
                          </button>
                        </label>
                        <input 
                          className="input input-sm" 
                          type="number"
                          value={md.rate_per_10g}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMetalDeposits(prev => prev.map((d, i) => i === idx ? { ...d, rate_per_10g: val } : d));
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="label">Amount Deposited (₹)</label>
                        <input 
                          className="input input-sm" 
                          type="number"
                          value={md.amount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMetalDeposits(prev => prev.map((d, i) => i === idx ? { ...d, amount: val } : d));
                          }}
                        />
                      </div>
                    </div>

                    {/* Quantity lock notification pill */}
                    {lockedGrams > 0 && (
                      <div style={{ marginTop: 6, padding: '6px 10px', background: '#fff', borderRadius: 6, fontSize: 12, fontWeight: 700, color: md.metal_type === 'gold' ? 'var(--gold)' : 'var(--info)' }}>
                        = {lockedGrams.toFixed(3)} grams of {md.metal_type} locked in at this rate
                        <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: 8 }}>
                          (+ GST 3% ₹{gst3Pct.toLocaleString('en-IN')} · to collect ₹{(amt + gst3Pct).toLocaleString('en-IN')})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                Total Deposits: <strong>₹{totalMetalDepositsCash.toLocaleString('en-IN')}</strong> · Locked: <strong>{totalGoldGramsLocked.toFixed(3)}g Gold</strong>, <strong>{totalSilverGramsLocked.toFixed(3)}g Silver</strong>
              </div>

              {/* SECTION: ADVANCE PAYMENT CASH & MODE */}
              <div className="section-divider">
                Advance Payment Collection
              </div>
              <div className="g3">
                <div className="form-group">
                  <label className="label">Advance Cash / Digital Paid (₹) *</label>
                  <input 
                    className="input" 
                    type="number"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(e.target.value)}
                    style={{ fontWeight: 700 }}
                  />
                </div>
                <div className="form-group">
                  <label className="label">Payment Mode</label>
                  <select 
                    className="input"
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">UTR / Cheque Ref No</label>
                  <input 
                    className="input" 
                    placeholder="Optional reference"
                    value={paymentRefNo}
                    onChange={(e) => setPaymentRefNo(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Booking Notes & Instructions</label>
                <textarea 
                  className="input" 
                  rows={2} 
                  placeholder="Notes for order fulfillment / karigar..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* Summary Card */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>Total Estimate:</span>
                  <strong>₹{Math.round(effectiveTotalEstimate).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)', marginBottom: 4 }}>
                  <span>Advance Received:</span>
                  <strong>₹{effectiveAdvancePaid.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4, color: balanceDue > 0 ? 'var(--danger)' : 'var(--success)' }}>
                  <span>Balance Due on Delivery:</span>
                  <span>₹{Math.round(balanceDue).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Booking & Issue Rate-Lock Certificate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Rate-Lock Certificate Slip Modal */}
      {showSlipModal && activeBookingForSlip && (
        <div className="overlay" onClick={() => setShowSlipModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Forward Metal Booking Certificate</h3>
              <button 
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="btn btn-sm btn-outline"
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ fontFamily: 'monospace', fontSize: 12, background: 'var(--bg)', borderRadius: 8, padding: 16 }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border)', paddingBottom: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>
                  {store.tradeName || store.legalName || 'KREYA JEWELLERS'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>{store.address}, {store.city}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>GSTIN: {store.gstin}</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: 'var(--gold)' }}>
                  FORWARD METAL RATE-LOCK ADVICE
                </div>
              </div>

              <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: 8, marginBottom: 8, lineHeight: 1.6 }}>
                <div>Booking No: <strong>{activeBookingForSlip.bookingNo}</strong></div>
                <div>Customer: <strong>{activeBookingForSlip.customer?.name || activeBookingForSlip.customerName}</strong></div>
                <div>Phone: <strong>{activeBookingForSlip.customer?.mobile || activeBookingForSlip.customerPhone}</strong></div>
                <div>Booking Date: <strong>{activeBookingForSlip.bookingDate}</strong></div>
                <div>Promised Delivery: <strong>{activeBookingForSlip.deliveryDueDate || activeBookingForSlip.deliveryDate}</strong></div>
              </div>

              <div style={{ borderBottom: '1px dashed var(--border)', paddingBottom: 8, marginBottom: 8, lineHeight: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Metal & Purity:</span>
                  <strong>{activeBookingForSlip.metalType}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Locked Benchmark Rate:</span>
                  <span>₹{(activeBookingForSlip.lockedRatePerGram ? activeBookingForSlip.lockedRatePerGram * 10 : (rates.gold22kPerGram * 10)).toLocaleString('en-IN')}/10g</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontWeight: 800, fontSize: 13, borderTop: '1px solid var(--border)', paddingTop: 4, marginTop: 4 }}>
                  <span>Locked Pure Metal:</span>
                  <span>{(activeBookingForSlip.lockedGrams || activeBookingForSlip.bookedWeightGrams || 0).toFixed(3)} g</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span>Advance Paid Received:</span>
                  <strong>₹{(activeBookingForSlip.advanceAmountPaid || activeBookingForSlip.advanceCashPaid || activeBookingForSlip.advancePaid || 0).toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Payment Mode:</span>
                  <span style={{ textTransform: 'uppercase' }}>{activeBookingForSlip.paymentMode || 'UPI'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Balance Due:</span>
                  <strong>₹{(activeBookingForSlip.balanceDue || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.4 }}>
                * Guarantee: The locked metal grams are immune to future market price escalations up to the promised delivery date. Final billing will adjust making charges, wastage, and statutory 3% GST on delivery.
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                onClick={() => setShowSlipModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-primary"
              >
                <Printer size={13} /> Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

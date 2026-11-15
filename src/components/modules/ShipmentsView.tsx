import React, { useState } from 'react';
import { StoreProfile, ShipmentRecord, SalesInvoice } from '../../types';

export interface ShipmentsViewProps {
  store?: StoreProfile;
  shipments?: ShipmentRecord[];
  invoices?: SalesInvoice[];
}

export type ShipmentStatusType =
  | 'created'
  | 'booked'
  | 'pickup_scheduled'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export interface TrackingEvent {
  status: ShipmentStatusType;
  location?: string;
  note?: string;
  at: string;
}

export interface DetailedShipment extends ShipmentRecord {
  weightG?: number;
  dims?: { l: number; b: number; h: number };
  insured?: boolean;
  courier: string;
  awb_no?: string;
  order_no: string;
  customer_name: string;
  customer_phone?: string;
  shipping_address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  declared_value: number;
  status: ShipmentStatusType;
  created_at: string;
  delivered_at?: string;
  tracking: TrackingEvent[];
}

const STATUS_LABELS: Record<ShipmentStatusType, string> = {
  created: 'Created',
  booked: 'Booked',
  pickup_scheduled: 'Pickup Scheduled',
  in_transit: 'In Transit',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  returned: 'Returned',
  cancelled: 'Cancelled'
};

const STATUS_BADGE_CLASSES: Record<ShipmentStatusType, string> = {
  created: 'badge-blue',
  booked: 'badge-blue',
  pickup_scheduled: 'badge-yellow',
  in_transit: 'badge-yellow',
  out_for_delivery: 'badge-purple',
  delivered: 'badge-green',
  returned: 'badge-red',
  cancelled: 'badge-red'
};

const formatCurrency = (val: number | string | undefined): string => {
  const num = typeof val === 'string' ? parseFloat(val) : (val ?? 0);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const ShipmentsView: React.FC<ShipmentsViewProps> = ({
  store,
  shipments: initialShipments = [],
  invoices = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<DetailedShipment | null>(null);
  const [printReceiptShipment, setPrintReceiptShipment] = useState<DetailedShipment | null>(null);

  // Status update in detail modal
  const [updateStatusVal, setUpdateStatusVal] = useState<ShipmentStatusType>('in_transit');
  const [updateNoteVal, setUpdateNoteVal] = useState('');

  // Sample shipments with full tracking history
  const [shipmentsList, setShipmentsList] = useState<DetailedShipment[]>(() => {
    const defaultList: DetailedShipment[] = [
      {
        id: 'shp-vikram-02',
        shipmentNo: 'SHP-2026-00001',
        invoiceNo: 'INV-2026-00002',
        order_no: 'INV-2026-00002',
        customerName: 'Vikram Rathore',
        customer_name: 'Vikram Rathore',
        customerMobile: '9820112233',
        customer_phone: '9820112233',
        shippingAddress: 'Shop 12, Opera House, Mumbai, Maharashtra - 400004',
        shipping_address: 'Shop 12, Opera House, Mumbai, Maharashtra - 400004',
        deliveryAddress: 'Shop 12, Opera House, Mumbai, Maharashtra - 400004',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400004',
        courierPartner: 'Sequel Secure',
        courier: 'Sequel Secure',
        trackingNumber: 'SEQL-MUM-2026-98124',
        trackingAirwayBill: 'SEQL-MUM-2026-98124',
        awb_no: 'SEQL-MUM-2026-98124',
        dispatchDate: '2026-11-15',
        created_at: '2026-11-15 11:30',
        declared_value: 367968,
        insuredValue: 367968,
        insuranceDeclaredValue: 367968,
        insured: true,
        weightG: 350,
        dims: { l: 15, b: 12, h: 8 },
        status: 'in_transit',
        tracking: [
          { status: 'created', note: 'Armoured manifest generated for Gold Kada 22K (INV-2026-00002)', at: '2026-11-15 11:30', location: 'Opera House Vault' },
          { status: 'booked', note: 'Consignment booked & sealed in Armoured Pouch #SEQL-9921', at: '2026-11-15 14:00', location: 'Sequel Hub, BKC Mumbai' },
          { status: 'pickup_scheduled', note: 'Secure pickup custody scan completed by Armed Courier Unit', at: '2026-11-15 16:30', location: 'Sequel Hub, BKC Mumbai' },
          { status: 'in_transit', note: 'In transit via Armoured Dedicated Transit Van to destination', at: '2026-11-15 19:15', location: 'Mumbai South Vault' }
        ]
      },
      {
        id: 'shp-1',
        shipmentNo: 'SHP-2026-00018',
        invoiceNo: 'INV-2026-00276',
        order_no: 'INV-2026-00276',
        customerName: 'Sujal Singh',
        customer_name: 'Sujal Singh',
        customerMobile: '8977897896',
        customer_phone: '8977897896',
        shippingAddress: 'Sector 4, Greater Noida',
        shipping_address: 'Sector 4, Greater Noida',
        city: 'Greater Noida',
        state: 'Uttar Pradesh',
        pincode: '201310',
        courierPartner: 'Sequel Secure',
        courier: 'Sequel Secure',
        trackingNumber: 'SEQL9823419082',
        awb_no: 'SEQL9823419082',
        dispatchDate: '2026-11-12',
        created_at: '2026-11-12 10:30',
        declared_value: 245000,
        insuredValue: 245000,
        insuranceDeclaredValue: 245000,
        insured: true,
        weightG: 350,
        dims: { l: 15, b: 12, h: 8 },
        status: 'in_transit',
        tracking: [
          { status: 'created', note: 'Consignment manifest generated', at: '2026-11-12 10:30' },
          { status: 'booked', note: 'Booked with Sequel Logistics Hub', at: '2026-11-12 14:15' },
          { status: 'pickup_scheduled', note: 'Pickup completed by secure courier agent', at: '2026-11-13 11:00' },
          { status: 'in_transit', note: 'Arrived at New Delhi Airport Secure Vault', at: '2026-11-14 08:45' }
        ]
      },
      {
        id: 'shp-2',
        shipmentNo: 'SHP-2026-00017',
        invoiceNo: 'INV-2026-00269',
        order_no: 'INV-2026-00269',
        customerName: 'Priya Sharma',
        customer_name: 'Priya Sharma',
        customerMobile: '9811234567',
        customer_phone: '9811234567',
        shippingAddress: 'Connaught Place, Central Delhi',
        shipping_address: 'Connaught Place, Central Delhi',
        city: 'New Delhi',
        state: 'Delhi',
        pincode: '110001',
        courierPartner: 'BVC Logistics',
        courier: 'BVC Logistics',
        trackingNumber: 'BVC7821940129',
        awb_no: 'BVC7821940129',
        dispatchDate: '2026-11-10',
        created_at: '2026-11-10 11:20',
        declared_value: 185000,
        insuredValue: 185000,
        insuranceDeclaredValue: 185000,
        insured: true,
        weightG: 220,
        dims: { l: 12, b: 10, h: 6 },
        status: 'delivered',
        delivered_at: '2026-11-11 16:40',
        tracking: [
          { status: 'created', note: 'Parcel manifest created', at: '2026-11-10 11:20' },
          { status: 'booked', note: 'Booked with BVC Secure Logistics', at: '2026-11-10 13:00' },
          { status: 'in_transit', note: 'Dispatched via Armoured Transit', at: '2026-11-10 18:30' },
          { status: 'out_for_delivery', note: 'Out with delivery executive', at: '2026-11-11 10:15' },
          { status: 'delivered', note: 'Delivered and signed by Priya Sharma', at: '2026-11-11 16:40' }
        ]
      },
      {
        id: 'shp-3',
        shipmentNo: 'SHP-2026-00016',
        invoiceNo: 'INV-2026-00265',
        order_no: 'INV-2026-00265',
        customerName: 'Rahul Verma',
        customer_name: 'Rahul Verma',
        customerMobile: '9876543210',
        customer_phone: '9876543210',
        shippingAddress: 'Sector 62, Noida',
        shipping_address: 'Sector 62, Noida',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201309',
        courierPartner: 'Speed Post',
        courier: 'Speed Post',
        trackingNumber: 'SP847192019IN',
        awb_no: 'SP847192019IN',
        dispatchDate: '2026-11-08',
        created_at: '2026-11-08 09:15',
        declared_value: 95000,
        insuredValue: 95000,
        insuranceDeclaredValue: 95000,
        insured: true,
        weightG: 180,
        dims: { l: 10, b: 8, h: 5 },
        status: 'delivered',
        delivered_at: '2026-11-09 14:10',
        tracking: [
          { status: 'created', note: 'Consignment packaged', at: '2026-11-08 09:15' },
          { status: 'booked', note: 'Booked at Head Post Office', at: '2026-11-08 12:00' },
          { status: 'in_transit', note: 'In transit to destination NSH', at: '2026-11-08 20:00' },
          { status: 'out_for_delivery', note: 'Out for delivery', at: '2026-11-09 09:30' },
          { status: 'delivered', note: 'Delivered at addressee desk', at: '2026-11-09 14:10' }
        ]
      }
    ];

    if (initialShipments && initialShipments.length > 0) {
      // Map initialShipments and ensure Vikram Rathore's shipment is included
      const mapped = initialShipments.map(s => {
        const d: DetailedShipment = {
          ...s,
          order_no: s.invoiceNo,
          customer_name: s.customerName,
          customer_phone: s.customerMobile,
          shipping_address: s.shippingAddress || s.deliveryAddress,
          courier: s.courierPartner,
          awb_no: s.trackingNumber || s.trackingAirwayBill,
          declared_value: s.insuredValue || s.insuranceDeclaredValue || 50000,
          insured: true,
          created_at: `${s.dispatchDate} 10:00`,
          status: (String(s.status || s.deliveryStatus || 'in_transit').toLowerCase() as ShipmentStatusType),
          tracking: [
            { status: 'created', note: `Manifest generated (${s.courierPartner})`, at: `${s.dispatchDate} 10:00` },
            { status: 'in_transit', note: `In transit with ${s.courierPartner}`, at: `${s.dispatchDate} 14:00` }
          ]
        };
        return d;
      });
      // Prepend Vikram Rathore shipment if not present in initialShipments
      if (!mapped.some(m => m.invoiceNo === 'INV-2026-00002')) {
        return [defaultList[0], ...mapped];
      }
      return mapped;
    }

    return defaultList;
  });

  // New Shipment Form State
  const [selectedOrder, setSelectedOrder] = useState<SalesInvoice | null>(null);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [formCourier, setFormCourier] = useState('BVC Logistics');
  const [formAwbNo, setFormAwbNo] = useState('');
  const [formDeclaredVal, setFormDeclaredVal] = useState('');
  const [formWeightG, setFormWeightG] = useState('200');
  const [formDims, setFormDims] = useState({ l: '10', b: '10', h: '5' });
  const [formInsured, setFormInsured] = useState(true);

  // Search filtered invoices for shipment creation
  const filteredInvoicesForShipment = invoices.filter(inv => {
    if (!orderSearchQuery) return true;
    const q = orderSearchQuery.toLowerCase();
    const invNo = (inv.invoiceNumber || inv.invoiceNo || '').toLowerCase();
    const cust = (inv.customer?.fullName || inv.customer?.name || '').toLowerCase();
    return invNo.includes(q) || cust.includes(q);
  });

  // Create new shipment handler
  const handleCreateShipment = () => {
    if (!selectedOrder) {
      alert('Please select an invoice / order.');
      return;
    }

    const newShipmentNo = `SHP-2026-${String(shipmentsList.length + 19).padStart(5, '0')}`;
    const invNo = selectedOrder.invoiceNumber || selectedOrder.invoiceNo || 'INV-001';
    const custName = selectedOrder.customer?.fullName || selectedOrder.customer?.name || 'Customer';
    const custPhone = selectedOrder.customer?.mobile || selectedOrder.customer?.phone || '';
    const custAddr = selectedOrder.customer?.address || (selectedOrder as any).deliveryAddress || 'Showroom Counter';
    const declaredValNum = formDeclaredVal
      ? parseFloat(formDeclaredVal)
      : (selectedOrder.totalAmount || selectedOrder.productTotalValue || 50000);

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newShipment: DetailedShipment = {
      id: `shp-${Date.now()}`,
      shipmentNo: newShipmentNo,
      invoiceNo: invNo,
      order_no: invNo,
      customerName: custName,
      customer_name: custName,
      customerMobile: custPhone,
      customer_phone: custPhone,
      shippingAddress: custAddr,
      shipping_address: custAddr,
      city: selectedOrder.customer?.city || 'Delhi',
      state: selectedOrder.customer?.state || 'Delhi',
      pincode: selectedOrder.customer?.pincode || '110001',
      courierPartner: formCourier,
      courier: formCourier,
      trackingNumber: formAwbNo || `AWB-${Date.now().toString().slice(-8)}`,
      awb_no: formAwbNo || `AWB-${Date.now().toString().slice(-8)}`,
      dispatchDate: new Date().toISOString().split('T')[0],
      created_at: nowStr,
      declared_value: declaredValNum,
      insuredValue: declaredValNum,
      insuranceDeclaredValue: declaredValNum,
      insured: formInsured,
      weightG: Number(formWeightG) || 200,
      dims: {
        l: Number(formDims.l) || 10,
        b: Number(formDims.b) || 10,
        h: Number(formDims.h) || 5
      },
      status: 'booked',
      tracking: [
        { status: 'created', note: 'Shipment created in system', at: nowStr },
        { status: 'booked', note: `Booked with ${formCourier}`, at: nowStr }
      ]
    };

    setShipmentsList(prev => [newShipment, ...prev]);
    setShowNewModal(false);
    setSelectedShipment(newShipment);
  };

  // Update Status handler
  const handleUpdateStatus = () => {
    if (!selectedShipment) return;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newEvent: TrackingEvent = {
      status: updateStatusVal,
      note: updateNoteVal || `Status updated to ${STATUS_LABELS[updateStatusVal]}`,
      at: nowStr
    };

    const updated: DetailedShipment = {
      ...selectedShipment,
      status: updateStatusVal,
      delivered_at: updateStatusVal === 'delivered' ? nowStr : selectedShipment.delivered_at,
      tracking: [...selectedShipment.tracking, newEvent]
    };

    setShipmentsList(prev => prev.map(s => (s.id === selectedShipment.id ? updated : s)));
    setSelectedShipment(updated);
    setUpdateNoteVal('');
  };

  // Filtered shipments
  const filteredShipments = shipmentsList.filter(s => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        s.shipmentNo.toLowerCase().includes(q) ||
        s.order_no.toLowerCase().includes(q) ||
        s.customer_name.toLowerCase().includes(q) ||
        s.courier.toLowerCase().includes(q) ||
        (s.awb_no && s.awb_no.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const totalInsuredSum = shipmentsList.reduce((sum, s) => sum + (s.declared_value || 0), 0);
  const inTransitCount = shipmentsList.filter(s => ['in_transit', 'pickup_scheduled', 'out_for_delivery'].includes(s.status)).length;
  const deliveredCount = shipmentsList.filter(s => s.status === 'delivered').length;

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Shipments</h1>
          <p>Parcels sent to customers — booked with the courier or delivered by hand.</p>
        </div>
        <div className="btn-group">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setShowNewModal(true);
              setSelectedOrder(null);
              setOrderSearchQuery('');
              setFormCourier('BVC Logistics');
              setFormAwbNo('');
              setFormDeclaredVal('');
              setFormWeightG('200');
              setFormInsured(true);
            }}
          >
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New shipment
          </button>
        </div>
      </div>

      {/* Sum Grid */}
      <div className="sum-grid" style={{ marginBottom: 16 }}>
        <div className="sum-box">
          <div className="sum-val">{shipmentsList.length}</div>
          <div className="sum-lbl">Total Shipments</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--info-m)' }}>{inTransitCount}</div>
          <div className="sum-lbl">In Transit</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--success)' }}>{deliveredCount}</div>
          <div className="sum-lbl">Delivered</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)' }}>
            {formatCurrency(totalInsuredSum)}
          </div>
          <div className="sum-lbl">Declared Insured Value</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-body" style={{ padding: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-box" style={{ flex: 1, minWidth: 240 }}>
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                aria-label="Search shipments"
                placeholder="Search…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="input input-sm"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="created">Created</option>
              <option value="booked">Booked</option>
              <option value="pickup_scheduled">Pickup Scheduled</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="returned">Returned</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="tbl-wrap tbl-desktop-only">
          <table>
            <thead>
              <tr>
                <th>Created</th>
                <th>Shipment</th>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Courier</th>
                <th>AWB</th>
                <th className="num">Declared</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                    No shipments found.
                  </td>
                </tr>
              ) : (
                filteredShipments.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => {
                      setSelectedShipment(s);
                      setUpdateStatusVal(s.status);
                      setUpdateNoteVal('');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontSize: 12 }}>{s.created_at}</td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                        {s.shipmentNo}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.order_no}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.customer_name}</div>
                      {s.customer_phone && (
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.customer_phone}</div>
                      )}
                    </td>
                    <td>{s.courier}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.awb_no || '—'}</td>
                    <td className="num" style={{ fontWeight: 700 }}>
                      {formatCurrency(s.declared_value)}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE_CLASSES[s.status] || 'badge-blue'}`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => {
                          setSelectedShipment(s);
                          setUpdateStatusVal(s.status);
                          setUpdateNoteVal('');
                        }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dt-pager" style={{ padding: '10px 14px' }}>
          <span className="helper">{filteredShipments.length} shipments</span>
        </div>
      </div>

      {/* SHIPMENT DETAIL & TRACKING MODAL */}
      {selectedShipment && (
        <div className="overlay" onClick={() => setSelectedShipment(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{selectedShipment.shipmentNo} &bull; {selectedShipment.order_no}</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setSelectedShipment(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <dl className="kv">
                <dt>Status</dt>
                <dd>
                  <span className={`badge ${STATUS_BADGE_CLASSES[selectedShipment.status] || 'badge-blue'}`}>
                    {STATUS_LABELS[selectedShipment.status] || selectedShipment.status}
                  </span>
                </dd>

                <dt>Courier / AWB</dt>
                <dd>
                  <strong>{selectedShipment.courier}</strong> {selectedShipment.awb_no}
                </dd>

                <dt>Declared</dt>
                <dd>
                  {formatCurrency(selectedShipment.declared_value)}
                  {selectedShipment.insured ? ' (insured)' : ''}
                </dd>

                <dt>Ship to</dt>
                <dd>
                  {[
                    selectedShipment.customer_name,
                    selectedShipment.shipping_address,
                    selectedShipment.city,
                    selectedShipment.state,
                    selectedShipment.pincode,
                    selectedShipment.customer_phone
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </dd>

                {selectedShipment.delivered_at && (
                  <>
                    <dt>Delivered</dt>
                    <dd>{selectedShipment.delivered_at}</dd>
                  </>
                )}
              </dl>

              {/* Transit Stepper Progression */}
              <div style={{ margin: '18px 0 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                  {(['created', 'booked', 'in_transit', 'out_for_delivery', 'delivered'] as ShipmentStatusType[]).map((step, idx) => {
                    const stepOrder: ShipmentStatusType[] = ['created', 'booked', 'pickup_scheduled', 'in_transit', 'out_for_delivery', 'delivered'];
                    const currentIdx = stepOrder.indexOf(selectedShipment.status);
                    const thisIdx = stepOrder.indexOf(step);
                    const isPassed = currentIdx >= thisIdx;
                    return (
                      <div key={step} style={{ textAlign: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            margin: '0 auto 6px',
                            background: isPassed ? 'var(--primary)' : 'var(--border)',
                            color: isPassed ? '#fff' : 'var(--muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          {isPassed ? '✓' : idx + 1}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: isPassed ? 700 : 500, color: isPassed ? 'var(--text)' : 'var(--muted)' }}>
                          {STATUS_LABELS[step]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking History */}
              <h4 style={{ margin: '14px 0 8px', fontSize: 14, fontWeight: 700 }}>Tracking History</h4>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8, background: 'var(--surface2)' }}>
                {selectedShipment.tracking.slice().reverse().map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      borderBottom: i < selectedShipment.tracking.length - 1 ? '1px solid var(--border)' : 'none'
                    }}
                  >
                    <div>
                      <b>{STATUS_LABELS[ev.status] || ev.status}</b>{' '}
                      <span className="helper" style={{ margin: 0 }}>{ev.note || ev.location || ''}</span>
                    </div>
                    <span className="helper" style={{ fontSize: 11 }}>{ev.at}</span>
                  </div>
                ))}
              </div>

              {/* Transit Status Updater */}
              <div style={{ marginTop: 14, padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Update Transit Status</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <select
                    className="input"
                    value={updateStatusVal}
                    onChange={e => setUpdateStatusVal(e.target.value as ShipmentStatusType)}
                    style={{ maxWidth: 180 }}
                  >
                    <option value="created">Created</option>
                    <option value="booked">Booked</option>
                    <option value="pickup_scheduled">Pickup Scheduled</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="returned">Returned</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <input
                    type="text"
                    className="input"
                    placeholder="Transit checkpoint or delivery note..."
                    value={updateNoteVal}
                    onChange={e => setUpdateNoteVal(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleUpdateStatus}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPrintReceiptShipment(selectedShipment)}
              >
                📄 Dispatch Receipt
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedShipment(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SHIPMENT MODAL */}
      {showNewModal && (
        <div className="overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>New shipment</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowNewModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Invoice Selection */}
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="label">Invoice / Order *</label>
                {selectedOrder ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface2)', padding: '10px 14px', borderRadius: 8 }}>
                    <div>
                      <b>{selectedOrder.invoiceNumber || selectedOrder.invoiceNo}</b> &bull; {selectedOrder.customer?.fullName || selectedOrder.customer?.name}
                      <div className="helper" style={{ margin: 0 }}>
                        {formatCurrency(selectedOrder.totalAmount || selectedOrder.productTotalValue)} &bull; {(selectedOrder as any).deliveryAddress || selectedOrder.customer?.address || 'Showroom Address'}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelectedOrder(null)}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      className="input"
                      placeholder="Search invoice no. or customer..."
                      value={orderSearchQuery}
                      onChange={e => setOrderSearchQuery(e.target.value)}
                      style={{ marginBottom: 6 }}
                    />
                    <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6 }}>
                      {filteredInvoicesForShipment.length === 0 ? (
                        <div style={{ padding: 12, color: 'var(--muted)', textAlign: 'center', fontSize: 12 }}>
                          No matching invoices found.
                        </div>
                      ) : (
                        filteredInvoicesForShipment.map(inv => (
                          <div
                            key={inv.id}
                            onClick={() => {
                              setSelectedOrder(inv);
                              setFormDeclaredVal(String(inv.totalAmount || inv.productTotalValue || ''));
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <b>{inv.invoiceNumber || inv.invoiceNo}</b> &bull; {inv.customer?.fullName || inv.customer?.name}
                            </div>
                            <span style={{ fontWeight: 600 }}>{formatCurrency(inv.totalAmount || inv.productTotalValue)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Courier Selection & Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
                <div>
                  <label className="label">Courier Partner</label>
                  <select
                    className="input"
                    value={formCourier}
                    onChange={e => setFormCourier(e.target.value)}
                  >
                    <option value="BVC Logistics">BVC Logistics (Secure)</option>
                    <option value="Sequel Secure">Sequel Secure (Armoured)</option>
                    <option value="Speed Post">Speed Post (India Post Insured)</option>
                    <option value="BlueDart Apex">BlueDart Apex Secure</option>
                    <option value="Shiprocket">Shiprocket (Multi-carrier)</option>
                    <option value="manual">Hand delivery / Local courier</option>
                  </select>
                </div>

                <div>
                  <label className="label">AWB / Docket No.</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. BVC981729012"
                    value={formAwbNo}
                    onChange={e => setFormAwbNo(e.target.value)}
                  />
                </div>

                <div>
                  <label className="label">Declared value (₹)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Blank = invoice total"
                    value={formDeclaredVal}
                    onChange={e => setFormDeclaredVal(e.target.value)}
                  />
                  <div className="helper" style={{ fontSize: 10 }}>Blank = invoice total value</div>
                </div>

                <div>
                  <label className="label">Parcel weight (g)</label>
                  <input
                    type="number"
                    step="1"
                    className="input"
                    value={formWeightG}
                    onChange={e => setFormWeightG(e.target.value)}
                  />
                </div>
              </div>

              {/* Dimensions L x B x H */}
              <div style={{ marginBottom: 12 }}>
                <label className="label">L &times; B &times; H (cm)</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="number"
                    className="input"
                    placeholder="Length"
                    value={formDims.l}
                    onChange={e => setFormDims({ ...formDims, l: e.target.value })}
                  />
                  <input
                    type="number"
                    className="input"
                    placeholder="Breadth"
                    value={formDims.b}
                    onChange={e => setFormDims({ ...formDims, b: e.target.value })}
                  />
                  <input
                    type="number"
                    className="input"
                    placeholder="Height"
                    value={formDims.h}
                    onChange={e => setFormDims({ ...formDims, h: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label className="check" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formInsured}
                    onChange={e => setFormInsured(e.target.checked)}
                  />
                  <strong>Transit Valuables Insurance Declaration</strong> (Full value protection)
                </label>
              </div>
            </div>

            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setShowNewModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!selectedOrder}
                onClick={handleCreateShipment}
              >
                Save &amp; Generate AWB
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH NOTE / RECEIPT PRINT MODAL */}
      {printReceiptShipment && (
        <div className="overlay" onClick={() => setPrintReceiptShipment(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Valuables Cargo Dispatch Receipt</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setPrintReceiptShipment(null)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div style={{ border: '1px solid var(--border)', padding: 18, borderRadius: 8, background: '#fff' }}>
                <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border2)', paddingBottom: 10 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{store?.legalName || 'KREYA JEWELLERS 360'}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{store?.address || 'Showroom Address'}</div>
                  <div style={{ marginTop: 6, display: 'inline-block', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 12 }}>
                    INSURED VALUABLES DISPATCH CONSIGNMENT NOTE
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, margin: '14px 0 6px' }}>
                  <span>Shipment: <b>{printReceiptShipment.shipmentNo}</b></span>
                  <span>Date: <b>{printReceiptShipment.created_at}</b></span>
                </div>
                <div style={{ fontSize: 12, marginBottom: 8 }}>
                  Invoice Ref: <b>{printReceiptShipment.order_no}</b>
                </div>
                <div style={{ fontSize: 12, marginBottom: 12 }}>
                  Customer: <b>{printReceiptShipment.customer_name}</b> ({printReceiptShipment.customer_phone || '—'})
                </div>

                <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 6, fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Courier Partner:</span>
                    <b>{printReceiptShipment.courier}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>AWB / Tracking No:</span>
                    <strong style={{ color: 'var(--primary)' }}>{printReceiptShipment.awb_no}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Weight &bull; Dimensions:</span>
                    <span>{printReceiptShipment.weightG || 200}g &bull; {printReceiptShipment.dims?.l || 10}&times;{printReceiptShipment.dims?.b || 10}&times;{printReceiptShipment.dims?.h || 5} cm</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Destination Address:</span>
                    <span style={{ maxWidth: 220, textAlign: 'right' }}>{printReceiptShipment.shipping_address}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 6, fontWeight: 700 }}>
                    <span>Insured Declared Value:</span>
                    <span style={{ color: 'var(--primary)' }}>{formatCurrency(printReceiptShipment.declared_value)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginTop: 24 }}>
                  <span>Logistics Officer Signature</span>
                  <span>Security Vault Stamp</span>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setPrintReceiptShipment(null)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                Print Consignment Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentsView;


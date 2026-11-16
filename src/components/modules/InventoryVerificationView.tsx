import React, { useState } from 'react';
import { 
  CheckSquare, Search, QrCode, Barcode, Printer, CheckCircle2, 
  AlertTriangle, ShieldCheck, X, FileSpreadsheet, RefreshCw, 
  Download, Plus, Volume2, Check, ArrowRight, Layers, Eye
} from 'lucide-react';
import { InventoryItem, StoreProfile } from '../../types';

interface InventoryVerificationViewProps {
  store: StoreProfile;
  inventory: InventoryItem[];
}

interface ScanRecord {
  id: string;
  code: string;
  itemId?: string;
  itemName?: string;
  huid?: string;
  category?: string;
  purity?: string;
  weight?: number;
  result: 'MATCHED' | 'EXCESS' | 'UNKNOWN' | 'ALREADY_SOLD';
  scannedAt: string;
  scannedBy: string;
}

export const InventoryVerificationView: React.FC<InventoryVerificationViewProps> = ({
  store,
  inventory: initialInventory
}) => {
  const [auditInventory, setAuditInventory] = useState<InventoryItem[]>([]);
  const [auditNo, setAuditNo] = useState('');
  const [auditName, setAuditName] = useState('');
  const [startedBy] = useState('Admin');
  const [startedAt, setStartedAt] = useState('');
  const [auditLocked, setAuditLocked] = useState(false);
  const inventory = auditInventory;
  const [auditMethod, setAuditMethod] = useState<'scan' | 'count'>('scan');
  const [selectedTray, setSelectedTray] = useState<string>('ALL');

  // Modals & Tabs
  const [showNewAuditModal, setShowNewAuditModal] = useState(false);
  const [newAuditName, setNewAuditName] = useState('Stock count ' + new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
  const [newAuditMethod, setNewAuditMethod] = useState<'scan' | 'count'>('scan');

  const [activeTab, setActiveTab] = useState<'category_wise' | 'missing' | 'excess' | 'scans'>('category_wise');
  const [scanInput, setScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const [scannedIds, setScannedIds] = useState<string[]>([]);
  const [scanRecords, setScanRecords] = useState<ScanRecord[]>([]);

  // Excess tags scanned (not found in current inventory)
  const [excessTags, setExcessTags] = useState<ScanRecord[]>([]);

  // Unique Trays in Inventory
  const trays = Array.from(new Set(inventory.map(i => i.rackTray || i.location || 'Main Showroom')));

  // Filter expected inventory by tray
  const expectedItems = inventory.filter(i => {
    if (selectedTray !== 'ALL' && (i.rackTray || i.location) !== selectedTray) {
      return false;
    }
    return true;
  });

  const totalExpectedPieces = expectedItems.reduce((acc, i) => acc + i.stockQty, 0);
  const totalExpectedWeight = expectedItems.reduce((acc, i) => acc + (i.grossWeight * i.stockQty), 0);

  // Scanned in this tray
  const foundItems = expectedItems.filter(i => scannedIds.includes(i.id));
  const verifiedPieces = foundItems.reduce((acc, i) => acc + i.stockQty, 0);
  const verifiedWeight = foundItems.reduce((acc, i) => acc + (i.grossWeight * i.stockQty), 0);

  const missingItems = expectedItems.filter(i => !scannedIds.includes(i.id));
  const missingPieces = missingItems.reduce((acc, i) => acc + i.stockQty, 0);
  const missingWeight = missingItems.reduce((acc, i) => acc + (i.grossWeight * i.stockQty), 0);
  const missingVarianceValue = missingItems.reduce((acc, i) => acc + (i.retailPrice * i.stockQty), 0);

  const totalScannedCount = scannedIds.length + excessTags.length;
  const verifiedPercent = totalExpectedPieces > 0 ? Math.round((verifiedPieces / totalExpectedPieces) * 100) : 0;

  // Sound feedback synthesizer for scanner matching live bundle Chunk 799
  const playAuditTone = (kind: 'found' | 'excess' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const beeps: [number, number][] = kind === 'found' 
        ? [[1320, 0.09]] 
        : kind === 'excess' 
          ? [[880, 0.08], [880, 0.08]] 
          : [[300, 0.22]];
      
      let t = ctx.currentTime;
      beeps.forEach(([freq, dur]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.value = 0.05;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
        t += dur + 0.05;
      });
    } catch {}

    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(kind === 'found' ? 40 : [60, 40, 60]);
      }
    } catch {}
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (auditLocked || !scanInput.trim()) return;

    const q = scanInput.trim().toUpperCase();
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    // Match against inventory itemCode, barcode, or HUID
    const found = inventory.find(i => 
      i.itemCode.toUpperCase() === q ||
      (i.barcode && i.barcode.toUpperCase() === q) ||
      i.huid.toUpperCase() === q
    );

    if (found && found.stockQty > 0) {
      if (scannedIds.includes(found.id)) {
        playAuditTone('error');
        setScanMessage({ text: `Tag "${found.itemCode}" was already scanned previously in this audit session!`, type: 'warn' });
      } else {
        playAuditTone('found');
        setScannedIds([...scannedIds, found.id]);
        setScanRecords([
          {
            id: `sc-${Date.now()}`,
            code: found.itemCode,
            itemId: found.id,
            itemName: found.itemName,
            huid: found.huid,
            category: found.category,
            purity: found.purityKarat,
            weight: found.grossWeight,
            result: 'MATCHED',
            scannedAt: now,
            scannedBy: 'Admin'
          },
          ...scanRecords
        ]);
        setScanMessage({ text: `✓ Matched: ${found.itemName} (${found.itemCode}) · Net: ${found.netWeight.toFixed(3)}g · HUID: ${found.huid}`, type: 'success' });
      }
    } else {
      // Unrecognized / Excess tag
      playAuditTone('excess');
      const excessRecord: ScanRecord = {
        id: `sc-${Date.now()}`,
        code: q,
        result: 'EXCESS',
        scannedAt: now,
        scannedBy: 'Admin'
      };
      setExcessTags([...excessTags, excessRecord]);
      setScanRecords([excessRecord, ...scanRecords]);
      setScanMessage({ text: `⚠ Tag "${q}" not found in system stock! Marked as Untagged / Surplus.`, type: 'error' });
    }

    setScanInput('');
  };

  const handleStartNewAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuditName.trim()) return;
    setAuditNo(`SV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setAuditName(newAuditName.trim());
    setAuditInventory(initialInventory.filter(item => item.stockQty > 0));
    setStartedAt(new Date().toLocaleString('en-GB'));
    setSelectedTray('ALL');
    setActiveTab('category_wise');
    setAuditLocked(false);
    setAuditMethod(newAuditMethod);
    setScannedIds([]);
    setScanRecords([]);
    setExcessTags([]);
    setReconciledIds([]);
    setShowNewAuditModal(false);
    setScanMessage({ text: 'New inventory verification session started. Scanner is live and ready.', type: 'success' });
  };

  const handleMarkLocated = (item: InventoryItem) => {
    if (auditLocked || scannedIds.includes(item.id)) return;
    setScannedIds([...scannedIds, item.id]);
    playAuditTone('found');
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    setScanRecords([
      {
        id: `sc-${Date.now()}`,
        code: item.itemCode,
        itemId: item.id,
        itemName: item.itemName,
        huid: item.huid,
        category: item.category,
        purity: item.purityKarat,
        weight: item.grossWeight,
        result: 'MATCHED',
        scannedAt: now,
        scannedBy: 'Admin'
      },
      ...scanRecords
    ]);
  };

  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileAction, setReconcileAction] = useState<'mark_located' | 'variance_note'>('variance_note');
  const [reconcileNotes, setReconcileNotes] = useState('');
  const [reconciledIds, setReconciledIds] = useState<string[]>([]);

  const handleApplyReconciliation = () => {
    if (auditLocked || !reconcileNotes.trim()) return;
    const unverifiedIds = missingItems.map(item => item.id);
    setReconciledIds(current => [...new Set([...current, ...unverifiedIds])]);
    if (reconcileAction === 'mark_located') {
      setScannedIds(current => [...new Set([...current, ...unverifiedIds])]);
    }
    setShowReconcileModal(false);
  };

  const handleCompleteAudit = () => {
    setAuditLocked(true);
    setScanMessage({ text: `Verification ${auditNo} completed. Stock quantities were not changed.`, type: 'success' });
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Inventory Verification</h1>
          <p>Scan every tag (barcode / Data Matrix gun, camera or by hand), or count category-wise on a sheet — compare with the stock in the system.</p>
        </div>
        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => setShowNewAuditModal(true)}
          >
            <Plus size={14} />
            <span>New verification</span>
          </button>
          {auditNo && <>
          <button 
            type="button" 
            className="btn btn-outline"
            disabled={auditLocked || (!missingItems.length && !excessTags.length)}
            onClick={() => setShowReconcileModal(true)}
            style={{ 
              borderColor: (missingItems.length > 0 || excessTags.length > 0) ? 'var(--primary)' : undefined,
              color: (missingItems.length > 0 || excessTags.length > 0) ? 'var(--primary)' : undefined
            }}
          >
            <ShieldCheck size={14} />
            <span>Reconcile Discrepancies ({missingItems.length + excessTags.length})</span>
          </button>
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={() => window.print()}
          >
            <Printer size={14} />
            <span>PDF Report</span>
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleCompleteAudit}
            disabled={auditLocked}
          >
            {auditLocked ? 'Verification completed' : '✓ Complete & Lock Audit'}
          </button>
          </>}
        </div>
      </div>

      {!auditNo ? <p className="helper">No active verification.</p> : <>
      {/* 5 Audit KPI Cards (.sum-grid with .sum-box, .sum-val, .sum-lbl) */}
      <div className="sum-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {/* 1. Total Scanned */}
        <div className="sum-box">
          <div className="sum-val">{totalScannedCount} tags</div>
          <div className="sum-lbl">Total Scanned</div>
          <div className="helper" style={{ marginTop: 4 }}>{verifiedPercent}% of total stock</div>
        </div>

        {/* 2. Matched */}
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)' }}>
            {verifiedPieces} pcs
          </div>
          <div className="sum-lbl">Matched in System</div>
          <div className="helper" style={{ marginTop: 4 }}>{verifiedWeight.toFixed(3)}g verified</div>
        </div>

        {/* 3. Missing */}
        <div className="sum-box">
          <div className="sum-val" style={{ color: missingPieces > 0 ? 'var(--danger)' : 'var(--muted)' }}>
            {missingPieces} pcs
          </div>
          <div className="sum-lbl">Missing (Unscanned)</div>
          <div className="helper" style={{ marginTop: 4 }}>{missingWeight.toFixed(3)}g outstanding</div>
        </div>

        {/* 4. Untagged / Surplus */}
        <div className="sum-box">
          <div className="sum-val" style={{ color: excessTags.length > 0 ? 'var(--warn)' : 'var(--muted)' }}>
            {excessTags.length} tags
          </div>
          <div className="sum-lbl">Untagged / Surplus</div>
          <div className="helper" style={{ marginTop: 4 }}>Not in active stock</div>
        </div>

        {/* 5. Variance Value */}
        <div className="sum-box">
          <div className="sum-val" style={{ color: missingVarianceValue > 0 ? 'var(--danger)' : 'var(--primary)' }}>
            ₹{Math.round(missingVarianceValue).toLocaleString('en-IN')}
          </div>
          <div className="sum-lbl">Variance Value</div>
          <div className="helper" style={{ marginTop: 4 }}>
            {missingVarianceValue === 0 ? 'Zero discrepancy' : 'At retail valuation'}
          </div>
        </div>
      </div>

      {/* Physical Audit Scanner Input Bar (.card) */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <form onSubmit={handleScanSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ background: 'var(--primary-l)', color: 'var(--primary)', padding: '8px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                <Barcode size={20} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Scan Physical Item Tag</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Barcode, DataMatrix, or HUID</div>
              </div>
            </div>

            <div className="search-box" style={{ flex: '1 1 340px' }}>
              <Barcode size={16} style={{ color: 'var(--muted)', flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder="Scan barcode or type item code (e.g. SBJCH-01, ZX98YU)..."
                disabled={auditLocked}
              value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                autoFocus
              />
              {scanInput && (
                <button 
                  type="button" 
                  onClick={() => setScanInput('')} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
              Physical Audit Scan
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="label" style={{ margin: 0, fontSize: 12 }}>Audit Location:</span>
              <select 
                className="input input-sm" 
                style={{ width: 'auto' }}
                value={selectedTray} 
                onChange={(e) => setSelectedTray(e.target.value)}
              >
                <option value="ALL">All Showroom & Trays</option>
                {trays.map(tray => (
                  <option key={tray} value={tray}>{tray}</option>
                ))}
              </select>
            </div>
          </form>

          {/* Scanner Feedback Alert Message */}
          {scanMessage && (
            <div 
              className={`alert ${
                scanMessage.type === 'success' ? 'alert-success' : 
                scanMessage.type === 'warn' ? 'alert-warn' : 'alert-danger'
              }`}
              style={{ marginTop: 12, marginBottom: 0 }}
            >
              {scanMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* Tabs for Audit Discrepancy Resolution */}
      <div className="tabs">
        <button 
          type="button"
          className={`tab ${activeTab === 'category_wise' ? 'active' : ''}`}
          onClick={() => setActiveTab('category_wise')}
        >
          Category Reconciliation
        </button>
        <button 
          type="button"
          className={`tab ${activeTab === 'missing' ? 'active' : ''}`}
          onClick={() => setActiveTab('missing')}
        >
          Missing Items ({missingItems.length})
        </button>
        <button 
          type="button"
          className={`tab ${activeTab === 'excess' ? 'active' : ''}`}
          onClick={() => setActiveTab('excess')}
        >
          Untagged / Surplus ({excessTags.length})
        </button>
        <button 
          type="button"
          className={`tab ${activeTab === 'scans' ? 'active' : ''}`}
          onClick={() => setActiveTab('scans')}
        >
          Scan History Log ({scanRecords.length})
        </button>
      </div>

      {/* TAB 1: Category Reconciliation */}
      {activeTab === 'category_wise' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Category-wise Physical Audit Progress</span>
            <span className="helper">Reconciliation against active stock</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl-desktop-only">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>In System (Qty)</th>
                  <th style={{ textAlign: 'right' }}>System Wt</th>
                  <th style={{ textAlign: 'center' }}>Scanned (Qty)</th>
                  <th style={{ textAlign: 'right' }}>Scanned Wt</th>
                  <th style={{ textAlign: 'center' }}>Variance (Qty)</th>
                  <th style={{ textAlign: 'right' }}>Variance Wt</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {['gold', 'silver', 'diamond', 'platinum'].map(cat => {
                  const catItems = expectedItems.filter(i => (i.category || '').toLowerCase() === cat);
                  if (catItems.length === 0) return null;
                  const expQty = catItems.reduce((a, b) => a + b.stockQty, 0);
                  const expWt = catItems.reduce((a, b) => a + (b.grossWeight * b.stockQty), 0);

                  const fndItems = catItems.filter(i => scannedIds.includes(i.id));
                  const fndQty = fndItems.reduce((a, b) => a + b.stockQty, 0);
                  const fndWt = fndItems.reduce((a, b) => a + (b.grossWeight * b.stockQty), 0);

                  const diffQty = fndQty - expQty;
                  const diffWt = fndWt - expWt;

                  return (
                    <tr key={cat}>
                      <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{cat}</td>
                      <td style={{ textAlign: 'center' }}>{expQty} pcs</td>
                      <td style={{ textAlign: 'right' }} className="mono">{expWt.toFixed(3)} g</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{fndQty} pcs</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">{fndWt.toFixed(3)} g</td>
                      <td style={{ textAlign: 'center', color: diffQty < 0 ? 'var(--danger)' : 'var(--primary)', fontWeight: 700 }}>
                        {diffQty === 0 ? '0' : `${diffQty} pcs`}
                      </td>
                      <td style={{ textAlign: 'right', color: diffWt < 0 ? 'var(--danger)' : 'var(--primary)' }} className="mono">
                        {diffWt.toFixed(3)} g
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${diffQty === 0 ? 'badge-green' : 'badge-yellow'}`}>
                          {diffQty === 0 ? '✓ Reconciled' : 'Audit In Progress'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Missing Items */}
      {activeTab === 'missing' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Missing Items (In System, Not Yet Scanned)</span>
            <span className="helper">Locate physical piece or resolve discrepancy</span>
          </div>
          {missingItems.length === 0 ? (
            <div className="card-body" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
              ✓ All items in current selection have been successfully scanned and accounted for!
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl-desktop-only">
                <thead>
                  <tr>
                    <th>Item Code / SKU</th>
                    <th>Item Name</th>
                    <th>HUID</th>
                    <th>Purity</th>
                    <th style={{ textAlign: 'right' }}>Gross Wt</th>
                    <th style={{ textAlign: 'right' }}>Retail Value</th>
                    <th>Expected Tray</th>
                    <th style={{ textAlign: 'right' }}>Discrepancy Action</th>
                  </tr>
                </thead>
                <tbody>
                  {missingItems.map(item => (
                    <tr key={item.id}>
                      <td className="mono" style={{ fontWeight: 700 }}>{item.itemCode}</td>
                      <td>{item.itemName}</td>
                      <td>
                        <span className="badge badge-purple">{item.huid}</span>
                      </td>
                      <td>{item.purityKarat}</td>
                      <td style={{ textAlign: 'right' }} className="mono">{item.grossWeight.toFixed(3)} g</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }} className="mono">
                        ₹{item.retailPrice.toLocaleString('en-IN')}
                      </td>
                      <td>{item.rackTray || item.location}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button 
                            type="button" 
                            className="btn btn-outline btn-xs"
                            onClick={() => handleMarkLocated(item)}
                          >
                            <Check size={12} />
                            <span>Mark Located</span>
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-danger btn-xs"
                            onClick={() => alert(`Item ${item.itemCode} marked for supervisor investigation.`)}
                          >
                            Investigate
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Untagged / Surplus */}
      {activeTab === 'excess' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Surplus / Untagged Physical Items</span>
            <span className="helper">Scanned tags not present in active catalog</span>
          </div>
          {excessTags.length === 0 ? (
            <div className="card-body" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
              No surplus or unrecognized tags scanned in this audit session.
            </div>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl-desktop-only">
                <thead>
                  <tr>
                    <th>Scanned Tag Code</th>
                    <th>Scanned At</th>
                    <th>Scanned By</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {excessTags.map(rec => (
                    <tr key={rec.id}>
                      <td className="mono" style={{ fontWeight: 700 }}>{rec.code}</td>
                      <td className="mono">{rec.scannedAt}</td>
                      <td>{rec.scannedBy}</td>
                      <td>
                        <span className="badge badge-yellow">Unregistered / Surplus</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          type="button" 
                          className="btn btn-outline btn-xs"
                          onClick={() => alert(`Create new inventory item for tag ${rec.code}`)}
                        >
                          + Create SKU & Intake
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Scan Log */}
      {activeTab === 'scans' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Audit Tag Scanner Log</span>
            <span className="helper">{scanRecords.length} scans recorded</span>
          </div>
          <div className="tbl-wrap">
            <table className="tbl-desktop-only">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Tag / SKU</th>
                  <th>Item Description</th>
                  <th>Purity</th>
                  <th style={{ textAlign: 'right' }}>Weight</th>
                  <th style={{ textAlign: 'center' }}>Result</th>
                  <th>Scanner User</th>
                </tr>
              </thead>
              <tbody>
                {scanRecords.map(rec => (
                  <tr key={rec.id}>
                    <td className="mono" style={{ fontSize: 12 }}>{rec.scannedAt}</td>
                    <td className="mono" style={{ fontWeight: 700 }}>{rec.code}</td>
                    <td>{rec.itemName || 'Unregistered Item'}</td>
                    <td>{rec.purity || '-'}</td>
                    <td style={{ textAlign: 'right' }} className="mono">
                      {rec.weight ? `${rec.weight.toFixed(3)}g` : '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${rec.result === 'MATCHED' ? 'badge-green' : 'badge-red'}`}>
                        {rec.result}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{rec.scannedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </>}

      {/* MODAL: New Physical Audit Session */}
      {showNewAuditModal && (
        <div className="overlay" onClick={() => setShowNewAuditModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Start New Inventory Verification Audit</h3>
              <button 
                type="button" 
                onClick={() => setShowNewAuditModal(false)}
                className="btn btn-outline btn-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleStartNewAudit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="label">Audit Session Name *</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={newAuditName} 
                    onChange={(e) => setNewAuditName(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="label">Verification Method</label>
                  <select 
                    className="input" 
                    value={newAuditMethod} 
                    onChange={(e) => setNewAuditMethod(e.target.value as any)}
                  >
                    <option value="scan">Barcode / 2D DataMatrix Tag Scanner</option>
                    <option value="count">Manual Piece & Weight Counting</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Scope & Location</label>
                  <select className="input">
                    <option value="ALL">Entire Showroom & Safes (Full Audit)</option>
                    <option value="SHOWCASE">Showcase Counters Only</option>
                    <option value="VAULT">Main Vault & Safes Only</option>
                  </select>
                </div>
              </div>

              <div className="modal-foot">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowNewAuditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Start Audit Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 2: Reconcile Discrepancies */}
      {showReconcileModal && (
        <div className="overlay" onClick={() => setShowReconcileModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Reconcile Audit Discrepancies — {auditNo}</h3>
              <button 
                type="button" 
                className="btn btn-outline btn-xs"
                onClick={() => setShowReconcileModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--zebra)', padding: '12px 14px', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700 }}>Discrepancy Summary</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                  Missing: {missingItems.length} SKU(s) ({missingPieces} pcs, {missingWeight.toFixed(3)}g) · Excess: {excessTags.length} tag(s)
                </div>
              </div>

              <div className="form-group">
                <label className="label">Reconciliation Action</label>
                <select 
                  className="input"
                  value={reconcileAction}
                  onChange={(e) => setReconcileAction(e.target.value as any)}
                >
                  <option value="mark_located">Mark as Located in Alternate Safe / Tray</option>
                  <option value="variance_note">Record Investigation Memo & Keep Under Audit Watch</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Investigation Notes / Approval</label>
                <textarea 
                  className="input" 
                  rows={3}
                  value={reconcileNotes}
                  onChange={(e) => setReconcileNotes(e.target.value)}
                  placeholder="Record manager notes or reason for reconciliation..."
                />
              </div>

              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', padding: '10px 14px', borderRadius: '8px', fontSize: 12, color: '#92400e' }}>
                Reconciliation records the review of discrepancies in this verification. Inventory and stock ledger quantities are unaffected.
              </div>
            </div>
            <div className="modal-foot">
              <button 
                type="button" 
                className="btn btn-outline"
                onClick={() => setShowReconcileModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                disabled={!reconcileNotes.trim() || auditLocked}
                onClick={handleApplyReconciliation}
              >
                Apply reconciliation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


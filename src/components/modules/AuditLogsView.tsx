import React, { useState } from 'react';
import { 
  History, Shield, Search, Filter, Download, Calendar, 
  Eye, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, 
  SlidersHorizontal, Check, X, Code, FileText, Monitor, Lock
} from 'lucide-react';
import { StoreProfile } from '../../types';

export interface AuditRecord {
  id: string;
  timestamp: string;
  operator: string;
  counter: string;
  actionType: 'CREATE_INVOICE' | 'CANCEL_ORDER' | 'DISBURSE_LOAN' | 'VOID_PETTY_CASH' | 'RATE_CHANGE' | 'BACKUP_RESTORE' | 'REGISTER_OPENED' | 'REGISTER_CLOSING' | 'SETTINGS_CHANGED' | 'USER_CREATED';
  target: string;
  ipAddress: string;
  deviceMetadata: string;
  requestId: string;
  summary: string;
  severity: 'normal' | 'warn' | 'critical';
  beforeState: Record<string, any> | null;
  afterState: Record<string, any>;
}

interface AuditLogsViewProps {
  store?: StoreProfile;
  onNavigate?: (module: string) => void;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  store,
  onNavigate
}) => {
  // Audit events based on dump.sql & live showroom activity
  const [logsList] = useState<AuditRecord[]>([
    {
      id: 'aud-001',
      timestamp: '15-Nov-2026 12:49:15 PM',
      operator: 'Admin (Sujal Shah)',
      counter: 'Counter MAIN',
      actionType: 'CREATE_INVOICE',
      target: 'INV-2026-00276',
      ipAddress: '192.168.1.102',
      deviceMetadata: 'Chrome 157.0 / macOS (POS Terminal 1)',
      requestId: 'req_8e2884dd11b02f9d',
      summary: 'Created retail sales invoice for customer Sujal Shah. 22K Gold Ring (6.000g), total value ₹94,650.00. Settled via Cash.',
      severity: 'normal',
      beforeState: null,
      afterState: {
        invoiceNumber: 'INV-2026-00276',
        customer: 'Sujal Shah',
        item: '22 ct Gold Ring (Plain)',
        grossWeight: '6.200g',
        netWeight: '6.000g',
        goldRate: 71906,
        taxableAmount: 91893.20,
        gstTotal: 2756.80,
        netTotal: 94650.00,
        paymentMode: 'CASH',
        status: 'PAID'
      }
    },
    {
      id: 'aud-002',
      timestamp: '15-Nov-2026 12:40:08 PM',
      operator: 'Admin (Sujal Shah)',
      counter: 'Counter MAIN',
      actionType: 'RATE_CHANGE',
      target: 'DAILY_RATES',
      ipAddress: '192.168.1.101',
      deviceMetadata: 'Safari 18.0 / macOS (Backoffice)',
      requestId: 'req_5693d171b92b0124',
      summary: 'Updated showroom bullion board rates: Gold 24K increased from ₹78,000 to ₹78,500; Gold 22K adjusted to ₹71,906; Silver raised to ₹92,000.',
      severity: 'warn',
      beforeState: {
        gold24kPer10g: 78000,
        gold22kPer10g: 71500,
        gold18kPer10g: 58500,
        silverPer1kg: 91000,
        updatedAt: '14-Nov-2026 10:00:00 AM'
      },
      afterState: {
        gold24kPer10g: 78500,
        gold22kPer10g: 71906,
        gold18kPer10g: 58875,
        silverPer1kg: 92000,
        updatedAt: '15-Nov-2026 12:40:08 PM',
        source: 'Mumbai Bullion Association (IBJA)'
      }
    },
    {
      id: 'aud-003',
      timestamp: '15-Nov-2026 11:38:54 AM',
      operator: 'Admin (Sujal Shah)',
      counter: 'Counter MAIN',
      actionType: 'REGISTER_CLOSING',
      target: 'REG-2026-00001',
      ipAddress: '127.0.0.1',
      deviceMetadata: 'Chrome 157.0 / POS Terminal 1',
      requestId: 'req_8a26ec574d5da53b',
      summary: 'Initiated cash register day closing ceremony for Counter MAIN. Expected cash ₹49,970.00.',
      severity: 'warn',
      beforeState: {
        sessionNo: 'REG-2026-00001',
        counter: 'MAIN',
        status: 'open',
        openingCash: 50000.00
      },
      afterState: {
        sessionNo: 'REG-2026-00001',
        counter: 'MAIN',
        status: 'closing',
        closingStartedBy: 'Admin',
        expectedCash: 49970.00,
        actualCountedCash: 49970.00,
        cashDifference: 0.00
      }
    },
    {
      id: 'aud-004',
      timestamp: '15-Nov-2026 11:15:22 AM',
      operator: 'Rahul Jain (Cashier)',
      counter: 'Counter MAIN',
      actionType: 'VOID_PETTY_CASH',
      target: 'VOC-2026-00008',
      ipAddress: '192.168.1.102',
      deviceMetadata: 'Chrome 157.0 / POS Terminal 1',
      requestId: 'req_c3b3657959403c64',
      summary: 'Voided petty cash voucher VOC-2026-00008 (₹450.00 - Showroom stationery). Reason: Duplicate payout entry corrected.',
      severity: 'critical',
      beforeState: {
        voucherNo: 'VOC-2026-00008',
        payee: 'Universal Stationers',
        category: 'Office Supplies',
        amount: 450.00,
        status: 'PAID'
      },
      afterState: {
        voucherNo: 'VOC-2026-00008',
        amount: 450.00,
        status: 'VOIDED',
        voidedBy: 'Rahul Jain',
        approvedBy: 'Admin (Sujal Shah)',
        voidReason: 'Duplicate payout entry corrected'
      }
    },
    {
      id: 'aud-005',
      timestamp: '15-Nov-2026 10:45:11 AM',
      operator: 'Sandeep Shah (Manager)',
      counter: 'POS1',
      actionType: 'DISBURSE_LOAN',
      target: 'LOAN-2026-00014',
      ipAddress: '192.168.1.105',
      deviceMetadata: 'Firefox 132.0 / POS Terminal 3',
      requestId: 'req_70cb8e8241fd7cbc',
      summary: 'Sanctioned and disbursed Girvi Gold Loan of ₹1,40,000.00 against 22K Gold Mangalsutra (32.400g). Interest rate: 1.50% p.m.',
      severity: 'normal',
      beforeState: null,
      afterState: {
        loanNo: 'LOAN-2026-00014',
        borrower: 'Kishore B. Mehta',
        ornamentsPledged: '1x 22K Gold Mangalsutra with Black Beads',
        grossWeight: '34.100g',
        netGoldWeight: '32.400g',
        assayedPurity: '91.6% (22 Karat)',
        marketValuation: 232975.00,
        sanctionedPrincipal: 140000.00,
        monthlyInterestRate: '1.50%',
        disbursementMode: 'NEFT / Bank Transfer'
      }
    },
    {
      id: 'aud-006',
      timestamp: '14-Nov-2026 08:30:19 PM',
      operator: 'Admin (Sujal Shah)',
      counter: 'Server Background',
      actionType: 'BACKUP_RESTORE',
      target: 'DB_SNAPSHOT_20261114',
      ipAddress: '127.0.0.1',
      deviceMetadata: 'PostgreSQL CLI / Host Node 495779',
      requestId: 'req_97840958095299cb',
      summary: 'Automated encrypted PostgreSQL daily cloud verification snapshot generated and synchronized to AWS S3 Mumbai.',
      severity: 'normal',
      beforeState: {
        lastBackupAt: '13-Nov-2026 08:30:00 PM',
        tablesCount: 28,
        recordsCount: 4210
      },
      afterState: {
        backupAt: '14-Nov-2026 08:30:19 PM',
        snapshotSize: '377 KB',
        checksumSHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        cloudBucket: 's3://kreya-backups-mumbai/sbj/dump_20261114.sql',
        status: 'VERIFIED'
      }
    },
    {
      id: 'aud-007',
      timestamp: '14-Nov-2026 04:12:00 PM',
      operator: 'Sandeep Shah (Manager)',
      counter: 'Counter MAIN',
      actionType: 'CANCEL_ORDER',
      target: 'ORD-2026-00088',
      ipAddress: '192.168.1.102',
      deviceMetadata: 'Chrome 157.0 / POS Terminal 1',
      requestId: 'req_91760273e7f7fa80',
      summary: 'Cancelled bespoke bridal necklace order ORD-2026-00088 upon client change of design. Full refund of advance ₹25,000 via UPI.',
      severity: 'warn',
      beforeState: {
        orderNo: 'ORD-2026-00088',
        customer: 'Pooja K. Dave',
        totalEstimate: 185000.00,
        advancePaid: 25000.00,
        status: 'IN_PRODUCTION'
      },
      afterState: {
        orderNo: 'ORD-2026-00088',
        status: 'CANCELLED',
        cancelledBy: 'Sandeep Shah',
        refundAmount: 25000.00,
        refundMode: 'UPI (Ref: 431980128912)',
        cancellationReason: 'Client changed bridal jewellery theme to Antique Temple finish'
      }
    }
  ]);

  // Filtering states
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [counterFilter, setCounterFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Diff Viewer Modal
  const [activeDiffRecord, setActiveDiffRecord] = useState<AuditRecord | null>(null);
  const [diffViewMode, setDiffViewMode] = useState<'visual' | 'json'>('visual');

  // Filter computation
  const filteredLogs = logsList.filter(log => {
    if (actionFilter !== 'ALL' && log.actionType !== actionFilter) return false;
    if (counterFilter !== 'ALL' && !log.counter.toLowerCase().includes(counterFilter.toLowerCase())) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.target.toLowerCase().includes(q) ||
        log.operator.toLowerCase().includes(q) ||
        log.summary.toLowerCase().includes(q) ||
        log.requestId.toLowerCase().includes(q) ||
        log.ipAddress.includes(q)
      );
    }
    return true;
  });

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SBJ_Audit_Trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Action', 'Target', 'User', 'Counter', 'Severity', 'Description', 'IP Address'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.actionType}"`,
      `"${l.target}"`,
      `"${l.operator}"`,
      `"${l.counter}"`,
      `"${l.severity}"`,
      `"${(l.summary || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `SBJ_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const getActionBadgeColor = (action: string, severity: string) => {
    if (severity === 'critical') return 'badge-red text-red-800';
    if (severity === 'warn') return 'badge-yellow text-amber-800';
    if (action === 'CREATE_INVOICE' || action === 'DISBURSE_LOAN') return 'badge-green text-emerald-800';
    return 'badge-indigo text-indigo-800';
  };

  return (
    <div className="page">
      {/* 1. Header Banner & Expiry Alert */}
      <div 
        className="license-banner rounded-lg mb-3 flex items-center justify-between p-3" 
        style={{ background: '#fef8ee', borderColor: '#fde68a', borderWidth: 1 }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-medium text-amber-950">
            ⚠️ Licence expires in 30 days (15-Dec-2026). Contact Kreya IT Consulting to renew.
          </span>
        </div>
        <button 
          onClick={() => onNavigate ? onNavigate('licence') : alert('Navigating to Licence Renewal...')}
          className="font-semibold text-amber-900 hover:text-amber-950 cursor-pointer flex items-center gap-1 text-xs px-2 py-1 bg-amber-100 hover:bg-amber-200 rounded border border-amber-300 transition-colors"
        >
          <span>Licence</span>
          <span>→</span>
        </button>
      </div>

      {/* Page Header */}
      <div className="page-hdr flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="page-hdr-left">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">Audit Logs & Governance Stream</h1>
            {/* Header banner Counter badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper text-xs text-slate-500 mt-1">
            Immutable, cryptographic audit ledger tracking all financial operations, rate alterations, void vouchers & security events · S.B Borana Jewellers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            title="Export filtered audit logs as CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="btn btn-outline btn-sm flex items-center gap-1.5"
            title="Export filtered audit logs as JSON"
          >
            <Download size={14} />
            <span>Export (.JSON)</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="card p-3 mb-4 bg-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <div className="search-box relative w-full">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search audit trail by target (e.g. INV-2026-00276), operator, request ID, IP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-sm w-full pl-8 text-xs"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <Filter size={13} className="text-slate-400" />
              <span className="font-semibold text-slate-600">Action:</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="input input-sm text-xs"
              >
                <option value="ALL">All Actions</option>
                <option value="CREATE_INVOICE">CREATE_INVOICE</option>
                <option value="CANCEL_ORDER">CANCEL_ORDER</option>
                <option value="DISBURSE_LOAN">DISBURSE_LOAN</option>
                <option value="VOID_PETTY_CASH">VOID_PETTY_CASH</option>
                <option value="RATE_CHANGE">RATE_CHANGE</option>
                <option value="BACKUP_RESTORE">BACKUP_RESTORE</option>
                <option value="REGISTER_CLOSING">REGISTER_CLOSING</option>
              </select>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <Monitor size={13} className="text-slate-400" />
              <span className="font-semibold text-slate-600">Counter:</span>
              <select
                value={counterFilter}
                onChange={(e) => setCounterFilter(e.target.value)}
                className="input input-sm text-xs"
              >
                <option value="ALL">All Terminals</option>
                <option value="MAIN">Counter MAIN</option>
                <option value="COUNTER2">COUNTER2</option>
                <option value="POS1">POS1</option>
                <option value="Server">Server Background</option>
              </select>
            </div>

            {(actionFilter !== 'ALL' || counterFilter !== 'ALL' || search) && (
              <button
                type="button"
                onClick={() => { setActionFilter('ALL'); setCounterFilter('ALL'); setSearch(''); }}
                className="text-xs text-[#237a57] hover:underline font-semibold ml-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Statutory Compliance Callout */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Shield size={13} className="text-[#237a57]" />
            <span>Statutory Retention: <strong>7 Years</strong> under Section 128 Companies Act 2013 & Rule 56(16) CGST Act.</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">Append-Only Cryptographic Stream (HMAC-SHA256)</span>
        </div>
      </div>

      {/* Main Immutable Audit Stream Table */}
      <div className="card">
        <div className="card-header p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <History size={16} className="text-[#237a57]" />
            <span className="card-title text-xs font-bold text-slate-800 uppercase tracking-wide">
              Event History Log ({filteredLogs.length} Records)
            </span>
          </div>
          <span className="badge badge-gray text-[10px]">Tamper-Proof</span>
        </div>

        <div className="tbl-wrap tbl-desktop-only">
          <table className="tbl w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-3 text-left">TIMESTAMP</th>
                <th className="py-2.5 px-3 text-left">OPERATOR</th>
                <th className="py-2.5 px-3 text-left">COUNTER / STATION</th>
                <th className="py-2.5 px-3 text-left">ACTION TYPE</th>
                <th className="py-2.5 px-3 text-left">TARGET / RECORD</th>
                <th className="py-2.5 px-3 text-left">SUMMARY OF CHANGE</th>
                <th className="py-2.5 px-3 text-left">IP / TERMINAL METADATA</th>
                <th className="py-2.5 px-3 text-center">VALUE DIFF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                    {log.timestamp}
                  </td>

                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900">{log.operator}</span>
                  </td>

                  <td className="py-3 px-3">
                    <span className="text-slate-600 font-medium">{log.counter}</span>
                  </td>

                  <td className="py-3 px-3">
                    <span className={`badge ${getActionBadgeColor(log.actionType, log.severity)}`}>
                      {log.actionType}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    {log.target}
                  </td>

                  <td className="py-3 px-3 text-slate-700 max-w-sm leading-relaxed">
                    {log.summary}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-mono text-[11px] text-slate-600">{log.ipAddress}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{log.deviceMetadata}</div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDiffRecord(log);
                        setDiffViewMode('visual');
                      }}
                      className="btn btn-outline btn-sm py-1 px-2.5 text-xs inline-flex items-center gap-1 text-[#237a57] border-[#237a57]/30 hover:bg-[#237a57]/10"
                      title="Inspect Before / After State Diff"
                    >
                      <Eye size={12} />
                      <span>View Diff</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dt-pager p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50">
          <span>Showing 1 to {filteredLogs.length} of {logsList.length} events logged</span>
          <span className="font-mono text-[11px]">Storage: PostgreSQL public.audit_log partition</span>
        </div>
      </div>

      {/* Pristine Empty State */}
      {filteredLogs.length === 0 && (
        <div className="card p-12 text-center bg-white border border-dashed border-slate-200 rounded-lg mt-4">
          <History size={36} className="mx-auto text-slate-300 mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No Audit Events Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No audit trail records matched the action "{actionFilter}", counter "{counterFilter}", or keyword "{search}".
          </p>
          <button
            type="button"
            onClick={() => { setActionFilter('ALL'); setCounterFilter('ALL'); setSearch(''); }}
            className="btn btn-outline btn-sm mt-3"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* BEFORE / AFTER VALUE DIFF VIEWER MODAL */}
      {activeDiffRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#237a57]" />
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Audit Inspection: {activeDiffRecord.target} ({activeDiffRecord.actionType})
                  </h3>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Req ID: {activeDiffRecord.requestId} · {activeDiffRecord.timestamp}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Visual vs JSON Toggle */}
                <div className="seg flex rounded border border-slate-200 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setDiffViewMode('visual')}
                    className={`px-2 py-0.5 font-medium ${diffViewMode === 'visual' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    Visual Diff
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiffViewMode('json')}
                    className={`px-2 py-0.5 font-medium ${diffViewMode === 'json' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600'}`}
                  >
                    JSON
                  </button>
                </div>

                <button 
                  onClick={() => setActiveDiffRecord(null)}
                  className="text-slate-400 hover:text-slate-600 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Event Metadata Banner */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Operator</span>
                  <span className="font-bold text-slate-800">{activeDiffRecord.operator}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Counter Terminal</span>
                  <span className="font-semibold text-slate-800">{activeDiffRecord.counter}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">IP Address</span>
                  <span className="font-mono text-slate-800">{activeDiffRecord.ipAddress}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">Client Agent</span>
                  <span className="text-slate-800 truncate block" title={activeDiffRecord.deviceMetadata}>
                    {activeDiffRecord.deviceMetadata}
                  </span>
                </div>
              </div>

              {/* Summary Statement */}
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded text-xs text-blue-900">
                <strong>Event Statement:</strong> {activeDiffRecord.summary}
              </div>

              {/* VISUAL DIFF VIEW */}
              {diffViewMode === 'visual' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Previous State */}
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                        Previous State (Before)
                      </span>
                      <span className="badge badge-gray text-[10px]">Prior Revision</span>
                    </div>

                    {activeDiffRecord.beforeState ? (
                      <div className="space-y-1.5 text-xs font-mono">
                        {Object.entries(activeDiffRecord.beforeState).map(([k, val]) => (
                          <div key={k} className="p-1.5 bg-white rounded border border-slate-100 flex justify-between">
                            <span className="text-slate-500 font-sans">{k}:</span>
                            <span className="font-bold text-slate-700 text-right">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center text-slate-400 text-xs italic">
                        Initial record creation (No preceding database state).
                      </div>
                    )}
                  </div>

                  {/* New State */}
                  <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200">
                      <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                        Committed State (After)
                      </span>
                      <span className="badge badge-green text-[10px]">Verified State</span>
                    </div>

                    <div className="space-y-1.5 text-xs font-mono">
                      {Object.entries(activeDiffRecord.afterState).map(([k, val]) => {
                        const isModified = activeDiffRecord.beforeState && activeDiffRecord.beforeState[k] !== val;
                        return (
                          <div 
                            key={k} 
                            className={`p-1.5 rounded border flex justify-between ${
                              isModified ? 'bg-emerald-100/80 border-emerald-300 font-bold text-emerald-950' : 'bg-white border-slate-100 text-slate-800'
                            }`}
                          >
                            <span className="text-slate-600 font-sans">{k}:</span>
                            <span className="font-bold text-right">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* RAW JSON VIEW */}
              {diffViewMode === 'json' && (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-900 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto max-h-64">
                    <pre>{JSON.stringify({
                      eventId: activeDiffRecord.id,
                      requestId: activeDiffRecord.requestId,
                      action: activeDiffRecord.actionType,
                      target: activeDiffRecord.target,
                      operator: activeDiffRecord.operator,
                      before: activeDiffRecord.beforeState,
                      after: activeDiffRecord.afterState
                    }, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Status: Immutable & Non-Repudiable</span>
              <button
                type="button"
                onClick={() => setActiveDiffRecord(null)}
                className="btn btn-primary btn-sm"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

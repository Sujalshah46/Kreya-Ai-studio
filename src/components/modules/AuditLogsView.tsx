import React, { useState, useMemo } from 'react';
import type { StoreProfile } from '../../types';

export interface AuditRecordItem {
  id: string | number;
  at: string;
  actor_name: string;
  actor_type?: string;
  action: string;
  entity: string;
  entity_id?: string | number | null;
  ref_no?: string | null;
  reason?: string | null;
  details: Record<string, any>;
  ip: string | null;
}

const INITIAL_AUDIT_LOGS: AuditRecordItem[] = [
  {
    id: 1,
    at: '2026-11-16T13:50:53.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'LOGIN_OK',
    entity: 'user',
    entity_id: 1,
    ref_no: null,
    reason: null,
    details: { session: '45f7652b-b43a-4832-8b42-c449f97beca2', ip: '127.0.0.1', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    ip: '—'
  },
  {
    id: 2,
    at: '2026-11-16T13:01:31.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'PAYMENT_SUMMARY_PRINTED',
    entity: 'order',
    entity_id: 1,
    ref_no: 'INV-2026-00001',
    reason: null,
    details: { paper: '80mm', copies: 1, thermalSpooler: 'EPSON TM-T82' },
    ip: '127.0.0.1'
  },
  {
    id: 3,
    at: '2026-11-16T13:01:16.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'PAYMENT_RECEIPT_REPRINTED',
    entity: 'payment',
    entity_id: 1,
    ref_no: 'PAY-2026-00001',
    reason: null,
    details: { format: '80mm', printCount: 9 },
    ip: '127.0.0.1'
  },
  {
    id: 4,
    at: '2026-11-16T13:00:48.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'PAYMENT_RECEIPT_REPRINTED',
    entity: 'payment',
    entity_id: 1,
    ref_no: 'PAY-2026-00001',
    reason: null,
    details: { format: '80mm', printCount: 8 },
    ip: '127.0.0.1'
  },
  {
    id: 5,
    at: '2026-11-16T12:50:36.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'LOGIN_OK',
    entity: 'user',
    entity_id: 1,
    ref_no: null,
    reason: null,
    details: { session: '3c448551-5cda-4d0d-9667-5d626c24b737' },
    ip: '—'
  },
  {
    id: 6,
    at: '2026-11-16T09:46:33.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'LOGIN_OK',
    entity: 'user',
    entity_id: 1,
    ref_no: null,
    reason: null,
    details: { session: '8180b8c0-c745-4fb5-ab70-bc0d4fe3a31e' },
    ip: '—'
  },
  {
    id: 7,
    at: '2026-11-16T09:42:18.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'LOGOUT',
    entity: 'user',
    entity_id: 1,
    ref_no: null,
    reason: null,
    details: {},
    ip: '127.0.0.1'
  },
  {
    id: 8,
    at: '2026-11-16T09:41:40.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'LOGIN_OK',
    entity: 'user',
    entity_id: 1,
    ref_no: null,
    reason: null,
    details: { session: '4561aa1f-7aa4-482c-b0d4-60423d3b8aee' },
    ip: '—'
  },
  {
    id: 9,
    at: '2026-11-16T07:56:26.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'REPAIR_RECEIPT_PRINTED',
    entity: 'repair',
    entity_id: 1,
    ref_no: 'RR-2026-0001',
    reason: null,
    details: { format: '80mm', repairNo: 'REP-2026-00001', printCount: 1 },
    ip: '127.0.0.1'
  },
  {
    id: 10,
    at: '2026-11-15T23:32:05.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'PAYMENT_RECEIPT_REPRINTED',
    entity: 'payment',
    entity_id: 3,
    ref_no: 'PAY-2026-00003',
    reason: null,
    details: { format: '80mm', printCount: 2 },
    ip: '127.0.0.1'
  },
  {
    id: 11,
    at: '2026-11-15T23:31:37.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'PAYMENT_RECEIPT_PRINTED',
    entity: 'payment',
    entity_id: 3,
    ref_no: 'PAY-2026-00003',
    reason: null,
    details: { doc: 'INV-2026-00002', amount: '50000.00', format: '80mm' },
    ip: '127.0.0.1'
  },
  {
    id: 12,
    at: '2026-11-15T23:23:58.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'TAGS_PRINTED',
    entity: 'inventory',
    entity_id: null,
    ref_no: null,
    reason: null,
    details: { mode: 'normal', tags: 1, route: 'pdf' },
    ip: '127.0.0.1'
  },
  {
    id: 13,
    at: '2026-11-15T23:23:51.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'ITEM_CREATED',
    entity: 'inventory',
    entity_id: 2,
    ref_no: 'SBJKD-01',
    reason: null,
    details: { stones: 0, quantity: 1, grossWeight: 4.65 },
    ip: '127.0.0.1'
  },
  {
    id: 14,
    at: '2026-11-15T21:51:57.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'INVOICE_PRINTED',
    entity: 'sales_order',
    entity_id: 1,
    ref_no: 'INV-2026-00001',
    reason: null,
    details: {},
    ip: '127.0.0.1'
  },
  {
    id: 15,
    at: '2026-11-15T21:39:17.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'REGISTER_CLOSING_CANCELLED',
    entity: 'register',
    entity_id: 1,
    ref_no: 'REG-2026-00001',
    reason: null,
    details: {},
    ip: '127.0.0.1'
  },
  {
    id: 16,
    at: '2026-11-15T21:37:25.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'REGISTER_REOPENED',
    entity: 'register',
    entity_id: 1,
    ref_no: 'REG-2026-00001',
    reason: 'customer came',
    details: { previousActual: '49970.00', previousDifference: '0.00' },
    ip: '127.0.0.1'
  },
  {
    id: 17,
    at: '2026-11-15T21:37:15.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'REGISTER_CLOSED',
    entity: 'register',
    entity_id: 1,
    ref_no: 'REG-2026-00001',
    reason: null,
    details: { actual: '49970.00', expected: '49970.00', approvedBy: null, difference: '0.00' },
    ip: '127.0.0.1'
  },
  {
    id: 18,
    at: '2026-11-15T18:36:38.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'LOGIN_OK',
    entity: 'user',
    entity_id: 1,
    ref_no: null,
    reason: null,
    details: { session: 'ffa8141c-1e47-4f36-982a-27f99f15f25f' },
    ip: '—'
  },
  {
    id: 19,
    at: '2026-11-15T18:34:17.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'LOGIN_FAILED',
    entity: 'user',
    entity_id: 1,
    ref_no: null,
    reason: null,
    details: { attempts: 1 },
    ip: '—'
  },
  {
    id: 20,
    at: '2026-11-15T17:08:23.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'REGISTER_ENTRY',
    entity: 'register',
    entity_id: 1,
    ref_no: 'RCE-2026-00001',
    reason: null,
    details: { type: 'expense', amount: '30.00', category: 'Tea / refreshments' },
    ip: '127.0.0.1'
  },
  {
    id: 21,
    at: '2026-11-15T17:07:37.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'REGISTER_OPENED',
    entity: 'register',
    entity_id: 1,
    ref_no: 'REG-2026-00001',
    reason: null,
    details: { counter: 'MAIN', opening: '50000.00' },
    ip: '127.0.0.1'
  },
  {
    id: 22,
    at: '2026-11-15T16:57:00.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'USER_CREATED',
    entity: 'user',
    entity_id: 3,
    ref_no: null,
    reason: null,
    details: { name: 'Rahul Jain', email: 'sbjrahul01@gmail.com', roles: ['Viewer', 'Accountant'] },
    ip: '127.0.0.1'
  },
  {
    id: 23,
    at: '2026-11-15T16:55:56.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'USER_CREATED',
    entity: 'user',
    entity_id: 2,
    ref_no: null,
    reason: null,
    details: { name: 'Sandeep Shah', email: 'sandeepshah2000@gmail.com', roles: ['Cashier', 'Sales'] },
    ip: '127.0.0.1'
  },
  {
    id: 24,
    at: '2026-11-15T16:53:19.000Z',
    actor_name: 'Admin',
    actor_type: 'user',
    action: 'SETTINGS_CHANGED',
    entity: 'settings',
    entity_id: 'theme',
    ref_no: null,
    reason: null,
    details: { changes: { gold: { to: '#c5a46d', from: null }, mode: { to: 'light', from: null }, accent: { to: '#c5a46d', from: null } } },
    ip: '127.0.0.1'
  }
];

export const AuditLogsView: React.FC<{ store?: StoreProfile; onNavigate?: (module: string) => void }> = () => {
  const [logs] = useState<AuditRecordItem[]>(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [inspectingDetails, setInspectingDetails] = useState<AuditRecordItem | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const str = `${log.actor_name} ${log.action} ${log.entity} ${log.ref_no || ''} ${JSON.stringify(log.details)} ${log.ip || ''}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      if (selectedEntity && log.entity !== selectedEntity) {
        return false;
      }
      if (fromDate) {
        const logDate = log.at.slice(0, 10);
        if (logDate < fromDate) return false;
      }
      if (toDate) {
        const logDate = log.at.slice(0, 10);
        if (logDate > toDate) return false;
      }
      return true;
    });
  }, [logs, searchQuery, selectedEntity, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const pagedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExportCSV = () => {
    const headers = ['When', 'Who', 'Action', 'Entity', 'Entity ID', 'Reference', 'Reason', 'Details', 'IP'];
    const rows = filteredLogs.map(l => [
      l.at,
      l.actor_name,
      l.action,
      l.entity,
      l.entity_id ?? '',
      l.ref_no ?? '',
      l.reason ?? '',
      JSON.stringify(l.details).replace(/"/g, '""'),
      l.ip ?? ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => `"${r.join('","')}"`)].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page" id="main">
      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Audit Log</h1>
          <p>Every security and financial action, with who did it and when. Entries can never be changed or deleted.</p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn btn-outline" onClick={handleExportCSV}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="14" width="14" style={{ marginRight: 6 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Audit Trail (CSV)
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {/* Search Row */}
          <div className="search-row">
            <div className="search-box">
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="14" width="14">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input 
                placeholder="Search user, reference, details…" 
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <select 
              className="input" 
              style={{ width: 'auto' }} 
              value={selectedEntity} 
              onChange={e => {
                setSelectedEntity(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All areas</option>
              {['user', 'role', 'settings', 'license', 'old_gold_purchase', 'tenant', 'order', 'payment', 'register', 'inventory', 'repair'].map(e => (
                <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
              ))}
            </select>

            <input 
              className="input" 
              type="date" 
              style={{ width: 'auto' }} 
              value={fromDate} 
              onChange={e => {
                setFromDate(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="From" 
            />
            <input 
              className="input" 
              type="date" 
              style={{ width: 'auto' }} 
              value={toDate} 
              onChange={e => {
                setToDate(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="To" 
            />
          </div>

          {/* Table */}
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Who</th>
                  <th>Action</th>
                  <th>Record</th>
                  <th>Details</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {pagedLogs.map(item => {
                  const isRed = /FAILED|LOCKED|EXPIRED|DEACTIVATED|REVOKED|CANCELLED/.test(item.action);
                  const isGreen = /OK|CREATED|ACTIVATED|RENEWED/.test(item.action);
                  const badgeClass = isRed ? 'badge-red' : isGreen ? 'badge-green' : 'badge-indigo';
                  const detailsJson = item.details && Object.keys(item.details).length ? JSON.stringify(item.details) : '';

                  return (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12.5 }}>
                        {formatTimestamp(item.at)}
                      </td>
                      <td>
                        {item.actor_name || <span className="badge badge-gray">{item.actor_type || 'system'}</span>}
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>
                          {item.action}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5 }}>
                        <span>{item.entity}</span>
                        {item.entity_id ? ` #${item.entity_id}` : ''}
                        {item.ref_no ? ` · ${item.ref_no}` : ''}
                        {item.reason && (
                          <div className="helper" style={{ marginTop: 2 }}>
                            Reason: {item.reason}
                          </div>
                        )}
                      </td>
                      <td>
                        {detailsJson ? (
                          <button
                            type="button"
                            onClick={() => setInspectingDetails(item)}
                            className="mono"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 0,
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: 11,
                              color: 'var(--muted)'
                            }}
                            title="Click to view payload"
                          >
                            {detailsJson.length > 100 ? `${detailsJson.slice(0, 100)}…` : detailsJson}
                          </button>
                        ) : (
                          <span style={{ color: 'var(--muted2)' }}>—</span>
                        )}
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>
                        {item.ip || '—'}
                      </td>
                    </tr>
                  );
                })}

                {!pagedLogs.length && (
                  <tr>
                    <td colSpan={6} className="empty" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--muted)' }}>
                      No entries for these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', padding: '10px 4px', flexWrap: 'wrap' }}>
            <span className="helper" style={{ margin: 0 }}>
              {filteredLogs.length.toLocaleString('en-IN')} rows
            </span>

            <select 
              className="input input-sm" 
              style={{ width: 'auto' }} 
              value={pageSize} 
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[50, 100, 500, 1000].map(sz => (
                <option key={sz} value={sz}>{sz} / page</option>
              ))}
            </select>

            <button 
              type="button" 
              className="btn btn-xs btn-outline" 
              disabled={currentPage <= 1} 
              onClick={() => setCurrentPage(1)} 
              aria-label="First page"
            >
              «
            </button>
            <button 
              type="button" 
              className="btn btn-xs btn-outline" 
              disabled={currentPage <= 1} 
              onClick={() => setCurrentPage(p => p - 1)} 
              aria-label="Previous page"
            >
              ‹
            </button>
            <span style={{ fontSize: 12.5 }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              type="button" 
              className="btn btn-xs btn-outline" 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(p => p + 1)} 
              aria-label="Next page"
            >
              ›
            </button>
            <button 
              type="button" 
              className="btn btn-xs btn-outline" 
              disabled={currentPage >= totalPages} 
              onClick={() => setCurrentPage(totalPages)} 
              aria-label="Last page"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {/* Payload Modal */}
      {inspectingDetails && (
        <div 
          className="overlay visible" 
          style={{ position: 'fixed', inset: 0, background: 'rgba(10, 8, 30, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setInspectingDetails(null)}
        >
          <div 
            className="modal card" 
            style={{ width: 560, maxWidth: '90vw', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="card-title">Audit Payload Inspection</span>
                <div className="helper" style={{ marginTop: 2 }}>
                  {inspectingDetails.action} · {inspectingDetails.entity} {inspectingDetails.ref_no ? `· ${inspectingDetails.ref_no}` : ''}
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setInspectingDetails(null)}
              >
                ✕
              </button>
            </div>
            <div className="card-body" style={{ overflowY: 'auto' }}>
              <pre className="mono" style={{ background: 'var(--surface2)', padding: 14, borderRadius: 8, fontSize: 12, lineHeight: 1.5, border: '1px solid var(--border)' }}>
                {JSON.stringify(inspectingDetails.details, null, 2)}
              </pre>
            </div>
            <div className="card-footer" style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                onClick={() => {
                  navigator.clipboard?.writeText(JSON.stringify(inspectingDetails.details, null, 2));
                  alert('Payload JSON copied to clipboard');
                }}
              >
                Copy Payload JSON
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                style={{ marginLeft: 8 }}
                onClick={() => setInspectingDetails(null)}
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

export default AuditLogsView;

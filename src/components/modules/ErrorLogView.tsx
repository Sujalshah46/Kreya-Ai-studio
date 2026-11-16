import React, { useState, useMemo } from 'react';

export interface ErrorLogItem {
  id: string | number;
  last_seen_at: string;
  source: 'client' | 'server' | 'fatal';
  level: 'ERROR' | 'WARN' | 'CRITICAL';
  method?: string;
  route?: string;
  message: string;
  count: number;
  request_id?: string;
  status: 'new' | 'resolved';
  stack?: string;
}

const INITIAL_ERRORS: ErrorLogItem[] = [
  {
    id: 'err-001',
    last_seen_at: '2026-11-15T12:14:02.000Z',
    source: 'client',
    level: 'WARN',
    method: 'HARDWARE',
    route: 'RS-232 / Scale COM3',
    message: 'Serial COM3 connection closed unexpectedly: Device disconnected or power off.',
    count: 3,
    request_id: 'req_8e2884dd11b02f9d',
    status: 'resolved',
    stack: 'Error: COM3 disconnected at SerialPort.onDisconnect (serial_worker.ts:42:15)\n    at emit (events.js:315:20)\n    at SerialPort._read (serialport.js:452:12)'
  },
  {
    id: 'err-002',
    last_seen_at: '2026-11-14T17:22:11.000Z',
    source: 'client',
    level: 'WARN',
    method: 'PRINTER',
    route: 'Zebra ZPL / ZD220',
    message: 'Zebra ZD220 head open warning: Tag roll re-aligned by operator.',
    count: 1,
    request_id: 'req_5693d171b92b0124',
    status: 'resolved',
    stack: 'PrinterWarning: HEAD_OPEN at ZebraDriver.statusCheck (zpl_spooler.ts:88:9)\n    at Spooler.pollStatus (spooler.ts:140:18)'
  },
  {
    id: 'err-003',
    last_seen_at: '2026-11-13T09:41:00.000Z',
    source: 'server',
    level: 'ERROR',
    method: 'POST',
    route: '/api/integrations/whatsapp/template',
    message: 'Cloud API Webhook HTTP 504 Gateway Timeout while posting template preview.',
    count: 2,
    request_id: 'req_8a26ec574d5da53b',
    status: 'new',
    stack: 'AxiosError: timeout of 10000ms exceeded at dispatchHttpRequest (http_client.ts:114:7)\n    at handleRequest (whatsapp_service.ts:56:19)'
  }
];

export const ErrorLogView: React.FC<{ onNavigate?: (mod: string) => void }> = () => {
  const [errors, setErrors] = useState<ErrorLogItem[]>(INITIAL_ERRORS);
  const [filterStatus, setFilterStatus] = useState<'new' | 'resolved' | ''>('new');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [activeStackModal, setActiveStackModal] = useState<ErrorLogItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const filteredErrors = useMemo(() => {
    return errors.filter(e => {
      if (filterStatus && e.status !== filterStatus) return false;
      return true;
    });
  }, [errors, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredErrors.length / pageSize));
  const pagedErrors = filteredErrors.slice((page - 1) * pageSize, page * pageSize);

  const handleResolve = (id: string | number) => {
    setErrors(prev => prev.map(e => e.id === id ? { ...e, status: 'resolved' } : e));
    showToast('Error marked as resolved');
  };

  const handleClearResolved = () => {
    if (confirm('Clear all resolved error logs?')) {
      setErrors(prev => prev.filter(e => e.status !== 'resolved'));
      showToast('Cleared resolved error logs');
    }
  };

  const handleDownloadDiagnostics = () => {
    const bundle = {
      generatedAt: new Date().toISOString(),
      shop: 'S.B Borana Jewellers',
      terminal: 'REG-2026-00001 (Counter MAIN)',
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        online: navigator.onLine
      },
      errorsSummary: {
        totalCaptured: errors.length,
        openCount: errors.filter(e => e.status === 'new').length,
        resolvedCount: errors.filter(e => e.status === 'resolved').length
      },
      errorsList: errors
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bundle, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `diagnostics_bundle_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    document.body.removeChild(dlAnchor);
    showToast('Diagnostics bundle downloaded');
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page" id="main">
      {toastMessage && (
        <div 
          className="kj-toast" 
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            padding: '10px 16px',
            background: 'var(--surface)',
            color: 'var(--text)',
            borderRadius: 8,
            boxShadow: 'var(--sh-md)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 600
          }}
        >
          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="16" width="16" style={{ color: 'var(--primary)' }}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Error Log</h1>
          <p>Problems the app ran into in this shop. Send the reference to Kreya support if something keeps failing.</p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn btn-outline" onClick={handleClearResolved}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="14" width="14" style={{ marginRight: 6 }}>
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Clear Error Logs
          </button>
          <button type="button" className="btn btn-primary" onClick={handleDownloadDiagnostics}>
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="14" width="14" style={{ marginRight: 6 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Diagnostics Bundle
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="search-row">
        <div className="seg">
          {[
            ['new', 'Open'],
            ['resolved', 'Resolved'],
            ['', 'All']
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              className={filterStatus === val ? 'on' : ''}
              onClick={() => {
                setFilterStatus(val as any);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Last seen</th>
                <th>Where</th>
                <th>Message</th>
                <th className="num">Times</th>
                <th>Reference</th>
                <th className="num"></th>
              </tr>
            </thead>
            <tbody>
              {pagedErrors.map(err => {
                const sourceBadgeClass = err.source === 'client' 
                  ? 'badge-blue' 
                  : err.source === 'fatal' 
                    ? 'badge-red' 
                    : 'badge-orange';

                return (
                  <tr key={err.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {formatTimestamp(err.last_seen_at)}
                    </td>
                    <td>
                      <span className={`badge ${sourceBadgeClass}`}>
                        {err.source}
                      </span>
                      <div className="mono helper" style={{ marginTop: 2 }}>
                        {err.method} {err.route}
                      </div>
                    </td>
                    <td style={{ maxWidth: 420 }}>
                      <span 
                        style={{ cursor: err.stack ? 'pointer' : 'default', textDecoration: err.stack ? 'underline dotted' : 'none' }}
                        onClick={() => err.stack && setActiveStackModal(err)}
                        title={err.stack ? 'Click to inspect stack trace' : undefined}
                      >
                        {err.message}
                      </span>
                    </td>
                    <td className="num" style={{ fontWeight: 600 }}>
                      {err.count}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost mono"
                        onClick={() => {
                          if (err.request_id) {
                            navigator.clipboard?.writeText(err.request_id);
                            showToast('Copied');
                          }
                        }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="10" width="10">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        {err.request_id || '—'}
                      </button>
                    </td>
                    <td className="num">
                      {err.status !== 'resolved' && (
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => handleResolve(err.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="11" width="11">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Resolved
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {!pagedErrors.length && (
                <tr>
                  <td colSpan={6} className="empty" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--muted)' }}>
                    Nothing here — all good.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', padding: '16px 18px', flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
          <span className="helper" style={{ margin: 0 }}>
            {filteredErrors.length} errors
          </span>

          <select 
            className="input input-sm" 
            style={{ width: 'auto' }} 
            value={pageSize} 
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[50, 100, 500, 1000].map(sz => (
              <option key={sz} value={sz}>{sz} / page</option>
            ))}
          </select>

          <button 
            type="button" 
            className="btn btn-xs btn-outline" 
            disabled={page <= 1} 
            onClick={() => setPage(1)} 
            aria-label="First page"
          >
            «
          </button>
          <button 
            type="button" 
            className="btn btn-xs btn-outline" 
            disabled={page <= 1} 
            onClick={() => setPage(p => p - 1)} 
            aria-label="Previous page"
          >
            ‹
          </button>
          <span style={{ fontSize: 12.5 }}>
            Page {page} of {totalPages}
          </span>
          <button 
            type="button" 
            className="btn btn-xs btn-outline" 
            disabled={page >= totalPages} 
            onClick={() => setPage(p => p + 1)} 
            aria-label="Next page"
          >
            ›
          </button>
          <button 
            type="button" 
            className="btn btn-xs btn-outline" 
            disabled={page >= totalPages} 
            onClick={() => setPage(totalPages)} 
            aria-label="Last page"
          >
            »
          </button>
        </div>
      </div>

      {/* Stack Trace Modal */}
      {activeStackModal && (
        <div 
          className="overlay visible" 
          style={{ position: 'fixed', inset: 0, background: 'rgba(10, 8, 30, 0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setActiveStackModal(null)}
        >
          <div 
            className="modal card" 
            style={{ width: 620, maxWidth: '90vw', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="card-title">Error Stack Trace</span>
                <div className="helper" style={{ marginTop: 2 }}>
                  {activeStackModal.method} {activeStackModal.route} · Reference: {activeStackModal.request_id}
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm" 
                onClick={() => setActiveStackModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="card-body" style={{ overflowY: 'auto' }}>
              <div style={{ marginBottom: 12 }}>
                <strong>Message:</strong>
                <p style={{ marginTop: 4, color: 'var(--text)' }}>{activeStackModal.message}</p>
              </div>
              <div>
                <strong>Stack Trace:</strong>
                <pre className="mono" style={{ background: 'var(--surface2)', padding: 14, borderRadius: 8, fontSize: 11.5, lineHeight: 1.5, border: '1px solid var(--border)', marginTop: 6, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                  {activeStackModal.stack || 'No stack trace available.'}
                </pre>
              </div>
            </div>
            <div className="card-footer" style={{ padding: '16px 18px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
              <button 
                type="button" 
                className="btn btn-outline btn-sm" 
                onClick={() => {
                  navigator.clipboard?.writeText(activeStackModal.stack || activeStackModal.message);
                  showToast('Stack trace copied');
                }}
              >
                Copy Stack Trace
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-sm" 
                style={{ marginLeft: 8 }}
                onClick={() => setActiveStackModal(null)}
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

export default ErrorLogView;

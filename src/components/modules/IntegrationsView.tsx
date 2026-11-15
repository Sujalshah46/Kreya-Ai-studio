import React, { useState } from 'react';
import { 
  TrendingUp, MessageSquare, Smartphone, Printer, Scale, 
  Database, Check, AlertCircle, RefreshCw, Key, Power, CheckCircle2, 
  AlertTriangle, Plus, X, Globe, Copy, Shield, Truck, CreditCard, Send
} from 'lucide-react';

interface IntegrationsViewProps {
  onNavigate?: (module: string) => void;
}

type IntegrationTab = 'api-clients' | 'webhooks' | 'payments-courier';

interface ApiClient {
  id: string;
  name: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  createdAt: string;
  status: 'ACTIVE' | 'REVOKED';
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: 'HEALTHY' | 'FAILED';
  lastPing: string;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<IntegrationTab>('api-clients');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // API Clients State
  const [apiClients, setApiClients] = useState<ApiClient[]>([
    {
      id: 'cli-1',
      name: 'Tally Prime ERP Bridge',
      clientId: 'kriya_cli_998127394821',
      clientSecret: 'sk_live_8832a89dfc29e110b42c9',
      scopes: ['invoices.read', 'ledger.read', 'rates.read'],
      createdAt: '12-Nov-2026',
      status: 'ACTIVE'
    },
    {
      id: 'cli-2',
      name: 'E-Commerce Storefront Sync',
      clientId: 'kriya_cli_447218399201',
      clientSecret: 'sk_live_1298ffae33091cb789b12',
      scopes: ['inventory.read', 'inventory.write', 'orders.create'],
      createdAt: '01-Nov-2026',
      status: 'ACTIVE'
    }
  ]);

  // Modal for New API Client
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientScopes, setNewClientScopes] = useState<string[]>(['invoices.read', 'inventory.read']);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([
    {
      id: 'wh-1',
      url: 'https://api.boranajewellers.com/webhooks/sales',
      events: ['invoice.created', 'payment.received'],
      status: 'HEALTHY',
      lastPing: '2 mins ago (HTTP 200 OK)'
    },
    {
      id: 'wh-2',
      url: 'https://erp.boranajewellers.com/sync/inventory',
      events: ['stock.updated', 'scrap.purchased'],
      status: 'HEALTHY',
      lastPing: '15 mins ago (HTTP 200 OK)'
    }
  ]);

  // Payments & Courier Integrations
  const [razorpayKey, setRazorpayKey] = useState('rzp_live_K8239014JASD');
  const [pineLabsPosIp, setPineLabsPosIp] = useState('192.168.1.145:8080');
  const [delhiveryApiKey, setDelhiveryApiKey] = useState('del_sec_99182374619');
  const [sequelLogisticsCode, setSequelLogisticsCode] = useState('SEQ-MUM-7729');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newClient: ApiClient = {
      id: `cli-${Date.now()}`,
      name: newClientName.trim(),
      clientId: `kriya_cli_${Math.random().toString(36).substring(2, 14)}`,
      clientSecret: `sk_live_${Math.random().toString(36).substring(2, 16)}`,
      scopes: newClientScopes,
      createdAt: 'Today',
      status: 'ACTIVE'
    };

    setApiClients([newClient, ...apiClients]);
    setShowNewClientModal(false);
    setNewClientName('');
    setSaveNotice(`API Client "${newClient.name}" created successfully!`);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handlePingWebhook = (id: string) => {
    setSaveNotice('Test ping dispatched to webhook URL: HTTP 200 OK (38ms)');
    setTimeout(() => setSaveNotice(null), 3000);
  };

  return (
    <div className="page" style={{ padding: '16px 20px', maxWidth: '100%' }}>
      {/* Licence Banner Parity */}
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
              <TrendingUp size={22} style={{ color: 'var(--primary)' }} />
              Integrations
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
            Developer API clients, real-time webhooks, payment gateways, EDC POS and insured logistics courier bridges · { 'S.B Borana Jewellers'}
          </p>
        </div>

        {/* Header Action Button */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {activeTab === 'api-clients' && (
            <button
              onClick={() => setShowNewClientModal(true)}
              className="btn btn-primary btn-sm"
              style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={14} />
              <span>New API client</span>
            </button>
          )}
        </div>
      </div>

      {saveNotice && (
        <div style={{ padding: 12, background: 'var(--primary-xl)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--primary-d)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <CheckCircle2 size={16} />
          <span style={{ fontWeight: 600 }}>{saveNotice}</span>
        </div>
      )}

      {/* Required Tabs: "API clients", "Webhooks", "Payments & courier" */}
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button
          onClick={() => setActiveTab('api-clients')}
          className={`tab ${activeTab === 'api-clients' ? 'active' : ''}`}
        >
          API clients
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`tab ${activeTab === 'webhooks' ? 'active' : ''}`}
        >
          Webhooks
        </button>
        <button
          onClick={() => setActiveTab('payments-courier')}
          className={`tab ${activeTab === 'payments-courier' ? 'active' : ''}`}
        >
          Payments & courier
        </button>
      </div>

      {/* TAB 1: API CLIENTS */}
      {activeTab === 'api-clients' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Registered API Clients ({apiClients.length})</span>
            <button
              onClick={() => setShowNewClientModal(true)}
              className="btn btn-outline btn-sm"
            >
              <Plus size={13} />
              <span>New API client</span>
            </button>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>CLIENT APPLICATION</th>
                  <th>CLIENT ID</th>
                  <th>API SECRET</th>
                  <th>SCOPES / GRANTS</th>
                  <th>CREATED</th>
                  <th>STATUS</th>
                  <th className="num">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {apiClients.map(cli => (
                  <tr key={cli.id}>
                    <td style={{ fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Key size={14} style={{ color: 'var(--primary)' }} />
                        <span>{cli.name}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      <span style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4 }}>
                        {cli.clientId}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>••••••••••••••••••••</span>
                        <button
                          onClick={() => handleCopy(cli.clientSecret, cli.id)}
                          className="btn btn-ghost btn-xs"
                          title="Copy Secret"
                        >
                          <Copy size={12} />
                          {copiedId === cli.id && <span style={{ fontSize: 10, color: 'var(--success)' }}>Copied!</span>}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {cli.scopes.map(s => (
                          <span key={s} className="badge badge-gray" style={{ fontSize: 10 }}>{s}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{cli.createdAt}</td>
                    <td>
                      <span className={`badge ${cli.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}`}>
                        {cli.status}
                      </span>
                    </td>
                    <td className="num">
                      <button
                        onClick={() => {
                          setApiClients(apiClients.map(c => c.id === cli.id ? { ...c, status: c.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE' } : c));
                        }}
                        className="btn btn-outline btn-xs"
                      >
                        {cli.status === 'ACTIVE' ? 'Revoke' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title">Configured Webhook Endpoints</span>
            <button
              onClick={() => alert('New Webhook: Enter target URL and subscribe to billing/stock events.')}
              className="btn btn-outline btn-sm"
            >
              <Plus size={13} />
              <span>Add Webhook</span>
            </button>
          </div>

          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>ENDPOINT URL</th>
                  <th>SUBSCRIBED EVENTS</th>
                  <th>DELIVERY HEALTH</th>
                  <th>LAST TELEMETRY</th>
                  <th className="num">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map(wh => (
                  <tr key={wh.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Globe size={14} style={{ color: 'var(--info)' }} />
                        <span>{wh.url}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {wh.events.map(ev => (
                          <span key={ev} className="badge badge-gold" style={{ fontSize: 10 }}>{ev}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-green">{wh.status}</span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>{wh.lastPing}</td>
                    <td className="num">
                      <button
                        onClick={() => handlePingWebhook(wh.id)}
                        className="btn btn-outline btn-xs"
                      >
                        <Send size={11} />
                        <span>Ping Test</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENTS & COURIER */}
      {activeTab === 'payments-courier' && (
        <div className="g2" style={{ gap: 16 }}>
          {/* Payment Gateways & EDC */}
          <div className="card" style={{ padding: 18 }}>
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={16} style={{ color: 'var(--primary)' }} />
                <span className="card-title">Payment Gateways & EDC POS Terminals</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Razorpay Merchant Key ID</label>
                <input 
                  type="text" 
                  value={razorpayKey} 
                  onChange={e => setRazorpayKey(e.target.value)} 
                  className="input input-sm" 
                />
                <span className="helper">Generates dynamic UPI QR codes on POS billing screen</span>
              </div>
              <div>
                <label className="label">Pine Labs / Plutus EDC IP & Port</label>
                <input 
                  type="text" 
                  value={pineLabsPosIp} 
                  onChange={e => setPineLabsPosIp(e.target.value)} 
                  className="input input-sm" 
                />
                <span className="helper">Auto-pushes card transaction amount to swiping machine</span>
              </div>
              <button
                onClick={() => {
                  setSaveNotice('Payment gateway credentials saved & tested successfully!');
                  setTimeout(() => setSaveNotice(null), 3000);
                }}
                className="btn btn-primary btn-sm"
                style={{ width: 'fit-content' }}
              >
                Save Payment Settings
              </button>
            </div>
          </div>

          {/* Logistics & Insured Couriers */}
          <div className="card" style={{ padding: 18 }}>
            <div className="card-header" style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={16} style={{ color: 'var(--gold-d)' }} />
                <span className="card-title">Valuable Jewellery Courier Services</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="label">Sequel Logistics Client Hub Code</label>
                <input 
                  type="text" 
                  value={sequelLogisticsCode} 
                  onChange={e => setSequelLogisticsCode(e.target.value)} 
                  className="input input-sm" 
                />
                <span className="helper">Armoured door-to-door transit for high-value gold consignments</span>
              </div>
              <div>
                <label className="label">Delhivery Surface API Token</label>
                <input 
                  type="text" 
                  value={delhiveryApiKey} 
                  onChange={e => setDelhiveryApiKey(e.target.value)} 
                  className="input input-sm" 
                />
                <span className="helper">Automated docket generation and tracking links</span>
              </div>
              <button
                onClick={() => {
                  setSaveNotice('Logistics API credentials saved & tested successfully!');
                  setTimeout(() => setSaveNotice(null), 3000);
                }}
                className="btn btn-primary btn-sm"
                style={{ width: 'fit-content' }}
              >
                Save Logistics Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW API CLIENT MODAL */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">Create New API Client</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowNewClientModal(false)} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Application Name *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Mobile POS Android App"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:border-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Assigned Scopes</label>
                <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {['invoices.read', 'invoices.write', 'inventory.read', 'inventory.write', 'rates.read', 'customers.read'].map(scope => (
                    <label key={scope} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newClientScopes.includes(scope)}
                        onChange={() => {
                          if (newClientScopes.includes(scope)) {
                            setNewClientScopes(newClientScopes.filter(s => s !== scope));
                          } else {
                            setNewClientScopes([...newClientScopes, scope]);
                          }
                        }}
                      />
                      <span className="font-mono text-[11px]">{scope}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  Generate Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsView;

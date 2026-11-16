import React, { useState } from 'react';
import { 
  Plus, ExternalLink, Copy, Check, KeyRound, RefreshCw, Trash2, 
  CheckCircle2, AlertTriangle, ShieldCheck, Cpu, Smartphone, 
  Send, Mail, Printer, Scale, FileCode, CheckCircle, X
} from 'lucide-react';

interface IntegrationsViewProps {
  onNavigate?: (module: string) => void;
}

interface ApiClient {
  id: string;
  name: string;
  client_id: string;
  status: 'active' | 'revoked';
  scopes: string[];
  rate_per_min: number;
  ip_allowlist: string[];
  last_used_at: string;
  keys: Array<{
    id: string;
    prefix: string;
    createdAt: string;
    lastUsedAt?: string;
    revokedAt?: string;
  }>;
}

interface WebhookItem {
  id: string;
  url: string;
  description: string;
  events: string[];
  status: 'active' | 'disabled';
  createdAt: string;
  lastDelivery?: {
    status: number;
    at: string;
  };
}

const ALL_SCOPES = [
  'customers:read', 'customers:write', 'inventory:read', 'inventory:write',
  'rates:read', 'rates:write', 'sales:read', 'sales:write',
  'payments:read', 'payments:write', 'repairs:read', 'repairs:write',
  'bookings:read', 'loans:read', 'shipments:read', 'shipments:write',
  'files:write', 'suppliers:read', 'reports:read'
];

const WEBHOOK_EVENTS = [
  'order.created', 'order.paid', 'payment.received', 'customer.created',
  'inventory.updated', 'rate.updated', 'loan.created', 'repair.updated'
];

export const IntegrationsView: React.FC<IntegrationsViewProps> = () => {
  const [activeTab, setActiveTab] = useState<
    'api' | 'hooks' | 'providers' | 'hardware' | 'communications' | 'accounting'
  >('api');
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedText(text);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedText(null), 2000);
  };

  // API Clients State
  const [clients, setClients] = useState<ApiClient[]>([
    {
      id: 'cli-01',
      name: 'E-Commerce Website & App',
      client_id: 'kj_cli_sbj_online_store',
      status: 'active',
      scopes: ['customers:read', 'inventory:read', 'rates:read', 'sales:write', 'payments:write'],
      rate_per_min: 120,
      ip_allowlist: ['103.21.244.0/24'],
      last_used_at: '16 Nov 2026, 01:15 pm',
      keys: [
        {
          id: 'k-01',
          prefix: '8fa9',
          createdAt: '12 Nov 2026',
          lastUsedAt: '16 Nov 2026, 01:15 pm'
        }
      ]
    },
    {
      id: 'cli-02',
      name: 'Tally Prime Sync Service',
      client_id: 'kj_cli_tally_bridge_99',
      status: 'active',
      scopes: ['sales:read', 'payments:read', 'suppliers:read', 'reports:read'],
      rate_per_min: 60,
      ip_allowlist: [],
      last_used_at: '16 Nov 2026, 11:30 am',
      keys: [
        {
          id: 'k-02',
          prefix: '21bc',
          createdAt: '01 Nov 2026',
          lastUsedAt: '16 Nov 2026, 11:30 am'
        }
      ]
    }
  ]);

  // Modal: New / Edit API Client
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ApiClient | null>(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    scopes: [] as string[],
    ip: '',
    rate: 120
  });

  // Modal: Copy Newly Created Credentials
  const [newCreds, setNewCreds] = useState<Array<[string, string]> | null>(null);

  // Webhooks State
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([
    {
      id: 'wh-01',
      url: 'https://api.jewellerystore.in/webhooks/orders',
      description: 'Order fulfillment trigger for courier dispatch',
      events: ['order.paid', 'shipments:write'],
      status: 'active',
      createdAt: '10 Nov 2026',
      lastDelivery: { status: 200, at: '16 Nov 2026, 12:40 pm' }
    }
  ]);
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookForm, setWebhookForm] = useState({
    url: 'https://',
    description: '',
    events: ['*'] as string[]
  });
  const [deliveriesModalHook, setDeliveriesModalHook] = useState<WebhookItem | null>(null);

  // Payments & Courier State
  const [razorpay, setRazorpay] = useState({
    configured: true,
    mode: 'live',
    keyId: 'rzp_live_sbj98124097',
    keySecret: '••••••••••••••••••••••••',
    webhookSecret: 'whsec_908123491823',
    webhookPath: '/api/v1/integrations/webhooks/razorpay'
  });

  const [shiprocket, setShiprocket] = useState({
    configured: true,
    email: 'logistics@jewellerystore.in',
    password: '••••••••••••••••',
    pickupLocation: 'S.B Borana Jewellers Showroom',
    webhookToken: 'tk_912830192830129',
    webhookPath: '/api/v1/integrations/webhooks/shiprocket'
  });

  // Hardware State
  const [scaleConfig, setScaleConfig] = useState({
    enabled: true,
    port: 'COM3',
    baudRate: '9600',
    dataBits: '8',
    parity: 'None',
    stopBits: '1',
    mode: 'continuous',
    currentWeight: '14.280 g'
  });
  const [scaleReading, setScaleReading] = useState(false);

  const [printerConfig, setPrinterConfig] = useState({
    enabled: true,
    model: 'Zebra ZD410 (203 dpi)',
    connection: 'Zebra Browser Print (Localhost:9100)',
    labelFormat: 'Jewellery Dumbbell Tag (70mm x 12mm)',
    barcodeType: 'Code 128 / QR Code',
    darkness: '18'
  });
  const [printingTestTag, setPrintingTestTag] = useState(false);

  // Communications & SMS State
  const [smsGateway, setSmsGateway] = useState<'msg91' | 'twilio'>('msg91');
  const [msg91Config, setMsg91Config] = useState({
    authKey: '381940Afj81920491823',
    senderId: 'SBJJEW',
    dltEntityId: '1201159827394820',
    orderTemplateId: '1207161829304918'
  });
  const [twilioConfig, setTwilioConfig] = useState({
    accountSid: 'AC981249018230912830918',
    authToken: '••••••••••••••••••••••••',
    fromNumber: '+19827301923'
  });

  const [whatsappGateway, setWhatsappGateway] = useState<'wati' | 'interakt'>('wati');
  const [watiConfig, setWatiConfig] = useState({
    endpointUrl: 'https://live-server-wati.wati.io/309182',
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.••••••••',
    broadcastBillReceipt: true,
    broadcastSchemeReminder: true
  });
  const [interaktConfig, setInteraktConfig] = useState({
    apiKey: 'ak_live_interakt_9081239018',
    webhookUrl: 'https://api.interakt.ai/v1/callback'
  });

  const [smtpConfig, setSmtpConfig] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    username: 'sbjrahul01@gmail.com',
    password: '••••••••••••',
    fromName: 'S.B Borana Jewellers',
    fromEmail: 'noreply@sbborana.com',
    ssl: true
  });

  // Accounting State
  const [tallyConfig, setTallyConfig] = useState({
    companyName: 'S.B Borana Jewellers (2026-2027)',
    salesLedger: 'Jewellery Sales (GST 3%)',
    makingLedger: 'Making Charges Income (GST 5%)',
    cashLedger: 'Showroom Cash Box',
    bankLedger: 'HDFC Current A/c - 50200049281729',
    autoExportOnBill: true
  });

  const [upiQrConfig, setUpiQrConfig] = useState({
    merchantVpa: 'sbj@hdfcbank',
    merchantName: 'S.B Borana Jewellers',
    soundboxProvider: 'BharatPe Dynamic Soundbox',
    autoVerifyOnScreen: true
  });

  // Handlers
  const handleOpenClientModal = (client?: ApiClient) => {
    if (client) {
      setEditingClient(client);
      setClientForm({
        name: client.name,
        scopes: client.scopes,
        ip: client.ip_allowlist.join(', '),
        rate: client.rate_per_min
      });
    } else {
      setEditingClient(null);
      setClientForm({
        name: '',
        scopes: ['customers:read', 'sales:read', 'inventory:read'],
        ip: '',
        rate: 120
      });
    }
    setShowClientModal(true);
  };

  const handleSaveClient = () => {
    if (!clientForm.name.trim() || !clientForm.scopes.length) return;
    if (editingClient) {
      setClients(prev => prev.map(c => c.id === editingClient.id ? {
        ...c,
        name: clientForm.name,
        scopes: clientForm.scopes,
        ip_allowlist: clientForm.ip.split(/[\s,]+/).filter(Boolean),
        rate_per_min: Number(clientForm.rate)
      } : c));
      showToast(`Updated API client "${clientForm.name}"`);
    } else {
      const newId = `cli-${Date.now()}`;
      const newClientId = `kj_cli_${clientForm.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.floor(Math.random() * 1000)}`;
      const newKey = `kj_live_${Math.random().toString(36).substring(2, 6)}_${Math.random().toString(36).substring(2, 18)}`;
      const newSecret = `kj_sec_${Math.random().toString(36).substring(2, 26)}`;

      const created: ApiClient = {
        id: newId,
        name: clientForm.name,
        client_id: newClientId,
        status: 'active',
        scopes: clientForm.scopes,
        rate_per_min: Number(clientForm.rate),
        ip_allowlist: clientForm.ip.split(/[\s,]+/).filter(Boolean),
        last_used_at: '—',
        keys: [
          {
            id: `k-${Date.now()}`,
            prefix: newKey.split('_')[2],
            createdAt: 'Today'
          }
        ]
      };
      setClients(prev => [created, ...prev]);
      setNewCreds([
        ['Client ID', newClientId],
        ['Client secret', newSecret],
        ['API key', newKey]
      ]);
      showToast(`Created API client "${created.name}"`);
    }
    setShowClientModal(false);
  };

  const handleRevokeClient = (clientId: string) => {
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, status: 'revoked' } : c));
    showToast('API client revoked');
  };

  const handleCreateKey = (client: ApiClient) => {
    const newKey = `kj_live_${Math.random().toString(36).substring(2, 6)}_${Math.random().toString(36).substring(2, 18)}`;
    const newSecret = `kj_sec_${Math.random().toString(36).substring(2, 26)}`;
    setClients(prev => prev.map(c => c.id === client.id ? {
      ...c,
      keys: [
        {
          id: `k-${Date.now()}`,
          prefix: newKey.split('_')[2],
          createdAt: 'Just now'
        },
        ...c.keys
      ]
    } : c));
    setNewCreds([
      ['API key', newKey],
      ['Client secret', newSecret]
    ]);
    showToast(`Issued new key for ${client.name}`);
  };

  const handleReadScaleWeight = () => {
    setScaleReading(true);
    setTimeout(() => {
      setScaleReading(false);
      const simulatedGrams = (10 + Math.random() * 30).toFixed(3);
      setScaleConfig(prev => ({ ...prev, currentWeight: `${simulatedGrams} g` }));
      showToast(`Weight captured from RS232 scale: ${simulatedGrams} g`);
    }, 500);
  };

  const handlePrintTestTag = () => {
    setPrintingTestTag(true);
    setTimeout(() => {
      setPrintingTestTag(false);
      showToast('Zebra ZPL dumbbell tag printed successfully via Browser Print!');
    }, 600);
  };

  return (
    <div>
      {/* 1. Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Integrations</h1>
          <p>Connect your website, accounting software, payment gateway and courier. Secrets are encrypted and never shown again.</p>
        </div>
      </div>

      {toastMessage && (
        <div className="card" style={{ marginBottom: 14, background: '#ecfdf5', borderColor: '#10b981', color: '#065f46', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}>✕</button>
        </div>
      )}

      {/* 2. Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button type="button" className={`tab ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')}>
          API clients
        </button>
        <button type="button" className={`tab ${activeTab === 'hooks' ? 'active' : ''}`} onClick={() => setActiveTab('hooks')}>
          Webhooks
        </button>
        <button type="button" className={`tab ${activeTab === 'providers' ? 'active' : ''}`} onClick={() => setActiveTab('providers')}>
          Payments &amp; courier
        </button>
        <button type="button" className={`tab ${activeTab === 'hardware' ? 'active' : ''}`} onClick={() => setActiveTab('hardware')}>
          Hardware &amp; Devices
        </button>
        <button type="button" className={`tab ${activeTab === 'communications' ? 'active' : ''}`} onClick={() => setActiveTab('communications')}>
          Communications &amp; SMS
        </button>
        <button type="button" className={`tab ${activeTab === 'accounting' ? 'active' : ''}`} onClick={() => setActiveTab('accounting')}>
          Accounting &amp; Tally
        </button>
      </div>

      {/* TAB 1: API Clients */}
      {activeTab === 'api' && (
        <div>
          <div className="btn-group" style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-primary" onClick={() => handleOpenClientModal()}>
              <Plus size={14} /> New API client
            </button>
            <a className="btn btn-outline" href="/api/v1/docs" target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> API documentation
            </a>
          </div>

          {clients.map(c => (
            <div key={c.id} className="card" style={{ marginBottom: 12 }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong>{c.name}</strong>
                    <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="helper mono" style={{ fontSize: 11.5, marginTop: 3 }}>
                    {c.client_id} · {c.scopes.join(', ')} · {c.rate_per_min}/min
                    {c.last_used_at !== '—' && ` · last used ${c.last_used_at}`}
                  </div>
                </div>

                {c.status === 'active' && (
                  <div className="btn-group" style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => handleOpenClientModal(c)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => handleCreateKey(c)}>
                      <KeyRound size={12} /> New key
                    </button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => handleCreateKey(c)}>
                      <RefreshCw size={12} /> New secret
                    </button>
                    <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => handleRevokeClient(c.id)}>
                      Revoke
                    </button>
                  </div>
                )}
              </div>

              <div className="card-body" style={{ padding: '10px 16px' }}>
                {c.keys.map(k => (
                  <div key={k.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="mono" style={{ fontSize: 12 }}>
                      kj_live_{k.prefix}_••••••••••••••••••••
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className="helper" style={{ fontSize: 11 }}>
                        created {k.createdAt} {k.lastUsedAt && `· used ${k.lastUsedAt}`}
                      </span>
                      {k.revokedAt ? (
                        <span className="badge badge-red">revoked</span>
                      ) : (
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => showToast('Key revoked')}>
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!clients.length && (
            <p className="helper">No API clients yet. Create one for your website, app or accounting software.</p>
          )}
        </div>
      )}

      {/* TAB 2: Webhooks */}
      {activeTab === 'hooks' && (
        <div>
          <div className="btn-group" style={{ marginBottom: 14 }}>
            <button type="button" className="btn btn-primary" onClick={() => setShowWebhookModal(true)}>
              <Plus size={14} /> New webhook
            </button>
          </div>

          <div className="alert alert-info" style={{ marginBottom: 14, fontSize: 12.5 }}>
            Each call is signed: header <span className="mono">X-KJ-Signature: t=…,v1=…</span> = HMAC-SHA256 of t.body with your webhook secret. Failed calls retry for a day; 20 failures in a row disable the webhook.
          </div>

          {webhooks.map(w => (
            <div key={w.id} className="card" style={{ marginBottom: 12 }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong className="mono">{w.url}</strong>
                    <span className="badge badge-green">{w.status}</span>
                  </div>
                  <div className="helper" style={{ fontSize: 12, marginTop: 4 }}>
                    {w.description} · events: {w.events.join(', ')}
                  </div>
                </div>

                <div className="btn-group" style={{ display: 'flex', gap: 6 }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setDeliveriesModalHook(w)}>
                    Deliveries
                  </button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => showToast('Test ping dispatched HTTP 200 OK')}>
                    Test Ping
                  </button>
                  <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => {
                    setWebhooks(prev => prev.filter(x => x.id !== w.id));
                    showToast('Webhook removed');
                  }}>
                    Delete
                  </button>
                </div>
              </div>

              {w.lastDelivery && (
                <div className="card-body" style={{ padding: '8px 16px', fontSize: 12, color: 'var(--muted)' }}>
                  Last delivery: <span className="badge badge-green" style={{ fontSize: 10 }}>HTTP {w.lastDelivery.status}</span> at {w.lastDelivery.at}
                </div>
              )}
            </div>
          ))}

          {!webhooks.length && (
            <p className="helper">No webhooks yet.</p>
          )}
        </div>
      )}

      {/* TAB 3: Payments & Courier */}
      {activeTab === 'providers' && (
        <div className="g2">
          {/* Razorpay */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Razorpay — payment links</strong>
              {razorpay.configured && <span className="badge badge-green">connected</span>}
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="label">Mode</label>
                <select 
                  className="input" 
                  value={razorpay.mode} 
                  onChange={(e) => setRazorpay({ ...razorpay, mode: e.target.value })}
                >
                  <option value="test">Test</option>
                  <option value="live">Live</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Key ID *</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={razorpay.keyId} 
                  onChange={(e) => setRazorpay({ ...razorpay, keyId: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Key secret *</label>
                <input 
                  type="password" 
                  className="input mono" 
                  value={razorpay.keySecret} 
                  onChange={(e) => setRazorpay({ ...razorpay, keySecret: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Webhook secret</label>
                <input 
                  type="password" 
                  className="input mono" 
                  value={razorpay.webhookSecret} 
                  onChange={(e) => setRazorpay({ ...razorpay, webhookSecret: e.target.value })} 
                />
                <div className="helper">Set the same secret in the Razorpay dashboard</div>
              </div>

              <div className="form-group">
                <label className="label">Webhook URL</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input 
                    type="text" 
                    readOnly 
                    className="input mono" 
                    value={`${window.location.origin}${razorpay.webhookPath}`} 
                  />
                  <button type="button" className="btn btn-outline" onClick={() => handleCopy(`${window.location.origin}${razorpay.webhookPath}`)}>
                    <Copy size={13} />
                  </button>
                </div>
                <div className="helper">Events: payment_link.paid, payment.captured, refund.processed</div>
              </div>

              <div className="btn-group" style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button type="button" className="btn btn-primary" onClick={() => showToast('Razorpay settings saved (encrypted)')}>
                  Save
                </button>
                {razorpay.configured && (
                  <button type="button" className="btn btn-danger-outline" onClick={() => {
                    setRazorpay({ ...razorpay, configured: false, keyId: '', keySecret: '' });
                    showToast('Razorpay disconnected');
                  }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Shiprocket */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Shiprocket — courier</strong>
              {shiprocket.configured && <span className="badge badge-green">connected</span>}
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="label">API user email *</label>
                <input 
                  type="email" 
                  className="input" 
                  value={shiprocket.email} 
                  onChange={(e) => setShiprocket({ ...shiprocket, email: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="label">API user password *</label>
                <input 
                  type="password" 
                  className="input mono" 
                  value={shiprocket.password} 
                  onChange={(e) => setShiprocket({ ...shiprocket, password: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Pickup location name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={shiprocket.pickupLocation} 
                  onChange={(e) => setShiprocket({ ...shiprocket, pickupLocation: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Webhook token</label>
                <input 
                  type="password" 
                  className="input mono" 
                  value={shiprocket.webhookToken} 
                  onChange={(e) => setShiprocket({ ...shiprocket, webhookToken: e.target.value })} 
                />
                <div className="helper">Shiprocket sends it as x-api-key</div>
              </div>

              <div className="form-group">
                <label className="label">Tracking webhook URL</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input 
                    type="text" 
                    readOnly 
                    className="input mono" 
                    value={`${window.location.origin}${shiprocket.webhookPath}`} 
                  />
                  <button type="button" className="btn btn-outline" onClick={() => handleCopy(`${window.location.origin}${shiprocket.webhookPath}`)}>
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              <div className="btn-group" style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button type="button" className="btn btn-primary" onClick={() => showToast('Shiprocket courier settings saved (encrypted)')}>
                  Save
                </button>
                {shiprocket.configured && (
                  <button type="button" className="btn btn-danger-outline" onClick={() => {
                    setShiprocket({ ...shiprocket, configured: false, email: '', password: '' });
                    showToast('Shiprocket disconnected');
                  }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Hardware & Devices */}
      {activeTab === 'hardware' && (
        <div className="g2">
          {/* Weighing Scale */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Scale size={16} style={{ color: 'var(--primary)' }} />
                <strong>Weighing Scale (RS232 / USB Serial COM)</strong>
              </div>
              <span className="badge badge-green">Connected ({scaleConfig.baudRate} baud)</span>
            </div>
            <div className="card-body">
              <div className="g2">
                <div className="form-group">
                  <label className="label">Serial COM Port</label>
                  <select 
                    className="input" 
                    value={scaleConfig.port} 
                    onChange={(e) => setScaleConfig({ ...scaleConfig, port: e.target.value })}
                  >
                    <option value="COM1">COM1 (Standard Serial)</option>
                    <option value="COM2">COM2</option>
                    <option value="COM3">COM3 (USB-to-RS232 FTDI)</option>
                    <option value="COM4">COM4</option>
                    <option value="ttyUSB0">/dev/ttyUSB0 (Linux/Mac)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Baud Rate</label>
                  <select 
                    className="input" 
                    value={scaleConfig.baudRate} 
                    onChange={(e) => setScaleConfig({ ...scaleConfig, baudRate: e.target.value })}
                  >
                    <option value="4800">4800</option>
                    <option value="9600">9600 (Standard Jeweller Spec)</option>
                    <option value="19200">19200</option>
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--zebra)', padding: 14, borderRadius: 8, margin: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>LIVE SCALE WEIGHT</div>
                  <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>
                    {scaleConfig.currentWeight}
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={handleReadScaleWeight}
                  disabled={scaleReading}
                >
                  <RefreshCw size={13} className={scaleReading ? 'animate-spin' : ''} />
                  <span>{scaleReading ? 'Reading…' : 'Read Scale Now'}</span>
                </button>
              </div>

              <div className="helper">
                Works with Sartorius, Essae, Contech, CAS and A&amp;D gold precision balances (3 decimal digits).
              </div>
            </div>
          </div>

          {/* Zebra Tag Printer */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Printer size={16} style={{ color: 'var(--primary)' }} />
                <strong>Zebra Barcode &amp; Tag Printer</strong>
              </div>
              <span className="badge badge-green">Browser Print Active</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="label">Printer Hardware Model</label>
                <input 
                  type="text" 
                  className="input" 
                  value={printerConfig.model} 
                  onChange={(e) => setPrinterConfig({ ...printerConfig, model: e.target.value })} 
                />
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">Label Layout Spec</label>
                  <select 
                    className="input" 
                    value={printerConfig.labelFormat} 
                    onChange={(e) => setPrinterConfig({ ...printerConfig, labelFormat: e.target.value })}
                  >
                    <option value="Jewellery Dumbbell Tag (70mm x 12mm)">Jewellery Dumbbell Tag (70mm x 12mm)</option>
                    <option value="Butterfly Tail Tag (50mm x 15mm)">Butterfly Tail Tag (50mm x 15mm)</option>
                    <option value="Standard Retail Label (50mm x 25mm)">Standard Retail Label (50mm x 25mm)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Barcode Protocol</label>
                  <select 
                    className="input" 
                    value={printerConfig.barcodeType} 
                    onChange={(e) => setPrinterConfig({ ...printerConfig, barcodeType: e.target.value })}
                  >
                    <option value="Code 128 / QR Code">Code 128 + 2D QR Code</option>
                    <option value="Code 39">Code 39</option>
                    <option value="EAN-13">EAN-13</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={handlePrintTestTag}
                  disabled={printingTestTag}
                >
                  <Printer size={13} />
                  <span>{printingTestTag ? 'Sending ZPL…' : 'Print Sample Dumbbell Tag (SBJ)'}</span>
                </button>
              </div>

              <div className="helper" style={{ marginTop: 8 }}>
                Sends raw ZPL II commands directly through Zebra Browser Print WebSocket service on port 9100.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Communications & SMS */}
      {activeTab === 'communications' && (
        <div className="g2">
          {/* SMS Gateways */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Smartphone size={16} style={{ color: 'var(--primary)' }} />
                <strong>SMS Gateway (DLT Compliant)</strong>
              </div>
              <span className="badge badge-green">Ready</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="label">Active SMS Provider</label>
                <div style={{ display: 'flex', gap: 14 }}>
                  <label className="check">
                    <input 
                      type="radio" 
                      name="smsProvider" 
                      checked={smsGateway === 'msg91'} 
                      onChange={() => setSmsGateway('msg91')} 
                    />
                    {' '}Msg91 (India DLT Certified)
                  </label>
                  <label className="check">
                    <input 
                      type="radio" 
                      name="smsProvider" 
                      checked={smsGateway === 'twilio'} 
                      onChange={() => setSmsGateway('twilio')} 
                    />
                    {' '}Twilio (International)
                  </label>
                </div>
              </div>

              {smsGateway === 'msg91' && (
                <>
                  <div className="form-group">
                    <label className="label">Auth Key</label>
                    <input 
                      type="password" 
                      className="input mono" 
                      value={msg91Config.authKey} 
                      onChange={(e) => setMsg91Config({ ...msg91Config, authKey: e.target.value })} 
                    />
                  </div>
                  <div className="g2">
                    <div className="form-group">
                      <label className="label">DLT Sender ID (6 Chars)</label>
                      <input 
                        type="text" 
                        maxLength={6} 
                        className="input mono" 
                        value={msg91Config.senderId} 
                        onChange={(e) => setMsg91Config({ ...msg91Config, senderId: e.target.value.toUpperCase() })} 
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">DLT Principal Entity ID</label>
                      <input 
                        type="text" 
                        className="input mono" 
                        value={msg91Config.dltEntityId} 
                        onChange={(e) => setMsg91Config({ ...msg91Config, dltEntityId: e.target.value })} 
                      />
                    </div>
                  </div>
                </>
              )}

              {smsGateway === 'twilio' && (
                <>
                  <div className="form-group">
                    <label className="label">Account SID</label>
                    <input 
                      type="text" 
                      className="input mono" 
                      value={twilioConfig.accountSid} 
                      onChange={(e) => setTwilioConfig({ ...twilioConfig, accountSid: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Auth Token</label>
                    <input 
                      type="password" 
                      className="input mono" 
                      value={twilioConfig.authToken} 
                      onChange={(e) => setTwilioConfig({ ...twilioConfig, authToken: e.target.value })} 
                    />
                  </div>
                </>
              )}

              <div style={{ marginTop: 14 }}>
                <button type="button" className="btn btn-outline" onClick={() => showToast('Test SMS sent to showroom mobile')}>
                  <Send size={13} /> Send Test SMS
                </button>
              </div>
            </div>
          </div>

          {/* WhatsApp Cloud API */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={16} style={{ color: 'var(--primary)' }} />
                <strong>WhatsApp Business API</strong>
              </div>
              <span className="badge badge-green">Connected</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="label">WhatsApp BSP Provider</label>
                <div style={{ display: 'flex', gap: 14 }}>
                  <label className="check">
                    <input 
                      type="radio" 
                      name="waProvider" 
                      checked={whatsappGateway === 'wati'} 
                      onChange={() => setWhatsappGateway('wati')} 
                    />
                    {' '}WATI (Clare.ai)
                  </label>
                  <label className="check">
                    <input 
                      type="radio" 
                      name="waProvider" 
                      checked={whatsappGateway === 'interakt'} 
                      onChange={() => setWhatsappGateway('interakt')} 
                    />
                    {' '}Interakt (Jio Haptik)
                  </label>
                </div>
              </div>

              {whatsappGateway === 'wati' && (
                <>
                  <div className="form-group">
                    <label className="label">WATI API Endpoint URL</label>
                    <input 
                      type="text" 
                      className="input mono" 
                      value={watiConfig.endpointUrl} 
                      onChange={(e) => setWatiConfig({ ...watiConfig, endpointUrl: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">WATI Access Token</label>
                    <input 
                      type="password" 
                      className="input mono" 
                      value={watiConfig.accessToken} 
                      onChange={(e) => setWatiConfig({ ...watiConfig, accessToken: e.target.value })} 
                    />
                  </div>
                </>
              )}

              {whatsappGateway === 'interakt' && (
                <div className="form-group">
                  <label className="label">Interakt API Key</label>
                  <input 
                    type="password" 
                    className="input mono" 
                    value={interaktConfig.apiKey} 
                    onChange={(e) => setInteraktConfig({ ...interaktConfig, apiKey: e.target.value })} 
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', margin: '14px 0' }}>
                <label className="check">
                  <input 
                    type="checkbox" 
                    checked={watiConfig.broadcastBillReceipt} 
                    onChange={(e) => setWatiConfig({ ...watiConfig, broadcastBillReceipt: e.target.checked })} 
                  />
                  {' '}Auto-send PDF Tax Invoice on billing
                </label>
                <label className="check">
                  <input 
                    type="checkbox" 
                    checked={watiConfig.broadcastSchemeReminder} 
                    onChange={(e) => setWatiConfig({ ...watiConfig, broadcastSchemeReminder: e.target.checked })} 
                  />
                  {' '}Auto-send Monthly Scheme payment reminder
                </label>
              </div>

              <button type="button" className="btn btn-outline" onClick={() => showToast('Test WhatsApp template dispatched to owner number')}>
                <Send size={13} /> Send WhatsApp Test Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: Accounting & Tally */}
      {activeTab === 'accounting' && (
        <div className="g2">
          {/* Tally Prime */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FileCode size={16} style={{ color: 'var(--primary)' }} />
                <strong>Tally Prime XML Export</strong>
              </div>
              <span className="badge badge-green">Ready</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="label">Tally Company Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={tallyConfig.companyName} 
                  onChange={(e) => setTallyConfig({ ...tallyConfig, companyName: e.target.value })} 
                />
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">Sales Ledger Name</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={tallyConfig.salesLedger} 
                    onChange={(e) => setTallyConfig({ ...tallyConfig, salesLedger: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="label">Making Charges Ledger</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={tallyConfig.makingLedger} 
                    onChange={(e) => setTallyConfig({ ...tallyConfig, makingLedger: e.target.value })} 
                  />
                </div>
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">Cash Counter Ledger</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={tallyConfig.cashLedger} 
                    onChange={(e) => setTallyConfig({ ...tallyConfig, cashLedger: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label className="label">Bank Account Ledger</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={tallyConfig.bankLedger} 
                    onChange={(e) => setTallyConfig({ ...tallyConfig, bankLedger: e.target.value })} 
                  />
                </div>
              </div>

              <div style={{ margin: '14px 0' }}>
                <label className="check">
                  <input 
                    type="checkbox" 
                    checked={tallyConfig.autoExportOnBill} 
                    onChange={(e) => setTallyConfig({ ...tallyConfig, autoExportOnBill: e.target.checked })} 
                  />
                  {' '}Auto-generate Tally XML on day-end register closure
                </label>
              </div>

              <button type="button" className="btn btn-primary" onClick={() => showToast('Downloaded Tally_Sales_Vouchers.xml')}>
                <FileCode size={13} /> Export All Vouchers to Tally XML
              </button>
            </div>
          </div>

          {/* Dynamic UPI QR */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Smartphone size={16} style={{ color: 'var(--primary)' }} />
                <strong>Counter Dynamic UPI QR Soundbox</strong>
              </div>
              <span className="badge badge-green">Active</span>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="label">Merchant VPA (UPI ID)</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={upiQrConfig.merchantVpa} 
                  onChange={(e) => setUpiQrConfig({ ...upiQrConfig, merchantVpa: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Registered Payee Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={upiQrConfig.merchantName} 
                  onChange={(e) => setUpiQrConfig({ ...upiQrConfig, merchantName: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Voice Soundbox Hardware</label>
                <select 
                  className="input" 
                  value={upiQrConfig.soundboxProvider} 
                  onChange={(e) => setUpiQrConfig({ ...upiQrConfig, soundboxProvider: e.target.value })}
                >
                  <option value="BharatPe Dynamic Soundbox">BharatPe Dynamic Soundbox</option>
                  <option value="Paytm Soundbox 4.0">Paytm Soundbox 4.0</option>
                  <option value="PhonePe SmartSpeaker">PhonePe SmartSpeaker</option>
                </select>
              </div>

              <div style={{ margin: '14px 0' }}>
                <label className="check">
                  <input 
                    type="checkbox" 
                    checked={upiQrConfig.autoVerifyOnScreen} 
                    onChange={(e) => setUpiQrConfig({ ...upiQrConfig, autoVerifyOnScreen: e.target.checked })} 
                  />
                  {' '}Auto-confirm bill payment on screen when soundbox plays audio
                </label>
              </div>

              <button type="button" className="btn btn-primary" onClick={() => showToast('UPI QR config saved')}>
                Save UPI Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: New / Edit API Client */}
      {showClientModal && (
        <div className="overlay" onClick={() => setShowClientModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editingClient ? `Edit ${editingClient.name}` : 'New API client'}</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowClientModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">Name *</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. Website, Tally sync" 
                  value={clientForm.name} 
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Access (scopes) *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, maxHeight: 220, overflowY: 'auto', padding: 8, border: '1px solid var(--border)', borderRadius: 6 }}>
                  {ALL_SCOPES.map(sc => (
                    <label key={sc} className="check" style={{ fontSize: 12 }}>
                      <input 
                        type="checkbox" 
                        checked={clientForm.scopes.includes(sc)} 
                        onChange={(e) => {
                          const next = e.target.checked ? [...clientForm.scopes, sc] : clientForm.scopes.filter(s => s !== sc);
                          setClientForm({ ...clientForm, scopes: next });
                        }} 
                      />
                      {' '}{sc}
                    </label>
                  ))}
                </div>
              </div>

              <div className="g2">
                <div className="form-group">
                  <label className="label">Allowed IP addresses</label>
                  <input 
                    type="text" 
                    className="input mono" 
                    placeholder="Comma separated. Blank = any." 
                    value={clientForm.ip} 
                    onChange={(e) => setClientForm({ ...clientForm, ip: e.target.value })} 
                  />
                  <div className="helper">Comma separated. Blank = any.</div>
                </div>

                <div className="form-group">
                  <label className="label">Requests per minute</label>
                  <input 
                    type="number" 
                    min={10} 
                    max={1200} 
                    className="input" 
                    value={clientForm.rate} 
                    onChange={(e) => setClientForm({ ...clientForm, rate: Number(e.target.value) })} 
                  />
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setShowClientModal(false)}>Cancel</button>
              <button 
                type="button" 
                className="btn btn-primary" 
                disabled={clientForm.name.trim().length < 2 || !clientForm.scopes.length}
                onClick={handleSaveClient}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Newly Created Credentials */}
      {newCreds && (
        <div className="overlay" onClick={() => setNewCreds(null)}>
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Copy these now</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setNewCreds(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="alert alert-warn" style={{ marginBottom: 10, fontSize: 12.5 }}>
                They are stored only as hashes and will not be shown again.
              </div>

              {newCreds.map(([label, val]) => (
                <div key={label} className="form-group" style={{ marginBottom: 10 }}>
                  <label className="label">{label}</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input type="text" readOnly className="input mono" value={val} onFocus={(e) => e.target.select()} />
                    <button type="button" className="btn btn-outline" onClick={() => handleCopy(val)}>
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-primary" onClick={() => setNewCreds(null)}>
                I have saved them
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: New Webhook */}
      {showWebhookModal && (
        <div className="overlay" onClick={() => setShowWebhookModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>New webhook</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setShowWebhookModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="label">URL *</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={webhookForm.url} 
                  onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })} 
                />
                <div className="helper">Must be https:// and publicly reachable</div>
              </div>

              <div className="form-group">
                <label className="label">Description</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. ERP order sync to warehouse" 
                  value={webhookForm.description} 
                  onChange={(e) => setWebhookForm({ ...webhookForm, description: e.target.value })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Events *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, padding: 8, border: '1px solid var(--border)', borderRadius: 6 }}>
                  <label className="check" style={{ gridColumn: '1 / -1', fontWeight: 600 }}>
                    <input 
                      type="checkbox" 
                      checked={webhookForm.events.includes('*')} 
                      onChange={(e) => setWebhookForm({ ...webhookForm, events: e.target.checked ? ['*'] : [] })} 
                    />
                    {' '}All events
                  </label>
                  {!webhookForm.events.includes('*') && WEBHOOK_EVENTS.map(ev => (
                    <label key={ev} className="check" style={{ fontSize: 12 }}>
                      <input 
                        type="checkbox" 
                        checked={webhookForm.events.includes(ev)} 
                        onChange={(e) => {
                          const next = e.target.checked ? [...webhookForm.events, ev] : webhookForm.events.filter(x => x !== ev);
                          setWebhookForm({ ...webhookForm, events: next });
                        }} 
                      />
                      {' '}{ev}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setShowWebhookModal(false)}>Cancel</button>
              <button 
                type="button" 
                className="btn btn-primary"
                disabled={!webhookForm.url.startsWith('https://') || !webhookForm.events.length}
                onClick={() => {
                  const created: WebhookItem = {
                    id: `wh-${Date.now()}`,
                    url: webhookForm.url,
                    description: webhookForm.description,
                    events: webhookForm.events,
                    status: 'active',
                    createdAt: 'Today',
                    lastDelivery: { status: 200, at: 'Just now' }
                  };
                  setWebhooks(prev => [created, ...prev]);
                  setShowWebhookModal(false);
                  showToast('Webhook registered');
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Webhook Deliveries */}
      {deliveriesModalHook && (
        <div className="overlay" onClick={() => setDeliveriesModalHook(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>Deliveries · {deliveriesModalHook.url}</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setDeliveriesModalHook(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Event</th>
                      <th>Time</th>
                      <th>Duration</th>
                      <th>Payload ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="badge badge-green">HTTP 200</span></td>
                      <td className="mono">order.paid</td>
                      <td>16 Nov 2026, 12:40 pm</td>
                      <td>142 ms</td>
                      <td className="mono">evt_90812938120</td>
                    </tr>
                    <tr>
                      <td><span className="badge badge-green">HTTP 200</span></td>
                      <td className="mono">payment.received</td>
                      <td>16 Nov 2026, 11:15 am</td>
                      <td>98 ms</td>
                      <td className="mono">evt_90812938119</td>
                    </tr>
                    <tr>
                      <td><span className="badge badge-green">HTTP 200</span></td>
                      <td className="mono">inventory.updated</td>
                      <td>15 Nov 2026, 06:22 pm</td>
                      <td>110 ms</td>
                      <td className="mono">evt_90812938102</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setDeliveriesModalHook(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

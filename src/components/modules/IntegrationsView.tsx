import React, { useState } from 'react';
import { Plus } from 'lucide-react';

interface IntegrationsViewProps {
  onNavigate?: (module: string) => void;
}

const tabs = ['API clients', 'Webhooks', 'Payments & courier'] as const;

export const IntegrationsView: React.FC<IntegrationsViewProps> = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('API clients');
  const [message, setMessage] = useState('');

  return (
    <div className="page">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Integrations</h1>
          <p className="helper">API clients, event webhooks, payments and courier services.</p>
        </div>
        {activeTab === 'API clients' && (
          <button type="button" className="btn btn-primary btn-sm"
            onClick={() => setMessage('Connect a server-side integrations service to register an API client.')}>
            <Plus size={14} /> New API client
          </button>
        )}
      </div>

      <div className="tabs" aria-label="Integrations sections">
        {tabs.map(tab => (
          <button key={tab} type="button" className={`tab ${activeTab === tab ? 'active' : ''}`}
            aria-pressed={activeTab === tab}
            onClick={() => { setActiveTab(tab); setMessage(''); }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'API clients' && (
        <div className="card card-body">
          <p>No API clients configured.</p>
          <p className="helper">Client credentials are issued by the integrations service.</p>
        </div>
      )}
      {activeTab === 'Webhooks' && (
        <div className="card card-body">
          <p>No webhook endpoints configured.</p>
          <button type="button" className="btn btn-outline btn-sm"
            onClick={() => setMessage('Connect a server-side integrations service to register a webhook.')}>
            <Plus size={14} /> New webhook
          </button>
        </div>
      )}
      {activeTab === 'Payments & courier' && (
        <div className="card card-body">
          <p>No payment or courier services connected.</p>
          <p className="helper">Provider credentials are configured on the server.</p>
        </div>
      )}
      {message && <p className="helper" role="status">{message}</p>}
    </div>
  );
};

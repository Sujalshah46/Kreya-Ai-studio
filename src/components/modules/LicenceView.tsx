import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import type { StoreProfile } from '../../types';

interface LicenceViewProps {
  store: StoreProfile;
}

export const LicenceView: React.FC<LicenceViewProps> = ({ store }) => {
  const [message, setMessage] = useState('');
  const verify = () => setMessage('Licence verification is unavailable until a licensing service is connected.');

  return (
    <div className="page">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Licence</h1>
          <p className="helper">Licence keys and verification · {store.tradeName}</p>
        </div>
        <button type="button" onClick={verify} className="btn btn-outline btn-sm">
          <RefreshCw size={14} /> Refresh all
        </button>
      </div>
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th>Licence Key</th><th>Status</th><th>Expiry Date</th><th>Last Verified</th><th>Actions</th>
            </tr></thead>
            <tbody><tr>
              <td>—</td><td>Verification unavailable</td><td>—</td><td>—</td>
              <td><button type="button" onClick={verify} className="btn btn-outline btn-xs">
                <RefreshCw size={12} /> Refresh
              </button></td>
            </tr></tbody>
          </table>
        </div>
        <div className="card-body">
          <p className="helper">A licensing service is required to validate and save a key.</p>
          <button type="button" className="btn btn-primary btn-sm" disabled>Validate &amp; save</button>
          {message && <p role="status" className="helper">{message}</p>}
        </div>
      </div>
    </div>
  );
};

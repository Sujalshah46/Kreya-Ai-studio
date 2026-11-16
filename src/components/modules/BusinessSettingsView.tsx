import React, { useState } from 'react';
import { Save, CheckCircle2, AlertTriangle } from 'lucide-react';
import { StoreProfile } from '../../types';

interface BusinessSettingsViewProps {
  store: StoreProfile;
  onUpdateStore?: (store: StoreProfile) => void;
  onNavigate?: (module: string) => void;
}

const INDIAN_STATES = [
  "01 – Jammu & Kashmir", "02 – Himachal Pradesh", "03 – Punjab", "04 – Chandigarh",
  "05 – Uttarakhand", "06 – Haryana", "07 – Delhi", "08 – Rajasthan",
  "09 – Uttar Pradesh", "10 – Bihar", "11 – Sikkim", "12 – Arunachal Pradesh",
  "13 – Nagaland", "14 – Manipur", "15 – Mizoram", "16 – Tripura",
  "17 – Meghalaya", "18 – Assam", "19 – West Bengal", "20 – Jharkhand",
  "21 – Odisha", "22 – Chhattisgarh", "23 – Madhya Pradesh", "24 – Gujarat",
  "26 – Dadra & Nagar Haveli and Daman & Diu", "27 – Maharashtra", "29 – Karnataka",
  "30 – Goa", "31 – Lakshadweep", "32 – Kerala", "33 – Tamil Nadu",
  "34 – Puducherry", "35 – Andaman & Nicobar Islands", "36 – Telangana",
  "37 – Andhra Pradesh", "38 – Ladakh", "96 – Foreign Country", "97 – Other Territory"
];

const PAYMENT_MODES = ["cash", "upi", "card", "cheque", "neft", "rtgs", "imps", "bank_transfer"];

export const BusinessSettingsView: React.FC<BusinessSettingsViewProps> = ({
  store,
  onUpdateStore,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<string>('gst');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Settings State matching chunk 475
  const [settings, setSettings] = useState<any>({
    gst: {
      enabled: true,
      gstin: store.gstin || '27ACZPJ7126B1ZA',
      stateCode: '27',
      registrationType: 'regular',
      filing: 'monthly',
      turnoverBand: 'above_5cr',
      cgstPct: 1.5,
      sgstPct: 1.5,
      hsn: {
        gold: '7113',
        silver: '7113',
        platinum: '7113',
        diamond: '7113'
      },
      repairSac: '998719',
      repairPct: 18,
      repairPriceIncludesGst: true,
      jobworkSac: '998892',
      jobworkPct: 5,
      panRequiredAbove: 200000,
      pmlaCashFlagAbove: 200000
    },
    invoice: {
      numbering: 'legacy',
      salesPrefix: 'INV',
      repairPrefix: 'REP',
      buybackPrefix: 'BB',
      layout: 'store',
      cin: '',
      numberWidth: 5,
      fyStartMonth: 4,
      paperSize: 'A4',
      show: {
        huid: true,
        stones: true,
        rate: true,
        making: true,
        weights: true
      },
      upiId: 'sbj@hdfcbank',
      bank: {
        bankName: 'HDFC Bank Ltd',
        accountName: 'S.B Borana Jewellers',
        accountNo: '50200049281729',
        ifsc: 'HDFC0000128',
        branch: 'Vile Parle East, Mumbai'
      },
      signatory: 'Authorized Signatory',
      terms: '1. Goods once sold will be accepted for return/exchange as per prevailing store policy.\n2. 100% BIS Hallmarked Jewellery guarantee.\n3. Making charges and taxes subject to government notifications.\n4. Gold purity guaranteed as hallmarked by BIS HUID.',
      declaration: 'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
      footer: 'Thank you for your patronage! Visit again.'
    },
    payment_modes: {
      enabled: ['cash', 'upi', 'card', 'bank_transfer', 'cheque', 'neft', 'rtgs', 'imps'],
      needsReference: ['upi', 'card', 'bank_transfer', 'cheque', 'neft', 'rtgs'],
      cashReceiptLimit: 199999,
      loanCashLimit: 20000
    },
    buyback: {
      refiningPct: 2,
      diamondPct: 90,
      gemPct: 80,
      cashLimit: 10000,
      defaultStockAction: 'restock'
    },
    register: {
      approvalLimit: 500,
      requireOpenForCash: true,
      expenseCategories: ['Tea & Refreshments', 'Store Maintenance', 'Stationery', 'Staff Travel', 'Courier Charges'],
      cashInCategories: ['Opening Float', 'Bank Cash Withdrawal', 'Owner Capital Injection'],
      cashOutCategories: ['Daily Expenses', 'Bank Cash Deposit', 'Owner Drawings', 'Vendor Cash Advance']
    },
    procurement: {
      poApproval: true,
      requireBillDocument: true,
      grnToleranceGrams: 0.05,
      grnTolerancePct: 0.5,
      billToleranceRupees: 50,
      billTolerancePct: 1,
      deliveryLocation: 'S.B Borana Jewellers, 3-5 Niwas, Vile Parle East, Mumbai 400057',
      poTerms: '1. Purity and net weight subject to lab assay test.\n2. Invoices must accompany delivery with GST e-Way Bill.\n3. Payment strictly as per agreed payment terms.'
    },
    pricing: {
      retailMarginPct: 15,
      wholesaleMarginPct: 5,
      hallmarkChargePerPiece: 45,
      rate22Pct: 91.6,
      rate18Pct: 75,
      rate14Pct: 58.5,
      rateRoundTo: '10',
      hallmarkWaived: false,
      rateAutoFill: true
    },
    catalog: {
      itemTypes: ['Ring', 'Bangle', 'Necklace', 'Chain', 'Earring', 'Pendant', 'Mangalsutra', 'Anklet (Payal)', 'Nosepin', 'Bracelet', 'Kada', 'Coin', 'Bar'],
      metals: ['Gold', 'Silver', 'Platinum'],
      stoneNames: {
        diamond: ['Natural Diamond', 'Lab Grown Diamond (CVD/HPHT)', 'Polki / Uncut'],
        gemstone: ['Ruby (Manik)', 'Emerald (Panna)', 'Yellow Sapphire (Pukhraj)', 'Blue Sapphire (Neelam)', 'Navratna'],
        pearl: ['Basra Pearl', 'South Sea Pearl', 'Freshwater Cultured Pearl'],
        other: ['Cubic Zirconia (CZ)', 'Synthetic Gemstone', 'Moissanite']
      },
      shapes: ['Round Brilliant', 'Princess', 'Marquise', 'Oval', 'Emerald Cut', 'Pear', 'Heart', 'Cushion'],
      clarities: ['FL / IF', 'VVS1 - VVS2', 'VS1 - VS2', 'SI1 - SI2', 'I1 - I3'],
      colours: ['D - F (Colourless)', 'G - J (Near Colourless)', 'K - M (Faint Yellow)', 'Fancy Vivid Yellow'],
      stockInReasons: ['Purchase Received', 'Customer Old Gold Exchange', 'Customer Order Return', 'Physical Inventory Surplus', 'Found in Vault'],
      stockOutReasons: ['Sales Memo Invoiced', 'Transferred to Karigar for Melting', 'Loss / Transit Damage', 'Exhibition Display Outward']
    }
  });

  const tabs = [
    { key: 'gst', label: 'GST' },
    { key: 'invoice', label: 'Invoice' },
    { key: 'payment_modes', label: 'Payment modes' },
    { key: 'buyback', label: 'Buy-back' },
    { key: 'register', label: 'Cash register' },
    { key: 'procurement', label: 'Purchasing' },
    { key: 'pricing', label: 'Pricing & margins' },
    { key: 'catalog', label: 'Catalogue' }
  ];

  const handleSave = (tabKey: string) => {
    // Validation
    if (tabKey === 'gst') {
      const cgst = Number(settings.gst.cgstPct);
      const sgst = Number(settings.gst.sgstPct);
      if (isNaN(cgst) || cgst < 0 || cgst > 14) {
        setSaveError('CGST % must be between 0 and 14');
        return;
      }
      if (isNaN(sgst) || sgst < 0 || sgst > 14) {
        setSaveError('SGST % must be between 0 and 14');
        return;
      }
    }

    setIsSaving(true);
    setSaveError(null);
    setTimeout(() => {
      setIsSaving(false);
      const currentTab = tabs.find(t => t.key === tabKey);
      setSaveSuccess(`${currentTab?.label || 'Business'} settings saved`);
      setTimeout(() => setSaveSuccess(null), 3500);
    }, 400);
  };

  const currentTabObj = tabs.find(t => t.key === activeTab) || tabs[0];

  return (
    <div>
      {/* 1. Header */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Business settings</h1>
          <p>GST, invoice numbering, payment modes, buy-back, register, purchasing and tag layout. Every change is audited.</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="card" style={{ marginBottom: 14, background: '#ecfdf5', borderColor: '#10b981', color: '#065f46', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            <span>{saveSuccess}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setSaveSuccess(null)} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#065f46', fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {saveError && (
        <div className="alert alert-danger" style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{saveError}</span>
          <button type="button" onClick={() => setSaveError(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* 2. Tabs */}
      <div className="tabs">
        {tabs.map((t) => (
          <button 
            key={t.key}
            type="button" 
            className={`tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => { setActiveTab(t.key); setSaveError(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: GST */}
      {activeTab === 'gst' && (
        <div className="card">
          <div className="card-body">
            <div className="g3">
              <div className="form-group">
                <label className="label">Shop GSTIN</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.gst.gstin} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, gstin: e.target.value.toUpperCase() } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">Shop state (GST code)</label>
                <select 
                  className="input" 
                  value={settings.gst.stateCode} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, stateCode: e.target.value } })}
                >
                  <option value="">— from GSTIN / shop state —</option>
                  {INDIAN_STATES.map(s => (
                    <option key={s} value={s.slice(0, 2)}>{s}</option>
                  ))}
                </select>
                <div className="helper">The shop GSTIN decides this (its first 2 digits). Blank = taken from the GSTIN, else Shop Settings → State</div>
              </div>
              <div className="form-group">
                <label className="label">Registration</label>
                <select 
                  className="input" 
                  value={settings.gst.registrationType} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, registrationType: e.target.value } })}
                >
                  <option value="regular">Regular</option>
                  <option value="composition">Composition</option>
                  <option value="unregistered">Unregistered</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Filing</label>
                <select 
                  className="input" 
                  value={settings.gst.filing} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, filing: e.target.value } })}
                >
                  <option value="monthly">Monthly</option>
                  <option value="qrmp">QRMP</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Turnover</label>
                <select 
                  className="input" 
                  value={settings.gst.turnoverBand} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, turnoverBand: e.target.value } })}
                >
                  <option value="upto_5cr">Up to 5 Crore</option>
                  <option value="above_5cr">Above 5 Crore</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">CGST % (jewellery)</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.gst.cgstPct} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, cgstPct: e.target.value } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">SGST % (jewellery)</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.gst.sgstPct} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, sgstPct: e.target.value } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">HSN — gold</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.gst.hsn.gold} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, hsn: { ...settings.gst.hsn, gold: e.target.value } } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">HSN — silver</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.gst.hsn.silver} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, hsn: { ...settings.gst.hsn, silver: e.target.value } } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">HSN — platinum</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.gst.hsn.platinum} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, hsn: { ...settings.gst.hsn, platinum: e.target.value } } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">HSN — diamond</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.gst.hsn.diamond} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, hsn: { ...settings.gst.hsn, diamond: e.target.value } } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">Repair SAC</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.gst.repairSac} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, repairSac: e.target.value } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">Repair GST %</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.gst.repairPct} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, repairPct: Number(e.target.value) } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">Job-work SAC</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.gst.jobworkSac} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, jobworkSac: e.target.value } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">Job-work GST %</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.gst.jobworkPct} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, jobworkPct: Number(e.target.value) } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">PAN / Form 60 needed above (₹)</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.gst.panRequiredAbove} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, panRequiredAbove: Number(e.target.value) } })} 
                />
              </div>
              <div className="form-group">
                <label className="label">Flag cash above (₹, PMLA)</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.gst.pmlaCashFlagAbove} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, pmlaCashFlagAbove: Number(e.target.value) } })} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '14px 0' }}>
              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.gst.enabled} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, enabled: e.target.checked } })} 
                />
                {' '}GST billing on
              </label>
              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.gst.repairPriceIncludesGst} 
                  onChange={(e) => setSettings({ ...settings, gst: { ...settings.gst, repairPriceIncludesGst: e.target.checked } })} 
                />
                {' '}Repair charges already include GST
              </label>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => handleSave('gst')}
              disabled={isSaving}
            >
              <Save size={13} /> {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: INVOICE */}
      {activeTab === 'invoice' && (
        <div className="card">
          <div className="card-body">
            <div className="g3">
              <div className="form-group">
                <label className="label">Invoice numbering</label>
                <select 
                  className="input" 
                  value={settings.invoice.numbering} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, numbering: e.target.value } })}
                >
                  <option value="legacy">legacy</option>
                  <option value="fy">fy</option>
                </select>
                <div className="helper">legacy = INV-2026-00025 (as now) · fy = SO/26-27/0001, restarts each financial year</div>
              </div>

              <div className="form-group">
                <label className="label">Sales prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.invoice.salesPrefix} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, salesPrefix: e.target.value } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Repair invoice prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.invoice.repairPrefix} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, repairPrefix: e.target.value } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Buy-back prefix</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.invoice.buybackPrefix} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, buybackPrefix: e.target.value } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Sales invoice layout</label>
                <select 
                  className="input" 
                  value={settings.invoice.layout} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, layout: e.target.value } })}
                >
                  <option value="store">store</option>
                  <option value="tally">tally</option>
                </select>
                <div className="helper">store = jewellery-store tax invoice (Standard Rate line, weights, making + HM, scheme discount, payment details) · tally = Tally ruled Tax Invoice. Repair invoices always use the Tally layout.</div>
              </div>

              <div className="form-group">
                <label className="label">CIN (company identification no., optional)</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.invoice.cin} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, cin: e.target.value } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Number digits</label>
                <input 
                  type="number" 
                  className="input" 
                  value={settings.invoice.numberWidth} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, numberWidth: Number(e.target.value) } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Financial year starts (month)</label>
                <input 
                  type="number" 
                  className="input" 
                  value={settings.invoice.fyStartMonth} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, fyStartMonth: Number(e.target.value) } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Paper</label>
                <select 
                  className="input" 
                  value={settings.invoice.paperSize} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, paperSize: e.target.value } })}
                >
                  <option value="A4">A4</option>
                  <option value="A5">A5</option>
                  <option value="thermal80">thermal80</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">UPI ID (QR on invoice)</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.invoice.upiId} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, upiId: e.target.value } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Bank name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.invoice.bank.bankName} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, bank: { ...settings.invoice.bank, bankName: e.target.value } } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Account name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.invoice.bank.accountName} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, bank: { ...settings.invoice.bank, accountName: e.target.value } } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Account no.</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.invoice.bank.accountNo} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, bank: { ...settings.invoice.bank, accountNo: e.target.value } } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">IFSC</label>
                <input 
                  type="text" 
                  className="input mono" 
                  value={settings.invoice.bank.ifsc} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, bank: { ...settings.invoice.bank, ifsc: e.target.value.toUpperCase() } } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Branch</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.invoice.bank.branch} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, bank: { ...settings.invoice.bank, branch: e.target.value } } })} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Signatory line</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.invoice.signatory} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, signatory: e.target.value } })} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Terms &amp; conditions (one per line; blank = the standard 8 jewellery terms on the store invoice)</label>
                <textarea 
                  className="input" 
                  rows={3} 
                  value={settings.invoice.terms} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, terms: e.target.value } })} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Declaration</label>
                <textarea 
                  className="input" 
                  rows={3} 
                  value={settings.invoice.declaration} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, declaration: e.target.value } })} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Footer</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.invoice.footer} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, footer: e.target.value } })} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '14px 0' }}>
              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.invoice.show.huid} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, show: { ...settings.invoice.show, huid: e.target.checked } } })} 
                />
                {' '}Show HUID
              </label>
              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.invoice.show.stones} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, show: { ...settings.invoice.show, stones: e.target.checked } } })} 
                />
                {' '}Show stones
              </label>
              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.invoice.show.rate} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, show: { ...settings.invoice.show, rate: e.target.checked } } })} 
                />
                {' '}Show rate
              </label>
              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.invoice.show.making} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, show: { ...settings.invoice.show, making: e.target.checked } } })} 
                />
                {' '}Show making
              </label>
              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.invoice.show.weights} 
                  onChange={(e) => setSettings({ ...settings, invoice: { ...settings.invoice, show: { ...settings.invoice.show, weights: e.target.checked } } })} 
                />
                {' '}Show weights
              </label>
            </div>

            {settings.invoice.numbering === 'fy' && (
              <div className="alert alert-warn" style={{ marginBottom: 14 }}>
                New invoices will be numbered {settings.invoice.salesPrefix}/26-27/0001 onwards. Existing invoices keep their numbers.
              </div>
            )}

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => handleSave('invoice')}
              disabled={isSaving}
            >
              <Save size={13} /> {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT MODES */}
      {activeTab === 'payment_modes' && (
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label className="label">Modes in use</label>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {PAYMENT_MODES.map((mode) => (
                  <label key={mode} className="check">
                    <input 
                      type="checkbox" 
                      checked={settings.payment_modes.enabled.includes(mode)} 
                      onChange={(e) => {
                        const cur = settings.payment_modes.enabled;
                        const next = e.target.checked ? [...cur, mode] : cur.filter((m: string) => m !== mode);
                        setSettings({ ...settings, payment_modes: { ...settings.payment_modes, enabled: next } });
                      }} 
                    />
                    {' '}{mode.replace(/_/g, ' ').toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="label">Need a reference (UTR / cheque no.)</label>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {PAYMENT_MODES.map((mode) => (
                  <label key={mode} className="check">
                    <input 
                      type="checkbox" 
                      checked={settings.payment_modes.needsReference.includes(mode)} 
                      onChange={(e) => {
                        const cur = settings.payment_modes.needsReference;
                        const next = e.target.checked ? [...cur, mode] : cur.filter((m: string) => m !== mode);
                        setSettings({ ...settings, payment_modes: { ...settings.payment_modes, needsReference: next } });
                      }} 
                    />
                    {' '}{mode.replace(/_/g, ' ').toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <div className="g2" style={{ marginTop: 14 }}>
              <div className="form-group">
                <label className="label">Cash receipt limit per bill (₹, sec. 269ST)</label>
                <input 
                  type="number" 
                  className="input" 
                  value={settings.payment_modes.cashReceiptLimit} 
                  onChange={(e) => setSettings({ ...settings, payment_modes: { ...settings.payment_modes, cashReceiptLimit: Number(e.target.value) } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Loan cash limit (₹, sec. 269SS / 269T)</label>
                <input 
                  type="number" 
                  className="input" 
                  value={settings.payment_modes.loanCashLimit} 
                  onChange={(e) => setSettings({ ...settings, payment_modes: { ...settings.payment_modes, loanCashLimit: Number(e.target.value) } })} 
                />
                <div className="helper">Largest loan paid out, or principal repaid, in cash. 0 = no limit</div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ marginTop: 14 }}
              onClick={() => handleSave('payment_modes')}
              disabled={isSaving}
            >
              <Save size={13} /> {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: BUY-BACK */}
      {activeTab === 'buyback' && (
        <div className="card">
          <div className="card-body">
            <div className="g3">
              <div className="form-group">
                <label className="label">Refining deduction %</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.buyback.refiningPct} 
                  onChange={(e) => setSettings({ ...settings, buyback: { ...settings.buyback, refiningPct: Number(e.target.value) } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Diamond value paid %</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.buyback.diamondPct} 
                  onChange={(e) => setSettings({ ...settings, buyback: { ...settings.buyback, diamondPct: Number(e.target.value) } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Gem value paid %</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.buyback.gemPct} 
                  onChange={(e) => setSettings({ ...settings, buyback: { ...settings.buyback, gemPct: Number(e.target.value) } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Cash refund limit (₹)</label>
                <input 
                  type="number" 
                  className="input" 
                  value={settings.buyback.cashLimit} 
                  onChange={(e) => setSettings({ ...settings, buyback: { ...settings.buyback, cashLimit: Number(e.target.value) } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Returned pieces</label>
                <select 
                  className="input" 
                  value={settings.buyback.defaultStockAction} 
                  onChange={(e) => setSettings({ ...settings, buyback: { ...settings.buyback, defaultStockAction: e.target.value } })}
                >
                  <option value="restock">Restock</option>
                  <option value="melt">Melt</option>
                </select>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ marginTop: 14 }}
              onClick={() => handleSave('buyback')}
              disabled={isSaving}
            >
              <Save size={13} /> {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: CASH REGISTER */}
      {activeTab === 'register' && (
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label className="label">Difference needing approval (₹)</label>
              <input 
                type="number" 
                className="input" 
                style={{ maxWidth: 260 }}
                value={settings.register.approvalLimit} 
                onChange={(e) => setSettings({ ...settings, register: { ...settings.register, approvalLimit: Number(e.target.value) } })} 
              />
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="label">Expense categories</label>
              <input 
                type="text" 
                className="input" 
                value={settings.register.expenseCategories.join(', ')} 
                onChange={(e) => setSettings({ ...settings, register: { ...settings.register, expenseCategories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} 
              />
              <div className="helper">Separate with commas</div>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="label">Cash-in categories</label>
              <input 
                type="text" 
                className="input" 
                value={settings.register.cashInCategories.join(', ')} 
                onChange={(e) => setSettings({ ...settings, register: { ...settings.register, cashInCategories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} 
              />
              <div className="helper">Separate with commas</div>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="label">Cash-out categories</label>
              <input 
                type="text" 
                className="input" 
                value={settings.register.cashOutCategories.join(', ')} 
                onChange={(e) => setSettings({ ...settings, register: { ...settings.register, cashOutCategories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} 
              />
              <div className="helper">Separate with commas</div>
            </div>

            <div style={{ margin: '14px 0' }}>
              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.register.requireOpenForCash} 
                  onChange={(e) => setSettings({ ...settings, register: { ...settings.register, requireOpenForCash: e.target.checked } })} 
                />
                {' '}Cash needs an open register (no cash receipts or payouts while every register is closed)
              </label>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => handleSave('register')}
              disabled={isSaving}
            >
              <Save size={13} /> {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 6: PURCHASING */}
      {activeTab === 'procurement' && (
        <div className="card">
          <div className="card-body">
            <div className="g3">
              <div className="form-group">
                <label className="label">Receipt weight tolerance (g)</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.procurement.grnToleranceGrams} 
                  onChange={(e) => setSettings({ ...settings, procurement: { ...settings.procurement, grnToleranceGrams: Number(e.target.value) } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Receipt weight tolerance (%)</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.procurement.grnTolerancePct} 
                  onChange={(e) => setSettings({ ...settings, procurement: { ...settings.procurement, grnTolerancePct: Number(e.target.value) } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Bill difference allowed (₹)</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.procurement.billToleranceRupees} 
                  onChange={(e) => setSettings({ ...settings, procurement: { ...settings.procurement, billToleranceRupees: Number(e.target.value) } })} 
                />
              </div>

              <div className="form-group">
                <label className="label">Bill difference allowed (%)</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.procurement.billTolerancePct} 
                  onChange={(e) => setSettings({ ...settings, procurement: { ...settings.procurement, billTolerancePct: Number(e.target.value) } })} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">Delivery address on POs</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.procurement.deliveryLocation} 
                  onChange={(e) => setSettings({ ...settings, procurement: { ...settings.procurement, deliveryLocation: e.target.value } })} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="label">PO terms</label>
                <textarea 
                  className="input" 
                  rows={3} 
                  value={settings.procurement.poTerms} 
                  onChange={(e) => setSettings({ ...settings, procurement: { ...settings.procurement, poTerms: e.target.value } })} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '14px 0' }}>
              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.procurement.poApproval} 
                  onChange={(e) => setSettings({ ...settings, procurement: { ...settings.procurement, poApproval: e.target.checked } })} 
                />
                {' '}Purchase orders need approval
              </label>

              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.procurement.requireBillDocument} 
                  onChange={(e) => setSettings({ ...settings, procurement: { ...settings.procurement, requireBillDocument: e.target.checked } })} 
                />
                {' '}Supplier bill must have the invoice attached
              </label>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => handleSave('procurement')}
              disabled={isSaving}
            >
              <Save size={13} /> {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 7: PRICING & MARGINS */}
      {activeTab === 'pricing' && (
        <div className="card">
          <div className="card-body">
            <div className="g3">
              <div className="form-group">
                <label className="label">Default retail margin %</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.pricing.retailMarginPct} 
                  onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, retailMarginPct: Number(e.target.value) } })} 
                />
                <div className="helper">Retail rate = cost × (1 + margin %). −100 to 1000. New items and goods receipts start with this.</div>
              </div>

              <div className="form-group">
                <label className="label">Default wholesale margin %</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.pricing.wholesaleMarginPct} 
                  onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, wholesaleMarginPct: Number(e.target.value) } })} 
                />
                <div className="helper">Wholesale rate = cost × (1 + margin %). −100 to 1000.</div>
              </div>

              <div className="form-group">
                <label className="label">Hallmark (HM) charge per piece (₹)</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.pricing.hallmarkChargePerPiece} 
                  onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, hallmarkChargePerPiece: Number(e.target.value) } })} 
                />
                <div className="helper">Added to each gold / silver / platinum sale line × qty (GST applies). 0 = no hallmark charge. 0 to 1000.</div>
              </div>

              <div className="form-group">
                <label className="label">Daily rate: 22K = % of 24K</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.pricing.rate22Pct} 
                  onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, rate22Pct: Number(e.target.value) } })} 
                />
                <div className="helper">Typing the 24K rate fills 22K with this % (91.6 = 916 purity). Each rate can still be typed over.</div>
              </div>

              <div className="form-group">
                <label className="label">Daily rate: 18K = % of 24K</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.pricing.rate18Pct} 
                  onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, rate18Pct: Number(e.target.value) } })} 
                />
                <div className="helper">75 = 750 purity.</div>
              </div>

              <div className="form-group">
                <label className="label">Daily rate: 14K = % of 24K</label>
                <input 
                  type="number" 
                  step="any" 
                  className="input" 
                  value={settings.pricing.rate14Pct} 
                  onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, rate14Pct: Number(e.target.value) } })} 
                />
                <div className="helper">58.5 = 585 purity.</div>
              </div>

              <div className="form-group">
                <label className="label">Round filled rates to (₹)</label>
                <select 
                  className="input" 
                  value={settings.pricing.rateRoundTo} 
                  onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, rateRoundTo: e.target.value } })}
                >
                  <option value="1">1</option>
                  <option value="10">10</option>
                  <option value="100">100</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', margin: '14px 0' }}>
              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.pricing.hallmarkWaived} 
                  onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, hallmarkWaived: e.target.checked } })} 
                />
                {' '}Waive hallmark charge (show it as scheme discount on the invoice)
              </label>

              <label className="check">
                <input 
                  type="checkbox" 
                  checked={settings.pricing.rateAutoFill} 
                  onChange={(e) => setSettings({ ...settings, pricing: { ...settings.pricing, rateAutoFill: e.target.checked } })} 
                />
                {' '}Fill 22K / 18K / 14K from the 24K rate on Daily Metal Rates
              </label>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => handleSave('pricing')}
              disabled={isSaving}
            >
              <Save size={13} /> {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: CATALOGUE */}
      {activeTab === 'catalog' && (
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label className="label">Extra categories (item types)</label>
              <input 
                type="text" 
                className="input" 
                value={settings.catalog.itemTypes.join(', ')} 
                onChange={(e) => setSettings({ ...settings, catalog: { ...settings.catalog, itemTypes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} 
              />
              <div className="helper">Added to the built-in list: Ring, Bangle, Necklace, Anklet (Payal), Mangalsutra … Separate with commas.</div>
            </div>

            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="label">Extra metals</label>
              <input 
                type="text" 
                className="input" 
                value={settings.catalog.metals.join(', ')} 
                onChange={(e) => setSettings({ ...settings, catalog: { ...settings.catalog, metals: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} 
              />
              <div className="helper">Separate with commas</div>
            </div>

            <div className="g2" style={{ marginTop: 14 }}>
              <div className="form-group">
                <label className="label">Extra diamond names</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.catalog.stoneNames.diamond.join(', ')} 
                  onChange={(e) => setSettings({ ...settings, catalog: { ...settings.catalog, stoneNames: { ...settings.catalog.stoneNames, diamond: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } } })} 
                />
                <div className="helper">Separate with commas</div>
              </div>

              <div className="form-group">
                <label className="label">Extra gemstone names</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.catalog.stoneNames.gemstone.join(', ')} 
                  onChange={(e) => setSettings({ ...settings, catalog: { ...settings.catalog, stoneNames: { ...settings.catalog.stoneNames, gemstone: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } } })} 
                />
                <div className="helper">Separate with commas</div>
              </div>

              <div className="form-group">
                <label className="label">Extra pearl names</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.catalog.stoneNames.pearl.join(', ')} 
                  onChange={(e) => setSettings({ ...settings, catalog: { ...settings.catalog, stoneNames: { ...settings.catalog.stoneNames, pearl: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } } })} 
                />
                <div className="helper">Separate with commas</div>
              </div>

              <div className="form-group">
                <label className="label">Other stone names</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.catalog.stoneNames.other.join(', ')} 
                  onChange={(e) => setSettings({ ...settings, catalog: { ...settings.catalog, stoneNames: { ...settings.catalog.stoneNames, other: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } } })} 
                />
                <div className="helper">Separate with commas</div>
              </div>

              <div className="form-group">
                <label className="label">Extra stone shapes</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.catalog.shapes.join(', ')} 
                  onChange={(e) => setSettings({ ...settings, catalog: { ...settings.catalog, shapes: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} 
                />
                <div className="helper">Separate with commas</div>
              </div>

              <div className="form-group">
                <label className="label">Extra clarity grades</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.catalog.clarities.join(', ')} 
                  onChange={(e) => setSettings({ ...settings, catalog: { ...settings.catalog, clarities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} 
                />
                <div className="helper">Separate with commas</div>
              </div>

              <div className="form-group">
                <label className="label">Extra colour grades</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.catalog.colours.join(', ')} 
                  onChange={(e) => setSettings({ ...settings, catalog: { ...settings.catalog, colours: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} 
                />
                <div className="helper">Separate with commas</div>
              </div>

              <div className="form-group">
                <label className="label">Extra stock-in reasons</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.catalog.stockInReasons.join(', ')} 
                  onChange={(e) => setSettings({ ...settings, catalog: { ...settings.catalog, stockInReasons: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} 
                />
                <div className="helper">Separate with commas</div>
              </div>

              <div className="form-group">
                <label className="label">Extra stock-out reasons</label>
                <input 
                  type="text" 
                  className="input" 
                  value={settings.catalog.stockOutReasons.join(', ')} 
                  onChange={(e) => setSettings({ ...settings, catalog: { ...settings.catalog, stockOutReasons: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} 
                />
                <div className="helper">Separate with commas</div>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ marginTop: 14 }}
              onClick={() => handleSave('catalog')}
              disabled={isSaving}
            >
              <Save size={13} /> {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

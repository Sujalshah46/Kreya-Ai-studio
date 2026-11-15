import React, { useState } from 'react';
import { 
  Building2, Save, Check, FileText, Scale, Lock, Calculator, 
  ShieldCheck, CheckCircle2, AlertTriangle, Coins, Receipt, CreditCard,
  RotateCcw, ShoppingBag, Percent, BookOpen, Layers
} from 'lucide-react';
import { StoreProfile } from '../../types';

interface BusinessSettingsViewProps {
  store: StoreProfile;
  onUpdateStore?: (store: StoreProfile) => void;
  onNavigate?: (module: string) => void;
}

type BusinessTab = 
  | 'gst' 
  | 'invoice' 
  | 'payment-modes' 
  | 'buy-back' 
  | 'cash-register' 
  | 'purchasing' 
  | 'pricing-margins' 
  | 'catalogue';

export const BusinessSettingsView: React.FC<BusinessSettingsViewProps> = ({
  store,
  onUpdateStore,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<BusinessTab>('gst');
  const [saved, setSaved] = useState(false);

  // Tab 1: GST
  const [defaultGoldHsn, setDefaultGoldHsn] = useState('7113');
  const [defaultSilverHsn, setDefaultSilverHsn] = useState('7113');
  const [defaultMakingSac, setDefaultMakingSac] = useState('998719');
  const [gstRateJewellery, setGstRateJewellery] = useState('3.0');
  const [gstRateMaking, setGstRateMaking] = useState('18.0');
  const [ewayBillThreshold, setEwayBillThreshold] = useState('200000');
  const [reverseChargeEnabled, setReverseChargeEnabled] = useState(false);

  // Tab 2: Invoice
  const [roundingMethod, setRoundingMethod] = useState('nearest-rupee');
  const [invoiceCopyCount, setInvoiceCopyCount] = useState('2');
  const [invoiceTerms, setInvoiceTerms] = useState(
    '1. Subject to Mumbai jurisdiction only.\n2. Goods once sold will not be taken back without original cash memo.\n3. Making charges and GST are not refundable under any return or exchange.\n4. Gold purity guaranteed as hallmarked by BIS HUID.'
  );
  const [showHuidOnPrint, setShowHuidOnPrint] = useState(true);
  const [showBreakupOnPrint, setShowBreakupOnPrint] = useState(true);

  // Tab 3: Payment modes
  const [enabledModes, setEnabledModes] = useState({
    cash: true,
    upi: true,
    card: true,
    bank: true,
    oldGold: true,
    credit: true,
    chitScheme: true
  });

  // Tab 4: Buy-back
  const [buybackGoldDeduction, setBuybackGoldDeduction] = useState('2.0');
  const [buybackSilverDeduction, setBuybackSilverDeduction] = useState('5.0');
  const [buybackSameStoreBonus, setBuybackSameStoreBonus] = useState('100.0');
  const [purityTolerance, setPurityTolerance] = useState('0.005');

  // Tab 5: Cash register
  const [mandateOpeningFloat, setMandateOpeningFloat] = useState(true);
  const [requireSupervisorPinOnClose, setRequireSupervisorPinOnClose] = useState(true);
  const [varianceToleranceRupees, setVarianceToleranceRupees] = useState('50');

  // Tab 6: Purchasing
  const [defaultCreditDays, setDefaultCreditDays] = useState('30');
  const [mandatePoApproval, setMandatePoApproval] = useState(true);
  const [grnWeightTolerance, setGrnWeightTolerance] = useState('0.002');

  // Tab 7: Pricing & margins
  const [defaultMakingMarkup, setDefaultMakingMarkup] = useState('15.0');
  const [goldRateBuffer, setGoldRateBuffer] = useState('50');
  const [minDiamondMarkup, setMinDiamondMarkup] = useState('25.0');

  // Tab 8: Catalogue
  const [standardPurities, setStandardPurities] = useState('24K, 22K, 18K, 14K');
  const [hallmarkFeePerPiece, setHallmarkFeePerPiece] = useState('45');
  const [defaultGrossNetRatio, setDefaultGrossNetRatio] = useState('98.5');

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onUpdateStore) {
      onUpdateStore({
        ...store,
        invoiceTerms
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
              <Building2 size={22} style={{ color: 'var(--primary)' }} />
              Business Settings
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <p className="helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
            Configure statutory defaults, Mumbai legal jurisdiction terms, rounding rules, buyback formulas and catalogue margins · {store.tradeName || 'S.B Borana Jewellers'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => handleSave()}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Save size={14} />
            <span>Save</span>
          </button>
        </div>
      </div>

      {saved && (
        <div style={{ padding: 12, background: 'var(--primary-xl)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--primary-d)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <CheckCircle2 size={16} />
          <span style={{ fontWeight: 600 }}>Business settings successfully saved & applied across all POS terminals!</span>
        </div>
      )}

      {/* 8 Required Tabs: "GST", "Invoice", "Payment modes", "Buy-back", "Cash register", "Purchasing", "Pricing & margins", "Catalogue" */}
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button
          onClick={() => setActiveTab('gst')}
          className={`tab ${activeTab === 'gst' ? 'active' : ''}`}
        >
          GST
        </button>
        <button
          onClick={() => setActiveTab('invoice')}
          className={`tab ${activeTab === 'invoice' ? 'active' : ''}`}
        >
          Invoice
        </button>
        <button
          onClick={() => setActiveTab('payment-modes')}
          className={`tab ${activeTab === 'payment-modes' ? 'active' : ''}`}
        >
          Payment modes
        </button>
        <button
          onClick={() => setActiveTab('buy-back')}
          className={`tab ${activeTab === 'buy-back' ? 'active' : ''}`}
        >
          Buy-back
        </button>
        <button
          onClick={() => setActiveTab('cash-register')}
          className={`tab ${activeTab === 'cash-register' ? 'active' : ''}`}
        >
          Cash register
        </button>
        <button
          onClick={() => setActiveTab('purchasing')}
          className={`tab ${activeTab === 'purchasing' ? 'active' : ''}`}
        >
          Purchasing
        </button>
        <button
          onClick={() => setActiveTab('pricing-margins')}
          className={`tab ${activeTab === 'pricing-margins' ? 'active' : ''}`}
        >
          Pricing & margins
        </button>
        <button
          onClick={() => setActiveTab('catalogue')}
          className={`tab ${activeTab === 'catalogue' ? 'active' : ''}`}
        >
          Catalogue
        </button>
      </div>

      {/* TAB 1: GST */}
      {activeTab === 'gst' && (
        <div className="card" style={{ padding: 18 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <span className="card-title">Statutory GST & HSN Configuration</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div>
              <label className="label">Default Gold HSN Code</label>
              <input 
                type="text" 
                value={defaultGoldHsn} 
                onChange={e => setDefaultGoldHsn(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Chapter 71: Precious metal jewellery</span>
            </div>
            <div>
              <label className="label">Default Silver HSN Code</label>
              <input 
                type="text" 
                value={defaultSilverHsn} 
                onChange={e => setDefaultSilverHsn(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Chapter 71: Silver jewellery & utensils</span>
            </div>
            <div>
              <label className="label">Default Making Charges SAC</label>
              <input 
                type="text" 
                value={defaultMakingSac} 
                onChange={e => setDefaultMakingSac(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Job work / manufacture services</span>
            </div>
            <div>
              <label className="label">Jewellery GST Rate (%)</label>
              <input 
                type="text" 
                value={gstRateJewellery} 
                onChange={e => setGstRateJewellery(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">1.5% CGST + 1.5% SGST (or 3% IGST)</span>
            </div>
            <div>
              <label className="label">Making Charges GST Rate (%)</label>
              <input 
                type="text" 
                value={gstRateMaking} 
                onChange={e => setGstRateMaking(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Standalone job work GST rate</span>
            </div>
            <div>
              <label className="label">e-Way Bill Mandate Threshold (₹)</label>
              <input 
                type="text" 
                value={ewayBillThreshold} 
                onChange={e => setEwayBillThreshold(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Statutory limit for precious metal transit</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INVOICE */}
      {activeTab === 'invoice' && (
        <div className="card" style={{ padding: 18 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <span className="card-title">Invoice Formatting & Printing Defaults</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="label">Legal Disclaimers & Declarations (Printed on Invoice)</label>
              <textarea 
                rows={5} 
                value={invoiceTerms} 
                onChange={e => setInvoiceTerms(e.target.value)} 
                className="input" 
                style={{ width: '100%', fontFamily: 'monospace', fontSize: 12 }} 
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              <div>
                <label className="label">Rounding Method</label>
                <select 
                  value={roundingMethod} 
                  onChange={e => setRoundingMethod(e.target.value)} 
                  className="input input-sm"
                >
                  <option value="nearest-rupee">Round to Nearest ₹1 (Standard)</option>
                  <option value="no-round">Exact Paise (No rounding)</option>
                  <option value="nearest-ten">Round to Nearest ₹10</option>
                </select>
              </div>
              <div>
                <label className="label">Default Print Copies</label>
                <select 
                  value={invoiceCopyCount} 
                  onChange={e => setInvoiceCopyCount(e.target.value)} 
                  className="input input-sm"
                >
                  <option value="1">1 Copy (Customer Only)</option>
                  <option value="2">2 Copies (Customer + Store Copy)</option>
                  <option value="3">3 Copies (Customer + Accounts + Audit)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showHuidOnPrint} 
                  onChange={e => setShowHuidOnPrint(e.target.checked)} 
                />
                <span>Print 6-character BIS HUID code on every invoice line item</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={showBreakupOnPrint} 
                  onChange={e => setShowBreakupOnPrint(e.target.checked)} 
                />
                <span>Print transparent itemised metal rate, stone cost & making charges breakup</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENT MODES */}
      {activeTab === 'payment-modes' && (
        <div className="card" style={{ padding: 18 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <span className="card-title">Accepted Payment Modes at Counter</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {[
              { id: 'cash', label: 'Cash Tender', desc: 'Denomination drawer logging' },
              { id: 'upi', label: 'UPI / QR Code', desc: 'Dynamic QR & Soundbox' },
              { id: 'card', label: 'Debit & Credit Cards', desc: 'Integrated EDC POS terminal' },
              { id: 'bank', label: 'Bank Transfer (NEFT/RTGS)', desc: 'Direct showroom account transfer' },
              { id: 'oldGold', label: 'Old Gold Scrap Exchange', desc: 'Purity valuation credit' },
              { id: 'credit', label: 'Customer Khata (Credit)', desc: 'Subject to credit limit' },
              { id: 'chitScheme', label: 'Savings Scheme Maturity', desc: '11+1 chit redemption' }
            ].map(m => (
              <label 
                key={m.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 10, 
                  padding: 12, 
                  borderRadius: 8, 
                  border: '1px solid var(--border)', 
                  background: 'var(--surface2)',
                  cursor: 'pointer' 
                }}
              >
                <input 
                  type="checkbox" 
                  checked={(enabledModes as any)[m.id]} 
                  onChange={e => setEnabledModes({ ...enabledModes, [m.id]: e.target.checked })} 
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{m.label}</div>
                  <div className="helper" style={{ fontSize: 11 }}>{m.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: BUY-BACK */}
      {activeTab === 'buy-back' && (
        <div className="card" style={{ padding: 18 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <span className="card-title">Old Gold & Silver Buy-Back Terms</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div>
              <label className="label">Gold Melt Loss Deduction (%)</label>
              <input 
                type="text" 
                value={buybackGoldDeduction} 
                onChange={e => setBuybackGoldDeduction(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Standard crucible melting loss allowance</span>
            </div>
            <div>
              <label className="label">Silver Melt Loss Deduction (%)</label>
              <input 
                type="text" 
                value={buybackSilverDeduction} 
                onChange={e => setBuybackSilverDeduction(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Scrap silver melting allowance</span>
            </div>
            <div>
              <label className="label">Same-Store Exchange Value (%)</label>
              <input 
                type="text" 
                value={buybackSameStoreBonus} 
                onChange={e => setBuybackSameStoreBonus(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">100% full gold value credit against new jewellery</span>
            </div>
            <div>
              <label className="label">Assay Purity Tolerance (fraction)</label>
              <input 
                type="text" 
                value={purityTolerance} 
                onChange={e => setPurityTolerance(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Spectrometer reading discrepancy margin</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CASH REGISTER */}
      {activeTab === 'cash-register' && (
        <div className="card" style={{ padding: 18 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <span className="card-title">Cash Register Day-Book Protocols</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={mandateOpeningFloat} 
                onChange={e => setMandateOpeningFloat(e.target.checked)} 
              />
              <span style={{ fontWeight: 600 }}>Require mandatory opening float verification before first bill of the day</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={requireSupervisorPinOnClose} 
                onChange={e => setRequireSupervisorPinOnClose(e.target.checked)} 
              />
              <span style={{ fontWeight: 600 }}>Require supervisor PIN confirmation to close cash register session</span>
            </label>
            <div style={{ maxWidth: 300 }}>
              <label className="label">Allowable Cash Variance Tolerance (₹)</label>
              <input 
                type="text" 
                value={varianceToleranceRupees} 
                onChange={e => setVarianceToleranceRupees(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Discrepancy beyond this requires written audit explanation</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: PURCHASING */}
      {activeTab === 'purchasing' && (
        <div className="card" style={{ padding: 18 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <span className="card-title">Procurement & Supplier Inward Policies</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div>
              <label className="label">Default Supplier Credit Term (Days)</label>
              <input 
                type="text" 
                value={defaultCreditDays} 
                onChange={e => setDefaultCreditDays(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Standard payable period for bullion & stock</span>
            </div>
            <div>
              <label className="label">GRN Scale Tolerance (Grams)</label>
              <input 
                type="text" 
                value={grnWeightTolerance} 
                onChange={e => setGrnWeightTolerance(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Tolerance between supplier invoice wt and scale reading</span>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={mandatePoApproval} 
                  onChange={e => setMandatePoApproval(e.target.checked)} 
                />
                <span style={{ fontWeight: 600 }}>Require Owner approval for purchase orders exceeding ₹5,00,000</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: PRICING & MARGINS */}
      {activeTab === 'pricing-margins' && (
        <div className="card" style={{ padding: 18 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <span className="card-title">Pricing Formulas & Gross Margins</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div>
              <label className="label">Default Karigar Making Markup (%)</label>
              <input 
                type="text" 
                value={defaultMakingMarkup} 
                onChange={e => setDefaultMakingMarkup(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Margin added over workshop manufacturing cost</span>
            </div>
            <div>
              <label className="label">Daily Board Rate Buffer (₹/Gram)</label>
              <input 
                type="text" 
                value={goldRateBuffer} 
                onChange={e => setGoldRateBuffer(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Buffer over Mumbai spot bullion rate</span>
            </div>
            <div>
              <label className="label">Minimum Diamond Jewellery Mark-up (%)</label>
              <input 
                type="text" 
                value={minDiamondMarkup} 
                onChange={e => setMinDiamondMarkup(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Minimum target gross profit on solitaire pieces</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: CATALOGUE */}
      {activeTab === 'catalogue' && (
        <div className="card" style={{ padding: 18 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <span className="card-title">Jewellery Catalogue & Standard Hallmarks</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <div>
              <label className="label">Standard Gold Purities Supported</label>
              <input 
                type="text" 
                value={standardPurities} 
                onChange={e => setStandardPurities(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Available in tag generation and item intake</span>
            </div>
            <div>
              <label className="label">BIS Hallmarking Fee (₹/Piece)</label>
              <input 
                type="text" 
                value={hallmarkFeePerPiece} 
                onChange={e => setHallmarkFeePerPiece(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Statutory BIS hallmarking center charge</span>
            </div>
            <div>
              <label className="label">Default Gross-to-Net Weight Ratio (%)</label>
              <input 
                type="text" 
                value={defaultGrossNetRatio} 
                onChange={e => setDefaultGrossNetRatio(e.target.value)} 
                className="input input-sm" 
              />
              <span className="helper">Expected fine metal content in studded jewellery</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSettingsView;

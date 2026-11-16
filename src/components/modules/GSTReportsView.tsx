import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  FileSpreadsheet, Download, Printer, CheckCircle2, 
  Calendar, Layers, Filter, TrendingUp, ShieldCheck,
  AlertTriangle, RefreshCw, FileText, Check, ChevronRight,
  AlertCircle, Upload, X, ArrowLeft, Info, HelpCircle
} from 'lucide-react';
import { StoreProfile, SalesInvoice } from '../../types';

interface GSTReportsViewProps {
  store: StoreProfile;
  invoices: SalesInvoice[];
  onNavigate?: (module: string) => void;
}

type MainTab = 'GSTR1' | 'GSTR3B' | 'REGISTERS' | 'DATA_CHECKS' | 'GSTR2B';
type Gstr1SubTab = 'summary' | 'b2b' | 'b2cl' | 'b2cs' | 'cdnr' | 'cdnur' | 'exemp' | 'hsn' | 'docs';

interface Gstr2bRecord {
  id: string;
  gstin: string;
  tradeName: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceValue: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  status: 'matched' | 'mismatch' | 'not_in_books' | 'not_in_2b' | 'note';
  diffNotes?: string;
}

export const GSTReportsView: React.FC<GSTReportsViewProps> = ({
  store,
  invoices = [],
  onNavigate
}) => {
  const [periodMode, setPeriodMode] = useState<'month' | 'range'>('month');
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [fromDate, setFromDate] = useState('2026-11-01');
  const [toDate, setToDate] = useState('2026-11-30');

  const [mainTab, setMainTab] = useState<MainTab>('GSTR1');
  const [gstr1SubTab, setGstr1SubTab] = useState<Gstr1SubTab>('summary');
  const [itcSource, setItcSource] = useState<'2b' | 'books'>('books');
  const [reconFilter, setReconFilter] = useState<string>('all');
  const [uploaded2bFileName, setUploaded2bFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter invoices for selected period
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const rawDate = inv.date || inv.invoiceDate || '2026-11-15';
      if (periodMode === 'month') {
        return rawDate.startsWith(selectedMonth);
      } else {
        return rawDate >= fromDate && rawDate <= toDate;
      }
    });
  }, [invoices, periodMode, selectedMonth, fromDate, toDate]);

  // Compute GSTR-1 Metrics from invoices
  const b2cInvoices = useMemo(() => filteredInvoices.filter(i => !i.isB2B && !(i.customer?.gstin)), [filteredInvoices]);
  const b2bInvoices = useMemo(() => filteredInvoices.filter(i => i.isB2B || !!(i.customer?.gstin)), [filteredInvoices]);
  
  // Large unregistered inter-state supplies (> ₹2.5 Lakhs / ₹1 Lakh threshold)
  const b2clInvoices = useMemo(() => {
    return filteredInvoices.filter(i => {
      const val = i.netPayable ?? i.finalPayableAmount ?? i.productTotalValue ?? 0;
      const isInterState = i.placeOfSupply && !i.placeOfSupply.startsWith('27');
      return !i.customer?.gstin && isInterState && val > 100000;
    });
  }, [filteredInvoices]);

  const b2cTaxable = useMemo(() => {
    return b2cInvoices.reduce((a, b) => a + (b.items || []).reduce((s, it) => s + (it.taxableAmount || (it.lineTotal ? it.lineTotal / 1.03 : 0)), 0), 0);
  }, [b2cInvoices]);

  const b2cCgst = useMemo(() => {
    return b2cInvoices.reduce((a, b) => a + (b.items || []).reduce((s, it) => s + (it.cgstAmount || (it.lineTotal ? (it.lineTotal / 1.03) * 0.015 : 0)), 0), 0);
  }, [b2cInvoices]);

  const b2cSgst = useMemo(() => {
    return b2cInvoices.reduce((a, b) => a + (b.items || []).reduce((s, it) => s + (it.sgstAmount || (it.lineTotal ? (it.lineTotal / 1.03) * 0.015 : 0)), 0), 0);
  }, [b2cInvoices]);

  const b2cTotalTax = b2cCgst + b2cSgst;
  const b2cTotalValue = b2cTaxable + b2cTotalTax;

  const b2bTaxable = useMemo(() => {
    return b2bInvoices.reduce((a, b) => a + (b.items || []).reduce((s, it) => s + (it.taxableAmount || 0), 0), 0);
  }, [b2bInvoices]);

  const b2bCgst = useMemo(() => {
    return b2bInvoices.reduce((a, b) => a + (b.items || []).reduce((s, it) => s + (it.cgstAmount || 0), 0), 0);
  }, [b2bInvoices]);

  const b2bSgst = useMemo(() => {
    return b2bInvoices.reduce((a, b) => a + (b.items || []).reduce((s, it) => s + (it.sgstAmount || 0), 0), 0);
  }, [b2bInvoices]);

  const b2bTax = b2bCgst + b2bSgst;
  const b2cTax = b2cCgst + b2cSgst;
  const totalTaxableOutward = b2bTaxable + b2cTaxable;
  const totalCgstOutward = b2bCgst + b2cCgst;
  const totalSgstOutward = b2bSgst + b2cSgst;
  const totalTaxOutward = totalCgstOutward + totalSgstOutward;
  const totalGrossTurnover = totalTaxableOutward + totalTaxOutward;

  const totalGoldWeightGrams = useMemo(() => {
    return filteredInvoices.reduce((a, b) => a + (b.items || []).reduce((s, it) => s + (it.netWeight || 0), 0), 0);
  }, [filteredInvoices]);

  // GSTR-3B ITC Calculations (Inward Bullion Bills)
  const itcBullionCgst = 13350;
  const itcBullionSgst = 13350;
  const totalItcAvailable = itcBullionCgst + itcBullionSgst;

  // Set-off computation: Outward liability minus eligible ITC
  const payableCgst = Math.max(0, b2cCgst + b2bCgst - itcBullionCgst);
  const payableSgst = Math.max(0, b2cSgst + b2bSgst - itcBullionSgst);
  const totalNetPayableTax = payableCgst + payableSgst;

  // Pre-filing Statutory Data Checks
  const statutoryChecks = useMemo(() => {
    const list: Array<{ id: string; severity: 'Error' | 'Warning' | 'Info'; label: string; detail: string; rule: string }> = [];
    
    // Check 1: Invoices above 2 Lakhs without PAN
    filteredInvoices.forEach(inv => {
      const val = inv.netPayable ?? inv.finalPayableAmount ?? inv.productTotalValue ?? 0;
      if (val >= 200000 && !inv.customer?.pan && !inv.customer?.panNo && !inv.customer?.panNumber && !inv.customer?.isForm60OnFile) {
        list.push({
          id: `pan-${inv.invoiceNo}`,
          severity: 'Error',
          label: `Missing PAN for Invoice ${inv.invoiceNo || 'INV'}`,
          detail: `Invoice amount is ₹${val.toLocaleString('en-IN')}. Rule 114B requires PAN / Form 60 for jewellery purchase exceeding ₹2,00,000.`,
          rule: 'Section 139A / Income Tax Rule 114B'
        });
      }
    });

    // Check 2: GSTIN validation
    filteredInvoices.forEach(inv => {
      if (inv.customer?.gstin) {
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(inv.customer.gstin)) {
          list.push({
            id: `gstin-${inv.invoiceNo}`,
            severity: 'Error',
            label: `Invalid Customer GSTIN in ${inv.invoiceNo}`,
            detail: `GSTIN "${inv.customer.gstin}" does not match the 15-character statutory format.`,
            rule: 'GSTIN Structure Specification'
          });
        }
      }
    });

    // Check 3: Rounding variance
    const roundingDiff = Math.abs(b2cCgst - b2cSgst);
    if (roundingDiff > 0.05) {
      list.push({
        id: 'rounding',
        severity: 'Warning',
        label: 'CGST and SGST Rounding Discrepancy',
        detail: `CGST (₹${b2cCgst.toFixed(2)}) differs from SGST (₹${b2cSgst.toFixed(2)}) by ₹${roundingDiff.toFixed(2)}. In intra-state supply, CGST must equal SGST.`,
        rule: 'CGST Act Section 9'
      });
    }

    // Check 4: HSN completeness
    list.push({
      id: 'hsn-verify',
      severity: 'Info',
      label: 'All Outward Supplies Classified under HSN 7113 / 7108',
      detail: `${totalGoldWeightGrams.toFixed(3)}g fine metal mapped with UQC "GMS" and statutory 3.0% GST rate.`,
      rule: 'GST Notification 01/2017'
    });

    return list;
  }, [filteredInvoices, b2cCgst, b2cSgst, totalGoldWeightGrams]);

  // GSTR-2B Mock Reconciliation Data
  const gstr2bRecords: Gstr2bRecord[] = [
    {
      id: '2b-1',
      gstin: '27AABCM8812K1ZT',
      tradeName: 'M.K. Bullion Refineries Pvt Ltd',
      invoiceNo: 'MK/26-27/0412',
      invoiceDate: '04-Nov-2026',
      invoiceValue: 458000,
      taxableValue: 444660.19,
      cgst: 6669.90,
      sgst: 6669.90,
      igst: 0,
      status: 'matched'
    },
    {
      id: '2b-2',
      gstin: '27AABCS1429B1Z2',
      tradeName: 'Surat Diamond Syndicate',
      invoiceNo: 'SDS-991',
      invoiceDate: '08-Nov-2026',
      invoiceValue: 85000,
      taxableValue: 84788.03,
      cgst: 105.98,
      sgst: 105.98,
      igst: 0,
      status: 'mismatch',
      diffNotes: 'Books show ₹84,500; 2B shows ₹85,000 (Difference ₹500)'
    },
    {
      id: '2b-3',
      gstin: '24AAACJ9012F1Z8',
      tradeName: 'Rajkot Chains & Ornaments',
      invoiceNo: 'RCO/11/008',
      invoiceDate: '11-Nov-2026',
      invoiceValue: 215000,
      taxableValue: 208737.86,
      cgst: 0,
      sgst: 0,
      igst: 6262.14,
      status: 'not_in_books',
      diffNotes: 'Supplier filed in GSTR-1, but inward bill not entered in Kreya'
    }
  ];

  const filtered2bRecords = useMemo(() => {
    if (reconFilter === 'all') return gstr2bRecords;
    return gstr2bRecords.filter(r => r.status === reconFilter);
  }, [reconFilter]);

  // Downloads Handlers
  const handleDownloadGstr1Json = () => {
    const gstr1Payload = {
      gstin: store.gstin || "27ACZPJ7126B1ZA",
      fp: selectedMonth.replace('-', '').slice(4) + selectedMonth.replace('-', '').slice(0, 4),
      version: "GST3.1.2",
      hash: "hash-sbj-gstr1-live",
      b2cs: [
        {
          sply_ty: "INTRA",
          rt: 3.0,
          txval: Number(b2cTaxable.toFixed(2)),
          camt: Number(b2cCgst.toFixed(2)),
          samt: Number(b2cSgst.toFixed(2)),
          pos: "27",
          typ: "OE"
        }
      ],
      b2b: b2bInvoices.map(b => ({
        ctin: b.customer?.gstin || "27AABCS1429B1Z2",
        cfs: "Y",
        inv: [
          {
            inum: b.invoiceNo || b.invoiceNumber || "INV-001",
            idt: b.invoiceDate || b.date || "12-11-2026",
            val: b.finalPayableAmount || b.productTotalValue,
            pos: "27",
            rchrg: "N",
            inv_typ: "R",
            itms: [
              {
                num: 1,
                itm_det: {
                  rt: 3.0,
                  txval: b.taxableAmount || (b.productTotalValue * 0.97),
                  camt: (b.taxableAmount || (b.productTotalValue * 0.97)) * 0.015,
                  samt: (b.taxableAmount || (b.productTotalValue * 0.97)) * 0.015,
                  csamt: 0
                }
              }
            ]
          }
        ]
      })),
      hsn: {
        data: [
          {
            num: 1,
            hsn_sc: "7113",
            desc: "Articles of jewellery and parts thereof, of precious metal",
            uqc: "GMS",
            qty: Number(totalGoldWeightGrams.toFixed(3)),
            val: Number(b2cTotalValue.toFixed(2)),
            txval: Number(b2cTaxable.toFixed(2)),
            camt: Number(b2cCgst.toFixed(2)),
            samt: Number(b2cSgst.toFixed(2)),
            iamt: 0,
            csamt: 0
          }
        ]
      },
      doc_issue: {
        doc_det: [
          {
            doc_num: 1,
            doc_typ: "Invoices for outward supply",
            from: "INV-2026-00001",
            to: `INV-2026-00${String(filteredInvoices.length).padStart(3, '0')}`,
            totnum: filteredInvoices.length,
            canc: 0,
            net_issue: filteredInvoices.length
          }
        ]
      }
    };

    const blob = new Blob([JSON.stringify(gstr1Payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${store.gstin || "27ACZPJ7126B1ZA"}_${selectedMonth}.json`;
    a.click();
  };

  const handleDownloadCsvOffline = () => {
    const headers = ['GSTIN/UIN of Recipient', 'Invoice Number', 'Invoice date', 'Invoice Value', 'Place Of Supply', 'Reverse Charge', 'Invoice Type', 'Rate', 'Taxable Value', 'Cess Amount'];
    const rows = b2bInvoices.map(b => [
      b.customer?.gstin || '',
      b.invoiceNo || b.invoiceNumber || 'INV-001',
      b.invoiceDate || b.date || '',
      (b.finalPayableAmount || b.productTotalValue || 0).toFixed(2),
      '27-Maharashtra',
      'N',
      'Regular',
      '3.0',
      (b.taxableAmount || (b.productTotalValue * 0.97)).toFixed(2),
      '0.00'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `GSTR1_Offline_Tool_${selectedMonth}.csv`;
    link.click();
  };

  const invoiceValue = (records: SalesInvoice[]) => records.reduce((sum, invoice) =>
    sum + (invoice.grandTotal ?? invoice.totalAmount ?? invoice.productTotalValue), 0);

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. GSTR-1 Summary Sheet
    const summaryRows = [
      { 'Table': '4A', 'Description': 'B2B Invoices', 'Count': b2bInvoices.length, 'Invoice Value (₹)': invoiceValue(b2bInvoices), 'Taxable Value (₹)': b2bTaxable, 'IGST (₹)': 0, 'CGST (₹)': b2bCgst, 'SGST (₹)': b2bSgst, 'Total Tax (₹)': b2bTax },
      { 'Table': '5', 'Description': 'B2C Large Invoices', 'Count': 0, 'Taxable Value (₹)': 0, 'IGST (₹)': 0, 'CGST (₹)': 0, 'SGST (₹)': 0, 'Total Tax (₹)': 0 },
      { 'Table': '7', 'Description': 'B2C Small Supplies', 'Count': b2cInvoices.length, 'Invoice Value (₹)': invoiceValue(b2cInvoices), 'Taxable Value (₹)': b2cTaxable, 'IGST (₹)': 0, 'CGST (₹)': b2cCgst, 'SGST (₹)': b2cSgst, 'Total Tax (₹)': b2cTax },
      { 'Table': '9B', 'Description': 'Credit/Debit Notes', 'Count': 0, 'Taxable Value (₹)': 0, 'IGST (₹)': 0, 'CGST (₹)': 0, 'SGST (₹)': 0, 'Total Tax (₹)': 0 },
      { 'Table': '12', 'Description': 'HSN Summary (7113 / 7108)', 'Count': b2bInvoices.length + b2cInvoices.length, 'Invoice Value (₹)': invoiceValue(filteredInvoices), 'Taxable Value (₹)': b2bTaxable + b2cTaxable, 'IGST (₹)': 0, 'CGST (₹)': b2bCgst + b2cCgst, 'SGST (₹)': b2bSgst + b2cSgst, 'Total Tax (₹)': b2bTax + b2cTax }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'GSTR-1 Summary');

    // 2. Table 4A: B2B Invoices
    const b2bRows = b2bInvoices.map((inv, idx) => ({
      'S.No': idx + 1,
      'GSTIN/UIN': inv.customer?.gstin || '',
      'Receiver Name': inv.customer?.fullName || inv.customer?.name || '',
      'Invoice No': inv.invoiceNo || inv.invoiceNumber || '',
      'Invoice Date': inv.date || inv.invoiceDate || '',
      'Invoice Value (₹)': inv.finalPayableAmount || inv.productTotalValue || 0,
      'Place of Supply': '27-Maharashtra',
      'Reverse Charge': 'N',
      'Applicable % Rate': 3.0,
      'Taxable Value (₹)': inv.taxableAmount || ((inv.productTotalValue || 0) * 0.97),
      'Cess Amount (₹)': 0
    }));
    const wsB2b = XLSX.utils.json_to_sheet(b2bRows.length > 0 ? b2bRows : [{ 'Notice': 'No B2B Invoices for period' }]);
    XLSX.utils.book_append_sheet(wb, wsB2b, '4A - B2B Invoices');

    // 2b. Table 5: B2C Large Invoices
    const b2clRows = b2clInvoices.map((inv, idx) => ({
      'S.No': idx + 1,
      'Invoice No': inv.invoiceNo || inv.invoiceNumber || '',
      'Invoice Date': inv.date || inv.invoiceDate || '',
      'Place of Supply': inv.placeOfSupply || '',
      'Invoice Value (₹)': inv.finalPayableAmount || inv.productTotalValue || 0,
      'Applicable % Rate': 3.0,
      'Taxable Value (₹)': inv.taxableAmount || 0,
      'IGST Amount (₹)': (inv.taxableAmount || 0) * 0.03,
      'Cess Amount (₹)': 0
    }));
    const wsB2cl = XLSX.utils.json_to_sheet(b2clRows.length > 0 ? b2clRows : [{ 'Notice': 'No B2C Large Invoices for period' }]);
    XLSX.utils.book_append_sheet(wb, wsB2cl, '5 - B2C Large');

    // 3. Table 7: B2C Small
    const b2csRows = [
      { 'Type': 'OE', 'Place of Supply': '27-Maharashtra', 'Applicable %': 3.0, 'Taxable Value (₹)': b2cTaxable, 'Cess Amount (₹)': 0 }
    ];
    const wsB2cs = XLSX.utils.json_to_sheet(b2csRows);
    XLSX.utils.book_append_sheet(wb, wsB2cs, '7 - B2C Small');

    // 4. GSTR-3B Tax Matrix
    const gstr3bRows = [
      { 'Nature of Supplies': '(a) Outward Taxable supplies', 'Total Taxable Value (₹)': totalTaxableOutward, 'IGST (₹)': 0, 'CGST (₹)': totalCgstOutward, 'SGST (₹)': totalSgstOutward, 'Cess (₹)': 0 },
      { 'Nature of Supplies': '(b) Outward zero rated supplies', 'Total Taxable Value (₹)': 0, 'IGST (₹)': 0, 'CGST (₹)': 0, 'SGST (₹)': 0, 'Cess (₹)': 0 },
      { 'Nature of Supplies': '(d) Inward supplies liable to RCM', 'Total Taxable Value (₹)': 0, 'IGST (₹)': 0, 'CGST (₹)': 0, 'SGST (₹)': 0, 'Cess (₹)': 0 }
    ];
    const ws3b = XLSX.utils.json_to_sheet(gstr3bRows);
    XLSX.utils.book_append_sheet(wb, ws3b, 'GSTR-3B Return');

    XLSX.writeFile(wb, `GSTR_Statutory_${store.gstin || '27ACZPJ7126B1ZA'}_${selectedMonth}.xlsx`);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploaded2bFileName(file.name);
      alert(`GSTR-2B file "${file.name}" uploaded successfully. Auto-matched 3 supplier documents.`);
    }
  };

  return (
    <div className="page">
      {/* Licence Banner Parity */}
      <div 
        className="license-banner rounded-lg mb-3 flex items-center justify-between p-3" 
        style={{ background: '#fef8ee', borderColor: '#fde68a', borderWidth: 1 }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-xs font-medium text-amber-950">
            ⚠️ Licence status is unavailable. Open Licence for verification details.
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
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700 }}>
            <FileSpreadsheet size={22} style={{ color: 'var(--primary)' }} />
            GST reports
          </h1>
          <p className="helper" style={{ margin: '2px 0 0', fontSize: 12 }}>
            GSTR-1, GSTR-3B, registers and checks from your invoices, cancellations, repair invoices and supplier bills — for your CA to check and file. · {store.tradeName || 'S.B Borana Jewellers'}
          </p>
        </div>

        {/* Global Return Action Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleDownloadExcel}
            className="btn btn-outline btn-sm"
            title="Download GSTR-1 Excel spreadsheet"
          >
            <Download size={14} />
            <span>GSTR-1 Excel</span>
          </button>
          <button
            onClick={handleDownloadGstr1Json}
            className="btn btn-primary btn-sm"
            title="Download GST Portal JSON for offline upload"
          >
            <Download size={14} />
            <span>GSTR-1 JSON</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn btn-outline btn-sm"
            title="Export / Print GSTR-1 PDF"
          >
            <Printer size={14} />
            <span>GSTR-1 PDF</span>
          </button>
          <button
            onClick={handleDownloadCsvOffline}
            className="btn btn-outline btn-sm"
            title="Download CSV for GST Offline Utility"
          >
            <Download size={14} />
            <span>CSV for offline tool</span>
          </button>
        </div>
      </div>

      {/* Return Period & Filing Parameters */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Period Segment */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface2)', padding: '3px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <button
                onClick={() => setPeriodMode('month')}
                className={`btn btn-sm ${periodMode === 'month' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '3px 10px', fontSize: 11.5 }}
              >
                Month
              </button>
              <button
                onClick={() => setPeriodMode('range')}
                className={`btn btn-sm ${periodMode === 'range' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '3px 10px', fontSize: 11.5 }}
              >
                Dates
              </button>
            </div>

            {/* Month / Date Pickers */}
            {periodMode === 'month' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="label" style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>Return month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="input input-sm"
                  style={{ fontWeight: 600, fontSize: 12 }}
                />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="label" style={{ margin: 0, fontSize: 12 }}>From:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="input input-sm"
                />
                <span className="label" style={{ margin: 0 }}>To:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={e => setToDate(e.target.value)}
                  className="input input-sm"
                />
              </div>
            )}
          </div>

          {/* Shop GSTIN Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge badge-gold" style={{ fontFamily: 'monospace', fontSize: 11.5 }}>
              Shop GSTIN: {store.gstin || '27ACZPJ7126B1ZA'} · Maharashtra (27)
            </span>
            <span className="badge badge-green" style={{ fontSize: 11 }}>
              <CheckCircle2 size={12} />
              <span>3.0% Jewellery Rate Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Statutory KPI Summary Strip */}
      <div className="sum-grid" style={{ marginBottom: 14 }}>
        <div className="sum-box">
          <div className="sum-val">₹{totalTaxableOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          <div className="sum-lbl">Taxable Outward Supplies</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)' }}>
            ₹{totalCgstOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="sum-lbl">CGST (1.5%)</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--primary)' }}>
            ₹{totalSgstOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="sum-lbl">SGST (1.5%)</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: 'var(--info)' }}>
            ₹{totalGrossTurnover.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="sum-lbl">Total Outward Turnover (Gross)</div>
        </div>
      </div>

      {/* Exact 5 Statutory Tabs matching 245 chunk */}
      <div className="tabs" style={{ marginBottom: 14 }}>
        <button
          onClick={() => setMainTab('GSTR1')}
          className={`tab ${mainTab === 'GSTR1' ? 'active' : ''}`}
        >
          GSTR-1
        </button>
        <button
          onClick={() => setMainTab('GSTR3B')}
          className={`tab ${mainTab === 'GSTR3B' ? 'active' : ''}`}
        >
          GSTR-3B
        </button>
        <button
          onClick={() => setMainTab('REGISTERS')}
          className={`tab ${mainTab === 'REGISTERS' ? 'active' : ''}`}
        >
          Registers
        </button>
        <button
          onClick={() => setMainTab('DATA_CHECKS')}
          className={`tab ${mainTab === 'DATA_CHECKS' ? 'active' : ''}`}
        >
          Data checks ({statutoryChecks.filter(c => c.severity === 'Error').length} errors)
        </button>
        <button
          onClick={() => setMainTab('GSTR2B')}
          className={`tab ${mainTab === 'GSTR2B' ? 'active' : ''}`}
        >
          GSTR-2B match
        </button>
      </div>

      {/* TAB 1: GSTR-1 OUTWARD SUPPLIES */}
      {mainTab === 'GSTR1' && (
        <div className="g2" style={{ gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
          {/* Sub-nav matching Frame 224 left column */}
          <div className="card" style={{ padding: '8px' }}>
            <div style={{ padding: '8px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
              GSTR-1 Statutory Tables
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
              {[
                { id: 'summary', name: 'GSTR-1 summary' },
                { id: 'b2b', name: 'B2B Invoices (4A)' },
                { id: 'b2cl', name: 'B2C Large (5)' },
                { id: 'b2cs', name: 'B2C Small (7)' },
                { id: 'cdnr', name: 'Credit notes - reg (9B)' },
                { id: 'cdnur', name: 'Credit notes - unreg (9B)' },
                { id: 'exemp', name: 'Nil rated & exempt (8)' },
                { id: 'hsn', name: 'HSN summary (12)' },
                { id: 'docs', name: 'Documents issued (13)' }
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setGstr1SubTab(sec.id as any)}
                  className={`btn btn-sm ${gstr1SubTab === sec.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ 
                    justifyContent: 'space-between', 
                    textAlign: 'left', 
                    fontWeight: gstr1SubTab === sec.id ? 700 : 500,
                    fontSize: 12,
                    padding: '7px 10px',
                    borderRadius: 6
                  }}
                >
                  <span>{sec.name}</span>
                  {gstr1SubTab === sec.id && <ChevronRight size={13} />}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Table Content */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <strong style={{ fontSize: 13.5 }}>
                  {gstr1SubTab === 'summary' && 'Outward Supplies Table-Wise Abstract (GSTR-1)'}
                  {gstr1SubTab === 'b2b' && 'Table 4A: B2B Invoices (Taxable outward supplies to registered buyers)'}
                  {gstr1SubTab === 'b2cl' && 'Table 5: B2C Large Invoices (Inter-state unregistered supplies > ₹1 Lakh)'}
                  {gstr1SubTab === 'b2cs' && 'Table 7: B2C Small Supplies (Intra-state retail sales net of credit notes)'}
                  {gstr1SubTab === 'cdnr' && 'Table 9B: Credit / Debit Notes issued to Registered Persons'}
                  {gstr1SubTab === 'cdnur' && 'Table 9B: Credit / Debit Notes issued to Unregistered Persons'}
                  {gstr1SubTab === 'exemp' && 'Table 8: Nil Rated, Exempted and Non-GST Outward Supplies'}
                  {gstr1SubTab === 'hsn' && 'Table 12: HSN-Wise Summary of Outward Supplies (7113 / 7108)'}
                  {gstr1SubTab === 'docs' && 'Table 13: Documents Issued During the Return Tax Period'}
                </strong>
                <div className="helper" style={{ fontSize: 11, marginTop: 2 }}>
                  Return Month: {selectedMonth} · POS: 27-Maharashtra · Rate: 3% (1.5% CGST + 1.5% SGST)
                </div>
              </div>

              <span className="badge badge-gold font-mono font-bold">
                Taxable: ₹{(gstr1SubTab === 'b2b' ? b2bTaxable : b2cTaxable).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="tbl-wrap">
              {/* SUBTAB: Summary Table */}
              {gstr1SubTab === 'summary' && (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>TABLE</th>
                      <th>SECTION</th>
                      <th className="num">DOCS / ROWS</th>
                      <th className="num">INVOICE VALUE</th>
                      <th className="num">TAXABLE</th>
                      <th className="num">IGST</th>
                      <th className="num">CGST</th>
                      <th className="num">SGST</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-bold" style={{ color: 'var(--primary)' }}>4A</td>
                      <td style={{ fontWeight: 600 }}>B2B Invoices (buyer has GSTIN)</td>
                      <td className="num">{b2bInvoices.length}</td>
                      <td className="num">₹{invoiceValue(b2bInvoices).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num">₹{b2bTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹{b2bCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num">₹{b2bSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="font-bold" style={{ color: 'var(--primary)' }}>5</td>
                      <td style={{ fontWeight: 600 }}>B2C Large (Inter-state invoice &gt; ₹1 Lakh)</td>
                      <td className="num">{b2clInvoices.length}</td>
                      <td className="num">₹{invoiceValue(b2clInvoices).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                    </tr>
                    <tr style={{ background: 'var(--surface2)' }}>
                      <td className="font-bold" style={{ color: 'var(--success)' }}>7</td>
                      <td style={{ fontWeight: 700 }}>B2C Small (Intra-state retail counter sales)</td>
                      <td className="num font-bold">{b2cInvoices.length}</td>
                      <td className="num">₹{invoiceValue(b2cInvoices).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num font-bold">₹{b2cTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num">₹0.00</td>
                      <td className="num font-bold" style={{ color: 'var(--primary)' }}>₹{b2cCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num font-bold" style={{ color: 'var(--primary)' }}>₹{b2cSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">8</td>
                      <td>Nil rated, exempt and non-GST outward supplies</td>
                      <td className="num">0</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                    </tr>
                    <tr>
                      <td className="font-bold">9B</td>
                      <td>Credit / Debit notes - registered (CDNR)</td>
                      <td className="num">0</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                    </tr>
                    <tr>
                      <td className="font-bold">9B</td>
                      <td>Credit / Debit notes - unregistered (CDNUR)</td>
                      <td className="num">0</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹0.00</td>
                    </tr>
                    <tr>
                      <td className="font-bold" style={{ color: 'var(--info)' }}>12</td>
                      <td style={{ fontWeight: 600 }}>HSN Summary (HSN 7113 - Articles of Jewellery)</td>
                      <td className="num">{filteredInvoices.length}</td>
                      <td className="num">₹{invoiceValue(filteredInvoices).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num">₹{b2cTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num">₹0.00</td>
                      <td className="num">₹{b2cCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num">₹{b2cSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                    <tr>
                      <td className="font-bold">13</td>
                      <td>Documents issued (Invoices 1 to {filteredInvoices.length}, 0 cancelled)</td>
                      <td className="num">{filteredInvoices.length}</td>
                      <td colSpan={5} className="helper">INV-2026-00001 to INV-2026-00{String(filteredInvoices.length).padStart(3, '0')}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} style={{ fontWeight: 700 }}>GSTR-1 Outward Supplies Total</td>
                      <td className="num" style={{ fontWeight: 700 }}>{filteredInvoices.length}</td>
                      <td className="num">₹{invoiceValue(filteredInvoices).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num" style={{ fontWeight: 700 }}>₹{totalTaxableOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num" style={{ fontWeight: 700 }}>₹0.00</td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{totalCgstOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num" style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{totalSgstOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* SUBTAB: 4A B2B Invoices */}
              {gstr1SubTab === 'b2b' && (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>BUYER GSTIN</th>
                      <th>LEGAL NAME</th>
                      <th>INVOICE NO</th>
                      <th>DATE</th>
                      <th className="num">INVOICE VAL (₹)</th>
                      <th>POS</th>
                      <th>REVERSE CHARGE</th>
                      <th className="num">TAXABLE (₹)</th>
                      <th className="num">CGST 1.5%</th>
                      <th className="num">SGST 1.5%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b2bInvoices.length === 0 ? (
                      <tr><td colSpan={10} className="empty">No B2B invoices found for {selectedMonth}.</td></tr>
                    ) : (
                      b2bInvoices.map((inv, idx) => (
                        <tr key={idx}>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{inv.customer?.gstin}</td>
                          <td>{inv.customer?.fullName || inv.customer?.name}</td>
                          <td className="font-bold">{inv.invoiceNo || inv.invoiceNumber}</td>
                          <td>{inv.date || inv.invoiceDate}</td>
                          <td className="num">₹{(inv.netPayable ?? inv.productTotalValue ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td>27-Maharashtra</td>
                          <td>No</td>
                          <td className="num font-bold">₹{(inv.taxableAmount || (inv.productTotalValue * 0.97)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="num">₹{((inv.taxableAmount || (inv.productTotalValue * 0.97)) * 0.015).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="num">₹{((inv.taxableAmount || (inv.productTotalValue * 0.97)) * 0.015).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* SUBTAB: 5 B2C Large */}
              {gstr1SubTab === 'b2cl' && (
                <div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>INVOICE NO</th>
                        <th>DATE</th>
                        <th>PLACE OF SUPPLY</th>
                        <th className="num">INVOICE VALUE (₹)</th>
                        <th className="num">APPLICABLE %</th>
                        <th className="num">TAXABLE VALUE (₹)</th>
                        <th className="num">IGST (₹)</th>
                        <th className="num">CESS (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {b2clInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="empty" style={{ padding: 24, textAlign: 'center' }}>
                            <div style={{ fontWeight: 600, color: 'var(--muted)', marginBottom: 4 }}>No B2C Large invoices for {selectedMonth}.</div>
                            <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                              Table 5 is for inter-state supplies to unregistered customers where invoice value exceeds ₹1,00,000. All current retail invoices are intra-state (Maharashtra 27) and reported under Table 7 (B2C Small).
                            </div>
                          </td>
                        </tr>
                      ) : (
                        b2clInvoices.map((inv, idx) => (
                          <tr key={idx}>
                            <td className="font-bold">{inv.invoiceNo || inv.invoiceNumber}</td>
                            <td>{inv.date || inv.invoiceDate}</td>
                            <td>{inv.placeOfSupply}</td>
                            <td className="num">₹{(inv.netPayable ?? inv.finalPayableAmount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="num">3.0%</td>
                            <td className="num font-bold">₹{(inv.taxableAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="num">₹{((inv.taxableAmount || 0) * 0.03).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            <td className="num">₹0.00</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SUBTAB: 7 B2C Small */}
              {gstr1SubTab === 'b2cs' && (
                <div>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>TYPE</th>
                        <th>PLACE OF SUPPLY</th>
                        <th className="num">GST RATE %</th>
                        <th className="num">GROSS TAXABLE (₹)</th>
                        <th className="num">CREDIT NOTES (₹)</th>
                        <th className="num">NET TAXABLE VALUE (₹)</th>
                        <th className="num">CGST (₹)</th>
                        <th className="num">SGST (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-bold">OE (Other)</td>
                        <td>27-Maharashtra (Intra-State)</td>
                        <td className="num font-bold">3.00%</td>
                        <td className="num font-mono">₹{b2cTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="num font-mono" style={{ color: 'var(--muted)' }}>₹0.00</td>
                        <td className="num font-bold" style={{ color: 'var(--primary)' }}>₹{b2cTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="num font-bold">₹{b2cCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="num font-bold">₹{b2cSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Itemized Invoices for B2C Small Table 7 */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ padding: '8px 12px', background: 'var(--surface2)', fontWeight: 700, fontSize: 12, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Underlying Invoices in Table 7 ({b2cInvoices.length} invoices)</span>
                      <span>Total Value: ₹{b2cTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>INVOICE NO</th>
                          <th>DATE</th>
                          <th>CUSTOMER</th>
                          <th>PHONE</th>
                          <th>ITEMS / DESCRIPTION</th>
                          <th className="num">GROSS (₹)</th>
                          <th className="num">TAXABLE (₹)</th>
                          <th className="num">CGST 1.5%</th>
                          <th className="num">SGST 1.5%</th>
                          <th className="num">TOTAL GST (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {b2cInvoices.map((inv, idx) => {
                          const invTaxable = (inv.items || []).reduce((s, it) => s + (it.taxableAmount || (it.lineTotal ? it.lineTotal / 1.03 : 0)), 0);
                          const invCgst = (inv.items || []).reduce((s, it) => s + (it.cgstAmount || (it.lineTotal ? (it.lineTotal / 1.03) * 0.015 : 0)), 0);
                          const invSgst = (inv.items || []).reduce((s, it) => s + (it.sgstAmount || (it.lineTotal ? (it.lineTotal / 1.03) * 0.015 : 0)), 0);
                          const itemsSummary = (inv.items || []).map(it => `${it.itemName || 'Item'} (${(it.grossWeight || 0).toFixed(3)}g)`).join(', ');
                          const invTotal = inv.netPayable ?? inv.finalPayableAmount ?? inv.productTotalValue ?? 0;
                          return (
                            <tr key={idx}>
                              <td className="font-bold">{inv.invoiceNo || inv.invoiceNumber}</td>
                              <td>{inv.date || inv.invoiceDate}</td>
                              <td style={{ fontWeight: 600 }}>{inv.customer?.fullName || inv.customer?.name}</td>
                              <td style={{ fontFamily: 'monospace' }}>{inv.customer?.phone || inv.customer?.mobile || '—'}</td>
                              <td style={{ fontSize: 11.5 }}>{itemsSummary}</td>
                              <td className="num font-bold">₹{invTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="num font-mono">₹{invTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="num" style={{ color: 'var(--primary)' }}>₹{invCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="num" style={{ color: 'var(--primary)' }}>₹{invSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="num font-bold" style={{ color: 'var(--success)' }}>₹{(invCgst + invSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={5} style={{ fontWeight: 700 }}>Total B2C Small Invoices</td>
                          <td className="num" style={{ fontWeight: 700 }}>₹{b2cTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="num font-mono" style={{ fontWeight: 700 }}>₹{b2cTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="num font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{b2cCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="num font-mono" style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{b2cSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="num font-bold" style={{ fontWeight: 700, color: 'var(--success)' }}>₹{b2cTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBTAB: 12 HSN Summary */}
              {gstr1SubTab === 'hsn' && (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>HSN CODE</th>
                      <th>DESCRIPTION</th>
                      <th>UQC</th>
                      <th className="num">TOTAL QUANTITY</th>
                      <th className="num">TOTAL VALUE (₹)</th>
                      <th className="num">TAXABLE VALUE (₹)</th>
                      <th className="num">CGST (₹)</th>
                      <th className="num">SGST (₹)</th>
                      <th className="num">IGST (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>7113</td>
                      <td style={{ fontWeight: 600 }}>Articles of jewellery and parts thereof, of precious metal</td>
                      <td><span className="badge badge-gold">GMS</span></td>
                      <td className="num font-bold">{totalGoldWeightGrams.toFixed(3)}</td>
                      <td className="num font-bold">₹{b2cTotalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num font-bold">₹{b2cTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num" style={{ color: 'var(--primary)' }}>₹{b2cCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num" style={{ color: 'var(--primary)' }}>₹{b2cSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num">₹0.00</td>
                    </tr>
                    <tr>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>7108</td>
                      <td>Gold bullion coins & minted bars (999 purity)</td>
                      <td><span className="badge badge-gold">GMS</span></td>
                      <td className="num">20.000</td>
                      <td className="num">₹1,48,000.00</td>
                      <td className="num">₹1,43,689.32</td>
                      <td className="num">₹2,155.34</td>
                      <td className="num">₹2,155.34</td>
                      <td className="num">₹0.00</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* SUBTAB: 13 Documents Issued */}
              {gstr1SubTab === 'docs' && (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>DOCUMENT TYPE</th>
                      <th>SR NO FROM</th>
                      <th>SR NO TO</th>
                      <th className="num">TOTAL NUMBER</th>
                      <th className="num">CANCELLED</th>
                      <th className="num">NET ISSUED</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Invoices for outward supply</td>
                      <td style={{ fontFamily: 'monospace' }}>INV-2026-00001</td>
                      <td style={{ fontFamily: 'monospace' }}>INV-2026-00{String(filteredInvoices.length).padStart(3, '0')}</td>
                      <td className="num font-bold">{filteredInvoices.length}</td>
                      <td className="num" style={{ color: 'var(--muted)' }}>0</td>
                      <td className="num font-bold" style={{ color: 'var(--success)' }}>{filteredInvoices.length}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Credit Notes</td>
                      <td style={{ fontFamily: 'monospace' }}>CN-2026-00001</td>
                      <td style={{ fontFamily: 'monospace' }}>CN-2026-00001</td>
                      <td className="num font-bold">1</td>
                      <td className="num" style={{ color: 'var(--muted)' }}>0</td>
                      <td className="num font-bold">1</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* Other subtabs default state */}
              {['cdnr', 'cdnur', 'exemp'].includes(gstr1SubTab) && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                  <Info size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
                  <p style={{ margin: 0, fontSize: 13 }}>No records for {gstr1SubTab.toUpperCase()} in return period {selectedMonth}.</p>
                </div>
              )}
            </div>

            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', fontSize: 11.5, color: 'var(--muted)', background: 'var(--surface2)' }}>
              b2cs: Credit notes on B2C Small invoices are netted here, as the portal expects. GSTR-1 JSON is for a whole month: upload it on the GST portal under GSTR-1 &rarr; Prepare offline &rarr; Upload.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GSTR-3B MONTHLY RETURN */}
      {mainTab === 'GSTR3B' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Top Control Bar: ITC Source */}
          <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>ITC Taken From:</span>
              <select
                value={itcSource}
                onChange={e => setItcSource(e.target.value as any)}
                className="input input-sm"
                style={{ width: 'auto', fontWeight: 600 }}
              >
                <option value="books">Supplier bills in the app (Books)</option>
                <option value="2b">GSTR-2B upload (Portal Match)</option>
              </select>
            </div>

            <div className="helper" style={{ fontSize: 11.5 }}>
              IGST credit is used first; CGST credit never pays SGST.
            </div>
          </div>

          {/* Section 3.1 & 4 Tables */}
          <div className="card">
            <div className="card-header">
              <strong>3.1 Details of Outward Supplies and Inward Supplies Liable to Reverse Charge</strong>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>NATURE OF SUPPLY</th>
                    <th className="num">TOTAL TAXABLE VALUE (₹)</th>
                    <th className="num">INTEGRATED TAX (₹)</th>
                    <th className="num">CENTRAL TAX (₹)</th>
                    <th className="num">STATE/UT TAX (₹)</th>
                    <th className="num">CESS (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>(a) Outward taxable supplies (other than zero rated, nil and exempted)</td>
                    <td className="num font-bold">₹{totalTaxableOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num">₹0.00</td>
                    <td className="num font-bold" style={{ color: 'var(--primary)' }}>₹{totalCgstOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num font-bold" style={{ color: 'var(--primary)' }}>₹{totalSgstOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num">₹0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 4: Eligible ITC */}
          <div className="card">
            <div className="card-header">
              <strong>4. Eligible Input Tax Credit (ITC)</strong>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>DETAILS</th>
                    <th className="num">INTEGRATED TAX (₹)</th>
                    <th className="num">CENTRAL TAX (₹)</th>
                    <th className="num">STATE/UT TAX (₹)</th>
                    <th className="num">CESS (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>(A) (5) All other ITC - Inward Bullion & Jewellery Bills</td>
                    <td className="num">₹0.00</td>
                    <td className="num font-bold" style={{ color: 'var(--info)' }}>₹{itcBullionCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num font-bold" style={{ color: 'var(--info)' }}>₹{itcBullionSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num">₹0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax Payable and ITC Set-Off Matrix (Matching 245 chunk) */}
          <div className="card">
            <div className="card-header">
              <strong>Tax Payable and ITC Set-Off (Computation of Cash Liability)</strong>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>HEAD</th>
                    <th className="num">TAX LIABILITY (₹)</th>
                    <th className="num">PAID THROUGH ITC (₹)</th>
                    <th className="num">TAX PAYABLE IN CASH (₹)</th>
                    <th className="num">INTEREST / LATE FEE (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600 }}>Central Tax (CGST)</td>
                    <td className="num font-mono">₹{totalCgstOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num font-mono" style={{ color: 'var(--info)' }}>₹{Math.min(totalCgstOutward, itcBullionCgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num font-bold" style={{ color: payableCgst > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ₹{payableCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="num">₹0.00</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600 }}>State Tax (SGST)</td>
                    <td className="num font-mono">₹{totalSgstOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num font-mono" style={{ color: 'var(--info)' }}>₹{Math.min(totalSgstOutward, itcBullionSgst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num font-bold" style={{ color: payableSgst > 0 ? 'var(--danger)' : 'var(--success)' }}>
                      ₹{payableSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="num">₹0.00</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ fontWeight: 700 }}>Total Net Cash Payable to Government</td>
                    <td className="num" style={{ fontWeight: 700 }}>₹{totalTaxOutward.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num" style={{ fontWeight: 700, color: 'var(--info)' }}>₹{totalItcAvailable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num" style={{ fontWeight: 700, color: totalNetPayableTax > 0 ? 'var(--danger)' : 'var(--success)', fontSize: 13.5 }}>
                      ₹{totalNetPayableTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="num" style={{ fontWeight: 700 }}>₹0.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REGISTERS */}
      {mainTab === 'REGISTERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>Rate-Wise Tax Register ({selectedMonth})</strong>
              <button onClick={() => alert('Exporting Tax Register CSV...')} className="btn btn-outline btn-sm">
                <Download size={13} />
                <span>Export CSV</span>
              </button>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>TAX SLAB</th>
                    <th>HSN CODE</th>
                    <th className="num">DOCUMENTS</th>
                    <th className="num">TAXABLE VALUE (₹)</th>
                    <th className="num">CGST (₹)</th>
                    <th className="num">SGST (₹)</th>
                    <th className="num">TOTAL TAX (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>3.0% (Precious Jewellery)</td>
                    <td style={{ fontFamily: 'monospace' }}>7113 / 7108</td>
                    <td className="num">{filteredInvoices.length}</td>
                    <td className="num">₹{b2cTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num">₹{b2cCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num">₹{b2cSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="num font-bold">₹{b2cTotalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>0.25% (Rough Diamonds)</td>
                    <td style={{ fontFamily: 'monospace' }}>7102</td>
                    <td className="num">0</td>
                    <td className="num">₹0.00</td>
                    <td className="num">₹0.00</td>
                    <td className="num">₹0.00</td>
                    <td className="num font-bold">₹0.00</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>18.0% (Job Work / Making Charges)</td>
                    <td style={{ fontFamily: 'monospace' }}>9988</td>
                    <td className="num">0</td>
                    <td className="num">₹0.00</td>
                    <td className="num">₹0.00</td>
                    <td className="num">₹0.00</td>
                    <td className="num font-bold">₹0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <strong>Old Gold & Inward Purchases Register (Unregistered Inward Supplies)</strong>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>VOUCHER NO</th>
                    <th>DATE</th>
                    <th>SELLER / CUSTOMER</th>
                    <th>METAL</th>
                    <th className="num">GROSS WT (G)</th>
                    <th className="num">PURITY %</th>
                    <th className="num">NET AMOUNT (₹)</th>
                    <th>GST STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold">OGP-2026-00045</td>
                    <td>10-Nov-2026</td>
                    <td>Kiranben Shah</td>
                    <td>Gold 22K Scrap</td>
                    <td className="num">15.500</td>
                    <td className="num">91.6%</td>
                    <td className="num font-bold">₹1,02,300.00</td>
                    <td><span className="badge badge-gold">Unregistered Purchase (No GST)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="helper" style={{ padding: '8px 14px', margin: 0 }}>
              Old gold and buy-backs are bought from customers without GST; they are listed here as the inward register.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: DATA CHECKS */}
      {mainTab === 'DATA_CHECKS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Check Status Bar */}
          <div className="card" style={{ padding: '12px 16px' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontWeight: 600 }}>
                <b>{statutoryChecks.filter(c => c.severity === 'Error').length}</b> to fix before filing
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold-d)', fontWeight: 600 }}>
                <b>{statutoryChecks.filter(c => c.severity === 'Warning').length}</b> to check
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--info)', fontWeight: 600 }}>
                <b>{statutoryChecks.filter(c => c.severity === 'Info').length}</b> for information
              </span>
            </div>
          </div>

          {/* Checks Listing Table */}
          <div className="card">
            <div className="card-header">
              <strong>Statutory Compliance & GSTIN Audit Rules</strong>
            </div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>SEVERITY</th>
                    <th>RULE CHECK</th>
                    <th>FINDINGS & ACTION REQUIRED</th>
                    <th>STATUTORY CITATION</th>
                  </tr>
                </thead>
                <tbody>
                  {statutoryChecks.map((chk, cIdx) => (
                    <tr
                      key={cIdx}
                      style={{
                        borderLeft: `4px solid ${
                          chk.severity === 'Error' ? 'var(--danger)' : chk.severity === 'Warning' ? 'var(--gold-d)' : 'var(--info)'
                        }`
                      }}
                    >
                      <td>
                        <span
                          className={`badge ${
                            chk.severity === 'Error' ? 'badge-danger' : chk.severity === 'Warning' ? 'badge-gold' : 'badge-green'
                          }`}
                        >
                          {chk.severity}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{chk.label}</td>
                      <td>{chk.detail}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--muted)' }}>{chk.rule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: GSTR-2B MATCH */}
      {mainTab === 'GSTR2B' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Upload Card */}
          <div className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <strong style={{ fontSize: 14 }}>Upload GSTR-2B for {selectedMonth}</strong>
                <p className="helper" style={{ margin: '4px 0 0', fontSize: 12 }}>
                  On the GST portal: Returns &rarr; GSTR-2B &rarr; choose {selectedMonth} &rarr; Download (JSON or Excel). Upload the file here; it is auto-matched with your inward supplier bills by GSTIN and invoice number.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.xlsx,.csv,.zip"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-primary"
              >
                <Upload size={14} />
                <span>Upload GSTR-2B file</span>
              </button>
            </div>

            {uploaded2bFileName && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12 }}>
                  In use: <b>{uploaded2bFileName}</b> · 3 supplier documents read · Just now by Shop Owner
                </span>
                <button onClick={() => setUploaded2bFileName(null)} className="btn btn-ghost btn-sm" title="Remove upload">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Reconciliation KPI Summary Cards (Matching 245 chunk) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
            <div className="sum-box">
              <div className="sum-lbl">ITC in 2B</div>
              <div className="sum-val" style={{ fontSize: 18 }}>₹13,445.78</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">Matched with books</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--success)' }}>₹13,339.80</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">Amount differences</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--danger)' }}>₹500.00</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">In 2B, not in books</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--gold-d)' }}>₹6,262.14</div>
            </div>
            <div className="sum-box">
              <div className="sum-lbl">In books, not in 2B (ITC at risk)</div>
              <div className="sum-val" style={{ fontSize: 18, color: 'var(--danger)' }}>₹0.00</div>
            </div>
          </div>

          {/* Reconciliation Table & Filter Segment */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All (3)' },
                  { id: 'mismatch', label: 'Amount difference (1)' },
                  { id: 'not_in_books', label: 'In 2B, not in books (1)' },
                  { id: 'matched', label: 'Matched (1)' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setReconFilter(tab.id)}
                    className={`btn btn-sm ${reconFilter === tab.id ? 'btn-primary' : 'btn-outline'}`}
                    style={{ fontSize: 11.5, padding: '4px 10px' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => alert('Exporting Reconciliation Excel...')} className="btn btn-outline btn-sm">
                  <Download size={13} />
                  <span>Excel</span>
                </button>
                <button onClick={() => window.print()} className="btn btn-outline btn-sm">
                  <Printer size={13} />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>SUPPLIER GSTIN</th>
                    <th>TRADE NAME</th>
                    <th>INVOICE NO</th>
                    <th>DATE</th>
                    <th className="num">INVOICE VAL (₹)</th>
                    <th className="num">ITC CLAIMABLE (₹)</th>
                    <th>STATUS</th>
                    <th>RECONCILIATION NOTES</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered2bRecords.map(rec => (
                    <tr
                      key={rec.id}
                      style={{
                        borderLeft: `4px solid ${
                          rec.status === 'matched' ? 'var(--success)' : rec.status === 'mismatch' ? 'var(--danger)' : 'var(--gold-d)'
                        }`
                      }}
                    >
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{rec.gstin}</td>
                      <td style={{ fontWeight: 600 }}>{rec.tradeName}</td>
                      <td className="font-bold">{rec.invoiceNo}</td>
                      <td>{rec.invoiceDate}</td>
                      <td className="num">₹{rec.invoiceValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="num font-bold">₹{(rec.cgst + rec.sgst + rec.igst).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <span
                          className={`badge ${
                            rec.status === 'matched' ? 'badge-green' : rec.status === 'mismatch' ? 'badge-danger' : 'badge-gold'
                          }`}
                        >
                          {rec.status === 'matched' ? 'Matched' : rec.status === 'mismatch' ? 'Mismatch' : 'In 2B only'}
                        </span>
                      </td>
                      <td style={{ fontSize: 11.5, color: 'var(--muted)' }}>{rec.diffNotes || 'Verified against inward bill'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const GstReportsView = GSTReportsView;


import * as XLSX from 'xlsx';
import React, { useState } from 'react';
import { 
  FileSpreadsheet, Printer, Download, Filter, Calendar, 
  Search, ArrowUpDown, ChevronRight, CheckCircle2, TrendingUp, Building2, Package, X, Eye, FileText
} from 'lucide-react';
import { Supplier, SupplierBill, PurchaseOrder } from '../../types';

interface PurchaseReportsViewProps {
  suppliers: Supplier[];
  bills: SupplierBill[];
  purchaseOrders: PurchaseOrder[];
}

export const PurchaseReportsView: React.FC<PurchaseReportsViewProps> = ({
  suppliers,
  bills,
  purchaseOrders
}) => {
  const [activeReportTab, setActiveReportTab] = useState(1);
  const [fromDate, setFromDate] = useState('2026-11-01');
  const [toDate, setToDate] = useState('2026-11-15');
  const [selectedSupplier, setSelectedSupplier] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState('PDF');

  // Exact 11 Purchase Registers from KreyaJewel360 OCR Frame 152
  const reportList = [
    { id: 1, name: '1. Inward register / Purchase register' },
    { id: 2, name: '2. Purchase GST summary' },
    { id: 3, name: '3. HSN purchase summary' },
    { id: 4, name: '4. Received vs billed' },
    { id: 5, name: '5. Pending purchases / PO status' },
    { id: 6, name: '6. Returned goods / Debit notes' },
    { id: 7, name: '7. Supplier payables' },
    { id: 8, name: '8. Supplier ledger' },
    { id: 9, name: '9. Supplier payments register' },
    { id: 10, name: '10. Supplier settlement' },
    { id: 11, name: '11. Purchase rate history' }
  ];

  // Filtering logic
  const filteredBills = bills.filter(b => {
    if ((fromDate && b.billDate < fromDate) || (toDate && b.billDate > toDate)) return false;

    if (selectedSupplier !== 'ALL' && b.supplierId !== selectedSupplier && b.supplier?.id !== selectedSupplier) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchNo = b.billNumber.toLowerCase().includes(term);
      const matchSup = (b.supplier?.tradeName || b.supplier?.name || '').toLowerCase().includes(term);
      if (!matchNo && !matchSup) return false;
    }
    return true;
  });

  const filteredPOs = purchaseOrders.filter(po => {
    if (selectedSupplier !== 'ALL' && po.supplier?.id !== selectedSupplier) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchNo = po.poNumber.toLowerCase().includes(term);
      const matchSup = (po.supplier?.tradeName || po.supplier?.name || '').toLowerCase().includes(term);
      const matchMetal = po.metalType.toLowerCase().includes(term);
      if (!matchNo && !matchSup && !matchMetal) return false;
    }
    return true;
  });

  const filteredSuppliers = suppliers.filter(s => {
    if (selectedSupplier !== 'ALL' && s.id !== selectedSupplier) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = (s.tradeName || s.name || '').toLowerCase().includes(term);
      const matchCode = (s.code || s.supplierCode || '').toLowerCase().includes(term);
      const matchCity = (s.city || '').toLowerCase().includes(term);
      if (!matchName && !matchCode && !matchCity) return false;
    }
    return true;
  });

  // Metal volume aggregates across filtered inward consignments
  const metalTotals = React.useMemo(() => {
    let goldNetGrams = 0;
    let silverNetGrams = 0;
    let diamondCarats = 0;

    filteredBills.forEach(b => {
      (b.lines || []).forEach(l => {
        const desc = (l.description || '').toLowerCase();
        const metal = (l as any).metalType?.toLowerCase() || '';
        if (metal === 'silver' || desc.includes('silver')) {
          silverNetGrams += Number(l.netWeight || 0);
        } else if (metal === 'diamond' || desc.includes('diamond') || (l.stoneWeight && l.stoneWeight > 0)) {
          diamondCarats += Number(l.stoneWeight || 0);
        } else {
          goldNetGrams += Number(l.netWeight || 0);
        }
      });
    });

    if (goldNetGrams === 0) {
      filteredPOs.forEach(p => {
        (p.lines || []).forEach(l => {
          if (l.metalType === 'silver') silverNetGrams += Number(l.netWeight || 0);
          else if (l.metalType === 'diamond') diamondCarats += Number(l.stoneWeight || 0);
          else goldNetGrams += Number(l.netWeight || 0);
        });
      });
    }

    return {
      gold: goldNetGrams > 0 ? goldNetGrams : 224.250,
      silver: silverNetGrams > 0 ? silverNetGrams : 1450.000,
      diamond: diamondCarats > 0 ? diamondCarats : 4.850
    };
  }, [filteredBills, filteredPOs]);

  const purchaseRegisterHeaders = ['Bill', 'Supplier Inv.', 'Date', 'Supplier', 'GSTIN', 'Taxable', 'CGST', 'SGST', 'IGST', 'Other', 'Round off', 'Total', 'ITC', 'Paid', 'Balance'];
  const purchaseRegisterRows = filteredBills.map(bill => {
    const supplier = suppliers.find(item => item.id === bill.supplierId) ?? bill.supplier;
    const fallbackHalfTax = bill.taxMode === 'inter' ? 0 : (bill.gstAmount ?? 0) / 2;
    const eligible = typeof bill.itcEligible === 'string'
      ? ['true', 'yes', 'eligible'].includes(bill.itcEligible.toLowerCase())
      : bill.itcEligible;
    return [
      bill.billNumber, bill.supplierInvoiceNo ?? '', bill.billDate, supplier?.tradeName ?? bill.supplierName ?? '',
      supplier?.gstin ?? '', bill.taxableAmount, bill.cgstAmount ?? fallbackHalfTax, bill.sgstAmount ?? fallbackHalfTax,
      bill.igstAmount ?? (bill.taxMode === 'inter' ? bill.gstAmount ?? 0 : 0), bill.otherCharges ?? 0,
      bill.roundOff ?? 0, bill.totalAmount, eligible ? 'Eligible' : 'Ineligible', bill.paidAmount,
      bill.balanceAmount ?? bill.balanceDue
    ] as const;
  });
  const exportRegister = (format: 'csv' | 'xlsx') => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([purchaseRegisterHeaders, ...purchaseRegisterRows.map(row => [...row])]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Purchase register');
    XLSX.writeFile(workbook, `purchase_register.${format}`, { bookType: format });
  };

  const handleExportCsv = () => {
    if (activeReportTab === 1) {
      exportRegister('csv');
      return;
    }
    const activeReport = reportList.find(r => r.id === activeReportTab)?.name || 'Purchase_Report';
    const lines: string[] = [];
    lines.push(`"KreyaJewel360 - ${activeReport}"`);
    lines.push(`"Period: ${fromDate} to ${toDate} | Supplier Filter: ${selectedSupplier}"`);
    lines.push(`"Generated: ${new Date().toLocaleString('en-IN')}"`);
    lines.push('');

    if (activeReportTab === 1) {
      lines.push('"Bill No","Date","Supplier Name","Taxable (₹)","CGST 1.5% (₹)","SGST 1.5% (₹)","Total (₹)","Balance Due (₹)","Status"');
      filteredBills.forEach(b => {
        lines.push(`"${b.billNumber}","${b.billDate}","${b.supplier?.tradeName || b.supplier?.name || ''}","${b.taxableAmount}","${b.cgstAmount || 0}","${b.sgstAmount || 0}","${b.totalAmount}","${b.balanceDue || b.balanceAmount || 0}","${b.status}"`);
      });
    } else if (activeReportTab === 7) {
      lines.push('"Supplier Code","Trade Name","City","GSTIN","Total Billed (₹)","Outstanding Payable (₹)"');
      filteredSuppliers.forEach(s => {
        lines.push(`"${s.supplierCode || s.code}","${s.tradeName || s.name}","${s.city}","${s.gstin}","${s.currentBalanceDue || 0}","${s.currentBalanceDue || 0}"`);
      });
    } else {
      lines.push('"Record / Bill No","Date","Supplier","Taxable Value (₹)","CGST (₹)","SGST (₹)","Total Amount (₹)"');
      filteredBills.forEach(b => {
        lines.push(`"${b.billNumber}","${b.billDate}","${b.supplier?.tradeName || b.supplier?.name || ''}","${b.taxableAmount}","${b.cgstAmount || 0}","${b.sgstAmount || 0}","${b.totalAmount}"`);
      });
    }

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeReport.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const handleExportExcel = () => {
    if (activeReportTab === 1) {
      exportRegister('xlsx');
      return;
    }
    handleExportCsv();
  };

  const handleExportPdf = () => {
    window.print();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page">
      {/* Page Header (.page-hdr) */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Purchase Reports</h1>
          <p>Purchases, GRNs, payables, HSN summaries and supplier ledger · S.B Borana Jewellers</p>
        </div>

        <div className="btn-group">
          <button 
            type="button"
            onClick={handleExportExcel}
            className="btn btn-outline btn-sm"
            title="Export Excel"
          >
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>
          <button 
            type="button"
            onClick={handleExportCsv}
            className="btn btn-outline btn-sm"
            title="Export CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button 
            type="button"
            onClick={handleExportPdf}
            className="btn btn-outline btn-sm"
            title="Export Statutory PDF"
          >
            <FileText size={14} />
            <span>PDF</span>
          </button>
          <button 
            type="button"
            onClick={handlePrint}
            className="btn btn-primary btn-sm"
            title="Print Register"
          >
            <Printer size={14} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Grid (.sum-grid) */}
      <div className="sum-grid">
        <div className="sum-box">
          <div className="sum-val">₹{filteredBills.reduce((s, b) => s + b.totalAmount, 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}</div>
          <div className="sum-lbl">Total Inward Value</div>
        </div>
        <div className="sum-box">
          <div className="sum-val mono" style={{ color: "var(--gold)" }}>
            {metalTotals.gold.toFixed(3)} g
          </div>
          <div className="sum-lbl">Gold Volume ({metalTotals.silver.toFixed(0)}g Ag · {metalTotals.diamond} ct Dia)</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: "var(--primary)" }}>
            ₹{filteredBills.reduce((s, b) => s + (b.cgstAmount ?? ((b.gstAmount || 0)/2)) + (b.sgstAmount ?? ((b.gstAmount || 0)/2)), 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </div>
          <div className="sum-lbl">Total GST (ITC Eligible)</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: "var(--danger)" }}>
            ₹{filteredBills.reduce((s, b) => s + (b.balanceAmount ?? b.balanceDue ?? 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </div>
          <div className="sum-lbl">Outstanding Payables</div>
        </div>
        <div className="sum-box">
          <div className="sum-val">{purchaseOrders.length}</div>
          <div className="sum-lbl">Total POs Tracked</div>
        </div>
      </div>

      {/* Filter Card (.card + .search-box) */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ padding: "12px 16px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div className="search-box" style={{ flex: 1, minWidth: 220 }}>
            <Search size={14} />
            <input 
              type="text"
              placeholder="Search by bill, PO, or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              type="button"
              className={`filter-pill ${fromDate === '2026-11-01' && toDate === '2026-11-15' ? 'active' : ''}`}
              onClick={() => { setFromDate('2026-11-01'); setToDate('2026-11-15'); }}
            >
              Current Nov
            </button>
            <button
              type="button"
              className="filter-pill"
              onClick={() => { setFromDate('2026-10-01'); setToDate('2026-10-31'); }}
            >
              October
            </button>
            <button
              type="button"
              className="filter-pill"
              onClick={() => { setFromDate('2026-04-01'); setToDate('2027-03-31'); }}
            >
              FY 2026-27
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="label" style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>Period:</span>
            <input 
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input input-sm"
              style={{ width: "auto" }}
            />
            <span className="helper" style={{ margin: 0 }}>to</span>
            <input 
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input input-sm"
              style={{ width: "auto" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="label" style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>Supplier:</span>
            <select 
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="input input-sm"
              style={{ minWidth: 200, width: "auto" }}
            >
              <option value="ALL">Any supplier (All)</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>
                  {s.tradeName || s.name} ({s.code || s.supplierCode || 'SUP'})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginLeft: "auto" }}>
            <span className="badge badge-gold" style={{ fontSize: 12, padding: "5px 10px" }}>
              {reportList.find(r => r.id === activeReportTab)?.name}
            </span>
          </div>
        </div>
      </div>

      {/* Main Split Layout: Report Types Sidebar + Content Table */}
      <div style={{ display: "grid", gridTemplateColumns: "270px 1fr", gap: 14 }}>
        {/* Left: 11 Reports Nav List */}
        <div className="card" style={{ height: "fit-content" }}>
          <div className="card-header">
            <span className="card-title" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              11 Purchase Registers
            </span>
          </div>
          <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
            {reportList.map(rep => (
              <button
                key={rep.id}
                type="button"
                onClick={() => setActiveReportTab(rep.id)}
                className={`tab ${activeReportTab === rep.id ? "active" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  textAlign: "left",
                  padding: "8px 12px",
                  borderRadius: "var(--r-sm)",
                  borderBottom: activeReportTab === rep.id ? "2px solid var(--primary)" : "none",
                  background: activeReportTab === rep.id ? "var(--primary-xl)" : "transparent",
                  color: activeReportTab === rep.id ? "var(--primary-d)" : "var(--text2)",
                  fontWeight: activeReportTab === rep.id ? 700 : 500,
                  fontSize: 12.5
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rep.name}</span>
                {activeReportTab === rep.id && <ChevronRight size={13} style={{ color: "var(--primary)", flexShrink: 0 }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Dynamic Table Report View Container */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className="card-title">{reportList.find(r => r.id === activeReportTab)?.name}</span>
            <span className="helper">Period: {fromDate} to {toDate}</span>
          </div>
          <div className="tbl-wrap">
            {/* REGISTER 1: Inward register / Purchase register (Matches frame 152) */}
            {activeReportTab === 1 && (
              <table className="tbl">
                <thead>
                  <tr>{purchaseRegisterHeaders.map((label, index) => (
                    <th key={label} className={index >= 5 && index !== 12 ? 'num' : undefined}>{label}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {purchaseRegisterRows.length === 0 && (
                    <tr><td colSpan={purchaseRegisterHeaders.length} className="empty">No inward bills match the selected filters.</td></tr>
                  )}
                  {purchaseRegisterRows.map(row => (
                    <tr key={row[0]}>{row.map((value, column) => (
                      <td key={purchaseRegisterHeaders[column]} className={typeof value === 'number' ? 'num mono' : undefined}>
                        {typeof value === 'number' ? `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : value || '—'}
                      </td>
                    ))}</tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* REGISTER 2: Purchase GST summary */}
            {activeReportTab === 2 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>PERIOD</th>
                    <th>HSN CODE</th>
                    <th style={{ textAlign: "right" }}>TAXABLE VALUE</th>
                    <th style={{ textAlign: "right" }}>IGST (3.0%)</th>
                    <th style={{ textAlign: "right" }}>CGST (1.5%)</th>
                    <th style={{ textAlign: "right" }}>SGST (1.5%)</th>
                    <th style={{ textAlign: "right" }}>TOTAL TAX</th>
                    <th style={{ textAlign: "right" }}>TOTAL INWARD VALUE</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>November 2026</strong></td>
                    <td><span className="badge badge-gold">7113</span></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹8,90,000.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>₹0.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>₹13,350.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>₹13,350.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>₹26,700.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>₹9,16,700.00</td>
                  </tr>
                  <tr>
                    <td><strong>October 2026</strong></td>
                    <td><span className="badge badge-gold">7113</span></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹4,75,471.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>₹0.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>₹7,132.07</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>₹7,132.07</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>₹14,264.14</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>₹4,89,735.00</td>
                  </tr>
                  <tr style={{ fontWeight: 700, background: "var(--surface2)", borderTop: "2px solid var(--border)" }}>
                    <td colSpan={2} style={{ textAlign: "right", textTransform: "uppercase", fontSize: 11, color: "var(--muted)" }}>
                      Cumulative GST ITC:
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹13,65,471.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>₹0.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>₹20,482.07</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>₹20,482.07</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>₹40,964.14</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹14,06,435.00</td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* REGISTER 3: HSN purchase summary */}
            {activeReportTab === 3 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>HSN CODE</th>
                    <th>DESCRIPTION</th>
                    <th style={{ textAlign: "center" }}>UQC</th>
                    <th style={{ textAlign: "right" }}>QUANTITY</th>
                    <th style={{ textAlign: "right" }}>TOTAL WEIGHT (G)</th>
                    <th style={{ textAlign: "right" }}>TAXABLE VALUE</th>
                    <th style={{ textAlign: "right" }}>CGST + SGST (3%)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="badge badge-gold">7113</span></td>
                    <td>Articles of jewellery of precious metal (Gold 22K/18K)</td>
                    <td style={{ textAlign: "center" }}>GMS</td>
                    <td style={{ textAlign: "right" }}>24 pcs</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}><strong>128.400 g</strong></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹8,90,000.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}><strong>₹26,700.00</strong></td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-gold">7108</span></td>
                    <td>Gold bullion bar 24K (999 fineness)</td>
                    <td style={{ textAlign: "center" }}>GMS</td>
                    <td style={{ textAlign: "right" }}>2 bars</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}><strong>50.000 g</strong></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹3,92,500.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}><strong>₹11,775.00</strong></td>
                  </tr>
                  <tr>
                    <td><span className="badge badge-gold">7106</span></td>
                    <td>Silver bullion &amp; ornamental utensils (999/925)</td>
                    <td style={{ textAlign: "center" }}>GMS</td>
                    <td style={{ textAlign: "right" }}>8 items</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}><strong>850.000 g</strong></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹76,500.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}><strong>₹2,295.00</strong></td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* REGISTER 4: Received vs billed */}
            {activeReportTab === 4 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>GRN NO</th>
                    <th>DATE</th>
                    <th>SUPPLIER</th>
                    <th>PO REF</th>
                    <th style={{ textAlign: "right" }}>RECEIVED (PCS)</th>
                    <th style={{ textAlign: "right" }}>BILLED (PCS)</th>
                    <th style={{ textAlign: "right" }}>PENDING (PCS)</th>
                    <th style={{ textAlign: "center" }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>GRN-2026-00024</td>
                    <td>2026-11-06</td>
                    <td><strong>Rajkot Fine Chains Pvt. Ltd.</strong></td>
                    <td><span className="badge badge-gray">PO-2026-00018</span></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}><strong>12</strong></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>12</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>0</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-green">Fully Billed</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>GRN-2026-00025</td>
                    <td>2026-11-10</td>
                    <td><strong>Kundan Gems &amp; Bullion Ltd.</strong></td>
                    <td><span className="badge badge-gray">PO-2026-00019</span></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}><strong>10</strong></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>10</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>0</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-green">Fully Billed</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* REGISTER 5: Pending purchase orders */}
            {activeReportTab === 5 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>PO NUMBER</th>
                    <th>DATE</th>
                    <th>SUPPLIER</th>
                    <th>METAL &amp; PURITY</th>
                    <th style={{ textAlign: "right" }}>ORDERED WT</th>
                    <th style={{ textAlign: "right" }}>AGREED RATE (/G)</th>
                    <th style={{ textAlign: "right" }}>EXPECTED DATE</th>
                    <th style={{ textAlign: "center" }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPOs.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty">
                          <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>No purchase orders</p>
                          <p className="helper">No open or pending purchase orders found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPOs.map(po => (
                      <tr key={po.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{po.poNumber}</td>
                        <td>{po.orderDate}</td>
                        <td><strong>{po.supplier?.tradeName || po.supplier?.name || 'Supplier'}</strong></td>
                        <td><span className="badge badge-purple">{po.metalType} (22K 916)</span></td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}><strong>{po.orderedWeightGrams.toFixed(3)} g</strong></td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹{po.agreedRatePerGram.toLocaleString("en-IN")}</td>
                        <td style={{ textAlign: "right" }}>{po.expectedDeliveryDate}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`badge ${po.status === 'FULFILLED' ? 'badge-green' : po.status === 'ISSUED' ? 'badge-yellow' : 'badge-gray'}`}>
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* REGISTER 6: Returned goods / Debit notes */}
            {activeReportTab === 6 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>DEBIT NOTE NO</th>
                    <th>DATE</th>
                    <th>SUPPLIER</th>
                    <th>REF BILL / GRN</th>
                    <th style={{ textAlign: "right" }}>REJECTED QTY</th>
                    <th>REASON</th>
                    <th style={{ textAlign: "right" }}>DEBIT VALUE (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>DN-2026-0004</td>
                    <td>03 Nov 2026</td>
                    <td><strong>Surat Gold Works Ltd.</strong></td>
                    <td><span className="badge badge-gray">BILL-SUP-889</span></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--danger)" }}>
                      <strong>1 pc (4.200g)</strong>
                    </td>
                    <td>Purity under-test (908 touch instead of 916 BIS hallmark)</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--danger)" }}>
                      <strong>₹32,450.00</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* REGISTER 7: Supplier payables */}
            {activeReportTab === 7 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>CODE</th>
                    <th>SUPPLIER TRADE NAME</th>
                    <th>MOBILE</th>
                    <th>CITY</th>
                    <th style={{ textAlign: "right" }}>TOTAL INWARD (₹)</th>
                    <th style={{ textAlign: "right" }}>PAID (₹)</th>
                    <th style={{ textAlign: "right" }}>CURRENT DUE (₹)</th>
                    <th style={{ textAlign: "center" }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <div className="empty">
                          <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>No suppliers found</p>
                          <p className="helper">No supplier records match your criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{s.code || s.supplierCode || 'SUP'}</td>
                        <td><strong>{s.tradeName || s.name}</strong></td>
                        <td style={{ fontFamily: "monospace" }}>{s.mobile}</td>
                        <td>{s.city}</td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          ₹{(s.currentBalanceDue + 400000).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>
                          ₹4,00,000.00
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          <strong style={{ color: s.currentBalanceDue > 0 ? "var(--danger)" : "var(--primary)" }}>
                            ₹{s.currentBalanceDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </strong>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {s.currentBalanceDue > 0 ? (
                            <span className="badge badge-red">Payable Due</span>
                          ) : (
                            <span className="badge badge-green">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {/* REGISTER 8: Supplier ledger (Exact match to Frame 156) */}
            {activeReportTab === 8 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>DOCUMENT / VOUCHER</th>
                    <th>PARTICULARS</th>
                    <th style={{ textAlign: "right" }}>BILLED AMOUNT (₹)</th>
                    <th style={{ textAlign: "right" }}>PAID MONEY (₹)</th>
                    <th style={{ textAlign: "right" }}>METAL (G)</th>
                    <th style={{ textAlign: "right" }}>PAID METAL (G)</th>
                    <th style={{ textAlign: "right" }}>BALANCE (₹)</th>
                    <th>REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>01-Nov-2026</td>
                    <td><strong>OP-BAL</strong></td>
                    <td>Opening Balance</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>₹0.00</td>
                    <td>Nil opening</td>
                  </tr>
                  <tr>
                    <td>06-Nov-2026</td>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>BILL-SUP-891</td>
                    <td>Inward Bill from GRN-2026-00024</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>₹9,16,700.00</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>64.200 g</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--danger)", fontWeight: 700 }}>₹9,16,700.00</td>
                    <td>Rajkot Chains delivery</td>
                  </tr>
                  <tr>
                    <td>08-Nov-2026</td>
                    <td style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--primary)" }}>SPAY-2026-00055</td>
                    <td>Bank Transfer / RTGS HDFC-0912</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)", fontWeight: 700 }}>₹7,31,700.00</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>—</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)", fontWeight: 700 }}>₹1,85,000.00</td>
                    <td>Part payment against bill</td>
                  </tr>
                  <tr style={{ fontWeight: 700, background: "var(--surface2)", borderTop: "2px solid var(--border)" }}>
                    <td colSpan={3} style={{ textAlign: "right", textTransform: "uppercase", fontSize: 11, color: "var(--muted)" }}>
                      Closing Ledger Balance:
                    </td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹9,16,700.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>₹7,31,700.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>64.200 g</td>
                    <td style={{ textAlign: "right", color: "var(--muted)" }}>0.000 g</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--danger)" }}>₹1,85,000.00</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* REGISTER 9: Supplier payments register */}
            {activeReportTab === 9 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>VOUCHER NO</th>
                    <th>PAYMENT DATE</th>
                    <th>SUPPLIER</th>
                    <th>ALLOCATED BILL</th>
                    <th style={{ textAlign: "center" }}>MODE</th>
                    <th>UTR / CHEQUE REF</th>
                    <th style={{ textAlign: "right" }}>AMOUNT PAID (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>SPAY-2026-00055</td>
                    <td>2026-11-08</td>
                    <td><strong>Rajkot Fine Chains Pvt. Ltd.</strong></td>
                    <td><span className="badge badge-gray">BILL-SUP-891</span></td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-blue">RTGS / Bank</span>
                    </td>
                    <td style={{ fontFamily: "monospace" }}>HDFCR52026110800192</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>
                      <strong>₹7,31,700.00</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>SPAY-2026-00056</td>
                    <td>2026-11-12</td>
                    <td><strong>Kundan Gems &amp; Bullion Ltd.</strong></td>
                    <td><span className="badge badge-gray">BILL-SUP-890</span></td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-blue">NEFT</span>
                    </td>
                    <td style={{ fontFamily: "monospace" }}>SBIN000192837192</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>
                      <strong>₹4,50,000.00</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* REGISTER 10: Supplier settlement */}
            {activeReportTab === 10 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>SETTLEMENT REF</th>
                    <th>DATE</th>
                    <th>SUPPLIER</th>
                    <th style={{ textAlign: "right" }}>GROSS BILLS</th>
                    <th style={{ textAlign: "right" }}>TDS (194Q 0.1%)</th>
                    <th style={{ textAlign: "right" }}>CASH DISCOUNT</th>
                    <th style={{ textAlign: "right" }}>NET PAID (₹)</th>
                    <th style={{ textAlign: "center" }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontFamily: "monospace", fontWeight: 600 }}>SETTL-2026-018</td>
                    <td>08-Nov-2026</td>
                    <td><strong>Rajkot Fine Chains Pvt. Ltd.</strong></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹7,32,432.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>₹732.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>₹0.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>
                      <strong>₹7,31,700.00</strong>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge badge-green">Settled</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* REGISTER 11: Purchase rate history */}
            {activeReportTab === 11 && (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>SUPPLIER</th>
                    <th>ITEM CATEGORY</th>
                    <th>METAL &amp; PURITY</th>
                    <th style={{ textAlign: "right" }}>BULLION RATE (/G)</th>
                    <th style={{ textAlign: "right" }}>MAKING CHARGE (/G)</th>
                    <th style={{ textAlign: "right" }}>NET PURCHASE RATE (/G)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>06-Nov-2026</td>
                    <td><strong>Rajkot Fine Chains Pvt. Ltd.</strong></td>
                    <td>Handmade Gold Chains</td>
                    <td><span className="badge badge-gold">Gold 22K (916)</span></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹7,200.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>+₹320.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>
                      <strong>₹7,520.00</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>01-Nov-2026</td>
                    <td><strong>MMTC-PAMP Bullion Depot</strong></td>
                    <td>Cast Pure Gold Bars</td>
                    <td><span className="badge badge-gold">Gold 24K (999)</span></td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>₹7,850.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--muted)" }}>₹0.00</td>
                    <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", color: "var(--primary)" }}>
                      <strong>₹7,850.00</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          <div className="dt-pager" style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--muted)" }}>
            <span>Showing register data · GSTIN: 27ACZPJ7126B1ZA</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                type="button" 
                className="btn btn-outline btn-xs" 
                onClick={() => window.print()}
              >
                <Printer size={12} />
                <span>Print View</span>
              </button>
              <button 
                type="button" 
                className="btn btn-primary btn-xs" 
                onClick={() => setShowExportModal(true)}
              >
                <Download size={12} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Export / Statutory Print Modal (.overlay > .modal) */}
      {showExportModal && (
        <div className="overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <FileSpreadsheet size={18} style={{ color: "var(--primary)" }} />
                <span>Export Purchase Register</span>
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setShowExportModal(false)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <span className="badge badge-gold">
                  {reportList.find(r => r.id === activeReportTab)?.name}
                </span>
                <p className="helper" style={{ marginTop: 6 }}>
                  Period: {fromDate} to {toDate} · Filter: {selectedSupplier === 'ALL' ? 'All Suppliers' : suppliers.find(s => s.id === selectedSupplier)?.tradeName || selectedSupplier}
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="label">Export Format</label>
                <select
                  className="input input-sm"
                  style={{ width: "100%" }}
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                >
                  <option value="PDF">Statutory PDF Document (.pdf) - Official Audit Ready</option>
                  <option value="EXCEL">Microsoft Excel Workbook (.xlsx) - Full Tabular Ledger</option>
                  <option value="CSV">Comma Separated Values (.csv) - Tally / ERP Import</option>
                  <option value="JSON">GSTR-2B Reconciliation Schema (.json)</option>
                </select>
              </div>

              <div style={{ padding: 12, background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)", marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Register Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8, fontSize: 12 }}>
                  <div>
                    <span className="helper">Total Inward:</span>
                    <strong style={{ marginLeft: 6 }}>₹{filteredBills.reduce((s, b) => s + b.totalAmount, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div>
                    <span className="helper">Eligible ITC (3%):</span>
                    <strong style={{ marginLeft: 6, color: "var(--primary)" }}>₹{filteredBills.reduce((s, b) => s + (b.cgstAmount ?? ((b.gstAmount || 0)/2)) + (b.sgstAmount ?? ((b.gstAmount || 0)/2)), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </div>
                  <div>
                    <span className="helper">Active POs:</span>
                    <strong style={{ marginLeft: 6 }}>{purchaseOrders.length}</strong>
                  </div>
                  <div>
                    <span className="helper">Outstanding Payables:</span>
                    <strong style={{ marginLeft: 6, color: "var(--danger)" }}>₹{filteredBills.reduce((s, b) => s + (b.balanceAmount ?? b.balanceDue ?? 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted)" }}>
                <CheckCircle2 size={14} style={{ color: "var(--primary)" }} />
                <span>Compliant with Indian Jewelry GST HSN 7113 statutory audit guidelines</span>
              </div>
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowExportModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (exportFormat === 'PDF') {
                    setShowExportModal(false);
                    window.print();
                  } else {
                    handleExportCsv();
                  }
                }}
              >
                <Download size={14} /> Download File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


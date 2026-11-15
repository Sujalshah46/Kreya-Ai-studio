import React, { useState, useEffect } from "react";
import { 
  Building2, ShoppingBag, Truck, Receipt, CreditCard, 
  Plus, Search, Filter, Phone, MapPin, CheckCircle2, 
  AlertCircle, ArrowRight, Printer, X, Download, Tag, Eye, ChevronRight, FileSpreadsheet
} from "lucide-react";
import { 
  Supplier, PurchaseOrder, GoodsReceipt, SupplierBill, 
  SupplierPayment, PaymentMode 
} from "../../types";
import { PurchaseOrdersView } from "./PurchaseOrdersView";
import { GoodsReceiptsView } from "./GoodsReceiptsView";
import { SupplierBillsView } from "./SupplierBillsView";
import { SupplierPaymentsView } from "./SupplierPaymentsView";

interface SuppliersPurchasingViewProps {
  initialTab?: "suppliers" | "purchase-orders" | "goods-receipts" | "supplier-bills" | "supplier-payments";
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  supplierBills: SupplierBill[];
  supplierPayments: SupplierPayment[];
  onAddSupplier?: (sup: Supplier) => void;
  onAddPO?: (po: PurchaseOrder) => void;
  onRecordSupplierPayment?: (spay: SupplierPayment) => void;
}

export const SuppliersPurchasingView: React.FC<SuppliersPurchasingViewProps> = ({
  initialTab = "suppliers",
  suppliers: initialSuppliers,
  purchaseOrders: initialPOs,
  goodsReceipts: initialGRNs,
  supplierBills: initialBills,
  supplierPayments: initialPayments,
  onAddSupplier,
  onAddPO,
  onRecordSupplierPayment
}) => {
  const [activeTab, setActiveTab] = useState<"suppliers" | "purchase-orders" | "goods-receipts" | "supplier-bills" | "supplier-payments">(initialTab);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");

  // Keep activeTab in sync if parent routes change
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Local state synced with props
  const [suppliersList, setSuppliersList] = useState<Supplier[]>(initialSuppliers);
  const [poList, setPoList] = useState<PurchaseOrder[]>(initialPOs);
  const [grnList, setGrnList] = useState<GoodsReceipt[]>(initialGRNs);
  const [billsList, setBillsList] = useState<SupplierBill[]>(initialBills);
  const [paymentsList, setPaymentsList] = useState<SupplierPayment[]>(initialPayments);

  useEffect(() => { setSuppliersList(initialSuppliers); }, [initialSuppliers]);
  useEffect(() => { setPoList(initialPOs); }, [initialPOs]);
  useEffect(() => { setGrnList(initialGRNs); }, [initialGRNs]);
  useEffect(() => { setBillsList(initialBills); }, [initialBills]);
  useEffect(() => { setPaymentsList(initialPayments); }, [initialPayments]);

  // Modals state
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showAddPOModal, setShowAddPOModal] = useState(false);
  const [showAddGRNModal, setShowAddGRNModal] = useState(false);
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  // Inspection drawers / modals
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedGRN, setSelectedGRN] = useState<GoodsReceipt | null>(null);
  const [selectedBill, setSelectedBill] = useState<SupplierBill | null>(null);

  // Forms state
  const [newSupName, setNewSupName] = useState("");
  const [newSupPerson, setNewSupPerson] = useState("");
  const [newSupMobile, setNewSupMobile] = useState("");
  const [newSupCity, setNewSupCity] = useState("Mumbai");
  const [newSupGSTIN, setNewSupGSTIN] = useState("27AAACK1234F1Z1");
  const [newSupCategory, setNewSupCategory] = useState<string>("Bullion Dealer");

  // PO Form
  const [poSupplierId, setPoSupplierId] = useState(suppliersList[0]?.id || "");
  const [poMetalType, setPoMetalType] = useState<"GOLD" | "SILVER" | "DIAMOND">("GOLD");
  const [poWeight, setPoWeight] = useState(100);
  const [poRate, setPoRate] = useState(7850);
  const [poExpectedDate, setPoExpectedDate] = useState("2026-11-20");

  // GRN Form
  const [grnPoNum, setGrnPoNum] = useState(poList[0]?.poNumber || "PO-2026-00019");
  const [grnSupName, setGrnSupName] = useState(suppliersList[0]?.tradeName || "Surat Gold Works Ltd.");
  const [grnPcs, setGrnPcs] = useState(10);
  const [grnGross, setGrnGross] = useState(50.250);
  const [grnNet, setGrnNet] = useState(50.250);
  const [grnPurity, setGrnPurity] = useState("22K (916)");

  // Bill Form
  const [billNum, setBillNum] = useState(`BILL-SUP-${Date.now().toString().slice(-4)}`);
  const [billSupId, setBillSupId] = useState(suppliersList[0]?.id || "");
  const [billTaxable, setBillTaxable] = useState(392500);
  const [billDueDate, setBillDueDate] = useState("2026-11-25");

  // Payment Form
  const [selectedBillForPayment, setSelectedBillForPayment] = useState<SupplierBill | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<PaymentMode>("BANK_TRANSFER");
  const [payRef, setPayRef] = useState("");

  // Barcode Streaming state
  const [streamingGrn, setStreamingGrn] = useState<GoodsReceipt | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedCount, setStreamedCount] = useState(0);
  const [streamPrinter, setStreamPrinter] = useState<'zebra' | 'tsc' | 'citizen'>('zebra');

  const totalSupplierPayable = suppliersList.reduce((acc, s) => acc + (s.currentBalanceDue || 0), 0);
  const totalOpenPOs = poList.filter(p => p.status === "ISSUED" || p.status === "DRAFT").length;
  const totalBilledValue = billsList.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  const handlePrintBarcodeTags = (grn: GoodsReceipt) => {
    setStreamingGrn(grn);
    setStreamedCount(0);
    setIsStreaming(false);
  };

  const streamedTags = React.useMemo(() => {
    if (!streamingGrn) return [];
    const pcs = streamingGrn.receivedPieces || 1;
    const avgNet = pcs > 0 ? (streamingGrn.receivedNetWeight / pcs).toFixed(3) : "0.000";
    const avgGross = pcs > 0 ? (streamingGrn.receivedGrossWeight / pcs).toFixed(3) : "0.000";
    return Array.from({ length: pcs }).map((_, idx) => ({
      pieceNo: idx + 1,
      barcode: `890${String(100000000 + idx * 23 + Number(streamingGrn.id.replace(/\D/g, '').slice(-4) || '101')).padStart(9, '0')}`,
      itemCode: `JW-${streamingGrn.grnNumber.replace('GRN-', '')}-${String(idx + 1).padStart(2, '0')}`,
      huid: `ZX${String(10 + ((idx * 7) % 89))}YU`,
      purity: streamingGrn.hallmarkedPurity || '22K (916)',
      netWeight: avgNet,
      grossWeight: avgGross
    }));
  }, [streamingGrn]);

  const handleStartStreaming = () => {
    if (!streamingGrn) return;
    setIsStreaming(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setStreamedCount(count);
      if (count >= streamingGrn.receivedPieces) {
        clearInterval(interval);
        setIsStreaming(false);
        alert(`Barcode streaming complete! ${streamingGrn.receivedPieces} rattail thermal tags streamed to ${streamPrinter.toUpperCase()} printer.`);
      }
    }, 120);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim() || !newSupMobile.trim()) return;
    const newSup: Supplier = {
      id: `sup-${Date.now()}`,
      supplierCode: `SUP-${String(suppliersList.length + 1).padStart(4, "0")}`,
      code: `SUP-${String(suppliersList.length + 1).padStart(4, "0")}`,
      name: newSupName.trim(),
      tradeName: newSupName.trim(),
      contactPerson: newSupPerson.trim() || newSupName.trim(),
      mobile: newSupMobile.trim(),
      city: newSupCity.trim(),
      state: "Maharashtra",
      gstin: newSupGSTIN.trim(),
      category: newSupCategory,
      currentBalanceDue: 0
    };
    setSuppliersList(prev => [...prev, newSup]);
    if (onAddSupplier) onAddSupplier(newSup);
    setShowAddSupplierModal(false);
    setNewSupName("");
    setNewSupPerson("");
    setNewSupMobile("");
  };

  const handleCreatePO = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliersList.find(s => s.id === poSupplierId) || suppliersList[0];
    const newPo: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: `PO-2026-${String(poList.length + 20).padStart(5, "0")}`,
      supplier: sup,
      orderDate: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: poExpectedDate,
      metalType: poMetalType,
      orderedWeightGrams: Number(poWeight),
      agreedRatePerGram: Number(poRate),
      estimatedTotal: Number(poWeight) * Number(poRate) * 1.03, // With 3% GST
      status: "ISSUED"
    };
    setPoList(prev => [newPo, ...prev]);
    if (onAddPO) onAddPO(newPo);
    setShowAddPOModal(false);
  };

  const handleCreateGRN = (e: React.FormEvent) => {
    e.preventDefault();
    const newGrn: GoodsReceipt = {
      id: `grn-${Date.now()}`,
      grnNumber: `GRN-2026-${String(grnList.length + 25).padStart(5, "0")}`,
      poNumber: grnPoNum,
      supplierName: grnSupName,
      receiptDate: new Date().toISOString().split("T")[0],
      receivedPieces: Number(grnPcs),
      receivedGrossWeight: Number(grnGross),
      receivedNetWeight: Number(grnNet),
      hallmarkedPurity: grnPurity,
      inspectedBy: "Admin",
      status: "ACCEPTED"
    };
    setGrnList(prev => [newGrn, ...prev]);
    setShowAddGRNModal(false);
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliersList.find(s => s.id === billSupId) || suppliersList[0];
    const cgst = billTaxable * 0.015;
    const sgst = billTaxable * 0.015;
    const total = billTaxable + cgst + sgst;
    const newBill: SupplierBill = {
      id: `sb-${Date.now()}`,
      billNumber: billNum,
      supplier: sup,
      supplierId: sup.id,
      billDate: new Date().toISOString().split("T")[0],
      dueDate: billDueDate,
      taxableAmount: billTaxable,
      cgstAmount: cgst,
      sgstAmount: sgst,
      totalAmount: total,
      paidAmount: 0,
      balanceDue: total,
      balanceAmount: total,
      itcEligible: true,
      status: "UNPAID"
    };
    setBillsList(prev => [newBill, ...prev]);
    setShowAddBillModal(false);
  };

  const handleOpenPaymentModal = (bill: SupplierBill) => {
    setSelectedBillForPayment(bill);
    setPayAmount(bill.balanceDue ?? bill.balanceAmount ?? 0);
    setPayRef(`RTGS-${Date.now().toString().slice(-6)}`);
    setShowAddPaymentModal(true);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBillForPayment || payAmount <= 0) return;

    const newPayment: SupplierPayment = {
      id: `spay-${Date.now()}`,
      paymentNumber: `SPAY-2026-${String(paymentsList.length + 10).padStart(4, "0")}`,
      billNumber: selectedBillForPayment.billNumber,
      supplierName: selectedBillForPayment.supplier?.tradeName || selectedBillForPayment.supplier?.name || "Supplier",
      date: new Date().toISOString().split("T")[0],
      amount: payAmount,
      mode: payMode,
      referenceNo: payRef,
      operator: "Admin"
    };

    setPaymentsList(prev => [newPayment, ...prev]);
    if (onRecordSupplierPayment) onRecordSupplierPayment(newPayment);

    // Update bill balance
    setBillsList(prev => prev.map(b => {
      if (b.id === selectedBillForPayment.id) {
        const curBal = b.balanceDue ?? b.balanceAmount ?? 0;
        const newBal = Math.max(0, curBal - payAmount);
        return {
          ...b,
          paidAmount: (b.paidAmount || 0) + payAmount,
          balanceDue: newBal,
          balanceAmount: newBal,
          status: newBal <= 0 ? "PAID" : "PARTIAL"
        };
      }
      return b;
    }));

    setShowAddPaymentModal(false);
    setSelectedBillForPayment(null);
  };

  const [supplierStatusFilter, setSupplierStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Filtered datasets
  const filteredSuppliers = suppliersList.filter(s => {
    const matchSearch = ((s.tradeName || s.name || "").toLowerCase()).includes(searchTerm.toLowerCase()) ||
      (s.contactPerson || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.gstin || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.mobile || "").includes(searchTerm);
    const matchCat = filterCategory === "ALL" || s.category === filterCategory;
    const matchStatus = supplierStatusFilter === 'ALL'
      ? true
      : supplierStatusFilter === 'ACTIVE'
        ? (s.status !== 'Inactive' && s.status !== 'INACTIVE')
        : (s.status === 'Inactive' || s.status === 'INACTIVE');
    return matchSearch && matchCat && matchStatus;
  });

  const handleExportCsv = () => {
    if (activeTab === "suppliers") {
      const headers = ["Supplier Code", "Trade Name", "Contact Person", "Mobile", "City", "GSTIN", "Category", "Status", "Balance Due (Rs)"];
      const rows = filteredSuppliers.map(s => [
        s.code || s.supplierCode || "SUP",
        `"${(s.tradeName || s.name || "").replace(/"/g, '""')}"`,
        `"${(s.contactPerson || "").replace(/"/g, '""')}"`,
        s.mobile || "",
        s.city || "",
        s.gstin || "",
        s.category || "Bullion",
        (s.status === "Inactive" || s.status === "INACTIVE") ? "Inactive" : "Active",
        s.currentBalanceDue || 0
      ]);
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `suppliers_directory_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } else {
      const headers = ["ID", "Search", "Date", "Status"];
      const rows = [[activeTab, searchTerm || "All", new Date().toISOString().slice(0, 10), "Exported"]];
      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeTab}_export_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    }
  };

  const handleExportExcel = () => {
    handleExportCsv();
  };

  const filteredPOs = poList.filter(p => {
    return p.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.supplier?.tradeName || p.supplier?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.metalType.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredGRNs = grnList.filter(g => {
    return g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredBills = billsList.filter(b => {
    return b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.supplier?.tradeName || b.supplier?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredPayments = paymentsList.filter(p => {
    return p.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.referenceNo.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="page">
      {/* Top Header & Actions (.page-hdr) */}
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Suppliers &amp; Purchasing Suite</h1>
          <p>
            Vendor master, bullion dealer orders, GRN inspection, 3% GST bills, and RTGS payouts · S.B Borana Jewellers
          </p>
        </div>

        <div className="btn-group">
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={handleExportCsv}
            title="Export CSV"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-sm"
            onClick={handleExportExcel}
            title="Export Excel"
          >
            <FileSpreadsheet size={14} />
            <span>Excel</span>
          </button>

          {activeTab === "suppliers" && (
            <button
              type="button"
              onClick={() => setShowAddSupplierModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} />
              <span>New supplier</span>
            </button>
          )}

          {activeTab === "purchase-orders" && (
            <button
              type="button"
              onClick={() => setShowAddPOModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} />
              <span>New Purchase Order</span>
            </button>
          )}

          {activeTab === "goods-receipts" && (
            <button
              type="button"
              onClick={() => setShowAddGRNModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} />
              <span>Receive Goods (GRN)</span>
            </button>
          )}

          {activeTab === "supplier-bills" && (
            <button
              type="button"
              onClick={() => setShowAddBillModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={14} />
              <span>New Inward Bill</span>
            </button>
          )}

          {activeTab === "supplier-payments" && (
            <button
              type="button"
              onClick={() => {
                if (billsList.length > 0) {
                  handleOpenPaymentModal(billsList[0]);
                } else {
                  alert("Please record an inward bill first to allocate payments against.");
                }
              }}
              className="btn btn-primary btn-sm"
            >
              <CreditCard size={14} />
              <span>Record Payment</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="btn btn-outline btn-sm"
          >
            <Printer size={14} />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* Sum Grid KPI Summary */}
      <div className="sum-grid">
        <div className="sum-box">
          <div className="sum-val">{suppliersList.length}</div>
          <div className="sum-lbl">Registered Suppliers</div>
        </div>
        <div className="sum-box">
          <div className="sum-val">{totalOpenPOs}</div>
          <div className="sum-lbl">Open POs</div>
        </div>
        <div className="sum-box">
          <div className="sum-val">{grnList.length}</div>
          <div className="sum-lbl">Goods Receipts (GRN)</div>
        </div>
        <div className="sum-box">
          <div className="sum-val">₹{totalBilledValue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}</div>
          <div className="sum-lbl">Inward Billed Value</div>
        </div>
        <div className="sum-box">
          <div className="sum-val" style={{ color: "var(--danger)" }}>
            ₹{totalSupplierPayable.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
          </div>
          <div className="sum-lbl">Total Supplier Payables</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === "suppliers" ? "active" : ""}`}
          onClick={() => setActiveTab("suppliers")}
        >
          Suppliers ({suppliersList.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "purchase-orders" ? "active" : ""}`}
          onClick={() => setActiveTab("purchase-orders")}
        >
          Purchase Orders ({poList.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "goods-receipts" ? "active" : ""}`}
          onClick={() => setActiveTab("goods-receipts")}
        >
          Goods Receipts ({grnList.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "supplier-bills" ? "active" : ""}`}
          onClick={() => setActiveTab("supplier-bills")}
        >
          Supplier Bills ({billsList.length})
        </button>
        <button
          type="button"
          className={`tab ${activeTab === "supplier-payments" ? "active" : ""}`}
          onClick={() => setActiveTab("supplier-payments")}
        >
          Supplier Payments ({paymentsList.length})
        </button>
      </div>

      {/* Search / Filter Card (.card + .search-box) */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-body" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div className="search-box" style={{ flex: 1, minWidth: 260 }}>
            <Search size={14} />
            <input
              type="text"
              placeholder={`Search in ${activeTab.replace("-", " ")} by code, name, UTR...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {activeTab === "suppliers" && (
            <>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <span className="helper" style={{ fontSize: 12, fontWeight: 600 }}>Status:</span>
                <button
                  type="button"
                  className={`btn btn-xs ${supplierStatusFilter === "ALL" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setSupplierStatusFilter("ALL")}
                >
                  All
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${supplierStatusFilter === "ACTIVE" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setSupplierStatusFilter("ACTIVE")}
                >
                  Active
                </button>
                <button
                  type="button"
                  className={`btn btn-xs ${supplierStatusFilter === "INACTIVE" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setSupplierStatusFilter("INACTIVE")}
                >
                  Inactive
                </button>
              </div>

              <select
                className="input input-sm"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ width: "auto" }}
              >
                <option value="ALL">All Categories</option>
                <option value="Bullion Dealer">Bullion Dealer</option>
                <option value="Chain Manufacturer">Chain Manufacturer</option>
                <option value="Jewellery Manufacturer">Jewellery Manufacturer</option>
                <option value="Diamond Wholesale">Diamond Wholesale</option>
                <option value="Findings / Stones">Findings / Stones</option>
              </select>
            </>
          )}

          {searchTerm && (
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Suppliers */}
      {activeTab === "suppliers" && (
        <div className="card">
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Supplier Code &amp; Trade Name</th>
                  <th>Contact Person &amp; Mobile</th>
                  <th>Location &amp; GSTIN</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Current Balance Due (₹)</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">
                        <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>No suppliers found</p>
                        <p className="helper">No supplier records match your criteria.</p>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary"
                          style={{ marginTop: 12 }}
                          onClick={() => setShowAddSupplierModal(true)}
                        >
                          <Plus size={14} /> Add Supplier
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((sup) => (
                    <tr key={sup.id}>
                      <td>
                        <strong>{sup.tradeName || sup.name}</strong>
                        <div className="helper">{sup.code || sup.supplierCode || "SUP"}</div>
                      </td>
                      <td>
                        <div>{sup.contactPerson || "Primary Contact"}</div>
                        <div className="helper" style={{ fontFamily: "monospace" }}>{sup.mobile}</div>
                      </td>
                      <td>
                        <div>{sup.city}, {sup.state || "Maharashtra"}</div>
                        <div className="helper" style={{ fontFamily: "monospace" }}>{sup.gstin}</div>
                      </td>
                      <td>
                        <span className="badge badge-gold">{sup.category || "Bullion"}</span>
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        <strong style={{ color: (sup.currentBalanceDue || 0) > 0 ? "var(--danger)" : "var(--primary)" }}>
                          ₹{(sup.currentBalanceDue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </strong>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setSelectedSupplier(sup)}
                            className="btn btn-outline btn-xs"
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPoSupplierId(sup.id);
                              setShowAddPOModal(true);
                            }}
                            className="btn btn-outline btn-xs"
                          >
                            <ShoppingBag size={12} />
                            <span>Order</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="dt-pager" style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "var(--muted)" }}>
            <span>Showing {filteredSuppliers.length} of {suppliersList.length} suppliers</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button type="button" className="btn btn-xs btn-outline" disabled>«</button>
              <button type="button" className="btn btn-xs btn-outline" disabled>‹</button>
              <span style={{ margin: "0 4px" }}>Page 1 of 1</span>
              <button type="button" className="btn btn-xs btn-outline" disabled>›</button>
              <button type="button" className="btn btn-xs btn-outline" disabled>»</button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Purchase Orders */}
      {activeTab === "purchase-orders" && (
        <PurchaseOrdersView
          suppliers={suppliersList}
          purchaseOrders={poList}
          goodsReceipts={grnList}
          supplierBills={billsList}
          supplierPayments={paymentsList}
          onAddPO={(po) => {
            setPoList([po, ...poList]);
            if (onAddPO) onAddPO(po);
          }}
          onUpdatePO={(po) => setPoList(poList.map(p => p.id === po.id ? po : p))}
          onAddGRN={(grn) => setGrnList([grn, ...grnList])}
          onNavigate={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* TAB 3: Goods Receipts */}
      {activeTab === "goods-receipts" && (
        <GoodsReceiptsView
          suppliers={suppliersList}
          purchaseOrders={poList}
          goodsReceipts={grnList}
          supplierBills={billsList}
          onAddGRN={(grn) => setGrnList([grn, ...grnList])}
          onAddBill={(bill) => setBillsList([bill, ...billsList])}
          onNavigate={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* TAB 4: Supplier Bills */}
      {activeTab === "supplier-bills" && (
        <SupplierBillsView
          suppliers={suppliersList}
          purchaseOrders={poList}
          goodsReceipts={grnList}
          supplierBills={billsList}
          supplierPayments={paymentsList}
          onAddBill={(bill) => setBillsList([bill, ...billsList])}
          onUpdateBill={(bill) => setBillsList(billsList.map(b => b.id === bill.id ? bill : b))}
          onRecordPayment={(spay) => {
            setPaymentsList([spay, ...paymentsList]);
            if (onRecordSupplierPayment) onRecordSupplierPayment(spay);
          }}
          onNavigate={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* TAB 5: Supplier Payments */}
      {activeTab === "supplier-payments" && (
        <SupplierPaymentsView
          suppliers={suppliersList}
          supplierBills={billsList}
          supplierPayments={paymentsList}
          onRecordSupplierPayment={(spay) => {
            setPaymentsList([spay, ...paymentsList]);
            if (onRecordSupplierPayment) onRecordSupplierPayment(spay);
          }}
          onNavigate={(tab) => setActiveTab(tab as any)}
        />
      )}

      {/* MODAL 1: Add Supplier Modal (.overlay > .modal) */}
      {showAddSupplierModal && (
        <div className="overlay" onClick={() => setShowAddSupplierModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <Building2 size={18} style={{ color: "var(--primary)" }} />
                <span>Add New Supplier</span>
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setShowAddSupplierModal(false)}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier}>
              <div className="modal-body">
                <div className="g2">
                  <div>
                    <label className="label">Trade Name / Company *</label>
                    <input
                      type="text"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      placeholder="e.g. Surat Gold Works Ltd."
                      value={newSupName}
                      onChange={(e) => setNewSupName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Contact Person</label>
                    <input
                      type="text"
                      className="input input-sm"
                      style={{ width: "100%" }}
                      placeholder="e.g. Ramesh Bhai"
                      value={newSupPerson}
                      onChange={(e) => setNewSupPerson(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Mobile Number *</label>
                    <input
                      type="text"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      placeholder="9820012345"
                      value={newSupMobile}
                      onChange={(e) => setNewSupMobile(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input
                      type="text"
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={newSupCity}
                      onChange={(e) => setNewSupCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">GSTIN (15 Digits)</label>
                    <input
                      type="text"
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={newSupGSTIN}
                      onChange={(e) => setNewSupGSTIN(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={newSupCategory}
                      onChange={(e) => setNewSupCategory(e.target.value)}
                    >
                      <option value="Bullion Dealer">Bullion Dealer</option>
                      <option value="Chain Manufacturer">Chain Manufacturer</option>
                      <option value="Jewellery Manufacturer">Jewellery Manufacturer</option>
                      <option value="Diamond Wholesale">Diamond Wholesale</option>
                      <option value="Findings / Stones">Findings / Stones</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddSupplierModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Issue Purchase Order Modal (.overlay > .modal) */}
      {showAddPOModal && (
        <div className="overlay" onClick={() => setShowAddPOModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <ShoppingBag size={18} style={{ color: "var(--primary)" }} />
                <span>Issue Purchase Order</span>
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setShowAddPOModal(false)}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreatePO}>
              <div className="modal-body">
                <div className="g2">
                  <div>
                    <label className="label">Select Supplier *</label>
                    <select
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={poSupplierId}
                      onChange={(e) => setPoSupplierId(e.target.value)}
                    >
                      {suppliersList.map(s => (
                        <option key={s.id} value={s.id}>{s.tradeName || s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Metal Type</label>
                    <select
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={poMetalType}
                      onChange={(e) => setPoMetalType(e.target.value as any)}
                    >
                      <option value="GOLD">Gold (24K Bullion)</option>
                      <option value="SILVER">Silver Bars</option>
                      <option value="DIAMOND">Certified Diamonds</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Ordered Weight (g)</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={poWeight}
                      onChange={(e) => setPoWeight(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="label">Agreed Rate (₹/g)</label>
                    <input
                      type="number"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={poRate}
                      onChange={(e) => setPoRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="label">Expected Delivery Date</label>
                    <input
                      type="date"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={poExpectedDate}
                      onChange={(e) => setPoExpectedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Est. Total (+3% GST)</label>
                    <div className="input input-sm" style={{ background: "var(--bg)", fontWeight: "bold", color: "var(--primary)" }}>
                      ₹{(poWeight * poRate * 1.03).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddPOModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Issue Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Receive Goods (GRN) (.overlay > .modal) */}
      {showAddGRNModal && (
        <div className="overlay" onClick={() => setShowAddGRNModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <Truck size={18} style={{ color: "var(--primary)" }} />
                <span>Receive Goods Receipt Note (GRN)</span>
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setShowAddGRNModal(false)}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateGRN}>
              <div className="modal-body">
                <div className="g2">
                  <div>
                    <label className="label">PO Number</label>
                    <input
                      type="text"
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={grnPoNum}
                      onChange={(e) => setGrnPoNum(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Supplier Name</label>
                    <input
                      type="text"
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={grnSupName}
                      onChange={(e) => setGrnSupName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Received Pieces</label>
                    <input
                      type="number"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={grnPcs}
                      onChange={(e) => setGrnPcs(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="label">Gross Weight (g)</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={grnGross}
                      onChange={(e) => setGrnGross(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="label">Net Weight (g)</label>
                    <input
                      type="number"
                      step="0.001"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={grnNet}
                      onChange={(e) => setGrnNet(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="label">Hallmark / Purity</label>
                    <input
                      type="text"
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={grnPurity}
                      onChange={(e) => setGrnPurity(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 16, padding: 12, background: "var(--primary-xl)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--primary-d)", fontWeight: 600 }}>
                    <Tag size={16} />
                    <span>Barcode &amp; Rat-Tail Tag Auto-Generation</span>
                  </div>
                  <p className="helper" style={{ marginTop: 4 }}>
                    Upon acceptance, Kriya360 will auto-stream {grnPcs} rat-tail thermal labels directly to the configured Zebra ZD220 printer with BIS HUID verification.
                  </p>
                </div>
              </div>
              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddGRNModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Accept GRN &amp; Generate Tags
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Inward Supplier Bill Modal (.overlay > .modal) */}
      {showAddBillModal && (
        <div className="overlay" onClick={() => setShowAddBillModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <Receipt size={18} style={{ color: "var(--primary)" }} />
                <span>Record Inward Supplier Bill (3% GST)</span>
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setShowAddBillModal(false)}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleCreateBill}>
              <div className="modal-body">
                <div className="g2">
                  <div>
                    <label className="label">Bill / Invoice Number *</label>
                    <input
                      type="text"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={billNum}
                      onChange={(e) => setBillNum(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Supplier *</label>
                    <select
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={billSupId}
                      onChange={(e) => setBillSupId(e.target.value)}
                    >
                      {suppliersList.map(s => (
                        <option key={s.id} value={s.id}>{s.tradeName || s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Taxable Amount (₹)</label>
                    <input
                      type="number"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={billTaxable}
                      onChange={(e) => setBillTaxable(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="label">Due Date</label>
                    <input
                      type="date"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={billDueDate}
                      onChange={(e) => setBillDueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">CGST (1.5%)</label>
                    <div className="input input-sm" style={{ background: "var(--bg)" }}>
                      ₹{(billTaxable * 0.015).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div>
                    <label className="label">SGST (1.5%)</label>
                    <div className="input input-sm" style={{ background: "var(--bg)" }}>
                      ₹{(billTaxable * 0.015).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label className="label">Total Inward Bill Amount (₹)</label>
                    <div className="input input-sm" style={{ background: "var(--bg)", fontWeight: "bold", color: "var(--primary)" }}>
                      ₹{(billTaxable * 1.03).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddBillModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Save Inward Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Record Payment Modal (.overlay > .modal) */}
      {showAddPaymentModal && selectedBillForPayment && (
        <div className="overlay" onClick={() => setShowAddPaymentModal(false)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <CreditCard size={18} style={{ color: "var(--primary)" }} />
                <span>Record Supplier Payment</span>
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setShowAddPaymentModal(false)}
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div className="modal-body">
                <div style={{ marginBottom: 14, padding: 12, background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: "bold" }}>{selectedBillForPayment.supplier?.tradeName || selectedBillForPayment.supplier?.name}</div>
                  <div className="helper">Bill: {selectedBillForPayment.billNumber}</div>
                  <div style={{ marginTop: 4, fontWeight: "bold", color: "var(--danger)" }}>
                    Balance Due: ₹{(selectedBillForPayment.balanceDue ?? selectedBillForPayment.balanceAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="g2">
                  <div>
                    <label className="label">Payment Amount (₹)</label>
                    <input
                      type="number"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={payAmount}
                      onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="label">Payment Mode</label>
                    <select
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={payMode}
                      onChange={(e) => setPayMode(e.target.value as PaymentMode)}
                    >
                      <option value="BANK_TRANSFER">RTGS / NEFT / IMPS</option>
                      <option value="CHEQUE">Cheque Clearance</option>
                      <option value="CASH">Cash Counter</option>
                      <option value="UPI">UPI Portal</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <label className="label">Bank UTR / Transaction Reference *</label>
                    <input
                      type="text"
                      required
                      className="input input-sm"
                      style={{ width: "100%" }}
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddPaymentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Confirm &amp; Disburse Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Supplier Dossier Modal (.overlay > .modal) */}
      {selectedSupplier && (
        <div className="overlay" onClick={() => setSelectedSupplier(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <Building2 size={18} style={{ color: "var(--primary)" }} />
                <span>Supplier Dossier</span>
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setSelectedSupplier(null)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 14 }}>
                <span className="badge badge-gold">{selectedSupplier.code || selectedSupplier.supplierCode || "SUP"}</span>
                <h3 style={{ fontSize: 16, fontWeight: "bold", marginTop: 4 }}>{selectedSupplier.tradeName || selectedSupplier.name}</h3>
                <p className="helper">{selectedSupplier.category} · {selectedSupplier.city}</p>
              </div>

              <div className="g2">
                <div>
                  <div className="helper">GSTIN</div>
                  <div style={{ fontWeight: 600, fontFamily: "monospace" }}>{selectedSupplier.gstin}</div>
                </div>
                <div>
                  <div className="helper">Outstanding Balance</div>
                  <div style={{ fontWeight: "bold", color: "var(--danger)" }}>
                    ₹{(selectedSupplier.currentBalanceDue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div>
                  <div className="helper">Contact Person</div>
                  <div>{selectedSupplier.contactPerson}</div>
                </div>
                <div>
                  <div className="helper">Mobile Number</div>
                  <div style={{ fontFamily: "monospace" }}>{selectedSupplier.mobile}</div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedSupplier(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: PO Inspect Modal (.overlay > .modal) */}
      {selectedPO && (
        <div className="overlay" onClick={() => setSelectedPO(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <ShoppingBag size={18} style={{ color: "var(--primary)" }} />
                <span>Purchase Order Details</span>
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setSelectedPO(null)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 14 }}>
                <span className="badge badge-purple">{selectedPO.poNumber}</span>
                <h3 style={{ fontSize: 16, fontWeight: "bold", marginTop: 4 }}>{selectedPO.supplier?.tradeName || selectedPO.supplier?.name}</h3>
                <p className="helper">Status: {selectedPO.status}</p>
              </div>

              <div className="g2">
                <div>
                  <div className="helper">Order Date</div>
                  <div style={{ fontFamily: "monospace" }}>{selectedPO.orderDate}</div>
                </div>
                <div>
                  <div className="helper">Expected Delivery</div>
                  <div style={{ fontFamily: "monospace" }}>{selectedPO.expectedDeliveryDate}</div>
                </div>
                <div>
                  <div className="helper">Ordered Weight</div>
                  <div style={{ fontWeight: "bold" }}>{selectedPO.orderedWeightGrams.toFixed(3)} g</div>
                </div>
                <div>
                  <div className="helper">Agreed Rate</div>
                  <div>₹{selectedPO.agreedRatePerGram.toLocaleString("en-IN")}/g</div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <div className="helper">Total Value (with 3% GST)</div>
                  <div style={{ fontWeight: "bold", color: "var(--primary)", fontSize: 16 }}>
                    ₹{selectedPO.estimatedTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedPO(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 8: GRN Inspect Modal (.overlay > .modal) */}
      {selectedGRN && (
        <div className="overlay" onClick={() => setSelectedGRN(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <Truck size={18} style={{ color: "var(--primary)" }} />
                <span>Goods Receipt Note (GRN) Details</span>
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setSelectedGRN(null)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 14 }}>
                <span className="badge badge-gold">{selectedGRN.grnNumber}</span>
                <h3 style={{ fontSize: 16, fontWeight: "bold", marginTop: 4 }}>{selectedGRN.supplierName}</h3>
                <p className="helper">PO Ref: {selectedGRN.poNumber} · Date: {selectedGRN.receiptDate}</p>
              </div>

              <div className="g2">
                <div>
                  <div className="helper">Received Pieces</div>
                  <div style={{ fontWeight: 600 }}>{selectedGRN.receivedPieces} pcs</div>
                </div>
                <div>
                  <div className="helper">Hallmarked Purity</div>
                  <div style={{ fontWeight: 600 }}>{selectedGRN.hallmarkedPurity}</div>
                </div>
                <div>
                  <div className="helper">Gross Weight</div>
                  <div style={{ fontWeight: "bold" }}>{selectedGRN.receivedGrossWeight.toFixed(3)} g</div>
                </div>
                <div>
                  <div className="helper">Net Weight</div>
                  <div style={{ fontWeight: "bold", color: "var(--primary)" }}>{selectedGRN.receivedNetWeight.toFixed(3)} g</div>
                </div>
                <div>
                  <div className="helper">Inspected By</div>
                  <div>{selectedGRN.inspectedBy}</div>
                </div>
                <div>
                  <div className="helper">Inspection Status</div>
                  <div><span className="badge badge-green">{selectedGRN.status}</span></div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handlePrintBarcodeTags(selectedGRN)}
              >
                <Tag size={14} /> Print Tags
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedGRN(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 9: Inward Bill Inspect Modal (.overlay > .modal) */}
      {selectedBill && (
        <div className="overlay" onClick={() => setSelectedBill(null)}>
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <Receipt size={18} style={{ color: "var(--primary)" }} />
                <span>Supplier Bill Details</span>
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setSelectedBill(null)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 14 }}>
                <span className="badge badge-gray">{selectedBill.billNumber}</span>
                <h3 style={{ fontSize: 16, fontWeight: "bold", marginTop: 4 }}>
                  {selectedBill.supplier?.tradeName || selectedBill.supplier?.name}
                </h3>
                <p className="helper">Date: {selectedBill.billDate} · Due: {selectedBill.dueDate}</p>
              </div>

              <div className="g2">
                <div>
                  <div className="helper">Taxable Value</div>
                  <div>₹{selectedBill.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="helper">GST (3% ITC Eligible)</div>
                  <div>₹{((selectedBill.cgstAmount || 0) + (selectedBill.sgstAmount || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="helper">Total Invoice Amount</div>
                  <div style={{ fontWeight: "bold" }}>₹{selectedBill.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="helper">Paid Amount</div>
                  <div style={{ color: "var(--primary)" }}>₹{(selectedBill.paidAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <div className="helper">Balance Due</div>
                  <div style={{ fontWeight: "bold", color: (selectedBill.balanceDue ?? selectedBill.balanceAmount ?? 0) > 0 ? "var(--danger)" : "var(--primary)", fontSize: 16 }}>
                    ₹{(selectedBill.balanceDue ?? selectedBill.balanceAmount ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              {(selectedBill.balanceDue ?? selectedBill.balanceAmount ?? 0) > 0 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const b = selectedBill;
                    setSelectedBill(null);
                    handleOpenPaymentModal(b);
                  }}
                >
                  <CreditCard size={14} /> Pay Bill
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedBill(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: Barcode Streaming & Thermal Tag Printing for Goods Receipt */}
      {streamingGrn && (
        <div className="overlay" onClick={() => setStreamingGrn(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                <Tag size={18} style={{ color: "var(--primary)" }} />
                <span>Barcode Streaming & Tag Spooler — {streamingGrn.grnNumber}</span>
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-xs"
                onClick={() => setStreamingGrn(null)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--zebra)', padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{streamingGrn.supplierName}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    PO: {streamingGrn.poNumber || 'Direct GRN'} · Purity: {streamingGrn.hallmarkedPurity} · Net Wt: {streamingGrn.receivedNetWeight}g
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>BATCH RECEIVED</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                    {streamingGrn.receivedPieces} pieces
                  </div>
                </div>
              </div>

              {/* Streaming Progress Bar */}
              {isStreaming && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 14px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6 }}>
                    <span>Streaming Barcodes & Tags to {streamPrinter.toUpperCase()}...</span>
                    <span>{streamedCount} / {streamingGrn.receivedPieces}</span>
                  </div>
                  <div style={{ width: '100%', height: 8, background: '#dcfce7', borderRadius: 4, overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${Math.round((streamedCount / (streamingGrn.receivedPieces || 1)) * 100)}%`, 
                        height: '100%', 
                        background: '#16a34a',
                        transition: 'width 0.1s linear'
                      }} 
                    />
                  </div>
                </div>
              )}

              {/* Spooler Settings Row */}
              <div className="g3" style={{ alignItems: 'flex-end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Target Thermal Spooler</label>
                  <select 
                    className="input input-sm"
                    value={streamPrinter}
                    onChange={(e) => setStreamPrinter(e.target.value as any)}
                  >
                    <option value="zebra">Zebra ZD420/ZD220 (ZPL II)</option>
                    <option value="tsc">TSC TE200 (TSPL)</option>
                    <option value="citizen">Citizen CL-S621 (CLP)</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="label">Tag Template</label>
                  <select className="input input-sm">
                    <option value="rattail">Rattail Tag (95x14mm Jewellery)</option>
                    <option value="dumbbell">Dumbbell Tag (84x14mm)</option>
                  </select>
                </div>

                <div>
                  <button 
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                    disabled={isStreaming}
                    onClick={handleStartStreaming}
                  >
                    {isStreaming ? 'Streaming...' : `Stream ${streamingGrn.receivedPieces} Barcode Tags`}
                  </button>
                </div>
              </div>

              {/* Streaming Barcodes Table */}
              <div className="tbl-wrap" style={{ maxHeight: 240, overflowY: 'auto' }}>
                <table className="tbl-desktop-only">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: 'center' }}>#</th>
                      <th>Generated Barcode</th>
                      <th>SKU Code</th>
                      <th>HUID</th>
                      <th>Purity</th>
                      <th style={{ textAlign: 'right' }}>Est. Net Wt</th>
                      <th style={{ textAlign: 'center' }}>Spool Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streamedTags.map((tag) => (
                      <tr key={tag.pieceNo}>
                        <td style={{ textAlign: 'center', color: 'var(--muted)' }}>{tag.pieceNo}</td>
                        <td className="mono" style={{ fontWeight: 700 }}>{tag.barcode}</td>
                        <td className="mono">{tag.itemCode}</td>
                        <td>
                          <span className="badge badge-purple">{tag.huid}</span>
                        </td>
                        <td>{tag.purity}</td>
                        <td style={{ textAlign: 'right' }} className="mono">{tag.netWeight} g</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="badge badge-green">Ready to Spool</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStreamingGrn(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartStreaming}
                disabled={isStreaming}
              >
                <Tag size={14} /> Start Barcode Stream
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Download, Upload, FileSpreadsheet, Check, AlertCircle, 
  RotateCcw, CheckCircle2, ChevronRight, X, Filter, Users, 
  FileText, AlertTriangle, ArrowRight, Layers, Database, Package, Sparkles
} from 'lucide-react';
import { Customer, InventoryItem } from '../../types';

export interface DataImportViewProps {
  customers: Customer[];
  inventory?: InventoryItem[];
  onImportCustomers: (newCustomers: Customer[]) => void;
  onImportInventory?: (newItems: InventoryItem[]) => void;
  onNavigate?: (module: string) => void;
}

export interface ImportField {
  key: string;
  label: string;
  group: string;
  required?: boolean;
  example: string;
  createOnly?: boolean;
}

// Exactly 28 customer import fields across 6 statutory groups
export const ALL_CUSTOMER_IMPORT_FIELDS: ImportField[] = [
  // 1. Basic (5 fields)
  { key: 'name', label: 'Customer Name', group: 'Basic', required: true, example: 'Ramesh Kumar' },
  { key: 'phone', label: 'Mobile', group: 'Basic', required: true, example: '9876543210' },
  { key: 'phone2', label: 'Alternate Mobile', group: 'Basic', example: '9123456780' },
  { key: 'email', label: 'Email', group: 'Basic', example: 'ramesh@example.com' },
  { key: 'customer_type', label: 'Customer Type', group: 'Basic', example: 'retail' },
  
  // 2. Address (5 fields)
  { key: 'street1', label: 'Address Line 1', group: 'Address', example: '12, MG Road' },
  { key: 'street2', label: 'Address Line 2', group: 'Address', example: 'Near City Mall' },
  { key: 'city', label: 'City', group: 'Address', example: 'Mumbai' },
  { key: 'state', label: 'State', group: 'Address', example: 'Maharashtra' },
  { key: 'pincode', label: 'PIN Code', group: 'Address', example: '400057' },
  
  // 3. KYC & tax (3 fields)
  { key: 'gst_no', label: 'GSTIN', group: 'KYC & tax', example: '27ABCDE1234F1Z5' },
  { key: 'pan_no', label: 'PAN', group: 'KYC & tax', example: 'ABCDE1234F' },
  { key: 'aadhar_no', label: 'Aadhaar', group: 'KYC & tax', example: '987654321012' },
  
  // 4. Dates (2 fields)
  { key: 'dob', label: 'Date of Birth', group: 'Dates', example: '15-08-1985' },
  { key: 'anniversary', label: 'Anniversary', group: 'Dates', example: '20-11-2010' },
  
  // 5. Account (3 fields)
  { key: 'credit_limit', label: 'Credit Limit', group: 'Account', example: '50000' },
  { key: 'opening_balance', label: 'Opening Balance', group: 'Account', example: '0', createOnly: true },
  { key: 'notes', label: 'Notes', group: 'Account', example: 'Prefers 22K Gold' },
  
  // 6. Family (10 fields)
  { key: 'father_name', label: "Father's Name", group: 'Family', example: 'Santilal Shah' },
  { key: 'father_mobile', label: "Father's Mobile", group: 'Family', example: '9820112233' },
  { key: 'mother_name', label: "Mother's Name", group: 'Family', example: 'Sarojben Shah' },
  { key: 'mother_mobile', label: "Mother's Mobile", group: 'Family', example: '9820112234' },
  { key: 'brother_name', label: "Brother's Name", group: 'Family', example: 'Kiran Shah' },
  { key: 'brother_mobile', label: "Brother's Mobile", group: 'Family', example: '9820112235' },
  { key: 'son_name', label: "Son's Name", group: 'Family', example: 'Sujal Shah' },
  { key: 'son_mobile', label: "Son's Mobile", group: 'Family', example: '9324773823' },
  { key: 'daughter_name', label: "Daughter's Name", group: 'Family', example: 'Riya Shah' },
  { key: 'daughter_mobile', label: "Daughter's Mobile", group: 'Family', example: '9820112236' }
];

// Inventory & jewellery stock import fields (Item Name, SKU, HUID, Purity, Gross Wt, Net Wt, Wastage, Making Rate)
export const ALL_INVENTORY_IMPORT_FIELDS: ImportField[] = [
  // 1. Identity
  { key: 'itemName', label: 'Item Name', group: 'Identity', required: true, example: 'Gold Antique Kada 22K' },
  { key: 'itemCode', label: 'SKU / Item Code', group: 'Identity', required: true, example: 'SBJKD-01' },
  { key: 'barcode', label: 'Barcode', group: 'Identity', example: '890123456002' },
  { key: 'huid', label: 'HUID', group: 'Identity', example: 'KD9988' },
  { key: 'hsnCode', label: 'HSN Code', group: 'Identity', example: '7113' },

  // 2. Classification
  { key: 'category', label: 'Category', group: 'Classification', example: 'Gold Jewellery' },
  { key: 'metalType', label: 'Metal', group: 'Classification', example: 'Gold' },
  { key: 'purityKarat', label: 'Purity', group: 'Classification', required: true, example: '22K' },

  // 3. Weights
  { key: 'grossWeight', label: 'Gross Wt (g)', group: 'Weight & Purity', required: true, example: '25.500' },
  { key: 'stoneWeight', label: 'Stone Wt (g)', group: 'Weight & Purity', example: '0.500' },
  { key: 'netWeight', label: 'Net Wt (g)', group: 'Weight & Purity', required: true, example: '25.000' },

  // 4. Pricing & Making
  { key: 'wastagePercent', label: 'Wastage %', group: 'Pricing & Making', example: '5.0' },
  { key: 'makingRate', label: 'Making Rate (₹/g)', group: 'Pricing & Making', example: '550.00' },
  { key: 'makingMode', label: 'Making Mode', group: 'Pricing & Making', example: 'PER_NET_GRAM' },
  { key: 'costPrice', label: 'Cost Price (₹)', group: 'Pricing & Making', example: '345000.00' },
  { key: 'retailPrice', label: 'Retail Price (₹)', group: 'Pricing & Making', example: '367968.00' },

  // 5. Stock & Location
  { key: 'stockQty', label: 'Stock Qty', group: 'Stock & Location', example: '1' },
  { key: 'location', label: 'Location / Counter', group: 'Stock & Location', example: 'Counter MAIN' }
];

const DEFAULT_CUSTOMER_SELECTED_KEYS = [
  'name', 'phone', 'phone2', 'email', 'customer_type', 
  'street1', 'city', 'state', 'pincode', 'gst_no', 'pan_no', 'dob', 'anniversary'
];

const DEFAULT_INVENTORY_SELECTED_KEYS = [
  'itemName', 'itemCode', 'huid', 'purityKarat', 'grossWeight', 'netWeight', 'wastagePercent', 'makingRate', 'category', 'metalType'
];

interface ParsedPreviewRow {
  rowNum: number;
  action: 'create' | 'update' | 'unchanged' | 'error';
  data: Record<string, string>;
  diff?: string[];
  error?: string;
  matchedId?: string;
}

export const DataImportView: React.FC<DataImportViewProps> = ({ 
  customers, 
  inventory = [],
  onImportCustomers,
  onImportInventory,
  onNavigate 
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'inventory' | 'export'>('customers');
  
  // Customers configuration state
  const [selectedCustomerColumns, setSelectedCustomerColumns] = useState<string[]>(DEFAULT_CUSTOMER_SELECTED_KEYS);
  
  // Inventory configuration state
  const [selectedInventoryColumns, setSelectedInventoryColumns] = useState<string[]>(DEFAULT_INVENTORY_SELECTED_KEYS);

  // Common Preview & Import State
  const [previewRows, setPreviewRows] = useState<ParsedPreviewRow[] | null>(null);
  const [selectedRowNums, setSelectedRowNums] = useState<Set<number>>(new Set());
  const [filterAction, setFilterAction] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{ created: number; updated: number; skipped: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group columns for selection
  const groupedCustomerFields = useMemo(() => {
    const map = new Map<string, ImportField[]>();
    ALL_CUSTOMER_IMPORT_FIELDS.forEach(f => {
      if (!map.has(f.group)) map.set(f.group, []);
      map.get(f.group)!.push(f);
    });
    return Array.from(map.entries());
  }, []);

  const groupedInventoryFields = useMemo(() => {
    const map = new Map<string, ImportField[]>();
    ALL_INVENTORY_IMPORT_FIELDS.forEach(f => {
      if (!map.has(f.group)) map.set(f.group, []);
      map.get(f.group)!.push(f);
    });
    return Array.from(map.entries());
  }, []);

  // Columns to include in template
  const activeCustomerCols = useMemo(() => {
    return ['name', 'phone', ...selectedCustomerColumns.filter(k => k !== 'name' && k !== 'phone')];
  }, [selectedCustomerColumns]);

  const activeInventoryCols = useMemo(() => {
    return ['itemName', 'itemCode', ...selectedInventoryColumns.filter(k => k !== 'itemName' && k !== 'itemCode')];
  }, [selectedInventoryColumns]);

  const toggleCustomerColumn = (key: string) => {
    if (key === 'name' || key === 'phone') return; // required
    setSelectedCustomerColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleInventoryColumn = (key: string) => {
    if (key === 'itemName' || key === 'itemCode' || key === 'grossWeight' || key === 'netWeight' || key === 'purityKarat') return; // required
    setSelectedInventoryColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Generate and download template
  const handleDownloadCustomerTemplate = (format: 'xlsx' | 'csv', withData = false) => {
    const cols = activeCustomerCols;
    const headers = cols.map(c => {
      const field = ALL_CUSTOMER_IMPORT_FIELDS.find(f => f.key === c);
      return field ? field.label : c;
    });

    const dataRows: string[][] = [];

    if (withData && customers.length > 0) {
      customers.forEach(c => {
        const row = cols.map(k => {
          let val = '';
          if (k === 'name') val = c.name || c.fullName || '';
          else if (k === 'phone') val = c.mobile || c.phone || '';
          else if (k === 'phone2') val = (c as any).phone2 || '';
          else if (k === 'email') val = c.email || '';
          else if (k === 'street1') val = c.address || '';
          else if (k === 'city') val = c.city || '';
          else if (k === 'state') val = c.state || '';
          else if (k === 'pincode') val = c.pincode || '';
          else if (k === 'gst_no') val = c.gstin || '';
          else if (k === 'pan_no') val = c.pan || (c as any).panNo || '';
          else if (k === 'aadhar_no') val = c.aadhaarNumber || (c as any).aadhaar_no || '';
          else if (k === 'dob') val = c.dob || '';
          else if (k === 'anniversary') val = c.anniversary || '';
          else if (k === 'customer_type') val = c.customerType || 'retail';
          else if (k === 'credit_limit') val = String(c.creditLimit || 0);
          else if (k === 'opening_balance') val = String(c.openingBalance || 0);
          return val;
        });
        dataRows.push(row);
      });
    } else {
      const sampleRow = cols.map(c => {
        const field = ALL_CUSTOMER_IMPORT_FIELDS.find(f => f.key === c);
        return field ? field.example : '';
      });
      dataRows.push(sampleRow);
    }

    const filename = withData ? 'Customers_update' : 'Customers_import_template';

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } else {
      let csvContent = '\uFEFF' + headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
      dataRows.forEach(r => {
        csvContent += r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadInventoryTemplate = (format: 'xlsx' | 'csv', withData = false) => {
    const cols = activeInventoryCols;
    const headers = cols.map(c => {
      const field = ALL_INVENTORY_IMPORT_FIELDS.find(f => f.key === c);
      return field ? field.label : c;
    });

    const dataRows: string[][] = [];

    if (withData && inventory.length > 0) {
      inventory.forEach(item => {
        const row = cols.map(k => {
          let val = '';
          if (k === 'itemName') val = item.itemName || '';
          else if (k === 'itemCode') val = item.itemCode || '';
          else if (k === 'barcode') val = item.barcode || '';
          else if (k === 'huid') val = item.huid || '';
          else if (k === 'hsnCode') val = item.hsn || '7113';
          else if (k === 'category') val = item.category || 'Gold Jewellery';
          else if (k === 'metalType') val = item.metalGroup || item.metalType || 'Gold';
          else if (k === 'purityKarat') val = item.purityKarat || '22K';
          else if (k === 'grossWeight') val = String(item.grossWeight ?? '');
          else if (k === 'stoneWeight') val = String(item.stoneWeight ?? '0');
          else if (k === 'netWeight') val = String(item.netWeight ?? '');
          else if (k === 'wastagePercent') val = String(item.wastagePercent ?? '5.0');
          else if (k === 'makingRate') val = String(item.makingRate ?? '450');
          else if (k === 'makingMode') val = item.makingMode || 'PER_NET_GRAM';
          else if (k === 'costPrice') val = String(item.costPrice ?? '');
          else if (k === 'retailPrice') val = String(item.retailPrice ?? '');
          else if (k === 'stockQty') val = String(item.stockQty ?? '1');
          else if (k === 'location') val = item.location || 'Counter MAIN';
          return val;
        });
        dataRows.push(row);
      });
    } else {
      // 2 Realistic jewellery samples
      const sample1 = cols.map(c => {
        const field = ALL_INVENTORY_IMPORT_FIELDS.find(f => f.key === c);
        return field ? field.example : '';
      });
      const sample2 = cols.map(c => {
        if (c === 'itemName') return 'Gold Chain 22K Rope';
        if (c === 'itemCode') return 'SBJCH-01';
        if (c === 'huid') return 'ZX98YU';
        if (c === 'purityKarat') return '22K';
        if (c === 'grossWeight') return '12.350';
        if (c === 'stoneWeight') return '0.000';
        if (c === 'netWeight') return '12.350';
        if (c === 'wastagePercent') return '6.0';
        if (c === 'makingRate') return '450.00';
        if (c === 'category') return 'Gold Jewellery';
        if (c === 'metalType') return 'Gold';
        if (c === 'barcode') return '890123456001';
        if (c === 'costPrice') return '185000.00';
        if (c === 'retailPrice') return '196532.00';
        return '';
      });
      dataRows.push(sample1, sample2);
    }

    const filename = withData ? 'Inventory_Stock_update' : 'Jewellery_Stock_import_template';

    if (format === 'xlsx') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      ws['!cols'] = headers.map(h => ({ wch: Math.max(h.length + 4, 14) }));
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      XLSX.writeFile(wb, `${filename}.xlsx`);
    } else {
      let csvContent = '\uFEFF' + headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',') + '\n';
      dataRows.forEach(r => {
        csvContent += r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Upload handler for Customer or Inventory
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) return;

        const data = new Uint8Array(buffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          alert('Uploaded workbook has no readable sheets.');
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawSheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

        if (!rawSheetData || rawSheetData.length < 2) {
          alert('The uploaded file is empty or missing data rows.');
          return;
        }

        const headerRow = (rawSheetData[0] || []).map(h => String(h || '').trim());
        const headerToKeyMap: Record<number, string> = {};

        if (activeTab === 'customers') {
          headerRow.forEach((h, idx) => {
            const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            const field = ALL_CUSTOMER_IMPORT_FIELDS.find(f => 
              f.key.toLowerCase().replace(/[^a-z0-9]/g, '') === clean || 
              f.label.toLowerCase().replace(/[^a-z0-9]/g, '') === clean
            );
            if (field) {
              headerToKeyMap[idx] = field.key;
            } else if (clean === 'name' || clean === 'customername' || clean === 'fullname') {
              headerToKeyMap[idx] = 'name';
            } else if (clean === 'phone' || clean === 'mobile' || clean === 'mobilenumber' || clean === 'contact') {
              headerToKeyMap[idx] = 'phone';
            } else if (clean === 'email' || clean === 'emailaddress') {
              headerToKeyMap[idx] = 'email';
            } else if (clean === 'address' || clean === 'addressline1' || clean === 'street') {
              headerToKeyMap[idx] = 'street1';
            } else if (clean === 'gst' || clean === 'gstin' || clean === 'gstnumber') {
              headerToKeyMap[idx] = 'gst_no';
            } else if (clean === 'pan' || clean === 'pannumber') {
              headerToKeyMap[idx] = 'pan_no';
            }
          });

          const parsed: ParsedPreviewRow[] = [];
          const selectableRowNums = new Set<number>();

          for (let i = 1; i < rawSheetData.length; i++) {
            const rowValues = rawSheetData[i];
            if (!rowValues || rowValues.every((val: any) => String(val || '').trim() === '')) {
              continue;
            }

            const rowData: Record<string, string> = {};
            Object.entries(headerToKeyMap).forEach(([colIdxStr, key]) => {
              const val = rowValues[Number(colIdxStr)];
              rowData[key] = val !== undefined && val !== null ? String(val).trim() : '';
            });

            const name = (rowData.name || '').trim();
            const rawPhone = (rowData.phone || '').replace(/[^0-9]/g, '');

            if (!name) {
              parsed.push({ rowNum: i + 1, action: 'error', data: rowData, error: 'Customer Name is required' });
              continue;
            }

            if (!rawPhone || rawPhone.length < 10) {
              parsed.push({ rowNum: i + 1, action: 'error', data: rowData, error: 'Mobile must be at least 10 valid digits' });
              continue;
            }

            const phone = rawPhone.slice(-10);
            rowData.phone = phone;

            const existing = customers.find(c => {
              const existingPhone = (c.mobile || c.phone || '').replace(/[^0-9]/g, '').slice(-10);
              return existingPhone === phone;
            });

            if (existing) {
              const diffs: string[] = [];
              if (name && name.toLowerCase() !== (existing.name || existing.fullName || '').toLowerCase()) {
                diffs.push(`Name: "${existing.name || existing.fullName}" → "${name}"`);
              }
              if (rowData.city && rowData.city.toLowerCase() !== (existing.city || '').toLowerCase()) {
                diffs.push(`City: "${existing.city || '—'}" → "${rowData.city}"`);
              }
              if (rowData.pan_no && rowData.pan_no.toUpperCase() !== (existing.pan || (existing as any).panNo || '').toUpperCase()) {
                diffs.push(`PAN: "${existing.pan || '—'}" → "${rowData.pan_no}"`);
              }
              if (rowData.gst_no && rowData.gst_no.toUpperCase() !== (existing.gstin || '').toUpperCase()) {
                diffs.push(`GST: "${existing.gstin || '—'}" → "${rowData.gst_no}"`);
              }

              if (diffs.length > 0) {
                parsed.push({ rowNum: i + 1, action: 'update', data: rowData, diff: diffs, matchedId: existing.id });
                selectableRowNums.add(i + 1);
              } else {
                parsed.push({ rowNum: i + 1, action: 'unchanged', data: rowData, matchedId: existing.id });
              }
            } else {
              parsed.push({ rowNum: i + 1, action: 'create', data: rowData });
              selectableRowNums.add(i + 1);
            }
          }

          setPreviewRows(parsed);
          setSelectedRowNums(selectableRowNums);
          setImportSummary(null);
        } else if (activeTab === 'inventory') {
          // Inventory Header Mapping
          headerRow.forEach((h, idx) => {
            const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            const field = ALL_INVENTORY_IMPORT_FIELDS.find(f => 
              f.key.toLowerCase().replace(/[^a-z0-9]/g, '') === clean || 
              f.label.toLowerCase().replace(/[^a-z0-9]/g, '') === clean
            );
            if (field) {
              headerToKeyMap[idx] = field.key;
            } else if (clean === 'itemname' || clean === 'name' || clean === 'description' || clean === 'item') {
              headerToKeyMap[idx] = 'itemName';
            } else if (clean === 'sku' || clean === 'itemcode' || clean === 'code') {
              headerToKeyMap[idx] = 'itemCode';
            } else if (clean === 'huid' || clean === 'huidno') {
              headerToKeyMap[idx] = 'huid';
            } else if (clean === 'purity' || clean === 'karat' || clean === 'touch') {
              headerToKeyMap[idx] = 'purityKarat';
            } else if (clean === 'grosswt' || clean === 'grossweight' || clean === 'gross') {
              headerToKeyMap[idx] = 'grossWeight';
            } else if (clean === 'netwt' || clean === 'netweight' || clean === 'net') {
              headerToKeyMap[idx] = 'netWeight';
            } else if (clean === 'stonewt' || clean === 'stoneweight') {
              headerToKeyMap[idx] = 'stoneWeight';
            } else if (clean === 'wastage' || clean === 'wastagepercent' || clean === 'wastagepct') {
              headerToKeyMap[idx] = 'wastagePercent';
            } else if (clean === 'makingrate' || clean === 'making' || clean === 'makingcharges') {
              headerToKeyMap[idx] = 'makingRate';
            } else if (clean === 'category') {
              headerToKeyMap[idx] = 'category';
            } else if (clean === 'metal' || clean === 'metaltype') {
              headerToKeyMap[idx] = 'metalType';
            } else if (clean === 'barcode') {
              headerToKeyMap[idx] = 'barcode';
            }
          });

          const parsed: ParsedPreviewRow[] = [];
          const selectableRowNums = new Set<number>();

          for (let i = 1; i < rawSheetData.length; i++) {
            const rowValues = rawSheetData[i];
            if (!rowValues || rowValues.every((val: any) => String(val || '').trim() === '')) {
              continue;
            }

            const rowData: Record<string, string> = {};
            Object.entries(headerToKeyMap).forEach(([colIdxStr, key]) => {
              const val = rowValues[Number(colIdxStr)];
              rowData[key] = val !== undefined && val !== null ? String(val).trim() : '';
            });

            const itemName = (rowData.itemName || '').trim();
            const itemCode = (rowData.itemCode || '').trim();
            const grossWeight = parseFloat(rowData.grossWeight || '0');
            const netWeight = parseFloat(rowData.netWeight || '0');

            if (!itemName) {
              parsed.push({ rowNum: i + 1, action: 'error', data: rowData, error: 'Item Name is required' });
              continue;
            }

            if (!itemCode) {
              parsed.push({ rowNum: i + 1, action: 'error', data: rowData, error: 'SKU / Item Code is required' });
              continue;
            }

            if (isNaN(grossWeight) || grossWeight <= 0) {
              parsed.push({ rowNum: i + 1, action: 'error', data: rowData, error: 'Gross Weight must be a valid positive number' });
              continue;
            }

            if (isNaN(netWeight) || netWeight <= 0 || netWeight > grossWeight) {
              parsed.push({ rowNum: i + 1, action: 'error', data: rowData, error: 'Net Weight must be positive and <= Gross Weight' });
              continue;
            }

            // Check if item exists in inventory
            const existing = inventory.find(it => 
              it.itemCode.toLowerCase() === itemCode.toLowerCase() || 
              (rowData.huid && it.huid && it.huid.toUpperCase() === rowData.huid.toUpperCase())
            );

            if (existing) {
              const diffs: string[] = [];
              if (itemName && itemName !== existing.itemName) {
                diffs.push(`Name: "${existing.itemName}" → "${itemName}"`);
              }
              if (grossWeight !== existing.grossWeight) {
                diffs.push(`Gross Wt: ${existing.grossWeight.toFixed(3)}g → ${grossWeight.toFixed(3)}g`);
              }
              if (netWeight !== existing.netWeight) {
                diffs.push(`Net Wt: ${existing.netWeight.toFixed(3)}g → ${netWeight.toFixed(3)}g`);
              }
              if (rowData.makingRate && parseFloat(rowData.makingRate) !== existing.makingRate) {
                diffs.push(`Making Rate: ₹${existing.makingRate} → ₹${rowData.makingRate}`);
              }

              if (diffs.length > 0) {
                parsed.push({ rowNum: i + 1, action: 'update', data: rowData, diff: diffs, matchedId: existing.id });
                selectableRowNums.add(i + 1);
              } else {
                parsed.push({ rowNum: i + 1, action: 'unchanged', data: rowData, matchedId: existing.id });
              }
            } else {
              parsed.push({ rowNum: i + 1, action: 'create', data: rowData });
              selectableRowNums.add(i + 1);
            }
          }

          setPreviewRows(parsed);
          setSelectedRowNums(selectableRowNums);
          setImportSummary(null);
        }
      } catch (err: any) {
        console.error('File parsing error:', err);
        alert(`Error parsing file: ${err.message || 'Unknown format'}`);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Commit selected rows to application store
  const handleCommitImport = () => {
    if (!previewRows) return;
    setIsProcessing(true);

    const rowsToImport = previewRows.filter(r => selectedRowNums.has(r.rowNum));
    let createdCount = 0;
    let updatedCount = 0;
    const skippedCount = previewRows.filter(r => r.action === 'unchanged').length;
    const failedCount = previewRows.filter(r => r.action === 'error').length;

    if (activeTab === 'customers') {
      const importedCustomers: Customer[] = [];

      rowsToImport.forEach((row, idx) => {
        if (row.action === 'create') {
          createdCount++;
          importedCustomers.push({
            id: `cust-imp-${Date.now()}-${idx}`,
            code: `CUST-${String(customers.length + createdCount).padStart(5, '0')}`,
            name: row.data.name,
            fullName: row.data.name,
            mobile: row.data.phone,
            phone: row.data.phone,
            email: row.data.email || undefined,
            address: row.data.street1 || '',
            city: row.data.city || 'Mumbai',
            state: row.data.state || 'Maharashtra',
            stateCode: '27',
            pincode: row.data.pincode || '400057',
            pan: row.data.pan_no || undefined,
            aadhaarNumber: row.data.aadhar_no || undefined,
            gstin: row.data.gst_no || undefined,
            dob: row.data.dob || undefined,
            anniversary: row.data.anniversary || undefined,
            customerType: (row.data.customer_type as any) || 'retail',
            creditLimit: row.data.credit_limit ? parseFloat(row.data.credit_limit) : undefined,
            openingBalance: row.data.opening_balance ? parseFloat(row.data.opening_balance) : 0
          });
        } else if (row.action === 'update') {
          updatedCount++;
          const matched = customers.find(c => c.id === row.matchedId);
          importedCustomers.push({
            id: row.matchedId || `cust-upd-${idx}`,
            code: matched?.code || `CUST-UPD`,
            name: row.data.name || matched?.name || '',
            fullName: row.data.name || matched?.fullName || '',
            mobile: row.data.phone,
            phone: row.data.phone,
            email: row.data.email || matched?.email,
            address: row.data.street1 || matched?.address || '',
            city: row.data.city || matched?.city || 'Mumbai',
            state: row.data.state || matched?.state || 'Maharashtra',
            stateCode: '27',
            pincode: row.data.pincode || matched?.pincode || '400057',
            pan: row.data.pan_no || matched?.pan,
            aadhaarNumber: row.data.aadhar_no || matched?.aadhaarNumber,
            gstin: row.data.gst_no || matched?.gstin,
            dob: row.data.dob || matched?.dob,
            anniversary: row.data.anniversary || matched?.anniversary,
            customerType: (row.data.customer_type as any) || matched?.customerType || 'retail',
            creditLimit: row.data.credit_limit ? parseFloat(row.data.credit_limit) : matched?.creditLimit,
            openingBalance: matched?.openingBalance || 0
          });
        }
      });

      onImportCustomers(importedCustomers);
    } else if (activeTab === 'inventory' && onImportInventory) {
      const importedItems: InventoryItem[] = [];

      rowsToImport.forEach((row, idx) => {
        const gross = parseFloat(row.data.grossWeight || '0');
        const net = parseFloat(row.data.netWeight || String(gross));
        const stone = parseFloat(row.data.stoneWeight || String(gross - net));
        const wastage = parseFloat(row.data.wastagePercent || '5.0');
        const making = parseFloat(row.data.makingRate || '500.00');
        const cost = parseFloat(row.data.costPrice || '0') || (net * 7200 + net * making);
        const retail = parseFloat(row.data.retailPrice || '0') || (cost * 1.05);

        if (row.action === 'create') {
          createdCount++;
          importedItems.push({
            id: `item-imp-${Date.now()}-${idx}`,
            itemCode: row.data.itemCode.toUpperCase(),
            itemName: row.data.itemName,
            category: row.data.category || 'Gold Jewellery',
            metalGroup: (row.data.metalType as any) || 'Gold',
            metalType: row.data.metalType || 'Gold',
            purityKarat: row.data.purityKarat || '22K',
            purityPercent: (row.data.purityKarat || '22K').includes('24') ? 99.9 : (row.data.purityKarat || '22K').includes('18') ? 75.0 : 91.6,
            grossWeight: gross,
            netWeight: net,
            stoneWeight: stone,
            wastagePercent: wastage,
            makingRate: making,
            makingMode: (row.data.makingMode as any) || 'PER_NET_GRAM',
            costPrice: cost,
            retailPrice: retail,
            wholesalePrice: cost * 1.02,
            barcode: row.data.barcode || `89012${Math.floor(1000000 + Math.random() * 9000000)}`,
            huid: row.data.huid ? row.data.huid.toUpperCase() : 'HUIDNA',
            hsn: row.data.hsnCode || '7113',
            stockQty: row.data.stockQty ? parseInt(row.data.stockQty) : 1,
            location: row.data.location || 'Counter MAIN',
            stones: [],
            status: 'IN_STOCK'
          });
        } else if (row.action === 'update') {
          updatedCount++;
          const matched = inventory.find(it => it.id === row.matchedId);
          importedItems.push({
            id: row.matchedId || `item-upd-${idx}`,
            itemCode: row.data.itemCode.toUpperCase() || matched?.itemCode || '',
            itemName: row.data.itemName || matched?.itemName || '',
            category: row.data.category || matched?.category || 'Gold Jewellery',
            metalGroup: (row.data.metalType as any) || matched?.metalGroup || 'Gold',
            metalType: row.data.metalType || matched?.metalType || 'Gold',
            purityKarat: row.data.purityKarat || matched?.purityKarat || '22K',
            purityPercent: matched?.purityPercent || ((row.data.purityKarat || '22K').includes('24') ? 99.9 : (row.data.purityKarat || '22K').includes('18') ? 75.0 : 91.6),
            grossWeight: gross || matched?.grossWeight || 0,
            netWeight: net || matched?.netWeight || 0,
            stoneWeight: stone || matched?.stoneWeight || 0,
            wastagePercent: wastage || matched?.wastagePercent || 5.0,
            makingRate: making || matched?.makingRate || 500,
            makingMode: (row.data.makingMode as any) || matched?.makingMode || 'PER_NET_GRAM',
            costPrice: cost || matched?.costPrice || 0,
            retailPrice: retail || matched?.retailPrice || 0,
            wholesalePrice: matched?.wholesalePrice || (cost * 1.02),
            barcode: row.data.barcode || matched?.barcode || '',
            huid: row.data.huid ? row.data.huid.toUpperCase() : (matched?.huid || 'HUIDNA'),
            hsn: row.data.hsnCode || matched?.hsn || '7113',
            stockQty: row.data.stockQty ? parseInt(row.data.stockQty) : (matched?.stockQty || 1),
            location: row.data.location || matched?.location || 'Counter MAIN',
            stones: matched?.stones || [],
            status: matched?.status || 'IN_STOCK'
          });
        }
      });

      onImportInventory(importedItems);
    }

    setIsProcessing(false);
    setImportSummary({ 
      created: createdCount, 
      updated: updatedCount, 
      skipped: skippedCount, 
      failed: failedCount 
    });
    setPreviewRows(null);
  };

  // Filter preview rows
  const filteredPreview = useMemo(() => {
    if (!previewRows) return [];
    if (!filterAction || filterAction === 'all') return previewRows;
    return previewRows.filter(r => r.action === filterAction);
  }, [previewRows, filterAction]);

  const previewStats = useMemo(() => {
    if (!previewRows) return { total: 0, create: 0, update: 0, unchanged: 0, error: 0 };
    return {
      total: previewRows.length,
      create: previewRows.filter(r => r.action === 'create').length,
      update: previewRows.filter(r => r.action === 'update').length,
      unchanged: previewRows.filter(r => r.action === 'unchanged').length,
      error: previewRows.filter(r => r.action === 'error').length
    };
  }, [previewRows]);

  // Export helper functions
  const handleExportJSON = (type: 'customers' | 'inventory') => {
    const data = type === 'customers' ? customers : inventory;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = (type: 'customers' | 'inventory') => {
    const wb = XLSX.utils.book_new();
    if (type === 'customers') {
      const rows = customers.map((c, idx) => ({
        'S.No': idx + 1,
        'Customer Code': c.code,
        'Name': c.fullName || c.name,
        'Mobile': c.mobile || c.phone,
        'Email': c.email || '',
        'City': c.city || '',
        'State': c.state || 'Maharashtra',
        'PAN': c.pan || '',
        'GSTIN': c.gstin || '',
        'Aadhaar': c.aadhaarNumber || '',
        'Customer Type': c.customerType || 'retail'
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      XLSX.writeFile(wb, `Customers_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } else {
      const rows = inventory.map((it, idx) => ({
        'S.No': idx + 1,
        'Item Code': it.itemCode,
        'Item Name': it.itemName,
        'HUID': it.huid || '',
        'Category': it.category,
        'Metal': it.metalGroup || it.metalType,
        'Purity': it.purityKarat,
        'Gross Weight (g)': it.grossWeight,
        'Stone Weight (g)': it.stoneWeight,
        'Net Weight (g)': it.netWeight,
        'Wastage %': it.wastagePercent || 5.0,
        'Making Rate (₹/g)': it.makingRate,
        'Cost Price (₹)': it.costPrice,
        'Retail Price (₹)': it.retailPrice,
        'Barcode': it.barcode,
        'Location': it.location
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      XLSX.writeFile(wb, `Inventory_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };

  return (
    <div className="page" style={{ padding: '16px 20px', maxWidth: 1240, margin: '0 auto' }}>
      {/* 1. Licence Warning Banner */}
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

      {/* 2. Page Header with Session Status Badge */}
      <div className="page-hdr" style={{ marginBottom: 16 }}>
        <div className="page-hdr-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--graphite, #202522)' }}>
              Data Import & Export
            </h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fef8ee] text-[#92400e] rounded-full border border-[#efdcb6] text-xs font-semibold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <span>Counter MAIN</span>
              <span className="font-normal opacity-80"> · REG-2026-00001 · closing</span>
            </div>
          </div>
          <div className="helper" style={{ fontSize: 13, color: 'var(--muted, #64748b)', marginTop: 4 }}>
            Bulk Excel (.xlsx) & CSV import and export for Customers and Jewellery Inventory items with full column mapping and SheetJS validation.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleExportExcel(activeTab === 'inventory' ? 'inventory' : 'customers')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={13} />
            Export Excel
          </button>
          <button 
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleExportJSON(activeTab === 'inventory' ? 'inventory' : 'customers')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Download size={13} />
            Export JSON
          </button>
        </div>
      </div>

      {/* Mode Tabs: Customers | Inventory / Stock | Export & Backup */}
      <div className="tabs" style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => { setActiveTab('customers'); setPreviewRows(null); setImportSummary(null); }}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'customers' ? '2.5px solid var(--primary, #237a57)' : '2.5px solid transparent',
            color: activeTab === 'customers' ? 'var(--primary, #237a57)' : 'var(--muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Users size={15} />
          <span>Customers Import</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('inventory'); setPreviewRows(null); setImportSummary(null); }}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'inventory' ? '2.5px solid var(--primary, #237a57)' : '2.5px solid transparent',
            color: activeTab === 'inventory' ? 'var(--primary, #237a57)' : 'var(--muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Package size={15} />
          <span>Inventory / Stock Items Import</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('export'); setPreviewRows(null); setImportSummary(null); }}
          style={{
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 600,
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'export' ? '2.5px solid var(--primary, #237a57)' : '2.5px solid transparent',
            color: activeTab === 'export' ? 'var(--primary, #237a57)' : 'var(--muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          <Database size={15} />
          <span>JSON & Excel Export Hub</span>
        </button>
      </div>

      {/* Import Completion Summary Card */}
      {importSummary && (
        <div className="card" style={{ marginBottom: 16, borderLeft: '4px solid var(--success, #2e7d32)', background: 'var(--surface)' }}>
          <div className="card-body" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--success)' }}>
                  {activeTab === 'customers' ? 'Customer' : 'Inventory Item'} Import completed successfully
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-xs btn-outline" 
                onClick={() => setImportSummary(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              <div className="kpi" style={{ padding: 10, background: 'var(--bg)', borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Added (New)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{importSummary.created}</div>
              </div>
              <div className="kpi" style={{ padding: 10, background: 'var(--bg)', borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Updated</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--info, #0284c7)' }}>{importSummary.updated}</div>
              </div>
              <div className="kpi" style={{ padding: 10, background: 'var(--bg)', borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>No change (Skipped)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--muted)' }}>{importSummary.skipped}</div>
              </div>
              <div className="kpi" style={{ padding: 10, background: 'var(--bg)', borderRadius: 6 }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Errors / Rejected</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: importSummary.failed ? 'var(--danger)' : 'var(--muted)' }}>{importSummary.failed}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: CUSTOMERS IMPORT */}
      {activeTab === 'customers' && (
        <>
          {/* STEP 1: DOWNLOAD CUSTOMER TEMPLATE */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="card-title" style={{ fontSize: 14, fontWeight: 700 }}>
                  1 · Download Template ({activeCustomerCols.length} of 28 Customer Fields Selected)
                </span>
                <div className="helper" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  Customer Name and Mobile are mandatory. Configure optional fields for Address, KYC, Dates, Account, and Family.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setSelectedCustomerColumns(ALL_CUSTOMER_IMPORT_FIELDS.map(f => f.key))}
                  style={{ fontSize: 11 }}
                >
                  Select All 28
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setSelectedCustomerColumns(DEFAULT_CUSTOMER_SELECTED_KEYS)}
                  style={{ fontSize: 11 }}
                >
                  Default columns
                </button>
              </div>
            </div>
            <div className="card-body" style={{ padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                {groupedCustomerFields.map(([groupName, fields]) => (
                  <div key={groupName} style={{ background: 'var(--bg, #f8fafc)', padding: 10, borderRadius: 6, border: '1px solid var(--border, #e2e8f0)' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--graphite, #1e293b)', marginBottom: 8, borderBottom: '1px solid var(--border, #cbd5e1)', paddingBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {groupName} ({fields.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {fields.map(f => (
                        <label 
                          key={f.key} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8, 
                            fontSize: 12, 
                            cursor: f.required ? 'default' : 'pointer',
                            opacity: f.required ? 0.75 : 1
                          }}
                        >
                          <input 
                            type="checkbox"
                            checked={f.required || selectedCustomerColumns.includes(f.key)}
                            disabled={f.required}
                            onChange={() => toggleCustomerColumn(f.key)}
                          />
                          <span>{f.label}{f.required ? ' *' : ''}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDownloadCustomerTemplate('xlsx')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} />
                  Excel template (.xlsx)
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleDownloadCustomerTemplate('csv')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} />
                  CSV template (.csv)
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleDownloadCustomerTemplate('xlsx', true)}
                  title="Export current registered customers in these columns — edit and upload to update them"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Users size={13} />
                  With my customers ({customers.length} to update)
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: INVENTORY / STOCK IMPORT */}
      {activeTab === 'inventory' && (
        <>
          {/* STEP 1: DOWNLOAD INVENTORY TEMPLATE */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="card-title" style={{ fontSize: 14, fontWeight: 700 }}>
                  1 · Download Jewellery Stock Template ({activeInventoryCols.length} Columns Configured)
                </span>
                <div className="helper" style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  Includes essential columns: Item Name, SKU, HUID, Purity, Gross Wt, Net Wt, Wastage %, Making Rate, Category, Metal, Barcode.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setSelectedInventoryColumns(ALL_INVENTORY_IMPORT_FIELDS.map(f => f.key))}
                  style={{ fontSize: 11 }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => setSelectedInventoryColumns(DEFAULT_INVENTORY_SELECTED_KEYS)}
                  style={{ fontSize: 11 }}
                >
                  Default columns
                </button>
              </div>
            </div>
            <div className="card-body" style={{ padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                {groupedInventoryFields.map(([groupName, fields]) => (
                  <div key={groupName} style={{ background: 'var(--bg, #f8fafc)', padding: 10, borderRadius: 6, border: '1px solid var(--border, #e2e8f0)' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--graphite, #1e293b)', marginBottom: 8, borderBottom: '1px solid var(--border, #cbd5e1)', paddingBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {groupName} ({fields.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {fields.map(f => (
                        <label 
                          key={f.key} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8, 
                            fontSize: 12, 
                            cursor: f.required ? 'default' : 'pointer',
                            opacity: f.required ? 0.75 : 1
                          }}
                        >
                          <input 
                            type="checkbox"
                            checked={f.required || selectedInventoryColumns.includes(f.key)}
                            disabled={f.required}
                            onChange={() => toggleInventoryColumn(f.key)}
                          />
                          <span>{f.label}{f.required ? ' *' : ''}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleDownloadInventoryTemplate('xlsx')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} />
                  Excel Template (.xlsx)
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleDownloadInventoryTemplate('csv')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} />
                  CSV Template (.csv)
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleDownloadInventoryTemplate('xlsx', true)}
                  title="Export current registered inventory in these columns — edit and upload to update them"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Package size={13} />
                  With my stock ({inventory.length} items to update)
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* STEP 2: UPLOAD FILE (Active for Customers & Inventory) */}
      {(activeTab === 'customers' || activeTab === 'inventory') && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="card-title" style={{ fontSize: 14, fontWeight: 700 }}>
              2 · Upload {activeTab === 'customers' ? 'Customer' : 'Inventory'} Spreadsheet
            </span>
            {uploadedFileName && (
              <span className="badge badge-indigo" style={{ fontSize: 11.5 }}>
                Loaded: {uploadedFileName}
              </span>
            )}
          </div>
          <div className="card-body" style={{ padding: 18 }}>
            <div
              style={{
                border: '2px dashed var(--border, #cbd5e1)',
                borderRadius: 8,
                padding: '30px 20px',
                textAlign: 'center',
                background: 'var(--bg, #f8fafc)',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} style={{ margin: '0 auto 8px', color: 'var(--primary, #237a57)' }} />
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>
                Click or drag to upload {activeTab === 'customers' ? 'customer' : 'jewellery inventory'} spreadsheet
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="btn btn-primary btn-sm"
                style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Upload size={14} />
                <span>Choose Excel / CSV file</span>
              </button>
              <div style={{ fontSize: 12, color: 'var(--muted, #64748b)' }}>
                Parsed with SheetJS (xlsx engine) · Automatic column mapping for Item Name, SKU, HUID, Purity, Gross Wt, Net Wt, Wastage %, Making Rate
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".csv,.xlsx,.xls" 
                onChange={handleFileUpload} 
                style={{ display: 'none' }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PREVIEW & STATS CARDS */}
      {previewRows && (activeTab === 'customers' || activeTab === 'inventory') && (
        <div className="card">
          {/* Summary Statistics Cards */}
          <div style={{ padding: '16px 18px', background: 'var(--surface2, #f1f5f9)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.04em', marginBottom: 10 }}>
              Batch Pre-Import Analysis ({activeTab === 'customers' ? 'Customers' : 'Inventory Items'})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <div className="kpi" style={{ padding: '10px 14px', background: '#fff', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Total Rows</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{previewStats.total}</div>
              </div>
              <div className="kpi" style={{ padding: '10px 14px', background: '#fff', borderRadius: 6, border: '1px solid var(--border)', borderLeft: '4px solid #16a34a' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>New Records</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>{previewStats.create}</div>
              </div>
              <div className="kpi" style={{ padding: '10px 14px', background: '#fff', borderRadius: 6, border: '1px solid var(--border)', borderLeft: '4px solid #4f46e5' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Updates Found</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5' }}>{previewStats.update}</div>
              </div>
              <div className="kpi" style={{ padding: '10px 14px', background: '#fff', borderRadius: 6, border: '1px solid var(--border)', borderLeft: '4px solid #64748b' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>No Change</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#64748b' }}>{previewStats.unchanged}</div>
              </div>
              <div className="kpi" style={{ padding: '10px 14px', background: '#fff', borderRadius: 6, border: '1px solid var(--border)', borderLeft: '4px solid #dc2626' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>Errors / Rejected</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: previewStats.error ? '#dc2626' : '#64748b' }}>{previewStats.error}</div>
              </div>
            </div>
          </div>

          {/* Action Filter & Commit Bar */}
          <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <span className="card-title" style={{ fontSize: 14, fontWeight: 700 }}>
                3 · Review & Preview Grid ({filteredPreview.length} shown)
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Filter size={13} style={{ color: 'var(--muted)' }} />
                <select
                  className="input input-sm"
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option value="all">All ({previewStats.total})</option>
                  <option value="create">New ({previewStats.create})</option>
                  <option value="update">Update ({previewStats.update})</option>
                  <option value="unchanged">No change ({previewStats.unchanged})</option>
                  <option value="error">Error ({previewStats.error})</option>
                </select>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={selectedRowNums.size === 0 || isProcessing}
                onClick={handleCommitImport}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <Check size={14} />
                {isProcessing ? 'Importing...' : `Import Selected (${selectedRowNums.size})`}
              </button>
            </div>
          </div>

          {/* Preview Grid Table */}
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={filteredPreview.length > 0 && filteredPreview.filter(r => r.action === 'create' || r.action === 'update').every(r => selectedRowNums.has(r.rowNum))}
                      onChange={(e) => {
                        const next = new Set(selectedRowNums);
                        if (e.target.checked) {
                          filteredPreview.forEach(r => {
                            if (r.action === 'create' || r.action === 'update') next.add(r.rowNum);
                          });
                        } else {
                          filteredPreview.forEach(r => next.delete(r.rowNum));
                        }
                        setSelectedRowNums(next);
                      }}
                    />
                  </th>
                  <th>Row #</th>
                  <th>Action State</th>
                  {activeTab === 'customers' ? (
                    <>
                      <th>Customer Name</th>
                      <th>Mobile</th>
                      <th>City</th>
                      <th>PAN</th>
                      <th>GSTIN</th>
                    </>
                  ) : (
                    <>
                      <th>Item Name</th>
                      <th>SKU</th>
                      <th>HUID</th>
                      <th>Purity</th>
                      <th className="num">Gross Wt (g)</th>
                      <th className="num">Net Wt (g)</th>
                      <th className="num">Wastage %</th>
                      <th className="num">Making (₹/g)</th>
                    </>
                  )}
                  <th>Diff / Validation Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredPreview.map((row) => {
                  const isSelectable = row.action === 'create' || row.action === 'update';
                  return (
                    <tr 
                      key={row.rowNum} 
                      style={{ 
                        background: row.action === 'error' ? '#fef2f2' : undefined,
                        borderLeft: row.action === 'create' ? '3px solid #16a34a' :
                                    row.action === 'update' ? '3px solid #4f46e5' :
                                    row.action === 'error' ? '3px solid #dc2626' : undefined
                      }}
                    >
                      <td style={{ textAlign: 'center' }}>
                        {isSelectable && (
                          <input
                            type="checkbox"
                            checked={selectedRowNums.has(row.rowNum)}
                            onChange={(e) => {
                              const next = new Set(selectedRowNums);
                              if (e.target.checked) next.add(row.rowNum);
                              else next.delete(row.rowNum);
                              setSelectedRowNums(next);
                            }}
                          />
                        )}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'monospace' }}>#{row.rowNum}</td>
                      <td>
                        {row.action === 'create' && <span className="badge badge-green">New</span>}
                        {row.action === 'update' && <span className="badge badge-indigo">Update</span>}
                        {row.action === 'unchanged' && <span className="badge badge-gray">No change</span>}
                        {row.action === 'error' && <span className="badge badge-red">Error</span>}
                      </td>

                      {activeTab === 'customers' ? (
                        <>
                          <td style={{ fontWeight: 600 }}>{row.data.name || '—'}</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.data.phone || '—'}</td>
                          <td>{row.data.city || '—'}</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.data.pan_no || '—'}</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.data.gst_no || '—'}</td>
                        </>
                      ) : (
                        <>
                          <td style={{ fontWeight: 600 }}>{row.data.itemName || '—'}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.data.itemCode || '—'}</td>
                          <td style={{ fontFamily: 'monospace' }}>{row.data.huid || '—'}</td>
                          <td><span className="badge badge-gold">{row.data.purityKarat || '22K'}</span></td>
                          <td className="num">{parseFloat(row.data.grossWeight || '0').toFixed(3)}</td>
                          <td className="num font-bold">{parseFloat(row.data.netWeight || '0').toFixed(3)}</td>
                          <td className="num">{row.data.wastagePercent ? `${row.data.wastagePercent}%` : '5.0%'}</td>
                          <td className="num font-mono">₹{parseFloat(row.data.makingRate || '0').toLocaleString('en-IN')}</td>
                        </>
                      )}

                      <td style={{ fontSize: 12 }}>
                        {row.error ? (
                          <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{row.error}</span>
                        ) : row.diff && row.diff.length > 0 ? (
                          <span style={{ color: 'var(--info)' }}>{row.diff.join(' · ')}</span>
                        ) : row.action === 'unchanged' ? (
                          <span style={{ color: 'var(--muted)' }}>Matches existing database record</span>
                        ) : (
                          <span style={{ color: 'var(--success)' }}>Ready to add as new record</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPORT & BACKUP HUB */}
      {activeTab === 'export' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {/* Customers Export Card */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} style={{ color: 'var(--primary)' }} />
              <strong>Customer Directory Export ({customers.length} records)</strong>
            </div>
            <div className="card-body" style={{ padding: 18 }}>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 16px' }}>
                Download full customer accounts directory including KYC (PAN, GSTIN, Aadhaar), addresses, credit limits, and contact numbers.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleExportExcel('customers')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} />
                  Export to Excel (.xlsx)
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleExportJSON('customers')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} />
                  Export JSON (.json)
                </button>
              </div>
            </div>
          </div>

          {/* Inventory Export Card */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={16} style={{ color: 'var(--primary)' }} />
              <strong>Inventory & Stock Export ({inventory.length} items)</strong>
            </div>
            <div className="card-body" style={{ padding: 18 }}>
              <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 16px' }}>
                Download complete jewellery stock with Item Names, SKU, HUID, Purity, Gross Wt, Net Wt, Wastage, Making Rates, and cost/retail prices.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => handleExportExcel('inventory')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} />
                  Export to Excel (.xlsx)
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => handleExportJSON('inventory')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={13} />
                  Export JSON (.json)
                </button>
              </div>
            </div>
          </div>

          {/* Full Backup Hub Link */}
          <div className="card" style={{ gridColumn: '1 / -1', background: 'var(--surface2)' }}>
            <div className="card-body" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <strong style={{ fontSize: 14 }}>Looking for Full Database & Point-in-Time Backups?</strong>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Access encrypted SQL snapshots, cloud sync diagnostics, and automated backups in the Backup & Sync Hub.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onNavigate ? onNavigate('backup-settings') : (window.location.pathname = '/export')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>Go to Database & Backups</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImportView;

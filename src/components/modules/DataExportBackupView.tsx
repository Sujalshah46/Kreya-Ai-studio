import { useState } from 'react';
import { Download } from 'lucide-react';
import { invoiceReceipts } from '../../data/invoicePayments';
import type { Customer, GirviLoan, InventoryItem, RepairOrder, SalesInvoice, SavingScheme, StoreProfile } from '../../types';

interface DataExportBackupViewProps {
  store: StoreProfile;
  customers: Customer[];
  inventory: InventoryItem[];
  invoices: SalesInvoice[];
  loans: GirviLoan[];
  repairs: RepairOrder[];
  schemes: SavingScheme[];
}

type Cell = string | number | undefined;
type Dataset = { title: string; detail: string; name: string; headers: string[]; rows: Cell[][] };

const shopDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' });

function dateKey(value?: string) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}(?:$|[ T]\d{2}:\d{2}(?::\d{2})?$)/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : shopDate.format(date);
}

function csvCell(value: Cell) {
  if (typeof value === 'number') return String(value);
  const text = value ?? '';
  const safe = /^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
}

function download(content: string, basename: string, suffix: 'csv' | 'json') {
  const url = URL.createObjectURL(new Blob([content], {
    type: suffix === 'csv' ? 'text/csv;charset=utf-8' : 'application/json'
  }));
  const link = document.createElement('a');
  link.href = url;
  link.download = basename + '_' + shopDate.format(new Date()) + '.' + suffix;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function DataExportBackupView(props: DataExportBackupViewProps) {
  const { customers, inventory, invoices, loans } = props;
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const inRange = (value?: string) => {
    const date = dateKey(value);
    return (!from || (date && date >= from)) && (!to || (date && date <= to));
  };
  const orders = invoices.filter(invoice => inRange(invoice.invoiceDate ?? invoice.date));
  const datasets: Dataset[] = [
    { title: 'All Customers', detail: 'Customer names, contact details and balances', name: 'customers',
      headers: ['Code', 'Name', 'Mobile', 'Email', 'City', 'Outstanding'],
      rows: customers.map(customer => [customer.code, customer.name, customer.mobile || customer.phone, customer.email, customer.city, customer.outstandingBalance]) },
    { title: 'Orders', detail: 'Sales invoices with paid and pending amounts', name: 'orders',
      headers: ['Invoice No', 'Date', 'Customer', 'Invoice Amount', 'Paid', 'Pending', 'Status'],
      rows: orders.map(order => [order.invoiceNo || order.invoiceNumber, dateKey(order.invoiceDate ?? order.date), order.customer.name,
        order.grandTotal ?? order.totalAmount ?? order.productTotalValue, order.paidAmount, order.balanceDue, order.status]) },
    { title: 'Invoice Line Items', detail: 'Item-level invoice data, weights and GST', name: 'invoice_lines',
      headers: ['Invoice No', 'Code', 'Item', 'Gross g', 'Net g', 'Taxable', 'CGST', 'SGST', 'Total'],
      rows: orders.flatMap(order => order.items.map(item => [order.invoiceNo || order.invoiceNumber, item.itemCode, item.itemName,
        item.grossWeight, item.netWeight, item.taxableAmount, item.cgstAmount, item.sgstAmount, item.lineTotal])) },
    { title: 'Payments / Receipts', detail: 'Dated invoice collections and their references', name: 'payments',
      headers: ['Receipt', 'Invoice No', 'Date', 'Mode', 'Amount', 'Reference'],
      rows: invoices.flatMap(order => invoiceReceipts(order).filter(receipt => inRange(receipt.date ?? receipt.timestamp)).map(receipt =>
        [receipt.receiptNo || receipt.id, order.invoiceNo || order.invoiceNumber, dateKey(receipt.date ?? receipt.timestamp), receipt.mode, receipt.amount, receipt.referenceNo])) },
    { title: 'Loans', detail: 'Gold and silver loans and balances', name: 'loans',
      headers: ['Loan No', 'Date', 'Customer', 'Principal', 'Outstanding', 'Status'],
      rows: loans.filter(loan => inRange(loan.loanDate)).map(loan =>
        [loan.loanNo, dateKey(loan.loanDate), loan.customer.name, loan.principalAmount, loan.principalDue, loan.status]) },
    { title: 'Inventory', detail: 'Stock items with weights, quantities and price', name: 'inventory',
      headers: ['Code', 'Item', 'Gross g', 'Net g', 'Quantity', 'Retail'],
      rows: inventory.map(item => [item.itemCode, item.itemName, item.grossWeight, item.netWeight, item.stockQty, item.retailPrice]) }
  ];

  return (
    <div className="page">
      <div className="page-hdr"><div className="page-hdr-left"><h1>Export &amp; Data Backup</h1></div></div>
      <div className="flex flex-wrap gap-3 mb-4">
        <label>From <input className="input input-sm" type="date" value={from} max={to || undefined} onChange={event => setFrom(event.target.value)} /></label>
        <label>To <input className="input input-sm" type="date" value={to} min={from || undefined} onChange={event => setTo(event.target.value)} /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {datasets.map(dataset => (
          <section className="card card-body" key={dataset.name}>
            <h2 className="card-title">{dataset.title}</h2>
            <p className="helper mb-3">{dataset.detail}</p>
            <button className="btn btn-outline" onClick={() => download('\uFEFF' + [dataset.headers, ...dataset.rows]
              .map(row => row.map(csvCell).join(',')).join('\r\n'), dataset.name, 'csv')}>
              <Download size={15} /> Download CSV
            </button>
          </section>
        ))}
      </div>
      <button className="btn btn-primary mt-4" onClick={() => download(JSON.stringify(props, null, 2), 'kreya_full_backup', 'json')}>
        <Download size={15} /> Download Full Backup
      </button>
      <p className="helper">The backup contains the current records available to this app.</p>
    </div>
  );
}

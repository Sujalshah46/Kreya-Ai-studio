import type { BillingLineItem, SalesInvoice } from '../types';
import { invoiceReceipts } from './invoicePayments';

interface Plan {
  invoice: SalesInvoice;
  removedItems: BillingLineItem[];
  cancelledAmount: number;
  collected: number;
  refund: number;
}

type Result = { ok: true; plan: Plan } | { ok: false; reason: string };

function paise(amount: number): number {
  const value = Math.round(amount * 100);
  return Number.isSafeInteger(value) && amount >= 0 && Math.abs(value / 100 - amount) < 1e-9 ? value : NaN;
}

function lineAmounts(items: BillingLineItem[]) {
  return items.reduce((totals, item) => ({
    taxable: totals.taxable + paise(item.taxableAmount),
    cgst: totals.cgst + paise(item.cgstAmount),
    sgst: totals.sgst + paise(item.sgstAmount),
    gross: totals.gross + paise(item.lineTotal)
  }), { taxable: 0, cgst: 0, sgst: 0, gross: 0 });
}

export function planPartialCancellation(invoice: SalesInvoice, selectedIds: readonly string[], priorRefund: number, fee: number): Result {
  if (invoice.status === 'ESTIMATE' || invoice.status === 'CANCELLED') {
    return { ok: false, reason: 'Only posted invoices can be partially cancelled.' };
  }
  const selected = new Set(selectedIds);
  const ids = new Set(invoice.items.map(item => item.id));
  if (ids.size !== invoice.items.length || selected.has('') || selected.size === 0 ||
      selected.size >= invoice.items.length || [...selected].some(id => !ids.has(id))) {
    return { ok: false, reason: 'Select at least one current line and leave another line on the invoice.' };
  }

  const receipts = invoiceReceipts(invoice);
  if (fee !== 0 || invoice.oldMetalExchanges?.length ||
      [invoice.oldMetalExchangeCredit, invoice.metalAdvanceAdjusted, invoice.roundOff].some(value => (value ?? 0) !== 0) ||
      receipts.some(receipt => ['OLD_GOLD_EXCHANGE', 'CUSTOMER_CREDIT'].includes(receipt.mode.toUpperCase()))) {
    return { ok: false, reason: 'This invoice has adjustments that require a verified credit-note rule.' };
  }

  const removedItems = invoice.items.filter(item => selected.has(item.id));
  const retainedItems = invoice.items.filter(item => !selected.has(item.id));
  const original = lineAmounts(invoice.items);
  const retained = lineAmounts(retainedItems);
  const originalTotal = paise(invoice.grandTotal ?? invoice.totalAmount ?? invoice.netPayable ??
    invoice.finalPayableAmount ?? invoice.productTotalValue);
  const originalProductTotal = paise(invoice.productTotalValue);
  const originalPaid = paise(invoice.paidAmount);
  const originalDue = paise(invoice.balanceDue);
  const collected = receipts.reduce((sum, receipt) => sum + paise(receipt.amount), 0);
  const previousRefund = paise(priorRefund);
  if (![...Object.values(original), ...Object.values(retained), originalTotal, originalPaid, originalDue, collected, previousRefund]
      .every(Number.isSafeInteger) ||
      !invoice.items.every(item => paise(item.taxableAmount) + paise(item.cgstAmount) +
        paise(item.sgstAmount) === paise(item.lineTotal)) ||
      new Set(receipts.map(receipt => receipt.id)).size !== receipts.length ||
      originalTotal !== original.gross || originalPaid + originalDue !== originalTotal ||
      collected - previousRefund !== originalPaid ||
      ![original.taxable, original.gross].includes(originalProductTotal) ||
      [invoice.totalAmount, invoice.grandTotal, invoice.netPayable, invoice.finalPayableAmount]
        .some(value => value !== undefined && paise(value) !== original.gross) ||
      [invoice.taxableAmount, invoice.subtotal].some(value => value !== undefined && paise(value) !== original.taxable) ||
      (invoice.cgstTotal !== undefined && paise(invoice.cgstTotal) !== original.cgst) ||
      (invoice.sgstTotal !== undefined && paise(invoice.sgstTotal) !== original.sgst)) {
    return { ok: false, reason: 'Invoice amounts do not reconcile to the line and receipt records.' };
  }

  const paid = Math.min(originalPaid, retained.gross);
  const due = retained.gross - paid;
  return { ok: true, plan: {
    invoice: {
      ...invoice,
      items: retainedItems,
      productTotalValue: (originalProductTotal === original.taxable ? retained.taxable : retained.gross) / 100,
      grandTotal: retained.gross / 100,
      totalAmount: retained.gross / 100,
      ...(invoice.netPayable !== undefined ? { netPayable: retained.gross / 100 } : {}),
      ...(invoice.finalPayableAmount !== undefined ? { finalPayableAmount: retained.gross / 100 } : {}),
      subtotal: retained.taxable / 100,
      taxableAmount: retained.taxable / 100,
      cgstTotal: retained.cgst / 100,
      sgstTotal: retained.sgst / 100,
      paidAmount: paid / 100,
      balanceDue: due / 100,
      status: due === 0 ? 'COMPLETED' : paid > 0 ? 'PARTIALLY_PAID' : 'PENDING'
    },
    removedItems,
    cancelledAmount: (original.gross - retained.gross) / 100,
    collected: originalPaid / 100,
    refund: (originalPaid - paid) / 100
  } };
}

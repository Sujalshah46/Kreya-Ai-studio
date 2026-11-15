import type { PaymentTransaction, SalesInvoice } from '../types';

export function invoiceReceipts(invoice: SalesInvoice): PaymentTransaction[] {
  return invoice.paymentTransactions?.length ? invoice.paymentTransactions : invoice.payments ?? [];
}

export function applyInvoiceReceipt(invoice: SalesInvoice, payment: PaymentTransaction): SalesInvoice | undefined {
  const amount = Math.round(payment.amount * 100);
  const due = Math.round(invoice.balanceDue * 100);
  const paid = Math.round(invoice.paidAmount * 100);
  const receipts = invoiceReceipts(invoice);
  if (invoice.status === 'CANCELLED' || invoice.status === 'ESTIMATE' ||
      !Number.isSafeInteger(amount) || !Number.isSafeInteger(due) ||
      !Number.isSafeInteger(paid + amount) || amount <= 0 || amount > due ||
      Math.abs(amount / 100 - payment.amount) > 1e-9 ||
      receipts.some(receipt => receipt.id === payment.id)) return undefined;

  const nextReceipts = [...receipts, payment];
  return {
    ...invoice,
    paidAmount: (paid + amount) / 100,
    balanceDue: (due - amount) / 100,
    paymentTransactions: nextReceipts,
    payments: nextReceipts,
    status: due === amount ? 'COMPLETED' : 'PARTIALLY_PAID'
  };
}

// Core Jewellery ERP Domain Types

export type MetalGroup = 'GOLD' | 'SILVER' | 'DIAMOND' | 'PLATINUM';
export type MakingChargeMode = 'PERCENTAGE_OF_GOLD' | 'PER_NET_GRAM' | 'PER_GROSS_GRAM' | 'FIXED_PIECE' | 'FIXED_PER_PIECE' | 'PERCENTAGE_OF_TOTAL' | 'PERCENTAGE';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'NET_BANKING' | 'OLD_GOLD_EXCHANGE' | 'BANK_TRANSFER' | 'CHEQUE' | 'IMPS' | 'IMPS_TRANSFER' | 'CUSTOMER_CREDIT' | 'ADVANCE_ALLOCATION' | 'OTHER';
export type OrderStatus = 'ESTIMATE' | 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'PARTIALLY_PAID';
export type RepairStatus = 
  | 'received' | 'assigned_karigar' | 'in_progress' | 'qc_passed' | 'ready' | 'delivered' | 'cancelled'
  | 'RECEIVED' | 'ESTIMATED' | 'IN_WORKSHOP' | 'QC_READY' | 'DELIVERED';
export type LoanStatus = 'ACTIVE' | 'REDEEMED' | 'AUCTIONED' | 'CLOSED' | 'OVERDUE' | string;
export type SchemeStatus = 'ACTIVE' | 'MATURED' | 'CLOSED' | 'DEFAULTED' | 'REDEEMED' | 'COMPLETED';

export interface StoreProfile {
  id: string;
  code?: string;
  tradeName: string;
  legalName: string;
  name?: string;
  shopName?: string;
  ownerName?: string;
  gstin: string;
  gstNo?: string;
  pan?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  phone?: string;
  email?: string;
  mobile?: string;
  invoicePrefix?: string;
  upiId?: string;
  printerType?: string;
  huidRegistered?: boolean;
  bisLicenseNo?: string;
  invoiceTerms?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
  };
}

export interface Counter {
  id: string;
  code: string;
  name: string;
  currentOperatorId?: string;
  activeRegisterId?: string;
  isOpen?: boolean;
  subtitle?: string;
  badge?: string;
}

export interface DailyRates {
  date: string;
  gold24kPerGram?: number; // Pure 999
  gold22kPerGram: number; // 916
  gold18kPerGram: number; // 750
  gold14kPerGram?: number;
  gold14kPer10g?: number;
  gold24kPer10g?: number;
  gold22kPer10g?: number;
  gold18kPer10g?: number;
  silverPerGram?: number;  // 999
  silverPer10g: number;
  silverPerKg?: number;
  platinumPerGram?: number;
  platinumPer10g?: number;
}

export interface StoneItem {
  id: string;
  group: 'Diamond' | 'Gemstone' | 'Cubic Zirconia' | 'Pearl';
  name: string;
  pieces: number;
  carats: number;
  grams?: number;
  clarityCut?: string;
  ratePerCarat: number;
  totalValue?: number;
  value?: number;
  totalPrice?: number;
  certificateNo?: string;
  deductWeight?: boolean;
  weightGrams?: number;
}

export interface InventoryItem {
  id: string;
  itemCode: string;
  barcode: string;
  huid: string; // 6-digit alphanumeric
  itemName: string;
  name?: string;
  title?: string;
  purity?: string;
  totalPrice?: number;
  category: string;
  subCategory?: string;
  metalType?: string;
  metalGroup: MetalGroup;
  purityKarat: string;
  purityPercent: number;
  grossWeight: number; // in grams
  stoneWeight: number; // in grams
  netWeight: number;   // in grams
  wastagePercent: number;
  makingMode: MakingChargeMode;
  makingRate: number;
  makingType?: 'per_gram' | 'per_piece' | 'percent_of_metal';
  costPrice: number;
  retailPrice: number;
  wholesalePrice: number;
  mrp?: number;
  hsn?: string;
  quantity?: number;
  minStock?: number;
  itemSize?: string;
  designNo?: string;
  gender?: string;
  retailMarginPct?: number;
  wholesaleMarginPct?: number;
  stockQty: number;
  location: string;
  rackTray?: string;
  stones: StoneItem[];
  status: 'IN_STOCK' | 'SOLD' | 'IN_REPAIR' | 'PLEDGED';
  imageUrl?: string;
  images?: string[];
  description?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  fullName?: string;
  mobile: string;
  phone?: string;
  phone2?: string;
  email?: string;
  address: string;
  street1?: string;
  street2?: string;
  city?: string;
  pincode?: string;
  state: string;
  stateCode: string;
  pan?: string;
  panNo?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  customerType?: string;
  outstandingBalance?: number;
  balanceDue?: number;
  closingBalance?: number;
  balance?: number;
  loyaltyPoints?: number;
  openLoansCount?: number;
  openRepairsCount?: number;
  openBookingsCount?: number;
  kycVerified?: boolean;
  isForm60OnFile?: boolean;
  form60?: boolean;
  aadhaarMasked?: string;
  gstin?: string; // For B2B
  gstNo?: string;
  dob?: string;
  anniversary?: string;
  guarantorName?: string;
  guarantorMobile?: string;
  fatherName?: string;
  fatherMobile?: string;
  motherName?: string;
  motherMobile?: string;
  brotherName?: string;
  brotherMobile?: string;
  sonName?: string;
  sonMobile?: string;
  daughterName?: string;
  daughterMobile?: string;
  creditLimit?: number;
  openingBalance?: number;
  totalPurchased?: number;
  notes?: string;
}

export interface BillingLineItem {
  id: string;
  itemId?: string;
  itemCode: string;
  itemName: string;
  huid: string;
  category: string;
  purityKarat: string;
  purity?: string;
  metalType?: string;
  hsnCode: string; // "7113"
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  wastagePct?: number;
  wastageAmount?: number;
  hmCharge?: number;
  hmWaived?: boolean;
  metalRatePerGram: number;
  metalRate?: number;
  metalValue: number;
  makingMode: MakingChargeMode;
  makingRate: number;
  makingAmount: number;
  makingCharges?: number;
  stoneValue: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  lineTotal: number;
}

export interface OldMetalExchange {
  id: string;
  metalType: 'GOLD' | 'SILVER';
  description: string;
  grossWeight: number;
  stoneDeduction: number;
  meltingLossPercent: number;
  touchPurityPercent: number;
  netFineWeight: number;
  buyingRatePerGram: number;
  exchangeCreditValue: number;
}

export interface PaymentTransaction {
  id: string;
  receiptNo?: string; // "PAY-2026-XXXXX"
  date?: string;
  timestamp?: string;
  amount: number;
  mode: PaymentMode;
  referenceNo?: string;
  collectorName?: string;
  notes?: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNo?: string; // "INV-2026-00276"
  invoiceNumber?: string;
  date?: string;
  invoiceDate?: string;
  invoiceTime?: string;
  customer: Customer;
  counterId?: string;
  counterCode?: string;
  salesperson?: string;
  isB2B?: boolean;
  placeOfSupply?: string;
  paymentMode?: PaymentMode | string;
  items: BillingLineItem[];
  oldMetalExchanges?: OldMetalExchange[];
  taxableAmount?: number;
  cgstTotal?: number;
  sgstTotal?: number;
  productTotalValue: number;
  totalAmount?: number;
  subtotal?: number;
  grandTotal?: number;
  oldMetalExchangeCredit?: number;
  metalAdvanceAdjusted?: number;
  roundOff?: number;
  netPayable?: number;
  finalPayableAmount?: number;
  paidAmount: number;
  balanceDue: number;
  status: OrderStatus;
  deliveryStatus?: 'DELIVERED' | 'PENDING_COLLECTION';
  payments?: PaymentTransaction[];
  paymentTransactions?: PaymentTransaction[];
  notes?: string;
}

export interface PledgedItem {
  id: string;
  itemName: string;
  description?: string;
  metal: MetalGroup;
  purityKarat: string;
  touchPurity?: number | string;
  grossWeight: number;
  netWeight: number;
  marketValuation: number;
  tagNo: string;
  packetNo?: string;
  lockerLocation: string; // e.g. "Vault B-4"
  quantity?: number;
  isReturned: boolean;
  returnedAt?: string;
}

export interface GirviLoan {
  id: string;
  loanNo: string; // "LOAN-2026-00032"
  packetNo?: string;
  loanType?: string;
  customer: Customer;
  customerName?: string;
  startDate?: string;
  loanDate: string;
  dueDate?: string;
  tenureMonths?: number;
  rateBasis?: 'monthly' | 'yearly' | string;
  principalAmount: number;
  principalDue: number;
  totalInterest?: number;
  interestPaid?: number;
  interestDue?: number;
  monthlyRatePercent: number; // 2.0%
  interestRatePercent?: number;
  interestRateMonthly?: number;
  dailyRatePercent: number; // 0.065753%
  disbursementMode: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI' | string;
  disbursementRef?: string;
  pledgedNetWeightGrams?: number;
  guarantorName?: string;
  guarantorMobile?: string;
  guarantorAddress?: string;
  lockerLocation?: string;
  notes?: string;
  pledgedItems: PledgedItem[];
  status: LoanStatus;
  repayments: {
    id?: string;
    receiptNo?: string;
    date: string;
    principalPaid: number;
    interestPaid: number;
    interestWaived?: number;
    totalCashReceived?: number;
    paymentMode?: PaymentMode;
    counterId?: string;
    mode?: PaymentMode;
    notes?: string;
  }[];
}

export interface RepairItem {
  id: string;
  description: string;
  issueType: string;
  metal: MetalGroup;
  itemType: string;
  grossWeightTaken: number;
  quantity: number;
  estimatedCost: number;
  conditionNotes?: string;
  accessories?: string;
  specialNotes?: string;
  itemStatus?: 'pending' | 'delivered' | 'cancelled';
  deliveryDate?: string;
}

export interface RepairOrder {
  id: string;
  repairNo: string; // "REP-2026-00053"
  receiptNo: string; // "RR-2026-0010"
  serviceInvoiceNo?: string; // "RS/26-27/0010"
  customer: Customer;
  receivedDate: string;
  promiseDate: string;
  technicianName: string;
  status: RepairStatus;
  items: RepairItem[];
  totalCost: number;
  advancePaid: number;
  balanceDue: number;
  hsnSacCode: '998722';
  payments: PaymentTransaction[];
  notes?: string;
}

export interface SavingScheme {
  id: string;
  schemeNo: string; // "SCH-2026-00013"
  customer: Customer;
  schemeName: string; // "Swarna 11+1"
  monthlyInstallment: number;
  totalMonths: number;
  bonusMonths: number;
  bonusInstalments?: number;
  bonusAmount?: number;
  totalPaid: number;
  totalAmountPaid?: number;
  installmentsPaid?: number;
  atMaturityValue: number;
  startDate?: string;
  endDate?: string;
  nextDueDate: string;
  status: SchemeStatus;
  notes?: string;
  redeemedAt?: string;
  redeemedValue?: number;
  closeReason?: string;
  installments: {
    monthIndex: number;
    date: string;
    amount: number;
    mode: PaymentMode;
    receiptNo: string;
    referenceNo?: string;
    voided?: boolean;
  }[];
}

export interface DenominationCount {
  n2000: number;
  n500: number;
  n200: number;
  n100: number;
  n50: number;
  n20: number;
  n10: number;
  coins: number;
}

export interface CashRegisterSession {
  id: string;
  counterCode: string;
  registerCode: string; // "REG-2026-00021"
  registerDate: string;
  openedBy: string;
  openedAt: string;
  openingBalance: number;
  cashInflows: number;
  cashOutflows: number;
  expectedCash: number;
  closingBalanceCalculated?: number;
  nonCashNet: number;
  isOpen: boolean;
  status?: string;
  closedBy?: string;
  closedAt?: string;
  denominations?: DenominationCount;
  countedCashTotal?: number;
  actualCashCounted?: number;
  discrepancy?: number;
  cashDiscrepancy?: number;
  closingNotes?: string;
}

export interface MetalBooking {
  id: string;
  bookingNo: string; // "MB-2026-00008"
  bookingDate?: string;
  occasion?: string;
  advanceReceipts?: PaymentTransaction[];
  customer?: Customer;
  customerName?: string;
  customerPhone?: string;
  metalType: 'GOLD' | 'SILVER' | 'GOLD_22K' | 'GOLD_24K' | 'GOLD_18K' | string;
  bookedWeightGrams?: number;
  lockedGrams?: number;
  lockedGoldGrams?: number;
  lockedSilverGrams?: number;
  lockedRatePerGram?: number;
  bookedRatePerGram?: number;
  totalContractValue?: number;
  advanceCashPaid?: number;
  advancePaid?: number;
  advanceAmountPaid?: number;
  balanceAmountDue?: number;
  balanceDue?: number;
  deliveryDate?: string;
  deliveryDueDate?: string;
  promisedDeliveryDate?: string;
  paymentMode?: PaymentMode | string;
  status: 'ACTIVE' | 'CONVERTED_TO_SALE' | 'CANCELLED' | 'OPEN' | 'COMPLETED' | string;
  notes?: string;
}

export interface CancellationRecord {
  id: string;
  cancellationNo: string; // "CAN-2026-00004"
  date?: string;
  cancelledAt?: string;
  entityType?: 'ORDER' | 'BOOKING' | 'REPAIR' | string;
  referenceType?: 'order' | 'partial_order';
  originalReferenceNo?: string;
  originalInvoiceNo?: string;
  customerName: string;
  customerPhone?: string;
  customerMobile?: string;
  originalAmount?: number;
  paidAmount?: number;
  deductionAmount?: number;
  cancellationFeeDeducted?: number;
  netRefundAmount?: number;
  refundAmount?: number;
  refundMode?: PaymentMode | string;
  creditMemoNo?: string;
  itemsSummary?: string;
  status?: string;
  reason?: string;
  approvedBy?: string;
  operator?: string;
}

export interface CreditMemoRecord {
  id: string;
  creditMemoNo: string;
  cancellationId?: string;
  orderNo: string;
  customerName: string;
  customerPhone?: string;
  originalAmount: number;
  deductionAmount: number;
  refundAmount: number;
  refundMode: string;
  refundStatus: 'pending' | 'issued';
  refundDate?: string;
  refundReference?: string;
  notes?: string;
}

export interface ShipmentRecord {
  id: string;
  shipmentNo: string; // "SHIP-2026-00012"
  invoiceNo: string;
  customerName: string;
  customerMobile?: string;
  shippingAddress?: string;
  deliveryAddress?: string;
  pincode?: string;
  courierPartner: 'BVC Logistics' | 'Sequel Secure' | 'BlueDart Apex' | 'SpeedPost' | 'Showroom Counter Pick-up' | 'BVC Secure Logistics' | string;
  trackingAirwayBill?: string;
  trackingNumber?: string;
  insuredValue?: number;
  insuranceDeclaredValue?: number;
  dispatchDate: string;
  estimatedDelivery?: string;
  deliveryStatus?: 'MANIFESTED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | string;
  status?: 'MANIFESTED' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | string;
  deliveredAt?: string;
}

export interface OldGoldPurchaseItem {
  id: string;
  description: string;
  metalType: 'GOLD' | 'SILVER' | 'PLATINUM' | string;
  purity: string;
  pieces: number;
  grossWeight: number;
  stoneDeduction: number;
  otherDeduction: number;
  netWeight: number;
  touchPurity: number;
  netFineWeight: number;
  ratePerGram: number;
  ratePer10g: number;
  value: number;
  notes?: string;
}

export interface OldGoldPurchase {
  id: string;
  purchaseVoucherNo?: string; // "OGP-2026-00055"
  purchaseNo?: string;
  voucherNo?: string;
  date?: string;
  purchaseDate?: string;
  customer?: Customer;
  customerName?: string;
  customerMobile?: string;
  customerAddress?: string;
  customerPan?: string;
  metalType?: 'GOLD' | 'SILVER' | string;
  description?: string;
  itemDescription?: string;
  grossWeight: number;
  stoneDeduction?: number;
  meltingLossGrams?: number;
  meltingLossPercent?: number;
  purityTouchPercent?: number;
  touchPurityPercent?: number;
  purityTouch?: number;
  netWeight?: number;
  netFineGoldWeight?: number;
  netFineWeight?: number;
  buyingRatePerGram?: number;
  rateAppliedPer10g?: number;
  ratePer10g?: number;
  totalValuation?: number;
  totalPurchaseValue?: number;
  totalCashPaidOut?: number;
  totalCashPayout?: number;
  totalAmount?: number;
  payoutMode: 'CASH' | 'IMPS_TRANSFER' | 'CHEQUE' | 'BANK_TRANSFER' | 'ADJUSTED_INVOICE' | PaymentMode | string;
  paymentRef?: string;
  panVerified?: boolean;
  operator?: string;
  status?: string;
  items?: OldGoldPurchaseItem[];
  adjustedInvoiceNo?: string;
  adjustedAmount?: number;
  excessOwed?: number;
}

export interface CashOutflowRecord {
  id: string;
  voucherNo: string; // "EXP-2026-00042"
  date: string;
  amount: number;
  category: string;
  paidTo: string;
  paymentMode: PaymentMode;
  approvedBy?: string;
  authorizedBy?: string;
  counterCode?: string;
  notes?: string;
  voided?: boolean;
  voidReason?: string;
  sourceRef?: string;
  referenceNo?: string;
}

export interface OldMetalStockItem {
  id: string;
  batchCode?: string;
  batchNo?: string;
  metal?: 'GOLD' | 'SILVER' | string;
  metalType?: 'GOLD' | 'SILVER' | string;
  category?: string;
  source?: string;
  sourcePurchaseVoucher?: string;
  dateReceived?: string;
  receivedDate?: string;
  grossWeight: number;
  estimatedFineWeight?: number;
  fineWeightCalculated?: number;
  netFineWeight?: number;
  testedPurity?: string;
  estimatedPurity?: string | number;
  purity?: string;
  vaultLocation?: string;
  currentLocation?: 'SHOWROOM_SAFE' | 'MELTING_WORKSHOP' | 'SENT_TO_REFINERY' | string;
  currentStage?: string;
  assignedRefinery?: string;
  refineryJobWorkNo?: string;
  status?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  code?: string;
  supplierCode?: string;
  name?: string;
  tradeName: string;
  contactPerson: string;
  mobile: string;
  phone?: string;
  email?: string;
  city: string;
  state: string;
  gstin: string;
  category: 'Bullion Dealer' | 'Chain Manufacturer' | 'Diamond Wholesale' | 'Findings / Consumables' | 'Karigar Workshop' | string;
  status?: string;
  currentBalanceDue: number;
}

export interface PurchaseOrderLine {
  id?: string;
  lineNo?: number;
  supplierItemId?: string;
  description: string;
  metalType: string;
  purity: string;
  category?: string;
  hsn?: string;
  qty: number;
  grossWeight: number;
  netWeight: number;
  stoneWeight?: number;
  rateBasis: 'per_gram' | 'per_ct' | 'fixed' | string;
  rate: number;
  discount?: number;
  gstPct: number;
  taxable?: number;
  gstAmount?: number;
  lineTotal?: number;
  receivedQty?: number;
  rejectedQty?: number;
  pendingQty?: number;
  stones?: Array<{
    type: string;
    stoneWeight: number;
    cut?: string;
    clarity?: string;
    rate?: number;
    amount?: number;
  }>;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // "PO-2026-00019"
  supplier: Supplier;
  orderDate: string;
  expectedDeliveryDate: string;
  metalType: 'GOLD' | 'SILVER' | 'DIAMOND' | string;
  orderedWeightGrams: number;
  agreedRatePerGram: number;
  estimatedTotal: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'SENT' | 'ISSUED' | 'PARTIALLY_RECEIVED' | 'FULFILLED' | 'RECEIVED' | 'CLOSED' | 'CANCELLED' | string;
  lines?: PurchaseOrderLine[];
  subtotal?: number;
  discount?: number;
  taxable?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  otherCharges?: number;
  terms?: string;
  notes?: string;
  deliveryLocation?: string;
  courier?: string;
  trackingNo?: string;
  approvedBy?: string;
  approvedAt?: string;
  cancelReason?: string;
  receivedQty?: number;
  orderedQty?: number;
  grnCount?: number;
  billedAmount?: number;
}

export interface GoodsReceiptLine {
  id?: string;
  poLineId?: string;
  description: string;
  metalType: string;
  purity: string;
  category?: string;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty?: number;
  rejectReason?: string;
  grossWeight: number;
  netWeight: number;
  stoneWeight?: number;
  expectedNetWeight?: number;
  toleranceOk?: boolean;
  stockMode: 'tag_per_piece' | 'single_code' | 'add_existing' | string;
  itemId?: string;
  itemCode?: string;
  generatedTags?: string[];
  costPerPiece?: number;
  retailMarginPct?: number;
  wholesaleMarginPct?: number;
  retailRate?: number;
  wholesaleRate?: number;
  mrp?: number;
  rate?: number;
  rateBasis?: string;
  billedQty?: number;
  assayPurity?: string;
  scaleReading?: number;
}

export interface GoodsReceipt {
  id: string;
  grnNumber: string; // "GRN-2026-00024"
  poNumber: string;
  poId?: string;
  supplierName: string;
  supplierId?: string;
  receiptDate: string;
  challanNo?: string;
  receivedPieces: number;
  receivedGrossWeight: number;
  receivedNetWeight: number;
  hallmarkedPurity: string;
  inspectedBy: string;
  status: 'ACCEPTED' | 'REJECTED' | 'POSTED' | 'REVERSED' | string;
  notes?: string;
  lines?: GoodsReceiptLine[];
  overrideReason?: string;
  reverseReason?: string;
  billedPieces?: number;
  stockValue?: number;
  generatedBarcodes?: Array<{
    pieceNo: number;
    barcode: string;
    itemCode: string;
    huid: string;
    purity: string;
    netWeight: number;
    spoolStatus: string;
  }>;
}

export interface SupplierBillLine {
  id?: string;
  grnLineId?: string;
  grnNumber?: string;
  description: string;
  hsn?: string;
  qty: number;
  netWeight: number;
  stoneWeight?: number;
  rateBasis: string;
  rate: number;
  poRate?: number;
  expectedAmount?: number;
  discount?: number;
  taxable: number;
  gstPct: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  gstAmount: number;
  lineTotal: number;
  variance?: number;
  varianceFlag?: string;
}

export interface SupplierBill {
  id: string;
  billNumber: string; // "BILL-SUP-891"
  supplier?: Supplier;
  supplierId?: string;
  supplierName?: string;
  supplierInvoiceNo?: string;
  supplierInvoiceDate?: string;
  billDate: string;
  dueDate: string;
  taxMode?: 'intra' | 'inter';
  taxableAmount: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstAmount?: number;
  otherCharges?: number;
  roundOff?: number;
  printedTotal?: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  balanceAmount?: number;
  itcEligible: boolean | string;
  tdsApplicable?: boolean;
  tdsSection?: '194Q' | '206C(1H)';
  tdsRatePct?: number; // 0.1%
  tdsAmount?: number;
  netPayableAmount?: number;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | string;
  payStatus?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | string;
  lines?: SupplierBillLine[];
  poNumbers?: string[];
  grnNumbers?: string[];
  documents?: Array<{ name: string; url?: string; size?: number; type?: string }>;
  notes?: string;
  duplicateOverride?: string;
  cancelReason?: string;
}

export interface SupplierPaymentAllocation {
  billId: string;
  billNumber: string;
  amount: number;
}

export interface SupplierPayment {
  id: string;
  paymentNumber: string; // "SPAY-2026-00055"
  billNumber: string;
  billId?: string;
  supplier?: Supplier;
  supplierId?: string;
  supplierName: string;
  date: string;
  amount: number; // total settled
  moneyAmount?: number;
  mode: PaymentMode | string;
  referenceNo: string; // UTR or Cheque no
  utr?: string;
  operator: string;
  status?: 'ACTIVE' | 'VOIDED' | string;
  voidReason?: string;
  notes?: string;
  unallocated?: number; // advance amount
  openingApplied?: number;
  metalAdjustment?: {
    metal: 'gold' | 'silver';
    purity: string;
    fineQty: number; // in grams
    ratePer10g: number;
    metalAmount: number;
  };
  allocations?: SupplierPaymentAllocation[];
}

export interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'AUDITOR';
  assignedCounter: string;
  pinCode: string;
  isActive: boolean;
  lastLogin: string;
}


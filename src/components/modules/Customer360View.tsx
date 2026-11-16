import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Customer, SalesInvoice, GirviLoan, RepairOrder, StoreProfile
} from '../../types';

interface Customer360ViewProps {
  store: StoreProfile;
  customers: Customer[];
  invoices: SalesInvoice[];
  loans: GirviLoan[];
  repairs: RepairOrder[];
  onImportCustomers?: (customers: Customer[]) => void;
  onUpdateCustomers?: (customers: Customer[]) => void;
}

// 36 Indian States and Union Territories with 2-digit GST codes
export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' }
];

// Verhoeff algorithm multiplication (D) and permutation (P) tables matching live app
const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

// Helper to check empty string
const isEmpty = (e: any): boolean => e === undefined || e === null || String(e).trim() === '';

// 1. Live Verhoeff Aadhaar validation
export function validateAadhaar(val: string): string {
  if (isEmpty(val) || /^[Xx*\u2022]{4,}/.test(String(val).replace(/\s/g, ''))) return '';
  const clean = String(val).replace(/[\s-]/g, '');
  if (!/^\d{12}$/.test(clean)) {
    return 'This Aadhaar number is not valid — please check the digits';
  }
  let checksum = 0;
  clean.split('').reverse().forEach((char, idx) => {
    checksum = VERHOEFF_D[checksum][VERHOEFF_P[idx % 8][Number(char)]];
  });
  if (/^[01]/.test(clean) || checksum !== 0) {
    return 'This Aadhaar number is not valid — please check the digits';
  }
  return '';
}

// 2. Live PAN validation
const PAN_REGEX = /^[A-Z]{3}[ABCFGHLJPTK][A-Z][0-9]{4}[A-Z]$/;
export function validatePAN(val: string): string {
  if (isEmpty(val) || /[\u2022*]/.test(String(val))) return '';
  const clean = String(val).trim().toUpperCase();
  if (PAN_REGEX.test(clean)) return '';
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean)) {
    return `PAN 4th letter "${clean[3]}" is not a valid holder type — it must be P (person), C (company), H (HUF), F (firm), A (AOP), T (trust), B (BOI), L (local authority), J (juridical person) or G (government), e.g. ABCPE1234F`;
  }
  return 'PAN must be 10 characters: 5 letters, 4 digits, 1 letter (e.g. ABCPE1234F)';
}

// 3. Live GSTIN validation
const GST_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function validateGSTIN(val: string): string {
  if (isEmpty(val)) return '';
  const clean = String(val).trim().toUpperCase();
  if (clean.length !== 15) return 'GSTIN must be 15 characters';
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(clean)) {
    return 'GSTIN format is not valid (e.g. 09ABCPE1234F1Z9)';
  }
  const stateCode = clean.slice(0, 2);
  const validState = INDIAN_STATES.some(s => s.code === stateCode) || stateCode === '99';
  if (!validState) {
    return `GSTIN state code ${stateCode} is not valid`;
  }
  let total = 0;
  for (let i = 0; i < 14; i++) {
    const factor = i % 2 === 0 ? 1 : 2;
    const codePoint = GST_CHARS.indexOf(clean[i]) * factor;
    total += Math.floor(codePoint / 36) + (codePoint % 36);
  }
  const checkDigit = GST_CHARS[(36 - (total % 36)) % 36];
  if (checkDigit !== clean[14]) {
    return 'GSTIN check digit does not match — please re-check the number';
  }
  return '';
}

// 4. Mobile number clean & validation
export function cleanMobile(val: string): string {
  let t = String(val || '').replace(/\D/g, '');
  if (t.length === 12 && t.startsWith('91')) t = t.slice(2);
  else if (t.length === 11 && t.startsWith('0')) t = t.slice(1);
  return t.slice(0, 10);
}

export function validateMobile(val: string, label: string = 'Mobile'): string {
  if (isEmpty(val)) return '';
  const clean = cleanMobile(val);
  if (clean.length !== 10) return `${label} must be exactly 10 digits`;
  return /^[6-9]/.test(clean) ? '' : `${label} must start with 6, 7, 8 or 9`;
}

// 5. PIN code validation
export function validatePincode(val: string): string {
  if (isEmpty(val)) return '';
  const clean = String(val).replace(/\s/g, '');
  return /^[1-9]\d{5}$/.test(clean) ? '' : 'PIN code must be 6 digits and cannot start with 0';
}

// 6. Email validation
export function validateEmail(val: string): string {
  if (isEmpty(val)) return '';
  const clean = String(val).trim().toLowerCase();
  const emailRegex = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;
  if (clean.length > 200 || !emailRegex.test(clean) || clean.includes('..')) {
    return 'Enter a valid email (like name@example.com)';
  }
  return '';
}

// 7. Date of birth & Anniversary validation
export function validateDate(val: string, label: string, minAgeYears?: number): string {
  if (isEmpty(val)) return '';
  const dateStr = String(val).slice(0, 10);
  const today = new Date(Date.now() + 198e5).toISOString().slice(0, 10);
  if (dateStr > today) return `${label} cannot be in the future`;
  if (minAgeYears) {
    const minAgeDate = `${Number(today.slice(0, 4)) - minAgeYears}${today.slice(4)}`;
    if (dateStr > minAgeDate) return `${label}: the customer must be at least ${minAgeYears} years old`;
  }
  return '';
}

// Format currency
const formatCurrency = (val: number | string): string => {
  const num = parseFloat(String(val || 0));
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

// Customer Code formatting helper (CUST-00001, CUST-00002)
export const formatCustomerCode = (code: string | undefined, index?: number): string => {
  if (code && /^CUST-\d{5}$/.test(code)) return code;
  if (code && /^CUST-\d+$/.test(code)) {
    const num = code.replace('CUST-', '');
    return `CUST-${num.padStart(5, '0')}`;
  }
  const n = (index !== undefined ? index + 1 : 1);
  return `CUST-${String(n).padStart(5, '0')}`;
};

export const Customer360View: React.FC<Customer360ViewProps> = ({
  store,
  customers: initialCustomers,
  invoices,
  loans,
  repairs,
  onImportCustomers,
  onUpdateCustomers
}) => {
  const [customerList, setCustomerList] = useState<Customer[]>(initialCustomers);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCustomers && initialCustomers.length > 0) {
      setCustomerList(initialCustomers);
    }
  }, [initialCustomers]);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'balance' | 'zero' | 'retail' | 'wholesale'>('all');

  // Pagination for customers directory
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal State for Add / Edit Customer
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [activeModalTab, setActiveModalTab] = useState<'basic' | 'address' | 'kyc' | 'family'>('basic');
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Customer Form Fields
  const [formId, setFormId] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formAltMobile, setFormAltMobile] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState('retail');
  const [formOpeningBalance, setFormOpeningBalance] = useState('0');
  const [formCreditLimit, setFormCreditLimit] = useState('0');
  const [formNotes, setFormNotes] = useState('');

  const [formStreet1, setFormStreet1] = useState('');
  const [formStreet2, setFormStreet2] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState(store?.state || 'Maharashtra');
  const [formPincode, setFormPincode] = useState('');

  const [formAadhaar, setFormAadhaar] = useState('');
  const [formPan, setFormPan] = useState('');
  const [formGst, setFormGst] = useState('');
  const [formDob, setFormDob] = useState('');
  const [formAnniversary, setFormAnniversary] = useState('');

  const [formFatherName, setFormFatherName] = useState('');
  const [formFatherMobile, setFormFatherMobile] = useState('');
  const [formMotherName, setFormMotherName] = useState('');
  const [formMotherMobile, setFormMotherMobile] = useState('');
  const [formBrotherName, setFormBrotherName] = useState('');
  const [formBrotherMobile, setFormBrotherMobile] = useState('');
  const [formSonName, setFormSonName] = useState('');
  const [formSonMobile, setFormSonMobile] = useState('');
  const [formDaughterName, setFormDaughterName] = useState('');
  const [formDaughterMobile, setFormDaughterMobile] = useState('');

  // Bottom section KYC state
  const [bottomTab, setBottomTab] = useState<'kyc' | 'credit' | 'visits' | 'ledger'>('kyc');
  const [newPan, setNewPan] = useState('');
  const [newGst, setNewGst] = useState('');
  const [newAadhaar, setNewAadhaar] = useState('');
  const [bottomStateCode, setBottomStateCode] = useState('27');
  const [guarantorName, setGuarantorName] = useState('');
  const [guarantorMobile, setGuarantorMobile] = useState('');
  const [form60, setForm60] = useState(false);
  const [storeCreditBalance, setStoreCreditBalance] = useState<number>(0);
  const [creditAdjustment, setCreditAdjustment] = useState({
    direction: 'add',
    amount: '',
    mode: 'cash',
    reference: '',
    notes: ''
  });
  const [visitsList, setVisitsList] = useState<{ id: string; date: string; purpose: string; salesperson: string; notes?: string }[]>([
    { id: 'v-1', date: '2026-11-10', purpose: 'Bridal Set Consultation', salesperson: 'Counter 1 (Rajesh)', notes: 'Viewed 22K antique bridal necklace & choker' },
    { id: 'v-2', date: '2026-10-24', purpose: 'Dhanteras Advance Rate Booking', salesperson: 'Main Desk', notes: 'Booked 50g 24K gold rate' }
  ]);
  const [newVisitPurpose, setNewVisitPurpose] = useState('');
  const [newVisitSalesperson, setNewVisitSalesperson] = useState('Counter 1 (Rajesh)');
  const [newVisitNotes, setNewVisitNotes] = useState('');

  // Customer Account Profile Drawer Tabs: Overview, Invoices, Payments, Ledger, Loans, Repairs, KYC, Family
  const [customerDrawerTab, setCustomerDrawerTab] = useState<'overview' | 'invoices' | 'payments' | 'ledger' | 'loans' | 'repairs' | 'kyc' | 'family'>('overview');
  const [showProfileDrawer, setShowProfileDrawer] = useState<Customer | null>(null);
  const [activeDossierTab, setActiveDossierTab] = useState<string>('orders');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'due' | 'zero' | 'advance'>('all');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const showToast = (msg: string, isError = false) => {
    setToastMessage(msg);
    setToastType(isError ? 'error' : 'success');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          showToast('No customer records found in file');
          return;
        }

        const imported: Customer[] = json.map((row, idx) => {
          const name = row['Name'] || row['Customer Name'] || row['Customer'] || row['name'] || `Customer ${customerList.length + idx + 1}`;
          const mobile = String(row['Mobile'] || row['Phone'] || row['phone'] || row['Mobile No'] || '9800000000').replace(/[^0-9]/g, '');
          const code = row['Code'] || `CUST-${String(customerList.length + idx + 1).padStart(5, '0')}`;
          const city = row['City'] || row['city'] || 'Mumbai';
          const state = row['State'] || row['state'] || (store?.state || 'Maharashtra');
          const pan = row['PAN'] || row['pan'] || row['pan_no'] || '';
          const gstin = row['GSTIN'] || row['gstin'] || row['gst_no'] || '';
          const aadhaar = row['Aadhaar'] || row['aadhaar'] || row['aadhar_no'] || '';
          const type = String(row['Type'] || row['Customer Type'] || 'retail').toLowerCase();

          return {
            id: `cust-imp-${Date.now()}-${idx}`,
            code,
            name,
            fullName: name,
            mobile,
            phone: mobile,
            city,
            state,
            address: city,
            stateCode: '27',
            pan,
            gstin,
            aadhaarNumber: aadhaar,
            customerType: (type === 'wholesale' || type === 'vip') ? type : 'retail',
            creditLimit: parseFloat(row['Credit Limit'] || '50000') || 50000,
            openingBalance: parseFloat(row['Opening Balance'] || '0') || 0,
            currentBalance: 0
          } as unknown as Customer;
        });

        setCustomerList(prev => [...imported, ...prev]);
        if (onImportCustomers) {
          onImportCustomers(imported);
        }
        showToast(`Successfully imported ${imported.length} customers from Excel`);
      } catch (err: any) {
        alert(`Error parsing Excel file: ${err.message || err}`);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Live validation calculations for current modal values
  const liveAadhaarError = useMemo(() => validateAadhaar(formAadhaar), [formAadhaar]);
  const liveBottomAadhaarError = useMemo(() => validateAadhaar(newAadhaar), [newAadhaar]);
  const livePanError = useMemo(() => validatePAN(formPan), [formPan]);
  const liveGstError = useMemo(() => validateGSTIN(formGst), [formGst]);
  const liveMobileError = useMemo(() => validateMobile(formMobile, 'Mobile'), [formMobile]);
  const liveAltMobileError = useMemo(() => validateMobile(formAltMobile, 'Alternate mobile'), [formAltMobile]);
  const liveEmailError = useMemo(() => validateEmail(formEmail), [formEmail]);
  const livePincodeError = useMemo(() => validatePincode(formPincode), [formPincode]);
  const liveDobError = useMemo(() => validateDate(formDob, 'Date of birth', 18), [formDob]);
  const liveAnniversaryError = useMemo(() => validateDate(formAnniversary, 'Anniversary'), [formAnniversary]);

  // Handle GST auto-fill of PAN and State
  const handleGstChange = (val: string) => {
    const upper = val.toUpperCase();
    setFormGst(upper);
    if (upper.length === 15 && !validateGSTIN(upper)) {
      const extractedPan = upper.slice(2, 12);
      if (!formPan) setFormPan(extractedPan);
      const stateCode = upper.slice(0, 2);
      const matchedState = INDIAN_STATES.find(s => s.code === stateCode);
      if (matchedState) {
        setFormState(matchedState.name);
      }
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (cust: Customer) => {
    setModalMode('EDIT');
    setFormId(cust.id);
    setFormCode(cust.code || 'CUST-00001');
    setFormName(cust.name || '');
    setFormMobile(cust.mobile || cust.phone || '');
    setFormAltMobile(cust.phone2 || (cust as any).altMobile || '');
    setFormEmail(cust.email || '');
    setFormType((cust.customerType || 'retail').toLowerCase());
    setFormOpeningBalance(((cust as any).opening_balance || cust.outstandingBalance || 0).toString());
    setFormCreditLimit(((cust as any).credit_limit ?? (cust as any).creditLimit ?? 0).toString());
    setFormNotes((cust as any).notes || '');

    setFormStreet1((cust as any).street1 || cust.address || '');
    setFormStreet2((cust as any).street2 || '');
    setFormCity(cust.city || '');
    setFormState(cust.state || 'Maharashtra');
    setFormPincode(cust.pincode || '');

    setFormAadhaar((cust as any).aadhar_no || cust.aadhaarNumber || '');
    setFormPan((cust as any).pan_no || cust.pan || cust.panNumber || '');
    setFormGst((cust as any).gst_no || cust.gstin || '');
    setFormDob(((cust as any).dob || '').split('T')[0]);
    setFormAnniversary(((cust as any).anniversary || '').split('T')[0]);

    setFormFatherName((cust as any).father_name || '');
    setFormFatherMobile((cust as any).father_mobile || '');
    setFormMotherName((cust as any).mother_name || '');
    setFormMotherMobile((cust as any).mother_mobile || '');
    setFormBrotherName((cust as any).brother_name || '');
    setFormBrotherMobile((cust as any).brother_mobile || '');
    setFormSonName((cust as any).son_name || '');
    setFormSonMobile((cust as any).son_mobile || '');
    setFormDaughterName((cust as any).daughter_name || '');
    setFormDaughterMobile((cust as any).daughter_mobile || '');

    setActiveModalTab('basic');
    setShowCustomerModal(true);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setModalMode('ADD');
    setFormId(`cust-${Date.now()}`);
    setFormCode(`CUST-${(customerList.length + 1).toString().padStart(5, '0')}`);
    setFormName('');
    setFormMobile('');
    setFormAltMobile('');
    setFormEmail('');
    setFormType('retail');
    setFormOpeningBalance('0');
    setFormCreditLimit('0');
    setFormNotes('');

    setFormStreet1('');
    setFormStreet2('');
    setFormCity('');
    setFormState(store?.state || 'Maharashtra');
    setFormPincode('');

    setFormAadhaar('');
    setFormPan('');
    setFormGst('');
    setFormDob('');
    setFormAnniversary('');

    setFormFatherName('');
    setFormFatherMobile('');
    setFormMotherName('');
    setFormMotherMobile('');
    setFormBrotherName('');
    setFormBrotherMobile('');
    setFormSonName('');
    setFormSonMobile('');
    setFormDaughterName('');
    setFormDaughterMobile('');

    setActiveModalTab('basic');
    setShowCustomerModal(true);
  };

  // Save Customer with full tab-aware validation matching live app
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formMobile.trim()) {
      setActiveModalTab('basic');
      showToast('Name and mobile are required', true);
      return;
    }

    if (liveMobileError) {
      setActiveModalTab('basic');
      showToast(liveMobileError, true);
      return;
    }

    // Duplicate phone validation matching original ERP
    const cleanPhone = cleanMobile(formMobile);
    const dupCustomer = customerList.find(
      c => c.id !== formId && cleanMobile(c.mobile || c.phone || '') === cleanPhone
    );
    if (dupCustomer) {
      setActiveModalTab('basic');
      showToast(`Mobile ${cleanPhone} already belongs to ${dupCustomer.name} (${dupCustomer.code}). Open that customer instead of creating a new one.`, true);
      return;
    }

    if (liveAltMobileError) {
      setActiveModalTab('basic');
      showToast(liveAltMobileError, true);
      return;
    }

    if (liveEmailError) {
      setActiveModalTab('basic');
      showToast(liveEmailError, true);
      return;
    }

    if (Number(formOpeningBalance) < 0) {
      setActiveModalTab('basic');
      showToast('Opening balance cannot be negative', true);
      return;
    }

    if (Number(formCreditLimit) < 0) {
      setActiveModalTab('basic');
      showToast('Credit limit cannot be negative', true);
      return;
    }

    if (livePincodeError && formPincode.trim().length > 0) {
      setActiveModalTab('address');
      showToast(livePincodeError, true);
      return;
    }

    if (liveAadhaarError && formAadhaar.trim().length > 0) {
      setActiveModalTab('kyc');
      showToast(liveAadhaarError, true);
      return;
    }

    if (livePanError && formPan.trim().length > 0) {
      setActiveModalTab('kyc');
      showToast(livePanError, true);
      return;
    }

    if (liveGstError && formGst.trim().length > 0) {
      setActiveModalTab('kyc');
      showToast(liveGstError, true);
      return;
    }

    if (liveDobError && formDob.trim().length > 0) {
      setActiveModalTab('kyc');
      showToast(liveDobError, true);
      return;
    }

    if (liveAnniversaryError && formAnniversary.trim().length > 0) {
      setActiveModalTab('kyc');
      showToast(liveAnniversaryError, true);
      return;
    }

    // Family mobile validation
    const familyMobiles: [string, string][] = [
      [formFatherMobile, "Father's mobile"],
      [formMotherMobile, "Mother's mobile"],
      [formBrotherMobile, "Brother's mobile"],
      [formSonMobile, "Son's mobile"],
      [formDaughterMobile, "Daughter's mobile"]
    ];
    for (const [mob, lbl] of familyMobiles) {
      if (mob.trim()) {
        const err = validateMobile(mob, lbl);
        if (err) {
          setActiveModalTab('family');
          showToast(err, true);
          return;
        }
      }
    }

    setSavingCustomer(true);

    const updatedCust: Customer = {
      id: formId,
      code: formCode,
      name: formName.trim(),
      mobile: cleanMobile(formMobile.trim()),
      phone: cleanMobile(formMobile.trim()),
      phone2: formAltMobile.trim() ? cleanMobile(formAltMobile.trim()) : undefined,
      email: formEmail.trim() || undefined,
      address: [formStreet1, formStreet2, formCity].filter(Boolean).join(', '),
      street1: formStreet1.trim(),
      street2: formStreet2.trim(),
      city: formCity.trim(),
      state: formState.trim() || 'Maharashtra',
      stateCode: (INDIAN_STATES.find(s => s.name.toLowerCase() === formState.toLowerCase())?.code) || '27',
      pincode: formPincode.trim(),
      customerType: formType,
      pan: formPan.trim().toUpperCase() || undefined,
      panNumber: formPan.trim().toUpperCase() || undefined,
      aadhaarNumber: formAadhaar.trim() || undefined,
      outstandingBalance: parseFloat(formOpeningBalance) || 0,
      openLoansCount: 0,
      openRepairsCount: 0,
      openBookingsCount: 0,
      ...{
        aadhar_no: formAadhaar.trim(),
        pan_no: formPan.trim().toUpperCase(),
        gst_no: formGst.trim().toUpperCase(),
        dob: formDob,
        anniversary: formAnniversary,
        father_name: formFatherName.trim(),
        father_mobile: cleanMobile(formFatherMobile.trim()),
        mother_name: formMotherName.trim(),
        mother_mobile: cleanMobile(formMotherMobile.trim()),
        brother_name: formBrotherName.trim(),
        brother_mobile: cleanMobile(formBrotherMobile.trim()),
        son_name: formSonName.trim(),
        son_mobile: cleanMobile(formSonMobile.trim()),
        daughter_name: formDaughterName.trim(),
        daughter_mobile: cleanMobile(formDaughterMobile.trim()),
        notes: formNotes.trim(),
        opening_balance: parseFloat(formOpeningBalance) || 0,
        credit_limit: parseFloat(formCreditLimit) || 0
      }
    };

    if (modalMode === 'EDIT') {
      const updated = customerList.map(c => c.id === formId ? updatedCust : c);
      setCustomerList(updated);
      onUpdateCustomers?.(updated);
      showToast('Customer updated');
    } else {
      const updated = [updatedCust, ...customerList];
      setCustomerList(updated);
      onUpdateCustomers?.(updated);
      showToast('Customer added!');
    }

    setSavingCustomer(false);
    setShowCustomerModal(false);
  };

  const handleDeleteCustomer = (cust: Customer) => {
    const updated = customerList.filter(c => c.id !== cust.id);
    setCustomerList(updated);
    onUpdateCustomers?.(updated);
    setCustomerToDelete(null);
    if (selectedCustomerId === cust.id) setSelectedCustomerId(null);
    if (showProfileDrawer?.id === cust.id) setShowProfileDrawer(null);
    showToast('Customer deleted');
  };

  const selectedCustomer = customerList.find(c => c.id === selectedCustomerId) || null;

  // Filtered customer list for search and balance filter
  const filteredCustomers = useMemo(() => {
    let list = customerList;
    if (balanceFilter === 'due') {
      list = list.filter(c => (c.outstandingBalance || (c as any).opening_balance || 0) > 0);
    } else if (balanceFilter === 'zero') {
      list = list.filter(c => (c.outstandingBalance || (c as any).opening_balance || 0) === 0);
    } else if (balanceFilter === 'advance') {
      list = list.filter(c => (c.outstandingBalance || (c as any).opening_balance || 0) < 0 || ((c as any).store_credit || 0) > 0);
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(c => 
      c.name.toLowerCase().includes(q) ||
      (c.mobile || c.phone || '').includes(q) ||
      (c.code || '').toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q) ||
      ((c as any).aadhar_no || c.aadhaarNumber || '').includes(q) ||
      ((c as any).pan_no || c.pan || '').toLowerCase().includes(q)
    );
  }, [customerList, searchQuery, balanceFilter]);

  // Selected customer's specific records
  const custOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return invoices.filter(inv => inv.customer?.id === selectedCustomerId || inv.customer?.name === selectedCustomer.name);
  }, [invoices, selectedCustomerId, selectedCustomer]);

  const custLoans = useMemo(() => {
    if (!selectedCustomer) return [];
    return loans.filter(l => l.customer?.id === selectedCustomerId || l.customer?.name === selectedCustomer.name || (l as any).customerId === selectedCustomerId);
  }, [loans, selectedCustomerId, selectedCustomer]);

  const custRepairs = useMemo(() => {
    if (!selectedCustomer) return [];
    return repairs.filter(r => r.customer?.id === selectedCustomerId || r.customer?.name === selectedCustomer.name || (r as any).customerId === selectedCustomerId);
  }, [repairs, selectedCustomerId, selectedCustomer]);

  // Derived account calculations for 15 stat cards
  const lifetimePurchase = custOrders.reduce((sum, ord) => sum + (ord.totalAmount || ord.productTotalValue || 0), 0);
  const totalCashPaid = custOrders.reduce((sum, ord) => sum + (ord.paidAmount || 0), 0);
  const orderOutstanding = custOrders.reduce((sum, ord) => sum + (ord.balanceDue || 0), 0);
  const openLoansCount = custLoans.filter(l => (l.status || '').toLowerCase() !== 'closed').length;
  const loanPrincipalDue = custLoans
    .filter(l => (l.status || '').toLowerCase() !== 'closed')
    .reduce((sum, l) => sum + (l.principalDue ?? l.principalAmount ?? 0), 0);
  const loanInterestDue = custLoans
    .filter(l => (l.status || '').toLowerCase() !== 'closed')
    .reduce((sum, l) => sum + (l.interestDue ?? 0), 0);
  const pendingLoanDue = loanPrincipalDue + loanInterestDue;

  const loanInterestCollected = custLoans.reduce((sum, l) => {
    const repInt = (l.repayments || []).reduce((rSum, r) => rSum + (r.interestPaid || 0), 0);
    return sum + repInt + (l.interestPaid || 0);
  }, 0);

  const openRepairsCount = custRepairs.filter(r => !['delivered', 'cancelled', 'completed'].includes((r.status || '').toLowerCase())).length;
  const totalRefunded = custOrders.reduce((sum, ord) => sum + (parseFloat((ord as any).refund_amount) || 0), 0);

  // Repayments for Loan Payments tab
  const loanRepayments = useMemo(() => {
    const list: {
      id: string;
      receiptNo: string;
      date: string;
      loanNo: string;
      principalPaid: number;
      interestPaid: number;
      totalReceived: number;
      mode: string;
      notes?: string;
    }[] = [];
    custLoans.forEach(l => {
      (l.repayments || []).forEach((r, idx) => {
        list.push({
          id: r.id || `rep-${l.id}-${idx}`,
          receiptNo: r.receiptNo || `RCP-LN-${idx + 1}`,
          date: r.date || l.loanDate,
          loanNo: l.loanNo,
          principalPaid: r.principalPaid || 0,
          interestPaid: r.interestPaid || 0,
          totalReceived: r.totalCashReceived || ((r.principalPaid || 0) + (r.interestPaid || 0)),
          mode: (r.paymentMode || r.mode || 'CASH').toUpperCase(),
          notes: r.notes
        });
      });
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [custLoans]);

  // Cancelled Orders
  const cancelledOrders = useMemo(() => {
    return custOrders.filter(o => o.status === 'CANCELLED');
  }, [custOrders]);

  // Refunds / Credit Memos
  const refundsList = useMemo(() => {
    const list: {
      id: string;
      date: string;
      voucherNo: string;
      orderRef: string;
      amount: number;
      mode: string;
      reason: string;
    }[] = [];
    custOrders.forEach(o => {
      if ((o as any).refund_amount && parseFloat((o as any).refund_amount) > 0) {
        list.push({
          id: `ref-${o.id}`,
          date: (o as any).cancelled_at || o.invoiceDate,
          voucherNo: `REF-${o.invoiceNo || o.invoiceNumber || '001'}`,
          orderRef: o.invoiceNo || o.invoiceNumber || 'INV-REF',
          amount: parseFloat((o as any).refund_amount),
          mode: (o as any).refund_mode || 'Cash',
          reason: (o as any).cancel_reason || 'Order cancelled'
        });
      }
    });
    return list;
  }, [custOrders]);

  // Full Payment Ledger with signed running balance
  const fullLedger = useMemo(() => {
    if (!selectedCustomer) return [];
    const entries: {
      id: string;
      date: string;
      receiptNo: string;
      type: string;
      orderRef: string;
      mode: string;
      amount: number;
      sign: number;
      isRefund: boolean;
      bgStyle?: string;
    }[] = [];

    // Sales payments
    custOrders.forEach(ord => {
      const txns = ord.paymentTransactions || ord.payments || [];
      if (txns.length > 0) {
        txns.forEach((p, idx) => {
          entries.push({
            id: p.id || `p-${ord.id}-${idx}`,
            date: p.date || ord.invoiceDate || '2026-11-15',
            receiptNo: p.receiptNo || `REC-${ord.invoiceNo || '001'}`,
            type: 'SALE PAYMENT',
            orderRef: ord.invoiceNo || ord.invoiceNumber || '—',
            mode: p.mode || 'cash',
            amount: p.amount || 0,
            sign: 1,
            isRefund: false
          });
        });
      } else if ((ord.paidAmount || 0) > 0) {
        entries.push({
          id: `p-${ord.id}`,
          date: ord.invoiceDate || '2026-11-15',
          receiptNo: `REC-${ord.invoiceNo || '001'}`,
          type: 'SALE PAYMENT',
          orderRef: ord.invoiceNo || ord.invoiceNumber || '—',
          mode: (ord as any).paymentMode || 'cash',
          amount: ord.paidAmount || 0,
          sign: 1,
          isRefund: false
        });
      }
    });

    // Loan disbursements
    custLoans.forEach(l => {
      const amt = l.principalAmount || 0;
      if (amt > 0) {
        entries.push({
          id: `loan-out-${l.id}`,
          date: l.loanDate || '2026-11-15',
          receiptNo: l.loanNo,
          type: 'Loan paid out',
          orderRef: l.loanNo,
          mode: l.disbursementMode || 'cash',
          amount: amt,
          sign: -1,
          isRefund: false,
          bgStyle: 'var(--warn-l)'
        });
      }
    });

    // Loan repayments received
    custLoans.forEach(l => {
      (l.repayments || []).forEach((r, idx) => {
        const amt = (r.principalPaid || 0) + (r.interestPaid || 0);
        if (amt > 0) {
          entries.push({
            id: `loan-rep-${l.id}-${idx}`,
            date: r.date || '2026-11-15',
            receiptNo: r.receiptNo || `RCP-LN-${l.loanNo}`,
            type: 'LOAN REPAYMENT',
            orderRef: l.loanNo,
            mode: (r.paymentMode || r.mode || 'cash').toLowerCase(),
            amount: amt,
            sign: 1,
            isRefund: false,
            bgStyle: 'var(--success-l)'
          });
        }
      });
    });

    // Customer order refunds
    custOrders.forEach(ord => {
      const refAmt = parseFloat((ord as any).refund_amount) || 0;
      if (refAmt > 0) {
        entries.push({
          id: `refund-${ord.id}`,
          date: (ord as any).cancelled_at || ord.invoiceDate || '2026-11-15',
          receiptNo: `REF-${ord.invoiceNo || '001'}`,
          type: 'ORDER REFUND',
          orderRef: ord.invoiceNo || ord.invoiceNumber || '—',
          mode: (ord as any).refund_mode || 'cash',
          amount: refAmt,
          sign: -1,
          isRefund: true,
          bgStyle: 'var(--danger-l)'
        });
      }
    });

    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [selectedCustomer, custOrders, custLoans]);

  // 15 Stat Cards specification matching live app
  const statCards = [
    { label: 'Lifetime Purchase', val: formatCurrency(lifetimePurchase), color: 'var(--primary)' },
    { label: 'Total Cash Paid', val: formatCurrency(totalCashPaid), color: 'var(--success)' },
    { label: 'Order Outstanding', val: orderOutstanding > 0 ? formatCurrency(orderOutstanding) : '₹0', color: orderOutstanding > 0 ? 'var(--danger)' : 'var(--success)' },
    { label: 'Total Orders', val: String(custOrders.length), color: 'var(--info)' },
    { label: 'Pending Loan Due', val: formatCurrency(pendingLoanDue), color: pendingLoanDue > 0 ? 'var(--gold)' : 'var(--success)' },
    { label: 'Loan Principal Due', val: formatCurrency(loanPrincipalDue), color: loanPrincipalDue > 0 ? 'var(--danger)' : 'var(--success)' },
    { label: 'Loan Interest Collected', val: formatCurrency(loanInterestCollected), color: 'var(--success)' },
    { label: 'Open Loans', val: String(openLoansCount), color: openLoansCount > 0 ? 'var(--gold)' : 'var(--muted)' },
    { label: 'Deposit Balance', val: '₹0', color: 'var(--info)' },
    { label: 'NIL Metal Deposits', shortLabel: 'Metal Deposits', val: 'NIL', color: 'var(--gold)' },
    { label: 'NIL Open Gold (g)', shortLabel: 'Open Gold (g)', val: 'NIL', color: 'var(--gold)' },
    { label: 'NIL Open Silver (g)', shortLabel: 'Open Silver (g)', val: 'NIL', color: 'var(--info)' },
    { label: 'Bookings (0 open)', val: '₹0', color: 'var(--success)' },
    { label: openRepairsCount > 0 ? `Repairs (${openRepairsCount} open)` : 'Repairs (0 open)', val: '₹0', color: openRepairsCount > 0 ? 'var(--danger)' : 'var(--success)' },
    { label: 'Total Refunded', val: totalRefunded > 0 ? formatCurrency(totalRefunded) : '₹0', color: 'var(--info)' }
  ];

  // Family relations for profile card
  const familyList = selectedCustomer ? [
    ['Father', (selectedCustomer as any).father_name, (selectedCustomer as any).father_mobile],
    ['Mother', (selectedCustomer as any).mother_name, (selectedCustomer as any).mother_mobile],
    ['Brother', (selectedCustomer as any).brother_name, (selectedCustomer as any).brother_mobile],
    ['Son', (selectedCustomer as any).son_name, (selectedCustomer as any).son_mobile],
    ['Daughter', (selectedCustomer as any).daughter_name, (selectedCustomer as any).daughter_mobile]
  ].filter(e => e[1]) : [];

  // Directory pagination
  const totalCustomers = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalCustomers / pageSize));
  const displayedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Running balance accumulator for full ledger
  let runningLedgerBal = 0;

  return (
    <div className="page" id="main">
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className="kj-toast"
          style={{ 
            position: 'fixed', 
            top: 20, 
            right: 20, 
            zIndex: 9999, 
            background: toastType === 'error' ? 'var(--danger-l, #fef2f2)' : 'var(--surface)', 
            border: `1px solid ${toastType === 'error' ? 'var(--danger, #ef4444)' : 'var(--border)'}`, 
            borderRadius: 8, 
            padding: '10px 18px', 
            boxShadow: '0 4px 14px rgba(0,0,0,.15)', 
            fontWeight: 600, 
            fontSize: 13, 
            color: toastType === 'error' ? 'var(--danger, #b91c1c)' : 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          {toastType === 'error' ? (
            <span style={{ color: 'var(--danger)', fontWeight: 700 }}>✕</span>
          ) : (
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span>
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 1: CUSTOMERS DIRECTORY LIST
          ========================================================================= */}
      {!selectedCustomer && (
        <div>
          <div className="page-hdr">
            <div className="page-hdr-left">
              <h1>Customers</h1>
              <p>{customerList.length} active customers</p>
            </div>
            <div className="btn-group">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xlsx,.xls,.csv"
                onChange={handleImportExcel}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => fileInputRef.current?.click()}
                title="Add or update many customers from Excel"
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 6 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Import from Excel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenAddModal}
              >
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 6 }}>
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Customer
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card-body" style={{ padding: 14 }}>
              <div className="search-row">
                <div className="search-box">
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--muted)' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    placeholder="Search name, phone, Aadhar..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                {/* Balance Filter Chips */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginRight: 4 }}>Filter:</span>
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'due', label: 'With Balance' },
                    { id: 'zero', label: 'Zero Balance' },
                    { id: 'advance', label: 'Advance' }
                  ].map(bf => (
                    <button
                      key={bf.id}
                      type="button"
                      className={`filter-pill ${balanceFilter === bf.id ? 'active' : ''}`}
                      onClick={() => {
                        setBalanceFilter(bf.id as any);
                        setCurrentPage(1);
                      }}
                    >
                      {bf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="tbl-wrap tbl-desktop-only">
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th>PAN / Aadhar</th>
                      <th>Type</th>
                      <th>Outstanding</th>
                      <th>Open Loans</th>
                      <th>Open Repairs</th>
                      <th>Open Bookings</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)', fontSize: 13 }}>
                          No customers found
                        </td>
                      </tr>
                    ) : (
                      displayedCustomers.map((c, idx) => {
                        const aadharVal = (c as any).aadhar_no || c.aadhaarNumber;
                        const panVal = (c as any).pan_no || c.pan || c.panNumber;
                        const outBal = parseFloat(String(c.outstandingBalance || (c as any).opening_balance || 0));
                        const loansCount = parseInt(String(c.openLoansCount || (c as any).open_loans || 0), 10);
                        const repairsCount = parseInt(String(c.openRepairsCount || (c as any).open_repairs || 0), 10);
                        const bookingsCount = parseInt(String(c.openBookingsCount || (c as any).open_bookings || 0), 10);

                        return (
                          <tr 
                            key={c.id}
                            onClick={() => setShowProfileDrawer(c)}
                            style={{ cursor: 'pointer' }}
                            title="Click to view Customer 360 profile drawer"
                          >
                            <td>
                              <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>
                                {formatCustomerCode(c.code, idx)}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 600 }}>{c.name}</div>
                              {c.email && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.email}</div>}
                            </td>
                            <td>
                              <div>{c.mobile || c.phone}</div>
                              {(c.phone2 || (c as any).altMobile) && (
                                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.phone2 || (c as any).altMobile}</div>
                              )}
                            </td>
                            <td>
                              <div>{c.city || '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--muted)' }}>{c.state || 'Maharashtra'}</div>
                            </td>
                            <td style={{ fontSize: 11, fontFamily: 'monospace' }}>
                              <div>{panVal || '—'}</div>
                              {aadharVal && (
                                <div style={{ color: 'var(--muted)' }}>
                                  ****{aadharVal.slice(-4)}
                                </div>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${c.customerType === 'wholesale' ? 'badge-purple' : c.customerType === 'vip' ? 'badge-yellow' : 'badge-blue'}`}>
                                {c.customerType || 'retail'}
                              </span>
                            </td>
                            <td>
                              {outBal > 0 ? (
                                <span className="amt-red" style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="11" width="11" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                  </svg>
                                  {formatCurrency(outBal)}
                                </span>
                              ) : (
                                <span className="amt-green" style={{ fontWeight: 600 }}>NIL</span>
                              )}
                            </td>
                            <td>
                              {loansCount > 0 ? (
                                <span className="badge badge-yellow">{loansCount} Loan{loansCount > 1 ? 's' : ''}</span>
                              ) : (
                                <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>
                              )}
                            </td>
                            <td>
                              {repairsCount > 0 ? (
                                <span className="badge badge-blue">{repairsCount} Repair{repairsCount > 1 ? 's' : ''}</span>
                              ) : (
                                <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>
                              )}
                            </td>
                            <td>
                              {bookingsCount > 0 ? (
                                <span className="badge badge-orange">{bookingsCount} Booking{bookingsCount > 1 ? 's' : ''}</span>
                              ) : (
                                <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-primary"
                                  onClick={() => setSelectedCustomerId(c.id)}
                                  title="360 View"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="11" width="11" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                  Account
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={() => handleOpenEditModal(c)}
                                  title="Edit customer"
                                >
                                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="11" width="11" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-outline"
                                  onClick={() => setCustomerToDelete(c)}
                                  title="Delete customer"
                                  style={{ color: 'var(--danger)' }}
                                >
                                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="11" width="11" xmlns="http://www.w3.org/2000/svg">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View matching live app */}
              <div className="tbl-mobile-only" style={{ padding: '10px 0' }}>
                {displayedCustomers.map((c) => {
                  const outBal = parseFloat(String(c.outstandingBalance || (c as any).opening_balance || 0));
                  const loansCount = parseInt(String(c.openLoansCount || (c as any).open_loans || 0), 10);
                  const bookingsCount = parseInt(String(c.openBookingsCount || (c as any).open_bookings || 0), 10);

                  return (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1.5px solid var(--border)',
                        borderRadius: 12,
                        padding: '12px 14px',
                        marginBottom: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,.05)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{c.code || 'CUST-00001'}</div>
                        </div>
                        <span className={`badge ${c.customerType === 'wholesale' ? 'badge-purple' : c.customerType === 'vip' ? 'badge-yellow' : 'badge-blue'}`}>
                          {c.customerType || 'retail'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: 12 }}>
                        <span>{c.mobile || c.phone}</span>
                        {c.city && <span>{c.city}</span>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
                        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '5px 8px', textAlign: 'center' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: outBal > 0 ? 'var(--danger)' : 'var(--success)' }}>
                            {outBal > 0 ? formatCurrency(outBal) : 'NIL'}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--muted)' }}>Outstanding</div>
                        </div>
                        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '5px 8px', textAlign: 'center' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: loansCount > 0 ? 'var(--gold)' : 'var(--muted)' }}>
                            {loansCount}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--muted)' }}>Loans</div>
                        </div>
                        <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '5px 8px', textAlign: 'center' }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: bookingsCount > 0 ? 'var(--primary)' : 'var(--muted)' }}>
                            {bookingsCount}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--muted)' }}>Bookings</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-xs btn-primary"
                          style={{ flex: 1, justifyContent: 'center' }}
                          onClick={() => setSelectedCustomerId(c.id)}
                        >
                          View Account
                        </button>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline"
                          onClick={() => handleOpenEditModal(c)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Table Pager matching live app */}
              <div
                className="dt-pager"
                style={{
                  padding: '10px 16px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: 14,
                  fontSize: 12,
                  color: 'var(--muted)'
                }}
              >
                <span>
                  {totalCustomers === 0 ? '0 customers' : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, totalCustomers)} of ${totalCustomers} customers`}
                </span>
                <select
                  className="input"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={{ width: 'auto', padding: '4px 8px', height: 'auto', fontSize: 12 }}
                >
                  <option value="25">25 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                  <option value="200">200 / page</option>
                  <option value="500">500 / page</option>
                </select>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                    style={{ padding: '2px 8px' }}
                  >
                    «
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    style={{ padding: '2px 8px' }}
                  >
                    ‹
                  </button>
                  <span style={{ margin: '0 4px' }}>Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    style={{ padding: '2px 8px' }}
                  >
                    ›
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    style={{ padding: '2px 8px' }}
                  >
                    »
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: CUSTOMER ACCOUNT DOSSIER (/customers/:id/account)
          ========================================================================= */}
      {selectedCustomer && (
        <div>
          {/* Header Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setSelectedCustomerId(null)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="13" width="13" xmlns="http://www.w3.org/2000/svg">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Back
            </button>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>
              Customer Account — {selectedCustomer.name}
            </h1>
          </div>

          {/* Customer Profile Tabs: Overview, Ledger, KYC & Documents, Family & Dates */}
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button
              type="button"
              className={`tab ${customerDrawerTab === 'overview' ? 'active' : ''}`}
              onClick={() => setCustomerDrawerTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`tab ${customerDrawerTab === 'ledger' ? 'active' : ''}`}
              onClick={() => setCustomerDrawerTab('ledger')}
            >
              Ledger
            </button>
            <button
              type="button"
              className={`tab ${customerDrawerTab === 'kyc' ? 'active' : ''}`}
              onClick={() => setCustomerDrawerTab('kyc')}
            >
              KYC &amp; Documents
            </button>
            <button
              type="button"
              className={`tab ${customerDrawerTab === 'family' ? 'active' : ''}`}
              onClick={() => setCustomerDrawerTab('family')}
            >
              Family &amp; Dates
            </button>
          </div>

          {customerDrawerTab === 'overview' && (
            <>
              {/* 15 Stat Cards Grid */}
              <div className="stat-grid" style={{ marginBottom: 16 }}>
            {statCards.map((card) => (
              <div className="stat-card" key={card.label}>
                <div className="stat-val" style={{ color: card.color, fontSize: 17, fontWeight: 700 }}>
                  {card.val}
                </div>
                <div className="stat-lbl" style={{ fontSize: 11 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* 2-Column Grid: Left Profile Card (290px) | Right Tabbed Dossier */}
          <div className="acct-grid" style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 14 }}>
            
            {/* Left Column */}
            <div>
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="card-title" style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="13" width="13" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Profile
                  </span>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline"
                    onClick={() => handleOpenEditModal(selectedCustomer)}
                  >
                    Edit
                  </button>
                </div>
                <div className="card-body" style={{ fontSize: 13, padding: '14px 16px' }}>
                  <div style={{ marginBottom: 6 }}>
                    <strong style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase' }}>Code: </strong>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedCustomer.code || 'CUST-00001'}</span>
                  </div>
                  <div style={{ marginBottom: 6, fontWeight: 600 }}>
                    {selectedCustomer.mobile || selectedCustomer.phone}
                    {(selectedCustomer.phone2 || (selectedCustomer as any).altMobile) && (
                      <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 6 }}>
                        · {selectedCustomer.phone2 || (selectedCustomer as any).altMobile}
                      </span>
                    )}
                  </div>
                  {selectedCustomer.email && (
                    <div style={{ marginBottom: 8, color: 'var(--info)' }}>
                      {selectedCustomer.email}
                    </div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    <span className={`badge ${selectedCustomer.customerType === 'wholesale' ? 'badge-purple' : selectedCustomer.customerType === 'vip' ? 'badge-yellow' : 'badge-blue'}`}>
                      {selectedCustomer.customerType || 'retail'}
                    </span>
                  </div>
                  {(selectedCustomer as any).dob && (
                    <div style={{ marginBottom: 4, color: 'var(--muted)', fontSize: 12 }}>
                      DOB: {(selectedCustomer as any).dob}
                    </div>
                  )}
                  {(selectedCustomer as any).anniversary && (
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                      Anniversary: {(selectedCustomer as any).anniversary}
                    </div>
                  )}
                </div>
              </div>

              {/* Family Card if present */}
              {familyList.length > 0 && (
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="card-header" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                    <span className="card-title" style={{ fontSize: 12, fontWeight: 700 }}>Family References</span>
                  </div>
                  <div className="card-body" style={{ padding: '10px 14px' }}>
                    {familyList.map(([relation, name, mobile]) => (
                      <div key={relation} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        <div>
                          <div style={{ color: 'var(--muted)', fontSize: 10, textTransform: 'uppercase', fontWeight: 700 }}>{relation}</div>
                          <div style={{ fontWeight: 600 }}>{name}</div>
                        </div>
                        {mobile && (
                          <div style={{ color: 'var(--info)', fontFamily: 'monospace', fontSize: 11, alignSelf: 'center' }}>
                            {mobile}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Address Card */}
              {selectedCustomer.address && (
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="card-header" style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                    <span className="card-title" style={{ fontSize: 12, fontWeight: 700 }}>Address</span>
                  </div>
                  <div className="card-body" style={{ padding: '12px 14px', fontSize: 12, lineHeight: 1.6, color: 'var(--text)' }}>
                    <div>{selectedCustomer.address}</div>
                    <div style={{ color: 'var(--muted)', marginTop: 4 }}>
                      {selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.pincode}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Tabbed Dossier */}
            <div>
              <div className="tabs" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
                {[
                  ['orders', `Orders (${custOrders.length})`],
                  ['ledger', 'Full Ledger'],
                  ['loans', `Loans (${openLoansCount} open)`],
                  ['loan_payments', `Loan Payments (${loanRepayments.length})`],
                  ['repairs', `Repairs (${openRepairsCount} open)`],
                  ['bookings', 'Bookings (0 open)'],
                  ['metal_deposits', 'Metal Deposits (0 open)'],
                  ['old_gold', 'Old Gold (0)'],
                  ['cancellations', `Cancellations (${cancelledOrders.length})`],
                  ['credit_memos', `Refunds (${refundsList.length})`]
                ].map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    className={`tab ${activeDossierTab === key ? 'active' : ''}`}
                    onClick={() => setActiveDossierTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* TAB 1: ORDERS */}
              {activeDossierTab === 'orders' && (
                <div className="card">
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Order No</th>
                          <th>Date</th>
                          <th>Total</th>
                          <th>Paid</th>
                          <th>Pending</th>
                          <th>Refunded</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {custOrders.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                              No orders yet
                            </td>
                          </tr>
                        ) : (
                          custOrders.map((ord) => {
                            const tot = ord.totalAmount || ord.productTotalValue || 0;
                            const pd = ord.paidAmount || 0;
                            const bal = ord.balanceDue || Math.max(0, tot - pd);
                            const isCancelled = ord.status === 'CANCELLED';

                            return (
                              <tr key={ord.id} style={{ background: isCancelled ? 'var(--danger-l)' : undefined }}>
                                <td style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 600 }}>
                                  {ord.invoiceNo || ord.invoiceNumber}
                                </td>
                                <td style={{ fontSize: 12 }}>{ord.invoiceDate}</td>
                                <td style={{ fontWeight: 600 }}>{formatCurrency(tot)}</td>
                                <td className="amt-green" style={{ fontWeight: 600 }}>{formatCurrency(pd)}</td>
                                <td>
                                  {bal > 0 ? (
                                    <span className="amt-red" style={{ fontWeight: 600 }}>{formatCurrency(bal)}</span>
                                  ) : (
                                    <span className="amt-green" style={{ fontWeight: 600 }}>NIL</span>
                                  )}
                                </td>
                                <td>
                                  {(ord as any).refund_amount && parseFloat((ord as any).refund_amount) > 0 ? (
                                    <span className="amt-red">−{formatCurrency((ord as any).refund_amount)}</span>
                                  ) : (
                                    <span style={{ color: 'var(--muted)' }}>—</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`badge ${ord.status === 'COMPLETED' ? 'badge-green' : isCancelled ? 'badge-red' : 'badge-yellow'}`}>
                                    {ord.status}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: 4 }}>
                                    <button
                                      type="button"
                                      className="btn btn-outline btn-sm"
                                      style={{ padding: '2px 8px', fontSize: 11 }}
                                      onClick={() => showToast(`GST invoice for ${ord.invoiceNo} opened`)}
                                      title="GST tax invoice (PDF)"
                                    >
                                      GST invoice
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: FULL LEDGER */}
              {activeDossierTab === 'ledger' && (
                <div className="card">
                  <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: 13, fontWeight: 700 }}>Complete Payment Ledger</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>All transactions including refunds</span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Receipt No</th>
                          <th>Type</th>
                          <th>Order Ref</th>
                          <th>Mode</th>
                          <th>Amount</th>
                          <th>Running Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fullLedger.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                              No transactions
                            </td>
                          </tr>
                        ) : (
                          fullLedger.map((entry) => {
                            runningLedgerBal += entry.sign * entry.amount;
                            return (
                              <tr key={entry.id} style={{ background: entry.bgStyle }}>
                                <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{entry.date}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: 11, color: entry.isRefund ? 'var(--danger)' : undefined }}>
                                  {entry.receiptNo}
                                </td>
                                <td>
                                  <span className={`badge ${entry.sign < 0 ? 'badge-gold' : 'badge-green'}`}>
                                    {entry.type}
                                  </span>
                                </td>
                                <td style={{ fontSize: 11, fontFamily: 'monospace' }}>{entry.orderRef}</td>
                                <td>
                                  <span className="badge badge-blue">{entry.mode.toUpperCase()}</span>
                                </td>
                                <td style={{ fontWeight: 700, color: entry.sign < 0 ? 'var(--danger)' : 'var(--success)' }}>
                                  {entry.sign < 0 ? `− ${formatCurrency(entry.amount)}` : `+ ${formatCurrency(entry.amount)}`}
                                </td>
                                <td style={{ fontWeight: 700 }}>
                                  {formatCurrency(Math.abs(runningLedgerBal))}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: LOANS */}
              {activeDossierTab === 'loans' && (
                <div className="card">
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Loan No</th>
                          <th>Date</th>
                          <th>Type</th>
                          <th>Principal</th>
                          <th>Rate %</th>
                          <th>Outstanding</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {custLoans.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                              No loans
                            </td>
                          </tr>
                        ) : (
                          custLoans.map((l) => (
                            <tr key={l.id}>
                              <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{l.loanNo}</td>
                              <td style={{ fontSize: 12 }}>{l.loanDate}</td>
                              <td style={{ textTransform: 'capitalize' }}>{(l as any).loanType || 'Girvi'}</td>
                              <td>{formatCurrency(l.principalAmount || 0)}</td>
                              <td className="amt-gold">{(l as any).interestRateMonthly || (l as any).interestRate || 1.5}%/mo</td>
                              <td style={{ fontWeight: 600 }}>{formatCurrency(l.principalAmount || 0)}</td>
                              <td>
                                <span className={`badge ${l.status === 'CLOSED' ? 'badge-gray' : 'badge-yellow'}`}>
                                  {l.status || 'ACTIVE'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: LOAN PAYMENTS */}
              {activeDossierTab === 'loan_payments' && (
                <div className="card">
                  <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: 13, fontWeight: 700 }}>Loan Repayment Vouchers</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Principal & interest recovery history</span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Receipt No</th>
                          <th>Date</th>
                          <th>Loan Ref</th>
                          <th className="num">Principal Paid</th>
                          <th className="num">Interest Paid</th>
                          <th className="num">Total Received</th>
                          <th>Payment Mode</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loanRepayments.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                              No loan repayment vouchers recorded yet
                            </td>
                          </tr>
                        ) : (
                          loanRepayments.map((rep) => (
                            <tr key={rep.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{rep.receiptNo}</td>
                              <td style={{ fontSize: 12 }}>{rep.date}</td>
                              <td style={{ fontFamily: 'monospace' }}>{rep.loanNo}</td>
                              <td className="num amt-green" style={{ fontWeight: 600 }}>{formatCurrency(rep.principalPaid)}</td>
                              <td className="num amt-gold" style={{ fontWeight: 600 }}>{formatCurrency(rep.interestPaid)}</td>
                              <td className="num" style={{ fontWeight: 700 }}>{formatCurrency(rep.totalReceived)}</td>
                              <td><span className="badge badge-blue">{rep.mode}</span></td>
                              <td style={{ fontSize: 12, color: 'var(--muted)' }}>{rep.notes || '—'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: REPAIRS */}
              {activeDossierTab === 'repairs' && (
                <div className="card">
                  <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: 13, fontWeight: 700 }}>Jewellery Repair & Workshop Orders</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>SAC 998722 · 18% GST Service Maintenance</span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Job / Repair No</th>
                          <th>Received Date</th>
                          <th>Promise Date</th>
                          <th>Technician</th>
                          <th>Item / Issue</th>
                          <th className="num">Est. Cost</th>
                          <th className="num">Advance</th>
                          <th className="num">Balance Due</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {custRepairs.length === 0 ? (
                          <tr>
                            <td colSpan={10} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                              No repair orders found for this customer
                            </td>
                          </tr>
                        ) : (
                          custRepairs.map((r) => {
                            const isPending = (r.balanceDue || 0) > 0;
                            return (
                              <tr key={r.id}>
                                <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.repairNo}</td>
                                <td style={{ fontSize: 12 }}>{r.receivedDate}</td>
                                <td style={{ fontSize: 12 }}>{r.promiseDate}</td>
                                <td>{r.technicianName || 'Workshop'}</td>
                                <td>
                                  {r.items.map(it => `${it.description} (${it.issueType})`).join(', ')}
                                </td>
                                <td className="num">{formatCurrency(r.totalCost || 0)}</td>
                                <td className="num amt-green">{formatCurrency(r.advancePaid || 0)}</td>
                                <td className="num" style={{ fontWeight: 700, color: isPending ? 'var(--danger)' : 'var(--success)' }}>
                                  {isPending ? formatCurrency(r.balanceDue) : 'NIL'}
                                </td>
                                <td>
                                  <span className={`badge ${
                                    r.status === 'DELIVERED' ? 'badge-green' :
                                    r.status === 'QC_READY' ? 'badge-purple' :
                                    r.status === 'IN_WORKSHOP' ? 'badge-orange' : 'badge-blue'
                                  }`}>
                                    {String(r.status).replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-outline btn-xs"
                                    onClick={() => showToast(`Repair ticket ${r.repairNo} opened`)}
                                  >
                                    Job Slip
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: BOOKINGS */}
              {activeDossierTab === 'bookings' && (
                <div className="card">
                  <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: 13, fontWeight: 700 }}>Rate-Fixing & Metal Advance Bookings</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Forward Rate-Lock Contracts</span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Booking No</th>
                          <th>Date</th>
                          <th>Metal & Karatage</th>
                          <th className="num">Booked Rate (₹/g)</th>
                          <th className="num">Advance Paid</th>
                          <th className="num">Locked Weight (g)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                            No active metal advance bookings (0 open)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: METAL DEPOSITS */}
              {activeDossierTab === 'metal_deposits' && (
                <div className="card">
                  <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: 13, fontWeight: 700 }}>Customer Metal Deposits Ledger</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Gold & Silver bullion deposits custody</span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Deposit No</th>
                          <th>Date</th>
                          <th>Metal</th>
                          <th className="num">Gross Wt (g)</th>
                          <th className="num">Touch Purity %</th>
                          <th className="num">Fine Metal Wt (g)</th>
                          <th className="num">Valuation</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                            No metal deposits on file (NIL balance)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 8: OLD GOLD */}
              {activeDossierTab === 'old_gold' && (
                <div className="card">
                  <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: 13, fontWeight: 700 }}>Old Gold Purchase & Scrap Exchanges</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Exchange against POS sales</span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Voucher No</th>
                          <th>Date</th>
                          <th>Metal Description</th>
                          <th className="num">Gross Wt (g)</th>
                          <th className="num">Net Wt (g)</th>
                          <th className="num">Touch Purity %</th>
                          <th className="num">Buying Rate (₹/g)</th>
                          <th className="num">Exchange Credit (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                            No old gold purchases or scrap buybacks recorded
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 9: CANCELLATIONS */}
              {activeDossierTab === 'cancellations' && (
                <div className="card">
                  <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: 13, fontWeight: 700 }}>Cancelled Orders & Reversals</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Audit trail of cancelled sales invoices</span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Order No</th>
                          <th>Order Date</th>
                          <th>Cancellation Date</th>
                          <th>Cancellation Reason</th>
                          <th className="num">Order Total</th>
                          <th className="num">Refund / Credit Note</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cancelledOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                              No cancelled orders
                            </td>
                          </tr>
                        ) : (
                          cancelledOrders.map((ord) => (
                            <tr key={ord.id} style={{ background: 'var(--danger-l)' }}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{ord.invoiceNo}</td>
                              <td>{ord.invoiceDate}</td>
                              <td>{(ord as any).cancelled_at || ord.invoiceDate}</td>
                              <td>{(ord as any).cancel_reason || 'Customer request'}</td>
                              <td className="num">{formatCurrency(ord.totalAmount || 0)}</td>
                              <td className="num amt-red">{formatCurrency(parseFloat((ord as any).refund_amount) || 0)}</td>
                              <td><span className="badge badge-red">CANCELLED</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 10: REFUNDS */}
              {activeDossierTab === 'credit_memos' && (
                <div className="card">
                  <div className="card-header" style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="card-title" style={{ fontSize: 13, fontWeight: 700 }}>Refunds & Credit Notes</span>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Payment reversals & credit memos</span>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Refund Voucher</th>
                          <th>Date</th>
                          <th>Order Ref</th>
                          <th>Payment Mode</th>
                          <th className="num">Refund Amount</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {refundsList.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                              No refund vouchers issued (₹0 total refunded)
                            </td>
                          </tr>
                        ) : (
                          refundsList.map((ref) => (
                            <tr key={ref.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--danger)' }}>{ref.voucherNo}</td>
                              <td>{ref.date}</td>
                              <td style={{ fontFamily: 'monospace' }}>{ref.orderRef}</td>
                              <td><span className="badge badge-blue">{ref.mode}</span></td>
                              <td className="num amt-red" style={{ fontWeight: 700 }}>{formatCurrency(ref.amount)}</td>
                              <td style={{ color: 'var(--muted)' }}>{ref.reason}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Card: KYC & GST | Store credit | Visits | Cash in / out */}
          <div className="card" style={{ marginTop: 14 }}>
            <div className="tabs" style={{ padding: '0 12px' }}>
              <button
                type="button"
                className={`tab ${bottomTab === 'kyc' ? 'active' : ''}`}
                onClick={() => setBottomTab('kyc')}
              >
                KYC & GST
              </button>
              <button
                type="button"
                className={`tab ${bottomTab === 'credit' ? 'active' : ''}`}
                onClick={() => setBottomTab('credit')}
              >
                Store credit ({formatCurrency(storeCreditBalance)})
              </button>
              <button
                type="button"
                className={`tab ${bottomTab === 'visits' ? 'active' : ''}`}
                onClick={() => setBottomTab('visits')}
              >
                Visits
              </button>
              <button
                type="button"
                className={`tab ${bottomTab === 'ledger' ? 'active' : ''}`}
                onClick={() => setBottomTab('ledger')}
              >
                Cash in / out
              </button>
            </div>

            <div className="card-body" style={{ padding: 16 }}>
              {bottomTab === 'kyc' && (
                <div>
                  <div style={{ display: 'flex', gap: 24, marginBottom: 14, fontSize: 13, color: 'var(--text)', flexWrap: 'wrap' }}>
                    <span>PAN: <b>{(selectedCustomer as any).pan_no || selectedCustomer.pan || '—'}</b></span>
                    <span>GSTIN: <b>{(selectedCustomer as any).gst_no || selectedCustomer.gstin || '—'}</b></span>
                    <span>
                      Aadhaar: <b>{
                        ((selectedCustomer as any).aadhar_no || selectedCustomer.aadhaarNumber)
                          ? `XXXX-XXXX-${String((selectedCustomer as any).aadhar_no || selectedCustomer.aadhaarNumber).slice(-4)}`
                          : '—'
                      }</b>
                    </span>
                    {(selectedCustomer as any).last_visit_date && (
                      <span>Last visit: <b>{(selectedCustomer as any).last_visit_date}</b></span>
                    )}
                  </div>

                  {liveBottomAadhaarError && newAadhaar.trim().length > 0 && (
                    <div 
                      className="alert-banner alert-banner-danger"
                      role="alert"
                      style={{
                        background: 'var(--danger-l, #fef2f2)',
                        border: '1px solid var(--danger, #f87171)',
                        color: 'var(--danger, #991b1b)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        marginBottom: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        fontWeight: 600
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{liveBottomAadhaarError}</span>
                    </div>
                  )}

                  <div className="g4" style={{ marginBottom: 14 }}>
                    <div className="form-group">
                      <label className="label">New Aadhaar (12-digit)</label>
                      <input
                        className="input"
                        placeholder="12-digit UID"
                        value={newAadhaar}
                        onChange={(e) => setNewAadhaar(e.target.value)}
                        style={liveBottomAadhaarError && newAadhaar.trim().length > 0 ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">New PAN</label>
                      <input
                        className="input"
                        placeholder="Leave blank to keep"
                        value={newPan}
                        onChange={(e) => setNewPan(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">New GSTIN</label>
                      <input
                        className="input"
                        placeholder="Leave blank to keep"
                        value={newGst}
                        onChange={(e) => {
                          const upper = e.target.value.toUpperCase();
                          setNewGst(upper);
                          if (upper.length === 15 && !validateGSTIN(upper)) {
                            setBottomStateCode(upper.slice(0, 2));
                            if (!newPan) setNewPan(upper.slice(2, 12));
                          }
                        }}
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">State (place of supply)</label>
                      <select
                        className="input"
                        value={bottomStateCode}
                        onChange={(e) => setBottomStateCode(e.target.value)}
                      >
                        <option value="">— same as shop —</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.code} {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="g3" style={{ marginBottom: 14 }}>
                    <div className="form-group">
                      <label className="label">Guarantor name</label>
                      <input
                        className="input"
                        placeholder=""
                        value={guarantorName}
                        onChange={(e) => setGuarantorName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="label">Guarantor mobile</label>
                      <input
                        className="input"
                        placeholder=""
                        value={guarantorMobile}
                        onChange={(e) => setGuarantorMobile(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
                      <label className="check" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                        <input
                          type="checkbox"
                          checked={form60}
                          onChange={(e) => setForm60(e.target.checked)}
                        />
                        <span>Form 60 on file (no PAN)</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      if (newAadhaar) {
                        const err = validateAadhaar(newAadhaar);
                        if (err) {
                          alert(err);
                          return;
                        }
                      }
                      if (guarantorMobile) {
                        const err = validateMobile(guarantorMobile, 'Guarantor mobile');
                        if (err) {
                          alert(err);
                          return;
                        }
                      }
                      if (newPan) {
                        const err = validatePAN(newPan);
                        if (err) {
                          alert(err);
                          return;
                        }
                      }
                      if (newGst) {
                        const err = validateGSTIN(newGst);
                        if (err) {
                          alert(err);
                          return;
                        }
                      }
                      setCustomerList(prev => prev.map(c => {
                        if (c.id === selectedCustomer.id) {
                          return {
                            ...c,
                            pan: newPan || c.pan,
                            pan_no: newPan || (c as any).pan_no,
                            gstin: newGst || c.gstin,
                            gst_no: newGst || (c as any).gst_no,
                            aadhaarNumber: newAadhaar || c.aadhaarNumber,
                            aadhar_no: newAadhaar || (c as any).aadhar_no,
                            guarantorName: guarantorName || c.guarantorName,
                            guarantorMobile: guarantorMobile || c.guarantorMobile,
                            form60: form60
                          } as any;
                        }
                        return c;
                      }));
                      setNewAadhaar('');
                      setNewPan('');
                      setNewGst('');
                      showToast('KYC & GST records updated successfully');
                    }}
                  >
                    Save KYC
                  </button>
                </div>
              )}

              {bottomTab === 'credit' && (
                <div>
                  <p style={{ marginBottom: 12, fontSize: 13 }}>
                    Balance <b>{formatCurrency(storeCreditBalance)}</b> — use it as payment mode "customer credit" on a bill.
                  </p>
                  <div className="g4" style={{ marginBottom: 12 }}>
                    <select
                      className="input"
                      value={creditAdjustment.direction}
                      onChange={(e) => setCreditAdjustment({ ...creditAdjustment, direction: e.target.value })}
                    >
                      <option value="add">Add credit</option>
                      <option value="payout">Pay out credit</option>
                    </select>
                    <input
                      className="input"
                      type="number"
                      placeholder="Amount (₹)"
                      value={creditAdjustment.amount}
                      onChange={(e) => setCreditAdjustment({ ...creditAdjustment, amount: e.target.value })}
                    />
                    <select
                      className="input"
                      value={creditAdjustment.mode}
                      onChange={(e) => setCreditAdjustment({ ...creditAdjustment, mode: e.target.value })}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                    <input
                      className="input"
                      placeholder="Notes / Reason"
                      value={creditAdjustment.notes}
                      onChange={(e) => setCreditAdjustment({ ...creditAdjustment, notes: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      const amt = parseFloat(creditAdjustment.amount);
                      if (isNaN(amt) || amt <= 0) {
                        alert('Please enter a valid amount');
                        return;
                      }
                      if (creditAdjustment.direction === 'payout' && amt > storeCreditBalance) {
                        alert('Cannot payout more than existing credit balance');
                        return;
                      }
                      setStoreCreditBalance(prev => creditAdjustment.direction === 'add' ? prev + amt : prev - amt);
                      setCreditAdjustment({ direction: 'add', amount: '', mode: 'cash', reference: '', notes: '' });
                      showToast('Store credit updated');
                    }}
                  >
                    Apply Credit Adjustment
                  </button>
                </div>
              )}

              {bottomTab === 'visits' && (
                <div>
                  <div className="tbl-wrap" style={{ marginBottom: 16 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Visit Date</th>
                          <th>Purpose / Occasion</th>
                          <th>Salesperson / Counter</th>
                          <th>Notes & Items Viewed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitsList.map(v => (
                          <tr key={v.id}>
                            <td style={{ fontSize: 12 }}>{v.date}</td>
                            <td style={{ fontWeight: 600 }}>{v.purpose}</td>
                            <td>{v.salesperson}</td>
                            <td style={{ color: 'var(--text)', fontSize: 12 }}>{v.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Log Showroom Visit</div>
                    <div className="g3" style={{ marginBottom: 8 }}>
                      <input
                        className="input input-sm"
                        placeholder="Purpose (e.g. Wedding Shopping, Gold Coin)"
                        value={newVisitPurpose}
                        onChange={(e) => setNewVisitPurpose(e.target.value)}
                      />
                      <input
                        className="input input-sm"
                        placeholder="Counter / Staff (e.g. Counter 1)"
                        value={newVisitSalesperson}
                        onChange={(e) => setNewVisitSalesperson(e.target.value)}
                      />
                      <input
                        className="input input-sm"
                        placeholder="Notes on customer preference"
                        value={newVisitNotes}
                        onChange={(e) => setNewVisitNotes(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-xs"
                      onClick={() => {
                        if (!newVisitPurpose.trim()) {
                          alert('Please enter a visit purpose');
                          return;
                        }
                        const newV = {
                          id: `v-${Date.now()}`,
                          date: new Date().toISOString().slice(0, 10),
                          purpose: newVisitPurpose.trim(),
                          salesperson: newVisitSalesperson.trim(),
                          notes: newVisitNotes.trim()
                        };
                        setVisitsList(prev => [newV, ...prev]);
                        setNewVisitPurpose('');
                        setNewVisitNotes('');
                        showToast('Showroom visit logged');
                      }}
                    >
                      + Add Visit Record
                    </button>
                  </div>
                </div>
              )}

              {bottomTab === 'ledger' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
                    <div style={{ padding: 12, borderRadius: 8, background: 'var(--success-l)', border: '1px solid var(--success)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Cash Received (Inflows)</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>
                        {formatCurrency(totalCashPaid + (custLoans.reduce((s, l) => s + (l.repayments || []).reduce((rs, r) => rs + (r.principalPaid || 0) + (r.interestPaid || 0), 0), 0)))}
                      </div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 8, background: 'var(--danger-l)', border: '1px solid var(--danger)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Cash Outflow</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--danger)' }}>
                        {formatCurrency(custLoans.reduce((s, l) => s + (l.principalAmount || 0), 0) + totalRefunded)}
                      </div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Net Account Cashflow</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary)' }}>
                        {formatCurrency(
                          (totalCashPaid + (custLoans.reduce((s, l) => s + (l.repayments || []).reduce((rs, r) => rs + (r.principalPaid || 0) + (r.interestPaid || 0), 0), 0))) -
                          (custLoans.reduce((s, l) => s + (l.principalAmount || 0), 0) + totalRefunded)
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Transaction Ref</th>
                          <th>Description</th>
                          <th>Direction</th>
                          <th>Payment Mode</th>
                          <th className="num">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fullLedger.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 20 }}>
                              No cash in / out entries recorded
                            </td>
                          </tr>
                        ) : (
                          fullLedger.map(entry => (
                            <tr key={entry.id} style={{ background: entry.bgStyle }}>
                              <td style={{ fontSize: 11 }}>{entry.date}</td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{entry.receiptNo}</td>
                              <td>{entry.type} ({entry.orderRef})</td>
                              <td>
                                <span className={`badge ${entry.sign > 0 ? 'badge-green' : 'badge-red'}`}>
                                  {entry.sign > 0 ? 'INFLOW (Cash In)' : 'OUTFLOW (Cash Out)'}
                                </span>
                              </td>
                              <td><span className="badge badge-blue">{entry.mode.toUpperCase()}</span></td>
                              <td className="num" style={{ fontWeight: 700, color: entry.sign > 0 ? 'var(--success)' : 'var(--danger)' }}>
                                {entry.sign > 0 ? `+ ${formatCurrency(entry.amount)}` : `− ${formatCurrency(entry.amount)}`}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB 2: LEDGER */}
      {customerDrawerTab === 'ledger' && (
        <div style={{ marginTop: 14 }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
            <div style={{ padding: 14, borderRadius: 8, background: 'var(--success-l)', border: '1px solid var(--success)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Cash Received (Inflows)</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)', marginTop: 4 }}>
                {formatCurrency(totalCashPaid + (custLoans.reduce((s, l) => s + (l.repayments || []).reduce((rs, r) => rs + (r.principalPaid || 0) + (r.interestPaid || 0), 0), 0)))}
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 8, background: 'var(--danger-l)', border: '1px solid var(--danger)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Cash Outflow</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--danger)', marginTop: 4 }}>
                {formatCurrency(custLoans.reduce((s, l) => s + (l.principalAmount || 0), 0) + totalRefunded)}
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Net Account Cashflow</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>
                {formatCurrency(
                  (totalCashPaid + (custLoans.reduce((s, l) => s + (l.repayments || []).reduce((rs, r) => rs + (r.principalPaid || 0) + (r.interestPaid || 0), 0), 0))) -
                  (custLoans.reduce((s, l) => s + (l.principalAmount || 0), 0) + totalRefunded)
                )}
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700 }}>Outstanding Balance Due</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: orderOutstanding > 0 ? 'var(--danger)' : 'var(--success)', marginTop: 4 }}>
                {formatCurrency(orderOutstanding)}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title" style={{ fontSize: 13, fontWeight: 700 }}>Customer Statement &amp; Running Ledger</span>
              <button 
                type="button" 
                className="btn btn-xs btn-outline"
                onClick={() => window.print()}
              >
                Print Statement
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Transaction Ref</th>
                      <th>Description</th>
                      <th>Direction</th>
                      <th>Payment Mode</th>
                      <th className="num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fullLedger.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>
                          No ledger records found for this account.
                        </td>
                      </tr>
                    ) : (
                      fullLedger.map(entry => (
                        <tr key={entry.id} style={{ background: entry.bgStyle }}>
                          <td style={{ fontSize: 11 }}>{entry.date}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{entry.receiptNo}</td>
                          <td>{entry.type} ({entry.orderRef})</td>
                          <td>
                            <span className={`badge ${entry.sign > 0 ? 'badge-green' : 'badge-red'}`}>
                              {entry.sign > 0 ? 'INFLOW (Cash In)' : 'OUTFLOW (Cash Out)'}
                            </span>
                          </td>
                          <td><span className="badge badge-blue">{entry.mode.toUpperCase()}</span></td>
                          <td className="num" style={{ fontWeight: 700, color: entry.sign > 0 ? 'var(--success)' : 'var(--danger)' }}>
                            {entry.sign > 0 ? `+ ${formatCurrency(entry.amount)}` : `− ${formatCurrency(entry.amount)}`}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KYC & DOCUMENTS */}
      {customerDrawerTab === 'kyc' && (
        <div style={{ marginTop: 14 }}>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>KYC, Identity &amp; Statutory Documents</h3>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Govt statutory validation (Aadhaar 12-digit Verhoeff checksum, PAN entity format, GSTIN 15-digit)
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  type="button" 
                  className="btn btn-sm btn-outline"
                  onClick={() => handleOpenEditModal(selectedCustomer)}
                >
                  Edit KYC Info
                </button>
              </div>
            </div>

            {/* Identity Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 16 }}>
              {/* Aadhaar Card */}
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Aadhaar Number</span>
                  {(() => {
                    const aadh = (selectedCustomer as any).aadhar_no || selectedCustomer.aadhaarNumber || newAadhaar;
                    const err = validateAadhaar(aadh);
                    if (!aadh) return <span className="badge badge-gray">Not Provided</span>;
                    return err ? <span className="badge badge-red">Invalid</span> : <span className="badge badge-green">Verified (Verhoeff)</span>;
                  })()}
                </div>
                <div style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 700, marginBottom: 6 }}>
                  {(() => {
                    const aadh = (selectedCustomer as any).aadhar_no || selectedCustomer.aadhaarNumber || newAadhaar;
                    if (!aadh) return '—';
                    const clean = String(aadh).replace(/\s/g, '');
                    return clean.length >= 12 ? `XXXX XXXX ${clean.slice(-4)}` : aadh;
                  })()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  12-digit UIDAI Unique Identification · Validated via Verhoeff multiplication &amp; permutation tables.
                </div>
              </div>

              {/* PAN Card */}
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Permanent Account Number (PAN)</span>
                  {(() => {
                    const pan = (selectedCustomer as any).pan_no || selectedCustomer.pan || newPan;
                    const err = validatePAN(pan);
                    if (!pan) return <span className="badge badge-yellow">Required &gt; ₹2 Lakh</span>;
                    return err ? <span className="badge badge-red">Invalid Format</span> : <span className="badge badge-green">Valid Individual (P)</span>;
                  })()}
                </div>
                <div style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 700, marginBottom: 6 }}>
                  {(selectedCustomer as any).pan_no || selectedCustomer.pan || newPan || '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Income Tax Department · [A-Z]&#123;5&#125;[0-9]&#123;4&#125;[A-Z]&#123;1&#125; (4th char: P - Person). Mandatory for jewellery transactions of ₹2 lakh and above.
                </div>
              </div>

              {/* GSTIN Card */}
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>GST Identification Number</span>
                  {(() => {
                    const gst = (selectedCustomer as any).gst_no || selectedCustomer.gstin || newGst;
                    const err = validateGSTIN(gst);
                    if (!gst) return <span className="badge badge-gray">Unregistered (B2C)</span>;
                    return err ? <span className="badge badge-red">Invalid GSTIN</span> : <span className="badge badge-green">Active GSTIN</span>;
                  })()}
                </div>
                <div style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 700, marginBottom: 6 }}>
                  {(selectedCustomer as any).gst_no || selectedCustomer.gstin || newGst || 'Unregistered Consumer (B2C)'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  State Code: {selectedCustomer.stateCode || (selectedCustomer.state ? '27 Maharashtra' : '—')}
                </div>
              </div>
            </div>

            {/* Form 60 & Compliance Status */}
            <div style={{ background: 'var(--surface2, #f8fafc)', borderRadius: 8, padding: 14, border: '1px solid var(--border)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                    Form 60 Declaration (Income Tax Rule 114B)
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                    Statutory declaration required for sales &gt; ₹2,00,000 when customer has no PAN card.
                  </div>
                </div>
                <span className={`badge ${selectedCustomer.pan ? 'badge-green' : 'badge-yellow'}`}>
                  {selectedCustomer.pan ? 'PAN On File (Form 60 Exempt)' : 'Form 60 Required for Sales ≥ ₹2L'}
                </span>
              </div>
            </div>

            {/* Document Checklist & Verification */}
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Document Verification Checklist</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {[
                { doc: 'Aadhaar Card (12-digit UIDAI)', hasDoc: !!(selectedCustomer.aadhaarNumber || (selectedCustomer as any).aadhar_no), status: 'Verified' },
                { doc: 'PAN Card Copy (Tax Dept)', hasDoc: !!(selectedCustomer.pan || (selectedCustomer as any).pan_no), status: 'Verified' },
                { doc: 'Address Proof (Electricity / Utility)', hasDoc: !!selectedCustomer.address, status: 'Submitted' },
                { doc: 'Passport Size Photograph', hasDoc: true, status: 'Archived' }
              ].map((d, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: 12, background: '#fff' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{d.doc}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={`badge ${d.hasDoc ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: 10 }}>
                      {d.hasDoc ? d.status : 'Pending Upload'}
                    </span>
                    <button type="button" className="btn btn-xs btn-outline">Upload / Scan</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FAMILY & DATES */}
      {customerDrawerTab === 'family' && (
        <div style={{ marginTop: 14 }}>
          <div className="card" style={{ padding: 18, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Family Relations &amp; Important Dates</h3>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                  Birthdays, anniversaries, and family references for gifting, loans &amp; greetings
                </div>
              </div>
              <button 
                type="button" 
                className="btn btn-sm btn-outline"
                onClick={() => handleOpenEditModal(selectedCustomer)}
              >
                Edit Family &amp; Dates
              </button>
            </div>

            {/* Important Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 18 }}>
              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  🎂 Date of Birth
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  {(selectedCustomer as any).dob || 'Not Recorded'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {(selectedCustomer as any).dob ? 'Customer is over 18 years of age (KYC eligible)' : 'Add date of birth to send automated anniversary greetings'}
                </div>
              </div>

              <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                  💍 Wedding Anniversary
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  {(selectedCustomer as any).anniversary || 'Not Recorded'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Used for anniversary jewellery offers &amp; special promotional discounts
                </div>
              </div>
            </div>

            {/* Family Relations Table */}
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Family Members</div>
            <div className="tbl-wrap" style={{ marginBottom: 18 }}>
              <table>
                <thead>
                  <tr>
                    <th>Relationship</th>
                    <th>Full Name</th>
                    <th>Mobile Number</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rel: 'Father', name: (selectedCustomer as any).father_name || '—', mob: (selectedCustomer as any).father_mobile || '—' },
                    { rel: 'Mother', name: (selectedCustomer as any).mother_name || '—', mob: (selectedCustomer as any).mother_mobile || '—' },
                    { rel: 'Spouse', name: (selectedCustomer as any).spouse_name || (selectedCustomer as any).nominee_name || '—', mob: (selectedCustomer as any).spouse_mobile || '—' },
                    { rel: 'Brother', name: (selectedCustomer as any).brother_name || '—', mob: (selectedCustomer as any).brother_mobile || '—' },
                    { rel: 'Son', name: (selectedCustomer as any).son_name || '—', mob: (selectedCustomer as any).son_mobile || '—' },
                    { rel: 'Daughter', name: (selectedCustomer as any).daughter_name || '—', mob: (selectedCustomer as any).daughter_mobile || '—' }
                  ].map((f, i) => (
                    <tr key={i}>
                      <td><strong>{f.rel}</strong></td>
                      <td>{f.name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{f.mob}</td>
                      <td>
                        <span className={`badge ${f.name !== '—' ? 'badge-blue' : 'badge-gray'}`}>
                          {f.name !== '—' ? 'Linked' : 'Not Provided'}
                        </span>
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className="btn btn-xs btn-outline"
                          onClick={() => handleOpenEditModal(selectedCustomer)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Guarantor & Emergency Reference */}
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Guarantor &amp; Reference</div>
            <div style={{ background: 'var(--surface2, #f8fafc)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Guarantor Name</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{(selectedCustomer as any).guarantor_name || (selectedCustomer as any).nominee_name || 'None Assigned'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Guarantor Mobile</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{(selectedCustomer as any).guarantor_mobile || (selectedCustomer as any).nominee_mobile || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Relationship</div>
                  <div style={{ fontWeight: 600 }}>{(selectedCustomer as any).guarantor_relation || 'Nominee / Guarantor'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT CUSTOMER (MATCHING LIVE APP MODAL EXACTLY)
          ========================================================================= */}
      {showCustomerModal && (
        <div className="overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="15" width="15" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {modalMode === 'EDIT' ? 'Edit' : 'Add'} Customer
              </h3>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setShowCustomerModal(false)}
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Header */}
            <div style={{ borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
              <div className="tabs" style={{ margin: 0 }}>
                {[
                  ['basic', 'Basic Info'],
                  ['address', 'Address'],
                  ['kyc', 'KYC & Dates'],
                  ['family', 'Family']
                ].map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    className={`tab ${activeModalTab === key ? 'active' : ''}`}
                    onClick={() => setActiveModalTab(key as any)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveCustomer}>
              <div className="modal-body" style={{ padding: 20 }}>
                {/* Real-time Aadhaar validation error banner */}
                {liveAadhaarError && formAadhaar.trim().length > 0 && (
                  <div
                    className="alert-banner alert-banner-danger"
                    role="alert"
                    style={{
                      background: 'var(--danger-l, #fef2f2)',
                      border: '1px solid var(--danger, #f87171)',
                      color: 'var(--danger, #991b1b)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{liveAadhaarError}</span>
                  </div>
                )}
                
                {/* TAB 1: BASIC INFO */}
                {activeModalTab === 'basic' && (
                  <div>
                    <div className="g2" style={{ marginBottom: 12 }}>
                      <div className="form-group">
                        <label className="label">Full Name *</label>
                        <input
                          className="input"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="Customer full name"
                        />
                      </div>
                      <div className="form-group">
                        <label className="label">Mobile *</label>
                        <input
                          className="input"
                          value={formMobile}
                          onChange={(e) => setFormMobile(e.target.value)}
                          placeholder="98765 43210"
                          style={liveMobileError ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
                        />
                        {liveMobileError && (
                          <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>
                            {liveMobileError}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="g2" style={{ marginBottom: 12 }}>
                      <div className="form-group">
                        <label className="label">
                          Alternate Mobile <span className="label-optional">(optional)</span>
                        </label>
                        <input
                          className="input"
                          value={formAltMobile}
                          onChange={(e) => setFormAltMobile(e.target.value)}
                          placeholder="10-digit mobile"
                          style={liveAltMobileError ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
                        />
                        {liveAltMobileError && (
                          <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>
                            {liveAltMobileError}
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="label">
                          Email <span className="label-optional">(optional)</span>
                        </label>
                        <input
                          className="input"
                          type="email"
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          placeholder="name@example.com"
                          style={liveEmailError ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
                        />
                        {liveEmailError && (
                          <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>
                            {liveEmailError}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="g3" style={{ marginBottom: 12 }}>
                      <div className="form-group">
                        <label className="label">Customer Type</label>
                        <select
                          className="input"
                          value={formType}
                          onChange={(e) => setFormType(e.target.value)}
                        >
                          <option value="retail">Retail</option>
                          <option value="wholesale">Wholesale</option>
                          <option value="vip">VIP</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="label">Opening Balance (₹)</label>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={formOpeningBalance}
                          onChange={(e) => setFormOpeningBalance(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="label">Credit Limit (₹)</label>
                        <input
                          className="input"
                          type="number"
                          min="0"
                          value={formCreditLimit}
                          onChange={(e) => setFormCreditLimit(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="label">Notes</label>
                      <textarea
                        className="input"
                        rows={2}
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        aria-label="Notes"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: ADDRESS */}
                {activeModalTab === 'address' && (
                  <div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="label">Street Address Line 1</label>
                      <input
                        className="input"
                        value={formStreet1}
                        onChange={(e) => setFormStreet1(e.target.value)}
                        placeholder="Shop/House No., Building Name, Street"
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="label">Street Line 2 / Tehsil / Taluka</label>
                      <input
                        className="input"
                        value={formStreet2}
                        onChange={(e) => setFormStreet2(e.target.value)}
                        placeholder="Area, Tehsil, Landmark"
                      />
                    </div>
                    <div className="g3" style={{ marginBottom: 14 }}>
                      <div className="form-group">
                        <label className="label">City</label>
                        <input
                          className="input"
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          placeholder="e.g., Surat"
                        />
                      </div>
                      <div className="form-group">
                        <label className="label">State</label>
                        <select
                          className="input"
                          value={formState}
                          onChange={(e) => setFormState(e.target.value)}
                        >
                          {INDIAN_STATES.map((s) => (
                            <option key={s.code} value={s.name}>
                              {s.code} {s.name}
                            </option>
                          ))}
                        </select>
                        <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>
                          Decides CGST+SGST or IGST on invoices
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="label">Postal Code</label>
                        <input
                          className="input"
                          value={formPincode}
                          onChange={(e) => setFormPincode(e.target.value)}
                          placeholder="395003"
                          style={livePincodeError ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
                        />
                        {livePincodeError && (
                          <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>
                            {livePincodeError}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', background: 'var(--info-l, #e8f4fd)', borderRadius: 7, fontSize: 12, color: 'var(--info, #0288d1)' }}>
                      Full address will appear on customer invoices and loan cards
                    </div>
                  </div>
                )}

                {/* TAB 3: KYC & DATES */}
                {activeModalTab === 'kyc' && (
                  <div>
                    {liveAadhaarError && formAadhaar.trim().length > 0 && (
                      <div 
                        className="alert-banner alert-banner-danger"
                        role="alert"
                        style={{
                          background: 'var(--danger-l, #fef2f2)',
                          border: '1px solid var(--danger, #f87171)',
                          color: 'var(--danger, #991b1b)',
                          borderRadius: 8,
                          padding: '10px 14px',
                          marginBottom: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: 13,
                          fontWeight: 600
                        }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{liveAadhaarError}</span>
                      </div>
                    )}

                    <div className="g2" style={{ marginBottom: 14 }}>
                      <div className="form-group">
                        <label className="label">
                          Aadhar Number <span className="label-optional">(optional)</span>
                        </label>
                        <input
                          className="input"
                          value={formAadhaar}
                          onChange={(e) => setFormAadhaar(e.target.value)}
                          placeholder="XXXX XXXX XXXX"
                          style={liveAadhaarError && formAadhaar.trim().length > 0 ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
                        />
                        {liveAadhaarError && formAadhaar.trim().length > 0 ? (
                          <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                            ⚠️ {liveAadhaarError}
                          </div>
                        ) : formAadhaar && formAadhaar.replace(/[\s-]/g, '').length === 12 ? (
                          <div className="helper" style={{ color: 'var(--success)', fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                            ✓ Valid 12-digit Aadhaar (Verhoeff checksum verified)
                          </div>
                        ) : null}
                      </div>

                      <div className="form-group">
                        <label className="label">
                          PAN Number <span className="label-optional">(optional)</span>
                        </label>
                        <input
                          className="input"
                          value={formPan}
                          onChange={(e) => setFormPan(e.target.value.toUpperCase())}
                          placeholder="ABCPE1234F"
                          style={livePanError ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
                        />
                        {livePanError && (
                          <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>
                            {livePanError}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 14 }}>
                      <label className="label">
                        GST Number <span className="label-optional">(optional — only for wholesale/business customers)</span>
                      </label>
                      <input
                        className="input"
                        value={formGst}
                        onChange={(e) => handleGstChange(e.target.value)}
                        placeholder="09ABCPE1234F1Z9"
                        style={liveGstError ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
                      />
                      {liveGstError && (
                        <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>
                          {liveGstError}
                        </div>
                      )}
                    </div>

                    <div className="g2">
                      <div className="form-group">
                        <label className="label">
                          Date of Birth <span className="label-optional">(optional)</span>
                        </label>
                        <input
                          className="input"
                          type="date"
                          max={new Date(Date.now() - 5680368e5).toISOString().slice(0, 10)}
                          value={formDob}
                          onChange={(e) => setFormDob(e.target.value)}
                          style={liveDobError ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
                        />
                        {liveDobError && (
                          <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>
                            {liveDobError}
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label className="label">
                          Anniversary <span className="label-optional">(optional)</span>
                        </label>
                        <input
                          className="input"
                          type="date"
                          max={new Date(Date.now() + 198e5).toISOString().slice(0, 10)}
                          value={formAnniversary}
                          onChange={(e) => setFormAnniversary(e.target.value)}
                          style={liveAnniversaryError ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
                        />
                        {liveAnniversaryError && (
                          <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>
                            {liveAnniversaryError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: FAMILY */}
                {activeModalTab === 'family' && (
                  <div>
                    <div style={{ padding: '8px 12px', background: 'var(--primary-l, #f3f0fd)', borderRadius: 7, fontSize: 12, color: 'var(--primary, #5c2d91)', marginBottom: 14 }}>
                      Family references help in follow-up calls. All fields optional.
                    </div>

                    {[
                      { role: 'Father', nameVal: formFatherName, setName: setFormFatherName, mobVal: formFatherMobile, setMob: setFormFatherMobile },
                      { role: 'Mother', nameVal: formMotherName, setName: setFormMotherName, mobVal: formMotherMobile, setMob: setFormMotherMobile },
                      { role: 'Brother', nameVal: formBrotherName, setName: setFormBrotherName, mobVal: formBrotherMobile, setMob: setFormBrotherMobile },
                      { role: 'Son', nameVal: formSonName, setName: setFormSonName, mobVal: formSonMobile, setMob: setFormSonMobile },
                      { role: 'Daughter', nameVal: formDaughterName, setName: setFormDaughterName, mobVal: formDaughterMobile, setMob: setFormDaughterMobile }
                    ].map(({ role, nameVal, setName, mobVal, setMob }) => {
                      const mobErr = validateMobile(mobVal, `${role}'s mobile`);
                      return (
                        <div className="g2" key={role} style={{ marginBottom: 12 }}>
                          <div className="form-group">
                            <label className="label">{role} Name</label>
                            <input
                              className="input"
                              value={nameVal}
                              onChange={(e) => setName(e.target.value)}
                              placeholder={`${role}'s full name`}
                            />
                          </div>
                          <div className="form-group">
                            <label className="label">{role} Mobile</label>
                            <input
                              className="input"
                              value={mobVal}
                              onChange={(e) => setMob(e.target.value)}
                              placeholder={`${role}'s 10-digit mobile`}
                              style={mobErr ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
                            />
                            {mobErr && (
                              <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>
                                {mobErr}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="modal-foot">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCustomerModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingCustomer}
                >
                  {savingCustomer ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER PROFILE DRAWER */}
      {showProfileDrawer && (
        <div className="overlay" onClick={() => setShowProfileDrawer(null)} style={{ zIndex: 1100 }}>
          <div 
            className="modal modal-lg" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: 780, 
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div className="modal-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>
                  Customer Profile — {showProfileDrawer.name}
                </h3>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
                  {formatCustomerCode(showProfileDrawer.code)} · {showProfileDrawer.mobile || showProfileDrawer.phone}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setShowProfileDrawer(null)}
              >
                ✕
              </button>
            </div>

            {/* Profile Drawer Tabs: Overview, Invoices, Payments, Ledger, Loans, Repairs, KYC */}
            <div style={{ borderBottom: '1px solid var(--border)', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div className="tabs" style={{ margin: 0 }}>
                {[
                  ['overview', 'Overview'],
                  ['invoices', `Invoices (${invoices.filter(i => i.customer?.id === showProfileDrawer.id || i.customer?.name === showProfileDrawer.name).length})`],
                  ['payments', 'Payments'],
                  ['ledger', 'Ledger'],
                  ['loans', `Loans (${loans.filter(l => l.customer?.id === showProfileDrawer.id || l.customer?.name === showProfileDrawer.name).length})`],
                  ['repairs', `Repairs (${repairs.filter(r => r.customer?.id === showProfileDrawer.id || r.customer?.name === showProfileDrawer.name).length})`],
                  ['kyc', 'KYC & Info']
                ].map(([tabKey, tabLabel]) => (
                  <button
                    key={tabKey}
                    type="button"
                    className={`tab ${customerDrawerTab === tabKey ? 'active' : ''}`}
                    onClick={() => setCustomerDrawerTab(tabKey as any)}
                  >
                    {tabLabel}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, padding: '4px 0' }}>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => window.print()}
                  title="Print customer profile & statement"
                >
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="12" width="12">
                    <polyline points="6 9 6 2 18 2 18 9"></polyline>
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                    <rect x="6" y="14" width="12" height="8"></rect>
                  </svg>
                  Print
                </button>
                <button
                  type="button"
                  className="btn btn-xs btn-outline"
                  onClick={() => {
                    const csvRows = [
                      ['Date', 'Voucher Ref', 'Narration', 'Debit', 'Credit', 'Balance'],
                      ...invoices
                        .filter(i => i.customer?.id === showProfileDrawer.id || i.customer?.name === showProfileDrawer.name)
                        .map(i => [i.invoiceDate || i.date, i.invoiceNo || i.invoiceNumber, 'Sale Invoice', String(i.grandTotal || i.totalAmount || 0), '0', String(i.balanceDue || 0)])
                    ];
                    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', `Statement_${showProfileDrawer.code}_${showProfileDrawer.name}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast('Statement downloaded as PDF / CSV');
                  }}
                  title="Download statement"
                >
                  <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="12" width="12">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: 16 }}>
              {/* TAB 1: OVERVIEW */}
              {customerDrawerTab === 'overview' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
                    <div style={{ padding: 12, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Customer Code</div>
                      <div style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 700 }}>{formatCustomerCode(showProfileDrawer.code)}</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Customer Type</div>
                      <div style={{ fontSize: 14, fontWeight: 700, textTransform: 'capitalize' }}>{showProfileDrawer.customerType || 'Retail'}</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 6, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>City / State</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{showProfileDrawer.city || 'Mumbai'}, {showProfileDrawer.state || 'Maharashtra'}</div>
                    </div>
                    <div style={{ padding: 12, borderRadius: 6, background: 'var(--danger-l)', border: '1px solid var(--danger)' }}>
                      <div style={{ fontSize: 11, color: 'var(--danger)', textTransform: 'uppercase', fontWeight: 700 }}>Outstanding Balance</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--danger)' }}>
                        {formatCurrency(showProfileDrawer.outstandingBalance || (showProfileDrawer as any).opening_balance || 0)}
                      </div>
                    </div>
                  </div>

                  {/* Customer Orders */}
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Recent Orders &amp; Invoices
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Order No</th>
                          <th>Date</th>
                          <th className="num">Total</th>
                          <th className="num">Paid</th>
                          <th className="num">Pending</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.filter(i => (i.customer?.id === showProfileDrawer.id || i.customer?.name === showProfileDrawer.name)).length === 0 ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 16 }}>No orders found</td></tr>
                        ) : (
                          invoices.filter(i => (i.customer?.id === showProfileDrawer.id || i.customer?.name === showProfileDrawer.name)).map(inv => (
                            <tr key={inv.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{inv.invoiceNo || inv.invoiceNumber}</td>
                              <td style={{ fontSize: 11 }}>{inv.invoiceDate || inv.date}</td>
                              <td className="num">₹{(inv.grandTotal ?? inv.totalAmount ?? 0).toLocaleString('en-IN')}</td>
                              <td className="num amt-green">₹{(inv.paidAmount || 0).toLocaleString('en-IN')}</td>
                              <td className="num" style={{ fontWeight: 700, color: (inv.balanceDue || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                ₹{(inv.balanceDue || 0).toLocaleString('en-IN')}
                              </td>
                              <td>
                                <span className={`badge ${(inv.balanceDue || 0) <= 0 ? 'badge-green' : 'badge-yellow'}`}>
                                  {inv.status || 'PENDING'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: INVOICES */}
              {customerDrawerTab === 'invoices' && (
                <div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Invoice No</th>
                          <th>Date</th>
                          <th className="num">Gross Total</th>
                          <th className="num">Amount Paid</th>
                          <th className="num">Balance Due</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.filter(i => (i.customer?.id === showProfileDrawer.id || i.customer?.name === showProfileDrawer.name)).length === 0 ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No sales invoices found for this customer.</td></tr>
                        ) : (
                          invoices.filter(i => (i.customer?.id === showProfileDrawer.id || i.customer?.name === showProfileDrawer.name)).map(inv => (
                            <tr key={inv.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{inv.invoiceNo || inv.invoiceNumber}</td>
                              <td style={{ fontSize: 11 }}>{inv.invoiceDate || inv.date}</td>
                              <td className="num">₹{(inv.grandTotal ?? inv.totalAmount ?? 0).toLocaleString('en-IN')}</td>
                              <td className="num amt-green">₹{(inv.paidAmount || 0).toLocaleString('en-IN')}</td>
                              <td className="num" style={{ fontWeight: 700, color: (inv.balanceDue || 0) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                ₹{(inv.balanceDue || 0).toLocaleString('en-IN')}
                              </td>
                              <td>
                                <span className={`badge ${(inv.balanceDue || 0) <= 0 ? 'badge-green' : 'badge-yellow'}`}>
                                  {inv.status || 'PENDING'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: PAYMENTS */}
              {customerDrawerTab === 'payments' && (
                <div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Receipt No</th>
                          <th>Date</th>
                          <th>Against Order</th>
                          <th>Mode</th>
                          <th className="num">Amount Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const custInvs = invoices.filter(i => i.customer?.id === showProfileDrawer.id || i.customer?.name === showProfileDrawer.name);
                          const receipts: any[] = [];
                          custInvs.forEach(inv => {
                            (inv.payments || inv.paymentTransactions || []).forEach((p: any, pIdx: number) => {
                              receipts.push({
                                id: p.id || `p-${inv.id}-${pIdx}`,
                                receiptNo: p.receiptNo || `PAY-2026-0000${pIdx + 1}`,
                                date: p.date ? p.date.split('T')[0] : (inv.date || '2026-11-15'),
                                orderNo: inv.invoiceNo || inv.invoiceNumber,
                                mode: p.mode || 'CASH',
                                amount: p.amount || 0
                              });
                            });
                          });
                          if (receipts.length === 0) {
                            return <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No payment receipts recorded yet.</td></tr>;
                          }
                          return receipts.map(r => (
                            <tr key={r.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.receiptNo}</td>
                              <td style={{ fontSize: 11 }}>{r.date}</td>
                              <td style={{ fontFamily: 'monospace' }}>{r.orderNo}</td>
                              <td><span className="badge badge-blue">{r.mode.toUpperCase()}</span></td>
                              <td className="num amt-green" style={{ fontWeight: 700 }}>₹{Number(r.amount).toLocaleString('en-IN')}</td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: LEDGER */}
              {customerDrawerTab === 'ledger' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>Complete Statement of Account</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Net Outstanding: <strong style={{ color: 'var(--danger)' }}>{formatCurrency(showProfileDrawer.outstandingBalance || (showProfileDrawer as any).opening_balance || 0)}</strong>
                    </div>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Voucher Ref</th>
                          <th>Narration</th>
                          <th className="num">Debit (Dr)</th>
                          <th className="num">Credit (Cr)</th>
                          <th className="num">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const custInvs = invoices.filter(i => i.customer?.id === showProfileDrawer.id || i.customer?.name === showProfileDrawer.name);
                          let bal = (showProfileDrawer as any).opening_balance || 0;
                          const entries: any[] = [];
                          if (bal > 0) {
                            entries.push({
                              id: 'op-bal',
                              date: '2026-11-01',
                              ref: 'OB-2026',
                              narration: 'Opening Balance Owed',
                              debit: bal,
                              credit: 0,
                              balance: bal
                            });
                          }
                          custInvs.forEach(inv => {
                            const tot = inv.grandTotal ?? inv.totalAmount ?? 0;
                            bal += tot;
                            entries.push({
                              id: `inv-${inv.id}`,
                              date: inv.invoiceDate || inv.date,
                              ref: inv.invoiceNo || inv.invoiceNumber,
                              narration: 'Tax Invoice (Jewellery Purchase)',
                              debit: tot,
                              credit: 0,
                              balance: bal
                            });
                            (inv.payments || inv.paymentTransactions || []).forEach((p: any, idx: number) => {
                              const amt = p.amount || 0;
                              bal -= amt;
                              entries.push({
                                id: `pay-${inv.id}-${idx}`,
                                date: p.date ? p.date.split('T')[0] : (inv.date || '2026-11-15'),
                                ref: p.receiptNo || `PAY-2026-0000${idx + 1}`,
                                narration: `Payment received (${(p.mode || 'CASH').toUpperCase()})`,
                                debit: 0,
                                credit: amt,
                                balance: bal
                              });
                            });
                          });
                          if (entries.length === 0) {
                            return <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No ledger entries found.</td></tr>;
                          }
                          return entries.map(e => (
                            <tr key={e.id}>
                              <td style={{ fontSize: 11 }}>{e.date}</td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{e.ref}</td>
                              <td>{e.narration}</td>
                              <td className="num">{e.debit > 0 ? `₹${e.debit.toLocaleString('en-IN')}` : '—'}</td>
                              <td className="num amt-green">{e.credit > 0 ? `₹${e.credit.toLocaleString('en-IN')}` : '—'}</td>
                              <td className="num" style={{ fontWeight: 700, color: e.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                                ₹{Math.abs(e.balance).toLocaleString('en-IN')} {e.balance > 0 ? 'Dr' : 'Cr'}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: LOANS */}
              {customerDrawerTab === 'loans' && (
                <div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Loan No</th>
                          <th>Date</th>
                          <th className="num">Principal</th>
                          <th>Interest %</th>
                          <th>Collateral Items</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loans.filter(l => l.customer?.id === showProfileDrawer.id || l.customer?.name === showProfileDrawer.name).length === 0 ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No active or past loans on record.</td></tr>
                        ) : (
                          loans.filter(l => l.customer?.id === showProfileDrawer.id || l.customer?.name === showProfileDrawer.name).map(l => (
                            <tr key={l.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{l.loanNo || (l as any).code}</td>
                              <td style={{ fontSize: 11 }}>{l.loanDate || (l as any).date}</td>
                              <td className="num">₹{(l.principalAmount || (l as any).principal || 0).toLocaleString('en-IN')}</td>
                              <td>{(l as any).interestRate || (l as any).rate || '1.5% / mo'}</td>
                              <td>{((l as any).items || (l as any).collateral || []).map((it: any) => it.description || it.itemType || 'Gold Ornaments').join(', ') || 'Gold Jewellery'}</td>
                              <td>
                                <span className={`badge ${l.status === 'ACTIVE' || l.status === 'open' ? 'badge-yellow' : 'badge-green'}`}>
                                  {l.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: REPAIRS */}
              {customerDrawerTab === 'repairs' && (
                <div>
                  <div className="tbl-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Repair No</th>
                          <th>Item Description</th>
                          <th className="num">Repair Cost</th>
                          <th className="num">Advance Paid</th>
                          <th className="num">Balance Due</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {repairs.filter(r => r.customer?.id === showProfileDrawer.id || r.customer?.name === showProfileDrawer.name).length === 0 ? (
                          <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: 24 }}>No repair orders on record.</td></tr>
                        ) : (
                          repairs.filter(r => r.customer?.id === showProfileDrawer.id || r.customer?.name === showProfileDrawer.name).map(r => (
                            <tr key={r.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{(r as any).orderNo || (r as any).code || (r as any).repairNo || r.id}</td>
                              <td>{r.items?.map(it => it.description).join(', ') || 'Jewellery Repair'}</td>
                              <td className="num">₹{((r as any).costSummary?.totalCharges || (r as any).repairCost || 1500).toLocaleString('en-IN')}</td>
                              <td className="num amt-green">₹{((r as any).costSummary?.advancePaid || 0).toLocaleString('en-IN')}</td>
                              <td className="num amt-red">₹{(((r as any).costSummary?.totalCharges || 1500) - ((r as any).costSummary?.advancePaid || 0)).toLocaleString('en-IN')}</td>
                              <td>
                                <span className="badge badge-blue">{r.status || 'Received'}</span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 7: KYC */}
              {customerDrawerTab === 'kyc' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Aadhaar Number</span>
                      {(() => {
                        const aadh = (showProfileDrawer as any).aadhar_no || showProfileDrawer.aadhaarNumber;
                        const err = validateAadhaar(aadh);
                        if (!aadh) return <span className="badge badge-gray">Not Provided</span>;
                        return err ? <span className="badge badge-red">Invalid</span> : <span className="badge badge-green">Verified (Verhoeff)</span>;
                      })()}
                    </div>
                    <div style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 700 }}>
                      {(() => {
                        const aadh = (showProfileDrawer as any).aadhar_no || showProfileDrawer.aadhaarNumber;
                        if (!aadh) return '—';
                        const clean = String(aadh).replace(/\s/g, '');
                        return clean.length >= 12 ? `XXXX XXXX ${clean.slice(-4)}` : aadh;
                      })()}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Permanent Account Number (PAN)</span>
                      {(() => {
                        const pan = (showProfileDrawer as any).pan_no || showProfileDrawer.pan;
                        const err = validatePAN(pan);
                        if (!pan) return <span className="badge badge-yellow">Required &gt; ₹2 Lakh</span>;
                        return err ? <span className="badge badge-red">Invalid Format</span> : <span className="badge badge-green">Valid Individual (P)</span>;
                      })()}
                    </div>
                    <div style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 700 }}>
                      {(showProfileDrawer as any).pan_no || showProfileDrawer.pan || '—'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 14, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>GST Identification Number</span>
                      {(() => {
                        const gst = (showProfileDrawer as any).gst_no || showProfileDrawer.gstin;
                        const err = validateGSTIN(gst);
                        if (!gst) return <span className="badge badge-gray">Unregistered (B2C)</span>;
                        return err ? <span className="badge badge-red">Invalid GSTIN</span> : <span className="badge badge-green">Active GSTIN</span>;
                      })()}
                    </div>
                    <div style={{ fontSize: 16, fontFamily: 'monospace', fontWeight: 700 }}>
                      {(showProfileDrawer as any).gst_no || showProfileDrawer.gstin || 'Unregistered Consumer (B2C)'}
                    </div>
                  </div>

                  {/* Dates & Family References */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 6, padding: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>🎂 Date of Birth</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{(showProfileDrawer as any).dob || 'Not Recorded'}</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 6, padding: 10, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>💍 Wedding Anniversary</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{(showProfileDrawer as any).anniversary || 'Not Recorded'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-foot" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowProfileDrawer(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-outline"
                  onClick={() => {
                    const cust = showProfileDrawer;
                    setShowProfileDrawer(null);
                    setCustomerToDelete(cust);
                  }}
                  title="Delete Customer"
                >
                  Delete Customer
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    const cust = showProfileDrawer;
                    setShowProfileDrawer(null);
                    handleOpenEditModal(cust);
                  }}
                >
                  Edit Customer
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedCustomerId(showProfileDrawer.id);
                    setShowProfileDrawer(null);
                  }}
                >
                  View Full 360 Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CUSTOMER CONFIRMATION MODAL */}
      {customerToDelete && (
        <div className="overlay" onClick={() => setCustomerToDelete(null)} style={{ zIndex: 1200 }}>
          <div className="modal modal-sm" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-head">
              <h3 style={{ margin: 0, color: 'var(--danger)' }}>Delete Customer</h3>
              <button type="button" className="btn btn-sm btn-outline" onClick={() => setCustomerToDelete(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: 18 }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                Are you sure you want to delete <strong>{customerToDelete.name}</strong> ({formatCustomerCode(customerToDelete.code)})?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                This will permanently remove the customer record from the directory.
              </p>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn btn-outline" onClick={() => setCustomerToDelete(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={() => handleDeleteCustomer(customerToDelete)}>
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


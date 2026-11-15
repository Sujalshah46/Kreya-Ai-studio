import React from 'react';
import { SyncDatabaseView } from './SyncDatabaseView';
import { DailyRates, StoreProfile, Customer, InventoryItem, SalesInvoice, GirviLoan, RepairOrder, SavingScheme } from '../../types';

interface BackupSettingsViewProps {
  store: StoreProfile;
  rates?: DailyRates;
  customers: Customer[];
  inventory: InventoryItem[];
  invoices: SalesInvoice[];
  loans: GirviLoan[];
  repairs: RepairOrder[];
  schemes: SavingScheme[];
  onNavigate?: (module: string) => void;
  onUpdateRates?: (rates: DailyRates) => void;
}

export const BackupSettingsView: React.FC<BackupSettingsViewProps> = (props) => {
  return <SyncDatabaseView defaultTab="backup" {...props} />;
};

export default BackupSettingsView;

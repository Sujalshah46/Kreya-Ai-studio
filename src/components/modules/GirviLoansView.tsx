import React from 'react';
import { LoansView } from './LoansView';
import { mockLoans, mockCustomers, mockDailyRates, mockStore } from '../../data/mockData';
import type { GirviLoan, Customer, DailyRates, StoreProfile } from '../../types';

export interface GirviLoansViewProps {
  store?: StoreProfile;
  loans?: GirviLoan[];
  customers?: Customer[];
  rates?: DailyRates;
  onSaveLoan?: (loan: GirviLoan) => void;
  onAddLoan?: (loan: GirviLoan) => void;
  onUpdateLoan?: (loan: GirviLoan) => void;
}

export const GirviLoansView: React.FC<GirviLoansViewProps> = (props) => {
  const store = props.store || mockStore;
  const loans = props.loans || mockLoans;
  const customers = props.customers || mockCustomers;
  const onSave = props.onSaveLoan || props.onAddLoan || (() => {});

  return (
    <LoansView
      store={store}
      loans={loans}
      customers={customers}
      onSaveLoan={onSave}
      onAddLoan={props.onAddLoan}
      onUpdateLoan={props.onUpdateLoan}
      rates={props.rates || mockDailyRates}
    />
  );
};

export default GirviLoansView;

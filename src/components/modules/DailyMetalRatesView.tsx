import React, { useState, useEffect, useCallback } from 'react';
import { DailyRates, StoreProfile } from '../../types';

interface DailyMetalRatesViewProps {
  store: StoreProfile;
  rates: DailyRates;
  onUpdateRates: (rates: DailyRates) => void;
}

export interface RateHistoryEntry {
  id: string;
  rate_date: string;
  gold_24k?: number | string;
  gold_22k?: number | string;
  gold_18k?: number | string;
  gold_14k?: number | string;
  silver?: number | string;
  platinum?: number | string;
  notes?: string;
  updatedBy?: string;
}

interface SplitConfig {
  rateAutoFill: boolean;
  rate22Pct: number;
  rate18Pct: number;
  rate14Pct: number;
  rateRoundTo: number;
}

// Today's date in IST (UTC+5:30) matching live app ck()
const getTodayIST = (): string => new Date(Date.now() + 198e5).toISOString().slice(0, 10);

const METAL_KEYS: [string, string][] = [
  ['gold_24k', 'Gold 24K'],
  ['gold_22k', 'Gold 22K'],
  ['gold_18k', 'Gold 18K'],
  ['gold_14k', 'Gold 14K'],
  ['silver', 'Silver'],
  ['platinum', 'Platinum']
];

type KaratRuleKey = 'rate22Pct' | 'rate18Pct' | 'rate14Pct';

const KARAT_RULES: [string, KaratRuleKey, string][] = [
  ['gold_22k', 'rate22Pct', '22K'],
  ['gold_18k', 'rate18Pct', '18K'],
  ['gold_14k', 'rate14Pct', '14K']
];

const DEFAULT_CONFIG: SplitConfig = {
  rateAutoFill: true,
  rate22Pct: 91.6,
  rate18Pct: 75.0,
  rate14Pct: 58.5,
  rateRoundTo: 1
};

// Exact calculation helper mk matching live app
const calculateRate = (base: string | number, pct: string | number, roundTo: string | number = 1): string => {
  const r = Number(base);
  const a = Number(pct);
  const i = Number(roundTo) || 1;
  return r > 0 && a > 0 ? String(Math.round((r * a) / 100 / i) * i) : '';
};

// Format date helper matching re()
const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const DailyMetalRatesView: React.FC<DailyMetalRatesViewProps> = ({
  rates,
  onUpdateRates
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayIST());
  const [ratesForm, setRatesForm] = useState<Record<string, string>>({
    gold_24k: '',
    gold_22k: '',
    gold_18k: '',
    gold_14k: '',
    silver: '',
    platinum: ''
  });
  const [notes, setNotes] = useState<string>('');
  const [handTyped, setHandTyped] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto Split Config
  const [config, setConfig] = useState<SplitConfig>(DEFAULT_CONFIG);
  const [editConfigModal, setEditConfigModal] = useState<SplitConfig | null>(null);

  // Rate history initial state - default empty matching production database dump
  const [rateHistory, setRateHistory] = useState<RateHistoryEntry[]>([]);

  // Pager state
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Helper to compute auto-rate for karat
  const getAutoRate = useCallback((karatKey: string, base24k: string) => {
    const rule = KARAT_RULES.find(([k]) => k === karatKey);
    return rule ? calculateRate(base24k, config[rule[1]], config.rateRoundTo) : '';
  }, [config]);

  // Handle rate input change
  const handleRateChange = (key: string, value: string) => {
    if (key === 'gold_24k' && config.rateAutoFill) {
      setRatesForm(prev => {
        const next: Record<string, string> = { ...prev, gold_24k: value };
        for (const [k] of KARAT_RULES) {
          if (!handTyped[k]) {
            next[k] = getAutoRate(k, value);
          }
        }
        return next;
      });
      setErrors(prev => ({
        ...prev,
        gold_24k: undefined,
        gold_22k: undefined,
        gold_18k: undefined,
        gold_14k: undefined
      }));
      return;
    }

    if (KARAT_RULES.some(([k]) => k === key)) {
      setHandTyped(prev => ({ ...prev, [key]: true }));
    }
    setRatesForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  // Reset karat back to formula
  const handleResetToAuto = (karatKey: string) => {
    setHandTyped(prev => ({ ...prev, [karatKey]: false }));
    setRatesForm(prev => ({
      ...prev,
      [karatKey]: getAutoRate(karatKey, prev.gold_24k)
    }));
  };

  // Check if date already exists in history
  const existingEntry = rateHistory.find(
    e => String(e.rate_date).slice(0, 10) === selectedDate
  );

  // Save rates
  const handleSaveRates = async () => {
    const validationErrors: Record<string, string> = {};
    const today = getTodayIST();

    if (!selectedDate) {
      validationErrors.rate_date = 'Pick a date';
    } else if (selectedDate > today) {
      validationErrors.rate_date = 'Rates cannot be saved for a future date';
    }

    for (const [key, label] of METAL_KEYS) {
      const val = ratesForm[key];
      if (val !== '' && (isNaN(Number(val)) || Number(val) < 0)) {
        validationErrors[key] = `${label} cannot be negative`;
      }
    }

    if (!Object.keys(validationErrors).length && METAL_KEYS.every(([k]) => ratesForm[k] === '' || Number(ratesForm[k]) === 0)) {
      validationErrors.gold_22k = 'Enter at least one rate';
    }

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      alert(Object.values(validationErrors)[0]);
      return;
    }

    // Price spike check if significantly different from previous
    const g24 = Number(ratesForm.gold_24k) || 0;
    if (g24 > 0 && rateHistory.length > 0) {
      const lastG24 = Number(rateHistory[0].gold_24k) || 0;
      if (lastG24 > 0 && Math.abs(g24 - lastG24) / lastG24 > 0.25) {
        if (!window.confirm(`Please check these rates before saving:\n\n• Gold 24K rate (₹${g24.toLocaleString('en-IN')}) differs significantly from previous rate (₹${lastG24.toLocaleString('en-IN')}).\n\nSave anyway?`)) {
          return;
        }
      }
    }

    setSaving(true);
    try {
      const g24Num = Number(ratesForm.gold_24k) || 0;
      const g22Num = Number(ratesForm.gold_22k) || 0;
      const g18Num = Number(ratesForm.gold_18k) || 0;
      const g14Num = Number(ratesForm.gold_14k) || 0;
      const silNum = Number(ratesForm.silver) || 0;
      const platNum = Number(ratesForm.platinum) || 0;

      const updatedRates: DailyRates = {
        date: selectedDate,
        gold24kPerGram: g24Num / 10,
        gold22kPerGram: g22Num / 10,
        gold18kPerGram: g18Num / 10,
        gold14kPerGram: g14Num / 10,
        gold24kPer10g: g24Num,
        silverPerGram: silNum / 10,
        silverPer10g: silNum,
        silverPerKg: silNum * 100,
        platinumPerGram: platNum / 10
      };

      onUpdateRates(updatedRates);

      const newEntry: RateHistoryEntry = {
        id: existingEntry ? existingEntry.id : `rate-${Date.now()}`,
        rate_date: selectedDate,
        gold_24k: g24Num || undefined,
        gold_22k: g22Num || undefined,
        gold_18k: g18Num || undefined,
        gold_14k: g14Num || undefined,
        silver: silNum || undefined,
        platinum: platNum || undefined,
        notes: notes || undefined,
        updatedBy: 'Admin'
      };

      setRateHistory(prev => {
        const filtered = prev.filter(e => String(e.rate_date).slice(0, 10) !== selectedDate);
        return [newEntry, ...filtered];
      });

      setSuccessMsg(existingEntry ? 'Rates updated successfully!' : 'Rates saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      alert('Error saving rates');
    } finally {
      setSaving(false);
    }
  };

  // Load entry into form for editing
  const handleEditEntry = (entry: RateHistoryEntry) => {
    setSelectedDate(String(entry.rate_date).slice(0, 10));
    const nextForm: Record<string, string> = {};
    for (const [k] of METAL_KEYS) {
      const val = (entry as any)[k];
      nextForm[k] = val != null ? String(Number(val)) : '';
    }
    const nextHandTyped: Record<string, boolean> = {};
    for (const [k] of KARAT_RULES) {
      nextHandTyped[k] = nextForm[k] !== '' && Number(nextForm[k]) !== Number(getAutoRate(k, nextForm.gold_24k));
    }
    setRatesForm(nextForm);
    setHandTyped(nextHandTyped);
    setNotes(entry.notes || '');
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete entry
  const handleDeleteEntry = (entry: RateHistoryEntry) => {
    if (window.confirm(`Delete the rates for ${formatDateDisplay(entry.rate_date)}? Sales already made keep the rate they used.`)) {
      setRateHistory(prev => prev.filter(e => e.id !== entry.id));
      setSuccessMsg('Rate entry deleted');
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // Save split rules from modal
  const handleSaveConfig = () => {
    if (!editConfigModal) return;
    for (const [, key, label] of KARAT_RULES) {
      const val = Number(editConfigModal[key]);
      if (isNaN(val) || val < 1 || val > 100) {
        alert(`${label} % must be between 1 and 100`);
        return;
      }
    }
    setConfig(editConfigModal);
    setEditConfigModal(null);
    if (editConfigModal.rateAutoFill) {
      setRatesForm(prev => {
        const next: Record<string, string> = { ...prev };
        for (const [k, settingKey] of KARAT_RULES) {
          if (!handTyped[k]) {
            next[k] = calculateRate(prev.gold_24k, editConfigModal[settingKey] as number, editConfigModal.rateRoundTo);
          }
        }
        return next;
      });
    }
    setSuccessMsg('Auto-fill settings saved');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Render individual rate input field
  const renderRateField = (key: string, label: string) => {
    const rule = KARAT_RULES.find(([k]) => k === key);
    const isAutoCalculated = rule && config.rateAutoFill && !handTyped[key];
    const isOverridden = rule && config.rateAutoFill && handTyped[key];
    const hasError = !!errors[key];

    return (
      <div className="form-group" key={key}>
        <label className="label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
          <span>{label} (₹)</span>
          {isOverridden && (
            <button
              type="button"
              className="btn btn-xs btn-ghost"
              style={{ padding: '0 4px', height: 16, lineHeight: '16px', fontSize: 11, minHeight: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}
              onClick={() => handleResetToAuto(key)}
              title={`Go back to ${config[rule![1]]}% of 24K`}
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="10" width="10" xmlns="http://www.w3.org/2000/svg">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              Auto
            </button>
          )}
        </label>
        <input
          className="input"
          type="number"
          min="0"
          step="0.01"
          value={ratesForm[key] || ''}
          onChange={(e) => handleRateChange(key, e.target.value)}
          style={{
            ...(hasError ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}),
            ...(isAutoCalculated && ratesForm[key] !== '' ? { background: 'var(--primary-xl, #f4f8f6)' } : {})
          }}
          aria-invalid={hasError}
        />
        {hasError ? (
          <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>
            {errors[key]}
          </div>
        ) : isOverridden ? (
          <div className="helper" style={{ fontSize: 11, marginTop: 4, color: 'var(--gold)' }}>
            Typed by hand
          </div>
        ) : rule && config.rateAutoFill ? (
          <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>
            Auto: {config[rule[1]]}% of 24K — type to change
          </div>
        ) : key === 'gold_24k' && config.rateAutoFill ? (
          <div className="helper" style={{ fontSize: 11, marginTop: 4 }}>
            Fills 22K, 18K and 14K
          </div>
        ) : null}
      </div>
    );
  };

  // Pagination calculation
  const totalRates = rateHistory.length;
  const totalPages = Math.max(1, Math.ceil(totalRates / pageSize));
  const displayedRates = rateHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Daily Metal Rates</h1>
        </div>
      </div>

      {successMsg && (
        <div style={{ padding: '10px 16px', background: 'var(--success-l, #edf7ed)', color: 'var(--success, #2e7d32)', borderRadius: 8, marginBottom: 14, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>✓ {successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* Main Rates Form Card */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div
            className="section-divider"
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 3, height: 14, background: 'var(--primary)', borderRadius: 2, display: 'inline-block' }}></span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-muted)' }}>
                ENTER RATES (PER 10 G — SILVER TOO). LEAVE A BOX EMPTY IF YOU DON'T DEAL IN IT.
              </span>
            </div>
            <span
              className="helper"
              style={{ display: 'flex', alignItems: 'center', gap: 8, textTransform: 'none', letterSpacing: 0, margin: 0, fontSize: 12 }}
            >
              {config.rateAutoFill
                ? `Auto from 24K: 22K ${config.rate22Pct}% · 18K ${config.rate18Pct}% · 14K ${config.rate14Pct}%${Number(config.rateRoundTo) > 1 ? ` · nearest ₹${config.rateRoundTo}` : ''}`
                : 'Auto-fill from 24K is off'}
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => setEditConfigModal({ ...config })}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                Change
              </button>
            </span>
          </div>

          <div className="g4" style={{ marginBottom: 14 }}>
            <div className="form-group">
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                max={getTodayIST()}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setErrors(prev => ({ ...prev, rate_date: undefined }));
                }}
                style={errors.rate_date ? { borderColor: 'var(--danger)', background: 'var(--danger-l)' } : {}}
              />
              {errors.rate_date && (
                <div className="helper" style={{ color: 'var(--danger)', fontSize: 11, marginTop: 4 }}>
                  {errors.rate_date}
                </div>
              )}
            </div>

            {METAL_KEYS.map(([key, label]) => renderRateField(key, label))}

            <div className="form-group">
              <label className="label">
                Note <span className="label-optional">(optional)</span>
              </label>
              <input
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={300}
                
              />
            </div>
          </div>

          {existingEntry && (
            <div className="helper" style={{ marginBottom: 12, color: 'var(--gold, #b8860b)', fontWeight: 500 }}>
              Rates for this date are already saved — saving again will update them.
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveRates}
            disabled={saving}
          >
            {saving ? 'Saving...' : existingEntry ? 'Update Rates' : 'Save Rates'}
          </button>
        </div>
      </div>

      {/* Auto Split Configuration Modal */}
      {editConfigModal && (
        <div
          className="overlay"
          onClick={() => setEditConfigModal(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10, 8, 30, 0.55)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            className="card"
            style={{ maxWidth: 440, width: '100%', background: 'var(--surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Fill karat rates from 24K</h3>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => setEditConfigModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ padding: 18 }}>
              <label className="check" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={!!editConfigModal.rateAutoFill}
                  onChange={(e) => setEditConfigModal({ ...editConfigModal, rateAutoFill: e.target.checked })}
                />
                <span>Fill 22K, 18K and 14K when the 24K rate is typed</span>
              </label>

              <div className="g3" style={{ marginBottom: 14 }}>
                {KARAT_RULES.map(([, settingKey, label]) => (
                  <div className="form-group" key={settingKey}>
                    <label className="label">{label} = % of 24K</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      max="100"
                      step="0.01"
                      value={String(editConfigModal[settingKey])}
                      onChange={(e) => setEditConfigModal({ ...editConfigModal, [settingKey]: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                ))}
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="label">Round to</label>
                <select
                  className="input"
                  value={String(editConfigModal.rateRoundTo)}
                  onChange={(e) => setEditConfigModal({ ...editConfigModal, rateRoundTo: Number(e.target.value) || 1 })}
                >
                  <option value="1">Nearest ₹1</option>
                  <option value="10">Nearest ₹10</option>
                  <option value="100">Nearest ₹100</option>
                </select>
              </div>

              <div className="helper" style={{ fontSize: 11, lineHeight: 1.5, color: 'var(--muted)', background: 'var(--bg)', padding: '10px 12px', borderRadius: 6, marginBottom: 16 }}>
                Purity: 91.6 = 916, 75 = 750, 58.5 = 585. Use a higher % if your 22K rate includes a margin over pure gold.
                {Number(ratesForm.gold_24k) > 0 && (
                  <span style={{ display: 'block', marginTop: 4, color: 'var(--primary)', fontWeight: 600 }}>
                    With 24K at ₹{Number(ratesForm.gold_24k).toLocaleString('en-IN')}: 22K ₹{Number(calculateRate(ratesForm.gold_24k, editConfigModal.rate22Pct, editConfigModal.rateRoundTo) || 0).toLocaleString('en-IN')}, 18K ₹{Number(calculateRate(ratesForm.gold_24k, editConfigModal.rate18Pct, editConfigModal.rateRoundTo) || 0).toLocaleString('en-IN')}, 14K ₹{Number(calculateRate(ratesForm.gold_24k, editConfigModal.rate14Pct, editConfigModal.rateRoundTo) || 0).toLocaleString('en-IN')}.
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditConfigModal(null)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveConfig}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate History Card */}
      <div className="card">
        <div className="card-header" style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <span className="card-title" style={{ fontSize: 14, fontWeight: 700 }}>Rate History</span>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                {METAL_KEYS.map(([key, label]) => (
                  <th key={key}>{label}</th>
                ))}
                <th>Note</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {displayedRates.length === 0 ? (
                <tr>
                  <td colSpan={METAL_KEYS.length + 3} style={{ textAlign: 'center', color: 'var(--muted)', padding: 30 }}>
                    No rates yet
                  </td>
                </tr>
              ) : (
                displayedRates.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: 600, fontSize: 12 }}>{formatDateDisplay(entry.rate_date)}</td>
                    {METAL_KEYS.map(([key]) => {
                      const val = (entry as any)[key];
                      const isGold = key.startsWith('gold_2');
                      return (
                        <td
                          key={key}
                          className={isGold ? 'amt-gold' : undefined}
                          style={{ fontWeight: isGold ? 600 : 400 }}
                        >
                          {val != null && parseFloat(val) > 0
                            ? `₹${parseFloat(val).toLocaleString('en-IN')}`
                            : '—'}
                        </td>
                      );
                    })}
                    <td className="helper" style={{ fontSize: 11 }}>{entry.notes || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => handleEditEntry(entry)}
                        title="Edit"
                        aria-label="Edit rates"
                        style={{ marginRight: 4 }}
                      >
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="11" width="11" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline"
                        onClick={() => handleDeleteEntry(entry)}
                        title="Delete"
                        aria-label="Delete rates"
                        style={{ color: 'var(--danger)' }}
                      >
                        <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="11" width="11" xmlns="http://www.w3.org/2000/svg">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pager Footer matching live app */}
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
          <span>{totalRates} rates</span>
          {totalRates > pageSize && (<>
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
          </>)}
        </div>
      </div>
    </div>
  );
};


import { useState, useEffect, useCallback } from 'react';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import KpiBar from '../../components/ui/KpiBar';
import { P } from '../../styles/page';
import {
  getBankAccounts, createBankAccount, addBankTransaction,
  getTotalBalance, getAccountTransactions,
} from '../../api';
import {
  Plus, Building2, X, CreditCard, Download, Search,
  TrendingUp, TrendingDown, AlertTriangle, Landmark,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

// ── Utilities ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtNum = (n) => Number(n || 0).toFixed(2);

const exportCsv = (filename, headers, rows) => {
  const bom = '﻿';
  const content = [headers, ...rows]
    .map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
  toast.success('Exported');
};

const ACC_TYPES = ['CURRENT', 'SAVINGS', 'CASH', 'LOAN'];

const TXN_CATEGORIES = [
  'SALES', 'PURCHASE', 'EXPENSE', 'SALARY', 'RENT', 'UTILITY',
  'TAX', 'LOAN', 'LOAN_REPAYMENT', 'TRANSFER', 'REFUND', 'OTHER',
];

const typeColor = (t) => t === 'CREDIT' ? '#10B981' : '#EF4444';

// ── Ledger Modal ───────────────────────────────────────────────────────────────

function LedgerModal({ account, onClose }) {
  const { isMobile } = useBreakpoint();
  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [to, setTo] = useState(now.toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAccountTransactions(account.id, { from, to });
      setTxns(res.data.data || []);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [account.id, from, to]);

  useEffect(() => { load(); }, [load]);

  // Compute running balance (chronological → reverse for display)
  const chronological = [...txns].sort((a, b) => new Date(a.date) - new Date(b.date));
  let running = account.openingBalance;
  const withBalance = chronological.map(t => {
    if (t.type === 'CREDIT') running += t.amount;
    else running -= t.amount;
    return { ...t, runningBalance: running };
  });
  const ledger = withBalance.reverse();

  const filtered = ledger.filter(t => {
    if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;
    if (search && !t.description?.toLowerCase().includes(search.toLowerCase()) &&
      !t.reference?.toLowerCase().includes(search.toLowerCase()) &&
      !t.category?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalCredit = filtered.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  const totalDebit = filtered.filter(t => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);

  const doExport = () => {
    exportCsv(`ledger_${account.name}_${from}_${to}.csv`,
      ['Date', 'Description', 'Category', 'Reference', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)'],
      [
        [`Opening Balance as of ${account.openingBalance >= 0 ? '+' : ''}${fmtNum(account.openingBalance)}`, '', '', '', '', '', fmtNum(account.openingBalance)],
        ...ledger.map(t => [
          new Date(t.date).toLocaleDateString('en-IN'),
          t.description,
          t.category || '',
          t.reference || '',
          t.type === 'DEBIT' ? fmtNum(t.amount) : '',
          t.type === 'CREDIT' ? fmtNum(t.amount) : '',
          fmtNum(t.runningBalance),
        ]),
        ['TOTALS', '', '', '', fmtNum(totalDebit), fmtNum(totalCredit), fmtNum(account.currentBalance)],
      ]
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300,
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      padding: isMobile ? 0 : 16,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: isMobile ? '20px 20px 0 0' : 18,
        width: isMobile ? '100%' : '90%', maxWidth: 900,
        maxHeight: isMobile ? '95dvh' : '92vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--navy)' }}>{account.name} — Ledger</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{account.bankName} · {account.accountType} · Balance: <strong style={{ color: 'var(--navy)' }}>{fmt(account.currentBalance)}</strong></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={doExport}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #10B981', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#10B981' }}>
              <Download size={12} /> Export
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', background: '#F9FAFB' }}>
          {[['FROM', from, setFrom], ['TO', to, setTo]].map(([lbl, val, setter]) => (
            <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em' }}>{lbl}</span>
              <input type="date" value={val} onChange={e => setter(e.target.value)}
                style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, background: '#fff', width: isMobile ? 130 : 'auto' }} />
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em' }}>TYPE</span>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, background: '#fff' }}>
              <option value="ALL">All</option>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 140 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.07em' }}>SEARCH</span>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Description, category…"
                style={{ width: '100%', padding: '6px 10px 6px 28px', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13, background: '#fff', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button onClick={load}
            style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--navy)', whiteSpace: 'nowrap' }}>
            Refresh
          </button>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderBottom: '1px solid var(--border)' }}>
          {[
            { label: 'Credits', value: fmt(totalCredit), color: '#10B981' },
            { label: 'Debits', value: fmt(totalDebit), color: '#EF4444' },
            { label: 'Current Balance', value: fmt(account.currentBalance), color: 'var(--navy)' },
          ].map(({ label, value, color }, i) => (
            <div key={label} style={{ padding: '10px 16px', borderLeft: i > 0 ? '1px solid var(--border)' : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color, fontFamily: 'var(--font-display)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Ledger Table */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>Loading ledger…</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 'auto' : 600 }}>
              <thead style={{ position: 'sticky', top: 0, background: '#F9FAFB', zIndex: 1 }}>
                <tr>
                  {['Date', 'Description', 'Category', 'Reference', 'Debit', 'Credit', 'Balance'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: ['Debit', 'Credit', 'Balance'].includes(h) ? 'right' : 'left', fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Opening balance row */}
                <tr style={{ background: '#F0F9FF' }}>
                  <td style={{ padding: '8px 14px', fontSize: 12, color: '#6B7280' }}>—</td>
                  <td style={{ padding: '8px 14px', fontSize: 12, fontStyle: 'italic', color: '#6B7280' }} colSpan={3}>Opening Balance</td>
                  <td colSpan={2} style={{ padding: '8px 14px' }} />
                  <td style={{ padding: '8px 14px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{fmt(account.openingBalance)}</td>
                </tr>

                {filtered.map((t, i) => (
                  <tr key={t.id || i} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                    <td style={{ padding: '9px 14px', fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap' }}>{new Date(t.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ padding: '9px 14px', fontSize: 13, color: '#111827', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</td>
                    <td style={{ padding: '9px 14px' }}>
                      {t.category && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#F3F4F6', color: '#6B7280' }}>{t.category}</span>}
                    </td>
                    <td style={{ padding: '9px 14px', fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>{t.reference || '—'}</td>
                    <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#EF4444' }}>
                      {t.type === 'DEBIT' ? fmt(t.amount) : '—'}
                    </td>
                    <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#10B981' }}>
                      {t.type === 'CREDIT' ? fmt(t.amount) : '—'}
                    </td>
                    <td style={{ padding: '9px 14px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: t.runningBalance >= 0 ? 'var(--navy)' : '#EF4444' }}>
                      {fmt(t.runningBalance)}
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#9CA3AF', fontSize: 13 }}>No transactions for this period.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Add Account Modal ──────────────────────────────────────────────────────────

function AddAccountModal({ onClose, onCreated }) {
  const { isMobile } = useBreakpoint();
  const [form, setForm] = useState({ name: '', bankName: '', accountNumber: '', ifscCode: '', accountType: 'CURRENT', openingBalance: 0 });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.bankName) return toast.error('Account name and bank name required');
    setLoading(true);
    try { await createBankAccount(form); toast.success('Account added'); onCreated(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to create account'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 16 }}>
      <div style={{ background: '#fff', borderRadius: isMobile ? '20px 20px 0 0' : 16, width: isMobile ? '100%' : '100%', maxWidth: 500, padding: 24, maxHeight: isMobile ? '92dvh' : '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--navy)' }}>Add Bank / Loan Account</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <Input label="Account name *" placeholder="e.g. HDFC Current A/c" value={form.name} onChange={set('name')} />
            <Input label="Bank / Lender name *" placeholder="e.g. HDFC Bank" value={form.bankName} onChange={set('bankName')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <Input label="Account number" placeholder="Optional" value={form.accountNumber} onChange={set('accountNumber')} />
            <Input label="IFSC code" placeholder="Optional" value={form.ifscCode} onChange={set('ifscCode')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Account type</label>
              <select value={form.accountType} onChange={set('accountType')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                {ACC_TYPES.map(t => <option key={t} value={t}>{t === 'LOAN' ? 'LOAN (Liability Tracker)' : t}</option>)}
              </select>
              {form.accountType === 'LOAN' && (
                <div style={{ fontSize: 11, color: '#F97316', background: '#FFF7ED', padding: '4px 8px', borderRadius: 6 }}>
                  Loan accounts track outstanding loan balances as liabilities.
                </div>
              )}
            </div>
            <Input label={form.accountType === 'LOAN' ? 'Loan principal (₹)' : 'Opening balance (₹)'}
              type="number" value={form.openingBalance} onChange={set('openingBalance')} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{form.accountType === 'LOAN' ? 'Add Loan Account' : 'Add Account'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add Transaction Modal ──────────────────────────────────────────────────────

function AddTransactionModal({ account, onClose, onDone }) {
  const { isMobile } = useBreakpoint();
  const [form, setForm] = useState({
    type: account.accountType === 'LOAN' ? 'DEBIT' : 'CREDIT',
    amount: '', description: '', reference: '',
    category: account.accountType === 'LOAN' ? 'LOAN_REPAYMENT' : '',
    date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) return toast.error('Amount and description required');
    setLoading(true);
    try { await addBankTransaction(account.id, { ...form, amount: Number(form.amount) }); toast.success('Transaction recorded'); onDone(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 16 }}>
      <div style={{ background: '#fff', borderRadius: isMobile ? '20px 20px 0 0' : 16, width: isMobile ? '100%' : '100%', maxWidth: 460, padding: 24, maxHeight: isMobile ? '92dvh' : 'auto', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--navy)' }}>
            {account.accountType === 'LOAN' ? 'Record Loan Repayment' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          {account.name} · Balance: <strong style={{ color: 'var(--navy)' }}>{fmt(account.currentBalance)}</strong>
        </p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {account.accountType !== 'LOAN' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Type</label>
                <select value={form.type} onChange={set('type')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                  <option value="CREDIT">Credit (money in)</option>
                  <option value="DEBIT">Debit (money out)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Category</label>
                <select value={form.category} onChange={set('category')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                  <option value="">— Select —</option>
                  {TXN_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}
          <Input label="Amount (₹) *" type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" />
          <Input label="Description *" value={form.description} onChange={set('description')} placeholder={account.accountType === 'LOAN' ? 'e.g. EMI for June 2026' : 'e.g. Rent, Sales collection…'} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Reference / Cheque / UTR" value={form.reference} onChange={set('reference')} placeholder="Optional" />
            <Input label="Date" type="date" value={form.date} onChange={set('date')} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{account.accountType === 'LOAN' ? 'Record Payment' : 'Add Transaction'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Account Card ───────────────────────────────────────────────────────────────

function AccountCard({ acc, onLedger, onAddTxn }) {
  const isLoan = acc.accountType === 'LOAN';
  const balColor = isLoan ? '#F97316' : (acc.currentBalance >= 0 ? '#192F3D' : '#EF4444');
  const iconBg = isLoan ? 'rgba(249,115,22,0.12)' : 'rgba(31,184,214,0.12)';
  const iconColor = isLoan ? '#F97316' : 'var(--navy)';

  return (
    <Card style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', position: 'relative' }}
      onClick={() => onLedger(acc)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
      {isLoan && (
        <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99, background: '#FFF7ED', color: '#F97316', border: '1px solid #FED7AA' }}>LOAN</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, background: iconBg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isLoan ? <Landmark size={18} color={iconColor} /> : <CreditCard size={18} color={iconColor} />}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{acc.name}</div>
          <div style={{ fontSize: 12, color: '#9CA3AF' }}>{acc.bankName} · {acc.accountType}</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {isLoan ? 'Outstanding Amount' : 'Current Balance'}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: balColor, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: 4 }}>
        {fmt(acc.currentBalance)}
      </div>

      {acc.accountNumber && (
        <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>A/c: ••••{acc.accountNumber.slice(-4)}</div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button
          onClick={e => { e.stopPropagation(); onLedger(acc); }}
          style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid var(--border)', background: '#F9FAFB', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: 'var(--navy)' }}>
          View Ledger
        </button>
        <button
          onClick={e => { e.stopPropagation(); onAddTxn(acc); }}
          style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `1px solid ${isLoan ? '#FED7AA' : 'var(--border)'}`, background: isLoan ? '#FFF7ED' : '#F9FAFB', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: isLoan ? '#F97316' : 'var(--navy)' }}>
          {isLoan ? '+ Repayment' : '+ Transaction'}
        </button>
      </div>
    </Card>
  );
}

// ── Main Accounts Component ────────────────────────────────────────────────────

export default function Accounts() {
  const { isMobile } = useBreakpoint();
  const [accounts, setAccounts] = useState([]);
  const [totalBal, setTotalBal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [txnAccount, setTxnAccount] = useState(null);
  const [ledgerAccount, setLedgerAccount] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, b] = await Promise.all([getBankAccounts(), getTotalBalance()]);
      setAccounts(a.data.data || []);
      setTotalBal(b.data.data?.totalBalance || 0);
    } catch { toast.error('Failed to load accounts'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const bankAccounts = accounts.filter(a => a.accountType !== 'LOAN');
  const loanAccounts = accounts.filter(a => a.accountType === 'LOAN');
  const totalLoan = loanAccounts.reduce((s, a) => s + (a.currentBalance || 0), 0);
  const netCash = totalBal - totalLoan;

  const doExportAll = () => {
    exportCsv('all_accounts.csv',
      ['Account Name', 'Bank', 'Type', 'Account Number', 'Opening Balance (₹)', 'Current Balance (₹)'],
      accounts.map(a => [
        a.name, a.bankName, a.accountType,
        a.accountNumber ? `••••${a.accountNumber.slice(-4)}` : '',
        fmtNum(a.openingBalance), fmtNum(a.currentBalance),
      ])
    );
  };

  return (
    <div style={{ ...P.wrap(isMobile), maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={P.head}>
        <div>
          <h1 style={P.h1(isMobile)}>Bank & Accounts</h1>
          <p style={P.sub}>Ledger · Transactions · Credit & Debit · Loans</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={doExportAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #10B981', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#10B981' }}>
            <Download size={14} /> Export All
          </button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={15} style={{ marginRight: 6 }} />Add Account
          </Button>
        </div>
      </div>

      <KpiBar stats={[
        { label: 'Total Cash & Bank', value: fmt(totalBal), color: '#1FB8D6',                               sub: `${bankAccounts.length} account(s)` },
        { label: 'Loan Outstanding',  value: fmt(totalLoan), color: totalLoan > 0 ? '#F97316' : '#10B981',  sub: `${loanAccounts.length} loan(s)` },
        { label: 'Net Cash Position', value: fmt(netCash),  color: netCash >= 0 ? '#192F3D' : '#EF4444',    sub: netCash >= 0 ? 'Positive' : 'Negative' },
        { label: 'Total Accounts',    value: accounts.length, color: '#6B7280',                             sub: `${loanAccounts.length} loan accounts` },
      ]} />

      {loading ? (
        <p style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>Loading accounts…</p>
      ) : (
        <>
          {/* Bank / Cash Accounts */}
          {bankAccounts.length > 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CreditCard size={16} /> Bank & Cash Accounts
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
                {bankAccounts.map(acc => (
                  <AccountCard key={acc.id} acc={acc} onLedger={setLedgerAccount} onAddTxn={setTxnAccount} />
                ))}
              </div>
            </>
          )}

          {/* Loan Accounts */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--navy)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Landmark size={16} /> Loans & Liabilities
            </div>
            <button onClick={() => setShowAdd(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #FED7AA', background: '#FFF7ED', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#F97316' }}>
              <Plus size={12} /> Add Loan
            </button>
          </div>

          {loanAccounts.length > 0 ? (
            <>
              {/* Loan summary bar */}
              <Card style={{ marginBottom: 16, background: totalLoan > 0 ? '#FFF7ED' : '#F0FDF4', border: `1px solid ${totalLoan > 0 ? '#FED7AA' : '#BBF7D0'}` }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {totalLoan > 0 ? <AlertTriangle size={18} color="#F97316" /> : <TrendingDown size={18} color="#10B981" />}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: totalLoan > 0 ? '#9A3412' : '#166534' }}>
                        {totalLoan > 0 ? `Total Outstanding Loans: ${fmt(totalLoan)}` : 'All loans cleared!'}
                      </div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>
                        Click any loan account to view repayment history and record EMI payments.
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>Net Cash after loans: <strong style={{ color: netCash >= 0 ? '#166534' : '#991B1B' }}>{fmt(netCash)}</strong></div>
                </div>
              </Card>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
                {loanAccounts.map(acc => (
                  <AccountCard key={acc.id} acc={acc} onLedger={setLedgerAccount} onAddTxn={setTxnAccount} />
                ))}
              </div>
            </>
          ) : (
            <Card style={{ marginBottom: 32, background: '#F9FAFB', border: '1px dashed var(--border)', textAlign: 'center', padding: '28px 16px' }}>
              <Landmark size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#9CA3AF', marginBottom: 4 }}>No Loan Accounts</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Track business loans, EMI repayments, and outstanding amounts.</div>
              <button onClick={() => setShowAdd(true)}
                style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid #FED7AA', background: '#FFF7ED', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#F97316' }}>
                + Add Loan Account
              </button>
            </Card>
          )}

          {/* All accounts empty */}
          {accounts.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
              <Building2 size={40} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No accounts yet</div>
              <div style={{ fontSize: 13, marginBottom: 20 }}>Add your first bank account or cash account to start tracking finances.</div>
              <Button onClick={() => setShowAdd(true)}><Plus size={15} style={{ marginRight: 6 }} />Add First Account</Button>
            </div>
          )}
        </>
      )}

      {showAdd && <AddAccountModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
      {txnAccount && <AddTransactionModal account={txnAccount} onClose={() => setTxnAccount(null)} onDone={() => { setTxnAccount(null); load(); }} />}
      {ledgerAccount && <LedgerModal account={ledgerAccount} onClose={() => setLedgerAccount(null)} />}
    </div>
  );
}


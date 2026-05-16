import { useState, useEffect, useCallback } from 'react';
import { getBankAccounts, createBankAccount, addBankTransaction, getTotalBalance } from '../../api';
import { Plus, Building2, TrendingUp, TrendingDown, X, CreditCard } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function AddAccountModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', bankName: '', accountNumber: '', ifscCode: '', accountType: 'CURRENT', openingBalance: 0 });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.bankName) return toast.error('Name and bank are required');
    setLoading(true);
    try { await createBankAccount(form); toast.success('Account added'); onCreated(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Add Bank Account</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Account name" placeholder="HDFC Current A/c" value={form.name} onChange={set('name')} />
            <Input label="Bank name" placeholder="HDFC Bank" value={form.bankName} onChange={set('bankName')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Account number" placeholder="Optional" value={form.accountNumber} onChange={set('accountNumber')} />
            <Input label="IFSC code" placeholder="Optional" value={form.ifscCode} onChange={set('ifscCode')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Account type</label>
              <select value={form.accountType} onChange={set('accountType')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                {['CURRENT', 'SAVINGS', 'CASH'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <Input label="Opening balance (₹)" type="number" value={form.openingBalance} onChange={set('openingBalance')} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Add Account</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddTransactionModal({ account, onClose, onDone }) {
  const [form, setForm] = useState({ type: 'DEBIT', amount: '', description: '', reference: '', category: '', date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.description) return toast.error('Amount and description required');
    setLoading(true);
    try { await addBankTransaction(account.id, { ...form, amount: Number(form.amount) }); toast.success('Transaction added'); onDone(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--navy)' }}>Add Transaction</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>{account.name} · Balance: <strong>{fmt(account.currentBalance)}</strong></p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Type</label>
              <select value={form.type} onChange={set('type')} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}>
                <option value="DEBIT">Debit (money out)</option>
                <option value="CREDIT">Credit (money in)</option>
              </select>
            </div>
            <Input label="Amount (₹)" type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" />
          </div>
          <Input label="Description" value={form.description} onChange={set('description')} placeholder="e.g. Rent payment, Vendor payment..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Input label="Reference" value={form.reference} onChange={set('reference')} placeholder="Cheque / UTR no." />
            <Input label="Date" type="date" value={form.date} onChange={set('date')} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Add</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [totalBal, setTotalBal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [txnAccount, setTxnAccount] = useState(null);
  const [selected, setSelected] = useState(null);

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

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--navy)', letterSpacing: '-0.02em' }}>Bank Accounts</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 2 }}>Total balance: <strong style={{ color: 'var(--navy)' }}>{fmt(totalBal)}</strong></p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus size={16} style={{ marginRight: 6 }} />Add Account</Button>
      </div>

      {loading ? <p style={{ color: '#9CA3AF', textAlign: 'center', padding: 48 }}>Loading...</p> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {accounts.map(acc => (
            <Card key={acc.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(acc)}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 38, background: 'var(--navy)18', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CreditCard size={18} color="var(--navy)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>{acc.name}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{acc.bankName} · {acc.accountType}</div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: acc.currentBalance >= 0 ? 'var(--emerald)' : 'var(--vermilion)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                {fmt(acc.currentBalance)}
              </div>
              {acc.accountNumber && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>A/c: ••••{acc.accountNumber.slice(-4)}</div>}
              <button
                onClick={(e) => { e.stopPropagation(); setTxnAccount(acc); }}
                style={{ marginTop: 12, width: '100%', padding: '7px 0', borderRadius: 8, border: '1px solid var(--border)', background: '#F9FAFB', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--navy)' }}
              >
                + Add Transaction
              </button>
            </Card>
          ))}
          {accounts.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 48, color: '#9CA3AF' }}>
              <Building2 size={40} style={{ marginBottom: 8, opacity: 0.4, display: 'block', margin: '0 auto 8px' }} />
              No bank accounts yet. Add your first account.
            </div>
          )}
        </div>
      )}

      {showAdd && <AddAccountModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
      {txnAccount && <AddTransactionModal account={txnAccount} onClose={() => setTxnAccount(null)} onDone={() => { setTxnAccount(null); load(); }} />}
    </div>
  );
}

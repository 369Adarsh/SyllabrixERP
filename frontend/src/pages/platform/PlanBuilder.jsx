import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  getSAManagedPlans, createSAManagedPlan, updateSAManagedPlan, toggleSAManagedPlan, deleteSAManagedPlan,
  getSAManagedOffers, createSAManagedOffer, updateSAManagedOffer, deleteSAManagedOffer,
} from '../../api/platform';
import { MODULE_REGISTRY } from '../../config/platformCatalog';

const ALL_MODULES = Object.entries(MODULE_REGISTRY).map(([key, mod]) => ({ key, label: mod.label }));

const S = {
  page: { padding: 32, maxWidth: 1100, margin: '0 auto' },
  h1: { fontSize: 22, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 },
  sub: { fontSize: 13, color: '#64748B', marginBottom: 28 },
  tabs: { display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid #1E2D3D', paddingBottom: 0 },
  tab: (active) => ({
    padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    background: 'none', border: 'none', borderBottom: active ? '2px solid #1FB8D6' : '2px solid transparent',
    color: active ? '#1FB8D6' : '#64748B', transition: 'all 0.15s', marginBottom: -1,
  }),
  card: { background: '#192533', border: '1px solid #1E2D3D', borderRadius: 12, padding: 24, marginBottom: 20 },
  planGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 24 },
  planCard: (color, active) => ({
    background: '#0F1923', border: `1px solid ${active ? color : '#1E2D3D'}`,
    borderRadius: 12, padding: 20, position: 'relative',
    opacity: active ? 1 : 0.6,
  }),
  label: { fontSize: 11, fontWeight: 700, color: '#64748B', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, display: 'block' },
  input: { width: '100%', background: '#0F1923', border: '1px solid #1E2D3D', borderRadius: 8, padding: '9px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', boxSizing: 'border-box' },
  btn: (variant) => ({
    padding: '8px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
    ...(variant === 'primary'  && { background: '#1FB8D6', color: '#0B131C' }),
    ...(variant === 'danger'   && { background: 'rgba(220,38,38,0.12)', color: '#F87171', border: '1px solid rgba(220,38,38,0.25)' }),
    ...(variant === 'ghost'    && { background: 'rgba(255,255,255,0.05)', color: '#94A3B8', border: '1px solid #1E2D3D' }),
    ...(variant === 'success'  && { background: 'rgba(16,185,129,0.12)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }),
  }),
  row: { display: 'flex', gap: 12, marginBottom: 14 },
  col: { flex: 1 },
  badge: (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${color}22`, color }),
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 14px', color: '#64748B', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid #1E2D3D' },
  td: { padding: '12px 14px', color: '#CBD5E1', borderBottom: '1px solid #1E2D3D' },
};

function ModuleMatrix({ selected, onChange }) {
  const toggle = (key) => {
    const next = selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key];
    onChange(next);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {ALL_MODULES.map(m => {
        const on = selected.includes(m.key);
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => toggle(m.key)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${on ? '#1FB8D6' : '#1E2D3D'}`,
              background: on ? 'rgba(31,184,214,0.12)' : '#0F1923',
              color: on ? '#1FB8D6' : '#64748B',
              transition: 'all 0.15s',
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

const PLAN_BLANK = { key: '', name: '', tagline: '', description: '', monthlyPrice: '', yearlyPrice: '', color: '#1FB8D6', trialDays: 14, maxUsers: '', maxBranches: '', sortOrder: 0, modules: [] };
const OFFER_BLANK = { code: '', description: '', discountType: 'PERCENT', discountValue: '', applicablePlans: [], maxUses: '', validFrom: '', validUntil: '' };

export default function PlanBuilder() {
  const [tab, setTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planForm, setPlanForm] = useState(null); // null=closed, {}=new, {id,...}=edit
  const [offerForm, setOfferForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, o] = await Promise.all([getSAManagedPlans(), getSAManagedOffers()]);
      setPlans(p.data?.data || []);
      setOffers(o.data?.data || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // ── Plan actions ──
  const openNewPlan = () => setPlanForm({ ...PLAN_BLANK });
  const openEditPlan = (plan) => setPlanForm({
    id: plan.id, key: plan.key, name: plan.name, tagline: plan.tagline || '',
    description: plan.description || '', monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice || '', color: plan.color || '#1FB8D6',
    trialDays: plan.trialDays, maxUsers: plan.maxUsers || '', maxBranches: plan.maxBranches || '',
    sortOrder: plan.sortOrder, modules: Array.isArray(plan.modules) ? plan.modules : [],
  });

  const savePlan = async () => {
    if (!planForm.name || !planForm.key || !planForm.monthlyPrice) {
      toast.error('Key, name and monthly price are required');
      return;
    }
    setSaving(true);
    try {
      if (planForm.id) {
        await updateSAManagedPlan(planForm.id, planForm);
        toast.success('Plan updated');
      } else {
        await createSAManagedPlan(planForm);
        toast.success('Plan created');
      }
      setPlanForm(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const togglePlan = async (plan) => {
    try {
      await toggleSAManagedPlan(plan.id);
      toast.success(plan.isActive ? 'Plan deactivated' : 'Plan activated');
      load();
    } catch { toast.error('Failed'); }
  };

  const deletePlan = async (plan) => {
    if (!confirm(`Delete plan "${plan.name}"? This cannot be undone.`)) return;
    try {
      await deleteSAManagedPlan(plan.id);
      toast.success('Plan deleted');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  // ── Offer actions ──
  const openNewOffer = () => setOfferForm({ ...OFFER_BLANK });
  const openEditOffer = (offer) => setOfferForm({
    id: offer.id, code: offer.code, description: offer.description || '',
    discountType: offer.discountType, discountValue: offer.discountValue,
    applicablePlans: Array.isArray(offer.applicablePlans) ? offer.applicablePlans : [],
    maxUses: offer.maxUses || '', validFrom: offer.validFrom ? offer.validFrom.slice(0, 10) : '',
    validUntil: offer.validUntil ? offer.validUntil.slice(0, 10) : '',
    isActive: offer.isActive,
  });

  const saveOffer = async () => {
    if (!offerForm.code || !offerForm.discountValue) {
      toast.error('Code and discount value are required');
      return;
    }
    setSaving(true);
    try {
      if (offerForm.id) {
        await updateSAManagedOffer(offerForm.id, offerForm);
        toast.success('Offer updated');
      } else {
        await createSAManagedOffer(offerForm);
        toast.success('Offer created');
      }
      setOfferForm(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const deleteOffer = async (offer) => {
    if (!confirm(`Delete offer "${offer.code}"?`)) return;
    try {
      await deleteSAManagedOffer(offer.id);
      toast.success('Offer deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const toggleOfferPlan = (key) => {
    const ap = offerForm.applicablePlans || [];
    setOfferForm(f => ({ ...f, applicablePlans: ap.includes(key) ? ap.filter(k => k !== key) : [...ap, key] }));
  };

  return (
    <div style={S.page}>
      <div style={S.h1}>Plan Creator</div>
      <div style={S.sub}>Define pricing tiers, module access, and promotional offers for Syllabrix plans.</div>

      <div style={S.tabs}>
        <button style={S.tab(tab === 'plans')}  onClick={() => setTab('plans')}>Pricing Plans</button>
        <button style={S.tab(tab === 'offers')} onClick={() => setTab('offers')}>Promo Offers</button>
      </div>

      {/* ── Plans Tab ── */}
      {tab === 'plans' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button style={S.btn('primary')} onClick={openNewPlan}>+ New Plan</button>
          </div>

          {loading ? (
            <div style={{ color: '#64748B', fontSize: 14 }}>Loading…</div>
          ) : (
            <div style={S.planGrid}>
              {plans.map(plan => (
                <div key={plan.id} style={S.planCard(plan.color, plan.isActive)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: plan.color, display: 'inline-block' }} />
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>{plan.name}</span>
                        <span style={S.badge(plan.isActive ? '#34D399' : '#64748B')}>{plan.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{plan.key}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={{ ...S.btn('ghost'), padding: '5px 10px' }} onClick={() => openEditPlan(plan)}>Edit</button>
                    </div>
                  </div>

                  {plan.tagline && <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 10 }}>{plan.tagline}</div>}

                  <div style={{ marginBottom: 14 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: plan.color }}>₹{plan.monthlyPrice.toLocaleString('en-IN')}</span>
                    <span style={{ fontSize: 12, color: '#64748B' }}>/mo</span>
                    {plan.yearlyPrice && (
                      <span style={{ fontSize: 11, color: '#64748B', marginLeft: 8 }}>₹{plan.yearlyPrice.toLocaleString('en-IN')}/yr</span>
                    )}
                  </div>

                  <div style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
                    {plan.maxUsers ? `Up to ${plan.maxUsers} users` : 'Unlimited users'} &middot;{' '}
                    {plan.maxBranches ? `${plan.maxBranches} branch${plan.maxBranches > 1 ? 'es' : ''}` : 'Unlimited branches'}
                    {plan.trialDays > 0 && ` · ${plan.trialDays}-day trial`}
                  </div>

                  <div style={{ fontSize: 11, color: '#475569', marginBottom: 14 }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Modules: </span>
                    {(Array.isArray(plan.modules) ? plan.modules : []).slice(0, 5).join(', ')}
                    {(Array.isArray(plan.modules) ? plan.modules : []).length > 5 && ` +${plan.modules.length - 5} more`}
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ ...S.btn(plan.isActive ? 'ghost' : 'success'), padding: '5px 10px', fontSize: 12 }} onClick={() => togglePlan(plan)}>
                      {plan.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button style={{ ...S.btn('danger'), padding: '5px 10px', fontSize: 12 }} onClick={() => deletePlan(plan)}>Delete</button>
                  </div>
                </div>
              ))}

              {plans.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#64748B', fontSize: 14 }}>
                  No plans yet. Click "New Plan" to create your first pricing tier.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Offers Tab ── */}
      {tab === 'offers' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button style={S.btn('primary')} onClick={openNewOffer}>+ New Offer</button>
          </div>

          <div style={S.card}>
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Code</th>
                    <th style={S.th}>Discount</th>
                    <th style={S.th}>Applicable Plans</th>
                    <th style={S.th}>Usage</th>
                    <th style={S.th}>Valid Until</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#64748B' }}>Loading…</td></tr>
                  ) : offers.length === 0 ? (
                    <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#64748B', padding: 32 }}>No offers yet.</td></tr>
                  ) : offers.map(o => (
                    <tr key={o.id}>
                      <td style={S.td}><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1FB8D6' }}>{o.code}</span></td>
                      <td style={S.td}>
                        {o.discountType === 'PERCENT' ? `${o.discountValue}% off` : `₹${o.discountValue} off`}
                      </td>
                      <td style={S.td}>
                        {(Array.isArray(o.applicablePlans) ? o.applicablePlans : []).join(', ') || 'All plans'}
                      </td>
                      <td style={S.td}>{o.usedCount}{o.maxUses ? `/${o.maxUses}` : ''}</td>
                      <td style={S.td}>{o.validUntil ? new Date(o.validUntil).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={S.td}>
                        <span style={S.badge(o.isActive ? '#34D399' : '#64748B')}>{o.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={{ ...S.btn('ghost'), padding: '4px 10px', fontSize: 12 }} onClick={() => openEditOffer(o)}>Edit</button>
                          <button style={{ ...S.btn('danger'), padding: '4px 10px', fontSize: 12 }} onClick={() => deleteOffer(o)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Plan Form Modal ── */}
      {planForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 14, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>{planForm.id ? 'Edit Plan' : 'New Plan'}</div>
              <button style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 20, cursor: 'pointer' }} onClick={() => setPlanForm(null)}>×</button>
            </div>

            <div style={S.row}>
              <div style={S.col}>
                <label style={S.label}>Plan Key (e.g. STARTER)</label>
                <input style={S.input} value={planForm.key} onChange={e => setPlanForm(f => ({ ...f, key: e.target.value.toUpperCase() }))} placeholder="STARTER" disabled={!!planForm.id} />
              </div>
              <div style={S.col}>
                <label style={S.label}>Display Name</label>
                <input style={S.input} value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} placeholder="Starter" />
              </div>
              <div style={{ width: 80 }}>
                <label style={S.label}>Color</label>
                <input type="color" style={{ ...S.input, padding: 4, height: 38 }} value={planForm.color} onChange={e => setPlanForm(f => ({ ...f, color: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Tagline</label>
              <input style={S.input} value={planForm.tagline} onChange={e => setPlanForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Perfect for getting started" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Description</label>
              <textarea style={{ ...S.input, minHeight: 60, resize: 'vertical' }} value={planForm.description} onChange={e => setPlanForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div style={S.row}>
              <div style={S.col}>
                <label style={S.label}>Monthly Price (₹)</label>
                <input style={S.input} type="number" value={planForm.monthlyPrice} onChange={e => setPlanForm(f => ({ ...f, monthlyPrice: e.target.value }))} placeholder="999" />
              </div>
              <div style={S.col}>
                <label style={S.label}>Yearly Price (₹) <span style={{ color: '#475569' }}>optional</span></label>
                <input style={S.input} type="number" value={planForm.yearlyPrice} onChange={e => setPlanForm(f => ({ ...f, yearlyPrice: e.target.value }))} placeholder="9990" />
              </div>
              <div style={S.col}>
                <label style={S.label}>Trial Days</label>
                <input style={S.input} type="number" value={planForm.trialDays} onChange={e => setPlanForm(f => ({ ...f, trialDays: e.target.value }))} placeholder="14" />
              </div>
            </div>

            <div style={S.row}>
              <div style={S.col}>
                <label style={S.label}>Max Users <span style={{ color: '#475569' }}>blank = unlimited</span></label>
                <input style={S.input} type="number" value={planForm.maxUsers} onChange={e => setPlanForm(f => ({ ...f, maxUsers: e.target.value }))} placeholder="unlimited" />
              </div>
              <div style={S.col}>
                <label style={S.label}>Max Branches <span style={{ color: '#475569' }}>blank = unlimited</span></label>
                <input style={S.input} type="number" value={planForm.maxBranches} onChange={e => setPlanForm(f => ({ ...f, maxBranches: e.target.value }))} placeholder="unlimited" />
              </div>
              <div style={S.col}>
                <label style={S.label}>Sort Order</label>
                <input style={S.input} type="number" value={planForm.sortOrder} onChange={e => setPlanForm(f => ({ ...f, sortOrder: e.target.value }))} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={S.label}>Included Modules ({(planForm.modules || []).length} selected)</label>
              <ModuleMatrix selected={planForm.modules || []} onChange={mods => setPlanForm(f => ({ ...f, modules: mods }))} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={S.btn('ghost')} onClick={() => setPlanForm(null)}>Cancel</button>
              <button style={S.btn('primary')} onClick={savePlan} disabled={saving}>{saving ? 'Saving…' : (planForm.id ? 'Save Changes' : 'Create Plan')}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Offer Form Modal ── */}
      {offerForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#192533', border: '1px solid #1E2D3D', borderRadius: 14, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>{offerForm.id ? 'Edit Offer' : 'New Promo Offer'}</div>
              <button style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 20, cursor: 'pointer' }} onClick={() => setOfferForm(null)}>×</button>
            </div>

            <div style={S.row}>
              <div style={S.col}>
                <label style={S.label}>Coupon Code</label>
                <input style={{ ...S.input, fontFamily: 'monospace', textTransform: 'uppercase' }} value={offerForm.code} onChange={e => setOfferForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="LAUNCH50" disabled={!!offerForm.id} />
              </div>
              <div style={S.col}>
                <label style={S.label}>Discount Type</label>
                <select style={S.input} value={offerForm.discountType} onChange={e => setOfferForm(f => ({ ...f, discountType: e.target.value }))}>
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>
              <div style={S.col}>
                <label style={S.label}>Discount Value</label>
                <input style={S.input} type="number" value={offerForm.discountValue} onChange={e => setOfferForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={offerForm.discountType === 'PERCENT' ? '20' : '500'} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Description</label>
              <input style={S.input} value={offerForm.description} onChange={e => setOfferForm(f => ({ ...f, description: e.target.value }))} placeholder="Launch offer for new signups" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>Applicable Plans <span style={{ color: '#475569' }}>leave none selected = all plans</span></label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {plans.map(p => {
                  const on = (offerForm.applicablePlans || []).includes(p.key);
                  return (
                    <button
                      key={p.key} type="button"
                      onClick={() => toggleOfferPlan(p.key)}
                      style={{
                        padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${on ? p.color : '#1E2D3D'}`,
                        background: on ? `${p.color}22` : '#0F1923',
                        color: on ? p.color : '#64748B',
                      }}
                    >{p.name}</button>
                  );
                })}
              </div>
            </div>

            <div style={S.row}>
              <div style={S.col}>
                <label style={S.label}>Max Uses <span style={{ color: '#475569' }}>blank = unlimited</span></label>
                <input style={S.input} type="number" value={offerForm.maxUses} onChange={e => setOfferForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="unlimited" />
              </div>
              <div style={S.col}>
                <label style={S.label}>Valid From</label>
                <input style={S.input} type="date" value={offerForm.validFrom} onChange={e => setOfferForm(f => ({ ...f, validFrom: e.target.value }))} />
              </div>
              <div style={S.col}>
                <label style={S.label}>Valid Until</label>
                <input style={S.input} type="date" value={offerForm.validUntil} onChange={e => setOfferForm(f => ({ ...f, validUntil: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={S.btn('ghost')} onClick={() => setOfferForm(null)}>Cancel</button>
              <button style={S.btn('primary')} onClick={saveOffer} disabled={saving}>{saving ? 'Saving…' : (offerForm.id ? 'Save Changes' : 'Create Offer')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

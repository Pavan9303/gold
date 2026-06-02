'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Loan { id: string; customerName: string; customerPhone: string; principalAmount: number; interestRate: number; status: string; startDate: string; dueDate: string; totalPaid: number; items: {description:string;weightGrams:number;purity:string;estimatedValue:number;}[]; calculatedInterest: {outstandingBalance:number;interestAccrued:number;monthlyInterestAmount:number;totalDue:number;}; }
interface Customer { id: string; name: string; phone: string; }

function LoansContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(sp.get('add') === '1');
  const [filter, setFilter] = useState(sp.get('status') || 'all');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const defaultCustomerId = sp.get('customerId') || '';
  const defaultCustomerName = sp.get('customerName') || '';

  const [form, setForm] = useState({
    customerId: defaultCustomerId, interestRate: '2', startDate: new Date().toISOString().slice(0, 10),
    dueDate: '', principalAmount: '', notes: '',
    items: [{ description: '', weightGrams: '', purity: '22K', estimatedValue: '' }],
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/loans').then(r => r.json()),
      fetch('/api/customers').then(r => r.json()),
    ]).then(([l, c]) => {
      setLoans(Array.isArray(l) ? l : []);
      setCustomers(Array.isArray(c) ? c : []);
      if (c?.length > 0 && !form.customerId) setForm(p => ({ ...p, interestRate: '2' }));
      setLoading(false);
    });
  }, []); // eslint-disable-line

  const filtered = loans.filter(l => {
    const matchStatus = filter === 'all' || l.status === filter || (filter === 'overdue' && new Date(l.dueDate) < new Date() && l.status === 'active');
    const matchSearch = l.customerName.toLowerCase().includes(search.toLowerCase()) || l.customerPhone.includes(search);
    return matchStatus && matchSearch;
  });

  function addItem() { setForm(p => ({ ...p, items: [...p.items, { description: '', weightGrams: '', purity: '22K', estimatedValue: '' }] })); }
  function removeItem(i: number) { setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) })); }
  function updateItem(i: number, k: string, v: string) { setForm(p => ({ ...p, items: p.items.map((it, idx) => idx === i ? { ...it, [k]: v } : it) })); }

  async function addLoan(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    const payload = { ...form, principalAmount: Number(form.principalAmount), interestRate: Number(form.interestRate), items: form.items.map(it => ({ ...it, weightGrams: Number(it.weightGrams), estimatedValue: Number(it.estimatedValue) })) };
    const res = await fetch('/api/loans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setLoans(p => [{ ...data, calculatedInterest: { outstandingBalance: data.principalAmount, interestAccrued: 0, monthlyInterestAmount: data.principalAmount * data.interestRate / 100, totalDue: data.principalAmount } }, ...p]);
    setShowAdd(false);
    setSaving(false);
    router.push(`/dashboard/loans/${data.id}`);
  }

  const fmt = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  const purityOptions = ['24K', '22K', '18K', '14K', 'Silver'];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#1A1A2E', marginBottom: 4 }}>Loans</h1>
          <p style={{ color: '#5A5A7A', fontSize: 14 }}>{loans.length} total loans</p>
        </div>
        <button className="btn-gold" onClick={() => setShowAdd(true)}>+ New Loan</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="input-gold" placeholder="🔍 Search customer..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'active', 'overdue', 'closed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', borderRadius: 20, border: '1.5px solid', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', borderColor: filter === f ? '#C9922A' : '#E8E0D0', background: filter === f ? '#FDF6E3' : 'white', color: filter === f ? '#C9922A' : '#5A5A7A' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ color: '#5A5A7A', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div style={{ fontWeight: 600, color: '#1A1A2E', marginBottom: 8 }}>No loans found</div>
              <button className="btn-gold" onClick={() => setShowAdd(true)}>+ Create First Loan</button>
            </div>
          ) : (
            <table className="table-gold">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Principal</th>
                  <th>Interest/Mo</th>
                  <th>Outstanding</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => {
                  const isOD = l.status === 'active' && new Date(l.dueDate) < new Date();
                  return (
                    <tr key={l.id} onClick={() => router.push(`/dashboard/loans/${l.id}`)}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{l.customerName}</div>
                        <div style={{ fontSize: 12, color: '#5A5A7A' }}>{l.customerPhone}</div>
                      </td>
                      <td style={{ fontSize: 12, color: '#5A5A7A', maxWidth: 200 }}>
                        {l.items?.slice(0, 2).map(i => `${i.description} ${i.weightGrams}g`).join(', ')}
                        {l.items?.length > 2 && ` +${l.items.length - 2} more`}
                      </td>
                      <td style={{ fontWeight: 600 }}>{fmt(l.principalAmount)}</td>
                      <td style={{ color: '#C9922A', fontWeight: 600 }}>{fmt(l.calculatedInterest?.monthlyInterestAmount || 0)}</td>
                      <td style={{ fontWeight: 700, color: isOD ? '#C0392B' : '#1A1A2E' }}>{fmt(l.calculatedInterest?.outstandingBalance || 0)}</td>
                      <td style={{ fontSize: 13, color: isOD ? '#C0392B' : '#5A5A7A', fontWeight: isOD ? 600 : 400 }}>{format(new Date(l.dueDate), 'dd MMM yyyy')}</td>
                      <td>
                        <span className={`badge-${isOD ? 'overdue' : l.status}`} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                          {isOD ? 'Overdue' : l.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Loan Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" style={{ padding: 32, maxWidth: 620 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22 }}>Create New Loan</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#5A5A7A' }}>×</button>
            </div>
            <form onSubmit={addLoan}>
              {/* Customer Select */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Customer *</label>
                {defaultCustomerId ? (
                  <input className="input-gold" value={defaultCustomerName} readOnly style={{ background: '#F8F4ED' }} />
                ) : (
                  <select className="input-gold" value={form.customerId} onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))} required>
                    <option value="">Select customer...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
                  </select>
                )}
                {customers.length === 0 && <p style={{ fontSize: 12, color: '#C9922A', marginTop: 4 }}>No customers yet. <Link href="/dashboard/customers?add=1" style={{ color: '#C9922A' }}>Add one first.</Link></p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Principal (₹) *</label>
                  <input className="input-gold" type="number" placeholder="50000" value={form.principalAmount} onChange={e => setForm(p => ({ ...p, principalAmount: e.target.value }))} required min={1} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Interest (% / month) *</label>
                  <input className="input-gold" type="number" step="0.1" placeholder="2" value={form.interestRate} onChange={e => setForm(p => ({ ...p, interestRate: e.target.value }))} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Start Date *</label>
                  <input className="input-gold" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Due Date *</label>
                <input className="input-gold" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} required />
              </div>

              {/* Items */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A' }}>Gold Items *</label>
                  <button type="button" onClick={addItem} style={{ fontSize: 12, color: '#C9922A', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Add Item</button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                    <input className="input-gold" placeholder="Description (e.g., Gold Chain)" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} required />
                    <input className="input-gold" type="number" placeholder="Weight (g)" value={item.weightGrams} onChange={e => updateItem(i, 'weightGrams', e.target.value)} required />
                    <select className="input-gold" value={item.purity} onChange={e => updateItem(i, 'purity', e.target.value)}>
                      {purityOptions.map(p => <option key={p}>{p}</option>)}
                    </select>
                    <input className="input-gold" type="number" placeholder="Value (₹)" value={item.estimatedValue} onChange={e => updateItem(i, 'estimatedValue', e.target.value)} />
                    {form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} style={{ background: '#FDEEEC', border: 'none', borderRadius: 6, color: '#C0392B', cursor: 'pointer', padding: '6px 8px', fontSize: 14 }}>×</button>}
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Notes (optional)</label>
                <input className="input-gold" placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>

              {error && <div style={{ background: '#FDEEEC', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-gold" type="submit" disabled={saving} style={{ flex: 1 }}>{saving ? 'Creating...' : 'Create Loan'}</button>
                <button className="btn-ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoansPage() {
  return <Suspense fallback={<div style={{ padding: 40, color: '#5A5A7A' }}>Loading...</div>}><LoansContent /></Suspense>;
}

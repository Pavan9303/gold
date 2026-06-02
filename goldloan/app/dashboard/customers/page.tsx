'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Customer { id: string; name: string; phone: string; email?: string; address?: string; aadharNumber?: string; createdAt: string; }

function CustomersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(searchParams.get('add') === '1');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', aadharNumber: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => { setCustomers(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setCustomers(p => [data, ...p]);
    setShowAdd(false);
    setForm({ name: '', phone: '', email: '', address: '', aadharNumber: '' });
    setSaving(false);
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#1A1A2E', marginBottom: 4 }}>Customers</h1>
          <p style={{ color: '#5A5A7A', fontSize: 14 }}>{customers.length} total customers</p>
        </div>
        <button className="btn-gold" onClick={() => setShowAdd(true)}>+ Add Customer</button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input className="input-gold" placeholder="🔍  Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 360 }} />
      </div>

      {loading ? <div style={{ color: '#5A5A7A', padding: 40, textAlign: 'center' }}>Loading...</div> : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <div style={{ fontWeight: 600, color: '#1A1A2E', marginBottom: 8 }}>No customers found</div>
              <p style={{ color: '#5A5A7A', fontSize: 14, marginBottom: 20 }}>Add your first customer to get started.</p>
              <button className="btn-gold" onClick={() => setShowAdd(true)}>+ Add Customer</button>
            </div>
          ) : (
            <table className="table-gold">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Aadhar</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={() => router.push(`/dashboard/customers/${c.id}`)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      {c.email && <div style={{ fontSize: 12, color: '#5A5A7A' }}>{c.email}</div>}
                    </td>
                    <td>
                      <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} style={{ color: '#C9922A', textDecoration: 'none', fontWeight: 500 }}>{c.phone}</a>
                    </td>
                    <td style={{ color: '#5A5A7A', fontSize: 13 }}>{c.address || '—'}</td>
                    <td style={{ color: '#5A5A7A', fontSize: 13, fontFamily: 'monospace' }}>{c.aadharNumber ? `****${c.aadharNumber.slice(-4)}` : '—'}</td>
                    <td style={{ color: '#5A5A7A', fontSize: 13 }}>{format(new Date(c.createdAt), 'dd MMM yyyy')}</td>
                    <td>
                      <Link href={`/dashboard/customers/${c.id}`} onClick={e => e.stopPropagation()} style={{ color: '#C9922A', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>View →</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" style={{ padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22 }}>Add New Customer</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#5A5A7A' }}>×</button>
            </div>
            <form onSubmit={addCustomer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Full Name *</label>
                  <input className="input-gold" placeholder="Ramesh Kumar" value={form.name} onChange={f('name')} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Phone Number *</label>
                  <input className="input-gold" placeholder="9876543210" value={form.phone} onChange={f('phone')} required />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Email (optional)</label>
                  <input className="input-gold" type="email" placeholder="customer@email.com" value={form.email} onChange={f('email')} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Aadhar Number</label>
                  <input className="input-gold" placeholder="1234 5678 9012" value={form.aadharNumber} onChange={f('aadharNumber')} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 5 }}>Address</label>
                  <input className="input-gold" placeholder="House No, Street, City" value={form.address} onChange={f('address')} />
                </div>
              </div>
              {error && <div style={{ background: '#FDEEEC', color: '#C0392B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 14 }}>{error}</div>}
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn-gold" type="submit" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Add Customer'}</button>
                <button className="btn-ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return <Suspense fallback={<div style={{ padding: 40, color: '#5A5A7A' }}>Loading...</div>}><CustomersContent /></Suspense>;
}

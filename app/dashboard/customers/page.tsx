'use client';
import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';

interface Customer {
  id: string; name: string; phone: string; email?: string;
  address?: string; aadharNumber?: string; profileImage?: string; createdAt: string;
}

function CustomerAvatar({ customer, size = 36 }: { customer: Customer; size?: number }) {
  if (customer.profileImage) {
    return (
      <img
        src={customer.profileImage}
        alt={customer.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8C87A', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg, #C9922A, #E8B84B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, color: 'white', fontWeight: 700, flexShrink: 0 }}>
      {customer.name.charAt(0).toUpperCase()}
    </div>
  );
}

function ImageCapture({ onImage, onUploadingChange }: { onImage: (url: string | null) => void; onUploadingChange?: (v: boolean) => void }) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFile(file: File) {
    setUploadError('');
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setUploading(true);
      onUploadingChange?.(true);
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: base64, folder: 'goldloan/customers' }),
        });
        const data = await res.json() as { url?: string; error?: string };
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        onImage(data.url!);
      } catch (err) {
        setUploadError((err as Error).message);
        setPreview(null);
        onImage(null);
      } finally {
        setUploading(false);
        onUploadingChange?.(false);
      }
    };
    reader.readAsDataURL(file);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function clear() {
    setPreview(null);
    setUploadError('');
    onImage(null);
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#5A5A7A', display: 'block', marginBottom: 8 }}>
        Profile Photo (optional)
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {preview ? (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={preview} alt="preview" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8C87A' }} />
            {uploading && (
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 20, height: 20, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            )}
            {!uploading && (
              <button type="button" onClick={clear} title="Remove photo" style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#C0392B', border: 'none', color: 'white', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>×</button>
            )}
          </div>
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: '50%', border: '2px dashed #E8C87A', background: '#FDF6E3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#C9922A', flexShrink: 0 }}>
            👤
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <button type="button" onClick={() => cameraRef.current?.click()} disabled={uploading}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1.5px solid #C9922A', borderRadius: 8, background: 'white', color: '#C9922A', cursor: 'pointer' }}>
            📷 Take Photo
          </button>
          <button type="button" onClick={() => galleryRef.current?.click()} disabled={uploading}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1.5px solid #E8E0D0', borderRadius: 8, background: 'white', color: '#5A5A7A', cursor: 'pointer' }}>
            🖼 Choose from Gallery
          </button>
        </div>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display: 'none' }} />
        <input ref={galleryRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
      </div>
      {uploadError && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 6 }}>Upload failed: {uploadError} — photo will not be saved.</div>}
      {uploading && <div style={{ fontSize: 12, color: '#5A5A7A', marginTop: 6 }}>Uploading photo…</div>}
    </div>
  );
}

function CustomersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(searchParams.get('add') === '1');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', aadharNumber: '', profileImage: '' });
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(d => { setCustomers(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  async function addCustomer(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError('');
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, profileImage: form.profileImage || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setCustomers(p => [data, ...p]);
    setShowAdd(false);
    setForm({ name: '', phone: '', email: '', address: '', aadharNumber: '', profileImage: '' });
    setSaving(false);
  }

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div style={{ padding: 32 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, color: '#1A1A2E', marginBottom: 4 }}>Customers</h1>
          <p style={{ color: '#5A5A7A', fontSize: 14 }}>{customers.length} total customers</p>
        </div>
        <button className="btn-gold" onClick={() => setShowAdd(true)}>+ Add Customer</button>
      </div>

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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CustomerAvatar customer={c} size={36} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          {c.email && <div style={{ fontSize: 12, color: '#5A5A7A' }}>{c.email}</div>}
                        </div>
                      </div>
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

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" style={{ padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 22 }}>Add New Customer</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#5A5A7A' }}>×</button>
            </div>
            <form onSubmit={addCustomer}>
              <ImageCapture
                onImage={url => setForm(p => ({ ...p, profileImage: url || '' }))}
                onUploadingChange={setImageUploading}
              />
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
                <button className="btn-gold" type="submit" disabled={saving || imageUploading} style={{ flex: 1 }}>{imageUploading ? 'Uploading photo…' : saving ? 'Saving...' : 'Add Customer'}</button>
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

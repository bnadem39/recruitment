import { useState } from 'react';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';

export type FormListItem = { id: number; title: string; description?: string; active: boolean; updatedAt: string };

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...authHeaders(token), ...(init?.headers || {}) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

const primaryBtn: React.CSSProperties = { 
  background: '#128c78', 
  color: '#fff', 
  border: 'none', 
  borderRadius: 8, 
  padding: '14px 28px', 
  fontWeight: 700, 
  cursor: 'pointer',
  fontSize: 14,
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(18, 140, 120, 0.2)',
};

const secondaryBtn: React.CSSProperties = { 
  background: '#fff', 
  color: '#17243e', 
  border: '1px solid #dce2ea', 
  borderRadius: 8, 
  padding: '10px 18px', 
  fontWeight: 600, 
  cursor: 'pointer',
  fontSize: 13,
  transition: 'all 0.2s ease',
};

const dangerBtn: React.CSSProperties = { 
  background: '#fff', 
  color: '#a8323e', 
  border: '1px solid #f0c4c8', 
  borderRadius: 8, 
  padding: '10px 18px', 
  fontSize: 13, 
  fontWeight: 600, 
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export function FormsPanel({ forms, loading, session, reload, setError, openBuilder }: {
  forms: FormListItem[]; loading: boolean; session: Session; reload: () => void; setError: (msg: string) => void; openBuilder: () => void;
}) {
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const visible = forms.filter(f => tab === 'active' ? f.active : !f.active);

  const archive = async (form: FormListItem) => {
    try {
      await request(`/api/forms/${form.id}`, session.accessToken, { 
        method: 'PUT', 
        body: JSON.stringify({ title: form.title, description: form.description, active: !form.active }) 
      });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update form status.');
    }
  };

  const remove = async (form: FormListItem) => {
    if (!confirm(`Delete the form "${form.title}"? This cannot be undone.`)) return;
    try {
      await request(`/api/forms/${form.id}`, session.accessToken, { method: 'DELETE' });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete form.');
    }
  };

  return (
    <>
      <header style={{ marginBottom: 32 }}>
        <div>
          <small style={{ 
            display: 'block', 
            fontSize: 11, 
            fontWeight: 700, 
            color: '#718096', 
            marginBottom: 12,
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>FORMS</small>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: '#17243e', 
            margin: '0 0 12px',
            letterSpacing: '-0.5px',
          }}>Application forms</h1>
          <p style={{ 
            fontSize: 15, 
            color: '#718096', 
            margin: 0,
            lineHeight: 1.6,
          }}>Build and manage the forms candidates fill in when applying.</p>
        </div>
        <button style={primaryBtn} onClick={openBuilder}>+ New form</button>
      </header>
      <div className="candidate-tabs" style={{
        display: 'inline-flex',
        gap: 0,
        marginBottom: 24,
        background: '#eef1f5',
        padding: 6,
        borderRadius: 10,
      }}>
        <button 
          className={tab === 'active' ? 'active' : ''} 
          onClick={() => setTab('active')}
          style={{
            padding: '12px 28px',
            background: tab === 'active' ? '#128c78' : 'transparent',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: tab === 'active' ? 700 : 600,
            color: tab === 'active' ? '#fff' : '#718096',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ marginRight: 6 }}>●</span>Active
        </button>
        <button 
          className={tab === 'archived' ? 'active' : ''} 
          onClick={() => setTab('archived')}
          style={{
            padding: '12px 28px',
            background: tab === 'archived' ? '#128c78' : 'transparent',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: tab === 'archived' ? 700 : 600,
            color: tab === 'archived' ? '#fff' : '#718096',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ marginRight: 6 }}>🗄</span>Archived
        </button>
      </div>
      <section className="table-card" style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #eef1f5',
        overflow: 'hidden',
      }}>
        <div className="table" style={{ width: '100%' }}>
          <div className="tr head" style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2.5fr 1fr 1.5fr',
            alignItems: 'center',
            gap: 16,
            padding: '18px 28px',
            background: '#f7f9fc',
            borderBottom: '2px solid #eef1f5',
            fontSize: 12,
            fontWeight: 700,
            color: '#718096',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            <span>Title</span>
            <span>Description</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>
          {loading ? (
            <div className="loading" style={{ padding: '48px 28px', textAlign: 'center', color: '#718096' }}>
              Loading forms…
            </div>
          ) : visible.length === 0 ? (
            <div className="loading" style={{ padding: '48px 28px', textAlign: 'center', color: '#718096' }}>
              {tab === 'active' ? 'No active forms yet.' : 'No archived forms.'}
            </div>
          ) : (
            visible.map(form => (
              <div className="tr" key={form.id} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2.5fr 1fr 1.5fr',
                alignItems: 'center',
                gap: 16,
                padding: '22px 28px',
                borderBottom: '1px solid #eef1f5',
                fontSize: 14,
                transition: 'background 0.2s ease',
              }}>
                <span>
                  <b style={{ fontSize: 15, color: '#17243e', fontWeight: 600 }}>{form.title}</b>
                </span>
                <span style={{ color: '#718096', fontSize: 14 }}>
                  {form.description || '—'}
                </span>
                <span style={{ color: '#718096', fontSize: 14 }}>
                  {new Date(form.updatedAt).toLocaleDateString('fr-FR')}
                </span>
                <span className="actions" style={{ display: 'flex', gap: 10 }}>
                  <button style={secondaryBtn} onClick={openBuilder}>Edit</button>
                  <button style={secondaryBtn} onClick={() => archive(form)}>
                    {tab === 'active' ? 'Archive' : 'Restore'}
                  </button>
                  <button style={dangerBtn} onClick={() => remove(form)}>Delete</button>
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
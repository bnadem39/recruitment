import { useEffect, useState } from 'react';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';
import type { JobOffer } from './form-builder/types';

type Evaluator = { id: number; firstName: string; lastName: string; email: string };

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
  padding: '12px 24px', 
  fontSize: 14, 
  fontWeight: 700, 
  cursor: 'pointer', 
  whiteSpace: 'nowrap',
  transition: 'all 0.2s ease',
  boxShadow: '0 2px 4px rgba(18, 140, 120, 0.2)',
};

const secondaryBtn: React.CSSProperties = {
  background: '#fff', 
  color: '#17243e', 
  border: '1px solid #dce2ea', 
  borderRadius: 8,
  padding: '10px 18px', 
  fontSize: 13, 
  fontWeight: 600, 
  cursor: 'pointer', 
  whiteSpace: 'nowrap',
  transition: 'all 0.2s ease',
};

export function EvaluatorsPanel({ session, offers, loadingOffers }: { 
  session: Session; 
  offers: JobOffer[]; 
  loadingOffers: boolean 
}) {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  const [assigned, setAssigned] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    request<Evaluator[]>('/api/admin/users?role=EVALUATOR', session.accessToken)
      .then(setEvaluators)
      .catch(() => setError('Could not load the evaluator list.'))
      .finally(() => setLoading(false));
  }, [session.accessToken]);

  const openOffer = (offer: JobOffer) => {
    setSelectedOffer(offer);
    setError('');
    request<number[]>(`/api/offers/${offer.id}/evaluators`, session.accessToken)
      .then(setAssigned)
      .catch(() => setAssigned([]));
  };

  const toggleEvaluator = (id: number) => 
    setAssigned(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  const save = async () => {
    if (!selectedOffer) return;
    setSaving(true);
    try {
      await request(`/api/offers/${selectedOffer.id}/evaluators`, session.accessToken, { 
        method: 'PUT', 
        body: JSON.stringify({ evaluatorIds: assigned }) 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the assignment.');
    } finally {
      setSaving(false);
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
          }}>EVALUATORS</small>
          <h1 style={{ 
            fontSize: 28, 
            fontWeight: 700, 
            color: '#17243e', 
            margin: '0 0 12px',
            letterSpacing: '-0.5px',
          }}>Evaluator assignment</h1>
          <p style={{ 
            fontSize: 15, 
            color: '#718096', 
            margin: 0,
            lineHeight: 1.6,
          }}>Choose an offer, then select the evaluators who should review its applications.</p>
        </div>
      </header>
      {error && (
        <div className="alert" style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '16px 20px',
          borderRadius: 8,
          marginBottom: 24,
          fontWeight: 500,
        }}>{error}</div>
      )}
      <section className="table-card" style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #eef1f5',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid', 
          gridTemplateColumns: '2fr 1.2fr 1.4fr 180px',
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
          <span>Offer</span>
          <span>Department</span>
          <span>Assigned evaluators</span>
          <span>Actions</span>
        </div>
        {loadingOffers ? (
          <div className="loading" style={{ padding: '48px 28px', textAlign: 'center', color: '#718096' }}>
            Loading offers…
          </div>
        ) : offers.length === 0 ? (
          <div className="loading" style={{ padding: '48px 28px', textAlign: 'center', color: '#718096' }}>
            No offers yet.
          </div>
        ) : (
          offers.map(offer => (
            <div 
              key={offer.id} 
              style={{
                display: 'grid', 
                gridTemplateColumns: '2fr 1.2fr 1.4fr 180px',
                alignItems: 'center', 
                gap: 16, 
                padding: '22px 28px', 
                borderBottom: '1px solid #eef1f5',
                fontSize: 14,
                transition: 'background 0.2s ease',
              }}
            >
              <span style={{ 
                fontWeight: 600, 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                color: '#17243e',
                fontSize: 15,
              }}>
                {offer.title}
              </span>
              <span style={{ color: '#718096', fontSize: 14 }}>
                {offer.department || '—'}
              </span>
              <span style={{ color: '#718096', fontSize: 14 }}>
                {selectedOffer?.id === offer.id ? (
                  <span style={{ 
                    background: '#f0f9f8', 
                    color: '#128c78', 
                    padding: '6px 12px', 
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 13,
                  }}>
                    {assigned.length} selected
                  </span>
                ) : '—'}
              </span>
              <span style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button 
                  style={{
                    ...secondaryBtn,
                    background: selectedOffer?.id === offer.id ? '#128c78' : '#fff',
                    color: selectedOffer?.id === offer.id ? '#fff' : '#17243e',
                    border: selectedOffer?.id === offer.id ? '1px solid #128c78' : '1px solid #dce2ea',
                  }} 
                  onClick={() => openOffer(offer)}
                >
                  {selectedOffer?.id === offer.id ? '✓ Managing' : 'Assign evaluators'}
                </button>
              </span>
            </div>
          ))
        )}
      </section>

      {selectedOffer && (
        <section className="table-card" style={{ 
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #eef1f5',
          padding: 28, 
          marginTop: 24,
        }}>
          <h3 style={{ 
            margin: '0 0 20px', 
            fontSize: 18, 
            fontWeight: 700,
            color: '#17243e',
          }}>
            Evaluators for "{selectedOffer.title}"
          </h3>
          {loading ? (
            <div className="loading" style={{ padding: '32px', textAlign: 'center', color: '#718096' }}>
              Loading evaluators…
            </div>
          ) : evaluators.length === 0 ? (
            <p style={{ color: '#8490a3', fontSize: 14, margin: 0 }}>No evaluators available.</p>
          ) : (
            <div style={{ 
              display: 'grid', 
              gap: 12, 
              marginBottom: 24,
              background: '#f7f9fc',
              padding: 20,
              borderRadius: 10,
            }}>
              {evaluators.map(evaluator => (
                <label 
                  key={evaluator.id} 
                  className="check" 
                  style={{ 
                    display: 'flex', 
                    gap: 14, 
                    alignItems: 'center',
                    padding: '14px 16px',
                    background: '#fff',
                    borderRadius: 8,
                    border: '1px solid #eef1f5',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={assigned.includes(evaluator.id)} 
                    onChange={() => toggleEvaluator(evaluator.id)}
                    style={{
                      width: 18,
                      height: 18,
                      cursor: 'pointer',
                      accentColor: '#128c78',
                    }}
                  />
                  <span style={{ fontWeight: 600, color: '#17243e', fontSize: 14 }}>
                    {evaluator.firstName} {evaluator.lastName}
                  </span>
                  <small style={{ color: '#8490a3', fontSize: 13 }}>
                    ({evaluator.email})
                  </small>
                </label>
              ))}
            </div>
          )}
          <div className="modal-actions" style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            paddingTop: 8,
          }}>
            <button 
              style={{
                ...primaryBtn,
                background: saving ? '#9ca3af' : '#128c78',
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : '0 2px 4px rgba(18, 140, 120, 0.2)',
              }} 
              disabled={saving} 
              onClick={save}
            >
              {saving ? 'Saving…' : 'Save assignment'}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
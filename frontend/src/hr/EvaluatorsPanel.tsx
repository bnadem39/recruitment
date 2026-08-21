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

// NOTE : adaptez ces deux endpoints à votre API si les noms diffèrent :
// - liste des évaluateurs : GET /api/admin/users?role=EVALUATOR
// - affectation par offre : GET/PUT /api/offers/{id}/evaluators
export function EvaluatorsPanel({ session, offers, loadingOffers }: { session: Session; offers: JobOffer[]; loadingOffers: boolean }) {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  const [assigned, setAssigned] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    request<Evaluator[]>('/api/admin/users?role=EVALUATOR', session.accessToken)
      .then(setEvaluators)
      .catch(() => setError('Impossible de charger la liste des évaluateurs.'))
      .finally(() => setLoading(false));
  }, [session.accessToken]);

  const openOffer = (offer: JobOffer) => {
    setSelectedOffer(offer);
    setError('');
    request<number[]>(`/api/offers/${offer.id}/evaluators`, session.accessToken)
      .then(setAssigned)
      .catch(() => setAssigned([]));
  };

  const toggleEvaluator = (id: number) => setAssigned(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  const save = async () => {
    if (!selectedOffer) return;
    setSaving(true);
    try {
      await request(`/api/offers/${selectedOffer.id}/evaluators`, session.accessToken, { method: 'PUT', body: JSON.stringify({ evaluatorIds: assigned }) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'enregistrer l\'affectation.');
    } finally {
      setSaving(false);
    }
  };

  return <>
    <header>
      <div><small>ÉVALUATEURS</small><h1>Affectation des évaluateurs</h1><p>Choisissez une offre puis sélectionnez les évaluateurs qui doivent traiter ses candidatures.</p></div>
    </header>
    {error && <div className="alert">{error}</div>}
    <section className="table-card">
      <div className="table">
        <div className="tr head"><span>Offre</span><span>Département</span><span>Évaluateurs affectés</span><span>Actions</span></div>
        {loadingOffers ? <div className="loading">Chargement des offres…</div>
          : offers.length === 0 ? <div className="loading">Aucune offre pour le moment.</div>
          : offers.map(offer => <div className="tr" key={offer.id}>
            <span><b>{offer.title}</b></span>
            <span>{offer.department || '—'}</span>
            <span>{selectedOffer?.id === offer.id ? `${assigned.length} sélectionné(s)` : '—'}</span>
            <span className="actions"><button onClick={() => openOffer(offer)}>Affecter des évaluateurs</button></span>
          </div>)}
      </div>
    </section>

    {selectedOffer && <section className="table-card" style={{ padding: 20, marginTop: 16 }}>
      <h3 style={{ margin: '0 0 12px' }}>Évaluateurs pour « {selectedOffer.title} »</h3>
      {loading ? <div className="loading">Chargement des évaluateurs…</div> : evaluators.length === 0 ? <p style={{ color: '#8490a3' }}>Aucun évaluateur disponible.</p> : (
        <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          {evaluators.map(evaluator => <label key={evaluator.id} className="check" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={assigned.includes(evaluator.id)} onChange={() => toggleEvaluator(evaluator.id)} />
            {evaluator.firstName} {evaluator.lastName} <small style={{ color: '#8490a3' }}>({evaluator.email})</small>
          </label>)}
        </div>
      )}
      <div className="modal-actions">
        <button className="primary" disabled={saving} onClick={save}>{saving ? 'Enregistrement…' : "Enregistrer l'affectation"}</button>
      </div>
    </section>}
  </>;
}
import { useCallback, useEffect, useState } from 'react';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';
import type { JobOffer } from './form-builder/types';
import './evaluators.css';

type UserStatus = 'ACTIVE' | 'DISABLED' | 'BLOCKED';
type AssignedOffer = { id: number; title: string };
type Evaluator = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  assignedOffers: AssignedOffer[];
};

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...authHeaders(token), ...(init?.headers || {}) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function EvaluatorsPanel({ session, offers, loadingOffers }: { session: Session; offers: JobOffer[]; loadingOffers: boolean }) {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  const [assigned, setAssigned] = useState<number[]>([]);
  const [loadingEvaluators, setLoadingEvaluators] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadEvaluators = useCallback(async (showLoader = false) => {
    if (showLoader) setLoadingEvaluators(true);
    try {
      const items = await request<Evaluator[]>('/api/hr/evaluators', session.accessToken);
      setEvaluators(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger la liste des évaluateurs.');
    } finally {
      if (showLoader) setLoadingEvaluators(false);
    }
  }, [session.accessToken]);

  useEffect(() => { void loadEvaluators(true); }, [loadEvaluators]);

  const openOffer = async (offer: JobOffer) => {
    setSelectedOffer(offer);
    setAssigned([]);
    setError('');
    setNotice('');
    setLoadingAssignments(true);
    try {
      setAssigned(await request<number[]>(`/api/hr/offers/${offer.id}/evaluators`, session.accessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les affectations de cette offre.');
    } finally {
      setLoadingAssignments(false);
    }
  };

  const toggleEvaluator = (id: number) => {
    setNotice('');
    setAssigned(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const save = async () => {
    if (!selectedOffer) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const saved = await request<number[]>(`/api/hr/offers/${selectedOffer.id}/evaluators`, session.accessToken, {
        method: 'PUT',
        body: JSON.stringify({ evaluatorIds: assigned }),
      });
      setAssigned(saved);
      await loadEvaluators();
      setNotice('Affectation enregistrée avec succès.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'enregistrer l\'affectation.');
    } finally {
      setSaving(false);
    }
  };

  const assignedCount = (offerId: number) => evaluators.filter(evaluator =>
    evaluator.assignedOffers.some(offer => offer.id === offerId)).length;

  const assignmentLabel = (evaluator: Evaluator) => evaluator.assignedOffers.map(offer => offer.title).join(', ');

  return <>
    <header>
      <div><small>ÉVALUATEURS</small><h1>Affectation des évaluateurs</h1><p>Consultez leur disponibilité et leur statut avant de les affecter à une offre.</p></div>
    </header>
    {error && <div className="alert">{error}</div>}
    {notice && <div className="evaluator-notice">{notice}</div>}

    <section className="table-card evaluator-directory-card">
      <div className="evaluator-directory-head">
        <div><small>ÉQUIPE D'ÉVALUATION</small><h2>Liste des évaluateurs</h2></div>
        {!loadingEvaluators && <span>{evaluators.length} compte(s)</span>}
      </div>
      {loadingEvaluators ? <div className="loading">Chargement des évaluateurs…</div>
        : evaluators.length === 0 ? <p className="evaluator-empty">Aucun compte évaluateur n'est disponible.</p>
          : <div className="evaluator-directory-list">
            {evaluators.map(evaluator => {
              const active = evaluator.status === 'ACTIVE';
              return <article className={`evaluator-directory-row ${active ? '' : 'inactive'}`} key={evaluator.id}>
                <span className="evaluator-person"><b>{evaluator.firstName} {evaluator.lastName}</b><small>{evaluator.email}</small></span>
                <em className={`evaluator-status ${active ? 'active' : 'inactive'}`}>{active ? 'Actif' : evaluator.status === 'BLOCKED' ? 'Bloqué' : 'Désactivé'}</em>
                <span className={`evaluator-availability ${evaluator.assignedOffers.length ? 'busy' : 'free'}`}>
                  <b>{evaluator.assignedOffers.length ? 'Déjà affecté' : 'Libre'}</b>
                  {evaluator.assignedOffers.length > 0 && <small>{assignmentLabel(evaluator)}</small>}
                </span>
              </article>;
            })}
          </div>}
    </section>

    <section className="table-card evaluator-offers-table">
      <div className="table">
        <div className="tr head"><span>Offre</span><span>Département</span><span>Évaluateurs affectés</span><span>Actions</span></div>
        {loadingOffers ? <div className="loading">Chargement des offres…</div>
          : offers.length === 0 ? <div className="loading">Aucune offre pour le moment.</div>
          : offers.map(offer => <div className={`tr ${selectedOffer?.id === offer.id ? 'selected' : ''}`} key={offer.id}>
            <span><b>{offer.title}</b></span>
            <span>{offer.department || '—'}</span>
            <span>{loadingEvaluators ? '…' : assignedCount(offer.id)}</span>
            <span className="actions"><button onClick={() => void openOffer(offer)}>Gérer les évaluateurs</button></span>
          </div>)}
      </div>
    </section>

    {selectedOffer && <section className="table-card evaluator-assignment-card">
      <div className="evaluator-assignment-head">
        <div><small>OFFRE SÉLECTIONNÉE</small><h3>{selectedOffer.title}</h3></div>
        <span>{assigned.length} sélectionné(s)</span>
      </div>
      {loadingEvaluators || loadingAssignments ? <div className="loading">Chargement des évaluateurs…</div>
        : evaluators.length === 0 ? <p className="evaluator-empty">Aucun compte évaluateur n'est disponible.</p>
          : <div className="evaluator-list">
            {evaluators.map(evaluator => {
              const selected = assigned.includes(evaluator.id);
              const active = evaluator.status === 'ACTIVE';
              const otherOffers = evaluator.assignedOffers.filter(offer => offer.id !== selectedOffer.id);
              const assignedHere = evaluator.assignedOffers.some(offer => offer.id === selectedOffer.id);
              return <label key={evaluator.id} className={`evaluator-row ${active ? '' : 'inactive'}`}>
                <input type="checkbox" checked={selected} disabled={!active && !selected} onChange={() => toggleEvaluator(evaluator.id)} />
                <span className="evaluator-person"><b>{evaluator.firstName} {evaluator.lastName}</b><small>{evaluator.email}</small></span>
                <em className={`evaluator-status ${active ? 'active' : 'inactive'}`}>{active ? 'Actif' : evaluator.status === 'BLOCKED' ? 'Bloqué' : 'Désactivé'}</em>
                <span className={`evaluator-availability ${evaluator.assignedOffers.length ? 'busy' : 'free'}`}>
                  <b>{assignedHere ? 'Affecté à cette offre' : evaluator.assignedOffers.length ? 'Déjà affecté' : 'Libre'}</b>
                  {otherOffers.length > 0 && <small>{otherOffers.map(offer => offer.title).join(', ')}</small>}
                  {!active && selected && <small>Décochez pour retirer cette affectation inactive.</small>}
                </span>
              </label>;
            })}
          </div>}
      <div className="modal-actions evaluator-actions">
        <button className="primary" disabled={saving || loadingAssignments || loadingEvaluators} onClick={() => void save()}>
          {saving ? 'Enregistrement…' : "Enregistrer l'affectation"}
        </button>
      </div>
    </section>}
  </>;
}

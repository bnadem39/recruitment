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
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...authHeaders(token), ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function EvaluatorsPanel({
  session,
  offers,
  loadingOffers,
}: {
  session: Session;
  offers: JobOffer[];
  loadingOffers: boolean;
}) {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);
  const [assigned, setAssigned] = useState<number[]>([]);
  const [loadingEvaluators, setLoadingEvaluators] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadEvaluators = useCallback(async () => {
    setLoadingEvaluators(true);
    try {
      setEvaluators(await request<Evaluator[]>('/api/hr/evaluators', session.accessToken));
    } catch {
      setError('Could not load the evaluator list.');
    } finally {
      setLoadingEvaluators(false);
    }
  }, [session.accessToken]);

  useEffect(() => {
    void loadEvaluators();
  }, [loadEvaluators]);

  const openOffer = async (offer: JobOffer) => {
    setSelectedOffer(offer);
    setAssigned([]);
    setError('');
    setLoadingAssignments(true);
    try {
      setAssigned(
        await request<number[]>(`/api/hr/offers/${offer.id}/evaluators`, session.accessToken)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load the assignments for this offer.'
      );
    } finally {
      setLoadingAssignments(false);
    }
  };

  const toggleEvaluator = (id: number) =>
    setAssigned(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    );

  const save = async () => {
    if (!selectedOffer) return;
    setSaving(true);
    setError('');
    try {
      await request(`/api/hr/offers/${selectedOffer.id}/evaluators`, session.accessToken, {
        method: 'PUT',
        body: JSON.stringify({ evaluatorIds: assigned }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the assignment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header>
        <div>
          <small>EVALUATORS</small>
          <h1>Evaluator assignment</h1>
          <p>Choose an offer, then select the evaluators who should review its applications.</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="hr-table-card">
        <div className="hr-table evaluators-table">
          <div className="tr head">
            <span>Offer</span>
            <span>Department</span>
            <span>Assigned evaluators</span>
            <span>Actions</span>
          </div>

          {loadingOffers ? (
            <div className="loading">Loading offers…</div>
          ) : offers.length === 0 ? (
            <div className="loading">No offers yet.</div>
          ) : (
            offers.map(offer => {
              const isSelected = selectedOffer?.id === offer.id;

              return (
                <div className="tr" key={offer.id}>
                  <span className="job-offer-title">
                    <b>{offer.title}</b>
                    <small>{offer.department || 'No department'}</small>
                  </span>

                  <span className="job-offer-date">{offer.department || '—'}</span>

                  <span>
                    <em className={isSelected ? 'active' : 'disabled'}>
                      <i></i>
                      {isSelected ? `${assigned.length} selected` : 'Not selected'}
                    </em>
                  </span>

                  <span className="actions job-offer-actions">
                    <button
                      type="button"
                      className="hr-btn-secondary"
                      onClick={() => void openOffer(offer)}
                    >
                      {isSelected ? '✓ Managing' : 'Assign evaluators'}
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {selectedOffer && (
        <section className="hr-table-card evaluators-assignment">
          <div className="evaluators-assignment-head">
            <small>SELECTED OFFER</small>
            <h3>Evaluators for "{selectedOffer.title}"</h3>
          </div>

          {loadingAssignments || loadingEvaluators ? (
            <div className="loading">Loading evaluators…</div>
          ) : evaluators.length === 0 ? (
            <p className="empty-hint">No evaluators available.</p>
          ) : (
            <div className="hr-evaluator-list">
              {evaluators.map(evaluator => (
                <label className="check" key={evaluator.id}>
                  <input
                    type="checkbox"
                    checked={assigned.includes(evaluator.id)}
                    onChange={() => toggleEvaluator(evaluator.id)}
                  />
                  <b>
                    {evaluator.firstName} {evaluator.lastName}
                  </b>
                  <small>({evaluator.email})</small>
                </label>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="hr-btn-primary"
              disabled={saving}
              onClick={() => void save()}
            >
              {saving ? 'Saving…' : 'Save assignment'}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
import { useEffect, useState } from 'react';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';

type JobOffer = {
  id: number;
  title: string;
};

type Evaluation = {
  applicationId: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  jobOfferId: number;
  jobOfferTitle: string;
  formScore: number;
  formEvaluatorName: string | null;
  formDecision: string | null;
  interviewScore: number | null;
  interviewEvaluatorName: string | null;
  finalDecision: string;
  formEvaluatedAt: string;
  interviewScheduledAt: string | null;
  finalDecisionAt: string | null;
};

type DetailedEvaluation = {
  applicationId: number;
  candidateId: number;
  candidateName: string;
  candidateEmail: string;
  jobOfferId: number;
  jobOfferTitle: string;
  applicationStatus: string;
  formEvaluation: {
    score: number;
    decision: string;
    hrComment: string | null;
    candidateComment: string | null;
    evaluatedAt: string;
  };
  interviewEvaluation: {
    technicalScore: number;
    communicationScore: number;
    motivationScore: number;
    professionalismScore: number;
    overallScore: number;
    recommendation: string | null;
    hrComment: string | null;
    candidateComment: string | null;
    evaluatedAt: string;
  } | null;
  finalDecision: string;
  finalDecisionAt: string | null;
};

const decisionColors: Record<string, string> = {
  PENDING: '#f59e0b',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
};

const decisionBgColors: Record<string, string> = {
  PENDING: '#fffbf0',
  ACCEPTED: '#f0fdf4',
  REJECTED: '#fef2f2',
};

async function request<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${url}`, {
    ...init,
    headers: { ...authHeaders(token), ...(init?.headers || {}) },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export function HrCandidateEvaluationsPage({ session }: { session: Session }) {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<DetailedEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingEvals, setLoadingEvals] = useState(false);
  const [error, setError] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [decidingId, setDecidingId] = useState<number | null>(null);
  const [confirmDecision, setConfirmDecision] = useState<'ACCEPTED' | 'REJECTED' | null>(null);

  const loadJobOffers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await request<JobOffer[]>('/api/offers', session.accessToken);
      setJobOffers(data);
    } catch (err: any) {
      setError(err.message || 'Could not load job offers');
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluations = async (offerId: number) => {
    setLoadingEvals(true);
    setError('');
    try {
      const data = await request<Evaluation[]>(
        `/api/hr/job-offers/${offerId}/evaluations`,
        session.accessToken
      );
      setEvaluations(data);
    } catch (err: any) {
      setError(err.message || 'Could not load evaluations');
    } finally {
      setLoadingEvals(false);
    }
  };

  const loadDetailedEvaluation = async (offerId: number, appId: number) => {
    try {
      const data = await request<DetailedEvaluation>(
        `/api/hr/job-offers/${offerId}/evaluations/${appId}`,
        session.accessToken
      );
      setSelectedEvaluation(data);
      setShowDetail(true);
    } catch (err: any) {
      setError(err.message || 'Could not load evaluation details');
    }
  };

  const makeFinalDecision = async (offerId: number, appId: number, decision: 'ACCEPTED' | 'REJECTED') => {
    try {
      await request(`/api/hr/job-offers/${offerId}/evaluations/${appId}/final-decision`, session.accessToken, {
        method: 'PATCH',
        body: JSON.stringify({ decision }),
      });
      await loadEvaluations(offerId);
      setDecidingId(null);
      setConfirmDecision(null);
      setShowDetail(false);
    } catch (err: any) {
      setError(err.message || 'Could not make decision');
    }
  };

  useEffect(() => {
    loadJobOffers();
  }, []);

  useEffect(() => {
    if (selectedOffer) {
      loadEvaluations(selectedOffer);
    }
  }, [selectedOffer]);

  return (
    <div>
      <style>{`
        .evaluations-container {
          padding: 0;
        }

        .evaluations-header {
          margin-bottom: 32px;
        }

        .evaluations-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
        }

        .job-offer-selector {
          margin-bottom: 28px;
        }

        .job-offer-selector label {
          display: block;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .job-offer-selector select {
          width: 100%;
          max-width: 400px;
          padding: 12px 14px;
          border: 1px solid #dce2ea;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          color: #1f2937;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .job-offer-selector select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .evaluations-list {
          display: grid;
          gap: 12px;
        }

        .evaluation-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
          gap: 16px;
          align-items: center;
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .evaluation-row:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .evaluation-table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto;
          gap: 16px;
          padding: 12px 16px;
          background: #f9fafb;
          border-radius: 8px;
          margin-bottom: 8px;
          font-weight: 600;
          font-size: 13px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .candidate-cell {
          font-weight: 500;
          color: #1f2937;
        }

        .score-cell {
          text-align: center;
          color: #1f2937;
          font-weight: 500;
        }

        .decision-badge {
          text-align: center;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .action-cell {
          text-align: right;
        }

        .view-btn {
          padding: 8px 12px;
          background: #f3f4f6;
          color: #3b82f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .view-btn:hover {
          background: #e5e7eb;
          border-color: #3b82f6;
        }

        .detail-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .detail-modal {
          background: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 700px;
          width: 90%;
          max-height: 85vh;
          overflow-y: auto;
        }

        .detail-modal-header {
          margin-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 20px;
        }

        .detail-modal-header h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #1f2937;
        }

        .detail-modal-header p {
          margin: 8px 0 0 0;
          font-size: 14px;
          color: #6b7280;
        }

        .evaluation-section {
          margin-bottom: 28px;
        }

        .evaluation-section-title {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          color: #374151;
        }

        .evaluation-row-detail {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          padding: 12px 0;
        }

        .eval-item {
          display: flex;
          flex-direction: column;
        }

        .eval-label {
          font-size: 11px;
          color: #9ca3af;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .eval-value {
          font-size: 14px;
          color: #1f2937;
          font-weight: 500;
        }

        .eval-comment {
          background: #f9fafb;
          border-left: 3px solid #3b82f6;
          padding: 12px;
          border-radius: 4px;
          font-size: 13px;
          color: #4b5563;
          white-space: pre-wrap;
          margin-top: 8px;
        }

        .final-decision-section {
          background: #f0f9ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 16px;
          margin-top: 20px;
        }

        .final-decision-label {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .decision-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .decide-btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
          flex: 1;
        }

        .decide-btn-accept {
          background: #10b981;
          color: white;
        }

        .decide-btn-accept:hover {
          background: #059669;
        }

        .decide-btn-reject {
          background: #ef4444;
          color: white;
        }

        .decide-btn-reject:hover {
          background: #dc2626;
        }

        .confirm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
        }

        .confirm-modal {
          background: white;
          border-radius: 12px;
          padding: 28px;
          max-width: 400px;
          width: 90%;
          text-align: center;
        }

        .confirm-modal h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .confirm-modal p {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #6b7280;
        }

        .confirm-actions {
          display: flex;
          gap: 12px;
        }

        .confirm-btn {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .confirm-btn-confirm {
          background: #ef4444;
          color: white;
        }

        .confirm-btn-confirm.accept {
          background: #10b981;
        }

        .confirm-btn-cancel {
          background: #e5e7eb;
          color: #1f2937;
        }

        .empty-state {
          text-align: center;
          padding: 48px 20px;
          color: #9ca3af;
        }
      `}</style>

      <div className="evaluations-container">
        <div className="evaluations-header">
          <h1>Candidate Evaluations</h1>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <div className="job-offer-selector">
          <label htmlFor="offer-select">Select Job Offer:</label>
          <select
            id="offer-select"
            value={selectedOffer || ''}
            onChange={(e) => setSelectedOffer(e.target.value ? Number(e.target.value) : null)}
            disabled={loading}
          >
            <option value="">-- Choose a job offer --</option>
            {jobOffers.map((offer) => (
              <option key={offer.id} value={offer.id}>
                {offer.title}
              </option>
            ))}
          </select>
        </div>

        {selectedOffer ? (
          <>
            {loadingEvals ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                Loading evaluations...
              </div>
            ) : evaluations.length === 0 ? (
              <div className="empty-state">No evaluated candidates for this job offer</div>
            ) : (
              <>
                <div className="evaluation-table-header">
                  <div>Candidate</div>
                  <div>Form</div>
                  <div>Interview</div>
                  <div>Decision</div>
                  <div></div>
                  <div></div>
                </div>

                <div className="evaluations-list">
                  {evaluations.map((eval_) => (
                    <div
                      key={eval_.applicationId}
                      className="evaluation-row"
                      onClick={() => loadDetailedEvaluation(eval_.jobOfferId, eval_.applicationId)}
                    >
                      <div className="candidate-cell">
                        <div style={{ fontWeight: 500 }}>{eval_.candidateName}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                          {eval_.candidateEmail}
                        </div>
                      </div>

                      <div className="score-cell">
                        {eval_.formScore ? `${eval_.formScore}/100` : '—'}
                      </div>

                      <div className="score-cell">
                        {eval_.interviewScore ? `${Math.round(Number(eval_.interviewScore))}/100` : '—'}
                      </div>

                      <div className="decision-badge" style={{ background: decisionBgColors[eval_.finalDecision], color: decisionColors[eval_.finalDecision] }}>
                        {eval_.finalDecision}
                      </div>

                      <div></div>

                      <div className="action-cell">
                        <button className="view-btn">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="empty-state">Select a job offer to view evaluations</div>
        )}

        {showDetail && selectedEvaluation && (
          <div className="detail-modal-overlay" onClick={() => setShowDetail(false)}>
            <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="detail-modal-header">
                <h2>{selectedEvaluation.candidateName}</h2>
                <p>{selectedEvaluation.jobOfferTitle}</p>
              </div>

              {/* Form Evaluation */}
              <div className="evaluation-section">
                <div className="evaluation-section-title">📋 Form Evaluation</div>
                <div className="evaluation-row-detail">
                  <div className="eval-item">
                    <div className="eval-label">Score</div>
                    <div className="eval-value">
                      {selectedEvaluation.formEvaluation.score}/100
                    </div>
                  </div>
                  <div className="eval-item">
                    <div className="eval-label">Decision</div>
                    <div className="eval-value">
                      {selectedEvaluation.formEvaluation.decision}
                    </div>
                  </div>
                  <div className="eval-item">
                    <div className="eval-label">Evaluated At</div>
                    <div className="eval-value">
                      {new Date(selectedEvaluation.formEvaluation.evaluatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                {selectedEvaluation.formEvaluation.hrComment && (
                  <div className="eval-comment">
                    <strong>HR Comment:</strong>
                    <div style={{ marginTop: 8 }}>
                      {selectedEvaluation.formEvaluation.hrComment}
                    </div>
                  </div>
                )}
              </div>

              {/* Interview Evaluation */}
              {selectedEvaluation.interviewEvaluation && (
                <div className="evaluation-section">
                  <div className="evaluation-section-title">🎥 Interview Evaluation</div>
                  <div className="evaluation-row-detail">
                    <div className="eval-item">
                      <div className="eval-label">Technical</div>
                      <div className="eval-value">
                        {selectedEvaluation.interviewEvaluation.technicalScore}
                      </div>
                    </div>
                    <div className="eval-item">
                      <div className="eval-label">Communication</div>
                      <div className="eval-value">
                        {selectedEvaluation.interviewEvaluation.communicationScore}
                      </div>
                    </div>
                    <div className="eval-item">
                      <div className="eval-label">Motivation</div>
                      <div className="eval-value">
                        {selectedEvaluation.interviewEvaluation.motivationScore}
                      </div>
                    </div>
                    <div className="eval-item">
                      <div className="eval-label">Professionalism</div>
                      <div className="eval-value">
                        {selectedEvaluation.interviewEvaluation.professionalismScore}
                      </div>
                    </div>
                    <div className="eval-item">
                      <div className="eval-label">Overall</div>
                      <div className="eval-value">
                        {selectedEvaluation.interviewEvaluation.overallScore}
                      </div>
                    </div>
                    <div className="eval-item">
                      <div className="eval-label">Recommendation</div>
                      <div className="eval-value">
                        {selectedEvaluation.interviewEvaluation.recommendation || '—'}
                      </div>
                    </div>
                  </div>
                  {selectedEvaluation.interviewEvaluation.hrComment && (
                    <div className="eval-comment">
                      <strong>HR Comment:</strong>
                      <div style={{ marginTop: 8 }}>
                        {selectedEvaluation.interviewEvaluation.hrComment}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Final Decision */}
              <div className="final-decision-section">
                <div className="final-decision-label">
                  ✓ Final Decision:{' '}
                  <span
                    style={{
                      color: decisionColors[selectedEvaluation.finalDecision],
                    }}
                  >
                    {selectedEvaluation.finalDecision}
                  </span>
                </div>

                {selectedEvaluation.finalDecision === 'PENDING' && (
                  <div className="decision-buttons">
                    <button
                      className="decide-btn decide-btn-accept"
                      onClick={() => {
                        setDecidingId(selectedEvaluation.applicationId);
                        setConfirmDecision('ACCEPTED');
                      }}
                    >
                      ✓ Accept Candidate
                    </button>
                    <button
                      className="decide-btn decide-btn-reject"
                      onClick={() => {
                        setDecidingId(selectedEvaluation.applicationId);
                        setConfirmDecision('REJECTED');
                      }}
                    >
                      ✕ Reject Candidate
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {confirmDecision && decidingId && (
          <div className="confirm-overlay" onClick={() => setConfirmDecision(null)}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>
                {confirmDecision === 'ACCEPTED'
                  ? 'Accept Candidate?'
                  : 'Reject Candidate?'}
              </h3>
              <p>
                {confirmDecision === 'ACCEPTED'
                  ? 'This candidate will be marked as accepted and will be notified.'
                  : 'This candidate will be marked as rejected and will be notified.'}
              </p>
              <div className="confirm-actions">
                <button
                  className={`confirm-btn confirm-btn-confirm ${
                    confirmDecision === 'ACCEPTED' ? 'accept' : ''
                  }`}
                  onClick={() =>
                    makeFinalDecision(selectedOffer!, decidingId, confirmDecision)
                  }
                >
                  {confirmDecision === 'ACCEPTED' ? 'Accept' : 'Reject'}
                </button>
                <button
                  className="confirm-btn confirm-btn-cancel"
                  onClick={() => {
                    setConfirmDecision(null);
                    setDecidingId(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

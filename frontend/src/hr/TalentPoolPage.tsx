import { useEffect, useState } from 'react';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';

type TalentPoolEntry = {
  id: number;
  candidateId: number;
  candidateFirstName: string;
  candidateLastName: string;
  candidateEmail: string;
  candidatePhone: string | null;
  category: string;
  skills: string | null;
  notes: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'WITHDRAWN';
  consentGiven: boolean;
  consentDate: string | null;
  consentExpirationDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type Filter = 'all' | 'ACTIVE' | 'EXPIRED' | 'WITHDRAWN';

const statusColors: Record<string, string> = {
  ACTIVE: '#10b981',
  EXPIRED: '#f59e0b',
  WITHDRAWN: '#6b7280',
};

const statusBgColors: Record<string, string> = {
  ACTIVE: '#f0fdf4',
  EXPIRED: '#fffbf0',
  WITHDRAWN: '#f9fafb',
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

export function TalentPoolPage({ session }: { session: Session }) {
  const [entries, setEntries] = useState<TalentPoolEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<TalentPoolEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<TalentPoolEntry | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (search) params.append('search', search);

      const data = await request<TalentPoolEntry[]>(
        `/api/hr/talent-pool?${params.toString()}`,
        session.accessToken
      );
      setEntries(data);
    } catch (err: any) {
      setError(err.message || 'Could not load talent pool');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [filter]);

  useEffect(() => {
    if (search) {
      const timer = setTimeout(loadEntries, 500);
      return () => clearTimeout(timer);
    }
  }, [search]);

  useEffect(() => {
    let filtered = entries;
    if (filter !== 'all') {
      filtered = filtered.filter((e) => e.status === filter);
    }
    setFilteredEntries(filtered);
  }, [entries, filter]);

  const handleStatusChange = async (entryId: number, newStatus: string) => {
    try {
      if (newStatus === 'EXPIRED') {
        await request(`/api/hr/talent-pool/${entryId}`, session.accessToken, {
          method: 'DELETE',
        });
      } else if (newStatus === 'WITHDRAWN') {
        await request(`/api/hr/talent-pool/${entryId}`, session.accessToken, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'WITHDRAWN' }),
        });
      }
      loadEntries();
      setSelectedEntry(null);
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Could not update entry');
    }
  };

  return (
    <div>
      <style>{`
        .talent-pool-container {
          padding: 0;
        }

        .talent-pool-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .talent-pool-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
        }

        .talent-pool-controls {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }

        .talent-pool-search {
          flex: 1;
          min-width: 200px;
          padding: 12px 16px;
          border: 1px solid #dce2ea;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .talent-pool-search:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .talent-pool-filters {
          display: flex;
          gap: 8px;
        }

        .filter-btn {
          padding: 10px 16px;
          border: 1px solid #dce2ea;
          border-radius: 8px;
          background: white;
          color: #4b5563;
          cursor: pointer;
          font-weight: 500;
          font-size: 13px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .filter-btn:hover {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .filter-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .talent-pool-list {
          display: grid;
          gap: 16px;
        }

        .talent-pool-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .talent-pool-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .talent-pool-card-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }

        .candidate-info h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .candidate-info p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .talent-pool-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
          font-size: 13px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
        }

        .detail-label {
          color: #9ca3af;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .detail-value {
          color: #1f2937;
          font-weight: 500;
        }

        .talent-pool-actions {
          display: flex;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }

        .action-btn {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #dce2ea;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #3b82f6;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: #f0f9ff;
          border-color: #3b82f6;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 12px;
          padding: 28px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          margin-bottom: 20px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }

        .modal-content {
          margin-bottom: 24px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-primary {
          padding: 12px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          padding: 12px 20px;
          background: #f3f4f6;
          color: #1f2937;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .empty-state {
          text-align: center;
          padding: 48px 20px;
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-state-text {
          color: #6b7280;
          font-size: 14px;
        }
      `}</style>

      <div className="talent-pool-container">
        <div className="talent-pool-header">
          <h1>Talent Pool</h1>
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

        <div className="talent-pool-controls">
          <input
            type="text"
            placeholder="Search candidate name or email..."
            className="talent-pool-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="talent-pool-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'ACTIVE' ? 'active' : ''}`}
              onClick={() => setFilter('ACTIVE')}
            >
              Active
            </button>
            <button
              className={`filter-btn ${filter === 'EXPIRED' ? 'active' : ''}`}
              onClick={() => setFilter('EXPIRED')}
            >
              Expired
            </button>
            <button
              className={`filter-btn ${filter === 'WITHDRAWN' ? 'active' : ''}`}
              onClick={() => setFilter('WITHDRAWN')}
            >
              Withdrawn
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
            Loading talent pool...
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-text">No candidates in talent pool</div>
          </div>
        ) : (
          <div className="talent-pool-list">
            {filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="talent-pool-card"
                onClick={() => {
                  setSelectedEntry(entry);
                  setShowModal(true);
                }}
              >
                <div className="talent-pool-card-header">
                  <div className="candidate-info">
                    <h3>
                      {entry.candidateFirstName} {entry.candidateLastName}
                    </h3>
                    <p>{entry.candidateEmail}</p>
                  </div>
                  <div
                    className="status-badge"
                    style={{
                      background: statusBgColors[entry.status],
                      color: statusColors[entry.status],
                    }}
                  >
                    {entry.status}
                  </div>
                </div>

                <div className="talent-pool-details">
                  <div className="detail-item">
                    <div className="detail-label">Category</div>
                    <div className="detail-value">{entry.category || '—'}</div>
                  </div>
                  {entry.candidatePhone && (
                    <div className="detail-item">
                      <div className="detail-label">Phone</div>
                      <div className="detail-value">{entry.candidatePhone}</div>
                    </div>
                  )}
                  <div className="detail-item">
                    <div className="detail-label">Added</div>
                    <div className="detail-value">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {entry.notes && (
                  <div style={{ fontSize: 13, color: '#4b5563', marginTop: 12 }}>
                    <strong>Notes:</strong> {entry.notes.substring(0, 100)}
                    {entry.notes.length > 100 ? '...' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && selectedEntry && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {selectedEntry.candidateFirstName} {selectedEntry.candidateLastName}
                </h2>
              </div>

              <div className="modal-content">
                <div style={{ marginBottom: 16 }}>
                  <div className="detail-label">Email</div>
                  <div style={{ color: '#1f2937', fontSize: 14 }}>{selectedEntry.candidateEmail}</div>
                </div>

                {selectedEntry.candidatePhone && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="detail-label">Phone</div>
                    <div style={{ color: '#1f2937', fontSize: 14 }}>{selectedEntry.candidatePhone}</div>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <div className="detail-label">Category</div>
                  <div style={{ color: '#1f2937', fontSize: 14 }}>{selectedEntry.category || '—'}</div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div className="detail-label">Current Status</div>
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      background: statusBgColors[selectedEntry.status],
                      color: statusColors[selectedEntry.status],
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {selectedEntry.status}
                  </div>
                </div>

                {selectedEntry.notes && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="detail-label">HR Notes</div>
                    <div style={{ color: '#1f2937', fontSize: 14, whiteSpace: 'pre-wrap' }}>
                      {selectedEntry.notes}
                    </div>
                  </div>
                )}

                {selectedEntry.consentGiven && selectedEntry.consentExpirationDate && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="detail-label">Consent Expires</div>
                    <div style={{ color: '#1f2937', fontSize: 14 }}>
                      {new Date(selectedEntry.consentExpirationDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    handleStatusChange(selectedEntry.id, 'EXPIRED');
                  }}
                >
                  Mark Expired
                </button>
                {selectedEntry.status !== 'WITHDRAWN' && (
                  <button
                    className="btn-primary"
                    onClick={() => {
                      handleStatusChange(selectedEntry.id, 'WITHDRAWN');
                    }}
                  >
                    Withdraw
                  </button>
                )}
                <button className="btn-secondary" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

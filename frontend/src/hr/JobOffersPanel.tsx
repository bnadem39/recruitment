import { useState } from 'react';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';
import type { JobOffer } from './form-builder/types';
import type { FormListItem } from './FormsPanel';

async function request<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...(init?.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

type OfferFormValues = {
  title: string;
  department: string;
  location: string;
  contractType: string;
  numberOfPositions: string;
  deadline: string;
  description: string;
  formId: string;
};

function formatDateForInput(dateValue?: string): string {
  if (!dateValue) return '';

  /*
   * Si la valeur est déjà envoyée comme "2026-09-30",
   * il ne faut pas la convertir avec timezone.
   */
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function createInitialForm(offer?: JobOffer): OfferFormValues {
  return {
    title: offer?.title ?? '',
    department: offer?.department ?? '',
    location: offer?.location ?? '',
    contractType: offer?.contractType ?? 'CDI',
    numberOfPositions: String(offer?.numberOfPositions ?? 1),
    deadline: formatDateForInput(offer?.deadline),
    description: offer?.description ?? '',
    formId: offer?.formId ? String(offer.formId) : '',
  };
}

export function JobOffersPanel({
  session,
  offers,
  forms,
  loading,
  reload,
  setError,
}: {
  session: Session;
  offers: JobOffer[];
  forms: FormListItem[];
  loading: boolean;
  reload: () => void;
  setError: (message: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<JobOffer | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [visibilityId, setVisibilityId] = useState<number | null>(null);

  const openCreateModal = () => {
    setEditingOffer(null);
    setIsModalOpen(true);
  };

  const openEditModal = (offer: JobOffer) => {
    setEditingOffer(offer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingOffer(null);
  };

  const copyLink = async (offerId: number) => {
    const link = `${window.location.origin}/?applyOffer=${offerId}`;

    try {
      await navigator.clipboard.writeText(link);

      setCopiedId(offerId);

      window.setTimeout(() => {
        setCopiedId(current => (current === offerId ? null : current));
      }, 2000);
    } catch {
      setError('Could not copy the application link.');
    }
  };

  const deleteOffer = async (offer: JobOffer) => {
    const confirmed = window.confirm(
      `Delete the job offer "${offer.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(offer.id);
    setError('');

    try {
      await request<void>(`/api/offers/${offer.id}`, session.accessToken, {
        method: 'DELETE',
      });

      reload();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not delete the job offer.';

      setError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const setVisibility = async (offer: JobOffer, visible: boolean) => {
    setVisibilityId(offer.id);
    setError('');
    try {
      await request<JobOffer>(
        `/api/offers/${offer.id}/${visible ? 'publish' : 'hide'}`,
        session.accessToken,
        { method: 'POST' }
      );
      reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Could not update job-offer visibility.'
      );
    } finally {
      setVisibilityId(null);
    }
  };

  return (
    <>
      <header>
        <div>
          <small>JOB OFFERS</small>
          <h1>Job offers</h1>
          <p>Create, edit, delete and share application links with candidates.</p>
        </div>

        <button
          type="button"
          className="hr-btn-primary"
          onClick={openCreateModal}
        >
          + New job offer
        </button>
      </header>

      <section className="hr-table-card">
        <div className="hr-table job-offers-table">
          <div className="tr head">
            <span>Title</span>
            <span>Deadline</span>
            <span>Visibility</span>
            <span>Form</span>
            <span>Application link</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="loading">Loading job offers…</div>
          ) : offers.length === 0 ? (
            <div className="loading">No job offers yet.</div>
          ) : (
            offers.map(offer => {
              const applicationLink = `${window.location.origin}/?applyOffer=${offer.id}`;

              return (
                <div className="tr" key={offer.id}>
                  <span className="job-offer-title">
                    <b>{offer.title}</b>

                    <small>
                      {offer.department || 'No department'}
                      {offer.location ? ` · ${offer.location}` : ''}
                    </small>
                  </span>

                  <span className="job-offer-date">
                    {offer.deadline
                      ? new Date(offer.deadline).toLocaleDateString('fr-FR')
                      : 'No deadline'}
                  </span>

                  <span>
                    <em className={offer.status === 'PUBLISHED' ? 'active' : 'disabled'}>
                      <i></i>
                      {offer.status === 'PUBLISHED' ? 'Visible' : 'Hidden'}
                    </em>
                  </span>

                  <span>
                    <em className={offer.formId ? 'active' : 'disabled'}>
                      <i></i>
                      {offer.formId ? 'Linked' : 'Not linked'}
                    </em>
                  </span>

                  <span className="job-offer-link" title={applicationLink}>
                    {applicationLink}
                  </span>

                  <span className="actions job-offer-actions">
                    <button
                      type="button"
                      className="hr-btn-secondary"
                      onClick={() => openEditModal(offer)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="hr-btn-secondary"
                      disabled={visibilityId === offer.id}
                      onClick={() => void setVisibility(offer, offer.status !== 'PUBLISHED')}
                    >
                      {visibilityId === offer.id
                        ? 'Saving…'
                        : offer.status === 'PUBLISHED'
                          ? 'Hide'
                          : 'Make visible'}
                    </button>

                    <button
                      type="button"
                      className="hr-btn-secondary"
                      onClick={() => void copyLink(offer.id)}
                    >
                      {copiedId === offer.id ? '✓ Copied' : 'Copy'}
                    </button>

                    <button
                      type="button"
                      className="hr-btn-danger"
                      disabled={deletingId === offer.id}
                      onClick={() => void deleteOffer(offer)}
                    >
                      {deletingId === offer.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      {isModalOpen && (
        <OfferModal
          session={session}
          forms={forms}
          offer={editingOffer}
          close={closeModal}
          done={() => {
            closeModal();
            reload();
          }}
          setError={setError}
        />
      )}
    </>
  );
}

function OfferModal({
  session,
  forms,
  offer,
  close,
  done,
  setError,
}: {
  session: Session;
  forms: FormListItem[];
  offer: JobOffer | null;
  close: () => void;
  done: () => void;
  setError: (message: string) => void;
}) {
  const isEditing = offer !== null;

  const [form, setForm] = useState<OfferFormValues>(() =>
    createInitialForm(offer ?? undefined)
  );

  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  const updateForm = <K extends keyof OfferFormValues>(
    property: K,
    value: OfferFormValues[K]
  ) => {
    setForm(current => ({
      ...current,
      [property]: value,
    }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setLocalError('The job offer title is required.');
      return;
    }

    setBusy(true);
    setLocalError('');
    setError('');

    const payload = {
      title: form.title.trim(),
      department: form.department.trim() || undefined,
      location: form.location.trim() || undefined,
      contractType: form.contractType,
      numberOfPositions: Math.max(1, Number(form.numberOfPositions) || 1),
      deadline: form.deadline || undefined,
      description: form.description.trim() || undefined,
      formId: form.formId ? Number(form.formId) : undefined,
    };

    try {
      if (isEditing && offer) {
        await request<JobOffer>(
          `/api/offers/${offer.id}`,
          session.accessToken,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
      } else {
        await request<JobOffer>('/api/offers', session.accessToken, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      done();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isEditing
            ? 'Could not update the job offer.'
            : 'Could not create the job offer.';

      setLocalError(message);
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !busy) {
          close();
        }
      }}
    >
      <form className="modal hr-offer-modal" onSubmit={submit}>
        <button
          type="button"
          className="close"
          onClick={close}
          disabled={busy}
          aria-label="Close"
        >
          ×
        </button>

        <small>{isEditing ? 'EDIT JOB OFFER' : 'NEW JOB OFFER'}</small>

        <h2>{isEditing ? 'Edit job offer' : 'Create a job offer'}</h2>

        {localError && <div className="alert">{localError}</div>}

        <label>
          Title
          <input
            required
            value={form.title}
            onChange={event => updateForm('title', event.target.value)}
            placeholder="e.g. Frontend Developer"
          />
        </label>

        <div className="two">
          <label>
            Department <small>(optional)</small>
            <input
              value={form.department}
              onChange={event => updateForm('department', event.target.value)}
              placeholder="e.g. Finance"
            />
          </label>

          <label>
            Location <small>(optional)</small>
            <input
              value={form.location}
              onChange={event => updateForm('location', event.target.value)}
              placeholder="e.g. Tunis"
            />
          </label>
        </div>

        <div className="two">
          <label>
            Contract type
            <select
              value={form.contractType}
              onChange={event => updateForm('contractType', event.target.value)}
            >
              <option value="CDI">Permanent (CDI)</option>
              <option value="CDD">Fixed-term (CDD)</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="FREELANCE">Freelance</option>
            </select>
          </label>

          <label>
            Number of positions
            <input
              type="number"
              min="1"
              value={form.numberOfPositions}
              onChange={event =>
                updateForm('numberOfPositions', event.target.value)
              }
            />
          </label>
        </div>

        <label>
          Deadline <small>(optional)</small>
          <input
            type="date"
            value={form.deadline}
            onChange={event => updateForm('deadline', event.target.value)}
          />
        </label>

        <label>
          Description <small>(optional)</small>
          <textarea
            rows={4}
            value={form.description}
            onChange={event => updateForm('description', event.target.value)}
            placeholder="Describe responsibilities, requirements and candidate profile."
          />
        </label>

        <label>
          Application form
          <select
            value={form.formId}
            onChange={event => updateForm('formId', event.target.value)}
          >
            <option value="">No form linked yet</option>

            {forms
              .filter(formItem => formItem.active)
              .map(formItem => (
                <option key={formItem.id} value={formItem.id}>
                  {formItem.title}
                </option>
              ))}
          </select>
        </label>

        <div className="modal-actions">
          <button type="button" disabled={busy} onClick={close}>
            Cancel
          </button>

          <button className="primary" disabled={busy}>
            {busy
              ? isEditing
                ? 'Saving…'
                : 'Creating…'
              : isEditing
                ? 'Save changes'
                : 'Create offer'}
          </button>
        </div>
      </form>
    </div>
  );
}

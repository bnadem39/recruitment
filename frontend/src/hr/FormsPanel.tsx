import { FormEvent, useState } from 'react';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';

export type FormListItem = {
  id: number;
  title: string;
  description?: string;
  active: boolean;
  updatedAt: string;
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

export function FormsPanel({
  forms,
  loading,
  session,
  reload,
  setError,
  openBuilder,
}: {
  forms: FormListItem[];
  loading: boolean;
  session: Session;
  reload: () => void;
  setError: (msg: string) => void;
  openBuilder: (formId?: number) => void;
}) {
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [createModal, setCreateModal] = useState(false);
  const [editingForm, setEditingForm] = useState<FormListItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);

  const visible = forms.filter((f) => (tab === 'active' ? f.active : !f.active));

  const archive = async (form: FormListItem) => {
    setArchivingId(form.id);
    setError('');
    try {
      await request(`/api/forms/${form.id}`, session.accessToken, {
        method: 'PUT',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          active: !form.active,
        }),
      });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update form status.');
    } finally {
      setArchivingId(null);
    }
  };

  const remove = async (form: FormListItem) => {
    if (!confirm(`Delete the form "${form.title}"?\n\nThis action cannot be undone.`)) return;

    setDeletingId(form.id);
    setError('');
    try {
      await request(`/api/forms/${form.id}`, session.accessToken, { method: 'DELETE' });
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete form.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <header>
        <div>
          <small>FORMS</small>
          <h1>Application forms</h1>
          <p>Build and manage the forms candidates fill in when applying.</p>
        </div>
        <button type="button" className="hr-btn-primary" onClick={() => setCreateModal(true)}>
          + New form
        </button>
      </header>

      <div className="hr-tabs" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={tab === 'active' ? 'active' : ''}
          onClick={() => setTab('active')}
        >
          Active
        </button>
        <button
          type="button"
          className={tab === 'archived' ? 'active' : ''}
          onClick={() => setTab('archived')}
        >
          Archived
        </button>
      </div>

      <section className="hr-table-card">
        <div className="hr-table forms-table">
          <div className="tr head">
            <span>Title</span>
            <span>Description</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="loading">Loading forms…</div>
          ) : visible.length === 0 ? (
            <div className="loading">
              {tab === 'active' ? 'No active forms yet.' : 'No archived forms.'}
            </div>
          ) : (
            visible.map((form) => (
              <div className="tr" key={form.id}>
                <span className="job-offer-title">
                  <b>{form.title}</b>
                  <small>{form.active ? 'Active' : 'Archived'}</small>
                </span>

                <span>{form.description || '—'}</span>

                <span className="job-offer-date">
                  {new Date(form.updatedAt).toLocaleDateString('fr-FR')}
                </span>

                <span className="actions job-offer-actions">
                  {/* Edit = title + description */}
                  <button
                    type="button"
                    className="hr-btn-secondary"
                    onClick={() => setEditingForm(form)}
                  >
                    Edit
                  </button>

                  {/* Design = drag & drop builder */}
                  <button
                    type="button"
                    className="hr-btn-secondary"
                    onClick={() => openBuilder(form.id)}
                  >
                    Design
                  </button>

                  <button
                    type="button"
                    className="hr-btn-secondary"
                    disabled={archivingId === form.id}
                    onClick={() => void archive(form)}
                  >
                    {archivingId === form.id
                      ? '…'
                      : tab === 'active'
                        ? 'Archive'
                        : 'Restore'}
                  </button>

                  <button
                    type="button"
                    className="hr-btn-danger"
                    disabled={deletingId === form.id}
                    onClick={() => void remove(form)}
                  >
                    {deletingId === form.id ? 'Deleting…' : 'Delete'}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {createModal && (
        <FormMetaModal
          session={session}
          form={null}
          close={() => setCreateModal(false)}
          done={(id) => {
            setCreateModal(false);
            reload();
            if (id != null) openBuilder(id);
          }}
          setError={setError}
        />
      )}

      {editingForm && (
        <FormMetaModal
          session={session}
          form={editingForm}
          close={() => setEditingForm(null)}
          done={() => {
            setEditingForm(null);
            reload();
          }}
          setError={setError}
        />
      )}
    </>
  );
}

/** Modal create / edit title + description */
function FormMetaModal({
  session,
  form,
  close,
  done,
  setError,
}: {
  session: Session;
  form: FormListItem | null;
  close: () => void;
  done: (formId?: number) => void;
  setError: (msg: string) => void;
}) {
  const isEditing = form !== null;
  const [title, setTitle] = useState(form?.title ?? '');
  const [description, setDescription] = useState(form?.description ?? '');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setLocalError('The form title is required.');
      return;
    }

    setBusy(true);
    setLocalError('');

    try {
      if (isEditing && form) {
        await request(`/api/forms/${form.id}`, session.accessToken, {
          method: 'PUT',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            active: form.active,
          }),
        });
        done();
      } else {
        const created = await request<{ id: number }>('/api/forms', session.accessToken, {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || undefined,
            active: false,
          }),
        });
        done(created.id);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : isEditing
            ? 'Could not update the form.'
            : 'Could not create the form.';
      setLocalError(message);
      setError(message);
      setBusy(false);
    }
  };

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) close();
      }}
    >
      <form className="modal" onSubmit={submit}>
        <button type="button" className="close" onClick={close} disabled={busy}>
          ×
        </button>

        <small>{isEditing ? 'EDIT FORM' : 'NEW FORM'}</small>
        <h2>{isEditing ? 'Edit form' : 'Create a form'}</h2>

        {localError && <div className="alert">{localError}</div>}

        <label>
          Title
          <input
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Financial Officer Application"
          />
        </label>

        <label>
          Description <small>(optional)</small>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description of this form"
          />
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
                : 'Create and open builder'}
          </button>
        </div>
      </form>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';
import { FormBuilder } from './form-builder/FormBuilder';
import type { JobOffer } from './form-builder/types';
import { EvaluatorsPanel } from './EvaluatorsPanel';
import { FormsPanel, type FormListItem } from './FormsPanel';
import { JobOffersPanel } from './JobOffersPanel';
import { ROLE_THEME } from '../shared/roleTheme';
import './HR.css';

type View = 'home' | 'jobOffers' | 'forms' | 'evaluators' | 'builder';

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

const secondaryBtn: React.CSSProperties = {
  background: '#fff',
  color: '#17243e',
  border: '1px solid #dce2ea',
  borderRadius: 8,
  padding: '12px 20px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

export function HrDashboard({ session, logout }: { session: Session; logout: () => void }) {
  const [view, setView] = useState<View>('home');
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingForms, setLoadingForms] = useState(true);
  const [error, setError] = useState('');
  const [builderFormId, setBuilderFormId] = useState<number | null>(null);

  const loadOffers = () => {
    setLoadingOffers(true);
    request<JobOffer[]>('/api/offers', session.accessToken)
      .then(setOffers)
      .catch(() => setError('Could not load job offers.'))
      .finally(() => setLoadingOffers(false));
  };

  const loadForms = () => {
    setLoadingForms(true);
    request<FormListItem[]>('/api/forms', session.accessToken)
      .then(setForms)
      .catch(() => setError('Could not load forms.'))
      .finally(() => setLoadingForms(false));
  };

  useEffect(() => {
    loadOffers();
    loadForms();
  }, []);

  if (view === 'builder' && builderFormId != null) {
    return (
      <FormBuilder
        session={session}
        formId={builderFormId}
        onExit={() => {
          setView('forms');
          setBuilderFormId(null);
          loadOffers();
          loadForms();
        }}
      />
    );
  }

  const activeForms = forms.filter((f) => f.active);
  const openOffers = offers.filter((o) => !o.deadline || new Date(o.deadline) >= new Date());

  return (
    <div className="shell">
      <aside>
        <div className="side-logo">
          BFPME<span>Recruit</span>
        </div>
        <nav>
          <b>HUMAN RESOURCES</b>
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>
            ⌂ Dashboard
          </button>
          <button
            className={view === 'jobOffers' ? 'active' : ''}
            onClick={() => setView('jobOffers')}
          >
            ◫ Job Offers
          </button>
          <button className={view === 'forms' ? 'active' : ''} onClick={() => setView('forms')}>
            ▦ Forms
          </button>
          <button
            className={view === 'evaluators' ? 'active' : ''}
            onClick={() => setView('evaluators')}
          >
            ◇ Evaluators
          </button>
        </nav>
        <div
          className="profile"
          style={{ '--role-color': ROLE_THEME.HR.color } as React.CSSProperties}
        >
          <span>
            {session.firstName[0]}
            {session.lastName[0]}
          </span>
          <div>
            <b>
              {session.firstName} {session.lastName}
            </b>
            <small>{session.email}</small>
          </div>
          <button onClick={logout} aria-label="Log out">
            ↗
          </button>
        </div>
      </aside>

      <main className="content" style={{ padding: '32px 40px' }}>
        {error && (
          <div
            className="alert"
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '16px 20px',
              borderRadius: 8,
              marginBottom: 24,
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {view === 'home' && (
          <HomeView
            session={session}
            offers={offers}
            forms={forms}
            openOffers={openOffers}
            activeForms={activeForms}
            onGoOffers={() => setView('jobOffers')}
            onGoForms={() => setView('forms')}
            onGoEvaluators={() => setView('evaluators')}
          />
        )}

        {view === 'jobOffers' && (
          <JobOffersPanel
            session={session}
            offers={offers}
            forms={forms}
            loading={loadingOffers}
            reload={loadOffers}
            setError={setError}
          />
        )}

        {view === 'forms' && (
          <FormsPanel
            forms={forms}
            loading={loadingForms}
            session={session}
            reload={loadForms}
            setError={setError}
            openBuilder={(formId) => {
              if (formId != null) {
                setBuilderFormId(formId);
                setView('builder');
              }
            }}
          />
        )}

        {view === 'evaluators' && (
          <EvaluatorsPanel
            session={session}
            offers={offers}
            loadingOffers={loadingOffers}
          />
        )}
      </main>
    </div>
  );
}

function HomeView({
  session,
  offers,
  forms,
  openOffers,
  activeForms,
  onGoOffers,
  onGoForms,
  onGoEvaluators,
}: {
  session: Session;
  offers: JobOffer[];
  forms: FormListItem[];
  openOffers: JobOffer[];
  activeForms: FormListItem[];
  onGoOffers: () => void;
  onGoForms: () => void;
  onGoEvaluators: () => void;
}) {
  const unlinkedOffers = offers.filter((o) => !o.formId);

  return (
    <>
      <header>
        <div>
          <small>DASHBOARD</small>
          <h1>Welcome back, {session.firstName}</h1>
          <p>Manage job offers, application forms and evaluator assignments.</p>
        </div>
      </header>

      <section
        className="stats"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginBottom: 40,
        }}
      >
        <article
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '28px 32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #eef1f5',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#718096',
              marginBottom: 12,
            }}
          >
            Open job offers
          </span>
          <b
            style={{
              display: 'block',
              fontSize: 36,
              fontWeight: 700,
              color: '#17243e',
              marginBottom: 8,
            }}
          >
            {openOffers.length}
          </b>
          <i
            className="green"
            style={{
              fontSize: 13,
              color: '#128c78',
              fontStyle: 'normal',
              fontWeight: 500,
            }}
          >
            ↗ Currently accepting applications
          </i>
        </article>

        <article
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '28px 32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #eef1f5',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#718096',
              marginBottom: 12,
            }}
          >
            Active forms
          </span>
          <b
            style={{
              display: 'block',
              fontSize: 36,
              fontWeight: 700,
              color: '#17243e',
              marginBottom: 8,
            }}
          >
            {activeForms.length}
          </b>
          <i
            style={{
              fontSize: 13,
              color: '#718096',
              fontStyle: 'normal',
              fontWeight: 500,
            }}
          >
            Ready to use
          </i>
        </article>

        <article
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '28px 32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #eef1f5',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#718096',
              marginBottom: 12,
            }}
          >
            Offers without a form
          </span>
          <b
            style={{
              display: 'block',
              fontSize: 36,
              fontWeight: 700,
              color: '#17243e',
              marginBottom: 8,
            }}
          >
            {unlinkedOffers.length}
          </b>
          <i
            style={{
              fontSize: 13,
              color: '#f59e0b',
              fontStyle: 'normal',
              fontWeight: 500,
            }}
          >
            Needs configuration
          </i>
        </article>
      </section>

      <section
        className="table-card"
        style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #eef1f5',
          padding: 32,
        }}
      >
        <h3
          style={{
            margin: '0 0 24px',
            fontSize: 18,
            fontWeight: 700,
            color: '#17243e',
          }}
        >
          Quick access
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          <button
            className="hr-quick-card"
            style={{
              ...secondaryBtn,
              textAlign: 'left',
              padding: 24,
              background: '#f7f9fc',
              border: '1px solid #eef1f5',
            }}
            onClick={onGoOffers}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 8,
                fontSize: 16,
                color: '#17243e',
              }}
            >
              ◫ Job Offers
            </div>
            <small style={{ color: '#718096', fontSize: 13, lineHeight: 1.5 }}>
              Create and share application links
            </small>
          </button>

          <button
            className="hr-quick-card"
            style={{
              ...secondaryBtn,
              textAlign: 'left',
              padding: 24,
              background: '#f7f9fc',
              border: '1px solid #eef1f5',
            }}
            onClick={onGoForms}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 8,
                fontSize: 16,
                color: '#17243e',
              }}
            >
              ▦ Forms
            </div>
            <small style={{ color: '#718096', fontSize: 13, lineHeight: 1.5 }}>
              Build and manage application forms
            </small>
          </button>

          <button
            className="hr-quick-card"
            style={{
              ...secondaryBtn,
              textAlign: 'left',
              padding: 24,
              background: '#f7f9fc',
              border: '1px solid #eef1f5',
            }}
            onClick={onGoEvaluators}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 8,
                fontSize: 16,
                color: '#17243e',
              }}
            >
              ◇ Evaluators
            </div>
            <small style={{ color: '#718096', fontSize: 13, lineHeight: 1.5 }}>
              Assign evaluators to job offers
            </small>
          </button>
        </div>
      </section>
    </>
  );
}
import { useEffect, useMemo, useState } from 'react';
import { InterviewRoom, type InterviewSummary } from '../shared/InterviewRoom';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';
import './Evaluator.css';
import { ROLE_THEME } from '../shared/roleTheme';
import { ComplaintsPage } from '../shared/ComplaintsPage';

type Recommendation = 'FAVORABLE' | 'RESERVED' | 'UNFAVORABLE';
type EvaluatorView = 'calendar' | 'applications' | 'evaluations' | 'comments' | 'recommendations' | 'complaints';
type Filter = 'all' | 'todo' | 'done' | 'upcoming';
type EvaluatorInterview = InterviewSummary & {
  applicationId?: number;
  candidateName?: string;
  location?: string;
  evaluationId?: number;
};
type Evaluation = {
  id?: number;
  interviewId?: number;
  technicalScore: number | '';
  communicationScore: number | '';
  motivationScore: number | '';
  professionalismScore: number | '';
  overallScore: number | '';
  recommendation: Recommendation | '';
  hrComment: string;
  candidateComment: string;
  createdAt?: string;
};
type JoinAction = { disabled: boolean; label: string; detail: string };
type CandidateApplication = { id: number; status: string; submittedAt?: string; jobOfferTitle: string; candidateName: string; candidateEmail: string; formScore?: number; formHrComment?: string; formCandidateComment?: string; formDecision?: string; formEvaluatedAt?: string; answers: { label: string; textValue?: string; numberValue?: number; dateValue?: string; booleanValue?: boolean }[] };
type FormEvaluation = { score: number | ''; commentForHR: string; commentForCandidate: string; decision: 'ACCEPTED' | 'REJECTED' | '' };

const emptyEvaluation: Evaluation = {
  technicalScore: '',
  communicationScore: '',
  motivationScore: '',
  professionalismScore: '',
  overallScore: '',
  recommendation: '',
  hrComment: '',
  candidateComment: '',
};

async function request<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${url}`, {
    ...init,
    headers: { ...authHeaders(token), ...(init?.headers || {}) },
  });

  if (response.status === 204) return undefined as T;

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.detail || body.error || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

async function loadEvaluation(interviewId: number, token: string): Promise<Evaluation | null> {
  const response = await fetch(`${API}/api/interviews/${interviewId}/evaluation`, {
    headers: authHeaders(token),
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Could not load this evaluation.');

  const value = (await response.json()) as Evaluation;

  return {
    ...emptyEvaluation,
    ...value,
    hrComment: value.hrComment || '',
    candidateComment: value.candidateComment || '',
  };
}

function evaluationPayload(value: Evaluation) {
  return {
    technicalScore: Number(value.technicalScore),
    communicationScore: Number(value.communicationScore),
    motivationScore: Number(value.motivationScore),
    professionalismScore: Number(value.professionalismScore),
    overallScore: Number(value.overallScore),
    recommendation: value.recommendation,
    hrComment: value.hrComment.trim(),
    candidateComment: value.candidateComment.trim(),
  };
}

function nice(value?: string): string {
  return value
    ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase())
    : '-';
}

function dateTime(value?: string): string {
  return value
    ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Not scheduled';
}

function fullDate(value?: string): string {
  return value
    ? new Date(value).toLocaleDateString('en-US', { dateStyle: 'full' })
    : 'Not scheduled';
}

function timeOnly(value?: string): string {
  return value
    ? new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
}

function isUpcoming(interview: InterviewSummary): boolean {
  return Boolean(interview.scheduledAt && Date.parse(interview.scheduledAt) >= Date.now());
}

function localDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function sortBySchedule(left: InterviewSummary, right: InterviewSummary): number {
  return Date.parse(left.scheduledAt || '') - Date.parse(right.scheduledAt || '');
}

function formatRange(interview: InterviewSummary): string {
  if (!interview.scheduledAt) return 'Schedule to be defined';

  const start = new Date(interview.scheduledAt);
  const end = new Date(start.getTime() + (interview.durationMinutes || 60) * 60_000);

  return `${timeOnly(interview.scheduledAt)} - ${timeOnly(end.toISOString())}`;
}

function joinAction(interview: EvaluatorInterview): JoinAction {
  if (interview.mode !== 'ONLINE') {
    return {
      disabled: true,
      label: 'On-site interview',
      detail: interview.location || 'Please attend this interview in person.',
    };
  }

  if (interview.status === 'CANCELLED') {
    return { disabled: true, label: 'Interview cancelled', detail: 'This interview can no longer be joined.' };
  }

  if (interview.status === 'COMPLETED' || interview.status === 'NO_SHOW') {
    return { disabled: true, label: 'Interview completed', detail: 'This interview session has already ended.' };
  }

  if (interview.status === 'POSTPONED') {
    return { disabled: true, label: 'Interview postponed', detail: 'Wait for the new schedule communicated by HR.' };
  }

  if (!interview.scheduledAt) {
    return { disabled: true, label: 'Schedule missing', detail: 'HR must still schedule this interview.' };
  }

  if (interview.joinAvailable) {
    return { disabled: false, label: 'Join interview', detail: 'The interview room is currently available.' };
  }

  if (interview.joinWindowStartsAt && Date.now() < Date.parse(interview.joinWindowStartsAt)) {
    return {
      disabled: true,
      label: `Available at ${timeOnly(interview.joinWindowStartsAt)}`,
      detail: `The interview room opens on ${dateTime(interview.joinWindowStartsAt)}.`,
    };
  }

  if (interview.joinWindowEndsAt && Date.now() > Date.parse(interview.joinWindowEndsAt)) {
    return { disabled: true, label: 'Join window expired', detail: 'The connection window has expired for this interview.' };
  }

  return { disabled: true, label: 'Unavailable', detail: 'This interview cannot be joined in its current state.' };
}

export function EvaluatorDashboard({ session, logout }: { session: Session; logout: () => void }) {
  const [view, setView] = useState<EvaluatorView>('calendar');
  const [interviews, setInterviews] = useState<EvaluatorInterview[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [evaluations, setEvaluations] = useState<Record<number, Evaluation>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [room, setRoom] = useState<InterviewSummary | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation>(emptyEvaluation);
  const [filter, setFilter] = useState<Filter>('all');
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selected = interviews.find(item => item.id === selectedId) || interviews[0] || null;
  const detailedInterview = interviews.find(item => item.id === detailsId) || null;
  const hasEvaluation = Boolean(evaluation.id || selected?.evaluationId);

  const stats = useMemo(() => {
    const upcoming = interviews.filter(isUpcoming).length;
    const done = interviews.filter(item => Boolean(item.evaluationId)).length;
    return { total: interviews.length, upcoming, done, todo: Math.max(0, interviews.length - done) };
  }, [interviews]);

  const filtered = useMemo(() => {
    return interviews.filter(interview => {
      if (filter === 'todo') return !interview.evaluationId;
      if (filter === 'done') return Boolean(interview.evaluationId);
      if (filter === 'upcoming') return isUpcoming(interview);
      return true;
    });
  }, [filter, interviews]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    request<EvaluatorInterview[]>('/api/interview-rooms/my', session.accessToken)
      .then(async items => {
        if (!active) return;

        setInterviews(items);
        setSelectedId(current => current ?? items[0]?.id ?? null);
        setError('');

        const loaded = await Promise.all(
          items
            .filter(item => item.evaluationId)
            .map(async item => [item.id, await loadEvaluation(item.id, session.accessToken)] as const)
        );

        if (!active) return;

        setEvaluations(
          Object.fromEntries(
            loaded.filter((entry): entry is readonly [number, Evaluation] => Boolean(entry[1]))
          )
        );
      })
      .catch(caught => {
        if (active) setError(caught instanceof Error ? caught.message : 'Could not load assigned interviews.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    request<CandidateApplication[]>('/api/evaluator/applications', session.accessToken)
      .then(items => { if (active) setApplications(items); })
      .catch(caught => { if (active) setError(caught instanceof Error ? caught.message : 'Could not load assigned applications.'); });

    return () => {
      active = false;
    };
  }, [session.accessToken]);

  useEffect(() => {
    const handleNavigation = (event: Event) => {
      const actionUrl = (event as CustomEvent<string>).detail || '';
      if (actionUrl.startsWith('/evaluator/form-evaluation/')) {
        setView('applications');
        request<CandidateApplication[]>('/api/evaluator/applications', session.accessToken).then(setApplications)
          .catch(caught => setError(caught instanceof Error ? caught.message : 'Could not load form evaluations.'));
      }
      const interviewMatch = actionUrl.match(/\/interviews\/(\d+)/);
      if (interviewMatch) {
        setSelectedId(Number(interviewMatch[1]));
        setView('calendar');
      }
    };
    window.addEventListener('app:navigate', handleNavigation);
    return () => window.removeEventListener('app:navigate', handleNavigation);
  }, [session.accessToken]);

  useEffect(() => {
    if (!selected?.id) {
      setEvaluation(emptyEvaluation);
      return;
    }

    const cached = evaluations[selected.id];

    if (cached) {
      setEvaluation(cached);
      return;
    }

    let active = true;
    setNotice('');

    loadEvaluation(selected.id, session.accessToken)
      .then(value => {
        if (!active) return;

        setEvaluation(value || emptyEvaluation);

        if (value) {
          setEvaluations(current => ({ ...current, [selected.id]: value }));
        }

        setInterviews(current =>
          current.map(item =>
            item.id === selected.id ? { ...item, evaluationId: value?.id } : item
          )
        );
      })
      .catch(() => {
        if (active) setEvaluation(emptyEvaluation);
      });

    return () => {
      active = false;
    };
  }, [selected?.id, session.accessToken, evaluations]);

  function openEvaluation(interview: EvaluatorInterview): void {
    setSelectedId(interview.id);
    setDetailsId(null);
    setView('evaluations');
    setFilter('all');
    setNotice('');
  }

  function openInterviewDetails(interview: EvaluatorInterview): void {
    setSelectedId(interview.id);
    setDetailsId(interview.id);
    setNotice('');
  }

  function joinInterview(interview: EvaluatorInterview): void {
    setDetailsId(null);
    setRoom(interview);
  }

  async function evaluateApplication(id: number, evaluation: FormEvaluation): Promise<CandidateApplication> {
    setError('');
    try {
      const updated = await request<CandidateApplication>(`/api/evaluator/applications/${id}/evaluation`, session.accessToken, {
        method: 'POST', body: JSON.stringify(evaluation),
      });
      setApplications(current => current.map(item => item.id === id ? updated : item));
      setNotice(evaluation.decision === 'ACCEPTED' ? 'Candidate accepted. Schedule the interview below.' : 'Candidate rejected.');
      return updated;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the decision.');
    }
    throw new Error('Could not save the form evaluation.');
  }

  async function scheduleInterview(id: number, value: { scheduledAt: string; durationMinutes: number }): Promise<void> {
    const created = await request<EvaluatorInterview>(`/api/evaluator/applications/${id}/interview`, session.accessToken, {
      method: 'POST', body: JSON.stringify({ ...value, interviewType: 'HR', mode: 'ONLINE' }),
    });
    const refreshed = await request<EvaluatorInterview[]>('/api/interview-rooms/my', session.accessToken);
    setInterviews(refreshed);
    setSelectedId(created.id);
    setView('calendar');
    setNotice('Interview scheduled and notifications sent.');
  }

  async function saveEvaluation(): Promise<void> {
    if (!selected) return;

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const saved = await request<Evaluation>(
        `/api/interviews/${selected.id}/evaluation`,
        session.accessToken,
        {
          method: hasEvaluation ? 'PUT' : 'POST',
          body: JSON.stringify(evaluationPayload(evaluation)),
        }
      );

      setEvaluation(saved);
      setEvaluations(current => ({ ...current, [selected.id]: saved }));
      setInterviews(current =>
        current.map(item =>
          item.id === selected.id ? { ...item, evaluationId: saved.id } : item
        )
      );

      setNotice(
        hasEvaluation
          ? 'Evaluation updated. The candidate has been notified.'
          : 'Evaluation submitted. The candidate has been notified of their result.'
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the evaluation.');
    } finally {
      setSaving(false);
    }
  }

  if (room) {
    return (
      <InterviewRoom
        interview={room}
        token={session.accessToken}
        onLeave={() => setRoom(null)}
        onAuthExpired={logout}
      />
    );
  }

  return (
    <div className="shell evaluator-shell">
      <aside>
        <div className="side-logo">BFPME<span>Recruit</span></div>

        <nav>
          <b>EVALUATOR</b>
          <NavButton active={view === 'calendar'} onClick={() => setView('calendar')} icon="▦">Interviews</NavButton>
          <NavButton active={view === 'applications'} onClick={() => setView('applications')} icon="☷">Applications</NavButton>
          <NavButton active={view === 'evaluations'} onClick={() => { setView('evaluations'); setFilter('todo'); }} icon="✓">Evaluations</NavButton>
          <NavButton active={view === 'comments'} onClick={() => setView('comments')} icon="◫">Comments</NavButton>
          <NavButton active={view === 'recommendations'} onClick={() => setView('recommendations')} icon="◇">Recommendations</NavButton>
          <NavButton active={view === 'complaints'} onClick={() => setView('complaints')} icon="⚑">Complaints</NavButton>
        </nav>

        <div
          className="profile"
          style={{ '--role-color': ROLE_THEME.EVALUATOR.color } as React.CSSProperties}
        >
          <span>{session.firstName[0]}{session.lastName[0]}</span>
          <div>
            <b>{session.firstName} {session.lastName}</b>
            <small>{session.email}</small>
          </div>
          <button type="button" onClick={logout} aria-label="Log out">↗</button>
        </div>
      </aside>

      <main className="content evaluator-main">
        <header>
          <div>
            <small>EVALUATOR PORTAL</small>
            <h1>{viewTitle(view)}</h1>
            <p>{viewDescription(view)}</p>
          </div>

        </header>

        <section className="stats evaluator-stats">
          <Metric label="Assigned interviews" value={stats.total} detail={`${stats.upcoming} upcoming`} />
          <Metric label="To evaluate" value={stats.todo} detail="Action required" tone="warning" />
          <Metric label="Completed" value={stats.done} detail="Evaluations submitted" />
        </section>

        {error && <div className="candidate-alert">{error}</div>}
        {notice && <div className="candidate-success">{notice}</div>}

        {view === 'calendar' && (
          <InterviewCalendar
            month={calendarMonth}
            interviews={interviews}
            loading={loading}
            onMonth={setCalendarMonth}
            onOpen={openInterviewDetails}
          />
        )}

        {view === 'applications' && <ApplicationsReview applications={applications} evaluate={evaluateApplication} schedule={scheduleInterview} />}

        {view === 'evaluations' && (
          <EvaluationWorkspace
            loading={loading}
            interviews={filtered}
            selected={selected}
            filter={filter}
            evaluation={evaluation}
            saving={saving}
            hasEvaluation={hasEvaluation}
            setFilter={setFilter}
            select={setSelectedId}
            setEvaluation={setEvaluation}
            save={saveEvaluation}
          />
        )}

        {view === 'comments' && (
          <CommentsView interviews={interviews} evaluations={evaluations} onOpen={openEvaluation} />
        )}
        {view === 'complaints' && <ComplaintsPage session={session} logout={logout} />}

        {view === 'recommendations' && (
          <RecommendationsView interviews={interviews} evaluations={evaluations} onOpen={openEvaluation} />
        )}

        {detailedInterview && (
          <InterviewDetailsModal
            interview={detailedInterview}
            onClose={() => setDetailsId(null)}
            onJoin={joinInterview}
            onOpenEvaluation={openEvaluation}
          />
        )}
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, children }: {
  active: boolean;
  onClick: () => void;
  icon: string;
  children: string;
}) {
  const label = children === 'Applications' ? 'Form Evaluation'
    : children === 'Evaluations' ? 'Interview Evaluation' : children;
  return (
    <button type="button" className={active ? 'active' : ''} onClick={onClick}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

function Metric({ label, value, detail, tone }: {
  label: string;
  value: number;
  detail: string;
  tone?: 'warning';
}) {
  return (
    <article>
      <span>{label}</span>
      <b>{value}</b>
      <i className={tone === 'warning' ? 'amber' : 'green'}>{detail}</i>
    </article>
  );
}

function ApplicationsReview({ applications, evaluate, schedule }: {
  applications: CandidateApplication[];
  evaluate: (id: number, evaluation: FormEvaluation) => Promise<CandidateApplication>;
  schedule: (id: number, value: { scheduledAt: string; durationMinutes: number }) => Promise<void>;
}) {
  return <section className="evaluation-history">
    {applications.map(application => <FormEvaluationCard key={application.id} application={application} evaluate={evaluate} schedule={schedule} />)}
    {!applications.length && <div className="candidate-empty"><strong>No form evaluations</strong><span>Submitted responses for your assigned job offers appear here.</span></div>}
  </section>;
}

function FormEvaluationCard({ application, evaluate, schedule }: {
  application: CandidateApplication;
  evaluate: (id: number, evaluation: FormEvaluation) => Promise<CandidateApplication>;
  schedule: (id: number, value: { scheduledAt: string; durationMinutes: number }) => Promise<void>;
}) {
  const [value, setValue] = useState<FormEvaluation>({ score: application.formScore ?? '', commentForHR: application.formHrComment || '', commentForCandidate: application.formCandidateComment || '', decision: (application.formDecision as FormEvaluation['decision']) || '' });
  const [saved, setSaved] = useState(application.formDecision || '');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [saving, setSaving] = useState(false);
  const submit = async (decision: 'ACCEPTED' | 'REJECTED') => {
    setSaving(true);
    try { const updated = await evaluate(application.id, { ...value, decision }); setSaved(updated.formDecision || decision); }
    finally { setSaving(false); }
  };
  return <article>
    <header><div><small>{application.jobOfferTitle}</small><h2>{application.candidateName}</h2><p>{application.candidateEmail} - {nice(application.status)}</p></div></header>
    <div className="history-comments">{application.answers.map(answer => <div key={answer.label}><b>{answer.label}</b><p>{String(answer.textValue ?? answer.numberValue ?? answer.dateValue ?? answer.booleanValue ?? '-')}</p></div>)}</div>
    {!saved && <div className="review-panel evaluator-form">
      <label className="candidate-field">Score (0 - 100)<input required type="number" min="0" max="100" value={value.score} onChange={event => setValue(current => ({ ...current, score: event.target.value === '' ? '' : Number(event.target.value) }))} /></label>
      <label className="candidate-field">Comment for HR<textarea rows={3} value={value.commentForHR} onChange={event => setValue(current => ({ ...current, commentForHR: event.target.value }))} /></label>
      <label className="candidate-field">Comment for candidate<textarea rows={3} value={value.commentForCandidate} onChange={event => setValue(current => ({ ...current, commentForCandidate: event.target.value }))} /></label>
      <div className="modal-actions"><button type="button" disabled={saving || value.score === ''} onClick={() => void submit('REJECTED')}>Reject candidate</button><button type="button" className="primary" disabled={saving || value.score === ''} onClick={() => void submit('ACCEPTED')}>Accept candidate</button></div>
    </div>}
    {saved === 'ACCEPTED' && <div className="review-panel evaluator-form"><h3>Schedule interview</h3><p>Candidate: {application.candidateName}<br />Job offer: {application.jobOfferTitle}</p><label className="candidate-field">Date and time<input type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} /></label><label className="candidate-field">Duration (minutes)<input type="number" min="1" value={durationMinutes} onChange={event => setDurationMinutes(Number(event.target.value))} /></label><button type="button" className="primary" disabled={!scheduledAt || saving} onClick={() => { setSaving(true); void schedule(application.id, { scheduledAt, durationMinutes }).finally(() => setSaving(false)); }}>Schedule interview</button></div>}
    {saved === 'REJECTED' && <p className="candidate-result-pending">Candidate was not selected for the next stage.</p>}
  </article>;
}

function LegacyApplicationsReview({ applications, decide }: { applications: CandidateApplication[]; decide: (id: number, accepted: boolean) => Promise<void> }) {
  return <section className="evaluation-history">
    {applications.map(application => <article key={application.id}>
      <header><div><small>{application.jobOfferTitle}</small><h2>{application.candidateName}</h2><p>{application.candidateEmail} · {nice(application.status)}</p></div></header>
      <div className="history-comments">{application.answers.map(answer => <div key={answer.label}><b>{answer.label}</b><p>{String(answer.textValue ?? answer.numberValue ?? answer.dateValue ?? answer.booleanValue ?? '-')}</p></div>)}</div>
      <div className="modal-actions">
        <button type="button" disabled={application.status === 'REJECTED'} onClick={() => void decide(application.id, false)}>Reject</button>
        <button type="button" className="primary" disabled={application.status === 'ACCEPTED'} onClick={() => void decide(application.id, true)}>Accept</button>
      </div>
    </article>)}
    {!applications.length && <div className="candidate-empty"><strong>No assigned applications</strong><span>Candidate submissions for your assigned offers appear here.</span></div>}
  </section>;
}

function viewTitle(view: EvaluatorView): string {
  if (view === 'calendar') return 'Interview calendar';
  if (view === 'applications') return 'Form evaluation';
  if (view === 'comments') return 'Evaluation comments';
  if (view === 'recommendations') return 'Submitted recommendations';
  return 'Interview evaluation';
}

function viewDescription(view: EvaluatorView): string {
  if (view === 'calendar') return 'View all your scheduled interviews and open an evaluation directly from the calendar.';
  if (view === 'applications') return 'Review submitted answers, score the form, and accept or reject the candidate.';
  if (view === 'comments') return 'Find the internal HR comment and the feedback shared with each candidate.';
  if (view === 'recommendations') return 'View the final scores and recommendations you have already submitted.';
  return 'Evaluate completed interviews and share the appropriate feedback with HR and the candidate.';
}

function InterviewCalendar({ month, interviews, loading, onMonth, onOpen }: {
  month: Date;
  interviews: EvaluatorInterview[];
  loading: boolean;
  onMonth: (date: Date) => void;
  onOpen: (interview: EvaluatorInterview) => void;
}) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (start.getDay() + 6) % 7;
  const cells = Array.from(
    { length: 42 },
    (_, index) => new Date(month.getFullYear(), month.getMonth(), index - mondayOffset + 1)
  );

  const byDay = interviews.reduce<Record<string, EvaluatorInterview[]>>((result, interview) => {
    if (interview.scheduledAt) {
      (result[localDateKey(interview.scheduledAt)] ||= []).push(interview);
    }
    return result;
  }, {});

  Object.values(byDay).forEach(items => items.sort(sortBySchedule));

  const upcoming = interviews.filter(isUpcoming).sort(sortBySchedule).slice(0, 6);
  const move = (offset: number) => onMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));

  return (
    <section className="calendar-layout">
      <article className="calendar-card">
        <div className="calendar-toolbar">
          <div>
            <small>MONTHLY PLANNING</small>
            <h2>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
          </div>

          <div>
            <button type="button" onClick={() => move(-1)} aria-label="Previous month">‹</button>
            <button
              type="button"
              onClick={() => onMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            >
              Today
            </button>
            <button type="button" onClick={() => move(1)} aria-label="Next month">›</button>
          </div>
        </div>

        <div className="calendar-weekdays">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <b key={day}>{day}</b>)}
        </div>

        <div className="calendar-grid">
          {cells.map(day => {
            const events = byDay[localDateKey(day)] || [];
            const outside = day.getMonth() !== month.getMonth();
            const today = localDateKey(day) === localDateKey(new Date());

            return (
              <div className={`${outside ? 'outside ' : ''}${today ? 'today' : ''}`} key={day.toISOString()}>
                <span>{day.getDate()}</span>

                {events.map(event => (
                  <button
                    key={event.id}
                    type="button"
                    className={`calendar-event ${event.evaluationId ? 'evaluated' : ''} status-${event.status.toLowerCase()}`}
                    title={`${event.jobTitle} - ${event.candidateName || 'Candidate'}`}
                    onClick={() => onOpen(event)}
                  >
                    <time>{timeOnly(event.scheduledAt)}</time>
                    <strong>{event.jobTitle}</strong>
                    <b>{event.candidateName || 'Candidate'}</b>
                    <em>{nice(event.interviewType)}</em>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </article>

      <aside className="calendar-agenda">
        <div>
          <small>UPCOMING APPOINTMENTS</small>
          <h2>Agenda</h2>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          upcoming.map(interview => (
            <button key={interview.id} type="button" onClick={() => onOpen(interview)}>
              <time>{dateTime(interview.scheduledAt)}</time>
              <b>{interview.jobTitle}</b>
              <span>{interview.candidateName || 'Candidate'}</span>
              <em className={`status ${interview.status.toLowerCase()}`}>{nice(interview.status)}</em>
            </button>
          ))
        )}

        {!loading && !upcoming.length && (
          <div className="candidate-empty">
            <strong>No upcoming interviews</strong>
            <span>New appointments will appear here.</span>
          </div>
        )}
      </aside>
    </section>
  );
}

function InterviewDetailsModal({ interview, onClose, onJoin, onOpenEvaluation }: {
  interview: EvaluatorInterview;
  onClose: () => void;
  onJoin: (interview: EvaluatorInterview) => void;
  onOpenEvaluation: (interview: EvaluatorInterview) => void;
}) {
  const action = joinAction(interview);

  return (
    <div
      className="overlay"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal evaluator-event-modal">
        <button type="button" className="close" onClick={onClose} aria-label="Close interview details">×</button>
        <small>{nice(interview.interviewType)}</small>
        <h2>{interview.jobTitle}</h2>

        <div className="evaluator-event-meta">
          <article><span>Candidate</span><b>{interview.candidateName || 'Candidate'}</b></article>
          <article><span>Date</span><b>{fullDate(interview.scheduledAt)}</b></article>
          <article><span>Time</span><b>{formatRange(interview)}</b></article>
          <article><span>Status</span><b className={`event-status ${interview.status.toLowerCase()}`}>{nice(interview.status)}</b></article>
          <article><span>Mode</span><b>{nice(interview.mode)}</b></article>
          <article>
            <span>Location</span>
            <b>{interview.location || (interview.mode === 'ONLINE' ? 'Video interview room' : 'To be defined')}</b>
          </article>
        </div>

        <p className="evaluator-event-note">{action.detail}</p>

        <div className="modal-actions">
          <button type="button" onClick={() => onOpenEvaluation(interview)}>Open evaluation</button>
          <button type="button" className="primary" disabled={action.disabled} onClick={() => onJoin(interview)}>
            {action.label}
          </button>
        </div>
      </section>
    </div>
  );
}

function EvaluationWorkspace({ loading, interviews, selected, filter, evaluation, saving, hasEvaluation, setFilter, select, setEvaluation, save }: {
  loading: boolean;
  interviews: EvaluatorInterview[];
  selected: EvaluatorInterview | null;
  filter: Filter;
  evaluation: Evaluation;
  saving: boolean;
  hasEvaluation: boolean;
  setFilter: (filter: Filter) => void;
  select: (id: number) => void;
  setEvaluation: React.Dispatch<React.SetStateAction<Evaluation>>;
  save: () => Promise<void>;
}) {
  return (
    <section className="evaluator-layout">
      <div className="table-card evaluator-list">
        <div className="tools evaluator-filters">
          {(['all', 'todo', 'done', 'upcoming'] as const).map(item => (
            <button type="button" className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>
              {filterLabel(item)}
            </button>
          ))}
        </div>

        <div className="evaluator-interviews">
          {loading ? (
            <div className="loading">Loading interviews...</div>
          ) : interviews.length === 0 ? (
            <div className="loading">No interviews for this filter.</div>
          ) : (
            interviews.map(interview => (
              <button
                type="button"
                className={selected?.id === interview.id ? 'active' : ''}
                key={interview.id}
                onClick={() => select(interview.id)}
              >
                <span>
                  <small>{nice(interview.interviewType)}</small>
                  <b>{interview.candidateName || 'Candidate'}</b>
                  <em>{interview.jobTitle} · {dateTime(interview.scheduledAt)}</em>
                </span>
                <i className={interview.evaluationId ? 'done' : 'todo'}>
                  {interview.evaluationId ? 'Evaluated' : 'To evaluate'}
                </i>
              </button>
            ))
          )}
        </div>
      </div>

      <section className="evaluator-detail">
        {!selected ? (
          <div className="candidate-empty">
            <strong>No interview selected</strong>
            <span>Select an interview from the list.</span>
          </div>
        ) : (
          <>
            <article className="candidate-detail evaluator-interview-card">
              <div>
                <small>SELECTED INTERVIEW</small>
                <h2>{selected.candidateName || 'Candidate'}</h2>
                <p>{selected.jobTitle} · {nice(selected.interviewType)} · {dateTime(selected.scheduledAt)}</p>
              </div>
              <div className="candidate-meta">
                <span>{nice(selected.mode)}</span>
                <span>{nice(selected.status)}</span>
                {selected.durationMinutes && <span>{selected.durationMinutes} min</span>}
              </div>
            </article>

            <form
              className="review-panel evaluator-form"
              onSubmit={event => {
                event.preventDefault();
                void save();
              }}
            >
              <div className="evaluator-form-head">
                <div>
                  <small>EVALUATION SHEET</small>
                  <h2>Scores and decision</h2>
                </div>
                <ScorePill value={evaluation.overallScore} />
              </div>

              <div className="evaluator-score-grid">
                <ScoreInput label="Technical skills" value={evaluation.technicalScore} onChange={technicalScore => setEvaluation(current => ({ ...current, technicalScore }))} />
                <ScoreInput label="Communication" value={evaluation.communicationScore} onChange={communicationScore => setEvaluation(current => ({ ...current, communicationScore }))} />
                <ScoreInput label="Motivation" value={evaluation.motivationScore} onChange={motivationScore => setEvaluation(current => ({ ...current, motivationScore }))} />
                <ScoreInput label="Professionalism" value={evaluation.professionalismScore} onChange={professionalismScore => setEvaluation(current => ({ ...current, professionalismScore }))} />
                <ScoreInput label="Overall score" value={evaluation.overallScore} onChange={overallScore => setEvaluation(current => ({ ...current, overallScore }))} />
              </div>

              <label className="candidate-field">
                Recommendation
                <select
                  required
                  value={evaluation.recommendation}
                  onChange={event => setEvaluation(current => ({ ...current, recommendation: event.target.value as Recommendation }))}
                >
                  <option value="">Choose a recommendation</option>
                  <option value="FAVORABLE">Favorable</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="UNFAVORABLE">Unfavorable</option>
                </select>
              </label>

              <div className="comment-grid">
                <label className="candidate-field">
                  <span>Internal comment for HR <b>*</b></span>
                  <small>Justify the scores and your decision. This text is never shown to the candidate.</small>
                  <textarea
                    required
                    maxLength={5000}
                    rows={7}
                    value={evaluation.hrComment}
                    placeholder="Detailed explanation for the HR team..."
                    onChange={event => setEvaluation(current => ({ ...current, hrComment: event.target.value }))}
                  />
                </label>

                <label className="candidate-field candidate-facing">
                  <span>Comment for the candidate <b>*</b></span>
                  <small>This feedback accompanies their score and recommendation in their personal space.</small>
                  <textarea
                    required
                    maxLength={5000}
                    rows={7}
                    value={evaluation.candidateComment}
                    placeholder="Clear and constructive feedback for the candidate..."
                    onChange={event => setEvaluation(current => ({ ...current, candidateComment: event.target.value }))}
                  />
                </label>
              </div>

              <div className="evaluation-disclosure">
                Upon submission, the overall score, recommendation and candidate comment will be immediately visible to the candidate.
              </div>

              <div className="candidate-form-actions">
                <button type="button" onClick={() => setEvaluation(emptyEvaluation)}>Clear</button>
                <button className="primary" disabled={saving}>
                  {saving ? 'Saving...' : hasEvaluation ? 'Update and notify' : 'Submit and notify'}
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </section>
  );
}

function CommentsView({ interviews, evaluations, onOpen }: {
  interviews: EvaluatorInterview[];
  evaluations: Record<number, Evaluation>;
  onOpen: (interview: EvaluatorInterview) => void;
}) {
  const completed = interviews.filter(item => item.evaluationId && evaluations[item.id]);

  return (
    <section className="evaluation-history">
      {completed.map(interview => {
        const item = evaluations[interview.id];

        return (
          <article key={interview.id}>
            <header>
              <div>
                <small>{interview.jobTitle}</small>
                <h2>{interview.candidateName || 'Candidate'}</h2>
              </div>
              <button type="button" onClick={() => onOpen(interview)}>Edit</button>
            </header>

            <div className="history-comments">
              <div>
                <b>Internal HR</b>
                <p>{item.hrComment}</p>
              </div>
              <div className="candidate-copy">
                <b>Shared with candidate</b>
                <p>{item.candidateComment}</p>
              </div>
            </div>
          </article>
        );
      })}

      {!completed.length && (
        <div className="candidate-empty">
          <strong>No comments submitted</strong>
          <span>Comments will appear after the first evaluation.</span>
        </div>
      )}
    </section>
  );
}

function RecommendationsView({ interviews, evaluations, onOpen }: {
  interviews: EvaluatorInterview[];
  evaluations: Record<number, Evaluation>;
  onOpen: (interview: EvaluatorInterview) => void;
}) {
  const completed = interviews.filter(item => item.evaluationId && evaluations[item.id]);

  return (
    <section className="recommendation-grid">
      {completed.map(interview => {
        const item = evaluations[interview.id];

        return (
          <article key={interview.id}>
            <ScorePill value={item.overallScore} />
            <small>{interview.jobTitle}</small>
            <h2>{interview.candidateName || 'Candidate'}</h2>
            <strong className={`recommendation ${item.recommendation.toLowerCase()}`}>
              {nice(item.recommendation)}
            </strong>
            <p>{item.candidateComment}</p>
            <button type="button" onClick={() => onOpen(interview)}>Open evaluation</button>
          </article>
        );
      })}

      {!completed.length && (
        <div className="candidate-empty">
          <strong>No recommendations</strong>
          <span>Submitted decisions will appear here.</span>
        </div>
      )}
    </section>
  );
}

function filterLabel(filter: Filter): string {
  if (filter === 'todo') return 'To evaluate';
  if (filter === 'done') return 'Evaluated';
  if (filter === 'upcoming') return 'Upcoming';
  return 'All';
}

function ScoreInput({ label, value, onChange }: {
  label: string;
  value: number | '';
  onChange: (value: number | '') => void;
}) {
  const overall = label === 'Overall score';
  return (
    <label>
      <span>{label}</span>
      <input
        required
        type="number"
        min="0"
        max={overall ? "100" : "20"}
        step="0.5"
        value={value}
        onChange={event => onChange(event.target.value === '' ? '' : Number(event.target.value))}
      />
      <small>{overall ? '/ 100' : '/ 20'}</small>
    </label>
  );
}

function ScorePill({ value }: { value: number | '' }) {
  const numeric = Number(value || 0);
  const tone = numeric >= 14 ? 'good' : numeric >= 10 ? 'average' : 'low';

  return (
    <div className={`score-pill ${tone}`}>
      <b>{value === '' ? '-' : value}</b>
      <span>/100</span>
    </div>
  );
}

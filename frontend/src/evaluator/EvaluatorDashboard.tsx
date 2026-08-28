import { useEffect, useMemo, useState } from 'react';
import { InterviewRoom, type InterviewSummary } from '../shared/InterviewRoom';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';
import './Evaluator.css';
import { ROLE_THEME } from '../shared/roleTheme';

type Recommendation = 'FAVORABLE' | 'RESERVED' | 'UNFAVORABLE';
type EvaluatorView = 'calendar' | 'evaluations' | 'comments' | 'recommendations';
type Filter = 'all' | 'todo' | 'done' | 'upcoming';
type EvaluatorInterview = InterviewSummary & { applicationId?: number; candidateName?: string; location?: string; evaluationId?: number };
type Evaluation = { id?: number; interviewId?: number; technicalScore: number | ''; communicationScore: number | ''; motivationScore: number | ''; professionalismScore: number | ''; overallScore: number | ''; recommendation: Recommendation | ''; hrComment: string; candidateComment: string; createdAt?: string };

const emptyEvaluation: Evaluation = { technicalScore: '', communicationScore: '', motivationScore: '', professionalismScore: '', overallScore: '', recommendation: '', hrComment: '', candidateComment: '' };

async function request<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${url}`, { ...init, headers: { ...authHeaders(token), ...init?.headers } });
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

async function loadEvaluation(interviewId: number, token: string): Promise<Evaluation | null> {
  const response = await fetch(`${API}/api/interviews/${interviewId}/evaluation`, { headers: authHeaders(token) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Could not load this evaluation');
  const value = await response.json() as Evaluation;
  return { ...emptyEvaluation, ...value, hrComment: value.hrComment || '', candidateComment: value.candidateComment || '' };
}

function evaluationPayload(value: Evaluation) {
  return { technicalScore: Number(value.technicalScore), communicationScore: Number(value.communicationScore), motivationScore: Number(value.motivationScore), professionalismScore: Number(value.professionalismScore), overallScore: Number(value.overallScore), recommendation: value.recommendation, hrComment: value.hrComment.trim(), candidateComment: value.candidateComment.trim() };
}

const nice = (value?: string) => value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()) : '-';
const dateTime = (value?: string) => value ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled';
const isUpcoming = (interview: InterviewSummary) => !!interview.scheduledAt && Date.parse(interview.scheduledAt) >= Date.now();
function localDateKey(value: Date | string) { const date = typeof value === 'string' ? new Date(value) : value; return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

export function EvaluatorDashboard({ session, logout }: { session: Session; logout: () => void }) {
  const [view, setView] = useState<EvaluatorView>('calendar');
  const [interviews, setInterviews] = useState<EvaluatorInterview[]>([]);
  const [evaluations, setEvaluations] = useState<Record<number, Evaluation>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [room, setRoom] = useState<InterviewSummary | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation>(emptyEvaluation);
  const [filter, setFilter] = useState<Filter>('all');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const selected = interviews.find(item => item.id === selectedId) || interviews[0] || null;
  const hasEvaluation = Boolean(evaluation.id || selected?.evaluationId);

  const stats = useMemo(() => { const upcoming = interviews.filter(isUpcoming).length; const done = interviews.filter(item => Boolean(item.evaluationId)).length; return { total: interviews.length, upcoming, done, todo: Math.max(0, interviews.length - done) }; }, [interviews]);
  const filtered = useMemo(() => interviews.filter(interview => filter === 'todo' ? !interview.evaluationId : filter === 'done' ? Boolean(interview.evaluationId) : filter === 'upcoming' ? isUpcoming(interview) : true), [filter, interviews]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    request<EvaluatorInterview[]>('/api/interview-rooms/my', session.accessToken).then(async items => {
      if (!active) return;
      setInterviews(items); setSelectedId(current => current ?? items[0]?.id ?? null); setError('');
      const loaded = await Promise.all(items.filter(item => item.evaluationId).map(async item => [item.id, await loadEvaluation(item.id, session.accessToken)] as const));
      if (active) setEvaluations(Object.fromEntries(loaded.filter((entry): entry is readonly [number, Evaluation] => Boolean(entry[1]))));
    }).catch(caught => active && setError(caught instanceof Error ? caught.message : 'Could not load assigned interviews')).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [session.accessToken]);

  useEffect(() => {
    if (!selected?.id) { setEvaluation(emptyEvaluation); return; }
    const cached = evaluations[selected.id];
    if (cached) { setEvaluation(cached); return; }
    let active = true; setNotice('');
    loadEvaluation(selected.id, session.accessToken).then(value => {
      if (!active) return;
      setEvaluation(value || emptyEvaluation);
      if (value) setEvaluations(current => ({ ...current, [selected.id]: value }));
      setInterviews(current => current.map(item => item.id === selected.id ? { ...item, evaluationId: value?.id } : item));
    }).catch(() => active && setEvaluation(emptyEvaluation));
    return () => { active = false; };
  }, [selected?.id, session.accessToken]);

  function openEvaluation(interview: EvaluatorInterview) { setSelectedId(interview.id); setView('evaluations'); setFilter('all'); setNotice(''); }
  async function saveEvaluation() {
    if (!selected) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const saved = await request<Evaluation>(`/api/interviews/${selected.id}/evaluation`, session.accessToken, { method: hasEvaluation ? 'PUT' : 'POST', body: JSON.stringify(evaluationPayload(evaluation)) });
      setEvaluation(saved); setEvaluations(current => ({ ...current, [selected.id]: saved }));
      setInterviews(current => current.map(item => item.id === selected.id ? { ...item, evaluationId: saved.id } : item));
      setNotice(hasEvaluation ? 'Evaluation updated. The candidate has been notified.' : 'Evaluation submitted. The candidate has been notified of their result.');
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not save the evaluation'); } finally { setSaving(false); }
  }

  if (room) return <InterviewRoom interview={room} token={session.accessToken} onLeave={() => setRoom(null)} onAuthExpired={logout} />;
  return <div className="shell evaluator-shell">
    <aside>
      <div className="side-logo">BFPME<span>Recruit</span></div>
      <nav>
        <b>EVALUATOR</b>
        <NavButton active={view === 'calendar'} onClick={() => setView('calendar')} icon="▦">Interviews</NavButton>
        <NavButton active={view === 'evaluations'} onClick={() => { setView('evaluations'); setFilter('todo'); }} icon="✓">Evaluations</NavButton>
        <NavButton active={view === 'comments'} onClick={() => setView('comments')} icon="◫">Comments</NavButton>
        <NavButton active={view === 'recommendations'} onClick={() => setView('recommendations')} icon="◇">Recommendations</NavButton>
      </nav>
      <div className="profile" style={{ '--role-color': ROLE_THEME.EVALUATOR.color } as React.CSSProperties}>
        <span>{session.firstName[0]}{session.lastName[0]}</span>
        <div><b>{session.firstName} {session.lastName}</b><small>{session.email}</small></div>
        <button onClick={logout} aria-label="Log out">↗</button>
      </div>
    </aside>
    <main className="content evaluator-main">
      <header><div><small>EVALUATOR PORTAL</small><h1>{viewTitle(view)}</h1><p>{viewDescription(view)}</p></div>{selected?.joinAvailable && <button className="primary add" onClick={() => setRoom(selected)}>Join interview</button>}</header>
      <section className="stats evaluator-stats"><Metric label="Assigned interviews" value={stats.total} detail={`${stats.upcoming} upcoming`} /><Metric label="To evaluate" value={stats.todo} detail="Action required" tone="warning" /><Metric label="Completed" value={stats.done} detail="Evaluations submitted" /></section>
      {error && <div className="candidate-alert">{error}</div>}{notice && <div className="candidate-success">{notice}</div>}
      {view === 'calendar' && <InterviewCalendar month={calendarMonth} interviews={interviews} loading={loading} onMonth={setCalendarMonth} onOpen={openEvaluation} />}
      {view === 'evaluations' && <EvaluationWorkspace loading={loading} interviews={filtered} selected={selected} filter={filter} evaluation={evaluation} saving={saving} hasEvaluation={hasEvaluation} setFilter={setFilter} select={setSelectedId} setEvaluation={setEvaluation} save={saveEvaluation} />}
      {view === 'comments' && <CommentsView interviews={interviews} evaluations={evaluations} onOpen={openEvaluation} />}
      {view === 'recommendations' && <RecommendationsView interviews={interviews} evaluations={evaluations} onOpen={openEvaluation} />}
    </main>
  </div>;
}

function NavButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: string; children: string }) { return <button className={active ? 'active' : ''} onClick={onClick}><span aria-hidden="true">{icon}</span>{children}</button>; }
function Metric({ label, value, detail, tone }: { label: string; value: number; detail: string; tone?: 'warning' }) { return <article><span>{label}</span><b>{value}</b><i className={tone === 'warning' ? 'amber' : 'green'}>{detail}</i></article>; }
function viewTitle(view: EvaluatorView) { return view === 'calendar' ? 'Interview calendar' : view === 'comments' ? 'Evaluation comments' : view === 'recommendations' ? 'Submitted recommendations' : 'Candidate evaluation'; }
function viewDescription(view: EvaluatorView) { return view === 'calendar' ? 'View all your scheduled interviews and open an evaluation directly from the calendar.' : view === 'comments' ? 'Find the internal HR comment and the feedback shared with each candidate.' : view === 'recommendations' ? 'View the final scores and recommendations you have already submitted.' : 'Assign scores, justify your decision for HR, and prepare candidate feedback.'; }

function InterviewCalendar({ month, interviews, loading, onMonth, onOpen }: { month: Date; interviews: EvaluatorInterview[]; loading: boolean; onMonth: (date: Date) => void; onOpen: (interview: EvaluatorInterview) => void }) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1), mondayOffset = (start.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - mondayOffset + 1));
  const byDay = interviews.reduce<Record<string, EvaluatorInterview[]>>((result, interview) => { if (interview.scheduledAt) (result[localDateKey(interview.scheduledAt)] ||= []).push(interview); return result; }, {});
  const upcoming = interviews.filter(isUpcoming).sort((a, b) => Date.parse(a.scheduledAt || '') - Date.parse(b.scheduledAt || '')).slice(0, 6);
  const move = (offset: number) => onMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  return <section className="calendar-layout"><article className="calendar-card"><div className="calendar-toolbar"><div><small>MONTHLY PLANNING</small><h2>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2></div><div><button onClick={() => move(-1)} aria-label="Previous month">‹</button><button onClick={() => onMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</button><button onClick={() => move(1)} aria-label="Next month">›</button></div></div><div className="calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <b key={day}>{day}</b>)}</div><div className="calendar-grid">{cells.map(day => { const events = byDay[localDateKey(day)] || [], outside = day.getMonth() !== month.getMonth(), today = localDateKey(day) === localDateKey(new Date()); return <div className={`${outside ? 'outside ' : ''}${today ? 'today' : ''}`} key={day.toISOString()}><span>{day.getDate()}</span>{events.map(event => <button key={event.id} className={event.evaluationId ? 'evaluated' : ''} title={`${event.candidateName || 'Candidate'} - ${dateTime(event.scheduledAt)}`} onClick={() => onOpen(event)}><time>{new Date(event.scheduledAt!).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</time><strong>{event.candidateName || event.jobTitle}</strong></button>)}</div>; })}</div></article><aside className="calendar-agenda"><div><small>UPCOMING APPOINTMENTS</small><h2>Agenda</h2></div>{loading ? <div className="loading">Loading...</div> : upcoming.map(interview => <button key={interview.id} onClick={() => onOpen(interview)}><time>{dateTime(interview.scheduledAt)}</time><b>{interview.candidateName || 'Candidate'}</b><span>{interview.jobTitle}</span><em>{interview.evaluationId ? 'Evaluated' : 'To evaluate'}</em></button>)}{!loading && !upcoming.length && <div className="candidate-empty"><strong>No upcoming interviews</strong><span>New appointments will appear here.</span></div>}</aside></section>;
}

function EvaluationWorkspace({ loading, interviews, selected, filter, evaluation, saving, hasEvaluation, setFilter, select, setEvaluation, save }: { loading: boolean; interviews: EvaluatorInterview[]; selected: EvaluatorInterview | null; filter: Filter; evaluation: Evaluation; saving: boolean; hasEvaluation: boolean; setFilter: (filter: Filter) => void; select: (id: number) => void; setEvaluation: React.Dispatch<React.SetStateAction<Evaluation>>; save: () => Promise<void> }) {
  return <section className="evaluator-layout"><div className="table-card evaluator-list"><div className="tools evaluator-filters">{(['all', 'todo', 'done', 'upcoming'] as const).map(item => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{filterLabel(item)}</button>)}</div><div className="evaluator-interviews">{loading ? <div className="loading">Loading interviews...</div> : interviews.length === 0 ? <div className="loading">No interviews for this filter.</div> : interviews.map(interview => <button className={selected?.id === interview.id ? 'active' : ''} key={interview.id} onClick={() => select(interview.id)}><span><small>{nice(interview.interviewType)}</small><b>{interview.candidateName || interview.jobTitle}</b><em>{interview.jobTitle} · {dateTime(interview.scheduledAt)}</em></span><i className={interview.evaluationId ? 'done' : 'todo'}>{interview.evaluationId ? 'Evaluated' : 'To evaluate'}</i></button>)}</div></div><section className="evaluator-detail">{!selected ? <div className="candidate-empty"><strong>No interview selected</strong><span>Select an interview from the list.</span></div> : <><article className="candidate-detail evaluator-interview-card"><div><small>SELECTED INTERVIEW</small><h2>{selected.candidateName || 'Candidate'}</h2><p>{selected.jobTitle} · {nice(selected.interviewType)} · {dateTime(selected.scheduledAt)}</p></div><div className="candidate-meta"><span>{nice(selected.mode)}</span><span>{nice(selected.status)}</span>{selected.durationMinutes && <span>{selected.durationMinutes} min</span>}</div></article><form className="review-panel evaluator-form" onSubmit={event => { event.preventDefault(); void save(); }}><div className="evaluator-form-head"><div><small>EVALUATION SHEET</small><h2>Scores and decision</h2></div><ScorePill value={evaluation.overallScore} /></div><div className="evaluator-score-grid"><ScoreInput label="Technical skills" value={evaluation.technicalScore} onChange={technicalScore => setEvaluation(current => ({ ...current, technicalScore }))} /><ScoreInput label="Communication" value={evaluation.communicationScore} onChange={communicationScore => setEvaluation(current => ({ ...current, communicationScore }))} /><ScoreInput label="Motivation" value={evaluation.motivationScore} onChange={motivationScore => setEvaluation(current => ({ ...current, motivationScore }))} /><ScoreInput label="Professionalism" value={evaluation.professionalismScore} onChange={professionalismScore => setEvaluation(current => ({ ...current, professionalismScore }))} /><ScoreInput label="Overall score" value={evaluation.overallScore} onChange={overallScore => setEvaluation(current => ({ ...current, overallScore }))} /></div><label className="candidate-field">Recommendation<select required value={evaluation.recommendation} onChange={event => setEvaluation(current => ({ ...current, recommendation: event.target.value as Recommendation }))}><option value="">Choose a recommendation</option><option value="FAVORABLE">Favorable</option><option value="RESERVED">Reserved</option><option value="UNFAVORABLE">Unfavorable</option></select></label><div className="comment-grid"><label className="candidate-field"><span>Internal comment for HR <b>*</b></span><small>Justify the scores and your decision. This text is never shown to the candidate.</small><textarea required maxLength={5000} rows={7} value={evaluation.hrComment} placeholder="Detailed explanation for the HR team..." onChange={event => setEvaluation(current => ({ ...current, hrComment: event.target.value }))} /></label><label className="candidate-field candidate-facing"><span>Comment for the candidate <b>*</b></span><small>This feedback accompanies their score and recommendation in their personal space.</small><textarea required maxLength={5000} rows={7} value={evaluation.candidateComment} placeholder="Clear and constructive feedback for the candidate..." onChange={event => setEvaluation(current => ({ ...current, candidateComment: event.target.value }))} /></label></div><div className="evaluation-disclosure">Upon submission, the overall score, recommendation and candidate comment will be immediately visible to the candidate.</div><div className="candidate-form-actions"><button type="button" onClick={() => setEvaluation(emptyEvaluation)}>Clear</button><button className="primary" disabled={saving}>{saving ? 'Saving...' : hasEvaluation ? 'Update and notify' : 'Submit and notify'}</button></div></form></>}</section></section>;
}

function CommentsView({ interviews, evaluations, onOpen }: { interviews: EvaluatorInterview[]; evaluations: Record<number, Evaluation>; onOpen: (interview: EvaluatorInterview) => void }) { const completed = interviews.filter(item => item.evaluationId && evaluations[item.id]); return <section className="evaluation-history">{completed.map(interview => { const item = evaluations[interview.id]; return <article key={interview.id}><header><div><small>{interview.jobTitle}</small><h2>{interview.candidateName || 'Candidate'}</h2></div><button onClick={() => onOpen(interview)}>Edit</button></header><div className="history-comments"><div><b>Internal HR</b><p>{item.hrComment}</p></div><div className="candidate-copy"><b>Shared with candidate</b><p>{item.candidateComment}</p></div></div></article>; })}{!completed.length && <div className="candidate-empty"><strong>No comments submitted</strong><span>Comments will appear after the first evaluation.</span></div>}</section>; }
function RecommendationsView({ interviews, evaluations, onOpen }: { interviews: EvaluatorInterview[]; evaluations: Record<number, Evaluation>; onOpen: (interview: EvaluatorInterview) => void }) { const completed = interviews.filter(item => item.evaluationId && evaluations[item.id]); return <section className="recommendation-grid">{completed.map(interview => { const item = evaluations[interview.id]; return <article key={interview.id}><ScorePill value={item.overallScore} /><small>{interview.jobTitle}</small><h2>{interview.candidateName || 'Candidate'}</h2><strong className={`recommendation ${item.recommendation.toLowerCase()}`}>{nice(item.recommendation)}</strong><p>{item.candidateComment}</p><button onClick={() => onOpen(interview)}>Open evaluation</button></article>; })}{!completed.length && <div className="candidate-empty"><strong>No recommendations</strong><span>Submitted decisions will appear here.</span></div>}</section>; }
function filterLabel(filter: Filter) { return filter === 'todo' ? 'To evaluate' : filter === 'done' ? 'Evaluated' : filter === 'upcoming' ? 'Upcoming' : 'All'; }
function ScoreInput({ label, value, onChange }: { label: string; value: number | ''; onChange: (value: number | '') => void }) { return <label><span>{label}</span><input required type="number" min="0" max="20" step="0.5" value={value} onChange={event => onChange(event.target.value === '' ? '' : Number(event.target.value))} /><small>/ 20</small></label>; }
function ScorePill({ value }: { value: number | '' }) { const numeric = Number(value || 0), tone = numeric >= 14 ? 'good' : numeric >= 10 ? 'average' : 'low'; return <div className={`score-pill ${tone}`}><b>{value === '' ? '-' : value}</b><span>/20</span></div>; }
import { useEffect, useMemo, useState } from 'react';
import { InterviewRoom, type InterviewSummary } from '../shared/InterviewRoom';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';
import './evaluator.css';

type Recommendation = 'FAVORABLE' | 'RESERVED' | 'UNFAVORABLE';
type EvaluatorView = 'calendar' | 'evaluations' | 'comments' | 'recommendations';
type Filter = 'all' | 'todo' | 'done' | 'upcoming';
type EvaluatorInterview = InterviewSummary & { applicationId?: number; candidateName?: string; location?: string; evaluationId?: number };
type Evaluation = { id?: number; interviewId?: number; technicalScore: number | ''; communicationScore: number | ''; motivationScore: number | ''; professionalismScore: number | ''; overallScore: number | ''; recommendation: Recommendation | ''; hrComment: string; candidateComment: string; createdAt?: string };
type JoinAction = { disabled: boolean; label: string; detail: string };

const emptyEvaluation: Evaluation = { technicalScore: '', communicationScore: '', motivationScore: '', professionalismScore: '', overallScore: '', recommendation: '', hrComment: '', candidateComment: '' };

async function request<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${url}`, { ...init, headers: { ...authHeaders(token), ...init?.headers } });
  if (response.status === 204) return undefined as T;
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || body.error || `La requete a echoue (${response.status})`);
  }
  return response.json() as Promise<T>;
}

async function loadEvaluation(interviewId: number, token: string): Promise<Evaluation | null> {
  const response = await fetch(`${API}/api/interviews/${interviewId}/evaluation`, { headers: authHeaders(token) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Impossible de charger cette evaluation');
  const value = await response.json() as Evaluation;
  return { ...emptyEvaluation, ...value, hrComment: value.hrComment || '', candidateComment: value.candidateComment || '' };
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

const nice = (value?: string) => value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()) : '-';
const dateTime = (value?: string) => value ? new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : 'Non planifie';
const fullDate = (value?: string) => value ? new Date(value).toLocaleDateString('fr-FR', { dateStyle: 'full' }) : 'Non planifie';
const timeOnly = (value?: string) => value ? new Date(value).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--';
const isUpcoming = (interview: InterviewSummary) => !!interview.scheduledAt && Date.parse(interview.scheduledAt) >= Date.now();
function localDateKey(value: Date | string) { const date = typeof value === 'string' ? new Date(value) : value; return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function sortBySchedule(left: InterviewSummary, right: InterviewSummary) { return Date.parse(left.scheduledAt || '') - Date.parse(right.scheduledAt || ''); }
function formatRange(interview: InterviewSummary) {
  if (!interview.scheduledAt) return 'Horaire a definir';
  const start = new Date(interview.scheduledAt);
  const end = new Date(start.getTime() + ((interview.durationMinutes || 60) * 60000));
  return `${timeOnly(interview.scheduledAt)} - ${timeOnly(end.toISOString())}`;
}

function joinAction(interview: EvaluatorInterview): JoinAction {
  if (interview.mode !== 'ONLINE') return { disabled: true, label: 'Entretien sur site', detail: interview.location || 'Rejoignez cet entretien sur place.' };
  if (interview.status === 'CANCELLED') return { disabled: true, label: 'Entretien annule', detail: 'Cet entretien ne peut plus etre rejoint.' };
  if (interview.status === 'COMPLETED' || interview.status === 'NO_SHOW') return { disabled: true, label: 'Entretien termine', detail: 'La session est deja terminee.' };
  if (interview.status === 'POSTPONED') return { disabled: true, label: 'Entretien reporte', detail: 'Attendez la nouvelle planification communiquee par les RH.' };
  if (!interview.scheduledAt) return { disabled: true, label: 'Horaire manquant', detail: 'Les RH doivent encore planifier cet entretien.' };
  if (interview.joinAvailable) return { disabled: false, label: 'Rejoindre l entretien', detail: 'La salle de cet entretien est actuellement accessible.' };
  if (interview.joinWindowStartsAt && Date.now() < Date.parse(interview.joinWindowStartsAt)) {
    return { disabled: true, label: `Disponible a ${timeOnly(interview.joinWindowStartsAt)}`, detail: `La salle ouvrira le ${dateTime(interview.joinWindowStartsAt)}.` };
  }
  if (interview.joinWindowEndsAt && Date.now() > Date.parse(interview.joinWindowEndsAt)) {
    return { disabled: true, label: 'Fenetre terminee', detail: 'La fenetre de connexion a expire pour cet entretien.' };
  }
  return { disabled: true, label: 'Indisponible', detail: 'Cet entretien ne peut pas etre rejoint dans son etat actuel.' };
}

export function EvaluatorDashboard({ session, logout }: { session: Session; logout: () => void }) {
  const [view, setView] = useState<EvaluatorView>('calendar');
  const [interviews, setInterviews] = useState<EvaluatorInterview[]>([]);
  const [evaluations, setEvaluations] = useState<Record<number, Evaluation>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detailsId, setDetailsId] = useState<number | null>(null);
  const [room, setRoom] = useState<InterviewSummary | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation>(emptyEvaluation);
  const [filter, setFilter] = useState<Filter>('all');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
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
  const filtered = useMemo(() => interviews.filter(interview => filter === 'todo' ? !interview.evaluationId : filter === 'done' ? Boolean(interview.evaluationId) : filter === 'upcoming' ? isUpcoming(interview) : true), [filter, interviews]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    request<EvaluatorInterview[]>('/api/interview-rooms/my', session.accessToken).then(async items => {
      if (!active) return;
      setInterviews(items);
      setSelectedId(current => current ?? items[0]?.id ?? null);
      setError('');
      const loaded = await Promise.all(items.filter(item => item.evaluationId).map(async item => [item.id, await loadEvaluation(item.id, session.accessToken)] as const));
      if (active) setEvaluations(Object.fromEntries(loaded.filter((entry): entry is readonly [number, Evaluation] => Boolean(entry[1]))));
    }).catch(caught => active && setError(caught instanceof Error ? caught.message : 'Impossible de charger les entretiens affectes')).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [session.accessToken]);

  useEffect(() => {
    if (!selected?.id) { setEvaluation(emptyEvaluation); return; }
    const cached = evaluations[selected.id];
    if (cached) { setEvaluation(cached); return; }
    let active = true;
    setNotice('');
    loadEvaluation(selected.id, session.accessToken).then(value => {
      if (!active) return;
      setEvaluation(value || emptyEvaluation);
      if (value) setEvaluations(current => ({ ...current, [selected.id]: value }));
      setInterviews(current => current.map(item => item.id === selected.id ? { ...item, evaluationId: value?.id } : item));
    }).catch(() => active && setEvaluation(emptyEvaluation));
    return () => { active = false; };
  }, [selected?.id, session.accessToken, evaluations]);

  function openEvaluation(interview: EvaluatorInterview) {
    setSelectedId(interview.id);
    setDetailsId(null);
    setView('evaluations');
    setFilter('all');
    setNotice('');
  }

  function openInterviewDetails(interview: EvaluatorInterview) {
    setSelectedId(interview.id);
    setDetailsId(interview.id);
    setNotice('');
  }

  function joinInterview(interview: EvaluatorInterview) {
    setDetailsId(null);
    setRoom(interview);
  }

  async function saveEvaluation() {
    if (!selected) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const saved = await request<Evaluation>(`/api/interviews/${selected.id}/evaluation`, session.accessToken, { method: hasEvaluation ? 'PUT' : 'POST', body: JSON.stringify(evaluationPayload(evaluation)) });
      setEvaluation(saved);
      setEvaluations(current => ({ ...current, [selected.id]: saved }));
      setInterviews(current => current.map(item => item.id === selected.id ? { ...item, evaluationId: saved.id } : item));
      setNotice(hasEvaluation ? 'Evaluation mise a jour. Le candidat a recu une nouvelle notification.' : 'Evaluation soumise. Le candidat a ete notifie de son resultat.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible d enregistrer l evaluation');
    } finally {
      setSaving(false);
    }
  }

  if (room) return <InterviewRoom interview={room} token={session.accessToken} onLeave={() => setRoom(null)} onAuthExpired={logout} />;
  return <div className="shell evaluator-shell">
    <aside><div className="side-logo">BF<span>Recruit</span></div><nav><b>ESPACE EVALUATEUR</b><NavButton active={view === 'calendar'} onClick={() => setView('calendar')} icon="▦">Interviews</NavButton><NavButton active={view === 'evaluations'} onClick={() => { setView('evaluations'); setFilter('todo'); }} icon="✓">Evaluations</NavButton><NavButton active={view === 'comments'} onClick={() => setView('comments')} icon="◫">Commentaires</NavButton><NavButton active={view === 'recommendations'} onClick={() => setView('recommendations')} icon="◇">Recommandations</NavButton></nav><div className="profile"><span>{session.firstName[0]}{session.lastName[0]}</span><div><b>{session.firstName} {session.lastName}</b><small>Evaluateur</small></div><button onClick={logout}>Quitter</button></div></aside>
    <main className="content evaluator-main"><header><div><small>PORTAIL EVALUATEUR</small><h1>{viewTitle(view)}</h1><p>{viewDescription(view)}</p></div></header>
      <section className="stats evaluator-stats"><Metric label="Entretiens affectes" value={stats.total} detail={`${stats.upcoming} a venir`} /><Metric label="A evaluer" value={stats.todo} detail="Action requise" tone="warning" /><Metric label="Termines" value={stats.done} detail="Evaluations soumises" /></section>
      {error && <div className="candidate-alert">{error}</div>}{notice && <div className="candidate-success">{notice}</div>}
      {view === 'calendar' && <InterviewCalendar month={calendarMonth} interviews={interviews} loading={loading} onMonth={setCalendarMonth} onOpen={openInterviewDetails} />}
      {view === 'evaluations' && <EvaluationWorkspace loading={loading} interviews={filtered} selected={selected} filter={filter} evaluation={evaluation} saving={saving} hasEvaluation={hasEvaluation} setFilter={setFilter} select={setSelectedId} setEvaluation={setEvaluation} save={saveEvaluation} />}
      {view === 'comments' && <CommentsView interviews={interviews} evaluations={evaluations} onOpen={openEvaluation} />}
      {view === 'recommendations' && <RecommendationsView interviews={interviews} evaluations={evaluations} onOpen={openEvaluation} />}
      {detailedInterview && <InterviewDetailsModal interview={detailedInterview} onClose={() => setDetailsId(null)} onJoin={joinInterview} onOpenEvaluation={openEvaluation} />}
    </main>
  </div>;
}

function NavButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: string; children: string }) { return <button className={active ? 'active' : ''} onClick={onClick}><span aria-hidden="true">{icon}</span>{children}</button>; }
function Metric({ label, value, detail, tone }: { label: string; value: number; detail: string; tone?: 'warning' }) { return <article><span>{label}</span><b>{value}</b><i className={tone === 'warning' ? 'amber' : 'green'}>{detail}</i></article>; }
function viewTitle(view: EvaluatorView) { return view === 'calendar' ? 'Calendrier des interviews' : view === 'comments' ? 'Commentaires des evaluations' : view === 'recommendations' ? 'Recommandations transmises' : 'Evaluation des candidats'; }
function viewDescription(view: EvaluatorView) { return view === 'calendar' ? 'Ouvrez chaque rendez-vous depuis votre calendrier puis rejoignez la bonne salle d entretien.' : view === 'comments' ? 'Retrouvez le commentaire interne RH et le retour partage avec chaque candidat.' : view === 'recommendations' ? 'Consultez les notes finales et les recommandations deja soumises.' : 'Attribuez les notes, justifiez votre decision pour les RH et preparez le retour candidat.'; }

function InterviewCalendar({ month, interviews, loading, onMonth, onOpen }: { month: Date; interviews: EvaluatorInterview[]; loading: boolean; onMonth: (date: Date) => void; onOpen: (interview: EvaluatorInterview) => void }) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (start.getDay() + 6) % 7;
  const cells = Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - mondayOffset + 1));
  const byDay = interviews.reduce<Record<string, EvaluatorInterview[]>>((result, interview) => {
    if (interview.scheduledAt) (result[localDateKey(interview.scheduledAt)] ||= []).push(interview);
    return result;
  }, {});
  Object.values(byDay).forEach(items => items.sort(sortBySchedule));
  const upcoming = interviews.filter(isUpcoming).sort(sortBySchedule).slice(0, 6);
  const move = (offset: number) => onMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));

  return <section className="calendar-layout"><article className="calendar-card"><div className="calendar-toolbar"><div><small>PLANNING MENSUEL</small><h2>{month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h2></div><div><button onClick={() => move(-1)} aria-label="Mois precedent">‹</button><button onClick={() => onMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Aujourd hui</button><button onClick={() => move(1)} aria-label="Mois suivant">›</button></div></div><div className="calendar-weekdays">{['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => <b key={day}>{day}</b>)}</div><div className="calendar-grid">{cells.map(day => { const events = byDay[localDateKey(day)] || []; const outside = day.getMonth() !== month.getMonth(); const today = localDateKey(day) === localDateKey(new Date()); return <div className={`${outside ? 'outside ' : ''}${today ? 'today' : ''}`} key={day.toISOString()}><span>{day.getDate()}</span>{events.map(event => <button key={event.id} className={`calendar-event ${event.evaluationId ? 'evaluated' : ''} status-${event.status.toLowerCase()}`} title={`${event.jobTitle} - ${event.candidateName || 'Candidat'}`} onClick={() => onOpen(event)}><time>{timeOnly(event.scheduledAt)}</time><strong>{event.jobTitle}</strong><b>{event.candidateName || 'Candidat'}</b><em>{nice(event.interviewType)}</em></button>)}</div>; })}</div></article><aside className="calendar-agenda"><div><small>PROCHAINS RENDEZ-VOUS</small><h2>Agenda</h2></div>{loading ? <div className="loading">Chargement...</div> : upcoming.map(interview => <button key={interview.id} onClick={() => onOpen(interview)}><time>{dateTime(interview.scheduledAt)}</time><b>{interview.jobTitle}</b><span>{interview.candidateName || 'Candidat'}</span><em className={`status ${interview.status.toLowerCase()}`}>{nice(interview.status)}</em></button>)}{!loading && !upcoming.length && <div className="candidate-empty"><strong>Aucun entretien a venir</strong><span>Les nouveaux rendez-vous apparaitront ici.</span></div>}</aside></section>;
}

function InterviewDetailsModal({ interview, onClose, onJoin, onOpenEvaluation }: { interview: EvaluatorInterview; onClose: () => void; onJoin: (interview: EvaluatorInterview) => void; onOpenEvaluation: (interview: EvaluatorInterview) => void }) {
  const action = joinAction(interview);
  return <div className="overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}><section className="modal evaluator-event-modal"><button type="button" className="close" onClick={onClose}>×</button><small>{nice(interview.interviewType)}</small><h2>{interview.jobTitle}</h2><div className="evaluator-event-meta"><article><span>Candidat</span><b>{interview.candidateName || 'Candidat'}</b></article><article><span>Date</span><b>{fullDate(interview.scheduledAt)}</b></article><article><span>Heure</span><b>{formatRange(interview)}</b></article><article><span>Statut</span><b className={`event-status ${interview.status.toLowerCase()}`}>{nice(interview.status)}</b></article><article><span>Mode</span><b>{nice(interview.mode)}</b></article><article><span>Lieu</span><b>{interview.location || (interview.mode === 'ONLINE' ? 'Salle video' : 'A definir')}</b></article></div><p className="evaluator-event-note">{action.detail}</p><div className="modal-actions"><button type="button" onClick={() => onOpenEvaluation(interview)}>Ouvrir l evaluation</button><button type="button" className="primary" disabled={action.disabled} onClick={() => onJoin(interview)}>{action.label}</button></div></section></div>;
}

function EvaluationWorkspace({ loading, interviews, selected, filter, evaluation, saving, hasEvaluation, setFilter, select, setEvaluation, save }: { loading: boolean; interviews: EvaluatorInterview[]; selected: EvaluatorInterview | null; filter: Filter; evaluation: Evaluation; saving: boolean; hasEvaluation: boolean; setFilter: (filter: Filter) => void; select: (id: number) => void; setEvaluation: React.Dispatch<React.SetStateAction<Evaluation>>; save: () => Promise<void> }) {
  return <section className="evaluator-layout"><div className="table-card evaluator-list"><div className="tools evaluator-filters">{(['all', 'todo', 'done', 'upcoming'] as const).map(item => <button className={filter === item ? 'active' : ''} key={item} onClick={() => setFilter(item)}>{filterLabel(item)}</button>)}</div><div className="evaluator-interviews">{loading ? <div className="loading">Chargement des entretiens...</div> : interviews.length === 0 ? <div className="loading">Aucun entretien pour ce filtre.</div> : interviews.map(interview => <button className={selected?.id === interview.id ? 'active' : ''} key={interview.id} onClick={() => select(interview.id)}><span><small>{nice(interview.interviewType)}</small><b>{interview.candidateName || 'Candidat'}</b><em>{interview.jobTitle} · {dateTime(interview.scheduledAt)}</em></span><i className={interview.evaluationId ? 'done' : 'todo'}>{interview.evaluationId ? 'Evalue' : 'A evaluer'}</i></button>)}</div></div><section className="evaluator-detail">{!selected ? <div className="candidate-empty"><strong>Aucun entretien selectionne</strong><span>Selectionnez un entretien dans la liste.</span></div> : <><article className="candidate-detail evaluator-interview-card"><div><small>ENTRETIEN SELECTIONNE</small><h2>{selected.candidateName || 'Candidat'}</h2><p>{selected.jobTitle} · {nice(selected.interviewType)} · {dateTime(selected.scheduledAt)}</p></div><div className="candidate-meta"><span>{nice(selected.mode)}</span><span>{nice(selected.status)}</span>{selected.durationMinutes && <span>{selected.durationMinutes} min</span>}</div></article><form className="review-panel evaluator-form" onSubmit={event => { event.preventDefault(); void save(); }}><div className="evaluator-form-head"><div><small>FICHE D EVALUATION</small><h2>Notes et decision</h2></div><ScorePill value={evaluation.overallScore} /></div><div className="evaluator-score-grid"><ScoreInput label="Competences techniques" value={evaluation.technicalScore} onChange={technicalScore => setEvaluation(current => ({ ...current, technicalScore }))} /><ScoreInput label="Communication" value={evaluation.communicationScore} onChange={communicationScore => setEvaluation(current => ({ ...current, communicationScore }))} /><ScoreInput label="Motivation" value={evaluation.motivationScore} onChange={motivationScore => setEvaluation(current => ({ ...current, motivationScore }))} /><ScoreInput label="Professionnalisme" value={evaluation.professionalismScore} onChange={professionalismScore => setEvaluation(current => ({ ...current, professionalismScore }))} /><ScoreInput label="Note globale" value={evaluation.overallScore} onChange={overallScore => setEvaluation(current => ({ ...current, overallScore }))} /></div><label className="candidate-field">Recommandation<select required value={evaluation.recommendation} onChange={event => setEvaluation(current => ({ ...current, recommendation: event.target.value as Recommendation }))}><option value="">Choisir une recommandation</option><option value="FAVORABLE">Favorable</option><option value="RESERVED">Reservee</option><option value="UNFAVORABLE">Defavorable</option></select></label><div className="comment-grid"><label className="candidate-field"><span>Commentaire interne pour les RH <b>*</b></span><small>Justifiez les notes et votre decision. Ce texte n est jamais montre au candidat.</small><textarea required maxLength={5000} rows={7} value={evaluation.hrComment} placeholder="Explication detaillee pour l equipe RH..." onChange={event => setEvaluation(current => ({ ...current, hrComment: event.target.value }))} /></label><label className="candidate-field candidate-facing"><span>Commentaire pour le candidat <b>*</b></span><small>Ce retour accompagne sa note et sa recommandation dans son espace personnel.</small><textarea required maxLength={5000} rows={7} value={evaluation.candidateComment} placeholder="Retour clair et constructif pour le candidat..." onChange={event => setEvaluation(current => ({ ...current, candidateComment: event.target.value }))} /></label></div><div className="evaluation-disclosure">En soumettant, la note globale, la recommandation et le commentaire candidat seront immediatement visibles par le candidat.</div><div className="candidate-form-actions"><button type="button" onClick={() => setEvaluation(emptyEvaluation)}>Effacer</button><button className="primary" disabled={saving}>{saving ? 'Enregistrement...' : hasEvaluation ? 'Mettre a jour et notifier' : 'Soumettre et notifier'}</button></div></form></>}</section></section>;
}

function CommentsView({ interviews, evaluations, onOpen }: { interviews: EvaluatorInterview[]; evaluations: Record<number, Evaluation>; onOpen: (interview: EvaluatorInterview) => void }) {
  const completed = interviews.filter(item => item.evaluationId && evaluations[item.id]);
  return <section className="evaluation-history">{completed.map(interview => { const item = evaluations[interview.id]; return <article key={interview.id}><header><div><small>{interview.jobTitle}</small><h2>{interview.candidateName || 'Candidat'}</h2></div><button onClick={() => onOpen(interview)}>Modifier</button></header><div className="history-comments"><div><b>Interne RH</b><p>{item.hrComment}</p></div><div className="candidate-copy"><b>Partage avec le candidat</b><p>{item.candidateComment}</p></div></div></article>; })}{!completed.length && <div className="candidate-empty"><strong>Aucun commentaire soumis</strong><span>Les commentaires apparaitront apres la premiere evaluation.</span></div>}</section>;
}

function RecommendationsView({ interviews, evaluations, onOpen }: { interviews: EvaluatorInterview[]; evaluations: Record<number, Evaluation>; onOpen: (interview: EvaluatorInterview) => void }) {
  const completed = interviews.filter(item => item.evaluationId && evaluations[item.id]);
  return <section className="recommendation-grid">{completed.map(interview => { const item = evaluations[interview.id]; return <article key={interview.id}><ScorePill value={item.overallScore} /><small>{interview.jobTitle}</small><h2>{interview.candidateName || 'Candidat'}</h2><strong className={`recommendation ${item.recommendation.toLowerCase()}`}>{nice(item.recommendation)}</strong><p>{item.candidateComment}</p><button onClick={() => onOpen(interview)}>Ouvrir l evaluation</button></article>; })}{!completed.length && <div className="candidate-empty"><strong>Aucune recommandation</strong><span>Les decisions soumises apparaitront ici.</span></div>}</section>;
}

function filterLabel(filter: Filter) { return filter === 'todo' ? 'A evaluer' : filter === 'done' ? 'Evalues' : filter === 'upcoming' ? 'A venir' : 'Tous'; }
function ScoreInput({ label, value, onChange }: { label: string; value: number | ''; onChange: (value: number | '') => void }) { return <label><span>{label}</span><input required type="number" min="0" max="20" step="0.5" value={value} onChange={event => onChange(event.target.value === '' ? '' : Number(event.target.value))} /><small>/ 20</small></label>; }
function ScorePill({ value }: { value: number | '' }) { const numeric = Number(value || 0), tone = numeric >= 14 ? 'good' : numeric >= 10 ? 'average' : 'low'; return <div className={`score-pill ${tone}`}><b>{value === '' ? '-' : value}</b><span>/20</span></div>; }

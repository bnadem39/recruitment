import { useEffect, useMemo, useState } from 'react';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';
import { InterviewRoom } from '../shared/InterviewRoom';
import { LocationMap } from '../shared/LocationMap';
import './candidate-evaluation.css';

type View = 'dashboard' | 'jobs' | 'offer' | 'apply' | 'applications' | 'application' | 'interviews' | 'interview-room' | 'profile';
type FieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'EMAIL' | 'PHONE' | 'RADIO' | 'CHECKBOX' | 'SELECT' | 'MULTI_SELECT' | 'FILE' | 'BOOLEAN';
type Stage = 'SUBMISSION' | 'HR_REVIEW' | 'PRESELECTION' | 'HR_INTERVIEW' | 'TECHNICAL_INTERVIEW' | 'FINAL_VALIDATION' | 'FINAL_DECISION';
type Offer = { id: number; title: string; description?: string; department?: string; contractType?: string; location?: string; publicationDate?: string; deadline?: string; formId?: number };
type Application = { id: number; status: string; currentStage: Stage; submittedAt?: string; updatedAt?: string; jobOfferId: number; jobTitle: string; department?: string; location?: string };
type Option = { id: number; label: string; value: string };
type Field = { id: number; label: string; fieldType: FieldType; required: boolean; placeholder?: string; defaultVisible: boolean; displayOrder: number; minimumLength?: number; maximumLength?: number; options: Option[] };
type Condition = { id: number; sourceFieldId: number; targetFieldId: number; operator: string; expectedValue?: string; action: string };
type FormBundle = { formId: number; title: string; description?: string; fields: Field[]; conditions: Condition[] };
type Profile = { id: number; firstName: string; lastName: string; email: string; phone?: string; birthDate?: string; address?: string; postalCode?: string; nationality?: string; gender?: string; linkedinUrl?: string; portfolioUrl?: string };
type InterviewEvaluation = { id: number; overallScore: number; recommendation: string; candidateComment: string; createdAt?: string };
type Interview = { id: number; interviewType: string; scheduledAt?: string; durationMinutes?: number; location?: string; meetingLink?: string; mode?: string; status: string; applicationId: number; jobTitle: string; evaluation?: InterviewEvaluation | null };
type FieldResponse = { fieldId: number; fieldLabel: string; textValue?: string; numberValue?: number; dateValue?: string; booleanValue?: boolean };

const stages: Stage[] = ['SUBMISSION', 'HR_REVIEW', 'PRESELECTION', 'HR_INTERVIEW', 'TECHNICAL_INTERVIEW', 'FINAL_VALIDATION', 'FINAL_DECISION'];
const stageLabels: Record<Stage, string> = { SUBMISSION: 'Application Submitted', HR_REVIEW: 'HR Review', PRESELECTION: 'Preselection', HR_INTERVIEW: 'HR Interview', TECHNICAL_INTERVIEW: 'Technical Interview', FINAL_VALIDATION: 'Final Validation', FINAL_DECISION: 'Final Decision' };
const text = (value?: string | number | boolean | null) => value === undefined || value === null || value === '' ? 'Not provided' : String(value);
const nice = (value?: string) => text(value).replaceAll('_', ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
const date = (value?: string) => value ? new Date(value).toLocaleDateString() : 'Not set';
const datetime = (value?: string) => value ? new Date(value).toLocaleString() : 'Not scheduled';
const BFPME_LOCATION = {
  latitude: 36.8470625,
  longitude: 10.1911875,
  name: 'BFPME',
  address: '34, Rue Hédi Karray, Centre Urbain Nord, El Menzah IV - 1004 Tunis',
} as const;
const BFPME_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${BFPME_LOCATION.latitude},${BFPME_LOCATION.longitude}`;

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...authHeaders(token), ...(init?.headers || {}) } });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || error.error || 'Request failed');
  }
  return res.json();
}

export function CandidateDashboard({ session, logout }: { session: Session; logout: () => void }) {
  const [view, setView] = useState<View>('dashboard');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [selectedInterviewId, setSelectedInterviewId] = useState<number | null>(null);
  const [focusedInterviewId, setFocusedInterviewId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [nextOffers, nextApplications, nextInterviews, nextProfile] = await Promise.all([
        request<Offer[]>('/api/candidate/job-offers', session.accessToken),
        request<Application[]>('/api/candidate/applications', session.accessToken),
        request<Interview[]>('/api/candidate/interviews', session.accessToken),
        request<Profile>('/api/candidate/profile', session.accessToken),
      ]);
      setOffers(nextOffers);
      setApplications(nextApplications);
      setInterviews(nextInterviews);
      setProfile(nextProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load candidate portal');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);
  useEffect(() => {
    const handleNavigation = (event: Event) => {
      const actionUrl = (event as CustomEvent<string>).detail || '';
      const match = actionUrl.match(/\/interviews\/(\d+)/);
      if (!match) return;
      const interviewId = Number(match[1]);
      setFocusedInterviewId(interviewId);
      setView('interviews');
      request<Interview[]>('/api/candidate/interviews', session.accessToken).then(setInterviews).catch(err => setError(err instanceof Error ? err.message : 'Unable to refresh interviews'));
    };
    window.addEventListener('app:navigate', handleNavigation);
    return () => window.removeEventListener('app:navigate', handleNavigation);
  }, [session.accessToken]);
  useEffect(() => {
    if (view !== 'interviews' || !focusedInterviewId) return;
    const timer = window.setTimeout(() => document.getElementById(`candidate-interview-${focusedInterviewId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    return () => window.clearTimeout(timer);
  }, [focusedInterviewId, interviews, view]);
  const openOffer = (id: number) => { setSelectedOfferId(id); setView('offer'); };
  const openApplication = (id: number) => { setSelectedApplicationId(id); setView('application'); };
  const navigate = (next: View) => { setView(next); setError(''); };

  return <div className="candidate-shell">
    <aside className="candidate-side">
      <div className="side-logo">BFPME<span>Recruit</span></div>
      <nav>
        <b>CANDIDATE</b>
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}>Dashboard</button>
        <button className={view === 'jobs' || view === 'offer' || view === 'apply' ? 'active' : ''} onClick={() => navigate('jobs')}>Job Offers</button>
        <button className={view === 'applications' || view === 'application' ? 'active' : ''} onClick={() => navigate('applications')}>My Applications</button>
        <button className={view === 'interviews' || view === 'interview-room' ? 'active' : ''} onClick={() => navigate('interviews')}>Interviews & Results</button>
        <button className={view === 'profile' ? 'active' : ''} onClick={() => navigate('profile')}>My Profile</button>
        <button onClick={logout}>Logout</button>
      </nav>
      <div className="profile"><span>{session.firstName[0]}{session.lastName[0]}</span><div><strong>{session.firstName} {session.lastName}</strong><small>{session.email}</small></div></div>
    </aside>
    <main className="candidate-main">
      {error && <div className="candidate-alert">{error}</div>}
      {loading ? <CandidateLoading /> : <>
        {view === 'dashboard' && <Dashboard profile={profile} offers={offers} applications={applications} interviews={interviews} openOffer={openOffer} openApplication={openApplication} />}
        {view === 'jobs' && <JobOffers offers={offers} openOffer={openOffer} />}
        {view === 'offer' && selectedOfferId && <OfferDetails id={selectedOfferId} token={session.accessToken} applications={applications} openApplication={openApplication} startApply={() => navigate('apply')} />}
        {view === 'apply' && selectedOfferId && <ApplicationForm offerId={selectedOfferId} token={session.accessToken} onSubmitted={(id) => { void load(); setSelectedApplicationId(id); setView('application'); }} />}
        {view === 'applications' && <Applications applications={applications} openApplication={openApplication} />}
        {view === 'application' && selectedApplicationId && <ApplicationDetail id={selectedApplicationId} token={session.accessToken} applications={applications} />}
        {view === 'interviews' && <Interviews interviews={interviews} focusedId={focusedInterviewId} join={(id) => { setSelectedInterviewId(id); setView('interview-room'); }} />}
        {view === 'interview-room' && selectedInterviewId && <InterviewRoom interview={interviews.find(item => item.id === selectedInterviewId)!} token={session.accessToken} onLeave={() => navigate('interviews')} onAuthExpired={logout} />}
        {view === 'profile' && profile && <CandidateProfile profile={profile} token={session.accessToken} onSaved={setProfile} />}
      </>}
    </main>
  </div>;
}

function Dashboard({ profile, offers, applications, interviews, openOffer, openApplication }: { profile: Profile | null; offers: Offer[]; applications: Application[]; interviews: Interview[]; openOffer: (id: number) => void; openApplication: (id: number) => void }) {
  const upcoming = interviews.filter(item => item.scheduledAt && new Date(item.scheduledAt) >= new Date());
  const inProgress = applications.filter(app => !['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(app.status));
  const recent = [...applications].sort((a, b) => Date.parse(b.updatedAt || b.submittedAt || '') - Date.parse(a.updatedAt || a.submittedAt || ''))[0];
  return <section>
    <div className="candidate-hero"><small>Candidate Portal</small><h1>Welcome back, {profile?.firstName || 'Candidate'}</h1><p>Track your applications and discover new opportunities.</p></div>
    <div className="candidate-stats"><Metric label="Applications Submitted" value={applications.length} /><Metric label="Applications In Progress" value={inProgress.length} /><Metric label="Upcoming Interviews" value={upcoming.length} /></div>
    <div className="candidate-grid"><Panel title="Recent Application">{recent ? <ApplicationCard app={recent} onOpen={() => openApplication(recent.id)} /> : <EmptyState title="No applications yet" body="Published opportunities will appear in Job Offers." />}</Panel><Panel title="Available Job Offers"><div className="candidate-card-list">{offers.slice(0, 3).map(offer => <OfferCard key={offer.id} offer={offer} onOpen={() => openOffer(offer.id)} />)}</div>{!offers.length && <EmptyState title="No open offers" body="Please check again later." />}</Panel></div>
    <Panel title="BFPME Location"><BfpmeLocation headingId="dashboard-bfpme-location" dashboard /></Panel>
  </section>;
}

function JobOffers({ offers, openOffer }: { offers: Offer[]; openOffer: (id: number) => void }) {
  const [query, setQuery] = useState(''), [department, setDepartment] = useState(''), [location, setLocation] = useState(''), [contract, setContract] = useState(''), [sort, setSort] = useState('recent');
  const departments = [...new Set(offers.map(item => item.department).filter(Boolean))] as string[];
  const locations = [...new Set(offers.map(item => item.location).filter(Boolean))] as string[];
  const contracts = [...new Set(offers.map(item => item.contractType).filter(Boolean))] as string[];
  const filtered = offers.filter(offer => `${offer.title} ${offer.description} ${offer.department}`.toLowerCase().includes(query.toLowerCase()) && (!department || offer.department === department) && (!location || offer.location === location) && (!contract || offer.contractType === contract)).sort((a, b) => sort === 'deadline' ? Date.parse(a.deadline || '2999-12-31') - Date.parse(b.deadline || '2999-12-31') : Date.parse(b.publicationDate || '') - Date.parse(a.publicationDate || ''));
  return <section><PageHeader label="Job Offers" title="Explore published opportunities" body="Only offers currently open for applications are shown." /><div className="candidate-tools"><input placeholder="Search jobs..." value={query} onChange={e => setQuery(e.target.value)} /><select value={department} onChange={e => setDepartment(e.target.value)}><option value="">Department</option>{departments.map(item => <option key={item}>{item}</option>)}</select><select value={location} onChange={e => setLocation(e.target.value)}><option value="">Location</option>{locations.map(item => <option key={item}>{item}</option>)}</select><select value={contract} onChange={e => setContract(e.target.value)}><option value="">Contract</option>{contracts.map(item => <option key={item} value={item}>{nice(item)}</option>)}</select><select value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Most recent</option><option value="deadline">Deadline</option></select></div><div className="candidate-offers">{filtered.map(offer => <OfferCard key={offer.id} offer={offer} onOpen={() => openOffer(offer.id)} />)}</div>{!filtered.length && <EmptyState title="No matching offers" body="Adjust search or filters to see more jobs." />}</section>;
}

function OfferDetails({ id, token, applications, openApplication, startApply }: { id: number; token: string; applications: Application[]; openApplication: (id: number) => void; startApply: () => void }) {
  const [offer, setOffer] = useState<Offer | null>(null), [error, setError] = useState('');
  useEffect(() => { request<Offer>(`/api/candidate/job-offers/${id}`, token).then(setOffer).catch(err => setError(err.message)); }, [id, token]);
  const existing = applications.find(app => app.jobOfferId === id);
  if (error) return <div className="candidate-alert">{error}</div>;
  if (!offer) return <CandidateLoading />;
  return <section><PageHeader label="Offer Details" title={offer.title} body={`${text(offer.department)} - ${text(offer.location)} - ${nice(offer.contractType)}`} /><div className="candidate-detail"><div className="candidate-meta"><span>Published {date(offer.publicationDate)}</span><span>Deadline {date(offer.deadline)}</span><span>{nice(offer.contractType)}</span></div><Section title="About the position" content={offer.description} /><Section title="Responsibilities" content="Details are provided by HR in the published offer description." /><Section title="Required skills" content="Review the application form questions for role-specific skill requirements." /><Section title="Required experience" content="Experience requirements will appear here when included in the offer." /><Section title="Qualifications" content="Qualifications are collected through the dynamic application form where configured by HR." /><Section title="Additional information" content={`Department: ${text(offer.department)}. Location: ${text(offer.location)}.`} /><button className="primary candidate-action" onClick={() => existing ? openApplication(existing.id) : startApply()}>{existing ? 'View My Application' : 'Apply Now'}</button></div></section>;
}

function ApplicationForm({ offerId, token, onSubmitted }: { offerId: number; token: string; onSubmitted: (id: number) => void }) {
  const [form, setForm] = useState<FormBundle | null>(null), [answers, setAnswers] = useState<Record<number, string | boolean>>({}), [files, setFiles] = useState<Record<number, File | undefined>>({}), [review, setReview] = useState(false), [errors, setErrors] = useState<Record<number, string>>({}), [message, setMessage] = useState(''), [submitting, setSubmitting] = useState(false);
  useEffect(() => { request<FormBundle>(`/api/candidate/job-offers/${offerId}/form`, token).then(setForm).catch(err => setMessage(err.message)); }, [offerId, token]);
  const visibleFields = useMemo(() => form ? form.fields.filter(field => isVisible(field, form.conditions, answers)) : [], [form, answers]);
  const setAnswer = (id: number, value: string | boolean) => { setAnswers(prev => ({ ...prev, [id]: value })); setErrors(prev => ({ ...prev, [id]: '' })); };
  const validate = () => { const next: Record<number, string> = {}; visibleFields.forEach(field => { const value = answers[field.id], file = files[field.id]; if (field.required && (isFile(field) ? !file : value === undefined || value === '' || value === false)) next[field.id] = 'This field is required.'; if (typeof value === 'string' && field.minimumLength && value.length < field.minimumLength) next[field.id] = `Minimum ${field.minimumLength} characters.`; if (typeof value === 'string' && field.maximumLength && value.length > field.maximumLength) next[field.id] = `Maximum ${field.maximumLength} characters.`; }); setErrors(next); return !Object.keys(next).length; };
  const submit = async () => { if (!form || !validate() || !window.confirm('Submit this application?')) return; setSubmitting(true); setMessage(''); try { const responses = visibleFields.map(field => toResponse(field, answers[field.id], files[field.id])); const result = await request<{ applicationId: number }>(`/api/candidate/job-offers/${offerId}/submit`, token, { method: 'POST', body: JSON.stringify({ responses }) }); setMessage('Application submitted successfully. Your application has been received.'); onSubmitted(result.applicationId); } catch (err) { setMessage(err instanceof Error ? err.message : 'Submission failed'); } finally { setSubmitting(false); } };
  if (message && !form) return <div className="candidate-alert">{message}</div>;
  if (!form) return <CandidateLoading />;
  return <section><PageHeader label="Application Form" title={form.title} body={form.description || 'Complete the form prepared by HR.'} />{message && <div className="candidate-success">{message}</div>}{!review ? <div className="dynamic-form">{visibleFields.map(field => <DynamicField key={field.id} field={field} value={answers[field.id]} file={files[field.id]} error={errors[field.id]} setValue={setAnswer} setFile={(file) => setFiles(prev => ({ ...prev, [field.id]: file }))} />)}<div className="candidate-form-actions"><button onClick={() => validate() && setReview(true)} className="primary">Review Application</button></div></div> : <div className="review-panel"><h2>Review Application</h2>{visibleFields.map(field => <div className="review-row" key={field.id}><strong>{field.label}</strong><span>{reviewValue(field, answers[field.id], files[field.id])}</span></div>)}<div className="candidate-form-actions"><button onClick={() => setReview(false)}>Edit</button><button className="primary" disabled={submitting} onClick={submit}>{submitting ? 'Submitting...' : 'Submit Application'}</button></div></div>}</section>;
}

function DynamicField({ field, value, file, error, setValue, setFile }: { field: Field; value?: string | boolean; file?: File; error?: string; setValue: (id: number, value: string | boolean) => void; setFile: (file?: File) => void }) {
  const id = `field-${field.id}`;
  return <label className="candidate-field" htmlFor={id}><span>{field.label}{field.required && <b>*</b>}</span>{field.fieldType === 'TEXTAREA' && <textarea id={id} placeholder={field.placeholder} value={String(value || '')} onChange={e => setValue(field.id, e.target.value)} />}{['TEXT', 'EMAIL', 'PHONE'].includes(field.fieldType) && <input id={id} type={field.fieldType === 'EMAIL' ? 'email' : field.fieldType === 'PHONE' ? 'tel' : 'text'} placeholder={field.placeholder} value={String(value || '')} onChange={e => setValue(field.id, e.target.value)} />}{field.fieldType === 'NUMBER' && <input id={id} type="number" placeholder={field.placeholder} value={String(value || '')} onChange={e => setValue(field.id, e.target.value)} />}{field.fieldType === 'DATE' && <input id={id} type="date" value={String(value || '')} onChange={e => setValue(field.id, e.target.value)} />}{field.fieldType === 'SELECT' && <select id={id} value={String(value || '')} onChange={e => setValue(field.id, e.target.value)}><option value="">Select...</option>{field.options.map(option => <option key={option.id} value={option.value}>{option.label}</option>)}</select>}{field.fieldType === 'RADIO' && <div className="option-list">{field.options.map(option => <label key={option.id}><input type="radio" name={id} checked={value === option.value} onChange={() => setValue(field.id, option.value)} />{option.label}</label>)}</div>}{field.fieldType === 'CHECKBOX' && (field.options.length ? <div className="option-list">{field.options.map(option => <label key={option.id}><input type="checkbox" checked={String(value || '').split(',').includes(option.value)} onChange={e => setValue(field.id, toggleCsv(String(value || ''), option.value, e.target.checked))} />{option.label}</label>)}</div> : <label className="inline-check"><input type="checkbox" checked={Boolean(value)} onChange={e => setValue(field.id, e.target.checked)} />Yes</label>)}{field.fieldType === 'MULTI_SELECT' && <select id={id} multiple value={String(value || '').split(',').filter(Boolean)} onChange={e => setValue(field.id, Array.from(e.target.selectedOptions).map(item => item.value).join(','))}>{field.options.map(option => <option key={option.id} value={option.value}>{option.label}</option>)}</select>}{field.fieldType === 'BOOLEAN' && <label className="inline-check"><input type="checkbox" checked={Boolean(value)} onChange={e => setValue(field.id, e.target.checked)} />Yes</label>}{isFile(field) && <div className="upload-box"><input id={id} type="file" onChange={e => setFile(e.target.files?.[0])} /><strong>{file ? file.name : 'Upload requested file'}</strong><small>{file ? `${Math.round(file.size / 1024)} KB selected` : 'Drag and drop or browse files'}</small>{file && <button type="button" onClick={() => setFile(undefined)}>Remove</button>}</div>}{error && <em className="field-error">{error}</em>}</label>;
}

function Applications({ applications, openApplication }: { applications: Application[]; openApplication: (id: number) => void }) {
  const [filter, setFilter] = useState('ALL');
  const filtered = applications.filter(app => filter === 'ALL' || (filter === 'IN_PROGRESS' ? !['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(app.status) : app.status === filter));
  return <section><PageHeader label="My Applications" title="Track your recruitment progress" body="Application status and current stage are displayed separately." /><div className="candidate-tabs">{['ALL', 'IN_PROGRESS', 'ACCEPTED', 'REJECTED'].map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{nice(item)}</button>)}</div><div className="candidate-card-list">{filtered.map(app => <ApplicationCard key={app.id} app={app} onOpen={() => openApplication(app.id)} />)}</div>{!filtered.length && <EmptyState title="No applications found" body="Your submitted applications will appear here." />}</section>;
}

function ApplicationDetail({ id, token, applications }: { id: number; token: string; applications: Application[] }) {
  const [responses, setResponses] = useState<FieldResponse[]>([]); const app = applications.find(item => item.id === id);
  useEffect(() => { request<{ responses: FieldResponse[] }>(`/api/candidate/applications/${id}`, token).then(data => setResponses(data.responses)).catch(() => setResponses([])); }, [id, token]);
  if (!app) return <EmptyState title="Application not found" body="Only your own applications can be viewed." />;
  return <section><PageHeader label="Application Tracking" title={app.jobTitle} body={`${nice(app.status)} - Current stage: ${nice(app.currentStage)}`} /><div className="candidate-grid"><Panel title="Recruitment Timeline"><Timeline current={app.currentStage} /></Panel><Panel title="Application Answers">{responses.length ? responses.map(item => <div className="review-row" key={item.fieldId}><strong>{item.fieldLabel}</strong><span>{text(item.textValue || item.numberValue || item.dateValue || item.booleanValue)}</span></div>) : <EmptyState title="No responses" body="Responses will appear after submission." />}</Panel></div></section>;
}

function Interviews({ interviews, focusedId, join }: { interviews: Interview[]; focusedId: number | null; join: (id: number) => void }) {
  const now = Date.now(), upcoming = interviews.filter(item => item.scheduledAt && Date.parse(item.scheduledAt) >= now), past = interviews.filter(item => !item.scheduledAt || Date.parse(item.scheduledAt) < now);
  return <section><PageHeader label="Interviews & Results" title="Your interviews and evaluator feedback" body="Your final score, recommendation and personal feedback appear here as soon as the evaluator submits them." /><Panel title="Upcoming Interviews"><InterviewList interviews={upcoming} focusedId={focusedId} join={join} /></Panel><Panel title="Past Interviews & Results"><InterviewList interviews={past} focusedId={focusedId} join={join} /></Panel></section>;
}

function CandidateProfile({ profile, token, onSaved }: { profile: Profile; token: string; onSaved: (profile: Profile) => void }) {
  const [form, setForm] = useState(profile), [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); try { onSaved(await request<Profile>('/api/candidate/profile', token, { method: 'PUT', body: JSON.stringify(form) })); } finally { setSaving(false); } };
  return <section><PageHeader label="My Profile" title={`${profile.firstName} ${profile.lastName}`} body={profile.email} /><div className="profile-form">{(['firstName', 'lastName', 'phone', 'birthDate', 'address', 'postalCode', 'nationality', 'gender', 'linkedinUrl', 'portfolioUrl'] as (keyof Profile)[]).map(key => <label key={key}><span>{nice(key)}</span><input type={key === 'birthDate' ? 'date' : 'text'} value={String(form[key] || '')} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))} /></label>)}<button className="primary" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save Profile'}</button></div></section>;
}

function OfferCard({ offer, onOpen }: { offer: Offer; onOpen: () => void }) { return <article className="candidate-card"><small>{text(offer.department)} - {text(offer.location)}</small><h3>{offer.title}</h3><p>{text(offer.description).slice(0, 150)}</p><div><span>{nice(offer.contractType)}</span><span>Deadline {date(offer.deadline)}</span></div><button onClick={onOpen}>View Details</button></article>; }
function ApplicationCard({ app, onOpen }: { app: Application; onOpen: () => void }) { return <article className="candidate-card"><small>{text(app.department)} - {text(app.location)}</small><h3>{app.jobTitle}</h3><div><span>{nice(app.status)}</span><span>{nice(app.currentStage)}</span></div><Progress current={app.currentStage} /><button onClick={onOpen}>View Application</button></article>; }
function BfpmeLocation({ headingId, dashboard = false }: { headingId: string; dashboard?: boolean }) {
  return <section className={`candidate-location ${dashboard ? 'candidate-dashboard-location' : ''}`} aria-labelledby={headingId}>
    <h4 id={headingId}>{dashboard ? 'Head office' : 'Location'}</h4>
    <address>
      <strong>{BFPME_LOCATION.name}</strong>
      <span>34, Rue Hédi Karray</span>
      <span>Centre Urbain Nord</span>
      <span>El Menzah IV - 1004 Tunis</span>
    </address>
    <LocationMap
      latitude={BFPME_LOCATION.latitude}
      longitude={BFPME_LOCATION.longitude}
      locationName={BFPME_LOCATION.name}
      address={BFPME_LOCATION.address}
    />
    <a className="candidate-directions" href={BFPME_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" aria-label="Open directions to BFPME in a new tab">
      Open directions <span aria-hidden="true">↗</span>
    </a>
  </section>;
}
function InterviewList({ interviews, focusedId, join }: { interviews: Interview[]; focusedId: number | null; join: (id: number) => void }) {
  return <div className="candidate-card-list">{interviews.map(item => {
    const isOnsite = item.mode === 'ONSITE';

    return <article id={`candidate-interview-${item.id}`} className={`candidate-card candidate-interview-card ${focusedId === item.id ? 'notification-focus' : ''}`} key={item.id}>
      <small>{item.jobTitle}</small>
      <h3>{nice(item.interviewType)}</h3>
      <p>{datetime(item.scheduledAt)} {item.durationMinutes ? `- ${item.durationMinutes} min` : ''}</p>
      <div className="candidate-interview-meta"><span>{nice(item.mode)}</span><span>{nice(item.status)}</span></div>
      {isOnsite && <BfpmeLocation headingId={`candidate-location-${item.id}`} />}
      {!isOnsite && <div className="candidate-interview-destination"><span>{text(item.meetingLink || item.location || item.mode)}</span></div>}
      {item.evaluation ? <section className="candidate-evaluation-result"><div className="candidate-result-head"><span><small>INTERVIEW RESULT</small><strong>{item.evaluation.overallScore}<em>/20</em></strong></span><b className={`candidate-recommendation ${item.evaluation.recommendation.toLowerCase()}`}>{nice(item.evaluation.recommendation)}</b></div><blockquote>{item.evaluation.candidateComment}</blockquote><small>Feedback submitted {datetime(item.evaluation.createdAt)}</small></section> : <div className="candidate-result-pending">The evaluator has not submitted a result yet.</div>}
      {item.mode === 'ONLINE' && item.status === 'SCHEDULED' && <button onClick={() => join(item.id)}>Join Interview</button>}
    </article>;
  })}{!interviews.length && <EmptyState title="No interviews" body="Scheduled interviews will appear here." />}</div>;
}
function Timeline({ current }: { current: Stage }) { const index = stages.indexOf(current); return <ol className="timeline">{stages.map((stage, itemIndex) => <li key={stage} className={itemIndex < index ? 'done' : itemIndex === index ? 'current' : ''}><span />{stageLabels[stage]}</li>)}</ol>; }
function Progress({ current }: { current: Stage }) { return <div className="progress"><i style={{ width: `${((stages.indexOf(current) + 1) / stages.length) * 100}%` }} /></div>; }
function Metric({ label, value }: { label: string; value: number }) { return <article><span>{label}</span><b>{value}</b></article>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="candidate-panel"><h2>{title}</h2>{children}</div>; }
function PageHeader({ label, title, body }: { label: string; title: string; body: string }) { return <header className="candidate-header"><small>{label}</small><h1>{title}</h1><p>{body}</p></header>; }
function Section({ title, content }: { title: string; content?: string }) { return <section className="offer-section"><h2>{title}</h2><p>{text(content)}</p></section>; }
function EmptyState({ title, body }: { title: string; body: string }) { return <div className="candidate-empty"><strong>{title}</strong><p>{body}</p></div>; }
function CandidateLoading() { return <div className="candidate-empty"><span className="spinner" /> <p>Loading candidate portal...</p></div>; }
function isFile(field: Field) { return field.fieldType === 'FILE'; }
function toggleCsv(current: string, value: string, checked: boolean) { const values = current.split(',').filter(Boolean); return checked ? [...values, value].join(',') : values.filter(item => item !== value).join(','); }
function isVisible(field: Field, conditions: Condition[], answers: Record<number, string | boolean>) { let visible = field.defaultVisible !== false; conditions.filter(item => item.targetFieldId === field.id).forEach(condition => { const matches = conditionMatches(answers[condition.sourceFieldId], condition); if (condition.action === 'SHOW') visible = matches; if (condition.action === 'HIDE' && matches) visible = false; }); return visible; }
function conditionMatches(value: string | boolean | undefined, condition: Condition) { const actual = String(value ?? ''), expected = condition.expectedValue || ''; if (condition.operator === 'EQUALS') return actual === expected; if (condition.operator === 'NOT_EQUALS') return actual !== expected; if (condition.operator === 'CONTAINS') return actual.includes(expected); if (condition.operator === 'IS_EMPTY') return !actual; if (condition.operator === 'IS_NOT_EMPTY') return !!actual; const left = Number(actual), right = Number(expected); if (condition.operator === 'GREATER_THAN') return left > right; if (condition.operator === 'GREATER_THAN_OR_EQUAL') return left >= right; if (condition.operator === 'LESS_THAN') return left < right; if (condition.operator === 'LESS_THAN_OR_EQUAL') return left <= right; return false; }
function toResponse(field: Field, value?: string | boolean, file?: File) { if (isFile(field)) return { fieldId: field.id, textValue: file ? `${file.name} (${file.size} bytes)` : '' }; if (field.fieldType === 'NUMBER') return { fieldId: field.id, numberValue: value === '' || value === undefined ? null : Number(value) }; if (field.fieldType === 'DATE') return { fieldId: field.id, dateValue: value || null }; if (field.fieldType === 'BOOLEAN') return { fieldId: field.id, booleanValue: Boolean(value) }; return { fieldId: field.id, textValue: String(value || '') }; }
function reviewValue(field: Field, value?: string | boolean, file?: File) { return isFile(field) ? (file ? file.name : 'No file selected') : text(value); }

import { useEffect, useState } from 'react';
import { API, authHeaders } from './api';
import { InterviewRoom, type InterviewSummary } from './InterviewRoom';
import type { Session } from './types';

export function InterviewWorkspace({ session, logout }: { session: Session; logout: () => void }) {
  const [interviews, setInterviews] = useState<InterviewSummary[]>([]), [selected, setSelected] = useState<InterviewSummary | null>(null), [error, setError] = useState('');
  useEffect(() => { fetch(`${API}/api/interview-rooms/my`, { headers: authHeaders(session.accessToken) }).then(async response => { if (!response.ok) throw new Error('Unable to load assigned interviews'); return response.json(); }).then(setInterviews).catch(caught => setError(caught.message)); }, [session.accessToken]);
  if (selected) return <InterviewRoom interview={selected} token={session.accessToken} onLeave={() => setSelected(null)} onAuthExpired={logout} />;
  return <div className="workspace-shell"><header><div><small>EVALUATOR PORTAL</small><h1>Assigned interviews</h1><p>{session.firstName} {session.lastName}</p></div><button onClick={logout}>Logout</button></header>{error && <div className="candidate-alert">{error}</div>}<div className="workspace-list">{interviews.map(interview => <article key={interview.id}><div><small>{interview.interviewType.replaceAll('_', ' ')}</small><h2>{interview.jobTitle}</h2><p>{interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString() : 'Not scheduled'} - {interview.mode || 'ONSITE'}</p></div><button disabled={!interview.joinAvailable} onClick={() => setSelected(interview)}>Join interview</button></article>)}{!interviews.length && <p>No interviews are assigned to you.</p>}</div></div>;
}

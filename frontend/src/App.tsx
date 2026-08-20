import { useState } from 'react';
import { Login } from './auth/Login';
import { AdminDashboard } from './admin/AdminDashboard';
import { HrDashboard } from './hr/HrDashboard';
import { EvaluatorDashboard } from './evaluator/EvaluatorDashboard';
import { CandidateDashboard } from './candidate/CandidateDashboard';
import type { Session } from './shared/types';
import { RealtimeProvider } from './shared/realtime';

const roles = new Set<string>(['ADMIN', 'HR', 'EVALUATOR', 'CANDIDATE']);
const clearSession = () => { localStorage.removeItem('session'); sessionStorage.removeItem('session'); };

function normalizeSession(value: unknown): Session | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<Session> & { token?: string };
  const accessToken = typeof candidate.accessToken === 'string' ? candidate.accessToken.trim() : candidate.token?.trim();
  if (!accessToken || !candidate.userId || !candidate.email || !candidate.role || !roles.has(candidate.role)) return null;
  return {
    accessToken,
    userId: candidate.userId,
    email: candidate.email,
    role: candidate.role,
    firstName: candidate.firstName || '',
    lastName: candidate.lastName || '',
  };
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem('session') || sessionStorage.getItem('session');
    if (!raw) return null;
    const session = normalizeSession(JSON.parse(raw));
    if (!session) clearSession();
    return session;
  } catch {
    clearSession();
    return null;
  }
}
export default function App() {
  const [session, setSession] = useState<Session | null>(readSession);
  const logout = () => { clearSession(); setSession(null); };
  const login = (value: Session, remember: boolean) => {
    const next = normalizeSession(value);
    if (!next) return logout();
    clearSession();
    (remember ? localStorage : sessionStorage).setItem('session', JSON.stringify(next));
    setSession(next);
  };
  if (!session) return <Login onLogin={login} />;
  let dashboard;
  switch (session.role) {
    case 'ADMIN': dashboard = <AdminDashboard session={session} logout={logout} />; break;
    case 'HR': dashboard = <HrDashboard session={session} logout={logout} />; break;
    case 'EVALUATOR': dashboard = <EvaluatorDashboard session={session} logout={logout} />; break;
    case 'CANDIDATE': dashboard = <CandidateDashboard session={session} logout={logout} />; break;
  }
  return <RealtimeProvider session={session}>{dashboard}</RealtimeProvider>;
}

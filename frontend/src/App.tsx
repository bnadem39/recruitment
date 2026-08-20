import { useState } from 'react';
import { Login } from './auth/Login';
import { AdminDashboard } from './admin/AdminDashboard';
import { HrDashboard } from './hr/HrDashboard';
import { EvaluatorDashboard } from './evaluator/EvaluatorDashboard';
import { CandidateDashboard } from './candidate/CandidateDashboard';
import type { Session } from './shared/types';

function readSession(): Session | null {
  try { return JSON.parse(localStorage.getItem('session') || sessionStorage.getItem('session') || 'null'); }
  catch { return null; }
}

type OAuthResult = { session: Session | null; error: string; remember: boolean };

function consumeOAuthRedirect(): OAuthResult {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  if (params.get('oauth') !== 'google') return { session: null, error: '', remember: true };

  const error = params.get('error') || '';
  const remember = sessionStorage.getItem('oauthRemember') !== 'false';
  sessionStorage.removeItem('oauthRemember');
  const session = error ? null : normalizeSession({
    accessToken: params.get('accessToken'),
    userId: Number(params.get('userId')),
    email: params.get('email'),
    role: params.get('role'),
    firstName: params.get('firstName'),
    lastName: params.get('lastName'),
  });
  window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}`);

  if (!error && !session) return { session: null, error: 'Google authentication returned an invalid session.', remember };
  return { session, error, remember };
}

export default function App() {
  const [oauthResult] = useState<OAuthResult>(consumeOAuthRedirect);
  const [session, setSession] = useState<Session | null>(() => {
    if (!oauthResult.session) return readSession();
    clearSession();
    (oauthResult.remember ? localStorage : sessionStorage).setItem('session', JSON.stringify(oauthResult.session));
    return oauthResult.session;
  });
  const logout = () => { clearSession(); setSession(null); };
  const login = (value: Session, remember: boolean) => {
    const next = normalizeSession(value);
    if (!next) return logout();
    clearSession();
    (remember ? localStorage : sessionStorage).setItem('session', JSON.stringify(next));
    setSession(next);
  };
  if (!session) return <Login onLogin={login} initialError={oauthResult.error} />;
  let dashboard;
  switch (session.role) {
    case 'ADMIN': return <AdminDashboard session={session} logout={logout} />;
    case 'HR': return <HrDashboard session={session} logout={logout} />;
    case 'EVALUATOR': return <EvaluatorDashboard session={session} logout={logout} />;
    case 'CANDIDATE': return <CandidateDashboard session={session} logout={logout} />;
  }
}

import { useState } from 'react';
import { Login } from './auth/Login';
import { EmailVerification } from './auth/EmailVerification';
import { AdminDashboard } from './admin/AdminDashboard';
import { HrDashboard } from './hr/HrDashboard';
import { EvaluatorDashboard } from './evaluator/EvaluatorDashboard';
import { CandidateDashboard } from './candidate/CandidateDashboard';
import type { Role, Session } from './shared/types';
import { RealtimeProvider } from './shared/realtime';

const roles = new Set<Role>(['ADMIN', 'HR', 'EVALUATOR', 'CANDIDATE']);

function clearSession() {
  localStorage.removeItem('session');
  sessionStorage.removeItem('session');
}

type SessionInput = {
  accessToken?: string | null; token?: string | null; userId?: number | null; email?: string | null;
  role?: string | null; firstName?: string | null; lastName?: string | null;
};

function normalizeSession(value: SessionInput | null | undefined): Session | null {
  const accessToken = typeof value?.accessToken === 'string' ? value.accessToken.trim() : typeof value?.token === 'string' ? value.token.trim() : '';
  if (!value || !accessToken) return null;
  if (!Number.isFinite(Number(value.userId))) return null;
  if (!value.email || !value.role || !roles.has(value.role as Role)) return null;
  return {
    accessToken, userId: Number(value.userId), email: value.email,
    role: value.role as Role, firstName: value.firstName || '', lastName: value.lastName || '',
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
  const [verification, setVerification] = useState<{ email: string; message: string } | null>(null);
  const [authNotice, setAuthNotice] = useState(oauthResult.error);
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
  if (!session && verification) return <EmailVerification email={verification.email} message={verification.message} onBack={() => setVerification(null)} onVerified={message => { setVerification(null); setAuthNotice(message); }} />;
  if (!session) return <Login onLogin={login} onSignupVerification={(email, message) => { setAuthNotice(''); setVerification({ email, message }); }} initialError={authNotice} />;
  let dashboard;
  switch (session.role) {
    case 'ADMIN': dashboard = <AdminDashboard session={session} logout={logout} />; break;
    case 'HR': dashboard = <HrDashboard session={session} logout={logout} />; break;
    case 'EVALUATOR': dashboard = <EvaluatorDashboard session={session} logout={logout} />; break;
    case 'CANDIDATE': dashboard = <CandidateDashboard session={session} logout={logout} />; break;
  }
  return <RealtimeProvider session={session}>{dashboard}</RealtimeProvider>;
}

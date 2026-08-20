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
export default function App() {
  const [session, setSession] = useState<Session | null>(readSession);
  const login = (value: Session, remember: boolean) => { (remember ? localStorage : sessionStorage).setItem('session', JSON.stringify(value)); setSession(value); };
  const logout = () => { localStorage.removeItem('session'); sessionStorage.removeItem('session'); setSession(null); };
  if (!session) return <Login onLogin={login} />;
  switch (session.role) {
    case 'ADMIN': return <AdminDashboard session={session} logout={logout} />;
    case 'HR': return <HrDashboard session={session} logout={logout} />;
    case 'EVALUATOR': return <EvaluatorDashboard session={session} logout={logout} />;
    case 'CANDIDATE': return <CandidateDashboard session={session} logout={logout} />;
  }
}

import { FormEvent, useState } from 'react';
import { API } from '../shared/api';
import type { Session } from '../shared/types';

type LoginProps = {
  onLogin: (session: Session, remember: boolean) => void;
  onSignupVerification: (email: string, message: string) => void;
  initialError?: string;
};

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.344 4.337-17.694 10.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

function errorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;
  const body = data as { message?: string; fieldErrors?: Record<string, string> };
  if (body.message) return body.message;
  if (body.fieldErrors) return Object.entries(body.fieldErrors).map(([field, message]) => `${field}: ${message}`).join(' ');
  return fallback;
}

export function Login({ onLogin, onSignupVerification, initialError = '' }: LoginProps) {
  const [signup, setSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [dark, setDark] = useState(true);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (signup && password !== passwordConfirmation) {
        throw new Error('Password confirmation does not match.');
      }
      const body = signup ? { firstName, lastName, email, password, passwordConfirmation, phone } : { email, password };
      const response = await fetch(`${API}/api/auth/${signup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(errorMessage(data, signup ? 'Unable to create your account.' : 'Invalid credentials.'));
      }
      const data = await response.json();
      if (signup) {
        setPassword('');
        setPasswordConfirmation('');
        onSignupVerification(data.email || email, data.message || 'Account created. Please check your email to confirm your address before signing in.');
        return;
      }
      onLogin(data, remember);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : signup ? 'Unable to create your account.' : 'Invalid credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={dark ? 'login dark' : 'login'}>
      <section className="login-art">
        <div className="logo">BFPME <span>Recruit</span></div>
        <div>
          <span className="pill">SECURE TALENT OPERATIONS</span>
          <h1>{signup ? 'Your next opportunity starts here.' : 'Build the team that builds the future.'}</h1>
          <p>{signup ? 'Create your candidate account, discover opportunities, and follow your applications.' : 'A focused workspace for hiring teams, evaluators, and recruitment leaders.'}</p>
        </div>
        <small>Protected with role-based access and secure sessions.</small>
      </section>
      <section className="login-panel">
        <button className="theme" type="button" onClick={() => setDark(!dark)} aria-label="Toggle theme">
          {dark ? '\u2600' : '\u263e'}
        </button>
        <form onSubmit={submit}>
          <div className="mini-logo">BF</div>
          <h2>{signup ? 'Create your account' : 'Welcome back'}</h2>
          <p>{signup ? 'Register as a candidate.' : 'Sign in to your recruitment workspace.'}</p>
          {error && <div className="alert">{error}</div>}
          {signup && <div className="two">
            <label>First name<input value={firstName} onChange={e => setFirstName(e.target.value)} required /></label>
            <label>Last name<input value={lastName} onChange={e => setLastName(e.target.value)} required /></label>
          </div>}
          <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>
          {signup && <label>Phone <small>(optional)</small><input value={phone} onChange={e => setPhone(e.target.value)} /></label>}
          <label>Password<div className="password">
            <input type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} minLength={signup ? 12 : 1} required />
            <button type="button" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>
          </div></label>
          {signup && <label>Confirm password<input type={show ? 'text' : 'password'} value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} minLength={12} required /></label>}
          <div className="form-row">
            <label className="check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Remember me</label>
          </div>
          <button className="primary" disabled={busy}>{busy ? 'Please wait...' : signup ? 'Create candidate account' : 'Sign in'}</button>
          <div className="auth-divider"><span>or</span></div>
          <a className="google-btn" href={`${API}/oauth2/authorization/google`} onClick={() => sessionStorage.setItem('oauthRemember', String(remember))}>
            <GoogleLogo />
            {signup ? 'Sign up with Google' : 'Sign in with Google'}
          </a>
          <button className="auth-toggle" type="button" onClick={() => { setSignup(!signup); setError(''); }}>
            {signup ? 'Already registered? Sign in' : 'Candidate? Create an account'}
          </button>
          <small className="security">Internal accounts are provisioned by an administrator.</small>
        </form>
      </section>
    </main>
  );
}

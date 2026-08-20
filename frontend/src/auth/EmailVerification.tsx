import { FormEvent, useState } from 'react';
import { API } from '../shared/api';

type Props = {
  email: string;
  message: string;
  onVerified: (message: string) => void;
  onBack: () => void;
};

function errorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;
  const body = data as { message?: string; fieldErrors?: Record<string, string> };
  if (body.message) return body.message;
  if (body.fieldErrors) return Object.entries(body.fieldErrors).map(([field, value]) => `${field}: ${value}`).join(' ');
  return fallback;
}

export function EmailVerification({ email, message, onVerified, onBack }: Props) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${API}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(errorMessage(data, 'Email verification failed.'));
      onVerified(data.message || 'Email confirmed. You can now sign in.');
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Email verification failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login dark">
      <section className="login-art">
        <div className="logo">BFPME <span>Recruit</span></div>
        <div>
          <span className="pill">EMAIL VERIFICATION</span>
          <h1>Confirm your candidate account.</h1>
          <p>Enter the verification code sent to your signup email address.</p>
        </div>
        <small>Protected with role-based access and secure sessions.</small>
      </section>
      <section className="login-panel">
        <form onSubmit={submit}>
          <div className="mini-logo">BF</div>
          <h2>Verify your email</h2>
          <p>{message}</p>
          <label>Email address<input type="email" value={email} readOnly /></label>
          {error && <div className="alert">{error}</div>}
          <label>Verification code<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required /></label>
          <button className="primary" disabled={busy || code.length !== 6}>{busy ? 'Please wait...' : 'Verify email'}</button>
          <button className="auth-toggle" type="button" onClick={onBack}>Back to sign in</button>
        </form>
      </section>
    </main>
  );
}

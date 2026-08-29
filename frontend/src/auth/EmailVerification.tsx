import { type FormEvent, useState } from 'react';
import { API } from '../shared/api';

type Props = {
  email: string;
  message: string;
  onVerified: (message: string) => void;
  onBack: () => void;
};

function errorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== 'object') {
    return fallback;
  }

  const body = data as {
    message?: string;
    error?: string;
    fieldErrors?: Record<string, string>;
  };

  if (body.message) {
    return body.message;
  }

  if (body.error) {
    return body.error;
  }

  if (body.fieldErrors) {
    return Object.entries(body.fieldErrors)
      .map(([field, value]) => `${field}: ${value}`)
      .join(' ');
  }

  return fallback;
}

export function EmailVerification({
  email,
  message,
  onVerified,
  onBack,
}: Props) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanCode = code.replace(/\D/g, '');

    if (cleanCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const response = await fetch(`${API}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: cleanCode,
        }),
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          errorMessage(
            data,
            'The verification code is invalid or has expired.'
          )
        );
      }

      const responseBody = data as {
        message?: string;
      };

      onVerified(
        responseBody.message ||
          'Email confirmed. You can now sign in.'
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error && caughtError.message
          ? caughtError.message
          : 'Email verification failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login dark">
      <section className="login-art">
        <div className="logo">
          BFPME <span>Recruit</span>
        </div>

        <div>
          <span className="pill">EMAIL VERIFICATION</span>

          <h1>Confirm your candidate account.</h1>

          <p>
            Enter the 6-digit verification code sent to your signup email
            address.
          </p>
        </div>

        <small>
          Protected with role-based access and secure sessions.
        </small>
      </section>

      <section className="login-panel">
        <form onSubmit={submit}>
          <div className="mini-logo">BF</div>

          <h2>Verify your email</h2>

          <p>{message}</p>

          <label>
            Email address

            <input type="email" value={email} readOnly />
          </label>

          {error && <div className="alert">{error}</div>}

          <label>
            Verification code

            <input
              className="verification-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={event =>
                setCode(
                  event.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6)
                )
              }
              placeholder="000000"
              required
              autoFocus
            />
          </label>

          <button
            className="primary"
            disabled={busy || code.length !== 6}
          >
            {busy ? 'Please wait...' : 'Verify email'}
          </button>

          <button
            className="auth-toggle"
            type="button"
            disabled={busy}
            onClick={onBack}
          >
            Back to sign in
          </button>

          <small className="security">
            Check Inbox, Spam and Promotions. The code expires after 5 minutes.
          </small>
        </form>
      </section>
    </main>
  );
}
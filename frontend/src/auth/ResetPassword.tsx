import { type FormEvent, useState } from 'react';
import { API } from '../shared/api';

type ResetPasswordProps = {
  token: string;
  onBackToLogin: () => void;
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
      .map(([field, message]) => `${field}: ${message}`)
      .join(' ');
  }

  return fallback;
}

export function ResetPassword({
  token,
  onBackToLogin,
}: ResetPasswordProps) {
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');

    if (newPassword.length < 12) {
      setError('Your new password must contain at least 12 characters.');
      return;
    }

    if (newPassword !== passwordConfirmation) {
      setError('Password confirmation does not match.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
          passwordConfirmation,
        }),
      });

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          errorMessage(
            data,
            'This password reset link is invalid, expired, or already used.'
          )
        );
      }

      setSuccess(true);

      window.setTimeout(() => {
        onBackToLogin();
      }, 2500);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error && caughtError.message
          ? caughtError.message
          : 'Could not reset your password.'
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
          <span className="pill">SECURE ACCOUNT RECOVERY</span>

          <h1>Choose a new password.</h1>

          <p>
            Create a secure new password to restore access to your BFPME
            Recruit workspace.
          </p>
        </div>

        <small>
          Password reset links are temporary and can only be used once.
        </small>
      </section>

      <section className="login-panel">
        <form onSubmit={submit}>
          <div className="mini-logo">BF</div>

          <h2>Reset your password</h2>

          <p>Create a new secure password for your account.</p>

          {error && <div className="alert">{error}</div>}

          {success ? (
            <div className="forgot-success">
              <strong>Password updated successfully</strong>

              <p>
                Your password has been changed. You will now be redirected to
                the sign-in page.
              </p>
            </div>
          ) : (
            <>
              <label>
                New password

                <div className="password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={event => setNewPassword(event.target.value)}
                    minLength={12}
                    required
                    autoComplete="new-password"
                    placeholder="At least 12 characters"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(currentValue => !currentValue)
                    }
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </label>

              <label>
                Confirm new password

                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={event =>
                    setPasswordConfirmation(event.target.value)
                  }
                  minLength={12}
                  required
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                />
              </label>

              <button className="primary" disabled={busy}>
                {busy ? 'Updating password...' : 'Reset password'}
              </button>
            </>
          )}

          <button
            className="auth-toggle"
            type="button"
            disabled={busy}
            onClick={onBackToLogin}
          >
            ← Back to sign in
          </button>
        </form>
      </section>
    </main>
  );
}
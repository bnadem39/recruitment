import { type FormEvent, useState } from 'react';
import { API } from '../shared/api';
import type { Session } from '../shared/types';

type LoginProps = {
  onLogin: (session: Session, remember: boolean) => void;
  onSignupVerification: (email: string, message: string) => void;
  initialError?: string;
};

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.682 0-14.344 4.337-17.694 10.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

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

function normalizeLoginResponse(data: unknown): Session | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const raw = data as {
    accessToken?: unknown;
    userId?: unknown;
    id?: unknown;
    email?: unknown;
    role?: unknown;
    firstName?: unknown;
    lastName?: unknown;
  };

  const userId = Number(raw.userId ?? raw.id);

  const validRoles: Session['role'][] = [
    'ADMIN',
    'HR',
    'EVALUATOR',
    'CANDIDATE',
  ];

  if (
    typeof raw.accessToken !== 'string' ||
    !raw.accessToken ||
    !Number.isFinite(userId) ||
    typeof raw.email !== 'string' ||
    !raw.email ||
    typeof raw.role !== 'string' ||
    !validRoles.includes(raw.role as Session['role']) ||
    typeof raw.firstName !== 'string' ||
    !raw.firstName ||
    typeof raw.lastName !== 'string' ||
    !raw.lastName
  ) {
    return null;
  }

  return {
    accessToken: raw.accessToken,
    userId,
    email: raw.email,
    role: raw.role as Session['role'],
    firstName: raw.firstName,
    lastName: raw.lastName,
  };
}

export function Login({
  onLogin,
  onSignupVerification,
  initialError = '',
}: LoginProps) {
  const [signup, setSignup] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [dark, setDark] = useState(true);

  const resetFieldsForModeChange = () => {
    setError('');
    setPassword('');
    setPasswordConfirmation('');
    setShowPassword(false);

    if (!signup) {
      setFirstName('');
      setLastName('');
      setPhone('');
    }
  };

  const toggleSignup = () => {
    resetFieldsForModeChange();
    setSignup(current => !current);
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError('');

    try {
      if (signup && password !== passwordConfirmation) {
        throw new Error('Password confirmation does not match.');
      }

      const requestBody = signup
        ? {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            password,
            passwordConfirmation,
            phone: phone.trim() || undefined,
          }
        : {
            email: email.trim(),
            password,
          };

      const response = await fetch(
        `${API}/api/auth/${signup ? 'signup' : 'login'}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          errorMessage(
            data,
            signup
              ? 'Unable to create your account.'
              : 'Invalid email or password.'
          )
        );
      }

      if (signup) {
        const signupData = data as {
          email?: string;
          message?: string;
        };

        setPassword('');
        setPasswordConfirmation('');

        onSignupVerification(
          signupData.email || email.trim(),
          signupData.message ||
            'Account created. Please check your email to confirm your address before signing in.'
        );

        return;
      }

      const session = normalizeLoginResponse(data);

      if (!session) {
        throw new Error(
          'The server returned an invalid login response. Please contact an administrator.'
        );
      }

      onLogin(session, remember);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error && caughtError.message
          ? caughtError.message
          : signup
            ? 'Unable to create your account.'
            : 'Invalid email or password.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={dark ? 'login dark' : 'login'}>
      <section className="login-art">
        <div className="logo">
          BFPME <span>Recruit</span>
        </div>

        <div>
          <span className="pill">SECURE TALENT OPERATIONS</span>

          <h1>
            {signup
              ? 'Your next opportunity starts here.'
              : 'Build the team that builds the future.'}
          </h1>

          <p>
            {signup
              ? 'Create your candidate account, discover opportunities, and follow your applications.'
              : 'A focused workspace for hiring teams, evaluators, and recruitment leaders.'}
          </p>
        </div>

        <small>
          Protected with role-based access and secure sessions.
        </small>
      </section>

      <section className="login-panel">
        <button
          className="theme"
          type="button"
          onClick={() => setDark(current => !current)}
          aria-label="Toggle theme"
        >
          {dark ? '☀' : '☾'}
        </button>

        <form onSubmit={submit}>
          <div className="mini-logo">BF</div>

          <h2>{signup ? 'Create your account' : 'Welcome back'}</h2>

          <p>
            {signup
              ? 'Register as a candidate.'
              : 'Sign in to your recruitment workspace.'}
          </p>

          {error && <div className="alert">{error}</div>}

          {signup && (
            <div className="two">
              <label>
                First name
                <input
                  value={firstName}
                  onChange={event => setFirstName(event.target.value)}
                  required
                  autoComplete="given-name"
                />
              </label>

              <label>
                Last name
                <input
                  value={lastName}
                  onChange={event => setLastName(event.target.value)}
                  required
                  autoComplete="family-name"
                />
              </label>
            </div>
          )}

          {signup ? (
            <div className="two">
              <label>
                Email address
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </label>

              <label>
                Phone{' '}
                <small
                  style={{
                    marginLeft: 4,
                    color: '#8591a3',
                    fontWeight: 400,
                  }}
                >
                  (optional)
                </small>

                <input
                  type="tel"
                  value={phone}
                  onChange={event => setPhone(event.target.value)}
                  autoComplete="tel"
                />
              </label>
            </div>
          ) : (
            <label>
              Email address
              <input
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </label>
          )}

          <label>
            Password

            <div className="password">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                minLength={signup ? 12 : 1}
                required
                autoComplete={signup ? 'new-password' : 'current-password'}
              />

              <button
                type="button"
                onClick={() => setShowPassword(current => !current)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {signup && (
            <label>
              Confirm password

              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirmation}
                onChange={event =>
                  setPasswordConfirmation(event.target.value)
                }
                minLength={12}
                required
                autoComplete="new-password"
              />
            </label>
          )}

          {!signup && (
            <label className="remember-toggle">
              <input
                type="checkbox"
                checked={remember}
                onChange={event => setRemember(event.target.checked)}
              />

              <div className="toggle-switch"></div>

              <span>Remember me</span>
            </label>
          )}

          <button className="primary" disabled={busy}>
            {busy
              ? 'Please wait...'
              : signup
                ? 'Create candidate account'
                : 'Sign in'}
          </button>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <a
            className="google-btn"
            href={`${API}/oauth2/authorization/google`}
            onClick={() =>
              sessionStorage.setItem(
                'oauthRemember',
                String(remember)
              )
            }
          >
            <GoogleLogo />
            {signup ? 'Sign up with Google' : 'Sign in with Google'}
          </a>

          <button
            className="auth-toggle"
            type="button"
            onClick={toggleSignup}
          >
            {signup
              ? 'Already registered? Sign in'
              : 'Candidate? Create an account'}
          </button>

          <small className="security">
            Internal accounts are provisioned by an administrator.
          </small>
        </form>
      </section>
    </main>
  );
}
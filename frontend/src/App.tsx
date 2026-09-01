import { useState } from 'react';
import { Login } from './auth/Login';
import { EmailVerification } from './auth/EmailVerification';
import { ResetPassword } from './auth/ResetPassword';
import { AdminDashboard } from './admin/AdminDashboard';
import { HrDashboard } from './hr/HrDashboard';
import { EvaluatorDashboard } from './evaluator/EvaluatorDashboard';
import { CandidateDashboard } from './candidate/CandidateDashboard';
import { RealtimeProvider } from './shared/realtime';
import type { Session } from './shared/types';

type RawSession = {
  accessToken?: string | null;
  userId?: number | null;
  email?: string | null;
  role?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

type OAuthResult = {
  session: Session | null;
  error: string;
  remember: boolean;
};

type SignupVerification = {
  email: string;
  message: string;
};

function clearSession(): void {
  localStorage.removeItem('session');
  sessionStorage.removeItem('session');
}

function normalizeSession(raw: RawSession): Session | null {
  if (
    !raw.accessToken ||
    !raw.email ||
    !raw.role ||
    !raw.firstName ||
    !raw.lastName
  ) {
    return null;
  }

  if (
    raw.userId === undefined ||
    raw.userId === null ||
    !Number.isFinite(raw.userId)
  ) {
    return null;
  }

  const validRoles: Session['role'][] = [
    'ADMIN',
    'HR',
    'EVALUATOR',
    'CANDIDATE',
  ];

  if (!validRoles.includes(raw.role as Session['role'])) {
    return null;
  }

  return {
    accessToken: raw.accessToken,
    userId: raw.userId,
    email: raw.email,
    role: raw.role as Session['role'],
    firstName: raw.firstName,
    lastName: raw.lastName,
  };
}

function readSession(): Session | null {
  try {
    const savedSession =
      localStorage.getItem('session') ??
      sessionStorage.getItem('session');

    if (!savedSession) {
      return null;
    }

    return normalizeSession(JSON.parse(savedSession) as RawSession);
  } catch {
    clearSession();
    return null;
  }
}

function consumeOAuthRedirect(): OAuthResult {
  const params = new URLSearchParams(
    window.location.hash.replace(/^#/, '')
  );

  if (params.get('oauth') !== 'google') {
    return {
      session: null,
      error: '',
      remember: true,
    };
  }

  const error = params.get('error') || '';

  const remember =
    sessionStorage.getItem('oauthRemember') !== 'false';

  sessionStorage.removeItem('oauthRemember');

  const googleSession = error
    ? null
    : normalizeSession({
        accessToken: params.get('accessToken'),
        userId: Number(params.get('userId')),
        email: params.get('email'),
        role: params.get('role'),
        firstName: params.get('firstName'),
        lastName: params.get('lastName'),
      });

  window.history.replaceState(
    {},
    '',
    `${window.location.pathname}${window.location.search}`
  );

  if (!error && !googleSession) {
    return {
      session: null,
      error: 'Google authentication returned an invalid session.',
      remember,
    };
  }

  return {
    session: googleSession,
    error,
    remember,
  };
}

function consumePendingOfferLink(): number | undefined {
  const params = new URLSearchParams(window.location.search);
  const offerIdFromUrl = params.get('applyOffer');

  if (offerIdFromUrl) {
    sessionStorage.setItem('pendingOfferId', offerIdFromUrl);

    const url = new URL(window.location.href);
    url.searchParams.delete('applyOffer');

    window.history.replaceState(
      {},
      '',
      `${url.pathname}${url.search}`
    );
  }

  const storedOfferId = sessionStorage.getItem('pendingOfferId');

  if (!storedOfferId) {
    return undefined;
  }

  const offerId = Number(storedOfferId);

  return Number.isFinite(offerId) ? offerId : undefined;
}

export default function App() {
  const [oauthResult] = useState<OAuthResult>(consumeOAuthRedirect);

  const [pendingOfferId] = useState<number | undefined>(
    consumePendingOfferLink
  );

  const [signupVerification, setSignupVerification] =
    useState<SignupVerification | null>(null);

  const [session, setSession] = useState<Session | null>(() => {
    if (!oauthResult.session) {
      return readSession();
    }

    clearSession();

    const storage = oauthResult.remember
      ? localStorage
      : sessionStorage;

    storage.setItem('session', JSON.stringify(oauthResult.session));

    return oauthResult.session;
  });

  const logout = (): void => {
    clearSession();
    setSignupVerification(null);
    setSession(null);
  };

  const login = (value: Session, remember: boolean): void => {
    const nextSession = normalizeSession({
      accessToken: value.accessToken,
      userId: value.userId,
      email: value.email,
      role: value.role,
      firstName: value.firstName,
      lastName: value.lastName,
    });

    if (!nextSession) {
      logout();
      return;
    }

    clearSession();

    const storage = remember ? localStorage : sessionStorage;

    storage.setItem('session', JSON.stringify(nextSession));

    setSignupVerification(null);
    setSession(nextSession);
  };

  const onSignupVerification = (
    email: string,
    message: string
  ): void => {
    setSignupVerification({
      email,
      message,
    });
  };

  const resetToken = new URLSearchParams(
    window.location.search
  ).get('token');

  if (window.location.pathname === '/reset-password') {
    if (!resetToken) {
      return (
        <main className="center">
          <section className="empty">
            <b>Invalid reset link</b>

            <p>
              The reset token is missing. Please request a new password reset
              link.
            </p>

            <button
              type="button"
              onClick={() => {
                window.history.replaceState({}, '', '/');
                window.location.reload();
              }}
            >
              Back to sign in
            </button>
          </section>
        </main>
      );
    }

    return (
      <ResetPassword
        token={resetToken}
        onBackToLogin={() => {
          window.history.replaceState({}, '', '/');
          window.location.reload();
        }}
      />
    );
  }

  /*
   * THIS IS THE IMPORTANT PART:
   * After signup, show EmailVerification.tsx instead of
   * the old "Check your email" page.
   */
  if (!session && signupVerification) {
    return (
      <EmailVerification
        email={signupVerification.email}
        message={signupVerification.message}
        onVerified={() => {
          setSignupVerification(null);
        }}
        onBack={() => {
          setSignupVerification(null);
        }}
      />
    );
  }

  if (!session) {
    return (
      <Login
        onLogin={login}
        onSignupVerification={onSignupVerification}
        initialError={oauthResult.error}
      />
    );
  }

  return (
    <RealtimeProvider session={session}>
      {(() => {
        switch (session.role) {
          case 'ADMIN':
            return <AdminDashboard session={session} logout={logout} />;

          case 'HR':
            return <HrDashboard session={session} logout={logout} />;

          case 'EVALUATOR':
            return <EvaluatorDashboard session={session} logout={logout} />;

          case 'CANDIDATE':
            return (
              <CandidateDashboard
                session={session}
                logout={logout}
                initialOfferId={pendingOfferId}
              />
            );

          default:
            logout();
            return null;
        }
      })()}
    </RealtimeProvider>
  );
}
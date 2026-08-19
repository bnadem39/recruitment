import type { Session } from './types';
export function RoleDashboard({ title, description, session, logout }: { title: string; description: string; session: Session; logout: () => void }) {
  return <div className="center"><div className="empty"><b>{title}</b><p>Bienvenue, {session.firstName}. {description}</p><button onClick={logout}>Se déconnecter</button></div></div>;
}

import { RoleDashboard } from '../shared/RoleDashboard';
import type { Session } from '../shared/types';
export function HrDashboard({ session, logout }: { session: Session; logout: () => void }) { return <RoleDashboard title="Espace RH" description="Gérez les offres et les candidatures." session={session} logout={logout} />; }

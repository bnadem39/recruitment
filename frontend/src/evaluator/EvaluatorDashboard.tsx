import { RoleDashboard } from '../shared/RoleDashboard';
import type { Session } from '../shared/types';
export function EvaluatorDashboard({ session, logout }: { session: Session; logout: () => void }) { return <RoleDashboard title="Espace évaluateur" description="Consultez et évaluez les candidatures assignées." session={session} logout={logout} />; }

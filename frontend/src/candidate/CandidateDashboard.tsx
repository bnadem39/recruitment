import { RoleDashboard } from '../shared/RoleDashboard';
import type { Session } from '../shared/types';
export function CandidateDashboard({ session, logout }: { session: Session; logout: () => void }) { return <RoleDashboard title="Espace candidat" description="Découvrez les offres et suivez vos candidatures." session={session} logout={logout} />; }

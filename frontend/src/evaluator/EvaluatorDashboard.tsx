import { InterviewWorkspace } from '../shared/InterviewWorkspace';
import type { Session } from '../shared/types';
export function EvaluatorDashboard({ session, logout }: { session: Session; logout: () => void }) { return <InterviewWorkspace session={session} logout={logout} />; }

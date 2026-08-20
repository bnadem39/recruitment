import { FormBuilder } from './FormBuilder';
import type { Session } from '../shared/types';

export function HrDashboard({ session, logout }: { session: Session; logout: () => void }) {
  return <FormBuilder session={session} logout={logout} />;
}

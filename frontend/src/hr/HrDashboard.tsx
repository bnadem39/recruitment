import type { Session } from '../shared/types';
import { FormBuilder } from './form-builder/FormBuilder';

export function HrDashboard({ session, logout }: { session: Session; logout: () => void }) {
  return <FormBuilder session={session} logout={logout} />;
}

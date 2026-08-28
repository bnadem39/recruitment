export type RoleKey = 'HR' | 'ADMIN' | 'EVALUATOR' | 'USER';

export const ROLE_THEME: Record<RoleKey, { label: string; badge: string; color: string }> = {
  HR:        { label: 'Human Resources', badge: 'HR', color: '#2f6fed' },
  ADMIN:     { label: 'Administrator',   badge: 'AD', color: '#7c3aed' },
  EVALUATOR: { label: 'Evaluator',       badge: 'EV', color: '#128c78' },
  USER:      { label: 'Candidate',       badge: 'US', color: '#e67e22' },
};
export type Role = 'ADMIN' | 'HR' | 'EVALUATOR' | 'CANDIDATE';
export type Status = 'ACTIVE' | 'DISABLED' | 'BLOCKED';
export type Session = { accessToken: string; userId: number; email: string; role: Role; firstName: string; lastName: string };
export type InternalUser = { id: number; firstName: string; lastName: string; email: string; role: Role; status: Status; createdAt: string };

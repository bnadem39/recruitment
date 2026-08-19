export const API = import.meta.env.VITE_API_URL ?? '';
export const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

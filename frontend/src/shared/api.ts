export const API = import.meta.env.VITE_API_URL ?? '';
export const authHeaders = (token: string) => {
  const accessToken = typeof token === 'string' ? token.trim() : '';
  if (!accessToken) throw new Error('Missing authentication token');
  return { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
};

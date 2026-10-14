import { API, authHeaders } from './api';

export interface AiAnswer {
  answer: string;
  sources: string[];
  trace: string[];
}

export async function askAssistant(
  token: string,
  question: string,
  offerId?: string,
): Promise<AiAnswer> {
  const res = await fetch(`${API}/api/ai/chat`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ question, offerId: offerId || null }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `Erreur ${res.status}`);
  }
  return res.json();
}
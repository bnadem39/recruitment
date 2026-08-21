import { API, authHeaders } from '../../shared/api';
import type { BuilderDraft, BuilderElement, JobOffer } from './types';

type SavedForm = { id: number; title: string; description: string; active: boolean };
type SavedField = { id: number; displayOrder: number };
type SavedOption = { id: number };
type SavedCondition = { id: number };

async function json<T>(url: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${url}`, { ...init, headers: { ...authHeaders(token), ...init?.headers } });
  if (!response.ok) throw new Error((await response.text()) || `Request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getJobOffers(token: string): Promise<JobOffer[]> {
  return json<JobOffer[]>('/api/offers', token);
}

function fieldPayload(element: BuilderElement, order: number) {
  return {
    label: element.label || 'Untitled field', fieldType: element.fieldType,
    required: element.required, placeholder: element.placeholder || null,
    defaultVisible: true, displayOrder: order,
    validationRule: element.validationMessage || null,
    minimumLength: element.minLength || null, maximumLength: element.maxLength || null,
    minimumValue: null, maximumValue: element.kind === 'cv' ? element.maxFileSize : null,
  };
}

export async function saveDraftToBackend(draft: BuilderDraft, token: string): Promise<BuilderDraft> {
  const formPayload = { title: draft.name, description: draft.description, active: draft.status === 'PUBLISHED' };
  const form = draft.backendId
    ? await json<SavedForm>(`/api/forms/${draft.backendId}`, token, { method: 'PUT', body: JSON.stringify(formPayload) })
    : await json<SavedForm>('/api/forms', token, { method: 'POST', body: JSON.stringify(formPayload) });

  const elements = draft.steps.flatMap(step => step.elements).filter(element => !['heading', 'paragraph', 'divider', 'image'].includes(element.kind));
  const remoteFields = draft.backendId ? await json<SavedField[]>(`/api/forms/${form.id}/fields`, token) : [];
  const retainedIds = new Set(elements.flatMap(element => element.backendId ? [element.backendId] : []));
  for (const remote of remoteFields) {
    if (!retainedIds.has(remote.id)) await json<void>(`/api/forms/${form.id}/fields/${remote.id}`, token, { method: 'DELETE' });
  }
  let order = 0;
  const nextById = new Map<string, BuilderElement>();
  for (const element of elements) {
    const payload = fieldPayload(element, order++);
    const saved = element.backendId
      ? await json<SavedField>(`/api/forms/${form.id}/fields/${element.backendId}`, token, { method: 'PUT', body: JSON.stringify(payload) })
      : await json<SavedField>(`/api/forms/${form.id}/fields`, token, { method: 'POST', body: JSON.stringify(payload) });
    nextById.set(element.id, { ...element, backendId: saved.id });
  }

  for (const element of elements) {
    const savedElement = nextById.get(element.id);
    if (!savedElement?.backendId || !element.options) continue;
    const optionUrl = `/api/forms/${form.id}/fields/${savedElement.backendId}/options`;
    const existing = element.backendId ? await json<SavedOption[]>(optionUrl, token) : [];
    for (const option of existing) await json<void>(`${optionUrl}/${option.id}`, token, { method: 'DELETE' });
    for (const [displayOrder, label] of element.options.entries()) {
      await json<SavedOption>(optionUrl, token, { method: 'POST', body: JSON.stringify({ label, value: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), displayOrder }) });
    }
  }

  const conditionUrl = `/api/forms/${form.id}/conditions`;
  const existingConditions = draft.backendId ? await json<SavedCondition[]>(conditionUrl, token) : [];
  for (const condition of existingConditions) await json<void>(`${conditionUrl}/${condition.id}`, token, { method: 'DELETE' });
  for (const target of elements) {
    if (!target.logic?.sourceId) continue;
    const source = nextById.get(target.logic.sourceId);
    const savedTarget = nextById.get(target.id);
    if (!source?.backendId || !savedTarget?.backendId) continue;
    await json<SavedCondition>(conditionUrl, token, { method: 'POST', body: JSON.stringify({ sourceFieldId: source.backendId, targetFieldId: savedTarget.backendId, operator: target.logic.operator, expectedValue: target.logic.value, action: 'SHOW', conditionGroup: 0, logicalOperator: target.logic.join }) });
  }

  return {
    ...draft, backendId: form.id,
    steps: draft.steps.map(step => ({ ...step, elements: step.elements.map(element => nextById.get(element.id) || element) })),
  };
}

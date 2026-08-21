import type { BuilderDraft, BuilderElement, CatalogItem, FormTemplate } from './types';

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const CATALOG: { category: string; items: CatalogItem[] }[] = [
  { category: 'Fields', items: [
    { id: 'short-text', name: 'Text field', glyph: 'T', hint: 'Short or long answer', fieldType: 'TEXT' },
    { id: 'radio', name: 'Radio button', glyph: '◉', hint: 'Choose one option', fieldType: 'RADIO' },
    { id: 'checkbox', name: 'Checkbox', glyph: '✓', hint: 'Yes/No or multiple options', fieldType: 'CHECKBOX' },
    { id: 'upload', name: 'Upload', glyph: '📎', hint: 'File (CV, document...)', fieldType: 'FILE' },
  ]},
  { category: 'Actions', items: [
    { id: 'button', name: 'Button', glyph: '▶', hint: 'Next, back or submit action', fieldType: 'TEXT' },
  ]},
];

const defaults: Record<string, Partial<BuilderElement>> = {
  'short-text': { label: 'New field', placeholder: 'Your answer...' },
  radio: { label: 'Choose an option', options: ['Option 1', 'Option 2'] },
  checkbox: { label: 'I agree', options: ['Yes'] },
  upload: { label: 'Upload a file', kind: 'upload', help: 'PDF, DOCX · Max 10 MB', acceptedFormats: 'PDF, DOCX', maxFileSize: 10 },
  button: { kind: 'button', label: 'Button', buttonRole: 'next', buttonText: 'Continue', pixelHeight: 48 },
};

export function createElement(sourceId: string): BuilderElement {
  const catalog = CATALOG.flatMap(group => group.items).find(item => item.id === sourceId);
  const preset = defaults[sourceId] || {};
  const fieldType = catalog?.fieldType || 'TEXT';
  const label = preset.label || catalog?.name || 'New field';
  return {
    id: uid(), kind: preset.kind || sourceId, fieldType, label,
    placeholder: preset.placeholder || '', help: preset.help || '',
    internalName: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    required: false,
    width: '100', align: 'left', radius: 10, spacing: 18,
    labelPosition: 'top', textSize: 'medium', ...preset,
  };
}

// Détermine le rôle/texte par défaut d'un bouton selon la page où il est déposé.
export function defaultButtonProps(stepIndex: number, totalSteps: number): { buttonRole: 'next' | 'submit'; buttonText: string } {
  const isLastStep = stepIndex >= totalSteps - 1;
  return isLastStep ? { buttonRole: 'submit', buttonText: 'Submit application' } : { buttonRole: 'next', buttonText: 'Continue' };
}

export const INITIAL_DRAFT: BuilderDraft = {
  name: 'Untitled form',
  description: '',
  status: 'DRAFT', successMessage: 'Thank you! Your application has been received.',
  allowDraft: true, allowEditing: false,
  steps: [],
};

export const TEMPLATES: FormTemplate[] = [
  { id: 'blank', title: 'Blank form', description: 'A clean canvas, ready for your form.', accent: 'blank' },
];
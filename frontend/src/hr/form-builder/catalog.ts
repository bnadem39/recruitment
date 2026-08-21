import type { BuilderDraft, BuilderElement, CatalogItem, FormTemplate } from './types';

export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const CATALOG: { category: string; items: CatalogItem[] }[] = [
  { category: 'Basic', items: [
    { id: 'heading', name: 'Heading', glyph: 'H', hint: 'Section title', fieldType: 'TEXT' },
    { id: 'paragraph', name: 'Paragraph', glyph: '¶', hint: 'Supporting copy', fieldType: 'TEXTAREA' },
    { id: 'divider', name: 'Divider', glyph: '—', hint: 'Visual break', fieldType: 'TEXT' },
    { id: 'image', name: 'Image', glyph: '▧', hint: 'Brand visual', fieldType: 'FILE' },
  ]},
  { category: 'Inputs', items: [
    { id: 'short-text', name: 'Short text', glyph: 'T', hint: 'One line', fieldType: 'TEXT' },
    { id: 'long-text', name: 'Long text', glyph: '≡', hint: 'Multi-line answer', fieldType: 'TEXTAREA' },
    { id: 'email', name: 'Email', glyph: '@', hint: 'name@company.com', fieldType: 'EMAIL' },
    { id: 'phone', name: 'Phone', glyph: '⌕', hint: '+216 00 000 000', fieldType: 'PHONE' },
    { id: 'number', name: 'Number', glyph: '#', hint: 'Numeric value', fieldType: 'NUMBER' },
    { id: 'date', name: 'Date', glyph: '□', hint: 'Calendar picker', fieldType: 'DATE' },
    { id: 'address', name: 'Address', glyph: '⌂', hint: 'Location details', fieldType: 'TEXTAREA' },
  ]},
  { category: 'Choice', items: [
    { id: 'dropdown', name: 'Dropdown', glyph: '⌄', hint: 'Choose one', fieldType: 'SELECT' },
    { id: 'radio', name: 'Radio group', glyph: '◉', hint: 'Visible options', fieldType: 'RADIO' },
    { id: 'checkbox', name: 'Checkbox', glyph: '✓', hint: 'Consent or yes/no', fieldType: 'CHECKBOX' },
    { id: 'checkbox-group', name: 'Checkbox group', glyph: '☷', hint: 'Choose many', fieldType: 'MULTI_SELECT' },
  ]},
  { category: 'Recruitment', items: [
    { id: 'cv', name: 'CV upload', glyph: '↑', hint: 'PDF · DOCX', fieldType: 'FILE' },
    { id: 'cover', name: 'Cover letter', glyph: '✎', hint: 'Candidate motivation', fieldType: 'TEXTAREA' },
    { id: 'portfolio', name: 'Portfolio URL', glyph: '↗', hint: 'Work samples', fieldType: 'TEXT' },
    { id: 'linkedin', name: 'LinkedIn URL', glyph: 'in', hint: 'Professional profile', fieldType: 'TEXT' },
    { id: 'experience', name: 'Years of experience', glyph: '◷', hint: 'Experience level', fieldType: 'NUMBER' },
    { id: 'education', name: 'Education level', glyph: '◇', hint: 'Highest degree', fieldType: 'SELECT' },
    { id: 'skills', name: 'Skills', glyph: '✦', hint: 'Technical strengths', fieldType: 'MULTI_SELECT' },
    { id: 'languages', name: 'Languages', glyph: 'A', hint: 'Spoken languages', fieldType: 'MULTI_SELECT' },
    { id: 'availability', name: 'Availability', glyph: '◫', hint: 'Start date', fieldType: 'DATE' },
    { id: 'salary', name: 'Salary expectation', glyph: '$', hint: 'Expected range', fieldType: 'NUMBER' },
  ]},
  { category: 'Quick sections', items: [
    { id: 'personal-block', name: 'Personal information', glyph: '◎', hint: '4-field section', block: ['first-name', 'last-name', 'email', 'phone'] },
    { id: 'profile-block', name: 'Professional profile', glyph: '◈', hint: '4-field section', block: ['position', 'experience', 'linkedin', 'portfolio'] },
    { id: 'documents-block', name: 'Documents', glyph: '▤', hint: 'CV + cover letter', block: ['cv', 'cover'] },
  ]},
];

const defaults: Record<string, Partial<BuilderElement>> = {
  heading: { label: 'Section heading', kind: 'heading', help: 'Add a short introduction for candidates.' },
  paragraph: { label: 'Supporting text', kind: 'paragraph', placeholder: 'Write a helpful description…' },
  divider: { label: 'Divider', kind: 'divider' },
  image: { label: 'Image', kind: 'image' },
  'short-text': { label: 'Short answer', placeholder: 'Type your answer' },
  'long-text': { label: 'Long answer', placeholder: 'Tell us more' },
  email: { label: 'Email address', placeholder: 'name@example.com', help: "We'll use this to contact you." },
  phone: { label: 'Phone number', placeholder: '+216 00 000 000' },
  number: { label: 'Number', placeholder: '0' },
  date: { label: 'Date' },
  address: { label: 'Address', placeholder: 'Street, city and country' },
  dropdown: { label: 'Select an option', options: ['Option one', 'Option two', 'Option three'] },
  radio: { label: 'Choose one', options: ['Yes', 'No'] },
  checkbox: { label: 'I agree', options: ['Yes'] },
  'checkbox-group': { label: 'Choose all that apply', options: ['Option one', 'Option two', 'Option three'] },
  cv: { label: 'Upload your CV', kind: 'cv', help: 'PDF, DOCX · Max 10 MB', acceptedFormats: 'PDF, DOCX', maxFileSize: 10 },
  cover: { label: 'Cover letter', placeholder: 'What makes you a great fit for this role?' },
  portfolio: { label: 'Portfolio URL', placeholder: 'https://portfolio.com' },
  linkedin: { label: 'LinkedIn profile', placeholder: 'https://linkedin.com/in/yourname' },
  experience: { label: 'Years of experience', placeholder: 'e.g. 5' },
  education: { label: 'Highest education level', options: ['High school', "Bachelor's degree", "Master's degree", 'Doctorate'] },
  skills: { label: 'Core skills', options: ['React', 'TypeScript', 'Java', 'Spring Boot', 'Cloud'] },
  languages: { label: 'Languages', options: ['Arabic', 'French', 'English', 'Other'] },
  availability: { label: 'Available start date' },
  salary: { label: 'Salary expectation', placeholder: 'Annual gross salary' },
  'first-name': { label: 'First name', placeholder: 'e.g. Sara', width: '50' },
  'last-name': { label: 'Last name', placeholder: 'e.g. Ben Ali', width: '50' },
  position: { label: 'Current position', placeholder: 'e.g. Frontend Engineer' },
};

export function createElement(sourceId: string): BuilderElement {
  const catalog = CATALOG.flatMap(group => group.items).find(item => item.id === sourceId);
  const preset = defaults[sourceId] || {};
  const fieldType = catalog?.fieldType || (sourceId === 'first-name' || sourceId === 'last-name' || sourceId === 'position' ? 'TEXT' : 'TEXT');
  const label = preset.label || catalog?.name || 'Untitled field';
  return {
    id: uid(), kind: preset.kind || sourceId, fieldType, label,
    placeholder: preset.placeholder || '', help: preset.help || '',
    internalName: label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
    required: sourceId === 'email' || sourceId === 'cv' || sourceId === 'first-name' || sourceId === 'last-name',
    width: preset.width || '100', align: 'left', radius: 10, spacing: 18,
    labelPosition: 'top', textSize: 'medium', ...preset,
  };
}

const personal = ['first-name', 'last-name', 'email', 'phone'].map(createElement);
const experience = ['position', 'experience', 'skills', 'linkedin'].map(createElement);
const documents = ['cv', 'cover'].map(createElement);

export const INITIAL_DRAFT: BuilderDraft = {
  name: 'Untitled recruitment form',
  description: '',
  status: 'DRAFT', successMessage: 'Thank you! Your application has been received.',
  allowDraft: true, allowEditing: false,
  steps: [
    { id: uid(), title: 'Page 1', eyebrow: 'Step 1', elements: [] },
  ],
};

export function createStandardDraft(): BuilderDraft {
  return {
    name: 'Standard job application',
    description: 'Application form for a recruitment process.',
    status: 'DRAFT',
    successMessage: 'Thank you! Your application has been received.',
    allowDraft: true,
    allowEditing: false,
    steps: [
      { id: uid(), title: 'Personal information', eyebrow: 'Step 1', elements: personal.map(element => ({ ...createElement(element.kind), ...element, id: uid(), backendId: undefined })) },
      { id: uid(), title: 'Experience', eyebrow: 'Step 2', elements: experience.map(element => ({ ...createElement(element.kind), ...element, id: uid(), backendId: undefined })) },
      { id: uid(), title: 'Documents', eyebrow: 'Step 3', elements: documents.map(element => ({ ...createElement(element.kind), ...element, id: uid(), backendId: undefined })) },
    ],
  };
}

export const TEMPLATES: FormTemplate[] = [
  { id: 'blank', title: 'Blank form', description: 'A clean canvas, ready for your workflow.', accent: 'blank' },
  { id: 'standard', title: 'Standard job application', description: 'Personal details, profile and documents.', accent: 'blue' },
  { id: 'internship', title: 'Internship application', description: 'Education-first application flow.', accent: 'amber' },
  { id: 'software', title: 'Software engineer', description: 'Skills, experience, links and CV.', accent: 'violet' },
  { id: 'banking', title: 'Banking recruitment', description: 'Structured and compliance-friendly.', accent: 'cyan' },
];

export type BackendFieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'EMAIL' | 'PHONE' | 'RADIO' | 'CHECKBOX' | 'SELECT' | 'MULTI_SELECT' | 'FILE' | 'BOOLEAN';

export type BuilderElement = {
  id: string;
  backendId?: number;
  kind: string;
  fieldType: BackendFieldType;
  label: string;
  placeholder?: string;
  help?: string;
  internalName: string;
  defaultValue?: string;
  required: boolean;
  width: '100' | '50' | '33';
  x?: number;
  y?: number;
  align: 'left' | 'center' | 'right';
  radius: number;
  spacing: number;
  labelPosition: 'top' | 'left' | 'hidden';
  textSize: 'small' | 'medium' | 'large';
  minLength?: number;
  maxLength?: number;
  validationMessage?: string;
  options?: string[];
  acceptedFormats?: string;
  maxFileSize?: number;
  multiple?: boolean;
  logic?: {
    sourceId: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS';
    value: string;
    join: 'AND' | 'OR';
  };
};

export type FormStep = { id: string; title: string; eyebrow: string; elements: BuilderElement[] };

export type BuilderDraft = {
  backendId?: number;
  name: string;
  description: string;
  jobOfferId?: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  successMessage: string;
  allowDraft: boolean;
  allowEditing: boolean;
  steps: FormStep[];
};

export type CatalogItem = {
  id: string;
  name: string;
  glyph: string;
  hint: string;
  fieldType?: BackendFieldType;
  block?: string[];
};

export type JobOffer = { id: number; title: string; department?: string; formId?: number };

export type FormTemplate = {
  id: string;
  title: string;
  description: string;
  accent: string;
  custom?: boolean;
  draft?: BuilderDraft;
};

export type BackendFieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'EMAIL' | 'PHONE' | 'RADIO' | 'CHECKBOX' | 'SELECT' | 'MULTI_SELECT' | 'FILE' | 'BOOLEAN';

export type ButtonRole = 'next' | 'back' | 'submit' | 'custom';

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
  pixelWidth?: number;
  pixelHeight?: number;
  align: 'left' | 'center' | 'right';
  radius: number;
  spacing: number;
  labelPosition: 'top' | 'left' | 'hidden';
  textSize: 'small' | 'medium' | 'large';
  minLength?: number;
  maxLength?: number;
  validationMessage?: string;
  options?: string[];
  imageSrc?: string;
  acceptedFormats?: string;
  maxFileSize?: number;
  multiple?: boolean;
  // Élément "bouton" (Suivant / Précédent / Envoyer / lien personnalisé)
  buttonRole?: ButtonRole;
  buttonText?: string;
  buttonLink?: string;
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

export type JobOffer = {
  id: number;
  title: string;

  description?: string;
  department?: string;
  contractType?: string;
  location?: string;

  numberOfPositions?: number;

  publicationDate?: string;
  deadline?: string;

  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED' | string;
  openForApplications?: boolean;

  formId?: number | null;

  createdAt?: string;
  updatedAt?: string;
};

export type FormTemplate = {
  id: string;
  title: string;
  description: string;
  accent: string;
  custom?: boolean;
  draft?: BuilderDraft;
};

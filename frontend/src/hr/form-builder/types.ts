export type BackendFieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'DATE'
  | 'EMAIL'
  | 'PHONE'
  | 'RADIO'
  | 'CHECKBOX'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'FILE'
  | 'BOOLEAN';

export type ButtonRole =
  | 'next'
  | 'back'
  | 'submit'
  | 'custom';

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

export type FormStep = {
  id: string;
  title: string;
  eyebrow: string;
  elements: BuilderElement[];
};

export type BuilderDraft = {
  backendId?: number;
  name: string;
  description: string;
  jobOfferIds?: number[];
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

  status?:
    | 'DRAFT'
    | 'PUBLISHED'
    | 'CLOSED'
    | 'ARCHIVED'
    | string;

  openForApplications?: boolean;

  /**
   * Ancienne relation : une seule offre → un formulaire.
   *
   * À supprimer lorsque ton backend utilisera uniquement
   * la table job_offer_forms.
   */
  formId?: number | null;

  /**
   * Nouvelle relation : une offre peut être liée
   * à plusieurs formulaires.
   *
   * Exemple :
   * formIds: [2, 9, 10]
   */
  formIds?: number[];

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
import { API, authHeaders } from '../../shared/api';
import type {
  BuilderDraft,
  BuilderElement,
  JobOffer,
} from './types';
import { uid } from './catalog';

type SavedForm = {
  id: number;
  title: string;
  description: string;
  active: boolean;

  /*
   * Le backend doit idéalement renvoyer ce champ dans FormResponseDTO.
   * Il est optionnel pour ne pas casser le code tant que ce n'est pas fait.
   */
  jobOfferIds?: number[];
};

type SavedField = {
  id: number;
  displayOrder: number;
};

type SavedOption = {
  id: number;
};

type SavedCondition = {
  id: number;
};

type BackendField = {
  id: number;
  label: string;
  fieldType: BuilderElement['fieldType'];
  required: boolean;
  placeholder?: string;
  displayOrder: number;
  minimumLength?: number;
  maximumLength?: number;
};

type BackendCondition = {
  id: number;
  sourceFieldId: number;
  targetFieldId: number;
  operator: string;
  expectedValue?: string;
  action: string;
};

type BackendOption = {
  id: number;
  label: string;
  value: string;
  displayOrder: number;
};

async function json<T>(
  url: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API}${url}`, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      (await response.text()) ||
        `Request failed (${response.status})`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function getJobOffers(
  token: string
): Promise<JobOffer[]> {
  return json<JobOffer[]>('/api/offers', token);
}

function fieldPayload(
  element: BuilderElement,
  order: number
) {
  return {
    label: element.label || 'Untitled field',
    fieldType: element.fieldType,
    required: element.required,
    placeholder: element.placeholder || null,
    defaultVisible: true,
    displayOrder: order,
    validationRule: element.validationMessage || null,
    minimumLength: element.minLength || null,
    maximumLength:
      element.fieldType === 'FILE'
        ? element.maxFileSize || null
        : element.maxLength || null,
    minimumValue: null,
    maximumValue: null,
  };
}

export async function saveDraftToBackend(
  draft: BuilderDraft,
  token: string
): Promise<BuilderDraft> {
  /*
   * CORRECTION IMPORTANTE :
   * On transmet les IDs des offres sélectionnées dans PublishDialog.
   *
   * Exemple lorsque Frontend Developer (ID 3) est coché :
   *
   * {
   *   title: "Mon formulaire",
   *   description: "...",
   *   active: true,
   *   jobOfferIds: [3]
   * }
   */
  const formPayload = {
    title: draft.name,
    description: draft.description,
    active: draft.status === 'PUBLISHED',
    jobOfferIds: draft.jobOfferIds ?? [],
  };

  /*
   * À garder temporairement pour vérifier le résultat dans :
   * F12 → Console.
   *
   * Tu dois voir : jobOfferIds: [3]
   * lorsque Frontend Developer est sélectionné.
   */
  console.log(
    'Payload envoyé au backend :',
    formPayload
  );

  const form = draft.backendId
    ? await json<SavedForm>(
        `/api/forms/${draft.backendId}`,
        token,
        {
          method: 'PUT',
          body: JSON.stringify(formPayload),
        }
      )
    : await json<SavedForm>(
        '/api/forms',
        token,
        {
          method: 'POST',
          body: JSON.stringify(formPayload),
        }
      );

  const elements = draft.steps.flatMap(
    (step) => step.elements
  );

  const remoteFields = draft.backendId
    ? await json<SavedField[]>(
        `/api/forms/${form.id}/fields`,
        token
      )
    : [];

  const retainedIds = new Set(
    elements.flatMap((element) =>
      element.backendId ? [element.backendId] : []
    )
  );

  for (const remote of remoteFields) {
    if (!retainedIds.has(remote.id)) {
      await json<void>(
        `/api/forms/${form.id}/fields/${remote.id}`,
        token,
        {
          method: 'DELETE',
        }
      );
    }
  }

  let order = 0;
  const nextById = new Map<string, BuilderElement>();

  for (const element of elements) {
    const payload = fieldPayload(element, order++);

    const saved = element.backendId
      ? await json<SavedField>(
          `/api/forms/${form.id}/fields/${element.backendId}`,
          token,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        )
      : await json<SavedField>(
          `/api/forms/${form.id}/fields`,
          token,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );

    nextById.set(element.id, {
      ...element,
      backendId: saved.id,
    });
  }

  for (const element of elements) {
    const savedElement = nextById.get(element.id);

    if (!savedElement?.backendId || !element.options) {
      continue;
    }

    const optionUrl =
      `/api/forms/${form.id}/fields/` +
      `${savedElement.backendId}/options`;

    const existing = element.backendId
      ? await json<SavedOption[]>(optionUrl, token)
      : [];

    for (const option of existing) {
      await json<void>(
        `${optionUrl}/${option.id}`,
        token,
        {
          method: 'DELETE',
        }
      );
    }

    for (const [
      displayOrder,
      label,
    ] of element.options.entries()) {
      await json<SavedOption>(
        optionUrl,
        token,
        {
          method: 'POST',
          body: JSON.stringify({
            label,
            value: label
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '_'),
            displayOrder,
          }),
        }
      );
    }
  }

  const conditionUrl =
    `/api/forms/${form.id}/conditions`;

  const existingConditions = draft.backendId
    ? await json<SavedCondition[]>(
        conditionUrl,
        token
      )
    : [];

  for (const condition of existingConditions) {
    await json<void>(
      `${conditionUrl}/${condition.id}`,
      token,
      {
        method: 'DELETE',
      }
    );
  }

  for (const target of elements) {
    if (!target.logic?.sourceId) {
      continue;
    }

    const source = nextById.get(
      target.logic.sourceId
    );

    const savedTarget = nextById.get(target.id);

    if (!source?.backendId || !savedTarget?.backendId) {
      continue;
    }

    await json<SavedCondition>(
      conditionUrl,
      token,
      {
        method: 'POST',
        body: JSON.stringify({
          sourceFieldId: source.backendId,
          targetFieldId: savedTarget.backendId,
          operator: target.logic.operator,
          expectedValue: target.logic.value,
          action: 'SHOW',
          conditionGroup: 0,
          logicalOperator: target.logic.join,
        }),
      }
    );
  }

  return {
    ...draft,
    backendId: form.id,

    /*
     * Conserve les choix frontend immédiatement après la sauvegarde.
     * Si le backend renvoie jobOfferIds, on utilise sa version ;
     * sinon on garde celle qui vient du draft actuel.
     */
    jobOfferIds:
      form.jobOfferIds ?? draft.jobOfferIds ?? [],

    steps: draft.steps.map((step) => ({
      ...step,
      elements: step.elements.map(
        (element) =>
          nextById.get(element.id) || element
      ),
    })),
  };
}

function estimateHeight(
  fieldType: BuilderElement['fieldType']
) {
  if (fieldType === 'FILE') {
    return 180;
  }

  if (fieldType === 'TEXTAREA') {
    return 126;
  }

  return 94;
}

export async function loadFormDraft(
  formId: number,
  token: string
): Promise<BuilderDraft> {
  const form = await json<SavedForm>(
    `/api/forms/${formId}`,
    token
  );

  const fields = await json<BackendField[]>(
    `/api/forms/${formId}/fields`,
    token
  );

  const conditions = await json<BackendCondition[]>(
    `/api/forms/${formId}/conditions`,
    token
  );

  const sortedFields = [...fields].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const idByBackend = new Map<number, string>();
  const elements: BuilderElement[] = [];
  let cursorY = 0;

  for (const field of sortedFields) {
    const localId = uid();

    idByBackend.set(field.id, localId);

    const isFile = field.fieldType === 'FILE';

    const needsOptions = [
      'RADIO',
      'SELECT',
      'MULTI_SELECT',
      'CHECKBOX',
    ].includes(field.fieldType);

    let options: string[] | undefined;

    if (needsOptions) {
      const opts = await json<BackendOption[]>(
        `/api/forms/${formId}/fields/${field.id}/options`,
        token
      );

      options = opts
        .sort(
          (a, b) =>
            a.displayOrder - b.displayOrder
        )
        .map((option) => option.label);
    }

    elements.push({
      id: localId,
      backendId: field.id,
      kind: isFile ? 'upload' : 'field',
      fieldType: field.fieldType,
      label: field.label,
      placeholder: field.placeholder || '',
      help: '',
      internalName: field.label
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, ''),
      required: field.required,
      width: '100',
      x: 0,
      y: cursorY,
      align: 'left',
      radius: 10,
      spacing: 18,
      labelPosition: 'top',
      textSize: 'medium',
      minLength: field.minimumLength,
      maxLength: field.maximumLength,
      options,
      acceptedFormats: isFile
        ? 'PDF, DOCX'
        : undefined,
      maxFileSize: isFile
        ? field.maximumLength || 10
        : undefined,
    });

    cursorY += estimateHeight(field.fieldType) + 16;
  }

  for (const condition of conditions) {
    if (condition.action !== 'SHOW') {
      continue;
    }

    const targetLocal = idByBackend.get(
      condition.targetFieldId
    );

    const sourceLocal = idByBackend.get(
      condition.sourceFieldId
    );

    if (!targetLocal || !sourceLocal) {
      continue;
    }

    const element = elements.find(
      (item) => item.id === targetLocal
    );

    if (!element) {
      continue;
    }

    const operator = (
      ['EQUALS', 'NOT_EQUALS', 'CONTAINS'].includes(
        condition.operator
      )
        ? condition.operator
        : 'EQUALS'
    ) as 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS';

    element.logic = {
      sourceId: sourceLocal,
      operator,
      value: condition.expectedValue || '',
      join: 'AND',
    };
  }

  return {
    backendId: form.id,
    name: form.title,
    description: form.description || '',
    status: form.active ? 'PUBLISHED' : 'DRAFT',

    /*
     * Récupère les associations si le backend les renvoie.
     * Sinon la liste est vide, sans provoquer d'erreur.
     */
    jobOfferIds: form.jobOfferIds ?? [],

    successMessage:
      'Thank you! Your application has been received.',
    allowDraft: true,
    allowEditing: false,
    steps: [
      {
        id: uid(),
        title: 'Page 1',
        eyebrow: 'Page 1',
        elements,
      },
    ],
  };
}
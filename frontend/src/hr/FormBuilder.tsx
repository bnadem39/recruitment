import { FormEvent, useEffect, useMemo, useState } from 'react';
import { API, authHeaders } from '../shared/api';
import type { Session } from '../shared/types';

// ==================== Types (miroir des DTOs backend) ====================

type FieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'EMAIL' | 'PHONE' | 'RADIO' | 'CHECKBOX' | 'SELECT' | 'MULTI_SELECT' | 'FILE' | 'BOOLEAN';
type ConditionOperator = 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'GREATER_THAN_OR_EQUAL' | 'LESS_THAN' | 'LESS_THAN_OR_EQUAL' | 'CONTAINS' | 'IS_EMPTY' | 'IS_NOT_EMPTY';
type ConditionAction = 'SHOW' | 'HIDE' | 'MAKE_REQUIRED' | 'MAKE_OPTIONAL' | 'ENABLE' | 'DISABLE';

const fieldTypes: FieldType[] = ['TEXT', 'TEXTAREA', 'NUMBER', 'DATE', 'EMAIL', 'PHONE', 'RADIO', 'CHECKBOX', 'SELECT', 'MULTI_SELECT', 'FILE', 'BOOLEAN'];
const operators: ConditionOperator[] = ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'CONTAINS', 'IS_EMPTY', 'IS_NOT_EMPTY'];
const actions: ConditionAction[] = ['SHOW', 'HIDE', 'MAKE_REQUIRED', 'MAKE_OPTIONAL', 'ENABLE', 'DISABLE'];
const optionTypes: FieldType[] = ['SELECT', 'MULTI_SELECT', 'RADIO'];

type FormItem = { id: number; title: string; description?: string; active: boolean; createdAt: string; updatedAt: string };
type FieldItem = { id: number; formId: number; label: string; fieldType: FieldType; required: boolean; placeholder?: string; defaultVisible: boolean; displayOrder: number; validationRule?: string; minimumValue?: number; maximumValue?: number; minimumLength?: number; maximumLength?: number };
type OptionItem = { id: number; fieldId: number; label: string; value: string; displayOrder: number };
type ConditionItem = { id: number; formId: number; sourceFieldId: number; sourceFieldLabel: string; targetFieldId: number; targetFieldLabel: string; operator: ConditionOperator; expectedValue?: string; action: ConditionAction; conditionGroup?: number };

const nice = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());

// ==================== Styles explicites (évite tout problème d'héritage de couleur) ====================

const primaryBtnStyle: React.CSSProperties = {
  background: '#128c78',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 16px',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  background: '#ffffff',
  color: '#17243e',
  border: '1px solid #dce2ea',
  borderRadius: '8px',
  padding: '10px 16px',
  fontWeight: 600,
  cursor: 'pointer',
};

const dangerBtnStyle: React.CSSProperties = {
  background: '#ffffff',
  color: '#a8323e',
  border: '1px solid #f0c4c8',
  borderRadius: '7px',
  padding: '7px 10px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const modalCancelBtnStyle: React.CSSProperties = {
  background: '#ffffff',
  color: '#17243e',
  border: '1px solid #dce2e9',
  borderRadius: '7px',
  padding: '9px 16px',
  fontWeight: 600,
  cursor: 'pointer',
};

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...authHeaders(token), ...(init?.headers || {}) } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ==================== Page principale ====================

export function FormBuilder({ session, logout }: { session: Session; logout: () => void }) {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);

  const loadForms = () => {
    setLoading(true);
    request<FormItem[]>('/api/forms', session.accessToken)
      .then(setForms)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadForms(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleActive = async (form: FormItem) => {
    try {
      await request(`/api/forms/${form.id}`, session.accessToken, {
        method: 'PUT',
        body: JSON.stringify({ title: form.title, description: form.description, active: !form.active }),
      });
      loadForms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const deleteForm = async (form: FormItem) => {
    if (!confirm(`Supprimer le formulaire "${form.title}" ? Cette action supprimera aussi ses champs.`)) return;
    try {
      await request(`/api/forms/${form.id}`, session.accessToken, { method: 'DELETE' });
      loadForms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const selected = forms.find(f => f.id === selectedId);

  if (selected) {
    return <FormEditor
      session={session}
      form={selected}
      onBack={() => { setSelectedId(null); loadForms(); }}
    />;
  }

  return <div className="shell">
    <aside>
      <div className="side-logo">BF<span>Recruit</span></div>
      <nav><b>RH</b><button className="active">▦ Formulaires</button></nav>
      <div className="profile"><span>{session.firstName[0]}{session.lastName[0]}</span><div><b>{session.firstName} {session.lastName}</b><small>Ressources Humaines</small></div><button onClick={logout}>↗</button></div>
    </aside>
    <main className="content">
      <header>
        <div><small>FORMULAIRES</small><h1>Constructeur de formulaires</h1><p>Créez et configurez les formulaires de candidature par type de poste.</p></div>
        <button style={primaryBtnStyle} onClick={() => setModal(true)}>＋ Nouveau formulaire</button>
      </header>
      {error && <div className="alert">{error}</div>}
      <section className="table-card">
        <div className="table">
          <div className="tr head"><span>Titre</span><span>Description</span><span>Statut</span><span>Mis à jour</span><span>Actions</span></div>
          {loading ? <div className="loading">Chargement des formulaires…</div>
            : forms.length === 0 ? <div className="loading">Aucun formulaire créé pour l'instant.</div>
            : forms.map(form => <div className="tr" key={form.id}>
              <span><b>{form.title}</b></span>
              <span>{form.description || '—'}</span>
              <span><em className={form.active ? 'active' : 'disabled'}>● {form.active ? 'actif' : 'inactif'}</em></span>
              <span>{new Date(form.updatedAt).toLocaleDateString()}</span>
              <span className="actions">
                <button style={secondaryBtnStyle} onClick={() => setSelectedId(form.id)}>Configurer</button>
                <button style={secondaryBtnStyle} onClick={() => toggleActive(form)}>{form.active ? 'Désactiver' : 'Activer'}</button>
                <button style={dangerBtnStyle} onClick={() => deleteForm(form)}>Supprimer</button>
              </span>
            </div>)}
        </div>
      </section>
    </main>
    {modal && <FormModal session={session} close={() => setModal(false)} done={() => { setModal(false); loadForms(); }} />}
  </div>;
}

// ==================== Modal creation de formulaire ====================

function FormModal({ session, close, done }: { session: Session; close: () => void; done: () => void }) {
  const [title, setTitle] = useState(''), [description, setDescription] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await request('/api/forms', session.accessToken, {
        method: 'POST',
        body: JSON.stringify({ title, description, active: true }),
      });
      done();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de créer le formulaire.');
      setBusy(false);
    }
  };

  return <div className="overlay" onMouseDown={e => e.target === e.currentTarget && close()}>
    <form className="modal" onSubmit={submit}>
      <button type="button" className="close" onClick={close}>×</button>
      <small>NOUVEAU FORMULAIRE</small>
      <h2>Créer un formulaire</h2>
      {error && <div className="alert">{error}</div>}
      <label>Titre<input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Formulaire Financier" /></label>
      <label>Description<input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description courte du formulaire" /></label>
      <div className="modal-actions">
        <button type="button" style={modalCancelBtnStyle} onClick={close}>Annuler</button>
        <button style={primaryBtnStyle} disabled={busy}>{busy ? 'Création…' : 'Créer'}</button>
      </div>
    </form>
  </div>;
}

// ==================== Editeur d'un formulaire (champs + conditions) ====================

function FormEditor({ session, form, onBack }: { session: Session; form: FormItem; onBack: () => void }) {
  const [tab, setTab] = useState<'fields' | 'conditions'>('fields');
  const [fields, setFields] = useState<FieldItem[]>([]);
  const [conditions, setConditions] = useState<ConditionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldModal, setFieldModal] = useState<FieldItem | null | 'new'>(null);
  const [optionsFor, setOptionsFor] = useState<FieldItem | null>(null);
  const [conditionModal, setConditionModal] = useState<ConditionItem | null | 'new'>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      request<FieldItem[]>(`/api/forms/${form.id}/fields`, session.accessToken),
      request<ConditionItem[]>(`/api/forms/${form.id}/conditions`, session.accessToken),
    ]).then(([nextFields, nextConditions]) => { setFields(nextFields); setConditions(nextConditions); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [form.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteField = async (field: FieldItem) => {
    if (!confirm(`Supprimer le champ "${field.label}" ?`)) return;
    try {
      await request(`/api/forms/${form.id}/fields/${field.id}`, session.accessToken, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const deleteCondition = async (condition: ConditionItem) => {
    if (!confirm('Supprimer cette règle de logique conditionnelle ?')) return;
    try {
      await request(`/api/forms/${form.id}/conditions/${condition.id}`, session.accessToken, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const sortedFields = useMemo(() => [...fields].sort((a, b) => a.displayOrder - b.displayOrder), [fields]);

  return <div className="shell">
    <aside>
      <div className="side-logo">BF<span>Recruit</span></div>
      <nav><b>RH</b><button onClick={onBack}>◄ Formulaires</button></nav>
      <div className="profile"><span>{session.firstName[0]}{session.lastName[0]}</span><div><b>{session.firstName} {session.lastName}</b><small>Ressources Humaines</small></div></div>
    </aside>
    <main className="content">
      <header>
        <div><small>{form.active ? 'ACTIF' : 'INACTIF'}</small><h1>{form.title}</h1><p>{form.description || 'Configurez les champs et la logique conditionnelle de ce formulaire.'}</p></div>
        <button style={secondaryBtnStyle} onClick={onBack}>◄ Retour</button>
      </header>
      {error && <div className="alert">{error}</div>}
      <div className="candidate-tabs">
        <button className={tab === 'fields' ? 'active' : ''} onClick={() => setTab('fields')}>Champs ({fields.length})</button>
        <button className={tab === 'conditions' ? 'active' : ''} onClick={() => setTab('conditions')}>Conditions ({conditions.length})</button>
      </div>

      {loading ? <div className="loading">Chargement…</div> : tab === 'fields' ? <>
        <div className="modal-actions" style={{ justifyContent: 'flex-start', margin: '16px 0' }}>
          <button style={primaryBtnStyle} onClick={() => setFieldModal('new')}>＋ Ajouter un champ</button>
        </div>
        <section className="table-card">
          <div className="table">
            <div className="tr head"><span>Ordre</span><span>Label</span><span>Type</span><span>Obligatoire</span><span>Visible</span><span>Actions</span></div>
            {sortedFields.length === 0 ? <div className="loading">Aucun champ dans ce formulaire.</div>
              : sortedFields.map(field => <div className="tr" key={field.id}>
                <span>{field.displayOrder}</span>
                <span><b>{field.label}</b></span>
                <span><em>{nice(field.fieldType)}</em></span>
                <span><em className={field.required ? 'active' : ''}>{field.required ? 'Oui' : 'Non'}</em></span>
                <span><em className={field.defaultVisible ? 'active' : ''}>{field.defaultVisible ? 'Oui' : 'Non'}</em></span>
                <span className="actions">
                  <button style={secondaryBtnStyle} onClick={() => setFieldModal(field)}>Modifier</button>
                  {optionTypes.includes(field.fieldType) && <button style={secondaryBtnStyle} onClick={() => setOptionsFor(field)}>Options</button>}
                  <button style={dangerBtnStyle} onClick={() => deleteField(field)}>Supprimer</button>
                </span>
              </div>)}
          </div>
        </section>
      </> : <>
        <div className="modal-actions" style={{ justifyContent: 'flex-start', margin: '16px 0' }}>
          <button style={primaryBtnStyle} disabled={fields.length < 2} onClick={() => setConditionModal('new')}>＋ Ajouter une condition</button>
          {fields.length < 2 && <small style={{ alignSelf: 'center', color: '#8490a3' }}>Il faut au moins 2 champs pour créer une condition.</small>}
        </div>
        <section className="table-card">
          <div className="table">
            <div className="tr head"><span>Si (source)</span><span>Opérateur</span><span>Valeur</span><span>Alors</span><span>Champ cible</span><span>Actions</span></div>
            {conditions.length === 0 ? <div className="loading">Aucune règle conditionnelle définie.</div>
              : conditions.map(condition => <div className="tr" key={condition.id}>
                <span><b>{condition.sourceFieldLabel}</b></span>
                <span><em>{nice(condition.operator)}</em></span>
                <span>{condition.expectedValue || '—'}</span>
                <span><em>{nice(condition.action)}</em></span>
                <span><b>{condition.targetFieldLabel}</b></span>
                <span className="actions">
                  <button style={secondaryBtnStyle} onClick={() => setConditionModal(condition)}>Modifier</button>
                  <button style={dangerBtnStyle} onClick={() => deleteCondition(condition)}>Supprimer</button>
                </span>
              </div>)}
          </div>
        </section>
      </>}
    </main>

    {fieldModal && <FieldModal
      session={session}
      formId={form.id}
      field={fieldModal === 'new' ? null : fieldModal}
      nextOrder={fields.length + 1}
      close={() => setFieldModal(null)}
      done={() => { setFieldModal(null); load(); }}
    />}
    {optionsFor && <OptionsModal session={session} formId={form.id} field={optionsFor} close={() => setOptionsFor(null)} />}
    {conditionModal && <ConditionModal
      session={session}
      formId={form.id}
      fields={sortedFields}
      condition={conditionModal === 'new' ? null : conditionModal}
      close={() => setConditionModal(null)}
      done={() => { setConditionModal(null); load(); }}
    />}
  </div>;
}

// ==================== Modal creation/edition d'un champ ====================

function FieldModal({ session, formId, field, nextOrder, close, done }: {
  session: Session; formId: number; field: FieldItem | null; nextOrder: number; close: () => void; done: () => void;
}) {
  const [label, setLabel] = useState(field?.label ?? '');
  const [fieldType, setFieldType] = useState<FieldType>(field?.fieldType ?? 'TEXT');
  const [required, setRequired] = useState(field?.required ?? false);
  const [placeholder, setPlaceholder] = useState(field?.placeholder ?? '');
  const [defaultVisible, setDefaultVisible] = useState(field?.defaultVisible ?? true);
  const [displayOrder, setDisplayOrder] = useState(field?.displayOrder ?? nextOrder);
  const [minimumLength, setMinimumLength] = useState(field?.minimumLength?.toString() ?? '');
  const [maximumLength, setMaximumLength] = useState(field?.maximumLength?.toString() ?? '');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      label, fieldType, required, placeholder: placeholder || undefined, defaultVisible, displayOrder,
      minimumLength: minimumLength ? Number(minimumLength) : undefined,
      maximumLength: maximumLength ? Number(maximumLength) : undefined,
    };
    try {
      if (field) {
        await request(`/api/forms/${formId}/fields/${field.id}`, session.accessToken, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await request(`/api/forms/${formId}/fields`, session.accessToken, { method: 'POST', body: JSON.stringify(payload) });
      }
      done();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'enregistrer le champ.');
      setBusy(false);
    }
  };

  return <div className="overlay" onMouseDown={e => e.target === e.currentTarget && close()}>
    <form className="modal" onSubmit={submit}>
      <button type="button" className="close" onClick={close}>×</button>
      <small>{field ? 'MODIFIER LE CHAMP' : 'NOUVEAU CHAMP'}</small>
      <h2>{field ? 'Modifier le champ' : 'Ajouter un champ'}</h2>
      {error && <div className="alert">{error}</div>}
      <label>Label<input required value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Diplôme requis" /></label>
      <div className="two">
        <label>Type de champ<select value={fieldType} onChange={e => setFieldType(e.target.value as FieldType)}>{fieldTypes.map(type => <option key={type} value={type}>{nice(type)}</option>)}</select></label>
        <label>Ordre d'affichage<input type="number" min={1} required value={displayOrder} onChange={e => setDisplayOrder(Number(e.target.value))} /></label>
      </div>
      <label>Placeholder <small>(optionnel)</small><input value={placeholder} onChange={e => setPlaceholder(e.target.value)} /></label>
      <div className="two">
        <label>Longueur min <small>(optionnel)</small><input type="number" min={0} value={minimumLength} onChange={e => setMinimumLength(e.target.value)} /></label>
        <label>Longueur max <small>(optionnel)</small><input type="number" min={0} value={maximumLength} onChange={e => setMaximumLength(e.target.value)} /></label>
      </div>
      <div className="two">
        <label className="check"><input type="checkbox" checked={required} onChange={e => setRequired(e.target.checked)} /> Champ obligatoire</label>
        <label className="check"><input type="checkbox" checked={defaultVisible} onChange={e => setDefaultVisible(e.target.checked)} /> Visible par défaut</label>
      </div>
      {!field && optionTypes.includes(fieldType) && <small style={{ color: '#8490a3' }}>Vous pourrez ajouter les options de ce champ juste après sa création.</small>}
      <div className="modal-actions">
        <button type="button" style={modalCancelBtnStyle} onClick={close}>Annuler</button>
        <button style={primaryBtnStyle} disabled={busy}>{busy ? 'Enregistrement…' : field ? 'Enregistrer' : 'Ajouter'}</button>
      </div>
    </form>
  </div>;
}

// ==================== Modal gestion des options d'un champ ====================

function OptionsModal({ session, formId, field, close }: { session: Session; formId: number; field: FieldItem; close: () => void }) {
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [label, setLabel] = useState(''), [value, setValue] = useState(''), [error, setError] = useState(''), [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    request<OptionItem[]>(`/api/forms/${formId}/fields/${field.id}/options`, session.accessToken)
      .then(setOptions).catch(err => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addOption = async (e: FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !value.trim()) return;
    try {
      await request(`/api/forms/${formId}/fields/${field.id}/options`, session.accessToken, {
        method: 'POST',
        body: JSON.stringify({ label, value, displayOrder: options.length + 1 }),
      });
      setLabel(''); setValue(''); load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'ajouter l\'option.');
    }
  };

  const deleteOption = async (option: OptionItem) => {
    try {
      await request(`/api/forms/${formId}/fields/${field.id}/options/${option.id}`, session.accessToken, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de supprimer l\'option.');
    }
  };

  return <div className="overlay" onMouseDown={e => e.target === e.currentTarget && close()}>
    <div className="modal">
      <button type="button" className="close" onClick={close}>×</button>
      <small>OPTIONS DU CHAMP</small>
      <h2>{field.label}</h2>
      {error && <div className="alert">{error}</div>}
      <form className="two" onSubmit={addOption} style={{ alignItems: 'end', marginBottom: 8 }}>
        <label>Label affiché<input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: Bac+5 Finance" /></label>
        <label>Valeur stockée<input value={value} onChange={e => setValue(e.target.value)} placeholder="Ex: BAC5_FINANCE" /></label>
        <button style={{ ...primaryBtnStyle, gridColumn: '1/-1' }}>＋ Ajouter l'option</button>
      </form>
      {loading ? <div className="loading">Chargement…</div> : options.length === 0 ? <p style={{ color: '#8490a3' }}>Aucune option pour ce champ.</p> : (
        <div className="table">
          {options.sort((a, b) => a.displayOrder - b.displayOrder).map(option => <div className="tr" key={option.id} style={{ gridTemplateColumns: '1fr 1fr auto', minWidth: 'auto' }}>
            <span><b>{option.label}</b></span>
            <span>{option.value}</span>
            <span className="actions"><button style={dangerBtnStyle} onClick={() => deleteOption(option)}>Supprimer</button></span>
          </div>)}
        </div>
      )}
      <div className="modal-actions"><button style={modalCancelBtnStyle} onClick={close}>Fermer</button></div>
    </div>
  </div>;
}

// ==================== Modal creation/edition d'une condition ====================

function ConditionModal({ session, formId, fields, condition, close, done }: {
  session: Session; formId: number; fields: FieldItem[]; condition: ConditionItem | null; close: () => void; done: () => void;
}) {
  const [sourceFieldId, setSourceFieldId] = useState<number>(condition?.sourceFieldId ?? fields[0]?.id ?? 0);
  const [targetFieldId, setTargetFieldId] = useState<number>(condition?.targetFieldId ?? fields[1]?.id ?? 0);
  const [operator, setOperator] = useState<ConditionOperator>(condition?.operator ?? 'EQUALS');
  const [expectedValue, setExpectedValue] = useState(condition?.expectedValue ?? '');
  const [action, setAction] = useState<ConditionAction>(condition?.action ?? 'SHOW');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sourceFieldId === targetFieldId) { setError('Le champ source et le champ cible doivent être différents.'); return; }
    setBusy(true);
    const payload = { sourceFieldId, targetFieldId, operator, expectedValue: expectedValue || undefined, action };
    try {
      if (condition) {
        await request(`/api/forms/${formId}/conditions/${condition.id}`, session.accessToken, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await request(`/api/forms/${formId}/conditions`, session.accessToken, { method: 'POST', body: JSON.stringify(payload) });
      }
      done();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d\'enregistrer la condition.');
      setBusy(false);
    }
  };

  return <div className="overlay" onMouseDown={e => e.target === e.currentTarget && close()}>
    <form className="modal" onSubmit={submit}>
      <button type="button" className="close" onClick={close}>×</button>
      <small>{condition ? 'MODIFIER LA CONDITION' : 'NOUVELLE CONDITION'}</small>
      <h2>Logique conditionnelle</h2>
      {error && <div className="alert">{error}</div>}
      <label>Champ source (celui qui déclenche)
        <select value={sourceFieldId} onChange={e => setSourceFieldId(Number(e.target.value))}>
          {fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </label>
      <div className="two">
        <label>Opérateur<select value={operator} onChange={e => setOperator(e.target.value as ConditionOperator)}>{operators.map(op => <option key={op} value={op}>{nice(op)}</option>)}</select></label>
        <label>Valeur attendue <small>(optionnel selon l'opérateur)</small><input value={expectedValue} onChange={e => setExpectedValue(e.target.value)} placeholder="Ex: true" /></label>
      </div>
      <label>Action sur le champ cible<select value={action} onChange={e => setAction(e.target.value as ConditionAction)}>{actions.map(a => <option key={a} value={a}>{nice(a)}</option>)}</select></label>
      <label>Champ cible (celui affecté par l'action)
        <select value={targetFieldId} onChange={e => setTargetFieldId(Number(e.target.value))}>
          {fields.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
        </select>
      </label>
      <div className="modal-actions">
        <button type="button" style={modalCancelBtnStyle} onClick={close}>Annuler</button>
        <button style={primaryBtnStyle} disabled={busy}>{busy ? 'Enregistrement…' : condition ? 'Enregistrer' : 'Créer la règle'}</button>
      </div>
    </form>
  </div>;
}
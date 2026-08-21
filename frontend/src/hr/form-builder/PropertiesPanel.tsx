import { useState } from 'react';
import type { BuilderElement, JobOffer } from './types';

type Tab = 'CONTENT' | 'STYLE' | 'VALIDATION' | 'LOGIC';
const tabs: { id: Tab; label: string }[] = [{ id: 'CONTENT', label: 'Content' }, { id: 'STYLE', label: 'Style' }, { id: 'VALIDATION', label: 'Validate' }, { id: 'LOGIC', label: 'Logic' }];

export function PropertiesPanel({ element, elements, collapsed, onToggle, onChange, onOpenSettings }: {
  element?: BuilderElement; elements: BuilderElement[]; collapsed: boolean; onToggle: () => void;
  onChange: (patch: Partial<BuilderElement>) => void; onOpenSettings: () => void; offers: JobOffer[];
}) {
  const [tab, setTab] = useState<Tab>('CONTENT');
  if (collapsed) return <aside className="fb-properties collapsed"><button className="fb-panel-toggle" onClick={onToggle} title="Open properties">‹</button></aside>;
  return <aside className="fb-properties">
    <div className="fb-panel-head"><button className="fb-icon-btn" onClick={onToggle}>›</button><div><small>INSPECT</small><h2>Properties</h2></div><button className="fb-icon-btn" onClick={onOpenSettings} title="Form settings">⚙</button></div>
    {!element ? <div className="fb-no-selection"><span>◎</span><h3>Nothing selected</h3><p>Select a field on the canvas to edit its content, style and rules.</p><button onClick={onOpenSettings}>Open form settings</button></div> : <>
      <div className="fb-selected-summary"><span>{element.kind === 'cv' ? '↑' : 'T'}</span><div><small>SELECTED FIELD</small><b>{element.label}</b></div><em>{element.fieldType}</em></div>
      <div className="fb-property-tabs">{tabs.map(item => <button className={tab === item.id ? 'active' : ''} key={item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>
      <div className="fb-properties-scroll">
        {tab === 'CONTENT' && <>
          <PropertySection title="Field content">
            <Field label="Label"><input value={element.label} onChange={e => onChange({ label: e.target.value })}/></Field>
            <Field label="Placeholder"><input value={element.placeholder || ''} placeholder="Candidate-facing hint" onChange={e => onChange({ placeholder: e.target.value })}/></Field>
            <Field label="Help text"><textarea value={element.help || ''} placeholder="Optional supporting text" onChange={e => onChange({ help: e.target.value })}/></Field>
            <Field label="Internal field name"><div className="fb-prefix-input"><span>#</span><input value={element.internalName} onChange={e => onChange({ internalName: e.target.value })}/></div></Field>
            <Field label="Default value"><input value={element.defaultValue || ''} onChange={e => onChange({ defaultValue: e.target.value })}/></Field>
          </PropertySection>
          {element.options && <PropertySection title="Options"><div className="fb-option-editor">{element.options.map((option, index) => <div key={`${index}-${option}`}><i>⠿</i><input value={option} onChange={e => { const next = [...element.options!]; next[index] = e.target.value; onChange({ options: next }); }}/><button onClick={() => onChange({ options: element.options!.filter((_, i) => i !== index) })}>×</button></div>)}<button className="fb-add-option" onClick={() => onChange({ options: [...element.options!, `Option ${element.options!.length + 1}`] })}>+ Add option</button></div></PropertySection>}
          {element.kind === 'cv' && <PropertySection title="Upload rules"><Field label="Allowed formats"><input value={element.acceptedFormats || ''} onChange={e => onChange({ acceptedFormats: e.target.value })}/></Field><Field label="Maximum file size"><div className="fb-suffix-input"><input type="number" value={element.maxFileSize || 10} onChange={e => onChange({ maxFileSize: Number(e.target.value) })}/><span>MB</span></div></Field><Toggle label="Allow multiple files" value={!!element.multiple} onChange={multiple => onChange({ multiple })}/></PropertySection>}
        </>}
        {tab === 'STYLE' && <>
          <PropertySection title="Layout"><Field label="Width"><div className="fb-segmented">{(['100','50','33'] as const).map(value => <button className={element.width === value ? 'active' : ''} key={value} onClick={() => onChange({ width: value })}>{value === '100' ? 'Full' : `${value}%`}</button>)}</div></Field><div className="fb-two-fields"><Field label="X position"><input type="number" min="0" step="8" value={element.x ?? 0} onChange={e => onChange({ x: Number(e.target.value) || 0 })}/></Field><Field label="Y position"><input type="number" min="0" step="8" value={element.y ?? 0} onChange={e => onChange({ y: Number(e.target.value) || 0 })}/></Field></div><Field label="Alignment"><div className="fb-segmented icon">{(['left','center','right'] as const).map(value => <button className={element.align === value ? 'active' : ''} key={value} onClick={() => onChange({ align: value })}>{value === 'left' ? '≡' : value === 'center' ? '≡' : '≡'}</button>)}</div></Field></PropertySection>
          <PropertySection title="Appearance"><Field label={`Border radius · ${element.radius}px`}><input type="range" min="0" max="24" value={element.radius} onChange={e => onChange({ radius: Number(e.target.value) })}/></Field><Field label={`Bottom spacing · ${element.spacing}px`}><input type="range" min="8" max="40" value={element.spacing} onChange={e => onChange({ spacing: Number(e.target.value) })}/></Field><Field label="Label position"><select value={element.labelPosition} onChange={e => onChange({ labelPosition: e.target.value as BuilderElement['labelPosition'] })}><option value="top">Above field</option><option value="left">Beside field</option><option value="hidden">Hidden</option></select></Field></PropertySection>
        </>}
        {tab === 'VALIDATION' && <>
          <PropertySection title="Requirements"><Toggle label="Required field" value={element.required} onChange={required => onChange({ required })}/><div className="fb-two-fields"><Field label="Minimum length"><input type="number" value={element.minLength || ''} onChange={e => onChange({ minLength: Number(e.target.value) || undefined })}/></Field><Field label="Maximum length"><input type="number" value={element.maxLength || ''} onChange={e => onChange({ maxLength: Number(e.target.value) || undefined })}/></Field></div><Field label="Validation message"><textarea value={element.validationMessage || ''} placeholder={`${element.label} is required`} onChange={e => onChange({ validationMessage: e.target.value })}/></Field></PropertySection>
          <div className="fb-tip"><span>✦</span><p><b>Candidate-friendly validation</b>Explain what went wrong and how to fix it in one sentence.</p></div>
        </>}
        {tab === 'LOGIC' && <>
          <PropertySection title="Conditional visibility"><div className="fb-rule-lead"><span>SHOW THIS FIELD</span><small>when the conditions below are met</small></div><Field label="If"><select value={element.logic?.sourceId || ''} onChange={e => onChange({ logic: { sourceId: e.target.value, operator: element.logic?.operator || 'EQUALS', value: element.logic?.value || '', join: element.logic?.join || 'AND' } })}><option value="">Choose a field…</option>{elements.filter(item => item.id !== element.id).map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field><Field label="Operator"><select value={element.logic?.operator || 'EQUALS'} onChange={e => onChange({ logic: { sourceId: element.logic?.sourceId || '', operator: e.target.value as 'EQUALS', value: element.logic?.value || '', join: element.logic?.join || 'AND' } })}><option value="EQUALS">equals</option><option value="NOT_EQUALS">does not equal</option><option value="CONTAINS">contains</option></select></Field><Field label="Value"><input value={element.logic?.value || ''} placeholder="e.g. Yes" onChange={e => onChange({ logic: { sourceId: element.logic?.sourceId || '', operator: element.logic?.operator || 'EQUALS', value: e.target.value, join: element.logic?.join || 'AND' } })}/></Field><button className="fb-add-condition">+ Add condition</button></PropertySection>
          <div className="fb-tip logic"><span>⌁</span><p><b>Connected to FieldCondition</b>This rule will be mapped to the existing conditional logic model when saved.</p></div>
        </>}
      </div>
    </>}
  </aside>;
}

function PropertySection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="fb-property-section"><h3>{title}</h3>{children}</section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="fb-property-field"><span>{label}</span>{children}</label>; }
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <label className="fb-toggle-row"><span>{label}</span><button type="button" role="switch" aria-checked={value} className={value ? 'on' : ''} onClick={() => onChange(!value)}><i/></button></label>; }

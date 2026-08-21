import { useState } from 'react';
import { FormElement } from './FormElement';
import type { BuilderDraft, FormTemplate, JobOffer } from './types';

export function TemplateSelector({ templates, onClose, onSelect, onDelete }: {
  templates: FormTemplate[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const customTemplates = templates.filter(template => template.custom);
  const builtInTemplates = templates.filter(template => !template.custom);
  return <div className="fb-modal-backdrop" onMouseDown={onClose}>
    <div className="fb-modal fb-template-modal" onMouseDown={e => e.stopPropagation()}>
      <div className="fb-modal-head"><div><small>FORM TEMPLATES</small><h2>Choose a starting point</h2><p>Use a saved structure to create a recruitment form faster.</p></div><button onClick={onClose}>x</button></div>
      <div className="fb-template-section"><h3>Platform templates</h3><div className="fb-template-grid">{builtInTemplates.map((template, index) => <button key={template.id} onClick={() => onSelect(template.id)}><div className={`fb-template-thumb ${template.accent}`}><i className="bar"/><i/><i/><i/><span>{index === 0 ? '+' : 'BF'}</span></div><b>{template.title}</b><small>{template.description}</small></button>)}</div></div>
      <div className="fb-template-section"><h3>My templates</h3>{customTemplates.length === 0 ? <div className="fb-template-empty">No saved template yet.</div> : <div className="fb-template-grid">{customTemplates.map(template => <article className="fb-template-card" key={template.id}><button onClick={() => onSelect(template.id)}><div className={`fb-template-thumb ${template.accent}`}><i className="bar"/><i/><i/><i/><span>MY</span></div><b>{template.title}</b><small>{template.description}</small></button><button className="fb-delete-template" onClick={() => onDelete(template.id)}>Delete</button></article>)}</div>}</div>
    </div>
  </div>;
}

export function SaveTemplateDialog({ draft, onClose, onSave }: {
  draft: BuilderDraft;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}) {
  const [title, setTitle] = useState(draft.name === 'Untitled recruitment form' ? '' : draft.name);
  const [description, setDescription] = useState(draft.description || '');
  const canSave = title.trim().length > 1;
  return <div className="fb-modal-backdrop" onMouseDown={onClose}>
    <form className="fb-modal fb-settings-modal" onSubmit={event => { event.preventDefault(); if (canSave) onSave(title.trim(), description.trim() || 'Reusable recruitment form template.'); }} onMouseDown={e => e.stopPropagation()}>
      <div className="fb-modal-head"><div><small>SAVE TEMPLATE</small><h2>Create a reusable template</h2><p>Save the current fields, layout and steps so you can reuse them later.</p></div><button type="button" onClick={onClose}>x</button></div>
      <div className="fb-settings-fields">
        <label><span>Template name</span><input autoFocus value={title} placeholder="e.g. Graduate programme application" onChange={e => setTitle(e.target.value)}/></label>
        <label><span>Description</span><textarea rows={3} value={description} placeholder="When should this template be used?" onChange={e => setDescription(e.target.value)}/></label>
      </div>
      <div className="fb-modal-actions"><button type="button" onClick={onClose}>Cancel</button><button className="primary" disabled={!canSave}>Save template</button></div>
    </form>
  </div>;
}

export function PublishDialog({ draft, onClose, onPublish, busy }: { draft: BuilderDraft; onClose: () => void; onPublish: () => void; busy: boolean }) {
  const fields = draft.steps.flatMap(step => step.elements);
  return <div className="fb-modal-backdrop"><div className="fb-modal fb-publish-modal"><div className="fb-publish-mark">Go</div><small>READY TO GO LIVE?</small><h2>Publish this form</h2><p>Once published, candidates can submit applications through this form.</p><div className="fb-publish-summary"><div><span>Form name</span><b>{draft.name}</b></div><div><span>Job offer</span><b>Software Engineer</b></div><div><span>Fields</span><b>{fields.length}</b></div><div><span>Required</span><b>{fields.filter(field => field.required).length}</b></div><div><span>Steps</span><b>{draft.steps.length}</b></div></div><div className="fb-modal-actions"><button onClick={onClose}>Cancel</button><button className="primary" disabled={busy} onClick={onPublish}>{busy ? 'Publishing...' : 'Publish form'}</button></div></div></div>;
}

export function SettingsDialog({ draft, offers, onChange, onClose }: { draft: BuilderDraft; offers: JobOffer[]; onChange: (patch: Partial<BuilderDraft>) => void; onClose: () => void }) {
  return <div className="fb-modal-backdrop" onMouseDown={onClose}><div className="fb-modal fb-settings-modal" onMouseDown={e => e.stopPropagation()}><div className="fb-modal-head"><div><small>FORM CONFIGURATION</small><h2>Form settings</h2><p>General details, submission behaviour and candidate experience.</p></div><button onClick={onClose}>x</button></div><div className="fb-settings-layout"><nav><button className="active">General</button><button>Submission</button><button>Branding</button></nav><div className="fb-settings-fields"><label><span>Form name</span><input value={draft.name} onChange={e => onChange({ name: e.target.value })}/></label><label><span>Description</span><textarea rows={3} value={draft.description} onChange={e => onChange({ description: e.target.value })}/></label><label><span>Associated job offer</span><select value={draft.jobOfferId || ''} onChange={e => onChange({ jobOfferId: Number(e.target.value) || undefined })}><option value="">No offer selected</option>{offers.map(offer => <option key={offer.id} value={offer.id}>{offer.title}{offer.department ? ` - ${offer.department}` : ''}</option>)}</select></label><label><span>Success message</span><textarea rows={2} value={draft.successMessage} onChange={e => onChange({ successMessage: e.target.value })}/></label><SettingToggle label="Allow candidates to save a draft" value={draft.allowDraft} onChange={allowDraft => onChange({ allowDraft })}/><SettingToggle label="Allow editing after submission" value={draft.allowEditing} onChange={allowEditing => onChange({ allowEditing })}/></div></div><div className="fb-modal-actions"><button onClick={onClose}>Cancel</button><button className="primary" onClick={onClose}>Save settings</button></div></div></div>;
}

/**
 * PreviewMode - apercu du formulaire tel que le candidat le verra.
 *
 * IMPORTANT (changement demande) :
 * - Plus de titre de page ni de description generes automatiquement
 *   (l'admin RH ajoute lui-meme un element "titre"/"texte" sur le canvas
 *   s'il en veut un).
 * - Plus de boutons "Back"/"Continue"/"Submit application" generes
 *   automatiquement dans le corps du formulaire -- l'admin place ses
 *   propres boutons comme elements du canvas.
 * - La navigation entre pages pendant l'apercu se fait desormais via
 *   une petite pagination dans l'en-tete (chrome de l'outil, distincte
 *   du formulaire lui-meme), pour ne pas perdre la possibilite de
 *   tester un formulaire multi-pages.
 */
export function PreviewMode({ draft, stepIndex, device, onDevice, onStep, onClose }: { draft: BuilderDraft; stepIndex: number; device: string; onDevice: (value: string) => void; onStep: (value: number) => void; onClose: () => void }) {
  const step = draft.steps[stepIndex];
  const hasMultipleSteps = draft.steps.length > 1;

  const handleNavigate = (role: string) => {
    if (role === 'next') onStep(Math.min(draft.steps.length - 1, stepIndex + 1));
    else if (role === 'back') onStep(Math.max(0, stepIndex - 1));
    else if (role === 'submit') alert('Aperçu : la candidature serait envoyée ici.');
  };

  return <div className="fb-preview-mode">
    <header>
      <div>
        <button onClick={onClose}>Back</button>
        <span><b>Preview mode</b><small>Interactive candidate experience</small></span>
      </div>
      {hasMultipleSteps && (
        <div className="fb-preview-devices">
          <button disabled={stepIndex === 0} onClick={() => onStep(Math.max(0, stepIndex - 1))}>‹</button>
          <span style={{ padding: '0 10px', display: 'flex', alignItems: 'center', fontSize: 10 }}>Page {stepIndex + 1} / {draft.steps.length}</span>
          <button disabled={stepIndex === draft.steps.length - 1} onClick={() => onStep(Math.min(draft.steps.length - 1, stepIndex + 1))}>›</button>
        </div>
      )}
      <div className="fb-preview-devices">
        <button className={device === 'desktop' ? 'active' : ''} onClick={() => onDevice('desktop')}>Desktop</button>
        <button className={device === 'tablet' ? 'active' : ''} onClick={() => onDevice('tablet')}>Tablet</button>
        <button className={device === 'mobile' ? 'active' : ''} onClick={() => onDevice('mobile')}>Mobile</button>
      </div>
      <button className="fb-close-preview" onClick={onClose}>Close preview</button>
    </header>
    <main>
      <div className={`fb-preview-frame ${device}`}>
        <div className="fb-preview-form">
          <div className="fb-preview-brand"><span>BF</span><b>BFRECRUIT</b></div>
          {hasMultipleSteps && (
            <div className="fb-preview-progress">
              <span>STEP {stepIndex + 1} OF {draft.steps.length}</span>
              <i><b style={{ width: `${((stepIndex + 1) / draft.steps.length) * 100}%` }}/></i>
            </div>
          )}
          <div className="fb-preview-fields">
            {step.elements.map(element => <FormElement key={element.id} element={element} selected={false} preview onNavigate={handleNavigate} />)}
          </div>
        </div>
      </div>
    </main>
  </div>;
}

function SettingToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <label className="fb-setting-toggle"><span><b>{label}</b><small>Candidate experience preference</small></span><button type="button" className={value ? 'on' : ''} onClick={() => onChange(!value)}><i/></button></label>; }

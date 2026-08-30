import { useState } from 'react';
import { FormElement } from './FormElement';
import type { BuilderDraft, FormTemplate, JobOffer } from './types';

type ModalProps = {
  children: React.ReactNode;
  className?: string;
  onClose: () => void;
  closeDisabled?: boolean;
};

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: 14,
  right: 16,
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  borderRadius: 8,
  background: 'transparent',
  color: '#718096',
  fontSize: 22,
  fontWeight: 400,
  lineHeight: 1,
  cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
  height: 40,
  padding: '0 18px',
  border: '1px solid #dce2ea',
  borderRadius: 9,
  background: '#fff',
  color: '#17243e',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const primaryButtonStyle: React.CSSProperties = {
  height: 40,
  padding: '0 20px',
  border: '1px solid #128c78',
  borderRadius: 9,
  background: '#128c78',
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

function Modal({
  children,
  className = '',
  onClose,
  closeDisabled = false,
}: ModalProps) {
  return (
    <div
      className="fb-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !closeDisabled
        ) {
          onClose();
        }
      }}
    >
      <div
        className={`fb-modal ${className}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="fb-modal-close"
          style={closeButtonStyle}
          onClick={onClose}
          disabled={closeDisabled}
          aria-label="Close"
        >
          ×
        </button>

        {children}
      </div>
    </div>
  );
}

function DialogHeader({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div
      className={
        centered
          ? 'fb-modal-head fb-modal-head-centered'
          : 'fb-modal-head'
      }
    >
      <small>{eyebrow}</small>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function DialogActions({
  onClose,
  onConfirm,
  confirmLabel,
  busy = false,
  disabled = false,
}: {
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="fb-modal-actions-row">
      <button
        type="button"
        className="fb-modal-button fb-modal-button-secondary"
        style={{
          ...secondaryButtonStyle,
          opacity: busy ? 0.6 : 1,
          cursor: busy ? 'not-allowed' : 'pointer',
        }}
        onClick={onClose}
        disabled={busy}
      >
        Cancel
      </button>

      <button
        type="button"
        className="fb-modal-button fb-modal-button-primary"
        style={{
          ...primaryButtonStyle,
          opacity: busy || disabled ? 0.6 : 1,
          cursor:
            busy || disabled
              ? 'not-allowed'
              : 'pointer',
        }}
        onClick={onConfirm}
        disabled={busy || disabled}
      >
        {busy ? 'Publishing…' : confirmLabel}
      </button>
    </div>
  );
}

function PublishStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="fb-publish-stat">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function SettingToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="fb-setting-toggle">
      <span>
        <b>{label}</b>
        <small>Candidate experience preference</small>
      </span>

      <button
        type="button"
        className={value ? 'on' : ''}
        onClick={() => onChange(!value)}
      >
        <i />
      </button>
    </label>
  );
}

export function TemplateSelector({
  templates,
  onClose,
  onSelect,
  onDelete,
}: {
  templates: FormTemplate[];
  onClose: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const customTemplates = templates.filter(
    (template) => template.custom
  );

  const builtInTemplates = templates.filter(
    (template) => !template.custom
  );

  return (
    <Modal
      className="fb-template-modal"
      onClose={onClose}
    >
      <DialogHeader
        eyebrow="FORM TEMPLATES"
        title="Choose a starting point"
        description="Use a saved structure to create a recruitment form faster."
      />

      <section className="fb-template-section">
        <h3>Platform templates</h3>

        <div className="fb-template-grid">
          {builtInTemplates.map((template, index) => (
            <button
              key={template.id}
              type="button"
              className="fb-template-card-button"
              onClick={() => onSelect(template.id)}
            >
              <div
                className={`fb-template-thumb ${template.accent}`}
              >
                <i className="bar" />
                <i />
                <i />
                <i />
                <span>{index === 0 ? '+' : 'BF'}</span>
              </div>

              <b>{template.title}</b>
              <small>{template.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="fb-template-section">
        <h3>My templates</h3>

        {customTemplates.length === 0 ? (
          <div className="fb-template-empty">
            No saved template yet.
          </div>
        ) : (
          <div className="fb-template-grid">
            {customTemplates.map((template) => (
              <article
                className="fb-template-card"
                key={template.id}
              >
                <button
                  type="button"
                  className="fb-template-card-button"
                  onClick={() => onSelect(template.id)}
                >
                  <div
                    className={`fb-template-thumb ${template.accent}`}
                  >
                    <i className="bar" />
                    <i />
                    <i />
                    <i />
                    <span>MY</span>
                  </div>

                  <b>{template.title}</b>
                  <small>{template.description}</small>
                </button>

                <button
                  type="button"
                  className="fb-delete-template"
                  onClick={() => onDelete(template.id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </Modal>
  );
}

export function SaveTemplateDialog({
  draft,
  onClose,
  onSave,
}: {
  draft: BuilderDraft;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}) {
  const [title, setTitle] = useState(
    draft.name === 'Untitled recruitment form'
      ? ''
      : draft.name
  );

  const [description, setDescription] = useState(
    draft.description || ''
  );

  const canSave = title.trim().length > 1;

  return (
    <Modal
      className="fb-save-template-modal"
      onClose={onClose}
    >
      <DialogHeader
        eyebrow="SAVE TEMPLATE"
        title="Create a reusable template"
        description="Save the current fields, layout and steps so you can reuse them later."
      />

      <div className="fb-settings-fields">
        <label>
          <span>Template name</span>

          <input
            autoFocus
            value={title}
            placeholder="e.g. Graduate programme application"
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />
        </label>

        <label>
          <span>
            Description <em>(optional)</em>
          </span>

          <textarea
            rows={4}
            value={description}
            placeholder="When should this template be used?"
            onChange={(event) =>
              setDescription(event.target.value)
            }
          />
        </label>
      </div>

      <DialogActions
        onClose={onClose}
        onConfirm={() => {
          if (!canSave) return;

          onSave(
            title.trim(),
            description.trim() ||
              'Reusable recruitment form template.'
          );
        }}
        confirmLabel="Save template"
        disabled={!canSave}
      />
    </Modal>
  );
}

export function PublishDialog({
  draft,
  offers,
  onClose,
  onPublish,
  onLinkOffer,
  busy,
}: {
  draft: BuilderDraft;
  offers?: JobOffer[];
  onClose: () => void;
  onPublish: () => void;
  onLinkOffer: (offerId: number | undefined) => void;
  busy: boolean;
}) {
  const fields = draft.steps.flatMap(
    (step) => step.elements
  );

  const requiredCount = fields.filter(
    (field) => field.required
  ).length;

  return (
    <Modal
      className="fb-publish-modal"
      onClose={onClose}
      closeDisabled={busy}
    >
      <DialogHeader
        centered
        eyebrow="READY TO GO LIVE?"
        title="Publish this form"
        description="Once published, candidates can submit applications through this form."
      />

      <div className="fb-publish-summary">
        <div className="fb-publish-info-row">
          <span>Form name</span>

          <b title={draft.name || '—'}>
            {draft.name || '—'}
          </b>
        </div>

        <div className="fb-publish-offer-field">
          <label htmlFor="publish-job-offer">
            Job offer
          </label>

          <div className="fb-publish-select-wrapper">
            <select
              id="publish-job-offer"
              value={draft.jobOfferId ?? ''}
              disabled={busy}
              onChange={(event) => {
                onLinkOffer(
                  event.target.value
                    ? Number(event.target.value)
                    : undefined
                );
              }}
            >
              <option value="">Not linked</option>

              {(offers ?? []).map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.title}
                  {offer.department
                    ? ` - ${offer.department}`
                    : ''}
                </option>
              ))}
            </select>

            <span aria-hidden="true">⌄</span>
          </div>
        </div>

        <div className="fb-publish-stats">
          <PublishStat
            label="Fields"
            value={fields.length}
          />

          <PublishStat
            label="Required"
            value={requiredCount}
          />

          <PublishStat
            label="Steps"
            value={draft.steps.length}
          />
        </div>
      </div>

      <DialogActions
        onClose={onClose}
        onConfirm={onPublish}
        confirmLabel="Publish form"
        busy={busy}
      />
    </Modal>
  );
}

export function SettingsDialog({
  draft,
  offers,
  onChange,
  onClose,
}: {
  draft: BuilderDraft;
  offers: JobOffer[];
  onChange: (patch: Partial<BuilderDraft>) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      className="fb-settings-modal"
      onClose={onClose}
    >
      <DialogHeader
        eyebrow="FORM CONFIGURATION"
        title="Form settings"
        description="General details, submission behaviour and candidate experience."
      />

      <div className="fb-settings-layout">
        <nav>
          <button type="button" className="active">
            General
          </button>

          <button type="button">Submission</button>
          <button type="button">Branding</button>
        </nav>

        <div className="fb-settings-fields">
          <label>
            <span>Form name</span>

            <input
              value={draft.name}
              onChange={(event) =>
                onChange({
                  name: event.target.value,
                })
              }
            />
          </label>

          <label>
            <span>Description</span>

            <textarea
              rows={3}
              value={draft.description}
              onChange={(event) =>
                onChange({
                  description: event.target.value,
                })
              }
            />
          </label>

          <label>
            <span>Associated job offer</span>

            <select
              value={draft.jobOfferId || ''}
              onChange={(event) =>
                onChange({
                  jobOfferId:
                    Number(event.target.value) || undefined,
                })
              }
            >
              <option value="">No offer selected</option>

              {offers.map((offer) => (
                <option key={offer.id} value={offer.id}>
                  {offer.title}
                  {offer.department
                    ? ` - ${offer.department}`
                    : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Success message</span>

            <textarea
              rows={2}
              value={draft.successMessage}
              onChange={(event) =>
                onChange({
                  successMessage: event.target.value,
                })
              }
            />
          </label>

          <SettingToggle
            label="Allow candidates to save a draft"
            value={draft.allowDraft}
            onChange={(allowDraft) =>
              onChange({ allowDraft })
            }
          />

          <SettingToggle
            label="Allow editing after submission"
            value={draft.allowEditing}
            onChange={(allowEditing) =>
              onChange({ allowEditing })
            }
          />
        </div>
      </div>

      <DialogActions
        onClose={onClose}
        onConfirm={onClose}
        confirmLabel="Save settings"
      />
    </Modal>
  );
}

export function PreviewMode({
  draft,
  stepIndex,
  device,
  onDevice,
  onStep,
  onClose,
}: {
  draft: BuilderDraft;
  stepIndex: number;
  device: string;
  onDevice: (value: string) => void;
  onStep: (value: number) => void;
  onClose: () => void;
}) {
  const step = draft.steps[stepIndex];

  const hasMultipleSteps = draft.steps.length > 1;

  const handleNavigate = (role: string) => {
    if (role === 'next') {
      onStep(
        Math.min(
          draft.steps.length - 1,
          stepIndex + 1
        )
      );
    } else if (role === 'back') {
      onStep(Math.max(0, stepIndex - 1));
    } else if (role === 'submit') {
      alert(
        'Preview: the application would be submitted here.'
      );
    }
  };

  return (
    <div className="fb-preview-mode">
      <header>
        <div>
          <button type="button" onClick={onClose}>
            Back
          </button>

          <span>
            <b>Preview mode</b>
            <small>Interactive candidate experience</small>
          </span>
        </div>

        {hasMultipleSteps && (
          <div className="fb-preview-devices">
            <button
              type="button"
              disabled={stepIndex === 0}
              onClick={() =>
                onStep(Math.max(0, stepIndex - 1))
              }
            >
              ‹
            </button>

            <span className="fb-preview-page-label">
              Page {stepIndex + 1} / {draft.steps.length}
            </span>

            <button
              type="button"
              disabled={
                stepIndex === draft.steps.length - 1
              }
              onClick={() =>
                onStep(
                  Math.min(
                    draft.steps.length - 1,
                    stepIndex + 1
                  )
                )
              }
            >
              ›
            </button>
          </div>
        )}

        <div className="fb-preview-devices">
          <button
            type="button"
            className={
              device === 'desktop' ? 'active' : ''
            }
            onClick={() => onDevice('desktop')}
          >
            Desktop
          </button>

          <button
            type="button"
            className={
              device === 'tablet' ? 'active' : ''
            }
            onClick={() => onDevice('tablet')}
          >
            Tablet
          </button>

          <button
            type="button"
            className={
              device === 'mobile' ? 'active' : ''
            }
            onClick={() => onDevice('mobile')}
          >
            Mobile
          </button>
        </div>

        <button
          type="button"
          className="fb-close-preview"
          onClick={onClose}
        >
          Close preview
        </button>
      </header>

      <main>
        <div className={`fb-preview-frame ${device}`}>
          <div className="fb-preview-form">
            <div className="fb-preview-brand">
              <span>BF</span>
              <b>BFRECRUIT</b>
            </div>

            {hasMultipleSteps && (
              <div className="fb-preview-progress">
                <span>
                  STEP {stepIndex + 1} OF {draft.steps.length}
                </span>

                <i>
                  <b
                    style={{
                      width: `${
                        ((stepIndex + 1) /
                          draft.steps.length) *
                        100
                      }%`,
                    }}
                  />
                </i>
              </div>
            )}

            <div className="fb-preview-fields">
              {step.elements.map((element) => (
                <FormElement
                  key={element.id}
                  element={element}
                  selected={false}
                  preview
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

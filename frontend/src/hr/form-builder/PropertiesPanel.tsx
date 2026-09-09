import { useEffect, useState, type ReactNode } from 'react';
import type { BuilderElement, JobOffer } from './types';

type Tab = 'CONTENT' | 'STYLE' | 'VALIDATION' | 'LOGIC';

type FieldType = BuilderElement['fieldType'];
type ButtonRole = BuilderElement['buttonRole'];
type LogicOperator = 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS';

const tabs: { id: Tab; label: string }[] = [
  { id: 'CONTENT', label: 'Content' },
  { id: 'STYLE', label: 'Style' },
  { id: 'VALIDATION', label: 'Validate' },
  { id: 'LOGIC', label: 'Logic' },
];

type PropertiesPanelProps = {
  element?: BuilderElement;
  elements: BuilderElement[];
  collapsed: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<BuilderElement>) => void;
  onOpenSettings: () => void;
  offers: JobOffer[];
};

export function PropertiesPanel({
  element,
  elements,
  collapsed,
  onToggle,
  onChange,
  onOpenSettings,
  offers: _offers,
}: PropertiesPanelProps) {
  const [tab, setTab] = useState<Tab>('CONTENT');
  const isButton = element?.kind === 'button';

  useEffect(() => {
    setTab('CONTENT');
  }, [element?.id]);

  if (collapsed) {
    return (
      <aside className="fb-properties collapsed">
        <button
          type="button"
          className="fb-panel-toggle"
          onClick={onToggle}
          title="Open properties"
          aria-label="Open properties"
        >
          ‹
        </button>
      </aside>
    );
  }

  return (
    <aside className="fb-properties">
      <div className="fb-panel-head">
        <button
          type="button"
          className="fb-icon-btn"
          onClick={onToggle}
          title="Collapse properties"
          aria-label="Collapse properties"
        >
          ›
        </button>

        <div className="fb-panel-title">
          <small>INSPECT</small>
          <h2>Properties</h2>
        </div>

        <button
          type="button"
          className="fb-icon-btn"
          onClick={onOpenSettings}
          title="Form settings"
          aria-label="Open form settings"
        >
          ⚙
        </button>
      </div>

      {!element ? (
        <div className="fb-no-selection">
          <span>◎</span>
          <h3>Nothing selected</h3>
          <p>
            Select a field on the canvas to edit its content, style and rules.
          </p>
          <button type="button" onClick={onOpenSettings}>
            Open form settings
          </button>
        </div>
      ) : (
        <>
          <div className="fb-selected-summary">
            <span>
              {isButton
                ? '▶'
                : element.fieldType === 'FILE'
                  ? '📎'
                  : element.fieldType === 'RADIO'
                    ? '◉'
                    : element.fieldType === 'CHECKBOX'
                      ? '☑'
                      : 'T'}
            </span>

            <div>
              <small>SELECTED FIELD</small>
              <b>{element.label || 'Untitled field'}</b>
            </div>

            <em>{isButton ? 'BUTTON' : element.fieldType}</em>
          </div>

          <div className="fb-property-tabs">
            {tabs
              .filter(
                item =>
                  !isButton ||
                  item.id === 'CONTENT' ||
                  item.id === 'STYLE',
              )
              .map(item => (
                <button
                  type="button"
                  key={item.id}
                  className={tab === item.id ? 'active' : ''}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
          </div>

          <div className="fb-properties-scroll">
            {tab === 'CONTENT' &&
              (isButton ? (
                <ButtonProperties element={element} onChange={onChange} />
              ) : (
                <FieldContentProperties
                  element={element}
                  onChange={onChange}
                />
              ))}

            {tab === 'STYLE' && (
              <StyleProperties
                element={element}
                isButton={isButton}
                onChange={onChange}
              />
            )}

            {tab === 'VALIDATION' && !isButton && (
              <ValidationProperties element={element} onChange={onChange} />
            )}

            {tab === 'LOGIC' && !isButton && (
              <LogicProperties
                element={element}
                elements={elements}
                onChange={onChange}
              />
            )}
          </div>
        </>
      )}
    </aside>
  );
}

function FieldContentProperties({
  element,
  onChange,
}: {
  element: BuilderElement;
  onChange: (patch: Partial<BuilderElement>) => void;
}) {
  const hasOptions = hasOptionField(element.fieldType);

  return (
    <>
      <PropertySection title="Field content">
        <Field label="Field type">
          <select
            value={element.fieldType}
            onChange={event => {
              const fieldType = event.target.value as FieldType;
              onChange({
                fieldType,
                options: getOptionsForFieldType(fieldType, element.options),
              });
            }}
          >
            <option value="TEXT">Text</option>
            <option value="TEXTAREA">Paragraph</option>
            <option value="NUMBER">Number</option>
            <option value="SELECT">Dropdown</option>
            <option value="MULTI_SELECT">Checkbox group</option>
            <option value="RADIO">Radio button</option>
            <option value="CHECKBOX">Single checkbox</option>
            <option value="FILE">Upload</option>
          </select>
        </Field>

        <Field label="Label">
          <input
            type="text"
            value={element.label || ''}
            placeholder="Field label"
            onChange={event => onChange({ label: event.target.value })}
          />
        </Field>

        <Field label="Placeholder">
          <input
            type="text"
            value={element.placeholder || ''}
            placeholder="Candidate-facing hint"
            onChange={event =>
              onChange({ placeholder: event.target.value })
            }
          />
        </Field>

        <Field label="Help text">
          <textarea
            value={element.help || ''}
            placeholder="Optional supporting text"
            onChange={event => onChange({ help: event.target.value })}
          />
        </Field>

        <Field label="Internal field name">
          <div className="fb-prefix-input">
            <span>#</span>
            <input
              type="text"
              value={element.internalName || ''}
              placeholder="internal_field_name"
              onChange={event =>
                onChange({ internalName: event.target.value })
              }
            />
          </div>
        </Field>

        <Field label="Default value">
          <input
            type="text"
            value={element.defaultValue || ''}
            placeholder="Optional default value"
            onChange={event =>
              onChange({ defaultValue: event.target.value })
            }
          />
        </Field>
      </PropertySection>

      {hasOptions && (
        <OptionsProperties element={element} onChange={onChange} />
      )}

      {element.fieldType === 'FILE' && (
        <PropertySection title="Upload rules">
          <Field label="Allowed formats">
            <input
              type="text"
              value={element.acceptedFormats || ''}
              placeholder=".pdf, .doc, .docx"
              onChange={event =>
                onChange({ acceptedFormats: event.target.value })
              }
            />
          </Field>

          <Field label="Maximum file size">
            <div className="fb-suffix-input">
              <input
                type="number"
                min={1}
                value={element.maxFileSize ?? 10}
                onChange={event =>
                  onChange({
                    maxFileSize: Math.max(
                      1,
                      Number(event.target.value) || 1,
                    ),
                  })
                }
              />
              <span>MB</span>
            </div>
          </Field>

          <Toggle
            label="Allow multiple files"
            value={Boolean(element.multiple)}
            onChange={multiple => onChange({ multiple })}
          />
        </PropertySection>
      )}
    </>
  );
}

function hasOptionField(fieldType: FieldType) {
  return ['RADIO', 'SELECT', 'MULTI_SELECT', 'CHECKBOX'].includes(
    fieldType,
  );
}

function getOptionsForFieldType(
  fieldType: FieldType,
  currentOptions?: string[],
): string[] | undefined {
  if (!hasOptionField(fieldType)) {
    return undefined;
  }

  if (currentOptions && currentOptions.length >= 2) {
    return currentOptions;
  }

  return fieldType === 'CHECKBOX'
    ? ['Yes', 'No']
    : ['Option 1', 'Option 2'];
}

function OptionsProperties({
  element,
  onChange,
}: {
  element: BuilderElement;
  onChange: (patch: Partial<BuilderElement>) => void;
}) {
  const options =
    getOptionsForFieldType(element.fieldType, element.options) || [];

  const updateOption = (index: number, value: string) => {
    const nextOptions = [...options];
    nextOptions[index] = value;
    onChange({ options: nextOptions });
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      return;
    }

    onChange({
      options: options.filter((_, optionIndex) => optionIndex !== index),
    });
  };

  const addOption = () => {
    const prefix = element.fieldType === 'CHECKBOX' ? 'Option' : 'Option';

    onChange({
      options: [...options, `${prefix} ${options.length + 1}`],
    });
  };

  return (
    <PropertySection title="Options">
      <div className="fb-option-editor">
        {options.map((option, index) => (
          <div className="fb-option-row" key={`${element.id}-option-${index}`}>
            <span className="fb-option-drag" title="Drag option">
              ⠿
            </span>

            <input
              type="text"
              value={option}
              placeholder={`Option ${index + 1}`}
              onChange={event =>
                updateOption(index, event.target.value)
              }
            />

            <button
              type="button"
              className="fb-remove-option"
              title="Remove option"
              aria-label={`Remove option ${index + 1}`}
              disabled={options.length <= 2}
              onClick={() => removeOption(index)}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          className="fb-add-option"
          onClick={addOption}
        >
          <span>+</span>
          Add option
        </button>
      </div>
    </PropertySection>
  );
}

function StyleProperties({
  element,
  isButton,
  onChange,
}: {
  element: BuilderElement;
  isButton: boolean;
  onChange: (patch: Partial<BuilderElement>) => void;
}) {
  return (
    <>
      <PropertySection title="Layout">
        <Field label="Width">
          <div className="fb-segmented">
            {(['100', '50', '33'] as const).map(value => (
              <button
                type="button"
                className={element.width === value ? 'active' : ''}
                key={value}
                onClick={() => onChange({ width: value })}
              >
                {value === '100' ? 'Full' : `${value}%`}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Height (px)">
          <input
            type="number"
            min={32}
            step={4}
            placeholder="Auto"
            value={element.pixelHeight ?? ''}
            onChange={event => {
              const value = event.target.value;
              onChange({
                pixelHeight: value
                  ? Math.max(32, Number(value) || 32)
                  : undefined,
              });
            }}
          />
        </Field>

        <div className="fb-two-fields">
          <Field label="X position">
            <input
              type="number"
              min={0}
              step={8}
              value={element.x ?? 0}
              onChange={event =>
                onChange({
                  x: Math.max(0, Number(event.target.value) || 0),
                })
              }
            />
          </Field>

          <Field label="Y position">
            <input
              type="number"
              min={0}
              step={8}
              value={element.y ?? 0}
              onChange={event =>
                onChange({
                  y: Math.max(0, Number(event.target.value) || 0),
                })
              }
            />
          </Field>
        </div>

        <Field label="Alignment">
          <div className="fb-segmented fb-segmented-icons">
            {(['left', 'center', 'right'] as const).map(value => (
              <button
                type="button"
                key={value}
                className={element.align === value ? 'active' : ''}
                title={`Align ${value}`}
                aria-label={`Align ${value}`}
                onClick={() => onChange({ align: value })}
              >
                {value === 'left' && '≡'}
                {value === 'center' && '☰'}
                {value === 'right' && '≡'}
              </button>
            ))}
          </div>
        </Field>
      </PropertySection>

      {!isButton && (
        <PropertySection title="Appearance">
          <Field label={`Border radius · ${element.radius ?? 10}px`}>
            <input
              type="range"
              min={0}
              max={24}
              value={element.radius ?? 10}
              onChange={event =>
                onChange({ radius: Number(event.target.value) })
              }
            />
          </Field>

          <Field label={`Bottom spacing · ${element.spacing ?? 18}px`}>
            <input
              type="range"
              min={0}
              max={48}
              value={element.spacing ?? 18}
              onChange={event =>
                onChange({ spacing: Number(event.target.value) })
              }
            />
          </Field>

          <Field label="Label position">
            <select
              value={element.labelPosition || 'top'}
              onChange={event =>
                onChange({
                  labelPosition: event.target
                    .value as BuilderElement['labelPosition'],
                })
              }
            >
              <option value="top">Above field</option>
              <option value="left">Beside field</option>
              <option value="hidden">Hidden</option>
            </select>
          </Field>
        </PropertySection>
      )}
    </>
  );
}

function ValidationProperties({
  element,
  onChange,
}: {
  element: BuilderElement;
  onChange: (patch: Partial<BuilderElement>) => void;
}) {
  return (
    <>
      <PropertySection title="Requirements">
        <Toggle
          label="Required field"
          value={Boolean(element.required)}
          onChange={required => onChange({ required })}
        />

        <div className="fb-two-fields">
          <Field label="Minimum length">
            <input
              type="number"
              min={0}
              value={element.minLength ?? ''}
              onChange={event =>
                onChange({
                  minLength: event.target.value
                    ? Math.max(0, Number(event.target.value) || 0)
                    : undefined,
                })
              }
            />
          </Field>

          <Field label="Maximum length">
            <input
              type="number"
              min={0}
              value={element.maxLength ?? ''}
              onChange={event =>
                onChange({
                  maxLength: event.target.value
                    ? Math.max(0, Number(event.target.value) || 0)
                    : undefined,
                })
              }
            />
          </Field>
        </div>

        <Field label="Validation message">
          <textarea
            value={element.validationMessage || ''}
            placeholder={`${element.label || 'This field'} is required`}
            onChange={event =>
              onChange({ validationMessage: event.target.value })
            }
          />
        </Field>
      </PropertySection>

      <Tip title="Candidate-friendly validation" icon="✦">
        Explain what went wrong and how to fix it in one sentence.
      </Tip>
    </>
  );
}

function LogicProperties({
  element,
  elements,
  onChange,
}: {
  element: BuilderElement;
  elements: BuilderElement[];
  onChange: (patch: Partial<BuilderElement>) => void;
}) {
  const logic = element.logic || {
    sourceId: '',
    operator: 'EQUALS' as const,
    value: '',
    join: 'AND' as const,
  };

  return (
    <>
      <PropertySection title="Conditional visibility">
        <div className="fb-rule-lead">
          <span>SHOW THIS FIELD</span>
          <small>when the conditions below are met</small>
        </div>

        <Field label="If">
          <select
            value={logic.sourceId}
            onChange={event =>
              onChange({
                logic: {
                  ...logic,
                  sourceId: event.target.value,
                },
              })
            }
          >
            <option value="">Choose a field…</option>
            {elements
              .filter(item => item.id !== element.id)
              .map(item => (
                <option key={item.id} value={item.id}>
                  {item.label || 'Untitled field'}
                </option>
              ))}
          </select>
        </Field>

        <Field label="Operator">
          <select
            value={logic.operator}
            onChange={event =>
              onChange({
                logic: {
                  ...logic,
                  operator: event.target.value as LogicOperator,
                },
              })
            }
          >
            <option value="EQUALS">equals</option>
            <option value="NOT_EQUALS">does not equal</option>
            <option value="CONTAINS">contains</option>
          </select>
        </Field>

        <Field label="Value">
          <input
            type="text"
            value={logic.value}
            placeholder="e.g. Yes"
            onChange={event =>
              onChange({
                logic: {
                  ...logic,
                  value: event.target.value,
                },
              })
            }
          />
        </Field>

        <button
          type="button"
          className="fb-add-condition"
          disabled
          title="Multiple conditions are not implemented yet"
        >
          + Add condition
        </button>
      </PropertySection>

      <Tip title="Connected to FieldCondition" icon="⌁" variant="logic">
        This rule will be mapped to the existing conditional logic model when
        saved.
      </Tip>
    </>
  );
}

function ButtonProperties({
  element,
  onChange,
}: {
  element: BuilderElement;
  onChange: (patch: Partial<BuilderElement>) => void;
}) {
  const role = element.buttonRole || 'next';

  const labelDefaults: Record<string, string> = {
    next: 'Continue',
    back: 'Back',
    submit: 'Submit application',
    custom: 'Button',
  };

  const changeRole = (nextRole: ButtonRole) => {
    const previousDefault = labelDefaults[role];
    const nextDefault = labelDefaults[nextRole || 'next'];
    const shouldUpdateText =
      !element.buttonText || element.buttonText === previousDefault;

    onChange({
      buttonRole: nextRole,
      buttonText: shouldUpdateText
        ? nextDefault
        : element.buttonText,
    });
  };

  return (
    <PropertySection title="Button">
      <Field label="Action">
        <select
          value={role}
          onChange={event =>
            changeRole(event.target.value as ButtonRole)
          }
        >
          <option value="next">Go to next page</option>
          <option value="back">Go to previous page</option>
          <option value="submit">Submit the form</option>
          <option value="custom">Custom link</option>
        </select>
      </Field>

      <Field label="Button label">
        <input
          type="text"
          value={element.buttonText || ''}
          placeholder="Button label"
          onChange={event =>
            onChange({ buttonText: event.target.value })
          }
        />
      </Field>

      {role === 'custom' && (
        <Field label="Link URL">
          <input
            type="url"
            value={element.buttonLink || ''}
            placeholder="https://…"
            onChange={event =>
              onChange({ buttonLink: event.target.value })
            }
          />
        </Field>
      )}

      <Tip title="Smart default" icon="✦">
        New buttons automatically say “Continue” on regular pages and “Submit
        application” on the last page.
      </Tip>
    </PropertySection>
  );
}

function PropertySection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={`fb-property-section ${
        open ? 'is-open' : 'is-closed'
      }`}
    >
      <button
        type="button"
        className="fb-property-section-header"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
      >
        <h3>{title}</h3>
        <span className="fb-section-chevron" aria-hidden="true">
          {open ? '⌃' : '⌄'}
        </span>
      </button>

      {open && (
        <div className="fb-property-section-content">
          {children}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="fb-property-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="fb-toggle-row">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        className={value ? 'on' : ''}
        onClick={() => onChange(!value)}
      >
        <i />
      </button>
    </div>
  );
}

function Tip({
  title,
  icon,
  children,
  variant,
}: {
  title: string;
  icon: string;
  children: ReactNode;
  variant?: 'logic';
}) {
  return (
    <div className={`fb-tip${variant ? ` ${variant}` : ''}`}>
      <span>{icon}</span>
      <p>
        <b>{title}</b>
        {children}
      </p>
    </div>
  );
}

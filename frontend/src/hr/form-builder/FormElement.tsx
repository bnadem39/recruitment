import type { BuilderElement } from './types';

function ControlPreview({ element }: { element: BuilderElement }) {
  const placeholder = element.placeholder || 'Type your answer';
  if (element.kind === 'heading') return <div className="fb-heading"><h2>{element.label}</h2><p>{element.help}</p></div>;
  if (element.kind === 'paragraph') return <p className="fb-paragraph">{element.placeholder || element.label}</p>;
  if (element.kind === 'divider') return <div className="fb-divider" />;
  if (element.kind === 'image') return <div className="fb-image-placeholder"><span>▧</span><b>Image block</b><small>Drop an image or choose from library</small></div>;
  if (element.kind === 'cv') return <div className="fb-upload"><div className="fb-upload-icon">↑</div><strong>{element.label}</strong><span>Drag and drop your CV here</span><small>{element.acceptedFormats || 'PDF, DOCX'} · Max {element.maxFileSize || 10} MB</small><button type="button">Browse files</button></div>;
  if (element.fieldType === 'TEXTAREA') return <textarea tabIndex={-1} placeholder={placeholder} rows={4} />;
  if (element.fieldType === 'SELECT') return <div className="fb-select-faux"><span>{placeholder || 'Select an option'}</span><b>⌄</b></div>;
  if (element.fieldType === 'RADIO' || element.fieldType === 'MULTI_SELECT' || element.fieldType === 'CHECKBOX') return (
    <div className="fb-options">{(element.options || ['Yes', 'No']).map(option => <span key={option}><i className={element.fieldType === 'RADIO' ? 'radio' : ''} />{option}</span>)}</div>
  );
  return <input tabIndex={-1} type={element.fieldType === 'EMAIL' ? 'email' : element.fieldType === 'NUMBER' ? 'number' : element.fieldType === 'DATE' ? 'date' : 'text'} placeholder={placeholder} />;
}

export function FormElement({ element, selected, preview = false, onSelect, onDuplicate, onDelete, onDragStart, onDragEnd }: {
  element: BuilderElement; selected: boolean; preview?: boolean;
  onSelect?: () => void; onDuplicate?: () => void; onDelete?: () => void;
  onDragStart?: (event: React.DragEvent) => void; onDragEnd?: () => void;
}) {
  const structural = ['heading', 'paragraph', 'divider', 'image'].includes(element.kind);
  return (
    <div
      className={`fb-element ${selected ? 'selected' : ''} ${preview ? 'preview-element' : ''}`}
      style={{ '--element-width': `${element.width}%`, '--element-space': `${element.spacing}px`, textAlign: element.align } as React.CSSProperties}
      onClick={event => { event.stopPropagation(); onSelect?.(); }} draggable={!preview}
      onDragStart={onDragStart} onDragEnd={onDragEnd}
    >
      {selected && !preview && <div className="fb-element-toolbar">
        <button type="button" title="Move">⠿ <span>Move</span></button>
        <button type="button" onClick={event => { event.stopPropagation(); onDuplicate?.(); }}>⧉ <span>Duplicate</span></button>
        <button type="button" className="delete" onClick={event => { event.stopPropagation(); onDelete?.(); }}>⌫ <span>Delete</span></button>
      </div>}
      {selected && !preview && <><i className="handle nw"/><i className="handle ne"/><i className="handle sw"/><i className="handle se"/></>}
      {!structural && element.kind !== 'cv' && element.labelPosition !== 'hidden' && <label>{element.label}{element.required && <b>*</b>}</label>}
      <ControlPreview element={element} />
      {element.help && !structural && element.kind !== 'cv' && <small className="fb-help">{element.help}</small>}
    </div>
  );
}

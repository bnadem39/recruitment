import { useEffect, useMemo, useRef, useState } from 'react';
import type { BuilderElement } from './types';

function acceptFromFormats(formats?: string) {
  if (!formats) return undefined;
  return formats.split(',').map(format => format.trim().toLowerCase()).filter(Boolean).map(format => format.startsWith('.') ? format : `.${format}`).join(',');
}

function controlEvents(preview: boolean, selected: boolean) {
  return {
    onClick: (event: React.MouseEvent) => event.stopPropagation(),
    onMouseDown: (event: React.MouseEvent) => {
      if (preview || selected) event.stopPropagation();
    },
    onDragStart: (event: React.DragEvent) => event.stopPropagation(),
  };
}

function FileControl({ element, preview, selected }: { element: BuilderElement; preview: boolean; selected: boolean }) {
  const [files, setFiles] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = acceptFromFormats(element.acceptedFormats);
  return <div className={`fb-upload ${files.length ? 'has-files' : ''}`} onDragOver={event => event.preventDefault()} onDrop={event => {
    event.preventDefault();
    const next = Array.from(event.dataTransfer.files).map(file => file.name);
    if (next.length) setFiles(next);
  }}>
    <input ref={inputRef} type="file" accept={accept} multiple={!!element.multiple} {...controlEvents(preview, selected)} onChange={event => setFiles(Array.from(event.target.files || []).map(file => file.name))}/>
    <div className="fb-upload-icon">UP</div>
    <strong>{element.label}</strong>
    <span>{files.length ? files.join(', ') : 'Drag and drop a file here'}</span>
    <small>{element.acceptedFormats || 'PDF, DOCX'} - Max {element.maxFileSize || 10} MB</small>
    <button type="button" onClick={event => { event.stopPropagation(); inputRef.current?.click(); }}>Browse files</button>
  </div>;
}

function ImageControl({ element, preview, selected, onChange }: { element: BuilderElement; preview: boolean; selected: boolean; onChange?: (patch: Partial<BuilderElement>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localSrc, setLocalSrc] = useState(element.imageSrc || '');
  useEffect(() => setLocalSrc(element.imageSrc || ''), [element.imageSrc]);
  const src = element.imageSrc || localSrc;
  const chooseFile = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageSrc = String(reader.result || '');
      setLocalSrc(imageSrc);
      onChange?.({ imageSrc });
    };
    reader.readAsDataURL(file);
  };
  return <div className={`fb-image-control ${src ? 'has-image' : ''}`} onDragOver={event => event.preventDefault()} onDrop={event => {
    event.preventDefault();
    chooseFile(event.dataTransfer.files[0]);
  }}>
    <input ref={inputRef} type="file" accept="image/*" {...controlEvents(preview, selected)} onChange={event => chooseFile(event.target.files?.[0])}/>
    {src ? <img src={src} alt={element.label || 'Form image'} /> : <><span>IMG</span><b>{element.label || 'Image'}</b><small>Drop an image or browse</small></>}
    <button type="button" onClick={event => { event.stopPropagation(); inputRef.current?.click(); }}>{src ? 'Replace image' : 'Browse image'}</button>
  </div>;
}

function ChoiceControls({ element, preview, selected }: { element: BuilderElement; preview: boolean; selected: boolean }) {
  const options = element.options?.length ? element.options : ['Yes', 'No'];
  const [single, setSingle] = useState(element.defaultValue || '');
  const [many, setMany] = useState<string[]>([]);
  if (element.fieldType === 'RADIO') return <div className="fb-options">{options.map(option => <label key={option}><input type="radio" name={element.id} value={option} checked={single === option} {...controlEvents(preview, selected)} onChange={() => setSingle(option)}/><span>{option}</span></label>)}</div>;
  if (element.fieldType === 'MULTI_SELECT') return <div className="fb-options">{options.map(option => <label key={option}><input type="checkbox" value={option} checked={many.includes(option)} {...controlEvents(preview, selected)} onChange={event => setMany(current => event.target.checked ? [...current, option] : current.filter(item => item !== option))}/><span>{option}</span></label>)}</div>;
  return <label className="fb-inline-checkbox"><input type="checkbox" checked={single === options[0]} {...controlEvents(preview, selected)} onChange={event => setSingle(event.target.checked ? options[0] : '')}/><span>{options[0] || element.label}</span></label>;
}

function ControlPreview({ element, preview, selected, onChange }: { element: BuilderElement; preview: boolean; selected: boolean; onChange?: (patch: Partial<BuilderElement>) => void }) {
  const placeholder = element.placeholder || 'Type your answer';
  const [value, setValue] = useState(element.defaultValue || '');
  const controlProps = useMemo(() => controlEvents(preview, selected), [preview, selected]);
  if (element.kind === 'heading') return <div className="fb-heading"><h2>{element.label}</h2><p>{element.help}</p></div>;
  if (element.kind === 'paragraph') return <p className="fb-paragraph">{element.placeholder || element.label}</p>;
  if (element.kind === 'divider') return <div className="fb-divider" />;
  if (element.kind === 'image') return <ImageControl element={element} preview={preview} selected={selected} onChange={onChange} />;
  if (element.kind === 'cv' || element.fieldType === 'FILE') return <FileControl element={element} preview={preview} selected={selected} />;
  if (element.fieldType === 'TEXTAREA') return <textarea placeholder={placeholder} rows={4} value={value} {...controlProps} onChange={event => setValue(event.target.value)} />;
  if (element.fieldType === 'SELECT') return <select value={value} {...controlProps} onChange={event => setValue(event.target.value)}><option value="">{placeholder || 'Select an option'}</option>{(element.options || ['Option one', 'Option two']).map(option => <option key={option} value={option}>{option}</option>)}</select>;
  if (element.fieldType === 'RADIO' || element.fieldType === 'MULTI_SELECT' || element.fieldType === 'CHECKBOX' || element.fieldType === 'BOOLEAN') return <ChoiceControls element={element} preview={preview} selected={selected} />;
  const type = element.fieldType === 'EMAIL' ? 'email' : element.fieldType === 'NUMBER' ? 'number' : element.fieldType === 'DATE' ? 'date' : element.fieldType === 'PHONE' ? 'tel' : 'text';
  return <input type={type} placeholder={placeholder} value={value} {...controlProps} onChange={event => setValue(event.target.value)} />;
}

export function FormElement({ element, selected, preview = false, onSelect, onDuplicate, onDelete, onChange, onDragStart, onDragEnd }: {
  element: BuilderElement; selected: boolean; preview?: boolean;
  onSelect?: () => void; onDuplicate?: () => void; onDelete?: () => void; onChange?: (patch: Partial<BuilderElement>) => void;
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
        <button type="button" title="Move">Move</button>
        <button type="button" onClick={event => { event.stopPropagation(); onDuplicate?.(); }}>Duplicate</button>
        <button type="button" className="delete" onClick={event => { event.stopPropagation(); onDelete?.(); }}>Delete</button>
      </div>}
      {selected && !preview && <><i className="handle nw"/><i className="handle ne"/><i className="handle sw"/><i className="handle se"/></>}
      {!structural && element.kind !== 'cv' && element.labelPosition !== 'hidden' && <label>{element.label}{element.required && <b>*</b>}</label>}
      <ControlPreview element={element} selected={selected} preview={preview} onChange={onChange} />
      {element.help && !structural && element.kind !== 'cv' && <small className="fb-help">{element.help}</small>}
    </div>
  );
}

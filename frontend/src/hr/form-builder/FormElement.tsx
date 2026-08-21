import { useMemo, useRef, useState } from 'react';
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

// ==================== Mise a l'echelle reciproque du texte ====================
// Le titre (label) ET le contenu du champ (input/help) se redimensionnent
// ENSEMBLE, en fonction de la hauteur du champ (BASE_HEIGHT -> BASE_FONT),
// avec un plancher/plafond pour rester lisible.
const BASE_HEIGHT = 60;
const BASE_FONT = 15;
const MIN_FONT = 11;
const MAX_FONT = 32;

function scaledFontSize(element: BuilderElement): number {
  const height = element.pixelHeight || BASE_HEIGHT;
  const raw = (height / BASE_HEIGHT) * BASE_FONT;
  return Math.max(MIN_FONT, Math.min(MAX_FONT, raw));
}

function FileControl({ element, preview, selected }: { element: BuilderElement; preview: boolean; selected: boolean }) {
  const [files, setFiles] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const accept = acceptFromFormats(element.acceptedFormats);
  return <div className={`fb-upload-compact ${files.length ? 'has-files' : ''}`} onDragOver={event => event.preventDefault()} onDrop={event => {
    event.preventDefault();
    const next = Array.from(event.dataTransfer.files).map(file => file.name);
    if (next.length) setFiles(next);
  }}>
    <span className="fb-upload-compact-icon">📎</span>
    <div className="fb-upload-compact-info">
      <b>{files.length ? files.join(', ') : (element.placeholder || 'Choose a file or drag it here')}</b>
      <small>{element.acceptedFormats || 'PDF, DOCX'} · Max {element.maxFileSize || 10} MB</small>
    </div>
    <button type="button" className="fb-upload-compact-btn" onClick={event => { event.stopPropagation(); inputRef.current?.click(); }}>Browse</button>
    <input ref={inputRef} type="file" accept={accept} multiple={!!element.multiple} {...controlEvents(preview, selected)} onChange={event => setFiles(Array.from(event.target.files || []).map(file => file.name))}/>
  </div>;
}

function ChoiceControls({ element, preview, selected, fontSize }: { element: BuilderElement; preview: boolean; selected: boolean; fontSize: number }) {
  const options = element.options?.length ? element.options : ['Yes', 'No'];
  const [single, setSingle] = useState(element.defaultValue || '');
  const [many, setMany] = useState<string[]>([]);
  const style = { fontSize: `${fontSize}px` };
  if (element.fieldType === 'RADIO') return <div className="fb-options" style={style}>{options.map(option => <label key={option}><input type="radio" name={element.id} value={option} checked={single === option} {...controlEvents(preview, selected)} onChange={() => setSingle(option)}/><span>{option}</span></label>)}</div>;
  if (element.fieldType === 'MULTI_SELECT') return <div className="fb-options" style={style}>{options.map(option => <label key={option}><input type="checkbox" value={option} checked={many.includes(option)} {...controlEvents(preview, selected)} onChange={event => setMany(current => event.target.checked ? [...current, option] : current.filter(item => item !== option))}/><span>{option}</span></label>)}</div>;
  return <label className="fb-inline-checkbox" style={style}><input type="checkbox" checked={single === options[0]} {...controlEvents(preview, selected)} onChange={event => setSingle(event.target.checked ? options[0] : '')}/><span>{options[0] || element.label}</span></label>;
}

function ControlPreview({ element, preview, selected, fontSize }: { element: BuilderElement; preview: boolean; selected: boolean; fontSize: number }) {
  const placeholder = element.placeholder || 'Your answer';
  const [value, setValue] = useState(element.defaultValue || '');
  const controlProps = useMemo(() => controlEvents(preview, selected), [preview, selected]);
  const fullHeight = !!element.pixelHeight;
  const scaledStyle: React.CSSProperties = { fontSize: `${fontSize}px`, ...(fullHeight ? { height: '100%' } : {}) };
  if (element.fieldType === 'FILE') return <FileControl element={element} preview={preview} selected={selected} />;
  if (element.fieldType === 'TEXTAREA') return <textarea placeholder={placeholder} rows={4} value={value} style={scaledStyle} {...controlProps} onChange={event => setValue(event.target.value)} />;
  if (element.fieldType === 'SELECT') return <select value={value} style={scaledStyle} {...controlProps} onChange={event => setValue(event.target.value)}><option value="">{placeholder || 'Select an option'}</option>{(element.options || ['Option 1', 'Option 2']).map(option => <option key={option} value={option}>{option}</option>)}</select>;
  if (element.fieldType === 'RADIO' || element.fieldType === 'MULTI_SELECT' || element.fieldType === 'CHECKBOX' || element.fieldType === 'BOOLEAN') return <ChoiceControls element={element} preview={preview} selected={selected} fontSize={fontSize} />;
  const type = element.fieldType === 'EMAIL' ? 'email' : element.fieldType === 'NUMBER' ? 'number' : element.fieldType === 'DATE' ? 'date' : element.fieldType === 'PHONE' ? 'tel' : 'text';
  return <input type={type} placeholder={placeholder} value={value} style={scaledStyle} {...controlProps} onChange={event => setValue(event.target.value)} />;
}

// ==================== Poignees de redimensionnement (4 coins) ====================

type Corner = 'nw' | 'ne' | 'sw' | 'se';

const CORNER_STYLE: Record<Corner, React.CSSProperties> = {
  nw: { top: -6, left: -6, cursor: 'nwse-resize' },
  ne: { top: -6, right: -6, cursor: 'nesw-resize' },
  sw: { bottom: -6, left: -6, cursor: 'nesw-resize' },
  se: { bottom: -6, right: -6, cursor: 'nwse-resize' },
};

const BUTTON_LABELS: Record<string, string> = { next: 'Continue', back: 'Back', submit: 'Submit application', custom: 'Button' };

export function FormElement({ element, selected, preview = false, scale = 1, onSelect, onDuplicate, onDelete, onChange, onDragStart, onDragEnd, onNavigate }: {
  element: BuilderElement; selected: boolean; preview?: boolean; scale?: number;
  onSelect?: () => void; onDuplicate?: () => void; onDelete?: () => void; onChange?: (patch: Partial<BuilderElement>) => void;
  onDragStart?: (event: React.DragEvent) => void; onDragEnd?: () => void;
  onNavigate?: (role: 'next' | 'back' | 'submit' | 'custom') => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fontSize = scaledFontSize(element);

  const startResize = (corner: Corner) => (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const rect = rootRef.current?.getBoundingClientRect();
    const startWidth = element.pixelWidth || rect?.width || 240;
    const startHeight = element.pixelHeight || rect?.height || 60;
    const startLeft = element.x ?? 0;
    const startTop = element.y ?? 0;

    const onMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;

      let nextWidth = startWidth;
      let nextHeight = startHeight;
      let nextLeft = startLeft;
      let nextTop = startTop;

      if (corner === 'ne' || corner === 'se') {
        nextWidth = Math.max(120, startWidth + dx);
      } else {
        nextWidth = Math.max(120, startWidth - dx);
        nextLeft = startLeft + (startWidth - nextWidth);
      }

      if (corner === 'sw' || corner === 'se') {
        nextHeight = Math.max(40, startHeight + dy);
      } else {
        nextHeight = Math.max(40, startHeight - dy);
        nextTop = startTop + (startHeight - nextHeight);
      }

      onChange?.({
        pixelWidth: Math.round(nextWidth),
        pixelHeight: Math.round(nextHeight),
        x: Math.round(nextLeft),
        y: Math.round(nextTop),
      });
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const resizeHandles = selected && !preview && (['nw', 'ne', 'sw', 'se'] as Corner[]).map(corner => (
    <div
      key={corner}
      onMouseDown={startResize(corner)}
      title="Resize"
      style={{
        position: 'absolute', width: 14, height: 14,
        borderRadius: 4, background: '#128c78', border: '2px solid #fff',
        zIndex: 20, boxShadow: '0 2px 6px #00000030',
        ...CORNER_STYLE[corner],
      }}
    />
  ));

  // ==================== Élément "Bouton" (navigation / envoi) ====================
  if (element.kind === 'button') {
    const role = element.buttonRole || 'next';
    const label = element.buttonText || BUTTON_LABELS[role] || 'Button';
    return (
      <div
        ref={rootRef}
        className={`fb-element fb-element-button ${selected ? 'selected' : ''}`}
        style={{ textAlign: element.align, height: element.pixelHeight ? '100%' : undefined } as React.CSSProperties}
        onClick={event => { event.stopPropagation(); onSelect?.(); }} draggable={!preview}
        onDragStart={onDragStart} onDragEnd={onDragEnd}
      >
        {selected && !preview && <div className="fb-element-toolbar">
          <button type="button" onClick={event => { event.stopPropagation(); onDuplicate?.(); }}>Duplicate</button>
          <button type="button" className="delete" onClick={event => { event.stopPropagation(); onDelete?.(); }}>Delete</button>
        </div>}
        <button
          type="button"
          className={`fb-nav-btn fb-nav-btn-${role}`}
          style={{ fontSize: `${fontSize}px` }}
          onClick={event => { if (preview) { event.stopPropagation(); onNavigate?.(role); } }}
        >{label}</button>
        {resizeHandles}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`fb-element ${selected ? 'selected' : ''} ${preview ? 'preview-element' : ''}`}
      style={{ textAlign: element.align, height: element.pixelHeight ? '100%' : undefined } as React.CSSProperties}
      onClick={event => { event.stopPropagation(); onSelect?.(); }} draggable={!preview}
      onDragStart={onDragStart} onDragEnd={onDragEnd}
    >
      {selected && !preview && <div className="fb-element-toolbar">
        <button type="button" onClick={event => { event.stopPropagation(); onDuplicate?.(); }}>Duplicate</button>
        <button type="button" className="delete" onClick={event => { event.stopPropagation(); onDelete?.(); }}>Delete</button>
      </div>}
      {element.labelPosition !== 'hidden' && <label style={{ fontSize: `${fontSize}px` }}>{element.label}{element.required && <b>*</b>}</label>}
      <ControlPreview element={element} selected={selected} preview={preview} fontSize={fontSize} />
      {element.help && <small className="fb-help" style={{ fontSize: `${Math.max(8, fontSize - 4)}px` }}>{element.help}</small>}
      {resizeHandles}
    </div>
  );
}
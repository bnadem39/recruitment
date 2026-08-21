import { useRef } from 'react';
import { FormElement } from './FormElement';
import type { BuilderElement, FormStep } from './types';

type CanvasPoint = { x: number; y: number };

const FALLBACK_ROW_HEIGHT = 112;

function estimateElementHeight(element: BuilderElement) {
  if (element.kind === 'cv') return 230;
  if (element.kind === 'heading') return 82;
  if (element.kind === 'paragraph') return 68;
  if (element.kind === 'divider') return 34;
  if (element.kind === 'image') return 150;
  if (element.fieldType === 'TEXTAREA') return 126;
  return 94;
}

function fallbackPoint(element: BuilderElement, index: number): CanvasPoint {
  return {
    x: element.width === '50' && index % 2 === 1 ? 368 : 0,
    y: Math.floor(index / (element.width === '50' ? 2 : 1)) * FALLBACK_ROW_HEIGHT,
  };
}

function widthStyle(width: BuilderElement['width']) {
  if (width === '50') return 'calc(50% - 8px)';
  if (width === '33') return 'calc(33.333% - 11px)';
  return '100%';
}

export function FormCanvas({ step, stepIndex, steps, selectedId, dragging, dropPoint, zoom, device, onCanvasClick, onSelect, onDuplicate, onDelete, onChange, onDragStart, onDragEnd, onDragOver, onDrop, onStepChange, onAddStep, onStepMenu }: {
  step: FormStep; stepIndex: number; steps: FormStep[]; selectedId?: string; dragging: boolean; dropPoint: CanvasPoint | null; zoom: number; device: string;
  onCanvasClick: () => void; onSelect: (id: string) => void; onDuplicate: (id: string) => void; onDelete: (id: string) => void; onChange: (id: string, patch: Partial<BuilderElement>) => void;
  onDragStart: (event: React.DragEvent, id: string) => void; onDragEnd: () => void; onDragOver: (event: React.DragEvent, point: CanvasPoint) => void; onDrop: (event: React.DragEvent, point: CanvasPoint) => void;
  onStepChange: (index: number) => void; onAddStep: () => void; onStepMenu: (index: number, action: 'rename' | 'duplicate' | 'delete') => void;
}) {
  const scale = zoom / 100;
  const canvasRef = useRef<HTMLDivElement>(null);
  const isBlankPage = step.elements.length === 0;
  const positionedElements = step.elements.map((element, index) => ({ element, point: { x: element.x ?? fallbackPoint(element, index).x, y: element.y ?? fallbackPoint(element, index).y } }));
  const canvasHeight = Math.max(430, positionedElements.reduce((height, item) => Math.max(height, item.point.y + estimateElementHeight(item.element) + 28), 0));

  const pointFromEvent = (event: React.DragEvent): CanvasPoint => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, (event.clientX - rect.left) / scale),
      y: Math.max(0, (event.clientY - rect.top) / scale),
    };
  };

  return <main className={`fb-workspace ${dragging ? 'is-dragging' : ''}`} onClick={onCanvasClick}>
    <div className="fb-ruler top"><span>0</span><span>100</span><span>200</span><span>300</span><span>400</span><span>500</span><span>600</span><span>700</span></div>
    <div className="fb-ruler left"><span>0</span><span>200</span><span>400</span><span>600</span><span>800</span></div>
    <div className="fb-canvas-scroll">
      <div className={`fb-page-stage ${device}`} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        <div className={`fb-form-page ${isBlankPage ? 'blank-sheet' : ''}`}>
          {!isBlankPage && <>
            <div className="fb-form-accent" />
            <div className="fb-candidate-brand"><span className="fb-candidate-logo">BF</span><div><b>BFRECRUIT</b><small>FORMS</small></div></div>
            <div className="fb-form-hero"><span>APPLICATION FORM</span><h1>{step.title}</h1><p>Build the candidate form your recruitment process needs.</p></div>
            <div className="fb-progress-line"><div>{steps.map((item, index) => <button className={`${index === stepIndex ? 'active' : ''} ${index < stepIndex ? 'done' : ''}`} key={item.id} onClick={event => { event.stopPropagation(); onStepChange(index); }}><i>{index < stepIndex ? '✓' : index + 1}</i><span>{item.title}</span></button>)}</div><small>{Math.round(((stepIndex + 1) / steps.length) * 100)}% complete</small></div>
          </>}
          <div className={`fb-page-content ${isBlankPage ? 'blank-content' : ''}`}>
            {!isBlankPage && <div className="fb-step-heading"><div><small>{step.eyebrow}</small><h2>{step.title}</h2><p>{stepIndex === 0 ? 'Tell us a little about yourself so our team can reach you.' : stepIndex === 1 ? 'Share the experience and strengths you would bring to the role.' : stepIndex === 2 ? 'Add the documents that best represent your work.' : 'Check your answers before sending your application.'}</p></div><span>0{stepIndex + 1}</span></div>}
            <div
              className={`fb-free-canvas ${step.elements.length === 0 ? 'empty' : ''}`}
              ref={canvasRef}
              style={{ minHeight: `${canvasHeight}px` }}
              onDragOver={event => onDragOver(event, pointFromEvent(event))}
              onDrop={event => onDrop(event, pointFromEvent(event))}
            >
              {dragging && dropPoint && <div className="fb-placement-ghost" style={{ left: dropPoint.x, top: dropPoint.y }}><span>Drop here</span></div>}
              {positionedElements.map(({ element, point }) => <div
                className="fb-positioned-element"
                style={{ left: point.x, top: point.y, width: widthStyle(element.width) }}
                key={element.id}
              >
                <FormElement element={element} selected={selectedId === element.id} onSelect={() => onSelect(element.id)} onDuplicate={() => onDuplicate(element.id)} onDelete={() => onDelete(element.id)} onChange={patch => onChange(element.id, patch)} onDragStart={event => onDragStart(event, element.id)} onDragEnd={onDragEnd}/>
              </div>)}
            </div>
            {step.elements.length > 0 && <div className="fb-candidate-actions"><button className="ghost" disabled={stepIndex === 0}>← Back</button><button>{stepIndex === steps.length - 1 ? 'Submit application' : 'Continue'} <span>→</span></button></div>}
          </div>
          {!isBlankPage && <footer className="fb-form-footer"><span>Your data is encrypted and handled with care.</span><b>Privacy - Terms</b></footer>}
        </div>
      </div>
    </div>
    <div className="fb-steps-dock"><div className="fb-steps-label"><span>▤</span><b>Form steps</b><small>{steps.length} pages</small></div><div className="fb-step-tabs">{steps.map((item, index) => <div className={index === stepIndex ? 'active' : ''} key={item.id}><button onClick={() => onStepChange(index)}><i>{index + 1}</i><span>{item.title}</span></button><span className="fb-step-actions"><button onClick={() => onStepMenu(index, 'rename')} title="Rename step">✎</button><button onClick={() => onStepMenu(index, 'duplicate')} title="Duplicate step">⧉</button><button onClick={() => onStepMenu(index, 'delete')} disabled={steps.length === 1} title="Delete step">x</button></span></div>)}<button className="fb-add-step" onClick={onAddStep}>+ Add step</button></div></div>
  </main>;
}

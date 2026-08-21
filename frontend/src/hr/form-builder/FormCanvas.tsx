import { useRef } from 'react';
import { FormElement } from './FormElement';
import type { BuilderElement, FormStep } from './types';

type CanvasPoint = { x: number; y: number };

function estimateElementHeight(element: BuilderElement) {
  if (element.pixelHeight) return element.pixelHeight;
  if (element.kind === 'upload') return 180;
  if (element.fieldType === 'TEXTAREA') return 126;
  return 94;
}

function widthStyle(element: BuilderElement) {
  if (element.pixelWidth) return `${element.pixelWidth}px`;
  if (element.width === '50') return 'calc(50% - 8px)';
  if (element.width === '33') return 'calc(33.333% - 11px)';
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
  const positionedElements = step.elements.map((element, index) => ({ element, point: { x: element.x ?? 0, y: element.y ?? index * 112 } }));
  const canvasHeight = Math.max(600, positionedElements.reduce((height, item) => Math.max(height, item.point.y + estimateElementHeight(item.element) + 28), 0));

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
        <div className="fb-form-page blank-sheet">
          <div className="fb-page-content blank-content">
            <div
              className={`fb-free-canvas ${step.elements.length === 0 ? 'empty' : ''}`}
              ref={canvasRef}
              style={{ minHeight: `${canvasHeight}px` }}
              onDragOver={event => onDragOver(event, pointFromEvent(event))}
              onDrop={event => onDrop(event, pointFromEvent(event))}
            >
              {dragging && dropPoint && <div className="fb-placement-ghost" style={{ left: dropPoint.x, top: dropPoint.y }}><span>Drop here</span></div>}
              {step.elements.length === 0 && <div className="fb-canvas-empty"><span>+</span><h3>Empty page</h3><p>Drag a component from the library on the left.</p></div>}
              {positionedElements.map(({ element, point }) => <div
                className="fb-positioned-element"
                style={{ left: point.x, top: point.y, width: widthStyle(element), height: element.pixelHeight ? `${element.pixelHeight}px` : undefined }}
                key={element.id}
              >
                <FormElement element={element} selected={selectedId === element.id} scale={scale} onSelect={() => onSelect(element.id)} onDuplicate={() => onDuplicate(element.id)} onDelete={() => onDelete(element.id)} onChange={patch => onChange(element.id, patch)} onDragStart={event => onDragStart(event, element.id)} onDragEnd={onDragEnd}/>
              </div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="fb-steps-dock"><div className="fb-steps-label"><span>▤</span><b>Pages</b><small>{steps.length} page(s)</small></div><div className="fb-step-tabs">{steps.map((item, index) => <div className={index === stepIndex ? 'active' : ''} key={item.id}><button onClick={() => onStepChange(index)}><i>{index + 1}</i><span>{item.title}</span></button><span className="fb-step-actions"><button onClick={() => onStepMenu(index, 'rename')} title="Rename">✎</button><button onClick={() => onStepMenu(index, 'duplicate')} title="Duplicate">⧉</button><button onClick={() => onStepMenu(index, 'delete')} disabled={steps.length === 1} title="Delete">x</button></span></div>)}<button className="fb-add-step" onClick={onAddStep}>+ Add page</button></div></div>
  </main>;
}
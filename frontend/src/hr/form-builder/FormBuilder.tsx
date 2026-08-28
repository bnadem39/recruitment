import { useEffect, useMemo, useState } from 'react';
import type { Session } from '../../shared/types';
import { BuilderToolbar } from './BuilderToolbar';
import { ComponentLibrary } from './ComponentLibrary';
import { FormCanvas } from './FormCanvas';
import { PropertiesPanel } from './PropertiesPanel';
import { PreviewMode, PublishDialog, SaveTemplateDialog, SettingsDialog, TemplateSelector } from './BuilderDialogs';
import { CATALOG, createElement, INITIAL_DRAFT, TEMPLATES, uid } from './catalog';
import { getJobOffers, saveDraftToBackend } from './api';
import type { BuilderDraft, BuilderElement, CatalogItem, FormTemplate, JobOffer } from './types';
import './form-builder.css';

type History = { past: BuilderDraft[]; present: BuilderDraft; future: BuilderDraft[] };
const cloneDraft = <T,>(value: T): T => structuredClone(value);
const TEMPLATE_STORAGE_KEY = 'visual-form-builder-templates';
type CanvasPoint = { x: number; y: number };
const GRID_SIZE = 8;
const DEFAULT_ELEMENT_GAP = 112;
const snap = (value: number) => Math.max(0, Math.round(value / GRID_SIZE) * GRID_SIZE);
const estimateElementHeight = (element: BuilderElement) => element.pixelHeight || (element.kind === 'upload' ? 180 : element.fieldType === 'TEXTAREA' ? 126 : 94);
const nextFreePoint = (elements: BuilderElement[]): CanvasPoint => ({ x: 0, y: snap(elements.reduce((max, element, index) => Math.max(max, (element.y ?? index * DEFAULT_ELEMENT_GAP) + estimateElementHeight(element)), 0) + 16) });

function positionNewElements(sources: string[], anchor: CanvasPoint) {
  let cursorY = anchor.y;
  return sources.map(source => {
    const element = createElement(source);
    const placed = { ...element, x: snap(anchor.x), y: snap(cursorY) };
    cursorY += estimateElementHeight(element) + 16;
    return placed;
  });
}

function loadDraft(): BuilderDraft {
  try {
    const stored = localStorage.getItem('visual-form-builder-draft');
    if (stored) return JSON.parse(stored) as BuilderDraft;
  } catch { /* start fresh */ }
  return cloneDraft(INITIAL_DRAFT);
}

function loadTemplates(): FormTemplate[] {
  try {
    const stored = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    return stored ? JSON.parse(stored) as FormTemplate[] : [];
  } catch {
    return [];
  }
}

function resetElementForReuse(element: BuilderElement): BuilderElement {
  return { ...element, id: uid(), backendId: undefined, logic: element.logic ? { ...element.logic, sourceId: '' } : undefined };
}

function draftFromTemplate(template: FormTemplate): BuilderDraft {
  const source = template.draft || INITIAL_DRAFT;
  const next = cloneDraft(source);
  return {
    ...next,
    backendId: undefined,
    status: 'DRAFT',
    steps: next.steps.map((step, index) => ({ ...step, id: uid(), eyebrow: `Page ${index + 1}`, elements: step.elements.map(resetElementForReuse) })),
  };
}

function templateDraftSnapshot(draft: BuilderDraft): BuilderDraft {
  return {
    ...cloneDraft(draft),
    backendId: undefined,
    status: 'DRAFT',
    steps: draft.steps.map((step, index) => ({
      ...step, id: uid(), eyebrow: `Page ${index + 1}`,
      elements: step.elements.map(element => ({ ...element, id: uid(), backendId: undefined })),
    })),
  };
}

export function FormBuilder({ session, onExit }: { session: Session; onExit: () => void }) {
  const [history, setHistory] = useState<History>(() => ({ past: [], present: loadDraft(), future: [] }));
  const draft = history.present;
  const [activeStep, setActiveStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string>();
  const [search, setSearch] = useState('');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [zoom, setZoom] = useState(75);
  const [device, setDevice] = useState('desktop');
  const [dragging, setDragging] = useState(false);
  const [draggedElementId, setDraggedElementId] = useState<string>();
  const [dropPoint, setDropPoint] = useState<CanvasPoint | null>(null);
  const [dragOffset, setDragOffset] = useState<CanvasPoint>({ x: 24, y: 24 });
  const [saveState, setSaveState] = useState<'Saved' | 'Saving...' | 'Save failed'>('Saved');
  const [dialog, setDialog] = useState<'templates' | 'settings' | 'publish' | 'save-template' | null>(null);
  const [customTemplates, setCustomTemplates] = useState<FormTemplate[]>(loadTemplates);
  const [preview, setPreview] = useState(false);
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [toast, setToast] = useState('');

  const step = draft.steps[Math.min(activeStep, draft.steps.length - 1)];
  const allElements = useMemo(() => draft.steps.flatMap(item => item.elements), [draft.steps]);
  const selected = allElements.find(element => element.id === selectedId);
  const zoomScale = zoom / 100;

  const commit = (transform: (current: BuilderDraft) => BuilderDraft) => {
    setHistory(current => ({ past: [...current.past.slice(-49), current.present], present: transform(cloneDraft(current.present)), future: [] }));
    setSaveState('Saving...');
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem('visual-form-builder-draft', JSON.stringify(draft));
      setSaveState(current => current === 'Save failed' ? current : 'Saved');
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    getJobOffers(session.accessToken).then(setOffers).catch(() => setOffers([]));
  }, [session.accessToken]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const updateElement = (id: string, patch: Partial<BuilderElement>) => commit(current => ({ ...current, steps: current.steps.map(item => ({ ...item, elements: item.elements.map(element => element.id === id ? { ...element, ...patch } : element) })) }));

  const addCatalogItem = (item: CatalogItem, index?: number, point?: CanvasPoint) => {
    if (!step) { setToast('Add a page first'); return; }
    const targetIndex = index ?? step.elements.length;
    const sources = item.block || [item.id];
    const anchor = point || nextFreePoint(step.elements);
    const newElements = positionNewElements(sources, anchor);
    commit(current => ({ ...current, steps: current.steps.map((itemStep, itemIndex) => itemIndex === activeStep ? { ...itemStep, elements: [...itemStep.elements.slice(0, targetIndex), ...newElements, ...itemStep.elements.slice(targetIndex)] } : itemStep) }));
    setSelectedId(newElements[0]?.id);
    setToast(`${item.name} added`);
  };

  const duplicateElement = (id: string) => {
    if (!step) return;
    const index = step.elements.findIndex(element => element.id === id);
    if (index < 0) return;
    const source = step.elements[index];
    const copy = { ...cloneDraft(source), id: uid(), backendId: undefined, label: `${source.label} copy`, x: snap((source.x ?? 0) + 24), y: snap((source.y ?? index * DEFAULT_ELEMENT_GAP) + 24) };
    commit(current => ({ ...current, steps: current.steps.map((item, itemIndex) => itemIndex === activeStep ? { ...item, elements: [...item.elements.slice(0, index + 1), copy, ...item.elements.slice(index + 1)] } : item) }));
    setSelectedId(copy.id); setToast('Field duplicated');
  };

  const deleteElement = (id: string) => {
    commit(current => ({ ...current, steps: current.steps.map(item => ({ ...item, elements: item.elements.filter(element => element.id !== id) })) }));
    setSelectedId(undefined); setToast('Field removed');
  };

  const handleDrop = (event: React.DragEvent, point: CanvasPoint) => {
    event.preventDefault(); event.stopPropagation();
    if (!step) return;
    const targetPoint = { x: snap(point.x - dragOffset.x / zoomScale), y: snap(point.y - dragOffset.y / zoomScale) };
    const source = event.dataTransfer.getData('application/x-builder-component');
    if (source) {
      const item = CATALOG.flatMap(group => group.items).find(candidate => candidate.id === source);
      if (item) addCatalogItem(item, step.elements.length, targetPoint);
    } else {
      const elementId = event.dataTransfer.getData('application/x-builder-element') || draggedElementId;
      const from = step.elements.findIndex(element => element.id === elementId);
      if (from >= 0) {
        commit(current => ({ ...current, steps: current.steps.map((item, itemIndex) => itemIndex === activeStep ? { ...item, elements: item.elements.map(element => element.id === elementId ? { ...element, x: targetPoint.x, y: targetPoint.y } : element) } : item) }));
        setSelectedId(elementId);
      }
    }
    setDragging(false); setDraggedElementId(undefined); setDropPoint(null);
  };

  const save = async (publishStatus?: boolean) => {
    setSaveState('Saving...');
    const target = publishStatus ? { ...draft, status: 'PUBLISHED' as const } : draft;
    try {
      const saved = await saveDraftToBackend(target, session.accessToken);
      setHistory(current => ({ ...current, present: saved }));
      localStorage.setItem('visual-form-builder-draft', JSON.stringify(saved));
      setSaveState('Saved');
      setToast(publishStatus ? 'Form published' : 'Draft saved');
      setDialog(null);
    } catch {
      localStorage.setItem('visual-form-builder-draft', JSON.stringify(target));
      setHistory(current => ({ ...current, present: target }));
      setSaveState('Save failed');
      setToast('Saved locally · Backend unavailable');
      if (publishStatus) setDialog(null);
    }
  };

  const addStep = () => {
    const nextIndex = draft.steps.length;
    commit(current => ({ ...current, steps: [...current.steps, { id: uid(), eyebrow: `Page ${nextIndex + 1}`, title: `Page ${nextIndex + 1}`, elements: [] }] }));
    setActiveStep(nextIndex); setSelectedId(undefined); setToast('New page added');
  };

  const stepAction = (index: number, action: 'rename' | 'duplicate' | 'delete') => {
    if (action === 'duplicate') {
      const copied = cloneDraft(draft.steps[index]); copied.id = uid(); copied.title = `${copied.title} copy`; copied.elements = copied.elements.map(element => ({ ...element, id: uid(), backendId: undefined }));
      commit(current => ({ ...current, steps: [...current.steps.slice(0, index + 1), copied, ...current.steps.slice(index + 1)].map((item, i) => ({ ...item, eyebrow: `Page ${i + 1}` })) }));
      setActiveStep(index + 1); setToast('Page duplicated');
    } else if (action === 'delete') {
      commit(current => ({ ...current, steps: current.steps.filter((_, i) => i !== index).map((item, i) => ({ ...item, eyebrow: `Page ${i + 1}` })) }));
      setActiveStep(Math.max(0, index - 1)); setSelectedId(undefined);
    } else if (action === 'rename') {
      const title = window.prompt('Rename this page', draft.steps[index].title);
      if (title?.trim()) commit(current => ({ ...current, steps: current.steps.map((item, i) => i === index ? { ...item, title: title.trim() } : item) }));
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = [...TEMPLATES, ...customTemplates].find(item => item.id === templateId);
    if (!template) return;
    commit(() => draftFromTemplate(template));
    setActiveStep(0); setSelectedId(undefined); setDialog(null); setToast('Template applied');
  };

  const saveTemplate = (title: string, description: string) => {
    const template: FormTemplate = { id: uid(), title, description, accent: 'custom', custom: true, draft: templateDraftSnapshot(draft) };
    const next = [template, ...customTemplates];
    setCustomTemplates(next);
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(next));
    setDialog(null);
    setToast('Template saved');
  };

  const deleteTemplate = (id: string) => {
    const next = customTemplates.filter(template => template.id !== id);
    setCustomTemplates(next);
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(next));
    setToast('Template removed');
  };

  const undo = () => setHistory(current => current.past.length ? { past: current.past.slice(0, -1), present: current.past[current.past.length - 1], future: [current.present, ...current.future] } : current);
  const redo = () => setHistory(current => current.future.length ? { past: [...current.past, current.present], present: current.future[0], future: current.future.slice(1) } : current);

  if (preview) return <PreviewMode draft={draft} stepIndex={activeStep} device={device} onDevice={setDevice} onStep={setActiveStep} onClose={() => setPreview(false)} />;

  return <div className={`form-builder ${dark ? 'fb-dark' : 'fb-light'} ${leftCollapsed ? 'left-closed' : ''} ${rightCollapsed ? 'right-closed' : ''}`}>
    <BuilderToolbar name={draft.name} saveState={saveState} status={draft.status} dark={dark} zoom={zoom} device={device} canUndo={history.past.length > 0} canRedo={history.future.length > 0} onUndo={undo} onRedo={redo} onZoom={setZoom} onDevice={setDevice} onPreview={() => setPreview(true)} onSave={() => save()} onSaveTemplate={() => setDialog('save-template')} onPublish={() => setDialog('publish')} onToggleTheme={() => setDark(value => !value)} onExit={onExit}/>
    <ComponentLibrary collapsed={leftCollapsed} search={search} onSearch={setSearch} onToggle={() => setLeftCollapsed(value => !value)} onAdd={addCatalogItem} onDragStart={() => { setDragOffset({ x: 24, y: 24 }); setDraggedElementId(undefined); setDragging(true); }} onOpenTemplates={() => setDialog('templates')}/>
    {step ? (
      <FormCanvas step={step} stepIndex={activeStep} steps={draft.steps} selectedId={selectedId} dragging={dragging} dropPoint={dropPoint} zoom={zoom} device={device} onCanvasClick={() => setSelectedId(undefined)} onSelect={setSelectedId} onDuplicate={duplicateElement} onDelete={deleteElement} onChange={updateElement} onDragStart={(event, id) => { const rect = (event.currentTarget as HTMLElement).getBoundingClientRect(); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-builder-element', id); setDragOffset({ x: event.clientX - rect.left, y: event.clientY - rect.top }); setDraggedElementId(id); setDragging(true); }} onDragEnd={() => { setDragging(false); setDropPoint(null); }} onDragOver={(event, point) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = draggedElementId ? 'move' : 'copy'; setDragging(true); setDropPoint({ x: snap(point.x - dragOffset.x / zoomScale), y: snap(point.y - dragOffset.y / zoomScale) }); }} onDrop={handleDrop} onStepChange={index => { setActiveStep(index); setSelectedId(undefined); }} onAddStep={addStep} onStepMenu={stepAction}/>
    ) : (
      <main className="fb-workspace">
        <div className="fb-canvas-empty ready" style={{ margin: '80px auto', maxWidth: 420 }}>
          <span>+</span>
          <h3>No pages yet</h3>
          <p>Add your first page to start building the form.</p>
          <div><button className="fb-add-step" style={{ padding: '0 16px' }} onClick={addStep}>+ Add page</button></div>
        </div>
      </main>
    )}
    <PropertiesPanel element={selected} elements={allElements} offers={offers} collapsed={rightCollapsed} onToggle={() => setRightCollapsed(value => !value)} onChange={patch => selectedId && updateElement(selectedId, patch)} onOpenSettings={() => setDialog('settings')}/>
    <footer className="fb-statusbar"><span><i className="online"/> Editor online</span><span>Snap to grid <b>ON</b></span><span className="push">{allElements.length} fields · {allElements.filter(field => field.required).length} required</span></footer>
    {dialog === 'templates' && <TemplateSelector templates={[...TEMPLATES, ...customTemplates]} onClose={() => setDialog(null)} onSelect={applyTemplate} onDelete={deleteTemplate}/>} 
    {dialog === 'save-template' && <SaveTemplateDialog draft={draft} onClose={() => setDialog(null)} onSave={saveTemplate}/>} 
    {dialog === 'settings' && <SettingsDialog draft={draft} offers={offers} onChange={patch => commit(current => ({ ...current, ...patch }))} onClose={() => setDialog(null)}/>} 
    {dialog === 'publish' && <PublishDialog draft={draft} onClose={() => setDialog(null)} onPublish={() => save(true)} busy={saveState === 'Saving...'}/>} 
    {toast && <div className="fb-toast"><span>✓</span>{toast}</div>}
  </div>;
}
export function BuilderToolbar({ name, saveState, status, dark, zoom, device, canUndo, canRedo, onUndo, onRedo, onZoom, onDevice, onPreview, onSave, onSaveTemplate, onPublish, onToggleTheme, onExit }: {
  name: string;
  saveState: 'Saved' | 'Saving...' | 'Save failed';
  status: string;
  dark: boolean;
  zoom: number;
  device: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onZoom: (value: number) => void;
  onDevice: (value: string) => void;
  onPreview: () => void;
  onSave: () => void;
  onSaveTemplate: () => void;
  onPublish: () => void;
  onToggleTheme: () => void;
  onExit: () => void;
}) {
  return <header className="fb-toolbar">
    <div className="fb-toolbar-brand">
      <button className="fb-logo" onClick={onExit}>BFPME<span>Recruit</span></button>
      <div className="fb-breadcrumb"><span>Recruitment</span><i>/</i><span>Forms</span><i>/</i><b>{name}</b></div>
      <em className={`fb-status ${status.toLowerCase()}`}>{status}</em>
    </div>
    <div className="fb-toolbar-center">
      <div className="fb-tool-cluster"><button disabled={!canUndo} onClick={onUndo} title="Undo">Undo</button><button disabled={!canRedo} onClick={onRedo} title="Redo">Redo</button></div>
      <div className="fb-tool-cluster zoom"><button onClick={() => onZoom(Math.max(50, zoom - 25))}>-</button><select value={zoom} onChange={e => onZoom(Number(e.target.value))}><option value="50">50%</option><option value="75">75%</option><option value="100">100%</option><option value="125">125%</option></select><button onClick={() => onZoom(Math.min(125, zoom + 25))}>+</button><button className="fit" onClick={() => onZoom(75)}>Fit</button></div>
      <div className="fb-tool-cluster devices"><button className={device === 'desktop' ? 'active' : ''} onClick={() => onDevice('desktop')} title="Desktop">D</button><button className={device === 'tablet' ? 'active' : ''} onClick={() => onDevice('tablet')} title="Tablet">T</button><button className={device === 'mobile' ? 'active' : ''} onClick={() => onDevice('mobile')} title="Mobile">M</button></div>
    </div>
    <div className="fb-toolbar-actions">
      <span className={`fb-save-state ${saveState === 'Saving...' ? 'saving' : ''}`}><i>{saveState === 'Saving...' ? '...' : saveState === 'Saved' ? 'ok' : '!'}</i>{saveState}</span>
      <button className="fb-theme-toggle" onClick={onToggleTheme} title="Toggle editor theme">{dark ? 'Light' : 'Dark'}</button>
      <button className="fb-secondary" onClick={onSaveTemplate}>Template</button>
      <button className="fb-secondary" onClick={onPreview}>Preview</button>
      <button className="fb-secondary save" onClick={onSave}>Save draft</button>
      <button className="fb-publish" onClick={onPublish}>Publish</button>
    </div>
  </header>;
}

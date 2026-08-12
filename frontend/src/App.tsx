import { FormEvent, useEffect, useMemo, useState } from 'react';

type View = 'home' | 'signin' | 'signup' | 'studio';
type Field = { id: number; type: string; label: string; icon: string };

const components = [
  ['Label', 'T'], ['Heading', 'H1'], ['Paragraph', '≡'], ['Text Field', '⌁'],
  ['Text Area', '≡'], ['Email Field', '@'], ['Phone Field', '⌕'], ['Number Field', '#'],
] as const;

function Logo() {
  return <div className="brand"><span className="brand-mark">✣</span><strong>FormaX</strong></div>;
}

function Scene() {
  return <div className="scene" aria-hidden="true">
    <div className="stars" />
    <div className="cube cube-main"><i/><i/><i/><i/><i/><i/></div>
    <div className="cube cube-small"><i/><i/><i/><i/><i/><i/></div>
    <div className="orb" />
  </div>;
}

function App() {
  const [view, setView] = useState<View>(() => (location.hash.slice(1) as View) || 'home');
  const go = (next: View) => { location.hash = next; setView(next); window.scrollTo(0, 0); };

  useEffect(() => {
    const sync = () => setView((location.hash.slice(1) as View) || 'home');
    addEventListener('hashchange', sync); return () => removeEventListener('hashchange', sync);
  }, []);

  return <main className={`app view-${view}`}>
    {view === 'home' && <Landing go={go} />}
    {(view === 'signin' || view === 'signup') && <Auth mode={view} go={go} />}
    {view === 'studio' && <Studio go={go} />}
  </main>;
}

function Landing({ go }: { go: (v: View) => void }) {
  return <div className="page-shell landing">
    <Scene />
    <header className="landing-nav"><Logo/><div className="nav-actions">
      <button className="btn btn-ghost" onClick={() => go('signin')}>Sign in</button>
      <button className="btn btn-primary" onClick={() => go('signup')}>Sign up</button>
    </div></header>
    <section className="hero-card">
      <span className="eyebrow">✣ &nbsp; Recruitment form studio</span>
      <h1>Design recruitment forms<br/><em>like a designer, not a developer</em></h1>
      <p>Drag, drop and arrange candidate fields on an infinite canvas — then publish a clean, bank-grade application experience.</p>
      <div className="hero-actions">
        <button className="btn btn-primary btn-large" onClick={() => go('studio')}>▦ &nbsp; Open Studio</button>
        <button className="btn btn-ghost btn-large" onClick={() => go('signup')}>Create an account &nbsp; →</button>
      </div>
    </section>
  </div>;
}

function Auth({ mode, go }: { mode: 'signin' | 'signup'; go: (v: View) => void }) {
  const signup = mode === 'signup';
  const submit = (e: FormEvent) => { e.preventDefault(); go('studio'); };
  return <div className="page-shell auth-page">
    <Scene />
    <section className="auth-card-3d">
      <div className="auth-top"><Logo/><button className="back" onClick={() => go('home')}>← &nbsp; Back to home</button></div>
      <h1>{signup ? 'Create your account' : 'Welcome back'}</h1>
      <p>{signup ? 'Start designing beautiful recruitment forms today.' : 'Sign in to continue designing your recruitment forms.'}</p>
      <form className="auth-form" onSubmit={submit}>
        {signup && <label>FULL NAME<input required placeholder="Your name" /></label>}
        <label>WORK EMAIL<input required type="email" placeholder="you@company.com" /></label>
        <label>PASSWORD<input required type="password" placeholder="••••••••" minLength={6}/></label>
        <button className="btn btn-primary btn-large" type="submit">{signup ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="auth-switch">{signup ? 'Already have an account?' : 'New to FormaX?'} <button onClick={() => go(signup ? 'signin' : 'signup')}>{signup ? 'Sign in' : 'Create an account'}</button></p>
    </section>
  </div>;
}

function Studio({ go }: { go: (v: View) => void }) {
  const [fields, setFields] = useState<Field[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState(false);
  const selectedField = fields.find(f => f.id === selected);
  const filtered = useMemo(() => components.filter(([name]) => name.toLowerCase().includes(query.toLowerCase())), [query]);
  const add = (name: string, icon: string) => {
    const item = { id: Date.now(), type: name, label: name === 'Heading' ? 'Application Form' : name, icon };
    setFields(old => [...old, item]); setSelected(item.id); setToast(true); setTimeout(() => setToast(false), 2200);
  };
  const rename = (label: string) => setFields(old => old.map(f => f.id === selected ? {...f, label} : f));
  return <div className="studio-page">
    <header className="studio-top"><button className="logo-button" onClick={() => go('home')}><span className="brand-mark">FX</span></button>
      <div className="doc-title"><strong>Graduate Programme — Application</strong><small>✓ All changes saved</small></div>
      <div className="device-switch">▣　▯　▯</div><div className="zoom">−　 <strong>100%</strong>　＋</div>
      <button className="btn btn-ghost">▷ Preview</button><button className="btn btn-ghost">▣ Save Draft</button><button className="btn btn-primary">♨ Publish</button>
    </header>
    <div className="studio-grid">
      <aside className="library"><input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="⌕  Search components..."/>
        <div className="section-title"><span>⌄　<span className="cyan">●</span> BASIC</span><span>{filtered.length}</span></div>
        <div className="component-stack">{filtered.map(([name, icon]) => <button draggable key={name} onDragEnd={() => add(name, icon)} onClick={() => add(name, icon)} className="component-item"><span>{icon}</span><strong>{name}</strong><i>⠿</i></button>)}</div>
      </aside>
      <section className="workarea">
        <div className="work-toolbar"><span className="cyan">⌘　▦</span><span>│　⚑　◫　▤　⌗</span><small>▱　{fields.length} on this step · {fields.length} total</small></div>
        <div className="canvas" onDragOver={e => e.preventDefault()}>
          {fields.length === 0 ? <div className="empty-canvas"><span>＋</span><strong>Start building your form</strong><p>Click or drag a component from the left</p></div> : fields.map(f => <button key={f.id} onClick={() => setSelected(f.id)} className={`canvas-field ${selected === f.id ? 'selected' : ''}`}><span>{f.icon}</span>{f.type === 'Heading' ? <h2>{f.label}</h2> : <><label>{f.label}</label><div className="fake-input"/></>}</button>)}
        </div>
        <div className="steps"><b>▱　STEPS</b><span>1　 Page 1</span><button>＋</button></div>
      </section>
      <aside className="inspector">{selectedField ? <>
        <div className="inspect-head"><span>{selectedField.icon}</span><div><strong>{selectedField.type}</strong><small>#{selectedField.id.toString().slice(-8)}</small></div></div>
        <div className="inspect-tabs"><b> T　Content</b><span>◉ Style</span><span>⌘ Logic</span></div>
        <div className="inspect-form"><label>Label<input value={selectedField.label} onChange={e => rename(e.target.value)}/></label><label>Placeholder<input/></label><label>Help text<input/></label><label>Default value<input/></label><h5>♢ VALIDATION</h5><div className="required">Required <i/></div></div>
      </> : <div className="no-selection"><span>☷</span><strong>No component selected</strong><p>Select an element on the canvas to edit its content, validation, style and conditional logic.</p></div>}</aside>
    </div>
    {toast && <div className="toast">✓　<strong>Component added</strong><small>Configure it in the properties panel</small></div>}
  </div>;
}

export default App;

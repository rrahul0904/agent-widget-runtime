import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, ShieldCheck, Sparkles, Bookmark, Clock, Command, ArrowRight, Copy, RotateCcw, CheckCircle2, Layers3, X, Github, Workflow, Download, Upload, Wifi, Play, LoaderCircle } from 'lucide-react';
import { allTools as tools, compatibleNextTools, searchTools, validateRegistry } from './engine';
import type { ToolArtifact, ToolDefinition, ToolResult } from './types';
import './styles.css';
import './extended.css';

const categories = ['All', ...Array.from(new Set(tools.map(t => t.category)))];
const storage = {
  read(key: string): string[] { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } },
  write(key: string, value: string[]) { localStorage.setItem(key, JSON.stringify(value)); }
};

const executionLabel = (tool: ToolDefinition) => tool.privacy === 'network-assisted' ? 'Network-assisted' : tool.privacy === 'account-sync' ? 'Account sync' : 'Local';
const inputMode = (tool: ToolDefinition) => tool.inputMode ?? (tool.inputKind === 'none' ? 'none' : 'text');

function ToolCard({ tool, onOpen, bookmarked, onBookmark }: { tool: ToolDefinition; onOpen: (tool: ToolDefinition) => void; bookmarked: boolean; onBookmark: (id: string) => void }) {
  const Icon = tool.icon;
  const network = tool.privacy === 'network-assisted';
  return <article className="tool-card">
    <div className="tool-card-top"><span className="icon-box"><Icon size={19}/></span><span className={`execution-badge ${network ? 'network' : 'local'}`}>{network ? <Wifi size={13}/> : <ShieldCheck size={13}/>} {executionLabel(tool)}</span></div>
    <div><h3>{tool.name}</h3><p>{tool.description}</p></div>
    <div className="tags">{tool.tags.slice(0,3).map(tag => <span key={tag}>{tag}</span>)}</div>
    <div className="card-actions"><button className="primary small" onClick={() => onOpen(tool)}>Open <ArrowRight size={15}/></button><button aria-label="Bookmark tool" className={`icon-button ${bookmarked ? 'active' : ''}`} onClick={() => onBookmark(tool.id)}><Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'}/></button></div>
  </article>
}

function downloadArtifact(item: ToolArtifact) {
  const url = URL.createObjectURL(item.blob);
  const link = document.createElement('a');
  link.href = url; link.download = item.name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Workbench({ tool, initialInput, onClose, onChain }: { tool: ToolDefinition; initialInput?: string; onClose: () => void; onChain: (tool: ToolDefinition, value: string) => void }) {
  const mode = inputMode(tool);
  const [input, setInput] = useState(initialInput ?? tool.sample);
  const [files, setFiles] = useState<File[]>([]);
  const [option, setOption] = useState(tool.options?.[0]);
  const [result, setResult] = useState<ToolResult>({ output: '' });
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const runId = useRef(0);
  const next = compatibleNextTools(tool);
  const canAutoRun = tool.privacy === 'local' && mode === 'text' && tool.autoRun !== false;
  const showTextEditor = mode === 'text' || ((mode === 'file' || mode === 'files') && Boolean(tool.sample));

  useEffect(() => { setInput(initialInput ?? tool.sample); setFiles([]); setOption(tool.options?.[0]); setResult({output:''}); }, [tool.id, initialInput]);

  async function run() {
    const current = ++runId.current;
    setRunning(true);
    try {
      const value = await tool.run(input, { option, files });
      if (current === runId.current) setResult(value);
    } catch (error) {
      if (current === runId.current) setResult({ output: '', error: error instanceof Error ? error.message : 'Tool execution failed.' });
    } finally { if (current === runId.current) setRunning(false); }
  }

  useEffect(() => { if (canAutoRun) void run(); }, [input, option, tool.id]);
  async function copy() { if (!result.output) return; await navigator.clipboard.writeText(result.output); setCopied(true); setTimeout(() => setCopied(false), 1200); }

  const Icon = tool.icon;
  const network = tool.privacy === 'network-assisted';
  return <section className="workbench panel">
    <div className="workbench-head">
      <div className="title-cluster"><span className="icon-box big"><Icon size={22}/></span><div><div className="eyebrow">{network ? 'NETWORK-ASSISTED WORKBENCH' : 'LOCAL WORKBENCH'}</div><h2>{tool.name}</h2></div></div>
      <button className="icon-button" onClick={onClose}><X size={18}/></button>
    </div>
    <p className="muted">{tool.description}</p>
    <div className={`privacy-manifest ${network ? 'network' : ''}`}>
      {network ? <Wifi size={16}/> : <ShieldCheck size={16}/>}<div><strong>{executionLabel(tool)}</strong><span>{tool.privacyNote ?? 'Runs in this browser tab. ToolForge does not upload this tool’s input to a server.'}</span></div>
    </div>
    {tool.options && <div className="segmented">{tool.options.map(item => <button className={option === item ? 'selected' : ''} key={item} onClick={() => setOption(item)}>{item}</button>)}</div>}
    {(mode === 'file' || mode === 'files') && <label className="file-drop"><Upload size={20}/><strong>{mode === 'files' ? 'Choose files' : 'Choose file'}</strong><span>{tool.accept ?? 'Any supported file'} · processed {network ? 'according to the network disclosure above' : 'locally'}</span><input type="file" accept={tool.accept} multiple={mode === 'files'} onChange={e => { setFiles(Array.from(e.target.files ?? [])); setResult({output:''}); }}/>{files.length > 0 && <em>{files.map(file => file.name).join(', ')}</em>}</label>}
    <div className={`editor-grid ${!showTextEditor ? 'single' : ''}`}>
      {showTextEditor && <div className="editor"><div className="editor-head"><span>{mode === 'text' ? 'Input' : 'Parameters'}</span><div><button onClick={() => setInput(tool.sample)}><RotateCcw size={14}/> Sample</button><button onClick={() => setInput('')}>Clear</button></div></div><textarea value={input} placeholder={tool.placeholder} onChange={e => setInput(e.target.value)} /></div>}
      <div className={`editor output ${result.error ? 'has-error':''}`}><div className="editor-head"><span>{result.error ? 'Error' : 'Output'}</span>{result.output && <button onClick={copy}>{copied ? <CheckCircle2 size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy'}</button>}</div><pre>{result.error || result.output || (canAutoRun ? 'Run a tool to see output.' : 'Ready when you are — execution starts only when you press Run.')}</pre>{result.meta && !result.error && <div className="output-meta">{result.meta}</div>}</div>
    </div>
    {!canAutoRun && <div className="run-row"><button className="primary run-button" disabled={running} onClick={() => void run()}>{running ? <LoaderCircle className="spin" size={16}/> : <Play size={16}/>} {running ? 'Running…' : network ? 'Run network request' : 'Run locally'}</button>{network && <span>No silent request: network tools only execute from this button.</span>}</div>}
    {result.artifacts?.length ? <div className="artifact-row"><span><Download size={15}/> Downloads</span>{result.artifacts.map((item, i) => <button key={`${item.name}-${i}`} onClick={() => downloadArtifact(item)}><Download size={13}/> {item.name}</button>)}</div> : null}
    {next.length > 0 && result.output && !result.error && <div className="chain-row"><span><Workflow size={15}/> Send output to</span>{next.map(t => <button key={t.id} onClick={() => onChain(t, result.output)}>{t.name} <ArrowRight size={13}/></button>)}</div>}
  </section>
}

export default function App() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [active, setActive] = useState<ToolDefinition | null>(tools[0]);
  const [chainInput, setChainInput] = useState<string | undefined>();
  const [bookmarks, setBookmarks] = useState<string[]>(() => storage.read('toolforge:bookmarks'));
  const [recents, setRecents] = useState<string[]>(() => storage.read('toolforge:recents'));
  const [view, setView] = useState<'discover'|'bookmarks'|'recents'>('discover');
  const searchRef = useRef<HTMLInputElement>(null);
  const registry = useMemo(() => validateRegistry(), []);
  const localCount = tools.filter(tool => tool.privacy === 'local').length;
  const networkCount = tools.filter(tool => tool.privacy === 'network-assisted').length;

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.key === '/' && document.activeElement?.tagName !== 'TEXTAREA') || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);

  const results = useMemo(() => {
    const base = searchTools(query, category);
    if (view === 'bookmarks') return base.filter(t => bookmarks.includes(t.id));
    if (view === 'recents') return base.filter(t => recents.includes(t.id));
    return base;
  }, [query, category, view, bookmarks, recents]);

  function open(tool: ToolDefinition, input?: string) {
    setActive(tool); setChainInput(input);
    const next = [tool.id, ...recents.filter(id => id !== tool.id)].slice(0, 12); setRecents(next); storage.write('toolforge:recents', next);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }
  function toggleBookmark(id: string) { const next = bookmarks.includes(id) ? bookmarks.filter(x => x !== id) : [id, ...bookmarks]; setBookmarks(next); storage.write('toolforge:bookmarks', next); }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Layers3 size={20}/></div><div><strong>ToolForge</strong><span>OS</span></div></div>
      <nav><button className={view==='discover'?'active':''} onClick={() => setView('discover')}><Sparkles size={17}/> Discover</button><button className={view==='bookmarks'?'active':''} onClick={() => setView('bookmarks')}><Bookmark size={17}/> Bookmarks <em>{bookmarks.length}</em></button><button className={view==='recents'?'active':''} onClick={() => setView('recents')}><Clock size={17}/> Recents <em>{recents.length}</em></button></nav>
      <div className="sidebar-spacer" />
      <div className={`registry-status ${registry.valid ? '' : 'invalid'}`}><div><CheckCircle2 size={16}/><strong>{registry.valid ? 'Registry healthy' : 'Registry issue'}</strong></div><span>{registry.toolCount} canonical tools</span><span>{registry.aliasCount} searchable names</span><span>{registry.problems.length} registry conflicts</span></div>
      <a className="repo-link" href="https://github.com/rrahul0904/agent-widget-runtime" target="_blank" rel="noreferrer"><Github size={16}/> Source</a>
    </aside>

    <main>
      <header className="topbar"><div className="search-wrap"><Search size={18}/><input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search a task — merge pdf, jwt decode, resize image, dns lookup"/><kbd><Command size={12}/>K</kbd></div><div className="privacy-chip"><ShieldCheck size={15}/> Per-tool execution contract</div></header>
      <div className="content">
        <section className="hero"><div><div className="eyebrow">LOCAL-FIRST UTILITY OS</div><h1>Useful tools.<br/><span>Provable boundaries.</span></h1><p>PDF, image, developer, security, text, data and network utilities in one composable workspace. Local tools stay in your browser; network-assisted tools are labeled before you run them and never execute silently.</p></div><div className="hero-metrics"><div><strong>{tools.length}</strong><span>canonical tools</span></div><div><strong>{localCount}</strong><span>browser-local</span></div><div><strong>{networkCount}</strong><span>network-assisted</span></div></div></section>
        {active && <Workbench tool={active} initialInput={chainInput} onClose={() => setActive(null)} onChain={open}/>} 
        <section className="catalog-head"><div><div className="eyebrow">{view.toUpperCase()}</div><h2>{view === 'discover' ? 'Find the task, not the page' : view === 'bookmarks' ? 'Your pinned tools' : 'Recently opened'}</h2></div><span>{results.length} result{results.length===1?'':'s'}</span></section>
        <div className="category-row">{categories.map(c => <button className={category===c?'selected':''} key={c} onClick={() => setCategory(c)}>{c}</button>)}</div>
        {results.length ? <div className="tool-grid">{results.map(tool => <ToolCard key={tool.id} tool={tool} onOpen={open} bookmarked={bookmarks.includes(tool.id)} onBookmark={toggleBookmark}/>)}</div> : <div className="empty"><Search size={24}/><h3>No canonical tool found</h3><p>Try a task phrase or clear the current filter.</p></div>}
      </div>
    </main>
  </div>
}

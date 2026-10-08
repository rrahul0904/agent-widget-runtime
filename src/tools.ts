import {
  Braces, FileJson2, Binary, Link, Fingerprint, Hash, FileText, CaseSensitive,
  WandSparkles, Clock3, Palette, Regex, Ruler, Diff
} from 'lucide-react';
import type { ToolDefinition, ToolResult } from './types';

const ok = (output: string, meta?: string, kind?: ToolResult['kind']): ToolResult => ({ output, meta, kind });
const fail = (message: string): ToolResult => ({ output: '', error: message });
const escapeCsv = (value: string) => /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;

function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '"') {
      if (quoted && input[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  row.push(cell); rows.push(row);
  return rows.filter(r => r.some(v => v.length));
}

export const tools: ToolDefinition[] = [
  {
    id: 'json-workbench', name: 'JSON Workbench', description: 'Prettify, minify, sort and validate JSON without duplicate formatter tools.',
    aliases: ['json prettify', 'json formatter', 'json beautifier', 'json minifier', 'json pretty print'], category: 'Data', tags: ['json','format','validate','minify'],
    inputKind: 'json', outputKind: 'json', privacy: 'local', icon: Braces, placeholder: '{"hello":"world","count":2}', sample: '{"hello":"world","items":[3,1,2]}', options: ['Prettify', 'Minify', 'Sort keys'],
    run: (input, ctx) => { try { const data = JSON.parse(input); const mode = ctx.option ?? 'Prettify'; if (mode === 'Minify') return ok(JSON.stringify(data), 'Valid JSON · minified', 'json'); if (mode === 'Sort keys') { const sort = (x: unknown): unknown => Array.isArray(x) ? x.map(sort) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x as Record<string, unknown>).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => [k, sort(v)])) : x; return ok(JSON.stringify(sort(data), null, 2), 'Valid JSON · recursively sorted', 'json'); } return ok(JSON.stringify(data, null, 2), 'Valid JSON · 2-space indent', 'json'); } catch (e) { return fail(e instanceof Error ? e.message : 'Invalid JSON'); } }
  },
  {
    id: 'csv-json', name: 'CSV ⇄ JSON', description: 'Convert CSV rows to JSON objects or JSON arrays back to CSV.', aliases: ['csv to json','json to csv','csv converter'], category: 'Data', tags: ['csv','json','convert'],
    inputKind: 'text', outputKind: 'text', privacy: 'local', icon: FileJson2, placeholder: 'name,role\nAda,Engineer', sample: 'name,role\nAda,Engineer\nGrace,Scientist', options: ['CSV → JSON', 'JSON → CSV'],
    run: (input, ctx) => { try { if ((ctx.option ?? 'CSV → JSON') === 'JSON → CSV') { const data = JSON.parse(input); if (!Array.isArray(data) || !data.length || typeof data[0] !== 'object') return fail('Provide a JSON array of objects.'); const keys = [...new Set(data.flatMap((r: Record<string, unknown>) => Object.keys(r)))]; return ok([keys.join(','), ...data.map((r: Record<string, unknown>) => keys.map(k => escapeCsv(String(r[k] ?? ''))).join(','))].join('\n'), `${data.length} rows`, 'csv'); } const rows = parseCsv(input); if (rows.length < 2) return fail('CSV needs a header row and at least one data row.'); const [headers, ...body] = rows; return ok(JSON.stringify(body.map(row => Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))), null, 2), `${body.length} rows`, 'json'); } catch (e) { return fail(e instanceof Error ? e.message : 'Conversion failed'); } }
  },
  {
    id: 'base64', name: 'Base64 Studio', description: 'Encode or decode UTF-8 text locally.', aliases: ['base64 encode','base64 decode','base64 converter'], category: 'Developer', tags: ['base64','encode','decode'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Binary, placeholder: 'Hello ToolForge', sample: 'Hello ToolForge', options: ['Encode', 'Decode'],
    run: (input, ctx) => { try { if ((ctx.option ?? 'Encode') === 'Decode') { const bytes = Uint8Array.from(atob(input.trim()), c => c.charCodeAt(0)); return ok(new TextDecoder().decode(bytes), 'Decoded locally', 'text'); } const bytes = new TextEncoder().encode(input); let binary = ''; bytes.forEach(b => binary += String.fromCharCode(b)); return ok(btoa(binary), 'Encoded locally', 'text'); } catch { return fail('Invalid Base64 input.'); } }
  },
  {
    id: 'url-codec', name: 'URL Codec', description: 'Encode or decode URL components safely.', aliases: ['url encode','url decode','percent encode'], category: 'Developer', tags: ['url','encode','decode'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Link, placeholder: 'hello world?x=1', sample: 'hello world?x=1&y=two', options: ['Encode', 'Decode'],
    run: (input, ctx) => { try { return ok((ctx.option ?? 'Encode') === 'Decode' ? decodeURIComponent(input) : encodeURIComponent(input), 'RFC 3986 component transform', 'text'); } catch { return fail('Malformed encoded URL input.'); } }
  },
  {
    id: 'uuid', name: 'UUID Generator', description: 'Generate cryptographically strong UUID v4 identifiers.', aliases: ['random uuid','guid generator','uuid v4'], category: 'Developer', tags: ['uuid','guid','random'], inputKind: 'none', outputKind: 'text', privacy: 'local', icon: Fingerprint, placeholder: 'Count (1–100)', sample: '5',
    run: (input) => { const count = Math.min(100, Math.max(1, Number.parseInt(input || '1', 10) || 1)); return ok(Array.from({length: count}, () => crypto.randomUUID()).join('\n'), `${count} UUID${count === 1 ? '' : 's'}`, 'text'); }
  },
  {
    id: 'sha256', name: 'SHA-256 Hash', description: 'Hash text with the browser Web Crypto API.', aliases: ['hash text','sha256','checksum'], category: 'Developer', tags: ['hash','sha256','crypto'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Hash, placeholder: 'Text to hash', sample: 'ToolForge',
    run: async (input) => { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)); return ok([...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2,'0')).join(''), 'SHA-256 · Web Crypto', 'text'); }
  },
  {
    id: 'word-counter', name: 'Text Inspector', description: 'Count words, characters, lines and estimated reading time.', aliases: ['word counter','character counter','text stats'], category: 'Text', tags: ['words','characters','reading time'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: FileText, placeholder: 'Paste text to inspect…', sample: 'A small useful tool is better than a giant confusing directory.',
    run: (input) => { const words = input.trim() ? input.trim().split(/\s+/).length : 0; const chars = input.length; const lines = input ? input.split(/\r?\n/).length : 0; const minutes = words / 200; return ok(`Words: ${words}\nCharacters: ${chars}\nCharacters (no spaces): ${input.replace(/\s/g,'').length}\nLines: ${lines}\nReading time: ${minutes < 1 ? '< 1' : Math.ceil(minutes)} min`, 'Live text statistics', 'text'); }
  },
  {
    id: 'case-converter', name: 'Case Converter', description: 'Switch text between common naming and prose cases.', aliases: ['uppercase','lowercase','camel case','snake case','kebab case'], category: 'Text', tags: ['case','camel','snake','kebab'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: CaseSensitive, placeholder: 'hello useful world', sample: 'hello useful world', options: ['UPPERCASE','lowercase','camelCase','snake_case','kebab-case','Title Case'],
    run: (input, ctx) => { const words = input.trim().split(/[^A-Za-z0-9]+/).filter(Boolean); const mode = ctx.option ?? 'UPPERCASE'; const map: Record<string,string> = { UPPERCASE: input.toUpperCase(), lowercase: input.toLowerCase(), camelCase: words.map((w,i) => i ? w[0]?.toUpperCase()+w.slice(1).toLowerCase() : w.toLowerCase()).join(''), snake_case: words.map(w => w.toLowerCase()).join('_'), 'kebab-case': words.map(w => w.toLowerCase()).join('-'), 'Title Case': words.map(w => w[0]?.toUpperCase()+w.slice(1).toLowerCase()).join(' ') }; return ok(map[mode] ?? input, mode, 'text'); }
  },
  {
    id: 'slugify', name: 'Slugify', description: 'Create clean URL-friendly slugs from titles.', aliases: ['slug generator','url slug','seo slug'], category: 'Text', tags: ['slug','seo','url'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: WandSparkles, placeholder: 'My Useful New Tool!', sample: 'Build once, compose everywhere!',
    run: (input) => ok(input.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''), 'URL-safe slug', 'text')
  },
  {
    id: 'timestamp', name: 'Timestamp Converter', description: 'Convert Unix timestamps and ISO dates in both directions.', aliases: ['unix timestamp','epoch converter','date converter'], category: 'Date & Time', tags: ['timestamp','epoch','date','iso'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Clock3, placeholder: '2026-10-08T19:41:00-04:00 or 1791502860', sample: '2026-10-08T19:41:00-04:00',
    run: (input) => { const trimmed = input.trim(); const numeric = /^\d{10,13}$/.test(trimmed); const date = numeric ? new Date(Number(trimmed) * (trimmed.length === 10 ? 1000 : 1)) : new Date(trimmed); if (Number.isNaN(date.getTime())) return fail('Enter an ISO date or 10/13-digit Unix timestamp.'); return ok(`ISO: ${date.toISOString()}\nUnix seconds: ${Math.floor(date.getTime()/1000)}\nUnix milliseconds: ${date.getTime()}\nUTC: ${date.toUTCString()}`, 'Four equivalent representations', 'text'); }
  },
  {
    id: 'color-converter', name: 'Color Converter', description: 'Convert HEX colors to RGB and HSL with contrast helpers.', aliases: ['hex to rgb','rgb color','hex to hsl'], category: 'Color', tags: ['hex','rgb','hsl','color'], inputKind: 'color', outputKind: 'text', privacy: 'local', icon: Palette, placeholder: '#7c5cff', sample: '#7c5cff',
    run: (input) => { const m = input.trim().match(/^#?([0-9a-f]{6})$/i); if (!m) return fail('Enter a 6-digit HEX color such as #7c5cff.'); const n = parseInt(m[1],16), r=n>>16, g=(n>>8)&255, b=n&255; const rf=r/255,gf=g/255,bf=b/255,max=Math.max(rf,gf,bf),min=Math.min(rf,gf,bf),d=max-min; let h=0; if(d){ if(max===rf) h=((gf-bf)/d)%6; else if(max===gf) h=(bf-rf)/d+2; else h=(rf-gf)/d+4; h=Math.round(h*60); if(h<0)h+=360;} const l=(max+min)/2; const s=d===0?0:d/(1-Math.abs(2*l-1)); return ok(`HEX: #${m[1].toUpperCase()}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${h}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`, 'Converted locally', 'text'); }
  },
  {
    id: 'regex', name: 'Regex Lab', description: 'Test JavaScript regular expressions and inspect matches.', aliases: ['regex tester','regular expression','regexp'], category: 'Developer', tags: ['regex','javascript','match'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Regex, placeholder: 'Pattern on first line, test text below\n\\btool\\w*\\b\nToolForge has tools.', sample: '\\btool\\w*\\b\nToolForge has tools and toolchains.',
    run: (input) => { const [pattern='', ...rest] = input.split(/\r?\n/); const text=rest.join('\n'); try { const re=new RegExp(pattern,'gi'); const matches=[...text.matchAll(re)]; return ok(matches.length ? matches.map((m,i)=>`${i+1}. ${m[0]} @ ${m.index}`).join('\n') : 'No matches', `${matches.length} match${matches.length===1?'':'es'}`, 'text'); } catch(e){ return fail(e instanceof Error?e.message:'Invalid regular expression'); } }
  },
  {
    id: 'length-converter', name: 'Length Converter', description: 'Convert common metric and imperial length units.', aliases: ['unit converter','meters to feet','length units'], category: 'Math', tags: ['unit','length','meters','feet'], inputKind: 'number', outputKind: 'text', privacy: 'local', icon: Ruler, placeholder: '10', sample: '10', options: ['Meters → Feet','Feet → Meters','Kilometers → Miles','Miles → Kilometers'],
    run: (input,ctx)=>{ const n=Number(input); if(!Number.isFinite(n)) return fail('Enter a numeric value.'); const mode=ctx.option??'Meters → Feet'; const conversions:Record<string,[number,string]>={ 'Meters → Feet':[3.280839895,'ft'],'Feet → Meters':[0.3048,'m'],'Kilometers → Miles':[0.621371192,'mi'],'Miles → Kilometers':[1.609344,'km']}; const [factor,unit]=conversions[mode]; return ok(`${(n*factor).toLocaleString(undefined,{maximumFractionDigits:8})} ${unit}`, mode, 'text'); }
  },
  {
    id: 'text-diff', name: 'Text Diff', description: 'Compare two text blocks line by line.', aliases: ['compare text','diff checker','text compare'], category: 'Text', tags: ['diff','compare','lines'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Diff, placeholder: 'First text\n---\nSecond text', sample: 'hello\nworld\n---\nhello\nToolForge',
    run:(input)=>{ const [a,b='']=input.split(/\n---\n/); const left=a.split(/\r?\n/),right=b.split(/\r?\n/),max=Math.max(left.length,right.length); const lines:string[]=[]; for(let i=0;i<max;i++){ if(left[i]===right[i]) lines.push(`  ${left[i]??''}`); else { if(left[i]!==undefined) lines.push(`- ${left[i]}`); if(right[i]!==undefined) lines.push(`+ ${right[i]}`); } } return ok(lines.join('\n'), 'Prefix - removed · + added', 'text'); }
  }
];

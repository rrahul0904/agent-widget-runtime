import { Binary, Braces, Clock3, FileJson2, FileText, Fingerprint, Hash, Link, Palette, Regex, Ruler, WandSparkles } from 'lucide-react';
import type { ToolContext, ToolDefinition, ToolResult } from './types';

const ok = (output: string, meta?: string, kind?: ToolResult['kind'], artifacts?: ToolResult['artifacts']): ToolResult => ({ output, meta, kind, artifacts });
const fail = (message: string): ToolResult => ({ output: '', error: message });
const textFile = (ctx: ToolContext) => ctx.files?.[0];
const parseHex = (raw: string) => {
  const m = raw.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  return { hex: `#${m[1].toUpperCase()}`, r: n >> 16, g: (n >> 8) & 255, b: n & 255 };
};
const bytesToHex = (bytes: Uint8Array) => [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
const artifact = (name: string, mime: string, blob: Blob) => ({ name, mime, blob });

async function imageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('The selected image could not be decoded.'));
      image.src = url;
    });
    return image;
  } finally { URL.revokeObjectURL(url); }
}

function canvasBlob(canvas: HTMLCanvasElement, mime = 'image/png', quality = .9): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Image export failed.')), mime, quality));
}

function canvasFor(image: HTMLImageElement, width = image.naturalWidth, height = image.naturalHeight) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function jwtPart(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(normalized), c => c.charCodeAt(0))));
}

function decodeAudio(file: File) {
  return file.arrayBuffer().then(async bytes => {
    const context = new AudioContext();
    try { return await context.decodeAudioData(bytes.slice(0)); }
    finally { void context.close(); }
  });
}

function markdownToHtml(source: string) {
  const inline = (value: string) => escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');
  return source.split(/\r?\n/).map(line => {
    if (/^###\s/.test(line)) return `<h3>${inline(line.slice(4))}</h3>`;
    if (/^##\s/.test(line)) return `<h2>${inline(line.slice(3))}</h2>`;
    if (/^#\s/.test(line)) return `<h1>${inline(line.slice(2))}</h1>`;
    if (/^[-*]\s/.test(line)) return `<li>${inline(line.slice(2))}</li>`;
    return line.trim() ? `<p>${inline(line)}</p>` : '';
  }).join('\n');
}

function readableBytes(value: number) {
  if (!Number.isFinite(value) || value < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let n = value; let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 1 : 2)} ${units[i]}`;
}

export const extendedTools: ToolDefinition[] = [
  {
    id: 'jwt-inspector', name: 'JWT Inspector', description: 'Decode JWT header and payload locally without sending the token anywhere.',
    aliases: ['jwt decode', 'inspect jwt', 'jwt claims'], category: 'Security', tags: ['jwt', 'token', 'claims'], inputKind: 'text', outputKind: 'json', privacy: 'local', icon: Fingerprint,
    placeholder: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature', sample: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhIn0.signature',
    run: input => { try { const [header, payload] = input.trim().split('.'); if (!header || !payload) return fail('Enter a three-part JWT.'); return ok(JSON.stringify({ header: jwtPart(header), payload: jwtPart(payload) }, null, 2), 'Decoded only — signature is not verified', 'json'); } catch { return fail('JWT header or payload is not valid Base64URL JSON.'); } }
  },
  {
    id: 'hash-studio', name: 'Hash Studio', description: 'Generate SHA-1, SHA-256, SHA-384 or SHA-512 digests with Web Crypto.',
    aliases: ['sha1 hash', 'sha512 hash', 'multi hash'], category: 'Security', tags: ['sha1', 'sha384', 'sha512', 'digest'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Hash,
    placeholder: 'Text to hash', sample: 'ToolForge Utility OS', options: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'],
    run: async (input, ctx) => { const algorithm = ctx.option ?? 'SHA-256'; const digest = await crypto.subtle.digest(algorithm, new TextEncoder().encode(input)); return ok(bytesToHex(new Uint8Array(digest)), `${algorithm} · Web Crypto`, 'text'); }
  },
  {
    id: 'password-generator', name: 'Password Generator', description: 'Create strong passwords locally with cryptographically secure randomness.',
    aliases: ['secure password', 'random password'], category: 'Security', tags: ['password', 'random', 'security'], inputKind: 'number', outputKind: 'text', privacy: 'local', icon: Fingerprint,
    placeholder: 'Length 8–128', sample: '24', options: ['Letters + numbers + symbols', 'Letters + numbers', 'Hex'],
    run: (input, ctx) => { const length = Math.min(128, Math.max(8, Number.parseInt(input || '24', 10) || 24)); const mode = ctx.option ?? 'Letters + numbers + symbols'; const chars = mode === 'Hex' ? '0123456789abcdef' : mode === 'Letters + numbers' ? 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789' : 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-+='; const bytes = crypto.getRandomValues(new Uint32Array(length)); return ok([...bytes].map(v => chars[v % chars.length]).join(''), `${length} characters`, 'text'); }
  },
  {
    id: 'secure-token', name: 'Secure Token Generator', description: 'Generate URL-safe or hexadecimal random tokens entirely in-browser.',
    aliases: ['random token', 'hex token', 'api secret generator'], category: 'Security', tags: ['token', 'secret', 'random'], inputKind: 'number', outputKind: 'text', privacy: 'local', icon: Fingerprint,
    placeholder: 'Bytes 16–128', sample: '32', options: ['Hex', 'Base64URL'],
    run: (input, ctx) => { const count = Math.min(128, Math.max(16, Number.parseInt(input || '32', 10) || 32)); const bytes = crypto.getRandomValues(new Uint8Array(count)); if ((ctx.option ?? 'Hex') === 'Hex') return ok(bytesToHex(bytes), `${count} random bytes`, 'text'); let binary = ''; bytes.forEach(b => binary += String.fromCharCode(b)); return ok(btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, ''), `${count} random bytes`, 'text'); }
  },
  {
    id: 'url-inspector', name: 'URL Inspector', description: 'Parse a URL into origin, path, query parameters and fragment.',
    aliases: ['url parser', 'query string inspector', 'parse url'], category: 'Developer', tags: ['url', 'query', 'origin'], inputKind: 'text', outputKind: 'json', privacy: 'local', icon: Link,
    placeholder: 'https://example.com/path?a=1#top', sample: 'https://example.com/search?q=toolforge&lang=en#results',
    run: input => { try { const u = new URL(input.trim()); return ok(JSON.stringify({ protocol: u.protocol, host: u.host, hostname: u.hostname, port: u.port || null, pathname: u.pathname, query: Object.fromEntries(u.searchParams.entries()), hash: u.hash || null, origin: u.origin }, null, 2), 'Parsed with the browser URL API', 'json'); } catch { return fail('Enter an absolute URL including http:// or https://.'); } }
  },
  {
    id: 'browser-diagnostics', name: 'Browser Diagnostics', description: 'Inspect browser, screen, locale and capability information without a network request.',
    aliases: ['browser info', 'device diagnostics', 'client diagnostics'], category: 'Utility', tags: ['browser', 'screen', 'locale'], inputKind: 'none', outputKind: 'json', privacy: 'local', icon: WandSparkles,
    placeholder: '', sample: '', inputMode: 'none',
    run: () => ok(JSON.stringify({ userAgent: navigator.userAgent, language: navigator.language, languages: navigator.languages, platform: navigator.platform, online: navigator.onLine, cookiesEnabled: navigator.cookieEnabled, hardwareConcurrency: navigator.hardwareConcurrency, screen: { width: screen.width, height: screen.height, pixelRatio: devicePixelRatio }, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }, null, 2), 'Local browser APIs only', 'json')
  },
  {
    id: 'number-base', name: 'Number Base Converter', description: 'Convert integers between decimal, binary, octal and hexadecimal.',
    aliases: ['decimal to binary', 'hex to decimal', 'binary converter'], category: 'Math', tags: ['binary', 'hex', 'octal', 'base'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Binary,
    placeholder: '255', sample: '255', options: ['From decimal', 'From hex', 'From binary', 'From octal'],
    run: (input, ctx) => { const mode = ctx.option ?? 'From decimal'; const base = mode === 'From hex' ? 16 : mode === 'From binary' ? 2 : mode === 'From octal' ? 8 : 10; const value = Number.parseInt(input.trim().replace(/^0x/i, ''), base); if (!Number.isFinite(value)) return fail('Enter a valid integer for the selected source base.'); return ok(`Decimal: ${value}\nBinary: ${value.toString(2)}\nOctal: ${value.toString(8)}\nHex: ${value.toString(16).toUpperCase()}`, `Parsed base ${base}`, 'text'); }
  },
  {
    id: 'temperature-converter', name: 'Temperature Converter', description: 'Convert Celsius, Fahrenheit and Kelvin.',
    aliases: ['celsius to fahrenheit', 'fahrenheit to celsius', 'kelvin converter'], category: 'Math', tags: ['temperature', 'celsius', 'fahrenheit', 'kelvin'], inputKind: 'number', outputKind: 'text', privacy: 'local', icon: Ruler,
    placeholder: '25', sample: '25', options: ['Celsius', 'Fahrenheit', 'Kelvin'],
    run: (input, ctx) => { const n = Number(input); if (!Number.isFinite(n)) return fail('Enter a numeric temperature.'); const source = ctx.option ?? 'Celsius'; const c = source === 'Fahrenheit' ? (n - 32) * 5 / 9 : source === 'Kelvin' ? n - 273.15 : n; return ok(`Celsius: ${c.toFixed(4)} °C\nFahrenheit: ${(c * 9 / 5 + 32).toFixed(4)} °F\nKelvin: ${(c + 273.15).toFixed(4)} K`, `Source: ${source}`, 'text'); }
  },
  {
    id: 'data-size-converter', name: 'Data Size Converter', description: 'Convert bytes through KB, MB, GB and TB using binary 1024-based units.',
    aliases: ['bytes to mb', 'gb to bytes', 'file size converter'], category: 'Math', tags: ['bytes', 'kb', 'mb', 'gb', 'tb'], inputKind: 'number', outputKind: 'text', privacy: 'local', icon: Ruler,
    placeholder: '1024', sample: '1024', options: ['Bytes', 'KB', 'MB', 'GB', 'TB'],
    run: (input, ctx) => { const n = Number(input); if (!Number.isFinite(n)) return fail('Enter a numeric value.'); const order: Record<string, number> = { Bytes: 0, KB: 1, MB: 2, GB: 3, TB: 4 }; const source = ctx.option ?? 'Bytes'; const bytes = n * 1024 ** order[source]; return ok(`Bytes: ${bytes}\nKB: ${bytes / 1024}\nMB: ${bytes / 1024 ** 2}\nGB: ${bytes / 1024 ** 3}\nTB: ${bytes / 1024 ** 4}`, `Source: ${source}`, 'text'); }
  },
  {
    id: 'percentage-calculator', name: 'Percentage Calculator', description: 'Calculate percentage-of, percent change, or what percent one value is of another.',
    aliases: ['percent calculator', 'percent change', 'what percent'], category: 'Math', tags: ['percentage', 'change', 'ratio'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Ruler,
    placeholder: '25, 200', sample: '25, 200', options: ['A% of B', 'A is what % of B', 'Percent change A → B'],
    run: (input, ctx) => { const [a, b] = input.split(/[;,\s]+/).filter(Boolean).map(Number); if (!Number.isFinite(a) || !Number.isFinite(b)) return fail('Enter two numbers, for example: 25, 200'); const mode = ctx.option ?? 'A% of B'; if (mode === 'A% of B') return ok(String(a / 100 * b), `${a}% of ${b}`, 'text'); if (b === 0 && mode === 'A is what % of B') return fail('The second value cannot be zero.'); if (a === 0 && mode.startsWith('Percent change')) return fail('The starting value cannot be zero.'); return mode === 'A is what % of B' ? ok(`${(a / b * 100).toFixed(4)}%`, `${a} as a percentage of ${b}`, 'text') : ok(`${((b - a) / a * 100).toFixed(4)}%`, `${a} → ${b}`, 'text'); }
  },
  {
    id: 'lorem-ipsum', name: 'Lorem Ipsum Generator', description: 'Generate placeholder paragraphs locally for layouts and prototypes.',
    aliases: ['placeholder text', 'dummy text generator'], category: 'Text', tags: ['lorem', 'placeholder', 'copy'], inputKind: 'number', outputKind: 'text', privacy: 'local', icon: FileText,
    placeholder: 'Paragraphs 1–20', sample: '3',
    run: input => { const count = Math.min(20, Math.max(1, Number.parseInt(input || '3', 10) || 3)); const seed = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae justo non arcu facilisis malesuada. Curabitur vulputate, sem at volutpat fermentum, libero arcu consequat lectus, sed luctus sapien risus sed justo.'; return ok(Array.from({ length: count }, () => seed).join('\n\n'), `${count} paragraph${count === 1 ? '' : 's'}`, 'text'); }
  },
  {
    id: 'line-toolkit', name: 'Line Toolkit', description: 'Sort, deduplicate, reverse, trim or remove blank lines from text.',
    aliases: ['sort lines', 'remove duplicate lines', 'reverse lines'], category: 'Text', tags: ['lines', 'sort', 'dedupe'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: FileText,
    placeholder: 'pear\napple\npear', sample: 'pear\napple\npear\nbanana', options: ['Sort A→Z', 'Deduplicate', 'Reverse', 'Trim each line', 'Remove blanks'],
    run: (input, ctx) => { const lines = input.split(/\r?\n/); const mode = ctx.option ?? 'Sort A→Z'; const out = mode === 'Sort A→Z' ? [...lines].sort((a, b) => a.localeCompare(b)) : mode === 'Deduplicate' ? [...new Set(lines)] : mode === 'Reverse' ? [...lines].reverse() : mode === 'Trim each line' ? lines.map(v => v.trim()) : lines.filter(v => v.trim()); return ok(out.join('\n'), `${out.length} lines`, 'text'); }
  },
  {
    id: 'whitespace-cleaner', name: 'Whitespace Cleaner', description: 'Normalize spaces, tabs and blank lines without uploading your text.',
    aliases: ['remove extra spaces', 'clean whitespace'], category: 'Text', tags: ['whitespace', 'spaces', 'cleanup'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: FileText,
    placeholder: 'Text   with   extra spaces', sample: 'Hello    world\n\n\nThis\t is   ToolForge.', options: ['Normalize spaces', 'Collapse blank lines', 'Single line'],
    run: (input, ctx) => { const mode = ctx.option ?? 'Normalize spaces'; const value = mode === 'Collapse blank lines' ? input.replace(/(\r?\n\s*){3,}/g, '\n\n') : mode === 'Single line' ? input.replace(/\s+/g, ' ').trim() : input.split(/\r?\n/).map(line => line.replace(/[\t ]+/g, ' ').trimEnd()).join('\n'); return ok(value, mode, 'text'); }
  },
  {
    id: 'html-entities', name: 'HTML Entity Codec', description: 'Encode text for HTML or decode HTML entities locally.',
    aliases: ['html encode', 'html decode', 'escape html'], category: 'Developer', tags: ['html', 'entities', 'escape'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: FileText,
    placeholder: '<strong>Hello & welcome</strong>', sample: '<strong>Hello & welcome</strong>', options: ['Encode', 'Decode'],
    run: (input, ctx) => { if ((ctx.option ?? 'Encode') === 'Encode') return ok(escapeHtml(input), 'HTML escaped', 'text'); const node = document.createElement('textarea'); node.innerHTML = input; return ok(node.value, 'Entities decoded', 'text'); }
  },
  {
    id: 'markdown-html', name: 'Markdown → HTML', description: 'Convert common Markdown constructs to portable HTML locally.',
    aliases: ['markdown converter', 'md to html'], category: 'Developer', tags: ['markdown', 'html', 'convert'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: FileText,
    placeholder: '# Hello\n\n**Bold** and `code`', sample: '# ToolForge\n\n**Local-first** utilities with `typed` execution.',
    run: input => ok(markdownToHtml(input), 'CommonMark-style subset · escaped by default', 'text')
  },
  {
    id: 'text-hex-codec', name: 'Text ⇄ Hex', description: 'Encode UTF-8 text as hexadecimal bytes or decode hexadecimal back to text.',
    aliases: ['text to hex', 'hex to text'], category: 'Developer', tags: ['hex', 'utf8', 'encode'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Binary,
    placeholder: 'Hello', sample: 'Hello ToolForge', options: ['Text → Hex', 'Hex → Text'],
    run: (input, ctx) => { try { if ((ctx.option ?? 'Text → Hex') === 'Text → Hex') return ok(bytesToHex(new TextEncoder().encode(input)), 'UTF-8 bytes', 'text'); const clean = input.replace(/\s+/g, ''); if (!/^[0-9a-f]*$/i.test(clean) || clean.length % 2) return fail('Enter an even number of hexadecimal characters.'); return ok(new TextDecoder().decode(Uint8Array.from(clean.match(/../g) ?? [], v => Number.parseInt(v, 16))), 'Decoded as UTF-8', 'text'); } catch { return fail('Hex decoding failed.'); } }
  },
  {
    id: 'css-gradient', name: 'CSS Gradient Builder', description: 'Generate a linear-gradient declaration from two colors and an angle.',
    aliases: ['gradient generator', 'linear gradient css'], category: 'Color', tags: ['css', 'gradient', 'color'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Palette,
    placeholder: '#7c5cff, #26d07c, 135', sample: '#7c5cff, #26d07c, 135',
    run: input => { const [a = '', b = '', angleRaw = '90'] = input.split(',').map(v => v.trim()); if (!parseHex(a) || !parseHex(b)) return fail('Enter two six-digit HEX colors and optionally an angle.'); const angle = Number(angleRaw); if (!Number.isFinite(angle)) return fail('Angle must be numeric.'); return ok(`background: linear-gradient(${angle}deg, ${a}, ${b});`, 'Ready-to-paste CSS', 'text'); }
  },
  {
    id: 'contrast-checker', name: 'Contrast Checker', description: 'Measure WCAG contrast ratio between two HEX colors.',
    aliases: ['wcag contrast', 'color contrast ratio'], category: 'Color', tags: ['wcag', 'contrast', 'accessibility'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Palette,
    placeholder: '#111111, #FFFFFF', sample: '#111111, #FFFFFF',
    run: input => { const [aRaw, bRaw] = input.split(','); const a = parseHex(aRaw ?? ''), b = parseHex(bRaw ?? ''); if (!a || !b) return fail('Enter two six-digit HEX colors separated by a comma.'); const lum = ({ r, g, b }: { r: number; g: number; b: number }) => { const c = [r, g, b].map(v => { const n = v / 255; return n <= .03928 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }; const [high, low] = [lum(a), lum(b)].sort((x, y) => y - x); const ratio = (high + .05) / (low + .05); return ok(`Ratio: ${ratio.toFixed(2)}:1\nAA normal text: ${ratio >= 4.5 ? 'PASS' : 'FAIL'}\nAA large text: ${ratio >= 3 ? 'PASS' : 'FAIL'}\nAAA normal text: ${ratio >= 7 ? 'PASS' : 'FAIL'}`, `${a.hex} vs ${b.hex}`, 'text'); }
  },
  {
    id: 'palette-generator', name: 'Palette Generator', description: 'Generate cryptographically random HEX color palettes locally.',
    aliases: ['random palette', 'color palette generator'], category: 'Color', tags: ['palette', 'random', 'hex'], inputKind: 'number', outputKind: 'text', privacy: 'local', icon: Palette,
    placeholder: 'Colors 2–20', sample: '6',
    run: input => { const count = Math.min(20, Math.max(2, Number.parseInt(input || '6', 10) || 6)); const bytes = crypto.getRandomValues(new Uint8Array(count * 3)); const colors = Array.from({ length: count }, (_, i) => `#${bytesToHex(bytes.slice(i * 3, i * 3 + 3)).toUpperCase()}`); return ok(colors.join('\n'), `${count} colors`, 'text'); }
  },
  {
    id: 'image-base64', name: 'Image → Base64', description: 'Convert an image file to a Data URL entirely in your browser.',
    aliases: ['image to base64', 'picture data url'], category: 'Image', tags: ['image', 'base64', 'data url'], inputKind: 'image', outputKind: 'text', privacy: 'local', icon: FileJson2,
    placeholder: 'Choose an image file', sample: '', inputMode: 'file', accept: 'image/*', autoRun: false,
    run: async (_input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose an image first.'); const result = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('File read failed.')); reader.readAsDataURL(file); }); return ok(result, `${file.name} · ${readableBytes(file.size)}`, 'text'); }
  },
  {
    id: 'image-format', name: 'Image Format Converter', description: 'Convert browser-decodable images to PNG, JPEG or WebP with Canvas.',
    aliases: ['png to jpg', 'jpg to webp', 'convert image format'], category: 'Image', tags: ['png', 'jpeg', 'webp', 'convert'], inputKind: 'image', outputKind: 'image', privacy: 'local', icon: Palette,
    placeholder: 'Choose an image file', sample: '', inputMode: 'file', accept: 'image/*', autoRun: false, options: ['PNG', 'JPEG', 'WebP'],
    run: async (_input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose an image first.'); const image = await imageFromFile(file); const canvas = canvasFor(image); canvas.getContext('2d')!.drawImage(image, 0, 0); const format = ctx.option ?? 'PNG'; const mime = format === 'JPEG' ? 'image/jpeg' : format === 'WebP' ? 'image/webp' : 'image/png'; const blob = await canvasBlob(canvas, mime, .9); const ext = format === 'JPEG' ? 'jpg' : format.toLowerCase(); return ok(`Ready: converted.${ext}`, `${image.naturalWidth}×${image.naturalHeight} · ${readableBytes(blob.size)}`, 'image', [artifact(`converted.${ext}`, mime, blob)]); }
  },
  {
    id: 'image-resizer', name: 'Image Resizer', description: 'Resize an image locally to exact pixel dimensions.',
    aliases: ['resize picture', 'image dimensions changer'], category: 'Image', tags: ['resize', 'dimensions', 'image'], inputKind: 'image', outputKind: 'image', privacy: 'local', icon: Ruler,
    placeholder: '800x600', sample: '800x600', inputMode: 'file', accept: 'image/*', autoRun: false,
    run: async (input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose an image first.'); const image = await imageFromFile(file); const match = input.trim().match(/^(\d{1,5})\s*[x×]\s*(\d{1,5})$/i); if (!match) return fail('Enter dimensions like 800x600.'); const width = Number(match[1]), height = Number(match[2]); const canvas = canvasFor(image, width, height); canvas.getContext('2d')!.drawImage(image, 0, 0, width, height); const blob = await canvasBlob(canvas); return ok('Ready: resized.png', `${width}×${height} · ${readableBytes(blob.size)}`, 'image', [artifact('resized.png', 'image/png', blob)]); }
  },
  {
    id: 'image-rotate', name: 'Image Rotate', description: 'Rotate an image 90°, 180° or 270° locally.',
    aliases: ['rotate picture', 'turn image'], category: 'Image', tags: ['rotate', 'image', 'canvas'], inputKind: 'image', outputKind: 'image', privacy: 'local', icon: WandSparkles,
    placeholder: 'Choose an image file', sample: '', inputMode: 'file', accept: 'image/*', autoRun: false, options: ['90°', '180°', '270°'],
    run: async (_input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose an image first.'); const image = await imageFromFile(file); const degrees = Number.parseInt(ctx.option ?? '90', 10); const swap = degrees % 180 !== 0; const canvas = canvasFor(image, swap ? image.naturalHeight : image.naturalWidth, swap ? image.naturalWidth : image.naturalHeight); const c = canvas.getContext('2d')!; c.translate(canvas.width / 2, canvas.height / 2); c.rotate(degrees * Math.PI / 180); c.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2); const blob = await canvasBlob(canvas); return ok('Ready: rotated.png', `${degrees}° rotation`, 'image', [artifact('rotated.png', 'image/png', blob)]); }
  },
  {
    id: 'image-filters', name: 'Image Filters', description: 'Apply grayscale, sepia, invert, contrast or saturation filters with Canvas.',
    aliases: ['grayscale image', 'sepia image', 'invert image'], category: 'Image', tags: ['filter', 'grayscale', 'sepia'], inputKind: 'image', outputKind: 'image', privacy: 'local', icon: Palette,
    placeholder: 'Choose an image file', sample: '', inputMode: 'file', accept: 'image/*', autoRun: false, options: ['Grayscale', 'Sepia', 'Invert', 'High contrast', 'Saturate'],
    run: async (_input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose an image first.'); const image = await imageFromFile(file); const canvas = canvasFor(image); const c = canvas.getContext('2d')!; const mode = ctx.option ?? 'Grayscale'; c.filter = mode === 'Sepia' ? 'sepia(1)' : mode === 'Invert' ? 'invert(1)' : mode === 'High contrast' ? 'contrast(1.7)' : mode === 'Saturate' ? 'saturate(1.8)' : 'grayscale(1)'; c.drawImage(image, 0, 0); const blob = await canvasBlob(canvas); return ok('Ready: filtered.png', mode, 'image', [artifact('filtered.png', 'image/png', blob)]); }
  },
  {
    id: 'svg-png', name: 'SVG → PNG', description: 'Rasterize SVG files to PNG locally using the browser image pipeline.',
    aliases: ['svg converter', 'svg rasterizer'], category: 'Image', tags: ['svg', 'png', 'raster'], inputKind: 'image', outputKind: 'image', privacy: 'local', icon: Palette,
    placeholder: 'Choose an SVG file', sample: '', inputMode: 'file', accept: 'image/svg+xml,.svg', autoRun: false,
    run: async (_input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose an SVG file first.'); const image = await imageFromFile(file); const canvas = canvasFor(image); canvas.getContext('2d')!.drawImage(image, 0, 0); const blob = await canvasBlob(canvas); return ok('Ready: rasterized.png', `${canvas.width}×${canvas.height}`, 'image', [artifact('rasterized.png', 'image/png', blob)]); }
  },
  {
    id: 'code-image', name: 'Code → Image', description: 'Render code or text onto a shareable PNG card locally.',
    aliases: ['code screenshot', 'text to image card'], category: 'Image', tags: ['code', 'png', 'share'], inputKind: 'text', outputKind: 'image', privacy: 'local', icon: Braces,
    placeholder: 'const hello = "world";', sample: 'function greet(name) {\n  return `Hello ${name}`;\n}', autoRun: false,
    run: async input => { const lines = input.split(/\r?\n/); const width = 1200, pad = 72, lineHeight = 34, height = Math.max(360, pad * 2 + lines.length * lineHeight); const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const c = canvas.getContext('2d')!; c.fillStyle = '#0b0d12'; c.fillRect(0, 0, width, height); c.fillStyle = '#151925'; c.roundRect(36, 36, width - 72, height - 72, 24); c.fill(); c.fillStyle = '#e8ebf3'; c.font = '24px ui-monospace, SFMono-Regular, Menlo, monospace'; lines.forEach((line, i) => c.fillText(line, pad, pad + 42 + i * lineHeight)); const blob = await canvasBlob(canvas); return ok('Ready: code-card.png', `${width}×${height}`, 'image', [artifact('code-card.png', 'image/png', blob)]); }
  },
  {
    id: 'file-hash', name: 'File SHA-256', description: 'Calculate a file SHA-256 checksum locally with Web Crypto.',
    aliases: ['file checksum', 'sha256 file'], category: 'Security', tags: ['file', 'sha256', 'checksum'], inputKind: 'file', outputKind: 'text', privacy: 'local', icon: Hash,
    placeholder: 'Choose any file', sample: '', inputMode: 'file', accept: '*/*', autoRun: false,
    run: async (_input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose a file first.'); const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer()); return ok(bytesToHex(new Uint8Array(digest)), `${file.name} · ${readableBytes(file.size)}`, 'text'); }
  },
  {
    id: 'file-signature', name: 'File Signature Inspector', description: 'Inspect common file magic bytes locally instead of trusting only an extension.',
    aliases: ['mime sniffer', 'magic bytes', 'file type inspector'], category: 'Utility', tags: ['mime', 'file', 'signature'], inputKind: 'file', outputKind: 'text', privacy: 'local', icon: FileText,
    placeholder: 'Choose any file', sample: '', inputMode: 'file', accept: '*/*', autoRun: false,
    run: async (_input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose a file first.'); const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer()); const hex = bytesToHex(bytes); let detected = 'unknown'; if (hex.startsWith('25504446')) detected = 'PDF'; else if (hex.startsWith('89504e470d0a1a0a')) detected = 'PNG'; else if (hex.startsWith('ffd8ff')) detected = 'JPEG'; else if (hex.startsWith('47494638')) detected = 'GIF'; else if (hex.startsWith('504b0304')) detected = 'ZIP / OOXML container'; else if (hex.startsWith('52494646') && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP') detected = 'WebP'; return ok(`Detected: ${detected}\nBrowser MIME: ${file.type || '(none)'}\nFirst bytes: ${hex}`, `${file.name} · ${readableBytes(file.size)}`, 'text'); }
  },
  {
    id: 'pdf-merge', name: 'PDF Merger', description: 'Merge multiple PDFs locally; files stay in the browser.',
    aliases: ['merge pdfs', 'combine pdf'], category: 'PDF & Office', tags: ['pdf', 'merge', 'combine'], inputKind: 'pdf', outputKind: 'pdf', privacy: 'local', icon: FileText,
    placeholder: 'Choose two or more PDFs', sample: '', inputMode: 'files', accept: 'application/pdf,.pdf', autoRun: false,
    run: async (_input, ctx) => { const files = ctx.files ?? []; if (files.length < 2) return fail('Choose at least two PDFs.'); const { PDFDocument } = await import('pdf-lib'); const target = await PDFDocument.create(); let pages = 0; for (const file of files) { const source = await PDFDocument.load(await file.arrayBuffer()); const copied = await target.copyPages(source, source.getPageIndices()); copied.forEach(page => target.addPage(page)); pages += copied.length; } const bytes = await target.save(); const blob = new Blob([bytes], { type: 'application/pdf' }); return ok('Ready: merged.pdf', `${files.length} files · ${pages} pages`, 'pdf', [artifact('merged.pdf', 'application/pdf', blob)]); }
  },
  {
    id: 'pdf-split', name: 'PDF Page Extractor', description: 'Extract selected pages from a PDF into a new PDF locally.',
    aliases: ['split pdf', 'extract pdf pages'], category: 'PDF & Office', tags: ['pdf', 'split', 'pages'], inputKind: 'pdf', outputKind: 'pdf', privacy: 'local', icon: FileText,
    placeholder: 'Pages: 1,3-5', sample: '1', inputMode: 'file', accept: 'application/pdf,.pdf', autoRun: false,
    run: async (input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose a PDF first.'); const { PDFDocument } = await import('pdf-lib'); const source = await PDFDocument.load(await file.arrayBuffer()); const requested = new Set<number>(); for (const token of input.split(',').map(v => v.trim()).filter(Boolean)) { const range = token.match(/^(\d+)-(\d+)$/); if (range) { const a = Number(range[1]), b = Number(range[2]); for (let i = Math.min(a, b); i <= Math.max(a, b); i++) requested.add(i - 1); } else if (/^\d+$/.test(token)) requested.add(Number(token) - 1); } const indexes = [...requested].filter(i => i >= 0 && i < source.getPageCount()).sort((a, b) => a - b); if (!indexes.length) return fail(`Choose pages between 1 and ${source.getPageCount()}.`); const target = await PDFDocument.create(); const pages = await target.copyPages(source, indexes); pages.forEach(p => target.addPage(p)); const bytes = await target.save(); const blob = new Blob([bytes], { type: 'application/pdf' }); return ok('Ready: extracted-pages.pdf', `${indexes.length} of ${source.getPageCount()} pages`, 'pdf', [artifact('extracted-pages.pdf', 'application/pdf', blob)]); }
  },
  {
    id: 'pdf-rotate', name: 'PDF Rotator', description: 'Rotate every page in a PDF locally.',
    aliases: ['rotate pdf pages', 'turn pdf'], category: 'PDF & Office', tags: ['pdf', 'rotate', 'pages'], inputKind: 'pdf', outputKind: 'pdf', privacy: 'local', icon: WandSparkles,
    placeholder: 'Choose a PDF', sample: '', inputMode: 'file', accept: 'application/pdf,.pdf', autoRun: false, options: ['90°', '180°', '270°'],
    run: async (_input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose a PDF first.'); const { PDFDocument, degrees } = await import('pdf-lib'); const pdf = await PDFDocument.load(await file.arrayBuffer()); const delta = Number.parseInt(ctx.option ?? '90', 10); pdf.getPages().forEach(page => page.setRotation(degrees((page.getRotation().angle + delta) % 360))); const bytes = await pdf.save(); const blob = new Blob([bytes], { type: 'application/pdf' }); return ok('Ready: rotated.pdf', `${pdf.getPageCount()} pages · ${delta}°`, 'pdf', [artifact('rotated.pdf', 'application/pdf', blob)]); }
  },
  {
    id: 'images-pdf', name: 'Images → PDF', description: 'Combine PNG/JPEG images into a PDF locally.',
    aliases: ['jpg to pdf', 'png to pdf', 'pictures to pdf'], category: 'PDF & Office', tags: ['pdf', 'image', 'jpg', 'png'], inputKind: 'image', outputKind: 'pdf', privacy: 'local', icon: FileText,
    placeholder: 'Choose PNG/JPEG images', sample: '', inputMode: 'files', accept: 'image/png,image/jpeg,.png,.jpg,.jpeg', autoRun: false,
    run: async (_input, ctx) => { const files = ctx.files ?? []; if (!files.length) return fail('Choose one or more PNG/JPEG images.'); const { PDFDocument } = await import('pdf-lib'); const pdf = await PDFDocument.create(); for (const file of files) { const bytes = new Uint8Array(await file.arrayBuffer()); const image = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png') ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes); const page = pdf.addPage([image.width, image.height]); page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height }); } const bytes = await pdf.save(); const blob = new Blob([bytes], { type: 'application/pdf' }); return ok('Ready: images.pdf', `${files.length} image${files.length === 1 ? '' : 's'}`, 'pdf', [artifact('images.pdf', 'application/pdf', blob)]); }
  },
  {
    id: 'pdf-metadata', name: 'PDF Inspector', description: 'Read page count and document metadata locally without uploading the PDF.',
    aliases: ['pdf metadata', 'pdf page count'], category: 'PDF & Office', tags: ['pdf', 'metadata', 'inspect'], inputKind: 'pdf', outputKind: 'json', privacy: 'local', icon: FileText,
    placeholder: 'Choose a PDF', sample: '', inputMode: 'file', accept: 'application/pdf,.pdf', autoRun: false,
    run: async (_input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose a PDF first.'); const { PDFDocument } = await import('pdf-lib'); const pdf = await PDFDocument.load(await file.arrayBuffer()); return ok(JSON.stringify({ file: file.name, size: file.size, pages: pdf.getPageCount(), title: pdf.getTitle() ?? null, author: pdf.getAuthor() ?? null, subject: pdf.getSubject() ?? null, creator: pdf.getCreator() ?? null, producer: pdf.getProducer() ?? null, creationDate: pdf.getCreationDate()?.toISOString() ?? null, modificationDate: pdf.getModificationDate()?.toISOString() ?? null }, null, 2), 'Read locally', 'json'); }
  },
  {
    id: 'audio-inspector', name: 'Audio Inspector', description: 'Decode an audio file locally and report duration, channels and sample rate.',
    aliases: ['audio metadata', 'sound info'], category: 'Media', tags: ['audio', 'duration', 'sample rate'], inputKind: 'audio', outputKind: 'json', privacy: 'local', icon: Clock3,
    placeholder: 'Choose an audio file', sample: '', inputMode: 'file', accept: 'audio/*', autoRun: false,
    run: async (_input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose an audio file first.'); const audio = await decodeAudio(file); return ok(JSON.stringify({ file: file.name, bytes: file.size, durationSeconds: Number(audio.duration.toFixed(3)), channels: audio.numberOfChannels, sampleRate: audio.sampleRate, frames: audio.length }, null, 2), 'Decoded locally with Web Audio', 'json'); }
  },
  {
    id: 'audio-waveform', name: 'Audio Waveform → PNG', description: 'Render an audio waveform image locally from a browser-decodable audio file.',
    aliases: ['waveform generator', 'sound waveform image'], category: 'Media', tags: ['audio', 'waveform', 'png'], inputKind: 'audio', outputKind: 'image', privacy: 'local', icon: WandSparkles,
    placeholder: 'Choose an audio file', sample: '', inputMode: 'file', accept: 'audio/*', autoRun: false,
    run: async (_input, ctx) => { const file = textFile(ctx); if (!file) return fail('Choose an audio file first.'); const audio = await decodeAudio(file); const data = audio.getChannelData(0); const width = 1200, height = 320, step = Math.max(1, Math.floor(data.length / width)); const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const c = canvas.getContext('2d')!; c.fillStyle = '#0b0d12'; c.fillRect(0, 0, width, height); c.strokeStyle = '#9c89ff'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x < width; x++) { let min = 1, max = -1; const start = x * step; for (let i = start; i < Math.min(start + step, data.length); i++) { min = Math.min(min, data[i]); max = Math.max(max, data[i]); } c.moveTo(x, (1 + min) * height / 2); c.lineTo(x, (1 + max) * height / 2); } c.stroke(); const blob = await canvasBlob(canvas); return ok('Ready: waveform.png', `${audio.duration.toFixed(2)}s · ${audio.sampleRate} Hz`, 'image', [artifact('waveform.png', 'image/png', blob)]); }
  },
  {
    id: 'dns-lookup', name: 'DNS Lookup', description: 'Resolve DNS records through Cloudflare DNS-over-HTTPS. The hostname is sent to Cloudflare.',
    aliases: ['dns over https', 'resolve domain', 'doh lookup'], category: 'Network', tags: ['dns', 'doh', 'network'], inputKind: 'text', outputKind: 'json', privacy: 'network-assisted', icon: Link,
    placeholder: 'example.com', sample: 'example.com', options: ['A', 'AAAA', 'MX', 'TXT', 'CNAME'], autoRun: false,
    privacyNote: 'Network-assisted: the queried hostname and record type are sent to Cloudflare DNS-over-HTTPS.',
    run: async (input, ctx) => { const name = input.trim(); if (!/^[a-z0-9.-]+$/i.test(name)) return fail('Enter a hostname such as example.com.'); const type = ctx.option ?? 'A'; const response = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`, { headers: { accept: 'application/dns-json' }, signal: ctx.signal }); if (!response.ok) return fail(`DNS request failed (${response.status}).`); return ok(JSON.stringify(await response.json(), null, 2), `Cloudflare DoH · ${type}`, 'json'); }
  },
  {
    id: 'public-ip', name: 'Public IP Lookup', description: 'Ask an external IP echo service for your public IP address.',
    aliases: ['what is my ip', 'ip address lookup'], category: 'Network', tags: ['ip', 'network', 'public address'], inputKind: 'none', outputKind: 'json', privacy: 'network-assisted', icon: Link,
    placeholder: '', sample: '', inputMode: 'none', autoRun: false,
    privacyNote: 'Network-assisted: this request necessarily reveals your public IP to the selected IP echo service.',
    run: async (_input, ctx) => { const response = await fetch('https://api64.ipify.org?format=json', { signal: ctx.signal }); if (!response.ok) return fail(`IP lookup failed (${response.status}).`); return ok(JSON.stringify(await response.json(), null, 2), 'api64.ipify.org', 'json'); }
  },
  {
    id: 'http-head', name: 'HTTP Header Probe', description: 'Send a browser HEAD request and inspect CORS-exposed response headers.',
    aliases: ['http headers check', 'head request', 'response headers'], category: 'Network', tags: ['http', 'headers', 'cors'], inputKind: 'text', outputKind: 'json', privacy: 'network-assisted', icon: Link,
    placeholder: 'https://example.com', sample: 'https://example.com', autoRun: false,
    privacyNote: 'Network-assisted: your browser contacts the URL you enter. Browser CORS rules may block or hide headers.',
    run: async (input, ctx) => { let url: URL; try { url = new URL(input.trim()); } catch { return fail('Enter an absolute http:// or https:// URL.'); } if (!/^https?:$/.test(url.protocol)) return fail('Only HTTP(S) URLs are supported.'); try { const response = await fetch(url.toString(), { method: 'HEAD', signal: ctx.signal }); return ok(JSON.stringify({ url: response.url, status: response.status, statusText: response.statusText, headers: Object.fromEntries(response.headers.entries()) }, null, 2), 'Only CORS-exposed headers are visible', 'json'); } catch { return fail('The browser blocked the request or the remote host is unreachable/CORS-restricted.'); } }
  },
  {
    id: 'json-key-picker', name: 'JSON Key Picker', description: 'Read a nested JSON value with a simple dot path.',
    aliases: ['json path getter', 'pick json field'], category: 'Data', tags: ['json', 'path', 'field'], inputKind: 'json', outputKind: 'json', privacy: 'local', icon: Braces,
    placeholder: 'user.profile.name\n---\n{"user":{"profile":{"name":"Ada"}}}', sample: 'user.profile.name\n---\n{"user":{"profile":{"name":"Ada"}}}',
    run: input => { const [path = '', json = ''] = input.split(/\n---\n/); try { let value: unknown = JSON.parse(json); for (const key of path.trim().split('.').filter(Boolean)) value = (value as Record<string, unknown>)?.[key]; return ok(JSON.stringify(value ?? null, null, 2), `Path: ${path.trim() || '(root)'}`, 'json'); } catch { return fail('Use: dot.path, a line containing ---, then valid JSON.'); } }
  },
  {
    id: 'json-lines', name: 'JSON Lines Workbench', description: 'Validate JSONL/NDJSON and convert it to a JSON array.',
    aliases: ['jsonl to json', 'ndjson parser'], category: 'Data', tags: ['jsonl', 'ndjson', 'json'], inputKind: 'text', outputKind: 'json', privacy: 'local', icon: Braces,
    placeholder: '{"id":1}\n{"id":2}', sample: '{"id":1,"name":"Ada"}\n{"id":2,"name":"Grace"}',
    run: input => { try { const rows = input.split(/\r?\n/).filter(v => v.trim()).map((line, i) => { try { return JSON.parse(line); } catch { throw new Error(`Line ${i + 1} is not valid JSON.`); } }); return ok(JSON.stringify(rows, null, 2), `${rows.length} records`, 'json'); } catch (e) { return fail(e instanceof Error ? e.message : 'JSONL parsing failed.'); } }
  },
  {
    id: 'querystring-codec', name: 'Query String ⇄ JSON', description: 'Convert URL query parameters to JSON and back locally.',
    aliases: ['query params to json', 'json to query string'], category: 'Developer', tags: ['query', 'url', 'json'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Link,
    placeholder: 'q=toolforge&lang=en', sample: 'q=toolforge&lang=en&tag=local', options: ['Query → JSON', 'JSON → Query'],
    run: (input, ctx) => { try { if ((ctx.option ?? 'Query → JSON') === 'JSON → Query') { const obj = JSON.parse(input) as Record<string, unknown>; const params = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => Array.isArray(v) ? v.forEach(item => params.append(k, String(item))) : params.append(k, String(v ?? ''))); return ok(params.toString(), 'URLSearchParams', 'text'); } const params = new URLSearchParams(input.replace(/^\?/, '')); const obj: Record<string, string | string[]> = {}; for (const [k, v] of params) { const prior = obj[k]; obj[k] = prior === undefined ? v : Array.isArray(prior) ? [...prior, v] : [prior, v]; } return ok(JSON.stringify(obj, null, 2), `${[...params.keys()].length} parameters`, 'json'); } catch { return fail('Input could not be converted.'); } }
  },
  {
    id: 'timestamp-now', name: 'Current Timestamp', description: 'Generate current ISO, Unix-second and Unix-millisecond timestamps locally.',
    aliases: ['current unix time', 'epoch now'], category: 'Date & Time', tags: ['timestamp', 'epoch', 'now'], inputKind: 'none', outputKind: 'text', privacy: 'local', icon: Clock3,
    placeholder: '', sample: '', inputMode: 'none',
    run: () => { const now = new Date(); return ok(`ISO: ${now.toISOString()}\nUnix seconds: ${Math.floor(now.getTime() / 1000)}\nUnix milliseconds: ${now.getTime()}\nLocal: ${now.toString()}`, 'Generated on this device', 'text'); }
  },
  {
    id: 'duration-calculator', name: 'Date Duration Calculator', description: 'Calculate the elapsed duration between two ISO dates or timestamps.',
    aliases: ['date difference', 'days between dates'], category: 'Date & Time', tags: ['date', 'duration', 'difference'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Clock3,
    placeholder: '2026-01-01\n2026-10-13', sample: '2026-01-01T00:00:00Z\n2026-10-13T00:00:00Z',
    run: input => { const [aRaw, bRaw] = input.split(/\r?\n/); const a = new Date(aRaw), b = new Date(bRaw); if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return fail('Enter two valid dates, one per line.'); const ms = b.getTime() - a.getTime(); const abs = Math.abs(ms); return ok(`Milliseconds: ${ms}\nSeconds: ${ms / 1000}\nHours: ${ms / 3_600_000}\nDays: ${ms / 86_400_000}`, `${ms < 0 ? 'Negative interval' : 'Elapsed'} · ${Math.floor(abs / 86_400_000)} whole days`, 'text'); }
  },
  {
    id: 'regex-escape', name: 'Regex Escaper', description: 'Escape arbitrary text for safe literal use inside a JavaScript regular expression.',
    aliases: ['escape regex', 'literal regex text'], category: 'Developer', tags: ['regex', 'escape', 'javascript'], inputKind: 'text', outputKind: 'text', privacy: 'local', icon: Regex,
    placeholder: 'price is $10.00 (today)', sample: 'price is $10.00 (today)',
    run: input => ok(input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'Safe literal pattern fragment', 'text')
  },
  {
    id: 'uuid-bulk', name: 'UUID Batch Export', description: 'Generate a newline-separated batch of UUID v4 values suitable for file export.',
    aliases: ['bulk uuid', 'uuid list'], category: 'Developer', tags: ['uuid', 'batch', 'guid'], inputKind: 'number', outputKind: 'text', privacy: 'local', icon: Fingerprint,
    placeholder: 'Count 1–1000', sample: '100',
    run: input => { const count = Math.min(1000, Math.max(1, Number.parseInt(input || '100', 10) || 100)); const output = Array.from({ length: count }, () => crypto.randomUUID()).join('\n'); const blob = new Blob([output], { type: 'text/plain;charset=utf-8' }); return ok(output, `${count} UUIDs`, 'text', [artifact('uuids.txt', 'text/plain', blob)]); }
  }
];

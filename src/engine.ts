import { tools } from './tools';
import type { SearchResult, ToolDefinition } from './types';

const norm = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ');

export function validateRegistry(registry: ToolDefinition[] = tools) {
  const ids = new Set<string>();
  const aliases = new Map<string, string>();
  const problems: string[] = [];
  for (const tool of registry) {
    if (ids.has(tool.id)) problems.push(`duplicate id: ${tool.id}`);
    ids.add(tool.id);
    for (const raw of [tool.name, ...tool.aliases]) {
      const key = norm(raw);
      const owner = aliases.get(key);
      if (owner && owner !== tool.id) problems.push(`duplicate alias: ${raw} (${owner}, ${tool.id})`);
      else aliases.set(key, tool.id);
    }
  }
  return { valid: problems.length === 0, problems, toolCount: ids.size, aliasCount: aliases.size };
}

export function searchTools(query: string, category = 'All'): SearchResult[] {
  const q = norm(query);
  const tokens = q.split(' ').filter(Boolean);
  return tools
    .filter(tool => category === 'All' || tool.category === category)
    .map(tool => {
      const name = norm(tool.name);
      const aliases = tool.aliases.map(norm);
      const tags = tool.tags.map(norm);
      let score = q ? 0 : 1;
      let matchedAlias: string | undefined;
      if (q && name === q) score += 100;
      if (q && name.startsWith(q)) score += 45;
      if (q && name.includes(q)) score += 30;
      aliases.forEach((alias, i) => {
        if (q && alias === q) { score = Math.max(score, 90); matchedAlias = tool.aliases[i]; }
        else if (q && alias.includes(q)) { score = Math.max(score, 36); matchedAlias = tool.aliases[i]; }
      });
      for (const token of tokens) {
        if (name.includes(token)) score += 8;
        if (aliases.some(a => a.includes(token))) score += 6;
        if (tags.some(tag => tag.includes(token))) score += 4;
        if (norm(tool.description).includes(token)) score += 2;
      }
      return { ...tool, score, matchedAlias };
    })
    .filter(tool => tool.score > 0)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export function compatibleNextTools(current: ToolDefinition) {
  if (current.outputKind === 'none') return [];
  return tools.filter(tool => tool.id !== current.id && (tool.inputKind === current.outputKind || tool.inputKind === 'text')).slice(0, 5);
}

import { describe, expect, it } from 'vitest';
import { allTools, searchTools, validateRegistry } from '../src/engine';

describe('canonical registry', () => {
  it('contains no duplicate ids or aliases', () => {
    const health = validateRegistry();
    expect(health.valid).toBe(true);
    expect(health.problems).toEqual([]);
  });

  it('keeps a 46+ capability catalog without alias-page duplication', () => {
    expect(allTools.length).toBeGreaterThanOrEqual(46);
    expect(new Set(allTools.map(tool => tool.id)).size).toBe(allTools.length);
  });

  it('resolves duplicate-looking JSON phrases to one canonical tool', () => {
    for (const query of ['json formatter', 'json prettify', 'json beautifier']) {
      const hits = searchTools(query);
      expect(hits[0]?.id).toBe('json-workbench');
      expect(hits.filter(x => x.id === 'json-workbench')).toHaveLength(1);
    }
  });

  it('finds tools by task language across the expanded catalog', () => {
    expect(searchTools('meters to feet')[0]?.id).toBe('length-converter');
    expect(searchTools('hash text')[0]?.id).toBe('sha256');
    expect(searchTools('csv to json')[0]?.id).toBe('csv-json');
    expect(searchTools('merge pdfs')[0]?.id).toBe('pdf-merge');
    expect(searchTools('resize picture')[0]?.id).toBe('image-resizer');
    expect(searchTools('jwt decode')[0]?.id).toBe('jwt-inspector');
  });

  it('requires explicit execution for every network-assisted tool', () => {
    const networkTools = allTools.filter(tool => tool.privacy === 'network-assisted');
    expect(networkTools.length).toBeGreaterThan(0);
    for (const tool of networkTools) {
      expect(tool.autoRun).toBe(false);
      expect(tool.privacyNote).toBeTruthy();
    }
  });

  it('marks file-processing tools as local unless explicitly declared otherwise', () => {
    const fileTools = allTools.filter(tool => tool.inputMode === 'file' || tool.inputMode === 'files');
    expect(fileTools.length).toBeGreaterThan(0);
    expect(fileTools.filter(tool => tool.privacy !== 'local')).toEqual([]);
  });
});

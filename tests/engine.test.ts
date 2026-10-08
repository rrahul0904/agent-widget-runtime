import { describe, expect, it } from 'vitest';
import { searchTools, validateRegistry } from '../src/engine';

describe('canonical registry', () => {
  it('contains no duplicate ids or aliases', () => {
    const health = validateRegistry();
    expect(health.valid).toBe(true);
    expect(health.problems).toEqual([]);
  });

  it('resolves duplicate-looking JSON phrases to one canonical tool', () => {
    for (const query of ['json formatter', 'json prettify', 'json beautifier']) {
      const hits = searchTools(query);
      expect(hits[0]?.id).toBe('json-workbench');
      expect(hits.filter(x => x.id === 'json-workbench')).toHaveLength(1);
    }
  });

  it('finds tools by task language', () => {
    expect(searchTools('meters to feet')[0]?.id).toBe('length-converter');
    expect(searchTools('hash text')[0]?.id).toBe('sha256');
    expect(searchTools('csv to json')[0]?.id).toBe('csv-json');
  });
});

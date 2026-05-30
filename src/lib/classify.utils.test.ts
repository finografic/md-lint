import { describe, it, expect } from 'vitest';

import { classifyFile, classifyFiles } from './classify.utils.js';

describe('classifyFile', () => {
  it('classifies vault/nodes/idea.md as vault', () => {
    expect(classifyFile('vault/nodes/idea.md')).toBe('vault');
  });

  it('classifies README.md as standard', () => {
    expect(classifyFile('README.md')).toBe('standard');
  });

  it('classifies docs/guide.md as standard', () => {
    expect(classifyFile('docs/guide.md')).toBe('standard');
  });

  it('classifies CLAUDE.md as agent', () => {
    expect(classifyFile('CLAUDE.md')).toBe('agent');
  });

  it('classifies CLAUDE.local.md as agent', () => {
    expect(classifyFile('CLAUDE.local.md')).toBe('agent');
  });

  it('classifies .github/skills/foo/SKILL.md as agent', () => {
    expect(classifyFile('.github/skills/foo/SKILL.md')).toBe('agent');
  });

  it('classifies .github/prompts/review.md as agent', () => {
    expect(classifyFile('.github/prompts/review.md')).toBe('agent');
  });

  it('classifies .github/instructions/any.md as agent', () => {
    expect(classifyFile('.github/instructions/any.md')).toBe('agent');
  });

  it('classifies .github/copilot-instructions.md as agent', () => {
    expect(classifyFile('.github/copilot-instructions.md')).toBe('agent');
  });

  it('classifies CONVENTIONS.md as agent', () => {
    expect(classifyFile('CONVENTIONS.md')).toBe('agent');
  });

  it('classifies AGENTS.md as agent', () => {
    expect(classifyFile('AGENTS.md')).toBe('agent');
  });

  it('classifies GEMINI.md as agent', () => {
    expect(classifyFile('GEMINI.md')).toBe('agent');
  });

  it('classifies COPILOT.md as agent', () => {
    expect(classifyFile('COPILOT.md')).toBe('agent');
  });

  it('classifies .windsurf/rules/any.md as agent', () => {
    expect(classifyFile('.windsurf/rules/any.md')).toBe('agent');
  });

  it('classifies .cline/rules/any.md as agent', () => {
    expect(classifyFile('.cline/rules/any.md')).toBe('agent');
  });

  it('classifies absolute paths as agent when under cwd (lint-staged)', () => {
    const cwd = '/repo';
    expect(classifyFile('/repo/.github/skills/migrate/SKILL.md', cwd)).toBe('agent');
    expect(classifyFile('/repo/README.md', cwd)).toBe('standard');
  });
});

describe('classifyFiles', () => {
  it('correctly partitions mixed array into standard and agent buckets', () => {
    const files = [
      'README.md',
      'docs/guide.md',
      'CLAUDE.md',
      'AGENTS.md',
      '.github/skills/deploy/SKILL.md',
      'src/utils.md',
    ];

    const { standard, agent, vault } = classifyFiles(files);

    expect(standard).toEqual(['README.md', 'docs/guide.md', 'src/utils.md']);
    expect(agent).toEqual(['CLAUDE.md', 'AGENTS.md', '.github/skills/deploy/SKILL.md']);
    expect(vault).toEqual([]);
  });

  it('returns empty arrays when input is empty', () => {
    const { standard, agent, vault } = classifyFiles([]);
    expect(standard).toEqual([]);
    expect(agent).toEqual([]);
    expect(vault).toEqual([]);
  });

  it('returns all standard when no agent or vault files present', () => {
    const { standard, agent, vault } = classifyFiles(['README.md', 'docs/guide.md']);
    expect(standard).toHaveLength(2);
    expect(agent).toHaveLength(0);
    expect(vault).toHaveLength(0);
  });

  it('returns all agent when no standard or vault files present', () => {
    const { standard, agent, vault } = classifyFiles(['CLAUDE.md', 'AGENTS.md']);
    expect(standard).toHaveLength(0);
    expect(agent).toHaveLength(2);
    expect(vault).toHaveLength(0);
  });

  it('partitions vault paths into the vault bucket', () => {
    const { standard, agent, vault } = classifyFiles(['README.md', 'vault/nodes/x.md']);
    expect(standard).toEqual(['README.md']);
    expect(agent).toEqual([]);
    expect(vault).toEqual(['vault/nodes/x.md']);
  });
});

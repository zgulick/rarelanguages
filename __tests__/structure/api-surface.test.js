/**
 * @jest-environment node
 *
 * Structural guards on the public API surface.
 *
 * The app has no authentication. Unlinked-but-routable endpoints previously
 * allowed anyone on the internet to delete lesson content or trigger paid
 * OpenAI generation. Everything under src/app/api is now read-only, and these
 * tests fail loudly if a write handler or a debug page reappears.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const API_DIR = path.join(ROOT, 'src', 'app', 'api');

function walk(dir, match) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (fs.statSync(p).isDirectory()) out.push(...walk(p, match));
    else if (match.test(entry)) out.push(p);
  }
  return out;
}

describe('API surface', () => {
  const routes = walk(API_DIR, /^route\.(js|ts)$/);

  it('has route handlers', () => {
    expect(routes.length).toBeGreaterThan(0);
  });

  it('exposes no write handlers anywhere', () => {
    const offenders = routes.filter(f =>
      /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)/.test(
        fs.readFileSync(f, 'utf8')
      )
    );
    expect(offenders.map(f => path.relative(ROOT, f))).toEqual([]);
  });

  it('never returns raw database error text to the client', () => {
    const offenders = routes.filter(f =>
      /details:\s*error\.message/.test(fs.readFileSync(f, 'utf8'))
    );
    expect(offenders.map(f => path.relative(ROOT, f))).toEqual([]);
  });
});

describe('no debug or admin pages ship', () => {
  const forbidden = [
    'src/app/test',
    'src/app/test-conjugations',
    'src/app/content-review',
    'src/app/lesson-generation',
    'src/app/api/content-review',
    'src/app/api/lesson-generation',
    'src/app/api/validation',
    'src/app/api/courses/generate'
  ];

  it.each(forbidden)('%s does not exist', p => {
    expect(fs.existsSync(path.join(ROOT, p))).toBe(false);
  });
});

describe('source files are valid code', () => {
  it('contains no stray markdown code fences', () => {
    // A pasted ``` fence in a route handler broke the production build and
    // silently blocked every Vercel deploy.
    const files = [
      ...walk(path.join(ROOT, 'src'), /\.(js|jsx|ts|tsx)$/),
      ...walk(path.join(ROOT, 'lib'), /\.(js|jsx|ts|tsx)$/),
      ...walk(path.join(ROOT, 'components'), /\.(js|jsx|ts|tsx)$/)
    ];
    const offenders = files.filter(f =>
      /^```/m.test(fs.readFileSync(f, 'utf8'))
    );
    expect(offenders.map(f => path.relative(ROOT, f))).toEqual([]);
  });
});

describe('build guardrails stay enabled', () => {
  it('next.config.ts does not suppress type or lint errors', () => {
    const cfg = fs.readFileSync(path.join(ROOT, 'next.config.ts'), 'utf8');
    expect(cfg).not.toMatch(/ignoreBuildErrors\s*:\s*true/);
    expect(cfg).not.toMatch(/ignoreDuringBuilds\s*:\s*true/);
  });
});

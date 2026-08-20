/**
 * @jest-environment node
 *
 * Regression tests for the API response contract.
 *
 * These exist because the lesson page showed "Error Loading Lesson" on every
 * single request: the route returned a bare database row while the page
 * checked `data.success`, which was therefore always undefined. Nothing in
 * the build caught it. These tests pin the envelope so it cannot drift again.
 */

jest.mock('../../lib/database', () => ({
  query: jest.fn(),
  db: {}
}));

const { query } = require('../../lib/database');

const LESSON_ID = '11111111-1111-1111-1111-111111111111';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/lessons/[id]', () => {
  const load = () => require('../../src/app/api/lessons/[id]/route');

  it('wraps a found lesson in { success: true, data }', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: LESSON_ID, name: 'Albanian Sounds', skill_id: 's1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'c1', english_phrase: 'hello' }] });

    const { GET } = load();
    const res = await GET(new Request(`http://test/api/lessons/${LESSON_ID}`), {
      params: Promise.resolve({ id: LESSON_ID })
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Albanian Sounds');
    expect(body.data.content).toHaveLength(1);
  });

  it('returns success:false and 404 when the lesson does not exist', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const { GET } = load();
    const res = await GET(new Request(`http://test/api/lessons/${LESSON_ID}`), {
      params: Promise.resolve({ id: LESSON_ID })
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.success).toBe(false);
  });

  it('does not write to the database on a GET', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: LESSON_ID, name: 'x', skill_id: 's1' }] })
      .mockResolvedValueOnce({ rows: [] });

    const { GET } = load();
    await GET(new Request(`http://test/api/lessons/${LESSON_ID}`), {
      params: Promise.resolve({ id: LESSON_ID })
    });

    const statements = query.mock.calls.map(c => String(c[0]).toUpperCase());
    expect(statements.some(s => /INSERT|UPDATE|DELETE/.test(s))).toBe(false);
  });
});

describe('GET /api/languages/[code]/level/[level]/skills', () => {
  it('joins skills through course_skills, never skills.course_id', async () => {
    query
      .mockResolvedValueOnce({
        rows: [{ id: 'skill-1', name: 'Unit 1', language_name: 'Gheg Albanian' }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: 'l1', skill_id: 'skill-1', name: 'Lesson 1', estimated_minutes: 30 }]
      });

    const { GET } = require('../../src/app/api/languages/[code]/level/[level]/skills/route');
    const res = await GET(new Request('http://test/'), {
      params: Promise.resolve({ code: 'gheg-al', level: '1' })
    });
    const body = await res.json();

    const skillsSql = String(query.mock.calls[0][0]);
    expect(skillsSql).toMatch(/course_skills/);
    // The skills table has no course_id column; joining on it is a guaranteed
    // 500. Anchor the match so the legitimate `cs.course_id` on the
    // course_skills alias does not trip this.
    expect(skillsSql).not.toMatch(/(^|[^a-z_])s\.course_id/i);

    expect(body.success).toBe(true);
    expect(body.languageName).toBe('Gheg Albanian');
    expect(body.skills[0].lessons).toHaveLength(1);
    expect(body.skills[0].totalLessons).toBe(1);
  });

  it('reports failure with a 500 rather than pretending the level is empty', async () => {
    query.mockRejectedValueOnce(new Error('connection terminated'));

    const { GET } = require('../../src/app/api/languages/[code]/level/[level]/skills/route');
    const res = await GET(new Request('http://test/'), {
      params: Promise.resolve({ code: 'gheg-al', level: '1' })
    });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });
});

describe('GET /api/stats', () => {
  it('returns 500 when the database is unreachable, not a healthy-looking 200', async () => {
    query.mockRejectedValue(new Error('ECONNREFUSED'));

    const { GET } = require('../../src/app/api/stats/route');
    const res = await GET();
    const body = await res.json();

    // Returning 200 here made uptime monitoring report healthy during an outage.
    expect(res.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it('does not leak the underlying database error to the client', async () => {
    query.mockRejectedValue(new Error('relation "processed_lessons" does not exist'));

    const { GET } = require('../../src/app/api/stats/route');
    const body = await (await GET()).json();

    expect(JSON.stringify(body)).not.toMatch(/relation|does not exist/);
  });
});

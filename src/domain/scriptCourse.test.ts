import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { SCRIPT_ENTRIES, SCRIPT_LESSONS, type ScriptFont } from '../content/scripts/data';
import { newlyUnlocked } from './achievements';
import { emptyCourse, emptyRoot } from './progress';
import {
  answerScript,
  buildScriptLesson,
  buildScriptPractice,
  nextScript,
  retask,
  SCRIPT_BY_ID,
  scriptScore,
  solidNew,
  startScriptSession,
  type GradedScriptTask,
} from './scriptCourse';
import { emptyProgress, type ItemProgress } from './srs';
import { seededRng } from './taskFactory';

const box = (b: number): ItemProgress => ({ ...emptyProgress(), box: b, due: '2026-10-06' });

describe('scripts course data', () => {
  it('every script is taught in exactly one lesson; references exist', () => {
    const taught = SCRIPT_LESSONS.flatMap((l) => l.newIds);
    expect(new Set(taught).size).toBe(taught.length);
    expect([...taught].sort()).toEqual(SCRIPT_ENTRIES.map((e) => e.id).sort());
    for (const l of SCRIPT_LESSONS) for (const id of l.reviewIds ?? []) expect(SCRIPT_BY_ID.has(id)).toBe(true);
    for (const e of SCRIPT_ENTRIES) {
      for (const c of e.confusable) expect(SCRIPT_BY_ID.has(c), `${e.id} → ${c}`).toBe(true);
      expect(e.samples.length).toBeGreaterThanOrEqual(2);
      expect(e.features.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('places are unique, so an answer is never ambiguous', () => {
    const where = SCRIPT_ENTRIES.map((e) => e.where.de);
    expect(new Set(where).size).toBe(where.length);
  });

  // Samples must be written in the script they stand for.
  const BLOCKS: Partial<Record<ScriptFont, [number, number][]>> = {
    arabic: [[0x0600, 0x06ff]], hebrew: [[0x0590, 0x05ff]], thai: [[0x0e00, 0x0e7f]], lao: [[0x0e80, 0x0eff]], khmer: [[0x1780, 0x17ff]],
    devanagari: [[0x0900, 0x097f]], bengali: [[0x0980, 0x09ff]], gurmukhi: [[0x0a00, 0x0a7f]], gujarati: [[0x0a80, 0x0aff]], oriya: [[0x0b00, 0x0b7f]],
    tamil: [[0x0b80, 0x0bff]], telugu: [[0x0c00, 0x0c7f]], kannada: [[0x0c80, 0x0cff]], malayalam: [[0x0d00, 0x0d7f]], sinhala: [[0x0d80, 0x0dff]],
    tibetan: [[0x0f00, 0x0fff]], kr: [[0xac00, 0xd7af]], jp: [[0x3040, 0x30ff], [0x4e00, 0x9fff]], tc: [[0x4e00, 0x9fff]],
  };
  it('samples use only characters of their script (plus spaces and joiners)', () => {
    for (const e of SCRIPT_ENTRIES) {
      const blocks = BLOCKS[e.font];
      if (!blocks) continue;
      for (const s of e.samples) {
        for (const ch of s.native) {
          const cp = ch.codePointAt(0)!;
          const ok = ch === ' ' || cp === 0x200c || cp === 0x200d || blocks.some(([a, b]) => cp >= a && cp <= b);
          expect(ok, `${e.id}: ${s.native} has U+${cp.toString(16)}`).toBe(true);
        }
      }
    }
  });

  it('every Cyrillic variant sample contains its giveaway letter', () => {
    const giveaway: Record<string, RegExp> = {
      'scripts:russian': /[ыэ]/i,
      'scripts:ukrainian': /[їєґ]/i,
      'scripts:bulgarian': /\Sъ\S/i,
      'scripts:serbian': /[ђћџ]/i,
      'scripts:macedonian': /[ѓќѕ]/i,
      'scripts:kazakh': /[қғәұһ]/i,
      'scripts:mongolian': /(аа|ээ|үү|оо|өө)/i,
    };
    for (const [id, re] of Object.entries(giveaway)) for (const s of SCRIPT_BY_ID.get(id)!.samples) expect(re.test(s.native), `${id}: ${s.native}`).toBe(true);
  });

  it('the bundled font subsets cover every character of the course', () => {
    const css = fs.readFileSync(path.join(__dirname, '../features/scripts/fonts.css'), 'utf8');
    const faces = [...css.matchAll(/font-family: '([^']+)';[\s\S]*?unicode-range: ([^;]+);/g)].map((m) => ({ family: m[1], range: m[2] }));
    const FAMILY: Partial<Record<ScriptFont, string>> = {
      arabic: 'Noto Sans Arabic', hebrew: 'Noto Sans Hebrew', lao: 'Noto Sans Lao', khmer: 'Noto Sans Khmer', devanagari: 'Noto Sans Devanagari',
      gurmukhi: 'Noto Sans Gurmukhi', gujarati: 'Noto Sans Gujarati', oriya: 'Noto Sans Oriya', tibetan: 'Noto Serif Tibetan', tamil: 'Noto Sans Tamil',
      telugu: 'Noto Sans Telugu', kannada: 'Noto Sans Kannada', malayalam: 'Noto Sans Malayalam', sinhala: 'Noto Sans Sinhala',
      jp: 'Noto Sans JP', tc: 'Noto Sans TC', kr: 'Noto Sans KR',
    };
    const covers = (range: string, cp: number) =>
      range.split(',').some((r) => {
        const [a, b] = r.trim().replace(/^U\+/, '').split('-');
        return cp >= parseInt(a, 16) && cp <= parseInt(b ?? a, 16);
      });
    for (const e of SCRIPT_ENTRIES) {
      const family = FAMILY[e.font];
      if (!family) continue;
      const text = [...e.samples.map((s) => s.native), ...e.features.map((f) => f.mark ?? '')].join('');
      for (const ch of text) {
        const cp = ch.codePointAt(0)!;
        if (cp < 0x300 || cp === 0x200c || cp === 0x200d) continue;
        expect(faces.some((f) => f.family === family && covers(f.range, cp)), `${e.id}: ${ch} U+${cp.toString(16)} not in ${family}`).toBe(true);
      }
    }
  });
});

describe('scripts lessons and practice', () => {
  it('a lesson introduces each new script, then mixes both task kinds', () => {
    const lesson = SCRIPT_LESSONS[3];
    const tasks = buildScriptLesson(lesson, {}, seededRng(1));
    expect(tasks.filter((t) => t.kind === 'intro').map((t) => t.itemId)).toEqual(lesson.newIds);
    for (const t of tasks) {
      if (t.kind === 'where') {
        expect(t.options).toHaveLength(4);
        expect(new Set(t.options).size).toBe(4);
        expect(t.options).toContain(t.itemId);
        expect(SCRIPT_BY_ID.get(t.itemId)!.samples).toContainEqual(t.sample);
      }
      if (t.kind === 'pick') {
        expect(t.options).toHaveLength(3);
        expect(t.options.map((o) => o.itemId)).toContain(t.itemId);
        for (const o of t.options) expect(SCRIPT_BY_ID.get(o.itemId)!.samples).toContainEqual(o.sample);
      }
    }
    expect(tasks.filter((t) => t.kind === 'pick').length).toBe(lesson.newIds.length);
  });

  it('confusable scripts the learner knows are preferred as wrong options', () => {
    const items = Object.fromEntries(SCRIPT_ENTRIES.map((e) => [e.id, box(2)]));
    const lesson = SCRIPT_LESSONS.find((l) => l.newIds.includes('scripts:lao'))!;
    for (let seed = 1; seed < 20; seed++) {
      const t = buildScriptLesson(lesson, items, seededRng(seed)).find((x) => x.kind === 'where' && x.itemId === 'scripts:lao') as Extract<GradedScriptTask, { kind: 'where' }>;
      expect(t.options).toEqual(expect.arrayContaining(['scripts:thai', 'scripts:khmer']));
    }
  });

  it('wrong options come from the same family, not from unrelated known scripts', () => {
    const items = Object.fromEntries(SCRIPT_ENTRIES.map((e) => [e.id, box(2)]));
    const lesson = SCRIPT_LESSONS.find((l) => l.newIds.includes('scripts:macedonian'))!;
    for (let seed = 1; seed < 20; seed++) {
      for (const t of buildScriptLesson(lesson, items, seededRng(seed))) {
        const family = new Set([...lesson.newIds, ...(lesson.reviewIds ?? []), ...SCRIPT_BY_ID.get(t.itemId)!.confusable]);
        if (t.kind === 'where') for (const o of t.options) expect(family.has(o), `${t.itemId}: ${o}`).toBe(true);
      }
    }
  });

  it('known scripts skip their card when a lesson is repeated', () => {
    const lesson = SCRIPT_LESSONS[0];
    const tasks = buildScriptLesson(lesson, Object.fromEntries(lesson.newIds.map((id) => [id, box(3)])), seededRng(2));
    expect(tasks.some((t) => t.kind === 'intro')).toBe(false);
  });

  it('a wrong answer comes back once with another task; scores count every answer', () => {
    const lesson = SCRIPT_LESSONS[2];
    const rng = seededRng(5);
    const pool = new Set(SCRIPT_ENTRIES.map((e) => e.id));
    let s = startScriptSession(buildScriptLesson(lesson, {}, rng));
    const again = (t: GradedScriptTask) => retask(t, pool, rng);
    let wrongOnce = false;
    while (s.phase !== 'done') {
      const t = s.tasks[s.index];
      if (t.kind !== 'intro') {
        const right = t.itemId;
        const wrong = (t.kind === 'where' ? t.options : t.options.map((o) => o.itemId)).find((o) => o !== right)!;
        s = answerScript(s, !wrongOnce && t.itemId === 'scripts:lao' ? wrong : right, again);
        if (t.itemId === 'scripts:lao') wrongOnce = true;
      }
      s = nextScript(s);
    }
    expect(s.reasked).toEqual(['scripts:lao']);
    const score = scriptScore(s);
    expect(score.total).toBe(s.plannedGraded + 1);
    expect(score.correct).toBe(score.total - 1);
    expect(solidNew(s, lesson.newIds)).toEqual([
      { itemId: 'scripts:lao', solid: false },
      { itemId: 'scripts:khmer', solid: true },
    ]);
  });

  it('practice uses learned scripts only, or exactly the given ones', () => {
    const items = { 'scripts:lao': box(2), 'scripts:khmer': box(1) };
    const tasks = buildScriptPractice(items, 10, seededRng(3));
    expect(tasks).toHaveLength(10);
    expect(new Set(tasks.map((t) => t.itemId))).toEqual(new Set(['scripts:lao', 'scripts:khmer']));
    expect(buildScriptPractice({}, 10, seededRng(3))).toEqual([]);
    expect(new Set(buildScriptPractice({}, 8, seededRng(3), undefined, ['scripts:tamil']).map((t) => t.itemId))).toEqual(new Set(['scripts:tamil']));
  });

  it('all scripts recognised reliably unlocks "Script Spotter"', () => {
    const root = emptyRoot('de', 1);
    root.courses.scripts = { ...emptyCourse(1), items: Object.fromEntries(SCRIPT_ENTRIES.map((e) => [e.id, box(3)])) };
    expect(newlyUnlocked(root, 'scripts', null)).toContain('script-spotter');
    root.courses.scripts.items['scripts:lao'] = box(2);
    expect(newlyUnlocked(root, 'scripts', null)).not.toContain('script-spotter');
  });
});

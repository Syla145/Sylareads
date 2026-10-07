import { describe, expect, it } from 'vitest';
import ru from '../content/ru';
import { ACHIEVEMENTS, achievementById, achievementTitle, isSecretPhrase, newlyUnlocked, nextGoals, SECRET_ID } from './achievements';
import { buildIndex } from './courseIndex';
import { emptyCourse, emptyRoot, unlockAchievements } from './progress';
import { emptyProgress } from './srs';

const index = buildIndex(ru);

describe('achievements', () => {
  it('ids are unique; every course has its tiered families and one special', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of ['ru', 'el', 'th', 'bn']) {
      for (const f of ['alphabet', 'cities', 'path', 'blitz', 'flawless']) for (const t of [1, 2, 3]) expect(achievementById(`${c}:${f}:${t}`), `${c}:${f}:${t}`).toBeTruthy();
      expect(achievementById(`${c}:special`)).toBeTruthy();
    }
    expect(achievementById('el:map:1')).toBeUndefined();
    expect(achievementById('bn:map:3')).toBeTruthy();
  });

  it('titles carry the tier', () => {
    expect(achievementTitle(achievementById('ru:cities:2')!, 'de')).toBe('Stadtleser Silber');
    expect(achievementTitle(achievementById(SECRET_ID)!, 'en')).toBe('?');
  });

  it('the Easter egg phrase is recognised forgivingly, and only unlocked by it', () => {
    expect(isSecretPhrase('Syla ist der beste Geoguessr-Spieler!')).toBe(true);
    expect(isSecretPhrase('  syla ist der beste geoguessr spieler ')).toBe(true);
    expect(isSecretPhrase('Syla ist der beste Spieler')).toBe(false);
    const root = emptyRoot('de', 1);
    expect(newlyUnlocked(root, 'ru', index)).not.toContain(SECRET_ID);
    const after = unlockAchievements(root, [SECRET_ID]);
    expect(after.profile.achievements[SECRET_ID]).toBeGreaterThan(0);
  });

  it('only the open course and general achievements are decided', () => {
    const root = emptyRoot('de', 1);
    root.courses.ru = { ...emptyCourse(1), items: Object.fromEntries(index.byKind.letter.map((l) => [l.id, { ...emptyProgress(), box: 1 }])) };
    const ids = newlyUnlocked(root, 'ru', index);
    expect(ids).toEqual(['ru:alphabet:1']);
    expect(newlyUnlocked(root, 'el', null)).toEqual([]);
  });

  it('next goals: the lowest open tier per family, closest first', () => {
    const root = emptyRoot('de', 1);
    const cities = index.byKind.city.map((c) => c.id);
    root.courses.ru = { ...emptyCourse(1), items: Object.fromEntries(cities.slice(0, 8).map((id) => [id, { ...emptyProgress(), box: 5 }])) };
    const goals = nextGoals(root, 'ru', index);
    expect(goals[0]).toMatchObject({ value: 8, target: 10 });
    expect(goals[0].def.id).toBe('ru:cities:1');
    expect(goals.some((g) => g.def.id === 'ru:cities:2')).toBe(false);
  });
});

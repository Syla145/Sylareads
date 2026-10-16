import type { CourseContent, CourseMap } from '../../domain/types';
import { CONTRAST_SETS, DIGRAPHS, LETTERS, SYLLABLES } from './letters';
import { LESSONS, PHASES } from './lessons';
import { CITIES, REGIONS } from './places';
import { requiredUnitsEl, segmentEl } from './translit';
import { ELEMENTS, TERMS, WORDS } from './words';
import { withCoords } from '../coords';
import { COORDS } from './coords';

const content: CourseContent = {
  id: 'el',
  letters: LETTERS,
  combos: [...SYLLABLES, ...DIGRAPHS],
  words: [...WORDS, ...ELEMENTS, ...TERMS],
  places: withCoords([...CITIES, ...REGIONS], COORDS),
  contrastSets: CONTRAST_SETS,
  phases: PHASES,
  lessons: LESSONS,
  segments: segmentEl,
  requiredLetters: requiredUnitsEl,
  loadMap: () => import('./map.json').then((m) => m.default as unknown as CourseMap),
  hasCase: true,
};

export default content;

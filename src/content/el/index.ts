import type { CourseContent } from '../../domain/types';
import { CONTRAST_SETS, DIGRAPHS, LETTERS, SYLLABLES } from './letters';
import { LESSONS, PHASES } from './lessons';
import { CITIES, REGIONS } from './places';
import { requiredUnitsEl, segmentEl } from './translit';
import { ELEMENTS, TERMS, WORDS } from './words';

const content: CourseContent = {
  id: 'el',
  letters: LETTERS,
  combos: [...SYLLABLES, ...DIGRAPHS],
  words: [...WORDS, ...ELEMENTS, ...TERMS],
  places: [...CITIES, ...REGIONS],
  contrastSets: CONTRAST_SETS,
  phases: PHASES,
  lessons: LESSONS,
  segments: segmentEl,
  requiredLetters: requiredUnitsEl,
  hasCase: true,
};

export default content;

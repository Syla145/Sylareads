import type { CourseContent } from '../../domain/types';
import { CONTRAST_SETS, LETTERS } from './letters';
import { LESSONS, PHASES } from './lessons';
import { CITIES, REGIONS } from './places';
import { requiredLettersRu, segmentRu } from './translit';
import { COMBOS, ELEMENTS, TERMS, WORDS } from './words';

const content: CourseContent = {
  id: 'ru',
  letters: LETTERS,
  combos: COMBOS,
  words: [...WORDS, ...ELEMENTS, ...TERMS],
  places: [...CITIES, ...REGIONS],
  contrastSets: CONTRAST_SETS,
  phases: PHASES,
  lessons: LESSONS,
  segments: segmentRu,
  requiredLetters: requiredLettersRu,
  hasCase: true,
};

export default content;

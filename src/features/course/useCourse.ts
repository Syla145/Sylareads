import { createContext, useContext, useEffect, useState } from 'react';
import { buildIndex, type CourseIndex } from '../../domain/courseIndex';
import type { CourseMeta } from '../../domain/types';

const cache = new Map<string, Promise<CourseIndex>>();

/** Loads a course's content once (lazy, code-split per course) and builds its index. */
export function loadCourseIndex(meta: CourseMeta): Promise<CourseIndex> {
  if (!meta.load) return Promise.reject(new Error('course-unavailable'));
  let p = cache.get(meta.id);
  if (!p) {
    p = meta.load().then(buildIndex);
    cache.set(meta.id, p);
  }
  return p;
}

export function useCourseIndex(meta: CourseMeta | undefined): CourseIndex | null {
  const [index, setIndex] = useState<CourseIndex | null>(null);
  useEffect(() => {
    let alive = true;
    setIndex(null);
    if (meta?.status === 'available') {
      loadCourseIndex(meta).then((i) => alive && setIndex(i));
    }
    return () => {
      alive = false;
    };
  }, [meta]);
  return index;
}

export interface CourseCtx {
  meta: CourseMeta;
  index: CourseIndex;
}

export const CourseContext = createContext<CourseCtx | null>(null);

export function useCourse(): CourseCtx {
  const ctx = useContext(CourseContext);
  if (!ctx) throw new Error('useCourse outside CourseContext');
  return ctx;
}

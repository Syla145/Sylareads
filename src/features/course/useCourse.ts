import { createContext, useContext, useEffect, useState } from 'react';
import { attachMap, buildIndex, type CourseIndex } from '../../domain/courseIndex';
import type { CourseMeta } from '../../domain/types';

const cache = new Map<string, Promise<CourseIndex>>();

/** Loads a course's content once (lazy, code-split per course) and builds its index. */
export function loadCourseIndex(meta: CourseMeta): Promise<CourseIndex> {
  if (!meta.load) return Promise.reject(new Error('course-unavailable'));
  let p = cache.get(meta.id);
  if (!p) {
    // Content and map are separate files: both are requested at once.
    const map = meta.loadMap?.();
    p = meta.load().then(async (content) => {
      const index = buildIndex(content);
      const loadMap = map ?? content.loadMap?.();
      if (loadMap) attachMap(index, await loadMap);
      return index;
    });
    // A failed download (offline, new version deployed) must not stick: the next try loads again.
    p.catch(() => cache.delete(meta.id));
    cache.set(meta.id, p);
  }
  return p;
}

/** The course index (null while loading); `failed` when it could not be loaded, `retry` tries again. */
export function useCourseIndex(meta: CourseMeta | undefined): { index: CourseIndex | null; failed: boolean; retry: () => void } {
  const [loaded, setLoaded] = useState<CourseIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setFailed(false);
    if (meta?.status === 'available') {
      loadCourseIndex(meta).then(
        (i) => alive && setLoaded(i),
        () => alive && setFailed(true),
      );
    }
    return () => {
      alive = false;
    };
  }, [meta, attempt]);
  // When switching courses the previous index is still in state for one render;
  // never hand it out for the new course (a lesson id would not be found in it).
  return { index: loaded && loaded.content.id === meta?.id ? loaded : null, failed, retry: () => setAttempt((n) => n + 1) };
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

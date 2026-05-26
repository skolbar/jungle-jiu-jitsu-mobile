import type { Belt, Profile } from './types';

export const CLASSES_PER_GRADE: Record<Belt, number | null> = {
  white: 35,
  blue: 65,
  purple: 75,
  brown: 85,
  black: null,
};

export const BELT_NAMES_PT: Record<Belt, string> = {
  white: 'Branca',
  blue: 'Azul',
  purple: 'Roxa',
  brown: 'Marrom',
  black: 'Preta',
};

export interface GraduationProgress {
  classesPerGrade: number | null;
  currentCycleClasses: number;
  classesNeeded: number | null;
  progressPct: number;
  isBlackBelt: boolean;
  canPromoteGrade: boolean;
  canPromoteBelt: boolean;
}

export function getBeltName(belt: Belt | null | undefined): string {
  return belt ? BELT_NAMES_PT[belt] : 'Nao definida';
}

export function computeGraduationProgress(
  profile: Pick<Profile, 'belt' | 'degree' | 'cycle_classes'>
): GraduationProgress {
  const classesPerGrade = CLASSES_PER_GRADE[profile.belt];

  if (profile.belt === 'black' || classesPerGrade === null) {
    return {
      classesPerGrade: null,
      currentCycleClasses: profile.cycle_classes,
      classesNeeded: null,
      progressPct: 0,
      isBlackBelt: true,
      canPromoteGrade: false,
      canPromoteBelt: false,
    };
  }

  const classesNeeded = Math.max(0, classesPerGrade - profile.cycle_classes);
  const progressPct = Math.min(100, Math.round((profile.cycle_classes / classesPerGrade) * 100));

  return {
    classesPerGrade,
    currentCycleClasses: profile.cycle_classes,
    classesNeeded,
    progressPct,
    isBlackBelt: false,
    canPromoteGrade: profile.degree < 4 && profile.cycle_classes >= classesPerGrade,
    canPromoteBelt: profile.degree === 4 && profile.cycle_classes >= classesPerGrade,
  };
}

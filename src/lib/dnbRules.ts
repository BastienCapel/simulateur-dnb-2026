export const DNB_WEIGHTS = {
  continuousAssessment: 0.4,
  terminalExams: 0.6,
} as const;

export const TERMINAL_EXAM_COEFFICIENTS = {
  french: 2,
  mathematics: 2,
  historyGeography: 1.5,
  emc: 0.5,
  sciences: 2,
  oral: 2,
} as const;

export const TERMINAL_EXAM_TOTAL_COEFFICIENT = 10;

export const DNB_THRESHOLDS = {
  admission: 10,
  assezBien: 12,
  bien: 14,
  tresBien: 16,
  tresBienFelicitations: 18,
} as const;

export const TARGET_THRESHOLDS = [
  { label: "DNB", value: DNB_THRESHOLDS.admission },
  { label: "Mention assez bien", value: DNB_THRESHOLDS.assezBien },
  { label: "Mention bien", value: DNB_THRESHOLDS.bien },
  { label: "Mention très bien", value: DNB_THRESHOLDS.tresBien },
  {
    label: "Mention très bien avec félicitations du jury",
    value: DNB_THRESHOLDS.tresBienFelicitations,
  },
] as const;

/**
 * Disciplines de l'épreuve terminale avec leur coefficient officiel.
 * L'épreuve de sciences (coef. 2) porte sur deux disciplines tirées au sort,
 * chacune comptant donc pour 1 dans le total de 10.
 */
export const TERMINAL_EXAM_FIELDS = [
  { field: "french", label: "Français", coefficient: 2, maxGrade: 20 },
  { field: "mathematics", label: "Mathématiques", coefficient: 2, maxGrade: 20 },
  { field: "historyGeography", label: "Histoire-géographie", coefficient: 1.5, maxGrade: 20 },
  { field: "emc", label: "EMC", coefficient: 0.5, maxGrade: 20 },
  { field: "scienceSubject1", label: "Sciences — Physique-chimie", coefficient: null, maxGrade: 20 },
  { field: "scienceSubject2", label: "Sciences — SVT", coefficient: null, maxGrade: 20 },
  { field: "oral", label: "Oral de soutenance", coefficient: 2, maxGrade: 20 },
] as const;

export const MENTION_LABELS = {
  noMention: "Admis sans mention",
  assezBien: "Mention assez bien",
  bien: "Mention bien",
  tresBien: "Mention très bien",
  tresBienFelicitations: "Mention très bien avec félicitations du jury",
} as const;

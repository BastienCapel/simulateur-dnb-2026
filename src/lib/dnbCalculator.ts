import type {
  CalculatedDnbResult,
  ExamSimulation,
  Student,
} from "@/types/student";
import {
  DNB_THRESHOLDS,
  DNB_WEIGHTS,
  MENTION_LABELS,
  TERMINAL_EXAM_COEFFICIENTS,
  TERMINAL_EXAM_TOTAL_COEFFICIENT,
} from "@/lib/dnbRules";

const isValidGrade = (value: number | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 20;

export function roundGrade(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function clampGrade(value: number): number {
  return Math.min(20, Math.max(0, value));
}

export function calculateContinuousAssessmentAverage(
  student: Student,
): number | null {
  const grades = Object.values(student.continuousAssessment).filter(
    (grade): grade is number => typeof grade === "number" && Number.isFinite(grade),
  );

  if (grades.length === 0) {
    return null;
  }

  // DNB 2026: moyenne arithmétique simple des disciplines obligatoires disponibles.
  return roundGrade(grades.reduce((sum, grade) => sum + grade, 0) / grades.length);
}

export function calculateScienceGrade(
  simulation: ExamSimulation,
): number | null {
  if (
    !isValidGrade(simulation.scienceSubject1) ||
    !isValidGrade(simulation.scienceSubject2)
  ) {
    return null;
  }

  return roundGrade((simulation.scienceSubject1 + simulation.scienceSubject2) / 2);
}

export function calculateTerminalExamAverage(
  simulation: ExamSimulation,
): number | null {
  const sciences = calculateScienceGrade(simulation);

  if (
    !isValidGrade(simulation.french) ||
    !isValidGrade(simulation.mathematics) ||
    !isValidGrade(simulation.historyGeography) ||
    !isValidGrade(simulation.emc) ||
    sciences === null ||
    !isValidGrade(simulation.oral)
  ) {
    return null;
  }

  const weightedTotal =
    simulation.french * TERMINAL_EXAM_COEFFICIENTS.french +
    simulation.mathematics * TERMINAL_EXAM_COEFFICIENTS.mathematics +
    simulation.historyGeography * TERMINAL_EXAM_COEFFICIENTS.historyGeography +
    simulation.emc * TERMINAL_EXAM_COEFFICIENTS.emc +
    sciences * TERMINAL_EXAM_COEFFICIENTS.sciences +
    simulation.oral * TERMINAL_EXAM_COEFFICIENTS.oral;

  return roundGrade(weightedTotal / TERMINAL_EXAM_TOTAL_COEFFICIENT);
}

export function calculateFinalAverage(
  continuousAverage: number | null,
  terminalAverage: number | null,
): number | null {
  if (
    continuousAverage === null ||
    terminalAverage === null ||
    !isValidGrade(continuousAverage) ||
    !isValidGrade(terminalAverage)
  ) {
    return null;
  }

  return roundGrade(
    continuousAverage * DNB_WEIGHTS.continuousAssessment +
      terminalAverage * DNB_WEIGHTS.terminalExams,
  );
}

export function getAdmissionStatus(
  finalAverage: number | null,
): CalculatedDnbResult["status"] {
  if (finalAverage === null) {
    return "incomplet";
  }

  return finalAverage >= DNB_THRESHOLDS.admission ? "admis" : "non_admis";
}

export function getMention(finalAverage: number | null): string | null {
  if (finalAverage === null || finalAverage < DNB_THRESHOLDS.admission) {
    return null;
  }

  if (finalAverage >= DNB_THRESHOLDS.tresBienFelicitations) {
    return MENTION_LABELS.tresBienFelicitations;
  }

  if (finalAverage >= DNB_THRESHOLDS.tresBien) {
    return MENTION_LABELS.tresBien;
  }

  if (finalAverage >= DNB_THRESHOLDS.bien) {
    return MENTION_LABELS.bien;
  }

  if (finalAverage >= DNB_THRESHOLDS.assezBien) {
    return MENTION_LABELS.assezBien;
  }

  return MENTION_LABELS.noMention;
}

export function calculateRequiredTerminalAverage(
  continuousAverage: number | null,
  targetFinalAverage: number,
): number | null {
  if (continuousAverage === null || !isValidGrade(continuousAverage)) {
    return null;
  }

  return roundGrade(
    (targetFinalAverage - continuousAverage * DNB_WEIGHTS.continuousAssessment) /
      DNB_WEIGHTS.terminalExams,
  );
}

export function calculateRequiredOralGrade(
  continuousAverage: number | null,
  simulationWithoutOral: ExamSimulation,
  targetFinalAverage: number,
): number | null {
  if (continuousAverage === null || !isValidGrade(continuousAverage)) {
    return null;
  }

  const sciences = calculateScienceGrade(simulationWithoutOral);

  if (
    !isValidGrade(simulationWithoutOral.french) ||
    !isValidGrade(simulationWithoutOral.mathematics) ||
    !isValidGrade(simulationWithoutOral.historyGeography) ||
    !isValidGrade(simulationWithoutOral.emc) ||
    sciences === null
  ) {
    return null;
  }

  const targetTerminalAverage =
    (targetFinalAverage -
      continuousAverage * DNB_WEIGHTS.continuousAssessment) /
    DNB_WEIGHTS.terminalExams;

  const knownWeightedTotal =
    simulationWithoutOral.french * TERMINAL_EXAM_COEFFICIENTS.french +
    simulationWithoutOral.mathematics * TERMINAL_EXAM_COEFFICIENTS.mathematics +
    simulationWithoutOral.historyGeography *
      TERMINAL_EXAM_COEFFICIENTS.historyGeography +
    simulationWithoutOral.emc * TERMINAL_EXAM_COEFFICIENTS.emc +
    sciences * TERMINAL_EXAM_COEFFICIENTS.sciences;

  const requiredOral =
    (targetTerminalAverage * TERMINAL_EXAM_TOTAL_COEFFICIENT -
      knownWeightedTotal) /
    TERMINAL_EXAM_COEFFICIENTS.oral;

  return roundGrade(requiredOral);
}

export function calculateDnbResult(
  student: Student,
  simulation: ExamSimulation,
): CalculatedDnbResult {
  const continuousAssessmentAverage =
    calculateContinuousAssessmentAverage(student);
  const terminalExamAverage = calculateTerminalExamAverage(simulation);
  const finalAverage = calculateFinalAverage(
    continuousAssessmentAverage,
    terminalExamAverage,
  );

  return {
    continuousAssessmentAverage,
    terminalExamAverage,
    finalAverage,
    status: getAdmissionStatus(finalAverage),
    mention: getMention(finalAverage),
  };
}

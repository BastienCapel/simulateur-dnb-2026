export type Student = {
  id: string;
  lastName: string;
  firstName: string;
  className: string;
  oralGrade: number;
  continuousAssessment: Record<string, number | null>;
};

export type ExamSimulation = {
  french?: number;
  mathematics?: number;
  historyGeography?: number;
  emc?: number;
  scienceSubject1?: number;
  scienceSubject2?: number;
  oral?: number;
};

export type AdmissionStatus = "admis" | "non_admis" | "incomplet";

export type CalculatedDnbResult = {
  continuousAssessmentAverage: number | null;
  terminalExamAverage: number | null;
  finalAverage: number | null;
  status: AdmissionStatus;
  mention: string | null;
};

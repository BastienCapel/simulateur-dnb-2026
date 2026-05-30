"use client";

import { FileSpreadsheet } from "lucide-react";
import type { ExamSimulation, Student } from "@/types/student";
import { TARGET_THRESHOLDS, TERMINAL_EXAM_FIELDS } from "@/lib/dnbRules";
import {
  calculateDnbResult,
  calculateRequiredTerminalAverage,
  calculateScienceGrade,
} from "@/lib/dnbCalculator";
import { formatGrade } from "@/lib/format";
import { exportStudentExcel } from "@/lib/excelExport";
import { GradeInput } from "@/components/GradeInput";

type StudentSimulationPanelProps = {
  student: Student;
  simulation: ExamSimulation;
  onSimulationChange: (simulation: ExamSimulation) => void;
  onReset: () => void;
  titleId: string;
};

const formatRequirement = (value: number | null) => {
  if (value === null) return "Non calculable";
  if (value <= 0) return "Acquis par le contrôle continu";
  if (value > 20) return "Impossible (> 20)";
  return formatGrade(value);
};

function StatusWord({ status }: { status: ReturnType<typeof calculateDnbResult>["status"] }) {
  const map = {
    admis: { label: "Admis", color: "text-admis" },
    non_admis: { label: "Non admis", color: "text-refuse" },
    incomplet: { label: "Incomplet", color: "text-ink-faint" },
  } as const;
  const { label, color } = map[status];
  return <span className={`font-semibold ${color}`}>{label}</span>;
}

export function StudentSimulationPanel({
  student,
  simulation,
  onSimulationChange,
  onReset,
  titleId,
}: StudentSimulationPanelProps) {
  const result = calculateDnbResult(student, simulation);
  const scienceGrade = calculateScienceGrade(simulation);

  const updateSimulation = (field: keyof ExamSimulation, value: number | undefined) => {
    onSimulationChange({ ...simulation, [field]: value });
  };

  const continuousEntries = Object.entries(student.continuousAssessment);

  const writtenFields = TERMINAL_EXAM_FIELDS.filter((f) =>
    ["french", "mathematics", "historyGeography", "emc"].includes(f.field),
  );
  const physicsField = TERMINAL_EXAM_FIELDS.find((f) => f.field === "scienceSubject1")!;
  const biologyField = TERMINAL_EXAM_FIELDS.find((f) => f.field === "scienceSubject2")!;
  const oralField = TERMINAL_EXAM_FIELDS.find((f) => f.field === "oral")!;

  const summary = [
    { label: "Moy. terminales", value: formatGrade(result.terminalExamAverage) },
    { label: "Moyenne finale", value: formatGrade(result.finalAverage), strong: true },
  ];

  return (
    <div className="max-h-[calc(100vh-3rem)] overflow-y-auto">
      {/* En-tête fiche */}
      <header className="border-b border-rule px-6 pb-5 pt-6 pr-14 sm:px-8 sm:pr-16">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-ink-faint">
          Fiche de simulation · candidat
        </p>
        <h2 id={titleId} className="mt-1.5 font-serif text-2xl font-semibold leading-tight text-ink">
          {student.lastName} {student.firstName}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">
          Classe {student.className}
          <span className="px-1.5 text-rule-strong">·</span>
          <span className="tnum">N° {student.id}</span>
        </p>
      </header>

      <div className="space-y-7 px-6 py-6 sm:px-8">
        {/* Contrôle continu détaillé */}
        <section>
          <div className="flex items-baseline justify-between border-b border-rule pb-2">
            <h3 className="font-serif text-lg font-semibold text-ink">Contrôle continu</h3>
            <p className="text-sm text-ink-soft">
              Moyenne{" "}
              <strong className="text-ink tnum">{formatGrade(result.continuousAssessmentAverage)}</strong>
            </p>
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
            {continuousEntries.map(([subject, grade]) => (
              <div
                key={subject}
                className="flex items-baseline justify-between border-b border-rule/60 py-1.5 text-sm"
              >
                <dt className="text-ink-soft">{subject}</dt>
                <dd className={`tnum ${grade === null ? "text-ink-faint" : "font-medium text-ink"}`}>
                  {grade === null ? "Non noté" : formatGrade(grade)}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-ink-faint">
            Moyenne arithmétique simple des disciplines obligatoires, soit 40 % de la note finale.
          </p>
        </section>

        {/* Épreuves terminales — simulation */}
        <section>
          <div className="flex items-baseline justify-between border-b border-rule pb-2">
            <h3 className="font-serif text-lg font-semibold text-ink">Épreuves terminales</h3>
            <p className="text-xs text-ink-faint">Notes simulées, calibrées à 10/20</p>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {writtenFields.map(({ field, label, coefficient, maxGrade }) => (
              <GradeInput
                key={field}
                id={field}
                label={label}
                coefficient={coefficient}
                max={maxGrade}
                value={simulation[field]}
                onChange={(value) => updateSimulation(field, value)}
              />
            ))}
          </div>

          {/* Cellule Sciences : note unique (coef. 2), deux disciplines en dessous */}
          <div className="mt-4 border border-rule">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-rule bg-sunk px-4 py-2.5">
              <h4 className="text-sm font-medium text-ink">
                Sciences{" "}
                <span className="font-normal text-ink-faint">(coef. 2)</span>
              </h4>
              <p className="text-sm text-ink-soft">
                Note retenue{" "}
                <strong className="text-ink tnum">{formatGrade(scienceGrade)}</strong>
                <span className="ml-1 text-ink-faint">moyenne des deux disciplines, sur 20</span>
              </p>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <GradeInput
                id={physicsField.field}
                label="Physique-chimie"
                coefficient={physicsField.coefficient}
                max={physicsField.maxGrade}
                value={simulation.scienceSubject1}
                onChange={(value) => updateSimulation("scienceSubject1", value)}
              />
              <GradeInput
                id={biologyField.field}
                label="SVT"
                coefficient={biologyField.coefficient}
                max={biologyField.maxGrade}
                value={simulation.scienceSubject2}
                onChange={(value) => updateSimulation("scienceSubject2", value)}
              />
            </div>
          </div>

          <div className="mt-4 sm:w-[calc(50%-0.5rem)]">
            <GradeInput
              id={oralField.field}
              label={oralField.label}
              coefficient={oralField.coefficient}
              max={oralField.maxGrade}
              value={simulation.oral}
              onChange={(value) => updateSimulation("oral", value)}
              locked
              lockedLabel="Note réelle"
            />
          </div>
        </section>

        {/* Résultat projeté */}
        <section className="bg-sunk px-5 py-4">
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            {summary.map((item) => (
              <div key={item.label}>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  {item.label}
                </p>
                <p
                  className={`mt-1 font-serif tnum ${
                    item.strong ? "text-3xl font-semibold text-ink" : "text-2xl text-ink"
                  }`}
                >
                  {item.value}
                </p>
              </div>
            ))}
            <div className="ml-auto text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Résultat</p>
              <p className="mt-1 text-xl">
                <StatusWord status={result.status} />
              </p>
              <p className="text-sm text-ink-soft">{result.mention ?? "Mention non attribuée"}</p>
            </div>
          </div>
        </section>

        {/* Objectifs */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="border-b border-rule pb-2 font-serif text-base font-semibold text-ink">
              Moyenne terminale minimale
            </h3>
            <table className="mt-1 w-full text-sm">
              <tbody>
                {TARGET_THRESHOLDS.map((target) => (
                  <tr key={target.value} className="border-b border-rule/60">
                    <td className="py-1.5 pr-3 text-ink-soft">{target.label}</td>
                    <td className="py-1.5 text-right font-medium text-ink tnum">
                      {formatRequirement(
                        calculateRequiredTerminalAverage(
                          result.continuousAssessmentAverage,
                          target.value,
                        ),
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </section>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
          <button
            type="button"
            onClick={onReset}
            className="text-sm font-medium text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
          >
            Réinitialiser à 10/20
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => exportStudentExcel(student, simulation)}
              className="inline-flex h-10 items-center justify-center gap-2 border border-rule bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-accent hover:text-paper hover:border-accent"
            >
              <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
              Excel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

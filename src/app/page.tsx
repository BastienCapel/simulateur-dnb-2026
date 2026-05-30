"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import { KeyFigures } from "@/components/KeyFigures";
import { Modal } from "@/components/Modal";
import { RulesExplanation } from "@/components/RulesExplanation";
import { StudentSimulationPanel } from "@/components/StudentSimulationPanel";
import { StudentTable } from "@/components/StudentTable";
import { students } from "@/data/students";
import { calculateDnbResult, roundGrade } from "@/lib/dnbCalculator";
import { exportExcel } from "@/lib/excelExport";
import { MENTION_LABELS } from "@/lib/dnbRules";
import type { ExamSimulation, Student } from "@/types/student";

type StatusFilter = "all" | "admis" | "non_admis" | "incomplet";

function getDefaultSimulation(student: Student): ExamSimulation {
  return {
    french: 10,
    mathematics: 10,
    historyGeography: 10,
    emc: 10,
    scienceSubject1: 10,
    scienceSubject2: 10,
    oral: student.oralGrade,
  };
}

const mentionOptions = [
  MENTION_LABELS.noMention,
  MENTION_LABELS.assezBien,
  MENTION_LABELS.bien,
  MENTION_LABELS.tresBien,
  MENTION_LABELS.tresBienFelicitations,
  "Non attribuée",
];

export default function Home() {
  const [simulations, setSimulations] = useState<Record<string, ExamSimulation>>(() =>
    Object.fromEntries(students.map((student) => [student.id, getDefaultSimulation(student)])),
  );
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [mentionFilter, setMentionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const rows = useMemo(
    () =>
      students.map((student) => ({
        student,
        result: calculateDnbResult(student, simulations[student.id] ?? getDefaultSimulation(student)),
      })),
    [simulations],
  );

  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("fr-FR");

    return rows.filter(({ student, result }) => {
      const fullName = `${student.lastName} ${student.firstName}`.toLocaleLowerCase("fr-FR");
      const matchesSearch = query === "" || fullName.includes(query);
      const matchesClass = classFilter === "all" || student.className === classFilter;
      const matchesStatus = statusFilter === "all" || result.status === statusFilter;
      const mention = result.mention ?? "Non attribuée";
      const matchesMention = mentionFilter === "all" || mention === mentionFilter;

      return matchesSearch && matchesClass && matchesStatus && matchesMention;
    });
  }, [classFilter, mentionFilter, rows, searchQuery, statusFilter]);

  const classOptions = useMemo(
    () => Array.from(new Set(students.map((student) => student.className))).sort(),
    [],
  );

  const completeFinalAverages = rows
    .map(({ result }) => result.finalAverage)
    .filter((value): value is number => typeof value === "number");

  const cohortAverage =
    completeFinalAverages.length === 0
      ? null
      : roundGrade(
          completeFinalAverages.reduce((sum, grade) => sum + grade, 0) /
            completeFinalAverages.length,
        );

  const admittedStudents = rows.filter(({ result }) => result.status === "admis").length;
  const mentionBreakdown = rows.reduce<Record<string, number>>((breakdown, { result }) => {
    if (result.mention) {
      breakdown[result.mention] = (breakdown[result.mention] ?? 0) + 1;
    }
    return breakdown;
  }, {});

  const openStudent = openStudentId
    ? students.find((student) => student.id === openStudentId) ?? null
    : null;
  const openSimulation = openStudent
    ? simulations[openStudent.id] ?? getDefaultSimulation(openStudent)
    : {};

  const selectClass =
    "h-10 border border-rule bg-surface px-3 text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15";

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8 lg:py-10">
        {/* En-tête « relevé officiel » */}
        <header>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-faint">
                Diplôme national du brevet · Session juin 2026
              </p>
              <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-ink sm:text-[2.75rem]">
                Simulateur de résultats
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <p className="max-w-xs text-sm leading-6 text-ink-soft">
                Projection à partir du contrôle continu réel et des notes d’oral
                enregistrées. Les épreuves écrites sont calibrées à 10/20, à ajuster
                par candidat.
              </p>
              <button
                type="button"
                onClick={() => exportExcel(students, simulations)}
                className="inline-flex shrink-0 items-center gap-2 border border-rule bg-surface px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-accent hover:text-paper hover:border-accent"
              >
                <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
                Exporter Excel
              </button>
            </div>
          </div>
          <div className="mt-4 border-t-2 border-ink" />
          <div className="border-t border-ink/30" />
        </header>

        <KeyFigures
          totalStudents={students.length}
          admittedStudents={admittedStudents}
          cohortAverage={cohortAverage}
          mentionBreakdown={mentionBreakdown}
        />

        <RulesExplanation />

        {/* Filtres */}
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Recherche
            <span className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 w-full border border-rule bg-surface pl-9 pr-3 text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
                placeholder="Nom ou prénom"
              />
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Classe
            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className={selectClass}
            >
              <option value="all">Toutes les classes</option>
              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Statut
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className={selectClass}
            >
              <option value="all">Tous</option>
              <option value="admis">Admis</option>
              <option value="non_admis">Non admis</option>
              <option value="incomplet">Simulation incomplète</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Mention
            <select
              value={mentionFilter}
              onChange={(event) => setMentionFilter(event.target.value)}
              className={selectClass}
            >
              <option value="all">Toutes les mentions</option>
              {mentionOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </section>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-semibold text-ink">Candidats</h2>
            <p className="text-sm text-ink-faint">
              {filteredRows.length} sur {students.length} · cliquez une ligne pour simuler
            </p>
          </div>
          <StudentTable rows={filteredRows} onSelectStudent={setOpenStudentId} />
        </div>
      </div>

      <Modal
        open={openStudent !== null}
        onClose={() => setOpenStudentId(null)}
        labelledBy="fiche-titre"
      >
        {openStudent ? (
          <StudentSimulationPanel
            student={openStudent}
            simulation={openSimulation}
            titleId="fiche-titre"
            onSimulationChange={(simulation) =>
              setSimulations((current) => ({ ...current, [openStudent.id]: simulation }))
            }
            onReset={() =>
              setSimulations((current) => ({
                ...current,
                [openStudent.id]: getDefaultSimulation(openStudent),
              }))
            }
          />
        ) : null}
      </Modal>
    </main>
  );
}

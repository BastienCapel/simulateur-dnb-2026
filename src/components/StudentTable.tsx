"use client";

import { useState } from "react";
import type { CalculatedDnbResult, Student } from "@/types/student";
import { formatNumber } from "@/lib/format";

type StudentTableRow = {
  student: Student;
  result: CalculatedDnbResult;
};

type StudentTableProps = {
  rows: StudentTableRow[];
  onSelectStudent: (studentId: string) => void;
};

type SortKey =
  | "lastName"
  | "firstName"
  | "className"
  | "continuousAssessment"
  | "terminalExam"
  | "finalAverage"
  | "status"
  | "mention";

type SortDir = "asc" | "desc";

const STATUS_ORDER: Record<CalculatedDnbResult["status"], number> = {
  admis: 0,
  non_admis: 1,
  incomplet: 2,
};

const MENTION_ORDER: Record<string, number> = {
  "Mention très bien avec félicitations du jury": 0,
  "Mention très bien": 1,
  "Mention bien": 2,
  "Mention assez bien": 3,
  "Admis sans mention": 4,
};

function compare(a: StudentTableRow, b: StudentTableRow, key: SortKey): number {
  switch (key) {
    case "lastName":
      return a.student.lastName.localeCompare(b.student.lastName, "fr");
    case "firstName":
      return a.student.firstName.localeCompare(b.student.firstName, "fr");
    case "className":
      return a.student.className.localeCompare(b.student.className, "fr");
    case "continuousAssessment": {
      const va = a.result.continuousAssessmentAverage ?? -1;
      const vb = b.result.continuousAssessmentAverage ?? -1;
      return va - vb;
    }
    case "terminalExam": {
      const va = a.result.terminalExamAverage ?? -1;
      const vb = b.result.terminalExamAverage ?? -1;
      return va - vb;
    }
    case "finalAverage": {
      const va = a.result.finalAverage ?? -1;
      const vb = b.result.finalAverage ?? -1;
      return va - vb;
    }
    case "status":
      return STATUS_ORDER[a.result.status] - STATUS_ORDER[b.result.status];
    case "mention": {
      const va = MENTION_ORDER[a.result.mention ?? ""] ?? 99;
      const vb = MENTION_ORDER[b.result.mention ?? ""] ?? 99;
      return va - vb;
    }
    default:
      return 0;
  }
}

function sortRows(rows: StudentTableRow[], key: SortKey, dir: SortDir): StudentTableRow[] {
  return [...rows].sort((a, b) => {
    const cmp = compare(a, b, key);
    return dir === "asc" ? cmp : -cmp;
  });
}

const statusMeta = (status: CalculatedDnbResult["status"]) => {
  if (status === "admis") return { label: "Admis", className: "text-admis" };
  if (status === "non_admis") return { label: "Non admis", className: "text-refuse" };
  return { label: "Incomplet", className: "text-ink-faint" };
};

function SortIcon({ dir }: { dir: SortDir | null }) {
  if (dir === null) {
    return (
      <span aria-hidden="true" className="ml-1 inline-block select-none text-[0.65rem] leading-none text-ink-faint/50">
        ⇅
      </span>
    );
  }
  return (
    <span aria-hidden="true" className="ml-1 inline-block select-none text-[0.65rem] leading-none text-accent">
      {dir === "asc" ? "▲" : "▼"}
    </span>
  );
}

type ColHeaderProps = {
  sortKey: SortKey;
  activeKey: SortKey | null;
  dir: SortDir;
  right?: boolean;
  onSort: (key: SortKey) => void;
  children: React.ReactNode;
};

function ColHeader({ sortKey, activeKey, dir, right, onSort, children }: ColHeaderProps) {
  const isActive = activeKey === sortKey;
  return (
    <th
      scope="col"
      className={`px-4 py-3 font-medium ${right ? "text-right" : ""}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-0.5 whitespace-nowrap transition-colors hover:text-ink ${
          isActive ? "text-ink" : ""
        }`}
      >
        {children}
        <SortIcon dir={isActive ? dir : null} />
      </button>
    </th>
  );
}

export function StudentTable({ rows, onSelectStudent }: StudentTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("lastName");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = sortRows(rows, sortKey, sortDir);

  return (
    <div className="overflow-x-auto border border-rule bg-surface">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-rule-strong text-xs uppercase tracking-wide text-ink-faint">
            <ColHeader sortKey="lastName" activeKey={sortKey} dir={sortDir} onSort={handleSort}>
              Nom
            </ColHeader>
            <ColHeader sortKey="firstName" activeKey={sortKey} dir={sortDir} onSort={handleSort}>
              Prénom
            </ColHeader>
            <ColHeader sortKey="className" activeKey={sortKey} dir={sortDir} onSort={handleSort}>
              Classe
            </ColHeader>
            <ColHeader sortKey="continuousAssessment" activeKey={sortKey} dir={sortDir} onSort={handleSort} right>
              Contrôle continu
            </ColHeader>
            <ColHeader sortKey="terminalExam" activeKey={sortKey} dir={sortDir} onSort={handleSort} right>
              Terminales
            </ColHeader>
            <ColHeader sortKey="finalAverage" activeKey={sortKey} dir={sortDir} onSort={handleSort} right>
              Moyenne finale
            </ColHeader>
            <ColHeader sortKey="status" activeKey={sortKey} dir={sortDir} onSort={handleSort}>
              Statut
            </ColHeader>
            <ColHeader sortKey="mention" activeKey={sortKey} dir={sortDir} onSort={handleSort}>
              Mention
            </ColHeader>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-ink-faint">
                Aucun candidat ne correspond aux filtres.
              </td>
            </tr>
          ) : (
            sorted.map(({ student, result }) => {
              const status = statusMeta(result.status);
              return (
                <tr
                  key={student.id}
                  onClick={() => onSelectStudent(student.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ouvrir la fiche de ${student.lastName} ${student.firstName}`}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectStudent(student.id);
                    }
                  }}
                  className="cursor-pointer border-b border-rule/70 outline-none transition-colors last:border-b-0 hover:bg-accent-soft focus-visible:bg-accent-soft focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <td className="px-4 py-2.5 font-semibold text-ink">{student.lastName}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{student.firstName}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{student.className}</td>
                  <td className="px-4 py-2.5 text-right text-ink-soft tnum">
                    {formatNumber(result.continuousAssessmentAverage)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-ink-soft tnum">
                    {formatNumber(result.terminalExamAverage)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-ink tnum">
                    {formatNumber(result.finalAverage)}
                  </td>
                  <td className={`px-4 py-2.5 font-medium ${status.className}`}>{status.label}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{result.mention ?? "—"}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

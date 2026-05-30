"use client";

import { Download } from "lucide-react";
import { jsPDF } from "jspdf";
import type { CalculatedDnbResult, ExamSimulation, Student } from "@/types/student";
import { TARGET_THRESHOLDS } from "@/lib/dnbRules";
import {
  calculateRequiredTerminalAverage,
  calculateScienceGrade,
} from "@/lib/dnbCalculator";

type PdfExportButtonProps = {
  student: Student;
  simulation: ExamSimulation;
  result: CalculatedDnbResult;
};

const formatGrade = (value: number | null | undefined) =>
  typeof value === "number" ? `${value.toFixed(2)}/20` : "Non saisie";

const formatRequirement = (value: number | null) => {
  if (value === null) return "Non calculable";
  if (value <= 0) {
    return "Déjà acquis avec le contrôle continu, sous réserve de notes terminales non nulles.";
  }
  if (value > 20) return "Objectif mathématiquement impossible.";
  return `${value.toFixed(2)}/20`;
};

export function PdfExportButton({
  student,
  simulation,
  result,
}: PdfExportButtonProps) {
  const exportPdf = () => {
    const doc = new jsPDF();
    const margin = 14;
    let y = 16;

    const addLine = (text: string, size = 10, gap = 6) => {
      doc.setFontSize(size);
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, margin, y);
      y += lines.length * gap;
    };

    doc.setTextColor(15, 37, 70);
    doc.setFont("helvetica", "bold");
    addLine("Simulation DNB 2026", 18, 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(35, 45, 60);
    addLine(`${student.lastName} ${student.firstName} - Classe ${student.className}`, 12);
    addLine(`Date d'export : ${new Date().toLocaleDateString("fr-FR")}`, 10);

    y += 2;
    doc.setFont("helvetica", "bold");
    addLine("Règles de calcul", 12);
    doc.setFont("helvetica", "normal");
    addLine(
      "Contrôle continu : 40 % de la moyenne finale, calculé comme moyenne simple des disciplines obligatoires. Épreuves terminales : 60 %, avec les coefficients français 2, mathématiques 2, histoire-géographie 1,5, EMC 0,5, sciences 2 et oral 2. Le DNB est obtenu à partir de 10/20.",
      9,
      5,
    );

    y += 2;
    doc.setFont("helvetica", "bold");
    addLine("Contrôle continu", 12);
    doc.setFont("helvetica", "normal");
    Object.entries(student.continuousAssessment).forEach(([subject, grade]) => {
      addLine(`${subject} : ${formatGrade(grade)}`, 9, 4.5);
    });
    addLine(`Moyenne contrôle continu : ${formatGrade(result.continuousAssessmentAverage)}`, 10);

    if (y > 230) {
      doc.addPage();
      y = 16;
    }

    y += 2;
    doc.setFont("helvetica", "bold");
    addLine("Épreuves terminales", 12);
    doc.setFont("helvetica", "normal");
    addLine(`Français : ${formatGrade(simulation.french)}`, 9, 4.5);
    addLine(`Mathématiques : ${formatGrade(simulation.mathematics)}`, 9, 4.5);
    addLine(`Histoire-géographie : ${formatGrade(simulation.historyGeography)}`, 9, 4.5);
    addLine(`EMC : ${formatGrade(simulation.emc)}`, 9, 4.5);
    addLine(`Sciences - discipline 1 : ${formatGrade(simulation.scienceSubject1)}`, 9, 4.5);
    addLine(`Sciences - discipline 2 : ${formatGrade(simulation.scienceSubject2)}`, 9, 4.5);
    addLine(`Sciences calculées : ${formatGrade(calculateScienceGrade(simulation))}`, 9, 4.5);
    addLine(`Oral de soutenance : ${formatGrade(simulation.oral)}`, 9, 4.5);
    addLine(`Moyenne épreuves terminales : ${formatGrade(result.terminalExamAverage)}`, 10);
    addLine(`Moyenne finale projetée : ${formatGrade(result.finalAverage)}`, 10);
    addLine(`Statut : ${result.status === "admis" ? "Admis" : result.status === "non_admis" ? "Non admis" : "Simulation incomplète"}`, 10);
    addLine(`Mention probable : ${result.mention ?? "Non attribuée"}`, 10);

    if (y > 230) {
      doc.addPage();
      y = 16;
    }

    y += 2;
    doc.setFont("helvetica", "bold");
    addLine("Moyennes minimales nécessaires", 12);
    doc.setFont("helvetica", "normal");
    TARGET_THRESHOLDS.forEach((target) => {
      const required = calculateRequiredTerminalAverage(
        result.continuousAssessmentAverage,
        target.value,
      );
      addLine(`${target.label} (${target.value}/20) : ${formatRequirement(required)}`, 9, 5);
    });

    doc.save(
      `simulation-dnb-2026-${student.lastName}-${student.firstName}.pdf`.replaceAll(" ", "-"),
    );
  };

  return (
    <button
      type="button"
      onClick={exportPdf}
      className="inline-flex h-10 items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-paper transition-colors hover:bg-ink"
    >
      <Download aria-hidden="true" className="h-4 w-4" />
      Exporter en PDF
    </button>
  );
}

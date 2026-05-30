import ExcelJS from "exceljs";
import { calculateDnbResult } from "@/lib/dnbCalculator";
import type { ExamSimulation, Student } from "@/types/student";

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  headerBg: "1A2D4A",     // bleu acier foncé
  headerFg: "FFFFFF",
  subHeaderBg: "2E4A6E",  // bleu acier moyen
  subHeaderFg: "FFFFFF",
  colHeaderBg: "3B5998",  // bleu section
  colHeaderFg: "FFFFFF",
  altRow: "F4F7FB",       // fond rangée alternée
  white: "FFFFFF",
  admis: "1A7A45",        // vert encre
  admisBg: "E8F5EE",
  nonAdmis: "B54708",     // orange brique
  nonAdmisBg: "FEF3EB",
  mention_tb_felicitations: "7B3FA6",
  mention_tb: "1D5FA6",
  mention_b: "0D7B8A",
  mention_ab: "3B6B35",
  mention_sans: "5C5C5C",
  border: "C8D4E8",
  borderStrong: "3B5998",
  summaryBg: "EFF4FF",
  summaryHeaderBg: "2E4A6E",
  gold: "B8860B",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fr(value: number | null | undefined, decimals = 2): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toFixed(decimals).replace(".", ",");
}

function mentionColor(mention: string | null): string {
  if (!mention) return C.mention_sans;
  if (mention.includes("félicitations")) return C.mention_tb_felicitations;
  if (mention.includes("très bien")) return C.mention_tb;
  if (mention.includes("bien")) return C.mention_b;
  if (mention.includes("assez bien")) return C.mention_ab;
  return C.mention_sans;
}

function gradeColor(value: number | null): string {
  if (value === null) return C.mention_sans;
  if (value >= 16) return C.admis;
  if (value >= 14) return C.mention_b;
  if (value >= 12) return C.mention_ab;
  if (value >= 10) return C.mention_sans;
  return C.nonAdmis;
}

function border(style: ExcelJS.BorderStyle = "thin"): ExcelJS.Borders {
  const s = { style, color: { argb: "FF" + C.border } };
  return { top: s, left: s, bottom: s, right: s, diagonal: {} };
}

function borderStrong(): ExcelJS.Borders {
  const s = { style: "medium" as ExcelJS.BorderStyle, color: { argb: "FF" + C.borderStrong } };
  return { top: s, left: s, bottom: s, right: s, diagonal: {} };
}

function applyFont(
  cell: ExcelJS.Cell,
  opts: { bold?: boolean; size?: number; color?: string; name?: string },
) {
  cell.font = {
    name: opts.name ?? "Calibri",
    bold: opts.bold ?? false,
    size: opts.size ?? 11,
    color: { argb: "FF" + (opts.color ?? "1A2D4A") },
  };
}

function applyFill(cell: ExcelJS.Cell, argbHex: string) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + argbHex } };
}

// ─── Sheet builder ────────────────────────────────────────────────────────────

type RowData = {
  student: Student;
  simulation: ExamSimulation;
};

function buildSheet(
  wb: ExcelJS.Workbook,
  sheetName: string,
  rows: RowData[],
  exportedAt: string,
) {
  const ws = wb.addWorksheet(sheetName, {
    pageSetup: {
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    },
    headerFooter: {
      oddFooter: `&L&"Calibri,Italic"&8Simulateur DNB 2026 — ${sheetName}&R&"Calibri,Italic"&8Page &P / &N`,
    },
  });

  // ── Largeurs colonnes ──────────────────────────────────────────────────────
  ws.columns = [
    { width: 3 },    // A  N°
    { width: 26 },   // B  Nom
    { width: 20 },   // C  Prénom
    { width: 8 },    // D  Classe
    { width: 13 },   // E  CC
    { width: 13 },   // F  Français
    { width: 13 },   // G  Maths
    { width: 13 },   // H  HG
    { width: 9 },    // I  EMC
    { width: 13 },   // J  Sciences
    { width: 13 },   // K  Oral
    { width: 13 },   // L  Moy. terminales
    { width: 13 },   // M  Moy. finale
    { width: 12 },   // N  Statut
    { width: 36 },   // O  Mention
  ];

  let r = 1;

  // ── Bandeau titre ─────────────────────────────────────────────────────────
  const titleCell = ws.getCell(r, 1);
  titleCell.value = `DIPLÔME NATIONAL DU BREVET — SESSION JUIN 2026`;
  applyFont(titleCell, { bold: true, size: 14, color: C.headerFg, name: "Calibri" });
  applyFill(titleCell, C.headerBg);
  ws.mergeCells(r, 1, r, 15);
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 28;
  r++;

  const subtitleCell = ws.getCell(r, 1);
  subtitleCell.value = `Simulation des résultats — ${sheetName}   ·   Exporté le ${exportedAt}`;
  applyFont(subtitleCell, { size: 10, color: C.headerFg });
  applyFill(subtitleCell, C.subHeaderBg);
  ws.mergeCells(r, 2, r, 15);
  ws.getCell(r, 1);
  applyFill(ws.getCell(r, 1), C.subHeaderBg);
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 18;
  r++;

  // Ligne vide de séparation
  for (let c = 1; c <= 15; c++) applyFill(ws.getCell(r, c), C.headerBg);
  ws.getRow(r).height = 4;
  r++;

  // ── Ligne note méthodologique ──────────────────────────────────────────────
  const noteCell = ws.getCell(r, 1);
  noteCell.value =
    "CC = 40 % de la moyenne finale (moyenne simple de toutes les disciplines). Terminales = 60 % (coef. : Français 2, Maths 2, HG 1,5, EMC 0,5, Sciences 2, Oral 2). Admission ≥ 10/20.";
  applyFont(noteCell, { size: 8, color: "4A5568" });
  ws.mergeCells(r, 1, r, 15);
  noteCell.alignment = { horizontal: "left", vertical: "middle", wrapText: false };
  ws.getRow(r).height = 14;
  r++;

  r++; // espacement

  // ── En-têtes colonnes ─────────────────────────────────────────────────────
  const headers = [
    { label: "N°", align: "center" },
    { label: "NOM", align: "left" },
    { label: "Prénom", align: "left" },
    { label: "Classe", align: "center" },
    { label: "Contrôle\ncontinu /20", align: "center" },
    { label: "Français\n(coef. 2)", align: "center" },
    { label: "Maths\n(coef. 2)", align: "center" },
    { label: "HG\n(coef. 1,5)", align: "center" },
    { label: "EMC\n(coef. 0,5)", align: "center" },
    { label: "Sciences\n(coef. 2)", align: "center" },
    { label: "Oral\n(coef. 2)", align: "center" },
    { label: "Moy.\nterminales", align: "center" },
    { label: "Moy.\nfinale /20", align: "center" },
    { label: "Statut", align: "center" },
    { label: "Mention", align: "left" },
  ];

  headers.forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h.label;
    applyFont(cell, { bold: true, size: 9, color: C.colHeaderFg });
    applyFill(cell, C.colHeaderBg);
    cell.alignment = {
      horizontal: h.align as ExcelJS.Alignment["horizontal"],
      vertical: "middle",
      wrapText: true,
    };
    cell.border = border("thin");
  });
  ws.getRow(r).height = 32;
  r++;

  const dataStartRow = r;

  // ── Lignes de données ─────────────────────────────────────────────────────
  let idx = 0;
  for (const { student, simulation } of rows) {
    idx++;
    const result = calculateDnbResult(student, simulation);
    const isAlt = idx % 2 === 0;
    const rowBg = isAlt ? C.altRow : C.white;

    const sciGrade =
      typeof simulation.scienceSubject1 === "number" &&
      typeof simulation.scienceSubject2 === "number"
        ? (simulation.scienceSubject1 + simulation.scienceSubject2) / 2
        : null;

    const cells: { value: string | number; align?: string; bold?: boolean; color?: string; bg?: string }[] = [
      { value: idx, align: "center" },
      { value: student.lastName, bold: true },
      { value: student.firstName },
      { value: student.className, align: "center" },
      {
        value: result.continuousAssessmentAverage !== null ? Number(result.continuousAssessmentAverage.toFixed(2)) : "—",
        align: "center",
        color: gradeColor(result.continuousAssessmentAverage),
        bold: true,
      },
      { value: simulation.french !== undefined ? Number(simulation.french.toFixed(2)) : "—", align: "center" },
      { value: simulation.mathematics !== undefined ? Number(simulation.mathematics.toFixed(2)) : "—", align: "center" },
      { value: simulation.historyGeography !== undefined ? Number(simulation.historyGeography.toFixed(2)) : "—", align: "center" },
      { value: simulation.emc !== undefined ? Number(simulation.emc.toFixed(2)) : "—", align: "center" },
      { value: sciGrade !== null ? Number(sciGrade.toFixed(2)) : "—", align: "center" },
      { value: simulation.oral !== undefined ? Number(simulation.oral.toFixed(2)) : "—", align: "center", color: C.gold, bold: true },
      {
        value: result.terminalExamAverage !== null ? Number(result.terminalExamAverage.toFixed(2)) : "—",
        align: "center",
        color: gradeColor(result.terminalExamAverage),
      },
      {
        value: result.finalAverage !== null ? Number(result.finalAverage.toFixed(2)) : "—",
        align: "center",
        bold: true,
        color: gradeColor(result.finalAverage),
      },
      {
        value: result.status === "admis" ? "✓  Admis" : result.status === "non_admis" ? "✗  Non admis" : "—",
        align: "center",
        color: result.status === "admis" ? C.admis : result.status === "non_admis" ? C.nonAdmis : C.mention_sans,
        bold: result.status !== "incomplet",
        bg: result.status === "admis" ? C.admisBg : result.status === "non_admis" ? C.nonAdmisBg : undefined,
      },
      {
        value: result.mention ?? "—",
        color: mentionColor(result.mention),
        bold: !!result.mention,
      },
    ];

    cells.forEach((cd, i) => {
      const cell = ws.getCell(r, i + 1);
      cell.value = cd.value;
      applyFont(cell, { size: 10, bold: cd.bold, color: cd.color ?? "1A2D4A" });
      applyFill(cell, cd.bg ?? rowBg);
      cell.alignment = {
        horizontal: (cd.align as ExcelJS.Alignment["horizontal"]) ?? "left",
        vertical: "middle",
      };
      cell.border = border("hair");
    });

    ws.getRow(r).height = 18;
    r++;
  }

  // Bordure forte autour du tableau de données
  const dataEndRow = r - 1;
  for (let row = dataStartRow - 1; row <= dataEndRow; row++) {
    for (let col = 1; col <= 15; col++) {
      const cell = ws.getCell(row, col);
      const isFirstRow = row === dataStartRow - 1;
      const isLastRow = row === dataEndRow;
      const isFirstCol = col === 1;
      const isLastCol = col === 15;
      const thin = { style: "hair" as ExcelJS.BorderStyle, color: { argb: "FF" + C.border } };
      const strong = { style: "medium" as ExcelJS.BorderStyle, color: { argb: "FF" + C.borderStrong } };
      cell.border = {
        top: isFirstRow ? strong : thin,
        bottom: isLastRow ? strong : thin,
        left: isFirstCol ? strong : thin,
        right: isLastCol ? strong : thin,
      };
    }
  }

  r += 2; // espacement

  // ── Récapitulatif statistiques ─────────────────────────────────────────────
  const summaryTitle = ws.getCell(r, 1);
  summaryTitle.value = "RÉCAPITULATIF";
  applyFont(summaryTitle, { bold: true, size: 10, color: C.headerFg });
  applyFill(summaryTitle, C.summaryHeaderBg);
  ws.mergeCells(r, 1, r, 8);
  summaryTitle.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 18;
  r++;

  const totalAdmis = rows.filter(({ student, simulation }) => {
    const res = calculateDnbResult(student, simulation);
    return res.status === "admis";
  }).length;
  const allFinals = rows
    .map(({ student, simulation }) => calculateDnbResult(student, simulation).finalAverage)
    .filter((v): v is number => v !== null);
  const avgFinal = allFinals.length > 0 ? allFinals.reduce((s, v) => s + v, 0) / allFinals.length : null;

  const mentionCounts: Record<string, number> = {};
  for (const { student, simulation } of rows) {
    const res = calculateDnbResult(student, simulation);
    if (res.mention) mentionCounts[res.mention] = (mentionCounts[res.mention] ?? 0) + 1;
  }

  const summaryData = [
    ["Candidats", rows.length],
    ["Admis", totalAdmis],
    ["Taux d'admission", rows.length > 0 ? `${Math.round((totalAdmis / rows.length) * 100)} %` : "—"],
    ["Moyenne cohorte", avgFinal !== null ? fr(avgFinal) + " /20" : "—"],
    ...Object.entries(mentionCounts).map(([mention, count]) => [mention, count]),
  ];

  for (const [label, value] of summaryData) {
    const labelCell = ws.getCell(r, 1);
    labelCell.value = label;
    applyFont(labelCell, { size: 10, bold: true, color: "2E4A6E" });
    applyFill(labelCell, C.summaryBg);
    ws.mergeCells(r, 1, r, 5);
    labelCell.alignment = { horizontal: "left", vertical: "middle" };

    const valueCell = ws.getCell(r, 6);
    valueCell.value = value;
    applyFont(valueCell, { size: 10, bold: true, color: C.admis });
    applyFill(valueCell, C.summaryBg);
    ws.mergeCells(r, 6, r, 8);
    valueCell.alignment = { horizontal: "center", vertical: "middle" };

    labelCell.border = border("thin");
    valueCell.border = border("thin");
    ws.getRow(r).height = 16;
    r++;
  }

  // Gel des volets : titre + en-têtes
  ws.views = [{ state: "frozen", xSplit: 0, ySplit: dataStartRow - 1 }];

  // Filtre auto sur les en-têtes
  ws.autoFilter = {
    from: { row: dataStartRow - 1, column: 1 },
    to: { row: dataEndRow, column: 15 },
  };

  return ws;
}

// ─── Fiche individuelle élève ─────────────────────────────────────────────────

function gradeBar(value: number, max = 20): string {
  const filled = Math.round((value / max) * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

export async function exportStudentExcel(
  student: Student,
  simulation: ExamSimulation,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Simulateur DNB 2026";
  wb.created = new Date();
  wb.modified = new Date();

  const { calculateDnbResult: calc, calculateRequiredTerminalAverage, calculateScienceGrade } =
    await import("@/lib/dnbCalculator");
  const { TARGET_THRESHOLDS } = await import("@/lib/dnbRules");

  const result = calc(student, simulation);
  const sciGrade = calculateScienceGrade(simulation);

  const exportedAt = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const ws = wb.addWorksheet("Fiche candidat", {
    pageSetup: {
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      paperSize: 9, // A4
      margins: { left: 0.6, right: 0.6, top: 0.8, bottom: 0.8, header: 0.3, footer: 0.3 },
    },
    headerFooter: {
      oddFooter: `&L&"Calibri,Italic"&8DNB 2026 — ${student.lastName} ${student.firstName}&R&"Calibri,Italic"&8Page &P`,
    },
  });

  // Colonnes : A=label, B=valeur, C=barre/détail, D=note formatée
  ws.columns = [
    { width: 28 },  // A  label
    { width: 10 },  // B  note numérique
    { width: 22 },  // C  barre ou détail
    { width: 14 },  // D  note /20 ou complément
  ];

  let r = 1;

  // Helpers locaux
  const set = (
    row: number,
    col: number,
    value: ExcelJS.CellValue,
    opts: { bold?: boolean; size?: number; color?: string; bg?: string; align?: ExcelJS.Alignment["horizontal"]; wrap?: boolean } = {},
  ) => {
    const cell = ws.getCell(row, col);
    cell.value = value;
    applyFont(cell, { bold: opts.bold, size: opts.size ?? 10, color: opts.color ?? "1A2D4A" });
    if (opts.bg) applyFill(cell, opts.bg);
    cell.alignment = { horizontal: opts.align ?? "left", vertical: "middle", wrapText: opts.wrap };
    return cell;
  };

  const merge = (row: number, c1: number, c2: number) => ws.mergeCells(row, c1, row, c2);

  const sectionHeader = (label: string) => {
    for (let c = 1; c <= 4; c++) {
      const cell = ws.getCell(r, c);
      applyFill(cell, C.colHeaderBg);
      cell.border = border("thin");
    }
    const cell = ws.getCell(r, 1);
    cell.value = label;
    applyFont(cell, { bold: true, size: 10, color: C.colHeaderFg });
    cell.alignment = { horizontal: "left", vertical: "middle" };
    merge(r, 1, 4);
    ws.getRow(r).height = 20;
    r++;
  };

  const dataRow = (
    label: string,
    value: number | null,
    opts: { bold?: boolean; bar?: boolean; barMax?: number; detail?: string; color?: string; bg?: string; alt?: boolean } = {},
  ) => {
    const bg = opts.bg ?? (opts.alt ? C.altRow : C.white);
    set(r, 1, label, { bg });
    ws.getCell(r, 1).border = border("hair");

    if (value !== null) {
      const col = opts.color ?? gradeColor(value);
      set(r, 2, Number(value.toFixed(2)), { bold: opts.bold, color: col, align: "center", bg });
      ws.getCell(r, 2).border = border("hair");

      if (opts.bar) {
        const barCell = ws.getCell(r, 3);
        barCell.value = gradeBar(value, opts.barMax ?? 20);
        applyFont(barCell, { size: 8, color: col });
        applyFill(barCell, bg);
        barCell.alignment = { horizontal: "left", vertical: "middle" };
        barCell.border = border("hair");
      } else if (opts.detail) {
        set(r, 3, opts.detail, { size: 9, color: "6B7280", bg });
        ws.getCell(r, 3).border = border("hair");
      } else {
        applyFill(ws.getCell(r, 3), bg);
        ws.getCell(r, 3).border = border("hair");
      }

      set(r, 4, `${value.toFixed(2).replace(".", ",")} /20`, { bold: opts.bold, color: col, align: "center", bg });
      ws.getCell(r, 4).border = border("hair");
    } else {
      for (let c = 2; c <= 4; c++) {
        set(r, c, "—", { color: "9CA3AF", align: "center", bg });
        ws.getCell(r, c).border = border("hair");
      }
    }
    ws.getRow(r).height = 17;
    r++;
  };

  // ── Bandeau titre ────────────────────────────────────────────────────────────
  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), C.headerBg);
  const titleCell = ws.getCell(r, 1);
  titleCell.value = "DIPLÔME NATIONAL DU BREVET — SESSION JUIN 2026";
  applyFont(titleCell, { bold: true, size: 13, color: C.headerFg });
  merge(r, 1, 4);
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 26;
  r++;

  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), C.subHeaderBg);
  const nameCell = ws.getCell(r, 1);
  nameCell.value = `${student.lastName} ${student.firstName}  ·  Classe ${student.className}`;
  applyFont(nameCell, { bold: true, size: 11, color: C.headerFg });
  merge(r, 1, 4);
  nameCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 20;
  r++;

  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), C.subHeaderBg);
  const dateCell = ws.getCell(r, 1);
  dateCell.value = `Fiche de simulation exportée le ${exportedAt}  ·  N° ${student.id}`;
  applyFont(dateCell, { size: 9, color: "A8C4E0" });
  merge(r, 1, 4);
  dateCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 14;
  r++;

  // séparateur
  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), C.headerBg);
  ws.getRow(r).height = 3;
  r++;
  r++;

  // ── Règles ───────────────────────────────────────────────────────────────────
  sectionHeader("RÈGLES DE CALCUL");
  const ruleCell = ws.getCell(r, 1);
  ruleCell.value =
    "Contrôle continu (CC) : 40 % de la moyenne finale — moyenne arithmétique simple de toutes les disciplines. " +
    "Épreuves terminales : 60 % — pondérées par les coefficients officiels (Français 2, Maths 2, HG 1,5, EMC 0,5, Sciences 2, Oral 2). " +
    "Admission ≥ 10/20. Mentions : Assez bien ≥ 12, Bien ≥ 14, Très bien ≥ 16, Très bien avec félicitations ≥ 18.";
  applyFont(ruleCell, { size: 8, color: "4B5563" });
  merge(r, 1, 4);
  ruleCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  ws.getRow(r).height = 36;
  r++;
  r++;

  // ── Contrôle continu ─────────────────────────────────────────────────────────
  sectionHeader("CONTRÔLE CONTINU  (40 % de la moyenne finale)");

  const ccEntries = Object.entries(student.continuousAssessment);
  ccEntries.forEach(([subject, grade], i) => {
    dataRow(subject, grade, { bar: true, alt: i % 2 === 1 });
  });

  // Total CC
  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), C.summaryBg);
  const ccLabel = ws.getCell(r, 1);
  ccLabel.value = "Moyenne contrôle continu";
  applyFont(ccLabel, { bold: true, size: 10, color: "1E3A5F" });
  applyFill(ccLabel, C.summaryBg);
  merge(r, 1, 2);
  ccLabel.border = borderStrong();

  const ccVal = ws.getCell(r, 3);
  const ccAvg = result.continuousAssessmentAverage;
  ccVal.value = ccAvg !== null ? `${ccAvg.toFixed(2).replace(".", ",")} / 20` : "—";
  applyFont(ccVal, { bold: true, size: 13, color: gradeColor(ccAvg) });
  applyFill(ccVal, C.summaryBg);
  ccVal.alignment = { horizontal: "center", vertical: "middle" };
  ws.mergeCells(r, 3, r, 4);
  ccVal.border = borderStrong();
  ws.getRow(r).height = 22;
  r++;
  r++;

  // ── Épreuves terminales ───────────────────────────────────────────────────────
  sectionHeader("ÉPREUVES TERMINALES  (60 % de la moyenne finale)");

  const terminalRows: [string, number | undefined, string, boolean][] = [
    ["Français", simulation.french, "coef. 2", false],
    ["Mathématiques", simulation.mathematics, "coef. 2", true],
    ["Histoire-géographie", simulation.historyGeography, "coef. 1,5", false],
    ["EMC", simulation.emc, "coef. 0,5", true],
    ["Sciences — Physique-chimie", simulation.scienceSubject1, "coef. sciences = 2", false],
    ["Sciences — SVT", simulation.scienceSubject2, "coef. sciences = 2", true],
  ];

  for (const [label, value, detail, alt] of terminalRows) {
    dataRow(label, value ?? null, { bar: true, detail, alt });
  }

  // Sciences calculée
  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), "FFF8E7");
  ws.getCell(r, 1).value = "Note de sciences (moyenne Physique-chimie + SVT)";
  applyFont(ws.getCell(r, 1), { bold: true, size: 9, color: C.gold });
  applyFill(ws.getCell(r, 1), "FFF8E7");
  ws.getCell(r, 1).border = border("thin");
  ws.mergeCells(r, 1, r, 2);

  ws.getCell(r, 3).value = sciGrade !== null ? gradeBar(sciGrade) : "";
  applyFont(ws.getCell(r, 3), { size: 8, color: C.gold });
  applyFill(ws.getCell(r, 3), "FFF8E7");
  ws.getCell(r, 3).border = border("thin");

  ws.getCell(r, 4).value = sciGrade !== null ? `${sciGrade.toFixed(2).replace(".", ",")} /20` : "—";
  applyFont(ws.getCell(r, 4), { bold: true, size: 10, color: C.gold });
  applyFill(ws.getCell(r, 4), "FFF8E7");
  ws.getCell(r, 4).alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell(r, 4).border = border("thin");
  ws.getRow(r).height = 17;
  r++;

  // Oral (note réelle)
  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), "F0F4FF");
  ws.getCell(r, 1).value = "Oral de soutenance  ★ NOTE RÉELLE";
  applyFont(ws.getCell(r, 1), { bold: true, size: 10, color: C.subHeaderBg });
  applyFill(ws.getCell(r, 1), "F0F4FF");
  ws.getCell(r, 1).border = border("thin");
  ws.mergeCells(r, 1, r, 2);
  ws.getCell(r, 3).value = simulation.oral !== undefined ? gradeBar(simulation.oral) : "";
  applyFont(ws.getCell(r, 3), { size: 8, color: C.subHeaderBg });
  applyFill(ws.getCell(r, 3), "F0F4FF");
  ws.getCell(r, 3).border = border("thin");
  ws.getCell(r, 4).value = simulation.oral !== undefined ? `${simulation.oral.toFixed(2).replace(".", ",")} /20` : "—";
  applyFont(ws.getCell(r, 4), { bold: true, size: 11, color: C.subHeaderBg });
  applyFill(ws.getCell(r, 4), "F0F4FF");
  ws.getCell(r, 4).alignment = { horizontal: "center", vertical: "middle" };
  ws.getCell(r, 4).border = border("thin");
  ws.getRow(r).height = 18;
  r++;

  // Moyenne terminales
  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), C.summaryBg);
  ws.getCell(r, 1).value = "Moyenne épreuves terminales";
  applyFont(ws.getCell(r, 1), { bold: true, size: 10, color: "1E3A5F" });
  ws.getCell(r, 1).border = borderStrong();
  ws.mergeCells(r, 1, r, 2);
  ws.getCell(r, 3).value = result.terminalExamAverage !== null
    ? `${result.terminalExamAverage.toFixed(2).replace(".", ",")} / 20` : "—";
  applyFont(ws.getCell(r, 3), { bold: true, size: 13, color: gradeColor(result.terminalExamAverage) });
  applyFill(ws.getCell(r, 3), C.summaryBg);
  ws.getCell(r, 3).alignment = { horizontal: "center", vertical: "middle" };
  ws.mergeCells(r, 3, r, 4);
  ws.getCell(r, 3).border = borderStrong();
  ws.getRow(r).height = 22;
  r++;
  r++;

  // ── Résultat ─────────────────────────────────────────────────────────────────
  sectionHeader("RÉSULTAT PROJETÉ");

  const resultBg = result.status === "admis" ? C.admisBg : result.status === "non_admis" ? C.nonAdmisBg : C.altRow;
  const resultColor = result.status === "admis" ? C.admis : result.status === "non_admis" ? C.nonAdmis : C.mention_sans;
  const resultLabel = result.status === "admis" ? "✓  ADMIS" : result.status === "non_admis" ? "✗  NON ADMIS" : "Simulation incomplète";

  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), resultBg);
  ws.getCell(r, 1).value = "Statut";
  applyFont(ws.getCell(r, 1), { size: 10, color: resultColor });
  ws.getCell(r, 1).border = border("thin");
  ws.getCell(r, 2).value = resultLabel;
  applyFont(ws.getCell(r, 2), { bold: true, size: 12, color: resultColor });
  applyFill(ws.getCell(r, 2), resultBg);
  ws.getCell(r, 2).alignment = { horizontal: "left", vertical: "middle" };
  ws.getCell(r, 2).border = border("thin");
  ws.mergeCells(r, 2, r, 4);
  ws.getRow(r).height = 22;
  r++;

  const mentionBg = result.mention ? C.summaryBg : C.altRow;
  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), mentionBg);
  ws.getCell(r, 1).value = "Mention";
  applyFont(ws.getCell(r, 1), { size: 10, color: "1E3A5F" });
  ws.getCell(r, 1).border = border("thin");
  ws.getCell(r, 2).value = result.mention ?? "Non attribuée";
  applyFont(ws.getCell(r, 2), { bold: !!result.mention, size: 11, color: mentionColor(result.mention) });
  applyFill(ws.getCell(r, 2), mentionBg);
  ws.getCell(r, 2).alignment = { horizontal: "left", vertical: "middle" };
  ws.getCell(r, 2).border = border("thin");
  ws.mergeCells(r, 2, r, 4);
  ws.getRow(r).height = 20;
  r++;

  // Moyenne finale — grande
  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), resultBg);
  ws.getCell(r, 1).value = "MOYENNE FINALE";
  applyFont(ws.getCell(r, 1), { bold: true, size: 11, color: resultColor });
  ws.getCell(r, 1).border = borderStrong();
  ws.mergeCells(r, 1, r, 2);
  ws.getCell(r, 1).alignment = { horizontal: "right", vertical: "middle" };
  ws.getCell(r, 3).value = result.finalAverage !== null
    ? `${result.finalAverage.toFixed(2).replace(".", ",")} / 20` : "—";
  applyFont(ws.getCell(r, 3), { bold: true, size: 16, color: resultColor });
  applyFill(ws.getCell(r, 3), resultBg);
  ws.getCell(r, 3).alignment = { horizontal: "center", vertical: "middle" };
  ws.mergeCells(r, 3, r, 4);
  ws.getCell(r, 3).border = borderStrong();
  ws.getRow(r).height = 28;
  r++;
  r++;

  // ── Objectifs ────────────────────────────────────────────────────────────────
  sectionHeader("OBJECTIFS — MOYENNE TERMINALE MINIMALE REQUISE");

  // En-tête sub
  ["Objectif", "Seuil", "Moy. terminale nécessaire", "Faisabilité"].forEach((h, i) => {
    const cell = ws.getCell(r, i + 1);
    cell.value = h;
    applyFont(cell, { bold: true, size: 9, color: "2E4A6E" });
    applyFill(cell, C.summaryBg);
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = border("thin");
  });
  ws.getRow(r).height = 16;
  r++;

  TARGET_THRESHOLDS.forEach((target, i) => {
    const required = calculateRequiredTerminalAverage(result.continuousAssessmentAverage, target.value);
    const bg = i % 2 === 0 ? C.white : C.altRow;

    let feasibility: string;
    let feasColor: string;
    if (required === null) {
      feasibility = "Non calculable";
      feasColor = C.mention_sans;
    } else if (required <= 0) {
      feasibility = "✓ Déjà acquis";
      feasColor = C.admis;
    } else if (required > 20) {
      feasibility = "✗ Impossible";
      feasColor = C.nonAdmis;
    } else if (required >= 18) {
      feasibility = "⚠ Très difficile";
      feasColor = C.nonAdmis;
    } else if (required >= 15) {
      feasibility = "△ Ambitieux";
      feasColor = C.gold;
    } else {
      feasibility = "✓ Atteignable";
      feasColor = C.mention_ab;
    }

    set(r, 1, target.label, { bg });
    ws.getCell(r, 1).border = border("hair");
    set(r, 2, `${target.value.toFixed(0)} /20`, { align: "center", bold: true, color: gradeColor(target.value), bg });
    ws.getCell(r, 2).border = border("hair");
    set(r, 3, required !== null && required > 0 && required <= 20
      ? `${required.toFixed(2).replace(".", ",")} /20`
      : required !== null && required <= 0 ? "—" : "—",
      { align: "center", bold: true, color: required !== null ? gradeColor(Math.min(required, 20)) : C.mention_sans, bg });
    ws.getCell(r, 3).border = border("hair");
    set(r, 4, feasibility, { align: "center", bold: true, color: feasColor, bg });
    ws.getCell(r, 4).border = border("hair");
    ws.getRow(r).height = 16;
    r++;
  });

  // Pied de fiche
  r++;
  for (let c = 1; c <= 4; c++) applyFill(ws.getCell(r, c), C.headerBg);
  ws.getCell(r, 1).value = `Simulation DNB 2026 — Document généré par le simulateur de résultats le ${exportedAt}`;
  applyFont(ws.getCell(r, 1), { size: 8, color: "A8C4E0" });
  merge(r, 1, 4);
  ws.getCell(r, 1).alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(r).height = 14;

  // Export
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `simulation-dnb-2026-${student.lastName}-${student.firstName}.xlsx`
    .replaceAll(" ", "-")
    .replaceAll(/[^a-zA-Z0-9\-_.]/g, "");
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function exportExcel(
  students: Student[],
  simulations: Record<string, ExamSimulation>,
) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Simulateur DNB 2026";
  wb.created = new Date();
  wb.modified = new Date();
  wb.properties.date1904 = false;

  const exportedAt = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const classes = Array.from(new Set(students.map((s) => s.className))).sort();

  const allRows = students.map((student) => ({
    student,
    simulation: simulations[student.id] ?? {},
  }));

  buildSheet(wb, "Toutes classes", allRows, exportedAt);

  for (const cls of classes) {
    const classRows = allRows.filter(({ student }) => student.className === cls);
    buildSheet(wb, cls, classRows, exportedAt);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `simulation-dnb-2026-${new Date().toLocaleDateString("fr-FR").replaceAll("/", "-")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

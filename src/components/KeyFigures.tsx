import { formatNumber } from "@/lib/format";

type KeyFiguresProps = {
  totalStudents: number;
  admittedStudents: number;
  cohortAverage: number | null;
  mentionBreakdown: Record<string, number>;
};

export function KeyFigures({
  totalStudents,
  admittedStudents,
  cohortAverage,
  mentionBreakdown,
}: KeyFiguresProps) {
  const mentionCount = Object.values(mentionBreakdown).reduce((sum, n) => sum + n, 0);
  const admissionRate =
    totalStudents > 0 ? Math.round((admittedStudents / totalStudents) * 100) : 0;

  const figures = [
    { value: String(totalStudents), label: "Candidats" },
    { value: String(admittedStudents), label: "Admis projetés", note: `${admissionRate} %` },
    { value: formatNumber(cohortAverage), label: "Moyenne cohorte", note: "/ 20" },
    { value: String(mentionCount), label: "Mentions" },
  ];

  const orderedMentions = Object.entries(mentionBreakdown).filter(([, n]) => n > 0);

  return (
    <section className="border-y border-rule">
      <div className="grid grid-cols-2 divide-x divide-rule sm:grid-cols-4">
        {figures.map((figure) => (
          <div key={figure.label} className="px-5 py-5 first:pl-0">
            <p className="font-serif text-3xl font-semibold leading-none text-ink tnum">
              {figure.value}
              {figure.note ? (
                <span className="ml-1.5 align-baseline text-sm font-normal text-ink-faint">
                  {figure.note}
                </span>
              ) : null}
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
              {figure.label}
            </p>
          </div>
        ))}
      </div>
      {orderedMentions.length > 0 ? (
        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-rule px-0 py-3 text-sm text-ink-soft">
          {orderedMentions.map(([mention, count]) => (
            <span key={mention}>
              {mention} <strong className="text-ink tnum">{count}</strong>
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

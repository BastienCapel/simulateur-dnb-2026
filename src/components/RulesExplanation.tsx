export function RulesExplanation() {
  return (
    <details className="group border-b border-rule pb-3 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 py-1 font-medium text-ink-soft transition-colors hover:text-ink">
        <span className="text-ink-faint transition-transform group-open:rotate-90">›</span>
        Règles de calcul appliquées
      </summary>
      <div className="mt-2 max-w-3xl space-y-2 pl-5 leading-6 text-ink-soft">
        <p>
          La moyenne finale combine le contrôle continu (40 %) et les épreuves
          terminales (60 %). Le contrôle continu est la moyenne arithmétique simple
          des disciplines obligatoires de 3e, toutes au même poids.
        </p>
        <p>
          Les épreuves terminales suivent les coefficients officiels : français 2,
          mathématiques 2, histoire-géographie 1,5, EMC 0,5, sciences 2 et oral 2.
          Le diplôme est obtenu à partir de 10/20 ; les mentions à 12, 14 et 16.
        </p>
      </div>
    </details>
  );
}

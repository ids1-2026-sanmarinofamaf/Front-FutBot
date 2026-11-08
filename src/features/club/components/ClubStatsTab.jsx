export function ClubStatsTab({ statistics }) {
  const sections = [
    {
      title: 'Rendimiento',
      stats: [
        ['Puntos totales', statistics.total_points],
        ['Partidos jugados', statistics.matches_played],
        ['Partidos ganados', statistics.matches_won],
        ['Partidos empatados', statistics.matches_drawn],
        ['Partidos perdidos', statistics.matches_lost],
      ],
    },
    {
      title: 'Goles',
      stats: [
        ['Goles a favor', statistics.goals_for],
        ['Goles en contra', statistics.goals_against],
      ],
    },
    {
      title: 'Ligas',
      stats: [
        ['Ligas jugadas', statistics.leagues_played],
        ['Ligas ganadas', statistics.leagues_won],
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-6 text-slate-100">
      <h2 className="text-xl font-bold">Estadísticas del club</h2>

      {sections.map(({ title, stats }) => (
        <section key={title} className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-slate-300">
            {title}
          </h3>

          <ul className="rounded-xl border border-slate-700 bg-slate-800 divide-y divide-slate-700">
            {stats.map(([label, value]) => (
              <li
                key={label}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm text-slate-300">
                  {label}
                </span>

                <span className="text-lg font-bold text-blue-400">
                  {value}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
import { useMemo } from "react"

export default function TablaTab({ standings = [] }) {
  const sorted = useMemo(
    () =>
      [...standings].sort(
        (a, b) =>
          b.points - a.points ||
          b.goal_difference - a.goal_difference ||
          b.goals_for - a.goals_for
      ),
    [standings]
  )

  return (
    <div className="max-h-[32rem] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900">
      <table className="w-full text-left text-slate-100">

        <thead className="sticky top-0 bg-slate-800 text-sm text-slate-400">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-3 py-3 text-center text-emerald-400">PTS</th>
            <th className="px-3 py-3 text-center">PJ</th>
            <th className="px-3 py-3 text-center">PG</th>
            <th className="px-3 py-3 text-center">PE</th>
            <th className="px-3 py-3 text-center">PP</th>
            <th className="px-3 py-3 text-center">GF</th>
            <th className="px-3 py-3 text-center">GC</th>
            <th className="px-3 py-3 text-center">DG</th>
          </tr>
        </thead>

        <tbody>
          {sorted.map((standing, index) => (
            <tr
              key={standing.club_id}
              className="border-t border-slate-700 hover:bg-slate-800 transition-colors"
            >
              <td className="px-4 py-3 text-slate-400">{index + 1}</td>
              <td className="px-4 py-3 font-bold">{standing.name}</td>
              <td className="px-3 py-3 text-center font-bold text-emerald-400">{standing.points}</td>
              <td className="px-3 py-3 text-center">{standing.matches_played}</td>
              <td className="px-3 py-3 text-center">{standing.matches_won}</td>
              <td className="px-3 py-3 text-center">{standing.matches_drawn}</td>
              <td className="px-3 py-3 text-center">{standing.matches_lost}</td>
              <td className="px-3 py-3 text-center">{standing.goals_for}</td>
              <td className="px-3 py-3 text-center">{standing.goals_against}</td>
              <td className="px-3 py-3 text-center">{standing.goal_difference}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
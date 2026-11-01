import { useMemo, useState } from "react"

function FixtureCard({ match }) {

  //Constantes para definir goles de cada equipo
  const localGoals = 0
  const visitorGoals = 0

  return (
    <div className="h-full p-4 bg-slate-800 border border-slate-700 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-lg font-bold text-slate-100">{match.local.name}</span>
        <span className="text-lg font-bold text-slate-100">({localGoals})</span>
        <span className="text-lg font-medium text-slate-400">vs</span>
        <span className="text-lg font-bold text-slate-100">({visitorGoals})</span>
        <span className="text-lg font-bold text-slate-100">{match.visitante.name}</span>
      </div>

      {/* <span className="text-sm font-medium text-slate-300">Partido #{mID}</span> */}
      <button disabled={match.state !== "JUGANDO"}>Unirse</button>
    </div>
  )
}

/**
 * Función para agrupar los partidos del fixture segun su round
 * @param {*} fixture 
 * @returns Lista de tuplas (round, bloques (ie. partidos con mismo round))
 */
function groupByRound(fixture) {
  const blocks = [];
  for (const match of fixture) {
    let block = blocks.find((b) => b.round === match.round);
    if (!block) {
      block = { round: match.round, matches: [] };
      blocks.push(block);
    }
    block.matches.push(match);
  }
  return blocks;
}

/**
 * Forma los bloques con sus respectivos partidos dentro
 * @param {*} fixture: datos de todos los partidos a jugar en la liga actual ya iniciada 
 * @returns Fixture divido en bloques
 */
function FixtureRounds({ fixture }) {
  // Hook para almacenar lista de partidos agrupador por round
  const blocks = useMemo(() => groupByRound(fixture), [fixture]);

  return (
    <div className="flex flex-col gap-6 overflow-y-auto">
      {blocks.map((block) => (
        <section
          key={block.round}
          className="p-4 bg-slate-900 border border-slate-700 rounded-xl flex flex-col gap-3"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100">Ronda {block.round}</h2>
            {/* <span className="px-2 py-0.5 text-sm font-medium bg-emerald-600 text-white rounded">
            En juego
          </span> */}
          </div>

          <div className="flex flex-col gap-3">
            {block.matches.map((match) => (
              <FixtureCard key={match.match_id} match={match} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * Componente general para el fixture, integra toda la lógica y subcomponentes necesarios
 * @param {*} rawFixture: fixture recibido desde el websocket, sin modificaciones
 * @param actualRound: round actual en ejecución 
 * @returns Componente FixtureTab para lobby de liga
 */
export default function FixtureTab({ rawFixture, actualRound }) {


  return (<>
    <FixtureRounds fixture={rawFixture} />
  </>)
}
import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

/**
 * Crea la tarjeta de un partido perteneciente al fixture. Si el partido se está jugando habilita botón para unirse a verlo.
 * @param {*} match: datos partido en juego 
 * @param matchsInGame: Lista de partidos jugandose, si no lo recibe se utiliza una lista vacía []
 * @param resultMatch: datos del partido si fue finalizado, sino se recibe {}
 * @returns 
 */
function FixtureCard({ match, matchsInGame = [], resultMatch }) {

  //Constantes para definir goles de cada equipo
  const localGoals = 0
  const visitorGoals = 0
  //Constante para definir si el match está en juego
  const isFinished = match.state === "FINALIZADO"
  const inGame = !isFinished && (matchsInGame.includes(match.match_id) || match.state === "JUGANDO")
  //Constante y Hook para navegación
  const { id, leagueName } = useParams();
  const navigate = useNavigate()

  return (
    <div className="h-full p-4 bg-slate-800 border border-slate-700 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 shadow-sm">
      <div className="flex flex-1 flex-wrap items-center justify-left gap-x-6 gap-y-2">
        <span className="text-6xl font-bold text-slate-100">{match.local.name}</span>
        {isFinished && <span className="text-4xl font-bold text-slate-100">({resultMatch?.score?.local ?? match?.score?.local ?? 0})</span>}
        <span className="text-4xl font-medium text-slate-400">vs</span>
        {isFinished && <span className="text-4xl font-bold text-slate-100">({resultMatch?.score?.visitante ?? match?.score?.visitante ?? 0})</span>}
        <span className="text-6xl font-bold text-slate-100">{match.visitante.name}</span>

        {inGame && (
          <span className="px-2 py-0.5 text-sm font-medium bg-emerald-600 text-white rounded">
            JUGANDO
          </span>
        )}

        {match.state === "FINALIZADO" && (
          <span className="px-2 py-0.5 text-sm font-medium bg-emerald-600 text-white rounded">
            FINALIZADO
          </span>
        )

        }

      </div>
      
      <button
        disabled={!inGame}
        onClick={() => { navigate(`/matches/${match.match_id}`, { state: { from: `/league/${id}/${leagueName}` } }) }}
        className="px-10 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-semibold transition-colors shadow-md disabled:bg-gray-500
                  disabled:border-gray-500
                  disabled:text-gray-300
                  disabled:hover:bg-gray-500
                  disabled:hover:text-gray-300
                  disabled:active:text-gray-300
                  disabled:focus:ring-0
                  disabled:cursor-not-allowed">
        Ver partido
      </button>
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
 * Forma los bloques con sus respectivos partidos dentro, agrega etiqueta "en juego" al round actual en ejecución
 * @param {*} fixture: datos de todos los partidos a jugar en la liga actual ya iniciada 
 * @param actualRound: entero que indica round en juego actualmente
 * @param matchIDs: lista de IDs de matchs en juego
 * @param resultsMatchs: lista de partidos finalizados, mas su resultado
 * @returns Fixture divido en bloques
 */
function FixtureRounds({ fixture, actualRound, matchIDs, resultsMatchs = [] }) {
  // Hook para almacenar lista de partidos agrupados por round
  const blocks = useMemo(() => groupByRound(fixture ?? []), [fixture])

  return (
    <div className="flex flex-col gap-6 overflow-y-auto">
      {blocks.map((block) => {
        const isCurrent = block.round === actualRound

        return (
          <section
            key={block.round}
            className={`p-4 rounded-xl flex flex-col gap-3 border ${isCurrent
              ? "bg-slate-800 border-emerald-500 ring-2 ring-emerald-500/40"
              : "bg-slate-900 border-slate-700"
              }`}
          >
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-100">Ronda {block.round}</h2>
              {isCurrent && (
                <span className="px-2 py-0.5 text-sm font-medium bg-emerald-600 text-white rounded">
                  En juego
                </span>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {block.matches.map((match) => {

                const result = resultsMatchs.find((r) => r.match_id === match.match_id) ?? {}

                return <FixtureCard key={match.match_id} match={match} matchsInGame={matchIDs} resultMatch={result} />
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/**
 * Componente general para el fixture, integra toda la lógica y subcomponentes necesarios
 * @param {*} rawFixture: fixture recibido desde el websocket, sin modificaciones
 * @param actualRound: round actual en ejecución 
 * @returns Componente FixtureTab para lobby de liga
 */
export default function FixtureTab({ rawFixture, actualRound, roundMatchIDs = [], resultsMatchs = [] }) {

  return (<>
    <FixtureRounds fixture={rawFixture} actualRound={actualRound} matchIDs={roundMatchIDs} resultsMatchs={resultsMatchs} />
  </>)
}
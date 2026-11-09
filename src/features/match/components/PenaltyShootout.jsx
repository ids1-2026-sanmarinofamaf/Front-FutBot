import { useEffect, useState } from "react"
import { submitPenaltyChoice } from "../api.js"

export function PenaltyShootout({
  matchInfo = null,
  penalties = null,
}) {
  const phase = penalties?.phase
  const turn = penalties?.data?.turn
  const initialRemainingSeconds =
    penalties?.data?.remaining_seconds ?? 0
  const [choice, setChoice] = useState(null)

  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(function () {
    if (phase !== "choosing") return

    const deadline =
      performance.now() + initialRemainingSeconds * 1000

    function updateCountdown() {
      const seconds = Math.ceil(
        (deadline - performance.now()) / 1000
      )

      setRemainingSeconds(Math.max(0, seconds))
    }

    updateCountdown()

    const interval = setInterval(updateCountdown, 100)

    return function () {
      clearInterval(interval)
    }
  }, [phase, turn, initialRemainingSeconds])

  const myClubID = matchInfo?.my_club_id ?? null

  const isParticipant =
    myClubID !== null &&
    (
      myClubID === matchInfo?.team_a?.club_id ||
      myClubID === matchInfo?.team_b?.club_id
    )

  const currentChoice = choice?.turn === turn ? choice : null

  const canChoose =
    phase === "choosing" &&
    isParticipant &&
    remainingSeconds > 0 &&
    (!currentChoice || currentChoice.status === "error")

  async function handleChoose(side) {
    if (!canChoose) return

    setChoice({
      turn,
      side,
      status: "sending",
      error: null,
    })

    try {
      await submitPenaltyChoice(matchInfo.match_id, turn, side)

      setChoice(function (previous) {
        if (previous?.turn !== turn) return previous

        return {
          ...previous,
          status: "sent",
        }
      })
    } catch (error) {
      setChoice(function (previous) {
        if (previous?.turn !== turn) return previous

        return {
          ...previous,
          status: error.status === 409 ? "closed" : "error",
          error: error.status === 409
            ? "Este turno ya no admite elecciones."
            : "No se pudo enviar la elección. Vuelve a intentarlo"
        }
      })
    }
  }

  const teams = [
    {
      clubId: matchInfo?.team_a?.club_id ?? null,
      name: matchInfo?.team_a?.club_name ?? "Equipo local",
      results: [null, null, null],
    },
    {
      clubId: matchInfo?.team_b?.club_id ?? null,
      name: matchInfo?.team_b?.club_name ?? "Equipo visitante",
      results: [null, null, null],
    },
  ]

  const penaltyResults = penalties?.results ?? []

  penaltyResults.forEach(function (result) {
    const team = teams.find(function (team) {
      return team.clubId === result.club_id
    })

    if (!team) return

    const kickIndex = Math.floor((result.turn - 1) / 2)

    team.results[kickIndex] = result.is_goal
  })

  const kicker = matchInfo?.players?.find(function (player) {
    return player.player_id === penalties?.data?.kicker
  })

  const isResult = phase === "result"

  const sideOffsets = {
    LEFT: -240,
    CENTER: 0,
    RIGHT: 240,
  }

  const ballOffset = sideOffsets[penalties?.data?.kick_side] ?? 0

  const keeperOffset = sideOffsets[penalties?.data?.save_side] ?? 0

  const keeperAngles = {
    LEFT: -35,
    CENTER: 0,
    RIGHT: 35,
  }

  const keeperRotation = keeperAngles[penalties?.data?.save_side] ?? 0

  return (
    <div className="w-full h-full overflow-hidden bg-sm-green text-white">
      <svg
        viewBox="0 0 1320 800"
        role="group"
        aria-label="Definición por penales: arco y controles para elegir la dirección"
        className="block w-full h-full"
      >
        <defs>
          <pattern id="penalty-goal-net" width={28} height={28} patternUnits="userSpaceOnUse">
            <path
              d="M 0 0 L 28 28 M 28 0 L 0 28"
              fill="none"
              stroke="white"
              strokeWidth={1.2}
            />
          </pattern>
          <path
            id="penalty-choice-arrow"
            d="M 15 50 L 45 27 V 40 H 85 V 60 H 45 V 73 Z"
            fill="currentColor"
          />
        </defs>

        <rect width={1320} height={800} fill="#678C5D" />
        <rect width={1320} height={335} fill="#063343" />

        <g textAnchor="middle" fontSize={66} fontWeight="bold" letterSpacing={3}>
          <rect x={0} y={225} width={440} height={110} fill="#0F172A" />
          <text x={220} y={300} fill="#F2B035">FUTBOT</text>
          <rect x={440} y={225} width={440} height={110} fill="#5BB5D9" />
          <text x={660} y={300} fill="#0F172A">SAN MARINO</text>
          <rect x={880} y={225} width={440} height={110} fill="#0F172A" />
          <text x={1100} y={300} fill="#F2B035">FAMAF</text>
        </g>

        <path
          d="M 0 390 H 1320
             M 160 390 L 20 640 H 1300 L 1160 390"
          fill="none"
          stroke="white"
          strokeWidth={5}
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity={0.8}
        />

        <g>
          <path d="M 310 390 L 350 350 H 970 L 1010 390 Z" fill="black" opacity={0.1} />
          <rect
            x={350}
            y={90}
            width={620}
            height={260}
            fill="url(#penalty-goal-net)"
            fillOpacity={0.35}
            stroke="white"
            strokeOpacity={0.55}
            strokeWidth={4}
          />
          <path
            d="M 310 120 L 350 90 H 970 L 1010 120 Z
               M 310 120 L 350 90 V 350 L 310 390 Z
               M 1010 120 L 970 90 V 350 L 1010 390 Z"
            fill="url(#penalty-goal-net)"
            fillOpacity={0.25}
            stroke="white"
            strokeOpacity={0.5}
            strokeWidth={3}
          />
          <path
            d="M 310 390 V 120 H 1010 V 390"
            fill="none"
            stroke="white"
            strokeWidth={12}
            strokeLinejoin="round"
          />
        </g>

        {/* Goalkeeper */}
        <g transform="translate(160 0)">
          <ellipse
            cx={500}
            cy={388}
            rx={65}
            ry={12}
            fill="black"
            opacity={isResult ? 0 : 0.2}
          />

          <g
            className={
              isResult
                ? "transition-transform duration-500 ease-out motion-reduce:transition-none"
                : ""
            }
            style={{
              transformOrigin: "500px 300px",
              transform: isResult
                ? `translate(${keeperOffset}px, 0px) rotate(${keeperRotation}deg)`
                : "translate(0px, 0px) rotate(0deg)",
            }}
          >
            <path
              d="M 480 338 L 465 383 M 520 338 L 535 383"
              stroke="#0F172A"
              strokeWidth={20}
              strokeLinecap="round"
            />

            <path
              d="M 480 293 L 440 318 M 520 293 L 560 318"
              stroke="#D98E32"
              strokeWidth={20}
              strokeLinecap="round"
            />

            <circle cx={435} cy={321} r={12} fill="white" />
            <circle cx={565} cy={321} r={12} fill="white" />

            <rect
              x={475}
              y={283}
              width={50}
              height={65}
              rx={10}
              fill="#D98E32"
            />

            <text
              x={500}
              y={325}
              textAnchor="middle"
              fill="#0F172A"
              fontSize={30}
              fontWeight="bold"
            >
              1
            </text>

            <circle cx={500} cy={260} r={23} fill="#E8BE95" />
          </g>
        </g>

        <g>
          <ellipse
            cx={660}
            cy={738}
            rx={36}
            ry={8}
            fill="black"
            opacity={isResult ? 0 : 0.2}
          />

          <g
            className={
              isResult
                ? "transition-transform duration-700 ease-in motion-reduce:transition-none"
                : ""
            }
            style={{
              transformOrigin: "660px 710px",
              transform: isResult
                ? `translate(${ballOffset}px, -390px) scale(0.55)`
                : "translate(0px, 0px) scale(1)",
            }}
          >
            <circle
              cx={660}
              cy={710}
              r={28}
              fill="white"
              stroke="#0F172A"
              strokeWidth={2}
            />

            <path
              d="M 660 694 L 674 704 L 669 720 H 651 L 646 704 Z"
              fill="#0F172A"
            />
          </g>
        </g>

        <foreignObject x={495} y={660} width={100} height={100} className="group">
          <button
            type="button"
            aria-label="Elegir izquierda"
            disabled={!canChoose}
            onClick={function () {
              handleChoose("LEFT")
            }}
            className="flex h-full w-full scale-85 items-center justify-center rounded-lg border border-white/30 bg-slate-900/40 text-white transition-transform duration-150 ease-out group-hover:scale-100 motion-reduce:transition-none disabled:cursor-default disabled:opacity-70"
          >
            <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full">
              <use href="#penalty-choice-arrow" />
            </svg>
          </button>
        </foreignObject>

        <foreignObject x={610} y={575} width={100} height={100} className="group">
          <button
            type="button"
            aria-label="Elegir centro"
            disabled={!canChoose}
            onClick={function () {
              handleChoose("CENTER")
            }}
            className="flex h-full w-full scale-85 items-center justify-center rounded-lg border border-white/30 bg-slate-900/40 text-white transition-transform duration-150 ease-out group-hover:scale-100 motion-reduce:transition-none disabled:cursor-default disabled:opacity-70"
          >
            <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full">
              <use href="#penalty-choice-arrow" transform="rotate(90 50 50)" />
            </svg>
          </button>
        </foreignObject>

        <foreignObject x={725} y={660} width={100} height={100} className="group">
          <button
            type="button"
            aria-label="Elegir derecha"
            disabled={!canChoose}
            onClick={function () {
              handleChoose("RIGHT")
            }}
            className="flex h-full w-full scale-85 items-center justify-center rounded-lg border border-white/30 bg-slate-900/40 text-white transition-transform duration-150 ease-out group-hover:scale-100 motion-reduce:transition-none disabled:cursor-default disabled:opacity-70"
          >
            <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full">
              <use href="#penalty-choice-arrow" transform="rotate(180 50 50)" />
            </svg>
          </button>
        </foreignObject>

        {phase === "choosing" && currentChoice && (
          <foreignObject x={260} y={515} width={800} height={55}>
            <p
              role={currentChoice.error ? "alert" : "status"}
              className="text-center text-base text-white"
            >
              {currentChoice.error ?? (
                currentChoice.status === "sending"
                ? "Enviando elección..."
                : "Elección enviada"
              )}
            </p>
          </foreignObject>
        )}

        <text x={660} y={785} textAnchor="middle" fill="white" fontSize={36}>
          {kicker?.name ?? ""}
        </text>

        <foreignObject x={24} y={16} width={470} height={135}>
          <table className="w-full table-fixed border-separate border-spacing-x-0 border-spacing-y-1 text-sm">
            <caption className="sr-only">Marcador de la tanda de penales</caption>
            <tbody>
              {teams.map(function (team, teamIndex) {
                return (
                  <tr key={team.name}>
                    <th
                      scope="row"
                      className={`w-[65%] rounded-l-lg border-y border-l-4 border-slate-700 bg-slate-800 px-3 py-1 text-left font-normal leading-none ${
                        teamIndex === 0 ? "border-l-sm-celeste" : "border-l-sm-amber"
                      }`}
                    >
                      <span className="block truncate" title={team.name}>
                        {team.name}
                      </span>
                    </th>
                    {team.results.map(function (result, kickIndex) {
                      const isActive =
                        penalties?.phase === "choosing" &&
                        team.clubId === penalties.data.club_id &&
                        kickIndex === Math.floor((penalties.data.turn -1) / 2)
                      const status = result === null ? "pendiente" : result ? "gol" : "atajado"

                      return (
                        <td
                          key={kickIndex}
                          className="border-y border-slate-700 bg-slate-800 p-0 last:rounded-r-lg last:border-r last:pr-2"
                          aria-label={`${team.name}, penal ${kickIndex + 1}: ${status}`}
                          aria-current={isActive ? "step" : undefined}
                        >
                          <span
                            aria-hidden="true"
                            className={`mx-auto flex h-9 w-9 items-center justify-center rounded border-2 font-bold ${
                              result === null
                                ? "bg-slate-700 text-slate-200"
                                : result
                                  ? "bg-[#A9C5AD] text-slate-900"
                                  : "bg-[#D7AAAA] text-slate-900"
                            } ${
                              isActive
                                ? "border-sm-gold shadow-[0_0_12px_#F2B03580]"
                                : "border-transparent"
                            }`}
                          >
                            {result !== null && (
                              <svg viewBox="0 0 16 16" className="h-5 w-5" shapeRendering="crispEdges">
                                <path
                                  d={result
                                    ? "M 2 7 H 4 V 9 H 6 V 7 H 8 V 5 H 10 V 3 H 12 V 1 H 14 V 5 H 12 V 7 H 10 V 9 H 8 V 11 H 6 V 13 H 4 V 11 H 2 Z"
                                    : "M 2 2 H 5 V 4 H 7 V 6 H 9 V 4 H 11 V 2 H 14 V 5 H 12 V 7 H 10 V 9 H 12 V 11 H 14 V 14 H 11 V 12 H 9 V 10 H 7 V 12 H 5 V 14 H 2 V 11 H 4 V 9 H 6 V 7 H 4 V 5 H 2 Z"}
                                  fill="currentColor"
                                />
                              </svg>
                            )}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </foreignObject>

        {phase === "choosing" && (
          <g
            role="img"
            aria-label={`Tiempo para elegir: ${remainingSeconds} segundos`}
            textAnchor="middle"
            fill={remainingSeconds <= 2 ? "#F87171" : "#F2F2F2"}
          >
            <text
              x={1170}
              y={135}
              fontSize={140}
              fontWeight="bold"
            >
              {String(remainingSeconds).padStart(2, "0")}
            </text>
          </g>
        )}

        {phase === "intro" && (
          <g
            role="status"
            aria-label="Comienza la tanda de penales"
          >
            <rect
              width={1320}
              height={800}
              fill="#063343"
              opacity={0.94}
            />

            <text
              x={660}
              y={380}
              textAnchor="middle"
              fill="#F2B035"
              fontSize={110}
              fontWeight="bold"
            >
              ¡PENALES!
            </text>

            <text
              x={660}
              y={450}
              textAnchor="middle"
              fill="#f2f2f2"
              fontSize={40}
            >
              Prepárate para patear o atajar
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

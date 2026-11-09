import { useEffect, useState } from "react"
import { submitPenaltyChoice } from "../api.js"

/**
 * Displays shootout metadata, history and the current phase supplied by MatchPage.
 * Phases: intro, waiting (restored history), choosing, result and finished.
 * The server controls progression, results and the winner; this component
 * manages input feedback, the displayed countdown and visual animations.
 *
 * @param {Object} props
 * @param {Object|null} props.matchInfo Club/player metadata and the viewer's club ID.
 * @param {Object|null} props.penalties Current phase, event data and resolved penalties.
 */
export function PenaltyShootout({
  matchInfo = null,
  penalties = null,
}) {
  const phase = penalties?.phase
  const turn = penalties?.data?.turn
  const initialRemainingSeconds =
    penalties?.data?.remaining_seconds ?? 0
  // Local UI state: submitted choice, displayed time and coin animation completion.
  const [choice, setChoice] = useState(null)

  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const [coinFinished, setCoinFinished] = useState(false)

  // Restart for each choosing turn; cleanup stops the interval on phase changes or unmount.
  useEffect(function () {
    if (phase !== "choosing") return

    // Use elapsed time instead of counting interval callbacks to avoid timer drift.
    // This countdown is visual; the server enforces the actual submission deadline.
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

  // Identify participants and their current role; other viewers remain spectators.
  const myClubID = matchInfo?.my_club_id ?? null

  const isParticipant =
    myClubID !== null &&
    (
      myClubID === matchInfo?.team_a?.club_id ||
      myClubID === matchInfo?.team_b?.club_id
    )

  const isSaving =
    phase === "choosing" &&
    isParticipant &&
    myClubID !== penalties?.data?.club_id

  // Feedback belongs to its original turn and must not lock choices in later turns.
  const currentChoice = choice?.turn === turn ? choice : null

  // Allow input while time remains; only a recoverable request error allows a retry.
  const canChoose =
    phase === "choosing" &&
    isParticipant &&
    remainingSeconds > 0 &&
    (!currentChoice || currentChoice.status === "error")

  // Both roles submit the same direction; the server determines who kicks and who saves.
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
        // A late response must not overwrite a choice made in a newer turn.
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
          // HTTP 409 closes this choice locally; other errors let the user retry.
          status: error.status === 409 ? "closed" : "error",
          error: error.status === 409
            ? "Este turno ya no admite elecciones."
            : "No se pudo enviar la elección. Vuelve a intentarlo"
        }
      })
    }
  }

  // Rebuild the scoreboard from history on every render, including after reconnection.
  // Each club has three cells: null = pending, true = goal, false = saved.
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

  const kickingTeam = teams.find(function (team) {
    return team.clubId === penalties?.data?.club_id
  })

  const turnLabel = isParticipant
    ? (isSaving ? "TE TOCA ATAJAR" : "TE TOCA PATEAR")
    : `Patea ${kickingTeam?.name ?? ""}`

  const penaltyResults = penalties?.results ?? []

  penaltyResults.forEach(function (result) {
    const team = teams.find(function (team) {
      return team.clubId === result.club_id
    })

    if (!team) return

    // Global turns 1/2 map to cell 0, turns 3/4 to cell 1, and turns 5/6 to cell 2.
    const kickIndex = Math.floor((result.turn - 1) / 2)

    team.results[kickIndex] = result.is_goal
  })

  const kicker = matchInfo?.players?.find(function (player) {
    return player.player_id === penalties?.data?.kicker
  })

  // The winner always comes from the server, including when tied scores require a toss.
  const winner = teams.find(function (team) {
    return team.clubId === penalties?.data?.winner_club_id
  })

  const isCoinToss =
    phase === "finished" &&
    penalties.data.score_club_a ===
    penalties.data.score_club_b

  const isCoinSpinning = isCoinToss && !coinFinished

  // Three full turns show club A; three and a half show club B on the opposite face.
  const coinFinalAngle =
    winner?.clubId === teams[0].clubId ? "1080deg" : "1260deg"

  // Map server directions to SVG animation targets; only a live result animates the scene.
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
      {/* All positions use the 1320 x 800 viewBox; SVG scales the scene to its container. */}
      <svg
        viewBox="0 0 1320 800"
        role="group"
        aria-label="Definición por penales: arco y controles para elegir la dirección"
        className="block w-full h-full"
      >
        {/* Reusable definitions, referenced by the goal net and direction buttons. */}
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

        {/* Pitch and stadium background. Later SVG elements are painted over earlier ones. */}
        <rect width={1320} height={800} fill="#678C5D" />
        <rect width={1320} height={335} fill="#063343" />

        {/* Advertising boards behind the goal. */}
        <g textAnchor="middle" fontSize={66} fontWeight="bold" letterSpacing={3}>
          <rect x={0} y={225} width={440} height={110} fill="#0F172A" />
          <text x={220} y={300} fill="#F2B035">FUTBOT</text>
          <rect x={440} y={225} width={440} height={110} fill="#5BB5D9" />
          <text x={660} y={300} fill="#0F172A">SAN MARINO</text>
          <rect x={880} y={225} width={440} height={110} fill="#0F172A" />
          <text x={1100} y={300} fill="#F2B035">FAMAF</text>
        </g>

        {/* Goal line and penalty area drawn in perspective. */}
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

        {/* Goal structure: ground shadow, rear net, depth panels and front posts. */}
        <g>
          <path d="M 310 390 L 350 350 H 970 L 1010 390 Z" fill="black" opacity={0.1} />
          {/* Rear net: the repeating diamond pattern remains translucent. */}
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
          {/* Top and side panels connect the rear net to the front of the goal. */}
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
          {/* Thick front posts and crossbar. */}
          <path
            d="M 310 390 V 120 H 1010 V 390"
            fill="none"
            stroke="white"
            strokeWidth={12}
            strokeLinejoin="round"
          />
        </g>

        {/* Goalkeeper: translate the local center x=500 to the goal center x=660. */}
        {/* The ground shadow stays fixed and is hidden during the dive. */}
        <g transform="translate(160 0)">
          <ellipse
            cx={500}
            cy={388}
            rx={65}
            ry={12}
            fill="black"
            opacity={isResult ? 0 : 0.2}
          />

          {/* Animate the whole body together toward the server's save direction. */}
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
            {/* Legs. */}
            <path
              d="M 480 338 L 465 383 M 520 338 L 535 383"
              stroke="#0F172A"
              strokeWidth={20}
              strokeLinecap="round"
            />

            {/* Arms and gloves. */}
            <path
              d="M 480 293 L 440 318 M 520 293 L 560 318"
              stroke="#D98E32"
              strokeWidth={20}
              strokeLinecap="round"
            />

            <circle cx={435} cy={321} r={12} fill="white" />
            <circle cx={565} cy={321} r={12} fill="white" />

            {/* Shirt and number. */}
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

            {/* Head. */}
            <circle cx={500} cy={260} r={23} fill="#E8BE95" />
          </g>
        </g>

        {/* Ball and its ground shadow. */}
        <g>
          <ellipse
            cx={660}
            cy={738}
            rx={36}
            ry={8}
            fill="black"
            opacity={isResult ? 0 : 0.2}
          />

          {/* Move toward the kick direction and shrink the ball to suggest distance. */}
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

            {/* Dark panel over the white ball. */}
            <path
              d="M 660 694 L 674 704 L 669 720 H 651 L 646 704 Z"
              fill="#0F172A"
            />
          </g>
        </g>

        {/* Participants only: controls surround the ball when kicking and the keeper when saving. */}
        {isParticipant && (
          <g>
          {/* Left direction. foreignObject embeds an HTML button inside the SVG scene. */}
          <foreignObject
            x={isSaving ? 470 : 495}
            y={isSaving ? 270 : 660}
            width={100}
            height={100}
            className="group"
          >
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

          {/* Center direction: an arrow for kicking, a circle for staying in place when saving. */}
          <foreignObject
            x={610}
            y={isSaving ? 130 : 575}
            width={100}
            height={100}
            className="group"
          >
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
                {isSaving ? (
                  <circle
                    cx={50}
                    cy={50}
                    r={18}
                    fill="currentColor"
                  />
                ) : (
                  <use
                    href="#penalty-choice-arrow"
                    transform="rotate(90 50 50)"
                  />
                )}
              </svg>
            </button>
          </foreignObject>

          {/* Right direction. */}
          <foreignObject
            x={isSaving ? 750 : 725}
            y={isSaving ? 270 : 660}
            width={100}
            height={100}
            className="group"
          >
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
          </g>
        )}

        {/* Role prompt for participants, or the kicking club's name for spectators. */}
        {phase === "choosing" && (
          <text
            x={660}
            y={480}
            textAnchor="middle"
            fill="#F2B035"
            fontSize={48}
            fontWeight="bold"
          >
            {turnLabel}
          </text>
        )}

        {/* Submission feedback is separate from the penalty outcome received over WebSocket. */}
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

        {/* Name of the current kicker supplied by the match metadata. */}
        <text x={660} y={785} textAnchor="middle" fill="white" fontSize={36}>
          {kicker?.name ?? ""}
        </text>

        {/* Scoreboard: three results per club, with a highlight on the current kick. */}
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

        {/* Display seconds with two digits; the final two seconds and zero use red. */}
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

        {/* Intro overlay; the next server event determines when the choosing phase begins. */}
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

        {/* Final overlay; a tied shootout reveals its server-selected winner after the coin flip. */}
        {phase === "finished" && (
          <g role="status" aria-label="Resultado de la tanda de penales">
            <rect
              width={1320}
              height={800}
              fill="#063343"
              opacity={0.94}
            />

            <foreignObject x={110} y={100} width={1100} height={600}>
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <p className="text-4xl text-sm-gold">
                  {isCoinSpinning
                    ? "DEFINIENDO POR SORTEO..."
                    : "¡PARTIDO FINALIZADO!"}
                </p>

                {/* CSS flips between club names; animation completion reveals the winner. */}
                {isCoinToss && (
                  <div className="penalty-coin-scene">
                    <div
                      className="penalty-coin"
                      role="img"
                      aria-label="Moneda del sorteo"
                      style={{ "--coin-final-angle": coinFinalAngle }}
                      onAnimationEnd={() => setCoinFinished(true)}
                    >
                      {teams.map(function (team, index) {
                        return (
                          <div
                            key={team.clubId}
                            className={
                              "penalty-coin-face " +
                              (index === 0
                                ? "penalty-coin-front"
                                : "penalty-coin-back")
                            }
                          >
                            <span>{team.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {!isCoinSpinning && (
                  <p className="max-w-full break-words text-3xl text-white">
                    Ganador: {winner?.name ?? "Equipo desconocido"}
                  </p>
                )}

                <p className="text-3xl text-white">
                  Penales: {penalties.data.score_club_a}
                  {" - "}
                  {penalties.data.score_club_b}
                </p>

                {isCoinToss && !isCoinSpinning && (
                  <p className="text-xl text-sm-gold">
                    VICTORIA POR SORTEO
                  </p>
                )}
              </div>
            </foreignObject>
          </g>
        )}
      </svg>
    </div>
  )
}

import { useEffect, useRef, useState } from "react"

const FIELD_WIDTH = 40
const FIELD_HEIGHT = 20
const BALL_RADIUS = 0.1
const GOAL_TOP_Y = 8.5
const GOAL_BOTTOM_Y = 11.5
const NET_ENTRY_OFFSET = 0.2

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function interpolateAxisWithBounce(pos0, pos1, speed0, speed1, minWall, maxWall, progress) {
  if (
    typeof speed0 === "number" &&
    typeof speed1 === "number"
  ) {
    // Rebote en borde izquierdo / superior
    if (speed0 < 0 && speed1 > 0 && pos0 < minWall + 3.5 && pos1 < minWall + 3.5) {
      const d0 = Math.max(0, pos0 - minWall)
      const d1 = Math.max(0, pos1 - minWall)
      const total = d0 + d1
      const tBounce = total > 0 ? clamp(d0 / total, 0.1, 0.9) : 0.5

      if (progress <= tBounce) {
        return pos0 + (minWall - pos0) * (progress / tBounce)
      }
      return minWall + (pos1 - minWall) * ((progress - tBounce) / (1 - tBounce))
    }

    // Rebote en borde derecho / inferior
    if (speed0 > 0 && speed1 < 0 && pos0 > maxWall - 3.5 && pos1 > maxWall - 3.5) {
      const d0 = Math.max(0, maxWall - pos0)
      const d1 = Math.max(0, maxWall - pos1)
      const total = d0 + d1
      const tBounce = total > 0 ? clamp(d0 / total, 0.1, 0.9) : 0.5

      if (progress <= tBounce) {
        return pos0 + (maxWall - pos0) * (progress / tBounce)
      }
      return maxWall + (pos1 - maxWall) * ((progress - tBounce) / (1 - tBounce))
    }
  }

  return pos0 + (pos1 - pos0) * progress
}

export function useAnimatedMatchState(estadoPartido) {
  const previousStateRef = useRef(null)
  const targetStateRef = useRef(null)
  const currentStateRef = useRef(null)
  const startTimeRef = useRef(null)

  const [animatedState, setAnimatedState] = useState(null)

  useEffect(function () {
        if (!estadoPartido) {
            return
        }

        const previous = currentStateRef.current

        if (!previous) {
            previousStateRef.current = estadoPartido
            targetStateRef.current = estadoPartido
            currentStateRef.current = estadoPartido
            setAnimatedState(estadoPartido)
            return
        }

        previousStateRef.current = previous
        targetStateRef.current = estadoPartido
        startTimeRef.current = performance.now()

        let animationFrame

        function animate() {
            const previousState = previousStateRef.current
            const target = targetStateRef.current
            const startTime = startTimeRef.current

            if (!previousState || !target || startTime === null) {
            return
            }

            const elapsed = performance.now() - startTime
            const progress = Math.min(elapsed / 100, 1)

            if (progress >= 1) {
            previousStateRef.current = target
            currentStateRef.current = target
            startTimeRef.current = null
            setAnimatedState(target)
            return
            }

            const goalIncremented =
              target.user1_goals > previousState.user1_goals ||
              target.user2_goals > previousState.user2_goals

            const isGoalShot =
              goalIncremented &&
              (previousState.ball.x < 5 || previousState.ball.x > FIELD_WIDTH - 5)

            const isKickoffReset =
              !goalIncremented &&
              target.ball.x === FIELD_WIDTH / 2 &&
              target.ball.y === FIELD_HEIGHT / 2 &&
              target.ball.speed_x === 0 &&
              target.ball.speed_y === 0 &&
              (previousState.ball.x < 5 || previousState.ball.x > FIELD_WIDTH - 5)

            if (isKickoffReset) {
              currentStateRef.current = target
              setAnimatedState(target)
              return
            }

            if (isGoalShot) {
              const goalX =
                previousState.ball.x < FIELD_WIDTH / 2
                  ? -NET_ENTRY_OFFSET
                  : FIELD_WIDTH + NET_ENTRY_OFFSET
              const estimatedGoalY = clamp(
                previousState.ball.y + (previousState.ball.speed_y || 0) * 0.1,
                GOAL_TOP_Y,
                GOAL_BOTTOM_Y
              )

              const ball = {
                ...target.ball,
                x: previousState.ball.x + (goalX - previousState.ball.x) * progress,
                y: previousState.ball.y + (estimatedGoalY - previousState.ball.y) * progress,
              }

              const nextState = {
                ...target,
                players: previousState.players,
                ball,
              }

              currentStateRef.current = nextState
              setAnimatedState(nextState)
              animationFrame = requestAnimationFrame(animate)
              return
            }

            const players = target.players.map(function (targetPlayer) {
            const previousPlayer = previousState.players.find(function (player) {
                return player.player_id === targetPlayer.player_id
            })

            if (!previousPlayer) {
                return targetPlayer
            }

            return {
                ...targetPlayer,
                x: previousPlayer.x + (targetPlayer.x - previousPlayer.x) * progress,
                y: previousPlayer.y + (targetPlayer.y - previousPlayer.y) * progress,
            }
            })

            const ball = {
            ...target.ball,
            x: interpolateAxisWithBounce(
              previousState.ball.x,
              target.ball.x,
              previousState.ball.speed_x,
              target.ball.speed_x,
              BALL_RADIUS,
              FIELD_WIDTH - BALL_RADIUS,
              progress
            ),
            y: interpolateAxisWithBounce(
              previousState.ball.y,
              target.ball.y,
              previousState.ball.speed_y,
              target.ball.speed_y,
              BALL_RADIUS,
              FIELD_HEIGHT - BALL_RADIUS,
              progress
            ),
            }

            const nextState = { ...target, players, ball }

            currentStateRef.current = nextState
            setAnimatedState(nextState)

            animationFrame = requestAnimationFrame(animate)
        }

        animationFrame = requestAnimationFrame(animate)

        return function () {
            cancelAnimationFrame(animationFrame)
        }
    }, [estadoPartido])

  return animatedState
}
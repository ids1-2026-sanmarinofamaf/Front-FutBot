import { useEffect, useRef, useState } from "react"

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
            x: previousState.ball.x + (target.ball.x - previousState.ball.x) * progress,
            y: previousState.ball.y + (target.ball.y - previousState.ball.y) * progress,
            }

            const nextState = { ...target, players, ball }

            currentStateRef.current = nextState
            setAnimatedState(nextState)

            if (progress >= 1) {
            previousStateRef.current = target
            currentStateRef.current = target
            startTimeRef.current = null
            return
            }

            animationFrame = requestAnimationFrame(animate)
        }

        animationFrame = requestAnimationFrame(animate)

        return function () {
            cancelAnimationFrame(animationFrame)
        }
    }, [estadoPartido])

  return animatedState
}
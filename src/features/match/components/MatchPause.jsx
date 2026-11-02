
import { useEffect, useRef, useState } from "react"

const HALFTIME_VIDEO_DURATION = 5000

export function MatchPause({ pausa }) {
  const videoRef = useRef(null)
  const [showVideo, setShowVideo] = useState(false)

  useEffect(function () {
    if (pausa?.pause_type !== "halftime") {
      setShowVideo(false)
      return
    }

    setShowVideo(true)

    const timeout = setTimeout(function () {
      setShowVideo(false)
    }, HALFTIME_VIDEO_DURATION)

    return function () {
      clearTimeout(timeout)
    }
  }, [pausa])

  if (!pausa) {
    return null
  }

  const isHydration = pausa.pause_type === "hydration"
  const isHalftime = pausa.pause_type === "halftime"

  if (!isHydration && !isHalftime) {
    return null
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/90 pointer-events-none">
      {isHydration && (
        <h2 className="text-6xl font-bold text-white">
          COOLING BREAK
        </h2>
      )}

      {isHalftime && (
        <div className="flex flex-col items-center gap-8">
          {showVideo && (
            <video
              ref={videoRef}
              src="../../../../public/assets/propaganda_san_marino.mp4"
              autoPlay
              muted
              playsInline
              className="max-h-[60vh] max-w-[80%] object-contain"
            />
          )}

          <h2 className="text-6xl font-bold text-white">
            ENTRETIEMPO
          </h2>
        </div>
      )}
    </div>
  )
}
